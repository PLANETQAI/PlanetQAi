"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

// Example beats data (replace with your actual data)
const beats = [
  {
    id: 1,
    title: "Neon Skyline",
    cover: "/images/radio/cover1.jpg",
    price: 19.99,
    description: "Sci-fi inspired hip hop beat with futuristic synths.",
  },
  {
    id: 2,
    title: "Galactic Flow",
    cover: "/images/radio/cover2.jpg",
    price: 24.99,
    description: "Spacey trap beat with cosmic vibes.",
  },
  {
    id: 3,
    title: "Quantum Dreams",
    cover: "/images/radio/cover3.jpg",
    price: 29.99,
    description: "Dreamy hip hop with futuristic melodies.",
  },
];

const FuturisticHipHopBeats = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900 text-white font-sans">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-lg">
            Futuristic Hip Hop Beats
          </h1>
          <p className="text-lg text-gray-300 mb-2">
            The Sci Fi Channel Of Hip Hop and R&B
          </p>
          <p className="text-md text-gray-400">
            All songs come with album art, MP3 and WAV files.
          </p>
        </div>

        {/* Beats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-16">
          {beats.map((beat) => (
            <div
              key={beat.id}
              className="bg-gray-900/80 rounded-2xl shadow-lg p-6 flex flex-col items-center"
            >
              <Image
                src={beat.cover}
                alt={beat.title}
                width={220}
                height={220}
                className="rounded-xl mb-4 shadow-md object-cover"
              />
              <h2 className="text-2xl font-bold mb-2 text-cyan-300 text-center">
                {beat.title}
              </h2>
              <p className="text-gray-400 text-center mb-4">
                {beat.description}
              </p>
              <div className="flex items-center justify-between w-full mt-auto">
                <span className="text-xl font-semibold text-purple-300">
                  ${beat.price}
                </span>
                {/* Stripe payment button placeholder */}
                <button
                  className="ml-4 px-5 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
                  onClick={() => {
                    /* Stripe payment logic here */
                  }}
                >
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Navigation */}
        <nav className="flex justify-center gap-8 border-t border-gray-800 pt-8 mt-8">
          <Link
            href="/radio/faqs"
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
            href="/radio/about"
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
            href="/radio/contact"
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
        <p className="text-center text-xs text-gray-500 mt-8">
          © 2025 Planet Q Productions
        </p>
      </div>
    </div>
  );
};

export default FuturisticHipHopBeats;
