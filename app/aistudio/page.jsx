import { auth } from '@/auth'
import Studio from './studio'

export const metadata = {
	title: 'PlanetQRadio',
	description: 'Welcome to PlanetQRadio Studio',
}

export default async function AIStudioPage() {
	const session = await auth()

	await new Promise(resolve => setTimeout(resolve, 1000))

	return <Studio session={session} />
}
