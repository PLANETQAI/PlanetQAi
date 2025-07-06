'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { IoIosLogOut } from 'react-icons/io'
import { FaArrowAltCircleDown, FaMusic } from 'react-icons/fa'
import { CreditCard, Plus } from 'lucide-react'
import CreditPurchaseModal from '../credits/CreditPurchaseModal'

export default function GlobalHeader({ session }) {
	const router = useRouter()
	const [userCredits, setUserCredits] = useState(null)
	const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false)
	
	// Fetch user credits on component mount and refresh every 5 minutes
	useEffect(() => {
		if (session?.user) {
			fetchUserCredits()
			
			// Set up interval to refresh credits
			const intervalId = setInterval(fetchUserCredits, 5 * 60 * 1000)
			
			// Clean up interval on unmount
			return () => clearInterval(intervalId)
		}
	}, [session])
	
	// Function to fetch user credits
	const fetchUserCredits = async () => {
		try {
			const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
			console.log('GlobalHeader: Fetching credits from:', `${apiBaseUrl}/api/credits-api`)
			const response = await fetch(`${apiBaseUrl}/api/credits-api`, {
				method: 'GET',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				}
			})

			if (response.ok) {
				const data = await response.json()
				setUserCredits(data)
			} else {
				console.error('Failed to fetch credits')
			}
		} catch (error) {
			console.error('Error fetching credits:', error)
		}
	}

	async function logoutHandler(event) {
		event.preventDefault()
		if (session) {
			signOut()
			router.replace('/')
		}
	}

	return (
		<>
			<div className="text-white bg-gradient-to-r from-slate-900 to-slate-800 flex justify-between items-center px-4 py-3 shadow-md">
				{/* Logo/Home link */}
				<Link href="/" className="flex items-center gap-2">
					<Image
						src="/images/small.webp"
						alt="PlanetQAi Logo"
						width={40}
						height={40}
						className="rounded-lg"
					/>
					<span className="font-bold text-lg hidden sm:inline bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
						PlanetQAi
					</span>
				</Link>

				{/* Main Navigation */}
				{session && (
					<div className="flex items-center gap-3 md:gap-5">
						{/* Add Music Button */}
						<Link
							href="/planetqproductions"
							className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm rounded-lg px-3 py-2 font-medium transition-colors duration-200"
						>
							<FaMusic className="text-white" />
							<span className="hidden sm:inline">Add Music</span>
						</Link>

						{/* Downloads Button */}
						<Link
							href="/my-songs"
							className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg px-3 py-2 font-medium transition-colors duration-200"
						>
							<FaArrowAltCircleDown className="text-blue-400" />
							<span className="hidden sm:inline">Downloads</span>
						</Link>

						{/* Credits Display */}
						<div className="flex items-center gap-2">
							<div className="bg-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
								<CreditCard className="text-blue-400 w-4 h-4" />
								<span className="text-white font-medium text-sm">
									{userCredits ? userCredits.credits.toLocaleString() : '...'}
								</span>
							</div>
							<button 
								onClick={() => setShowCreditPurchaseModal(true)}
								className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 flex items-center transition-colors duration-200"
								title="Buy Credits"
							>
								<Plus className="w-4 h-4" />
							</button>
						</div>

						{/* Logout Button */}
						<button
							className="text-white bg-red-600 hover:bg-red-700 rounded-lg p-2 transition-colors duration-200"
							onClick={logoutHandler}
							title="Logout"
						>
							<IoIosLogOut />
						</button>
					</div>
				)}

				{/* Login/Signup buttons for non-authenticated users */}
				{!session && (
					<div className="flex gap-3">
						<Link 
							href="/login"
							className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg px-4 py-2 font-medium transition-colors duration-200"
						>
							Login
						</Link>
						<Link 
							href="/signup"
							className="bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg px-4 py-2 font-medium transition-colors duration-200"
						>
							Sign Up
						</Link>
					</div>
				)}
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
		</>
	)
}
