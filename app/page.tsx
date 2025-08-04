'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthForm from '@/components/AuthForm'
import ChatInterface from '@/components/ChatInterface'
import { AuthProvider } from '@/contexts/AuthContext'
import { SocketProvider } from '@/contexts/SocketContext'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <SocketProvider>
        <div className="min-h-screen bg-gray-50">
          {isAuthenticated ? (
            <ChatInterface />
          ) : (
            <AuthForm />
          )}
        </div>
      </SocketProvider>
    </AuthProvider>
  )
} 