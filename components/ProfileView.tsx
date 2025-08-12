'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon, 
  GlobeAltIcon,
  CalendarIcon,
  ClockIcon
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
  createdAt: string
}

interface ProfileViewProps {
  userId?: string
  onClose?: () => void
  isOwnProfile?: boolean
}

export default function ProfileView({ userId, onClose, isOwnProfile = false }: ProfileViewProps) {
  const { user: currentUser, token } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return
      
      try {
        setLoading(true)
        const targetUserId = userId || currentUser?._id
        
        if (!targetUserId) {
          setError('No user ID provided')
          return
        }

        // For own profile, use the profile endpoint
        if (isOwnProfile || targetUserId === currentUser?._id) {
          const response = await fetch('/api/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (!response.ok) {
            throw new Error('Failed to fetch profile')
          }
          
          const data = await response.json()
          console.log('Own profile data received:', data.user)
          console.log('Avatar URL:', data.user?.avatar)
          setProfile(data.user)
        } else {
          // For other users, use the public profile endpoint
          const response = await fetch(`/api/users/${targetUserId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (!response.ok) {
            throw new Error('Failed to fetch user profile')
          }
          
          const data = await response.json()
          console.log('Other user profile data received:', data.user)
          console.log('Avatar URL:', data.user?.avatar)
          setProfile(data.user)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [token, userId, currentUser, isOwnProfile])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="animate-pulse">
          <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-300 rounded"></div>
            <div className="h-3 bg-gray-300 rounded w-5/6"></div>
            <div className="h-3 bg-gray-300 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center text-gray-600">
          <p>Profile not found</p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          )}
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-500'
      case 'away':
        return 'text-yellow-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online'
      case 'away':
        return 'Away'
      default:
        return 'Offline'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="relative inline-block">
          {profile.avatar ? (
            <>
              {console.log('Rendering avatar with URL:', profile.avatar)}
              <img
                src={profile.avatar}
                alt={profile.displayName || profile.username}
                className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
                onError={(e) => console.error('Image failed to load:', profile.avatar, e)}
                onLoad={() => console.log('Image loaded successfully:', profile.avatar)}
              />
            </>
          ) : (
            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-12 h-12 text-white" />
            </div>
          )}
          <div className={`absolute bottom-4 right-0 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(profile.status)}`}>
            <div className={`w-full h-full rounded-full ${profile.status === 'online' ? 'bg-green-500' : profile.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {profile.displayName || profile.username}
        </h2>
        <p className="text-gray-600 mb-2">@{profile.username}</p>
        <p className={`text-sm ${getStatusColor(profile.status)}`}>
          {getStatusText(profile.status)}
        </p>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="mb-6">
          <p className="text-gray-700 text-center italic">&ldquo;{profile.bio}&rdquo;</p>
        </div>
      )}

      {/* Contact Information */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-3">
          <EnvelopeIcon className="w-5 h-5 text-gray-400" />
          <span className="text-gray-700">{profile.email}</span>
        </div>
        
        {profile.phoneNumber && (
          <div className="flex items-center space-x-3">
            <PhoneIcon className="w-5 h-5 text-gray-400" />
            <span className="text-gray-700">{profile.phoneNumber}</span>
          </div>
        )}
        
        {profile.location && (
          <div className="flex items-center space-x-3">
            <MapPinIcon className="w-5 h-5 text-gray-400" />
            <span className="text-gray-700">{profile.location}</span>
          </div>
        )}
        
        {profile.website && (
          <div className="flex items-center space-x-3">
            <GlobeAltIcon className="w-5 h-5 text-gray-400" />
            <a 
              href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {profile.website}
            </a>
          </div>
        )}
      </div>

      {/* Social Links */}
      {profile.socialLinks && (profile.socialLinks.twitter || profile.socialLinks.linkedin || profile.socialLinks.github) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Social Links</h3>
          <div className="flex space-x-4 justify-center">
            {profile.socialLinks.twitter && (
              <a
                href={`https://twitter.com/${profile.socialLinks.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-600"
              >
                Twitter
              </a>
            )}
            {profile.socialLinks.linkedin && (
              <a
                href={`https://linkedin.com/in/${profile.socialLinks.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-600"
              >
                LinkedIn
              </a>
            )}
            {profile.socialLinks.github && (
              <a
                href={`https://github.com/${profile.socialLinks.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-600"
              >
                GitHub
              </a>
            )}
          </div>
        </div>
      )}

      {/* Account Info */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4" />
            <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-4 h-4" />
            <span>Last seen {new Date(profile.lastSeen).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Close Button */}
      {onClose && (
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
