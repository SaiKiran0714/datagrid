// // src/components/GenericDataGrid.jsx
import { useMemo, useRef, useState, useEffect } from "react";
import {
  ModuleRegistry, AllCommunityModule, InfiniteRowModelModule,
} from "ag-grid-community";
import { SetFilterModule } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { agGridTheme } from "../theme/agGridTheme";

import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getData, deleteRecord } from "../lib/api";

ModuleRegistry.registerModules([AllCommunityModule, InfiniteRowModelModule, SetFilterModule]);

// const myTheme = themeQuartz.withPart(colorSchemeDarkBlue);
const containerStyle = { width: "100%", height: "500px" };

export const mapFilterModelToApi = (filterModel) => {
    const apiFilters = [];
    if (!filterModel) return apiFilters;
    for (const [field, fm] of Object.entries(filterModel)) {
      if (!fm) continue;
      if (fm.filterType === 'text') {
        const op = ({ contains:'contains', equals:'equals', startsWith:'startsWith', endsWith:'endsWith', blank:'isEmpty' })[fm.type] || 'contains';
        apiFilters.push({ field, op, value: fm.filter });
      } else if (fm.filterType === 'number') {
        const op = ({ equals:'equals', greaterThan:'gt', lessThan:'lt', blank:'isEmpty' })[fm.type] || 'equals';
        apiFilters.push({ field, op, value: fm.filter != null ? String(fm.filter) : undefined });
      }
    }
    return apiFilters;
  };

