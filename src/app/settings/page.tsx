import { Nav } from "@/components/nav";
import { SettingsForm } from "@/components/settings-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 1 } });
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-xl flex-1 px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Settings
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Configure SMS text reminders via Twilio.
          </p>
        </div>
        <SettingsForm initial={settings} />
      </main>
    </>
  );
}
