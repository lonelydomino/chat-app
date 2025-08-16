'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { XMarkIcon as XIcon, PhoneIcon, PhoneXMarkIcon } from '@heroicons/react/24/outline'
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
  const { socket } = useSocket()
  const { user } = useAuth()
  const { user: currentUser } = useAuth()
  const [isCallActive, setIsCallActive] = useState(false)
  const [isIncomingCall, setIsIncomingCall] = useState(false)
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle')
  const [incomingCallData, setIncomingCallData] = useState<{
    from: string
    fromUsername: string
    chatId: string
    offer: any
  } | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)

  console.log('📹 VideoCallModal: Component rendered with props:', { 
    chatId: chat._id, 
    chatType: chat.type, 
    hasSocket: !!socket,
    isIncomingCall,
    callStatus,
    incomingCallData
  })


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
    }
  }, [])



  const handleIncomingCall = useCallback((data: { from: string; fromUsername: string; chatId: string; offer: any }) => {
    console.log('📹 Incoming video call received:', data)
    setIncomingCallData(data)
    setIsIncomingCall(true)
    setCallStatus('idle')
    toast.success(`Incoming video call from ${data.fromUsername}`)
  }, [])

  const initializePeerConnection = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      localStreamRef.current = stream
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('📹 Remote video track received')
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          console.log('🧊 ICE candidate generated')
          socket.emit('video-call-signal', {
            targetUserId: chat.participants.find(p => p._id !== currentUser?._id)?._id,
            signal: event.candidate
          })
        }
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', peerConnection.connectionState)
        if (peerConnection.connectionState === 'connected') {
          console.log('✅ WebRTC connection established')
          setCallStatus('connected')
        } else if (peerConnection.connectionState === 'failed') {
          console.error('❌ WebRTC connection failed')
          toast.error('Call connection failed')
          setCallStatus('ended')
        }
      }

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log('🧊 ICE connection state:', peerConnection.iceConnectionState)
        if (peerConnection.iceConnectionState === 'failed') {
          console.error('❌ ICE connection failed')
          toast.error('Call connection failed')
          setCallStatus('ended')
        }
      }

      peerConnectionRef.current = peerConnection
      setIsCallActive(true)
      
      console.log('✅ Peer connection initialized successfully')
    } catch (error) {
      console.error('Error accessing media devices:', error)
      toast.error('Failed to access camera/microphone')
      throw error
    }
  }, [chat.participants, currentUser?._id, socket])

  const handleCallAnswered = useCallback((data: { from: string; answer: boolean }) => {
    if (data.answer) {
      setCallStatus('connected')
      initializePeerConnection()
    } else {
      setCallStatus('ended')
      toast.error('Call was declined')
    }
  }, [initializePeerConnection])

  const handleCallSignal = useCallback((data: { from: string; signal: any }) => {
    if (peerConnectionRef.current && data.signal) {
      try {
        if (data.signal.type === 'offer') {
          // Handle incoming offer
          peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.signal))
            .then(() => peerConnectionRef.current?.createAnswer())
            .then(answer => peerConnectionRef.current?.setLocalDescription(answer))
            .then(() => {
              // Send answer back
              if (socket) {
                socket.emit('video-call-signal', {
                  targetUserId: chat.participants.find(p => p._id !== currentUser?._id)?._id,
                  signal: peerConnectionRef.current?.localDescription
                })
              }
            })
            .catch(error => {
              console.error('Error handling offer:', error)
              toast.error('Failed to establish call')
            })
        } else if (data.signal.type === 'answer') {
          // Handle incoming answer
          peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.signal))
            .catch(error => {
              console.error('Error handling answer:', error)
              toast.error('Failed to establish call')
            })
        } else if (data.signal.candidate) {
          // Handle ICE candidate
          peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.signal))
            .catch(error => {
              console.error('Error adding ICE candidate:', error)
            })
        }
      } catch (error) {
        console.error('Error handling signal:', error)
      }
    }
  }, [chat.participants, currentUser?._id, socket])

  // Handle call ended by other user
  const handleCallEnded = useCallback((data: { from: string; chatId: string }) => {
    console.log('📞 Call ended by other user:', data.from)
    toast('Call ended by other user', { icon: '📞' })
    setCallStatus('ended')
    setIsCallActive(false)
    setIsIncomingCall(false)
  }, [])

  // Handle call rejected by other user
  const handleCallRejected = useCallback((data: { from: string; chatId: string }) => {
    console.log('📞 Call rejected by other user:', data.from)
    toast.error('Call was rejected')
    setCallStatus('ended')
    setIsCallActive(false)
    setIsIncomingCall(false)
  }, [])

  const startCall = useCallback(async () => {
    if (!socket || chat.type === 'group') return

    const targetUserId = chat.participants.find(p => p._id !== currentUser?._id)?._id
    if (!targetUserId) return

    try {
      setCallStatus('calling')
      
      // Initialize peer connection first
      await initializePeerConnection()
      
      if (peerConnectionRef.current) {
        // Create offer
        const offer = await peerConnectionRef.current.createOffer()
        await peerConnectionRef.current.setLocalDescription(offer)
        
        // Send offer to target user
        socket.emit('video-call-request', {
          targetUserId,
          chatId: chat._id,
          offer: offer
        })

        // Wait for answer
        setTimeout(() => {
          if (callStatus === 'calling') {
            setCallStatus('ended')
            toast.error('Call timed out')
            // Clean up resources manually instead of calling endCall
            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach(track => track.stop())
              localStreamRef.current = null
            }
            if (peerConnectionRef.current) {
              peerConnectionRef.current.close()
              peerConnectionRef.current = null
            }
            setIsCallActive(false)
          }
        }, 30000)
      }
    } catch (error) {
      console.error('Error starting call:', error)
      toast.error('Failed to start call')
      setCallStatus('ended')
    }
  }, [socket, chat.type, chat.participants, chat._id, currentUser?._id, initializePeerConnection, callStatus])

  const answerCall = useCallback(async (accept: boolean) => {
    if (!socket || !incomingCallData) return

    const targetUserId = incomingCallData.from
    if (!targetUserId) return

    if (accept) {
      try {
        console.log('📹 Accepting incoming video call')
        await initializePeerConnection()
        
        // Handle the incoming offer
        if (peerConnectionRef.current && incomingCallData.offer) {
          console.log('📹 Setting remote description from offer')
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer))
          
          // Create answer
          const answer = await peerConnectionRef.current.createAnswer()
          await peerConnectionRef.current.setLocalDescription(answer)
          
          // Send answer back
          socket.emit('video-call-signal', {
            targetUserId,
            signal: answer
          })
          
          console.log('📹 Answer sent, call should connect')
        }
        
        setCallStatus('connected')
      } catch (error) {
        console.error('Error accepting call:', error)
        toast.error('Failed to accept call')
        setCallStatus('ended')
      }
    } else {
      console.log('📹 Rejecting incoming video call')
      // Send rejection signal
      socket.emit('video-call-reject', {
        targetUserId,
        chatId: incomingCallData.chatId
      })
      setCallStatus('ended')
    }

    setIsIncomingCall(false)
    setIncomingCallData(null)
  }, [socket, incomingCallData, initializePeerConnection])

  const rejectCall = useCallback(() => {
    if (!socket || !incomingCallData) return

    console.log('📹 Rejecting incoming video call')
    socket.emit('video-call-reject', {
      targetUserId: incomingCallData.from,
      chatId: incomingCallData.chatId
    })
    
    setCallStatus('ended')
    setIsIncomingCall(false)
    setIncomingCallData(null)
  }, [socket, incomingCallData])

  const endCall = useCallback(() => {
    console.log('📞 Ending call and cleaning up resources')
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('🛑 Stopped track:', track.kind)
      })
      localStreamRef.current = null
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
      console.log('🔒 Closed peer connection')
    }
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
    
    // Notify other user that call ended
    if (socket && callStatus === 'connected') {
      const targetUserId = chat.participants.find(p => p._id !== currentUser?._id)?._id
      if (targetUserId) {
        socket.emit('video-call-end', {
          targetUserId,
          chatId: chat._id
        })
        console.log('📤 Notified other user that call ended')
      }
    }
    
    // Reset state
    setCallStatus('ended')
    setIsCallActive(false)
    setIsIncomingCall(false)
    
    console.log('✅ Call cleanup completed')
  }, [socket, callStatus, chat.participants, chat._id, currentUser?._id])

  const getChatDisplayName = useCallback(() => {
    if (chat.type === 'group') {
      return chat.name || 'Group Chat'
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== currentUser?._id)
      return otherParticipant?.username || 'Unknown User'
    }
  }, [chat.type, chat.name, chat.participants, currentUser?._id])

  // Socket event handlers
  useEffect(() => {
    if (!socket) return

    console.log('📹 VideoCallModal: Setting up socket event handlers')

    socket.on('video-call-incoming', handleIncomingCall)
    socket.on('video-call-answered', handleCallAnswered)
    socket.on('video-call-signal', handleCallSignal)
    socket.on('video-call-ended', handleCallEnded)
    socket.on('video-call-rejected', handleCallRejected)

    return () => {
      console.log('📹 VideoCallModal: Cleaning up socket event handlers')
      socket.off('video-call-incoming', handleIncomingCall)
      socket.off('video-call-answered', handleCallAnswered)
      socket.off('video-call-signal', handleCallSignal)
      socket.off('video-call-ended', handleCallEnded)
      socket.off('video-call-rejected', handleCallRejected)
    }
  }, [socket, handleIncomingCall, handleCallAnswered, handleCallSignal, handleCallEnded, handleCallRejected])

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
                  Incoming Video Call
                </h3>
                <p className="text-gray-600 mb-6">
                  {incomingCallData?.fromUsername || 'Unknown User'} is calling you
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => answerCall(true)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Answer
                  </button>
                  <button
                    onClick={rejectCall}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}

            {callStatus === 'connected' && isCallActive && (
              <div className="space-y-4">
                {/* Call Status */}
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                </div>
                
                {/* Video Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Remote Video (Main) */}
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 lg:h-80 object-cover"
                    />
                    <div className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                      {getChatDisplayName()}
                    </div>
                    {!remoteVideoRef.current?.srcObject && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                            <PhoneIcon className="w-8 h-8" />
                          </div>
                          <p className="text-sm">Connecting...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Local Video (Picture-in-Picture) */}
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-64 lg:h-80 object-cover"
                    />
                    <div className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                      You
                    </div>
                    {!localVideoRef.current?.srcObject && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                            <PhoneIcon className="w-8 h-8" />
                          </div>
                          <p className="text-sm">Camera</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Call Controls */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={endCall}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <PhoneXMarkIcon className="w-5 h-5" />
                    <span>End Call</span>
                  </button>
                </div>
              </div>
            )}

            {callStatus === 'ended' && (
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PhoneXMarkIcon className="w-12 h-12 text-gray-600" />
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