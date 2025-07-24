"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
    <div className="w-full min-h-screen h-full flex flex-col items-center justify-center bg-black relative overflow-hidden">
      {/* Background with stars */}
      <div className="absolute inset-0 bg-[url('/images/stars-bg.png')] bg-cover bg-center opacity-30"></div>
      
      {/* Main content */}
      <div className="relative z-10 w-full max-w-4xl px-4">
        {/* Video with play button */}
        <div className="relative w-full aspect-video max-h-[70vh] bg-black rounded-2xl overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            onClick={togglePlay}
            loop
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
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                <div className="w-0 h-0 border-t-8 border-b-8 border-l-16 border-t-transparent border-b-transparent border-l-white ml-1"></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Black separator */}
        <div className="h-16 bg-black w-full"></div>
        
        {/* Enter Website button */}
        <div className="flex flex-col items-center mt-4">
          <button
            onClick={handleGoToSite}
            className="px-12 py-4 bg-white text-blue-600 text-lg font-bold rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Enter Website
          </button>
          
          {/* Pagination dots */}
          <div className="flex space-x-2 mt-8">
            {[1, 2, 3, 4, 5].map((dot) => (
              <div 
                key={dot}
                className={`w-2 h-2 rounded-full ${dot === 1 ? 'bg-white' : 'bg-gray-600'}`}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
