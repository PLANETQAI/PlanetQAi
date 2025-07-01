import React, { useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false })
import Image from 'next/image'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import classes from './musicplayer.module.css'

export default function MusicPlayer({ initialVideoLink }) {
	const [isVideoLink, setIsVideoLink] = useState([])
	const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
	const [isThumbnail, setIsThumbnail] = useState('')

	const playerRef = useRef(null)

	useEffect(() => {
		if (!initialVideoLink) {
			fetch('/api/link/getlink')
				.then(response => response.json())
				.then(links => {
					const shuffledLinks = shuffleArray(links)
					setIsVideoLink(shuffledLinks)
					if (links && links.length > 0) {
						const storedLinkValue = JSON.parse(localStorage.getItem('linkvalue'))

						if (storedLinkValue) {
							const foundIndex = shuffledLinks.findIndex(item => item.videoLink === storedLinkValue.videoLink)

							if (foundIndex !== -1) {
								setCurrentVideoIndex(foundIndex)
								return
							}
						}
					}
				})
				.catch(error => {
					console.error('Error fetching links:', error)
				})
		}

		fetch('/api/thumbnail/modifythumbnail')
			.then(response => response.json())
			.then(newthumbnail => {
				if (newthumbnail && newthumbnail.length > 0) {
					setIsThumbnail(newthumbnail[0].ThumbnailImage)
				}
			})
			.catch(error => {
				console.error('Error fetching thumbnail:', error)
			})

		const storedIndex = localStorage.getItem('currentVideoIndex')

		if (storedIndex !== null) {
			setCurrentVideoIndex(parseInt(storedIndex))
		} else {
			setCurrentVideoIndex(0)
		}
	}, [initialVideoLink]) // Add initialVideoLink to dependency array

	const shuffleArray = array => {
		const shuffledArray = [...array]
		for (let i = shuffledArray.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]
		}
		return shuffledArray
	}

	const handleVideoEnd = () => {
		// Only advance to next video if not using initialVideoLink
		if (!initialVideoLink) {
			const totalVideos = isVideoLink.length
			const lastPlayedSongs = []

			let randomIndex = Math.floor(Math.random() * totalVideos)

			while (randomIndex === currentVideoIndex || lastPlayedSongs.includes(randomIndex)) {
				randomIndex = Math.floor(Math.random() * totalVideos)
			}

			lastPlayedSongs.unshift(currentVideoIndex)
			if (lastPlayedSongs.length > 2) {
				lastPlayedSongs.pop()
			}

			setCurrentVideoIndex(randomIndex)
			localStorage.setItem('currentVideoIndex', randomIndex.toString())
			const currentValue = isVideoLink[randomIndex]
			localStorage.setItem('linkvalue', JSON.stringify(currentValue))
		}
	}

	return (
		<>
			<ToastContainer className="bg-transparent" autoClose={1500} draggable closeOnClick />
			<style>
				{`
        @layer utilities {
          .rotate-custom {
            animation: spin 3s linear infinite;
          }
        }
      `}
			</style>
			<section className="bg-transparent flex gap-2 flex-col justify-center items-center mt-8">
				<div className="bg-transparent w-full h-auto flex justify-center items-center mb-2">
					<ReactPlayer
						ref={playerRef}
						className="bg-transparent"
						url={initialVideoLink || (isVideoLink?.length > 0 && isVideoLink[currentVideoIndex]?.videoLink) || 'https://youtu.be/I5uiP9ogijs?si=O33QCOnUKp-Y7eHG'}
						light={isThumbnail?.length ? isThumbnail : '/images/client.png'}
						pip={true}
						loop={!initialVideoLink && !isVideoLink?.length > 0} // Loop only if not using initialVideoLink and no other videos
						playing={true}
						stopOnUnmount={false}
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
									}}></Image>
							</div>
						}
						onEnded={handleVideoEnd}
					/>
				</div>
			</section>
		</>
	)
}