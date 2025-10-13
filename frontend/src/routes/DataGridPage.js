import { Box } from "@mui/material";
import SearchBar from "../components/SearchBar";
import FilterParameter from "../components/filterParameter";
import GenericDataGrid from "../components/GenericDataGrid";
import useGridStore from "../store/gridStore";

export default function DataGridPage() {
  // Read from Zustand store (no more useState or prop drilling!)
  const total = useGridStore((state) => state.total);
  const showing = useGridStore((state) => state.showing);

  return (
    <Box sx={{ width: "100%", height: "100%", p: { xs: 1, sm: 2 } }}>
      {/* top row: search */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 }, flexWrap: "wrap" }}>
        <Box sx={{ my: { xs: 1, sm: 2 }, width: { xs: "100%", sm: 450 }, flexShrink: 0 }}>
          <SearchBar />
        </Box>
      </Box>
      <Box>
        <FilterParameter />
      </Box>

      <GenericDataGrid />

      {total !== null && (
        <Box
          sx={{
            mt: { xs: 0.5, sm: 1 },
            fontSize: "14px",
            color: "#666",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <span>Total Records: {total}</span>
          <span>Showing: {showing || 25}</span>
        </Box>
      )}

      {/* Delete dialog handled inside GenericDataGrid */}
    </Box>
  );
}
