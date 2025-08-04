'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import Sidebar from './Sidebar'
import ChatArea from './ChatArea'
import NewChatModal from './NewChatModal'
import VideoCallModal from './VideoCallModal'

export default function ChatInterface() {
  const { user, logout } = useAuth()
  const { isConnected, fetchChats, currentChat } = useSocket()
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [showVideoCallModal, setShowVideoCallModal] = useState(false)

  useEffect(() => {
    if (isConnected) {
      fetchChats()
    }
  }, [isConnected, fetchChats])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-container">
      <Sidebar 
        onNewChat={() => setShowNewChatModal(true)}
        onLogout={logout}
        user={user}
        isConnected={isConnected}
      />
      
      <ChatArea 
        onVideoCall={() => setShowVideoCallModal(true)}
      />

      {showNewChatModal && (
        <NewChatModal 
          onClose={() => setShowNewChatModal(false)}
        />
      )}

      {showVideoCallModal && currentChat && (
        <VideoCallModal 
          chat={currentChat}
          onClose={() => setShowVideoCallModal(false)}
        />
      )}
    </div>
  )
} 