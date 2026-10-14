"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Persona, personaState } from "../city/Persona";

/** Slow push-in on Sumit in a single hard spotlight — the classic post-credits stinger. */
const Camera = () => {
  const look = useMemo(() => new THREE.Vector3(0, 1.56, 0), []);
  const start = useRef<number | null>(null);
  useFrame((state) => {
    if (start.current === null) start.current = state.clock.elapsedTime;
    const k = Math.min(1, (state.clock.elapsedTime - start.current) / 9);
    const ease = 1 - Math.pow(1 - k, 3);
    state.camera.position.set(0.32 - ease * 0.12, 1.6, 2.6 - ease * 0.85);
    state.camera.lookAt(look);
  });
  return null;
};

export default function PostCreditsScene() {
  useEffect(() => {
    // The persona state is shared with the cold-open street; claim it for this shot.
    Object.assign(personaState, { z: 0, visible: true, land: 0, glow: 0.35, wind: 0, walkAmount: 0, mode: "idle" });
    return () => {
      personaState.mode = "idle";
    };
  }, []);

  return (
    <Canvas dpr={[1, 1.5]} camera={{ fov: 32, near: 0.05, far: 40 }} gl={{ antialias: true }}>
      <color attach="background" args={["#030304"]} />
      <fog attach="fog" args={["#030304", 2.5, 9]} />
      <ambientLight intensity={0.08} />
      <spotLight position={[-1.2, 4.2, 2.2]} angle={0.38} penumbra={0.7} intensity={60} color="#ffcfa6" castShadow={false} />
      <directionalLight position={[1.5, 2.5, -3]} intensity={2.6} color="#3ee6d9" />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.2, 48]} />
        <meshStandardMaterial color="#0b0b0d" roughness={0.6} />
      </mesh>
      <Persona />
      <Camera />
    </Canvas>
  );
}
