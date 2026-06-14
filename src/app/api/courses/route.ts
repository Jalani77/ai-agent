import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { importAssignmentsFromText } from "@/lib/import-assignments";
import { z } from "zod";
import { databaseErrorResponse } from "@/lib/api-utils";

const courseSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  color: z.string().optional(),
  syllabusText: z.string().optional(),
});

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: { select: { assignments: true, documents: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(courses);
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = courseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { syllabusText, ...courseData } = parsed.data;
    const course = await prisma.course.create({
      data: {
        ...courseData,
        syllabusText: syllabusText?.trim() || null,
      },
    });

    let importSummary = null;

    if (syllabusText?.trim()) {
      await prisma.document.create({
        data: {
          courseId: course.id,
          name: `${course.name} syllabus`,
          content: syllabusText.trim(),
          type: "text",
        },
      });

      const importResult = await importAssignmentsFromText({
        courseId: course.id,
        text: syllabusText.trim(),
        sourceName: `${course.name} syllabus`,
      });

      importSummary = {
        foundCount: importResult.foundCount,
        importedCount: importResult.importedCount,
        message:
          importResult.importedCount > 0
            ? `Auto-imported ${importResult.importedCount} assignment${importResult.importedCount === 1 ? "" : "s"} from your pasted syllabus.`
            : importResult.foundCount > 0
              ? "Found assignments in your syllabus, but they were already saved."
              : "Course created. Paste a schedule table or upload a syllabus to import due dates.",
      };
    }

    const courseWithCounts = await prisma.course.findUnique({
      where: { id: course.id },
      include: {
        _count: { select: { assignments: true, documents: true } },
      },
    });

    return NextResponse.json(
      {
        ...courseWithCounts,
        importSummary,
      },
      { status: 201 },
    );
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
