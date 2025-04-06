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

const Domain = 'https://planetqproductions.vercel.app/'

export default async function RootLayout({ children }) {
	const session = await auth()
	console.log(session)

	return (
		<html lang="en">
			<body className={cn('antialiased')}>
				<link rel="canonical" href={Domain} />
				<Providers>{children}</Providers>
				<Analytics />
			</body>
		</html>
	)
}
