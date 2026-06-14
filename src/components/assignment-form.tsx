"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Course = { id: string; name: string };

export function AssignmentForm({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    courseId: courses[0]?.id ?? "",
    title: "",
    description: "",
    type: "assignment",
    dueDate: "",
    priority: "medium",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.courseId || !form.title || !form.dueDate) return;

    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        dueDate: new Date(form.dueDate).toISOString(),
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Could not save assignment. Try again.");
      return;
    }

    setMessage("Saved to your timeline.");
    router.refresh();
    setForm((f) => ({ ...f, title: "", description: "", dueDate: "" }));
  }

  if (courses.length === 0) {
    return (
      <p className="text-sm text-zinc-500">Add a course first to create assignments.</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={form.courseId}
          onChange={(e) => setForm({ ...form, courseId: e.target.value })}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="assignment">Assignment</option>
          <option value="exam">Exam</option>
          <option value="quiz">Quiz</option>
          <option value="project">Project</option>
        </select>
      </div>
      <input
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
        required
      />
      <textarea
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={2}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="datetime-local"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          required
        />
        <select
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Add to timeline"}
      </button>
      {message && (
        <p
          className={`text-xs ${message.includes("Saved") ? "text-emerald-400" : "text-rose-400"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
