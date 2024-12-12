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
	const [loadingDelete, setIsLoadingDelete] = useState(false)
	const [currentAudio, setCurrentAudio] = useState(null)

	const handleAudioPlay = audioRef => {
		if (currentAudio && currentAudio !== audioRef) {
			currentAudio.pause() // Pause the currently playing audio
		}
		setCurrentAudio(audioRef) // Set the new playing audio
	}

	const backgroundImageStyle = {
		backgroundImage: 'url("/images/back.png")',
		backgroundSize: 'cover',
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'center',
		backgroundAttachment: 'fixed',
		minHeight: '100vh',
	}

	const handleDelete = async id => {
		try {
			setIsLoadingDelete(true)
			const response = await fetch(`/api/gallery/delete/${id}`, {
				method: 'DELETE',
			})

			if (response.ok) {
				const data = await response.json()

				// Update the local state to remove the deleted song
				setSongs(prevSongs => prevSongs.filter(song => song.id !== id))

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
			} else {
				throw new Error('Failed to delete the song')
			}
		} catch (error) {
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
			setIsLoadingDelete(false)
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

								{loadingDelete ? (
									<LuLoader
										style={{
											fontSize: '3rem',
											color: 'white',
										}}
									/>
								) : (
									<RiDeleteBin6Line
										onClick={() => handleDelete(song.id)}
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
