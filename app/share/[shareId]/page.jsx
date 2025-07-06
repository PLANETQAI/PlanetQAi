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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-white">Loading playlist...</div>
        </div>
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
