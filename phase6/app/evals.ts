import { askAgent } from "@/lib/agent"
import { goldenSet, goldenSetInterface } from "@/app/goldenSet"
import { anthropic } from "@ai-sdk/anthropic"
import { generateText, Output } from "ai"
import { z } from "zod"

type EvalResult = goldenSetInterface & { response: string }
type JudgeType = EvalResult & { passed: boolean; reason: string }

async function runEvals(cases: goldenSetInterface[]): Promise<EvalResult[]> {
  const results: EvalResult[] = []
  for (const testCase of cases) {
    const response = await askAgent(testCase.input)
    results.push({ ...testCase, response })
  }
  return results
}

// Build the crude string scorer
// function scoreOne(result: EvalResult): boolean {
//   const answer = result.response.toLowerCase()
//   const includesOk = result.mustInclude.every((name) =>
//     answer.includes(name.toLowerCase()),
//   )
//   const excludesOk = result.mustExclude.every(
//     (name) => !answer.includes(name.toLowerCase()),
//   )
//   return includesOk && excludesOk
// }

// const scored = results.map((r) => ({ ...r, passed: scoreOne(r) }))
// const passCount = scored.filter((r) => r.passed).length

// for (const r of scored) {
//   console.log(`${r.passed ? "✅" : "❌"} ${r.input}`)
// }

// console.log(`\nScore: ${passCount}/${scored.length}`)

// LLM judge
async function judgeOne(
  result: EvalResult,
): Promise<{ passed: boolean; reason: string }> {
  const { output } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    output: Output.object({
      schema: z.object({
        passed: z.boolean(),
        reason: z.string(),
      }),
    }),
    prompt: `You are grading a scholarship-advisor answer.

Question: ${result.input}
Answer: ${result.response}

GRADING CRITERIA:
- Must RECOMMEND these scholarships: ${result.mustInclude.join(", ") || "none required"}
- Must NOT recommend these: ${result.mustExclude.join(", ") || "(none)"}

note: a scholarship mentioned only to explain why it does NOT qualify is NOT a recommendation - that's correct behavior, not a violation.
If expectBehavior is given, pass if the answer satisfies it.

Pass only if all criteria are met. Return passed + a one-sentece reason.`,
  })
  return output
}

const results = await runEvals(goldenSet)

const judged: JudgeType[] = []
for (const r of results) {
  const verdict = await judgeOne(r)
  judged.push({ ...r, ...verdict })
  console.log(
    `${verdict.passed ? "✅" : "❌"} ${r.input}\n ↳ ${verdict.reason}}`,
  )
}

console.log(
  `\nJudge score: ${judged.filter((j) => j.passed).length}/${judged.length}`,
)

// for (const r of results) {
//   console.log(`\nQ: ${r.input}\nA: ${r.response}\n---`)
// }
