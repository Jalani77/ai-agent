import { CheckCircle2, Flame, ListTodo, Trophy } from "lucide-react";
import { daysUntil, formatDueDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { TimelineItem } from "@/components/timeline";

function plural(count: number, label: string) {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

export function FocusPanel({ items }: { items: TimelineItem[] }) {
  const incomplete = items.filter((item) => !item.completed);
  const completed = items.filter((item) => item.completed);
  const overdue = incomplete.filter((item) => daysUntil(item.dueDate) < 0);
  const today = incomplete.filter((item) => daysUntil(item.dueDate) === 0);
  const thisWeek = incomplete.filter((item) => {
    const days = daysUntil(item.dueDate);
    return days >= 0 && days <= 7;
  });
  const nextUp = incomplete.find((item) => daysUntil(item.dueDate) >= 0);
  const completionRate =
    items.length === 0 ? 0 : Math.round((completed.length / items.length) * 100);

  const cards = [
    {
      label: "Do first",
      value:
        overdue[0]?.title ??
        today[0]?.title ??
        nextUp?.title ??
        "Add your first assignment",
      helper: overdue[0]
        ? `${overdue[0].course.name} is overdue`
        : today[0]
          ? `${today[0].course.name} is due today`
          : nextUp
            ? `${nextUp.course.name} · ${formatDueDate(nextUp.dueDate)}`
            : "Your timeline is empty",
      icon: Flame,
      tone: overdue.length > 0 ? "rose" : today.length > 0 ? "amber" : "indigo",
    },
    {
      label: "This week",
      value: plural(thisWeek.length, "deadline"),
      helper:
        thisWeek.length > 0
          ? "Focus on these before anything later."
          : "Nothing due in the next 7 days.",
      icon: ListTodo,
      tone: "indigo",
    },
    {
      label: "Done",
      value: `${completionRate}% complete`,
      helper: `${completed.length} of ${items.length} checked off`,
      icon: Trophy,
      tone: "emerald",
    },
  ];

  return (
    <section className="my-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium text-zinc-100">Today&apos;s focus</h2>
          <p className="text-sm text-zinc-500">
            A quick student view of what needs attention first.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          {plural(incomplete.length, "item")} left
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {cards.map(({ label, value, helper, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4"
          >
            <div
              className={cn(
                "mb-3 flex h-9 w-9 items-center justify-center rounded-lg",
                tone === "rose" && "bg-rose-500/15 text-rose-300",
                tone === "amber" && "bg-amber-500/15 text-amber-300",
                tone === "emerald" && "bg-emerald-500/15 text-emerald-300",
                tone === "indigo" && "bg-indigo-500/15 text-indigo-300",
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {label}
            </p>
            <p className="mt-1 line-clamp-2 font-medium text-zinc-100">{value}</p>
            <p className="mt-1 text-xs text-zinc-500">{helper}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
