import { auth } from '@/auth'
import Studio from './studio'

export const metadata = {
	title: 'PlanetQRadio',
	description: 'Welcome to PlanetQRadio Studio',
}

export default async function AIStudioPage() {
	const session = await auth()

	return <Studio session={session} />
}
