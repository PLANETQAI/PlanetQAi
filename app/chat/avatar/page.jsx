'use client';

import StarsWrapper from '@/components/canvas/StarsWrapper';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

// Dynamically import Canvas with no SSR
const Canvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
  { ssr: false }
);

// Dynamically import ExperienceTest with no SSR
const ExperienceTest = dynamic(
  () => import('./_components/ExperienceTest'),
  { ssr: false }
);

export default function AvatarTestView() { // Renamed to AvatarTestView for clarity
  const [text, setText] = useState("");
  const [speak, setSpeak] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);
  const containerRef = useRef(null);

  const height = useMemo(() => {
    if (!isClient) return '500px'; // Default height during SSR
    const width = window.innerWidth;
    const height = window.innerHeight;
    return width < 768 ? `${Math.round(height * 0.68)}px` : `${Math.round(width * 0.3)}px`;
  }, [isFullScreen, isClient]);



  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []);


  useEffect(() => {
    if (speak) {
      console.log("Cybernetic avatar is speaking:", text);
      // Set a fixed duration for recording purposes (30 seconds)
      const speechDuration = 30000; // 30 seconds
      const timer = setTimeout(() => {
        setSpeak(false);
      }, speechDuration);
      return () => clearTimeout(timer);
    }
  }, [speak, text]); // Changed dependency from speakingText to text

  // Show loading state until client-side rendering is ready
  if (!isClient) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#050816',
        color: '#fff',
        fontSize: '1.2rem',
        zIndex: 1000
      }}>
        <div style={{
          textAlign: 'center',
          padding: '20px',
          borderRadius: '10px',
          background: 'rgba(10, 10, 10, 0.8)'
        }}>
          Initializing 3D environment...
        </div>
      </div>
    );
  }

  // Main content once model is loaded
  return (
    <div
      style={{
        height: "97vh",
        width: "99vw",
        backgroundColor: "#050816",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative"
      }}
    >
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0
      }}>
        <StarsWrapper />
      </div>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: height,
          transition: "all 0.3s ease",
          overflow: "hidden",
          zIndex: 1
        }}
      >
        <Suspense fallback={null}>
          <Canvas
            shadows
            camera={{ position: [0, 0, 10], fov: 20 }}
            style={{
              height: "100%",
              width: "100%",
              transition: "opacity 0.5s ease-in-out"
            }}
          >
            <Suspense fallback={null}>
              <ExperienceTest 
                speakingText={text}
                onModelLoad={() => {
                  console.log('Model loaded!');
                  setIsModelLoaded(true);
                }}
              />
            </Suspense>
          </Canvas>
        </Suspense>
      </div>

      {!isFullScreen && (
        <div
          style={{
            width: "100%",
            height: "20vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "10px 20px",
            backgroundColor: "rgba(5, 8, 22, 0.7)",
            boxSizing: "border-box",
            backdropFilter: "blur(10px)",
            position: "relative",
            zIndex: 1
          }}
        >
          <textarea
            rows={4}
            value={text}
            placeholder="Type something for the avatar to say..."
            style={{
              padding: "10px",
              width: "70%",
              borderRadius: "10px",
              border: "1px solid #555",
              resize: "none",
              fontSize: "16px",
              backgroundColor: "#1e1e1e",
              color: "#fff",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              boxSizing: "border-box",
            }}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}