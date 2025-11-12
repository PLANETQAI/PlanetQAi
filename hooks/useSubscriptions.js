import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export function useSubscriptions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();


  const checkCredits = useCallback(async () => {
    try {
      const response = await fetch('/api/credits-api', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          throw new Error('Please log in to continue');
        }
        throw new Error('Failed to fetch credits');
      }

      const { credits } = await response.json();
      const SUBSCRIPTION_COST = 160;

      if (credits < SUBSCRIPTION_COST) {
        throw new Error(`Insufficient credits. You need ${SUBSCRIPTION_COST - credits} more credits to subscribe.`);
      }

      return true;
    } catch (err) {
      console.error('Credit check failed:', err);
      setError(err.message);
      return false;
    }
  }, [router]);

  // Get current user's subscription status
  const getSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/usersubscription', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          throw new Error('Please log in to view subscription');
        }
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to get subscription:', err);
      setError(err.message);
      return { hasActiveSubscription: false, subscription: null };
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Get all available subscription plans
  const getSubscriptionPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/usersubscription?type=plans', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }

      const { plans } = await response.json();
      return plans || [];
    } catch (err) {
      console.error('Failed to get subscription plans:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create or renew a subscription
  const createSubscription = useCallback(async (planId) => {
    setIsLoading(true);
    setError(null);

    try {
      // First check if user has enough credits
      const hasEnoughCredits = await checkCredits();
      if (!hasEnoughCredits) {
        throw new Error('Insufficient credits for subscription');
      }

      const response = await fetch('/api/usersubscription', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Refresh the page to update UI
      router.refresh();
      return data;
    } catch (err) {
      console.error('Failed to create subscription:', err);
      setError(err.message);
      throw err; // Re-throw to allow handling in the component
    } finally {
      setIsLoading(false);
    }
  }, [checkCredits, router]);

  // Cancel a subscription
  const cancelSubscription = useCallback(async (subscriptionId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/usersubscription?id=${subscriptionId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      // Refresh the page to update UI
      router.refresh();
      return data;
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      setError(err.message);
      throw err; // Re-throw to allow handling in the component
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return {
    isLoading,
    error,
    clearError: () => setError(null),
    getSubscription,
    getSubscriptionPlans,
    createSubscription,
    cancelSubscription,
    checkCredits
  };
}

export default useSubscriptions;
