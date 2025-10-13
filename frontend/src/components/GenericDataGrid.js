// src/components/GenericDataGrid.jsx
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { ModuleRegistry, AllCommunityModule, InfiniteRowModelModule } from "ag-grid-community";
import { SetFilterModule, MultiFilterModule } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { agGridTheme } from "../theme/agGridTheme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getData, deleteRecord, getDistinct } from "../lib/api";
import useGridStore from "../store/gridStore";

ModuleRegistry.registerModules([
  AllCommunityModule,
  InfiniteRowModelModule,
  SetFilterModule,
  MultiFilterModule,
]);

const containerStyle = { width: "100%", height: "360px" };

// Helpers to map AG Grid filter model to API and back
const normalizeFilters = (filters = []) => {
  return [...filters]
    .map((f) => {
      if (!f) return f;
      if (f.op === "in") {
        const values = Array.isArray(f.values) ? [...f.values].sort() : [];
        return { ...f, values };
      }
      return { ...f };
    })
    .sort((a, b) => {
      if (!a || !b) return 0;
      if (a.field !== b.field) return String(a.field).localeCompare(String(b.field));
      if (a.op !== b.op) return String(a.op).localeCompare(String(b.op));
      return JSON.stringify(a.value ?? a.values ?? "").localeCompare(
        JSON.stringify(b.value ?? b.values ?? "")
      );
    });
};

const mapFilterModelToApi = (filterModel) => {
  const apiFilters = [];
  if (!filterModel) return apiFilters;
  for (const [field, fm] of Object.entries(filterModel)) {
    if (!fm) continue;
    if (fm.filterType === "text") {
      const op =
        {
          contains: "contains",
          notContains: "notContains",
          equals: "equals",
          notEqual: "notEquals",
          startsWith: "startsWith",
          endsWith: "endsWith",
          blank: "isEmpty",
          notBlank: "notEmpty",
        }[fm.type] || "contains";
      apiFilters.push({ field, op, value: fm.filter });
    } else if (fm.filterType === "multi" && Array.isArray(fm.filterModels)) {
      for (const mm of fm.filterModels) {
        if (!mm) continue;
        if (mm.filterType === "set") {
          const values = Array.isArray(mm.values) ? mm.values : [];
          if (values.length) apiFilters.push({ field, op: "in", values });
        } else if (mm.filterType === "text") {
          const op =
            {
              contains: "contains",
              notContains: "notContains",
              equals: "equals",
              notEqual: "notEquals",
              startsWith: "startsWith",
              endsWith: "endsWith",
              blank: "isEmpty",
              notBlank: "notEmpty",
            }[mm.type] || "contains";
          apiFilters.push({ field, op, value: mm.filter });
        }
      }
    } else if (fm.filterType === "set") {
      const values = Array.isArray(fm.values) ? fm.values : [];
      if (values.length) apiFilters.push({ field, op: "in", values });
    } else if (fm.filterType === "number") {
      const op =
        {
          equals: "equals",
          notEqual: "notEqualsNumber",
          greaterThan: "gt",
          lessThan: "lt",
          blank: "isEmpty",
          notBlank: "notEmpty",
        }[fm.type] || "equals";
      apiFilters.push({
        field,
        op,
        value: fm.filter !== null && fm.filter !== undefined ? String(fm.filter) : undefined,
      });
    }
  }
  return normalizeFilters(apiFilters);
};

