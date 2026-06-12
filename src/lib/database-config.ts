// Demo Postgres — created via `npx create-db`. Claim to keep it permanently:
// https://create-db.prisma.io/claim?projectID=proj_cmqba1ks70fbb01dsb0re94na
const DEMO_DATABASE_URL =
  "postgres://194a0f222e8a564cf7892a48b6fb5a60c8ca1df307118429886200cf2ff80b05:sk_dgcvFjPDTllkqeQqAVRWp@db.prisma.io:5432/postgres?sslmode=require";

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? DEMO_DATABASE_URL;
}
