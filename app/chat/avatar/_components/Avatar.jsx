import { useFBX, useGLTF } from "@react-three/drei";
import { useFrame, useGraph } from "@react-three/fiber";
import { useControls } from "leva";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import { CORRESPONDING_VISEME } from "./constants";

export function Avatar({
  position = [0, 0, 0],
  scale = 1,
  text,
  modelPath = "/models/avatar.glb",
  idleAnimationPath = "/animations/idle.fbx",
}) {
  const { scene } = useGLTF(modelPath);
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  
  // Load animations with error handling
  const { animations: idleAnimation } = useFBX(idleAnimationPath);
  const [animation] = useState("Idle");
  
  const currentViseme = useRef('mouthSmile');
  const lastVisemeTime = useRef(0);
  const morphTargetsInitialized = useRef(false);
  const visemeInterval = useRef(null);

  const { morphTargetSmoothing } = useControls(
    {
      smoothMorphTarget: true,
      morphTargetSmoothing: { value: 0.3, min: 0, max: 1, step: 0.01 },
    },
    { hidden: true }
  );

  useEffect(() => {
    if (!text) return;

    const words = text.split(/\s+/);
    let currentWordIndex = 0;
    
    const updateViseme = () => {
      if (currentWordIndex >= words.length) {
        clearInterval(visemeInterval.current);
        currentViseme.current = 'mouthSmile'; // Reset to smile at end
        return;
      }
      
      const word = words[currentWordIndex];
      if (word) {
        const firstChar = word[0].toUpperCase();
        const viseme = CORRESPONDING_VISEME[firstChar] || 'mouthSmile';
        currentViseme.current = viseme;
        lastVisemeTime.current = Date.now();
        currentWordIndex++;
      }
    };
    
    // Initial update
    updateViseme();
    
    // Set up interval for subsequent updates
    visemeInterval.current = setInterval(updateViseme, 300);
    
    return () => {
      clearInterval(visemeInterval.current);
    };
  }, [text]);

  useFrame(() => {
    if (!nodes.Wolf3D_Head?.morphTargetDictionary) return;
    
    // Auto-reset viseme if it's been active for too long
    if (currentViseme.current && (Date.now() - lastVisemeTime.current) > 200) {
      currentViseme.current = 'mouthSmile';
    }
    
    try {
      const visemeToUse = currentViseme.current || 'mouthSmile';
      const mouthOpenValue = visemeToUse === 'mouthOpen' ? 1 : 0;
      const mouthSmileValue = visemeToUse === 'mouthSmile' ? 1 : 0;
      
      // Apply viseme to head and teeth
      if (nodes.Wolf3D_Head.morphTargetDictionary.mouthOpen !== undefined) {
        const openIndex = nodes.Wolf3D_Head.morphTargetDictionary.mouthOpen;
        if (nodes.Wolf3D_Head.morphTargetInfluences) {
          nodes.Wolf3D_Head.morphTargetInfluences[openIndex] = mouthOpenValue;
        }
        if (nodes.Wolf3D_Teeth?.morphTargetInfluences) {
          nodes.Wolf3D_Teeth.morphTargetInfluences[openIndex] = mouthOpenValue;
        }
      }
      
      if (nodes.Wolf3D_Head.morphTargetDictionary.mouthSmile !== undefined) {
        const smileIndex = nodes.Wolf3D_Head.morphTargetDictionary.mouthSmile;
        if (nodes.Wolf3D_Head.morphTargetInfluences) {
          nodes.Wolf3D_Head.morphTargetInfluences[smileIndex] = mouthSmileValue;
        }
        if (nodes.Wolf3D_Teeth?.morphTargetInfluences) {
          nodes.Wolf3D_Teeth.morphTargetInfluences[smileIndex] = mouthSmileValue;
        }
      }
      
    } catch (error) {
      console.error('Error updating morph targets:', error);
    }
  });

  const group = useRef();
  
  return (
    <group ref={group} position={position} dispose={null}>
      <mesh position={[0, 0, -0.5]}>
        <circleGeometry args={[1.2, 64]} />
        <meshBasicMaterial color="#1f2937" side={THREE.BackSide} />
      </mesh>
      <group scale={scale}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        geometry={nodes.Wolf3D_Hair?.geometry}
        material={materials.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair?.skeleton}
      />
      {nodes.Wolf3D_Glasses && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Glasses.geometry}
          material={materials.Wolf3D_Glasses}
          skeleton={nodes.Wolf3D_Glasses.skeleton}
        />
      )}
      <skinnedMesh
        geometry={nodes.Wolf3D_Body?.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body?.skeleton}
      />
      {nodes.Wolf3D_Outfit_Bottom && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
          material={materials.Wolf3D_Outfit_Bottom}
          skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
        />
      )}
      {nodes.Wolf3D_Outfit_Footwear && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
          material={materials['aleksandr@readyplayer'] || materials.Wolf3D_Outfit_Footwear}
          skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
        />
      )}
      {nodes.Wolf3D_Outfit_Top && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Outfit_Top.geometry}
          material={materials.Wolf3D_Outfit_Top}
          skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
        />
      )}
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft?.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft?.skeleton}
        morphTargetDictionary={nodes.EyeLeft?.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft?.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight?.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight?.skeleton}
        morphTargetDictionary={nodes.EyeRight?.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight?.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head?.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head?.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head?.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head?.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth?.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth?.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth?.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth?.morphTargetInfluences}
      />
      </group>
    </group>
  );
}

useGLTF.preload('/models/avatar.glb');
