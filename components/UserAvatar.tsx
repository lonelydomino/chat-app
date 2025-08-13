'use client'

import { UserIcon, UserGroupIcon } from '@heroicons/react/24/outline'

interface UserAvatarProps {
  user: {
    _id: string
    username: string
    avatar?: string
    displayName?: string
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showStatus?: boolean
  status?: 'online' | 'offline' | 'away'
}

export default function UserAvatar({ 
  user, 
  size = 'md', 
  className = '',
  showStatus = false,
  status = 'offline'
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400'
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.displayName || user.username}
          className="w-full h-full rounded-full object-cover border-2 border-gray-200"
        />
      ) : (
        <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center border-2 border-gray-200">
          <UserIcon className={`${iconSizes[size]} text-white`} />
        </div>
      )}
      
      {showStatus && (
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${statusColors[status]}`}></div>
      )}
    </div>
  )
}

interface GroupAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function GroupAvatar({ size = 'md', className = '' }: GroupAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <div className={`${sizeClasses[size]} bg-blue-500 rounded-full flex items-center justify-center border-2 border-gray-200 ${className}`}>
      <UserGroupIcon className={`${iconSizes[size]} text-white`} />
    </div>
  )
}
