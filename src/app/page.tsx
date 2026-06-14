import { Nav } from "@/components/nav";
import { Timeline, TimelineStats } from "@/components/timeline";
import { AssignmentForm } from "@/components/assignment-form";
import { FocusPanel } from "@/components/focus-panel";
import { DatabaseClaimBanner, DatabaseError } from "@/components/database-error";
import { prisma } from "@/lib/db";
import { isUsingDemoDatabase } from "@/lib/database-config";
import { withDatabase } from "@/lib/db-health";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let assignments: Array<{
    id: string;
    title: string;
    description: string | null;
    type: string;
    dueDate: Date;
    priority: string;
    completed: boolean;
    course: { name: string; color: string; code: string | null };
  }> = [];
  let courses: Array<{ id: string; name: string }> = [];
  let dbError = false;

  try {
    [assignments, courses] = await withDatabase(() =>
      Promise.all([
        prisma.assignment.findMany({
          include: { course: true },
          orderBy: { dueDate: "asc" },
        }),
        prisma.course.findMany({ select: { id: true, name: true } }),
      ]),
    );
  } catch {
    dbError = true;
  }

  if (dbError) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-7xl flex-1 px-4 py-12">
          <DatabaseError />
        </main>
      </>
    );
  }

  const timelineItems = assignments.map((a) => ({
    ...a,
    dueDate: a.dueDate.toISOString(),
  }));

  return (
    <>
      {isUsingDemoDatabase() && <DatabaseClaimBanner />}
      <Nav />
      <main className="mx-auto max-w-7xl flex-1 px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Command Center
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Your full assignment timeline — {timelineItems.length} item
            {timelineItems.length === 1 ? "" : "s"} tracked.
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

          <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
              <h2 className="mb-4 font-medium text-zinc-200">Quick add</h2>
              <AssignmentForm courses={courses} />
            </div>
            {timelineItems.length === 0 && (
              <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 p-5 text-sm text-zinc-400">
                <p className="font-medium text-zinc-200">Get started fast</p>
                <p className="mt-2">
                  Add a course, paste your iCollege schedule, and assignments
                  will appear here automatically.
                </p>
                <Link
                  href="/courses"
                  className="mt-3 inline-block text-indigo-300 hover:text-indigo-200"
                >
                  Go to Courses →
                </Link>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
