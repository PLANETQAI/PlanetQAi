'use client';

import { useState } from 'react';
import Generator from '../_components/Generator_v1';

export default function TestGenerator() {
  const [showGenerator, setShowGenerator] = useState(false);
  const [testSongData, setTestSongData] = useState({
    title: 'Test Song',
    prompt: 'A beautiful test song about testing the generator component',
    mood: 'happy'
  });

  const handleSuccess = (song) => {
    console.log('Song generated successfully:', song);
    // You can add additional success handling here
  };

  const handleError = (error) => {
    console.error('Error generating song:', error);
    // You can add additional error handling here
  };

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

        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setShowGenerator(true)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
          >
            Open Generator
          </button>
          
          <button
            onClick={() => {
              // Update with new test data
              setTestSongData({
                title: `Test Song ${Math.floor(Math.random() * 1000)}`,
                prompt: `Random test song about number ${Math.floor(Math.random() * 1000)}`,
                mood: ['happy', 'sad', 'energetic', 'calm'][Math.floor(Math.random() * 4)]
              });
            }}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            Change Test Data
          </button>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-300">
            <li>Click "Open Generator" to test the Generator component</li>
            <li>Use "Change Test Data" to update the song data</li>
            <li>Check browser console for success/error logs</li>
            <li>Test different scenarios by modifying the test data</li>
          </ul>
        </div>
      </div>

      {/* Generator Component */}
      <Generator
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        songData={testSongData}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}
