'use client'

import { useUser } from '@/context/UserContext'
import { ChevronDown, CreditCard, Plus, User } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { FaMusic } from 'react-icons/fa'
import { IoIosLogOut } from 'react-icons/io'
import CreditPurchaseModal from '../credits/CreditPurchaseModal'

export default function GlobalHeader({ session }) {
	const router = useRouter()
	const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const user = session?.user || {};

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

	const {
		credits: userCredits,
		fetchUserCredits,
	} = useUser()

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
						{session?.user?.role === 'Admin' && (
							<Link
								href="/planetqproductions"
								className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm rounded-lg px-3 py-2 font-medium transition-colors duration-200"
							>
								<FaMusic className="text-white" />
								<span className="hidden sm:inline">Add Music</span>
							</Link>
						)}

						{/* Downloads Button */}
						<Link
							href="/my-songs"
							className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg px-3 py-2 font-medium transition-colors duration-200"
						>
							<Image
								src="/videos/aistudio.png"
								alt="Downloads"
								width={25}
								height={25}
								className="text-blue-400"
							/>
							<span className="hidden sm:inline">Downloads</span>
						</Link>

						{/* Credits Display */}
						<div className="flex items-center gap-2">
							<div className="bg-slate-800 rounded-lg px-3 py-2 flex flex-col gap-1">
								{/* Normal Credits */}
								<div className="flex items-center gap-2">
									<CreditCard className="text-blue-400 w-4 h-4" />
									<span className="text-white font-medium text-xs sm:text-sm">
										{userCredits?.credits?.normal !== undefined ? userCredits.credits.normal.toLocaleString() : '...'}
									</span>
								</div>
								{/* Radio Credits */}
								<div className="flex items-center gap-2">
									<svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
									</svg>
									<span className="text-white font-medium text-xs sm:text-sm">
										{userCredits?.credits?.radio !== undefined ? userCredits.credits.radio.toLocaleString() : '...'}
									</span>
								</div>
							</div>
							<button
								onClick={() => setShowCreditPurchaseModal(true)}
								className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 flex items-center transition-colors duration-200"
								title="Buy Credits"
							>
								<Plus className="w-4 h-4" />
							</button>
						</div>

						{/* User Profile Dropdown */}
						<div className="relative" ref={dropdownRef}>
							<button
								onClick={() => setIsProfileOpen(!isProfileOpen)}
								className="flex items-center space-x-2 focus:outline-none"
							>
								{user.image ? (
									<Image
										src={user.image}
										alt={user.name || 'User'}
										width={32}
										height={32}
										className="w-8 h-8 rounded-full object-cover border-2 border-purple-500"
									/>
								) : (
									<div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium">
										{user.name ? user.name.charAt(0).toUpperCase() : 'U'}
									</div>
								)}
								<ChevronDown className="w-4 h-4 text-gray-300" />
							</button>

							{isProfileOpen && (
								<div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50">
									<Link
										href="/profile"
										className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
										onClick={() => setIsProfileOpen(false)}
									>
										<User className="w-4 h-4" />
										<span>Profile</span>
									</Link>
									<button
										onClick={logoutHandler}
										className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center space-x-2"
									>
										<IoIosLogOut className="w-4 h-4" />
										<span>Logout</span>
									</button>
								</div>
							)}
						</div>
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
