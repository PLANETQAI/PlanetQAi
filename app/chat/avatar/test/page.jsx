'use client';

import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Text, Loader } from '@react-three/drei';
import { AnimatedAvatarHead } from './_components/AnimatedAvatarHead';
import * as THREE from 'three';

const AnimatedAvatarPage = () => {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = () => {
    if (text.trim()) {
      setIsSpeaking(true);
      // Auto-reset after speaking
      setTimeout(() => {
        setIsSpeaking(false);
      }, text.split(' ').length * 300 + 1000);
    }
  };

  const [error, setError] = useState(null);

  // Handle model loading errors
  const handleModelError = (error) => {
    console.error('Model loading error:', error);
    setError('Failed to load the 3D model. Please check the console for details.');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <h1 className="text-3xl font-bold text-white mb-8">Animated Avatar Head</h1>
      
      {error && (
        <div className="bg-red-500 text-white p-4 rounded-lg mb-4 max-w-2xl w-full">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
          <p className="mt-2 text-sm">Check if the model file exists at: /public/models/avatar-head.glb</p>
        </div>
      )}
      
      <div className="w-full max-w-2xl h-[500px] bg-black/20 rounded-lg overflow-hidden mb-8">
        <Canvas
          camera={{ position: [0, 0, 2], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.5} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={1}
            castShadow
          />
          <Suspense fallback={null}>
            <AnimatedAvatarHead 
              position={[0, 0, 0]} 
              scale={0.5}
              text={text}
              speak={isSpeaking}
              setSpeak={setIsSpeaking}
              onError={handleModelError}
            />
            <Environment preset="sunset" />
          </Suspense>
          <OrbitControls 
            enableZoom={true}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Canvas>
      </div>

      <div className="w-full max-w-2xl space-y-4">
        <div className="flex space-x-4">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type something for the avatar to say..."
            className="flex-1 p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSpeak()}
          />
          <button
            onClick={handleSpeak}
            disabled={!text.trim() || isSpeaking}
            className={`px-6 py-3 rounded-lg font-medium ${
              !text.trim() || isSpeaking
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-colors`}
          >
            {isSpeaking ? 'Speaking...' : 'Speak'}
          </button>
        </div>
        
        <div className="text-gray-400 text-sm">
          <p>Try saying: "Hello, welcome to PlanetQAi!"</p>
          <p>Use the mouse to rotate and zoom around the avatar.</p>
        </div>
      </div>
      <Loader />
    </div>
  );
};

export default AnimatedAvatarPage;
