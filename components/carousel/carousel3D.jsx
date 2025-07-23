"use client";

import { useEffect, useRef } from "react";


const Carousel3D = ({ children }) => {
  const carouselRef = useRef(null);

  useEffect(() => {
    const scroll = () => {
      if (!carouselRef.current) return;
      const container = carouselRef.current;
      container.scrollBy({ left: 400, behavior: "smooth" });
    };

    const interval = setInterval(scroll, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden w-full">
      <div
        ref={carouselRef}
        className="flex space-x-6 overflow-x-auto scroll-smooth snap-x snap-mandatory px-6 py-10"
      >
        {children}
      </div>
    </div>
  );
};

export default Carousel3D;
