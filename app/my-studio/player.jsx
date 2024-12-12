'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
// import classes from './musicplayer.module.css'
import classes from '../../components/planetqproductioncomp/musicplayer.module.css'

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false })

const Player = ({ userVideos }) => {
	const [currentVideoIndex, setCurrentVideoIndex] = useState(0)

	const handleVideoEnd = () => {
		setCurrentVideoIndex(prevIndex => (prevIndex + 1) % userVideos.length)
	}

	return (
		<div className="bg-transparent w-full h-auto flex justify-center items-center mb-2">
			{userVideos.length > 0 && (
				<ReactPlayer
					url={userVideos[currentVideoIndex]?.link}
					playing
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
					controls={false}
					onEnded={handleVideoEnd}
				/>
			)}
		</div>
	)
}

export default Player
