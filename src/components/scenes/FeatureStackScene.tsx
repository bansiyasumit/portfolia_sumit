"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Conv stages shrink spatially and deepen — the ResNet silhouette.
const LAYERS = [
  { size: 2.6, grid: 22, x: -4.2 },
  { size: 2.1, grid: 18, x: -2.4 },
  { size: 1.6, grid: 14, x: -0.7 },
  { size: 1.15, grid: 10, x: 0.9 },
  { size: 0.75, grid: 7, x: 2.3 },
];
const CLASSES = ["#3ee6d9", "#f5c26b", "#ff6b35"];

const Layer = ({ index }: { index: number }) => {
  const l = LAYERS[index];
  const mat = useRef<THREE.PointsMaterial>(null);
  const geom = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < l.grid; i++)
      for (let j = 0; j < l.grid; j++) {
        pts.push(0, (i / (l.grid - 1) - 0.5) * l.size, (j / (l.grid - 1) - 0.5) * l.size);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [l]);

  useFrame(({ clock }) => {
    // An activation wave sweeps left → right through the stack.
    const wave = (clock.elapsedTime * 0.45) % 1.4;
    const d = Math.abs(wave - index / (LAYERS.length - 1));
    if (mat.current) {
      mat.current.opacity = 0.25 + Math.max(0, 1 - d * 4) * 0.75;
      mat.current.color.lerpColors(new THREE.Color("#8b8780"), new THREE.Color("#ff6b35"), Math.max(0, 1 - d * 4));
    }
  });

  return (
    <group position={[l.x, 0, 0]}>
      <points geometry={geom}>
        <pointsMaterial ref={mat} size={0.06} transparent sizeAttenuation color="#8b8780" />
      </points>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[l.size * 1.08, l.size * 1.08]} />
        <meshBasicMaterial color="#ece8e1" transparent opacity={0.035} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const Output = () => {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const wave = (clock.elapsedTime * 0.45) % 1.4;
    const active = Math.floor(clock.elapsedTime * 0.45) % CLASSES.length;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const target = wave > 1 ? (i === active ? 1.6 : 0.4) : 0.25;
      m.scale.y = THREE.MathUtils.lerp(m.scale.y, target, 0.08);
      m.position.y = -0.8 + m.scale.y * 0.5;
    });
  });
  return (
    <group position={[3.8, 0, 0]}>
      {CLASSES.map((c, i) => (
        <mesh key={c} ref={(m) => { refs.current[i] = m; }} position={[0, 0, (i - 1) * 0.42]}>
          <boxGeometry args={[0.22, 1, 0.22]} />
          <meshBasicMaterial color={c} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
};

const Rig = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ pointer, clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, -0.55 + pointer.x * 0.35 + Math.sin(clock.elapsedTime * 0.2) * 0.08, 0.04);
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, 0.18 - pointer.y * 0.15, 0.04);
  });
  return <group ref={ref}>{children}</group>;
};

/** Car-damage scene: an image flows through a shrinking ResNet stack into class scores. */
export default function FeatureStackScene() {
  return (
    <div className="absolute inset-0">
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 1.2, 9.5], fov: 38 }} gl={{ antialias: true, alpha: true }}>
        <Rig>
          {LAYERS.map((_, i) => (
            <Layer key={i} index={i} />
          ))}
          <Output />
        </Rig>
      </Canvas>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-6 hud text-paper/60">
        <span>Vehicle photo</span>
        <span className="text-ember">→ ResNet + Optuna →</span>
        <span>Damage class</span>
      </div>
    </div>
  );
}
