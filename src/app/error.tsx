"use client";

import { useEffect } from "react";
import { Nav } from "@/components/nav";
import { DatabaseError } from "@/components/database-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl flex-1 px-4 py-12">
        <DatabaseError
          message={
            error.name === "DatabaseUnavailableError"
              ? "The database connection expired or is unreachable, so your assignments cannot load."
              : "Something went wrong while loading this page."
          }
        />
        <div className="mt-6 text-center">
          <button
            onClick={reset}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:border-indigo-500/50"
          >
            Reload page
          </button>
        </div>
      </main>
    </>
  );
}
