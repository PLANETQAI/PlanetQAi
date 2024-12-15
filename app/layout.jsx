import '../app/globals.css'
import { cn } from '@/lib/utils'
import { auth } from '@/auth'
import { Providers } from './providers'

export const metadata = {
	title: 'PlanetQRadio',
	description: 'Your best music radio buddy online.',
	icons: {
		title: 'PlanetQRadio',
		description: 'Your best music radio buddy online.',
		icon: '/images/small.webp',
	},
}

export default async function RootLayout({ children }) {
	const session = await auth()
	console.log(session)

	return (
		<html lang="en">
			<body className={cn('antialiased')}>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
