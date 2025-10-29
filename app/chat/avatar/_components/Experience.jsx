import { Circle, Environment, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import PropTypes from "prop-types";
import * as THREE from 'three';
import { Avatar } from "./Avatar";
import { TEXTURE_PATH } from "./constants";

const Experience = ({ speakingText, speak, setSpeak }) => {
  const texture = useTexture(TEXTURE_PATH);
  const viewport = useThree((state) => state.viewport);
  const size = Math.min(viewport.width, viewport.height) * 0.5; // Adjust size based on viewport

  return (
    <>
      <group position={[0, 0, 5]}>
        {/* Circular background with gradient border */}
        <group position={[0, -0.5, -1]}>
          <Circle args={[size * 0.6, 64]} position={[0, 0, -0.1]}>
            <meshBasicMaterial color="#1f2937" side={THREE.DoubleSide} />
          </Circle>
          <Circle args={[size * 0.6, 64]} position={[0, 0, 0]}> 
            <meshBasicMaterial 
              color="#2d2d2d" 
              side={THREE.DoubleSide}
              transparent
              opacity={0.95}
            />
          </Circle>
        </group>
        
        {/* Avatar */}
        <group position={[0, -4.5, 0]} scale={2.5}>
          <Avatar 
            text={speakingText} 
            speak={speak} 
            setSpeak={setSpeak} 
          />
        </group>
      </group>
      
      <Environment preset="sunset" />
      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </>
  );
};

Experience.propTypes = {
  speakingText: PropTypes.string.isRequired,
  speak: PropTypes.bool.isRequired,
  setSpeak: PropTypes.func.isRequired,
};

export default Experience;
