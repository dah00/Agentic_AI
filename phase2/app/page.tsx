"use client"
import { useChat } from "@ai-sdk/react"
import { useState } from "react"

export default function Home() {
  const { messages, sendMessage } = useChat()
  const [input, setInput] = useState("")

  const onSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({ text: input }) // send the message
    setInput("") // clear the box
  }

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          <b>{m.role}:</b>{" "}
          {m.parts.map((p, i) =>
            p.type === "text" ? <span key={i}>{p.text}</span> : null,
          )}
        </div>
      ))}
      <form onSubmit={onSubmit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
