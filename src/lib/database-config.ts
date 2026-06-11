// Demo Postgres — created via `npx create-db`. Claim to keep it permanently:
// https://create-db.prisma.io/claim?projectID=proj_cmq8sx9750rejymf7jfmc535v
const DEMO_DATABASE_URL =
  "postgres://ae3d4cd4bce806965f18352315b320450f741a6011111dbfe58ebb18db3dcfe8:sk_z6xROhqCdjc4cgscwwkLp@db.prisma.io:5432/postgres?sslmode=require";

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? DEMO_DATABASE_URL;
}
