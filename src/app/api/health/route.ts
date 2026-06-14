import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db-health";

export async function GET() {
  const health = await checkDatabaseHealth();
  return NextResponse.json(health, {
    status: health.healthy ? 200 : 503,
  });
}
