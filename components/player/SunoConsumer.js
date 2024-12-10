'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import AudioPlayer from './audioPlayer'
import { TbInfoHexagonFilled } from 'react-icons/tb'
import { usePathname } from 'next/navigation'

const MusicGenerator = ({
	session,
	selectedPrompt = {
		text: '',
		tags: '',
		title: '',
	},
	onPromptChange = prompt => {
		selectedPrompt = prompt
	},
}) => {
	const pathname = usePathname()

	const [generatedAudio, setGeneratedAudio] = useState(null)
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const [pollingInterval, setPollingInterval] = useState(null)

	const [isVisible, setIsVisible] = useState(false)

	const toggleVisibility = () => {
		setIsVisible(!isVisible)
	}

	const saveGeneratedAudio = async (userId, audioLink) => {
		try {
			const response = await fetch('/api/gallery/create', {
				method: 'POST',
				body: JSON.stringify({
					user: userId,
					audioLink,
				}),
				headers: {
					'Content-Type': 'application/json',
				},
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.message || 'Gallery: Something went wrong!')
			}
		} catch (error) {
			console.log(error)
		}
	}

	useEffect(() => {
		return () => {
			if (pollingInterval) clearInterval(pollingInterval)
		}
	}, [pollingInterval])

	const handleInputChange = (field, value) => {
		onPromptChange({
			...selectedPrompt,
			[field]: value,
		})
	}

	const generateAudio = async () => {
		setLoading(true)
		setError('')
		setGeneratedAudio(null)

		const url = 'https://api.goapi.ai/api/suno/v1/music'
		const headers = {
			'X-API-Key': '2b85924fa2e14640f5bde332f6ac43df64aa535810a3a9923772b21d8a413015',
			'Content-Type': 'application/json',
		}

		const payload = {
			custom_mode: true,
			input: {
				prompt: selectedPrompt.text,
				title: selectedPrompt.title,
				tags: selectedPrompt.tags,
				continue_at: 0,
				continue_clip_id: '',
			},
		}

		try {
			console.log('Sending payload:', payload)
			const response = await axios.post(url, payload, { headers })
			console.log('Initial API Response:', response.data)

			if (response.data && response.data.data && response.data.data.task_id) {
				startPolling(response.data.data.task_id)
			} else {
				throw new Error('No task ID in response')
			}
		} catch (error) {
			handleError(error)
			setLoading(false)
		}
	}

	const startPolling = id => {
		const interval = setInterval(() => pollForResult(id), 5000) // Poll every 5 seconds
		setPollingInterval(interval)
	}

	const pollForResult = async id => {
		const url = `https://api.goapi.ai/api/suno/v1/music/${id}`
		const headers = {
			'X-API-Key': '2b85924fa2e14640f5bde332f6ac43df64aa535810a3a9923772b21d8a413015',
			'Content-Type': 'application/json',
		}

		try {
			const response = await axios.get(url, { headers })
			console.log('Polling Response:', response.data)

			if (response.data.data.status === 'completed') {
				clearInterval(pollingInterval)
				setPollingInterval(null)
				setLoading(false)

				// Assuming the first clip in the response is the one we want
				const firstClipId = Object.keys(response.data.data.clips)[0]
				const audioUrl = response.data.data.clips[firstClipId].audio_url

				setGeneratedAudio(audioUrl)
				await saveGeneratedAudio(session?.user?.id, audioUrl)
			}
		} catch (error) {
			handleError(error)
			clearInterval(pollingInterval)
			setPollingInterval(null)
			setLoading(false)
		}
	}

	const handleError = error => {
		console.log('Full error object:', error)
		if (error.response) {
			console.log('Error data:', error.response.data)
			console.log('Error status:', error.response.status)
			console.log('Error headers:', error.response.headers)
			setError(`Server error: ${error.response.status}. ${JSON.stringify(error.response.data)}`)
		} else if (error.request) {
			console.log('Error request:', error.request)
			setError('No response received from server')
		} else {
			console.log('Error message:', error.message)
			setError(`Error: ${error.message}`)
		}
	}

	return (
		<div className="max-w-2xl mx-auto p-4 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg shadow-xl">
			<h3 className="text-2xl font-bold mb-4 text-white">Generate Custom Music</h3>

			<div className="mb-4">
				<label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">
					Music Description or Lyrics
				</label>
				<textarea
					id="prompt"
					placeholder="Describe your desired music or enter lyrics. Use [Verse], [Chorus], [Bridge] for structure."
					value={selectedPrompt.text}
					onChange={e => handleInputChange('text', e.target.value)}
					className="bg-gradient-to-t from-slate-700 to-slate-600 p-3 border border-slate-500 text-white w-full rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
					rows="6"
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
				<div>
					<label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-1">
						Tags (Genre, Style, Mood)
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
				<div className="flex gap-4 items-center">
					<TbInfoHexagonFilled
						onClick={toggleVisibility}
						style={{ fontSize: '2.5rem', color: 'white', cursor: 'pointer' }}
					/>
					{isVisible && (
						<div style={{ color: 'white', fontSize: '15px', textAlign: 'center' }}>
							Please wait 3-5 minutes. It will be in your Downloads tab.
						</div>
					)}
				</div>
			</div>

			<div className="flex justify-center items-center">
				{session && (
					<button
						onClick={generateAudio}
						disabled={loading}
						className="bg-purple-600 text-white p-3 rounded-md hover:bg-purple-700 transition-colors duration-300 w-full font-semibold"
					>
						{loading ? 'Generating...' : 'Generate Audio'}
					</button>
				)}

				{!session && (
					<Link
						href={`/signup?text=${selectedPrompt.text}&tags=${selectedPrompt.tags}&title=${selectedPrompt.title}&redirectTo=${pathname}`}
						className="bg-purple-600 text-white justify-center items-center text-center p-3 rounded-md hover:bg-purple-700 transition-colors duration-300 w-full font-semibold"
					>
						Please Create an account
					</Link>
				)}
			</div>

			{error && <p className="text-red-500 mt-4">{error}</p>}

			{generatedAudio && (
				<div className="mt-6">
					<h4 className="text-white mb-2 font-semibold">Generated Audio:</h4>
					{/* <audio ref={audioRef} controls src={generatedAudio} className="w-full" /> */}
					<AudioPlayer src={generatedAudio} />
				</div>
			)}
		</div>
	)
}

export default MusicGenerator
