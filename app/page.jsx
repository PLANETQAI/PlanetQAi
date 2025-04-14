"use client";

import React, { useState } from "react";
import Image from "next/image";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import Link from "next/link";
import StarsCanvas from "@/components/canvas/stars";
import CircleTypeText from "@/components/circleTypeText";
import { cn } from "@/lib/utils";

const RootPage = () => {
  const [isClicked, setIsClicked] = useState(false);
  var settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
  };
  return (
    <div className="w-full overflow-y-scroll min-h-screen h-full relative">
      <div
        className="min-h-screen flex flex-col justify-center items-center bg-[#050816] top-0 relative z-10 p-4 sm:p-8 md:p-12 lg:p-20 overflow-y-scroll"
        onClick={() => setIsClicked(!isClicked)}
      >
        <CircleTypeText
          text={"Tap Anywhere"}
          className={
            "absolute top-6 sm:top-10 z-50 text-white text-xl animate-bounce right-24 left-1/2 -translate-x-[50%]"
          }
        />
        <StarsCanvas />

        {/* Main content container with fixed width constraints */}
        <div className="w-full max-w-md mx-auto overflow-hidden px-4! absolute top-[20%] left-1/2 -translate-x-1/2 z-20">
          {/* First view - Radio player */}
          <div
            className={cn(
              "flex justify-center items-center flex-col sm:w-full transition-all duration-500 overflow-hidden",
              isClicked ? "translate-x-[200%]" : "translate-x-0"
            )}
          >
            {/* Top section with radio circles and chat link */}
            <div
              className="flex items-center justify-between px-2! sm:px-4 py-4 sm:py-6 w-full rounded-t-lg"
              style={{
                backgroundColor: "rgb(31 41 55 / 0.9)",
              }}
            >
              {/* Left Radio Circle */}
              <div className="relative w-16 sm:w-20 md:w-24 aspect-square overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
                  <video
                    autoPlay
                    loop
                    muted
                    className="w-[150%] h-auto object-cover rounded-full"
                  >
                    <source src="/images/anicircle.mp4" type="video/mp4" />
                  </video>
                  <Image
                    src="/images/radio1.jpeg"
                    alt="Radio Left"
                    width={100}
                    height={100}
                    className="absolute p-1 sm:p-2 rounded-full"
                  />
                </div>
              </div>

              {/* Center Chat Link - Responsive sizing */}
              <Link
                href={"/chat"}
                className="rounded-full overflow-hidden aspect-square flex justify-center items-center w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 hover:shadow-[0_0_15px_rgba(0,300,300,0.8)] hover:cursor-pointer mx-2"
              >
                <video
                  loop
                  autoPlay
                  muted
                  className="rounded-full w-full h-full object-cover"
                >
                  <source src="/videos/Planet-q-Chatbox.mp4" type="video/mp4" />
                </video>
              </Link>

              {/* Right Radio Circle */}
              <div className="relative w-16 sm:w-20 md:w-24 aspect-square overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
                  <video
                    autoPlay
                    loop
                    muted
                    className="w-[150%] h-auto object-cover rounded-full"
                  >
                    <source src="/images/anicircle.mp4" type="video/mp4" />
                  </video>
                  <Image
                    src="/images/radio1.jpeg"
                    alt="Radio Right"
                    width={100}
                    height={100}
                    className="absolute p-1 sm:p-2 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Background Video - Fixed aspect ratio container */}
            <div
              className="relative w-full"
              style={{ paddingBottom: "56.25%" }}
            >
              <video
                src="/images/bg-video-compressed.mp4"
                className="absolute top-0 left-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
              ></video>
            </div>

            {/* Radio Player */}
            <div className="bg-gray-800 w-full rounded-b-lg p-2! sm:p-3">
              <iframe
                src="https://radio.planetqproductions.com/public/planetq/embed?theme=dark&autoplay=true"
                frameBorder="0"
                allowtransparency="true"
                style={{
                  width: "100%",
                  height: "130px",
                  border: "0",
                }}
                title="Radio Planet Q"
                allow="autoplay; encrypted-media"
              ></iframe>
            </div>
          </div>

          {/* Second view - Links grid - Fixed for mobile */}
          <div
            className={cn(
              "w-full transition-all duration-500 text-white absolute top-1/2 left-0 -translate-y-1/2 flex flex-col  justify-center items-center",
              !isClicked ? "-translate-x-[200%]" : "translate-x-0"
            )}
          >
            <Slider
              {...settings}
              className="w-full max-w-[20rem] sm:max-w-xs mx-auto custom-dots"
            >
              <Link
                href={
                  "https://planetqproductions.wixsite.com/planet-q-productions/faqs"
                }
                className="p-1"
              >
                <div className="group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all">
                  <div className="text-[#afafaf] text-xs sm:text-sm md:text-lg font-semibold p-1 sm:p-2 mb-1 sm:mb-2 text-center group-hover:animate-vibrate">
                    <h1 className="text-xl">Planet Q Radio</h1>
                  </div>
                  <video
                    src="/videos/V_left-compressed.mp4"
                    autoPlay
                    muted
                    loop
                    className="w-full h-auto rounded-lg"
                  ></video>
                </div>
              </Link>
              <Link href={"/my-studio"} className="p-1">
                <div className="group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all">
                  <div className="text-[#afafaf] text-xs sm:text-sm md:text-lg font-semibold p-1 sm:p-2 mb-1 sm:mb-2 text-center group-hover:animate-vibrate">
                    <h1 className="text-xl">Planet Q Productions</h1>
                  </div>
                  <Image
                    src="/images/V_center.jpg"
                    alt="Planet Q Productions"
                    width={300}
                    height={200}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </Link>
              <Link href={"/aistudio"} className="p-1">
                <div className="group bg-[#17101d9c] rounded-lg p-2 sm:p-3 hover:bg-[#17101db3] transition-all col-span-1 xs:col-span-2 sm:col-span-1 mx-auto w-full sm:w-auto">
                  <div className="text-[#afafaf] text-xs sm:text-sm md:text-lg font-semibold p-1 sm:p-2 mb-1 sm:mb-2 text-center group-hover:animate-vibrate">
                    <h1 className="text-xl">Q World Studios</h1>
                  </div>

                  <Image
                    src="/images/V_right.jpg"
                    alt="Q World Studios"
                    width={300}
                    height={200}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </Link>
            </Slider>
            <div className="px-4  mt-20 w-full">
              <Image
                src={"/images/robo.jpeg"}
                alt="hii"
                height={3000}
                width={3000}
                className="w-full h-auto max-w-xs mx-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RootPage;
