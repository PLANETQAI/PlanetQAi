// app/video-player/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import StarsWrapper from "@/components/canvas/StarsWrapper";
import classes from "../../components/planetqproductioncomp/musicplayer.module.css";
import { useSpring, animated } from "react-spring";
import Player from "../my-studio/player";
import { getVideos } from "@/actions/videoActions";
import Image from "next/image";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

const VideoPlayerPage = () => {
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

  const [props] = useSpring(
    () => ({
      from: { opacity: 0, transform: "translateY(20px)" },
      to: { opacity: 1, transform: "translateY(0)" },
      config: { tension: 280, friction: 60 },
    }),
    []
  );

  if (loading) {
    return <div className="w-full flex h-screen justify-center items-center">
      <Image
        src={'/images/loader.webp'}
        width={100}
        height={100}
        alt="loader"
        unoptimized
        className="w-full h-full max-h-svh object-cover"
      />
    </div>;
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#050816] items-center justify-center p-4 overflow-hidden">
      <StarsWrapper />
      <animated.div
        style={props}
        className="relative z-10 bg-[#050816] p-4 sm:p-8 rounded-lg shadow-lg max-w-2xl w-full mx-4"
      >
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 text-white text-center">
          Video Player
        </h1>

        <div className="w-full flex justify-center items-center mt-20">
          <Player userVideos={videos} />
        </div>
      </animated.div>
    </div>
  );
};

export default VideoPlayerPage;