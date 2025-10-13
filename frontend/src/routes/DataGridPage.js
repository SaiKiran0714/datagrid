import { Box, FormControlLabel, Checkbox } from "@mui/material";
import SearchBar from "../components/SearchBar";
import FilterParameter from "../components/filterParameter";
import GenericDataGrid from "../components/GenericDataGrid";
import useGridStore from "../store/gridStore";

export default function DataGridPage() {
  // Read from Zustand store (no more useState or prop drilling!)
  const caseSensitive = useGridStore((state) => state.caseSensitive);
  const setCaseSensitive = useGridStore((state) => state.setCaseSensitive);
  const total = useGridStore((state) => state.total);

  return (
    <Box sx={{ width: '100%', height: '100%', p: { xs: 1, sm: 2 } }}>
      {/* top row: search + toggle */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 }, flexWrap: "wrap" }}>
        <Box sx={{ my: { xs: 1, sm: 2 }, width: { xs: '100%', sm: 450 }, flexShrink: 0 }}>
          <SearchBar />
        </Box>
        <FormControlLabel
          control={<Checkbox checked={caseSensitive} onChange={(e)=>{ setCaseSensitive(e.target.checked); }} />}
          label="Case sensitive"
        />
      </Box>
      <Box>
        <FilterParameter />
      </Box>

      <GenericDataGrid />

      {total !== null && (
        <Box sx={{ mt: { xs: 0.5, sm: 1 }, fontSize: '14px', color: '#666' }}>
          Total Records: {total}
        </Box>
      )}

      {/* Delete dialog handled inside GenericDataGrid */}
    </Box>
  );
}
