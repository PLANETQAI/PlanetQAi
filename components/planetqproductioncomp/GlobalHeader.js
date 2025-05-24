'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import UpgradePlusModal from '../UpgradePlusModal'
import { IoIosLogOut } from 'react-icons/io'
import { FaArrowAltCircleDown } from 'react-icons/fa'
import { useUser } from '../../context/UserContext'
import { CreditCard, Plus } from 'lucide-react'
import CreditPurchaseModal from '../credits/CreditPurchaseModal'

export default function GlobalHeader({ session }) {
	const router = useRouter()
	const isHome = router.pathname === '/'
	const [loading, setLoading] = useState(false)
	// State for user credits
	const [userCredits, setUserCredits] = useState(null)
	const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false)
	
	//change-nikhil
	// const { isOpen, close, openHandler } = useUser();
	const isOpen = () => {}
	const close = () => {}
	const openHandler = () => {}
	
	// Fetch user credits on component mount
	useEffect(() => {
		if (session?.user) {
			fetchUserCredits()
		}
	}, [session])
	
	// Function to fetch user credits
	const fetchUserCredits = async () => {
		try {
			const response = await fetch('/api/credits-api', {
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

	// const close = () => {
	//   setOpen(false);
	// };

	return (
		<>
			<div className="text-white bg-transparent flex justify-between items-center gap-4 px-6 py-2 overflow-hidden">
				{isHome && (
					<Link
						href="https://planetqproductions.wixsite.com/planet-q-productions"
						className="bg-transparent flex justify-center items-center"
						target="_blank"
					>
						<div className="bg-transparent flex flex-col gap-2 justify-center items-center">
							<Image
								src="/images/small.webp"
								alt="Your Logo"
								width={50}
								height={120}
								className="rounded-2xl bg-transparent"
							></Image>
							<h1 className="animate-text bg-gradient-to-r text-center from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-sm font-black">
								View More
							</h1>
						</div>
					</Link>
				)}

				{!isHome && (
					<Link href="/" className="bg-transparent flex justify-center items-center">
						<div className="bg-transparent flex flex-col gap-2 justify-center items-center">
							<Image
								src="/images/client.png"
								alt="Your Logo"
								width={30}
								height={100}
								className="rounded-2xl bg-transparent"
							></Image>
							<h1 className="animate-text bg-gradient-to-r text-center from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-sm font-black">
								Home
							</h1>
						</div>
					</Link>
				)}
				{!session?.user && (
					<Link href="/signup" className="bg-transparent flex justify-center items-center">
						<div className="bg-transparent flex flex-col gap-2 justify-center items-center">
							<Image
								src="/images/client.png"
								alt="Your Logo"
								width={50}
								height={120}
								className="rounded-2xl bg-transparent"
							></Image>
							<h1 className="animate-text bg-gradient-to-r text-center from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-sm font-black">
								AI Studio - Sign up
							</h1>
						</div>
					</Link>
				)}
				<div className="bg-transparent flex gap-4 justify-center items-center text-center">
					{session && (
						<Link
							href="/planetqproductions"
							className="bg-transparent text-sm font-semibold hover:underline sm:text-2xl sm:font-bold"
						>
							Add Music
						</Link>
					)}
					{session && (
						<Link
							href="/gallery"
							className="flex items-center gap-2 bg-slate-800 text-white text-sm rounded-lg px-3 py-2 font-medium hover:bg-slate-700 transition-colors duration-200 sm:text-lg"
						>
							<FaArrowAltCircleDown className="text-blue-400" /> Downloads
						</Link>
					)}
					{session && (
						<div className="flex items-center gap-3">
							<div className="bg-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
								<CreditCard className="text-blue-400 w-4 h-4 sm:w-5 sm:h-5" />
								<span className="text-white font-medium text-sm sm:text-base">
									{userCredits ? userCredits.credits.toLocaleString() : '...'} Credits
								</span>
							</div>
							<button 
								onClick={() => setShowCreditPurchaseModal(true)}
								className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 flex items-center gap-1 transition-colors duration-200 text-sm sm:text-base"
							>
								<Plus className="w-3 h-3 sm:w-4 sm:h-4" />
								Buy Credits
							</button>
						</div>
					)}

					{session && session.user?.userType === 'premium' && session.user?.sessionId && (
						<form action="/api/subscriptions/create-portal-session" method="POST">
							<input type="hidden" id="session-id" name="session_id" value={session.user?.sessionId} />
							<button
								type="submit"
								className="animate-text bg-gradient-to-r from-teal-500 via-purple-500 to-orange-500 text-md font-bold ring-white ring-1 rounded-lg px-2 hover:underline hover:ring-2 sm:text-2xl"
							>
								Manage plan
							</button>
						</form>
					)}

					{session && (
						<button
							className="text-white text-sm font-bold ring-white ring-1 rounded-lg px-1 hover:underline hover:ring-2 sm:text-2xl sm:font-bold sm:px-2"
							onClick={logoutHandler}
						>
							<IoIosLogOut />
						</button>
					)}

					{!session && (
						<Link href="/login" className="bg-transparent flex justify-center items-center">
							<div className="bg-transparent flex flex-col gap-2 justify-center items-center">
								<Image
									src="/images/client.png"
									alt="Your Logo"
									width={50}
									height={120}
									className="rounded-2xl bg-transparent"
								></Image>
								<h1 className="animate-text bg-gradient-to-r text-center from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-sm font-black">
									AI Studio - Login
								</h1>
							</div>
						</Link>
					)}
				</div>
				{/* {isOpen && <UpgradePlusModal close={close} />} */}
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
