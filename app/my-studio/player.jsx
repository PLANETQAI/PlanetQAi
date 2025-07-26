'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import classes from '../../components/planetqproductioncomp/musicplayer.module.css'
import Link from 'next/link'
import { MdMusicNote, MdOutlineDeleteOutline, MdOutlineVideoLibrary } from 'react-icons/md'
import { ImSpinner7 } from 'react-icons/im'
import { CiUser } from 'react-icons/ci'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false })

const Player = ({ userVideos }) => {
	const [currentVideoIndex, setCurrentVideoIndex] = useState(3)
	const [songs, setSongs] = useState(userVideos ? [...userVideos] : [])
	const [deleteLoading, setDeleteLoading] = useState(false)
	const [updateLoading, setUpdateLoading] = useState(false)
	const [isPlaying, setIsPlaying] = useState(true);


	useEffect(() => {
		if (userVideos && userVideos.length > 0) {
		  setSongs([...userVideos]);
		}
	  }, [userVideos]);
	
	  const handleVideoEnd = () => {
		if (songs.length === 0) return;
		setCurrentVideoIndex(prevIndex => (prevIndex + 1) % songs.length);
	  };
	console.log(userVideos)

	const deleteSong = async songId => {
		const confirmed = confirm('Are you sure you want to delete this song?')

		if (!confirmed) {
			return
		}

		setDeleteLoading(true)
		try {
			const response = await fetch('/api/link/deletelink', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ songId }),
			})

			setSongs(prevSongs => prevSongs.filter(song => song.id !== songId))
			toast.success('Song deleted successfully!')
		} catch (error) {
			console.log(error)
			toast.error(`Oops! Something went wrong`)
		} finally {
			setDeleteLoading(false)
		}
	}

	const updateSongStatus = async (songId, newStatus) => {
		setUpdateLoading(true)
		try {
			const response = await fetch('/api/link/updatestatus', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ songId, newStatus }),
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to update song status')
			}

			setSongs(prevSongs =>
				prevSongs.map(song => (song.id === songId ? { ...song, status: newStatus } : song))
			)
			toast.success('Song status updated successfully!')
		} catch (error) {
			toast.error(`Error: Something went wrong`)
		} finally {
			setUpdateLoading(false)
		}
	}

	return (
		<div className="bg-transparent w-full h-auto mb-2">
			<ToastContainer />
			<div className="w-full flex justify-center items-center">
				{songs.length > 0 ? (
					<ReactPlayer
						url={userVideos[currentVideoIndex]?.videoLink}
						playing={isPlaying}
						light={'/images/client.png'}
						style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
						playIcon={
							<div className={classes.heartbeat}>
								<Image
									src="/images/client.png"
									alt="Your Logo"
									width={45}
									height={60}
									className="bg-transparent w-auto h-auto shadow-2xl opacity-100 transition-transform duration-200 ease-in-out transform-gpu scale-125 hover:scale-100 hover:opacity-95"
									style={{
										clipPath: 'polygon(0% 0%, 100% 50%, 0% 100%)',
									}}
								/>
							</div>
						}
						controls
						onPlay={() => setIsPlaying(true)}
						onPause={() => setIsPlaying(false)}
						onEnded={handleVideoEnd}
						config={{
							youtube: {
							  playerVars: {
								autoplay: 1,
								controls: 1,
								rel: 0,
								showinfo: 0,
								modestbranding: 1,
							  },
							},
						  }}
					/>
				) : (
					<div className="text-white text-start flex flex-col justify-center items-center">
						<h1 className="text-3xl">No Video Song available, Please add some</h1>
						<Link
							href={'/planetqproductions'}
							className="text-2xl font-semibold mt-4 border rounded-md p-2 flex gap-2 items-center hover:bg-blue-500/50"
						>
							Add Music <MdMusicNote />
						</Link>
					</div>
				)}
			</div>
			<div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6 mt-20">
				{songs.map((song, indx) => (
					<div
						key={indx}
						className="bg-[#11111146] backdrop-filter backdrop-blur-lg bg-opacity-80 border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300 relative"
					>
						<div className="w-full flex justify-between">
							<div className="flex items-center">
								<Link href={song.videoLink} target="_blank">
									{song.thumbnail ? (
										<Image
											width={100}
											height={100}
											src="/images/small.webp"
											alt={`${song.title} cover`}
											className="w-20 h-20 object-cover rounded-md mr-4"
										/>
									) : (
										<MdOutlineVideoLibrary className="w-20 h-20 mr-4 text-violet-600 hover:text-violet-700" />
									)}
								</Link>
								<div>
									<Link href={song.videoLink} target="_blank">
										<h2 className="text-xl font-semibold mb-2 text-white hover:underline">{song.title}</h2>
									</Link>
									<p className="text-gray-400 flex items-center gap-1">
										<CiUser /> {song.user?.fullName || 'Not-Available'}
									</p>
								</div>
							</div>
						</div>
						{song.user?.role === 'Admin' && (
							<div className="absolute top-2 right-2 flex gap-3 items-center">
								<select
									disabled={updateLoading}
									name="status"
									id="status"
									className={`px-2 py-1 rounded ${
										song.status === 'active'
											? 'bg-green-500 text-white'
											: song.status === 'pending'
											? 'bg-yellow-500 text-white'
											: 'bg-gray-800 text-white'
									}`}
									value={song.isLive === true ? 'active' : 'pending'}
									onChange={e => updateSongStatus(song.id, e.target.value)}
								>
									<option value="active" className="bg-green-500 text-white">
										Active
									</option>
									<option value="pending" className="bg-yellow-500 text-white">
										Pending
									</option>
								</select>
								{!deleteLoading ? (
									<MdOutlineDeleteOutline
										className="text-red-500 text-2xl hover:text-red-600 cursor-pointer"
										onClick={() => deleteSong(song.id)}
									/>
								) : (
									<ImSpinner7 className="animate-spin text-gray-400 text-xl" />
								)}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	)
}

export default Player
