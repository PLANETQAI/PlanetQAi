import '../app/globals.css'
import { cn } from '@/lib/utils'
import { auth } from '@/auth'
import { Providers } from './providers'
import { Analytics } from '@vercel/analytics/react'
import Link from 'next/link'

export const metadata = {
	title: 'PlanetQRadio',
	description: 'Your best music radio buddy online.',
	icons: {
		title: 'PlanetQRadio',
		description: 'Your best music radio buddy online.',
		icon: '/images/small.webp',
	},
}

// Use a dynamic domain based on environment
const Domain = process.env.NODE_ENV === 'development' ? 'http://localhost:3000/' : 'https://www.planetqradio.com/'

export default async function RootLayout({ children }) {
	const session = await auth()
	console.log(session)

	return (
		<html lang="en" suppressHydrationWarning>
			<body className={cn('antialiased')} suppressHydrationWarning>
				<link rel="canonical" href={Domain} />
				<Providers>{children}</Providers>
				<Analytics />
			</body>
		</html>
	)
}
