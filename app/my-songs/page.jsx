'use client'

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import FuturisticMusicPlayer from '@/components/FuturisticMusicPlayer';
import GlobalHeader from '@/components/planetqproductioncomp/GlobalHeader';

const MySongsPage = () => {
  const { data: session } = useSession();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch('/api/songs');
        const data = await response.json();
        setSongs(data.songs);
      } catch (error) {
        console.error('Failed to fetch songs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  const handleShare = async (songsToShare) => {
    // Implement share functionality here
    console.log('Sharing songs:', songsToShare);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return <div>
    <GlobalHeader session={session} />
    <FuturisticMusicPlayer songs={songs} onShare={handleShare} userId={session?.user?.id} 
    />
    </div>
};

export default MySongsPage;
