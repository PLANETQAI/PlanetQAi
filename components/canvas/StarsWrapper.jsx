// 'use client'

// import React from 'react'
// import dynamic from 'next/dynamic'

// // Import the stars component with SSR disabled and add error handling
// // Using dynamic import with no SSR to completely avoid hydration issues
// const ClientStars = dynamic(() => import('./ClientStars').catch(() => () => null), {
//   ssr: false,
//   loading: () => <div className="w-full h-auto absolute inset-0 z-[-1]" />
// })

// export default function StarsWrapper() {
//   // No useState or useEffect needed - we're completely deferring to client-side
//   // This prevents any hydration mismatch since nothing is rendered on the server
//   return (
//     <div className="w-full h-auto absolute inset-0 z-[-1]">
//       <ClientStars />
//     </div>
//   )
// }

'use client'
import dynamic from 'next/dynamic'

const StarsCanvas = dynamic(
  () => import('./RandomStars'), 
  { 
    ssr: false,
    loading: () => <div className="w-full h-auto absolute inset-0 z-[-1]" />
  }
)

export default StarsCanvas