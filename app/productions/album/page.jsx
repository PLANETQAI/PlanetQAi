"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import AudioPlayer from "../_components/AudioPlayer";

const BeatCard = ({ beat, isPurchased, purchasingId, onPurchase, purchaseError }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-gray-900/80 rounded-2xl shadow-lg p-6 flex flex-col items-center">
      <div className="relative w-full aspect-square mb-4 group">
      <Image
        src={imgError ? "/images/small.webp" : beat.thumbnailUrl || "/images/small.webp"}
        alt={beat.title}
        fill
        className="rounded-xl shadow-md object-cover"

      />

<AudioPlayer audioUrl={beat.audioUrl} />

      </div>
      <h2 className="text-2xl font-bold mb-2 text-cyan-300 text-center">
        {beat.title}
      </h2>
      <p className="text-gray-400 text-center mb-4">
        {beat.prompt || "No description."}
      </p>
      <div className="flex flex-col w-full space-y-2">
        <span className="text-xl font-semibold text-purple-300 text-center">
          ${beat.price?.toFixed(2) || "2.00"}
        </span>
        <button
          onClick={() => router.push(`/productions/purchase/${beat.id}`)}
          className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-full hover:opacity-90"
        >
          {isPurchased ? "Purchased" : "Buy Now"}
        </button>
      </div>
    </div>
  );
};

const FuturisticHipHopBeats = () => {
  const [beats, setBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchasingId, setPurchasingId] = useState(null);
  const [purchaseError, setPurchaseError] = useState(null);
  const [purchasedSongs, setPurchasedSongs] = useState([]);
  const { data: session, status } = useSession();
 

  const handlePurchase = useCallback(async (id) => {
    // Check authentication status
  // Check if we have a valid session
  if (!session) {
    // Redirect to sign in with a callback URL to return here after login
    signIn(undefined, { callbackUrl: '/productions/album' });
    return;
  }

  // If we're still loading the session, show a message
  if (status === 'loading') {
    setPurchaseError("Please wait, we're checking your session...");
    return;
  }

    setPurchaseError(null);
    setPurchasingId(id);
    
    try {
      // Get the selected beat
      const beatToPurchase = beats.find(beat => beat.id === id);
      if (!beatToPurchase) {
        throw new Error('Selected beat not found');
      }

      // Make the purchase request
      const res = await fetch("/api/song-purchase", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          // Include the session token if needed
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ 
          songId: id,
          price: beatToPurchase.creditsUsed || 1, // Default to 1 credit if not specified
          userId: session.user.id
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Purchase failed. Please try again.");
      }
      
      // Update the UI to show the purchase was successful
      setPurchasedSongs(prev => [...prev, id]);
      
      // Show success message (you might want to use a toast notification here)
      alert('Purchase successful! The song has been added to your library.');
      
    } catch (err) {
      console.error('Purchase error:', err);
      setPurchaseError(err.message || "An error occurred during purchase. Please try again.");
    } finally {
      setPurchasingId(null);
    }
  }, [status, session, signIn, beats]);

  useEffect(() => {
    async function fetchSongs() {
      try {
        const res = await fetch("/api/songs/public");
        const data = await res.json();
        console.log("Fetched songs:", data);
        setBeats(data.songs || []);
      } catch (err) {
        console.error("Error fetching songs:", err);
        setError("Failed to load beats. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchSongs();
  }, []);

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
        {loading ? (
          <div className="text-center text-cyan-300 py-16 text-xl">
            Loading beats...
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-16 text-lg">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-16">
            {beats.map((beat) => (
              <BeatCard
                key={beat.id}
                beat={beat}
                isPurchased={purchasedSongs.includes(beat.id)}
                purchasingId={purchasingId}
                purchaseError={purchaseError}
                onPurchase={handlePurchase}
              />
            ))}
          </div>
        )}
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
