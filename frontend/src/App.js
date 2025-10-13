import { Routes, Route, Link } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  CssBaseline,
  FormControlLabel,
  Switch,
  Box,
} from "@mui/material";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import NightlightRoundIcon from "@mui/icons-material/NightlightRound";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import DataGridPage from "./routes/DataGridPage";
import DetailPage from "./routes/DetailPage";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorSnackbar from "./components/ErrorSnackbar";
import { useEffect, useMemo, useState } from "react";
import { applyAgGridThemeMode } from "./theme/agGridTheme";

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("bm-dark-mode");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("bm-dark-mode", JSON.stringify(darkMode));
    } catch (err) {
      // Ignore localStorage errors
    }
    applyAgGridThemeMode(darkMode);
  }, [darkMode]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          ...(darkMode
            ? {
                background: {
                  default: "#0b1622", // deep dark blue for page background
                  paper: "#102437", // slightly lighter dark blue for surfaces
                },
                primary: { main: "#1976d2" },
              }
            : {
                background: {
                  default: "#f2f3f5", // light grey page background
                  paper: "#f7f7f9", // slightly lighter for surfaces
                },
                text: { primary: "#000000" },
              }),
        },
      }),
    [darkMode]
  );
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppBar position="static" color="default">
          <Toolbar>
            <Typography
              component={Link}
              to="/"
              variant="h6"
              sx={{
                color: "inherit",
                fontWeight: "bold",
                textDecoration: "none",
                my: { xs: 1, sm: 2 },
                mx: { xs: 1, sm: 3 },
                p: 0,
              }}
            >
              BMW Generic DataGrid
            </Typography>
            <Box sx={{ flex: 1 }} />
            <FormControlLabel
              control={
                <Switch checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
              }
              label={
                darkMode ? (
                  <NightlightRoundIcon fontSize="small" sx={{ position: "relative", top: "2px" }} />
                ) : (
                  <WbSunnyIcon fontSize="small" sx={{ position: "relative", top: "2px" }} />
                )
              }
              labelPlacement="start"
              sx={{ ml: 1 }}
            />
          </Toolbar>
        </AppBar>

        <Container sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2 }, mx: { xs: 0, sm: 3 } }}>
          <Routes>
            <Route path="/" element={<DataGridPage />} />
            <Route path="/data/:id" element={<DetailPage />} />
          </Routes>
        </Container>

        <ErrorSnackbar />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
