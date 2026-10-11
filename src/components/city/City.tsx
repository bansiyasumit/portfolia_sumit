"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Deterministic PRNG so the city is identical on every visit. */
const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const STREET_HALF = 4.2;
const START_Z = -70;
const END_Z = 14;

/** A building facade texture: a grid of windows, some lit warm or teal. */
const makeWindowTexture = (seed: number) => {
  const r = rng(seed);
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 128, 256);
  for (let y = 6; y < 256; y += 16) {
    for (let x = 6; x < 128; x += 14) {
      const v = r();
      if (v < 0.42) continue;
      ctx.fillStyle = v > 0.94 ? "#3ee6d9" : v > 0.86 ? "#ff8a5c" : `rgba(255, ${200 + Math.floor(r() * 40)}, ${140 + Math.floor(r() * 60)}, ${0.35 + r() * 0.6})`;
      ctx.fillRect(x, y, 8, 10);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

/** Neon sign rendered to a canvas so it can glow through bloom. */
const makeSignTexture = (text: string, color: string, vertical = false) => {
  const c = document.createElement("canvas");
  c.width = vertical ? 128 : 512;
  c.height = vertical ? 512 : 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, c.width - 16, c.height - 16);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (vertical) {
    ctx.font = "bold 64px Impact, Arial Narrow, sans-serif";
    const letters = text.split("");
    letters.forEach((ch, i) => ctx.fillText(ch, 64, 60 + i * ((512 - 110) / Math.max(1, letters.length - 1))));
  } else {
    ctx.font = "bold 72px Impact, Arial Narrow, sans-serif";
    ctx.fillText(text, 256, 68);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

/** Soft radial light pool decal for the wet street under each lamp. */
const makePoolTexture = () => {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,0.9)");
  grd.addColorStop(0.4, "rgba(255,255,255,0.25)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
};

const SIGNS: { text: string; color: string; vertical?: boolean }[] = [
  { text: "GAN LAB", color: "#ff6b35" },
  { text: "LATENT ST.", color: "#3ee6d9" },
  { text: "RAG BAR", color: "#f5c26b" },
  { text: "AGENTS", color: "#ff6b35", vertical: true },
  { text: "OPEN 24/7", color: "#3ee6d9" },
  { text: "NEURAL", color: "#f5c26b", vertical: true },
  { text: "SEG·CYCLE", color: "#ff6b35" },
  { text: "PYTORCH", color: "#3ee6d9", vertical: true },
];

type Building = { x: number; z: number; w: number; d: number; h: number; tex: THREE.Texture };

const Buildings = ({ quality }: { quality: number }) => {
  const { buildings, signs } = useMemo(() => {
    const r = rng(7);
    const textures = [11, 23, 37, 41].map(makeWindowTexture);
    const list: Building[] = [];
    const signList: { pos: [number, number, number]; rotY: number; tex: THREE.Texture; size: [number, number] }[] = [];
    let signIdx = 0;
    for (const side of [-1, 1]) {
      let z = START_Z;
      while (z < END_Z) {
        const w = 3.5 + r() * 4;
        const d = 5 + r() * 6;
        const h = 7 + r() * (quality > 0.6 ? 26 : 16);
        const tex = textures[Math.floor(r() * textures.length)].clone();
        tex.needsUpdate = true;
        tex.repeat.set(Math.max(1, Math.round(w / 1.6)), Math.max(1, Math.round(h / 3.2)));
        list.push({ x: side * (STREET_HALF + 1.6 + d / 2), z: z + w / 2, w, d, h, tex });

        if (r() > 0.45 && signIdx < SIGNS.length * 2 && z > -50) {
          const sgn = SIGNS[signIdx % SIGNS.length];
          signIdx++;
          const tx = makeSignTexture(sgn.text, sgn.color, sgn.vertical);
          signList.push({
            pos: [side * (STREET_HALF + 1.55 - (sgn.vertical ? 0.6 : 0)), 3.2 + r() * 3.5, z + w / 2],
            rotY: sgn.vertical ? 0 : -side * (Math.PI / 2),
            tex: tx,
            size: sgn.vertical ? [0.7, 2.8] : [3, 0.75],
          });
        }
        z += w + 0.15;
      }
    }
    return { buildings: list, signs: signList };
  }, [quality]);

  return (
    <group>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[b.d, b.h, b.w]} />
          <meshStandardMaterial
            color="#0a0c11"
            roughness={0.9}
            emissive="#ffffff"
            emissiveMap={b.tex}
            emissiveIntensity={1.1}
          />
        </mesh>
      ))}
      {signs.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={[0, s.rotY, 0]}>
          <planeGeometry args={s.size} />
          <meshBasicMaterial map={s.tex} transparent toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

const Lamps = () => {
  const pool = useMemo(makePoolTexture, []);
  const lamps = useMemo(() => {
    const out: { x: number; z: number; color: string }[] = [];
    for (let z = START_Z + 4; z < END_Z; z += 9) {
      out.push({ x: -STREET_HALF + 0.4, z, color: "#ffc78a" });
      out.push({ x: STREET_HALF - 0.4, z: z + 4.5, color: z % 2 ? "#ffc78a" : "#8af2ea" });
    }
    return out;
  }, []);

  return (
    <group>
      {lamps.map((l, i) => (
        <group key={i} position={[l.x, 0, l.z]}>
          <mesh position={[0, 2.2, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 4.4, 6]} />
            <meshStandardMaterial color="#15171c" roughness={0.6} metalness={0.6} />
          </mesh>
          <mesh position={[l.x < 0 ? 0.35 : -0.35, 4.35, 0]}>
            <boxGeometry args={[0.8, 0.06, 0.12]} />
            <meshStandardMaterial color="#15171c" />
          </mesh>
          <mesh position={[l.x < 0 ? 0.7 : -0.7, 4.28, 0]}>
            <sphereGeometry args={[0.09, 8, 6]} />
            <meshBasicMaterial color={l.color} toneMapped={false} />
          </mesh>
          <mesh position={[l.x < 0 ? 0.9 : -0.9, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4.5, 4.5]} />
            <meshBasicMaterial map={pool} color={l.color} transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** Slow drifting haze particles catching the light. */
const Haze = ({ count }: { count: number }) => {
  const ref = useRef<THREE.Points>(null);
  const geom = useMemo(() => {
    const r = rng(99);
    const pts = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pts[i * 3] = (r() - 0.5) * STREET_HALF * 2.4;
      pts[i * 3 + 1] = r() * 9;
      pts[i * 3 + 2] = START_Z + r() * (END_Z - START_Z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    return g;
  }, [count]);

  useFrame((_, dt) => {
    const a = geom.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = a.getY(i) - dt * 0.25;
      if (y < 0) y = 9;
      a.setY(i, y);
    }
    a.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.035} color="#cfe9ff" transparent opacity={0.45} depthWrite={false} />
    </points>
  );
};

export const City = ({ quality = 1 }: { quality?: number }) => (
  <group>
    {/* wet asphalt + sidewalks */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (START_Z + END_Z) / 2]}>
      <planeGeometry args={[60, END_Z - START_Z]} />
      <meshStandardMaterial color="#07080b" roughness={0.28} metalness={0.7} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * (STREET_HALF + 0.8), 0.06, (START_Z + END_Z) / 2]}>
        <boxGeometry args={[1.6, 0.12, END_Z - START_Z]} />
        <meshStandardMaterial color="#121419" roughness={0.8} />
      </mesh>
    ))}
    {/* centre line dashes */}
    {Array.from({ length: 22 }).map((_, i) => (
      <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, START_Z + i * 4]}>
        <planeGeometry args={[0.08, 1.6]} />
        <meshBasicMaterial color="#3a3a33" />
      </mesh>
    ))}
    <Buildings quality={quality} />
    <Lamps />
    <Haze count={quality > 0.6 ? 900 : 350} />
    {/* skyline glow at the end of the street */}
    <mesh position={[0, 12, START_Z - 6]}>
      <planeGeometry args={[80, 30]} />
      <meshBasicMaterial color="#ff6b35" transparent opacity={0.08} />
    </mesh>
  </group>
);
