'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import Link from 'next/link'
import StarsCanvas from '@/components/canvas/stars'
import CircleTypeText from '@/components/circleTypeText'
import { cn } from '@/lib/utils'

const RootPage = () => {
	const [clickSteps, setClickSteps] = useState(1)
	const [direction, setDirection] = useState('forward')
	const [isTransitioning, setIsTransitioning] = useState(false)

	const handleClickSteps = () => {
		if (isTransitioning) return

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

	// Define views - these won't be recreated on each render
	const planetQRadio = (
		<Link href={'https://planetqproductions.wixsite.com/planet-q-productions/faqs'} className="h-full p-1 block">
			<div className="group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all">
				<div className="text-[#afafaf] text-xs sm:text-sm md:text-lg font-semibold p-1 sm:p-2 mb-1 sm:mb-2 text-center group-hover:animate-vibrate">
					<h1 className="text-xl">Planet Q Radio</h1>
				</div>
				<video src="/videos/V_left-compressed.mp4" autoPlay muted loop className="w-full h-auto rounded-lg"></video>
			</div>
		</Link>
	)

	const radioPlayer = (
		<div className="w-full">
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

			{/* Radio Player */}
			<div className="bg-gray-800 w-full rounded-b-lg p-2 sm:p-3">
				<iframe
					src="https://radio.planetqproductions.com/public/planetq/embed?theme=dark&autoplay=true"
					frameBorder="0"
					allowtransparency="true"
					style={{
						width: '100%',
						height: '130px',
						border: '0',
					}}
					title="Radio Planet Q"
					allow="autoplay; encrypted-media"></iframe>
			</div>
		</div>
	)

	const qWorldStudios = (
		<Link href={'/aistudio'} className="p-1 block">
			<div className="group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all col-span-1 xs:col-span-2 sm:col-span-1 mx-auto w-full sm:w-auto">
				<div className="text-[#afafaf] text-xs sm:text-sm md:text-lg font-semibold p-1 sm:p-2 mb-1 sm:mb-2 text-center group-hover:animate-vibrate">
					<h1 className="text-xl">Q World Studios</h1>
				</div>
				<Image src="/images/V_right.jpg" alt="Q World Studios" width={300} height={200} className="w-full h-auto rounded-lg" />
			</div>
		</Link>
	)

	const roboCard = (
		<div className="group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all text-center">
			<Image src={'/images/robo.jpeg'} width={300} height={200} alt="robo" className="w-full h-auto rounded-lg" />
		</div>
	)

	const fifthLink = (
		<Link href={'/my-studio'} className="p-1">
			<div className="group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all">
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

	return (
		<div className="w-full overflow-y-scroll min-h-screen h-full relative">
			<div
				className="min-h-screen flex flex-col justify-center items-center bg-[#050816] top-0 relative z-10 p-4 sm:p-8 md:p-12 lg:p-20 overflow-y-scroll"
				onClick={e => handleClickSteps(e)}>
				<CircleTypeText
					text={'Tap Anywhere'}
					className={'absolute top-6 sm:top-10 z-50 text-white text-xl animate-bounce right-24 left-1/2 -translate-x-[50%]'}
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
