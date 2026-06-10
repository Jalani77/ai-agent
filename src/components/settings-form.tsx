"use client";

import { useState } from "react";
import { Phone, MessageSquare } from "lucide-react";

type Settings = {
  phoneNumber: string | null;
  reminderHoursBefore: number;
  smsEnabled: boolean;
};

export function SettingsForm({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-indigo-400" />
          <div>
            <h2 className="font-medium text-zinc-200">SMS reminders</h2>
            <p className="text-sm text-zinc-500">
              Get text messages instead of email when assignments are due soon.
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
          <span className="text-sm text-zinc-300">Enable SMS reminders</span>
        </label>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 text-indigo-400" />
          <h2 className="font-medium text-zinc-200">Phone number</h2>
        </div>
        <input
          type="tel"
          placeholder="+1 555 123 4567"
          value={settings.phoneNumber ?? ""}
          onChange={(e) =>
            setSettings({ ...settings, phoneNumber: e.target.value })
          }
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        />
        <p className="text-xs text-zinc-500">
          Use E.164 format (e.g. +15551234567). Powered by Twilio.
        </p>
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
