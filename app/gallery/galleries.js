'use client'

import GlobalHeader from '@/components/planetqproductioncomp/GlobalHeader'
import { useState } from 'react'
import AudioPlayer from '@/components/player/audioPlayer'
import { RiDeleteBin6Line } from 'react-icons/ri'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { LuLoader } from 'react-icons/lu'

export default function Gallery({ session, prevSongs }) {
	const [songs, setSongs] = useState([...prevSongs])
	const [deletingSongIds, setDeletingSongIds] = useState({})
	const [deletingGalleryIds, setDeletingGalleryIds] = useState({})
	const [currentAudio, setCurrentAudio] = useState(null)

	const handleAudioPlay = audioRef => {
		if (currentAudio && currentAudio !== audioRef) {
			currentAudio.pause() // Pause the currently playing audio
		}
		setCurrentAudio(audioRef) // Set the new playing audio
	}
console.log(songs)
	const backgroundImageStyle = {
		backgroundImage: 'url("/images/back.png")',
		backgroundSize: 'cover',
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'center',
		backgroundAttachment: 'fixed',
		minHeight: '100vh',
	}

	const deleteSong = async (songId, audioLink) => {
		try {
			// Set loading state for this specific song
			setDeletingSongIds(prev => ({ ...prev, [songId]: true }))
			
			// Use simplified API endpoint with POST method
			const response = await fetch('/api/deletesong', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ audioUrl: audioLink })
			})
			
			if (!response.ok) {
				// Try to delete from gallery even if song deletion fails
				console.log(`Failed to delete song ${songId}, attempting to delete from gallery`)
				await deleteGallery(songId, audioLink)
				
				// Now throw the error
				throw new Error(`Failed to delete song: ${response.status} ${response.statusText}`)
			}
			
			console.log(`Song ${songId} deleted successfully`)
			
			// Remove the song from the local state
			const updatedSongs = songs.filter(song => song.id !== songId)
			setSongs(updatedSongs)
			
			// If the song was currently playing, stop it
			if (currentAudio && currentAudio.src.includes(songId)) {
				currentAudio.pause()
				setCurrentAudio(null)
			}
			
			// Also remove from gallery if needed
			deleteGallery(songId, audioLink)
			
			toast.success('Song successfully deleted.', {
				position: 'top-right',
				autoClose: 1500,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			})
		} catch (error) {
			console.error('Error deleting song:', error)
			toast.error('An error occurred while deleting song.', {
				position: 'top-right',
				autoClose: 1500,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			})
		} finally {
			// Clear loading state for this specific song
			setDeletingSongIds(prev => {
				const updated = { ...prev }
				delete updated[songId]
				return updated
			})
		}
	}

	// Handle gallery deletion by audioLink
	const deleteGallery = async (songId, audioLink) => {
		try {
			// If audioLink is not provided, try to find the song by ID
			const songToDelete = songs.find(song => song.id === songId)
			if (!songToDelete && !audioLink) {
				console.log(`Cannot delete gallery: no song found with ID ${songId} and no audioLink provided`)
				return
			}
			
			// Use the audioLink from the song if not provided directly
			const audioLinkToDelete = audioLink || songToDelete?.audioLink
			if (!audioLinkToDelete) {
				console.log(`Cannot delete gallery: no audioLink found for song ${songId}`)
				return
			}
			
			// Set loading state for this specific gallery
			setDeletingGalleryIds(prev => ({ ...prev, [songId]: true }))
			
			// Delete the gallery entry from the database using the new API endpoint
			const response = await fetch('/api/gallery/delete-by-audio', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ audioUrl: audioLinkToDelete })
			})
			
			if (!response.ok) {
				console.log(`Gallery deletion failed but song deletion will handle UI update`)
			} else {
				const result = await response.json()
				console.log(`Gallery items deleted: ${result.count} for audio: ${audioLinkToDelete}`)
			}
		} catch (error) {
			console.error('Error deleting gallery entry:', error)
		} finally {
			// Clear loading state for this specific gallery
			setDeletingGalleryIds(prev => {
				const updated = { ...prev }
				delete updated[songId]
				return updated
			})
		}
	}

	return (
		<>
			<ToastContainer className="bg-transparent" autoClose={1500} draggable closeOnClick />
			<div style={backgroundImageStyle}>
				<GlobalHeader session={session} />
				<div className="container mx-auto px-4 py-8">
					<h1 className="text-3xl font-bold mb-8 text-white">Gallery</h1>
					<div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
						{songs.map((song, indx) => (
							<div key={indx} style={{ display: 'flex', alignItems: 'center' }}>
								<AudioPlayer src={song?.audioLink} onAudioPlay={handleAudioPlay} />

								{deletingSongIds[song.id] ? (
									<LuLoader
										style={{
											fontSize: '3rem',
											color: 'white',
										}}
									/>
								) : (
									<RiDeleteBin6Line
										onClick={() => deleteSong(song.id, song.audioLink)}
										style={{
											fontSize: '3rem',
											color: 'white',
											cursor: 'pointer',
										}}
									/>
								)}
							</div>
						))}
					</div>
				</div>
			</div>
		</>
	)
}
