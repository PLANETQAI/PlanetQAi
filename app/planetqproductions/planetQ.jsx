'use client'

import AdminLink from '@/components/Home/adminlink'
import { useState } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import { CiUser } from 'react-icons/ci'
import Link from 'next/link'
import { MdOutlineDeleteOutline, MdOutlineVideoLibrary } from 'react-icons/md'
import { ImSpinner7 } from 'react-icons/im'
import GlobalHeader from '@/components/planetqproductioncomp/GlobalHeader'
import Image from 'next/image'

export default function PlanetQProductions({ session, songData }) {
	const [songs, setSongs] = useState(songData ? [...songData] : [])
	const [deleteLoading, setDeleteLoading] = useState(false)
	const [updateLoading, setUpdateLoading] = useState(false)

	const deleteSong = async songId => {
		const confirmed = confirm('Are you sure you want to delete this song?')

		if (!confirmed) {
			return
		}

		setDeleteLoading(true)
		try {
			      await fetch('/api/link/deletelink', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ songId }),
			})

			setSongs(prevSongs => prevSongs.filter(song => song.id !== songId))
			toast.success('Song deleted successfully!')
			// setTimeout(() => {
			// 	location.reload()
			// }, 1500)
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
			// setTimeout(() => {
			// 	location.reload()
			// }, 1500)
		} catch (error) {
			toast.error(`Error: Something went wrong`)
		} finally {
			setUpdateLoading(false)
		}
	}

	const backgroundImageStyle = {
		backgroundImage: 'url("/images/back.png")',
		backgroundSize: 'cover',
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'center',
		backgroundAttachment: 'fixed',
		minHeight: '100vh',
	}

	return (
		<>
			<ToastContainer className="bg-transparent" autoClose={1500} draggable closeOnClick />
			<div style={backgroundImageStyle}>
				<GlobalHeader session={session} />
				<AdminLink />

				<div className="container mx-auto px-4 py-8">
					<h1 className="text-3xl font-bold mb-8 text-white">Planet Q Productions Showcase</h1>
					<div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
						{songs.map((song, indx) => (
							<div
								key={indx}
								className="bg-[#11111146] backdrop-filter backdrop-blur-lg bg-opacity-80 border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300 relative"
							>
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
											<CiUser /> {song.User?.fullName || 'Not-Available'}
										</p>
									</div>
								</div>
								{session?.user?.role === 'Admin' && (
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
			</div>
		</>
	)
}
