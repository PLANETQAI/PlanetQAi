'use client';

import { useEffect, useState, useRef } from 'react';
import { MusicGenerationAPI } from '@/utils/voiceAssistant/apiHelpers';
import { NavigationButton } from './NavigationButton';

export function SongGenerationStatus({ generationData }) {
  const [status, setStatus] = useState('starting');
  const [progress, setProgress] = useState(0);
  const [songData, setSongData] = useState(null);
  const [error, setError] = useState('');
  const pollingInterval = useRef(null);
  const startTime = useRef(Date.now());
  const [generationTime, setGenerationTime] = useState(0);
  const audioRef = useRef(null);

  // Timer effect
  useEffect(() => {
    if (status === 'completed' || status === 'error') return;
    
    const timer = setInterval(() => {
      setGenerationTime(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  const startPolling = (taskId, songId) => {
    // Clear any existing interval
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    // Start new polling
    pollingInterval.current = setInterval(() => {
      checkStatus(taskId, songId);
    }, 5000); // Poll every 5 seconds
  };

  const checkStatus = async (taskId, songId) => {
    try {
      const statusResponse = await MusicGenerationAPI.checkGenerationStatus(taskId);
      
      if (statusResponse.status === 'completed' && statusResponse.output) {
        setStatus('completed');
        setSongData(prev => ({
          ...prev,
          ...statusResponse.output,
          id: songId,
          audio_url: statusResponse.output.song_path || statusResponse.output.audio_url
        }));
        setProgress(100);
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
          pollingInterval.current = null;
        }
      } else if (statusResponse.status === 'failed') {
        throw new Error('Generation failed');
      } else {
        setStatus('generating');
        setProgress(prev => Math.min(prev + 10, 90));
      }
    } catch (err) {
      console.error('Error checking status:', err);
      setError(err.message || 'Failed to check generation status');
      setStatus('error');
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    }
  };

  // Start the generation process
  useEffect(() => {
    const generateAudio = async () => {
      setStatus('starting');
      setError('');
      startTime.current = Date.now();

      try {
        // Start the generation
        setStatus('generating');
        const response = await MusicGenerationAPI.generateMusic({
          prompt: generationData.prompt,
          style: generationData.style,
          tempo: generationData.tempo,
          mood: generationData.mood,
          tags: generationData.tags,
          title: generationData.title,
          lyricsType: generationData.lyricsType
        });

        if (response.taskId) {
          setStatus('pending');
          setSongData({ task_id: response.taskId });
          
          // Start polling for status
          startPolling(response.taskId, response.songId);
          
          // Set a timeout to stop polling after 10 minutes
          setTimeout(() => {
            if (pollingInterval.current) {
              clearInterval(pollingInterval.current);
              pollingInterval.current = null;
              if (status !== 'completed') {
                setError('Generation timed out. Please check your library for the song.');
                setStatus('error');
              }
            }
          }, 600000); // 10 minutes
        } else {
          throw new Error('Failed to start generation');
        }
      } catch (err) {
        console.error('Generation error:', err);
        setError(err.response?.data?.error || err.message || 'Failed to generate music');
        setStatus('error');
      }
    };

    generateAudio();
    
    // Cleanup function
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [generationData]);

  // Format generation time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Play notification sound when status changes to completed or error
  useEffect(() => {
    if ((status === 'completed' || status === 'error') && typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(e => console.warn('Audio playback failed:', e));
      audioRef.current = audio;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [status]);

  if (status === 'error' || status === 'failed') {
    return (
      <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center text-red-700">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-medium">Song Generation Failed</p>
        </div>
        <p className="text-sm text-red-600 mt-1">
          {error || 'We encountered an issue while generating your song. Please try again.'}
        </p>
        <div className="mt-3 flex space-x-2">
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
          >
            Try Again
          </button>
          <a
            href="/support"
            className="px-3 py-1.5 text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-md transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  if (status === 'completed' && songData) {
    const audioUrl = songData.audio_url || songData.song_path;
    
    return (
      <div className="space-y-3">
        {audioUrl ? (
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-white font-medium mb-2">
              🎵 {songData.title || 'Your Generated Song'}
            </p>
            <audio 
              controls 
              src={audioUrl} 
              className="w-full mt-2 rounded-lg"
            />
          </div>
        ) : (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-800">
              🎵 Your song is ready! You can find it in your library.
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {audioUrl && (
            <NavigationButton 
              page="🎧 Open in Studio" 
              url={`/aistudio?song=${songData.id || ''}`}
            />
          )}
          <NavigationButton 
            page="📚 View Library" 
            url="/library"
            className="bg-white text-gray-800 border hover:bg-gray-50"
          />
        </div>
      </div>
    );
  }

  // Show loading state
  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center">
        <p className="text-gray-700">
          {status === 'starting' ? 'Starting generation...' : 'Generating your song...'}
        </p>
        <span className="text-sm text-gray-500">{formatTime(generationTime)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        This usually takes 1-3 minutes. You can continue chatting while you wait.
      </p>
    </div>
  );
}
