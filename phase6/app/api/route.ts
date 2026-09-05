import { type UIMessage } from "ai"
import { askAgent } from "@/lib/agent"

function lastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.role !== "user") continue
    return message.parts
      .filter(
        (part): part is { type: "text"; text: string } => part.type === "text",
      )
      .map((part) => part.text)
      .join("")
  }
  return ""
}

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json()
  const query = lastUserText(messages)

  const text = await askAgent(query)

  return Response.json({ text })
}
