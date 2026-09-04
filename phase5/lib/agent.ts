import { anthropic } from "@ai-sdk/anthropic"
import { openai } from "@ai-sdk/openai"
import {
  cosineSimilarity,
  embed,
  embedMany,
  generateText,
  type UIMessage,
} from "ai"
import { scholarships } from "@/data/scholarships"

const { embeddings: docVectors } = await embedMany({
  model: openai.embedding("text-embedding-3-small"),
  values: scholarships.map((s) => s.text),
  maxRetries: 3,
})

export async function askAgent(query: string): Promise<string> {
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
    .slice(0, 6)

  const context = topDocs.map((d) => `[${d.id}] ${d.text}`).join("\n\n")

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: `You are a scholarship advisor. Answer using ONLY these scholarships, cite by [number]. recommend all qualifying scholarships, not just the top one. If none fit, say so.\n\n${context}`,
    prompt: query,
  })

  return text
}
