'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import Link from 'next/link'
import StarsCanvas from '@/components/canvas/stars'
import CircleTypeText from '@/components/circleTypeText'
import { cn } from '@/lib/utils'

const CustomRadioPlayer = () => {
	const [isPlaying, setIsPlaying] = useState(false)
	const [volume, setVolume] = useState(0.5)
	const [isMuted, setIsMuted] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const audioRef = useRef(null)

	// Stream URL for Planet Q Radio - replace with your actual stream URL
	const streamUrl = 'https://radio.planetqproductions.com/radio/8000/radio.mp3'

	useEffect(() => {
		if (audioRef.current) {
			// Set up audio element
			audioRef.current.volume = volume

			if (isPlaying) {
				audioRef.current.play().catch(error => {
					console.error('Error playing audio:', error)
					setIsPlaying(false)
				})
			} else {
				audioRef.current.pause()
			}
		}
	}, [isPlaying, volume])

	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.muted = isMuted
		}
	}, [isMuted])

	const togglePlay = e => {
		// Stop event propagation to prevent card sliding
		e.stopPropagation()
		setIsPlaying(!isPlaying)
	}

	const toggleMute = e => {
		// Stop event propagation to prevent card sliding
		e.stopPropagation()
		setIsMuted(!isMuted)
	}

	const handleVolumeChange = e => {
		// Stop event propagation to prevent card sliding
		e.stopPropagation()

		const newVolume = parseFloat(e.target.value)
		setVolume(newVolume)
		if (isMuted && newVolume > 0) {
			setIsMuted(false)
		}
	}

	const handleLoadStart = () => {
		setIsLoading(true)
	}

	const handleCanPlay = () => {
		setIsLoading(false)
	}

	const stopPropagation = e => {
		// Stop event propagation to prevent card sliding
		e.stopPropagation()
	}

	return (
		<div className="bg-gray-800 w-full rounded-b-lg p-2 sm:p-3" onClick={stopPropagation}>
			<audio ref={audioRef} src={streamUrl} preload="auto" onLoadStart={handleLoadStart} onCanPlay={handleCanPlay} />

			<div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-white">
				<div className="flex items-center gap-2">
					{/* Station logo */}
					{/* <div className="relative w-12 h-12 overflow-hidden rounded-full">
						<Image src="/images/radio1.jpeg" alt="Planet Q Radio" width={48} height={48} className="object-cover" />
					</div> */}

					{/* Station info */}
					<div className="text-sm">
						<div className="font-bold">Planet Q Radio</div>
						<div className="text-gray-300 text-xs">Live Stream</div>
					</div>
				</div>

				{/* Controls */}
				<div className="flex items-center gap-3">
					{/* Play/Pause button */}
					<button
						onClick={togglePlay}
						className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full p-3 transition-all"
						disabled={isLoading}>
						{isLoading ? (
							<svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
						) : isPlaying ? (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round">
								<rect x="6" y="4" width="4" height="16"></rect>
								<rect x="14" y="4" width="4" height="16"></rect>
							</svg>
						) : (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round">
								<polygon points="5 3 19 12 5 21 5 3"></polygon>
							</svg>
						)}
					</button>

					{/* Volume control */}
					<div className="flex items-center gap-2">
						<button onClick={toggleMute} className="text-gray-300 hover:text-white">
							{isMuted || volume === 0 ? (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round">
									<path d="M11 5L6 9H2v6h4l5 4zM23 9l-6 6M17 9l6 6" />
								</svg>
							) : volume < 0.5 ? (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round">
									<path d="M11 5L6 9H2v6h4l5 4zM15.54 8.46a5 5 0 0 1 0 7.07" />
								</svg>
							) : (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round">
									<path d="M11 5L6 9H2v6h4l5 4zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
								</svg>
							)}
						</button>
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={isMuted ? 0 : volume}
							onChange={handleVolumeChange}
							className="w-20 sm:w-28 accent-blue-500"
							onClick={stopPropagation}
						/>
					</div>
				</div>
			</div>

			{/* Now playing marquee */}
			<div className="mt-2 text-gray-300 text-sm overflow-hidden">
				<div className="whitespace-nowrap animate-marquee">
					Now Playing: Planet Q Radio - Futuristic Music Experience -Monday Thru Friday Futuristic Mornings Futuristic Hip Hop-
					Saturday Futristic Tech Rave Dance Party Music- Sunday&apos;s Futuristic Hip Hop Sunday Music -Futuristic Nights Every
					Night
				</div>
			</div>
		</div>
	)
}

