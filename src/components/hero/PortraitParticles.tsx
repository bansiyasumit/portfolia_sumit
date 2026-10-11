"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import { FILM_START_EVENT, hasFilmStarted } from "@/lib/film";

const PORTRAIT_SRC = "/sumit_portrait.webp";
const PORTRAIT_WORLD_SIZE = 2.8;
const FOV = 35;
const CAMERA_Z = 5;
const ASSEMBLE_SECONDS = 3.4;
const ORIGIN = new THREE.Vector3(0, 0, 0);

type ParticleData = {
  count: number;
  spacing: number;
  target: Float32Array;
  noise: Float32Array;
  galaxy: Float32Array;
  color: Float32Array;
  seed: Float32Array;
};

/** Gaussian sample via Box–Muller — the "latent noise" each particle starts from. */
const gaussian = () => {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/**
 * Samples the portrait into particles. The photo has a flat grey studio
 * backdrop, so background is removed by flood-filling low-saturation mid-grey
 * pixels inward from the border (which keeps grey-ish pixels inside the figure).
 */
const samplePortrait = (img: HTMLImageElement, grid: number): ParticleData => {
  const canvas = document.createElement("canvas");
  canvas.width = grid;
  canvas.height = grid;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, grid, grid);
  const { data } = ctx.getImageData(0, 0, grid, grid);

  const isBackdrop = (i: number) => {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    const lum = (r + g + b) / 3;
    return sat < 20 && lum > 95 && lum < 205;
  };

  const background = new Uint8Array(grid * grid);
  const stack: number[] = [];
  for (let k = 0; k < grid; k++) {
    stack.push(k, (grid - 1) * grid + k, k * grid, k * grid + grid - 1);
  }
  while (stack.length) {
    const i = stack.pop()!;
    if (background[i] || !isBackdrop(i)) continue;
    background[i] = 1;
    const x = i % grid, y = (i / grid) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < grid - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - grid);
    if (y < grid - 1) stack.push(i + grid);
  }

  const spacing = PORTRAIT_WORLD_SIZE / grid;
  const target: number[] = [], noise: number[] = [], galaxy: number[] = [], color: number[] = [], seed: number[] = [];

  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const i = y * grid + x;
      if (background[i]) continue;
      const r = data[i * 4] / 255, g = data[i * 4 + 1] / 255, b = data[i * 4 + 2] / 255;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Bright features (skin, shirt) push toward the camera for a subtle relief.
      target.push(
        (x / grid - 0.5) * PORTRAIT_WORLD_SIZE + (Math.random() - 0.5) * spacing * 0.6,
        -(y / grid - 0.5) * PORTRAIT_WORLD_SIZE + (Math.random() - 0.5) * spacing * 0.6,
        (lum - 0.45) * 0.45 + (Math.random() - 0.5) * 0.04
      );
      noise.push(gaussian() * 1.6, gaussian() * 1.3, gaussian() * 1.6);

      // Spiral galaxy the portrait dissolves into when scrolling away.
      const arm = Math.floor(Math.random() * 3);
      const radius = 0.4 + Math.pow(Math.random(), 0.7) * 5.5;
      const angle = (arm / 3) * Math.PI * 2 + radius * 0.85 + gaussian() * 0.18;
      galaxy.push(
        Math.cos(angle) * radius + gaussian() * 0.12,
        gaussian() * 0.12 * (1.4 - radius / 6),
        Math.sin(angle) * radius + gaussian() * 0.12
      );

      color.push(r, g, b);
      seed.push(Math.random());
    }
  }

  return {
    count: seed.length,
    spacing,
    target: new Float32Array(target),
    noise: new Float32Array(noise),
    galaxy: new Float32Array(galaxy),
    color: new Float32Array(color),
    seed: new Float32Array(seed),
  };
};

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAssemble;
  uniform float uScatter;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uMouse;
  uniform float uMouseStrength;

  attribute vec3 aTarget;
  attribute vec3 aNoise;
  attribute vec3 aGalaxy;
  attribute vec3 aColor;
  attribute float aSeed;

  varying vec3 vColor;
  varying float vAlpha;

  float easeInOutCubic(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    // Each particle "denoises" on its own schedule, so the face resolves gradually.
    float t = clamp(uAssemble * 1.6 - aSeed * 0.6, 0.0, 1.0);
    float e = easeInOutCubic(t);
    vec3 p = mix(aNoise, aTarget, e);

    float jitter = 1.0 - e;
    p += vec3(
      sin(uTime * 1.3 + aSeed * 40.0),
      cos(uTime * 1.1 + aSeed * 60.0),
      sin(uTime * 0.9 + aSeed * 80.0)
    ) * (0.22 * jitter + 0.004);

    // Pointer repulsion — the face ripples away from the cursor.
    vec2 d = p.xy - uMouse.xy;
    float dist = length(d);
    float force = smoothstep(0.5, 0.0, dist) * uMouseStrength * e;
    p.xy += normalize(d + 1e-5) * force * 0.28;
    p.z += force * 0.5;

    // Scroll: dissolve into a slowly turning spiral galaxy.
    float s = smoothstep(0.0, 1.0, clamp(uScatter * 1.35 - aSeed * 0.35, 0.0, 1.0));
    float a = uTime * 0.06 + s * 1.2;
    vec3 g = aGalaxy;
    g.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * g.xz;
    p = mix(p, g, s);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (1.0 + jitter * 0.9 + s * 0.4) / -mv.z;

    vec3 latentTint = mix(vec3(0.24, 0.9, 0.85), vec3(1.0, 0.42, 0.21), aSeed);
    vColor = mix(latentTint, aColor, e);
    vColor = mix(vColor, mix(latentTint, aColor, 0.35), s * 0.8);
    vAlpha = (0.55 + 0.45 * e) * (1.0 - s * 0.35);
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

type SceneProps = {
  data: ParticleData;
  scatter: MotionValue<number>;
  pointer: React.RefObject<{ x: number; y: number; active: boolean }>;
  reducedMotion: boolean;
};

const PortraitPoints = ({ data, scatter, pointer, reducedMotion }: SceneProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const { size, camera, viewport } = useThree();
  const startRef = useRef<number | null>(reducedMotion ? -Infinity : null);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // `position` is required by three for bounds; the shader uses aTarget etc.
    g.setAttribute("position", new THREE.BufferAttribute(data.target, 3));
    g.setAttribute("aTarget", new THREE.BufferAttribute(data.target, 3));
    g.setAttribute("aNoise", new THREE.BufferAttribute(data.noise, 3));
    g.setAttribute("aGalaxy", new THREE.BufferAttribute(data.galaxy, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(data.color, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(data.seed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 8);
    return g;
  }, [data]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uAssemble: { value: reducedMotion ? 1 : 0 },
          uScatter: { value: 0 },
          uSize: { value: 20 },
          uPixelRatio: { value: 1 },
          uMouse: { value: new THREE.Vector3(99, 99, 0) },
          uMouseStrength: { value: 0 },
        },
      }),
    [reducedMotion]
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  // Begin "denoising" once the intro has lifted — and only when the canvas is
  // actually rendering (in view), so visitors arriving from the cold open see it form.
  const filmStarted = useRef(false);
  useEffect(() => {
    if (reducedMotion) return;
    const begin = () => {
      filmStarted.current = true;
    };
    if (hasFilmStarted()) begin();
    window.addEventListener(FILM_START_EVENT, begin);
    return () => window.removeEventListener(FILM_START_EVENT, begin);
  }, [reducedMotion]);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);

  useFrame((state, delta) => {
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uPixelRatio.value = state.gl.getPixelRatio();
    const wide = size.width / size.height > 1.05;
    const vw = viewport.getCurrentViewport(camera, ORIGIN).width;
    const scale = wide ? 1 : Math.min(0.8, (vw * 0.92) / PORTRAIT_WORLD_SIZE);
    u.uSize.value = (data.spacing * scale * 1.35 * size.height) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));

    if (filmStarted.current && startRef.current === null) startRef.current = performance.now();
    if (startRef.current !== null) {
      const elapsed = (performance.now() - startRef.current) / 1000;
      u.uAssemble.value = Math.min(1, elapsed / ASSEMBLE_SECONDS);
    }

    const s = scatter.get();
    u.uScatter.value = s;

    // Camera slowly dollies in as the portrait dissolves.
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, CAMERA_Z - s * 1.6, 0.08);

    const group = groupRef.current;
    if (!group) return;

    // Frame the portrait to the right on wide screens, above the title on phones.
    const targetX = wide ? Math.min(vw * 0.22, 2.1) * (1 - s) : 0;
    const targetY = wide ? -0.05 : 0.78 * (1 - s);
    group.position.x = THREE.MathUtils.lerp(group.position.x, targetX, 0.08);
    group.position.y = THREE.MathUtils.lerp(group.position.y, targetY, 0.08);
    group.scale.setScalar(scale);

    const p = pointer.current!;
    const sway = Math.sin(state.clock.elapsedTime * 0.3) * 0.04;
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, (p.active ? p.x * 0.28 : 0) + sway + s * 0.6, 0.05);
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, (p.active ? -p.y * 0.12 : 0) + s * 0.55, 0.05);

    // Project the pointer onto the portrait plane in the particles' local space.
    if (p.active && pointsRef.current) {
      ndc.set(p.x, p.y);
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        pointsRef.current.worldToLocal(hit);
        u.uMouse.value.lerp(hit, 0.25);
      }
    }
    const strengthTarget = p.active && !reducedMotion ? 1 : 0;
    u.uMouseStrength.value += (strengthTarget - u.uMouseStrength.value) * Math.min(1, delta * 4);
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef} geometry={geometry} material={material} />
    </group>
  );
};

/**
 * Hero centerpiece: the portrait is reconstructed from Gaussian noise like a
 * generative model's sampling process, reacts to the cursor, and dissolves into
 * a spiral galaxy as the visitor scrolls into the film.
 */
export default function PortraitParticles({
  scatter,
  active,
  onReady,
}: {
  scatter: MotionValue<number>;
  active: boolean;
  onReady?: (count: number) => void;
}) {
  const [data, setData] = useState<ParticleData | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const pointer = useRef({ x: 0, y: 0, active: false });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const img = new Image();
    img.src = PORTRAIT_SRC;
    img.onload = () => {
      const grid = window.innerWidth < 768 ? 130 : 180;
      const sampled = samplePortrait(img, grid);
      setData(sampled);
      onReady?.(sampled.count);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      pointer.current.active = e.pointerType === "mouse";
    };
    const leave = () => (pointer.current.active = false);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {data && (
        <Canvas
          frameloop={active ? "always" : "never"}
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, CAMERA_Z], fov: FOV, near: 0.1, far: 50 }}
          gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
          style={{ pointerEvents: "none" }}
        >
          <PortraitPoints data={data} scatter={scatter} pointer={pointer} reducedMotion={reducedMotion} />
        </Canvas>
      )}
    </div>
  );
}
