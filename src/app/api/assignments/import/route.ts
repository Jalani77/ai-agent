import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  importAssignmentsFromText,
  previewAssignmentsFromText,
} from "@/lib/import-assignments";

const importSchema = z.object({
  courseId: z.string().min(1),
  textContent: z.string().min(1),
  sourceName: z.string().optional(),
  preview: z.boolean().optional(),
  selectedTitles: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = importSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { courseId, textContent, sourceName, preview, selectedTitles } =
    parsed.data;

  if (preview) {
    const result = previewAssignmentsFromText(textContent);
    return NextResponse.json({
      preview: true,
      extracted: result.serialized,
      foundCount: result.count,
      lineCount: result.lineCount,
      charCount: result.charCount,
      message:
        result.count > 0
          ? `Found ${result.count} possible assignment${result.count === 1 ? "" : "s"}.`
          : "No assignment due dates found. Try pasting the schedule table from iCollege or a clearer syllabus section.",
    });
  }

  const result = await importAssignmentsFromText({
    courseId,
    text: textContent,
    sourceName,
    selectedTitles,
  });

  return NextResponse.json(
    {
      importedCount: result.importedCount,
      foundCount: result.foundCount,
      skippedDuplicates: result.skippedDuplicates,
      skippedUnselected: result.skippedUnselected,
      extracted: result.serialized,
      createdAssignments: result.createdAssignments,
      message:
        result.importedCount > 0
          ? `Added ${result.importedCount} assignment${result.importedCount === 1 ? "" : "s"} to your tracker.`
          : result.foundCount > 0
            ? "Found assignments, but they were already in your tracker."
            : "No assignment due dates found in that text.",
    },
    { status: 201 },
  );
}
