'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PaperClipIcon, 
  PlayIcon, 
  PauseIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

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

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showTime: boolean
  time: string
}

export default function MessageBubble({ message, isOwn, showTime, time }: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        )

      case 'file':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <PaperClipIcon className="w-5 h-5 text-gray-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {message.fileName}
              </p>
              <p className="text-xs text-gray-500">
                {message.fileSize && formatFileSize(message.fileSize)}
              </p>
            </div>
            <button
              onClick={() => window.open(message.fileUrl, '_blank')}
              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
          </div>
        )

      case 'voice':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
            >
              {isPlaying ? (
                <PauseIcon className="w-4 h-4" />
              ) : (
                <PlayIcon className="w-4 h-4" />
              )}
            </button>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${audioProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {message.duration && formatDuration(message.duration)}
              </p>
            </div>
          </div>
        )

      case 'image':
        return (
          <div className="max-w-xs">
            <img
              src={message.fileUrl}
              alt="Shared image"
              className="rounded-lg max-w-full h-auto"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik01MCA1MEgxNTBWMTUwSDUwVjUwWiIgZmlsbD0iI0QxRDVFM0EiLz4KPHBhdGggZD0iTTYwIDYwSDE0MFYxNDBINjBWNjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik03MCA3MEgxMzBWMTMwSDcwVjcwWiIgZmlsbD0iIzY2NzM4MCIvPgo8L3N2Zz4K'
              }}
            />
          </div>
        )

      default:
        return <div>{message.content}</div>
    }
  }

  const renderReplyTo = () => {
    if (!message.replyTo) return null

    return (
      <div className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'} mb-1`}>
        Replying to {message.replyTo.sender.username}: {message.replyTo.content.substring(0, 30)}...
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'ml-auto' : 'mr-auto'}`}>
        {/* Reply indicator */}
        {renderReplyTo()}
        
        {/* Message bubble */}
        <div
          className={`message-bubble ${
            isOwn ? 'message-sent' : 'message-received'
          }`}
        >
          {renderMessageContent()}
        </div>

        {/* Message metadata */}
        {showTime && (
          <div className={`flex items-center justify-end mt-1 space-x-2 text-xs text-gray-500 ${isOwn ? 'flex-row' : 'flex-row-reverse'}`}>
            <span>{time}</span>
            {isOwn && (
              <div className="flex items-center space-x-1">
                <EyeIcon className="w-3 h-3" />
                <span>{message.readBy.length}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
} 