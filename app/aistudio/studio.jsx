'use client'

import { useState, useEffect } from 'react'
import GlobalHeader from '@/components/planetqproductioncomp/GlobalHeader'
import MusicPlayer from '@/components/planetqproductioncomp/musicplayer'
import MusicGenerator from '@/components/player/SunoConsumer'
import { FaArrowDown } from 'react-icons/fa6'
import DiffrhymGenerator from '@/components/player/DiffrhymGenerator'
import SunoGenerator from '@/components/player/SunoGenerator'
import React from 'react'
import 'react-h5-audio-player/lib/styles.css'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { normalizeValue } from '@/utils/functions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCard, Zap, Plus, ShieldCheck } from 'lucide-react'
import CreditPurchaseModal from '@/components/credits/CreditPurchaseModal'


export default function Studio({ session }) {
	const initialVideoLink = 'https://youtu.be/I5uiP9ogijs?si=O33QCOnUKp-Y7eHG'

	const searchParams = useSearchParams()
	const text = normalizeValue(decodeURIComponent(searchParams.get('text')))
	const tags = normalizeValue(decodeURIComponent(searchParams.get('tags')))
	const title = normalizeValue(decodeURIComponent(searchParams.get('title')))
	const message = normalizeValue(decodeURIComponent(searchParams.get('message')))

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

	// State for user credits
	const [userCredits, setUserCredits] = useState(null)
	const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false)

	// Fetch user credits on component mount
	useEffect(() => {
		if (session?.user) {
			fetchUserCredits()
		}
	}, [session])

	// Function to fetch user credits
	const fetchUserCredits = async () => {
		try {
			// Get base URL for API calls
			const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || ''

			// First check if the user is authenticated by getting the session
			console.log('Fetching session from:', `${apiBaseUrl}/api/auth/session`)
			const sessionResponse = await fetch(`${apiBaseUrl}/api/auth/session`)
			const sessionData = await sessionResponse.json()

			// If not authenticated, redirect to login page
			if (!sessionData || !sessionData.user) {
				console.log('User not authenticated, redirecting to login')
				window.location.href = `${apiBaseUrl}/login?redirectTo=` + encodeURIComponent(window.location.pathname)
				return
			}

			// Now fetch credits with the authenticated session
			console.log('Fetching credits from:', `${apiBaseUrl}/api/credits-api`)
			const response = await fetch(`${apiBaseUrl}/api/credits-api`, {
				method: 'GET',
				credentials: 'include', // This ensures cookies are sent with the request
				headers: {
					'Content-Type': 'application/json'
				}
			})

			if (!response.ok) {
				// If unauthorized, redirect to login
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
			text: message || prev.text || '',
			tags: prev.tags || '',
			title: prev.title || '',
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
		<>
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

				<div className="w-64 aspect-square overflow-hidden rounded-full mx-auto my-8 shadow-lg border-4 border-purple-600">
					<video
						autoPlay
						loop
						muted
						playsInline
						className="w-full h-full object-cover"
					>
						<source src="/videos/generator.mp4" type="video/mp4" />
						Your browser does not support the video tag.
					</video>
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

				{/* Credit Purchase Modal */}
				{session && (
					<CreditPurchaseModal
						isOpen={showCreditPurchaseModal}
						onClose={() => setShowCreditPurchaseModal(false)}
						creditsNeeded={0}
						onSuccess={() => {
							fetchUserCredits()
						}}
					/>
				)}
				{/* <MusicPlayer initialVideoLink={initialVideoLink} /> */}

				<h1 className="animate-text text-center bg-gradient-to-r from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-2xl font-black md:text-4xl pb-10">
					AI Audio Player Presented By Planet Q Productions
				</h1>
			</div>
		</>
	)
}
