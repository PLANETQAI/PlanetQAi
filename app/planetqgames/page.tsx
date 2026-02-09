import GamePromptBox from '@/components/GamePromptBox';

// This page shows the prompt box as it would appear on your existing website
// Your existing videos and other content remain unchanged
export default function PlanetQGamesPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Your existing page header stays the same */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Game <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Generator</span>
          </h1>
          <p className="text-gray-400 text-lg">Transform your imagination into playable games with AI</p>
        </div>

        {/* ===== THE UPGRADED PROMPT BOX ===== */}
        <GamePromptBox />
        {/* ================================== */}

        {/* 
          YOUR EXISTING VIDEOS SECTION STAYS HERE
          Don't delete your video previews - they remain below the prompt box
        */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">What You Can Create</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Video placeholder 1 - Your existing 3D Open World video */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
              <div className="aspect-video bg-gray-800 flex items-center justify-center text-gray-600">
                [Your existing 3D Open World video]
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold">3D Open World</h3>
                <p className="text-gray-500 text-sm">Explore vast landscapes</p>
              </div>
            </div>
            
            {/* Video placeholder 2 - Your existing Shooter Game video */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
              <div className="aspect-video bg-gray-800 flex items-center justify-center text-gray-600">
                [Your existing Shooter Game video]
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold">Shooter Game</h3>
                <p className="text-gray-500 text-sm">Action-packed combat</p>
              </div>
            </div>
            
            {/* Video placeholder 3 - Your existing Racing Game video */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
              <div className="aspect-video bg-gray-800 flex items-center justify-center text-gray-600">
                [Your existing Racing Game video]
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold">Racing Game</h3>
                <p className="text-gray-500 text-sm">High-speed thrills</p>
              </div>
            </div>
          </div>
        </div>

        {/* Your existing Features section */}
        <div className="grid grid-cols-3 gap-4 mt-12">
          <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">⚡</span>
            </div>
            <p className="text-white font-semibold text-sm">AI-Powered</p>
            <p className="text-gray-500 text-xs mt-1">Neural networks create unique gameplay</p>
          </div>
          <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">▶️</span>
            </div>
            <p className="text-white font-semibold text-sm">Instant Play</p>
            <p className="text-gray-500 text-xs mt-1">Generate and play in seconds</p>
          </div>
          <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">∞</span>
            </div>
            <p className="text-white font-semibold text-sm">Infinite Variety</p>
            <p className="text-gray-500 text-xs mt-1">Every game is one-of-a-kind</p>
          </div>
        </div>

        {/* Your existing Footer */}
        <p className="text-center text-gray-600 text-sm mt-12">
          © 2025 Planet Q Productions • Powered by Planet Q AI
        </p>
      </div>
    </main>
  );
}
