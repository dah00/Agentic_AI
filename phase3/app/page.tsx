"use client"

import { useChat } from "@ai-sdk/react"
import { useMemo, useState } from "react"

function partsToText(
  parts: { type: string; text?: string }[],
): string {
  return parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text!)
    .join("")
}

export default function Home() {
  const { messages, sendMessage, status } = useChat()
  const [input, setInput] = useState("")

  const isBusy = status === "submitted" || status === "streaming"

  const latestAnswer = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        return partsToText(messages[i].parts)
      }
    }
    return ""
  }, [messages])

  const onSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isBusy) return
    sendMessage({ text: input })
    setInput("")
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#e8f0ea_0%,_#f7f4ef_45%,_#efe8df_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-[#c5d5c8]/35 blur-3xl"
      />

      <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-16 sm:px-8 sm:py-24">
        <header className="space-y-2">
          <p className="font-mono text-xs tracking-[0.18em] text-stone-500 uppercase">
            Scholarship search
          </p>
          <h1 className="font-sans text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Ask a question
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-stone-600">
            Type a request below. The answer streams in as it arrives.
          </p>
        </header>

        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <label htmlFor="prompt" className="sr-only">
            Your question
          </label>
          <input
            id="prompt"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isBusy}
            placeholder="e.g. Fully funded CS programs for international students"
            className="min-h-12 flex-1 rounded-lg border border-stone-300/80 bg-white/80 px-4 text-base text-stone-900 shadow-sm outline-none backdrop-blur-sm transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-400/30 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isBusy || !input.trim()}
            className="min-h-12 rounded-lg bg-stone-900 px-6 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy ? "Thinking…" : "Submit"}
          </button>
        </form>

        <section aria-live="polite" className="min-h-48 flex-1 border-t border-stone-300/80 pt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-mono text-xs tracking-[0.16em] text-stone-500 uppercase">
              Answer
            </h2>
            {status === "streaming" && (
              <span className="inline-flex items-center gap-2 text-xs text-stone-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                Streaming
              </span>
            )}
          </div>

          {!latestAnswer && !isBusy && (
            <p className="text-sm leading-relaxed text-stone-400">
              Your response will appear here.
            </p>
          )}

          {isBusy && !latestAnswer && (
            <p className="animate-pulse text-sm text-stone-500">
              Waiting for the first tokens…
            </p>
          )}

          {latestAnswer && (
            <p className="whitespace-pre-wrap text-[15px] leading-7 text-stone-800">
              {latestAnswer}
              {status === "streaming" && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-stone-700 align-middle" />
              )}
            </p>
          )}
        </section>
      </main>
    </div>
  )
}
