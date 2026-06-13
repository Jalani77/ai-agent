"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPaste, FileUp, Loader2 } from "lucide-react";

type PreviewItem = {
  title: string;
  type: string;
  dueDate: string;
  priority: string;
  sourceLine: string;
};

type SyllabusImporterProps = {
  courseId: string;
  courseName: string;
  initialText?: string;
};

export function SyllabusImporter({
  courseId,
  courseName,
  initialText = "",
}: SyllabusImporterProps) {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<"preview" | "import" | "upload" | null>(
    null,
  );

  const selectedTitles = useMemo(
    () =>
      preview
        .filter((item) => selected[item.title] !== false)
        .map((item) => item.title),
    [preview, selected],
  );

  async function previewText(sourceName = "Pasted syllabus") {
    if (!text.trim()) {
      setStatus("Paste your syllabus or iCollege schedule first.");
      return;
    }

    setLoading("preview");
    setStatus("Scanning for assignment due dates...");
    const res = await fetch("/api/assignments/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        textContent: text,
        sourceName,
        preview: true,
      }),
    });
    const data = await res.json();
    setLoading(null);

    if (!res.ok) {
      setStatus(data.error ?? "Could not scan that text.");
      return;
    }

    const items = (data.extracted ?? []) as PreviewItem[];
    setPreview(items);
    setSelected(
      Object.fromEntries(items.map((item) => [item.title, true])),
    );
    setStatus(data.message);
  }

  async function importSelected(sourceName = "Pasted syllabus") {
    if (!text.trim()) {
      setStatus("Paste your syllabus or iCollege schedule first.");
      return;
    }

    setLoading("import");
    setStatus("Adding assignments to your tracker...");
    const res = await fetch("/api/assignments/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        textContent: text,
        sourceName,
        selectedTitles: preview.length > 0 ? selectedTitles : undefined,
      }),
    });
    const data = await res.json();
    setLoading(null);
    setStatus(data.message ?? (res.ok ? "Import complete." : "Import failed."));
    if (res.ok) {
      setPreview([]);
      router.refresh();
    }
  }

  async function uploadFile(file: File) {
    setLoading("upload");
    setStatus(`Reading ${file.name}...`);

    const previewData = new FormData();
    previewData.append("courseId", courseId);
    previewData.append("file", file);
    previewData.append("preview", "true");

    const previewRes = await fetch("/api/documents", {
      method: "POST",
      body: previewData,
    });
    const previewResult = await previewRes.json();

    if (!previewRes.ok) {
      setLoading(null);
      setStatus(previewResult.error ?? "Upload failed.");
      return;
    }

    const items = (previewResult.extracted ?? []) as PreviewItem[];
    if (items.length > 0) {
      setText(previewResult.contentPreview ?? text);
      setPreview(items);
      setSelected(
        Object.fromEntries(items.map((item) => [item.title, true])),
      );
      setLoading(null);
      setStatus(
        `${previewResult.message} Review the list below, then click Import selected.`,
      );
      return;
    }

    const importData = new FormData();
    importData.append("courseId", courseId);
    importData.append("file", file);

    const importRes = await fetch("/api/documents", {
      method: "POST",
      body: importData,
    });
    const importResult = await importRes.json();
    setLoading(null);
    setStatus(importResult.message ?? importResult.error ?? "Upload finished.");
    if (importRes.ok) router.refresh();
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
      <div>
        <h4 className="text-sm font-medium text-zinc-200">
          Import assignments for {courseName}
        </h4>
        <p className="mt-1 text-xs text-zinc-500">
          Paste your iCollege schedule, syllabus table, or upload PDF/DOCX. We
          scan for due dates and add them to your timeline automatically.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={`Paste schedule text here, for example:\nDate\tAssignment\tPoints\n9/15/2025\tHomework 1\t50\n10/1/2025\tMidterm\t100`}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => previewText()}
          disabled={loading !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-indigo-500/50 hover:text-indigo-200 disabled:opacity-50"
        >
          {loading === "preview" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ClipboardPaste className="h-3.5 w-3.5" />
          )}
          Scan pasted text
        </button>

        <button
          type="button"
          onClick={() => importSelected()}
          disabled={loading !== null}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading === "import" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ClipboardPaste className="h-3.5 w-3.5" />
          )}
          {preview.length > 0 ? "Import selected" : "Import all from paste"}
        </button>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-indigo-500/50 hover:text-indigo-200">
          {loading === "upload" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileUp className="h-3.5 w-3.5" />
          )}
          Upload PDF or DOCX
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
            }}
          />
        </label>
      </div>

      {preview.length > 0 && (
        <div className="space-y-2 rounded-lg border border-zinc-800 p-3">
          <p className="text-xs font-medium text-zinc-300">
            Found {preview.length} assignment{preview.length === 1 ? "" : "s"}
          </p>
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {preview.map((item) => (
              <label
                key={`${item.title}-${item.dueDate}`}
                className="flex items-start gap-2 rounded-md border border-zinc-800 px-2 py-2 text-xs text-zinc-300"
              >
                <input
                  type="checkbox"
                  checked={selected[item.title] !== false}
                  onChange={(e) =>
                    setSelected((current) => ({
                      ...current,
                      [item.title]: e.target.checked,
                    }))
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-zinc-100">{item.title}</span>
                  <span className="block text-zinc-500">
                    Due {new Date(item.dueDate).toLocaleDateString()} ·{" "}
                    {item.type}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {status && <p className="text-xs text-zinc-400">{status}</p>}
    </div>
  );
}
