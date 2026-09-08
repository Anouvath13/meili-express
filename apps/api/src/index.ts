import "dotenv/config";
import cors from "cors";
import express from "express";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "meili-express-api" });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
