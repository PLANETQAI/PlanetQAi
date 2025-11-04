'use client';

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export const useMedia = (type = 'video') => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/media?type=${type}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch media');
      }
      
      const data = await response.json();
      setMedia(data.data || []);
      return data.data || [];
    } catch (err) {
      console.error('Error fetching media:', err);
      setError(err.message || 'Failed to load media');
      toast.error('Failed to load media');
      return [];
    } finally {
      setLoading(false);
    }
  }, [type]);

  const deleteMedia = async (mediaId) => {
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete media');
      }
      
      // Update local state
      setMedia(prev => prev.filter(item => item.id !== mediaId));
      toast.success('Media deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting media:', err);
      toast.error('Failed to delete media');
      return false;
    }
  };

  return {
    media,
    loading,
    error,
    fetchMedia,
    deleteMedia,
  };
};
