import { Nav } from "@/components/nav";
import { ChatPanel } from "@/components/chat-panel";

export default function ChatPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            AI Assistant
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Ask anything about your assignments, exams, and course materials.
          </p>
        </div>
        <ChatPanel />
      </main>
    </>
  );
}
