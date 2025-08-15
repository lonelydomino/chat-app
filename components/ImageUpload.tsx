'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { 
  PhotoIcon, 
  XMarkIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline'

interface ImageUploadProps {
  currentImage?: string
  onImageUpload: (imageUrl: string) => void
  onRemove?: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ImageUpload({ 
  currentImage, 
  onImageUpload, 
  onRemove,
  size = 'md',
  className = ''
}: ImageUploadProps) {
  const { token } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-40 h-40'
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    // Create preview
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    try {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('image', file)

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
      
      // Auto-save the avatar to the profile
      try {
        const profileResponse = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            avatar: data.fileUrl
          })
        })

        if (profileResponse.ok) {
          // Update the local state
          onImageUpload(data.fileUrl)
          toast.success('Profile picture updated successfully!')
          
          // Clean up preview
          URL.revokeObjectURL(previewUrl)
          setPreview(null)
        } else {
          throw new Error('Failed to update profile')
        }
      } catch (profileError) {
        console.error('Failed to auto-save avatar:', profileError)
        toast.error('Image uploaded but failed to update profile')
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
      // Clean up preview on error
      URL.revokeObjectURL(previewUrl)
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }, [token, onImageUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false
  })

  const handleRemove = () => {
    if (onRemove) {
      onRemove()
    } else {
      onImageUpload('')
    }
  }

  const displayImage = preview || currentImage

  return (
    <div className={`relative ${className}`}>
      {/* Image Display */}
      {displayImage && (
        <div className={`relative ${sizeClasses[size]} mx-auto`}>
          <img
            src={displayImage}
            alt="Profile"
            className="w-full h-full object-cover rounded-full border-2 border-gray-200"
          />
          
          {/* Remove Button */}
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Remove image"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      {!displayImage && (
        <div
          {...getRootProps()}
          className={`${sizeClasses[size]} mx-auto border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-100' : ''
          }`}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="text-center">
              <ArrowUpTrayIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {isDragActive ? 'Drop image here' : 'Click or drag image'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Max 5MB • JPG, PNG, GIF, WebP
              </p>
            </div>
          )}
        </div>
      )}

      {/* Upload Button for Existing Images */}
      {displayImage && (
        <div className="mt-3 text-center">
          <button
            {...getRootProps()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <input {...getInputProps()} />
            {uploading ? 'Uploading...' : 'Change Image'}
          </button>
        </div>
      )}
    </div>
  )
}
