"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import { City } from "./City";
import { Persona, personaState } from "./Persona";

const WALK_SPEED = 1.6; // m/s
const CRUISE_SECONDS = 5;
const BRAKE_SECONDS = 1.6;
// Start far enough back that the walk ends exactly on the mark at z = 0.
const START_Z = -(WALK_SPEED * CRUISE_SECONDS + (WALK_SPEED * BRAKE_SECONDS) / 2);

type DirectorProps = {
  play: boolean;
  scroll: MotionValue<number>;
  skipWalk: boolean;
  onArrive: () => void;
};

/** Camera, lights and the walk timeline. */
const Director = ({ play, scroll, skipWalk, onArrive }: DirectorProps) => {
  const { camera, size } = useThree();
  const started = useRef<number | null>(null);
  const arrived = useRef(false);
  const lookAt = useMemo(() => new THREE.Vector3(0, 1.35, START_Z), []);
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    personaState.z = skipWalk ? 0 : START_Z;
    personaState.walkAmount = skipWalk ? 0 : 1;
    personaState.mode = skipWalk ? "idle" : "walk";
    if (skipWalk) {
      camera.position.set(0.55, 1.62, 2.4);
    } else {
      camera.position.set(0.9, 1.4, START_Z + 4.2);
    }
  }, [skipWalk, camera]);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    if (play && started.current === null) started.current = state.clock.elapsedTime;

    // ── Walk timeline: cruise, then brake onto the mark
    if (!skipWalk && started.current !== null && !arrived.current) {
      // Position is a closed-form function of elapsed time, so he always lands
      // exactly on the mark even when the frame rate is low or uneven.
      const e = state.clock.elapsedTime - started.current;
      const eb = Math.min(Math.max(e - CRUISE_SECONDS, 0), BRAKE_SECONDS);
      const speed = e < CRUISE_SECONDS ? WALK_SPEED : WALK_SPEED * (1 - eb / BRAKE_SECONDS);
      personaState.z =
        START_Z + WALK_SPEED * Math.min(e, CRUISE_SECONDS) + WALK_SPEED * (eb - (eb * eb) / (2 * BRAKE_SECONDS));
      personaState.walkAmount = speed / WALK_SPEED;
      if (eb >= BRAKE_SECONDS) {
        personaState.z = 0;
        arrived.current = true;
        personaState.walkAmount = 0;
        personaState.mode = "idle";
        onArrive();
      }
    } else if (!started.current && !skipWalk) {
      personaState.walkAmount = 0; // wait on the start mark until the intro lifts
    }
    if (skipWalk && !arrived.current && play) {
      arrived.current = true;
      onArrive();
    }

    // ── Camera: tracking shot while walking, then a medium close-up
    const portrait = size.width / size.height < 0.9;
    const z = personaState.z;
    const walking = personaState.walkAmount > 0.05 || (!arrived.current && !skipWalk);
    const t = state.clock.elapsedTime;
    const hand = 0.012;
    const camTarget = walking
      ? new THREE.Vector3(0.9, 1.45, z + (portrait ? 5.4 : 4.2))
      : new THREE.Vector3(portrait ? 0.15 : 0.55, 1.6, z + (portrait ? 3.6 : 2.35));
    const lookTarget = walking ? new THREE.Vector3(0, 1.35, z) : new THREE.Vector3(portrait ? 0 : -0.25, portrait ? 1.45 : 1.52, z);

    // Scroll: crane up into the night sky.
    const s = scroll.get();
    camTarget.y += s * s * 9;
    camTarget.z += s * 3;
    lookTarget.y += s * 14;
    lookTarget.z -= s * 10;

    const kf = 1 - Math.pow(walking ? 0.02 : 0.15, d);
    camera.position.lerp(camTarget, kf);
    camera.position.x += Math.sin(t * 0.9) * hand * d * 10;
    camera.position.y += Math.cos(t * 1.3) * hand * d * 10;
    lookAt.lerp(lookTarget, kf);
    camera.lookAt(lookAt);

    // ── Lights travel with the persona
    target.position.set(0, 1.4, z);
    target.updateMatrixWorld();
    if (key.current) {
      key.current.position.set(-2.4, 3.2, z + 3.2);
      key.current.target = target;
    }
    if (rim.current) {
      rim.current.position.set(1.2, 3, z - 4);
      rim.current.target = target;
    }
  });

  return (
    <>
      <hemisphereLight args={["#3f4c72", "#1a0f0a", 0.55]} />
      <directionalLight ref={key} color="#ffbe94" intensity={2.4} />
      <directionalLight ref={rim} color="#3ee6d9" intensity={3.2} />
      <pointLight position={[3, 2.5, 1]} color="#ff6b35" intensity={6} distance={9} />
      <primitive object={target} />
    </>
  );
};

export default function CityScene({
  play,
  active,
  scroll,
  skipWalk,
  onArrive,
}: {
  play: boolean;
  active: boolean;
  scroll: MotionValue<number>;
  skipWalk: boolean;
  onArrive: () => void;
}) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={mobile ? [1, 1.25] : [1, 1.6]}
      camera={{ fov: 38, near: 0.05, far: 120 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#05060a"]} />
      <fog attach="fog" args={["#07080d", 7, 46]} />
      <City quality={mobile ? 0.5 : 1} />
      <Persona />
      <Director play={play} scroll={scroll} skipWalk={skipWalk} onArrive={onArrive} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={1.15} luminanceThreshold={0.5} luminanceSmoothing={0.2} mipmapBlur />
        <Vignette offset={0.25} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
