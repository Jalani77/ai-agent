import Link from "next/link";
import { AlertTriangle, Database, ExternalLink } from "lucide-react";
import { DATABASE_CLAIM_URL } from "@/lib/database-config";

export function DatabaseError({
  title = "Study Command is having trouble saving data",
  message = "The database connection is down, so assignments cannot load or save right now.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-amber-500/30 bg-amber-500/10 p-8">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-amber-500/20 p-3 text-amber-300">
          <Database className="h-6 w-6" />
        </div>
        <div className="space-y-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">{title}</h1>
            <p className="mt-2 text-sm text-zinc-300">{message}</p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-400">
            <p className="font-medium text-zinc-200">To keep your data permanently:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Claim the free database so it does not expire.</li>
              <li>Refresh this page after claiming.</li>
              <li>Add your courses and import your syllabus again.</li>
            </ol>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={DATABASE_CLAIM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Claim database
              <ExternalLink className="h-4 w-4" />
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:border-indigo-500/50"
            >
              Try again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DatabaseClaimBanner() {
  return (
    <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-100">
      <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
      Your assignments are saved to a temporary demo database.{" "}
      <a
        href={DATABASE_CLAIM_URL}
        target="_blank"
        rel="noreferrer"
        className="font-medium underline underline-offset-2 hover:text-white"
      >
        Claim it free
      </a>{" "}
      so your data does not disappear.
    </div>
  );
}
