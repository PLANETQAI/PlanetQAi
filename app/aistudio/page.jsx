import { auth } from '@/auth'
import Studio from './studio'

export default async function AIStudioPage() {
	const session = await auth()
	return <Studio session={session} />
}
