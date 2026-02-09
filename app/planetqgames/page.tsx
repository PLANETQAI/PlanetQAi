import GamePromptBox from '@/components/GamePromptBox';

// Just the upgraded prompt box - no navigation menu, no extra header
// Drop this into your existing page where the old prompt box was
export default function PlanetQGamesPage() {
  return (
    <div className="bg-[#0a0a0f] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* THE UPGRADED PROMPT BOX ONLY */}
        <GamePromptBox />
      </div>
    </div>
  );
}
