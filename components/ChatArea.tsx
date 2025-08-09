'use client'

import { useState, useEffect, useRef } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import ChatHeader from './ChatHeader'
import { motion } from 'framer-motion'

interface ChatAreaProps {
  onVideoCall: () => void
}

export default function ChatArea({ onVideoCall }: ChatAreaProps) {
  console.log('🔥 ChatArea rendering')
  
  const { currentChat, messages, joinChat, leaveChat, fetchMessages } = useSocket()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  console.log('💬 ChatArea state:', { 
    currentChat: !!currentChat, 
    chatId: currentChat?._id, 
    messagesCount: messages.length, 
    isLoading 
  })

  useEffect(() => {
    console.log('🔄 ChatArea useEffect - currentChat changed:', !!currentChat)
    if (currentChat) {
      console.log('🚀 Starting chat load process for:', currentChat._id)
      setIsLoading(true)
      
      console.log('🏠 Joining chat room')
      joinChat(currentChat._id)
      
      console.log('📨 Fetching messages')
      fetchMessages(currentChat._id)
        .then(() => {
          console.log('✅ Messages fetched successfully')
          setIsLoading(false)
        })
        .catch((error) => {
          console.error('❌ Error fetching messages:', error)
          setIsLoading(false)
        })
    }
  }, [currentChat, joinChat, fetchMessages])

  useEffect(() => {
    return () => {
      if (currentChat) {
        leaveChat(currentChat._id)
      }
    }
  }, [currentChat, leaveChat])

  if (!currentChat) {
    return (
      <div className="chat-main flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Chat App</h2>
          <p className="text-gray-600 mb-6">Select a chat to start messaging</p>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Real-time messaging
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              File sharing
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Voice messages
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Video calls
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="chat-main">
      <ChatHeader chat={currentChat} onVideoCall={onVideoCall} />
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <MessageList messages={messages} currentUserId={user?._id || ''} />
      )}
      
      <MessageInput />
    </div>
  )
} 