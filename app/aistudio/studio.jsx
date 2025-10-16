'use client'

import CreditPurchaseModal from '@/components/credits/CreditPurchaseModal'
import GlobalHeader from '@/components/planetqproductioncomp/GlobalHeader'
import DiffrhymGenerator from '@/components/player/DiffrhymGenerator'
import SunoGenerator from '@/components/player/SunoGenerator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { normalizeValue } from '@/utils/functions'
import { Mic, ShieldCheck, Speaker } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import 'react-h5-audio-player/lib/styles.css'


export default function Studio({ session }) {
	const searchParams = useSearchParams()
	const router = useRouter()
	const message = normalizeValue(decodeURIComponent(searchParams.get('message') || ''))
	const videoRef = useRef(null);

	const [selectedPrompt, setSelectedPrompt] = useState({
		text: message || '',
		tags: '',
		title: '',
		style: 'pop',
		tempo: 'medium',
		mood: 'neutral'
	})

	// State to track which generator is active
	const [activeGenerator, setActiveGenerator] = useState('diffrhym')
	const [userCredits, setUserCredits] = useState(null)
	const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false)

	// Add state to track if video is playing
	const [isPlaying, setIsPlaying] = useState(false);

	// Toggle play/pause for the video
	const togglePlayPause = () => {
		if (!videoRef.current) return;

		// If video ended, reset to start and play
		if (videoRef.current.ended) {
			videoRef.current.currentTime = 0;
		}

		// Toggle play/pause
		if (videoRef.current.paused) {
			videoRef.current.play()
				.then(() => setIsPlaying(true))
				.catch(error => console.error('Error playing video:', error));
		} else {
			videoRef.current.pause();
			// Update state after the video is actually paused
			setTimeout(() => setIsPlaying(videoRef.current && !videoRef.current.paused), 0);
		}
	};

	// Handle keyboard events for better accessibility
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
				e.preventDefault();
				togglePlayPause();
			}
		};

		const video = videoRef.current;
		if (!video) return;

		// Update play state when video state changes
		const handlePlay = () => setIsPlaying(true);
		const handlePause = () => setIsPlaying(false);
		const handleEnded = () => setIsPlaying(false);

		video.addEventListener('play', handlePlay);
		video.addEventListener('pause', handlePause);
		video.addEventListener('ended', handleEnded);
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			video.removeEventListener('play', handlePlay);
			video.removeEventListener('pause', handlePause);
			video.removeEventListener('ended', handleEnded);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, []);

	// Fetch user credits on component mount
	useEffect(() => {
		if (session?.user) {
			fetchUserCredits()
		}
	}, [session])

	// Function to fetch user credits
	const fetchUserCredits = async () => {
		try {
			const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
			const sessionResponse = await fetch(`${apiBaseUrl}/api/auth/session`)
			const sessionData = await sessionResponse.json()

			if (!sessionData?.user) {
				window.location.href = `${apiBaseUrl}/login?redirectTo=` + encodeURIComponent(window.location.pathname)
				return
			}

			const response = await fetch(`${apiBaseUrl}/api/credits-api`, {
				method: 'GET',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' }
			})

			if (!response.ok) {
				if (response.status === 401) {
					window.location.href = `${apiBaseUrl}/login?redirectTo=` + encodeURIComponent(window.location.pathname)
					return
				}
				throw new Error(`Failed to fetch credits: ${response.status} ${response.statusText}`)
			}

			const data = await response.json()
			setUserCredits(data)
		} catch (error) {
			console.error('Error fetching credits:', error)
		}
	}

	useEffect(() => {
		setSelectedPrompt(prev => ({
			...prev,
			text: message || prev.text || ''
		}))
	}, [message])

	const backgroundImageStyle = {
		backgroundImage: 'url("/images/back.png")',
		backgroundSize: 'cover',
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'center',
		minHeight: '100vh',
	}

	return (
		<div style={backgroundImageStyle}>
			<GlobalHeader session={session} />
			{session?.user?.role === 'admin' && (
				<div className="flex justify-center mb-4">
					<Link
						href="/admin"
						className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 transition-all duration-200 shadow-lg"
					>
						<ShieldCheck className="w-5 h-5" />
						Admin Dashboard
					</Link>
				</div>
			)}
			<p className="text-center text-gray-300 mb-8">Choose your preferred AI music generator</p>

			<div className="relative mb-8">
				<div
					className="absolute inset-0 rounded-full transition-all duration-300"
					style={{
						background: 'radial-gradient(circle, rgba(0,212,255,0.3) 0%, transparent 70%)',
						transform: 'scale(1.2)'
					}}
				/>

				<div
					className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-purple-500/30 mx-auto"
					style={{
						background: 'radial-gradient(circle at center, rgba(30,30,60,0.9), rgba(10,10,30,0.95))',
						boxShadow: '0 0 30px rgba(0,212,255,0.3), inset 0 0 20px rgba(0,100,150,0.2)'
					}}
				>
					<video
						ref={videoRef}
						className="absolute inset-0 w-full h-full object-cover"
						autoPlay
						playsInline
						onClick={togglePlayPause}
						onKeyDown={(e) => e.key === ' ' && e.preventDefault()}
						onEnded={() => videoRef.current?.pause()}
						tabIndex="0"
					>
						<source src="/videos/aistudio.mp4" type="video/mp4" />
						Your browser does not support the video tag.
					</video>
				</div>

				<div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
					<div className="relative">
						<button
							onClick={togglePlayPause}
							className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg transition-all duration-300"
							style={{
								background: !isPlaying
									? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
									: '#EF4444',
								boxShadow: !isPlaying
									? '0 4px 15px rgba(16, 185, 129, 0.5)'
									: '0 4px 15px rgba(239, 68, 68, 0.5)'
							}}
							aria-label={!isPlaying ? 'Play' : 'Pause'}
						>
							{isPlaying && (
								<div className="absolute inset-0 rounded-full opacity-20 bg-red-400 animate-ping"></div>
							)}
							<div className="flex items-center justify-center w-full h-full">
								{!isPlaying ? (
									<Mic className="w-6 h-6 text-white" />
								) : (
									<Speaker className="w-6 h-6 text-white" />
								)}
							</div>
						</button>
					</div>
				</div>
			</div>
			<div className="flex justify-center items-center">
				{isPlaying && (
					<div className=" w-fit mt-8 text-center border-2 border-gray-300 p-4 rounded-lg my-4">
						<p className="mt-4 text-sm text-gray-300 max-w-md mx-auto">
							Just say your idea out loud while Quayla creates your track. We'll handle the rest!
						</p>
						<button
							onClick={() => router.push('/chat')}
							className="relative inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg transform hover:scale-105"
						>
							<img
								src="/images/chat-bot/q.png"  // Replace with your image path
								alt="Let me do the work"
								className="w-6 h-6 mr-2 rounded-full"
							/>
							Let me do the work
						</button>
					</div>
				)}
			</div>

			<Tabs defaultValue="suno" className="w-full mb-8" onValueChange={setActiveGenerator}>
				<TabsList className="grid w-full grid-cols-2 mb-6">
					<TabsTrigger value="suno" className="text-lg">
						<span className="flex items-center gap-2">
							<span className="h-3 w-3 rounded-full bg-blue-500"></span>
							Planet Q AI
						</span>
					</TabsTrigger>
					<TabsTrigger value="diffrhym" className="text-lg">
						<span className="flex items-center gap-2">
							<span className="h-3 w-3 rounded-full bg-purple-500"></span>
							Q_World Studio
						</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="diffrhym" className="mt-0">
					<div className="mb-4 text-center">
						<p className="text-gray-300">Q_World Studio creates unique instrumental tracks with a focus on rhythm and melody</p>
					</div>
					<DiffrhymGenerator
						session={session}
						selectedPrompt={selectedPrompt}
						onPromptChange={setSelectedPrompt}
						onCreditsUpdate={setUserCredits}
					/>
				</TabsContent>

				<TabsContent value="suno" className="mt-0">
					<div className="mb-4 text-center">
						<p className="text-gray-300">Planet Q AI specializes in generating vocal music with lyrics and high-quality production</p>
					</div>
					<SunoGenerator
						session={session}
						selectedPrompt={selectedPrompt}
						onPromptChange={setSelectedPrompt}
						onCreditsUpdate={setUserCredits}
					/>
				</TabsContent>
			</Tabs>

			<div className="mt-8 text-center text-sm text-gray-400">
				<p>Watch your credits decrease as you generate music. More complex styles and longer prompts use more credits.</p>
				<p className="mt-2">Each generator has different strengths - try both to find the best fit for your project!</p>
			</div>

			{session && (
				<CreditPurchaseModal
					isOpen={showCreditPurchaseModal}
					onClose={() => setShowCreditPurchaseModal(false)}
					creditsNeeded={0}
					onSuccess={fetchUserCredits}
				/>
			)}

			<h1 className="animate-text text-center bg-gradient-to-r from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-2xl font-black md:text-4xl pb-10">
				AI Audio Player Presented By Planet Q Productions
			</h1>
		</div>
	)
}
