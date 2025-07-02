"use client";

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { v4 as uuidv4 } from "uuid";
import { useSpring, animated } from 'react-spring';

// Dynamically import components with SSR disabled
const StarsWrapper = dynamic(
  () => import('@/components/canvas/StarsWrapper'),
  { ssr: false, loading: () => <div className="fixed inset-0 bg-black z-0" /> }
);

const Card = dynamic(
  () => import('@/components/carousel/Card'),
  { ssr: false }
);

const Carousel = dynamic(
  () => import('@/components/carousel/Carousel'),
  { ssr: false }
);

const MusicPlayer = dynamic(
  () => import('@/components/planetqproductioncomp/musicplayer'),
  { ssr: false }
);

const PlanetQRadioPage = () => {
  const [currentRadioStream, setCurrentRadioStream] = useState(null);

  const handleCardClick = (radioStreamLink) => {
    setCurrentRadioStream(radioStreamLink);
  };

  const cards = [
    {
      key: uuidv4(),
      content: (
        <Card
          imagen="/public/images/radio1.jpeg" // Example image for radio station
          videoLink="https://stream.radio.co/s022111111/listen" // Example radio stream link
          onCardClick={handleCardClick}
        />
      )
    },
    {
      key: uuidv4(),
      content: (
        <Card
          imagen="/public/images/radio1.jpeg" // Example image for radio station
          videoLink="https://stream.radio.co/s022111111/listen" // Example radio stream link
          onCardClick={handleCardClick}
        />
      )
    },
    {
      key: uuidv4(),
      content: (
        <Card
          imagen="/public/images/radio1.jpeg" // Example image for radio station
          videoLink="https://stream.radio.co/s022111111/listen" // Example radio stream link
          onCardClick={handleCardClick}
        />
      )
    },
    {
      key: uuidv4(),
      content: (
        <Card
          imagen="/public/images/radio1.jpeg" // Example image for radio station
          videoLink="https://stream.radio.co/s022111111/listen" // Example radio stream link
          onCardClick={handleCardClick}
        />
      )
    },
    {
      key: uuidv4(),
      content: (
        <Card
          imagen="/public/images/radio1.jpeg" // Example image for radio station
          videoLink="https://stream.radio.co/s022111111/listen" // Example radio stream link
          onCardClick={handleCardClick}
        />
      )
    }
  ];

  const props = useSpring({
    from: { opacity: 0, transform: 'translateY(50px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { mass: 1, tension: 120, friction: 14 },
  });

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      <StarsWrapper />
      <animated.div style={props} className="relative z-10 bg-black bg-opacity-70 p-8 rounded-lg shadow-lg max-w-4xl w-full text-white text-center">
        <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 animate-pulse">
          Planet Q Radio
        </h1>
        <p className="text-2xl mb-8 font-semibold text-gray-300">
          Tune In: Your Universe of Sound
        </p>

        {currentRadioStream ? (
          <div className="mt-8 w-full aspect-video relative">
            <button
              onClick={() => setCurrentRadioStream(null)}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-full z-20"
            >
              X
            </button>
            <MusicPlayer initialVideoLink={currentRadioStream} />
          </div>
        ) : (
          <div className="mt-8 w-full flex justify-center">
            <Carousel
              cards={cards}
              height="500px"
              width="80%"
              margin="0 auto"
              offset={2}
              showArrows={false}
            />
          </div>
        )}

        <p className="text-lg mt-12 text-gray-400">
          &copy; 2025 Planet Q. All rights reserved.
        </p>
      </animated.div>
    </div>
  );
};

export default PlanetQRadioPage;