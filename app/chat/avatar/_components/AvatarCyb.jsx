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
      morphTargetSmoothing: { value: 0.3, min: 0, max: 1, step: 0.01 },
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

  // Viseme logic based on text prop - now processes words with natural timing
  useEffect(() => {
    if (!text) return;

    const words = text.split(/\s+/);
    let currentWordIndex = 0;
    let isSpeaking = true;
    
    const speakNextWord = () => {
      if (!isSpeaking || currentWordIndex >= words.length) {
        currentViseme.current = 'mouthClose';
        return;
      }
      
      const word = words[currentWordIndex];
      if (word) {
        // Process each character in the word
        let charIndex = 0;
        const wordDuration = Math.max(200, word.length * 100); // Base duration on word length
        const charInterval = 150; // Time per character
        
        const processCharacter = () => {
          if (charIndex < word.length && isSpeaking) {
            const char = word[charIndex].toUpperCase();
            const viseme = CORRESPONDING_VISEME_CYB[char] || 'mouthClose';
            currentViseme.current = viseme;
            lastVisemeTime.current = Date.now();
            charIndex++;
            
            // Only continue if we haven't reached the end of the word
            if (charIndex < word.length) {
              setTimeout(processCharacter, charInterval);
            } else {
              // Move to next word after a small pause
              currentWordIndex++;
              setTimeout(speakNextWord, 100); // Pause between words
            }
          }
        };
        
        processCharacter();
      } else {
        currentWordIndex++;
        setTimeout(speakNextWord, 0);
      }
    };
    
    // Start speaking
    speakNextWord();
    
    return () => {
      isSpeaking = false;
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


  // Subtle head movement
  useFrame((state) => {
    // Handle viseme updates
    if (!nodes.head023?.morphTargetDictionary) return;
    
    // Smoothly transition back to neutral expression when not speaking
    const timeSinceLastViseme = Date.now() - lastVisemeTime.current;
    if (timeSinceLastViseme > 100 && currentViseme.current !== 'mouthClose') {
      currentViseme.current = 'mouthClose';
    }
    
    // Add subtle head rotation based on time
    if (headRef.current) {
      const time = state.clock.getElapsedTime();
      headRef.current.rotation.y = Math.sin(time * 0.5) * 0.1; // Gentle side-to-side movement
    }
    
    try {
      const visemeToUse = currentViseme.current || 'mouthClose';
      
      const jawOpenValue = visemeToUse === 'jawOpen' ? 1 : 0;
      const mouthCloseValue = visemeToUse === 'mouthClose' ? 1 : 0;
      
      // Apply viseme to head
      if (nodes.head023.morphTargetDictionary.jawOpen !== undefined) {
        const openIndex = nodes.head023.morphTargetDictionary.jawOpen;
        if (nodes.head023.morphTargetInfluences) {
          nodes.head023.morphTargetInfluences[openIndex] = jawOpenValue;
        }
      }
      
      if (nodes.head023.morphTargetDictionary.mouthClose !== undefined) {
        const closeIndex = nodes.head023.morphTargetDictionary.mouthClose;
        if (nodes.head023.morphTargetInfluences) {
          nodes.head023.morphTargetInfluences[closeIndex] = mouthCloseValue;
        }
      }
      
    } catch (error) {
      console.error('Error updating morph targets:', error);
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