'use client'
import { Environment, OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'

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

  const [isMobile, setIsMobile] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use the state in your scale calculation
  const modelScale = Math.min(viewport.width, viewport.height) * (isMobile ? 1.1 : 0.9);

  return (
    <group>
      {/* Position camera to frame the larger model */}
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} near={0.01} />

      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <pointLight position={[-10, -10, -5]} intensity={0.7} />
      
      {/* Model */}
      <Suspense fallback={null}>
        <group 
          scale={modelScale} 
          position={[0, -0.1, 0]}
          onClick={(e) => {
            e.stopPropagation();
            setAutoRotate(prev => !prev);
          }}
        >
            <Model />
        </group>
      </Suspense>
      
      {/* Adjust controls to match the new scale */}
      <OrbitControls 
        autoRotate={autoRotate}
        autoRotateSpeed={2.0}
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        minDistance={3}
        maxDistance={10}
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