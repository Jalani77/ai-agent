import { Nav } from "@/components/nav";
import { CourseManager } from "@/components/course-manager";
import { DatabaseClaimBanner, DatabaseError } from "@/components/database-error";
import { prisma } from "@/lib/db";
import { isUsingDemoDatabase } from "@/lib/database-config";
import { withDatabase } from "@/lib/db-health";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  let courses: Array<{
    id: string;
    name: string;
    code: string | null;
    color: string;
    syllabusText: string | null;
    _count?: { assignments: number; documents: number };
  }> = [];
  let dbError = false;

  try {
    courses = await withDatabase(() =>
      prisma.course.findMany({
        include: {
          _count: { select: { assignments: true, documents: true } },
        },
        orderBy: { name: "asc" },
      }),
    );
  } catch {
    dbError = true;
  }

  if (dbError) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-3xl flex-1 px-4 py-12">
          <DatabaseError />
        </main>
      </>
    );
  }

  return (
    <>
      {isUsingDemoDatabase() && <DatabaseClaimBanner />}
      <Nav />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Courses & Materials
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Paste your iCollege schedule or upload a syllabus once — assignments
            and due dates import into your timeline automatically.
          </p>
        </div>
        <CourseManager courses={courses} />
      </main>
    </>
  );
}
