// Minimal filter summary with chips and clear-all button
import { Box, Button, Chip } from "@mui/material";
import useGridStore from "../store/gridStore";

export default function FilterParameter({ types = {} }) {
  // Read/write directly from Zustand store
  const value = useGridStore((state) => state.filters);
  const onChange = useGridStore((state) => state.setFilters);
  const searchTerm = useGridStore((state) => state.q);
  const onClearSearch = useGridStore((state) => state.clearSearch);

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
        mt: { xs: 0.5, sm: 1 },
        mb: { xs: 1, sm: 1.5 },
        // Allow height to grow with content
        minHeight: { xs: 40, sm: 48 },
        display: "flex",
        alignItems: "flex-start",
        gap: { xs: 0.5, sm: 1 },
        px: { xs: 0.5, sm: 1 },
        borderRadius: 1,
        // bgcolor: "background.paper",
      }}
    >
      {/* Chips area with wrapping */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          flexWrap: "wrap",
        }}
      >
        {searchTerm && (
          <Chip
            size="small"
            label={`Search: "${searchTerm}"`}
            color="primary"
            onDelete={onClearSearch}
            sx={{ height: { xs: 24, sm: 28 } }}
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
                sx={{ height: { xs: 24, sm: 28 } }}
              />
            ));
          }
          return [
            <Chip
              key={`${f.field}-${i}`}
              size="small"
              label={formatChipLabel(f)}
              onDelete={() => removeAt(i)}
              sx={{ height: { xs: 24, sm: 28 } }}
            />,
          ];
        })}
      </Box>

      {/* Single clear-all button pinned to the right within same container */}
      <Button
        size="small"
        onClick={clearAll}
        disabled={value.length === 0}
        sx={{ minWidth: { xs: 64, sm: 80 }, px: { xs: 1, sm: 1.5 } }}
      >
        Clear all
      </Button>
    </Box>
  );
}
