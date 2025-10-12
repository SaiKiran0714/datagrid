import { useState, useMemo, useRef, useEffect } from "react";
import { Box, FormControlLabel, Switch, Checkbox, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from "@mui/material";
import SearchBar from "../components/SearchBar";
import FilterAccordion from "../components/FilterAccordion";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, InfiniteRowModelModule } from "ag-grid-community";
import { SetFilterModule, MultiFilterModule } from "ag-grid-enterprise";
import { getData, deleteRecord, getDistinct } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { agGridTheme } from "../theme/agGridTheme";

ModuleRegistry.registerModules([AllCommunityModule, InfiniteRowModelModule, SetFilterModule, MultiFilterModule]);

// helper: convert ag-Grid filterModel to API filters
function mapFilterModelToApi(filterModel) {
  const apiFilters = [];
  if (!filterModel) return apiFilters;
  for (const [field, fm] of Object.entries(filterModel)) {
    if (!fm) continue;
    if (fm.filterType === 'text') {
      const op = ({
        contains:'contains',
        notContains:'notContains',
        equals:'equals',
        notEqual:'notEquals',
        startsWith:'startsWith',
        endsWith:'endsWith',
        blank:'isEmpty',
        notBlank:'notEmpty'
      })[fm.type] || 'contains';
      apiFilters.push({ field, op, value: fm.filter });
    } else if (fm.filterType === 'multi' && Array.isArray(fm.filterModels)) {
      for (const mm of fm.filterModels) {
        if (!mm) continue;
        if (mm.filterType === 'set') {
          const values = Array.isArray(mm.values) ? mm.values : [];
          if (values.length) apiFilters.push({ field, op: 'in', values });
        } else if (mm.filterType === 'text') {
          const op = ({
            contains:'contains',
            notContains:'notContains',
            equals:'equals',
            notEqual:'notEquals',
            startsWith:'startsWith',
            endsWith:'endsWith',
            blank:'isEmpty',
            notBlank:'notEmpty'
          })[mm.type] || 'contains';
          apiFilters.push({ field, op, value: mm.filter });
        }
      }
    } else if (fm.filterType === 'set') {
      // AG Set Filter: selected values are in fm.values
      const values = Array.isArray(fm.values) ? fm.values : [];
      if (values.length) apiFilters.push({ field, op: 'in', values });
    } else if (fm.filterType === 'number') {
      const op = ({ equals:'equals', notEqual:'notEqualsNumber', greaterThan:'gt', lessThan:'lt', blank:'isEmpty', notBlank:'notEmpty' })[fm.type] || 'equals';
      apiFilters.push({ field, op, value: fm.filter != null ? String(fm.filter) : undefined });
    }
  }
  return apiFilters;
}

// helper: convert API filters [{field,op,value}] back to AG Grid filterModel
function apiFiltersToAgFilterModel(apiFilters, types = {}) {
  const model = {};
  if (!Array.isArray(apiFilters)) return model;
  const byField = new Map();
  for (const f of apiFilters) {
    if (!f || !f.field) continue;
    const list = byField.get(f.field) || [];
    list.push(f);
    byField.set(f.field, list);
  }
  for (const [field, list] of byField.entries()) {
    const subModels = [];
    for (const f of list) {
      if (f.op === 'in') {
        subModels.push({ filterType: 'set', values: Array.isArray(f.values) ? f.values : [] });
      } else {
        const t = types[field] === 'number' ? 'number' : 'text';
        let type;
        switch (f.op) {
          case 'contains': type = 'contains'; break;
          case 'notContains': type = 'notContains'; break;
          case 'equals': type = 'equals'; break;
          case 'notEquals': type = 'notEqual'; break;
          case 'startsWith': type = 'startsWith'; break;
          case 'endsWith': type = 'endsWith'; break;
          case 'isEmpty': type = 'blank'; break;
          case 'notEmpty': type = 'notBlank'; break;
          case 'gt':
          case 'greaterThan': type = 'greaterThan'; break;
          case 'lt':
          case 'lessThan': type = 'lessThan'; break;
          case 'notEqualsNumber': type = 'notEqual'; break;
          default: type = 'contains';
        }
        const filterVal = t === 'number' && f.value != null && f.value !== ''
          ? Number(f.value)
          : f.value;
        subModels.push({ filterType: t, type, ...(type !== 'blank' ? { filter: filterVal } : {}) });
      }
    }
    if (subModels.length === 1) {
      model[field] = subModels[0];
    } else if (subModels.length > 1) {
      model[field] = { filterType: 'multi', filterModels: subModels };
    }
  }
  return model;
}
// ...

