'use client'

import { useState, useEffect } from 'react';
import FuturisticMusicPlayer from '@/components/FuturisticMusicPlayer';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import GlobalHeader from '@/components/planetqproductioncomp/GlobalHeader';

const SharedSongsPage = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const { shareId } = useParams();
  const router = useRouter();
  
  // Handle session loading state
  const isSessionLoading = status === 'loading';

  useEffect(() => {
    const fetchSharedSongs = async () => {
      if (!shareId) {
        console.error('No share ID provided');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching shared songs for ID:', shareId);
        const response = await fetch(`/api/share/${shareId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          cache: 'no-store',
        });
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error(`Unexpected response format: ${contentType}`);
        }
        
        const data = await response.json();
        console.log('API response for share link:', data);
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch shared songs');
        }
        
        // Handle different response structures
        let songsData = [];
        if (Array.isArray(data.songs)) {
          songsData = data.songs.map(s => s.song || s);
        } else if (data.songs && Array.isArray(data.songs.songs)) {
          songsData = data.songs.songs.map(s => s.song || s);
        } else if (Array.isArray(data)) {
          songsData = data;
        }
        
        console.log('Processed songs data:', songsData);
        
        if (songsData.length === 0) {
          console.warn('No songs found in the shared playlist');
        }
        
        setSongs(songsData);
      } catch (error) {
        console.error('Failed to fetch shared songs:', error);
        // You might want to set an error state to show to the user
      } finally {
        setLoading(false);
      }
    };

    fetchSharedSongs();
  }, [shareId]);

  if (isSessionLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black">
        <div className="flex flex-col items-center justify-center min-h-screen space-y-8">
          <div className="relative w-40 h-40 perspective-1000">
            {/* 3D Vinyl Record */}
            <div className="absolute w-full h-full rounded-full border-4 border-purple-500/30 bg-gradient-to-br from-purple-900/50 to-gray-900/90 shadow-2xl shadow-purple-500/20 animate-spin-slow">
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 border-2 border-purple-500/50"></div>
              </div>
              {/* Record grooves */}
              <div className="absolute inset-0 rounded-full border-2 border-purple-500/10"></div>
              <div className="absolute inset-2 rounded-full border-2 border-purple-500/10"></div>
              <div className="absolute inset-4 rounded-full border-2 border-purple-500/10"></div>
            </div>
            
            {/* 3D Needle */}
            <div className="absolute top-0 left-1/2 w-1 h-16 bg-gradient-to-b from-gray-400 to-gray-600 transform -translate-x-1/2 origin-bottom rotate-12 z-10">
              <div className="absolute -bottom-1 left-1/2 w-3 h-3 rounded-full bg-purple-500 transform -translate-x-1/2"></div>
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">Loading Your Playlist</h2>
            <p className="text-purple-200/70 text-sm">Preparing your musical journey...</p>
          </div>
          
          {/* Pulsing dots */}
          <div className="flex space-x-2">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i}
                className="w-3 h-3 rounded-full bg-purple-500 animate-bounce"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1s',
                  animationIterationCount: 'infinite'
                }}
              />
            ))}
          </div>
        </div>
        
        <style jsx global>{`
          @keyframes spin-slow {
            0% { transform: rotateY(0deg) rotate(0deg); }
            100% { transform: rotateY(360deg) rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 4s linear infinite;
            transform-style: preserve-3d;
          }
          .perspective-1000 {
            perspective: 1000px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <GlobalHeader session={session} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Shared Playlist</h1>
          {!session && (
            <p className="text-gray-400">
              Sign in to create and share your own playlists
            </p>
          )}
        </div>
        <FuturisticMusicPlayer 
          songs={songs} 
          isPublic={true} 
          showShareButton={!!session} // Only show share button if logged in
        />
      </div>
    </div>
  );
};

export default SharedSongsPage;
