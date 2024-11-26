import Head from 'next/head'
/* eslint-disable @next/next/no-img-element */
import dynamic from 'next/dynamic'
import React, { useState } from 'react'
import AudioPlayer from 'react-h5-audio-player'
import Image from 'next/image'
import 'react-h5-audio-player/lib/styles.css'
import { useRouter } from 'next/router'

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false })

export default function Home({ initialVideoLink }) {
	const router = useRouter()

	const handleRedirect = url => {
		window.location.href = url
	}

	const [isPlaying, setIsPlaying] = useState(false) // Initially not playing

	const handleVideoReady = () => {
		setIsPlaying(true) // Start autoplay when the video is fully loaded
	}

	return (
		<>
			<Head>
				<title>PlanetQProductions</title>
				<meta name="description" content="planet q productions music player" />
				<link rel="icon" href="/images/small.webp" />
			</Head>

			<div className="flex flex-col min-h-screen bg-[#17101D]">
				<div
					className="flex items-center justify-center px-2 gap-12"
					style={{
						backgroundColor: 'rgb(31 41 55 / var(--tw-bg-opacity))',
					}}
				>
					<div className="relative w-[100px] h-[100px]">
						<div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
							<video autoPlay loop muted className="w-[150%] h-auto object-cover rounded-full">
								<source src="/images/anicircle.mp4" type="video/mp4" />
							</video>
						</div>
						<Image src="/images/radio1.jpeg" alt="Radio Right" width={100} height={100} className="imgradio" />
					</div>

					{/* <div className="w-[200px] h-[200px] flex justify-center items-center"> */}
					<video onClick={() => { router.push('/chat') }} className='w-32 h-32 sm:w-48 sm:h-48 hover:shadow-[0_0_15px_rgba(0,300,300,0.8)] hover:cursor-pointer aspect-square rounded-full' src="/videos/Planet-q-Chatbox.mp4">
					</video>

					<div className="relative w-[100px] h-[100px]">
						<div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
							<video autoPlay loop muted className="w-[150%] h-auto object-cover rounded-full">
								<source src="/images/anicircle.mp4" type="video/mp4" />
							</video>
						</div>
						<Image src="/images/radio1.jpeg" alt="Radio Right" width={100} height={100} className="imgradio" />
					</div>
				</div>
				<div className="md:flex-grow flex justify-center items-center">
					<div className="video-container">
						<ReactPlayer
							url={'/images/PlanetQProductions_2.mp4'}
							controls={false}
							loop={true}
							playing={isPlaying}
							onReady={handleVideoReady}
							volume={1}
							muted={true}
							className="react-player"
						/>
						<div className="logo-container1 group">
							<div className="logo-container1-left">
								<div className="logo-container1-left-text group-hover:animate-vibrate">
									<h1>Planet Q Radio</h1>
								</div>
								<button onClick={() => handleRedirect('https://planetqproductions.wixsite.com/planet-q-productions/faqs')}>
									<img src="/images/V_left.gif" alt="Logo1" className="Vlogo" />
								</button>
							</div>
						</div>
						<div className="logo-container2 group">
							<div className="logo-container1-left">
								<div className="logo-container1-left-text group-hover:animate-vibrate">
									<h1>Planet Q Productions</h1>
								</div>
								<button onClick={() => handleRedirect('https://planetqproductions.wixsite.com/planet-q-productions')}>
									<img src="/images/V_center.jpg" alt="Logo1" className="Vlogo" />
								</button>
							</div>
						</div>
						<div className="logo-container3 group">
							<div className="logo-container1-left">
								<div className="logo-container1-left-text group-hover:animate-vibrate">
									<h1>Q World Studios</h1>
								</div>
								<button onClick={() => handleRedirect('/aistudio')}>
									<img src="/images/V_right.jpg" alt="Logo1" className="Vlogo" />
								</button>
							</div>
						</div>
					</div>
				</div>

				<div className="bg-gray-800" style={{ padding: '10px' }}>
					<iframe
						src="https://radio.planetqproductions.com/public/planetq/embed?theme=dark&autoplay=true" // Added autoplay parameter
						frameBorder="0"
						allowtransparency="true"
						style={{
							width: '100%',
							minHeight: '130px',
							border: '0',
							maxHeight: '130px',
						}}
						title="Radio Planet Q"
						allow="autoplay; encrypted-media" // Ensure autoplay is allowed
					></iframe>
				</div>

				<div className="banner-container block mt-6 xl:hidden">
					<img src="/images/QWorldStudios.jpg" alt="Banner" className="w-full h-auto object-cover" />
				</div>
				<div className="banner-container block mt-6 xl:hidden">
					<img src="/images/planetQproductions.jpg" alt="Banner" className="w-full h-auto object-cover" />
				</div>
				<div className="banner-container block mt-6 xl:hidden">
					<img src="/images/PlanetQRadio.jpg" alt="Banner" className="w-full h-auto object-cover" />
				</div>
			</div>
		</>
	)
}

export async function getStaticProps() {
	const initialVideoLink = 'https://youtu.be/I5uiP9ogijs?si=O33QCOnUKp-Y7eHG'
	return {
		props: {
			initialVideoLink,
		},
	}
}
