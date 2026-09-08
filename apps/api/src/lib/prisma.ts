import { PrismaClient } from "../generated/prisma/client.js";

// One client for the process — Prisma pools connections internally, and
// re-instantiating per-request would exhaust Neon's pooled connection slots.
export const prisma = new PrismaClient();

// Derived (not imported) from $transaction's own signature — the new
// "prisma-client" generator doesn't export a `Prisma.TransactionClient`
// name the way prisma-client-js did.
export type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
