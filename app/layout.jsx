import { auth } from '@/auth'
import { cn } from '@/lib/utils'
import { Analytics } from '@vercel/analytics/react'
import dynamic from 'next/dynamic'
import '../app/globals.css'
import { Providers } from './providers'

const StarsWrapper = dynamic(
  () => import('@/components/canvas/StarsWrapper'),
  { ssr: false }
)

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
      <body className={cn('antialiased min-h-screen bg-[#050816]')} suppressHydrationWarning>
        <div className="fixed inset-0 -z-10">
          <StarsWrapper />
          <div className="absolute inset-0 bg-gray-900/70" />
        </div>
        <div className="relative z-10">
          <link rel="canonical" href={Domain} />
          <Providers>
            {children}
          </Providers>
          <Analytics />
        </div>
      </body>
    </html>
  )
}
