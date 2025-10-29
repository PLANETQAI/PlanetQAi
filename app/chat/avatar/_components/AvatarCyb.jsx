import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useFrame, useGraph } from "@react-three/fiber";
import { useControls } from "leva";
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from "react";
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import { CORRESPONDING_VISEME_CYB } from "./constants_cyb";

export function AvatarCybModel({
  position = [0, 0, 0],
  scale = 1,
  text,
  onModelLoad,
  modelPath = "/models/CYBERHEAD.glb",
  idleAnimationPath = "/animations/Idle.fbx",
}) {
  AvatarCybModel.propTypes = {
    position: PropTypes.array,
    scale: PropTypes.number,
    text: PropTypes.string,
    onModelLoad: PropTypes.func,
    modelPath: PropTypes.string,
    idleAnimationPath: PropTypes.string
  };

  // Track loading state of all assets
  const [assetsLoaded, setAssetsLoaded] = useState({
    model: false,
    animations: false
  });

  // Load GLTF model
  const { scene } = useGLTF(modelPath, undefined, undefined, (loader) => {
    console.log('Model loaded');
    setAssetsLoaded(prev => ({ ...prev, model: true }));
  });
  
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  
  // Initialize with empty animations array in case loading fails
  const [animations, setAnimations] = useState([]);
  const [animationError, setAnimationError] = useState(null);

  // Load FBX animations with error handling
  useEffect(() => {
    let mounted = true;
    
    const loadAnimation = async () => {
      try {
        // Try to load the animation
        const { animations: loadedAnimations } = await new Promise((resolve, reject) => {
          useFBX.preload(idleAnimationPath, 
            (result) => resolve({ animations: result.animations }),
            undefined, // Progress callback
            (error) => reject(error)
          );
        });
        
        if (mounted) {
          console.log('Animations loaded successfully');
          setAnimations(loadedAnimations);
          setAssetsLoaded(prev => ({ ...prev, animations: true }));
        }
      } catch (error) {
        console.warn('Failed to load animation:', error);
        if (mounted) {
          setAnimationError(error);
          // Continue without animations
          setAssetsLoaded(prev => ({ ...prev, animations: true }));
        }
      }
    };
    
    loadAnimation();
    
    return () => {
      mounted = false;
    };
  }, [idleAnimationPath]);
  
  const { actions } = useAnimations(animations, clone);
  
  // Call onModelLoad when all assets are loaded
  useEffect(() => {
    if (assetsLoaded.model && assetsLoaded.animations && nodes && materials) {
      console.log('All assets loaded, calling onModelLoad');
      onModelLoad?.();
    }
  }, [assetsLoaded, nodes, materials, onModelLoad]);
  
  const currentViseme = useRef('mouthClose'); // Will be 'mouthClose' or 'jawOpen'
  const lastVisemeTime = useRef(0);
  const visemeInterval = useRef(null);
  const headRef = useRef(); // Ref for the head group

  const { morphTargetSmoothing } = useControls(
    {
      smoothMorphTarget: true,
      morphTargetSmoothing: { value: 0.5, min: 0, max: 1, step: 0.01 },
    },
    { hidden: true }
  );

  // Animation control based on text prop
  useEffect(() => {
    if (animationError) {
      console.warn('Animation not available due to loading error');
      return;
    }
    
    if (text) {
      try {
        actions.mixamorigHips?.reset().play();
      } catch (error) {
        console.warn('Failed to play animation:', error);
      }
    } else {
      try {
        actions.mixamorigHips?.stop();
      } catch (error) {
        console.warn('Failed to stop animation:', error);
      }
    }
  }, [text, actions, animationError]);

  // Viseme logic based on a detailed queue with phonetic timing
  useEffect(() => {
    if (!text) {
      currentViseme.current = 'mouthClose';
      return;
    }

    const visemeQueue = [];
    const words = text.split(/\s+/).filter(Boolean);
    const VOWELS = ['A', 'E', 'I', 'O', 'U'];

    for (const word of words) {
      const chars = word.toUpperCase().split('');
      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const viseme = CORRESPONDING_VISEME_CYB[char] || 'mouthClose';
        
        // Determine duration based on character type for more natural timing
        let duration = 75; // Default consonant duration
        if (VOWELS.includes(char)) {
            duration = 120; // Vowel duration
        } else if (viseme === 'mouthClose') {
            duration = 80; // Closed-mouth consonant duration
        }

        const prevVisemeData = visemeQueue.length > 0 ? visemeQueue[visemeQueue.length - 1] : null;

        // Merge consecutive identical visemes to create a smoother flow
        if (prevVisemeData && prevVisemeData.viseme === viseme) {
          prevVisemeData.duration += duration;
        } else {
          visemeQueue.push({ viseme, duration });
        }
      }
      // Add a pause between words
      visemeQueue.push({ viseme: 'mouthClose', duration: 150 });
    }

    let currentVisemeIndex = 0;
    let timeoutId;
    let isAnimating = true;

    const animateVisemes = () => {
      if (!isAnimating || currentVisemeIndex >= visemeQueue.length) {
        currentViseme.current = 'mouthClose';
        return;
      }

      const { viseme, duration } = visemeQueue[currentVisemeIndex];
      currentViseme.current = viseme;
      lastVisemeTime.current = Date.now();

      timeoutId = setTimeout(() => {
        currentVisemeIndex++;
        animateVisemes();
      }, duration);
    };

    animateVisemes();

    return () => {
      isAnimating = false;
      clearTimeout(timeoutId);
      currentViseme.current = 'mouthClose';
    };
  }, [text]);

  // Eye blinking logic - blinks every 2 seconds
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (nodes.head023?.morphTargetDictionary) {
        const blinkLeftIndex = nodes.head023.morphTargetDictionary.eyeBlinkLeft;
        const blinkRightIndex = nodes.head023.morphTargetDictionary.eyeBlinkRight;

        if (blinkLeftIndex !== undefined && nodes.head023.morphTargetInfluences) {
          nodes.head023.morphTargetInfluences[blinkLeftIndex] = 1; // Close left eye
        }
        if (blinkRightIndex !== undefined && nodes.head023.morphTargetInfluences) {
          nodes.head023.morphTargetInfluences[blinkRightIndex] = 1; // Close right eye
        }

        setTimeout(() => {
          if (blinkLeftIndex !== undefined && nodes.head023.morphTargetInfluences) {
            nodes.head023.morphTargetInfluences[blinkLeftIndex] = 0; // Open left eye
          }
          if (blinkRightIndex !== undefined && nodes.head023.morphTargetInfluences) {
            nodes.head023.morphTargetInfluences[blinkRightIndex] = 0; // Open right eye
          }
        }, 100); // Blink duration (100ms)
      }
    }, 2000); // Blink every 2 seconds

    return () => clearInterval(blinkInterval);
  }, [nodes.head023?.morphTargetDictionary, nodes.head023?.morphTargetInfluences]);


  // Subtle head movement and smooth lip-sync
  useFrame((state) => {
    // Handle viseme updates
    if (!nodes.head023?.morphTargetDictionary || !nodes.head023.morphTargetInfluences) return;
    
    // Smoothly transition back to neutral expression when not speaking
    const timeSinceLastViseme = Date.now() - lastVisemeTime.current;
    if (timeSinceLastViseme > 200 && currentViseme.current !== 'mouthClose') {
      currentViseme.current = 'mouthClose';
    }
    
    // Add subtle head rotation based on time
    if (headRef.current) {
      const time = state.clock.getElapsedTime();
      headRef.current.rotation.y = Math.sin(time * 0.5) * 0.1; // Gentle side-to-side movement
    }
    
    // Determine target values for morph targets
    const jawOpenTarget = currentViseme.current === 'jawOpen' ? 1 : 0;
    const mouthCloseTarget = currentViseme.current === 'mouthClose' ? 1 : 0;

    // Smoothly interpolate morph targets for natural movement
    const jawOpenIndex = nodes.head023.morphTargetDictionary.jawOpen;
    if (jawOpenIndex !== undefined) {
      nodes.head023.morphTargetInfluences[jawOpenIndex] = THREE.MathUtils.lerp(
        nodes.head023.morphTargetInfluences[jawOpenIndex],
        jawOpenTarget,
        morphTargetSmoothing
      );
    }
    
    const mouthCloseIndex = nodes.head023.morphTargetDictionary.mouthClose;
    if (mouthCloseIndex !== undefined) {
      nodes.head023.morphTargetInfluences[mouthCloseIndex] = THREE.MathUtils.lerp(
        nodes.head023.morphTargetInfluences[mouthCloseIndex],
        mouthCloseTarget,
        morphTargetSmoothing
      );
    }
  });

  const group = useRef();
  
  return (
    <group ref={group} position={position} dispose={null}>
      <group scale={scale}>
        <group name="Scene">
          <group name="Armature">
            <group name="head001" ref={headRef}>
              <skinnedMesh
                name="head023"
                geometry={nodes.head023.geometry}
                material={materials.head}
                skeleton={nodes.head023.skeleton}
                morphTargetDictionary={nodes.head023.morphTargetDictionary}
                morphTargetInfluences={nodes.head023.morphTargetInfluences}
              />
              <skinnedMesh
                name="head023_1"
                geometry={nodes.head023_1.geometry}
                material={materials.eyes}
                skeleton={nodes.head023_1.skeleton}
                morphTargetDictionary={nodes.head023_1.morphTargetDictionary}
                morphTargetInfluences={nodes.head023_1.morphTargetInfluences}
              />
            </group>
            <skinnedMesh
              name="headphone"
              geometry={nodes.headphone.geometry}
              material={materials.headphone}
              skeleton={nodes.headphone.skeleton}
            />
            <primitive object={nodes.Hips} />
          </group>
        </group>
      </group>
    </group>
  )
}

useGLTF.preload('/models/CYBERHEAD.glb')