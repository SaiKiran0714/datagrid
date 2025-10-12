import { useState } from "react";
import { Box, FormControlLabel, Checkbox } from "@mui/material";
import SearchBar from "../components/SearchBar";
import FilterParameter from "../components/filterParameter";
import GenericDataGrid from "../components/GenericDataGrid";
// no direct API calls needed here

// Grid modules are registered inside GenericDataGrid

// no local filter model helpers needed; handled inside GenericDataGrid


export default function DataGridPage() {
  const [q, setQ] = useState();
  const [filters, setFilters] = useState([]);
  const [total, setTotal] = useState(null);
  
  // Not needed here anymore: sorting/paging handled by GenericDataGrid
  // Case sensitivity toggle for search/filters (default OFF -> insensitive)
  const [caseSensitive, setCaseSensitive] = useState(false);

  // // bump this to force reload after delete if needed from parent
  // const [refreshKey, setRefreshKey] = useState(0);

  // columns are now built internally; keep filters state in this page for chips

  // columns are determined within GenericDataGrid

  return (
    <Box sx={{ width: '100%', height: '100%', p: { xs: 1, sm: 2 } }}>
      {/* top row: search + toggle */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 }, flexWrap: "wrap" }}>
        <Box sx={{ my: { xs: 1, sm: 2 }, width: { xs: '100%', sm: 450 }, flexShrink: 0 }}>
          <SearchBar
            initialValue={q || ""}
            onSearch={(val) => {
              setQ(val || undefined);
            }}
          />
        </Box>
        <FormControlLabel
          control={<Checkbox checked={caseSensitive} onChange={(e)=>{ setCaseSensitive(e.target.checked); }} />}
          label="Case sensitive"
        />
      </Box>
      <Box>
        <FilterParameter
          value={filters}
          onChange={(next) => setFilters(next)}
          searchTerm={q || ""}
          onClearSearch={() => setQ(undefined)}
        />
      </Box>

      <GenericDataGrid
        query={{ q, caseSensitive }}
        externalFilters={filters}
        onFiltersChanged={(apiFilters) => setFilters(apiFilters)}
        onTotalChange={(n) => setTotal(n)}
      />

      {total !== null && (
        <Box sx={{ mt: { xs: 0.5, sm: 1 }, fontSize: '14px', color: '#666' }}>
          Total Records: {total}
        </Box>
      )}

      {/* Delete dialog handled inside GenericDataGrid */}
    </Box>
  );
}
