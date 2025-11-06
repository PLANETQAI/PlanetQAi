'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUser } from '@/context/UserContext'
import axios from 'axios'
import { CheckCircle2, Clock, Loader2, Music, XCircle, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

const GenerateSong = ({ 
  isOpen, 
  onClose, 
  songDetails,
  onSuccess 
}) => {
  const { credits: userCredits, fetchUserCredits } = useUser()
  
  // Generation state
  const [status, setStatus] = useState('idle') // idle, generating, pending, processing, completed, failed
  const [error, setError] = useState('')
  const [taskId, setTaskId] = useState(null)
  const [songId, setSongId] = useState(null)
  
  // Polling
  const [pollingInterval, setPollingInterval] = useState(null)
  
  // Timer
  const [startTime, setStartTime] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [timerInterval, setTimerInterval] = useState(null)

  // Format time in mm:ss
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
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
      const response = await axios.get(`/api/music/status-suno?taskId=${taskId}&songId=${songId}`)
      const data = response.data

      setStatus(data.status)

      if (data.status === 'completed' && data.output?.songs?.length > 0) {
        // Success!
        stopTimer()
        clearInterval(pollingInterval)
        setPollingInterval(null)
        
        // Update credits
        await fetchUserCredits()
        
        // Notify parent component
        if (onSuccess) {
          onSuccess(data.output.songs)
        }
        
        // Close after a short delay
        setTimeout(() => {
          handleClose()
        }, 2000)
      } else if (data.status === 'failed') {
        stopTimer()
        clearInterval(pollingInterval)
        setPollingInterval(null)
        setError(data.error?.message || 'Failed to generate music')
      }
    } catch (err) {
      console.error('Error polling:', err)
    }
  }

  // Start generation
  const startGeneration = async () => {
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
      const response = await axios.post('/api/music/generate-suno', {
        prompt: songDetails.prompt,
        tags: songDetails.tags,
        title: songDetails.title,
      })

      if (response.data?.success) {
        const { taskId, songId } = response.data
        setTaskId(taskId)
        setSongId(songId)
        setStatus('pending')

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
      }
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.response?.data?.error || err.message || 'Failed to generate music')
      setStatus('failed')
      stopTimer()
    }
  }

  // Auto-start generation when dialog opens
  useEffect(() => {
    if (isOpen && status === 'idle' && songDetails) {
      startGeneration()
    }
  }, [isOpen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval)
      if (timerInterval) clearInterval(timerInterval)
    }
  }, [])

  // Handle close
  const handleClose = () => {
    if (pollingInterval) clearInterval(pollingInterval)
    if (timerInterval) clearInterval(timerInterval)
    setStatus('idle')
    setError('')
    setTaskId(null)
    setSongId(null)
    setStartTime(null)
    setCurrentTime(0)
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
        return 'Generation complete!'
      case 'failed':
        return 'Generation failed'
      default:
        return 'Preparing...'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Generating Your Song
          </DialogTitle>
          <DialogDescription>
            {songDetails?.title || 'Untitled Song'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status indicator */}
          <div className="flex flex-col items-center gap-4">
            {status === 'completed' ? (
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            ) : status === 'failed' ? (
              <XCircle className="w-16 h-16 text-red-500" />
            ) : (
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
            )}
            
            <div className="text-center">
              <p className="text-lg font-semibold">{getStatusMessage()}</p>
              {startTime && status !== 'completed' && status !== 'failed' && (
                <p className="text-sm text-muted-foreground mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formatTime(currentTime)}
                </p>
              )}
            </div>
          </div>

          {/* Progress stages */}
          {status !== 'failed' && (
            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-sm ${
                ['generating', 'pending', 'processing', 'rendering', 'completed'].includes(status)
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  status === 'generating' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                }`} />
                Initializing
              </div>
              
              <div className={`flex items-center gap-2 text-sm ${
                ['pending', 'processing', 'rendering', 'completed'].includes(status)
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  status === 'pending' ? 'bg-blue-500 animate-pulse' : 
                  ['processing', 'rendering', 'completed'].includes(status) ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                Queue
              </div>
              
              <div className={`flex items-center gap-2 text-sm ${
                ['processing', 'rendering', 'completed'].includes(status)
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  status === 'processing' ? 'bg-blue-500 animate-pulse' : 
                  ['rendering', 'completed'].includes(status) ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                Processing
              </div>
              
              <div className={`flex items-center gap-2 text-sm ${
                ['rendering', 'completed'].includes(status)
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  status === 'rendering' ? 'bg-blue-500 animate-pulse' : 
                  status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
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

          {/* Credits info */}
          {userCredits && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>{userCredits.credits} credits remaining</span>
            </div>
          )}
        </div>

        {/* Close button (only show when failed or completed) */}
        {(status === 'failed' || status === 'completed') && (
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {status === 'completed' ? 'Done' : 'Close'}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default GenerateSong