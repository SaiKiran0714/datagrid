import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRecord } from "../lib/api";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Tooltip,
  Typography,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const fmtInt = (v) =>
  v === null || v === undefined || v === "-" ? "—" : Number(v).toLocaleString();
const fmtEUR = (v) =>
  v === null || v === undefined || v === "-"
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(Number(v));
const yesNoChip = (val) =>
  val === "Yes" || val === true ? (
    <Chip size="small" color="success" icon={<CheckCircleIcon />} label="Yes" />
  ) : (
    <Chip size="small" color="default" icon={<CancelIcon />} label="No" />
  );

export default function DetailPage() {
  const { id } = useParams();
  const nav = useNavigate();

  // Fetch record with React Query - cached for 5 minutes
  const {
    data: record,
    isLoading: loading,
    isError,
  } = useQuery({
    queryKey: ["record", id],
    queryFn: () => getRecord(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id, // Only fetch if id exists
  });

  const title = useMemo(() => {
    if (!record) return "";
    const brand = record.Brand ?? "";
    const model = record.Model ?? "";
    return `${brand} ${model}`.trim();
  }, [record]);

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", height: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!record || isError) {
    return (
      <Stack gap={2}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => nav(-1)}>
          Back
        </Button>
        <Typography color="error">Record not found.</Typography>
      </Stack>
    );
  }

  return (
    <Stack gap={2} sx={{ mx: 10 }}>
      {/* Top bar */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => nav(-1)}>
          Back
        </Button>
        <Chip label={`ID: ${record.id}`} size="small" />
      </Stack>

      {/* Title + price */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "start", sm: "center" }}
          justifyContent="space-between"
          gap={1}
        >
          <Stack>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {title || `Record #${id}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {record.BodyStyle ?? "—"} • {record.PowerTrain ?? "—"} • {record.Seats ?? "—"} seater
            </Typography>
          </Stack>
          <Chip
            color="primary"
            variant="outlined"
            sx={{ fontSize: 16, px: 1.5 }}
            label={fmtEUR(record.PriceEuro)}
          />
        </Stack>
      </Paper>

      {/* Spec groups */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Vehicle
        </Typography>
        <SpecRow k="Brand" v={record.Brand} />
        <SpecRow k="Model" v={record.Model} />
        <SpecRow k="Body Style" v={record.BodyStyle} />
        <SpecRow k="Segment" v={record.Segment} />
        <SpecRow k="Seats" v={record.Seats} />
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Powertrain & Charging
        </Typography>
        <SpecRow k="Power Train" v={record.PowerTrain} />
        <SpecRow k="Plug Type" v={record.PlugType} />
        <SpecRow k="Fast Charge" v={`${fmtInt(record.FastCharge_KmH)} km/h`} />
        <SpecRow k="Rapid Charge" v={yesNoChip(record.RapidCharge)} />
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Commerce
        </Typography>
        <SpecRow k="Price" v={fmtEUR(record.PriceEuro)} />
        <SpecRow k="Date" v={record.Date ? new Date(record.Date).toLocaleDateString() : "—"} />
      </Paper>

      {/* Raw JSON */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Raw JSON</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper
            variant="outlined"
            sx={{ p: 2, position: "relative", bgcolor: "background.default" }}
          >
            <Tooltip title="Copy JSON">
              <IconButton
                size="small"
                sx={{ position: "absolute", top: 8, right: 8 }}
                onClick={() => navigator.clipboard.writeText(JSON.stringify(record, null, 2))}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              }}
            >
              {JSON.stringify(record, null, 2)}
            </pre>
          </Paper>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}

function SpecRow({ k, v }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">
        {k}
      </Typography>
      {
        typeof v === "string" || typeof v === "number" ? (
          <Typography variant="body2">{v}</Typography>
        ) : (
          v
        ) /* allow chips or custom nodes */
      }
    </Stack>
  );
}
