import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { databaseErrorResponse } from "@/lib/api-utils";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(["assignment", "exam", "quiz", "project"]).optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  completed: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = {
      ...parsed.data,
      ...(parsed.data.dueDate ? { dueDate: new Date(parsed.data.dueDate) } : {}),
    };

    const assignment = await prisma.assignment.update({
      where: { id },
      data,
      include: { course: true },
    });
    return NextResponse.json(assignment);
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.assignment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
