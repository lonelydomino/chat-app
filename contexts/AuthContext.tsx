'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import toast from 'react-hot-toast'

interface User {
  _id: string
  username: string
  email: string
  avatar?: string
  status: 'online' | 'offline' | 'away'
  createdAt: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      const parsedUser = JSON.parse(storedUser)
      console.log('📱 User data loaded from localStorage:', { 
        userId: parsedUser._id, 
        username: parsedUser.username, 
        avatar: parsedUser.avatar,
        hasAvatar: !!parsedUser.avatar 
      })
      setUser(parsedUser)
    }
    
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      setUser(data.user)
      setToken(data.token)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      toast.success('Login successful!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setUser(data.user)
      setToken(data.token)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      toast.success('Registration successful!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    if (!token) return
    
    try {
      console.log('🔄 Refreshing user data...')
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ User data refreshed:', { 
          userId: data.user._id, 
          username: data.user.username, 
          avatar: data.user.avatar,
          hasAvatar: !!data.user.avatar 
        })
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
      } else {
        console.error('❌ Failed to refresh user data:', response.status)
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
  }

  const value = {
    user,
    token,
    login,
    register,
    logout,
    refreshUser,
    isLoading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 