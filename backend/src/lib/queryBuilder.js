
const SAFE_FIELD = /^[A-Za-z0-9_]+$/;
const J = (k) => `JSON_UNQUOTE(JSON_EXTRACT(payload, '$.${k}'))`;

// choose a CI collation available on your server
const CI = "utf8mb4_0900_ai_ci";          // MySQL 8+
// const CI_FALLBACK = "utf8mb4_general_ci"; // MySQL 5.7
const CI_USE = CI; // or CI_FALLBACK if needed

function fToSQL(f, vals) {
  if (!f || !f.field || !SAFE_FIELD.test(f.field)) return "";
  const col = J(f.field);
  const op = String(f.op || "").trim();

  switch (op) {
    case "contains":     vals.push(`%${f.value ?? ""}%`); return `CAST(${col} AS CHAR) COLLATE ${CI_USE} LIKE ?`;
    case "notContains":  vals.push(`%${f.value ?? ""}%`); return `CAST(${col} AS CHAR) COLLATE ${CI_USE} NOT LIKE ?`;
    case "equals":       vals.push(f.value ?? "");        return `CAST(${col} AS CHAR) COLLATE ${CI_USE} = ?`;
    case "notEquals":    vals.push(f.value ?? "");        return `CAST(${col} AS CHAR) COLLATE ${CI_USE} <> ?`;
    case "startsWith":   vals.push(`${f.value ?? ""}%`);  return `CAST(${col} AS CHAR) COLLATE ${CI_USE} LIKE ?`;
    case "endsWith":     vals.push(`%${f.value ?? ""}`);  return `CAST(${col} AS CHAR) COLLATE ${CI_USE} LIKE ?`;
    case "isEmpty":                                      return `(${col} IS NULL OR ${col} = '')`;
    case "notEmpty":                                     return `NOT (${col} IS NULL OR ${col} = '')`;
    
    case "gt":
    case "greaterThan":  vals.push(f.value ?? "0");       return `CAST(${col} AS DECIMAL(30,10)) > CAST(? AS DECIMAL(30,10))`;
    case "lt":
    case "lessThan":     vals.push(f.value ?? "0");       return `CAST(${col} AS DECIMAL(30,10)) < CAST(? AS DECIMAL(30,10))`;
    case "ne":
    case "notEqualsNumber": vals.push(f.value ?? "0");    return `CAST(${col} AS DECIMAL(30,10)) <> CAST(? AS DECIMAL(30,10))`;

    // multi-select list (text) -> IN (...)
    case "in": {
      const arr = Array.isArray(f.values) ? f.values : (typeof f.value === "string" ? f.value.split(",").map(s=>s.trim()).filter(Boolean) : []);
      if (!arr.length) return "";
      const placeholders = arr.map(() => "?").join(",");
      for (const v of arr) vals.push(v);
      return `CAST(${col} AS CHAR) COLLATE ${CI_USE} IN (${placeholders})`;
    }

    default: return "";
  }
}

  const NUMERIC_FIELDS = new Set([
  "AccelSec", "TopSpeed_KmH", "Range_Km", "Efficiency_WhKm", "FastCharge_KmH", "Seats", "PriceEuro"
]);

export function buildQuery(p = {}) {
  const where = [];
  const vals = [];

  // --- GLOBAL SEARCH ---
  if (p.q && String(p.q).trim()) {
    const q = String(p.q).trim();
    if (Array.isArray(p.searchFields) && p.searchFields.length) {
      // search only selected fields
      const fields = p.searchFields.filter((f) => SAFE_FIELD.test(f));
      if (fields.length) {
        const orParts = [];
        for (const f of fields) {
          if (p.caseSensitive) {
            orParts.push(`${J(f)} LIKE ?`);
            vals.push(`%${q}%`);
          } else {
            orParts.push(`CAST(${J(f)} AS CHAR) COLLATE ${CI_USE} LIKE ?`);
            vals.push(`%${q}%`);
          }
        }
        where.push(`(${orParts.join(" OR ")})`);
      }
    } else {
      // fallback: search entire JSON text
      if (p.caseSensitive) {
        vals.push(`%${q}%`);
        where.push(`CAST(payload AS CHAR) LIKE ?`);
      } else {
        vals.push(`%${q}%`);
        where.push(`CAST(payload AS CHAR) COLLATE ${CI_USE} LIKE ?`);
      }
    }
  }

  // --- COLUMN FILTERS ---
  (p.filters ?? []).forEach((f) => {
    const clause = fToSQL(f, vals);
    if (clause) where.push(clause);
  });

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // --- SORT ---
  const sortField = p.sortField && SAFE_FIELD.test(p.sortField) ? p.sortField : null;

  const DATE_FIELDS = new Set(["Date"]); // Add your date field names here
  const sortSQL = sortField
    ? NUMERIC_FIELDS.has(sortField)
      ? `ORDER BY CAST(${J(sortField)} AS DECIMAL(30,10)) ${p.sortOrder === "desc" ? "DESC" : "ASC"}`
      : DATE_FIELDS.has(sortField)
        ? `ORDER BY STR_TO_DATE(${J(sortField)}, '%m/%d/%y') ${p.sortOrder === "desc" ? "DESC" : "ASC"}`
        : `ORDER BY ${J(sortField)} ${p.sortOrder === "desc" ? "DESC" : "ASC"}`
    : "";

  // --- PAGING ---
  const page = Math.max(1, Number(p.page || 1));
  const pageSize = Math.min(200, Math.max(1, Number(p.pageSize || 25)));
  const offset = (page - 1) * pageSize;
  const noLimit = !!p.noLimit;

  return {
    main: `
      SELECT id, payload
      FROM records
      ${whereSQL}
      ${sortSQL}
      ${noLimit ? "" : "LIMIT ? OFFSET ?"}
    `,
    mainValues: noLimit ? [...vals] : [...vals, pageSize, offset],
    count: `
      SELECT COUNT(*) AS total
      FROM records
      ${whereSQL}
    `,
    countValues: [...vals],
  };
}
