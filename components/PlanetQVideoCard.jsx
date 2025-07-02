"use client";

import Image from "next/image";

export default function PlanetQVideoCard({ onClick }) {
  return (
    <div className="p-1 block" onClick={onClick}>
      <div
        className="group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all"
      >
        <div className="text-[#afafaf] text-xs sm:text-sm md:text-lg font-semibold p-1 sm:p-2 mb-1 sm:mb-2 text-center group-hover:animate-vibrate">
          <h1 className="text-xl">Planet Q Video</h1>
        </div>
        <div className="relative w-full">
          {/* <video
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            controls
            poster="/images/client.png"
          >
            <source src="/images/bg-video-compressed.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video> */}
        
            <Image
              src="/images/video-player1.jpg"
              alt="Planet Q Games"
              width={300}
              height={200}
              className="w-full  rounded-lg"
            />
                
        </div>
      </div>
    </div>
  );
}
