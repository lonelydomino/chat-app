'use client'

import { useState, useRef, useEffect } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { 
  PaperClipIcon, 
  MicrophoneIcon, 
  StopIcon,
  ArrowUpIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

export default function MessageInput() {
  const { currentChat, sendMessage, setTyping } = useSocket()
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showFileInput, setShowFileInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    let typingTimeout: NodeJS.Timeout

    if (isTyping) {
      setTyping(currentChat?._id || '', true)
      typingTimeout = setTimeout(() => {
        setIsTyping(false)
        setTyping(currentChat?._id || '', false)
      }, 1000)
    } else {
      setTyping(currentChat?._id || '', false)
    }

    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
    }
  }, [isTyping, currentChat, setTyping])

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    setIsTyping(true)
  }

  const handleSendMessage = () => {
    if (message.trim() && currentChat) {
      sendMessage(message.trim())
      setMessage('')
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && currentChat) {
      // In a real app, you'd upload the file to a server first
      const fileUrl = URL.createObjectURL(file)
      sendMessage('', 'file', {
        fileUrl,
        fileName: file.name,
        fileSize: file.size
      })
    }
    setShowFileInput(false)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        if (currentChat) {
          sendMessage('', 'voice', {
            fileUrl: audioUrl,
            duration: Math.round(audioChunksRef.current.length / 1000) // Rough estimate
          })
        }
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  if (!currentChat) return null

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end space-x-2">
        {/* File upload button */}
        <button
          onClick={() => setShowFileInput(!showFileInput)}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          title="Attach file"
        >
          <PaperClipIcon className="w-5 h-5" />
        </button>

        {/* Voice recording button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 rounded-full transition-colors ${
            isRecording 
              ? 'text-red-600 bg-red-50 hover:bg-red-100' 
              : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
          }`}
          title={isRecording ? 'Stop recording' : 'Record voice message'}
        >
          {isRecording ? (
            <StopIcon className="w-5 h-5" />
          ) : (
            <MicrophoneIcon className="w-5 h-5" />
          )}
        </button>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          {/* Emoji button */}
          <button className="absolute right-2 bottom-2 p-1 text-gray-400 hover:text-gray-600">
                            <FaceSmileIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Send button */}
        <button
          onClick={handleSendMessage}
          disabled={!message.trim()}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Send message"
        >
                          <ArrowUpIcon className="w-5 h-5" />
        </button>
      </div>

      {/* File input */}
      <AnimatePresence>
        {showFileInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 transition-colors"
              >
                <PaperClipIcon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Upload File</p>
              </button>
              <button
                onClick={() => {
                  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    startRecording()
                  }
                }}
                className="p-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 transition-colors"
              >
                <MicrophoneIcon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Voice Message</p>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording indicator */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center space-x-2 text-red-600"
        >
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          <span className="text-sm">Recording...</span>
        </motion.div>
      )}
    </div>
  )
} 