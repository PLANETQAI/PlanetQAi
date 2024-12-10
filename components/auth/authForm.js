'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ToastContainer, toast } from 'react-toastify'
import Link from 'next/link'
import Image from 'next/image'
import 'react-toastify/dist/ReactToastify.css'
import { useSearchParams } from 'next/navigation'

export default function AuthForm() {
	const searchParams = useSearchParams()
	const redirectTo = searchParams.get('redirectTo')
	const text = searchParams.get('text')
	const tags = searchParams.get('tags')
	const title = searchParams.get('title')
	console.log(redirectTo + `?tags=${tags}&text=${text}&title=${title}`)

	const router = useRouter()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const submitHandler = async event => {
		event.preventDefault()
		setIsLoading(true)

		try {
			await signIn('credentials', {
				redirectTo: redirectTo ? redirectTo + `?tags=${tags}&text=${text}&title=${title}` : '/',
				email,
				password,
			})
			toast.success('Logged in Successfully')
			router.push('/')
		} catch (error) {
			console.log(error)
			toast.error('Oops! Something went wrong')
		}

		setIsLoading(false)
	}

	return (
		<div className="relative">
			<ToastContainer autoClose={1500} draggable closeOnClick />
			<div className="h-screen w-screen flex min-h-full flex-1  flex-col justify-center px-6 py-12 lg:px-8 bg-[#333A44]">
				<div className=" flex justify-center items-center flex-col sm:mx-auto sm:w-full sm:max-w-sm">
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
									<Link href="/forgetpassword" legacyBehavior>
										<a className="font-semibold text-indigo-600 hover:text-indigo-500">Forgot password?</a>
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
									className="block w-full px-2 rounded-md border-0 py-1.5 text-3ray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
									value={password}
									onChange={e => setPassword(e.target.value)}
								/>
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
								href={`/signup?text=${text}&tags=${tags}&title=${title}&redirectTo=${redirectTo}`}
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
