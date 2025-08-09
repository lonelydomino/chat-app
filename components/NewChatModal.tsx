'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { XMarkIcon as XIcon, UserIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface NewChatModalProps {
  onClose: () => void
}

interface User {
  _id: string
  username: string
  email: string
  avatar?: string
  status: 'online' | 'offline' | 'away'
  createdAt: string
}

export default function NewChatModal({ onClose }: NewChatModalProps) {
  const { createChat } = useSocket()
  const { user } = useAuth()
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct')
  const [groupName, setGroupName] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // In a real app, you'd fetch users from an API
    // For now, we'll use mock data with proper ObjectIds
    setUsers([
      { _id: '68940b28a3161935e52cfb2e', username: 'john_doe', email: 'john@example.com', status: 'online' },
      { _id: '68940b28a3161935e52cfb2f', username: 'jane_smith', email: 'jane@example.com', status: 'offline' },
      { _id: '68940b28a3161935e52cfb30', username: 'bob_wilson', email: 'bob@example.com', status: 'away' },
      { _id: '68940b28a3161935e52cfb31', username: 'milo', email: 'milo@example.com', status: 'online' },
    ])
  }, [])

  const filteredUsers = users.filter(u => 
    u._id !== user?._id && 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleUserToggle = (userId: string) => {
    if (chatType === 'direct') {
      setSelectedUsers([userId])
    } else {
      setSelectedUsers(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      )
    }
  }

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user')
      return
    }

    if (chatType === 'group' && !groupName.trim()) {
      toast.error('Please enter a group name')
      return
    }

    setIsLoading(true)
    try {
      await createChat(chatType, selectedUsers, chatType === 'group' ? groupName : undefined)
      toast.success(`${chatType === 'direct' ? 'Chat' : 'Group'} created successfully!`)
      onClose()
    } catch (error) {
      toast.error('Failed to create chat')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">New Chat</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Chat type selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Chat Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setChatType('direct')}
                  className={`p-3 border rounded-lg flex items-center space-x-2 transition-colors ${
                    chatType === 'direct'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <UserIcon className="w-5 h-5" />
                  <span>Direct Message</span>
                </button>
                <button
                  onClick={() => setChatType('group')}
                  className={`p-3 border rounded-lg flex items-center space-x-2 transition-colors ${
                    chatType === 'group'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <UserGroupIcon className="w-5 h-5" />
                  <span>Group Chat</span>
                </button>
              </div>
            </div>

            {/* Group name input */}
            {chatType === 'group' && (
              <div className="mb-6">
                <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* User search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {chatType === 'direct' ? 'Select User' : 'Select Users'}
              </label>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* User list */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredUsers.map(user => (
                <button
                  key={user._id}
                  onClick={() => handleUserToggle(user._id)}
                  className={`w-full p-3 text-left border rounded-lg transition-colors ${
                    selectedUsers.includes(user._id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user.username}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      user.status === 'online' ? 'bg-green-500' :
                      user.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                </button>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No users found
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateChat}
              disabled={isLoading || selectedUsers.length === 0 || (chatType === 'group' && !groupName.trim())}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Chat'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
} 