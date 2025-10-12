// src/components/FilterAccordion.jsx
import { useMemo, useState, useEffect } from "react";
import {
  Accordion, AccordionSummary, AccordionDetails,
  Box, Stack, TextField, MenuItem, Button, Chip, Link,
  FormControl, Select, InputLabel, OutlinedInput
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const TEXT_OPS = ["contains","equals","startsWith","endsWith","isEmpty"];
const NUM_OPS  = ["greaterThan","lessThan","equals","isEmpty"];
const BOOL_OPS = ["equals","isEmpty"];
const DATE_OPS = ["contains","equals","startsWith","endsWith","isEmpty"]; // keep as text unless backend supports date gt/lt

export default function FilterAccordion({
  columns = [],
  value = [],                 // active filters [{ field, op, value }]
  onChange = () => {},        // call with next filters (parent refetches)
  types = {},                 // { Brand:'text', PriceEuro:'number', RapidCharge:'boolean', Date:'date' }
  defaultOpen = false,
  searchTerm,
  onClearSearch,
  fetchDistinct, // async (field) => string[]
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [brandList, setBrandList] = useState([]);
  const [bodyList, setBodyList] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (columns.includes('Brand') && fetchDistinct) {
          const vals = await fetchDistinct('Brand');
          if (mounted) setBrandList(vals);
        }
        if (columns.includes('BodyStyle') && fetchDistinct) {
          const vals = await fetchDistinct('BodyStyle');
          if (mounted) setBodyList(vals);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, [columns, fetchDistinct]);

  const inferType = (name) => types[name] || "text";
  const opsFor = (t) => (t === "number" ? NUM_OPS : t === "boolean" ? BOOL_OPS : t === "date" ? DATE_OPS : TEXT_OPS);

  // ----- single "composer" row state -----
  const firstField = columns[0] || "";
  const [field, setField] = useState(firstField);
  const [op, setOp] = useState(inferType(firstField) === "number" ? "greaterThan" : inferType(firstField) === "boolean" ? "equals" : "contains");
  const [val, setVal] = useState("");

  const currentType = inferType(field);
  const OPS = opsFor(currentType);

  // When field changes, align default operator to type
  const onFieldChange = (nextField) => {
    setField(nextField);
    const t = inferType(nextField);
  if (t === "number") setOp("greaterThan");
  else if (t === "boolean") setOp("equals");
    else if (!TEXT_OPS.concat(DATE_OPS).includes(op)) setOp("contains");
    setVal("");
  };

  // Add one filter immediately
  const addOne = () => {
    if (!field || !op) return;
    const newFilter = { field, op, value: op === "isEmpty" ? undefined : val };
    // upsert by field (replace existing on same field)
    const idx = value.findIndex(f => f.field === field);
    const next = idx === -1 ? [...value, newFilter] : value.map((f, i) => (i === idx ? newFilter : f));
    onChange(next);
    // reset composer row to keep flow fast
    setVal("");
  };

  // Remove one instantly via chip X
  const removeAt = (i) => {
    const next = value.filter((_, idx) => idx !== i);
    onChange(next);
  };

  const clearAll = () => onChange([]);

  const prettyField = (name) => String(name).replace(/_/g, ' ');
  const formatChipLabel = (f) => {
    const field = prettyField(f.field);
    const t = inferType(f.field);
    const v = f.value;
    const quoted = v !== undefined && v !== "" ? `"${v}"` : undefined;
    switch (f.op) {
      case 'contains': return `${field} contains ${quoted ?? '""'}`;
      case 'notContains': return `${field} does not contain ${quoted ?? '""'}`;
      case 'equals':
        if (t === 'boolean') return `${field} is ${v}`;
        return `${field} equals ${quoted ?? '""'}`;
      case 'notEquals':
      case 'notEqualsNumber':
        if (t === 'boolean') return `${field} is not ${v}`;
        return `${field} does not equal ${quoted ?? '""'}`;
      case 'startsWith': return `${field} starts with ${quoted ?? '""'}`;
      case 'endsWith': return `${field} ends with ${quoted ?? '""'}`;
      case 'isEmpty': return `${field} is empty`;
      case 'notEmpty': return `${field} is not empty`;
      case 'gt':
      case 'greaterThan': return `${field} greater than ${v ?? ''}`;
      case 'lt':
      case 'lessThan': return `${field} less than ${v ?? ''}`;
      case 'in': return `${field} in (${(Array.isArray(f.values)?f.values:[]).join(', ')})`;
      default: return `${field}`;
    }
  };

  // helper to upsert 'in' filter
  const upsertIn = (field, values) => {
    const next = value.filter(f => f.field !== field);
    if (Array.isArray(values) && values.length) {
      next.push({ field, op: 'in', values });
    }
    onChange(next);
  };

  return (
    <Accordion
      expanded={open}
      onChange={(_, e) => setOpen(e)}
      disableGutters
      square
      sx={{
        borderRadius:"10px",
        boxShadow: "none",
        "&:before": { display: "none" },
        background: "grey.50",
        mt: 1,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ px: 1, mb:1, minHeight: 36, "& .MuiAccordionSummary-content": { my: 0, alignItems: "center" } }}
      >
        <Link component="button" underline="hover" sx={{ fontSize: 14 }}>
          Advanced filters
        </Link>

        {/* Summary chips (search + each filter) */}
        <Box sx={{ ml: 1, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {searchTerm && (
            <Chip
              size="small"
              label={`Search: "${searchTerm}"`}
              color="primary"
              onDelete={onClearSearch}
            />
          )}
          {value.flatMap((f, i) => {
            if (f.op === 'in' && Array.isArray(f.values)) {
              return f.values.map((v, j) => (
                <Chip
                  key={`${f.field}-${v}-${i}-${j}`}
                  size="small"
                  label={`${f.field} = "${v}"`}
                  onDelete={() => {
                    const rest = f.values.filter(x => x !== v);
                    const next = [...value];
                    if (rest.length) next[i] = { ...f, values: rest };
                    else next.splice(i, 1);
                    onChange(next);
                  }}
                />
              ));
            }
            return [(
              <Chip
                key={`${f.field}-${i}`}
                size="small"
                label={formatChipLabel(f)}
                onDelete={() => removeAt(i)}
              />
            )];
          })}
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2 ,pb:3}}>
        {/* Quick multi-selects for Brand and BodyStyle */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
          {columns.includes('Brand') && (
            <FormControl fullWidth size="small">
              <InputLabel id="brand-multi">Brand</InputLabel>
              <Select
                labelId="brand-multi"
                multiple
                label="Brand"
                value={(value.find(f => f.field==='Brand' && f.op==='in')?.values) || []}
                onChange={(e) => upsertIn('Brand', e.target.value)}
                input={<OutlinedInput label="Brand" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((sel) => (
                      <Chip
                        key={sel}
                        size="small"
                        label={sel}
                        onMouseDown={(event) => { event.stopPropagation(); }}
                        onDelete={() => {
                          const current = (value.find(f => f.field==='Brand' && f.op==='in')?.values) || [];
                          upsertIn('Brand', current.filter(v => v !== sel));
                        }}
                      />
                    ))}
                  </Box>
                )}
              >
                {brandList.map((b) => (
                  <MenuItem key={b} value={b}>{b}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {columns.includes('BodyStyle') && (
            <FormControl fullWidth size="small">
              <InputLabel id="bodystyle-multi">BodyStyle</InputLabel>
              <Select
                labelId="bodystyle-multi"
                multiple
                label="BodyStyle"
                value={(value.find(f => f.field==='BodyStyle' && f.op==='in')?.values) || []}
                onChange={(e) => upsertIn('BodyStyle', e.target.value)}
                input={<OutlinedInput label="BodyStyle" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((sel) => (
                      <Chip
                        key={sel}
                        size="small"
                        label={sel}
                        onMouseDown={(event) => { event.stopPropagation(); }}
                        onDelete={() => {
                          const current = (value.find(f => f.field==='BodyStyle' && f.op==='in')?.values) || [];
                          upsertIn('BodyStyle', current.filter(v => v !== sel));
                        }}
                      />
                    ))}
                  </Box>
                )}
              >
                {bodyList.map((b) => (
                  <MenuItem key={b} value={b}>{b}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
        {/* Clear-all on top-right */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
          <Button size="small" onClick={clearAll}>Clear all filters</Button>
        </Box>

  {/* Single composer row: Field · Operator · Value · Add */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1.3fr auto", gap: 1, alignItems: "center" }}>
          <TextField
            select size="small" label="Field" value={field}
            onChange={(e) => onFieldChange(e.target.value)}
          >
            {columns.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>

          <TextField
            select size="small" label="Operator" value={op}
            onChange={(e) => setOp(e.target.value)}
          >
            {OPS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </TextField>

          {op !== "isEmpty" ? (
            currentType === "boolean" ? (
              <FormControl size="small">
                <InputLabel id="bool-val">Value</InputLabel>
                <Select
                  labelId="bool-val" label="Value"
                  value={val ?? ""}
                  onChange={(e) => setVal(e.target.value)}
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            ) : currentType === "number" ? (
              <TextField size="small" label="Value" type="number" value={val ?? ""} onChange={(e) => setVal(e.target.value)} />
            ) : (
              <TextField size="small" label="Value" value={val ?? ""} onChange={(e) => setVal(e.target.value)} />
            )
          ) : <Box />}

          <Button variant="contained" onClick={addOne}>Add</Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
