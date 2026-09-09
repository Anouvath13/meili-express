import "dotenv/config";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import cron from "node-cron";
import { ZodError } from "zod";
import { AppError } from "./lib/errors.js";
import { resetExpiredPoints } from "./lib/points.js";
import { adminAccountRouter } from "./routes/admin.account.js";
import { adminBillsRouter } from "./routes/admin.bills.js";
import { adminCmsRouter } from "./routes/admin.cms.js";
import { adminConfigRouter } from "./routes/admin.config.js";
import { adminNotificationsRouter } from "./routes/admin.notifications.js";
import { adminReferralsRouter } from "./routes/admin.referrals.js";
import { adminStaffRouter } from "./routes/admin.staff.js";
import { adminAuthRouter } from "./routes/auth.admin.js";
import { customerAuthRouter } from "./routes/auth.customer.js";
import { customerRouter } from "./routes/customer.js";
import { publicRouter } from "./routes/public.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

// Render (and most PaaS hosts) sit behind a reverse proxy — without this,
// express-rate-limit and req.ip both see the proxy's IP instead of the
// client's, so every request gets bucketed together.
app.set("trust proxy", 1);

app.use(helmet());

// CORS_ORIGIN is a comma-separated allowlist (set in production to the
// deployed web app's URL). Unset in dev, which falls back to reflecting any
// origin so localhost works without config.
const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : true }));
app.use(express.json());

// General abuse safety net across the whole API...
app.use(
  rateLimit({
    windowMs: 15 * 60_000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// ...and a much tighter one specifically for the auth surface (login, OTP
// send/verify, register, password reset) — these are the endpoints a
// brute-force or OTP-spam attempt would actually hit.
const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "พยายามมากเกินไป กรุณาลองใหม่ในอีกสักครู่", code: "rate_limited" },
});
customerAuthRouter.use(authLimiter);
adminAuthRouter.use(authLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "meili-express-api" });
});

// Every router below applies its own auth middleware per-route (never as a
// blanket `router.use(...)`) — see customer.ts's comment for why: a
// router-wide auth guard swallows sibling routers' unauthenticated routes
// too when mount prefixes overlap, regardless of registration order. (The
// authLimiter above is exempt from that rule — a rate limiter that isn't
// tripped calls next() normally, so it can't swallow a sibling router the
// way an auth failure's next(err) does.)
app.use("/api/auth", customerAuthRouter);
app.use("/api/admin", adminAuthRouter);
app.use("/api/admin", adminAccountRouter);
app.use("/api/admin", adminConfigRouter);
app.use("/api/admin", adminCmsRouter);
app.use("/api/admin", adminNotificationsRouter);
app.use("/api/admin", adminStaffRouter);
app.use("/api/admin", adminBillsRouter);
app.use("/api/admin", adminReferralsRouter);
app.use("/api", customerRouter);
app.use("/api", publicRouter);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "invalid_request", details: err.issues });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "internal_error" });
};
app.use(errorHandler);

// Backend Design Document §2 — annual points reset, 1 Jan at 01:00.
cron.schedule("0 1 1 1 *", () => {
  resetExpiredPoints().catch((err) => console.error("[points] Annual reset failed:", err));
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
