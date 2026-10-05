"use client"

import { Bot } from "lucide-react"

export function AssistantTriggerButton() {
  const handleClick = () => {
    // We dispatch a custom event to open the Global Assistant
    const event = new CustomEvent('open-assistant')
    window.dispatchEvent(event)
  }

  return (
    <button
      onClick={handleClick}
      className="btn btn-surface hover-scale"
      style={{
        width: "100%",
        padding: "0.75rem",
        borderRadius: "0.75rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        color: "hsl(var(--primary))",
        fontWeight: 700,
        border: "1px solid hsl(var(--primary)/0.2)",
        marginTop: "1rem"
      }}
    >
      <Bot size={18} />
      Preguntar a RRHH (IA)
    </button>
  )
}
