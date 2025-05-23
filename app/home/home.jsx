'use client'
import React, { useState, useEffect } from 'react'
import DiffrhymGenerator from '@/components/player/DiffrhymGenerator'
import SunoGenerator from '@/components/player/SunoGenerator'
import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCard, Zap, Plus } from 'lucide-react'
import CreditPurchaseModal from '@/components/credits/CreditPurchaseModal'

const Home = ({ session }) => {
	const searchParams = useSearchParams()
	const router = useRouter()
	const message = searchParams.get('message')

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
			// First check if the user is authenticated by getting the session
			const sessionResponse = await fetch('/api/auth/session')
			const sessionData = await sessionResponse.json()
			
			// If not authenticated, redirect to login page
			if (!sessionData || !sessionData.user) {
				console.log('User not authenticated, redirecting to login')
				window.location.href = '/login?redirectTo=' + encodeURIComponent(window.location.pathname)
				return
			}
			
			// Now fetch credits with the authenticated session
			const response = await fetch('/api/credits-api', {
				method: 'GET',
				credentials: 'include', // This ensures cookies are sent with the request
				headers: {
					'Content-Type': 'application/json'
				}
			})
			
			if (!response.ok) {
				// If unauthorized, redirect to login
				if (response.status === 401) {
					window.location.href = '/login?redirectTo=' + encodeURIComponent(window.location.pathname)
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

	return (
		<div className="container mx-auto py-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold text-white">Create Music with AI</h1>
				
				{session && (
					<div className="flex items-center gap-4">
						<div className="bg-slate-800 rounded-lg px-4 py-2 flex items-center gap-2">
							<CreditCard className="text-blue-400 w-5 h-5" />
							<span className="text-white font-medium">
								{userCredits ? userCredits.credits.toLocaleString() : '...'} Credits
							</span>
						</div>
						<button 
							onClick={() => setShowCreditPurchaseModal(true)}
							className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 flex items-center gap-1 transition-colors duration-200"
						>
							<Plus className="w-4 h-4" />
							Buy Credits
						</button>
					</div>
				)}
			</div>
			<p className="text-center text-gray-300 mb-8">Choose your preferred AI music generator</p>
			
			<Tabs defaultValue="diffrhym" className="w-full mb-8" onValueChange={setActiveGenerator}>
				<TabsList className="grid w-full grid-cols-2 mb-6">
					<TabsTrigger value="diffrhym" className="text-lg">
						<span className="flex items-center gap-2">
							<span className="h-3 w-3 rounded-full bg-purple-500"></span>
							Q_World Studio
						</span>
					</TabsTrigger>
					<TabsTrigger value="suno" className="text-lg">
						<span className="flex items-center gap-2">
							<span className="h-3 w-3 rounded-full bg-blue-500"></span>
							Planet Q AI
						</span>
					</TabsTrigger>
				</TabsList>
				
				<TabsContent value="diffrhym" className="mt-0">
					<div className="mb-4 text-center">
						<p className="text-gray-300">Diffrhym creates unique instrumental tracks with a focus on rhythm and melody</p>
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
						<p className="text-gray-300">Suno specializes in generating vocal music with lyrics and high-quality production</p>
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
						// Refresh user credits after successful purchase
						fetchUserCredits()
					}}
				/>
			)}
		</div>
	)
}

export default Home
