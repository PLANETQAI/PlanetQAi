import React, { useState, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations, useFBX, useProgress, Html } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

export function AnimatedAvatarHead({
  position = [0, 1.5, 0],
  scale = 1,
  text,
  speak = false,
  setSpeak = () => {},
  modelPath = "/models/avatar-head.glb",
  idleAnimationPath = "/animations/Idle.fbx",
  greetingAnimationPath = "/animations/StandingGreeting.fbx"
}) {
  const group = useRef();
  const { progress } = useProgress();
  
  // State for model and animations
  const [model, setModel] = useState(null);
  const [animations, setAnimations] = useState({
    idle: [],
    greeting: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load model and animations together
  useEffect(() => {
    let isMounted = true;
    
    const loadAllAssets = async () => {
      try {
        // Load model
        const loadModel = () => new Promise((resolve, reject) => {
          const dracoLoader = new DRACOLoader();
          dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
          
          const loader = new GLTFLoader();
          loader.setDRACOLoader(dracoLoader);
          
          loader.load(
            modelPath,
            (gltf) => resolve({ model: gltf.scene, modelAnimations: gltf.animations || [] }),
            undefined,
            (error) => reject(error)
          );
        });

        // Load FBX animation
        const loadFBXAnimation = (path) => new Promise((resolve) => {
          try {
            const { FBXLoader } = require('three/examples/jsm/loaders/FBXLoader');
            const loader = new FBXLoader();
            loader.load(
              path,
              (object) => resolve(object.animations || []),
              undefined,
              (error) => {
                console.warn(`Failed to load animation from ${path}:`, error);
                resolve([]);
              }
            );
          } catch (error) {
            console.warn('Error setting up FBX loader:', error);
            resolve([]);
          }
        });

        // Load all assets in parallel
        const [
          { model, modelAnimations },
          idleAnimations,
          greetingAnimations
        ] = await Promise.all([
          loadModel(),
          loadFBXAnimation(idleAnimationPath),
          loadFBXAnimation(greetingAnimationPath)
        ]);

        if (isMounted) {
          setModel(model);
          setAnimations({
            idle: idleAnimations,
            greeting: greetingAnimations,
            ...(modelAnimations.length > 0 && { model: modelAnimations })
          });
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading assets:', error);
        if (isMounted) {
          setError(error);
          setLoading(false);
        }
      }
    };

    loadAllAssets();

    return () => {
      isMounted = false;
    };
  }, [modelPath, idleAnimationPath, greetingAnimationPath]);

  // Set up animations only when model is loaded
  const { actions, mixer } = useAnimations(
    model ? Object.values(animations).flat().filter(Boolean) : [],
    group
  );
  
  // Log loading status for debugging
  useEffect(() => {
    if (!loading) {
      console.log('Model and animations loaded:', {
        model: !!model,
        animations: {
          idle: animations.idle?.length > 0,
          greeting: animations.greeting?.length > 0
        },
        error: error
      });
    }
  }, [loading, model, animations, error]);

  // Animation state
  const [animation, setAnimation] = useState("Idle");
  
  // Viseme tracking
  const currentViseme = useRef('neutral');
  const lastVisemeTime = useRef(0);
  const visemeInterval = useRef(null);

  // Animation controls
  useEffect(() => {
    if (speak) {
      setAnimation("Greeting");
    } else {
      setAnimation("Idle");
    }
  }, [speak]);

  // Play animation when it changes
  useEffect(() => {
    if (actions[animation]) {
      actions[animation]
        .reset()
        .fadeIn(mixer.stats.actions.inUse === 0 ? 0 : 0.2)
        .play();
      
      return () => {
        actions[animation]?.fadeOut(0.2);
      };
    }
  }, [animation, actions, mixer]);

  // Handle visemes for lip-sync
  useEffect(() => {
    if (!text) return;

    const words = text.split(/\s+/);
    let currentWordIndex = 0;
    
    const updateViseme = () => {
      if (currentWordIndex >= words.length) {
        clearInterval(visemeInterval.current);
        currentViseme.current = 'neutral';
        setSpeak(false);
        return;
      }
      
      const word = words[currentWordIndex];
      const viseme = getVisemeForWord(word);
      currentViseme.current = viseme;
      lastVisemeTime.current = Date.now();
      currentWordIndex++;
    };

    if (speak) {
      visemeInterval.current = setInterval(updateViseme, 300);
      return () => clearInterval(visemeInterval.current);
    }
  }, [text, speak, setSpeak]);

  // Update viseme in render loop
  useFrame(() => {
    if (!group.current) return;
    
    // Update viseme morph targets if they exist
    const head = group.current.getObjectByName('Head') || 
                group.current.getObjectByName('head') ||
                group.current.children[0];
                
    if (head && head.morphTargetDictionary) {
      const visemeIndex = head.morphTargetDictionary[currentViseme.current];
      if (visemeIndex !== undefined) {
        head.morphTargetInfluences[visemeIndex] = 1;
      }
    }
  });

  // Simple viseme mapping
  const getVisemeForWord = (word) => {
    if (!word) return 'neutral';
    
    const firstChar = word[0].toLowerCase();
    if ('aeiou'.includes(firstChar)) return 'aa';
    if ('bfmp'.includes(firstChar)) return 'p';
    if ('tdnsz'.includes(firstChar)) return 't';
    if ('ckg'.includes(firstChar)) return 'k';
    if ('lr'.includes(firstChar)) return 'r';
    return 'neutral';
  };

  // Show loading state if either model or animations are still loading
  if (loading || !animationsLoaded) {
    return (
      <Html center>
        <div className="text-white">
          {loading ? 
            `Loading model... ${Math.round(progress)}%` : 
            'Loading animations...'}
        </div>
      </Html>
    );
  }

  return (
    <group ref={group} position={position} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

