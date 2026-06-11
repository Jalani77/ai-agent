import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDueSoonAssignments } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dueSoon = await getDueSoonAssignments();
  const unsent = dueSoon.filter((a) => !a.reminderSent);

  for (const assignment of unsent) {
    await prisma.assignment.update({
      where: { id: assignment.id },
      data: { reminderSent: true },
    });
  }

  return NextResponse.json({
    marked: unsent.length,
    checked: dueSoon.length,
    mode: "in-app-notifications",
  });
}
