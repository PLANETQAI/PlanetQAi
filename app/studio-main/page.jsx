"use client";
import StarsWrapper from "@/components/canvas/StarsWrapper";
import { Mic, Speaker } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function Landing() {
  const router = useRouter();
  const videoRef = useRef(null);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);


	// Toggle play/pause for the video
	const togglePlayPause = () => {
		if (!videoRef.current) return;

		// If video ended, reset to start and play
		if (videoRef.current.ended) {
			videoRef.current.currentTime = 0;
		}

		// Toggle play/pause
		if (videoRef.current.paused) {
			videoRef.current.play()
				.then(() => setIsPlaying(true))
				.catch(error => console.error('Error playing video:', error));
		} else {
			videoRef.current.pause();
			// Update state after the video is actually paused
			setTimeout(() => setIsPlaying(videoRef.current && !videoRef.current.paused), 0);
		}
	};


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
        {/* Animated Hello Music Text */}
        <h1 className="text-5xl md:text-6xl font-bold italic mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 text-center w-full" 
            style={{
              display: 'block',
              textShadow: '0 0 15px rgba(167, 139, 250, 0.8)'
            }}>
          Hello Music Creator
        </h1>
        
        {/* Video container with max width */}
        <div className="w-full max-w-[500px] flex flex-col items-center justify-center">
          	<div className="relative mb-8">
				<div
					className="absolute inset-0 rounded-full transition-all duration-300"
					style={{
						background: 'radial-gradient(circle, rgba(0,212,255,0.3) 0%, transparent 70%)',
						transform: 'scale(1.2)'
					}}
				/>

				<div
					className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-purple-500/30 mx-auto cursor-pointer"
					style={{
						background: 'radial-gradient(circle at center, rgba(30,30,60,0.9), rgba(10,10,30,0.95))',
						boxShadow: '0 0 30px rgba(0,212,255,0.3), inset 0 0 20px rgba(0,100,150,0.2)'
					}}
					onClick={togglePlayPause}
				>
					<video
						ref={videoRef}
						className="absolute inset-0 w-full h-full object-cover"
						playsInline
						onKeyDown={(e) => e.key === ' ' && e.preventDefault()}
						onEnded={() => videoRef.current?.pause()}
						tabIndex="0"
					>
						<source src="/videos/studio_intro.mp4" type="video/mp4" />
						Your browser does not support the video tag.
					</video>
				</div>

				<div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
					<div className="relative">
						<button
							onClick={togglePlayPause}
							className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg transition-all duration-300"
							style={{
								background: !isPlaying
									? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
									: '#EF4444',
								boxShadow: !isPlaying
									? '0 4px 15px rgba(16, 185, 129, 0.5)'
									: '0 4px 15px rgba(239, 68, 68, 0.5)'
							}}
							aria-label={!isPlaying ? 'Play' : 'Pause'}
						>
							{isPlaying && (
								<div className="absolute inset-0 rounded-full opacity-20 bg-red-400 animate-ping"></div>
							)}
							<div className="flex items-center justify-center w-full h-full">
								{!isPlaying ? (
									<Mic className="w-6 h-6 text-white" />
								) : (
									<Speaker className="w-6 h-6 text-white" />
								)}
							</div>
						</button>
					</div>
				</div>
			</div>
		

          {/* Enter Website button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={handleGoToSite}
              className="px-12 py-4 bg-white text-blue-600 text-lg font-bold rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full max-w-[300px]"
            >
              Enter Q_World Studios
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
