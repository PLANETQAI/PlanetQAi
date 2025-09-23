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
  const [songs, setSongs] = useState([])
  const [songsLoading, setSongsLoading] = useState(false)
  const [songsError, setSongsError] = useState(null)

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

  const fetchUserSongs = useCallback(async (provider = 'suno') => {
    setSongsLoading(true)
    setSongsError(null)

    try {
      // First check if the user is authenticated
      const sessionResponse = await fetch('/api/auth/session')
      const sessionData = await sessionResponse.json()

      if (!sessionData || !sessionData.user) {
        console.log('User not authenticated, skipping song fetch')
        setSongs([])
        return []
      }

      // Fetch all user songs
      const response = await fetch('/api/songs', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch songs: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.songs && Array.isArray(data.songs)) {
        // Filter songs by provider and map to consistent format
        const filteredSongs = data.songs
          .filter(song => {
            // Check if it's a song from the specified provider
            if (song.provider === provider) return true;
            if (song.tags?.includes(`provider:${provider}`)) return true;
            return false;
          })
          .map(song => {
            // Extract properties from song data or tags, no defaults
            const style = song.style || 
              song.tags?.find(tag => tag.startsWith('style:'))?.split(':')[1];
              
            const tempo = song.tempo || 
              song.tags?.find(tag => tag.startsWith('tempo:'))?.split(':')[1];
              
            const mood = song.mood ||
              song.tags?.find(tag => tag.startsWith('mood:'))?.split(':')[1];

            return {
              id: song.id,
              title: song.title || 'Untitled Song',
              audioUrl: song.audioUrl || song.song_path,
              song_path: song.song_path || song.audioUrl,
              lyrics: song.lyrics,
              coverImageUrl: song.thumbnailUrl || song.coverImageUrl || song.image_path,
              image_path: song.image_path || song.coverImageUrl || song.thumbnailUrl,
              duration: song.duration || 0,
              createdAt: song.createdAt,
              isForSale: Boolean(song.isForSale),
              provider: song.provider || provider,
              prompt: song.prompt,
              style,
              tempo,
              mood,
              status: song.status || 'completed'
            };
          });

        setSongs(filteredSongs);
        return filteredSongs;
      }
      
      setSongs([]);
      return [];
      
    } catch (error) {
      console.error('Error fetching songs:', error);
      setSongsError(error.message);
      return [];
    } finally {
      setSongsLoading(false);
    }
  }, []);

  const value = {
    isOpen,
    open: openHandler,
    close,
    credits,
    creditsLoading,
    creditsError,
    fetchUserCredits,
    songs,
    songsLoading,
    songsError,
    fetchUserSongs
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

// Helper function to extract properties from song tags
const extractFromTags = (tags, key) => {
  if (!Array.isArray(tags)) return null;
  const tag = tags.find(t => t.startsWith(`${key}:`));
  return tag ? tag.split(':')[1] : null;
};
