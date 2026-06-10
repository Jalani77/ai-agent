import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractPdfText } from "@/lib/pdf";

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

  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      content = await extractPdfText(buffer);
    } else {
      content = buffer.toString("utf-8");
    }
  }

  if (!content) {
    return NextResponse.json({ error: "No content provided" }, { status: 400 });
  }

  const document = await prisma.document.create({
    data: {
      courseId,
      name,
      content,
      type: file?.name.endsWith(".pdf") ? "pdf" : "text",
    },
  });

  return NextResponse.json(document, { status: 201 });
}
