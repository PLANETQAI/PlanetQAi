'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import UpgradePlusModal from '../UpgradePlusModal'
import { IoIosLogOut } from 'react-icons/io'
import { FaArrowAltCircleDown } from 'react-icons/fa'
import { useUser } from '../../context/UserContext'

export default function GlobalHeader({ session }) {
	const router = useRouter()
	const isHome = router.pathname === '/'
	console.log(isHome)
	const [loading, setLoading] = useState(false)
	//change-nikhil
	// const { isOpen, close, openHandler } = useUser();
	const isOpen = () => {}
	const close = () => {}
	const openHandler = () => {}
	console.log(session)

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
					<Link href="https://planetqproductions.wixsite.com/planet-q-productions" className="bg-transparent flex justify-center items-center" target="_blank">
						<div className="bg-transparent flex flex-col gap-2 justify-center items-center">
							<Image src="/images/small.webp" alt="Your Logo" width={50} height={120} className="rounded-2xl bg-transparent"></Image>
							<h1 className="animate-text bg-gradient-to-r text-center from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-sm font-black">View More</h1>
						</div>
					</Link>
				)}

				{!isHome && (
					<Link href="/" className="bg-transparent flex justify-center items-center">
						<div className="bg-transparent flex flex-col gap-2 justify-center items-center">
							<Image src="/images/client.png" alt="Your Logo" width={30} height={100} className="rounded-2xl bg-transparent"></Image>
							<h1 className="animate-text bg-gradient-to-r text-center from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-sm font-black">Home</h1>
						</div>
					</Link>
				)}
				{!session?.user && (
					<Link href="/signup" className="bg-transparent flex justify-center items-center">
						<div className="bg-transparent flex flex-col gap-2 justify-center items-center">
							<Image src="/images/client.png" alt="Your Logo" width={50} height={120} className="rounded-2xl bg-transparent"></Image>
							<h1 className="animate-text bg-gradient-to-r text-center from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-sm font-black">AI Studio - Sign up</h1>
						</div>
					</Link>
				)}
				<div className="bg-transparent flex gap-4 justify-center items-center text-center">
					{session && (
						<Link href="/planetqproductions" className="bg-transparent text-sm font-semibold hover:underline sm:text-2xl sm:font-bold">
							Add Music
						</Link>
					)}
					{session && (
						<Link href="/gallery" className="flex items-center gap-2 bg-transparent text-sm ring-white ring-1 rounded-lg px-1 font-bold hover:underline sm:text-2xl sm:font-bold sm:px-2">
							<FaArrowAltCircleDown /> Downloads
						</Link>
					)}
					{session && session.user?.userType !== 'premium' && (
						<button
							disabled={loading}
							onClick={() => openHandler()}
							className="animate-text bg-gradient-to-r from-teal-500 via-purple-500 to-orange-500 text-sm font-normal ring-white ring-1 rounded-lg px-1 hover:underline hover:ring-2 sm:text-2xl sm:font-bold sm:px-2"
						>
							Buy Packages
						</button>
					)}

					{session && session.user?.userType === 'premium' && session.user?.sessionId && (
						<form action="/api/subscriptions/create-portal-session" method="POST">
							<input type="hidden" id="session-id" name="session_id" value={session.user?.sessionId} />
							<button type="submit" className="animate-text bg-gradient-to-r from-teal-500 via-purple-500 to-orange-500 text-md font-bold ring-white ring-1 rounded-lg px-2 hover:underline hover:ring-2 sm:text-2xl">
								Manage plan
							</button>
						</form>
					)}

					{session && (
						<button className="text-white text-sm font-bold ring-white ring-1 rounded-lg px-1 hover:underline hover:ring-2 sm:text-2xl sm:font-bold sm:px-2" onClick={logoutHandler}>
							<IoIosLogOut />
						</button>
					)}

					{!session && (
						<Link href="/login" className="bg-transparent flex justify-center items-center">
							<div className="bg-transparent flex flex-col gap-2 justify-center items-center">
								<Image src="/images/client.png" alt="Your Logo" width={50} height={120} className="rounded-2xl bg-transparent"></Image>
								<h1 className="animate-text bg-gradient-to-r text-center from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-sm font-black">AI Studio - Login</h1>
							</div>
						</Link>
					)}
				</div>
				{/* {isOpen && <UpgradePlusModal close={close} />} */}
			</div>
		</>
	)
}
