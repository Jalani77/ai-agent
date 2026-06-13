"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { SyllabusImporter } from "@/components/syllabus-importer";

type Course = {
  id: string;
  name: string;
  code?: string | null;
  color: string;
  syllabusText?: string | null;
  _count?: { assignments: number; documents: number };
};

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

export function CourseManager({ courses: initial }: { courses: Course[] }) {
  const router = useRouter();
  const [courses, setCourses] = useState(initial);
  const [form, setForm] = useState({
    name: "",
    code: "",
    color: COLORS[0],
    syllabusText: "",
  });
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function addCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;

    setCreating(true);
    setCreateMessage("Creating course...");

    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const course = await res.json();
    setCreating(false);

    if (!res.ok) {
      setCreateMessage(course.error ?? "Could not create course.");
      return;
    }

    setCourses([
      ...courses,
      {
        ...course,
        _count: course._count ?? { assignments: 0, documents: 0 },
      },
    ]);
    setForm({ name: "", code: "", color: COLORS[0], syllabusText: "" });
    setCreateMessage(course.importSummary?.message ?? "Course created.");
    router.refresh();
  }

  async function deleteCourse(id: string) {
    await fetch(`/api/courses/${id}`, { method: "DELETE" });
    setCourses(courses.filter((c) => c.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={addCourse}
        className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4"
      >
        <h2 className="font-medium text-zinc-200">Add course</h2>
        <p className="text-xs text-zinc-500">
          Paste your syllabus when creating a course and assignments will be
          imported automatically.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            placeholder="Course name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            required
          />
          <input
            placeholder="Course code (e.g. CS 101)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          />
        </div>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              className={`h-6 w-6 rounded-full border-2 ${form.color === c ? "border-white" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <textarea
          placeholder="Paste syllabus or iCollege schedule table here (optional — imports due dates automatically)"
          value={form.syllabusText}
          onChange={(e) => setForm({ ...form, syllabusText: e.target.value })}
          rows={5}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create course"}
        </button>
        {createMessage && (
          <p className="text-xs text-zinc-400">{createMessage}</p>
        )}
      </form>

      <div className="space-y-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: course.color }}
                />
                <div>
                  <h3 className="font-medium text-zinc-100">{course.name}</h3>
                  {course.code && (
                    <p className="text-sm text-zinc-500">{course.code}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteCourse(course.id)}
                className="text-zinc-600 hover:text-rose-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-xs text-zinc-500">
              {course._count?.assignments ?? 0} assignments ·{" "}
              {course._count?.documents ?? 0} documents
            </p>

            <SyllabusImporter
              courseId={course.id}
              courseName={course.name}
              initialText={course.syllabusText ?? ""}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
