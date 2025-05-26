import { auth } from '@/auth'
import Studio from './studio'
import { redirect } from 'next/navigation'

export const metadata = {
	title: 'PlanetQRadio',
	description: 'Welcome to PlanetQRadio Studio',
}

export default async function AIStudioPage() {
	const session = await auth()

	// Redirect to login page if user is not authenticated
	if (!session) {
		return redirect('/login?callbackUrl=/aistudio')
	}

	return <Studio session={session} />
}
