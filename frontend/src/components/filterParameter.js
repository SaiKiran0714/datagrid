// Minimal filter summary with chips and clear-all button
import { Box, Button, Chip } from "@mui/material";

export default function FilterParameter({
  value = [],
  onChange = () => {},
  types = {},
  searchTerm,
  onClearSearch,
}) {
  const inferType = (name) => types[name] || "text";

  const removeAt = (i) => {
    const next = value.filter((_, idx) => idx !== i);
    onChange(next);
  };

  const clearAll = () => onChange([]);

  const prettyField = (name) => String(name).replace(/_/g, " ");
  const formatChipLabel = (f) => {
    const field = prettyField(f.field);
    const t = inferType(f.field);
    const v = f.value;
    const quoted = v !== undefined && v !== "" ? `"${v}"` : undefined;
    switch (f.op) {
      case "contains":
        return `${field} contains ${quoted ?? '""'}`;
      case "notContains":
        return `${field} does not contain ${quoted ?? '""'}`;
      case "equals":
        if (t === "boolean") return `${field} is ${v}`;
        return `${field} equals ${quoted ?? '""'}`;
      case "notEquals":
      case "notEqualsNumber":
        if (t === "boolean") return `${field} is not ${v}`;
        return `${field} does not equal ${quoted ?? '""'}`;
      case "startsWith":
        return `${field} starts with ${quoted ?? '""'}`;
      case "endsWith":
        return `${field} ends with ${quoted ?? '""'}`;
      case "isEmpty":
        return `${field} is empty`;
      case "notEmpty":
        return `${field} is not empty`;
      case "gt":
      case "greaterThan":
        return `${field} greater than ${v ?? ""}`;
      case "lt":
      case "lessThan":
        return `${field} less than ${v ?? ""}`;
      case "in":
        return `${field} in (${(Array.isArray(f.values) ? f.values : []).join(", ")})`;
      default:
        return `${field}`;
    }
  };

  return (
    <Box
      sx={{
        mt: 1,
        // keep height constant whether chips exist or not
        minHeight: 48,
        maxHeight: 48,
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1,
        borderRadius: 1,
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      {/* Chips area with horizontal scroll if overflow */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          flexWrap: "nowrap",
          overflowX: "auto",
          overflowY: "hidden",
          // hide scrollbar in WebKit while keeping scrollability
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "action.hover", borderRadius: 3 },
        }}
      >
        {searchTerm && (
          <Chip
            size="small"
            label={`Search: "${searchTerm}"`}
            color="primary"
            onDelete={onClearSearch}
          />
        )}
        {value.flatMap((f, i) => {
          if (f.op === "in" && Array.isArray(f.values)) {
            return f.values.map((v, j) => (
              <Chip
                key={`${f.field}-${v}-${i}-${j}`}
                size="small"
                label={`${f.field} = "${v}"`}
                onDelete={() => {
                  const rest = f.values.filter((x) => x !== v);
                  const next = [...value];
                  if (rest.length) next[i] = { ...f, values: rest };
                  else next.splice(i, 1);
                  onChange(next);
                }}
              />
            ));
          }
          return [
            <Chip
              key={`${f.field}-${i}`}
              size="small"
              label={formatChipLabel(f)}
              onDelete={() => removeAt(i)}
            />,
          ];
        })}
      </Box>

      {/* Single clear-all button pinned to the right within same container */}
      <Button size="small" onClick={clearAll} disabled={value.length === 0}>
        Clear all
      </Button>
    </Box>
  );
}
