import { Nav } from "@/components/nav";
import { SettingsForm } from "@/components/settings-form";
import { DatabaseClaimBanner, DatabaseError } from "@/components/database-error";
import { prisma } from "@/lib/db";
import { isUsingDemoDatabase, DATABASE_CLAIM_URL } from "@/lib/database-config";
import { withDatabase } from "@/lib/db-health";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let settings: Awaited<ReturnType<typeof prisma.settings.findUnique>> = null;
  let dbError = false;

  try {
    settings = await withDatabase(async () => {
      let current = await prisma.settings.findUnique({ where: { id: 1 } });
      if (!current) {
        current = await prisma.settings.create({ data: { id: 1 } });
      }
      return current;
    });
  } catch {
    dbError = true;
  }

  if (dbError || !settings) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-xl flex-1 px-4 py-12">
          <DatabaseError />
        </main>
      </>
    );
  }

  return (
    <>
      {isUsingDemoDatabase() && <DatabaseClaimBanner />}
      <Nav />
      <main className="mx-auto max-w-xl flex-1 px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Settings
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Configure in-app and browser notifications — no API keys needed.
          </p>
        </div>

        {isUsingDemoDatabase() && (
          <div className="mb-6 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm text-zinc-300">
            <p className="font-medium text-zinc-100">Keep your assignments saved</p>
            <p className="mt-1">
              Your courses and due dates are stored in a free demo database. Claim
              it once so your data does not expire.
            </p>
            <a
              href={DATABASE_CLAIM_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-indigo-300 hover:text-indigo-200"
            >
              Claim database →
            </a>
          </div>
        )}

        <SettingsForm initial={settings} />
      </main>
    </>
  );
}
