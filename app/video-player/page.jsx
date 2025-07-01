"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import StarsWrapper from '@/components/canvas/StarsWrapper';
import { useSpring, animated } from 'react-spring';

// Dynamically import MusicPlayer with no SSR
const MusicPlayer = dynamic(
  () => import('@/components/planetqproductioncomp/musicplayer'),
  { ssr: false }
);

const VideoPlayerPage = () => {
  const [videoLink, setVideoLink] = useState('');
  const [initialVideoLink, setInitialVideoLink] = useState(
    "https://youtu.be/I5uiP9ogijs?si=O33QCOnUKp-Y7eHG"
  );
  const [isClient, setIsClient] = useState(false);
  const playerRef = useRef(null);

  // Set isClient to true after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleInputChange = useCallback((e) => {
    setVideoLink(e.target.value);
  }, []);

  const handleSetVideo = useCallback((e) => {
    e.preventDefault();
    if (videoLink.trim()) {
      setInitialVideoLink(videoLink.trim());
    }
  }, [videoLink]);

  const props = useSpring({
    from: { opacity: 0, transform: 'translateY(50px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { mass: 1, tension: 120, friction: 14 },
  });

  return (
    <div className="relative min-h-screen flex flex-col bg-[#050816] items-center justify-center p-4 overflow-hidden">
      <StarsWrapper />
      <animated.div style={props} className="relative z-10 bg-[#050816] p-4 sm:p-8 rounded-lg shadow-lg max-w-2xl w-full mx-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 text-white text-center">Video Player</h1>

        {isClient && initialVideoLink && (
          <div className="mb-8 w-full">
            <MusicPlayer 
              ref={playerRef}
              initialVideoLink={initialVideoLink} 
              key={initialVideoLink} // Force re-render when video changes
            />
          </div>
        )}

        <form onSubmit={handleSetVideo} className="w-full">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <input
              type="url"
              placeholder="Enter video link (e.g., YouTube URL)"
              className="flex-grow p-3 rounded-md border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={videoLink}
              onChange={handleInputChange}
              required
              pattern="https?://.+"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Load Video
          </button>
        </div>

        {!initialVideoLink && (
          <p className="text-center text-gray-400 text-lg mt-4">Enter a video link above to load the player.</p>
        )}
      </form>
        
        <div className="mt-4 text-center text-gray-400 text-sm">
          <p>Enter a YouTube URL to load a different video</p>
        </div>
      </animated.div>
    </div>
  );
};

export default VideoPlayerPage;