const apiFiltersToAgFilterModel = (apiFilters, types = {}) => {
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
      if (f.op === "in") {
        subModels.push({ filterType: "set", values: Array.isArray(f.values) ? f.values : [] });
      } else {
        const t = types[field] === "number" ? "number" : "text";
        let type;
        switch (f.op) {
          case "contains":
            type = "contains";
            break;
          case "notContains":
            type = "notContains";
            break;
          case "equals":
            type = "equals";
            break;
          case "notEquals":
            type = "notEqual";
            break;
          case "startsWith":
            type = "startsWith";
            break;
          case "endsWith":
            type = "endsWith";
            break;
          case "isEmpty":
            type = "blank";
            break;
          case "notEmpty":
            type = "notBlank";
            break;
          case "gt":
          case "greaterThan":
            type = "greaterThan";
            break;
          case "lt":
          case "lessThan":
            type = "lessThan";
            break;
          case "notEqualsNumber":
            type = "notEqual";
            break;
          default:
            type = "contains";
        }
        const filterVal =
          t === "number" && f.value !== null && f.value !== undefined && f.value !== ""
            ? Number(f.value)
            : f.value;
        subModels.push({ filterType: t, type, ...(type !== "blank" ? { filter: filterVal } : {}) });
      }
    }
    if (subModels.length === 0) continue;
    if (multiFilterFields.has(field)) {
      model[field] = { filterType: "multi", filterModels: subModels, operator: "AND" };
    } else if (subModels.length === 1) {
      model[field] = subModels[0];
    } else {
      model[field] = { filterType: "multi", filterModels: subModels };
    }
  }
  return model;
};

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
  Date: "date",
};
const multiFilterFields = new Set(["Brand", "BodyStyle"]);

