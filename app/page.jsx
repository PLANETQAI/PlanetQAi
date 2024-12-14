import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
	title: 'PlanetQRadio',
	description: 'Welcome to PlanetQRadio Studio',
}

const RootPage = () => {
	return (
		<div className="flex flex-col min-h-screen bg-[#17101D]">
			<div
				className="flex items-center justify-center px-2 gap-6 sm:gap-12"
				style={{
					backgroundColor: 'rgb(31 41 55 / var(--tw-bg-opacity))',
				}}
			>
				<div className="relative w-[100px] h-[100px] overflow-hidden">
					<div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
						<video autoPlay loop muted className="w-[150%] h-auto object-cover rounded-full">
							<source src="/images/anicircle.mp4" type="video/mp4" />
						</video>
						<Image
							src="/images/radio1.jpeg"
							alt="Radio Right"
							width={100}
							height={100}
							className="absolute p-1 sm:p-4 rounded-full"
						/>
					</div>
				</div>

				<Link href={'/chat'}>
					<video
						className="w-32 h-32 sm:w-48 sm:h-48 hover:shadow-[0_0_15px_rgba(0,300,300,0.8)] hover:cursor-pointer aspect-square rounded-full"
						loop
						autoPlay
						muted
					>
						<source src="/videos/Planet-q-Chatbox.mp4" type="video/mp4" />
					</video>
				</Link>

				<div className="relative w-[100px] h-[100px]">
					<div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
						<video autoPlay loop muted className="w-[150%] h-auto object-cover rounded-full">
							<source src="/images/anicircle.mp4" type="video/mp4" />
						</video>
						<Image
							src="/images/radio1.jpeg"
							alt="Radio Right"
							width={100}
							height={100}
							className="absolute p-1 sm:p-4 rounded-full"
						/>
					</div>
				</div>
			</div>
			<div className="md:flex-grow flex justify-center items-center">
				<div className="video-container relative pb-[57%]">
					<video
						src="/images/PlanetQProductions_2.mp4"
						className="absolute top-0"
						autoPlay
						muted
						loop
					></video>

					<div className="logo-container1 group">
						<div className="logo-container1-left">
							<div className="logo-container1-left-text group-hover:animate-vibrate">
								<h1>Planet Q Radio</h1>
							</div>
							<Link href={'https://planetqproductions.wixsite.com/planet-q-productions/faqs'}>
								<Image
									width={200}
									height={100}
									src="/images/V_left.gif"
									unoptimized
									alt="Logo1"
									className="Vlogo"
								/>
							</Link>
						</div>
					</div>
					<div className="logo-container2 group">
						<div className="logo-container1-left">
							<div className="logo-container1-left-text group-hover:animate-vibrate">
								<h1>Planet Q Productions</h1>
							</div>
							<Link href={'/my-studio'}>
								<Image width={100} height={100} src="/images/V_center.jpg" alt="Logo1" className="Vlogo" />
							</Link>
						</div>
					</div>
					<div className="logo-container3 group">
						<div className="logo-container1-left">
							<div className="logo-container1-left-text group-hover:animate-vibrate">
								<h1>Q World Studios</h1>
							</div>
							<Link href={'/aistudio'}>
								<Image width={100} height={100} src="/images/V_right.jpg" alt="Logo1" className="Vlogo" />
							</Link>
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
				<Image
					width={100}
					height={100}
					src="/images/robo.jpeg"
					alt="Banner"
					unoptimized
					className="w-full h-auto object-cover"
				/>
			</div>
		</div>
	)
}

export default RootPage
