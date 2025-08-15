'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
import toast from 'react-hot-toast'

export default function MessageInput() {
  const { currentChat, sendMessage, setTyping } = useSocket()
  const { user, token } = useAuth()
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showFileInput, setShowFileInput] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)
    }

    try {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('file', file) // Changed from 'image' to 'file'

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      
      if (data.fileType === 'image') {
        // Handle image message
        console.log('📤 Sending image message:', {
          type: 'image',
          fileUrl: data.fileUrl,
          fileName: file.name,
          fileSize: file.size
        })
        
        // Temporary workaround: send placeholder content for image messages
        // until the schema validation is updated
        sendMessage('[Image]', 'image', {
          fileUrl: data.fileUrl,
          fileName: file.name,
          fileSize: file.size
        })

        toast.success('Image sent successfully!')
      } else if (data.fileType === 'audio') {
        // Handle audio message
        console.log('🎤 Sending audio message:', {
          type: 'voice',
          fileUrl: data.fileUrl,
          fileName: file.name,
          fileSize: file.size,
          duration: data.duration
        })
        
        sendMessage('[Voice Message]', 'voice', {
          fileUrl: data.fileUrl,
          fileName: file.name,
          fileSize: file.size,
          duration: data.duration
        })

        toast.success('Voice message sent successfully!')
      }

      // Clean up preview if it was an image
      if (file.type.startsWith('image/') && preview) {
        URL.revokeObjectURL(preview)
        setPreview(null)
      }

    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload file')
    } finally {
      setUploading(false)
      setShowFileInput(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [token, onImageUpload, preview])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentChat) return

    // Use the same logic as onDrop
    await onDrop([file])
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        try {
          // Create audio blob
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
          
          // Create a File object from the blob
          const audioFile = new File([audioBlob], `voice-message-${Date.now()}.wav`, { type: 'audio/wav' })
          
          // Upload to Cloudinary
          const formData = new FormData()
          formData.append('file', audioFile)

          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Audio upload failed')
          }

          const data = await response.json()
          
          if (currentChat) {
            console.log('🎤 Sending voice message:', {
              type: 'voice',
              fileUrl: data.fileUrl,
              fileName: audioFile.name,
              fileSize: audioFile.size,
              duration: data.duration
            })
            
            // Send voice message with Cloudinary URL
            sendMessage('[Voice Message]', 'voice', {
              fileUrl: data.fileUrl,
              fileName: audioFile.name,
              fileSize: audioFile.size,
              duration: data.duration
            })

            toast.success('Voice message sent successfully!')
          }
        } catch (error) {
          console.error('Error uploading voice message:', error)
          toast.error('Failed to upload voice message')
        }
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast.error('Failed to access microphone')
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
              accept="image/*,audio/*"
            />
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-blue-600">Uploading...</p>
                  </>
                ) : (
                  <>
                    <PaperClipIcon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Send File</p>
                    <p className="text-xs text-gray-500">Images & Audio (JPG, PNG, WAV, MP3)</p>
                  </>
                )}
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