'use client'
import { useState } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import { signIn } from 'next-auth/react'

export default function SignupForm() {
	const searchParams = useSearchParams()
	const redirectTo =
		searchParams.get('redirectTo') && decodeURIComponent(searchParams.get('redirectTo'))
	const text = searchParams.get('text') && decodeURIComponent(searchParams.get('text'))
	const tags = searchParams.get('tags') && decodeURIComponent(searchParams.get('tags'))
	const title = searchParams.get('title') && decodeURIComponent(searchParams.get('title'))

	const [fullName, setFullName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [passwordError, setPasswordError] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const validatePassword = (password) => {
		if (password.length < 8) {
			setPasswordError('Password must be at least 8 characters')
			return false
		}
		
		// You can add more validation rules here if needed
		// For example, requiring special characters, numbers, etc.
		
		setPasswordError('')
		return true
	}
	
	// Validate password on change
	const handlePasswordChange = (e) => {
		const newPassword = e.target.value
		setPassword(newPassword)
		
		// Only show validation errors after user has typed something
		if (newPassword.length > 0) {
			validatePassword(newPassword)
		} else {
			setPasswordError('')
		}
	}
	
	const submitHandler = async event => {
		event.preventDefault()
		
		// Validate password before submission
		if (!validatePassword(password)) {
			return // Stop form submission if password is invalid
		}
		
		setIsLoading(true)

		try {
			const response = await axios.post('/api/auth/signup', { fullName, email, password })
			const data = await response.data

			if (!response.ok) {
				throw new Error(data.message || 'Something went wrong!')
			}

			toast.success('User created!', {
				position: 'top-right',
				autoClose: 1500,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			})

			setTimeout(async () => {
				await signIn('credentials', {
					redirectTo: redirectTo
						? decodeURIComponent(redirectTo) +
						  '?' +
						  [
								tags ? `tags=${encodeURIComponent(tags)}` : '',
								text ? `text=${encodeURIComponent(text)}` : '',
								title ? `title=${encodeURIComponent(title)}` : '',
						  ]
								.filter(Boolean)
								.join('&')
						: '/',
					email,
					password,
				})
			}, 2000)
		} catch (error) {
			console.log(error)
			toast.error(error.message, {
				position: 'top-right',
				autoClose: 1500,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			})
		}

		setIsLoading(false)
	}

	return (
		<>
			<ToastContainer autoClose={1500} draggable closeOnClick />
			<div className="h-screen w-screen flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-[#333A44]">
				<div className="flex justify-center items-center flex-col sm:mx-auto sm:w-full sm:max-w-sm">
					<Link href={'/'}>
						<Image
							src="/images/small.webp"
							alt="Your Logo"
							width={135}
							height={150}
							className="rounded-2xl"
						></Image>
					</Link>
					<h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-300">
						Create your account
					</h2>
				</div>

				<div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
					<form className="space-y-6" onSubmit={submitHandler}>
						<div>
							<label htmlFor="fullName" className="block text-sm font-medium leading-6 text-gray-300">
								Full Name
							</label>
							<div className="mt-2">
								<input
									id="fullName"
									name="fullName"
									type="text"
									autoComplete="fullName"
									value={fullName}
									onChange={e => setFullName(e.target.value)}
									required
									className="block w-full rounded-md px-2 border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
								/>
							</div>
						</div>
						<div>
							<label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-300">
								Email address
							</label>
							<div className="mt-2">
								<input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									value={email}
									onChange={e => setEmail(e.target.value)}
									required
									className="block w-full rounded-md px-2 border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
								/>
							</div>
						</div>
						<div>
							<div className="flex items-center justify-between">
								<label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-300">
									Password
								</label>
							</div>
							<div className="mt-2">
								<input
									id="password"
									name="password"
									type="password"
									autoComplete="current-password"
									value={password}
									onChange={handlePasswordChange}
									required
									className={`block w-full rounded-md px-2 border-0 py-1.5 shadow-sm ring-1 ring-inset ${passwordError ? 'ring-red-500' : 'ring-gray-300'} placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
								/>
								{passwordError && (
									<p className="mt-1 text-sm text-red-500">{passwordError}</p>
								)}
							</div>
						</div>
						<div className="flex flex-col items-end gap-2">
							<button
								type="submit"
								className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
							>
								{isLoading ? 'Processing' : 'Sign Up'}
							</button>
							<Link
								href={{
									pathname: '/login',
									query: {
										...(tags ? { tags: encodeURIComponent(tags) } : {}),
										...(text ? { text: encodeURIComponent(text) } : {}),
										...(title ? { title: encodeURIComponent(title) } : {}),
										...(email ? { email: encodeURIComponent(email) } : {}),
										...(password ? { password: encodeURIComponent(password) } : {}),
										...(fullName ? { fullName: encodeURIComponent(fullName) } : {}),
										...(redirectTo ? { redirectTo: encodeURIComponent(redirectTo) } : {}),
									},
								}}
								className="relative text-white text-right cursor-pointer group inline-block w-fit"
							>
								Login now
								<span className="absolute left-0 bottom-[-2px] w-0 h-[2px] bg-white transition-all duration-500 group-hover:w-full"></span>
							</Link>
						</div>
					</form>
				</div>
			</div>
		</>
	)
}
