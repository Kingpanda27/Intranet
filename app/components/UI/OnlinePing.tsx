"use client"

import { useEffect } from "react"
import { updateLastSeen } from "@/app/actions/userActions"

export function OnlinePing() {
  useEffect(() => {
    // Ping immediately on mount
    updateLastSeen().catch(() => {})

    // Then ping every 2 minutes
    const interval = setInterval(() => {
      updateLastSeen().catch(() => {})
    }, 2 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return null
}
