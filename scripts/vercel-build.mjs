import { execSync } from "node:child_process";

execSync("npx prisma generate", { stdio: "inherit" });

if (process.env.DATABASE_URL) {
  console.log("Running database migrations...");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} else {
  console.warn(
    "DATABASE_URL not set — skipping migrations. Add a Postgres URL in Vercel env vars.",
  );
}

execSync("npx next build", { stdio: "inherit" });
