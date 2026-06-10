import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const courseSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  color: z.string().optional(),
  syllabusText: z.string().optional(),
});

export async function GET() {
  const courses = await prisma.course.findMany({
    include: {
      _count: { select: { assignments: true, documents: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = courseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const course = await prisma.course.create({ data: parsed.data });
  return NextResponse.json(course, { status: 201 });
}