const columnTypes = {
  Brand: "text",
  Model: "text",
  AccelSec: "number",
  TopSpeed_KmH: "number",
  Range_Km: "number",
  Efficiency_WhKm: "number",
  FastCharge_KmH: "number",
  RapidCharge: "boolean",
  PowerTrain: "text",
  PlugType: "text",
  BodyStyle: "text",
  Segment: "text",
  Seats: "number",
  PriceEuro: "number",
  Date: "date", // treated as text ops by default
};


export default function DataGridPage() {
  const gridRef = useRef(null);
  const navigate = useNavigate();
  const [q, setQ] = useState();
  const [filters, setFilters] = useState([]);
  const [columns, setColumns] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterModel, setFilterModel] = useState({});
  const [confirm, setConfirm] = useState({ open: false, id: null, brand: "", model: "" });
  const [brandOptions, setBrandOptions] = useState([]);
  const [bodyStyleOptions, setBodyStyleOptions] = useState([]);
  
  // Prefetch distinct values once so Set Filter can render immediately
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [brands, bodies] = await Promise.all([
          getDistinct('Brand').catch(() => []),
          getDistinct('BodyStyle').catch(() => []),
        ]);
        if (mounted) {
          setBrandOptions(Array.isArray(brands) ? brands : []);
          setBodyStyleOptions(Array.isArray(bodies) ? bodies : []);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  const pageSize = 25;
 

  const [sortField, setSortField] = useState();
  const [sortOrder, setSortOrder] = useState(); // "asc" | "desc"

  // // NEW: Show-all toggle (default OFF)
  // const [showAll, setShowAll] = useState(false);
  // Case sensitivity toggle for search/filters (default OFF -> insensitive)
  const [caseSensitive, setCaseSensitive] = useState(false);

  // bump this to force reload after delete if needed from parent
  const [refreshKey, setRefreshKey] = useState(0);

  const advancedFilters = useMemo(() => mapFilterModelToApi(filterModel), [filterModel]);
  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setPage(1);
  };

  // grid datasource (infinite row model)
  const datasource = useMemo(() => ({
    getRows: async (params) => {
      try {
        // Show loading overlay while fetching
        gridRef.current?.api?.showLoadingOverlay();
        const { startRow = 0, endRow = 0, sortModel = [], filterModel } = params;
        const blockSize = Math.max(1, endRow - startRow) || 25;
        const page = Math.floor(startRow / blockSize) + 1; // 1-based
        const sortField = sortModel[0]?.colId;
        const sortOrder = sortModel[0]?.sort;

        const gridFilters = mapFilterModelToApi(filterModel);
        const res = await getData({
          q,
          caseSensitive,
          filters: JSON.stringify(gridFilters.length ? gridFilters : (filters || [])),
          page,
          pageSize: blockSize,
          sortField,
          sortOrder,
        });

        const rows = Array.isArray(res.data) ? res.data : [];
        const total = Number.isFinite(res.total) ? res.total : rows.length;

        // build columns on first load
        if (!columns.length && rows[0]) {
          const first = rows[0];
          const keys = Object.keys(first).filter(k => k !== 'id');

          // Priority ordering: show most useful fields first; move Date later
          const PRIORITY_FIRST = [
            'Brand','Model','PriceEuro','Range_Km','BodyStyle','TopSpeed_KmH','AccelSec',
            'Segment','Seats','PowerTrain','PlugType','RapidCharge'
          ];
          const LOW_PRIORITY_LAST = ['Date'];

          const present = new Set(keys);
          const firstGroup = PRIORITY_FIRST.filter(k => present.has(k));
          firstGroup.forEach(k => present.delete(k));
          const lastGroup = LOW_PRIORITY_LAST.filter(k => present.has(k));
          lastGroup.forEach(k => present.delete(k));
          const middleGroup = Array.from(present);
          const orderedKeys = [...firstGroup, ...middleGroup, ...lastGroup];
          const colDefs = orderedKeys.map((k) => {
            const isNum = columnTypes[k] === 'number';
            if (isNum) {
              return {
                field: k,
                sortable: true,
                resizable: true,
                filter: 'agNumberColumnFilter',
                filterParams: {
                  buttons: ['reset','apply','clear'],
                  defaultOption: 'greaterThan',
                  filterOptions: ['greaterThan','lessThan','equals','notEqual'],
                },
                ...(k === 'PriceEuro' ? {
                  valueFormatter: (p) => {
                    const raw = p.value ?? (p.data ? p.data[k] : undefined);
                    const num = Number(String(raw).replace(/[^0-9.-]/g, ''));
                    return isNaN(num) ? (raw ?? '') : num.toLocaleString();
                  }
                } : {})
              };
            }
            // Text fields
            if (k === 'Brand' || k === 'BodyStyle') {
              return {
                field: k,
                sortable: true,
                resizable: true,
                filter: 'agMultiColumnFilter',
                filterParams: {
                  defaultJoinOperator: 'AND',
                  filters: [
                    {
                      filter: 'agSetColumnFilter',
                      filterParams: {
                        values: (k === 'Brand' && brandOptions.length)
                          ? brandOptions
                          : (k === 'BodyStyle' && bodyStyleOptions.length)
                            ? bodyStyleOptions
                            : ((params) => {
                                getDistinct(k)
                                  .then((vals) => params.success(Array.isArray(vals) ? vals : []))
                                  .catch(() => params.success([]));
                              }),
                        refreshValuesOnOpen: true,
                        excelMode: 'windows',
                        comparator: (a, b, _, selected) => {
                          const as = selected?.has?.(a) ? 0 : 1;
                          const bs = selected?.has?.(b) ? 0 : 1;
                          if (as !== bs) return as - bs;
                          return String(a).localeCompare(String(b));
                        },
                      }
                    },
                    {
                      filter: 'agTextColumnFilter',
                      filterParams: { buttons: ['reset','apply','clear'], defaultOption: 'contains' }
                    }
                  ]
                }
              };
            }
            return { field: k, filter: 'agTextColumnFilter', sortable: true, resizable: true };
          });
          colDefs.push({
            headerName: 'Actions',
            field: '__actions',
            pinned: 'right',
            width: 160,
            filter: false,
            sortable: false,
            cellRenderer: (p) => (
              <Box sx={{ display: 'flex', gap: 1, mt: "5px" }}>
                <Button size="small" sx={{ fontWeight: 'bold', color: '#ffffffff', backgroundColor: '#1976d2', textTransform: 'none' }}
                  onClick={() => navigate(`/data/${p.data.id}`)}>View</Button>
                <Button size="small" color="error" variant="outlined" sx={{ fontWeight: 'bold', color: '#ffffffff', backgroundColor: '#d4211aff', textTransform: 'none' }}
                  onClick={() => setConfirm({ open: true, id: p.data.id, brand: p.data.Brand ?? '', model: p.data.Model ?? '' })}>Delete</Button>
              </Box>
            )
          });
          setColumns(orderedKeys);
          setColumnDefs(colDefs);
        }

        setTotal(total);
        if (typeof params.successCallback === 'function') params.successCallback(rows, total);
        else if (typeof params.success === 'function') params.success({ rowData: rows, rowCount: total });

        // Hide overlay after a short delay for a smoother visual
        setTimeout(() => {
          gridRef.current?.api?.hideOverlay();
        }, 500);
      } catch (e) {
        // On failure, show the built-in no rows overlay
        gridRef.current?.api?.showNoRowsOverlay();
        if (typeof params.failCallback === 'function') params.failCallback();
        else if (typeof params.fail === 'function') params.fail();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [q, caseSensitive, JSON.stringify(filters), sortField, sortOrder]);

  const [columnDefs, setColumnDefs] = useState([]);

  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    api.setGridOption('datasource', datasource);
    api.purgeInfiniteCache();
  }, [datasource]);

  return (
    <Box sx={{ width: '100%', height: '100%', p: 2 }}>
      {/* top row: search + toggle */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ my: 2, width: 450, flexShrink: 0 }}>
          <SearchBar
            initialValue={q || ""}
            onSearch={(val) => {
              setQ(val || undefined);
              setPage(1);
            }}
          />
        </Box>
        <FormControlLabel
          control={<Checkbox checked={caseSensitive} onChange={(e)=>{ setCaseSensitive(e.target.checked); setPage(1); }} />}
          label="Case sensitive"
        />
      </Box>
      <Box>
      <FilterAccordion
        columns={columns}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
          const api = gridRef.current?.api;
          if (api) {
            const model = apiFiltersToAgFilterModel(next, columnTypes);
            api.setFilterModel(model);
            api.refreshInfiniteCache();
          }
        }}
        types={columnTypes}
        value={filters}
        searchTerm={q || ""}
        onClearSearch={() => { setQ(undefined); setPage(1); }}
        defaultOpen={false}
        fetchDistinct={async (field) => getDistinct(field)}
      />

      </Box>
      {/* Grid */}
      {/* <Box> */}
        <div style={{ width: '100%', height: 360 }}>
          <AgGridReact
            ref={gridRef}
            theme={agGridTheme}
            columnDefs={columnDefs}
            defaultColDef={{ flex: 1, minWidth: 140, resizable: true, sortable: true, filter: true }}
            rowHeight={42}
            rowModelType="infinite"
            cacheBlockSize={25}
            maxBlocksInCache={10}
            popupParent={typeof document !== 'undefined' ? document.body : undefined}
            overlayLoadingTemplate={`<div class="ag-my-spinner"></div>`}
            overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">No rows to show</span>`}
            onFilterChanged={() => {
              const model = gridRef.current?.api?.getFilterModel() || {};
              setFilterModel(model);
              const apiFilters = mapFilterModelToApi(model);
              setFilters(apiFilters);
            }}
            onSortChanged={() => {
              const m = gridRef.current?.api?.getSortModel?.();
              if (m && m[0]) handleSortChange(m[0].colId, m[0].sort);
              else handleSortChange(undefined, undefined);
              gridRef.current?.api?.refreshInfiniteCache();
            }}
            onGridReady={() => {
              gridRef.current?.api?.setGridOption('datasource', datasource);
              gridRef.current?.api?.showLoadingOverlay();
            }}
          />
        </div>
      {/* </Box> */}

      <Box sx={{ mt: 1, fontSize: '14px', color: '#666' }}>
        Total Records: {total}
      </Box>

      {/* Confirm delete dialog */}
      <Dialog open={confirm.open} onClose={() => setConfirm((c) => ({ ...c, open: false }))}>
        <DialogTitle>Delete record?</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2">
            Are you sure you want to delete the record for{" "}
            <strong>{confirm.brand} {confirm.model}</strong> (ID {confirm.id})?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm((c) => ({ ...c, open: false }))}>Cancel</Button>
          <Button color="error" variant="contained" onClick={async () => {
            await deleteRecord(confirm.id);
            setConfirm((c) => ({ ...c, open: false }));
            gridRef.current?.api?.refreshInfiniteCache();
          }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
