'use client'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select"
import { useUser } from "@/context/UserContext"
import { normalizeValue } from '@/utils/functions'
import axios from 'axios'
import { AlertCircle, Clock, CreditCard, Music, Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TbInfoHexagonFilled } from 'react-icons/tb'
import CreditPurchaseModal from '../credits/CreditPurchaseModal'
import SongDetail from './SongDetail'
import SongList from './SongList'

const DiffrhymGenerator = ({
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
	const [errorMessage, setErrorMessage] = useState('')
	// State for user credits
		const {
				credits: userCredits,
				fetchUserCredits,
			} = useUser()


	// State for credit purchase modal
	const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false)
	const [creditsNeeded, setCreditsNeeded] = useState(0)
	const [estimatedCredits, setEstimatedCredits] = useState(null)
	const [generationStatus, setGenerationStatus] = useState(null)
	const [isVisible, setIsVisible] = useState(false)
	// State for task tracking and generation time
	const [currentTaskId, setCurrentTaskId] = useState(null)
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
	const [editingSongTitle, setEditingSongTitle] = useState(false)
	const [editedSongTitle, setEditedSongTitle] = useState('')

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

	const toggleVisibility = () => {
		setIsVisible(!isVisible)
	}

	// Fetch user credits and songs on component mount
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
	
	// Function to check for any pending songs that might have completed
	const checkPendingSongs = async () => {
		try {
			// Simply refresh the songs list to get any newly completed songs
			await fetchUserSongs()
			await fetchUserCredits()
		} catch (error) {
			console.error('Error checking pending songs:', error)
		}
	}
	
	// Fetch user's songs from the database
	const fetchUserSongs = async () => {
		
		try {
			// First check if the user is authenticated by getting the session
			const sessionResponse = await fetch('/api/auth/session')
			const sessionData = await sessionResponse.json()
			
			if (!sessionData || !sessionData.user) {
				console.log('User not authenticated, skipping song fetch')
				return
			}
			
			// Fetch all user songs and filter locally
			const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || ''

			const response = await fetch(`${apiBaseUrl}/api/songs`, {
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
				// Log all songs for debugging
				
				
				// Filter songs for Diffrhym with more detailed logging
				const diffrhymSongs = data.songs.filter(song => {
					// Check if song has required fields
					if (!song.id || !song.audioUrl) {
						return false;
					}
					
					// Check provider field
					if (song.provider === 'diffrhym') {
						return true;
					}
					
					// Check tags array
					if (song.tags && Array.isArray(song.tags)) {
						const isDiffrhym = song.tags.some(tag => tag === 'provider:diffrhym');
						if (isDiffrhym) {
							return true;
						}
					}
					
					return false;
				});
			
				// Sort songs by creation date (newest first)
				const sortedSongs = diffrhymSongs.sort((a, b) => {
					return new Date(b.createdAt) - new Date(a.createdAt)
				})
				
				// Map database songs to the format used in the component
				const formattedSongs = sortedSongs.map(song => {
					// Extract properties from song data or tags
					const style = song.style || 
						(song.tags?.find(tag => tag.startsWith('style:'))?.split(':')[1]);
					
					const tempo = song.tempo || 
						(song.tags?.find(tag => tag.startsWith('tempo:'))?.split(':')[1]);
					
					const mood = song.mood || 
						(song.tags?.find(tag => tag.startsWith('mood:'))?.split(':')[1]);

					// Ensure isForSale is always a boolean
					const isForSale = Boolean(song.isForSale);
					
					// Create the formatted song object
					const formattedSong = {
						id: song.id,
						title: song.title || 'Untitled Song',
						audioUrl: song.audioUrl || song.song_path,
						lyrics: song.lyrics,
						coverImageUrl: song.thumbnailUrl || song.coverImageUrl || 
							`https://via.placeholder.com/300?text=${encodeURIComponent(song.title || 'Untitled')}`,
						duration: song.duration || 0,
						createdAt: song.createdAt,
						generator: 'diffrhym',
						isForSale,
						prompt: song.prompt,
						style,
						tempo,
						mood,
						// Include all original song properties to ensure nothing is lost
						...song
					};

					console.log('Formatted song:', formattedSong.id, {
						style: formattedSong.style,
						tempo: formattedSong.tempo,
						mood: formattedSong.mood,
						tags: song.tags
					});

					return formattedSong;
				})
				
				setGeneratedSongs(formattedSongs)
				
				// If songs exist, select the first (newest) one
				if (formattedSongs.length > 0) {
					selectSong(0)
				}
			}
		} catch (error) {
			console.error('Error fetching user songs:', error)
		}
	}

	// Cleanup function for component unmount
	useEffect(() => {
		return () => {
		}
	}, [])

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
		
		// Base cost: 50 credits for Q_World Studio generation
		let credits = 50;
		
		// Additional cost: 4 credits for every 10 words (or fraction) over 200 words
		if (wordCount > 200) {
			const excessWords = wordCount - 200;
			const excessWordPacks = Math.ceil(excessWords / 10);
			credits += excessWordPacks * 4;
		}
				
		return credits;
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
		}
	}
	
	// Check status of a task
	const checkStatus = async (taskId, songId) => {
		try {
			setStatusCheckCount(prev => prev + 1)
		
			// Call the status API
			const response = await axios.get(`/api/music/status?taskId=${taskId}&songId=${songId}`)
			
			const statusData = response.data
			setLastStatusResponse(statusData)
			setGenerationStatus(statusData.status || 'unknown')

			// If completed, get the audio URL and stop the timer
			if (statusData.status === 'completed' && statusData.output && statusData.output.audio_url) {
				setGeneratedAudio(statusData.output.audio_url)
				
				// Stop the timer
				stopTimer()
				
				// Update loading state and clear error message
				setLoading(false)
				setError('')
				
				// Refresh the songs list
				await fetchUserSongs()
				await fetchUserCredits()
				
				// Stop polling
				if (pollingInterval) {
					clearInterval(pollingInterval)
					setPollingInterval(null)
				}
			}
			
			// Also check if the song has been updated in our database
			if (songId) {
				try {
					const songResponse = await axios.get(`/api/songs/${songId}`)
					if (songResponse.data && songResponse.data.audioUrl) {
						setGeneratedAudio(songResponse.data.audioUrl)
						
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
			if (userCredits && userCredits.credits.normal < estimatedCredits) {
				setCreditsNeeded(estimatedCredits - userCredits.credits.normal)
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
			}

			// Show generating status
			setGenerationStatus('generating')
			console.log('Starting music generation with new API...', payload)

			// Make the API request to the new generate_v1 endpoint
			const response = await axios.post('/api/music/generate', payload)
			

			// Handle the response
			if (response.data && response.data.success) {
				const { taskId, songId, status } = response.data
				
				// Update generation status
				setGenerationStatus(status || 'pending')
				
				// Store the task ID for status checking
				setCurrentTaskId(taskId)
				
				// Immediately check the status once
				await checkStatus(taskId, songId)
				
				// Set up an interval to check the status every 10 seconds
				const statusInterval = setInterval(async () => {
					const statusData = await checkStatus(taskId, songId)
					
					// If the status is completed or failed, clear the interval
					if (statusData && (statusData.status === 'completed' || statusData.status === 'failed')) {
						clearInterval(statusInterval)
						setPollingInterval(null)
						
						// Update loading state based on status
						if (statusData.status === 'completed') {
							// Stop the timer when completed
							stopTimer()
							setLoading(false)
							setError('')
						} else if (statusData.status === 'failed') {
							// Handle failure
							stopTimer()
							setLoading(false)
							setError('Music generation failed. Please try again.')
						}
					}
				}, 10000) // Check every 10 seconds
				
				// Clear the interval after 10 minutes (safety timeout)
				setTimeout(() => {
					if (statusInterval) {
						clearInterval(statusInterval)
						setPollingInterval(null)
						console.log('Status polling stopped due to timeout')
					}
				}, 600000) // 10 minutes
				
				// Store the interval ID so we can clear it if the component unmounts
				setPollingInterval(statusInterval)
				
				// Refresh the songs list to show the pending song
				await fetchUserSongs()
				
				// Set a message to inform the user
				setError('Your music is being generated. It will appear in your song list automatically when ready. This may take a few minutes.')
			} else {
				throw new Error('Failed to generate music. Please try again.')
			}
		} catch (err) {
			console.error('Error generating audio:', err)
			
			// Log the full error for debugging
			console.error('Full error response:', err.response?.data)
			
			// Check if this is a credit-related error from our system
			if (err.response && err.response.status === 403 && err.response.data) {
				const { creditsNeeded, creditsAvailable, shortfall, error: errorMsg } = err.response.data
				
				// Set the credits needed for the purchase modal
				setCreditsNeeded(shortfall || (creditsNeeded - creditsAvailable))
				
				// Show the exact error message from the server
				setError(errorMsg || `You need ${shortfall || (creditsNeeded - creditsAvailable)} more credits to generate this music.`)
				
				// Open the credit purchase modal
				setShowCreditPurchaseModal(true)
			} else {
				// Generic error
				const errorMsg = err.response?.data?.error || err.message || 'Failed to generate music. Please try again.'
				if (errorMsg.toLowerCase().includes('credit') || errorMsg.toLowerCase().includes('insufficient')) {
					setError('There was an issue with the music generation service. Please try again.')
				} else {
					setError(errorMsg)
				}
			}
			
			setLoading(false)
			setGenerationStatus(null)
		}
	}

	// Helper function to get a human-readable progress message based on generation status
	// This is used in the UI to show the current status of the generation process

	// Function to handle song selection
	const selectSong = (index) => {
		setSelectedSongIndex(index)
		if (generatedSongs[index]) {
			setGeneratedAudio(generatedSongs[index].audioUrl)
			setGeneratedLyrics(generatedSongs[index].lyrics)
			setEditedSongTitle(generatedSongs[index].title)
		}
	}

	// Function to handle song title editing
	const startEditingTitle = () => {
		setEditingSongTitle(true)
	}

	// Function to save edited song title
	const saveEditedTitle = () => {
		if (generatedSongs.length > 0 && selectedSongIndex >= 0) {
			setGeneratedSongs(prevSongs => {
				const updatedSongs = [...prevSongs]
				updatedSongs[selectedSongIndex] = {
					...updatedSongs[selectedSongIndex],
					title: editedSongTitle
				}
				return updatedSongs
			})
			setEditingSongTitle(false)
		}
	}

	// Format progress message based on status
	const getProgressMessage = () => {
		switch (generationStatus) {
			case 'starting':
				return 'Preparing generation...'
			case 'generating':
				return 'Generating your music...'
			case 'initializing':
				return 'Preparing generation...'
			case 'pending':
				return 'Waiting in queue...'
			case 'processing':
				return 'Creating your music...'
			case 'running':
				return 'Creating your music...'
			case 'rendering':
				return 'Finalizing your track...'
			case 'analyzing':
				return 'Analyzing audio quality...'
			case 'completed':
				return 'Generation complete!'
			case 'failed':
				return 'Generation failed'
			default:
				return 'Generating music...'
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
	
	// Format time duration in a readable format
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
				<h3 className="text-2xl font-bold text-white">Generate Music with Q_World Studio</h3>
				
				{ userCredits ? (
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-1 bg-slate-700/50 px-3 py-1 rounded-full">
							<Zap className="w-4 h-4 text-yellow-400" />
							<span className="text-white text-sm font-medium">
								{userCredits.credits?.normal.toLocaleString()} Planet_Q_Coins
							</span>
						</div>
						{userCredits.credits?.normal < 85 && (
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
			
			{/* Timer display when generation is in progress */}
			{loading && (
				<div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-blue-300">
							<Clock size={18} />
							<p className="text-sm">Generation time:</p>
						</div>
						<div className="text-white font-mono text-lg">
							{generationStartTime ? (
								timerInterval ? formatTime(currentTime) : formatTime(generationDuration || 0)
							) : (
								"00:00.00"
							)}
						</div>
					</div>
					{statusCheckCount > 0 && (
						<div className="mt-2 text-xs text-blue-300">
							Status checks: {statusCheckCount} | Current status: {generationStatus || 'pending'}
						</div>
					)}
				</div>
			)}
			
			{/* Credit information */}
			{estimatedCredits && (
				<div className="mb-4 p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg">
					<div className="flex items-center gap-2 text-purple-300">
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
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
				
			</div>

			<div className="flex justify-center items-center mb-4">
				{session ? (
					<button
						onClick={generateAudio}
						disabled={loading || !selectedPrompt.text}
						className="bg-purple-600 text-white p-3 rounded-md hover:bg-purple-700 transition-colors duration-300 w-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
						{loading ? (
							<div className="flex items-center justify-center gap-2">
								<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
								<span>{getProgressMessage() || 'Generating...'}</span>
							</div>
						) : (
							<div className="flex items-center justify-center gap-2">
								<Music className="w-5 h-5" />
								<span>Generate Music</span>
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
						className="bg-purple-600 text-white justify-center items-center text-center p-3 rounded-md hover:bg-purple-700 transition-colors duration-300 w-full font-semibold">
						Sign Up to Generate Music
					</Link>
				)}
			</div> 

			{/* Need more credits button */}
			{userCredits && userCredits.credits.normal < 50 && (
				<div className="mb-4 text-center">
					<button
						onClick={() => setShowCreditPurchaseModal(true)}
						className="text-purple-300 hover:text-purple-200 text-sm underline flex items-center justify-center gap-1 mx-auto">
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

			{generatedSongs.length > 0 && (
				<div className="mt-6 space-y-6">
					<div>
						<h4 className="text-white font-semibold mb-3">Your Q_World Studio Songs</h4>
						
						{/* Use the reusable SongList component */}
						<SongList 
							songs={generatedSongs} 
							selectedSongIndex={selectedSongIndex} 
							onSelectSong={selectSong} 
							generator="diffrhym" 
							onSongUpdated={(updatedSong) => {
								setGeneratedSongs(prevSongs =>
									prevSongs.map(song => (song.id === updatedSong.id ? updatedSong : song))
								);
							}}
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
			<div className="mt-6 pt-4 border-t border-slate-700/50">
				<div className="flex items-start gap-2">
					<TbInfoHexagonFilled className="text-gray-400 flex-shrink-0 mt-1" size={20} />
					<p className="text-gray-400 text-sm">
						Music generation uses credits from your account. More complex styles like orchestral or cinematic may use more credits. 
						<button onClick={() => router.push('/payment')} className="text-purple-400 hover:text-purple-300 ml-1">
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

export default DiffrhymGenerator
