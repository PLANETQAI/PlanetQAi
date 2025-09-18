'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AudioPlayer from '@/components/player/audioPlayer';
import { Loader2, Music, AlertCircle } from 'lucide-react';

const Generator = ({
  songData,
  isOpen = false,
  onClose = () => {},
  onSuccess = () => {},
  onError = () => {}
}) => {
  const [status, setStatus] = useState('idle'); // 'idle' | 'generating' | 'completed' | 'error'
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [taskId, setTaskId] = useState(null);
  const [songId, setSongId] = useState(null);
  const [generatedSongs, setGeneratedSongs] = useState([]);
  const [selectedSongIndex, setSelectedSongIndex] = useState(0);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [generationStartTime, setGenerationStartTime] = useState(null);
  const [generationDuration, setGenerationDuration] = useState(null);
  const [timerInterval, setTimerInterval] = useState(null);
  const [statusCheckCount, setStatusCheckCount] = useState(0);
  const [userCredits, setUserCredits] = useState(null)
  
  // Fetch user's songs on component mount
  useEffect(() => {
    const fetchUserSongs = async () => {
      try {
        const response = await fetch('/api/songs');
        if (response.ok) {
          const data = await response.json();
          setGeneratedSongs(data.songs || []);
        }
      } catch (error) {
        console.error('Error fetching user songs:', error);
      }
    };
    
    if (isOpen) {
      fetchUserSongs();
    }
  }, [isOpen]);
  
  // Select the latest song when songs are updated
  useEffect(() => {
    if (generatedSongs.length > 0 && selectedSongIndex === 0) {
      setSelectedSongIndex(0);
    }
  }, [generatedSongs]);

  useEffect(() => {
    fetchUserCredits()
  }, [])

  const fetchUserCredits = async () => {
    try {
        // First check if the user is authenticated by getting the session
        const sessionResponse = await fetch('/api/auth/session')
        const sessionData = await sessionResponse.json()
        
        // If not authenticated, redirect to login page
        if (!sessionData || !sessionData.user) {
            console.log('User not authenticated, redirecting to login')
            window.location.href = '/login?redirectTo=' + encodeURIComponent(window.location.pathname)
            return
        }
        
        // Now fetch credits with the authenticated session
        const response = await fetch('/api/credits-api', {
            method: 'GET',
            credentials: 'include', // This ensures cookies are sent with the request
            headers: {
                'Content-Type': 'application/json'
            }
        })
        
        if (!response.ok) {
            // If unauthorized, redirect to login
            if (response.status === 401) {
                window.location.href = '/login?redirectTo=' + encodeURIComponent(window.location.pathname)
                return
            }
            throw new Error(`Failed to fetch credits: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        setUserCredits(data)
    } catch (error) {
        console.error('Error fetching credits:', error)
    }
}
  
  // Handle song selection
  const selectSong = (index) => {
    setSelectedSongIndex(index);
  };
  
  // Handle song deletion
  const deleteSong = async (songId) => {
    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setGeneratedSongs(prevSongs => 
          prevSongs.filter(song => song.id !== songId)
        );
        
        // Reset selection if the deleted song was selected
        if (generatedSongs[selectedSongIndex]?.id === songId) {
          setSelectedSongIndex(0);
        }
      }
    } catch (error) {
      console.error('Error deleting song:', error);
      setError('Failed to delete song');
    }
  };
  
  // Update song title
  const updateSongTitle = async (songId, newTitle) => {
    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      
      if (response.ok) {
        setGeneratedSongs(prevSongs =>
          prevSongs.map(song =>
            song.id === songId ? { ...song, title: newTitle } : song
          )
        );
      }
    } catch (error) {
      console.error('Error updating song title:', error);
      throw error;
    }
  };

  // Format time in MM:SS format
  const formatTime = (ms) => {
    if (!ms) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Start the generation timer
  const startTimer = useCallback(() => {
    const startTime = Date.now();
    setGenerationStartTime(startTime);
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setGenerationDuration(elapsed);
    }, 1000);
    
    setTimerInterval(interval);
    return () => clearInterval(interval);
  }, []);

  // Stop the generation timer
  const stopTimer = useCallback(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    if (generationStartTime) {
      const now = Date.now();
      const elapsed = now - generationStartTime;
      setGenerationDuration(elapsed);
      console.log(`Generation completed in ${formatTime(elapsed)}`);
    }
  }, [timerInterval, generationStartTime]);

  // Handle audio play events to ensure only one audio plays at a time
  const handleAudioPlay = (audioElement) => {
    if (currentAudio && currentAudio !== audioElement) {
      currentAudio.pause();
    }
    setCurrentAudio(audioElement);
  };

  // Check status of a task
  const checkStatus = async (taskId, songId) => {
    try {
      setStatusCheckCount(prev => prev + 1);
      
      const response = await axios.get(`/api/music/status-suno?taskId=${taskId}&songId=${songId}`);
      const result = response.data;
      
      console.log('Status check result:', result);
      
      if (result.status === 'completed' || result.status === 'succeeded') {
        // Handle completed generation
        const song = result.output?.songs?.[0];
        if (song) {
          setGeneratedSongs([song]); // Update to use setGeneratedSongs with array
          setStatus('completed');
          setProgress(100);
          stopTimer();
          onSuccess(song);
          return { completed: true, song };
        }
      } else if (result.status === 'failed') {
        throw new Error(result.error || 'Generation failed');
      }
      
      // Update progress if available
      if (result.progress) {
        setProgress(Math.min(95, result.progress));
      }
      
      return { completed: false };
    } catch (error) {
      console.error('Error checking status:', error);
      throw error;
    }
  };

  // Poll for generation completion
  const pollForCompletion = useCallback(async (taskId, songId) => {
    try {
      startTimer();
      
      // Initial delay before starting to poll
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Poll every 3 seconds, with exponential backoff up to 10 seconds
      let pollInterval = 3000;
      const maxInterval = 10000;
      let attempts = 0;
      const maxAttempts = 60; // ~5 minutes max
      
      while (attempts < maxAttempts) {
        try {
          const { completed } = await checkStatus(taskId, songId);
          if (completed) return;
          
          // Increase interval with backoff, but cap at maxInterval
          pollInterval = Math.min(pollInterval * 1.5, maxInterval);
          attempts++;
          
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        } catch (error) {
          console.error('Error during polling:', error);
          // Continue polling on error, but with increased backoff
          pollInterval = Math.min(pollInterval * 2, maxInterval);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      }
      
      throw new Error('Generation timed out');
    } catch (error) {
      console.error('Polling failed:', error);
      setStatus('error');
      setError(error.message || 'Failed to complete generation');
      onError(error);
    } finally {
      stopTimer();
    }
  }, [startTimer, stopTimer, onError]);

  // Handle song generation
  const handleGenerate = useCallback(async () => {
    if (!songData) {
      const err = new Error('No song data provided');
      setStatus('error');
      setError(err.message);
      onError(err);
      return;
    }

    try {
      setStatus('generating');
      setError('');
      setProgress(0);
      setStatusCheckCount(0);
      setGeneratedSongs([]); // Clear the songs array instead of setting to null
      
      // Start the generation process
      const response = await axios.post('/api/music/generate-suno', {
        prompt: songData.prompt || '',
        title: songData.title || 'Untitled',
        mood: songData.mood || 'neutral',
        style: songData.style || 'pop',
        tags: songData.tags || ''
      });

      const { taskId, songId } = response.data;
      if (!taskId || !songId) {
        throw new Error('Invalid response from server');
      }

      setTaskId(taskId);
      setSongId(songId);
      
      // Start polling for status
      await pollForCompletion(taskId, songId);
    } catch (error) {
      console.error('Error generating song:', error);
      setStatus('error');
      setError(error.response?.data?.error || error.message || 'Failed to generate song');
      onError(error);
      stopTimer();
    }
  }, [songData, pollForCompletion, stopTimer, onError]);

  // Auto-start generation when component mounts or songData changes
  useEffect(() => {
    if (isOpen && generatedSongs.length === 0 && status === 'idle') {
      handleGenerate();
    }
    
    // Cleanup on unmount
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, songData?.id, handleGenerate, generatedSongs.length, status]);

  if (!isOpen) return null;
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Song List Item Component
  const SongListItem = ({ song, isSelected, onClick }) => (
    <div 
      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}
      onClick={onClick}
    >
      <div className="flex-shrink-0 w-12 h-12 bg-gray-700 rounded-md flex items-center justify-center">
        <Music className="w-6 h-6 text-purple-400" />
      </div>
      <div className="ml-3 overflow-hidden">
        <h4 className="text-white font-medium truncate">{song.title || 'Untitled'}</h4>
        <p className="text-xs text-gray-400">
          {song.duration ? formatTime(song.duration * 1000) : '--:--'}
          {song.created_at && ` • ${new Date(song.created_at).toLocaleDateString()}`}
        </p>
      </div>
    </div>
  );

  // Song Detail Component
  const SongDetail = ({ song, onEditTitle, onDeleteSong }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(song?.title || '');
    
    useEffect(() => {
      setTitle(song?.title || '');
    }, [song]);
    
    const handleSave = async () => {
      try {
        await onEditTitle(song.id, title);
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update title:', error);
      }
    };
    
    if (!song) return null;
    
    return (
      <div className="mt-6 bg-gray-800 rounded-xl p-4">
        <div className="flex justify-between items-start">
          {isEditing ? (
            <div className="flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-700 text-white rounded px-3 py-1 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setTitle(song.title);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <h3 className="text-lg font-semibold text-white">{song.title || 'Untitled'}</h3>
          )}
          
          {/* <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-white"
              title="Edit title"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button
              onClick={() => onDeleteSong(song.id)}
              className="text-red-400 hover:text-red-300"
              title="Delete song"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div> */}
        </div>
        
        {song.audio_url && (
          <div className="mt-4">
            <AudioPlayer 
              src={song.audio_url} 
              onAudioPlay={handleAudioPlay}
              autoPlay={false}
            />
            
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {song.duration && (
                <div className="bg-gray-700/50 p-2 rounded">
                  <div className="text-gray-400 text-xs">Duration</div>
                  <div>{formatTime(song.duration * 1000)}</div>
                </div>
              )}
              {song.size && (
                <div className="bg-gray-700/50 p-2 rounded">
                  <div className="text-gray-400 text-xs">File Size</div>
                  <div>{formatFileSize(song.size)}</div>
                </div>
              )}
              {song.bitrate && (
                <div className="bg-gray-700/50 p-2 rounded">
                  <div className="text-gray-400 text-xs">Bitrate</div>
                  <div>{song.bitrate} kbps</div>
                </div>
              )}
              {song.format && (
                <div className="bg-gray-700/50 p-2 rounded">
                  <div className="text-gray-400 text-xs">Format</div>
                  <div className="uppercase">{song.format}</div>
                </div>
              )}
            </div>
            
            {/* <div className="mt-4">
              <a
                href={song.audio_url}
                download={`${song.title || 'song'}.mp3`}
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download MP3
              </a>
            </div> */}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75" onClick={(e) => e.stopPropagation()}>
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-gray-900 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Music Generator</h2>
            {status !== 'generating' && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>
        {status !== 'generating' && (
          <button
            onClick={onClose}
            disabled={status === 'generating'}
            className="absolute top-4 right-4 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {status === 'generating' ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center py-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                    <Music className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1.5">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-white mt-4">Crafting Your Masterpiece</h3>
                <p className="text-gray-400 text-center max-w-xs">We're working hard to create your song. This usually takes 1-2 minutes.</p>
                
                <div className="w-full max-w-xs mt-6 space-y-2">
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{progress}% complete</span>
                    {generationDuration && <span>{formatTime(generationDuration)}</span>}
                  </div>
                </div>
                
                <div className="mt-6 w-full max-w-xs text-left text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-gray-400">Status</span>
                    <span className="text-yellow-400 font-medium">In Progress</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-gray-400">Checks</span>
                    <span>{statusCheckCount}</span>
                  </div>
                  {taskId && (
                    <div className="py-2 border-b border-gray-800">
                      <div className="text-gray-400 text-xs mb-1">Task ID</div>
                      <div className="text-xs font-mono text-gray-300 truncate" title={taskId}>
                        {taskId}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : status === 'error' ? (
            <div className="space-y-6 py-6">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mt-4">Something Went Wrong</h3>
                <p className="text-red-400 text-center max-w-xs">{error || 'An unknown error occurred'}</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 text-sm">
                  <p className="font-medium text-red-300 mb-2">Error Details:</p>
                  <p className="text-red-200 font-mono text-xs bg-black/30 p-2 rounded break-words">
                    {error || 'No additional error information available'}
                  </p>
                  
                  {(taskId || songId) && (
                    <div className="mt-3 space-y-1 text-xs text-red-300">
                      {taskId && <p>Task ID: <span className="font-mono">{taskId}</span></p>}
                      {songId && <p>Song ID: <span className="font-mono">{songId}</span></p>}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
                    </svg>
                    Try Again
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 pt-4 border-t border-gray-800 text-center">
                <p>If the problem persists, please contact support with the error details above.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Song List */}
              {generatedSongs.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Your Generated Songs
                  </h3>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 -mr-2">
                    {generatedSongs.map((song, index) => (
                      <SongListItem
                        key={song.id || index}
                        song={song}
                        isSelected={selectedSongIndex === index}
                        onClick={() => selectSong(index)}
                      />
                    ))}
                  </div>
                  
                  {generatedSongs[selectedSongIndex] && (
                    <SongDetail
                      song={generatedSongs[selectedSongIndex]}
                      onEditTitle={updateSongTitle}
                      onDeleteSong={deleteSong}
                    />
                  )}
                </div>
              )}
              
              {/* Generation Form */}
              <div className="pt-4 border-t border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                  Create New Song
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={songData?.title || ''}
                      onChange={(e) => {
                        // Update songData.title
                      }}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter song title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Description / Prompt
                    </label>
                    <textarea
                      value={songData?.prompt || ''}
                      onChange={(e) => {
                        // Update songData.prompt
                      }}
                      rows={3}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Describe the song you want to generate..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4"> 
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Mood
                      </label>
                      <select
                        value={songData?.mood || 'happy'}
                        onChange={(e) => {
                          // Update songData.mood
                        }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="happy">Happy</option>
                        <option value="sad">Sad</option>
                        <option value="energetic">Energetic</option>
                        <option value="calm">Calm</option>
                        <option value="romantic">Romantic</option>
                      </select>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleGenerate}
                    disabled={status === 'generating' || !songData?.prompt}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'generating' ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M9 18V5l12-2v13"></path>
                          <circle cx="6" cy="18" r="3"></circle>
                          <circle cx="18" cy="16" r="3"></circle>
                        </svg>
                        Generate Song
                      </>
                    )}
                  </button>
                  
                  <div className="text-xs text-gray-500 text-center">
                    <p>Each generation uses 1 credit. You have <span className="text-purple-400 font-medium">{userCredits || 0}</span> credits remaining.</p>
                    <button className="text-purple-400 hover:text-purple-300 mt-1">
                      Buy more credits
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <span>Status: {status}</span>
              {generationDuration && status === 'completed' && (
                <span>• Generated in {formatTime(generationDuration)}</span>
              )}
            </div>
            <div>
              <span>v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  );
};

export default Generator;
