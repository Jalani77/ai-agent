import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractAssignmentsFromText } from "@/lib/assignment-extractor";
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
  const name = (formData.get("name") as string) || file?.name || "Document";

  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  let content = textContent?.trim() || "";
  let documentType = "text";

  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    content = await extractDocumentText(file, buffer);
    documentType = file.name.toLowerCase().endsWith(".pdf")
      ? "pdf"
      : file.name.toLowerCase().endsWith(".docx")
        ? "docx"
        : "text";
  }

  if (!content) {
    return NextResponse.json({ error: "No content provided" }, { status: 400 });
  }

  const document = await prisma.document.create({
    data: {
      courseId,
      name,
      content,
      type: documentType,
    },
  });

  const extracted = extractAssignmentsFromText(content);
  const createdAssignments = [];

  for (const item of extracted) {
    const existing = await prisma.assignment.findFirst({
      where: {
        courseId,
        title: item.title,
        dueDate: item.dueDate,
      },
    });

    if (existing) continue;

    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        title: item.title,
        description: `Imported from ${name}. Source: ${item.sourceLine}`,
        type: item.type,
        dueDate: item.dueDate,
        priority: item.priority,
      },
    });
    createdAssignments.push(assignment);
  }

  return NextResponse.json(
    {
      document,
      extractedAssignments: createdAssignments,
      extractedCount: createdAssignments.length,
    },
    { status: 201 },
  );
}
