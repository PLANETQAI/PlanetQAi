'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import components with SSR disabled
const StarsWrapper = dynamic(
  () => import('@/components/canvas/StarsWrapper'),
  { ssr: false, loading: () => <div className="fixed inset-0 bg-black z-0" /> }
);

const RadioPage = () => {
  const [currentStation, setCurrentStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Sample radio stations data
  const radioStations = [
    {
      id: 1,
      name: 'Cosmic Beats',
      genre: 'Electronic',
      listeners: '1.2K',
      image: '/images/radio/cosmic-beats.jpg',
      streamUrl: 'https://example.com/stream1'
    },
    {
      id: 2,
      name: 'Neon Waves',
      genre: 'Synthwave',
      listeners: '856',
      image: '/images/radio/neon-waves.jpg',
      streamUrl: 'https://example.com/stream2'
    },
    {
      id: 3,
      name: 'Galaxy Hip-Hop',
      genre: 'Hip-Hop',
      listeners: '2.4K',
      image: '/images/radio/galaxy-hiphop.jpg',
      streamUrl: 'https://example.com/stream3'
    },
    {
      id: 4,
      name: 'Quantum Jazz',
      genre: 'Jazz Fusion',
      listeners: '512',
      image: '/images/radio/quantum-jazz.jpg',
      streamUrl: 'https://example.com/stream4'
    },
  ];

  const handleStationSelect = (station) => {
    setCurrentStation(station);
    setIsPlaying(true);
    // Here you would typically connect to the actual radio stream
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    // Here you would control the audio playback
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <StarsWrapper />
      
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 
            className="text-5xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600"
          >
            Planet Q Radio
          </h1>
          <p className="text-xl text-gray-300">The Sci-Fi Channel of Hip Hop and R&B</p>
        </motion.div>

        {/* Now Playing */}
        {currentStation && (
          <motion.div 
            className="bg-gray-900 bg-opacity-70 backdrop-blur-md rounded-xl p-6 mb-12 border border-cyan-500 border-opacity-30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-4 text-cyan-400">Now Playing</h2>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-32 h-32 bg-gray-800 rounded-lg overflow-hidden">
                <img 
                  src={currentStation.image} 
                  alt={currentStation.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{currentStation.name}</h3>
                <p className="text-gray-400 mb-4">{currentStation.genre} • {currentStation.listeners} listeners</p>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={togglePlayPause}
                    className="w-12 h-12 rounded-full bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center transition-all"
                  >
                    {isPlaying ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 bg-gray-800 rounded-full h-2">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Radio Stations Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {radioStations.map((station) => (
            <motion.div
              key={station.id}
              className={`bg-gray-900 bg-opacity-70 backdrop-blur-md rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                currentStation?.id === station.id 
                  ? 'border-cyan-500 scale-105 shadow-lg shadow-cyan-500/20' 
                  : 'border-gray-800 hover:border-cyan-400/50 hover:scale-102'
              }`}
              whileHover={{ y: -5 }}
              onClick={() => handleStationSelect(station)}
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-800 overflow-hidden">
                <img 
                  src={station.image} 
                  alt={station.name}
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold mb-1">{station.name}</h3>
                <p className="text-gray-400 text-sm mb-3">{station.genre}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-cyan-400">{station.listeners} listeners</span>
                  <span className="text-xs px-2 py-1 bg-cyan-900 bg-opacity-50 text-cyan-300 rounded-full">
                    {currentStation?.id === station.id ? (isPlaying ? 'LIVE' : 'PAUSED') : 'PLAY'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Navigation */}
        <nav className="mt-16 flex justify-center gap-8">
          <a href="/radio/faqs" className="text-gray-300 hover:text-cyan-400 transition-colors">FAQs</a>
          <a href="/radio/about" className="text-gray-300 hover:text-cyan-400 transition-colors">About</a>
          <a href="/radio/contact" className="text-gray-300 hover:text-cyan-400 transition-colors">Contact</a>
        </nav>
      </div>
    </div>
  );
};

export default RadioPage;
