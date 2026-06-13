import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { importAssignmentsFromText } from "@/lib/import-assignments";
import { extractDocumentText } from "@/lib/pdf";

export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");
  const documents = await prisma.document.findMany({
    where: courseId ? { courseId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(documents);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const courseId = formData.get("courseId") as string;
  const file = formData.get("file") as File | null;
  const textContent = formData.get("textContent") as string | null;
  const preview = formData.get("preview") === "true";
  const name = (formData.get("name") as string) || file?.name || "Document";

  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  let content = textContent?.trim() || "";
  let documentType = "text";

  if (file && file.size > 0) {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith(".doc")) {
      return NextResponse.json(
        {
          error:
            "Old .doc files are not supported. Open the file in Word and save as .docx, or copy/paste the schedule text.",
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      content = await extractDocumentText(file, buffer);
    } catch {
      return NextResponse.json(
        {
          error:
            "Could not read that file. Try exporting as PDF or DOCX, or paste the syllabus text instead.",
        },
        { status: 400 },
      );
    }

    documentType = lowerName.endsWith(".pdf")
      ? "pdf"
      : lowerName.endsWith(".docx")
        ? "docx"
        : "text";
  }

  if (!content) {
    return NextResponse.json(
      {
        error:
          file?.name.toLowerCase().endsWith(".pdf")
            ? "This PDF has no readable text (it may be a scanned image). Copy the schedule from iCollege and paste it instead."
            : "No content provided",
      },
      { status: 400 },
    );
  }

  if (preview) {
    const { previewAssignmentsFromText } = await import(
      "@/lib/import-assignments"
    );
    const result = previewAssignmentsFromText(content);
    return NextResponse.json({
      preview: true,
      extracted: result.serialized,
      foundCount: result.count,
      lineCount: result.lineCount,
      charCount: result.charCount,
      contentPreview: content.slice(0, 500),
      message:
        result.count > 0
          ? `Found ${result.count} possible assignment${result.count === 1 ? "" : "s"} in ${name}.`
          : `Read ${name}, but no assignment due dates were detected. Paste the schedule table for better results.`,
    });
  }

  const document = await prisma.document.create({
    data: {
      courseId,
      name,
      content,
      type: documentType,
    },
  });

  const importResult = await importAssignmentsFromText({
    courseId,
    text: content,
    sourceName: name,
  });

  return NextResponse.json(
    {
      document,
      extractedAssignments: importResult.createdAssignments,
      extractedCount: importResult.importedCount,
      foundCount: importResult.foundCount,
      skippedDuplicates: importResult.skippedDuplicates,
      extracted: importResult.serialized,
      message:
        importResult.importedCount > 0
          ? `Imported ${importResult.importedCount} assignment${importResult.importedCount === 1 ? "" : "s"} from ${name}.`
          : importResult.foundCount > 0
            ? `Saved ${name}. Assignments were already in your tracker.`
            : `Saved ${name}, but no due dates were found. Paste the schedule section for better results.`,
    },
    { status: 201 },
  );
}
