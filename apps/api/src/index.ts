import "dotenv/config";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "./lib/errors.js";
import { adminAuthRouter } from "./routes/auth.admin.js";
import { customerAuthRouter } from "./routes/auth.customer.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "meili-express-api" });
});

app.use("/api/auth", customerAuthRouter);
app.use("/api/admin", adminAuthRouter);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "invalid_request", details: err.issues });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "internal_error" });
};
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
