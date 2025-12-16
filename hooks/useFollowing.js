import { useState, useEffect, useCallback } from 'react';

const useFollowing = (userId, type) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFollowData = useCallback(async () => {
    if (!userId || (type !== 'followers' && type !== 'following')) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/user/follow?userId=${userId}&type=${type}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, type]);

  useEffect(() => {
    fetchFollowData();
  }, [fetchFollowData]);

  return { data, isLoading, error, refetch: fetchFollowData };
};

export default useFollowing;
