"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import StarsWrapper from '@/components/canvas/StarsWrapper';
import Image from "next/image";
import { useSpring, animated } from 'react-spring';
import { getVideos } from '@/actions/videoActions';

// Dynamically import Player with SSR disabled
const Player = dynamic(() => import('../my-studio/player'), {
  ssr: false,
  loading: () => <div className="w-full h-64 flex items-center justify-center">Loading player...</div>
});

const PlanetQGamesPage = () => {

    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchVideos = async () => {
        try {
          const videoData = await getVideos();
          setVideos(videoData);
        } catch (error) {
          console.error('Error loading videos:', error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchVideos();
    }, []);
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
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: { mass: 1, tension: 120, friction: 14 },
    delay: 600,
  });

  const pulseAnimation = useSpring({
    from: { opacity: 1, transform: 'scale(1)' },
    to: { opacity: 1, transform: 'scale(1.03)' },
    config: { duration: 2000 },
    loop: { reverse: true },
  });

  // Animation for grid items
  const gridItems = [
    { icon: '🎮', title: 'Epic Quests', desc: 'Immersive storylines' },
    { icon: '🌌', title: 'Open Worlds', desc: 'Vast landscapes' },
    { icon: '⚔️', title: 'Action-Packed', desc: 'Thrilling combat' },
    { icon: '🎨', title: 'Stunning Visuals', desc: 'Next-gen graphics' }
  ];

  const gridAnimations = useSpring({
    from: { opacity: 0, y: 40 },
    to: { opacity: 1, y: 0 },
    config: { mass: 1, tension: 120, friction: 14 },
    delay: 800
  });

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-gradient-to-b from-gray-900 to-black">
      <div className="absolute inset-0 overflow-hidden">
        <StarsWrapper />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80" />
      </div>

      <div className="relative z-10 w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <div className="mb-12">
          <animated.h1 
            style={titleProps} 
            className="text-5xl md:text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500"
          >
            Planet Q Games
          </animated.h1>
          
          <animated.p 
            style={subtitleProps} 
            className="text-2xl md:text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300 mb-8"
          >
            Next-Gen Gaming Experience
          </animated.p>
          
          <div className="w-24 h-2 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full mb-8"></div>
          
          <animated.p 
            style={subtitleProps}
            className="text-xl md:text-2xl font-medium text-gray-300 mb-12 max-w-3xl mx-auto"
          >
            Crafting immersive worlds and unforgettable adventures
          </animated.p>
        </div>
        <animated.div 
          style={imageProps}
          className="relative group"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-70 group-hover:opacity-100 blur-xl transition duration-500 group-hover:duration-200"></div>
          <div className="relative overflow-hidden">
            <Player userVideos={videos} />
          </div>
        </animated.div>
        {/* <animated.div 
          style={imageProps}
          className="relative group"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-70 group-hover:opacity-100 blur-xl transition duration-500 group-hover:duration-200"></div>
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-1 rounded-2xl overflow-hidden">
            <Image
              src="/images/video-game.png"
              alt="Game in Development"
              width={800}
              height={450}
              className="rounded-xl w-full h-auto border-2 border-gray-700/50"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
              <div className="text-left">
                <h3 className="text-2xl font-bold text-white">New Adventure Awaits</h3>
                <p className="text-gray-300">Coming 2025</p>
              </div>
            </div>
          </div>
        </animated.div> */}

        <animated.div 
          style={pulseAnimation}
          className="mt-16 inline-block"
        >
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-purple-500/20">
            Notify Me When It's Ready
          </button>
        </animated.div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {gridItems.map((item, index) => (
            <animated.div 
              key={index}
              style={{
                ...gridAnimations,
                transitionDelay: `${index * 100}ms`
              }}
              className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800 hover:border-purple-500/30 transition-colors"
            >
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </animated.div>
          ))}
        </div>

        <p className="mt-20 text-gray-500 text-sm">
          &copy; 2025 Planet Q Games. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default PlanetQGamesPage;