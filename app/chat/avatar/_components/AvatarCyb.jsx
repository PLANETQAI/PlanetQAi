import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useFrame, useGraph } from "@react-three/fiber";
import { useControls } from "leva";
import React, { useEffect, useRef, useState } from "react";
import PropTypes from 'prop-types';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import { CORRESPONDING_VISEME_CYB } from "./constants_cyb";
import * as THREE from 'three';

export function AvatarCybModel({
  position = [0, 0, 0],
  scale = 1,
  text,
  onModelLoad,
  modelPath = "/models/CYBERHEAD.glb",
  idleAnimationPath = "/animations/idle.fbx",
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
  
  // Load FBX animations
  const { animations: idleAnimation } = useFBX(idleAnimationPath, undefined, (loader) => {
    console.log('Animations loaded');
    setAssetsLoaded(prev => ({ ...prev, animations: true }));
  });
  
  const { actions } = useAnimations(idleAnimation, clone);
  
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
    if (text) {
      actions.mixamorigHips?.reset().play();
    } else {
      actions.mixamorigHips?.stop();
    }
  }, [text, actions]);

  // Viseme logic based on word-by-word animation for a more natural feel
  useEffect(() => {
    if (!text) {
      currentViseme.current = 'mouthClose';
      return;
    }

    const words = text.split(/\s+/).filter(Boolean);
    let wordIndex = 0;
    const timeouts = [];
    let isAnimating = true;

    const clearAllTimeouts = () => {
      timeouts.forEach(clearTimeout);
    };

    const animateWord = () => {
      if (!isAnimating || wordIndex >= words.length) {
        currentViseme.current = 'mouthClose';
        return;
      }

      const word = words[wordIndex];
      const wordDuration = Math.max(150, word.length * 100);
      const pauseDuration = 120;

      // Open mouth for the duration of the word
      currentViseme.current = 'jawOpen';
      lastVisemeTime.current = Date.now();

      // Schedule mouth close after the word
      const closeTimeout = setTimeout(() => {
        currentViseme.current = 'mouthClose';
        lastVisemeTime.current = Date.now();

        // Schedule next word after a pause
        const nextWordTimeout = setTimeout(() => {
          wordIndex++;
          animateWord();
        }, pauseDuration);
        timeouts.push(nextWordTimeout);
      }, wordDuration);
      timeouts.push(closeTimeout);
    };

    animateWord();

    return () => {
      isAnimating = false;
      clearAllTimeouts();
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