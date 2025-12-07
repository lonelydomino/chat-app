'use client'

import { useEffect, useRef, forwardRef, ForwardedRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

interface Message {
  _id: string
  chatId: string
  sender: {
    _id: string
    username: string
    avatar?: string
  }
  content: string
  type: 'text' | 'file' | 'voice' | 'image'
  fileUrl?: string
  fileName?: string
  fileSize?: number
  duration?: number
  replyTo?: Message
  readBy: string[]
  createdAt: string
}

interface MessageListProps {
  messages: Message[]
  currentUserId: string
}

const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  function MessageList({ messages, currentUserId }, ref: ForwardedRef<HTMLDivElement>) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { typingUsers } = useSocket()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    
    return groups
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const groupedMessages = groupMessagesByDate(messages)

  return (
    <div ref={ref} className="flex-1 overflow-y-auto p-4 space-y-4">
      <AnimatePresence>
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                {formatDate(date)}
              </div>
            </div>
            
            {/* Messages for this date */}
            <div className="space-y-2">
              {dateMessages.map((message, index) => (
                <motion.div
                  key={message._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <MessageBubble
                    message={message}
                    isOwn={message.sender._id === currentUserId}
                    showTime={index === dateMessages.length - 1 || 
                      new Date(message.createdAt).getTime() - 
                      new Date(dateMessages[index + 1]?.createdAt || 0).getTime() > 300000}
                    time={formatTime(message.createdAt)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </AnimatePresence>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <TypingIndicator users={typingUsers} />
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
})

export default MessageList 