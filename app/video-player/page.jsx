"use client";

import React, { useState } from 'react';
import MusicPlayer from '@/components/planetqproductioncomp/musicplayer';
import StarsWrapper from '@/components/canvas/StarsWrapper';
import { useSpring, animated } from 'react-spring';

const VideoPlayerPage = () => {
  const [videoLink, setVideoLink] = useState('');
  const [initialVideoLink, setInitialVideoLink] = useState("https://youtu.be/I5uiP9ogijs?si=O33QCOnUKp-Y7eHG");

  const handleInputChange = (e) => {
    setVideoLink(e.target.value);
  };

  const handleSetVideo = () => {
    setInitialVideoLink(videoLink);
  };

  const props = useSpring({
    from: { opacity: 0, transform: 'translateY(50px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { mass: 1, tension: 120, friction: 14 },
  });

  return (
    <div className="relative min-h-screen flex flex-col bg-[#050816] items-center justify-center p-4 overflow-hidden">
      <StarsWrapper />
      <animated.div style={props} className="relative z-10 bg-[#050816] p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h1 className="text-4xl font-extrabold mb-6 text-white text-center">Video Player</h1>

        {initialVideoLink && (
          <div className="mb-8">
            <MusicPlayer initialVideoLink={initialVideoLink} />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Enter video link (e.g., YouTube URL)"
            className="flex-grow p-3 rounded-md border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={videoLink}
            onChange={handleInputChange}
          />
          <button
            onClick={handleSetVideo}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:bg-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            Load Video
          </button>
        </div>

        {!initialVideoLink && (
          <p className="text-center text-gray-400 text-lg mt-4">Enter a video link above to load the player.</p>
        )}
      </animated.div>
    </div>
  );
};

export default VideoPlayerPage;