import { anthropic } from "@ai-sdk/anthropic"
import { openai } from "@ai-sdk/openai"
import {
  convertToModelMessages,
  cosineSimilarity,
  embed,
  embedMany,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai"
import { scholarships } from "@/data/scholarships"

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

const { embeddings: docVectors } = await embedMany({
  model: openai.embedding("text-embedding-3-small"),
  values: scholarships.map((s) => s.text),
  maxRetries: 3,
})

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json()
  const query = lastUserText(messages)

  const { embedding: queryVector } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: query,
    maxRetries: 3,
  })

  const topDocs = scholarships
    .map((s, i) => ({
      ...s,
      score: cosineSimilarity(queryVector, docVectors[i]),
    }))
    .filter((s) => s.international)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const context = topDocs.map((d) => `[${d.id}] ${d.text}`).join("\n\n")

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: `You are a scholarship advisor. Answer using ONLY these scholarships, cite by [number]. If none fit, say so.\n\n${context}`,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