export default function GenericDataGrid({
  query,           // { q, caseSensitive?, all?, page?, pageSize?, sortField, sortOrder }
  filters,         // array -> will be JSON.stringified
  onColumnsReady,  // (cols) => void
  onSortChange,    // (field, order) => void
  refreshKey,
  onTotalChange
}) {
  const gridRef = useRef(null);
  const navigate = useNavigate();

  const [columnDefs, setColumnDefs] = useState([]);
  const [total, setTotal] = useState(0);
  const [confirm, setConfirm] = useState({ open: false, id: null, brand: "", model: "" });
  const [filterModel, setFilterModel] = useState({});
  const advancedFilters = useMemo(() => mapFilterModelToApi(filterModel), [filterModel]);

  const onFilterChanged = () => {
  const model = gridRef.current?.api?.getFilterModel() || {};
  setFilterModel(model);
  gridRef.current?.api?.refreshInfiniteCache();
  // Optionally, update your filters state here if you want to keep a unified source of truth
};


  const openConfirm = (row) =>
    setConfirm({ open: true, id: row.id, brand: row.Brand ?? "", model: row.Model ?? "" });
  const closeConfirm = () => setConfirm((c) => ({ ...c, open: false }));

  //   const autoSizeStrategy = useMemo(() => {
  //   return {
  //     type: "fitGridWidth",
  //     defaultMinWidth: 100,
  //     columnLimits: [
  //       {
  //         colId: "country",
  //         minWidth: 900,
  //       },
  //     ],
  //   };
  // }, []);

  const numericFields = new Set(["AccelSec","TopSpeed_KmH","Range_Km","Efficiency_WhKm","FastCharge_KmH","Seats","PriceEuro"]);
  const toNum = (v) => v == null || v === "-" ? NaN : Number(String(v).replace(/[^0-9.-]/g, ""));
  const numComparator = (a, b) => {
    const na = toNum(a), nb = toNum(b);
    if (isNaN(na) && isNaN(nb)) return 0;
    if (isNaN(na)) return -1;
    if (isNaN(nb)) return 1;
    return na - nb;
  };
  const prettify = (key) => String(key).replace(/_/g, ' ').replace(/\b(\w)/g, (m) => m.toUpperCase());

  // Map AG Grid filterModel -> backend filters [{ field, op, value }]
 
  // Infinite Row Model datasource
  const datasource = useMemo(() => ({
    getRows: async (params) => {
      try {
        const { startRow = 0, endRow = 0, sortModel = [], filterModel } = params;
        const blockSize = Math.max(1, endRow - startRow) || 25;
        const page = Math.floor(startRow / blockSize) + 1; // 1-based
        const sortField = sortModel[0]?.colId;
        const sortOrder = sortModel[0]?.sort;
        gridRef.current?.api?.showLoadingOverlay(); // Show spinner

        const gridFilters = mapFilterModelToApi(filterModel);
        const res = await getData({
          q: query?.q,
          caseSensitive: query?.caseSensitive ? true : false,
          filters: JSON.stringify(gridFilters.length ? gridFilters : (filters || [])),
          page,
          pageSize: blockSize,
          sortField,
          sortOrder,
        });

        const rows = Array.isArray(res.data) ? res.data : [];
        const total = Number.isFinite(res.total) ? res.total : rows.length;

        // Build columnDefs from the first real data block (no separate pageSize=1 call)
        if (!columnDefs.length && rows[0]) {
          const first = rows[0];
          const rawKeys = Object.keys(first).filter(k => k !== "id");
          const priority = ['Brand', 'Model', 'Range_Km', 'PriceEuro'];
          const others = rawKeys.filter(k => !priority.includes(k));
          const keys = [...priority.filter(k => rawKeys.includes(k)), ...others];

          const cols = keys.map((k) => {
            const isNum = numericFields.has(k);
            const base = {
              field: k,
              headerName:
                k === 'Range_Km' ? 'Range (km)' :
                k === 'Efficiency_WhKm' ? 'Efficiency (Wh/km)' :
                k === 'PriceEuro' ? 'PriceEuro (€)' :
                prettify(k),
              filter: isNum ? 'agNumberColumnFilter' : 'agTextColumnFilter',
              sortable: true,
              resizable: true,
              comparator: isNum ? numComparator : undefined,
            };
            if (isNum) {
              base.valueGetter = (p) => toNum(p.data?.[k]);
              base.valueFormatter = (p) =>
                isNaN(p.value) ? "" :
                k === "PriceEuro" ? `${Number(p.value).toLocaleString()}` :
                Number(p.value).toLocaleString();
            }
            return base;
          });

          cols.push({
            headerName: 'Actions',
            field: '__actions',
            pinned: 'right',
            width: 160,
            filter: false,
            floatingFilter: false,
            sortable: false,
            cellRenderer: (p) => (
              <Box sx={{ display: 'flex', gap: 1, mt: "5px" }}>
                <Button size="small" sx={{ fontWeight: "bold" ,color: "#ffffffff", backgroundColor: "#1976d2", textTransform: "none"}}
                  onClick={() => navigate(`/data/${p.data.id}`)}>View</Button>
                <Button size="small" color="error" variant="outlined" sx={{ fontWeight: "bold" ,color: "#ffffffff", backgroundColor: "#d4211aff",textTransform: "none"}}
                  onClick={() => openConfirm(p.data)}>Delete</Button>
              </Box>
            )
          });

          setColumnDefs(cols);
          onColumnsReady?.(keys);

          // auto-size after setting columns
          setTimeout(() => {
            try {
              const cols2 = gridRef.current?.columnApi?.getColumns?.() || [];
              const ids = cols2.map(c => c.getColId());
              if (ids.length) gridRef.current.columnApi.autoSizeColumns(ids, false);
            } catch {}
          }, 0);
        }

        setTotal(total);
        onTotalChange?.(total);

        if (typeof params.successCallback === 'function') {
          params.successCallback(rows, total);
        } else if (typeof params.success === 'function') {
          params.success({ rowData: rows, rowCount: total });
        }
        gridRef.current?.api?.hideOverlay();
        // setTimeout(() => {
          
        // }, 1000);
      } catch (e) {
         gridRef.current?.api?.showNoRowsOverlay(); 
        console.error("Infinite model getRows failed", e);
        if (typeof params.failCallback === 'function') params.failCallback();
        else if (typeof params.fail === 'function') params.fail();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [JSON.stringify(filters), query?.q, query?.sortField, query?.sortOrder, query?.caseSensitive, refreshKey, columnDefs.length]);

  // 🔑 Re-apply the datasource whenever it changes so the grid refetches
  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api || !datasource) return;
    api.setGridOption('datasource', datasource); // v34+
    api.purgeInfiniteCache();                    // clear cache -> triggers new API call
  }, [datasource]);

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 140,
    resizable: true,
    sortable: true,
    filter: true,
    autoHeaderHeight: true,
    wrapHeaderText: true,
    floatingFilter: false,
    cellStyle: { whiteSpace: 'nowrap' },
    menuTabs: ['filterMenuTab'],
    suppressMenuHide: true,
    cellStyle: { fontWeight: 'bold' },
    filterParams: {
      buttons: ['reset','apply','clear'],
      defaultOption: 'contains'
    }
  }), []);

  const onGridReady = () => {
    gridRef.current?.api?.setGridOption('datasource', datasource);
    gridRef.current?.api?.showLoadingOverlay();
  };

  return (
    <>
      <div style={containerStyle}>
        <AgGridReact
          ref={gridRef}
          theme={agGridTheme}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
           animateRows={true}
           enableCellChangeFlash={true}
          rowModelType="infinite"
          // autoSizeStrategy={autoSizeStrategy}
          cacheBlockSize={25}
          maxBlocksInCache={10}
          onFilterChanged={onFilterChanged}
          
          rowHeight={44}
          popupParent={typeof document !== 'undefined' ? document.body : undefined}
          overlayLoadingTemplate={`<div class="ag-my-spinner"></div>`}
          // overlayLoadingTemplate={`<div class="ag-overlay-loading-center ag-my-loading"><div class="ag-my-spinner"></div><span style="margin-left:8px">Loading…</span></div>`}
          overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">No rows to show</span>`}
          onGridReady={onGridReady}
          // onFilterChanged={() => gridRef.current?.api?.refreshInfiniteCache()}
          onSortChanged={() => {
            const m = gridRef.current?.api?.getSortModel?.();
            if (m && m[0]) onSortChange?.(m[0].colId, m[0].sort);
            else onSortChange?.(undefined, undefined);
            gridRef.current?.api?.refreshInfiniteCache();
          }}
        />
      </div>
 <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <span>Total: {total}</span>
        </Box>
      {/* Confirm delete dialog */}
      <Dialog open={confirm.open} onClose={closeConfirm}>
        <DialogTitle>Delete record?</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2">
            Are you sure you want to delete the record for{" "}
            <strong>{confirm.brand} {confirm.model}</strong> (ID {confirm.id})?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Cancel</Button>
          <Button color="error" variant="contained" onClick={async () => {
            await deleteRecord(confirm.id);
            closeConfirm();
            gridRef.current?.api?.refreshInfiniteCache();
          }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
