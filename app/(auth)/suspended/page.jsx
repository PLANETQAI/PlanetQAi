'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SuspendedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // If user is not suspended, redirect to home
  useEffect(() => {
    if (status === 'authenticated' && !session?.user?.isSuspended) {
      router.push('/');
    }
  }, [session, status, router]);

  if (status === 'loading' || (status === 'authenticated' && !session?.user?.isSuspended)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              ></path>
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Account Suspended
          </h2>
          <p className="mt-2 text-gray-600">
            Your account has been suspended. Please contact our support team for assistance.
          </p>
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900">Contact Support</h3>
            <p className="mt-1 text-sm text-gray-600">
              Email: quincin2000@planetqproductions.com
            </p>
            {/* <p className="mt-1 text-sm text-gray-600">
              Phone: +1 (555) 123-4567
            </p> */}
          </div>
          <div className="mt-6">
            <button
              onClick={() => {
                // Sign out the user
                signOut({ callbackUrl: '/login' });
              }}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
