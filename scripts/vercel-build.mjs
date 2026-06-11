import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Use demo DB during build if DATABASE_URL isn't set on Vercel yet
if (!process.env.DATABASE_URL) {
  const config = readFileSync("src/lib/database-config.ts", "utf8");
  const match = config.match(/DEMO_DATABASE_URL\s*=\s*\n?\s*"([^"]+)"/);
  if (match) {
    process.env.DATABASE_URL = match[1];
    console.log("Using demo DATABASE_URL for build migrations.");
  }
}

execSync("npx prisma generate", { stdio: "inherit" });

if (process.env.DATABASE_URL) {
  console.log("Running database migrations...");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} else {
  console.warn("DATABASE_URL not set — skipping migrations.");
}

execSync("npx next build", { stdio: "inherit" });
