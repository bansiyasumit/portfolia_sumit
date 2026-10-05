"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const AGENTS = [
  { label: "Research", color: "#3ee6d9", radius: 2.1, speed: 0.35, tilt: 0.35 },
  { label: "Analysis", color: "#ff6b35", radius: 2.7, speed: -0.27, tilt: -0.5 },
  { label: "Fact-check", color: "#f5c26b", radius: 3.2, speed: 0.22, tilt: 0.9 },
  { label: "Report", color: "#ece8e1", radius: 3.7, speed: -0.17, tilt: -0.15 },
];

/** One agent on its tilted orbit, firing message pulses into the core. */
const Agent = ({ index }: { index: number }) => {
  const a = AGENTS[index];
  const node = useRef<THREE.Mesh>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const line = useRef<THREE.Line>(null);
  const tilt = useMemo(() => new THREE.Euler(a.tilt, 0, a.tilt * 0.4), [a.tilt]);
  const ring = useMemo(() => {
    const pts = Array.from({ length: 129 }, (_, i) => {
      const t = (i / 128) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(t) * a.radius, 0, Math.sin(t) * a.radius);
    });
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [a.radius]);
  const linkGeom = useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), []);
  const pos = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * a.speed + index * 1.7;
    pos.set(Math.cos(t) * a.radius, 0, Math.sin(t) * a.radius).applyEuler(tilt);
    node.current?.position.copy(pos);

    // Pulse travels agent → core on a staggered period.
    const k = ((clock.elapsedTime * 0.6 + index * 0.25) % 1);
    pulse.current?.position.copy(pos).multiplyScalar(1 - k);
    if (pulse.current) (pulse.current.material as THREE.MeshBasicMaterial).opacity = Math.sin(k * Math.PI);

    const attr = line.current?.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (attr) {
      attr.setXYZ(1, pos.x, pos.y, pos.z);
      attr.needsUpdate = true;
    }
  });

  return (
    <group>
      <lineLoop geometry={ring} rotation={tilt}>
        <lineBasicMaterial color={a.color} transparent opacity={0.18} />
      </lineLoop>
      {/* @ts-expect-error -- R3F's <line> collides with the SVG line element type */}
      <line ref={line} geometry={linkGeom}>
        <lineBasicMaterial color={a.color} transparent opacity={0.25} />
      </line>
      <mesh ref={node}>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshBasicMaterial color={a.color} />
      </mesh>
      <mesh ref={pulse}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color={a.color} transparent />
      </mesh>
    </group>
  );
};

const Core = () => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.x = clock.elapsedTime * 0.2;
    ref.current.rotation.y = clock.elapsedTime * 0.3;
    ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.4) * 0.04);
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.7, 1]} />
      <meshBasicMaterial color="#ff6b35" wireframe />
    </mesh>
  );
};

const Rig = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ pointer }) => {
    if (!ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, pointer.x * 0.4, 0.04);
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, 0.35 - pointer.y * 0.2, 0.04);
  });
  return <group ref={ref}>{children}</group>;
};

/** Agentic system scene: a CrewAI orchestrator core with four agents in orbit. */
export default function AgentOrbitScene() {
  return (
    <div className="absolute inset-0">
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0.6, 9], fov: 40 }} gl={{ antialias: true, alpha: true }}>
        <Rig>
          <Core />
          {AGENTS.map((_, i) => (
            <Agent key={i} index={i} />
          ))}
        </Rig>
      </Canvas>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-x-5 gap-y-2 hud text-paper/60 px-4">
        <span className="text-ember">◆ Crew core</span>
        {AGENTS.map((a) => (
          <span key={a.label} style={{ color: a.color }}>
            ● {a.label}
          </span>
        ))}
      </div>
    </div>
  );
}
