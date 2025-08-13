'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { 
  PhoneIcon, 
  VideoCameraIcon, 
  EllipsisVerticalIcon,
  UserGroupIcon,
  UserIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import ProfileModal from './ProfileModal'
import UserAvatar, { GroupAvatar } from './UserAvatar'

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

interface ChatHeaderProps {
  chat: Chat
  onVideoCall: () => void
}

export default function ChatHeader({ chat, onVideoCall }: ChatHeaderProps) {
  const { user } = useAuth()
  const { deleteChat } = useSocket()
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const getChatDisplayName = () => {
    if (chat.type === 'group') {
      return chat.name || 'Group Chat'
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== user?._id)
      return otherParticipant?.username || 'Unknown User'
    }
  }

  const getChatAvatar = () => {
    if (chat.type === 'group') {
      return <GroupAvatar size="md" />
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== user?._id)
      if (otherParticipant) {
        return (
          <UserAvatar 
            user={otherParticipant} 
            size="md" 
            showStatus={true}
            status={otherParticipant.status}
          />
        )
      }
      return <UserAvatar user={{ _id: '', username: 'Unknown', avatar: undefined }} size="md" />
    }
  }

  const getStatusText = () => {
    if (chat.type === 'group') {
      return `${chat.participants.length} members`
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== user?._id)
      if (otherParticipant?.status === 'online') {
        return 'Online'
      } else if (otherParticipant?.status === 'away') {
        return 'Away'
      } else {
        return 'Offline'
      }
    }
  }

  const getStatusColor = () => {
    if (chat.type === 'group') return 'text-gray-500'
    
    const otherParticipant = chat.participants.find(p => p._id !== user?._id)
    switch (otherParticipant?.status) {
      case 'online':
        return 'text-green-500'
      case 'away':
        return 'text-yellow-500'
      default:
        return 'text-gray-500'
    }
  }

  const getOtherParticipant = () => {
    if (chat.type === 'group') return null
    return chat.participants.find(p => p._id !== user?._id)
  }

  const handleViewProfile = () => {
    setShowProfile(true)
    setShowMenu(false)
  }

  const handleDeleteChat = async () => {
    const chatName = getChatDisplayName()
    
    if (window.confirm(`Are you sure you want to delete the chat with ${chatName}? This action cannot be undone.`)) {
      setIsDeleting(true)
      setShowMenu(false)
      
      try {
        await deleteChat(chat._id)
      } catch (error) {
        // Error is already handled in deleteChat function
        console.error('Delete chat error:', error)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-3">
        <button onClick={handleViewProfile} className="hover:opacity-80 transition-opacity">
          {getChatAvatar()}
        </button>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {getChatDisplayName()}
          </h2>
          <p className={`text-sm ${getStatusColor()}`}>
            {getStatusText()}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onVideoCall}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          title="Video call"
        >
          <VideoCameraIcon className="w-5 h-5" />
        </button>
        
        <button
          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
          title="Voice call"
        >
          <PhoneIcon className="w-5 h-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-colors"
          >
                            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
              {chat.type === 'direct' && (
                <button 
                  onClick={handleViewProfile}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  View profile
                </button>
              )}
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Mute notifications
              </button>
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Clear chat
              </button>
              {chat.type === 'group' && (
                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Group settings
                </button>
              )}
              <hr className="my-1" />
              <button 
                onClick={handleDeleteChat}
                disabled={isDeleting}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <TrashIcon className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Delete chat'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && chat.type === 'direct' && (
        <ProfileModal
          userId={getOtherParticipant()?._id}
          onClose={() => setShowProfile(false)}
          isOwnProfile={false}
        />
      )}
    </div>
  )
} 