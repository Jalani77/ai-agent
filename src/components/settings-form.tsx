"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

type Settings = {
  reminderHoursBefore: number;
  smsEnabled: boolean;
};

export function SettingsForm({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [browserStatus, setBrowserStatus] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function enableBrowserNotifications() {
    if (!("Notification" in window)) {
      setBrowserStatus("Your browser doesn't support notifications.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setBrowserStatus("Browser notifications enabled.");
      new Notification("Study Command", {
        body: "You'll get alerts when assignments are due soon.",
        icon: "/favicon.ico",
      });
    } else if (permission === "denied") {
      setBrowserStatus("Blocked — enable notifications in your browser settings.");
    } else {
      setBrowserStatus("Permission not granted.");
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-indigo-400" />
          <div>
            <h2 className="font-medium text-zinc-200">In-app reminders</h2>
            <p className="text-sm text-zinc-500">
              See due-soon alerts in the notification bell and browser — no SMS
              or API keys needed.
            </p>
          </div>
        </div>

        <label className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.smsEnabled}
            onChange={(e) =>
              setSettings({ ...settings, smsEnabled: e.target.checked })
            }
            className="rounded border-zinc-600"
          />
          <span className="text-sm text-zinc-300">Enable due-date reminders</span>
        </label>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
        <h2 className="font-medium text-zinc-200">Browser notifications</h2>
        <p className="text-sm text-zinc-500">
          Optional — get a pop-up on your device when deadlines are approaching.
        </p>
        <button
          type="button"
          onClick={enableBrowserNotifications}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-indigo-500/50 hover:text-indigo-300"
        >
          Enable browser notifications
        </button>
        {browserStatus && (
          <p className="text-xs text-zinc-400">{browserStatus}</p>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
        <h2 className="font-medium text-zinc-200">Reminder timing</h2>
        <select
          value={settings.reminderHoursBefore}
          onChange={(e) =>
            setSettings({
              ...settings,
              reminderHoursBefore: Number(e.target.value),
            })
          }
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        >
          <option value={1}>1 hour before</option>
          <option value={6}>6 hours before</option>
          <option value={12}>12 hours before</option>
          <option value={24}>24 hours before</option>
          <option value={48}>48 hours before</option>
          <option value={72}>72 hours before</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? "Saving..." : saved ? "Saved!" : "Save settings"}
      </button>
    </form>
  );
}
