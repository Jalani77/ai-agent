import { prisma } from "@/lib/db";
import { retrieveContext } from "@/lib/rag";
import { formatDueDate, daysUntil } from "@/lib/utils";

export async function generateLocalResponse(query: string): Promise<string> {
  const q = query.toLowerCase().trim();
  const assignments = await prisma.assignment.findMany({
    include: { course: true },
    orderBy: { dueDate: "asc" },
  });
  const upcoming = assignments.filter(
    (a) => !a.completed && daysUntil(a.dueDate) >= 0,
  );
  const overdue = assignments.filter(
    (a) => !a.completed && daysUntil(a.dueDate) < 0,
  );
  const exams = upcoming.filter((a) => a.type === "exam");

  if (
    q.includes("due this week") ||
    q.includes("due soon") ||
    q.includes("upcoming")
  ) {
    const thisWeek = upcoming.filter((a) => daysUntil(a.dueDate) <= 7);
    if (thisWeek.length === 0) {
      return "Nothing due in the next 7 days. Add assignments on the Command Center or upload a syllabus to get started.";
    }
    return (
      `Here are your upcoming deadlines:\n\n` +
      thisWeek
        .map(
          (a) =>
            `• **${a.title}** (${a.course.name}) — ${formatDueDate(a.dueDate)} (${daysUntil(a.dueDate)}d left)`,
        )
        .join("\n")
    );
  }

  if (q.includes("next exam") || q.includes("when is my exam")) {
    const nextExam = exams[0];
    if (!nextExam) {
      return "No upcoming exams on your timeline yet. Add one from the Command Center.";
    }
    return `Your next exam is **${nextExam.title}** for ${nextExam.course.name}, due ${formatDueDate(nextExam.dueDate)} (${daysUntil(nextExam.dueDate)} days away).`;
  }

  if (q.includes("overdue")) {
    if (overdue.length === 0) return "You're all caught up — no overdue assignments.";
    return (
      `You have ${overdue.length} overdue item${overdue.length === 1 ? "" : "s"}:\n\n` +
      overdue
        .map(
          (a) =>
            `• **${a.title}** (${a.course.name}) — was due ${formatDueDate(a.dueDate)}`,
        )
        .join("\n")
    );
  }

  if (
    q.includes("grading") ||
    q.includes("syllabus") ||
    q.includes("policy") ||
    q.includes("late")
  ) {
    const context = await retrieveContext(query, 3);
    const materials = context.split("## Relevant course materials")[1]?.trim();
    if (!materials || materials === "No documents uploaded yet.") {
      return "I don't have syllabus info yet. Go to **Courses** and paste your syllabus or upload a PDF.";
    }
    return `From your course materials:\n\n${materials.slice(0, 1500)}`;
  }

  if (q.includes("how many") || q.includes("total")) {
    return `You have **${assignments.length}** total items on your timeline — **${upcoming.length}** upcoming, **${overdue.length}** overdue, and **${exams.length}** exams still ahead.`;
  }

  const context = await retrieveContext(query, 4);
  const materials = context.split("## Relevant course materials")[1]?.trim();
  const assignmentBlock = context.split("## Relevant course materials")[0];

  if (materials && materials !== "No documents uploaded yet.") {
    return `Here's what I found in your materials:\n\n${materials.slice(0, 1200)}\n\n---\n\n${assignmentBlock.includes("No assignments") ? "Add assignments on the Command Center to track deadlines." : "Check the Command Center timeline for full due dates."}`;
  }

  if (!assignmentBlock.includes("No assignments yet")) {
    return `${assignmentBlock.replace("## Your assignments and exams\n", "Here's your timeline:\n\n")}\n\nUpload syllabi or PDFs under **Courses** so I can answer more detailed questions.`;
  }

  return "I'm running in demo mode (no API keys needed). Add courses and assignments, then ask about due dates, exams, or grading policies from your uploaded materials.";
}
