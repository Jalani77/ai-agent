import { Nav } from "@/components/nav";
import { Timeline, TimelineStats } from "@/components/timeline";
import { AssignmentForm } from "@/components/assignment-form";
import { FocusPanel } from "@/components/focus-panel";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [assignments, courses] = await Promise.all([
    prisma.assignment.findMany({
      include: { course: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.course.findMany({ select: { id: true, name: true } }),
  ]);

  const timelineItems = assignments.map((a) => ({
    ...a,
    dueDate: a.dueDate.toISOString(),
  }));

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl flex-1 px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Command Center
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Your full assignment timeline — numbered 1 to {timelineItems.length || "∞"}.
          </p>
        </div>

        <TimelineStats items={timelineItems} />
        <FocusPanel items={timelineItems} />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <section>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-500">
              Timeline
            </h2>
            <Timeline items={timelineItems} />
          </section>

          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
              <h2 className="mb-4 font-medium text-zinc-200">Quick add</h2>
              <AssignmentForm courses={courses} />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
