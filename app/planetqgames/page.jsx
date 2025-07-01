"use client";

import React, { useState } from 'react';
import StarsWrapper from '@/components/canvas/StarsWrapper';
import MusicPlayer from '@/components/planetqproductioncomp/musicplayer';
import Image from "next/image";
import { useSpring, animated } from 'react-spring'; // Added for animations

const PlanetQGamesPage = () => {
  const [videoLink, setVideoLink] = useState('');
  const [currentVideoLink, setCurrentVideoLink] = useState(null);

  const handleInputChange = (e) => {
    setVideoLink(e.target.value);
  };

  const handleSetVideo = () => {
    setCurrentVideoLink(videoLink);
  };

  // Animation properties
  const titleProps = useSpring({
    from: { opacity: 0, transform: 'translateY(-50px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { mass: 1, tension: 120, friction: 14 },
    delay: 200,
  });

  const subtitleProps = useSpring({
    from: { opacity: 0, transform: 'translateY(50px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { mass: 1, tension: 120, friction: 14 },
    delay: 400,
  });

  const imageProps = useSpring({
    from: { opacity: 0, transform: 'translateY(20px) scale(0.9) rotate(0deg)' },
    to: async (next) => {
      while (1) {
        await next({ opacity: 1, transform: 'translateY(0px) scale(1) rotate(0deg)' });
        await next({ transform: 'translateY(-10px) scale(1.02) rotate(2deg)' });
        await next({ transform: 'translateY(0px) scale(1) rotate(0deg)' });
        await next({ transform: 'translateY(10px) scale(0.98) rotate(-2deg)' });
        await next({ transform: 'translateY(0px) scale(1) rotate(0deg)' });
      }
    },
    config: { mass: 1, tension: 120, friction: 14 },
    delay: 600,
  });

  // Default background music link (you can change this)
  const backgroundMusicLink = "https://youtu.be/I5uiP9ogijs?si=O33QCOnUKp-Y7eHG";

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-[#050816]">
      <StarsWrapper />

      {/* Background Music Player (hidden) */}
      <div className="absolute top-0 left-0 w-0 h-0 overflow-hidden">
        <MusicPlayer initialVideoLink={backgroundMusicLink} />
      </div>

      <div className="relative z-10  p-8 rounded-lg shadow-lg max-w-4xl w-full text-white text-center">
        <animated.h1 style={titleProps} className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 animate-pulse">
          Planet Q Games
        </animated.h1>
        <animated.p style={subtitleProps} className="text-2xl mb-8 font-semibold text-gray-300">
          Unleashing New Worlds: Coming Soon!
        </animated.p>

        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-center">
          <input
            type="text"
            placeholder="Enter YouTube trailer link (optional)"
            className="flex-grow p-3 rounded-md border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={videoLink}
            onChange={handleInputChange}
          />
          <button
            onClick={handleSetVideo}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            Load Trailer
          </button>
        </div>

        {currentVideoLink ? (
          <div className="mt-8 w-full aspect-video relative">
            <button
              onClick={() => setCurrentVideoLink(null)}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-full z-20"
            >
              X
            </button>
            <MusicPlayer initialVideoLink={currentVideoLink} />
          </div>
        ) : (
          <animated.div style={imageProps} className="mt-8 p-6 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center">
            <Image
              src="/images/video-game.webp"
              alt="Game Placeholder"
              width={400}
              height={250}
              className="rounded-lg mb-4"
            />
            <p className="text-xl text-gray-400 mb-4">Our next big adventure is in development!</p>
            <p className="text-lg text-gray-500">Stay tuned for updates and an epic gaming experience.</p>
          </animated.div>
        )}

        <p className="text-lg mt-12 text-gray-400">
          &copy; 2025 Planet Q. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default PlanetQGamesPage;