import { prisma } from "@/lib/db";

export function formatReminderMessage(
  title: string,
  courseName: string,
  dueDate: Date,
  hoursUntil: number,
) {
  const when =
    hoursUntil <= 1
      ? "in less than an hour"
      : hoursUntil < 24
        ? `in ${hoursUntil} hour${hoursUntil === 1 ? "" : "s"}`
        : `on ${dueDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`;

  return `"${title}" (${courseName}) is due ${when}.`;
}

export async function getDueSoonAssignments() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const enabled = settings?.smsEnabled ?? true;
  const hoursBefore = settings?.reminderHoursBefore ?? 24;

  if (!enabled) return [];

  const now = new Date();
  const windowEnd = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);

  return prisma.assignment.findMany({
    where: {
      completed: false,
      dueDate: { gte: now, lte: windowEnd },
    },
    include: { course: true },
    orderBy: { dueDate: "asc" },
  });
}
