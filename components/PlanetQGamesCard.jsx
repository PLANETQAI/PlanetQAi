"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function PlanetQGamesCard({ onClick }) {
  const router = useRouter();
  const handleCardClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick(e);
    router.push("/planetqgames");
  };
  return (
    <div className="p-1 block" onClick={handleCardClick}>
      <div
        className="group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all"
      >
        <div className="text-[#afafaf] text-xs sm:text-sm md:text-lg font-semibold p-1 sm:p-2 mb-1 sm:mb-2 text-center group-hover:animate-vibrate">
          <h1 className="text-xl">Planet Q Games</h1>
        </div>
        <div className="relative">
          <Image
            src="/images/video-game.jpg"
            alt="Planet Q Games"
            width={300}
            height={200}
            className="w-full h-auto rounded-lg"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-center">
            <span className="text-white font-bold text-lg">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
