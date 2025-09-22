'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import SunoGenerator from '../_components/Generator_v1';
import CreditPurchaseModal from '@/components/credits/CreditPurchaseModal'

export default function TestGenerator() {
  const { data: session, status } = useSession();
  const [showGenerator, setShowGenerator] = useState(false);
  const [userCredits, setUserCredits] = useState(null)
  const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false)
  const [testSongData, setTestSongData] = useState({
    text: 'Wish You Were Here this is a test song for my love reminding us the past',
    title: 'Wish You Were Here for me daling here ',
    mood: 'happy',

  });

useEffect(() => {
    if (session?.user) {
      fetchUserCredits()
    }
  }, [session])

  const fetchUserCredits = async () => {
		try {
			// Get base URL for API calls
			const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || ''

			// First check if the user is authenticated by getting the session
			console.log('Fetching session from:', `${apiBaseUrl}/api/auth/session`)
			const sessionResponse = await fetch(`${apiBaseUrl}/api/auth/session`)
			const sessionData = await sessionResponse.json()

			// If not authenticated, redirect to login page
			if (!sessionData || !sessionData.user) {
				console.log('User not authenticated, redirecting to login')
				window.location.href = `${apiBaseUrl}/login?redirectTo=` + encodeURIComponent(window.location.pathname)
				return
			}

			// Now fetch credits with the authenticated session
			console.log('Fetching credits from:', `${apiBaseUrl}/api/credits-api`)
			const response = await fetch(`${apiBaseUrl}/api/credits-api`, {
				method: 'GET',
				credentials: 'include', // This ensures cookies are sent with the request
				headers: {
					'Content-Type': 'application/json'
				}
			})

			if (!response.ok) {
				// If unauthorized, redirect to login
				if (response.status === 401) {
					window.location.href = `${apiBaseUrl}/login?redirectTo=` + encodeURIComponent(window.location.pathname)
					return
				}
				throw new Error(`Failed to fetch credits: ${response.status} ${response.statusText}`)
			}

			const data = await response.json()
			setUserCredits(data)
		} catch (error) {
			console.error('Error fetching credits:', error)
		}
	}

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Generator Component Test</h1>

        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Song Data</h2>
          <pre className="bg-gray-900 p-4 rounded overflow-x-auto">
            {JSON.stringify(testSongData, null, 2)}
          </pre>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setShowGenerator(true)}
            disabled={status === 'loading'}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Loading...' : 'Open Generator'}
          </button>

          <button
            onClick={() => {
              // Update with new test data
              const moods = ['happy', 'sad', 'energetic', 'calm', 'romantic', 'angry'];
              const styles = ['pop', 'rock', 'electronic', 'hip-hop', 'jazz', 'classical'];
              const genres = ['pop', 'rock', 'electronic', 'r&b', 'jazz', 'classical', 'lofi'];

              setTestSongData({
                title: `Test Song ${Math.floor(Math.random() * 1000)}`,
                prompt: `A ${moods[Math.floor(Math.random() * moods.length)]} ${styles[Math.floor(Math.random() * styles.length)]} song about number ${Math.floor(Math.random() * 1000)}`,
                mood: moods[Math.floor(Math.random() * moods.length)],
                style: styles[Math.floor(Math.random() * styles.length)],
                genre: genres[Math.floor(Math.random() * genres.length)],
                bpm: Math.floor(60 + Math.random() * 140)
              });
            }}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            disabled={status === 'loading'}
          >
            Generate Random Test Data
          </button>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-300">
            <li>Click "Open Generator" to test the Generator component</li>
            <li>Use "Generate Random Test Data" to update the song data with random values</li>
            <li>Check browser console for success/error logs</li>
            <li>Test different scenarios by modifying the test data</li>
            <li>Make sure you're logged in to test the full functionality</li>
          </ul>

          <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
            <h3 className="font-semibold mb-2">Current Session Status:</h3>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${status === 'authenticated' ? 'bg-green-500' : status === 'loading' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">
                {status === 'authenticated'
                  ? `Logged in as ${session?.user?.email || session?.user?.name || 'User'}`
                  : status === 'loading' ? 'Loading session...' : 'Not logged in'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Generator Modal */}
      {showGenerator && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="relative bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowGenerator(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <SunoGenerator
							session={session}
							selectedPrompt={testSongData}
						/>
          </div>
        </div>
      )}
      {session && (
					<CreditPurchaseModal
						isOpen={showCreditPurchaseModal}
						onClose={() => setShowCreditPurchaseModal(false)}
						creditsNeeded={0}
						onSuccess={() => {
							fetchUserCredits()
						}}
					/>
				)}
    </div>
  );
}
