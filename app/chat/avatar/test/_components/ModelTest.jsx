import { useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

function Model() {
  const { scene } = useGLTF('/models/avatar-head.glb');
  return <primitive object={scene} />;
}

export default function ModelTest() {
  return (
    <div style={{ width: '100%', height: '500px' }}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <Suspense fallback={null}>
          <Model />
        </Suspense>
      </Canvas>
    </div>
  );
}
