'use client'

console.log('🔥 SocketContext.tsx loaded!')

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

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

interface Chat {
  _id: string
  name?: string
  type: 'direct' | 'group'
  participants: Array<{
    _id: string
    username: string
    avatar?: string
    status: 'online' | 'offline' | 'away'
    lastSeen: string
  }>
  admins: Array<{
    _id: string
    username: string
  }>
  lastMessage?: {
    content: string
    sender: {
      _id: string
      username: string
      avatar?: string
    }
    timestamp: string
    type: 'text' | 'file' | 'voice' | 'image'
  }
  unreadCount: number
  createdAt: string
  updatedAt: string
}

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  chats: Chat[]
  currentChat: Chat | null
  messages: Message[]
  typingUsers: string[]
  sendMessage: (content: string, type?: 'text' | 'file' | 'voice' | 'image', fileData?: any) => void
  joinChat: (chatId: string) => void
  leaveChat: (chatId: string) => void
  setTyping: (chatId: string, isTyping: boolean) => void
  markMessagesAsRead: (messageIds: string[]) => void
  createChat: (type: 'direct' | 'group', participants: string[], name?: string) => Promise<Chat>
  fetchChats: () => Promise<void>
  fetchMessages: (chatId: string, page?: number) => Promise<void>
  setCurrentChat: (chat: Chat | null) => void
  deleteChat: (chatId: string) => Promise<void>
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  // Reset state when user changes
  useEffect(() => {
    if (!token || !user) {
      // Clear all state when user logs out
      setChats([])
      setCurrentChat(null)
      setMessages([])
      setTypingUsers([])
      setIsConnected(false)
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
      return
    }
  }, [token, user, socket])

  // Initialize socket connection
  useEffect(() => {
    if (token && user) {
      // Automatically detect the current domain for Socket.io connection
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
        (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
      
      console.log('🔌 Connecting to Socket.io at:', socketUrl)
      
      const newSocket = io(socketUrl, {
        auth: { token }
      })

      newSocket.on('connect', () => {
        console.log('Connected to socket server')
        setIsConnected(true)
      })

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server')
        setIsConnected(false)
      })

      newSocket.on('new-message', (data: { message: Message; chat: Chat }) => {
        console.log('📨 Received new message')
        setMessages(prev => [...prev, data.message])
        
        // Update chat's last message
        setChats(prev => prev.map(chat => 
          chat._id === data.chat._id 
            ? { ...chat, lastMessage: data.chat.lastMessage }
            : chat
        ))

        // Show notification if not in current chat
        if (currentChat?._id !== data.message.chatId) {
          toast.success(`New message from ${data.message.sender.username}`)
        }
      })

      newSocket.on('user-typing', (data: { userId: string; username: string; isTyping: boolean; chatId: string }) => {
        if (currentChat?._id === data.chatId) {
          setTypingUsers(prev => 
            data.isTyping 
              ? [...prev.filter(id => id !== data.userId), data.userId]
              : prev.filter(id => id !== data.userId)
          )
        }
      })

      newSocket.on('chat-deleted', (data: { chatId: string }) => {
        console.log('📨 Chat deleted by another user:', data.chatId)
        
        // Remove chat from local state
        setChats(prev => prev.filter(chat => chat._id !== data.chatId))
        
        // Clear current chat if it's the one being deleted
        if (currentChat?._id === data.chatId) {
          setCurrentChat(null)
          setMessages([])
        }
        
        toast('Chat was deleted', { icon: 'ℹ️' })
      })

      newSocket.on('messages-read', (data: { userId: string; messageIds: string[] }) => {
        setMessages(prev => prev.map(message => 
          data.messageIds.includes(message._id)
            ? { ...message, readBy: [...message.readBy, data.userId] }
            : message
        ))
      })

      newSocket.on('user-status-changed', (data: { userId: string; status: string; username: string }) => {
        setChats(prev => prev.map(chat => ({
          ...chat,
          participants: chat.participants.map(p => 
            p._id === data.userId 
              ? { ...p, status: data.status as 'online' | 'offline' | 'away' }
              : p
          )
        })))
      })

      newSocket.on('video-call-incoming', (data: { from: string; fromUsername: string; chatId: string }) => {
        // Handle incoming video call
        toast.success(`Incoming video call from ${data.fromUsername}`)
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    }
  }, [token, user])

  const sendMessage = (content: string, type: 'text' | 'file' | 'voice' | 'image' = 'text', fileData?: any) => {
    console.log('🚀 sendMessage called')
    
    if (socket && currentChat) {
      console.log('✅ Sending message via socket')
      socket.emit('send-message', {
        chatId: currentChat._id,
        content,
        type,
        ...fileData
      })
    } else {
      console.log('❌ Cannot send - missing socket or chat')
    }
  }

  const joinChat = useCallback((chatId: string) => {
    if (socket) {
      socket.emit('join-chat', chatId)
    }
  }, [socket])

  const leaveChat = useCallback((chatId: string) => {
    if (socket) {
      socket.emit('leave-chat', chatId)
    }
  }, [socket])

  const setTyping = (chatId: string, isTyping: boolean) => {
    if (socket) {
      socket.emit('typing', { chatId, isTyping })
    }
  }

  const markMessagesAsRead = (messageIds: string[]) => {
    if (socket && currentChat) {
      socket.emit('mark-read', { chatId: currentChat._id, messageIds })
    }
  }

  const createChat = async (type: 'direct' | 'group', participants: string[], name?: string): Promise<Chat> => {
    const response = await fetch('/api/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type, participants, name })
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error)
    }

    setChats(prev => [data.chat, ...prev])
    return data.chat
  }

  const fetchChats = useCallback(async () => {
    if (!token) return
    
    try {
      const response = await fetch('/api/chats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error)
      }

      setChats(data.chats)
    } catch (error) {
      console.error('Error fetching chats:', error)
      toast.error('Failed to fetch chats')
    }
  }, [token])

  const fetchMessages = useCallback(async (chatId: string, page: number = 1) => {
    console.log('🔍 fetchMessages called:', { chatId, page, token: !!token })
    
    try {
      console.log('🌐 Making API request to:', `/api/messages/${chatId}?page=${page}`)
      
      const response = await fetch(`/api/messages/${chatId}?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📡 API response status:', response.status)
      
      const data = await response.json()
      console.log('📦 API response data:', data)
      
      if (!response.ok) {
        console.error('❌ API error:', data.error)
        
        // If chat not found, clear the current chat
        if (response.status === 404) {
          console.log('🧹 Chat not found - clearing currentChat')
          setCurrentChat(null)
          return // Don't throw error, just return silently
        }
        
        throw new Error(data.error)
      }

      console.log('📨 Setting messages:', data.messages?.length || 0, 'messages')
      
      if (page === 1) {
        setMessages(data.messages)
      } else {
        setMessages(prev => [...data.messages, ...prev])
      }
      
      console.log('✅ fetchMessages completed successfully')
    } catch (error) {
      console.error('❌ fetchMessages error:', error)
      toast.error('Failed to fetch messages')
      throw error // Re-throw so ChatArea can catch it
    }
  }, [token])

  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error)
      }

      // Remove chat from local state
      setChats(prev => prev.filter(chat => chat._id !== chatId))
      
      // Clear current chat if it's the one being deleted
      if (currentChat?._id === chatId) {
        setCurrentChat(null)
        setMessages([])
      }

      // Emit socket event to notify other participants
      if (socket) {
        socket.emit('chat-deleted', { chatId })
      }

      toast.success('Chat deleted successfully')
    } catch (error) {
      console.error('Error deleting chat:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete chat')
      throw error
    }
  }

  const value = {
    socket,
    isConnected,
    chats,
    currentChat,
    messages,
    typingUsers,
    sendMessage,
    joinChat,
    leaveChat,
    setTyping,
    markMessagesAsRead,
    createChat,
    fetchChats,
    fetchMessages,
    setCurrentChat,
    deleteChat
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
} 