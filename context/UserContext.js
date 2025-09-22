'use client'

import { createContext, useContext, useState, useCallback } from 'react'

// Create a context object
const UserContext = createContext()

// Create a provider component
export const UserProvider = ({ children }) => {
  const [isOpen, setOpen] = useState(false)
  const [credits, setCredits] = useState(null)
  const [creditsLoading, setCreditsLoading] = useState(false)
  const [creditsError, setCreditsError] = useState(null)

  const close = () => {
    setOpen(false)
  }

  const openHandler = () => {
    setOpen(true)
  }

  const fetchUserCredits = useCallback(async () => {
    setCreditsLoading(true)
    setCreditsError(null)

    try {
      // First check if the user is authenticated by getting the session
      const sessionResponse = await fetch('/api/auth/session')
      const sessionData = await sessionResponse.json()

      // If not authenticated, return null credits
      if (!sessionData || !sessionData.user) {
        console.log('User not authenticated')
        setCredits(null)
        return null
      }

      // Now fetch credits with the authenticated session
      const response = await fetch('/api/credits-api', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          setCredits(null)
          return null
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch credits: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setCredits(data)
      return data
    } catch (error) {
      console.error('Error fetching credits:', error)
      setCreditsError(error.message || 'Failed to load credits. Please try again.')
      throw error
    } finally {
      setCreditsLoading(false)
    }
  }, [])

  const updateCredits = useCallback((newCredits) => {
    setCredits(newCredits)
  }, [])

  const value = {
    isOpen,
    close,
    openHandler,
    credits,
    creditsLoading,
    creditsError,
    fetchUserCredits,
    updateCredits
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

// Custom hook for accessing the context
export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
