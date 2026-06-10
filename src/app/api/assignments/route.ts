import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const assignmentSchema = z.object({
  courseId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["assignment", "exam", "quiz", "project"]).default("assignment"),
  dueDate: z.string().datetime(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export async function GET() {
  const assignments = await prisma.assignment.findMany({
    include: { course: true },
    orderBy: { dueDate: "asc" },
  });
  return NextResponse.json(assignments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const assignment = await prisma.assignment.create({
    data: {
      ...parsed.data,
      dueDate: new Date(parsed.data.dueDate),
    },
    include: { course: true },
  });
  return NextResponse.json(assignment, { status: 201 });
}
