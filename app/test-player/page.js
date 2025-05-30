'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

export default function TestPlayer() {
  // Form inputs
  const [prompt, setPrompt] = useState('Create a happy pop song about summer')
  const [style, setStyle] = useState('pop')
  const [tempo, setTempo] = useState('medium')
  const [mood, setMood] = useState('happy')
  const [title, setTitle] = useState('My Test Song')
  
  // State for API responses
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [taskId, setTaskId] = useState('')
  const [songId, setSongId] = useState('')
  const [status, setStatus] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [statusPolling, setStatusPolling] = useState(null)
  
  // Timer state
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(null)
  const [timerInterval, setTimerInterval] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  
  // Logs
  const [logs, setLogs] = useState([])

  // Add a log entry
  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Clear logs
  const clearLogs = () => {
    setLogs([])
  }
  
  // Start timer
  const startTimer = () => {
    // Reset any existing timer
    if (timerInterval) {
      clearInterval(timerInterval)
    }
    
    const now = Date.now()
    setStartTime(now)
    setEndTime(null)
    setElapsedTime(null)
    setCurrentTime(0)
    
    // Start a new timer that updates every 100ms
    const interval = setInterval(() => {
      const elapsed = Date.now() - now
      setCurrentTime(elapsed)
    }, 100)
    
    setTimerInterval(interval)
    addLog(`Timer started at ${new Date(now).toLocaleTimeString()}`)
  }
  
  // Stop timer
  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
    
    const now = Date.now()
    setEndTime(now)
    
    if (startTime) {
      const elapsed = now - startTime
      setElapsedTime(elapsed)
      addLog(`Timer stopped. Total time: ${formatTime(elapsed)}`)
    }
  }
  
  // Format time in mm:ss.ms format
  const formatTime = (ms) => {
    const totalSeconds = ms / 1000
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    const milliseconds = Math.floor((ms % 1000) / 10)
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
  }

  // Generate music
  const generateMusic = async () => {
    setLoading(true)
    setError('')
    setTaskId('')
    setSongId('')
    setStatus('')
    setAudioUrl('')
    
    // Stop any existing polling
    if (statusPolling) {
      clearInterval(statusPolling)
      setStatusPolling(null)
    }
    
    try {
      // Start the timer
      startTimer()
      addLog('Starting music generation...')
      
      const payload = {
        prompt,
        style,
        tempo,
        mood,
        title,
        tags: 'test,simple'
      }
      
      // Call the generate_v1 API
      const response = await axios.post('/api/music/generate_v1', payload)
      
      addLog(`Generation response: ${JSON.stringify(response.data)}`)
      
      if (response.data && response.data.success) {
        const { taskId: newTaskId, songId: newSongId, status: newStatus } = response.data
        
        setTaskId(newTaskId)
        setSongId(newSongId)
        setStatus(newStatus || 'pending')
        
        addLog(`Task ID: ${newTaskId}`)
        addLog(`Song ID: ${newSongId}`)
        addLog(`Initial status: ${newStatus || 'pending'}`)
        
        // Start polling for status
        startStatusPolling(newTaskId, newSongId)
      } else {
        stopTimer()
        throw new Error(response.data?.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Error generating music:', err)
      setError(err.message || 'Failed to generate music')
      addLog(`Error: ${err.message}`)
      stopTimer()
    } finally {
      setLoading(false)
    }
  }
  
  // Test both generate and status APIs in sequence
  const testBothApis = async () => {
    setLoading(true)
    setError('')
    setTaskId('')
    setSongId('')
    setStatus('')
    setAudioUrl('')
    
    // Stop any existing polling
    if (statusPolling) {
      clearInterval(statusPolling)
      setStatusPolling(null)
    }
    
    try {
      // Start the timer
      startTimer()
      addLog('=== STARTING COMBINED API TEST ===')
      addLog('1. Calling generate_v1 API...')
      
      const payload = {
        prompt,
        style,
        tempo,
        mood,
        title,
        tags: 'test,simple'
      }
      
      // Step 1: Call the generate_v1 API
      const generateResponse = await axios.post('/api/music/generate_v1', payload)
      
      addLog(`Generate response: ${JSON.stringify(generateResponse.data)}`)
      
      if (generateResponse.data && generateResponse.data.success) {
        const { taskId: newTaskId, songId: newSongId, status: newStatus } = generateResponse.data
        
        setTaskId(newTaskId)
        setSongId(newSongId)
        setStatus(newStatus || 'pending')
        
        addLog(`Task ID: ${newTaskId}`)
        addLog(`Song ID: ${newSongId}`)
        addLog(`Initial status: ${newStatus || 'pending'}`)
        
        // Record the time after generate API
        const generateTime = currentTime
        addLog(`Generate API time: ${formatTime(generateTime)}`)
        
        // Step 2: Immediately call the status API
        addLog('2. Calling status API immediately...')
        
        const statusResponse = await axios.get(`/api/music/status?taskId=${newTaskId}&songId=${newSongId}`)
        
        const statusData = statusResponse.data
        setStatus(statusData.status || 'unknown')
        
        addLog(`Status response: ${JSON.stringify(statusData)}`)
        addLog(`Status: ${statusData.status || 'unknown'}`)
        
        // Record the time after status API
        const totalTime = currentTime
        addLog(`Status API time: ${formatTime(totalTime - generateTime)}`)
        addLog(`Total time: ${formatTime(totalTime)}`)
        
        // If completed, get the audio URL
        if (statusData.status === 'completed' && statusData.output && statusData.output.audio_url) {
          setAudioUrl(statusData.output.audio_url)
          addLog(`Audio URL: ${statusData.output.audio_url}`)
        } else {
          addLog('Song not yet completed, will need to check status later')
          // Start polling for status
          startStatusPolling(newTaskId, newSongId)
        }
      } else {
        stopTimer()
        throw new Error(generateResponse.data?.error || 'Unknown error')
      }
      
      // Stop the timer
      stopTimer()
      addLog('=== COMBINED API TEST COMPLETED ===')
    } catch (err) {
      console.error('Error in API test:', err)
      setError(err.message || 'Failed to test APIs')
      addLog(`Error: ${err.message}`)
      stopTimer()
    } finally {
      setLoading(false)
    }
  }
  
  // Start polling for status
  const startStatusPolling = (taskId, songId) => {
    addLog('Starting status polling...')
    
    // Poll every 10 seconds
    const interval = setInterval(async () => {
      try {
        await checkStatus(taskId, songId)
      } catch (err) {
        console.error('Error checking status:', err)
        addLog(`Status check error: ${err.message}`)
      }
    }, 10000)
    
    setStatusPolling(interval)
    
    // Initial status check
    checkStatus(taskId, songId)
  }
  
  // Check status
  const checkStatus = async (taskId, songId) => {
    try {
      addLog(`Checking status for task ${taskId}...`)
      
      // Call the status API
      const response = await axios.get(`/api/music/status?taskId=${taskId}&songId=${songId}`)
      
      const statusData = response.data
      setStatus(statusData.status || 'unknown')
      
      addLog(`Status: ${statusData.status || 'unknown'}`)
      
      // If completed, get the audio URL
      if (statusData.status === 'completed' && statusData.output && statusData.output.audio_url) {
        setAudioUrl(statusData.output.audio_url)
        addLog(`Audio URL: ${statusData.output.audio_url}`)
        
        // Stop polling
        if (statusPolling) {
          clearInterval(statusPolling)
          setStatusPolling(null)
          addLog('Status polling stopped - song is ready')
        }
      }
      
      // Also check if the song has been updated in our database
      if (songId) {
        const songResponse = await axios.get(`/api/songs/${songId}`)
        if (songResponse.data && songResponse.data.audioUrl) {
          setAudioUrl(songResponse.data.audioUrl)
          addLog(`Song updated in database with audio URL: ${songResponse.data.audioUrl}`)
          
          // Stop polling
          if (statusPolling) {
            clearInterval(statusPolling)
            setStatusPolling(null)
            addLog('Status polling stopped - song is ready in database')
          }
        }
      }
    } catch (err) {
      console.error('Error checking status:', err)
      addLog(`Status check error: ${err.message}`)
    }
  }
  
  // Manually check status
  const manualCheckStatus = () => {
    if (taskId && songId) {
      checkStatus(taskId, songId)
    } else {
      setError('No task ID or song ID to check')
      addLog('Error: No task ID or song ID to check')
    }
  }
  
  // Trigger the cron job
  const triggerCronJob = async () => {
    try {
      addLog('Triggering cron job to check pending songs...')
      
      const response = await axios.get(`/api/cron/check-pending-songs?secret=${process.env.NEXT_PUBLIC_CRON_SECRET || '0e58cf8464f9a2ba3f231e43bf15464b36213531d397f93ac9486d76287bc638'}`)
      
      addLog(`Cron job response: ${JSON.stringify(response.data)}`)
      
      // Refresh song status after cron job
      if (taskId && songId) {
        setTimeout(() => {
          checkStatus(taskId, songId)
        }, 2000)
      }
    } catch (err) {
      console.error('Error triggering cron job:', err)
      addLog(`Cron job error: ${err.message}`)
    }
  }
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (statusPolling) {
        clearInterval(statusPolling)
      }
    }
  }, [statusPolling])

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Music Generation Test Player</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Generate Music</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="pop">Pop</option>
                  <option value="rock">Rock</option>
                  <option value="hiphop">Hip Hop</option>
                  <option value="electronic">Electronic</option>
                  <option value="jazz">Jazz</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tempo</label>
                <select
                  value={tempo}
                  onChange={(e) => setTempo(e.target.value)}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="slow">Slow</option>
                  <option value="medium">Medium</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Mood</label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="happy">Happy</option>
                  <option value="sad">Sad</option>
                  <option value="energetic">Energetic</option>
                  <option value="calm">Calm</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
            </div>
            
            {/* Timer display */}
            <div className="bg-slate-700 p-3 rounded-md mb-4">
              <div className="text-sm text-gray-300 mb-1">Timer:</div>
              <div className="text-2xl font-mono text-white">
                {startTime ? (
                  timerInterval ? formatTime(currentTime) : formatTime(elapsedTime || 0)
                ) : (
                  "00:00.00"
                )}
              </div>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={generateMusic}
                disabled={loading}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  'Generate Music'
                )}
              </button>
              
              <button
                onClick={testBothApis}
                disabled={loading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                Test Both APIs
              </button>
              
              <button
                onClick={manualCheckStatus}
                disabled={!taskId || loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Check Status
              </button>
              
              <button
                onClick={triggerCronJob}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Trigger Cron Job
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          
          <div className="mt-4 space-y-2">
            {taskId && (
              <div className="text-sm">
                <span className="text-gray-400">Task ID:</span> <span className="text-white">{taskId}</span>
              </div>
            )}
            
            {songId && (
              <div className="text-sm">
                <span className="text-gray-400">Song ID:</span> <span className="text-white">{songId}</span>
              </div>
            )}
            
            {status && (
              <div className="text-sm">
                <span className="text-gray-400">Status:</span> 
                <span className={`ml-1 ${status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {status}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Audio Player */}
          {audioUrl && (
            <div className="bg-slate-800 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">Audio Player</h2>
              <audio 
                src={audioUrl} 
                controls 
                className="w-full" 
                controlsList="nodownload"
              />
              <div className="mt-2 text-sm text-gray-400 break-all">
                <span className="font-medium">URL:</span> {audioUrl}
              </div>
            </div>
          )}
          
          {/* Logs */}
          <div className="bg-slate-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold">Logs</h2>
              <button 
                onClick={clearLogs}
                className="text-xs bg-slate-700 text-gray-300 px-2 py-1 rounded hover:bg-slate-600"
              >
                Clear
              </button>
            </div>
            <div className="bg-slate-900 p-3 rounded-md h-80 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-sm italic">No logs yet</div>
              ) : (
                <div className="space-y-1 text-sm font-mono">
                  {logs.map((log, index) => (
                    <div key={index} className="text-gray-300">{log}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
