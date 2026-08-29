import { generateText, type ModelMessage } from "ai"
import { anthropic } from "@ai-sdk/anthropic"

const turns = [
  // Turn 1 — plant the ROLE
  "You are a sleep expert. Explain how sleep works in 50 words or less.",

  // Turn 2 — plant a FACT (their goal)
  "I want to sleep better. How many sleep cycles do people go through each night?",

  // Turn 3 — plant KEY FACTS (age + weight) — these are what you'll test later
  "I'm 28 years old and 155 lbs. How many hours of sleep should I get each night?",

  // Turn 4 — add another personal fact
  "I usually drink two coffees after 4pm. Is that affecting my sleep?",

  // Turn 5 — filler-ish, adds distance from the early facts
  "What's the ideal temperature for a bedroom?",

  // Turn 6 — more distance; by now turns 1-3 should be getting compressed
  "Does screen time before bed really matter, or is that a myth?",

  // Turn 7 — mild recall (their stated goal from turn 2)
  "Given my goal, should I nap during the day or avoid it?",

  // Turn 8 — THE REAL TEST: recalls facts from turn 3 (age + weight)
  "Based on my age and weight I told you earlier, build me a simple nightly routine with a target bedtime and wake time.",
]

const THRESHOLD = 6

const messages: ModelMessage[] = []

// Function helpers
const formatForSummary = (messages: ModelMessage[]) => {
  let conversation = ""
  for (const message of messages) {
    conversation +=
      (typeof message.content === "string"
        ? message.content
        : JSON.stringify(message.content)) + " "
  }
  return conversation
}

// 2. Implement compressOldMessages — split recent-vs-old, summarize old, rebuild.
const compressOldMessages = async () => {
  const oldMessages = messages.slice(0, -2)
  const recentMessages = messages.slice(-2)

  const { text: summary } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    prompt: `Summarize this conversation concisely, preserve ALL numeric facts the user stated about themselves (age, weight, measurements, times, quantities) verbatim, decisions, and the user's stated constraints:\n\n${formatForSummary(oldMessages)}`,
  })

  messages.length = 0
  messages.push({
    role: "user",
    content: `[Earlier conversation summary: ${summary}]`,
  })
  messages.push(...recentMessages)
  console.log(`++++++++ SUMMARY +++++++++++ \n\n ${summary}`)
}

// 1. Build a loop that has a long conversation — 8+ turns (hardcode the user turns, or use readline).
for (const turn of turns) {
  messages.push({ role: "user", content: turn })

  if (messages.length > THRESHOLD) {
    await compressOldMessages()
  }

  const { text, usage } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    messages: messages,
  })
  messages.push({ role: "assistant", content: text })
  console.log("New turn /// Usage = ", usage.totalTokens)
}

// 3. Log usage.totalTokens every turn. Watch it climb, then plateau once compression kicks in.

// 4. The real test: after compression has happened, ask about that early fact ("remind me which programs fit my situation?").
//  Does the summarized memory still carry it? That's the whole point — did compression preserve what mattered?
messages.push({
  role: "user",
  content:
    "Based on my age and weight I told you earlier, build me a simple nightly routine with target bedtime and wake time.",
})

const { text, usage } = await generateText({
  model: anthropic("claude-sonnet-4-6"),
  messages: messages,
})

console.log("Real Test response = ", text)
console.log("New turn /// Usage = ", usage.totalTokens)
