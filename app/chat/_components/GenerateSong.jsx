'use client'

import SongDetail from '@/components/player/SongDetail'
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUser } from '@/context/UserContext'
import { AlertCircle, CheckCircle2, Clock, Loader2, Music, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

const GenerateSong = ({ 
  isOpen, 
  onClose, 
  songDetailsQueue = [], // Array of song details to generate
  onSuccess,
  onAllComplete
}) => {
  const { credits: userCredits, fetchUserCredits } = useUser()
  console.log("songDetailsQueue:", songDetailsQueue);
  // Queue management
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedSongs, setCompletedSongs] = useState([])
  const [selectedSongIndex, setSelectedSongIndex] = useState(0)

  // Update queue when songDetailsQueue changes
  useEffect(() => {
    if (songDetailsQueue && songDetailsQueue.length > 0) {
      console.log('Updating queue with songs:', songDetailsQueue);
      setQueue(songDetailsQueue);
      setCurrentIndex(0);
      setCompletedSongs([]);
      setSelectedSongIndex(0);
      setStatus('idle');
    }
  }, [songDetailsQueue]);
  
  // Generation state
  const [status, setStatus] = useState('idle') // idle, generating, pending, processing, completed, failed, queue_complete, waiting
  const [error, setError] = useState('')
  const [taskId, setTaskId] = useState(null)
  const [songId, setSongId] = useState(null)
  
  // Polling
  const [pollingInterval, setPollingInterval] = useState(null)
  
  // Timer
  const [startTime, setStartTime] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [timerInterval, setTimerInterval] = useState(null)

  // Persist generation state to continue even if dialog closes
  const [persistedState, setPersistedState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('song_generation_state')
      return saved ? JSON.parse(saved) : null
    }
    return null
  })

  // Format time in mm:ss
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Save state to sessionStorage
  const saveState = (stateData) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('song_generation_state', JSON.stringify(stateData))
      setPersistedState(stateData)
    }
  }

  // Clear saved state
  const clearState = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('song_generation_state')
      setPersistedState(null)
    }
  }

  // Start timer
  const startTimer = () => {
    const now = Date.now()
    setStartTime(now)
    setCurrentTime(0)
    
    const interval = setInterval(() => {
      setCurrentTime(Date.now() - now)
    }, 1000)
    
    setTimerInterval(interval)
  }

  // Stop timer
  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
  }

  // Poll for result
  const pollForResult = async (taskId, songId) => {
    try {
      console.log('Polling for result...', { taskId, songId });
      const response = await fetch(`/api/music/status-suno?taskId=${taskId}&songId=${songId}`)
      const data = await response.json()
      console.log('Polling response:', data);

      // Only update status if we have a valid status from the server
      if (data.status) {
        setStatus(data.status);
      }

      // Handle completed status
      if (data.status === 'completed' && data.output?.songs?.length > 0) {
        // Verify the song is actually ready by checking the song URL
        const songUrl = data.output.songs[0]?.song_path;
        if (!songUrl) {
          console.log('Song URL not available yet, continuing to poll...');
          return; // Continue polling if song URL is not available
        }

        // Additional verification: try to fetch the song URL to ensure it's accessible
        try {
          const songResponse = await fetch(songUrl, { method: 'HEAD' });
          if (!songResponse.ok) {
            console.log('Song file not yet available, continuing to poll...');
            return; // Continue polling if song is not accessible yet
          }
        } catch (err) {
          console.log('Error verifying song URL, continuing to poll...', err);
          return; // Continue polling if there's an error checking the URL
        }

        // If we get here, the song is ready
        console.log('Song generation completed successfully!');
        stopTimer();
        
        // Clear the polling interval
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        
        // Update credits
        await fetchUserCredits();
        
        // Add completed songs to the list
        const newSongs = data.output.songs.map(song => ({
          ...song,
          id: songId,
          audioUrl: song.song_path,
          coverImageUrl: song.image_path,
          status: 'completed',
          title: queue[currentIndex]?.title || 'Untitled Song',
          prompt: queue[currentIndex]?.prompt || ''
        }));
        
        // Update state with the new songs
        setCompletedSongs(prev => [...prev, ...newSongs]);
        
        // Notify parent component
        if (onSuccess) {
          onSuccess(newSongs);
        }
        
        // Check if there are more songs in queue
        if (currentIndex < queue.length - 1) {
          // Set status to waiting and start a 5-minute delay before next song
          setStatus('waiting');
          
          // Wait for 5 minutes (300,000 milliseconds) before starting next song
          setTimeout(() => {
            // Move to next song in queue after delay
            setCurrentIndex(prev => prev + 1);
            setStatus('idle');
          }, 300000); // 5 minutes in milliseconds
        } else {
          // All songs completed
          setStatus('queue_complete');
          clearState();
          
          if (onAllComplete) {
            onAllComplete([...completedSongs, ...newSongs]);
          }
        }
      } 
      // Handle failed status
      else if (data.status === 'failed') {
        console.error('Song generation failed:', data.error);
        stopTimer();
        
        // Clear the polling interval
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        
        setError(data.error?.message || 'Failed to generate music');
        setStatus('failed');
        
        // Check if there are more songs in queue
        if (currentIndex < queue.length - 1) {
          // Skip to next song after a short delay
          setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
            setStatus('idle');
            setError('');
          }, 3000);
        }
      }
    } catch (err) {
      console.error('Error polling:', err)
    }
  }

  // Start generation
  const startGeneration = async (songDetails) => {
    setStatus('generating')
    setError('')
    startTimer()

    try {
      // Calculate credits needed
      const wordCount = (songDetails.prompt || '').split(/\s+/).filter(w => w.length > 0).length
      let creditsNeeded = 80
      if (wordCount > 200) {
        creditsNeeded += Math.ceil((wordCount - 200) / 10) * 5
      }

      // Check credits
      if (userCredits?.credits < creditsNeeded) {
        throw new Error(`Insufficient credits. Need ${creditsNeeded - userCredits.credits} more.`)
      }

      // Generate
      const response = await fetch('/api/music/generate-suno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: songDetails.prompt,
          tags: songDetails.tags,
          title: songDetails.title,
        })
      })

      const data = await response.json()

      if (data?.success) {
        const { taskId, songId } = data
        setTaskId(taskId)
        setSongId(songId)
        setStatus('pending')

        // Save state to continue even if dialog closes
        saveState({
          taskId,
          songId,
          currentIndex,
          queue,
          completedSongs,
          startTime: Date.now()
        })

        // Start polling
        const interval = setInterval(() => {
          pollForResult(taskId, songId)
        }, 10000)
        setPollingInterval(interval)

        // Initial check
        pollForResult(taskId, songId)

        // Safety timeout (10 minutes)
        setTimeout(() => {
          if (pollingInterval) {
            clearInterval(pollingInterval)
            setPollingInterval(null)
            setError('Generation timed out. Please try again.')
            stopTimer()
          }
        }, 600000)
      } else {
        throw new Error(data.error || 'Failed to generate music')
      }
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate music')
      setStatus('failed')
      stopTimer()
    }
  }

  // Initialize queue when dialog opens
  useEffect(() => {
    if (isOpen && songDetailsQueue.length > 0) {
      // Check if there's a persisted state
      if (persistedState) {
        // Resume from persisted state
        setQueue(persistedState.queue || songDetailsQueue)
        setCurrentIndex(persistedState.currentIndex || 0)
        setCompletedSongs(persistedState.completedSongs || [])
        setTaskId(persistedState.taskId)
        setSongId(persistedState.songId)
        
        // Resume polling
        if (persistedState.taskId && persistedState.songId) {
          setStatus('pending')
          const interval = setInterval(() => {
            pollForResult(persistedState.taskId, persistedState.songId)
          }, 10000)
          setPollingInterval(interval)
          pollForResult(persistedState.taskId, persistedState.songId)
        }
      } else {
        // Start fresh
        setQueue(songDetailsQueue)
        setCurrentIndex(0)
        setCompletedSongs([])
        setStatus('idle')
      }
    }
  }, [isOpen, songDetailsQueue])

  // Auto-start generation for current song
  useEffect(() => {
    if (status === 'idle' && queue.length > 0 && currentIndex < queue.length) {
      startGeneration(queue[currentIndex])
    }
  }, [status, currentIndex, queue])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't clear intervals on unmount - let generation continue
      // They will be cleared when generation completes
    }
  }, [])

  // Handle close
  const handleClose = () => {
    // Don't stop generation - let it continue in background
    // Only close the dialog
    onClose()
  }

  // Handle force cancel
  const handleForceCancel = () => {
    if (pollingInterval) clearInterval(pollingInterval)
    if (timerInterval) clearInterval(timerInterval)
    clearState()
    setStatus('idle')
    setError('')
    setTaskId(null)
    setSongId(null)
    setStartTime(null)
    setCurrentTime(0)
    setQueue([])
    setCurrentIndex(0)
    setCompletedSongs([])
    onClose()
  }

  // Get status message
  const getStatusMessage = () => {
    switch (status) {
      case 'generating':
        return 'Initializing generation...'
      case 'pending':
        return 'Waiting in queue...'
      case 'processing':
        return 'Creating your music...'
      case 'rendering':
        return 'Finalizing your track...'
      case 'completed':
        return 'Song complete!'
      case 'queue_complete':
        return 'All songs generated!'
      case 'failed':
        return 'Generation failed'
      default:
        return 'Preparing...'
    }
  }

  // Delete song handler
  const deleteSong = async (songId) => {
    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to delete song')
      }

      // Remove from completed songs
      const updated = completedSongs.filter(s => s.id !== songId)
      setCompletedSongs(updated)
      
      // Adjust selected index if needed
      if (selectedSongIndex >= updated.length && updated.length > 0) {
        setSelectedSongIndex(updated.length - 1)
      }
    } catch (error) {
      console.error('Error deleting song:', error)
      alert('Failed to delete song. Please try again.')
    }
  }

  const currentSong = queue[currentIndex]
  const isGenerating = ['generating', 'pending', 'processing', 'rendering'].includes(status)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            {isGenerating ? 'Generating Your Song' : status === 'queue_complete' ? 'Songs Generated' : 'Song Generator'}
          </DialogTitle>
          <DialogDescription>
            {currentSong?.title || queue[0]?.title || 'Untitled Song'}
            {queue.length > 1 && ` (${currentIndex + 1} of ${queue.length})`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Warning about closing */}
          {isGenerating && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You can close this dialog - generation will continue in the background
              </AlertDescription>
            </Alert>
          )}

          {/* Status indicator */}
          {status === 'completed' && (
            <div className="flex items-center text-green-500">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              <span>Generation complete!</span>
            </div>
          )}
          {status === 'waiting' && (
            <div className="flex items-center text-yellow-500">
              <Clock className="w-5 h-5 mr-2 animate-pulse" />
              <span>Waiting 5 minutes before next generation...</span>
            </div>
          )}
          {isGenerating && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              
              <div className="text-center">
                <p className="text-lg font-semibold">{getStatusMessage()}</p>
                {startTime && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {formatTime(currentTime)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Progress stages */}
          {isGenerating && (
            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-sm ${
                ['generating', 'pending', 'processing', 'rendering'].includes(status)
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  status === 'generating' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                }`} />
                Initializing
              </div>
              
              <div className={`flex items-center gap-2 text-sm ${
                ['pending', 'processing', 'rendering'].includes(status)
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  status === 'pending' ? 'bg-blue-500 animate-pulse' : 
                  ['processing', 'rendering'].includes(status) ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                Queue
              </div>
              
              <div className={`flex items-center gap-2 text-sm ${
                ['processing', 'rendering'].includes(status)
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  status === 'processing' ? 'bg-blue-500 animate-pulse' : 
                  status === 'rendering' ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                Processing
              </div>
              
              <div className={`flex items-center gap-2 text-sm ${
                status === 'rendering' ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  status === 'rendering' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                }`} />
                Finalizing
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Info message */}
          {status === 'pending' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Your song is in the queue. This typically takes 2-3 minutes.
              </p>
            </div>
          )}

          {/* Completed songs */}
          {completedSongs.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Generated Songs ({completedSongs.length})
              </h3>
              
              {/* Song list */}
              <div className="space-y-2">
                {completedSongs.map((song, index) => (
                  <button
                    key={song.id}
                    onClick={() => setSelectedSongIndex(index)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedSongIndex === index
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {song.coverImageUrl && (
                        <img 
                          src={song.coverImageUrl} 
                          alt={song.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{song.title || 'Untitled'}</p>
                        <p className="text-sm text-muted-foreground">
                          {song.tags?.join(', ')}
                        </p>
                      </div>
                      {selectedSongIndex === index && (
                        <Music className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Song detail */}
              {completedSongs[selectedSongIndex] && (
                <SongDetail
                  song={completedSongs[selectedSongIndex]}
                  onEditTitle={(newTitle) => {
                    const updated = [...completedSongs]
                    updated[selectedSongIndex] = {
                      ...updated[selectedSongIndex],
                      title: newTitle
                    }
                    setCompletedSongs(updated)
                    
                    const songId = updated[selectedSongIndex].id
                    fetch(`/api/songs/${songId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title: newTitle })
                    }).catch(error => {
                      console.error('Error updating song title:', error)
                    })
                  }}
                  onDeleteSong={deleteSong}
                />
              )}
            </div>
          )}

          {/* Credits info */}
          {userCredits && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>{userCredits.credits} credits remaining</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-between gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            {isGenerating ? 'Close (continues in background)' : 'Close'}
          </button>
          
          {status === 'queue_complete' && (
            <button
              onClick={() => {
                clearState()
                handleClose()
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default GenerateSong