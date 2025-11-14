// app/share/[shareId]/page.jsx
'use client';

import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SharedMediaPage() {
  const { shareId } = useParams();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSharedMedia = async () => {
      try {
        // The shareId is actually the media ID in this case
        const mediaId = shareId;
        
        if (!mediaId) {
          throw new Error('No media ID found in the URL');
        }

        // Try to fetch the media item directly
        const response = await fetch(`/api/media/${mediaId}`);
        if (!response.ok) {
          // If not found as regular media, try as video
          const videoResponse = await fetch(`/api/media/video/${mediaId}`);
          if (!videoResponse.ok) {
            throw new Error('Media not found');
          }
          const videoData = await videoResponse.json();
          setMedia([{ ...videoData, mediaType: 'video' }]);
        } else {
          const mediaData = await response.json();
          setMedia([{ ...mediaData, mediaType: 'image' }]);
        }
      } catch (err) {
        console.error('Error fetching shared media:', err);
        setError('Failed to load shared media. The link may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchSharedMedia();
    }
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // If no media is loaded, don't show anything (handled by loading/error states)
  if (media.length === 0) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
          {media[0].mediaType === 'video' ? (
            <div className="relative pt-[56.25%] bg-black">
              <video
                src={media[0].fileUrl}
                className="absolute inset-0 w-full h-full object-contain"
                controls
                autoPlay
                playsInline
                poster={media[0].thumbnailUrl}
              />
            </div>
          ) : (
            <div className="flex justify-center bg-black p-4">
              <img
                src={media[0].fileUrl}
                alt={media[0].title || 'Shared image'}
                className="max-h-[80vh] w-auto max-w-full object-contain"
              />
            </div>
          )}
          
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">
              {media[0].title || 'Shared Media'}
            </h1>
            {media[0].description && (
              <p className="text-gray-300 mb-4">{media[0].description}</p>
            )}
            <div className="flex items-center text-sm text-gray-400">
              <span>Shared on {new Date(media[0].createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}