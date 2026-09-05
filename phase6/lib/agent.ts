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
  const start = Date.now() // used to measure latency

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

  const { text, usage } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: `You are a scholarship advisor. Answer using ONLY these scholarships, cite by [number]. Recommend every scholarship that matches ALL of the user's stated criteria (field, funding level, eligibility). Include all qualifying matches, not just the best one. Do NOT suggest scholarships that fall outside what the user asked for, even as secondary options. If none fit, say so.\n\n${context}`,
    prompt: query,
  })

  const latencyMs = Date.now() - start

  const trace = {
    query,
    retrieved: topDocs.map((d) => ({
      id: d.id,
      score: d.score.toFixed(3),
      preview: d.text.slice(0, 40),
    })),
    tokens: usage.totalTokens,
    latencyMs,
    answer: text.slice(0, 80) + "...",
  }

  console.log("-".repeat(30))
  console.log(JSON.stringify(trace, null, 2))

  return text
}
