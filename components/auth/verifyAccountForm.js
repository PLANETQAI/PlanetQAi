'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function VerifyAccountForm() {
  const [code, setCode] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoVerifying, setAutoVerifying] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get parameters from URL
    const userIdParam = searchParams.get('userId');
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    
    if (userIdParam) {
      setUserId(userIdParam);
    }
    
    if (emailParam) {
      setEmail(emailParam);
    }

    if (tokenParam) {
      setToken(tokenParam);
      // If we have a token and userId, auto-verify
      if (userIdParam) {
        setAutoVerifying(true);
        verifyWithToken(tokenParam, userIdParam);
      }
    }
  }, [searchParams]);

  // Function to verify account with token from email link
  const verifyWithToken = async (verificationToken, userIdValue) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/verify-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationToken,
          userId: userIdValue
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify account');
      }

      // If verification is successful
      toast.success('Account verified successfully!');
      
      // Redirect to the specified URL or default to aistudio
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        router.push('/aistudio');
      }
    } catch (error) {
      toast.error(error.message);
      setAutoVerifying(false); // Allow manual verification as fallback
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission with verification code
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          code: code.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify account');
      }

      toast.success('Account verified successfully!');
      
      // Redirect to the specified URL or default to aistudio
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        router.push('/aistudio');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // If we're auto-verifying with a token, show a different UI
  if (autoVerifying || (token && isLoading)) {
    return (
      <div className="bg-gray-800 py-8 px-6 shadow rounded-lg text-center">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-center">
            <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-medium text-white">Verifying Your Account</h3>
          <p className="text-gray-400">Please wait while we verify your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 py-8 px-6 shadow rounded-lg">
      {token && !isLoading && (
        <div className="mb-6 p-4 bg-yellow-800 bg-opacity-30 rounded-md">
          <p className="text-sm text-yellow-300">
            We couldn't automatically verify your account. Please enter the verification code sent to your email.  
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {email && (
          <div className="text-center mb-4">
            <p className="text-sm text-gray-300">
              A verification code has been sent to <strong>{email}</strong>
            </p>
          </div>
        )}
        
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-300">
            Verification Code
          </label>
          <div className="mt-1">
            <input
              id="code"
              name="code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your 6-digit code"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading || !code}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isLoading || !code
                ? 'bg-indigo-700 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            {isLoading ? 'Verifying...' : 'Verify Account'}
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-400">
            Didn't receive a code?{' '}
            <button
              type="button"
              className="text-indigo-400 hover:text-indigo-300 focus:outline-none"
              onClick={async () => {
                try {
                  // Use our new resend-verification API endpoint
                  const response = await fetch('/api/auth/resend-verification', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      userId: userId || undefined,
                      email: email || undefined
                    }),
                  });
                  
                  const data = await response.json();
                  
                  if (!response.ok) {
                    throw new Error(data.error || 'Failed to resend verification code');
                  }
                  
                  // Update state with any returned data
                  if (data.userId) setUserId(data.userId);
                  if (data.email) setEmail(data.email);
                  if (data.verificationCode) setCode(data.verificationCode);
                  
                  toast.success('A new verification code has been sent to your email');
                } catch (error) {
                  toast.error(error.message || 'Failed to resend verification code');
                }
              }}
            >
              Resend Code
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
