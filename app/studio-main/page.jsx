"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StarsWrapper from "@/components/canvas/StarsWrapper";

export default function Landing() {
  const router = useRouter();
  const videoRef = useRef(null);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleGoToSite = () => {
    router.push("/aistudio");
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        await video.pause();
      } else {
        await video.play();
      }
      setIsPlaying(!isPlaying);
      setShowPlayButton(isPlaying);
    } catch (error) {
      console.error("Error toggling video:", error);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#050816] relative z-10 p-4 sm:p-8 md:p-12 lg:p-20 overflow-y-auto">
      <StarsWrapper />
      {/* Main content - centered container */}
      <div className="w-full flex flex-col items-center justify-center">
        {/* Video container with max width */}
        <div className="w-full max-w-[500px] flex flex-col items-center justify-center">
          {/* Video with play button */}
          <div className="relative w-[90vw] h-[90vw] max-w-[500px] max-h-[500px] rounded-full overflow-hidden border-4 border-purple-400/30 shadow-[0_0_50px_rgba(167,139,250,0.3)]">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              onClick={togglePlay}
              playsInline
            >
              <source src="/videos/studio_intro.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Play button overlay */}
            {!isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={togglePlay}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-100/80 to-purple-400/80 backdrop-blur-md flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 opacity-90 ring-2 ring-purple-400/40">
                  <div className="w-0 h-0 border-t-6 border-b-6 border-l-12 sm:border-t-7 sm:border-b-7 sm:border-l-14 md:border-t-8 md:border-b-8 md:border-l-16 border-t-transparent border-b-transparent border-l-white ml-1"></div>
                </div>
              </div>
            )}
          </div>

          {/* Enter Website button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={handleGoToSite}
              className="px-12 py-4 bg-white text-blue-600 text-lg font-bold rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full max-w-[300px]"
            >
              Enter Q Studio
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
