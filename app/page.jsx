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
    router.push("/main");
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
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#050816] top-0 relative z-10 p-4 sm:p-8 md:p-12 lg:p-20 overflow-y-auto">
      <StarsWrapper />
      {/* Main content */}
      <div className="relative z-10 w-full max-w-4xl px-4">
        {/* Video with play button */}
        <div className="relative w-[500px] h-[500px] mx-auto rounded-full overflow-hidden border-4 border-purple-400/30 shadow-[0_0_50px_rgba(167,139,250,0.3)]">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            onClick={togglePlay}
            playsInline
          >
            <source src="/videos/intro_video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Play button overlay */}
          {!isPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={togglePlay}
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100/80 to-purple-400/80 backdrop-blur-md flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 opacity-90 ring-2 ring-purple-400/40">
                <div className="w-0 h-0 border-t-8 border-b-8 border-l-16 border-t-transparent border-b-transparent border-l-white ml-1"></div>
              </div>
            </div>
          )}
        </div>

        {/* Enter Website button */}
        <div className="flex flex-col items-center mt-4">
          <button
            onClick={handleGoToSite}
            className="px-12 py-4 bg-white text-blue-600 text-lg font-bold rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Enter Website
          </button>
        </div>
      </div>
    </div>
  );
}
