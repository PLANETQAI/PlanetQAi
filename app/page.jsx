"use client";

import { cn } from "@/lib/utils";
import { useSession } from 'next-auth/react';
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";

// Import client-side components
const PlanetQGamesCard = dynamic(
  () => import("@/components/PlanetQGamesCard"),
  { ssr: false }
);
const PlanetQVideoCard = dynamic(
  () => import("@/components/PlanetQVideoCard"),
  { ssr: false }
);

// Import the improved stars component
import StarsWrapper from "@/components/canvas/StarsWrapper";
import VoiceNavigationAssistant from "@/components/common/QuaylaAssistants";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";



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

  const [showTime, setShowTime] = useState(true);
   const { data: session, status: sessionStatus } = useSession();

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
    if (e.touches.length === 1) {
      // Don't call preventDefault() here to avoid the passive event warning
      // We'll use CSS to handle touch actions instead
      setTouchStart(e.touches[0].clientX);
      setTouchEnd(null);

      // If you need to prevent default for specific cases, use non-passive event listeners
      // by adding { passive: false } when adding the event listener
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
    e.nativeEvent?.stopImmediatePropagation?.();
    if (e.type === 'touchstart' || e.type === 'touchmove') {
      e.preventDefault();
    }
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
      onTouchStart={preventPropagation}
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
    <div>
      <div className="flex justify-center gap-2">
        {session ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
            onClick={() => router.push('/my-songs')}
            aria-label="Go to my songs"
          >
            <LogIn className="h-8 w-8"/>
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            className="bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
            onClick={() => signIn(undefined, { callbackUrl: '/my-songs' })}
            aria-label="Login to view your songs"
          >
            <LogIn className="h-8 w-8"/>
          </Button>
        )}
      </div>
      <div
      className="p-2"
      onClick={preventPropagation}
      onTouchStart={preventPropagation}
    >
      <VoiceNavigationAssistant />
    </div>
     
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
        {/* <CircleTypeText
          text={"Planet Q Productions"}
          className={cn(
            "absolute top-6 sm:top-10 z-50 text-white text-xl animate-bounce right-24 left-1/2 -translate-x-[50%] transition-opacity duration-500",
            showTime ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        /> */}
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
            <div className="absolute top-[94%] left-1/2 transform -translate-x-1/2">
              <h3 className="text-white text-3xl font-bold">TAP</h3>
            </div>
          </div>

        </div>{" "}
      </div>
    </div>
  );
};

export default RootPage;
