"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { daysUntil, formatDueDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  FileText,
  GraduationCap,
  ClipboardList,
  RotateCcw,
} from "lucide-react";

export type TimelineItem = {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  dueDate: string;
  priority: string;
  completed: boolean;
  course: { name: string; color: string; code?: string | null };
};

const typeIcons: Record<string, typeof FileText> = {
  exam: GraduationCap,
  quiz: ClipboardList,
  assignment: FileText,
  project: FileText,
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  const router = useRouter();
  const [completedOverrides, setCompletedOverrides] = useState<
    Record<string, boolean>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);

  async function toggleCompleted(item: TimelineItem, completed: boolean) {
    setCompletedOverrides((current) => ({ ...current, [item.id]: completed }));
    setSavingId(item.id);

    try {
      const response = await fetch(`/api/assignments/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });

      if (!response.ok) {
        throw new Error("Unable to update assignment");
      }

      router.refresh();
    } catch {
      setCompletedOverrides((current) => ({ ...current, [item.id]: item.completed }));
    } finally {
      setSavingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center">
        <p className="text-lg text-zinc-300">No assignments yet</p>
        <p className="mt-2 text-sm text-zinc-500">
          Add courses and assignments to see your full timeline here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gradient-to-b from-indigo-500/50 via-zinc-700 to-zinc-800" />
      <ul className="space-y-0">
        {items.map((item, index) => {
          const completed = completedOverrides[item.id] ?? item.completed;
          const days = daysUntil(item.dueDate);
          const isPast = days < 0;
          const isUrgent = !isPast && days <= 2 && !completed;
          const Icon = typeIcons[item.type] ?? FileText;

          return (
            <li key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 bg-zinc-950 font-mono text-sm font-bold",
                    completed
                      ? "border-emerald-500/50 text-emerald-400"
                      : isUrgent
                        ? "border-rose-500/60 text-rose-400"
                        : "border-indigo-500/50 text-indigo-300",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>
              </div>

              <div
                className={cn(
                  "min-w-0 flex-1 rounded-xl border p-4 transition-colors",
                  completed
                    ? "border-zinc-800 bg-zinc-900/40 opacity-70"
                    : isUrgent
                      ? "border-rose-500/30 bg-rose-500/5"
                      : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleCompleted(item, !completed)}
                      disabled={savingId === item.id}
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                        completed
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : "border-zinc-700 bg-zinc-950 text-zinc-500 hover:border-emerald-500/60 hover:text-emerald-300",
                      )}
                      aria-label={
                        completed
                          ? `Mark ${item.title} incomplete`
                          : `Mark ${item.title} complete`
                      }
                    >
                      {completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                    <div
                      className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${item.course.color}22` }}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: item.course.color }}
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={cn(
                            "font-medium text-zinc-100",
                            completed && "line-through",
                          )}
                        >
                          {item.title}
                        </h3>
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs capitalize text-zinc-400">
                          {item.type}
                        </span>
                        {item.priority === "high" && !completed && (
                          <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">
                            high priority
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-zinc-500">
                        {item.course.name}
                        {item.course.code ? ` · ${item.course.code}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-300">
                      {formatDueDate(item.dueDate)}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 text-xs",
                        isPast
                          ? "text-rose-400"
                          : days === 0
                            ? "text-amber-400"
                            : "text-zinc-500",
                      )}
                    >
                      {isPast
                        ? `${Math.abs(days)}d overdue`
                        : days === 0
                          ? "Due today"
                          : `${days}d left`}
                    </p>
                  </div>
                </div>

                {item.description && (
                  <p className="mt-3 text-sm text-zinc-400">{item.description}</p>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => toggleCompleted(item, !completed)}
                    disabled={savingId === item.id}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                      completed
                        ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        : "bg-emerald-600/15 text-emerald-300 hover:bg-emerald-600/25",
                    )}
                  >
                    {completed ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" />
                        Mark not done
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark done
                      </>
                    )}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function TimelineStats({ items }: { items: TimelineItem[] }) {
  const upcoming = items.filter((i) => !i.completed && daysUntil(i.dueDate) >= 0);
  const overdue = items.filter((i) => !i.completed && daysUntil(i.dueDate) < 0);
  const exams = items.filter((i) => i.type === "exam" && !i.completed);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: "Total", value: items.length, icon: Circle },
        { label: "Upcoming", value: upcoming.length, icon: FileText },
        { label: "Overdue", value: overdue.length, icon: CheckCircle2 },
        { label: "Exams", value: exams.length, icon: GraduationCap },
      ].map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
        >
          <div className="flex items-center gap-2 text-zinc-500">
            <Icon className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">{label}</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">{value}</p>
        </div>
      ))}
    </div>
  );
}
