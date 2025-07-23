"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Here's the links I have two links

// https://open.spotify.com/artist/5AWlrst9quIeaE4VWSvOVA?si=6xNMoWV1TiiH-b_0aOKM-g

// https://open.spotify.com/artist/2QAFHW7dvr7EbnlPY7PDbq?si=MHsK33YHSOunJfxS2GnUkQ

// List of Spotify playlist or track embed URLs
const spotifyEmbeds = [
  {
    title: "Today's Hits",
    url: "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator",
  },
  {
    title: "Chill Vibes",
    url: "https://open.spotify.com/embed/playlist/37i9dQZF1DX4WYpdgoIcn6?utm_source=generator",
  },
  {
    title: "Electronic Mix",
    url: "https://open.spotify.com/embed/playlist/37i9dQZF1DX8FwnYE6PRvL?utm_source=generator",
  },
];

// Background pattern component
const BackgroundPattern = () => (
  <div className="fixed inset-0 overflow-hidden -z-10">
    <div className="absolute inset-0 bg-[#0a0a1a] opacity-90">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>
    </div>
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5"></div>
  </div>
);

// Track Card Component
const TrackCard = ({ track, isActive, onPlay, isPlaying }) => (
  <div
    className="group relative bg-gray-900/50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer"
    onClick={onPlay}
  >
    <div className="relative aspect-square">
      <Image
        src={track.cover}
        alt={track.title}
        width={300}
        height={300}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center transform hover:scale-110 transition-transform">
          {isActive && isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-medium text-white">{track.title}</h3>
      <p className="text-sm text-gray-400">{track.artist}</p>
    </div>
  </div>
);

// Icons
const PlayIcon = () => (
  <svg
    className="w-5 h-5 ml-0.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
    />
  </svg>
);

const PauseIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const NextIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
    />
  </svg>
);

const PreviousIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
    />
  </svg>
);

const RadioPage = () => {
  // Modern radio page with multiple Spotify embeds
const router = useRouter();
  return (
    <div className="min-h-screen text-white relative overflow-x-hidden font-sans">
      <BackgroundPattern />
      {/* Glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-cyan-500/5 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/5 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-lg">
          PlanetQ Radio
        </h1>
        <p className="text-center text-lg text-gray-300 mb-10">
          Enjoy curated Spotify playlists and tracks. Click play and vibe out!
        </p>
  
        <div className="flex justify-center items-center">
          <p className="text-center text-lg text-gray-300 mb-10">Do you want to have a full album?</p>
          <button className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-2 px-4 rounded-full hover:opacity-90" onClick={() => router.push('/productions/contact')}>
            Check Other users Albums
          </button>
        </div>

        <div className="space-y-10">
          {spotifyEmbeds.map((embed, idx) => (
            <div
              key={idx}
              className="bg-gray-900/70 rounded-2xl shadow-lg p-6 flex flex-col items-center"
            >
              <h2 className="text-2xl font-bold mb-4 text-cyan-300 text-center">
                {embed.title}
              </h2>
              <div className="w-full flex justify-center">
                <iframe
                  src={embed.url}
                  width="100%"
                  height="800"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                  loading="lazy"
                  className="rounded-xl border-none shadow-xl"
                  title={embed.title}
                  style={{ minWidth: 250, maxWidth: 700 }}
                ></iframe>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <nav className="flex justify-center gap-8 border-t border-gray-800 pt-10 mt-16">
          <Link
            href="/productions/faqs"
            className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center group text-lg"
          >
            <span className="mr-1.5">FAQs</span>
            <svg
              className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
          <Link
            href="/productions/about"
            className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center group text-lg"
          >
            <span className="mr-1.5">About</span>
            <svg
              className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
          <Link
            href="/productions/contact"
            className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center group text-lg"
          >
            <span className="mr-1.5">Contact</span>
            <svg
              className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default RadioPage;
