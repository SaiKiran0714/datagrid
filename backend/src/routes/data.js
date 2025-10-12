// src/routes/data.js
import express from "express";
import { pool } from "../lib/db.js";
import { buildQuery } from "../lib/queryBuilder.js";

const router = express.Router();

function parseFilters(raw) {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

router.get("/", async (req, res) => {
  try {
    const params = {
      page: Number(req.query.page ?? 1),
      pageSize: Number(req.query.pageSize ?? 25),
      filters: parseFilters(req.query.filters),
    };

    // Search term
    if (typeof req.query.q === "string" && req.query.q.trim() !== "") {
      params.q = req.query.q;
    }

    // Optional: case sensitivity and field restriction for global search
    if (req.query.caseSensitive === "true" || req.query.caseSensitive === true) {
      params.caseSensitive = true;
    }
    if (req.query.searchFields) {
      const sf = String(req.query.searchFields)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (sf.length) params.searchFields = sf;
    }

    // Sorting
    if (typeof req.query.sortField === "string" && req.query.sortField.trim() !== "") {
      params.sortField = req.query.sortField;
    }
    if (req.query.sortOrder === "asc" || req.query.sortOrder === "desc") {
      params.sortOrder = req.query.sortOrder;
    }

    // Allow fetch-all mode
    if (req.query.all === "true" || req.query.pageSize === "all" || Number(req.query.pageSize) === 0) {
      params.noLimit = true;
    }

    const { main, mainValues, count, countValues } = buildQuery(params);

    const [rows] = await pool.query(main, mainValues);
    const [countRows] = await pool.query(count, countValues);

    const total = countRows[0]?.total ?? 0;
    const data = rows.map((r) => ({
      id: r.id,
      ...(typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload || {}),
    }));

    res.json({
      data,
      total,
      page: params.noLimit ? 1 : (params.page ?? 1),
      pageSize: params.noLimit ? total : (params.pageSize ?? 25),
    });
  } catch (err) {
    console.error("DATA GET ERROR", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Distinct values for a field from JSON payload eg. Brand names : [BMW, Audi, ...]
router.get("/distinct", async (req, res) => {
  try {
    const field = String(req.query.field || "").trim();
    if (!field || /[^A-Za-z0-9_]/.test(field)) {
      return res.status(400).json({ error: "Invalid field" });
    }
    // Use JSON_EXTRACT to pull field and group
    const sql = `
      SELECT DISTINCT JSON_UNQUOTE(JSON_EXTRACT(payload, '$.${field}')) AS val
      FROM records
      WHERE JSON_EXTRACT(payload, '$.${field}') IS NOT NULL
        AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.${field}')) <> ''
      ORDER BY val ASC
    `;
    const [rows] = await pool.query(sql);
    const values = rows.map(r => r.val).filter(v => v !== null && v !== undefined);
    res.json({ field, values });
  } catch (err) {
    console.error("DISTINCT ERROR", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Optional: keep this secondary search endpoint
router.get("/search", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q) return res.status(400).json({ error: "Missing q parameter" });

    const page = Math.max(1, Number(req.query.page ?? 1) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize ?? 25) || 25));
    const offset = (page - 1) * pageSize;

    const like = `%${q}%`;
    const main = `SELECT id, payload FROM records WHERE CAST(payload AS CHAR) COLLATE utf8mb4_0900_ai_ci LIKE ? LIMIT ? OFFSET ?`;
    const count = `SELECT COUNT(*) AS total FROM records WHERE CAST(payload AS CHAR) COLLATE utf8mb4_0900_ai_ci LIKE ?`;

    const [rows] = await pool.query(main, [like, pageSize, offset]);
    const [countRows] = await pool.query(count, [like]);

    const total = countRows[0]?.total ? Number(countRows[0].total) : 0;
    const data = rows.map((r) => ({
      id: r.id,
      ...(typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload || {}),
    }));

    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error("SEARCH ERROR", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Detail
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, payload FROM records WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    const r = rows[0];
    res.json({
      id: r.id,
      ...(typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload || {}),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM records WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
