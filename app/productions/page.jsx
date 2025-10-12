"use client";

import { useRouter } from "next/navigation";
import PlayerBot from "./_components/PlayerBot";
import RadioSubscriptionFlow from './_components/RadioSubscriptionFlow';

// List of Spotify playlist or track embed URLs
const spotifyEmbeds = [
  {
    title: "Artist 1",
    url: "https://open.spotify.com/embed/artist/2QAFHW7dvr7EbnlPY7PDbq?utm_source=generator"
  },
  {
    title: "Artist 2",
    url: "https://open.spotify.com/embed/artist/5AWlrst9quIeaE4VWSvOVA?utm_source=generator"
  }
];

// Background pattern component
const BackgroundPattern = () => (
  <div className="fixed inset-0 overflow-hidden -z-10">
    <div className="absolute inset-0 bg-[#0a0a1a] opacity-90">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>
    </div>
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5"></div>
  </div>
);

const RadioContent = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden font-sans">
      <BackgroundPattern />
      {/* Glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-cyan-500/5 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/5 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-lg">
          PlanetQ Radio
        </h1>
        <p className="text-center text-lg text-gray-300 mb-10">
          Enjoy curated Spotify playlists and tracks. Click play and vibe out!
        </p>
        <div className="w-full flex justify-center">
          <PlayerBot />
        </div>
        {/* <div className="space-y-10">
          {spotifyEmbeds.map((embed, idx) => (
            <div
              key={idx}
              className="bg-gray-900/70 rounded-2xl shadow-lg p-6 flex flex-col items-center"
            >
              <h2 className="text-2xl font-bold mb-4 text-cyan-300 text-center">
                {embed.title}
              </h2>
              <div className="w-full flex justify-center">
                <iframe
                  src={embed.url}
                  width="100%"
                  height="800"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                  loading="lazy"
                  className="rounded-xl border-none shadow-xl"
                  title={embed.title}
                  style={{ minWidth: 250, maxWidth: 700 }}
                ></iframe>
              </div>
            </div>
          ))}
        </div> */}
      </div>
    </div>
  );
};

const RadioPage = () => {
  return (
    <RadioSubscriptionFlow>
      <RadioContent />
    </RadioSubscriptionFlow>
  );
};

export default RadioPage;
