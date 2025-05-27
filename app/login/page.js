import AuthForm from '@/components/auth/authForm'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export const metadata = {
	title: 'Login',
	description: 'planet q productions music player home.',
}

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Login({ searchParams }) {
	const session = await auth()
	
	// Only redirect if user is already authenticated
	if (session) {
		// Check for redirectTo in the URL query parameters
		const redirectTo = searchParams?.redirectTo 
			? decodeURIComponent(searchParams.redirectTo) 
			: '/aistudio'
		
		// Use redirect with a 302 status to ensure it's not cached
		return redirect(redirectTo)
	}

	// Pass the searchParams to AuthForm to handle redirects on the client side
	return <AuthForm searchParams={searchParams} />
}
