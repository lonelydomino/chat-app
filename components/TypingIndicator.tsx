'use client'

import { motion } from 'framer-motion'

interface TypingIndicatorProps {
  users: string[]
}

export default function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null

  return (
    <div className="flex justify-start">
      <div className="message-bubble message-received">
        <div className="typing-indicator">
          <div className="typing-dot animate-pulse-slow"></div>
          <div className="typing-dot animate-pulse-slow" style={{ animationDelay: '0.2s' }}></div>
          <div className="typing-dot animate-pulse-slow" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {users.length === 1 ? 'Someone is typing...' : `${users.length} people are typing...`}
        </div>
      </div>
    </div>
  )
} 