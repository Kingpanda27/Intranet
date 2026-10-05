"use client"

import { useState, useEffect } from "react"
import { ChatSidebar } from "@/app/components/Chat/ChatSidebar"
import { ChatView } from "@/app/components/Chat/ChatView"
import { startConversation } from "@/app/actions/chatActions"

export function ChatContainer({ currentUserId, initialUserId }: { currentUserId: string, initialUserId?: string }) {
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>()

  useEffect(() => {
    if (initialUserId) {
      handleInitialChat(initialUserId)
    }
  }, [initialUserId])

  const handleInitialChat = async (userId: string) => {
    try {
      const conv = await startConversation(userId)
      setActiveConversationId(conv.id)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="card glass" style={{ height: "calc(100vh - 180px)", margin: "0 auto", overflow: "hidden", display: "flex", padding: 0 }}>
      <ChatSidebar 
        onSelectConversation={setActiveConversationId} 
        activeConversationId={activeConversationId} 
      />
      <ChatView 
        conversationId={activeConversationId || ""} 
        currentUserId={currentUserId} 
      />
    </div>
  )
}
