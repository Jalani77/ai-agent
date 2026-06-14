import { prisma } from "@/lib/db";
import { DATABASE_CLAIM_URL } from "@/lib/database-config";

export class DatabaseUnavailableError extends Error {
  constructor(message = "Database is temporarily unavailable") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

export function isDatabaseConnectionError(error: unknown) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes("failed to identify") ||
    message.includes("connection") ||
    message.includes("econnrefused") ||
    message.includes("timeout") ||
    message.includes("password authentication failed") ||
    message.includes("can't reach database") ||
    message.includes("p1001") ||
    message.includes("p1017")
  );
}

export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true as const };
  } catch (error) {
    return {
      healthy: false as const,
      message: isDatabaseConnectionError(error)
        ? "The database connection expired or is unreachable."
        : "The database returned an unexpected error.",
      claimUrl: DATABASE_CLAIM_URL,
    };
  }
}

export async function withDatabase<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      throw new DatabaseUnavailableError();
    }
    throw error;
  }
}
