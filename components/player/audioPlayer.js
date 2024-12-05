'use client'

import React, { useRef, useState, useEffect } from 'react'
import { TbPlayerPlay, TbPlayerPause } from 'react-icons/tb'
import { GiSpeaker } from 'react-icons/gi'
import { MdOutlineFileDownload } from 'react-icons/md'
import { saveAs } from 'file-saver'
import { useSession } from 'next-auth/react'
import { toast } from 'react-toastify'
import axios from 'axios'
// import { useUser } from '../../context/UserContext' // Uncomment when this is resolved

const AudioPlayer = ({ src, onAudioPlay }) => {
	const { data: session, update } = useSession()
	const audioRef = useRef(null)
	const progressRef = useRef(null)
	const [isPlaying, setIsPlaying] = useState(false)
	const [progress, setProgress] = useState(0)
	const [volume, setVolume] = useState(50)
	const [currentTime, setCurrentTime] = useState('00:00')
	const [duration, setDuration] = useState('00:00')
	const [isLoading, setIsLoading] = useState(false)

	// Nikhil
	// const { openHandler } = useUser() // Uncomment when error is resolved

	useEffect(() => {
		const audio = audioRef.current
		if (audio) {
			audio.volume = volume / 100

			const handleLoadedMetadata = () => {
				setDuration(formatTime(audio.duration))
			}

			const handleTimeUpdate = () => {
				setProgress((audio.currentTime / audio.duration) * 100)
				setCurrentTime(formatTime(audio.currentTime))
			}

			if (audio.readyState >= 1) {
				setDuration(formatTime(audio.duration))
			}

			audio.addEventListener('loadedmetadata', handleLoadedMetadata)
			audio.addEventListener('timeupdate', handleTimeUpdate)

			return () => {
				audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
				audio.removeEventListener('timeupdate', handleTimeUpdate)
			}
		}
	}, [volume])

	useEffect(() => {
		const audio = audioRef.current
		if (audio) {
			const handlePlay = () => setIsPlaying(true)
			const handlePause = () => setIsPlaying(false)

			audio.addEventListener('play', handlePlay)
			audio.addEventListener('pause', handlePause)

			return () => {
				// Safeguard to check if audioRef.current is not null before removing event listeners
				if (audioRef.current) {
					audioRef.current.removeEventListener('play', handlePlay)
					audioRef.current.removeEventListener('pause', handlePause)
				}
			}
		}
	}, [])

	const formatTime = time => {
		const minutes = Math.floor(time / 60)
		const seconds = Math.floor(time % 60)
		return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
	}

	const togglePlayPause = async () => {
		const audio = audioRef.current
		if (audio && !isLoading) {
			setIsLoading(true)
			try {
				if (isPlaying) {
					audio.pause()
				} else {
					await audio.play()
					onAudioPlay(audio) // Notify parent about the new playing audio
				}
			} catch (error) {
				console.log('Playback error:', error.message)
			} finally {
				setIsLoading(false)
			}
		}
	}

	useEffect(() => {
		const handlePause = () => setIsPlaying(false)

		if (audioRef.current) {
			audioRef.current.addEventListener('pause', handlePause)
			return () => {
				// Safeguard to check if audioRef.current is not null before removing event listeners
				if (audioRef.current) {
					audioRef.current.removeEventListener('pause', handlePause)
				}
			}
		}
	}, [])

	const handleVolumeChange = e => {
		setVolume(e.target.value)
	}

	const handleProgressClick = e => {
		const audio = audioRef.current
		const progressBar = progressRef.current
		const rect = progressBar.getBoundingClientRect()
		const offsetX = e.clientX - rect.left
		const newProgress = (offsetX / rect.width) * 100
		const newTime = (newProgress / 100) * audio.duration
		audio.currentTime = newTime
		setProgress(newProgress)
	}

	// Nikhil --here updateMaxdownload commented because, it's api is giving user not found error, which is wrongly sent fromt the backend, also i'm thinking to remove this and add another keyword.

	// async function updateMaxDownload(userId, newMaxDownload) {
	// 	try {
	// 		console.log(userId)
	// 		const response = await axios.post('http://localhost:3000/api/user/update', { userId, max_download: newMaxDownload })

	// 		const data = await response.json()
	// 		if (!response.ok) {
	// 			throw new Error(data.message || 'Failed to update max_download')
	// 		}

	// 		await update({ max_download: newMaxDownload })
	// 	} catch (error) {
	// 		console.log('Error updating max_download:', error.message)
	// 	}
	// }

	const handleDownload = async audioSrc => {
		try {
			const response = await fetch(audioSrc, { mode: 'cors' })
			if (!response.ok) throw new Error('Failed to fetch the file.')

			const blob = await response.blob()
			saveAs(blob, audioSrc.split('/').pop())

			// await axios.post('/api/user/update', { userId: session.user.id, max_download: session.user.max_download })

			toast.success('Download successful!', {
				position: 'top-right',
				autoClose: 1500,
				hideProgressBar: true,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			})
		} catch (error) {
			console.log('Error during download:', error.message)
			toast.error('An error occurred while downloading the file.', {
				position: 'top-right',
				autoClose: 1500,
				hideProgressBar: true,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			})
		}

		try {
			const response = await fetch(src, { mode: 'cors' })
			const blob = await response.blob()
			saveAs(blob, src.split('/').pop())
			// await updateMaxDownload(session?.user?.id, session?.user?.max_download - 1)
		} catch (error) {
			console.log('Download failed', error)
		}
	}

	return (
		<div className="w-full max-w-2xl mx-auto p-4 bg-slate-700 rounded-lg shadow-md text-white flex items-center mt-2">
			<button
				onClick={togglePlayPause}
				className="bg-white text-slate-800 p-2 rounded-full hover:bg-gray-200 transition-colors duration-300 mr-4"
				disabled={isLoading || !src}
			>
				{isPlaying ? <TbPlayerPause /> : <TbPlayerPlay />}
			</button>

			<div className="text-sm font-mono text-gray-400 mr-4">
				{currentTime} / {duration}
			</div>

			<div
				className="flex-grow h-1.5 bg-gray-500 rounded-full overflow-hidden mr-4 relative cursor-pointer"
				onClick={src ? handleProgressClick : undefined}
				ref={progressRef}
			>
				<div
					className="absolute top-0 left-0 h-full bg-purple-600 transition-all duration-100"
					style={{ width: `${progress}%` }}
				></div>
			</div>

			<MdOutlineFileDownload className="text-2xl mr-2 cursor-pointer" onClick={() => handleDownload(src)} />

			<GiSpeaker className="text-2xl" />
			<input
				type="range"
				min="0"
				max="100"
				value={volume}
				onChange={handleVolumeChange}
				className="w-20 bg-gray-100 h-0.5 rounded-full appearance-none range-slider"
				style={{ backgroundSize: `${volume}% 100%` }}
			/>

			<audio ref={audioRef} src={src} />
		</div>
	)
}

export default AudioPlayer
