'use client'

import { signIn } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function AuthForm({ searchParams: propSearchParams }) {
	// Use both props and URL search params to ensure we catch the redirect in all cases
	const urlSearchParams = useSearchParams()
	
	// First check props (passed from server component), then URL params (for client-side navigation)
	const redirectTo = 
		(propSearchParams?.redirectTo && decodeURIComponent(propSearchParams.redirectTo)) ||
		(urlSearchParams.get('redirectTo') && decodeURIComponent(urlSearchParams.get('redirectTo')))
	
	const text = 
		(propSearchParams?.text && decodeURIComponent(propSearchParams.text)) ||
		(urlSearchParams.get('text') && decodeURIComponent(urlSearchParams.get('text')))
	
	const tags = 
		(propSearchParams?.tags && decodeURIComponent(propSearchParams.tags)) ||
		(urlSearchParams.get('tags') && decodeURIComponent(urlSearchParams.get('tags')))
	
	const title = 
		(propSearchParams?.title && decodeURIComponent(propSearchParams.title)) ||
		(urlSearchParams.get('title') && decodeURIComponent(urlSearchParams.get('title')))
	
	const error = 
		(propSearchParams?.error) ||
		(urlSearchParams.get('error'))

	const router = useRouter()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [passwordError, setPasswordError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	
	// Show error message if redirected from admin page
	useEffect(() => {
		if (error === 'adminonly') {
			toast.error('Admin access only. Please log in with an admin account.')
		}
	}, [error])

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
			console.log('Login attempt with redirectTo:', redirectTo);
				
			// Perform login
			const result = await signIn('credentials', {
				redirect: false,
				email,
				password
			})
			
			if (result?.error) {
				// Handle authentication errors without showing technical details
				if (result.error.includes('configuration')) {
					throw new Error('System error. Please try again later or contact support.')
				} else {
					throw new Error(result.error || 'Invalid email or password. Please try again.')
				}
			}

			// Get user info from the result to check role
			const userResponse = await fetch('/api/auth/session');
			const session = await userResponse.json();
				
			// Determine redirect URL based on user role
			let redirectUrl;
				
			console.log('Determining redirect URL. Role:', session?.user?.role, 'RedirectTo:', redirectTo);
				
			if (session?.user?.role === 'Admin') {
				// Admin users go to admin dashboard
				redirectUrl = '/admin';
				toast.success('Admin login successful!');
			} else if (redirectTo) {
				// Handle special case with additional parameters
				const queryParams = [
					tags ? `tags=${encodeURIComponent(tags)}` : '',
					text ? `text=${encodeURIComponent(text)}` : '',
					title ? `title=${encodeURIComponent(title)}` : ''
				].filter(Boolean).join('&')
				
				redirectUrl = queryParams ? `${redirectTo}?${queryParams}` : redirectTo;
				console.log('Redirecting to original page:', redirectUrl);
				toast.success('Logged in successfully!');
			} else {
				// Standard login with callback
				const callbackUrl = urlSearchParams.get('callbackUrl') || '/aistudio';
				redirectUrl = callbackUrl;
				toast.success('Logged in successfully!');
			}
		
			// Reduce timeout to make redirection faster
			const redirectTimer = setTimeout(() => {
				console.log('Redirecting via router.push to:', redirectUrl);
				router.push(redirectUrl);
				
				// Add a fallback direct navigation in case router.push doesn't work
				const fallbackTimer = setTimeout(() => {
					console.log('Fallback redirection via window.location to:', redirectUrl);
					window.location.href = redirectUrl;
				}, 500);
				
				return () => clearTimeout(fallbackTimer);
			}, 500); // Reduced from 1000ms to 500ms
			
			// Cleanup function
			return () => clearTimeout(redirectTimer);
		} catch (error) {
			console.error('Login error:', error)
			// Show user-friendly error message
			toast.error(error.message || 'Login failed. Please try again later.')
			setIsLoading(false)
		}
	}

	return (
		<div className="relative">
			<ToastContainer autoClose={1500} draggable closeOnClick />
			<div className="h-screen w-screen flex min-h-full flex-1  flex-col justify-center px-6 py-12 lg:px-8">
				<div className=" flex justify-center items-center flex-col sm:mx-auto sm:w-full sm:max-w-sm">
					<Link href={'/'}>
						<Image
							src="/images/small.webp"
							alt="Planet Q Logo"
							width={135}
							height={150}
							className="rounded-2xl"
						></Image>
					</Link>

					<h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-300">
						Sign in to your account
					</h2>
				</div>

				<div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
					<form className="space-y-6" onSubmit={submitHandler}>
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
									required
									className="block w-full rounded-md px-2 border-0 py-1.5 text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
									disabled={isLoading}
									value={email}
									onChange={e => setEmail(e.target.value)}
								/>
							</div>
						</div>

						<div>
							<div className="flex items-center justify-between">
								<label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-300">
									Password
								</label>
								<div className="text-sm">
									<Link href="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-500">
										Forgot password?
									</Link>
								</div>
							</div>
							<div className="mt-2">
								<input
									id="password"
									name="password"
									type="password"
									autoComplete="current-password"
									disabled={isLoading}
									required
									className={`block w-full px-2 rounded-md border-0 py-1.5 text-3ray-900 shadow-sm ring-1 ring-inset ${passwordError ? 'ring-red-500' : 'ring-gray-300'} placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
									value={password}
									onChange={handlePasswordChange}
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
								disabled={isLoading}
							>
								{isLoading ? 'Processing...' : 'Sign in'}
							</button>
							<Link
								href={{
									pathname: '/signup',
									query: {
										...(tags ? { tags: encodeURIComponent(tags) } : {}),
										...(text ? { text: encodeURIComponent(text) } : {}),
										...(title ? { title: encodeURIComponent(title) } : {}),
										...(email ? { email: encodeURIComponent(email) } : {}),
										...(password ? { password: encodeURIComponent(password) } : {}),
										...(redirectTo ? { redirectTo: encodeURIComponent(redirectTo) } : {}),
									},
								}}
								className="relative text-white text-right cursor-pointer group inline-block w-fit"
							>
								Sign Up now
								<span className="absolute left-0 bottom-[-2px] w-0 h-[2px] bg-white transition-all duration-500 group-hover:w-full"></span>
							</Link>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}
