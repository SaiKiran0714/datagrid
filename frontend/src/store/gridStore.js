import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Zustand store for grid UI state
// Eliminates prop drilling and keeps search, filters, total in sync
const useGridStore = create(
  devtools(
    (set) => ({
      // Search
      q: undefined,
      caseSensitive: false,
      
      // Filters (API format: [{field, op, value/values}])
      filters: [],
      
      // Total records count
      total: null,
      
      // Actions
      setQ: (q) => set({ q }),
      setCaseSensitive: (caseSensitive) => set({ caseSensitive }),
      setFilters: (filters) => set({ filters }),
      setTotal: (total) => set({ total }),
      
      // Convenience: clear search
      clearSearch: () => set({ q: undefined }),
      
      // Convenience: clear all filters
      clearAllFilters: () => set({ filters: [] }),
      
      // Reset everything
      reset: () => set({ q: undefined, caseSensitive: false, filters: [], total: null }),
    }),
    { name: 'GridStore' } // DevTools name
  )
);

export default useGridStore;
