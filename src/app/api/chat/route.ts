import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { retrieveContext } from "@/lib/rag";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const lastMessage = messages[messages.length - 1];
  const lastText =
    lastMessage?.parts
      ?.filter((p) => p.type === "text")
      .map((p) => ("text" in p ? p.text : ""))
      .join("") ?? "";
  const context = await retrieveContext(lastText);

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are Study Command, an AI academic assistant. Answer questions about the student's assignments, exams, syllabi, and uploaded course materials.

Use ONLY the context below. If the answer isn't in the context, say what you don't know and suggest uploading the relevant syllabus or PDF.

Be concise, practical, and student-friendly. Reference specific due dates and course names when relevant.

CONTEXT:
${context}`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
