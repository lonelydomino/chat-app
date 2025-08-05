'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { XMarkIcon as XIcon, PhoneIcon, PhoneMissedCallIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

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

interface VideoCallModalProps {
  chat: Chat
  onClose: () => void
}

export default function VideoCallModal({ chat, onClose }: VideoCallModalProps) {
  const { socket, user } = useSocket()
  const { user: currentUser } = useAuth()
  const [isCallActive, setIsCallActive] = useState(false)
  const [isIncomingCall, setIsIncomingCall] = useState(false)
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle')
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)

  useEffect(() => {
    if (!socket) return

    socket.on('video-call-incoming', handleIncomingCall)
    socket.on('video-call-answered', handleCallAnswered)
    socket.on('video-call-signal', handleCallSignal)

    return () => {
      socket.off('video-call-incoming', handleIncomingCall)
      socket.off('video-call-answered', handleCallAnswered)
      socket.off('video-call-signal', handleCallSignal)
    }
  }, [socket])

  const handleIncomingCall = (data: { from: string; fromUsername: string; chatId: string }) => {
    setIsIncomingCall(true)
    setCallStatus('idle')
    toast.success(`Incoming call from ${data.fromUsername}`)
  }

  const handleCallAnswered = (data: { from: string; answer: boolean }) => {
    if (data.answer) {
      setCallStatus('connected')
      initializePeerConnection()
    } else {
      setCallStatus('ended')
      toast.error('Call was declined')
    }
  }

  const handleCallSignal = (data: { from: string; signal: any }) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.signal(data.signal)
    }
  }

  const initializePeerConnection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      })

      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })

      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('video-call-signal', {
            targetUserId: chat.participants.find(p => p._id !== currentUser?._id)?._id,
            signal: event.candidate
          })
        }
      }

      peerConnectionRef.current = peerConnection
      setIsCallActive(true)
    } catch (error) {
      console.error('Error accessing media devices:', error)
      toast.error('Failed to access camera/microphone')
    }
  }

  const startCall = async () => {
    if (!socket || chat.type === 'group') return

    const targetUserId = chat.participants.find(p => p._id !== currentUser?._id)?._id
    if (!targetUserId) return

    setCallStatus('calling')
    socket.emit('video-call-request', {
      targetUserId,
      chatId: chat._id
    })

    // Wait for answer
    setTimeout(() => {
      if (callStatus === 'calling') {
        setCallStatus('ended')
        toast.error('Call timed out')
      }
    }, 30000)
  }

  const answerCall = async (accept: boolean) => {
    if (!socket) return

    socket.emit('video-call-answer', {
      targetUserId: chat.participants.find(p => p._id !== currentUser?._id)?._id,
      answer: accept
    })

    if (accept) {
      await initializePeerConnection()
      setCallStatus('connected')
    } else {
      setCallStatus('ended')
    }

    setIsIncomingCall(false)
  }

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    setCallStatus('ended')
    setIsCallActive(false)
    setIsIncomingCall(false)
    onClose()
  }

  const getChatDisplayName = () => {
    if (chat.type === 'group') {
      return chat.name || 'Group Chat'
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== currentUser?._id)
      return otherParticipant?.username || 'Unknown User'
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Video Call - {getChatDisplayName()}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {callStatus === 'idle' && !isIncomingCall && (
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PhoneIcon className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start Video Call
                </h3>
                <p className="text-gray-600 mb-6">
                  Call {getChatDisplayName()} for a video conversation
                </p>
                <button
                  onClick={startCall}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Call
                </button>
              </div>
            )}

            {callStatus === 'calling' && (
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <PhoneIcon className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Calling...
                </h3>
                <p className="text-gray-600 mb-6">
                  Waiting for {getChatDisplayName()} to answer
                </p>
                <button
                  onClick={endCall}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Cancel Call
                </button>
              </div>
            )}

            {isIncomingCall && (
              <div className="text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <PhoneIcon className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Incoming Call
                </h3>
                <p className="text-gray-600 mb-6">
                  {getChatDisplayName()} is calling you
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => answerCall(true)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Answer
                  </button>
                  <button
                    onClick={() => answerCall(false)}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}

            {callStatus === 'connected' && isCallActive && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-48 bg-gray-900 rounded-lg"
                    />
                    <div className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                      Remote
                    </div>
                  </div>
                  <div className="relative">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-48 bg-gray-900 rounded-lg"
                    />
                    <div className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                      You
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={endCall}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    End Call
                  </button>
                </div>
              </div>
            )}

            {callStatus === 'ended' && (
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PhoneMissedCallIcon className="w-12 h-12 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Call Ended
                </h3>
                <p className="text-gray-600 mb-6">
                  The video call has ended
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
} 