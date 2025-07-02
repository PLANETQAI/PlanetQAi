"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from "react";
import { config } from "react-spring";

// Dynamically import the 3D carousel with SSR disabled
const DynamicCarousel = dynamic(
  () => import('react-spring-3d-carousel').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center">Loading carousel...</div>
  }
);

export default function Carroussel(props) {
  const [goToSlide, setGoToSlide] = useState(0);
  const [offsetRadius, setOffsetRadius] = useState(3);
  const [showArrows, setShowArrows] = useState(false);
  const [cards] = useState(
    props.cards.map((element) => {
      return { ...element };
    })
  );

  useEffect(() => {
    setOffsetRadius(props.offset);
    setShowArrows(props.showArrows);
  }, [props.offset, props.showArrows]);

  const handleCarouselClick = (event) => {
    if (!event.target.closest('.card')) {
      setGoToSlide((prevGoToSlide) => (prevGoToSlide + 1) % cards.length);
    }
  };

  // Debounce function for scroll
  const debounce = (func, delay) => {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  };

  const handleScroll = useCallback(debounce((event) => {
    if (event.deltaY > 0) {
      // Scroll down, go to next slide
      setGoToSlide((prevGoToSlide) => (prevGoToSlide + 1) % cards.length);
    } else {
      // Scroll up, go to previous slide
      setGoToSlide((prevGoToSlide) => (prevGoToSlide - 1 + cards.length) % cards.length);
    }
  }, 100), [cards.length]); // Debounce for 100ms

  return (
    <div
      style={{ width: props.width, height: props.height, margin: props.margin }}
      onClick={handleCarouselClick}
      onWheel={handleScroll} // Add scroll event listener
      className="relative"
    >
      {typeof window !== 'undefined' && (
        <DynamicCarousel
          slides={cards}
          goToSlide={goToSlide}
          offsetRadius={offsetRadius}
          showNavigation={showArrows}
          animationConfig={config.gentle}
        />
      )}
      {/* Indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-20">
        {cards.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full ${goToSlide === index ? 'bg-blue-500' : 'bg-gray-400'} focus:outline-none`}
            onClick={() => setGoToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}
