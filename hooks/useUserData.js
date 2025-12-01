// hooks/useUserData.js
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';


export function useUserData(redirectTo = null) {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    const fetchUserData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/user/me');
            
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            
            const data = await response.json();
            setUserData(data.user);
            setError(null);
            return data.user;
        } catch (err) {
            console.error('Error fetching user data:', err);
            setError(err.message);
            toast.error('Failed to load user data');
            router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const updateUserCredits = async (newCredits) => {
        if (!userData) return;
        setUserData(prev => ({
            ...prev,
            credits: newCredits
        }));
    };

    // Fetch user data on mount
    useEffect(() => {
        fetchUserData();
    }, []);

    return {
        userData,
        isLoading,
        error,
        refreshUserData: fetchUserData,
        updateUserCredits
    };
}