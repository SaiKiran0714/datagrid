import React from "react";

export default function CustomLoadingCellRenderer({ loadingMessage = "Loading..." }) {
  return (
    <div
      className="ag-custom-loading-cell"
      style={{
        paddingLeft: "10px",
        lineHeight: "25px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <i className="fas fa-spinner fa-pulse" aria-hidden />
      <span>{loadingMessage}</span>
    </div>
  );
}
