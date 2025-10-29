import { Circle, Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import PropTypes from "prop-types";
import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AvatarCybModel } from './AvatarCyb';

function Scene({ speakingText, onModelLoad }) {
  const { viewport } = useThree();
  const groupRef = useRef();
  const modelLoadedRef = useRef(false);
  const loadStartTime = useRef(Date.now());

  // Using a large base size for an impactful look.
  const baseSize = Math.min(viewport.width, viewport.height) * 0.9;

  // Define dimensions relative to the base size
  const circleRadius = baseSize / 2;
  const modelScale = baseSize * 1;
  
  // Position the scene lower, which is now possible with the zoomed-out camera.
  const sceneYPosition = -baseSize * 0.1;
  // Apply a vertical offset to the model to center it within the circle.
  const modelYOffset = -circleRadius * 3.35;

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
    <group ref={groupRef} position={[0, sceneYPosition, 0]}>
      {/* Add a new camera with a wider FOV and appropriate zoom */}
      <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={60} />

      {/* Circular background */}
      <group>
        <Circle args={[circleRadius, 64]} position={[0, 0, -0.1]}>
          <meshBasicMaterial color="#050816" side={THREE.DoubleSide} />
        </Circle>
        <Circle args={[circleRadius, 64]} position={[0, 0, 0]}>
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
      
      {/* 3D Cyber Head Model - Scaled and positioned relative to the background */}
      <group position={[0, modelYOffset, 0]} scale={modelScale}>
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