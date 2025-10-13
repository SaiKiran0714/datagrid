// Shared AG Grid theme with light-grey and dark-grey variants
import { themeQuartz } from "ag-grid-community";

// Define a quartz theme with two named modes. We'll switch between them
// by setting document.body.dataset.agThemeMode to one of these names.
export const agGridTheme = themeQuartz
  .withParams(
    {
      // Light Grey
      backgroundColor: "#f2f3f5",
      foregroundColor: "#000000",
      browserColorScheme: "light",
    },
    "light-grey"
  )
  .withParams(
    {
      // Dark Blue
      backgroundColor: "#0d1b2a",
      foregroundColor: "#ffffffcc",
      browserColorScheme: "dark",
    },
    "dark-blue"
  );

export function applyAgGridThemeMode(darkEnabled) {
  if (typeof document === "undefined") return;
  document.body.dataset.agThemeMode = darkEnabled ? "dark-blue" : "light-grey";
}
