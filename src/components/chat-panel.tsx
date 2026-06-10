"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Bot, User } from "lucide-react";
import { useMemo, useState } from "react";

const suggestions = [
  "What assignments are due this week?",
  "Summarize my CS syllabus grading policy",
  "When is my next exam?",
  "What topics are covered in chapter 3?",
];

export function ChatPanel() {
  const [input, setInput] = useState("");
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );
  const { messages, sendMessage, status } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border border-zinc-800 bg-zinc-900/60">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="mb-4 h-12 w-12 text-indigo-400" />
            <h2 className="text-lg font-medium text-zinc-200">
              Ask about your classes
            </h2>
            <p className="mt-2 max-w-md text-sm text-zinc-500">
              I answer questions using your syllabi, uploaded PDFs, and assignment
              data.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage({ text: s })}
                  className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-indigo-500/50 hover:text-indigo-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
          >
            {m.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/20">
                <Bot className="h-4 w-4 text-indigo-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                m.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-800 text-zinc-200"
              }`}
            >
              {m.parts
                ?.filter((p) => p.type === "text")
                .map((p, i) => (
                  <span key={i} className="whitespace-pre-wrap">
                    {"text" in p ? p.text : ""}
                  </span>
                ))}
            </div>
            {m.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-700">
                <User className="h-4 w-4 text-zinc-300" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages.at(-1)?.role === "user" && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20">
              <Bot className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="rounded-xl bg-zinc-800 px-4 py-2 text-sm text-zinc-400">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim() || isLoading) return;
          sendMessage({ text: input });
          setInput("");
        }}
        className="border-t border-zinc-800 p-4"
      >
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about assignments, exams, or course materials..."
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
