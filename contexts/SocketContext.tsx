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
        console.log('📨 Received new message:', {
          messageId: data.message._id,
          content: data.message.content,
          type: data.message.type,
          chatId: data.message.chatId,
          sender: data.message.sender.username
        })
        
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
        console.log('📖 Messages marked as read:', data.messageIds.length, 'messages by user:', data.userId)
        
        // Update message read status
        setMessages(prev => prev.map(message => 
          data.messageIds.includes(message._id)
            ? { ...message, readBy: [...message.readBy, data.userId] }
            : message
        ))
        
        // Update chat unread count if it's the current user
        if (data.userId === user?._id) {
          setChats(prev => prev.map(chat => 
            chat._id === currentChat?._id 
              ? { ...chat, unreadCount: Math.max(0, chat.unreadCount - data.messageIds.length) }
              : chat
          ))
        }
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

      newSocket.on('video-call-rejected', (data: { from: string; chatId: string }) => {
        console.log('📹 Video call rejected by:', data.from)
        toast.error('Video call was rejected')
      })

      newSocket.on('video-call-ended', (data: { from: string; chatId: string }) => {
        console.log('📹 Video call ended by:', data.from)
        toast('Video call ended', { icon: '📹' })
      })

      newSocket.on('voice-call-incoming', (data: { from: string; fromUsername: string; chatId: string; offer: any }) => {
        console.log('📞 Incoming voice call from:', data.fromUsername)
        toast.success(`Incoming voice call from ${data.fromUsername}`)
        
        // Emit custom event for voice call handling
        const event = new CustomEvent('voice-call-incoming', { 
          detail: { 
            from: data.from, 
            fromUsername: data.fromUsername, 
            chatId: data.chatId,
            offer: data.offer
          } 
        })
        window.dispatchEvent(event)
      })

      newSocket.on('voice-call-answered', (data: { from: string; answer: any }) => {
        console.log('📞 Voice call answered by:', data.from)
        // Emit custom event for voice call handling
        const event = new CustomEvent('voice-call-answered', { 
          detail: { from: data.from, answer: data.answer } 
        })
        window.dispatchEvent(event)
      })

      newSocket.on('voice-call-signal', (data: { from: string; signal: any }) => {
        console.log('📞 Voice call signal from:', data.from)
        // Emit custom event for voice call handling
        const event = new CustomEvent('voice-call-signal', { 
          detail: { from: data.from, signal: data.signal } 
        })
        window.dispatchEvent(event)
      })

      newSocket.on('voice-call-rejected', (data: { from: string; chatId: string }) => {
        console.log('📞 Voice call rejected by:', data.from)
        toast.error('Voice call was rejected')
      })

      newSocket.on('voice-call-ended', (data: { from: string; chatId: string }) => {
        console.log('📞 Voice call ended by:', data.from)
        toast('Voice call ended', { icon: '📞' })
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    }
  }, [token, user])

  const sendMessage = (content: string, type: 'text' | 'file' | 'voice' | 'image' = 'text', fileData?: any) => {
    console.log('�� sendMessage called with:', { content, type, fileData })
    
    if (socket && currentChat) {
      console.log('✅ Sending message via socket to chat:', currentChat._id)
      const messageData = {
        chatId: currentChat._id,
        content,
        type,
        ...fileData
      }
      console.log('📤 Socket emit data:', messageData)
      socket.emit('send-message', messageData)
    } else {
      console.log('❌ Cannot send - missing socket or chat:', { 
        hasSocket: !!socket, 
        hasCurrentChat: !!currentChat,
        currentChatId: currentChat?._id 
      })
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
    console.log('📤 markMessagesAsRead called:', {
      hasSocket: !!socket,
      hasCurrentChat: !!currentChat,
      chatId: currentChat?._id,
      messageIdsCount: messageIds.length,
      messageIds: messageIds
    })
    
    if (socket && currentChat) {
      console.log('🚀 Emitting mark-read socket event')
      socket.emit('mark-read', { chatId: currentChat._id, messageIds })
    } else {
      console.log('❌ Cannot emit mark-read:', {
        hasSocket: !!socket,
        hasCurrentChat: !!currentChat
      })
    }
  }

  // Mark all messages in current chat as read
  const markCurrentChatAsRead = useCallback(() => {
    console.log('🔍 markCurrentChatAsRead called:', {
      hasCurrentChat: !!currentChat,
      chatId: currentChat?._id,
      messagesCount: messages.length,
      currentUserId: user?._id
    })

    if (currentChat && messages.length > 0) {
      // Get all message IDs that haven't been read by current user
      const unreadMessageIds = messages
        .filter(msg => !msg.readBy.includes(user?._id || ''))
        .map(msg => msg._id)
      
      console.log('📖 Found unread messages:', {
        totalMessages: messages.length,
        unreadCount: unreadMessageIds.length,
        unreadIds: unreadMessageIds
      })
      
      if (unreadMessageIds.length > 0) {
        console.log('📖 Marking messages as read:', unreadMessageIds.length, 'messages')
        markMessagesAsRead(unreadMessageIds)
        
        // Update local state to reflect read status
        setMessages(prev => {
          const updated = prev.map(msg => ({
            ...msg,
            readBy: msg.readBy.includes(user?._id || '') ? msg.readBy : [...msg.readBy, user?._id || '']
          }))
          console.log('📝 Updated messages with read status:', updated.length)
          return updated
        })
        
        // Update chat unread count
        setChats(prev => {
          const updated = prev.map(chat => 
            chat._id === currentChat._id 
              ? { ...chat, unreadCount: 0 }
              : chat
          )
          console.log('📊 Updated chats with unread count reset:', updated.length)
          return updated
        })
      } else {
        console.log('✅ No unread messages to mark')
      }
    } else {
      console.log('❌ Cannot mark as read:', {
        hasCurrentChat: !!currentChat,
        messagesCount: messages.length
      })
    }
  }, [currentChat, messages, user?._id, markMessagesAsRead])

  // Set current chat and mark messages as read
  const setCurrentChatWithRead = useCallback((chat: Chat | null) => {
    console.log('🔄 setCurrentChatWithRead called:', {
      newChat: chat?._id,
      currentChat: currentChat?._id,
      isSameChat: chat?._id === currentChat?._id
    })
    
    // If we're leaving a chat, mark its messages as read
    if (currentChat && chat?._id !== currentChat._id) {
      console.log('👋 Leaving chat, marking messages as read')
      markCurrentChatAsRead()
    }
    
    // Set the new current chat
    setCurrentChat(chat)
    
    // If switching to a new chat, mark its messages as read after a short delay
    if (chat) {
      console.log('🚀 Switching to new chat, will mark as read after delay')
      setTimeout(() => {
        console.log('⏰ Delayed read marking for new chat')
        markCurrentChatAsRead()
      }, 500) // Small delay to ensure messages are loaded
    }
  }, [currentChat, markCurrentChatAsRead])

  // Mark messages as read when they're viewed
  useEffect(() => {
    console.log('👁️ Read marking useEffect triggered:', {
      hasCurrentChat: !!currentChat,
      chatId: currentChat?._id,
      messagesCount: messages.length,
      hasMarkCurrentChatAsRead: !!markCurrentChatAsRead
    })
    
    if (currentChat && messages.length > 0) {
      // Mark messages as read after a short delay to ensure they're actually visible
      const timer = setTimeout(() => {
        console.log('⏰ Timer fired, calling markCurrentChatAsRead')
        markCurrentChatAsRead()
      }, 1000) // 1 second delay to ensure messages are loaded

      return () => {
        console.log('🧹 Clearing read marking timer')
        clearTimeout(timer)
      }
    }
  }, [currentChat, messages, markCurrentChatAsRead])

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
    setCurrentChat: setCurrentChatWithRead,
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