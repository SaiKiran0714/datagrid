import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Zustand store for grid UI state
// Eliminates prop drilling and keeps search, filters, total in sync
const useGridStore = create(
  devtools(
    (set) => ({
      // Search
      q: undefined,

      // Filters (API format: [{field, op, value/values}])
      filters: [],

      // Total records count
      total: null,

      // Currently showing records count
      showing: 0,

      // Actions
      setQ: (q) => set({ q }),
      setFilters: (filters) => set({ filters }),
      setTotal: (total) => set({ total }),
      setShowing: (showing) => set({ showing }),

      // Convenience: clear search
      clearSearch: () => set({ q: undefined }),

      // Convenience: clear all filters
      clearAllFilters: () => set({ filters: [] }),

      // Reset everything
      reset: () => set({ q: undefined, filters: [], total: null, showing: 0 }),
    }),
    { name: "GridStore" } // DevTools name
  )
);

export default useGridStore;
