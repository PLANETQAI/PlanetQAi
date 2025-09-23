'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import AudioPlayer from './audioPlayer'
import SongList from './SongList'
import SongDetail from './SongDetail'
import { TbInfoHexagonFilled } from 'react-icons/tb'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { normalizeValue } from '@/utils/functions'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Music, Zap, Clock, CreditCard, AlertCircle } from 'lucide-react'
import CreditPurchaseModal from '../credits/CreditPurchaseModal'
import fetchUserSongsUtil from './fetchUserSongs'

const SunoGenerator = ({
	session,
	selectedPrompt = {
		text: '',
		tags: '',
		title: '',
		style: 'pop',
		tempo: 'medium',
		mood: 'neutral'
	},
	onPromptChange = prompt => {
		selectedPrompt = prompt
	},
	onCreditsUpdate = () => {}
}) => {
	const pathname = usePathname()
	const router = useRouter()
	const searchParams = useSearchParams()
	const text = normalizeValue(decodeURIComponent(searchParams.get('text') || ''))
	const tags = normalizeValue(decodeURIComponent(searchParams.get('tags') || ''))
	const title = normalizeValue(decodeURIComponent(searchParams.get('title') || ''))
	const style = normalizeValue(decodeURIComponent(searchParams.get('style') || 'pop'))
	const tempo = normalizeValue(decodeURIComponent(searchParams.get('tempo') || 'medium'))
	const mood = normalizeValue(decodeURIComponent(searchParams.get('mood') || 'neutral'))

	const [generatedAudio, setGeneratedAudio] = useState(null)
	const [generatedLyrics, setGeneratedLyrics] = useState(null)
	const [coverImage, setCoverImage] = useState(null)
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const [pollingInterval, setPollingInterval] = useState(null)
	const [userCredits, setUserCredits] = useState(null)
	const [creditsLoading, setCreditsLoading] = useState(false)
	const [creditsError, setCreditsError] = useState(null)
	// State for credit purchase modal
	const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false)
	const [creditsNeeded, setCreditsNeeded] = useState(0)
	const [estimatedCredits, setEstimatedCredits] = useState(null)
	const [generationStatus, setGenerationStatus] = useState(null)
	const [isVisible, setIsVisible] = useState(false)
	// State for task tracking and generation time
	const [currentTaskId, setCurrentTaskId] = useState(null)
	const [currentSongId, setCurrentSongId] = useState(null)
	const [generationStartTime, setGenerationStartTime] = useState(null)
	const [generationEndTime, setGenerationEndTime] = useState(null)
	const [generationDuration, setGenerationDuration] = useState(null)
	
	// Timer state for real-time tracking
	const [timerInterval, setTimerInterval] = useState(null)
	const [currentTime, setCurrentTime] = useState(0)
	
	// Status tracking
	const [statusCheckCount, setStatusCheckCount] = useState(0)
	const [lastStatusResponse, setLastStatusResponse] = useState(null)
	// State for generated songs
	const [generatedSongs, setGeneratedSongs] = useState([])
	const [selectedSongIndex, setSelectedSongIndex] = useState(0)

	// Style options
	const styleOptions = [
		{ value: 'pop', label: 'Pop' },
		{ value: 'rock', label: 'Rock' },
		{ value: 'hiphop', label: 'Hip Hop' },
		{ value: 'electronic', label: 'Electronic' },
		{ value: 'jazz', label: 'Jazz' },
		{ value: 'classical', label: 'Classical' },
		{ value: 'folk', label: 'Folk' },
		{ value: 'cinematic', label: 'Cinematic' },
		{ value: 'orchestral', label: 'Orchestral' }
	]

	// Tempo options
	const tempoOptions = [
		{ value: 'slow', label: 'Slow' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'fast', label: 'Fast' }
	]

	// Mood options
	const moodOptions = [
		{ value: 'happy', label: 'Happy' },
		{ value: 'sad', label: 'Sad' },
		{ value: 'energetic', label: 'Energetic' },
		{ value: 'calm', label: 'Calm' },
		{ value: 'neutral', label: 'Neutral' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'uplifting', label: 'Uplifting' }
	]

	// Lyrics type options
	const lyricsTypeOptions = [
		{ value: 'generate', label: 'Generate Lyrics' },
		{ value: 'instrumental', label: 'Instrumental Only' },
		{ value: 'user', label: 'Use My Text as Lyrics' }
	]

	const [lyricsType, setLyricsType] = useState('generate')

	const toggleVisibility = () => {
		setIsVisible(!isVisible)
	}
	
	useEffect(() => {
		if (session?.user) {
			fetchUserCredits()
			fetchUserSongs()
			
			// Check for any pending songs that might have completed
			checkPendingSongs()
		}
		
		// Cleanup function to clear any intervals when component unmounts
		return () => {
			if (pollingInterval) {
				console.log('Clearing polling interval on unmount')
				clearInterval(pollingInterval)
			}
		}
	}, [session])

	const checkPendingSongs = async () => {
		try {
			// Simply refresh the songs list to get any newly completed songs
			console.log('Checking for completed songs...')
			await fetchUserSongs()
			await fetchUserCredits()
		} catch (error) {
			console.error('Error checking pending songs:', error)
		}
	}
	// Format time in mm:ss.ms format for the timer
	const formatTime = (ms) => {
		const totalSeconds = ms / 1000
		const minutes = Math.floor(totalSeconds / 60)
		const seconds = Math.floor(totalSeconds % 60)
		const milliseconds = Math.floor((ms % 1000) / 10)
		
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
	}
	
	// Start timer function
	const startTimer = () => {
		// Reset any existing timer
		if (timerInterval) {
			clearInterval(timerInterval)
		}
		
		const now = Date.now()
		setGenerationStartTime(now)
		setGenerationEndTime(null)
		setGenerationDuration(null)
		setCurrentTime(0)
		setStatusCheckCount(0)
		
		// Start a new timer that updates every 100ms
		const interval = setInterval(() => {
			const elapsed = Date.now() - now
			setCurrentTime(elapsed)
		}, 100)
		
		setTimerInterval(interval)
		console.log(`Timer started at ${new Date(now).toLocaleTimeString()}`)
	}
	
	// Stop timer function
	const stopTimer = () => {
		if (timerInterval) {
			clearInterval(timerInterval)
			setTimerInterval(null)
		}
		
		const now = Date.now()
		setGenerationEndTime(now)
		
		if (generationStartTime) {
			const elapsed = now - generationStartTime
			setGenerationDuration(elapsed)
			console.log(`Timer stopped. Total time: ${formatTime(elapsed)}`)
		}
	}
	
	// Check status of a task
	const checkStatus = async (taskId, songId) => {
		try {
			setStatusCheckCount(prev => prev + 1)
			console.log(`Checking status for task ${taskId}... (Check #${statusCheckCount + 1})`)
			
			// Call the status_suno API for Suno tasks
			const response = await axios.get(`/api/music/status-suno?taskId=${taskId}&songId=${songId}`)
			
			const statusData = response.data
			setLastStatusResponse(statusData)
			setGenerationStatus(statusData.status || 'unknown')
			
			console.log(`Status: ${statusData.status || 'unknown'}`)
			
			// If completed, handle the Suno-specific response format
			if (statusData.status === 'completed' && statusData.output) {
				// Handle Suno response which includes songs array with audio, lyrics, and image
				if (statusData.output.songs && statusData.output.songs.length > 0) {
					const songs = statusData.output.songs
					console.log(`Received ${songs.length} songs from Suno`)
					
					// Set the generated songs
					setGeneratedSongs(songs)
					
					// Set the first song as the selected one
					if (songs[0]) {
						setGeneratedAudio(songs[0].song_path)
						setGeneratedLyrics(songs[0].lyrics)
						setCoverImage(songs[0].image_path)
						console.log(`Audio URL: ${songs[0].song_path}`)
						console.log(`Lyrics: ${songs[0].lyrics.substring(0, 100)}...`)
						console.log(`Cover Image: ${songs[0].image_path}`)
					}
				} else if (statusData.output.audio_url) {
					// Fallback to simple audio_url if songs array is not available
					setGeneratedAudio(statusData.output.audio_url)
					console.log(`Audio URL: ${statusData.output.audio_url}`)
				}
				
				// Update loading state and clear error message
				setLoading(false)
				setError('')
				
				// Stop the timer
				stopTimer()
				
				// Refresh the songs list
				await fetchUserSongs()
				await fetchUserCredits()
				// Stop polling
				if (pollingInterval) {
					clearInterval(pollingInterval)
					setPollingInterval(null)
					console.log('Status polling stopped - song is ready')
				}
			}
			
			// Also check if the song has been updated in our database
			if (songId) {
				try {
					const songResponse = await axios.get(`/api/songs/${songId}`)
					if (songResponse.data && songResponse.data.audioUrl) {
						setGeneratedAudio(songResponse.data.audioUrl)
						console.log(`Song updated in database with audio URL: ${songResponse.data.audioUrl}`)
						
						// Update generation status
						setGenerationStatus('completed')
						
						// Update loading state
						setLoading(false)
						setError('')
						
						// Stop the timer if it's still running
						if (timerInterval) {
							stopTimer()
						}
						
						// Stop polling
						if (pollingInterval) {
							clearInterval(pollingInterval)
							setPollingInterval(null)
							console.log('Status polling stopped - song is ready in database')
						}
					}
				} catch (songErr) {
					console.error('Error checking song in database:', songErr)
				}
			}
			
			return statusData
		} catch (err) {
			console.error('Error checking status:', err)
			return null
		}
	}

	// Poll for result
	const pollForResult = async (taskId, songId) => {
		try {
			// Use currentSongId if songId is not provided or undefined
			const effectiveSongId = songId || currentSongId
			
			if (!effectiveSongId) {
				console.error('Cannot poll for result: missing songId', { taskId, songId, currentSongId })
				return null
			}
			
			const response = await axios.get(`/api/music/status-suno?taskId=${taskId}&songId=${effectiveSongId}`)
			const data = response.data
			console.log('Poll result data:', data)

			// Update generation status
			setGenerationStatus(data.status)

			// Check if we have start time information
			if (data.meta && data.meta.started_at && data.meta.started_at !== "0001-01-01T00:00:00Z" && !generationStartTime) {
				setGenerationStartTime(new Date(data.meta.started_at))
			}

			if ((data.status === 'completed' || data.status === 'succeeded') && data.output && data.output.songs && data.output.songs.length > 0) {
				console.log('Song generation completed successfully', data.output.songs)
				
				// Update user credits after successful generation
				fetchUserCredits()
				// Process the songs to ensure they have all required fields
				const processedSongs = data.output.songs.map(song => ({
					...song,
					audioUrl: song.song_path, // Ensure audioUrl is set for SongList component
					song_path: song.song_path, // Make sure song_path is available
					status: 'completed', // Explicitly mark as completed
					tags: Array.isArray(song.tags) ? song.tags : [] // Ensure tags exists and is an array
				}))

				// Set the first song as selected by default
				const firstSong = processedSongs[0]
				setGeneratedAudio(firstSong.song_path)
				setGeneratedLyrics(firstSong.lyrics)
				setCoverImage(firstSong.image_path)
				
				// Store processed songs in state
				setGeneratedSongs(processedSongs)
				
				// Record end time and calculate duration
				if (data.meta && data.meta.ended_at && data.meta.ended_at !== "0001-01-01T00:00:00Z") {
					const endTime = new Date(data.meta.ended_at)
					setGenerationEndTime(endTime)
					
					if (generationStartTime) {
						const durationMs = endTime - generationStartTime
						const durationSec = Math.round(durationMs / 1000)
						setGenerationDuration(durationSec)
					}
				}

				// Clear the polling interval
				if (pollingInterval) {
					clearInterval(pollingInterval)
					setPollingInterval(null)
					console.log('Status polling stopped - song is ready')
				}

				// Set loading to false
				setLoading(false)
				setError('') // Clear any error messages
				
				// Force a re-render by updating the selected song index
				setSelectedSongIndex(0)
				
				// Refresh the songs list to show the completed song
				// This ensures we have the latest data including the new song
				await fetchUserSongs()
				
				// Notify parent about credits update
				if (onCreditsUpdate) {
					onCreditsUpdate()
				}
			} else if (data.status === 'failed') {
				// Handle failed generation
				setError(data.error?.message || 'Failed to generate music. Please try again.')
				
				// Clear the polling interval
				if (pollingInterval) {
					clearInterval(pollingInterval)
					setPollingInterval(null)
				}

				// Set loading to false
				setLoading(false)
			}
			return data;
		} catch (err) {
			console.error('Error polling for result:', err)
			return null;
		}
	}

	// Start polling for result
	const startPolling = (taskId, songId) => {
		// Use currentSongId if songId is not provided or undefined
		const effectiveSongId = songId || currentSongId
		
		if (!effectiveSongId) {
			console.error('Cannot start polling: missing songId', { taskId, songId, currentSongId })
			return null
		}
		
		// Start polling for results
		console.log(`Starting polling for task ${taskId} with song ID ${effectiveSongId}`)
		
		// Clear any existing polling interval
		if (pollingInterval) {
			clearInterval(pollingInterval)
			setPollingInterval(null)
		}
		
		// Set up a new polling interval (every 10 seconds to match DiffrhymGenerator)
		const interval = setInterval(() => pollForResult(taskId, effectiveSongId), 10000)
		setPollingInterval(interval)
		
		// Record the start time
		setGenerationStartTime(new Date())
		
		// Do an initial check immediately
		pollForResult(taskId, effectiveSongId)
	}
	
	// Fetch user's songs from the database
	const fetchUserSongs = async () => {
		console.log('Starting to fetch Suno songs...')
		try {
			// First check if the user is authenticated by getting the session
			const sessionResponse = await fetch('/api/auth/session')
			const sessionData = await sessionResponse.json()
			
			if (!sessionData || !sessionData.user) {
				console.log('User not authenticated, skipping song fetch')
				return
			}
			
			// Fetch all user songs and filter locally
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
			console.log('All songs from API:', data)

			if (data.songs && Array.isArray(data.songs)) {
				// Filter songs for Suno provider
				const sunoSongs = data.songs.filter(song => {
					// Check if it's a Suno song
					let isSunoSong = false;
					
					// Check provider field
					if (song.provider === 'suno') isSunoSong = true;
					
					// Check tags array
					if (song.tags && Array.isArray(song.tags)) {
						if (song.tags.some(tag => tag === 'provider:suno')) {
							isSunoSong = true;
						}
					}
					
					// Only include songs that are Suno songs AND have an audio URL
					// This is the key change - only include songs that have an audio URL
					const hasAudioUrl = song.audioUrl || song.song_path;
					
					// Special case: if this is the current song being generated and we have audio in memory
					const isCurrentSongWithAudio = song.id === currentSongId && generatedAudio;
					
					return isSunoSong && (hasAudioUrl || isCurrentSongWithAudio);
				});
				
				console.log(`Filtered ${sunoSongs.length} completed Suno songs from ${data.songs.length} total songs`);

				// Format the songs with proper style, tempo, and mood extraction
				const formattedSongs = sunoSongs.map(song => {
					// Extract properties from song data or tags
					const style = song.style || 
						(song.tags?.find(tag => tag.startsWith('style:'))?.split(':')[1]);
					
					const tempo = song.tempo || 
						(song.tags?.find(tag => tag.startsWith('tempo:'))?.split(':')[1]);
					
					const mood = song.mood || 
						(song.tags?.find(tag => tag.startsWith('mood:'))?.split(':')[1]);

					return {
						...song,
						style,
						tempo,
						mood,
						// Ensure a valid audio URL is available
						audioUrl: song.audioUrl || song.song_path,
					};
				});

				// Update the state with formatted songs
				setGeneratedSongs(formattedSongs);
				
				// If songs exist, select the first (newest) one if none is selected
				if (formattedSongs.length > 0 && selectedSongIndex === null) {
					selectSong(0);
				}
				
				// If we have a current song ID, find and select it
				if (currentSongId) {
					const currentSongIndex = formattedSongs.findIndex(song => song.id === currentSongId);
					if (currentSongIndex >= 0) {
						selectSong(currentSongIndex);
					}
				}
			}
		} catch (error) {
			console.error('Error fetching user songs:', error);
		}
	}
	
	// Fetch user credits
	const fetchUserCredits = async () => {
		setCreditsLoading(true)
		setCreditsError(null)
		
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
				const errorData = await response.json().catch(() => ({}))
				throw new Error(errorData.error || `Failed to fetch credits: ${response.status} ${response.statusText}`)
			}
			
			const data = await response.json()
			setUserCredits(data)
			// Notify parent component that credits have been updated
			onCreditsUpdate(data)
		} catch (error) {
			console.error('Error fetching credits:', error)
			setCreditsError(error.message || 'Failed to load credits. Please try again.')
		} finally {
			setCreditsLoading(false)
		}
	}

	const handleInputChange = (field, value) => {
		onPromptChange({
			...selectedPrompt,
			[field]: value,
		})
	}

	// Calculate estimated credits based on prompt complexity and selected options
	// This is only used to check if user has enough credits, not to show the cost
	const calculateEstimatedCredits = () => {
		// Get the prompt text
		const promptText = selectedPrompt.text || '';
		// Count words in the prompt - use the same algorithm as the backend
		const wordCount = promptText.split(/\s+/).filter(word => word.length > 0).length;
		
		// Base cost: 80 credits for Suno generation
		let credits = 80;
		
		// Additional cost: 5 credits for every 10 words (or fraction) over 200 words
		if (wordCount > 200) {
			const excessWords = wordCount - 200;
			const excessWordPacks = Math.ceil(excessWords / 10);
			credits += excessWordPacks * 5;
		}
		
		// Log the calculation for debugging
		console.log(`Suno credit calculation: ${wordCount} words = ${credits} credits`);
		console.log(`User has ${userCredits?.credits || 0} credits available`);
		
		return credits;
	}

	const generateAudio = async () => {
		setLoading(true)
		setError('')
		setGeneratedAudio(null)
		setGeneratedLyrics(null)
		setCoverImage(null)
		setGenerationStatus('starting')
		setEstimatedCredits(null)
		
		// Stop any existing polling
		if (pollingInterval) {
			clearInterval(pollingInterval)
			setPollingInterval(null)
		}
		
		// Start the timer
		startTimer()

		try {
			// Calculate estimated credits
			const estimatedCredits = calculateEstimatedCredits()
			setEstimatedCredits(estimatedCredits)

			// Check if user has enough credits
			if (userCredits && userCredits.credits < estimatedCredits) {
				setCreditsNeeded(estimatedCredits - userCredits.credits)
				setShowCreditPurchaseModal(true)
				setLoading(false)
				setGenerationStatus(null)
				stopTimer() // Stop the timer if we don't have enough credits
				return
			}

			// Prepare the request payload
			const payload = {
				prompt: selectedPrompt.text,
				style: selectedPrompt.style,
				tempo: selectedPrompt.tempo,
				mood: selectedPrompt.mood,
				tags: selectedPrompt.tags,
				title: selectedPrompt.title,
				lyricsType
			}

			// Show generating status
			setGenerationStatus('generating')
			console.log('Starting music generation with Suno API...')
			
			// Make the API request to the Suno endpoint
			const response = await axios.post('/api/music/generate-suno', payload)
			console.log('Generation response:', response.data)

			// Handle the response
			if (response.data && response.data.success) {
				const { taskId, songId } = response.data
				
				console.log('Music generation initiated successfully', { taskId, songId })
				
				// Update generation status
				setGenerationStatus('pending')
				
				// Store the task ID and song ID for status checking
				setCurrentTaskId(taskId)
				setCurrentSongId(songId)
				
				// Immediately check the status once
				await checkStatus(taskId, songId)
				
				// Start polling for status
				startPolling(taskId, songId)
				
				// Clear the interval after 10 minutes (safety timeout)
				setTimeout(() => {
					if (pollingInterval) {
						clearInterval(pollingInterval)
						setPollingInterval(null)
						console.log('Status polling stopped due to timeout')
					}
				}, 600000) // 10 minutes
				
				// The polling interval is already set in startPolling function
				
				// Refresh the songs list to show the pending song
				await fetchUserSongs()
				
				// Set a message to inform the user
				setError('Your music is being generated. It will appear in your song list automatically when ready. This may take a few minutes.')
			} else {
				throw new Error('Failed to generate music. Please try again.')
			}
		} catch (err) {
			console.error('Error generating audio:', err)
			
			// Check if this is a credit-related error
			if (err.response && err.response.status === 403 && err.response.data) {
				const { creditsNeeded, creditsAvailable, shortfall } = err.response.data
				
				// Set the credits needed for the purchase modal
				setCreditsNeeded(shortfall || (creditsNeeded - creditsAvailable))
				
				// Show a more helpful error message
				setError(`You need ${shortfall || (creditsNeeded - creditsAvailable)} more credits to generate this music.`)
				
				// Open the credit purchase modal
				setShowCreditPurchaseModal(true)
			} else {
				// Handle other types of errors
				setError(err.response?.data?.error || err.message || 'Failed to generate music. Please try again.')
			}
			
			// Stop the timer
			stopTimer()
			setLoading(false)
			setGenerationStatus(null)
		}
	}

	// Format progress message based on status
	const getProgressMessage = () => {
		switch (generationStatus) {
			case 'initializing':
				return 'Preparing generation...'
			case 'pending':
				return 'Waiting in queue...'
			case 'processing':
				return 'Creating your music...'
			case 'rendering':
				return 'Finalizing your track...'
			case 'analyzing':
				return 'Analyzing audio quality...'
			case 'completed':
				return 'Generation complete!'
			default:
				return 'Generating music...'
		}
	}

	// Handle song selection
	const selectSong = (index) => {
		if (index >= 0 && index < generatedSongs.length) {
			setSelectedSongIndex(index)
			const song = generatedSongs[index]
			setGeneratedAudio(song.audioUrl || song.song_path)
			setGeneratedLyrics(song.lyrics)
			setCoverImage(song.coverImageUrl || song.image_path)
		}
	}

	// Handle song deletion
	const deleteSong = async (songId) => {
		try {
			// Delete the song from the database
			const response = await fetch(`/api/songs/${songId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			})
			
			if (!response.ok) {
				throw new Error(`Failed to delete song: ${response.status} ${response.statusText}`)
			}
			
			console.log(`Song ${songId} deleted successfully`)
			
			// Remove the song from the local state
			const updatedSongs = generatedSongs.filter(song => song.id !== songId)
			setGeneratedSongs(updatedSongs)
			
			// If the deleted song was selected, select another song
			if (generatedSongs[selectedSongIndex]?.id === songId) {
				if (updatedSongs.length > 0) {
					// Select the first song if available
					selectSong(0)
				} else {
					// Clear the selected song if no songs are left
					setSelectedSongIndex(null)
					setGeneratedAudio(null)
					setGeneratedLyrics(null)
					setCoverImage(null)
				}
			}
		} catch (error) {
			console.error('Error deleting song:', error)
			alert('Failed to delete song. Please try again.')
		}
	}

	return (
		<div className="max-w-2xl mx-auto p-4 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg shadow-xl">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-2xl font-bold text-white">Generate Music with PlanetQAi</h3>
				
				{creditsLoading ? (
					<div className="flex items-center gap-2 bg-blue-700/30 px-3 py-1 rounded-full">
						<div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
						<span className="text-blue-300 text-sm font-medium">Loading...</span>
					</div>
				) : creditsError ? (
					<button 
						onClick={fetchUserCredits}
						className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded-full transition-colors"
						title={creditsError}
					>
						<AlertCircle className="w-4 h-4 text-red-400" />
						<span className="text-red-300 text-sm font-medium">Error loading credits</span>
					</button>
				) : userCredits ? (
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-1 bg-blue-700/50 px-3 py-1 rounded-full">
							<Zap className="w-4 h-4 text-yellow-400" />
							<span className="text-white text-sm font-medium">
								{userCredits.credits.toLocaleString()} Planet_Q_Coins
							</span>
						</div>
						{userCredits.credits < 85 && (
							<button 
								onClick={() => setShowCreditPurchaseModal(true)}
								className="flex items-center gap-1 bg-yellow-500/80 hover:bg-yellow-500/90 text-yellow-900 text-xs font-medium px-2 py-1 rounded-full transition-colors"
							>
								<Zap className="w-3 h-3" />
								<span>Upgrade</span>
							</button>
						)}
					</div>
				) : null}
			</div>

			{/* Credit information */}
			{estimatedCredits && (
				<div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
					<div className="flex items-center gap-2 text-blue-300">
						<CreditCard size={18} />
						<p className="text-sm">
							This generation will use approximately <span className="font-bold">{estimatedCredits}</span> Planet_Q_Coins.
						</p>
					</div>
				</div>
			)}

			<div className="mb-4">
				<label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">
					Music Description or Lyrics
				</label>
				<textarea
					id="prompt"
					placeholder="Describe your desired music or enter lyrics. Be specific about the style, mood, and instruments you want."
					value={selectedPrompt.text}
					onChange={e => handleInputChange('text', e.target.value)}
					className="bg-gradient-to-t from-slate-700 to-slate-600 p-3 border border-slate-500 text-white w-full rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
					rows="5"
				/>
			</div>

			{/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
				<div>
					<label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
						Song Title
					</label>
					<input
						id="title"
						type="text"
						placeholder="Enter a title for your song"
						value={selectedPrompt.title}
						onChange={e => handleInputChange('title', e.target.value)}
						className="bg-gradient-to-t from-slate-700 to-slate-600 p-3 border border-slate-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
					/>
				</div>
				<div>
					<label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-1">
						Tags (comma separated)
					</label>
					<input
						id="tags"
						type="text"
						placeholder="e.g., dance, energetic, futuristic"
						value={selectedPrompt.tags}
						onChange={e => handleInputChange('tags', e.target.value)}
						className="bg-gradient-to-t from-slate-700 to-slate-600 p-3 border border-slate-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
					/>
				</div>
			</div> */}

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
				<div>
					<label htmlFor="style" className="block text-sm font-medium text-gray-300 mb-1">
						Music Style
					</label>
					<Select
						value={selectedPrompt.style}
						onValueChange={(value) => handleInputChange('style', value)}
					>
						<SelectTrigger className="bg-gradient-to-t from-slate-700 to-slate-600 border border-slate-500 text-white">
							<SelectValue placeholder="Select style" />
						</SelectTrigger>
						<SelectContent>
							{styleOptions.map(option => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{/* <div>
					<label htmlFor="tempo" className="block text-sm font-medium text-gray-300 mb-1">
						Tempo
					</label>
					<Select
						value={selectedPrompt.tempo}
						onValueChange={(value) => handleInputChange('tempo', value)}
					>
						<SelectTrigger className="bg-gradient-to-t from-slate-700 to-slate-600 border border-slate-500 text-white">
							<SelectValue placeholder="Select tempo" />
						</SelectTrigger>
						<SelectContent>
							{tempoOptions.map(option => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div> */}
				{/* <div>
					<label htmlFor="mood" className="block text-sm font-medium text-gray-300 mb-1">
						Mood
					</label>
					<Select
						value={selectedPrompt.mood}
						onValueChange={(value) => handleInputChange('mood', value)}
					>
						<SelectTrigger className="bg-gradient-to-t from-slate-700 to-slate-600 border border-slate-500 text-white">
							<SelectValue placeholder="Select mood" />
						</SelectTrigger>
						<SelectContent>
							{moodOptions.map(option => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div> */}
			</div> 

			{/* Lyrics Type Selector */}
			{/* <div className="mb-6">
				<label htmlFor="lyricsType" className="block text-sm font-medium text-gray-300 mb-1">
					Lyrics Type
				</label>
				<Select
					value={lyricsType}
					onValueChange={setLyricsType}
				>
					<SelectTrigger className="bg-gradient-to-t from-slate-700 to-slate-600 border border-slate-500 text-white">
						<SelectValue placeholder="Select lyrics type" />
					</SelectTrigger>
					<SelectContent>
						{lyricsTypeOptions.map(option => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<p className="text-xs text-gray-400 mt-1">
					{lyricsType === 'generate' && "AI will generate lyrics based on your description"}
					{lyricsType === 'instrumental' && "Create music without vocals"}
					{lyricsType === 'user' && "Your description will be used as lyrics"}
				</p>
			</div> */}

			<div className="flex justify-center items-center mb-4">
				{session ? (
					<button
						onClick={generateAudio}
						disabled={loading || !selectedPrompt.text || creditsLoading}
						className="bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors duration-300 w-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
						{loading ? (
							<div className="flex items-center justify-center gap-2">
								<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
								<span>{getProgressMessage() || 'Generating...'}</span>
							</div>
						) : (
							<div className="flex items-center justify-center gap-2">
								<Music className="w-5 h-5" />
								<span>Generate Music with PlanetQ AI</span>
							</div>
						)}
					</button>
				) : (
					<Link
						href={{
							pathname: '/signup',
							query: {
								...(tags ? { tags: encodeURIComponent(tags) } : {}),
								...(text ? { text: encodeURIComponent(text) } : {}),
								...(title ? { title: encodeURIComponent(title) } : {}),
								...(style ? { style: encodeURIComponent(style) } : {}),
								...(tempo ? { tempo: encodeURIComponent(tempo) } : {}),
								...(mood ? { mood: encodeURIComponent(mood) } : {}),
								redirectTo: encodeURIComponent(pathname),
							},
						}}
						className="bg-blue-600 text-white justify-center items-center text-center p-3 rounded-md hover:bg-blue-700 transition-colors duration-300 w-full font-semibold">
						Sign Up to Generate Music
					</Link>
				)}
			</div>

			{/* Need more credits button */}
			{userCredits && userCredits.credits < 50 && (
				<div className="mb-4 text-center">
					<button
						onClick={() => setShowCreditPurchaseModal(true)}
						className="text-blue-300 hover:text-blue-200 text-sm underline flex items-center justify-center gap-1 mx-auto">
						<Zap className="w-4 h-4" />
						<span>Need more credits? Purchase now</span>
					</button>
				</div>
			)}

			{error && (
				<div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
					<div className="flex items-center gap-2 text-red-300">
						<AlertCircle size={18} />
						<p className="text-sm">{error}</p>
					</div>
				</div>
			)}

			{generatedSongs && generatedSongs.length > 0 && (
				<div className="mt-6 space-y-6">
					<div>
						<h4 className="text-white font-semibold mb-3">Your PlanetQAi Songs</h4>
						
						{/* Use the reusable SongList component */}
						<SongList 
							songs={generatedSongs} 
							selectedSongIndex={selectedSongIndex} 
							onSelectSong={selectSong} 
							generator="suno" 
						/>
					</div>
					
					{/* Use the reusable SongDetail component */}
					{generatedSongs[selectedSongIndex] && (
						<SongDetail 
							song={generatedSongs[selectedSongIndex]} 
							onEditTitle={(newTitle) => {
								// Update the song title in the state
								const updatedSongs = [...generatedSongs]
								updatedSongs[selectedSongIndex] = {
									...updatedSongs[selectedSongIndex],
									title: newTitle
								}
								setGeneratedSongs(updatedSongs)
								
								// Update the song title in the database
								const songId = updatedSongs[selectedSongIndex].id
								fetch(`/api/songs/${songId}`, {
									method: 'PATCH',
									headers: {
										'Content-Type': 'application/json'
									},
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

			{/* Information about credit usage */}
			<div className="mt-6 pt-4 border-t border-blue-700/50">
				<div className="flex items-start gap-2">
					<TbInfoHexagonFilled className="text-gray-400 flex-shrink-0 mt-1" size={20} />
					<p className="text-gray-400 text-sm">
						Music generation uses credits from your account. PlanetQAi provides high-quality music with vocals and lyrics. 
						<button onClick={() => router.push('/payment')} className="text-blue-400 hover:text-blue-300 ml-1">
							View pricing plans
						</button>
					</p>
				</div>
			</div>

			{/* Credit Purchase Modal */}
			<CreditPurchaseModal 
				isOpen={showCreditPurchaseModal}
				onClose={() => setShowCreditPurchaseModal(false)}
				creditsNeeded={creditsNeeded}
				onSuccess={() => {
					// Refresh user credits after successful purchase
					fetchUserCredits()
				}}
			/>

		</div>
	)
}

export default SunoGenerator
