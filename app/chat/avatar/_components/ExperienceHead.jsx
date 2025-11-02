'use client'
import * as THREE from 'three'
import React, { Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei'

function Model(props) {
  const { nodes, materials } = useGLTF('/models/avatar-head.glb')
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.Mesh.geometry} material={materials.Material_0} />
    </group>
  )
}

useGLTF.preload('/models/avatar-head.glb')

function Scene() {
  const { viewport } = useThree();

  // Responsive scaling based on viewport
  const isMobile = viewport.width < 5; // Threshold for mobile viewport width
  const baseSize = Math.min(viewport.width, viewport.height);
  const modelScale = isMobile ? baseSize * 1.2 : baseSize * 0.5;
  const initialCameraZ = isMobile ? 3.5 : 8;

  return (
    <group>
      <PerspectiveCamera makeDefault position={[0, 0, initialCameraZ]} fov={50} near={0.01} />

      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <pointLight position={[-10, -10, -5]} intensity={0.7} />
      
      {/* Model */}
      <Suspense fallback={null}>
        <group scale={modelScale}>
            <Model />
        </group>
      </Suspense>
      
      {/* Controls */}
      <OrbitControls 
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        minDistance={2.5}
        maxDistance={8}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={3 * Math.PI / 4}
      />
      
      <Environment preset="sunset" />
    </group>
  );
}


export default function ExperienceHead() {
  return (
    <Canvas>
        <Scene />
    </Canvas>
  )
}