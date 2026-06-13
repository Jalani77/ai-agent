import { prisma } from "@/lib/db";
import {
  extractAssignmentsFromText,
  serializeExtractedAssignments,
  type ExtractedAssignment,
} from "@/lib/assignment-extractor";

type ImportOptions = {
  courseId: string;
  text: string;
  sourceName?: string;
  selectedTitles?: string[];
};

export function previewAssignmentsFromText(text: string) {
  const extracted = extractAssignmentsFromText(text);
  return {
    extracted,
    serialized: serializeExtractedAssignments(extracted),
    count: extracted.length,
    lineCount: text.split(/\r?\n/).filter((line) => line.trim()).length,
    charCount: text.length,
  };
}

function shouldImportItem(
  item: ExtractedAssignment,
  selectedTitles?: string[],
) {
  if (!selectedTitles || selectedTitles.length === 0) return true;
  return selectedTitles.includes(item.title);
}

export async function importAssignmentsFromText({
  courseId,
  text,
  sourceName = "Imported syllabus",
  selectedTitles,
}: ImportOptions) {
  const { extracted } = previewAssignmentsFromText(text);
  const createdAssignments = [];
  let skippedDuplicates = 0;
  let skippedUnselected = 0;

  for (const item of extracted) {
    if (!shouldImportItem(item, selectedTitles)) {
      skippedUnselected += 1;
      continue;
    }

    const existing = await prisma.assignment.findFirst({
      where: {
        courseId,
        title: item.title,
        dueDate: item.dueDate,
      },
    });

    if (existing) {
      skippedDuplicates += 1;
      continue;
    }

    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        title: item.title,
        description: `Imported from ${sourceName}. Source: ${item.sourceLine}`,
        type: item.type,
        dueDate: item.dueDate,
        priority: item.priority,
      },
    });
    createdAssignments.push(assignment);
  }

  return {
    extracted,
    serialized: serializeExtractedAssignments(extracted),
    createdAssignments,
    importedCount: createdAssignments.length,
    skippedDuplicates,
    skippedUnselected,
    foundCount: extracted.length,
  };
}
