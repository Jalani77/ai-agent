import { prisma } from "@/lib/db";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function scoreChunk(queryTokens: string[], chunk: string): number {
  const chunkTokens = new Set(tokenize(chunk));
  return queryTokens.reduce(
    (score, token) => score + (chunkTokens.has(token) ? 1 : 0),
    0,
  );
}

function chunkText(text: string, size = 1200, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + size));
    start += size - overlap;
  }
  return chunks.filter((c) => c.trim().length > 50);
}

export async function retrieveContext(query: string, limit = 6): Promise<string> {
  const courses = await prisma.course.findMany({
    include: { documents: true },
  });

  const assignments = await prisma.assignment.findMany({
    include: { course: true },
    orderBy: { dueDate: "asc" },
  });

  const queryTokens = tokenize(query);
  const scored: { text: string; score: number }[] = [];

  for (const course of courses) {
    if (course.syllabusText) {
      for (const chunk of chunkText(course.syllabusText)) {
        scored.push({
          text: `[${course.name} Syllabus]\n${chunk}`,
          score: scoreChunk(queryTokens, chunk) + 2,
        });
      }
    }
    for (const doc of course.documents) {
      for (const chunk of chunkText(doc.content)) {
        scored.push({
          text: `[${course.name} - ${doc.name}]\n${chunk}`,
          score: scoreChunk(queryTokens, chunk),
        });
      }
    }
  }

  const assignmentSummary = assignments
    .map(
      (a) =>
        `- ${a.title} (${a.type}) for ${a.course.name}, due ${a.dueDate.toISOString()}`,
    )
    .join("\n");

  const topChunks = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.text);

  return [
    "## Your assignments and exams",
    assignmentSummary || "No assignments yet.",
    "",
    "## Relevant course materials",
    topChunks.length > 0 ? topChunks.join("\n\n---\n\n") : "No documents uploaded yet.",
  ].join("\n");
}
