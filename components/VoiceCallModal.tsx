'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PhoneIcon, 
  PhoneXMarkIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface VoiceCallModalProps {
  isOpen: boolean
  onClose: () => void
  callType: 'incoming' | 'outgoing' | 'active'
  caller?: {
    _id: string
    username: string
    avatar?: string
  }
  chatId?: string
}

export default function VoiceCallModal({ 
  isOpen, 
  onClose, 
  callType, 
  caller, 
  chatId 
}: VoiceCallModalProps) {
  const { socket, currentChat } = useSocket()
  const { user } = useAuth()
  
  const [callStatus, setCallStatus] = useState<'ringing' | 'connecting' | 'connected' | 'ended'>('ringing')
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  
  const localAudioRef = useRef<HTMLAudioElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const ringtoneRef = useRef<{ interval: NodeJS.Timeout; audioContext: AudioContext } | null>(null)

  // Start call timer
  const startCallTimer = useCallback(() => {
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
  }, [])

  // Stop call timer
  const stopCallTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
  }, [])

  // Play ringtone
  const playRingtone = useCallback(() => {
    try {
      // Create a simple ringtone using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.5)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
      
      // Repeat the ringtone
      const ringtoneInterval = setInterval(() => {
        const newOscillator = audioContext.createOscillator()
        const newGainNode = audioContext.createGain()
        
        newOscillator.connect(newGainNode)
        newGainNode.connect(audioContext.destination)
        
        newOscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        newOscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.5)
        
        newGainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        newGainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
        
        newOscillator.start(audioContext.currentTime)
        newOscillator.stop(audioContext.currentTime + 0.5)
      }, 500)
      
      // Store interval for cleanup
      ringtoneRef.current = { interval: ringtoneInterval, audioContext } as any
    } catch (error) {
      console.error('Error playing ringtone:', error)
    }
  }, [])

  // Stop ringtone
  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current?.interval) {
      clearInterval(ringtoneRef.current.interval)
      if (ringtoneRef.current.audioContext) {
        ringtoneRef.current.audioContext.close()
      }
      ringtoneRef.current = null
    }
  }, [])

  // Initialize WebRTC peer connection
  const initializePeerConnection = useCallback(() => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }

    const pc = new RTCPeerConnection(configuration)
    
    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('🎤 Remote audio track received')
      setRemoteStream(event.streams[0])
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('voice-call-signal', {
          targetUserId: caller?._id,
          signal: { type: 'ice-candidate', candidate: event.candidate }
        })
      }
    }

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState)
      if (pc.connectionState === 'connected') {
        setCallStatus('connected')
        startCallTimer()
        stopRingtone()
      }
    }

    peerConnectionRef.current = pc
    return pc
  }, [caller?._id, socket, startCallTimer, stopRingtone])

  // Start local audio stream
  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      setLocalStream(stream)
      
      // Add local stream to peer connection
      if (peerConnectionRef.current) {
        stream.getTracks().forEach(track => {
          peerConnectionRef.current?.addTrack(track, stream)
        })
      }

      // Play local audio (for testing)
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream
        localAudioRef.current.volume = 0.1 // Low volume for local audio
      }
    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast.error('Failed to access microphone')
    }
  }, [])

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle incoming call
  const handleIncomingCall = useCallback(async () => {
    if (callType === 'incoming') {
      setCallStatus('connecting')
      playRingtone()
      
      // Initialize peer connection
      const pc = initializePeerConnection()
      await startLocalStream()
      
      // Create answer
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        
        socket?.emit('voice-call-answer', {
          targetUserId: caller?._id,
          answer: offer
        })
      } catch (error) {
        console.error('Error creating offer:', error)
        toast.error('Failed to establish call')
      }
    }
  }, [callType, caller?._id, socket, initializePeerConnection, startLocalStream, playRingtone])

  // Handle outgoing call
  const handleOutgoingCall = useCallback(async () => {
    if (callType === 'outgoing') {
      setCallStatus('connecting')
      
      // Initialize peer connection
      const pc = initializePeerConnection()
      await startLocalStream()
      
      // Create offer
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        
        socket?.emit('voice-call-request', {
          targetUserId: caller?._id,
          chatId: chatId || currentChat?._id,
          offer: offer
        })
      } catch (error) {
        console.error('Error creating offer:', error)
        toast.error('Failed to establish call')
      }
    }
  }, [callType, caller?._id, chatId, currentChat?._id, socket, initializePeerConnection, startLocalStream])

  // Handle call actions
  const handleMuteToggle = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!isMuted)
      }
    }
  }

  const handleSpeakerToggle = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = isSpeakerOn ? 0.5 : 1.0
      setIsSpeakerOn(!isSpeakerOn)
    }
  }

  const handleEndCall = () => {
    setCallStatus('ended')
    stopCallTimer()
    stopRingtone()
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    
    // Emit end call signal
    socket?.emit('voice-call-end', {
      targetUserId: caller?._id,
      chatId: chatId || currentChat?._id
    })
    
    // Close modal after delay
    setTimeout(() => {
      onClose()
    }, 1000)
  }

  // Handle call rejection
  const handleRejectCall = () => {
    socket?.emit('voice-call-reject', {
      targetUserId: caller?._id,
      chatId: chatId || currentChat?._id
    })
    onClose()
  }

  // Initialize call based on type
  useEffect(() => {
    if (isOpen) {
      if (callType === 'incoming') {
        handleIncomingCall()
      } else if (callType === 'outgoing') {
        handleOutgoingCall()
      }
    }
  }, [isOpen, callType, handleIncomingCall, handleOutgoingCall])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCallTimer()
      stopRingtone()
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
    }
  }, [localStream, stopCallTimer, stopRingtone])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center"
        >
          {/* Caller Info */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PhoneIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {callType === 'incoming' ? 'Incoming Call' : 
               callType === 'outgoing' ? 'Calling...' : 'Voice Call'}
            </h2>
            <p className="text-gray-600">{caller?.username}</p>
            
            {/* Call Status */}
            {callStatus === 'connected' && (
              <p className="text-sm text-green-600 mt-2">
                {formatDuration(callDuration)}
              </p>
            )}
          </div>

          {/* Call Controls */}
          <div className="flex justify-center space-x-4 mb-6">
            {/* Mute Button */}
            <button
              onClick={handleMuteToggle}
              className={`p-4 rounded-full transition-colors ${
                isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              <MicrophoneIcon className="w-6 h-6" />
            </button>

            {/* Speaker Button */}
            <button
              onClick={handleSpeakerToggle}
              className={`p-4 rounded-full transition-colors ${
                isSpeakerOn ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
              title={isSpeakerOn ? 'Speaker Off' : 'Speaker On'}
            >
              {isSpeakerOn ? (
                <SpeakerWaveIcon className="w-6 h-6" />
              ) : (
                <SpeakerXMarkIcon className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Call Action Buttons */}
          <div className="flex justify-center space-x-4">
            {callType === 'incoming' && callStatus === 'ringing' && (
              <>
                <button
                  onClick={handleRejectCall}
                  className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Reject Call"
                >
                  <PhoneXMarkIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={handleIncomingCall}
                  className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                  title="Answer Call"
                >
                  <PhoneIcon className="w-6 h-6" />
                </button>
              </>
            )}

            {callStatus === 'connected' && (
              <button
                onClick={handleEndCall}
                className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="End Call"
              >
                <PhoneXMarkIcon className="w-6 h-6" />
              </button>
            )}

            {callType === 'outgoing' && callStatus === 'connecting' && (
              <button
                onClick={handleEndCall}
                className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Cancel Call"
              >
                <PhoneXMarkIcon className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Hidden Audio Elements */}
          <audio ref={localAudioRef} autoPlay muted />
          <audio ref={remoteAudioRef} autoPlay />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
