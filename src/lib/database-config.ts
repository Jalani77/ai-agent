// Demo Postgres — created via `npx create-db`. Claim to keep it permanently:
// https://create-db.prisma.io/claim?projectID=proj_cmqe7rzc919kq01ds6wekiqzo
export const DATABASE_CLAIM_URL =
  "https://create-db.prisma.io/claim?projectID=proj_cmqe7rzc919kq01ds6wekiqzo";

const DEMO_DATABASE_URL =
  "postgres://d5051465b242a11892809918a5c1bf4e204666e54d0c5fed6afef54aff15fae2:sk_84PoEqb1i-lK74IhWZj0G@db.prisma.io:5432/postgres?sslmode=require";

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? DEMO_DATABASE_URL;
}

export function isUsingDemoDatabase(): boolean {
  return !process.env.DATABASE_URL;
}
