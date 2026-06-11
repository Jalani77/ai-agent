import { generateLocalResponse } from "@/lib/local-assistant";

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1];
  const lastText =
    lastMessage?.parts
      ?.filter((p: { type: string }) => p.type === "text")
      .map((p: { text?: string }) => p.text ?? "")
      .join("") ??
    lastMessage?.content ??
    "";

  const reply = await generateLocalResponse(lastText);
  return Response.json({ reply });
}
