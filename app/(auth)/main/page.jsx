"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Import client-side components
const PlanetQGamesCard = dynamic(
  () => import("@/components/PlanetQGamesCard"),
  { ssr: false }
);
const PlanetQVideoCard = dynamic(
  () => import("@/components/PlanetQVideoCard"),
  { ssr: false }
);
import CircleTypeText from "@/components/circleTypeText";
import { cn } from "@/lib/utils";

// Import the improved stars component
import StarsWrapper from "@/components/canvas/StarsWrapper";

const CustomRadioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef(null);

  // Stream URL for Planet Q Radio - replace with your actual stream URL
  const streamUrl = "https://radio.planetqproductions.com/radio/8000/radio.mp3";

  useEffect(() => {
    if (audioRef.current) {
      // Set up audio element
      audioRef.current.volume = volume;

      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = (e) => {
    // Stop event propagation to prevent card sliding
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e) => {
    // Stop event propagation to prevent card sliding
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    // Stop event propagation to prevent card sliding
    e.stopPropagation();

    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const stopPropagation = (e) => {
    // Stop event propagation to prevent card sliding
    e.stopPropagation();
  };

  return (
    <div
      className="bg-gray-800 w-full rounded-b-lg p-2 sm:p-3"
      onClick={stopPropagation}
    >
      <audio
        ref={audioRef}
        src={streamUrl}
        preload="auto"
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-white">
        <div className="flex items-center gap-2">
          {/* Station info */}
          <div className="text-sm flex flex-col text-center justify-center">
            <div className="font-bold">Planet Q Radio</div>
            <div className="text-gray-300 text-xs">Live Stream</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Play/Pause button */}
          <button
            onClick={togglePlay}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full p-3 transition-all"
            disabled={isLoading}
          >
            {isLoading ? (
              <svg
                className="animate-spin h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : isPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
          </button>

          {/* Volume control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-gray-300 hover:text-white"
            >
              {isMuted || volume === 0 ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 5L6 9H2v6h4l5 4zM23 9l-6 6M17 9l6 6" />
                </svg>
              ) : volume < 0.5 ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 5L6 9H2v6h4l5 4zM15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 5L6 9H2v6h4l5 4zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 sm:w-28 accent-blue-500"
              onClick={stopPropagation}
            />
          </div>
        </div>
      </div>

      {/* Now playing marquee */}
      <div className="mt-2 text-gray-300 text-sm overflow-hidden">
        <div className="whitespace-nowrap animate-marquee">
          Now Playing: Planet Q Radio - Futuristic Music Experience -Monday -
          Friday Futuristic Mornings Futuristic Hip Hop{" "}
        </div>
      </div>
    </div>
  );
};

const RootPage = () => {
  const router = useRouter();
  const [clickSteps, setClickSteps] = useState(3); // Start with Q World Studios (index 3)
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showIntroVideo, setShowIntroVideo] = useState(true);
  const [needsUserAction, setNeedsUserAction] = useState(true);
  const videoRef = useRef(null);
  const [direction, setDirection] = useState("forward");
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [initialVideoLink, setInitialVideoLink] = useState(
    "https://youtu.be/I5uiP9ogijs?si=O33QCOnUKp-Y7eHG"
  );
  const [showTime, setShowTime] = useState(true);

  useEffect(() => {
    if (showIntroVideo) {
      // Play the video when showIntroVideo becomes true
      if (videoRef.current) {
        videoRef.current.play().catch((error) => {
          setNeedsUserAction(true);
          console.log("Autoplay failed:", error);
        });
      }

      // Set timer to hide intro video after 17 seconds
      const timer = setTimeout(() => setShowIntroVideo(false), 15000);
      setNeedsUserAction(false);
      return () => clearTimeout(timer);
    } else {
      // Pause the video when showIntroVideo becomes false
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [showIntroVideo]);

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setNeedsUserAction(false);
    }
  };

  useEffect(() => {
    // Check if we should show the text based on localStorage
    const lastShown = localStorage.getItem("bannerLastShown");
    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (!lastShown || now - parseInt(lastShown, 10) > FIVE_MINUTES) {
      // Either first time or more than 5 minutes have passed
      setShowTime(true);
      localStorage.setItem("bannerLastShown", now.toString());

      // Hide after 5 minutes
      const timer = setTimeout(() => {
        setShowTime(false);
      }, FIVE_MINUTES);

      return () => clearTimeout(timer);
    } else {
      // Less than 5 minutes since last show, don't show
      setShowTime(false);
    }
  }, []);
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    // Add scroll event listener to show/hide scroll up button
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollUp(true);
      } else {
        setShowScrollUp(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClickSteps = (e) => {
    // Don't process the click if it comes from a card element
    if (isTransitioning || e.target.closest(".card-content")) return;

    setIsTransitioning(true);

    setTimeout(() => {
      let newStep = clickSteps;
      let newDirection = direction;

      if (direction === "forward") {
        if (clickSteps < 6) {
          // Updated to include new video games card
          newStep = clickSteps + 1;
        } else {
          newDirection = "backward";
          newStep = clickSteps - 1;
        }
      } else {
        if (clickSteps > 0) {
          newStep = clickSteps - 1;
        } else {
          newDirection = "forward";
          newStep = clickSteps + 1;
        }
      }

      setClickSteps(newStep);
      setDirection(newDirection);

      setTimeout(() => {
        setIsTransitioning(false);
      }, 400);
    }, 100);
  };

  // Handle touch events for swipe functionality
  const handleTouchStart = (e) => {
    // Only prevent default if it's a horizontal swipe
    if (e.touches.length === 1) {
      e.preventDefault();
      setTouchStart(e.touches[0].clientX);
      setTouchEnd(null); // Reset touch end when a new touch starts
    }
  };

  const handleTouchMove = (e) => {
    if (touchStart !== null) {
      // Only prevent default if we're actually handling a swipe
      const touch = e.touches[0];
      const diff = Math.abs(touch.clientX - touchStart);

      // If the movement is more horizontal than vertical, prevent default
      if (diff > 10) {
        e.preventDefault();
      }

      setTouchEnd(touch.clientX);
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || touchEnd === null || isTransitioning) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50; // Minimum distance for a swipe
    const isRightSwipe = distance < -50; // Minimum distance for a swipe

    // Only process the swipe if it meets the minimum distance threshold
    if (Math.abs(distance) > 50) {
      if (isLeftSwipe && clickSteps < 5) {
        // Swiped left - go forward
        e.preventDefault();
        setIsTransitioning(true);
        setDirection("forward");
        setClickSteps((prev) => prev + 1);
        setTimeout(() => setIsTransitioning(false), 400);
      } else if (isRightSwipe && clickSteps > 0) {
        // Swiped right - go backward
        e.preventDefault();
        setIsTransitioning(true);
        setDirection("backward");
        setClickSteps((prev) => prev - 1);
        setTimeout(() => setIsTransitioning(false), 400);
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Add passive: false to prevent default touch behavior
  useEffect(() => {
    const carousel = document.querySelector(".carousel-container");
    if (carousel) {
      carousel.addEventListener(
        "touchmove",
        (e) => {
          if (touchStart !== null) {
            e.preventDefault();
          }
        },
        { passive: false }
      );

      return () => {
        carousel.removeEventListener(
          "touchmove",
          (e) => {
            if (touchStart !== null) {
              e.preventDefault();
            }
          },
          { passive: false }
        );
      };
    }
  }, [touchStart]);

  // Prevent click propagation on interactive elements
  const preventPropagation = (e) => {
    e.stopPropagation();
  };

  const handlePlaneqgames = (e) => {
    e.stopPropagation();
    router.push("/planetqgames");
  };

  const handlePlaneqvideo = (e) => {
    e.stopPropagation();
    router.push("/video-player");
  };

  // Define views - these won't be recreated on each render
  // SWAPPED: Store moved to radio position (was planetQRadio)
  const planetQStore = (
    <div
      className="group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all text-center card-content"
      onClick={preventPropagation}
    >
      <div className="text-[#afafaf] text-xs sm:text-sm md:text-lg font-semibold p-1 sm:p-2 mb-1 sm:mb-2 text-center group-hover:animate-vibrate">
        <h1 className="text-xl">Planet Q Store</h1>
      </div>
      <Link href={"/productions/album"} legacyBehavior={false}>
        <Image
          src={"/images/robo.jpeg"}
          width={300}
          height={200}
          alt="robo"
          className="w-full h-auto rounded-lg"
        />
      </Link>
    </div>
  );

  const qWorldStudios = (
    <div className="w-full card-content" onClick={preventPropagation}>
      <div
        className="flex items-center justify-between px-2 sm:px-4 py-4 sm:py-6 w-full rounded-t-lg"
        style={{
          backgroundColor: "rgb(31 41 55 / 0.9)",
        }}
      >
        {/* Left Radio Circle */}
        <div className="relative w-16 sm:w-20 md:w-24 aspect-square overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
            <video
              autoPlay
              loop
              muted
              className="w-[150%] h-auto object-cover rounded-full"
            >
              <source src="/images/anicircle.mp4" type="video/mp4" />
            </video>
            <Image
              src="/images/radio1.jpeg"
              alt="Radio Left"
              width={100}
              height={100}
              className="absolute p-1 sm:p-2 rounded-full"
            />
          </div>
        </div>

        {/* Center Chat Link */}
        <div className="flex justify-center items-center flex-col gap-4">
          <Link
            href={"/chat"}
            className="rounded-full overflow-hidden aspect-square flex justify-center items-center w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 hover:shadow-[0_0_15px_rgba(0,300,300,0.8)] hover:cursor-pointer mx-2"
          >
            <video
              loop
              autoPlay
              muted
              preload="true"
              className="rounded-full w-full h-full object-cover"
            >
              <source src="/videos/Planet-q-Chatbox.mp4" type="video/mp4" />
            </video>
          </Link>
          <p className="text-blue-500 text-lg font-bold animate-pulse">
            Chat Bot
          </p>
        </div>

        {/* Right Radio Circle */}
        <div className="relative w-16 sm:w-20 md:w-24 aspect-square overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
            <video
              autoPlay
              loop
              muted
              className="w-[150%] h-auto object-cover rounded-full"
            >
              <source src="/images/anicircle.mp4" type="video/mp4" />
            </video>
            <Image
              src="/images/radio1.jpeg"
              alt="Radio Right"
              width={100}
              height={100}
              className="absolute p-1 sm:p-2 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Background Video */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <video
          src="/images/bg-video-compressed.mp4"
          className="absolute top-0 left-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
        ></video>
      </div>

      {/* Replace the iframe with our custom player */}
      <div className="bg-gray-800 w-full rounded-b-lg p-2! sm:p-3">
        <iframe
          src="https://radio.planetqproductions.com/public/planetq/embed?theme=dark&autoplay=true"
          frameBorder="0"
          allowtransparency="true"
          style={{
            width: "100%",
            height: "130px",
            border: "0",
          }}
          title="Radio Planet Q"
          allow="autoplay; encrypted-media"
        ></iframe>
      </div>
      {/* <CustomRadioPlayer /> */}
    </div>
  );

  // SWAPPED: Productions moved to studio position (was radioPlayer)
  const planetQProductions = (
    <div className="p-1 block card-content" onClick={preventPropagation}>
      <Link href={"/productions/about"} className="block">
        <div className="group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all col-span-1 xs:col-span-2 sm:col-span-1 mx-auto w-full sm:w-auto">
          <div className="text-[#afafaf] text-xs sm:text-sm md:text-lg font-semibold p-1 sm:p-2 mb-1 sm:mb-2 text-center group-hover:animate-vibrate">
            <h1 className="text-xl">Planet Q Productions</h1>
          </div>
          <Image
            src="/images/V_center.jpg"
            alt="Planet Q Productions"
            width={300}
            height={200}
            className="w-full h-auto rounded-lg"
          />
        </div>
      </Link>
    </div>
  );

  // SWAPPED: Radio moved to store position (was roboCard)
  const planetQRadio = (
    <div className="h-full p-1 block card-content" onClick={preventPropagation}>
      <Link href={"/productions"} className="block">
        <div className="group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all">
          <div className="text-[#afafaf] text-xs sm:text-sm md:text-lg font-semibold p-1 sm:p-2 mb-1 sm:mb-2 text-center group-hover:animate-vibrate">
            <h1 className="text-xl">Planet Q Radio</h1>
          </div>
          <video
            src="/videos/V_left-compressed.mp4"
            autoPlay
            muted
            loop
            className="w-full h-auto rounded-lg"
          ></video>
        </div>
      </Link>
    </div>
  );

  // SWAPPED: Studio moved to productions position (was fifthLink)
  const studioCard = (
    <div className="p-1 card-content" onClick={preventPropagation}>
      <Link href={"/studio-main"} className="block">
        <div className="group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all">
          <div className="text-[#afafaf] text-xs sm:text-sm md:text-lg font-semibold p-1 sm:p-2 mb-1 sm:mb-2 text-center group-hover:animate-vibrate">
            <h1 className="text-xl">Q World Studios</h1>
          </div>
          <Image
            src="/images/V_right.jpg"
            alt="Q World Studios"
            width={300}
            height={200}
            className="w-full h-auto rounded-lg"
          />
        </div>
      </Link>
    </div>
  );

  // New PlanetQVideo games card with Coming Soon label
  const planetQGames = <PlanetQGamesCard onClick={handlePlaneqgames} />;

  // New PlanetQVideo player card
  const planetQVideo = (
    <PlanetQVideoCard onClick={handlePlaneqvideo} />
    // <MusicPlayer initialVideoLink={initialVideoLink} />
  );

  // Add CSS for marquee animation if needed
  useEffect(() => {
    // Add a style element if needed
    if (!document.getElementById("custom-styles")) {
      const style = document.createElement("style");
      style.id = "custom-styles";
      style.innerHTML = `
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-250%); }
        }
        
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="w-full overflow-y-scroll min-h-screen h-full relative">
      {/* Scroll arrows with email */}
      <div className="absolute right-8 bottom-28 flex flex-col items-center space-y-2">
        <div 
          className="cursor-pointer p-2 rounded-full hover:bg-blue-500/20 transition-colors" 
          onClick={() => window.location.href = 'mailto:quincin2000@planetqproductions.com'}
        >
          <img 
            src="/videos/email.gif" 
            alt="Email Us" 
            className="w-6 h-6"
            style={{ filter: 'invert(1)' }}
          />
        </div>
      {showScrollUp && (
        <div className="scroll-arrow scroll-arrow-up text-blue-500" onClick={scrollToTop}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </div>
      )}
      </div>
      <div className="scroll-arrow scroll-arrow-down text-blue-500" onClick={scrollToBottom}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      <div
        className="min-h-screen flex flex-col justify-center items-center bg-[#050816] top-0 relative z-10 p-4 sm:p-8 md:p-12 lg:p-20 overflow-y-auto"
        onClick={(e) => handleClickSteps(e)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          // Allow vertical scrolling but prevent horizontal scrollbar
          overflowX: "hidden",
          // Prevent iOS rubber band effect
          overscrollBehaviorY: "contain",
          // Enable smooth scrolling on iOS
          WebkitOverflowScrolling: "touch",
          // Prevent text selection during swipe
          userSelect: "none",
          WebkitUserSelect: "none",
          // Prevent tap highlight on mobile
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* <CircleTypeTeFTxt
          text={"Play Futuristic Music"}
          className={cn(
            "absolute top-6 sm:top-10 z-50 text-white text-xl animate-bounce right-24 left-1/2 -translate-x-[50%]",
            showTime ? "opacity-100" : "opacity-0"
          )}
        /> */}
        <CircleTypeText
          text={"Planet Q Productions"}
          className={cn(
            "absolute top-6 sm:top-10 z-50 text-white text-xl animate-bounce right-24 left-1/2 -translate-x-[50%] transition-opacity duration-500",
            showTime ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        />
        {/* Reintroducing the improved stars component */}
        <StarsWrapper />
        {/* <StarsCanvas /> */}
        {/* Content container */}
        <div className="w-full max-w-md mx-auto relative px-4 pt-16 pb-16">
          {/* Scroll arrows */}
          {showScrollUp && (
            <div className="fixed bottom-8 right-8 flex flex-col gap-4">
              <div 
                className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
                onClick={scrollToTop}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </div>
              <div 
                className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
                onClick={scrollToBottom}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          )}

          <div
            className="relative w-full carousel-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleClickSteps}
            style={{
              touchAction: "pan-y",
              WebkitOverflowScrolling: "touch",
              userSelect: "none",
              WebkitUserSelect: "none",
              overflowX: "hidden",
              width: "100%",
              position: "relative",
              overscrollBehaviorX: "none",
              WebkitOverflowScrolling: "touch",
              WebkitTouchCallout: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div
              className={cn(
                "absolute w-full transition-all duration-500 ease-in-out",
                clickSteps === 0
                  ? "opacity-100 translate-x-0"
                  : clickSteps < 0
                  ? "opacity-0 -translate-x-full"
                  : "opacity-0 translate-x-full"
              )}
            >
              {planetQVideo}
            </div>
            <div
              className={cn(
                "absolute w-full transition-all duration-500 ease-in-out",
                clickSteps === 1
                  ? "opacity-100 translate-x-0"
                  : clickSteps < 1
                  ? "opacity-0 -translate-x-full"
                  : "opacity-0 translate-x-full"
              )}
            >
              {planetQProductions}
            </div>

            <div
              className={cn(
                "absolute w-full transition-all duration-500 ease-in-out",
                clickSteps === 2
                  ? "opacity-100 translate-x-0"
                  : clickSteps < 2
                  ? "opacity-0 -translate-x-full"
                  : "opacity-0 translate-x-full"
              )}
            >
              {planetQRadio}
            </div>

            <div
              className={cn(
                "absolute w-full h-full transition-all duration-500 ease-in-out",
                clickSteps === 3
                  ? "opacity-100 translate-x-0"
                  : clickSteps < 3
                  ? "opacity-0 -translate-x-full"
                  : "opacity-0 translate-x-full"
              )}
            >
              {qWorldStudios}
            </div>
            <div
              className={cn(
                "absolute w-full transition-all duration-500 ease-in-out",
                clickSteps === 4
                  ? "opacity-100 translate-x-0"
                  : clickSteps < 4
                  ? "opacity-0 -translate-x-full"
                  : "opacity-0 translate-x-full"
              )}
            >
              {studioCard}
            </div>
            <div
              className={cn(
                "absolute w-full transition-all duration-500 ease-in-out",
                clickSteps === 5
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-full"
              )}
            >
              {planetQStore}
            </div>

            {/* <div
              className={cn(
                "absolute w-full transition-all duration-500 ease-in-out",
                clickSteps === 5
                  ? "opacity-100 translate-x-0"
                  : clickSteps < 5
                  ? "opacity-0 -translate-x-full"
                  : "opacity-0 translate-x-full"
              )}
            >
              {planetQVideo}
            </div> */}

            <div
              className={cn(
                "absolute w-full transition-all duration-500 ease-in-out",
                clickSteps === 6
                  ? "opacity-100 translate-x-0"
                  : clickSteps < 6
                  ? "opacity-0 -translate-x-full"
                  : "opacity-0 translate-x-full"
              )}
            >
              {planetQGames}
            </div>

            {/* Spacer div to maintain container height */}

            <div
              className={cn(
                "w-full opacity-0 pointer-events-none",
                clickSteps === 0 ? "block" : "hidden"
              )}
            >
              {planetQVideo}
            </div>

            <div
              className={cn(
                "w-full opacity-0 pointer-events-none",
                clickSteps === 1 ? "block" : "hidden"
              )}
            >
              {planetQProductions}
            </div>

            <div
              className={cn(
                "w-full opacity-0 pointer-events-none",
                clickSteps === 2 ? "block" : "hidden"
              )}
            >
              {planetQRadio}
            </div>
            <div
              className={cn(
                "w-full opacity-0 pointer-events-none",
                clickSteps === 3 ? "block" : "hidden"
              )}
            >
              {qWorldStudios}
            </div>
            <div
              className={cn(
                "w-full opacity-0 pointer-events-none",
                clickSteps === 4 ? "block" : "hidden"
              )}
            >
              {studioCard}
            </div>
            <div
              className={cn(
                "w-full opacity-0 pointer-events-none",
                clickSteps === 5 ? "block" : "hidden"
              )}
            >
              {planetQStore}
            </div>
            <div
              className={cn(
                "w-full opacity-0 pointer-events-none",
                clickSteps === 6 ? "block" : "hidden"
              )}
            >
              {planetQGames}
            </div>
          </div>

          {/* Indicators */}
          <div className="mt-8 flex justify-center gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300 cursor-pointer",
                  clickSteps === index
                    ? "bg-white scale-125"
                    : "bg-gray-500 hover:bg-gray-400"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isTransitioning) {
                    setIsTransitioning(true);
                    setDirection(index > clickSteps ? "forward" : "backward");
                    setClickSteps(index);
                    setTimeout(() => setIsTransitioning(false), 400);
                  }
                }}
              />
            ))}
            <div
              className={cn(
                "ml-2 text-xs transition-all duration-300",
                isTransitioning ? "opacity-0" : "opacity-70"
              )}
            >
              {direction === "forward" ? "→" : "←"}
            </div>
          </div>
        </div>{" "}
      </div>
    </div>
  );
};

export default RootPage;
