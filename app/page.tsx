import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#1a1a24] flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-4xl">
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-[#4ECDC4] to-[#45B7D1] bg-clip-text text-transparent mb-6">
          Planet Q Productions
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          Transform your imagination into reality with AI-powered creation tools
        </p>
        
        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
          <Link 
            href="/planetqgames"
            className="group p-8 bg-[#1a1a24] rounded-2xl border border-[#2a2a34] hover:border-[#4ECDC4] transition-all duration-300 hover:shadow-lg hover:shadow-[#4ECDC4]/20"
          >
            <div className="w-16 h-16 bg-[#4ECDC4]/20 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-[#4ECDC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">AI Game Generator</h2>
            <p className="text-gray-500">Create playable games with AI in seconds</p>
          </Link>
          
          <div className="p-8 bg-[#1a1a24] rounded-2xl border border-[#2a2a34] opacity-50">
            <div className="w-16 h-16 bg-gray-700/20 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-500 mb-2">AI Music Studio</h2>
            <p className="text-gray-600">Coming Soon</p>
          </div>
        </div>
        
        <p className="mt-12 text-gray-600 text-sm">
          © 2025 Planet Q Productions • Powered by Planet Q AI
        </p>
      </div>
    </main>
  )
}
