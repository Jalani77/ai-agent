import { Nav } from "@/components/nav";
import { CourseManager } from "@/components/course-manager";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    include: {
      _count: { select: { assignments: true, documents: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Courses & Materials
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Add syllabi and upload PDFs to power your AI assistant.
          </p>
        </div>
        <CourseManager courses={courses} />
      </main>
    </>
  );
}
