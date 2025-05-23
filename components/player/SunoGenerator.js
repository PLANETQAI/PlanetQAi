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
		// Base cost for any generation - fixed at 15 credits for Suno
		// This ensures users always know exactly how many credits will be used
		const credits = 15;

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
				lyricsType: lyricsType
			}

			// Make the API request
			const response = await axios.post('/api/music/generate-suno', payload)

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
		const interval = setInterval(() => pollForResult(taskId, songId), 3000) // Poll every 3 seconds
		setPollingInterval(interval)
	}

	const pollForResult = async (taskId, songId) => {
		try {
			const response = await axios.get(`/api/music/status-suno?taskId=${taskId}`)
			const data = response.data

			// Update generation status
			setGenerationStatus(data.status)

			// Check if we have start time information
			if (data.meta && data.meta.started_at && data.meta.started_at !== "0001-01-01T00:00:00Z" && !generationStartTime) {
				setGenerationStartTime(new Date(data.meta.started_at))
			}

			if (data.status === 'completed' && data.output && data.output.songs && data.output.songs.length > 0) {
				// Update user credits after successful generation
				fetchUserCredits()

				// Store all generated songs
				setGeneratedSongs(data.output.songs)

				// Set the first song as selected by default
				const firstSong = data.output.songs[0]
				setGeneratedAudio(firstSong.song_path)
				setGeneratedLyrics(firstSong.lyrics)
				setCoverImage(firstSong.image_path)

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
	
	// Handle song selection
	const selectSong = (index) => {
		if (generatedSongs && generatedSongs.length > index) {
			setSelectedSongIndex(index)
			const song = generatedSongs[index]
			setGeneratedAudio(song.song_path)
			setGeneratedLyrics(song.lyrics)
			setCoverImage(song.image_path)
		}
	}

	return (
		<div className="max-w-2xl mx-auto p-4 bg-gradient-to-b from-blue-800 to-blue-900 rounded-lg shadow-xl">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-2xl font-bold text-white">Generate Music with Suno</h3>
				
				{userCredits && (
					<div className="flex items-center gap-2 bg-blue-700/50 px-3 py-1 rounded-full">
						<Zap className="w-4 h-4 text-yellow-400" />
						<span className="text-white text-sm font-medium">{userCredits.credits} credits</span>
					</div>
				)}
			</div>

			{/* Credit information */}
			{estimatedCredits && (
				<div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
					<div className="flex items-center gap-2 text-blue-300">
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
					className="bg-gradient-to-t from-blue-700 to-blue-600 p-3 border border-blue-500 text-white w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
						className="bg-gradient-to-t from-blue-700 to-blue-600 p-3 border border-blue-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
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
						className="bg-gradient-to-t from-blue-700 to-blue-600 p-3 border border-blue-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
				<div>
					<label htmlFor="style" className="block text-sm font-medium text-gray-300 mb-1">
						Music Style
					</label>
					<Select
						value={selectedPrompt.style}
						onValueChange={(value) => handleInputChange('style', value)}
					>
						<SelectTrigger className="bg-gradient-to-t from-blue-700 to-blue-600 border border-blue-500 text-white">
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
						<SelectTrigger className="bg-gradient-to-t from-blue-700 to-blue-600 border border-blue-500 text-white">
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
						<SelectTrigger className="bg-gradient-to-t from-blue-700 to-blue-600 border border-blue-500 text-white">
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

			{/* Lyrics Type Selector */}
			<div className="mb-6">
				<label htmlFor="lyricsType" className="block text-sm font-medium text-gray-300 mb-1">
					Lyrics Type
				</label>
				<Select
					value={lyricsType}
					onValueChange={setLyricsType}
				>
					<SelectTrigger className="bg-gradient-to-t from-blue-700 to-blue-600 border border-blue-500 text-white">
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
			</div>

			<div className="flex justify-center items-center mb-4">
				{session ? (
					<button
						onClick={generateAudio}
						disabled={loading || !selectedPrompt.text}
						className="bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors duration-300 w-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
						{loading ? (
							<div className="flex items-center justify-center gap-2">
								<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
								<span>{getProgressMessage() || 'Generating...'}</span>
							</div>
						) : (
							<div className="flex items-center justify-center gap-2">
								<Music className="w-5 h-5" />
								<span>Generate Music with Suno</span>
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

			{generatedAudio && (
				<div className="mt-6 space-y-4">
					{/* Song selection tabs if multiple songs are available */}
					{generatedSongs && generatedSongs.length > 1 && (
						<div className="mb-4">
							<h4 className="text-white font-semibold mb-2">Choose a version:</h4>
							<div className="flex gap-2 overflow-x-auto pb-2">
								{generatedSongs.map((song, index) => (
									<button
										key={song.id}
										className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap flex items-center gap-2 ${index === selectedSongIndex ? 'bg-blue-600 text-white' : 'bg-blue-900/50 text-blue-200 hover:bg-blue-800/50'}`}
										onClick={() => selectSong(index)}
									>
										<span className="h-2 w-2 rounded-full bg-blue-400"></span>
										{song.title || `Version ${index + 1}`}
									</button>
								))}
							</div>
						</div>
					)}
					
					{/* Song details and player */}
					<div className="flex items-center justify-between">
						<h4 className="text-white font-semibold">
							{generatedSongs && generatedSongs[selectedSongIndex]?.title ? 
								generatedSongs[selectedSongIndex].title : 'Generated Music'}
						</h4>
						{coverImage && (
							<div className="flex items-center gap-2">
								<img src={coverImage} alt="Cover art" className="w-12 h-12 rounded" />
							</div>
						)}
					</div>
					
					<AudioPlayer src={generatedAudio} />
					
					{generationDuration && (
						<div className="flex items-center justify-end gap-2 text-sm text-gray-400">
							<Clock className="w-4 h-4" />
							<span>Generation time: {formatDuration(generationDuration)}</span>
						</div>
					)}
					
					{/* Song tags if available */}
					{generatedSongs && generatedSongs[selectedSongIndex]?.tags && generatedSongs[selectedSongIndex].tags.length > 0 && (
						<div className="flex flex-wrap gap-1 mt-2">
							{generatedSongs[selectedSongIndex].tags.map((tag, index) => (
								<span key={index} className="text-xs bg-blue-900/50 text-blue-200 px-2 py-1 rounded-full">
									{tag}
								</span>
							))}
						</div>
					)}
					
					{/* Larger cover image */}
					{coverImage && (
						<div className="mt-4">
							<img src={coverImage} alt="Cover art" className="w-full max-w-sm mx-auto rounded-md shadow-lg" />
						</div>
					)}
					
					{/* Lyrics with better formatting */}
					{generatedLyrics && (
						<div className="mt-4">
							<h4 className="text-white mb-2 font-semibold">Lyrics:</h4>
							<div className="bg-blue-700/50 p-4 rounded-md text-gray-300 whitespace-pre-line overflow-y-auto max-h-80">
								{generatedLyrics}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Information about credit usage */}
			<div className="mt-6 pt-4 border-t border-blue-700/50">
				<div className="flex items-start gap-2">
					<TbInfoHexagonFilled className="text-gray-400 flex-shrink-0 mt-1" size={20} />
					<p className="text-gray-400 text-sm">
						Music generation uses credits from your account. Suno provides high-quality music with vocals and lyrics. 
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
