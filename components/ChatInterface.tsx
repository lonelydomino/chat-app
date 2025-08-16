'use client'

console.log('🔥 ChatInterface.tsx loaded!')

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import Sidebar from './Sidebar'
import ChatArea from './ChatArea'
import NewChatModal from './NewChatModal'
import VideoCallModal from './VideoCallModal'
import VoiceCallModal from './VoiceCallModal'

export default function ChatInterface() {
  console.log('🚀 ChatInterface rendering')
  
  const { user, logout } = useAuth()
  const { isConnected, fetchChats, currentChat } = useSocket()
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [showVideoCallModal, setShowVideoCallModal] = useState(false)
  const [showVoiceCallModal, setShowVoiceCallModal] = useState(false)
  const [voiceCallType, setVoiceCallType] = useState<'incoming' | 'outgoing' | 'active'>('outgoing')
  const [voiceCaller, setVoiceCaller] = useState<{
    _id: string
    username: string
    avatar?: string
  } | null>(null)

  console.log('🔍 ChatInterface state:', { user: !!user, isConnected, currentChat: !!currentChat })

  // Handle voice call initiation
  const handleVoiceCall = () => {
    if (currentChat && currentChat.type === 'direct') {
      const otherParticipant = currentChat.participants.find(p => p._id !== user?._id)
      if (otherParticipant) {
        setVoiceCaller(otherParticipant)
        setVoiceCallType('outgoing')
        setShowVoiceCallModal(true)
      }
    }
  }

  // Handle incoming voice call
  const handleIncomingVoiceCall = (caller: any) => {
    setVoiceCaller(caller)
    setVoiceCallType('incoming')
    setShowVoiceCallModal(true)
  }

  // Listen for incoming voice calls
  useEffect(() => {
    const handleVoiceCallIncoming = (event: CustomEvent) => {
      const { from, fromUsername, chatId, offer } = event.detail
      
      // Check if this call is for the current chat
      if (currentChat?._id === chatId) {
        const caller = {
          _id: from,
          username: fromUsername
        }
        handleIncomingVoiceCall(caller)
      }
    }

    const handleVoiceCallAnswered = (event: CustomEvent) => {
      const { from, answer } = event.detail
      // Handle call answer - this will be processed by VoiceCallModal
      console.log('Voice call answered by:', from)
    }

    const handleVoiceCallSignal = (event: CustomEvent) => {
      const { from, signal } = event.detail
      // Handle call signal - this will be processed by VoiceCallModal
      console.log('Voice call signal from:', from)
    }

    // Add event listeners
    window.addEventListener('voice-call-incoming', handleVoiceCallIncoming as EventListener)
    window.addEventListener('voice-call-answered', handleVoiceCallAnswered as EventListener)
    window.addEventListener('voice-call-signal', handleVoiceCallSignal as EventListener)

    // Cleanup
    return () => {
      window.removeEventListener('voice-call-incoming', handleVoiceCallIncoming as EventListener)
      window.removeEventListener('voice-call-answered', handleVoiceCallAnswered as EventListener)
      window.removeEventListener('voice-call-signal', handleVoiceCallSignal as EventListener)
    }
  }, [currentChat])

  useEffect(() => {
    console.log('🔄 ChatInterface useEffect - isConnected:', isConnected)
    if (isConnected) {
      console.log('📞 Calling fetchChats')
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
        onVoiceCall={handleVoiceCall}
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

      {showVoiceCallModal && voiceCaller && (
        <VoiceCallModal 
          isOpen={showVoiceCallModal}
          onClose={() => setShowVoiceCallModal(false)}
          callType={voiceCallType}
          caller={voiceCaller}
          chatId={currentChat?._id}
        />
      )}
    </div>
  )
} 