import React, { useState } from "react";
import { Box, TextField, Button } from "@mui/material";

export default function SearchBar({ initialValue = "", onSearch }) {
  const [term, setTerm] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = term.trim();
    onSearch?.(v || undefined);
    setTerm(""); // clear the box so user sees it's applied
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display:"flex", gap: 1 }}>
      <TextField
        fullWidth
        size="small"
        label="Search across all fields"
        value={term}
        onChange={(e)=> setTerm(e.target.value)}
      />
      <Button type="submit" variant="contained">Search</Button>
    </Box>
  );
}
