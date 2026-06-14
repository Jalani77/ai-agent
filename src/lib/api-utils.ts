import { NextResponse } from "next/server";
import { isDatabaseConnectionError } from "@/lib/db-health";

export function databaseErrorResponse(error: unknown) {
  if (isDatabaseConnectionError(error)) {
    return NextResponse.json(
      {
        error:
          "Database is unavailable. Claim the database from the home page banner to keep your data.",
      },
      { status: 503 },
    );
  }

  console.error(error);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}
