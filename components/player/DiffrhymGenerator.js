'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import AudioPlayer from './audioPlayer'
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

	// Fetch user credits on component mount
	useEffect(() => {
		if (session?.user) {
			fetchUserCredits()
		}
	}, [session])

	// Cleanup polling interval on unmount
	useEffect(() => {
		return () => {
			if (pollingInterval) clearInterval(pollingInterval)
		}
	}, [pollingInterval])

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
	const calculateEstimatedCredits = () => {
		// Base cost for any generation - fixed at 10 credits
		// This ensures users always know exactly how many credits will be used
		const credits = 10;

		// Return the fixed credit amount
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
			if (response.data && response.data.taskId) {
				// Store the task ID for tracking
				setCurrentTaskId(response.data.taskId)
				setGenerationStatus('pending')
				console.log('Generation started with task ID:', response.data.taskId)
				
				// Start polling for the result
				startPolling(response.data.taskId, response.data.songId || null)
			} else {
				throw new Error('Failed to generate music. Please try again.')
			}
		} catch (err) {
			console.error('Error generating audio:', err)
			setError(err.message || 'Failed to generate music. Please try again.')
			setLoading(false)
			setGenerationStatus(null)
		}
	}

	const startPolling = (taskId, songId) => {
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
				// Update user credits after successful generation
				fetchUserCredits()

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
					coverImageUrl: null, // Diffrhym doesn't provide cover images
					duration: durationSec,
					createdAt: new Date().toISOString(),
					generator: 'diffrhym',
					prompt: selectedPrompt.text,
					style: selectedPrompt.style,
					tempo: selectedPrompt.tempo,
					mood: selectedPrompt.mood
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
				<h3 className="text-2xl font-bold text-white">Generate Music with Diffrhym</h3>
				
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
						<h4 className="text-white font-semibold mb-3">Your Generated Music:</h4>
						
						{/* Song list in a horizontal scrollable row */}
						<div className="overflow-x-auto pb-2">
							<div className="flex gap-3 min-w-max">
								{generatedSongs.map((song, index) => (
									<div 
										key={song.id} 
										className={`flex-shrink-0 w-48 p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedSongIndex === index ? 'bg-purple-800 ring-2 ring-purple-500' : 'bg-slate-800 hover:bg-slate-700'}`}
										onClick={() => selectSong(index)}
									>
										<div className="flex flex-col h-full">
											{/* Song thumbnail/placeholder */}
											<div className="bg-slate-700 h-28 rounded-md flex items-center justify-center mb-2">
												<Music className="w-10 h-10 text-purple-400 opacity-70" />
											</div>
											
											{/* Song title */}
											<div className="text-white font-medium text-sm truncate mb-1">
												{song.title}
											</div>
											
											{/* Song metadata */}
											<div className="text-gray-400 text-xs flex items-center gap-1">
												<Clock className="w-3 h-3" />
												<span>{song.duration ? formatDuration(song.duration) : '~1m'}</span>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
					
					{/* Currently selected song with player */}
					{generatedSongs[selectedSongIndex] && (
						<div className="bg-slate-800 p-4 rounded-lg">
							{/* Song title with edit functionality */}
							<div className="mb-3">
								{editingSongTitle ? (
									<div className="flex gap-2">
										<input
											type="text"
											value={editedSongTitle}
											onChange={(e) => setEditedSongTitle(e.target.value)}
											className="bg-slate-700 text-white px-2 py-1 rounded flex-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
											autoFocus
										/>
										<button 
											onClick={saveEditedTitle}
											className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm"
										>
											Save
										</button>
									</div>
								) : (
									<div className="flex items-center justify-between">
										<h3 className="text-white font-semibold text-lg">
											{generatedSongs[selectedSongIndex].title}
										</h3>
										<button 
											onClick={startEditingTitle}
											className="text-purple-400 hover:text-purple-300 text-sm"
										>
											Edit Title
										</button>
									</div>
								)}
							</div>
							
							{/* Audio player */}
							<AudioPlayer src={generatedSongs[selectedSongIndex].audioUrl} />
							
							{/* Song details */}
							<div className="mt-3 grid grid-cols-2 gap-2 text-sm">
								<div className="text-gray-400">
									<span className="text-gray-500">Style:</span> {generatedSongs[selectedSongIndex].style}
								</div>
								<div className="text-gray-400">
									<span className="text-gray-500">Tempo:</span> {generatedSongs[selectedSongIndex].tempo}
								</div>
								<div className="text-gray-400">
									<span className="text-gray-500">Mood:</span> {generatedSongs[selectedSongIndex].mood}
								</div>
								<div className="text-gray-400">
									<span className="text-gray-500">Created:</span> {new Date(generatedSongs[selectedSongIndex].createdAt).toLocaleDateString()}
								</div>
							</div>
							
							{/* Lyrics if available */}
							{generatedSongs[selectedSongIndex].lyrics && (
								<div className="mt-4">
									<h4 className="text-white mb-2 font-semibold">Lyrics:</h4>
									<div className="bg-slate-700/50 p-3 rounded-md text-gray-300 whitespace-pre-line overflow-y-auto max-h-60">
										{generatedSongs[selectedSongIndex].lyrics}
									</div>
								</div>
							)}
						</div>
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
