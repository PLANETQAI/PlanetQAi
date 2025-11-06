'use client';

import axios from 'axios';
import { useSession } from 'next-auth/react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const GeneratorContext = createContext();

export function GeneratorProvider({ children }) {
  const { data: session } = useSession();
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorData, setGeneratorData] = useState(null);
  const [generationState, setGenerationState] = useState({
    isGenerating: false,
    progress: 0,
    status: 'idle', // 'idle' | 'generating' | 'completed' | 'error'
    error: null,
    generatedSongs: [],
    currentSong: null,
    credits: 0
  });
  
  const pollingInterval = useRef(null);
  const progressInterval = useRef(null);

  // Existing generator methods
  const openGenerator = useCallback((data = null) => {
    if (data) {
      setGeneratorData(data);
    }
    setShowGenerator(true);
  }, []);

  const closeGenerator = useCallback(() => {
    setShowGenerator(false);
    // Clear data after a small delay to allow for animations
    const timer = setTimeout(() => {
      setGeneratorData(null);
      // Reset generation state when closing
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        progress: 0,
        status: 'idle',
        error: null
      }));
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Fetch user credits from /api/credits-api
  const fetchUserCredits = useCallback(async () => {
    try {
      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();

      // If not authenticated, return null
      if (!sessionData || !sessionData.user) {
        console.log('User not authenticated');
        setGenerationState(prev => ({ ...prev, credits: 0, isLoading: false }));
        return 0;
      }

      // Fetch credits from the correct endpoint
      const response = await fetch('/api/credits-api', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setGenerationState(prev => ({ ...prev, credits: 0, isLoading: false }));
          return 0;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch credits: ${response.status}`);
      }

      const data = await response.json();
      const credits = data.credits || 0;
      setGenerationState(prev => ({ ...prev, credits, isLoading: false }));
      return credits;
    } catch (error) {
      console.error('Error fetching credits:', error);
      setGenerationState(prev => ({
        ...prev,
        error: error.message || 'Failed to load credits. Please try again.',
        isLoading: false
      }));
      return 0;
    }
  }, []);

  // New: Handle song generation
  const generateSong = useCallback(async (songData) => {
    if (!session) {
      setGenerationState(prev => ({
        ...prev,
        status: 'error',
        error: 'Please sign in to generate songs'
      }));
      return false;
    }

    try {
      // Check credits
      const credits = await fetchUserCredits();
      if (credits < 85) {
        setGenerationState(prev => ({
          ...prev,
          status: 'error',
          error: 'Insufficient credits'
        }));
        return false;
      }

      setGenerationState(prev => ({
        ...prev,
        isGenerating: true,
        status: 'generating',
        progress: 0,
        error: null
      }));

      // Start progress simulation
      progressInterval.current = setInterval(() => {
        setGenerationState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 5, 90)
        }));
      }, 1000);

      // Call your music generation API
      const response = await axios.post('/api/music/generate', songData);
      const { taskId, songId } = response.data;

      // Start polling for status
      startPolling(taskId, songId);
      return { taskId, songId };

    } catch (error) {
      console.error('Error generating song:', error);
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        status: 'error',
        error: error.message || 'Failed to start generation'
      }));
      return false;
    }
  }, [session, fetchUserCredits]);

  // New: Polling function
  const checkStatus = useCallback(async (taskId, songId) => {
    try {
      const response = await axios.get(`/api/music/status-suno?taskId=${taskId}&songId=${songId}`);
      const statusData = response.data;

      if (statusData.status === 'completed' && statusData.output?.songs?.length > 0) {
        const songs = statusData.output.songs;
        const newSong = {
          ...songs[0],
          id: songId,
          audio_url: songs[0].song_path,
          image_url: songs[0].image_path,
          lyrics: songs[0].lyrics
        };

        setGenerationState(prev => ({
          ...prev,
          isGenerating: false,
          status: 'completed',
          progress: 100,
          generatedSongs: [...prev.generatedSongs, newSong],
          currentSong: newSong
        }));

        // Clear intervals
        if (progressInterval.current) clearInterval(progressInterval.current);
        if (pollingInterval.current) clearInterval(pollingInterval.current);

        // Refresh credits
        await fetchUserCredits();

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking status:', error);
      return false;
    }
  }, [fetchUserCredits]);

  // New: Start polling function
  const startPolling = useCallback((taskId, songId) => {
    // Clear any existing polling
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    // Start polling every 5 seconds
    pollingInterval.current = setInterval(() => {
      checkStatus(taskId, songId);
    }, 5000);

    // Initial check
    checkStatus(taskId, songId);
  }, [checkStatus]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  // Initial credits fetch
  useEffect(() => {
    if (session) {
      fetchUserCredits();
    }
  }, [session, fetchUserCredits]);

  // Context value
  const contextValue = {
    // Generator state
    showGenerator,
    generatorData,
    
    // Generation state
    ...generationState,
    
    // Methods
    openGenerator,
    closeGenerator,
    generateSong,
    fetchUserCredits
  };

  return (
    <GeneratorContext.Provider value={contextValue}>
      {children}
    </GeneratorContext.Provider>
  );
}

export const useGenerator = () => {
  const context = useContext(GeneratorContext);
  if (!context) {
    throw new Error('useGenerator must be used within a GeneratorProvider');
  }
  return context;
};