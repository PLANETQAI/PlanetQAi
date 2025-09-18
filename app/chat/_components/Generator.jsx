'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Loader2, Music, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Generator = ({
  songData,
  isOpen = false,
  onClose = () => {},
  onSuccess = () => {},
  onError = () => {}
}) => {
  const router = useRouter()
  const [status, setStatus] = useState('loading'); // 'loading' | 'idle' | 'generating' | 'completed' | 'error'
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [taskId, setTaskId] = useState(null);
  const [songId, setSongId] = useState(null);
  const [generationStartTime, setGenerationStartTime] = useState(null);
  const [generationDuration, setGenerationDuration] = useState(null);
  const [timerInterval, setTimerInterval] = useState(null);
  const [statusCheckCount, setStatusCheckCount] = useState(0);
  const [userCredits, setUserCredits] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);
  
  // Fetch user credits on mount and update status
  useEffect(() => {
    const loadCredits = async () => {
      try {
        await fetchUserCredits();
        setStatus('idle');
      } catch (error) {
        console.error('Error loading credits:', error);
        setError('Failed to load credits. Please try again.');
        setStatus('error');
      }
    };
    
    loadCredits();
  }, []);

  const fetchUserCredits = async () => {
    try {
      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();
      
      if (!sessionData?.user) {
        window.location.href = '/login?redirectTo=' + encodeURIComponent(window.location.pathname);
        return;
      }
      
      const response = await fetch('/api/credits-api', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching credits:', error);
      setError('Failed to load credits. Please try again.');
      setStatus('error');
      return false;
    }
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
    }
  }, [timerInterval, generationStartTime]);

  // Format time in MM:SS format
  const formatTime = (ms) => {
    if (!ms) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check status of a task
  const checkStatus = async (taskId, songId) => {
    try {
      setStatusCheckCount(prev => prev + 1);
      
      const response = await axios.get(`/api/music/status-suno?taskId=${taskId}&songId=${songId}`);
      const result = response.data;
      
      if (result.status === 'completed') {
        const song = result.output?.songs?.[0];
        if (song) {
          setStatus('completed');
          setProgress(100);
          stopTimer();
          onSuccess(song);
          return { completed: true, song };
        }
      } else if (result.status === 'failed') {
        throw new Error(result.error || 'Generation failed');
      } else if (result.status === 'pending' || result.status === 'processing') {
        setStatus('generating');
        // Update progress based on status check count (capped at 90% until complete)
        const newProgress = Math.min(90, Math.floor(statusCheckCount * 5));
        setProgress(newProgress);
      }
      
      return { completed: false };
    } catch (error) {
      console.error('Error checking status:', error);
      setStatus('error');
      setError(error.message || 'Failed to check generation status');
      stopTimer();
      throw error;
    }
  };

  // Poll for task completion
  const pollForCompletion = useCallback(async (taskId, songId) => {
    try {
      const { completed } = await checkStatus(taskId, songId);
      
      if (!completed) {
        // Use exponential backoff with jitter for polling
        const baseDelay = 2000; // 2 seconds base delay
        const maxDelay = 10000; // 10 seconds max delay
        const jitter = Math.random() * 1000; // Add up to 1 second of jitter
        const delay = Math.min(baseDelay * Math.pow(1.5, statusCheckCount) + jitter, maxDelay);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return pollForCompletion(taskId, songId);
      }
    } catch (error) {
      console.error('Polling error:', error);
      setStatus('error');
      setError(error.message || 'Failed to generate song');
      onError(error);
      stopTimer();
      
      // Clear any existing intervals
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  }, [statusCheckCount, stopTimer, onError, timerInterval]);

  // Handle song generation
  const handleGenerate = useCallback(async () => {
    if (!songData) return;
    
    // Check credits before starting generation
    const hasCredits = await fetchUserCredits();
    if (!hasCredits) {
      return; // Error already set by fetchUserCredits
    }
    
    setStatus('generating');
    setError('');
    setProgress(0);
    setGenerationStartTime(Date.now());
    setStatusCheckCount(0);
      
    try {
      const response = await axios.post('/api/music/generate-suno', {
        prompt: songData.prompt || '',
        title: songData.title || 'Untitled',
        mood: songData.mood || 'neutral',
        style: songData.style || 'pop',
        tags: songData.tags || ''
      });

      if (!response.data || !response.data.success) {
        throw new Error('Failed to start music generation');
      }

      const { taskId, songId } = response.data;
      console.log('Music generation initiated successfully', { taskId, songId });
      
      setStatus('pending');
      setTaskId(taskId);
      setSongId(songId);
      
      // Start the timer
      startTimer();
      
      // Immediately check the status once
      await checkStatus(taskId, songId);
      
      // Start polling for status
      pollForCompletion(taskId, songId);
      
      // Set a safety timeout to stop polling after 10 minutes
      const timeoutId = setTimeout(() => {
        if (timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
          setError('Generation is taking longer than expected. Please check back later.');
          setStatus('error');
        }
      }, 600000); // 10 minutes
      
      // Store the timeout ID to clear it if component unmounts
      return () => clearTimeout(timeoutId);
      
    } catch (error) {
      console.error('Error generating song:', error);
      setStatus('error');
      setError(error.response?.data?.error || error.message || 'Failed to generate song');
      onError(error);
      stopTimer();
      
      // Clear any existing intervals
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  }, [songData, pollForCompletion, stopTimer, onError, userCredits, timerInterval, startTimer, checkStatus]);

  // Auto-start generation when component mounts or songData changes
  useEffect(() => {
    if (isOpen && status === 'idle') {
      handleGenerate();
    }
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [isOpen, songData?.id, handleGenerate, status, timerInterval]);

  if (!isOpen) return null;

  const handleCheckOutSong = () => {
    onClose()
    router.push(`/my-songs`)
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75" onClick={(e) => e.stopPropagation()}>
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-gray-900 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {status === 'completed' ? 'Generation Complete!' : 'Generate Music'}
            </h2>
            {status !== 'generating' && status !== 'pending' && (
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
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {status === 'loading' ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400">Loading generator...</p>
            </div>
          ) : status === 'generating' || status === 'pending' ? (
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
          ) : status === 'completed' ? (
            <div className="space-y-6 py-8">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mt-4">Your Song is Ready!</h3>
                <p className="text-gray-400 text-center max-w-xs">Your music has been generated successfully.</p>
                
                <button
                  onClick={handleCheckOutSong}
                  className="mt-6 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
                >
                  Check Out Your Song
                </button>
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
              <div className="space-y-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Generation Details</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Title</div>
                      <div className="text-white font-medium">{songData?.title || 'Untitled'}</div>
                    </div>
                    
                    {songData?.prompt && (
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Prompt</div>
                        <div className="text-gray-300 text-sm">{songData.prompt}</div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Style</div>
                        <div className="text-gray-300">{songData?.style || 'Not specified'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Mood</div>
                        <div className="text-gray-300">{songData?.mood || 'Not specified'}</div>
                      </div>
                    </div>
                    
                    {songData?.tags && (
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Tags</div>
                        <div className="flex flex-wrap gap-1.5">
                          {songData.tags.split(',').map((tag, index) => (
                            <span key={index} className="bg-gray-700/50 text-gray-300 text-xs px-2 py-1 rounded">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-center text-gray-400">
                  <p>Each generation uses 1 credit. You have <span className="text-purple-400 font-medium">{typeof userCredits === 'number' ? userCredits : 0}</span> credits remaining.</p>
                  {userCredits < 85 && (
                    <button 
                      onClick={() => setShowCreditPurchaseModal(true)}
                      className="mt-2 text-xs px-3 py-1.5 bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-colors"
                    >
                      Upgrade Plan (85+ credits needed)
                    </button>
                  )}
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