const RootPage = () => {
	const [clickSteps, setClickSteps] = useState(2)
	const [direction, setDirection] = useState('forward')
	const [isTransitioning, setIsTransitioning] = useState(false)
	const [showTime, setShowTime] = useState(true)

	useEffect(() => {
		setTimeout(() => {
			setShowTime(false)
		}, 5000)
	}, [showTime])

	const handleClickSteps = e => {
		// Don't process the click if it comes from a card element
		if (isTransitioning || e.target.closest('.card-content')) return

		setIsTransitioning(true)

		setTimeout(() => {
			let newStep = clickSteps
			let newDirection = direction

			if (direction === 'forward') {
				if (clickSteps < 4) {
					newStep = clickSteps + 1
				} else {
					newDirection = 'backward'
					newStep = clickSteps - 1
				}
			} else {
				if (clickSteps > 0) {
					newStep = clickSteps - 1
				} else {
					newDirection = 'forward'
					newStep = clickSteps + 1
				}
			}

			setClickSteps(newStep)
			setDirection(newDirection)

			setTimeout(() => {
				setIsTransitioning(false)
			}, 400)
		}, 100)
	}

	// Prevent click propagation on interactive elements
	const preventPropagation = e => {
		e.stopPropagation()
	}

	// Define views - these won't be recreated on each render
	const planetQRadio = (
		<Link href={'https://planetqproductions.wixsite.com/planet-q-productions/faqs'} className="h-full p-1 block">
			<div
				className="group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all card-content"
				onClick={preventPropagation}>
				<div className="text-[#afafaf] text-xs sm:text-sm md:text-lg font-semibold p-1 sm:p-2 mb-1 sm:mb-2 text-center group-hover:animate-vibrate">
					<h1 className="text-xl">Planet Q Radio</h1>
				</div>
				<video src="/videos/V_left-compressed.mp4" autoPlay muted loop className="w-full h-auto rounded-lg"></video>
			</div>
		</Link>
	)

	const qWorldStudios = (
		<div className="w-full card-content" onClick={preventPropagation}>
			<div
				className="flex items-center justify-between px-2 sm:px-4 py-4 sm:py-6 w-full rounded-t-lg"
				style={{
					backgroundColor: 'rgb(31 41 55 / 0.9)',
				}}>
				{/* Left Radio Circle */}
				<div className="relative w-16 sm:w-20 md:w-24 aspect-square overflow-hidden">
					<div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
						<video autoPlay loop muted className="w-[150%] h-auto object-cover rounded-full">
							<source src="/images/anicircle.mp4" type="video/mp4" />
						</video>
						<Image
							src="/images/radio1.jpeg"
							alt="Radio Left"
							width={100}
							height={100}
							className="absolute p-1 sm:p-2 rounded-full"
						/>
					</div>
				</div>

				{/* Center Chat Link */}
				<Link
					href={'/chat'}
					className="rounded-full overflow-hidden aspect-square flex justify-center items-center w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 hover:shadow-[0_0_15px_rgba(0,300,300,0.8)] hover:cursor-pointer mx-2">
					<video loop autoPlay muted className="rounded-full w-full h-full object-cover">
						<source src="/videos/Planet-q-Chatbox.mp4" type="video/mp4" />
					</video>
				</Link>

				{/* Right Radio Circle */}
				<div className="relative w-16 sm:w-20 md:w-24 aspect-square overflow-hidden">
					<div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
						<video autoPlay loop muted className="w-[150%] h-auto object-cover rounded-full">
							<source src="/images/anicircle.mp4" type="video/mp4" />
						</video>
						<Image
							src="/images/radio1.jpeg"
							alt="Radio Right"
							width={100}
							height={100}
							className="absolute p-1 sm:p-2 rounded-full"
						/>
					</div>
				</div>
			</div>

			{/* Background Video */}
			<div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
				<video
					src="/images/bg-video-compressed.mp4"
					className="absolute top-0 left-0 w-full h-full object-cover"
					autoPlay
					muted
					loop></video>
			</div>

			{/* Replace the iframe with our custom player */}
			<CustomRadioPlayer />
		</div>
	)

	const radioPlayer = (
		<Link href={'https://planetia-tau.vercel.app/'} className="p-1 block">
			<div
				className="group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all col-span-1 xs:col-span-2 sm:col-span-1 mx-auto w-full sm:w-auto card-content"
				onClick={preventPropagation}>
				<div className="text-[#afafaf] text-xs sm:text-sm md:text-lg font-semibold p-1 sm:p-2 mb-1 sm:mb-2 text-center group-hover:animate-vibrate">
					<h1 className="text-xl">Q World Studios</h1>
				</div>
				<Image src="/images/V_right.jpg" alt="Q World Studios" width={300} height={200} className="w-full h-auto rounded-lg" />
			</div>
		</Link>
	)

	const roboCard = (
		<div
			className="group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all text-center card-content"
			onClick={preventPropagation}>
			<div className="text-[#afafaf] text-xs sm:text-sm md:text-lg font-semibold p-1 sm:p-2 mb-1 sm:mb-2 text-center group-hover:animate-vibrate">
				<h1 className="text-xl">PlanetQ Store</h1>
			</div>
			<Link href={'https://planetqproductions.wixsite.com/planet-q-productions/futuristichiphopbeats'}>
				<Image src={'/images/robo.jpeg'} width={300} height={200} alt="robo" className="w-full h-auto rounded-lg" />
			</Link>
		</div>
	)

	const fifthLink = (
		<Link href={'https://planetqproductions.wixsite.com/planet-q-productions/aboutplanetqproductions'} className="p-1">
			<div
				className="group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all card-content"
				onClick={preventPropagation}>
				<div className="text-[#afafaf] text-xs sm:text-sm md:text-lg font-semibold p-1 sm:p-2 mb-1 sm:mb-2 text-center group-hover:animate-vibrate">
					<h1 className="text-xl">Planet Q Productions</h1>
				</div>
				<Image
					src="/images/V_center.jpg"
					alt="Planet Q Productions"
					width={300}
					height={200}
					className="w-full h-auto rounded-lg"
				/>
			</div>
		</Link>
	)

	// Add CSS for marquee animation if needed
	useEffect(() => {
		// Add a style element if needed
		if (!document.getElementById('custom-styles')) {
			const style = document.createElement('style')
			style.id = 'custom-styles'
			style.innerHTML = `
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-250%); }
        }
        
        .animate-marquee {
          animation: marquee 10s linear infinite;
        }
      `
			document.head.appendChild(style)
		}
	}, [])

	return (
		<div className="w-full overflow-y-scroll min-h-screen h-full relative">
			<div
				className="min-h-screen flex flex-col justify-center items-center bg-[#050816] top-0 relative z-10 p-4 sm:p-8 md:p-12 lg:p-20 overflow-y-scroll"
				onClick={e => handleClickSteps(e)}>
				<CircleTypeText
					text={'Futuristic Music'}
					className={cn(
						'absolute top-6 sm:top-10 z-50 text-white text-xl animate-bounce right-24 left-1/2 -translate-x-[50%]',
						showTime ? 'opacity-100' : 'opacity-0'
					)}
				/>
				<CircleTypeText
					text={'Tap Anywhere'}
					className={cn(
						'absolute top-6 sm:top-10 z-50 text-white text-xl animate-bounce right-24 left-1/2 -translate-x-[50%]',
						showTime ? 'opacity-0' : 'opacity-100'
					)}
				/>
				<StarsCanvas />
				{/* Content container */}
				<div className="w-full max-w-md mx-auto relative px-4 pt-16 pb-16">
					<div className="w-full text-white relative">
						{/* Container for overflow hidden */}
						<div className="overflow-hidden relative h-full">
							{/* All views are loaded but only one is visible at a time */}
							<div
								className={cn(
									'absolute w-full transition-all duration-500 ease-in-out',
									clickSteps === 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
								)}>
								{planetQRadio}
							</div>

							<div
								className={cn(
									'absolute w-full transition-all duration-500 ease-in-out',
									clickSteps === 1
										? 'opacity-100 translate-x-0'
										: clickSteps < 1
										? 'opacity-0 -translate-x-full'
										: 'opacity-0 translate-x-full'
								)}>
								{radioPlayer}
							</div>

							<div
								className={cn(
									'absolute w-full transition-all duration-500 ease-in-out',
									clickSteps === 2
										? 'opacity-100 translate-x-0'
										: clickSteps < 2
										? 'opacity-0 -translate-x-full'
										: 'opacity-0 translate-x-full'
								)}>
								{qWorldStudios}
							</div>

							<div
								className={cn(
									'absolute w-full transition-all duration-500 ease-in-out',
									clickSteps === 3
										? 'opacity-100 translate-x-0'
										: clickSteps < 3
										? 'opacity-0 -translate-x-full'
										: 'opacity-0 translate-x-full'
								)}>
								{roboCard}
							</div>

							<div
								className={cn(
									'absolute w-full transition-all duration-500 ease-in-out',
									clickSteps === 4 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'
								)}>
								{fifthLink}
							</div>

							{/* Spacer div to maintain container height */}
							<div className={cn('w-full opacity-0 pointer-events-none', clickSteps === 0 ? 'block' : 'hidden')}>
								{planetQRadio}
							</div>
							<div className={cn('w-full opacity-0 pointer-events-none', clickSteps === 1 ? 'block' : 'hidden')}>{radioPlayer}</div>
							<div className={cn('w-full opacity-0 pointer-events-none', clickSteps === 2 ? 'block' : 'hidden')}>
								{qWorldStudios}
							</div>
							<div className={cn('w-full opacity-0 pointer-events-none', clickSteps === 3 ? 'block' : 'hidden')}>{roboCard}</div>
							<div className={cn('w-full opacity-0 pointer-events-none', clickSteps === 4 ? 'block' : 'hidden')}>{fifthLink}</div>
						</div>

						{/* Indicators */}
						<div className="mt-8 flex justify-center gap-2">
							{[0, 1, 2, 3, 4].map(index => (
								<div
									key={index}
									className={cn(
										'w-2 h-2 rounded-full transition-all duration-300',
										clickSteps === index ? 'bg-white scale-125' : 'bg-gray-500 hover:bg-gray-400'
									)}
								/>
							))}
							<div className={cn('ml-2 text-xs transition-all duration-300', isTransitioning ? 'opacity-0' : 'opacity-70')}>
								{direction === 'forward' ? '→' : '←'}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default RootPage
