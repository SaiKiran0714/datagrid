import React, { useEffect, useState } from "react";
import { Box, TextField, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

export default function SearchBar({ initialValue = "", onSearch }) {
  const [term, setTerm] = useState(initialValue);

  // keep local state in sync if parent updates initialValue
  useEffect(() => {
    setTerm(initialValue);
  }, [initialValue]);

  const doSearch = () => {
    const v = term.trim();
    onSearch?.(v || undefined);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doSearch();
  };

  const handleClear = () => {
    setTerm("");
    onSearch?.(undefined);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", gap: 1 }}>
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        placeholder="Search…"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            // let form submit handle it, but avoid double-submit in some browsers
            // e.preventDefault();
          }
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                size="small"
                edge="end"
                aria-label="search"
                onClick={doSearch}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                edge="end"
                aria-label="clear"
                onClick={handleClear}
                sx={{ ml: 0.5, visibility: term ? "visible" : "hidden" }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
}
