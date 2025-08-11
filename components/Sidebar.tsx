'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PlusIcon, 
  ArrowRightOnRectangleIcon as LogoutIcon, 
  UserIcon, 
  ChatBubbleLeftRightIcon as ChatIcon,
  UserGroupIcon,
  SignalIcon as WifiIcon,
  SignalSlashIcon as WifiOffIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import ProfileModal from './ProfileModal'

interface User {
  _id: string
  username: string
  email: string
  avatar?: string
  status: 'online' | 'offline' | 'away'
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

interface SidebarProps {
  onNewChat: () => void
  onLogout: () => void
  user: User
  isConnected: boolean
}

export default function Sidebar({ onNewChat, onLogout, user, isConnected }: SidebarProps) {
  console.log('🔥 Sidebar rendering')
  
  const { chats, currentChat, setCurrentChat, fetchChats } = useSocket()
  const [searchTerm, setSearchTerm] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  
  console.log('📋 Sidebar state:', { chats: chats.length, currentChat: !!currentChat, isConnected })

  const filteredChats = chats.filter(chat => {
    if (searchTerm === '') return true
    
    if (chat.type === 'direct') {
      const otherParticipant = chat.participants.find(p => p._id !== user._id)
      const matches = otherParticipant?.username.toLowerCase().includes(searchTerm.toLowerCase())
      console.log('🔍 Search filter:', { 
        searchTerm, 
        username: otherParticipant?.username, 
        matches 
      })
      return matches
    } else {
      const matches = chat.name?.toLowerCase().includes(searchTerm.toLowerCase())
      console.log('🔍 Group search filter:', { 
        searchTerm, 
        groupName: chat.name, 
        matches 
      })
      return matches
    }
  })

  const formatLastMessage = (message?: any) => {
    if (!message) return 'No messages yet'
    
    const content = message.content || ''
    const type = message.type || 'text'
    
    switch (type) {
      case 'file':
        return `📎 ${message.fileName || 'File'}`
      case 'voice':
        return '🎤 Voice message'
      case 'image':
        return '🖼️ Image'
      default:
        return content.length > 30 ? `${content.substring(0, 30)}...` : content
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const getChatDisplayName = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.name || 'Group Chat'
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== user._id)
      return otherParticipant?.username || 'Unknown User'
    }
  }

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'group') {
      return (
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
          <UserGroupIcon className="w-5 h-5 text-white" />
        </div>
      )
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== user._id)
      return (
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-gray-600" />
        </div>
      )
    }
  }

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Chats</h1>
          <button
            onClick={onNewChat}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <ChatIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Connection Status */}
      <div className="px-4 py-2 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <WifiIcon className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOffIcon className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {filteredChats.map((chat) => (
            <motion.div
              key={chat._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onClick={() => setCurrentChat(chat)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                currentChat?._id === chat._id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                {getChatAvatar(chat)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {getChatDisplayName(chat)}
                    </h3>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatTime(chat.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-600 truncate">
                      {formatLastMessage(chat.lastMessage)}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredChats.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <ChatIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">
              {searchTerm ? 'No chats found' : 'No chats yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={onNewChat}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Start a new chat
              </button>
            )}
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {user.username}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {user.email}
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowProfile(true)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Profile Settings"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Logout"
            >
              <LogoutIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          isOwnProfile={true}
        />
      )}
    </div>
  )
} 