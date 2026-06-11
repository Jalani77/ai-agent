import { NextResponse } from "next/server";
import { formatReminderMessage, getDueSoonAssignments } from "@/lib/notifications";

export async function GET() {
  const dueSoon = await getDueSoonAssignments();
  const now = Date.now();

  const notifications = dueSoon.map((a) => {
    const hoursUntil = Math.max(
      1,
      Math.round((a.dueDate.getTime() - now) / (1000 * 60 * 60)),
    );
    return {
      id: a.id,
      title: a.title,
      course: a.course.name,
      dueDate: a.dueDate.toISOString(),
      type: a.type,
      message: formatReminderMessage(
        a.title,
        a.course.name,
        a.dueDate,
        hoursUntil,
      ),
    };
  });

  return NextResponse.json({ notifications, count: notifications.length });
}
