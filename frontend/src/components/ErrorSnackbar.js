// Global Error Snackbar Component
import { Snackbar, Alert, AlertTitle, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import useErrorStore from "../store/errorStore";

export default function ErrorSnackbar() {
  const error = useErrorStore((state) => state.error);
  const clearError = useErrorStore((state) => state.clearError);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    clearError();
  };

  return (
    <Snackbar
      open={!!error}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        severity="error"
        variant="filled"
        onClose={handleClose}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <AlertTitle>Error</AlertTitle>
        {error?.message || "An unexpected error occurred"}
        {process.env.NODE_ENV === "development" && error?.details && (
          <div style={{ fontSize: "0.875rem", marginTop: 4, opacity: 0.9 }}>{error.details}</div>
        )}
      </Alert>
    </Snackbar>
  );
}
