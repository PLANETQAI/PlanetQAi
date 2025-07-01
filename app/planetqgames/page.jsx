"use client";

import React from 'react';
import StarsWrapper from '@/components/canvas/StarsWrapper';
import MusicPlayer from '@/components/planetqproductioncomp/musicplayer';
import Image from "next/image";
import { useSpring, animated } from 'react-spring';

const PlanetQGamesPage = () => {
  // Background music link
  const backgroundMusicLink = "https://youtu.be/I5uiP9ogijs?si=O33QCOnUKp-Y7eHG";

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
    from: { opacity: 0, transform: 'scale(0.8)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: { mass: 1, tension: 120, friction: 14 },
    delay: 600,
  });

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-[#050816]">
      <StarsWrapper />

      {/* Background Music Player (auto-playing, hidden) */}
      <div className="fixed bottom-0 left-0 h-0 w-0 overflow-hidden">
        <MusicPlayer initialVideoLink={backgroundMusicLink} />
      </div>

      <div className="relative z-10  p-8 rounded-lg shadow-lg max-w-4xl w-full text-white text-center">
        <animated.h1 style={titleProps} className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 animate-pulse">
          Planet Q Games
        </animated.h1>
        <animated.p style={subtitleProps} className="text-2xl mb-8 font-semibold text-gray-300">
          Unleashing New Worlds: Coming Soon!
        </animated.p>

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

        <p className="text-lg mt-12 text-gray-400">
          &copy; 2025 Planet Q. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default PlanetQGamesPage;