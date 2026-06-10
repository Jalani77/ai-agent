import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatReminderMessage, sendSms } from "@/lib/sms";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings?.smsEnabled || !settings.phoneNumber) {
    return NextResponse.json({ sent: 0, reason: "SMS not configured" });
  }

  const now = new Date();
  const windowEnd = new Date(
    now.getTime() + settings.reminderHoursBefore * 60 * 60 * 1000,
  );

  const dueSoon = await prisma.assignment.findMany({
    where: {
      completed: false,
      reminderSent: false,
      dueDate: { gte: now, lte: windowEnd },
    },
    include: { course: true },
  });

  let sent = 0;
  for (const assignment of dueSoon) {
    const hoursUntil = Math.max(
      1,
      Math.round(
        (assignment.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60),
      ),
    );

    await sendSms(
      settings.phoneNumber,
      formatReminderMessage(
        assignment.title,
        assignment.course.name,
        assignment.dueDate,
        hoursUntil,
      ),
    );

    await prisma.assignment.update({
      where: { id: assignment.id },
      data: { reminderSent: true },
    });
    sent++;
  }

  return NextResponse.json({ sent, checked: dueSoon.length });
}
