import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dataRoutes from "./routes/data.js";
import { runImport } from './lib/csvImport.js';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res)=> res.json({ ok: true }));
app.use("/api/data", dataRoutes);
app.get("/api/admin/import-data", async (req, res) => {
  try {
    // Ensure your csvImport.js logic is wrapped in a function you can call
    await runImport('../data.csv'); 
    res.json({ message: "Import successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.PORT||4000);
app.listen(port, ()=> console.log(`API running on http://localhost:${port}`));

