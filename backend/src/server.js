import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dataRoutes from "./routes/data.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res)=> res.json({ ok: true }));
app.use("/api/data", dataRoutes);

const port = Number(process.env.PORT||4000);
app.listen(port, ()=> console.log(`API running on http://localhost:${port}`));

