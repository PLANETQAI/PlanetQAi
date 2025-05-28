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
	const [userCredits, setUserCredits] = useState(null)
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
		}
	}, [session])
	
	// Fetch user's songs from the database
	const fetchUserSongs = async () => {
		console.log('Starting to fetch Diffrhym songs...')
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
			console.log('Fetching songs from:', `${apiBaseUrl}/api/songs`)
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
			console.log('All songs from API:', data)
			if (data.songs && Array.isArray(data.songs)) {
				// Filter songs for Diffrhym
				const diffrhymSongs = data.songs.filter(song => {
					// Check provider field
					if (song.provider === 'diffrhym') return true;
					
					// Check tags array
					if (song.tags && Array.isArray(song.tags)) {
						return song.tags.some(tag => tag === 'provider:diffrhym');
					}
					
					return false;
				});
				
				console.log(`Filtered ${diffrhymSongs.length} Diffrhym songs from ${data.songs.length} total songs`);
				
				// Sort songs by creation date (newest first)
				const sortedSongs = diffrhymSongs.sort((a, b) => {
					return new Date(b.createdAt) - new Date(a.createdAt)
				})
				
				console.log('Raw songs from database:', sortedSongs)
				
				// Map database songs to the format used in the component
				const formattedSongs = sortedSongs.map(song => {
					// Extract provider, style, tempo, mood from tags if available
					let provider = 'diffrhym';
					let style = 'pop';
					let tempo = 'medium';
					let mood = 'neutral';
					
					if (song.tags && Array.isArray(song.tags)) {
						song.tags.forEach(tag => {
							if (tag.startsWith('provider:')) {
								provider = tag.split(':')[1];
							} else if (tag.startsWith('style:')) {
								style = tag.split(':')[1];
							} else if (tag.startsWith('tempo:')) {
								tempo = tag.split(':')[1];
							} else if (tag.startsWith('mood:')) {
								mood = tag.split(':')[1];
							}
						});
					}
					
					return {
						id: song.id,
						title: song.title || 'Untitled Song',
						audioUrl: song.audioUrl,
						lyrics: song.lyrics,
						coverImageUrl: song.thumbnailUrl || `https://via.placeholder.com/300?text=${encodeURIComponent(song.title || 'Untitled')}`,
						duration: song.duration || 0,
						createdAt: song.createdAt,
						generator: provider,
						prompt: song.prompt,
						style: song.style || style,
						tempo: song.tempo || tempo,
						mood: song.mood || mood
					};
				})
				
				console.log('Formatted songs for UI:', formattedSongs)
				setGeneratedSongs(formattedSongs)
				
				// If songs exist, select the first (newest) one
				if (formattedSongs.length > 0) {
					console.log('Selecting first song:', formattedSongs[0])
					selectSong(0)
				}
			}
		} catch (error) {
			console.error('Error fetching user songs:', error)
		}
	}

	// Cleanup polling interval on unmount and ensure we only poll when there's an active task
	useEffect(() => {
		// Only start polling if we have both a task ID and song ID
		if (currentTaskId && pollingInterval === null) {
			console.log('Starting polling for task:', currentTaskId)
			startPolling(currentTaskId, generatedSongs[selectedSongIndex]?.id)
		}

		return () => {
			if (pollingInterval) {
				console.log('Cleaning up polling interval')
				clearInterval(pollingInterval)
				setPollingInterval(null)
			}
		}
	}, [currentTaskId, pollingInterval])

	// Fetch user credits
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
			const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
			console.log('Fetching credits from:', `${apiBaseUrl}/api/credits-api`)
			const response = await fetch(`${apiBaseUrl}/api/credits-api`, {
				method: 'GET',
				credentials: 'include', // This ensures cookies are sent with the request
				headers: {
					'Content-Type': 'application/json'
				}
			})
			
			if (!response.ok) {
				// If unauthorized, redirect to login
				if (response.status === 401) {
					const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
					window.location.href = `${apiBaseUrl}/login?redirectTo=` + encodeURIComponent(window.location.pathname)
					return
				}
				throw new Error(`Failed to fetch credits: ${response.status} ${response.statusText}`)
			}
			
			const data = await response.json()
			setUserCredits(data)
			// Notify parent component that credits have been updated
			onCreditsUpdate(data)
		} catch (error) {
			console.error('Error fetching credits:', error)
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
		
		// Base cost: 50 credits for Q_World Studio generation
		let credits = 50;
		
		// Additional cost: 4 credits for every 10 words (or fraction) over 200 words
		if (wordCount > 200) {
			const excessWords = wordCount - 200;
			const excessWordPacks = Math.ceil(excessWords / 10);
			credits += excessWordPacks * 4;
		}
		
		// Log the calculation for debugging
		console.log(`Q_World Studio credit calculation: ${wordCount} words = ${credits} credits`);
		console.log(`User has ${userCredits?.credits || 0} credits available`);
		
		return credits;
	}

	const generateAudio = async () => {
		setLoading(true)
		setError('')
		setGeneratedAudio(null)
		setGeneratedLyrics(null)
		setCoverImage(null)
		setGenerationStatus(null)
		setEstimatedCredits(null)

		try {
			// Calculate estimated credits
			const estimatedCredits = calculateEstimatedCredits()
			setEstimatedCredits(estimatedCredits)

			// Check if user has enough credits
			if (userCredits && userCredits.credits < estimatedCredits) {
				setCreditsNeeded(estimatedCredits - userCredits.credits)
				setShowCreditPurchaseModal(true)
				setLoading(false)
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

			// Make the API request
			const response = await axios.post('/api/music/generate', payload)

			// Handle the response
			if (response.status === 200 && response.data && response.data.task_id) {
				const taskId = response.data.task_id
				const songId = response.data.song_id
				
				console.log('Music generation started successfully', { taskId, songId })
				
				// Save the current task ID and song ID
				setCurrentTaskId(taskId)
				setGenerationStatus('pending')
				
				// The polling will be started by the useEffect that watches currentTaskId
				// This ensures we don't have multiple polling intervals running
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
			} else if (err.response?.data?.error && err.response.data.error.includes('insufficient credits')) {
				// This is likely an error from GoAPI about insufficient credits
				// Don't show this to the user, just log it and show a generic error
				console.error('GoAPI credit error:', err.response.data.error)
				setError('There was an issue with the music generation service. Please try again.')
			} else {
				// Handle other types of errors with more detailed information
				// Filter out any GoAPI errors that mention credits
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

	const startPolling = (taskId, songId) => {
		// Only start polling if we have valid task ID and song ID
		if (!taskId || !songId) {
			console.log('Cannot start polling: missing taskId or songId', { taskId, songId })
			return
		}

		console.log('Starting polling for task:', taskId, 'song:', songId)
		
		// Start polling for results every 3 seconds
		const interval = setInterval(() => pollForResult(taskId, songId), 3000)
		setPollingInterval(interval)
		
		// Record the start time
		setGenerationStartTime(new Date())
	}

	const pollForResult = async (taskId, songId) => {
		try {
			const response = await axios.get(`/api/music/status?taskId=${taskId}&songId=${songId}`)
			const data = response.data

			// Update generation status
			setGenerationStatus(data.status)

			// Check if we have start time information
			if (data.meta && data.meta.started_at && data.meta.started_at !== "0001-01-01T00:00:00Z" && !generationStartTime) {
				setGenerationStartTime(new Date(data.meta.started_at))
			}

			if (data.status === 'completed' && data.output && data.output.audio_url) {
				// Set the generated audio
				setGeneratedAudio(data.output.audio_url)
				
				// Set lyrics if available
				let lyrics = null
				if (data.input && data.input.lyrics) {
					lyrics = data.input.lyrics
					setGeneratedLyrics(lyrics)
				}

				// Calculate duration
				let durationSec = 0
				// Record end time and calculate duration
				if (data.meta && data.meta.ended_at && data.meta.ended_at !== "0001-01-01T00:00:00Z") {
					const endTime = new Date(data.meta.ended_at)
					setGenerationEndTime(endTime)
					
					if (generationStartTime) {
						const durationMs = endTime - generationStartTime
						durationSec = Math.round(durationMs / 1000)
						setGenerationDuration(durationSec)
					}
				}

				// Create a new song object
				const newSong = {
					id: songId || `song-${Date.now()}`,
					title: selectedPrompt.title || `Generated Song ${generatedSongs.length + 1}`,
					audioUrl: data.output.audio_url,
					lyrics: lyrics,
					duration: durationSec,
					createdAt: new Date().toISOString(),
					style: selectedPrompt.style || 'pop',
					tempo: selectedPrompt.tempo || 'medium',
					mood: selectedPrompt.mood || 'neutral',
					prompt: selectedPrompt.text,
					generator: 'diffrhym'
				}

				// Add the new song to the list
				setGeneratedSongs(prevSongs => [...prevSongs, newSong])

				// Select the new song
				setSelectedSongIndex(generatedSongs.length)
				setEditedSongTitle(newSong.title)

				// Clear the polling interval
				if (pollingInterval) {
					clearInterval(pollingInterval)
					setPollingInterval(null)
				}

				// Set loading to false
				setLoading(false)
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
		} catch (err) {
			console.error('Error polling for result:', err)
			setError('Failed to check generation status. Please try again.')
			setGenerationStatus('failed')
			setLoading(false)

			// Clear polling interval
			if (pollingInterval) {
				clearInterval(pollingInterval)
				setPollingInterval(null)
			}
		}
	}

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

	// Format time duration in a readable format
	const formatDuration = (seconds) => {
		if (!seconds) return ''
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60
		return `${minutes}m ${remainingSeconds}s`
	}

	return (
		<div className="max-w-2xl mx-auto p-4 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg shadow-xl">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-2xl font-bold text-white">Generate Music with Q_World Studio</h3>
				
				{userCredits && (
					<div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1 rounded-full">
						<Zap className="w-4 h-4 text-yellow-400" />
						<span className="text-white text-sm font-medium">{userCredits.credits} credits</span>
					</div>
				)}
			</div>

			{/* Credit information */}
			{estimatedCredits && (
				<div className="mb-4 p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg">
					<div className="flex items-center gap-2 text-purple-300">
						<CreditCard size={18} />
						<p className="text-sm">
							This generation will use approximately <span className="font-bold">{estimatedCredits}</span> credits.
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

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
				<div>
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
				</div>
				<div>
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
			{userCredits && userCredits.credits < 50 && (
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
