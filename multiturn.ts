import Anthropic from "@anthropic-ai/sdk"
import * as readline from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"

const client = new Anthropic()
const rl = readline.createInterface({ input, output })

const messages: Anthropic.MessageParam[] = []

// Turn 1
messages.push({
  role: "user",
  content: "Knowing a z3 M44 has only 4 cylinders, in short answer, what is the best way to boost its power",
})
const resp = await chat(messages)

messages.push({ role: "assistant", content: resp })

for (let i = 0; i < 2; i++) {
  const userInput = await rl.question("prompt-> ")
  messages.push({ role: "user", content: userInput })
  const resp = await chat(messages)
  messages.push({ role: "assistant", content: resp })
}

rl.close()

console.log(messages)

async function chat(messages: Anthropic.MessageParam[]) {
  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages,
  })
  stream.on("text", (text) => process.stdout.write(text))
  const final = await stream.finalMessage()
  const block = final.content[0]
  if (block.type !== "text") {
    throw new Error(`Expected text block, got ${block.type}`)
  }
  return block.text
}
