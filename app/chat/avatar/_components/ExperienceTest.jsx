import { Circle, Environment, OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCallback, useRef, useEffect, useState } from 'react';
import PropTypes from "prop-types";
import * as THREE from 'three';
import { AvatarCybModel } from './AvatarCyb';

function Scene({ speakingText, onModelLoad }) {
  const { viewport } = useThree();
  const size = Math.min(viewport.width, viewport.height) * 0.5;
  const groupRef = useRef();
  const modelLoadedRef = useRef(false);
  const loadStartTime = useRef(Date.now());

  // Set a timeout to ensure loading completes even if onModelLoad isn't called
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!modelLoadedRef.current) {
        console.warn('Model loading taking too long, forcing completion');
        onModelLoad?.();
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, [onModelLoad]);

  const handleModelLoad = useCallback(() => {
    if (!modelLoadedRef.current) {
      const loadTime = Date.now() - loadStartTime.current;
      console.log(`Avatar model loaded in ${loadTime}ms`);
      modelLoadedRef.current = true;
      onModelLoad?.();
    }
  }, [onModelLoad]);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Circular background with gradient border */}
      <group position={[0, 0, 0]}>
        <Circle args={[size * 0.8, 64]} position={[0, 0, -0.1]}>
          <meshBasicMaterial color="#050816" side={THREE.DoubleSide} />
        </Circle>
        <Circle args={[size * 0.8, 64]} position={[0, 0, 0]}>
          <meshBasicMaterial
            color="#050816"
            side={THREE.DoubleSide}
            transparent
            opacity={0.95}
          />
        </Circle>
      </group>

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      
      {/* 3D Cyber Head Model - positioned at center of screen */}
      <group position={[0, -5.5, 0]} scale={3.5}>
        <AvatarCybModel 
          text={speakingText}
          onModelLoad={handleModelLoad}
        />
      </group>
      
      {/* Disabled OrbitControls to prevent user interaction */}
      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
      />
      
      <Environment preset="sunset" />
    </group>
  );
}

Scene.propTypes = {
  speakingText: PropTypes.string,
  onModelLoad: PropTypes.func,
};

export default function ExperienceTest({ speakingText = "", onModelLoad = () => {} }) {
  return <Scene speakingText={speakingText} onModelLoad={onModelLoad} />;
}

ExperienceTest.propTypes = {
  speakingText: PropTypes.string,
  onModelLoad: PropTypes.func
};