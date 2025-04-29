'use client'

import { useState } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function ForgetPassword() {
	const [loading, setLoading] = useState(false)
	const [oldPassword, setOldPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const router = useRouter()

	const submit = async event => {
		event.preventDefault()
		setLoading(true)

		const response = await fetch('/api/user/change-password', {
			method: 'PATCH',
			body: JSON.stringify({
				oldPassword,
				newPassword,
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		})

		const data = await response.json()

		if (!response.ok) {
			toast.error(data.message, {
				position: 'top-right',
				autoClose: 1500,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			})
		} else {
			toast.success(data.message, {
				position: 'top-right',
				autoClose: 1500,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			})

			router.push('/')
		}
		event.target.reset()
		setLoading(false)
	}
	return (
		<>
			<ToastContainer autoClose={1500} draggable closeOnClick />
			<div className="h-screen w-screen flex justify-center items-center flex-col gap-4 bg-[#333A44]">
				<Image src="/images/small.webp" alt="Your Logo" width={135} height={150} className="rounded-2xl"></Image>
				<div className="w-[300px] h-[330px] border-2 border-solid mx-2  p-4 rounded-2xl shadow-2xl border-white hover:border-double sm:w-[400px] sm:p-5">
					<h1 className="text-2xl font-bold text-white flex items-center justify-center">Reset Password?</h1>

					<form onSubmit={submit}>
						<div className="mt-5 ">
							<label className="block text-sm text-gray-300">Enter Old Password</label>
							<input
								type="password"
								className="w-full h-10 px-2 py-1 border rounded-md outline-red-400 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
								onChange={e => {
									setOldPassword(e.target.value)
								}}
								value={oldPassword}
								required></input>
						</div>
						<div className="mt-5">
							<label className="block text-gray-300 text-sm">Enter New Password</label>
							<input
								type="password"
								className="w-full h-10 px-2 py-1 border rounded-md outline-red-400 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
								onChange={e => {
									setNewPassword(e.target.value)
								}}
								value={newPassword}
								required
							/>
						</div>
						<div className="mt-5">
							<button className="w-full bg-indigo-600 p-2 rounded-lg text-white hover:bg-indigo-500" disabled={loading}>
								{loading ? 'Processing..' : 'Submit'}
							</button>
						</div>
						<div className="mt-4 text-right text-sm">
							<Link href="/" className="text-white hover:underline">
								Back to Login
							</Link>
						</div>
					</form>
				</div>
			</div>
		</>
	)
}
