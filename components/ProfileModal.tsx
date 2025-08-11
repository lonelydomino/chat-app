'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProfileView from './ProfileView'
import ProfileEdit from './ProfileEdit'
import { 
  UserIcon, 
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface UserProfile {
  _id: string
  username: string
  email: string
  avatar?: string
  status: 'online' | 'offline' | 'away'
  lastSeen: string
  bio?: string
  displayName?: string
  phoneNumber?: string
  location?: string
  website?: string
  socialLinks?: {
    twitter?: string
    linkedin?: string
    github?: string
  }
  preferences?: {
    theme: 'light' | 'dark' | 'auto'
    notifications: {
      email: boolean
      push: boolean
      sound: boolean
    }
    privacy: {
      showStatus: boolean
      showLastSeen: boolean
      allowDirectMessages: boolean
    }
  }
  createdAt: string
}

interface ProfileModalProps {
  userId?: string
  onClose: () => void
  isOwnProfile?: boolean
}

export default function ProfileModal({ userId, onClose, isOwnProfile = false }: ProfileModalProps) {
  const { user: currentUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile)
    setIsEditing(false)
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <ProfileEdit
        onClose={handleCancelEdit}
        onSave={handleProfileUpdate}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isOwnProfile ? 'My Profile' : 'User Profile'}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {isOwnProfile && (
              <button
                onClick={handleEditClick}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Edit Profile"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
              title="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-4">
          <ProfileView
            userId={userId}
            onClose={onClose}
            isOwnProfile={isOwnProfile}
          />
        </div>
      </div>
    </div>
  )
}
