"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const WORLD = 2.6;
const FOV = 35;
const ASSEMBLE_SECONDS = 3.6;

export type MirrorData = { count: number; spacing: number; target: Float32Array; noise: Float32Array; color: Float32Array; seed: Float32Array };

const gaussian = () => {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/**
 * Turns one webcam frame (already drawn to a square canvas) into particles.
 * No background removal: a soft oval vignette frames the face like a portrait.
 */
export const sampleFrame = (source: HTMLCanvasElement, grid: number): MirrorData => {
  const c = document.createElement("canvas");
  c.width = c.height = grid;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0, grid, grid);
  const { data } = ctx.getImageData(0, 0, grid, grid);
  const spacing = WORLD / grid;
  const target: number[] = [], noise: number[] = [], color: number[] = [], seed: number[] = [];

  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      // Oval mask, slightly taller than wide, with a ragged edge that dissolves into noise.
      const nx = (x / grid - 0.5) / 0.46;
      const ny = (y / grid - 0.48) / 0.5;
      const d = nx * nx + ny * ny;
      if (d > 1 || (d > 0.78 && Math.random() < (d - 0.78) / 0.22)) continue;
      const i = (y * grid + x) * 4;
      const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      target.push(
        (x / grid - 0.5) * WORLD + (Math.random() - 0.5) * spacing * 0.6,
        -(y / grid - 0.5) * WORLD + (Math.random() - 0.5) * spacing * 0.6,
        (lum - 0.45) * 0.4 + (1 - d) * 0.25
      );
      noise.push(gaussian() * 1.5, gaussian() * 1.2, gaussian() * 1.5);
      color.push(r, g, b);
      seed.push(Math.random());
    }
  }
  return {
    count: seed.length,
    spacing,
    target: new Float32Array(target),
    noise: new Float32Array(noise),
    color: new Float32Array(color),
    seed: new Float32Array(seed),
  };
};

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAssemble;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute vec3 aTarget;
  attribute vec3 aNoise;
  attribute vec3 aColor;
  attribute float aSeed;
  varying vec3 vColor;
  varying float vAlpha;

  float easeInOutCubic(float t) { return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0; }

  void main() {
    float t = clamp(uAssemble * 1.6 - aSeed * 0.6, 0.0, 1.0);
    float e = easeInOutCubic(t);
    vec3 p = mix(aNoise, aTarget, e);
    float jitter = 1.0 - e;
    p += vec3(sin(uTime * 1.3 + aSeed * 40.0), cos(uTime * 1.1 + aSeed * 60.0), sin(uTime * 0.9 + aSeed * 80.0)) * (0.22 * jitter + 0.004);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (1.0 + jitter * 0.9) / -mv.z;
    vec3 latent = mix(vec3(0.24, 0.9, 0.85), vec3(1.0, 0.42, 0.21), aSeed);
    vColor = mix(latent, aColor, e);
    vAlpha = 0.55 + 0.45 * e;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, smoothstep(0.5, 0.18, d) * vAlpha);
  }
`;

const Points = ({ data, onStep }: { data: MirrorData; onStep: (t: number) => void }) => {
  const group = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);
  const { size } = useThree();
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.target, 3));
    g.setAttribute("aTarget", new THREE.BufferAttribute(data.target, 3));
    g.setAttribute("aNoise", new THREE.BufferAttribute(data.noise, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(data.color, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(data.seed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 6);
    return g;
  }, [data]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 }, uAssemble: { value: 0 }, uSize: { value: 20 }, uPixelRatio: { value: 1 } },
      }),
    []
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const u = material.uniforms;
    if (start.current === null) start.current = state.clock.elapsedTime;
    const k = Math.min(1, (state.clock.elapsedTime - start.current) / ASSEMBLE_SECONDS);
    u.uTime.value = state.clock.elapsedTime;
    u.uAssemble.value = k;
    u.uPixelRatio.value = state.gl.getPixelRatio();
    u.uSize.value = (data.spacing * 1.35 * size.height) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    onStep(k);
    if (group.current) {
      const p = state.pointer;
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, p.x * 0.25 + Math.sin(state.clock.elapsedTime * 0.4) * 0.04, 0.05);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -p.y * 0.12, 0.05);
    }
  });

  return (
    <group ref={group}>
      <points geometry={geometry} material={material} />
    </group>
  );
};

/** WebGL canvas for the visitor's particle portrait; onSnapshot receives a function returning a PNG data URL. */
export default function MirrorParticles({
  data,
  onStep,
  onSnapshot,
}: {
  data: MirrorData;
  onStep: (t: number) => void;
  onSnapshot: (take: () => string) => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 4.6], fov: FOV }}
      gl={{ antialias: false, alpha: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => onSnapshot(() => gl.domElement.toDataURL("image/png"))}
    >
      <Points data={data} onStep={onStep} />
    </Canvas>
  );
}
