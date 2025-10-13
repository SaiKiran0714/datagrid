// Global error notification system using Zustand
import { create } from "zustand";

const useErrorStore = create((set) => ({
  error: null,
  showError: (message, details = null) =>
    set({
      error: {
        message,
        details,
        timestamp: Date.now(),
      },
    }),
  clearError: () => set({ error: null }),
}));

export default useErrorStore;
