import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

  if (url.startsWith("file:")) {
    const adapter = new PrismaBetterSqlite3({ url });
    return new PrismaClient({ adapter });
  }

  const pool = new pg.Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, reminderHoursBefore: 24, smsEnabled: true },
  });

  const existingCourses = await prisma.course.count();
  if (existingCourses > 0) {
    console.log("Database already seeded.");
    return;
  }

  const cs = await prisma.course.create({
    data: {
      id: "seed-cs",
      name: "Introduction to Computer Science",
      code: "CS 101",
      color: "#6366f1",
      syllabusText: `CS 101 Syllabus
Grading: 40% assignments, 30% midterm, 30% final exam.
Late policy: 10% deduction per day, max 3 days late.
Office hours: Tuesdays 2-4pm.`,
    },
  });

  const math = await prisma.course.create({
    data: {
      id: "seed-math",
      name: "Calculus II",
      code: "MATH 201",
      color: "#8b5cf6",
      syllabusText: `MATH 201 Syllabus
Grading: 25% homework, 25% quizzes, 50% exams (2 midterms + final).
No late homework accepted.`,
    },
  });

  const now = Date.now();
  const assignments = [
    {
      courseId: cs.id,
      title: "Problem Set 1: Variables & Loops",
      type: "assignment",
      dueDate: new Date(now + 2 * 24 * 60 * 60 * 1000),
      priority: "medium",
    },
    {
      courseId: cs.id,
      title: "Midterm Exam",
      type: "exam",
      dueDate: new Date(now + 14 * 24 * 60 * 60 * 1000),
      priority: "high",
    },
    {
      courseId: math.id,
      title: "Integration Techniques Quiz",
      type: "quiz",
      dueDate: new Date(now + 5 * 24 * 60 * 60 * 1000),
      priority: "medium",
    },
    {
      courseId: math.id,
      title: "Homework 3: Series Convergence",
      type: "assignment",
      dueDate: new Date(now + 7 * 24 * 60 * 60 * 1000),
      priority: "low",
    },
  ];

  for (const a of assignments) {
    await prisma.assignment.create({ data: a });
  }

  console.log("Seed data created.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
