"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { formatDueDate } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  type: string;
  message: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications ?? []);

      if (
        data.notifications?.length > 0 &&
        typeof window !== "undefined" &&
        Notification.permission === "granted"
      ) {
        const shown = sessionStorage.getItem("sc-notified");
        if (!shown) {
          const first = data.notifications[0];
          new Notification("Assignment due soon", {
            body: first.message,
            icon: "/favicon.ico",
          });
          sessionStorage.setItem("sc-notified", "1");
        }
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const count = notifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl">
            <div className="border-b border-zinc-800 px-4 py-3">
              <p className="text-sm font-medium text-zinc-200">Due soon</p>
              <p className="text-xs text-zinc-500">
                {count === 0
                  ? "Nothing due in your reminder window"
                  : `${count} upcoming deadline${count === 1 ? "" : "s"}`}
              </p>
            </div>
            <ul className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-zinc-500">
                  All clear for now
                </li>
              ) : (
                notifications.map((n) => (
                  <li
                    key={n.id}
                    className="border-b border-zinc-800/50 px-4 py-3 last:border-0"
                  >
                    <p className="text-sm font-medium text-zinc-200">
                      {n.title}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {n.course} · {formatDueDate(n.dueDate)}
                    </p>
                    <p className="mt-1 text-xs text-amber-400/80">
                      {n.message}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
