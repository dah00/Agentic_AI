import { embedMany, embed, cosineSimilarity, generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { scholarships } from "@/data/scholarships"

const query =
  "fully funded programs for internationl students in computer science"

const { embeddings } = await embedMany({
  model: openai.embedding("text-embedding-3-small"),
  values: scholarships.map((item) => item.text),
  maxRetries: 5,
})

const { embedding: queryVector } = await embed({
  model: openai.embedding("text-embedding-3-small"),
  value:
    "Get me all the fully funded programs for international students in computer science",
  maxRetries: 5,
})

const ranked = scholarships
  .map((s, i) => ({
    ...s,
    score: cosineSimilarity(queryVector, embeddings[i]),
  }))
  .filter((s) => s.international)
  .sort((a, b) => b.score - a.score)


// take top 3 after ranking + filtering
const topDocs = ranked.slice(0, 3)

// Build context from the top 3 docs
const context = topDocs.map((d, i) => `[${i + 1}] ${d.text}`).join("\n\n")

const text = await generateText({
  model: anthropic("claude-sonnet-4-6"),
  prompt: `You are a scholarship advisor. Answer the user's question using ONLY the scholarships below. Cite each one by its [number]. If none fit, say so.

Scholarships:
${context}

Question: ${query}`,
})

console.log(text)