export default function GenericDataGrid() {
  // Read from Zustand store instead of props
  const q = useGridStore((state) => state.q);
  const externalFilters = useGridStore((state) => state.filters);
  const setFilters = useGridStore((state) => state.setFilters);
  const setTotal = useGridStore((state) => state.setTotal);
  const setShowing = useGridStore((state) => state.setShowing);

  const gridRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const lastDatasourceRef = useRef(null);
  const skipNextFilterChangedRef = useRef(false);
  const normalizedExternalFilters = useMemo(
    () => normalizeFilters(externalFilters),
    [externalFilters]
  );
  const externalFiltersKey = useMemo(
    () => JSON.stringify(normalizedExternalFilters),
    [normalizedExternalFilters]
  );
  const notifyFiltersChanged = useCallback(
    (filters) => {
      const normalized = normalizeFilters(filters);
      const key = JSON.stringify(normalized);
      if (key === externalFiltersKey) return;
      setFilters(normalized);
    },
    [externalFiltersKey, setFilters]
  );

  const [columnDefs, setColumnDefs] = useState([]);
  const [confirm, setConfirm] = useState({ open: false, id: null, brand: "", model: "" });

  // Delete mutation with cache invalidation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteRecord(id),
    onSuccess: () => {
      // Invalidate distinct value caches in case the deleted record affected them
      queryClient.invalidateQueries({ queryKey: ["distinct"] });
      // Refresh the grid
      gridRef.current?.api?.refreshInfiniteCache();
    },
  });

  // Prefetch distinct values using React Query - cached for 10 minutes
  const { data: brandOptions = [] } = useQuery({
    queryKey: ["distinct", "Brand"],
    queryFn: () => getDistinct("Brand"),
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => (Array.isArray(data) ? data : []),
  });

  const { data: bodyStyleOptions = [] } = useQuery({
    queryKey: ["distinct", "BodyStyle"],
    queryFn: () => getDistinct("BodyStyle"),
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => (Array.isArray(data) ? data : []),
  });

  // Note: syncFilterInstances is kept for potential future use with filter synchronization
  // eslint-disable-next-line no-unused-vars
  const syncFilterInstances = useCallback((model) => {
    const api = gridRef.current?.api;
    if (!api || typeof api.getFilterInstance !== "function") return;
    const currentModel = api.getFilterModel?.() || {};
    const fields = new Set([...Object.keys(currentModel || {}), ...Object.keys(model || {})]);
    fields.forEach((field) => {
      const instance = api.getFilterInstance(field);
      if (!instance || typeof instance.setModel !== "function") return;
      const nextModel = model?.[field] ?? null;

      try {
        // For multi-filters, we need to set the model and update child filters
        if (
          nextModel &&
          nextModel.filterType === "multi" &&
          Array.isArray(nextModel.filterModels)
        ) {
          // Set the overall model first
          instance.setModel(nextModel);

          // For each child filter in the multi-filter, get and update it
          const childInstances = instance.getChildFilterInstance
            ? nextModel.filterModels.map((_, idx) => instance.getChildFilterInstance(idx))
            : [];

          childInstances.forEach((childInstance, idx) => {
            if (childInstance && typeof childInstance.setModel === "function") {
              try {
                childInstance.setModel(nextModel.filterModels[idx] || null);
                // Refresh set filter values to update checkboxes
                if (typeof childInstance.refreshFilterValues === "function") {
                  childInstance.refreshFilterValues();
                }
              } catch (e) {
                console.error("Error setting child filter model:", e);
              }
            }
          });
        } else {
          // For simple filters, just set the model
          instance.setModel(nextModel);
        }

        // Apply the model changes
        if (typeof instance.applyModel === "function") {
          instance.applyModel();
        }
      } catch (e) {
        console.error("Error syncing filter instance:", e);
      }
    });
  }, []);

  // Build datasource
  const datasource = useMemo(
    () => ({
      getRows: async (params) => {
        try {
          const apiInstance = gridRef.current?.api;
          apiInstance?.showLoadingOverlay();
          const { startRow = 0, endRow = 0, sortModel = [], filterModel } = params;
          const blockSize = Math.max(1, endRow - startRow) || 25;
          const page = Math.floor(startRow / blockSize) + 1;
          const sortField = sortModel[0]?.colId;
          const sortOrder = sortModel[0]?.sort;

          // Always read the live grid filter model to avoid races
          const liveModel = gridRef.current?.api?.getFilterModel?.() || filterModel || {};
          const gridFilters = mapFilterModelToApi(liveModel);
          const res = await getData({
            q,
            filters: JSON.stringify(gridFilters),
            page,
            pageSize: blockSize,
            sortField,
            sortOrder,
          });
          const rows = Array.isArray(res.data) ? res.data : [];
          const total = Number.isFinite(res.total) ? res.total : rows.length;
          setTotal(total);
          setShowing(startRow + rows.length);
          if (!columnDefs.length && rows[0]) {
            const first = rows[0];
            const keys = Object.keys(first).filter((k) => k !== "id");
            const PRIORITY_FIRST = [
              "Brand",
              "Model",
              "PriceEuro",
              "Range_Km",
              "BodyStyle",
              "TopSpeed_KmH",
              "AccelSec",
              "Segment",
              "Seats",
              "PowerTrain",
              "PlugType",
              "RapidCharge",
            ];
            const LOW_PRIORITY_LAST = ["Date"];
            const present = new Set(keys);
            const firstGroup = PRIORITY_FIRST.filter((k) => present.has(k));
            firstGroup.forEach((k) => present.delete(k));
            const lastGroup = LOW_PRIORITY_LAST.filter((k) => present.has(k));
            lastGroup.forEach((k) => present.delete(k));
            const middleGroup = Array.from(present);
            const orderedKeys = [...firstGroup, ...middleGroup, ...lastGroup];
            const cols = orderedKeys.map((k) => {
              const isNum = columnTypes[k] === "number";
              if (isNum) {
                return {
                  field: k,
                  sortable: true,
                  resizable: true,
                  filter: "agNumberColumnFilter",
                  filterParams: {
                    buttons: ["reset", "apply", "clear"],
                    defaultOption: "greaterThan",
                    filterOptions: ["greaterThan", "lessThan", "equals", "notEqual"],
                  },
                  ...(k === "PriceEuro"
                    ? {
                        valueFormatter: (p) => {
                          const raw = p.value ?? (p.data ? p.data[k] : undefined);
                          // If nothing yet (loading or truly empty), show blank instead of 0
                          if (raw === null || raw === undefined) return "";
                          const cleaned = String(raw).replace(/[^0-9.-]/g, "");
                          // guard against empty/invalid numeric strings like '', '.', '-', '-.'
                          if (!cleaned || cleaned === "." || cleaned === "-" || cleaned === "-.")
                            return String(raw) || "";
                          const num = Number(cleaned);
                          return Number.isFinite(num) ? num.toLocaleString() : String(raw) || "";
                        },
                      }
                    : {}),
                };
              }
              if (k === "Brand" || k === "BodyStyle") {
                return {
                  field: k,
                  sortable: true,
                  resizable: true,
                  filter: "agMultiColumnFilter",
                  filterParams: {
                    defaultJoinOperator: "AND",
                    filters: [
                      {
                        filter: "agSetColumnFilter",
                        filterParams: {
                          values:
                            k === "Brand" && brandOptions.length
                              ? brandOptions
                              : k === "BodyStyle" && bodyStyleOptions.length
                                ? bodyStyleOptions
                                : (params) => {
                                    getDistinct(k)
                                      .then((vals) =>
                                        params.success(Array.isArray(vals) ? vals : [])
                                      )
                                      .catch(() => params.success([]));
                                  },
                          refreshValuesOnOpen: true,
                          excelMode: "windows",
                          comparator: (a, b, _, selected) => {
                            const as = selected?.has?.(a) ? 0 : 1;
                            const bs = selected?.has?.(b) ? 0 : 1;
                            if (as !== bs) return as - bs;
                            return String(a).localeCompare(String(b));
                          },
                        },
                      },
                      {
                        filter: "agTextColumnFilter",
                        filterParams: {
                          buttons: ["reset", "apply", "clear"],
                          defaultOption: "contains",
                        },
                      },
                    ],
                  },
                };
              }
              return { field: k, filter: "agTextColumnFilter", sortable: true, resizable: true };
            });
            cols.push({
              headerName: "Actions",
              field: "__actions",
              pinned: "right",
              width: 160,
              filter: false,
              sortable: false,
              cellRenderer: (p) => (
                <Box sx={{ display: "flex", gap: 1, mt: "5px" }}>
                  <Button
                    size="small"
                    sx={{
                      fontWeight: "bold",
                      color: "#ffffffff",
                      backgroundColor: "#1976d2",
                      textTransform: "none",
                    }}
                    onClick={() => navigate(`/data/${p.data.id}`)}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{
                      fontWeight: "bold",
                      color: "#ffffffff",
                      backgroundColor: "#d4211aff",
                      textTransform: "none",
                    }}
                    onClick={() =>
                      setConfirm({
                        open: true,
                        id: p.data.id,
                        brand: p.data.Brand ?? "",
                        model: p.data.Model ?? "",
                      })
                    }
                  >
                    Delete
                  </Button>
                </Box>
              ),
            });
            setColumnDefs(cols);
          }

          if (typeof params.successCallback === "function") params.successCallback(rows, total);
          else if (typeof params.success === "function")
            params.success({ rowData: rows, rowCount: total });

          if (total === 0) apiInstance?.showNoRowsOverlay();
          else apiInstance?.hideOverlay();
        } catch (e) {
          gridRef.current?.api?.showNoRowsOverlay();
          if (typeof params.failCallback === "function") params.failCallback();
          else if (typeof params.fail === "function") params.fail();
        }
      },
    }),
    [q, brandOptions, bodyStyleOptions, columnDefs.length, setTotal, setShowing, navigate]
  ); // Apply datasource and react to changes
  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api || !datasource) return;
    if (lastDatasourceRef.current === datasource) return;
    if (typeof api.setGridOption === "function") api.setGridOption("datasource", datasource);
    else if (typeof api.setDatasource === "function") api.setDatasource(datasource);
    lastDatasourceRef.current = datasource;
  }, [datasource]);

  // Keep grid filter model in sync when external filters change externally (chips, etc.)
  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const currentModel = api.getFilterModel() || {};
    const nowApiFilters = mapFilterModelToApi(currentModel);
    if (JSON.stringify(nowApiFilters) === externalFiltersKey) return;

    const model = apiFiltersToAgFilterModel(normalizedExternalFilters, columnTypes);
    skipNextFilterChangedRef.current = true;

    // For fields that changed, destroy and recreate the filter to force UI update
    const changedFields = new Set([
      ...Object.keys(currentModel || {}),
      ...Object.keys(model || {}),
    ]);

    changedFields.forEach((field) => {
      if (JSON.stringify(currentModel[field]) !== JSON.stringify(model[field])) {
        try {
          api.destroyFilter(field);
        } catch (err) {
          // Ignore errors during filter destruction
        }
      }
    });

    // Set the new filter model
    api.setFilterModel(model);

    // Reset skip flag after a brief delay
    setTimeout(() => {
      skipNextFilterChangedRef.current = false;
    }, 100);

    // Refresh the grid data
    api.showLoadingOverlay();
    if (typeof api.refreshInfiniteCache === "function") api.refreshInfiniteCache();
    else api.purgeInfiniteCache?.();
  }, [externalFiltersKey, normalizedExternalFilters]);

  return (
    <div style={containerStyle}>
      <AgGridReact
        ref={gridRef}
        theme={agGridTheme}
        columnDefs={columnDefs}
        defaultColDef={{ flex: 1, minWidth: 140, resizable: true, sortable: true, filter: true }}
        rowHeight={42}
        rowModelType="infinite"
        cacheBlockSize={25}
        maxConcurrentDatasourceRequests={1}
        blockLoadDebounceMillis={200}
        maxBlocksInCache={10}
        popupParent={typeof document !== "undefined" ? document.body : undefined}
        overlayLoadingTemplate={
          '<div class="ag-my-overlay" role="status" aria-live="polite"><div class="ag-my-spinner" aria-hidden="true"></div><div class="ag-my-label">Loading…</div></div>'
        }
        overlayNoRowsTemplate={'<span class="ag-overlay-no-rows-center">No rows to show</span>'}
        onFilterChanged={() => {
          const model = gridRef.current?.api?.getFilterModel() || {};
          const apiFilters = mapFilterModelToApi(model);
          if (skipNextFilterChangedRef.current) {
            skipNextFilterChangedRef.current = false;
            return;
          }
          notifyFiltersChanged(apiFilters);
          gridRef.current?.api?.showLoadingOverlay();
          const api = gridRef.current?.api;
          if (typeof api?.refreshInfiniteCache === "function") api.refreshInfiniteCache();
          else api?.purgeInfiniteCache?.();
        }}
        onFilterModified={() => {
          // Keep chips responsive while filter panel is open
          const model = gridRef.current?.api?.getFilterModel() || {};
          const apiFilters = mapFilterModelToApi(model);
          notifyFiltersChanged(apiFilters);
        }}
        onSortChanged={() => {
          gridRef.current?.api?.showLoadingOverlay();
          const api = gridRef.current?.api;
          if (typeof api?.refreshInfiniteCache === "function") api.refreshInfiniteCache();
          else api?.purgeInfiniteCache?.();
        }}
        onGridReady={() => {
          const api = gridRef.current?.api;
          if (api && datasource) {
            if (typeof api.setGridOption === "function")
              api.setGridOption("datasource", datasource);
            else if (typeof api.setDatasource === "function") api.setDatasource(datasource);
            lastDatasourceRef.current = datasource;
          }
          api?.showLoadingOverlay();
          if (typeof api?.refreshInfiniteCache === "function") api.refreshInfiniteCache();
          else api?.purgeInfiniteCache?.();
        }}
      />

      {/* Confirm delete dialog */}
      <Dialog open={confirm.open} onClose={() => setConfirm((c) => ({ ...c, open: false }))}>
        <DialogTitle>Delete record?</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2">
            Are you sure you want to delete the record for{" "}
            <strong>
              {confirm.brand} {confirm.model}
            </strong>{" "}
            (ID {confirm.id})?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm((c) => ({ ...c, open: false }))}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            onClick={() => {
              deleteMutation.mutate(confirm.id, {
                onSuccess: () => {
                  setConfirm((c) => ({ ...c, open: false }));
                },
              });
            }}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
