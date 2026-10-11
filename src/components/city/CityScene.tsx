"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import { City } from "./City";
import { Persona, personaState } from "./Persona";

// ── Trailer timeline (seconds from the moment the intro lifts) ─────────────
export const T = {
  vo1: 0.4,
  vo2: 2.6,
  riser: 2.9,
  comet: 3.4,
  whoosh: 4.4,
  impact: 5.2,
  rise: 6.0,
  braam: 6.0,
  title: 6.2,
  risen: 7.0,
  walk: 7.2,
  card1: 7.8,
  card2: 8.9,
};
const LAND_Z = -5;
const WALK_SPEED = 1.6;
const BRAKE = 1.6;
const CRUISE = (-LAND_Z - (WALK_SPEED * BRAKE) / 2) / WALK_SPEED;
export const T_ARRIVE = T.walk + CRUISE + BRAKE;
const BEATS = Object.entries(T) as [keyof typeof T, number][];

const COMET_FROM = new THREE.Vector3(-7, 46, -42);
const COMET_TO = new THREE.Vector3(0, 0.4, LAND_Z);
const COMET_DIR = new THREE.Vector3().subVectors(COMET_FROM, COMET_TO).normalize();

const smooth = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Effects state shared between the director and the effect components. */
const fx = { sinceImpact: -1, comet: new THREE.Vector3(), cometOn: false };

type DirectorProps = {
  play: boolean;
  scroll: MotionValue<number>;
  skip: number;
  reduced: boolean;
  onBeat: (beat: string) => void;
};

/** Camera, lights and the whole trailer timeline — every value is a function of time. */
const Director = ({ play, scroll, skip, reduced, onBeat }: DirectorProps) => {
  const { camera, size } = useThree();
  const started = useRef<number | null>(null);
  const fired = useRef(new Set<string>());
  const lookAt = useMemo(() => new THREE.Vector3(0, 2, -20), []);
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const camTarget = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const lastSkip = useRef(skip);

  useEffect(() => {
    Object.assign(personaState, { z: LAND_Z, visible: false, land: 1, glow: 0, wind: 0, walkAmount: 0, mode: "idle" });
    camera.position.set(1.2, 0.5, 4);
  }, [camera]);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    const now = state.clock.elapsedTime;
    if (play && started.current === null) started.current = reduced ? now - T_ARRIVE - 0.01 : now;
    // "Skip intro" jumps the clock to the arrival — skipped beats stay silent.
    if (skip !== lastSkip.current && started.current !== null) {
      lastSkip.current = skip;
      started.current = Math.min(started.current, now - T_ARRIVE - 0.01);
      BEATS.forEach(([b]) => fired.current.add(b));
    }
    const e = started.current === null ? 0 : now - started.current;

    for (const [beat, at] of BEATS) {
      if (e >= at && !fired.current.has(beat)) {
        fired.current.add(beat);
        onBeat(beat);
      }
    }
    if (e >= T_ARRIVE && !fired.current.has("arrive")) {
      fired.current.add("arrive");
      onBeat("arrive");
    }

    // ── Persona ──────────────────────────────────────────────────────────
    const P = personaState;
    P.visible = e >= T.impact;
    P.land = e < T.rise ? 1 : 1 - smooth(T.rise, T.risen, e);
    P.glow = e < T.impact ? 0 : e < T_ARRIVE ? smooth(T.rise, T.rise + 0.6, e) : 0.18;
    fx.sinceImpact = e >= T.impact ? e - T.impact : -1;
    P.wind = fx.sinceImpact >= 0 ? Math.exp(-fx.sinceImpact * 1.6) : 0;
    if (e < T.walk) {
      P.z = LAND_Z;
      P.walkAmount = 0;
    } else if (e < T_ARRIVE) {
      const w = e - T.walk;
      const eb = Math.min(Math.max(w - CRUISE, 0), BRAKE);
      P.z = LAND_Z + WALK_SPEED * Math.min(w, CRUISE) + WALK_SPEED * (eb - (eb * eb) / (2 * BRAKE));
      P.walkAmount = w < CRUISE ? 1 : 1 - eb / BRAKE;
      if (P.mode === "idle") P.mode = "walk";
    } else {
      P.z = 0;
      P.walkAmount = 0;
      if (P.mode === "walk") P.mode = "idle";
    }

    // ── Comet ────────────────────────────────────────────────────────────
    fx.cometOn = e >= T.comet && e < T.impact;
    if (fx.cometOn) {
      const u = (e - T.comet) / (T.impact - T.comet);
      fx.comet.lerpVectors(COMET_FROM, COMET_TO, u * u);
    }

    // ── Camera keyframes ─────────────────────────────────────────────────
    const portrait = size.width / size.height < 0.9;
    const back = portrait ? 1.35 : 1; // pull back on tall screens
    if (e < T.comet) {
      // Establishing: low on the asphalt, tilting from the street up to the sky.
      const u = smooth(0, T.comet, e);
      camTarget.set(1.2, 0.5 + u * 0.3, 4 * back);
      lookTarget.set(0, 2 + u * 14, -20 - u * 10);
    } else if (e < T.impact) {
      camTarget.set(2.2, 0.7, 3.6 * back);
      lookTarget.set(fx.comet.x * 0.6, Math.max(1, fx.comet.y), fx.comet.z);
    } else if (e < T.walk) {
      // Hero shot: low-angle orbit while he rises.
      const u = smooth(T.impact, T.walk, e);
      const theta = 0.9 - u * 1.4;
      const r = (3.1 - u * 0.6) * back;
      camTarget.set(Math.sin(theta) * r, 0.35 + u * 0.55, LAND_Z + Math.cos(theta) * r);
      lookTarget.set(0, 0.8 + smooth(T.rise, T.risen, e) * 0.65, LAND_Z);
    } else if (e < T_ARRIVE) {
      camTarget.set(0.9, 1.45, P.z + 4.2 * back);
      lookTarget.set(0, 1.35, P.z);
    } else {
      camTarget.set(portrait ? 0.15 : 0.55, 1.6, P.z + (portrait ? 3.6 : 2.35));
      lookTarget.set(portrait ? 0 : -0.25, portrait ? 1.45 : 1.52, P.z);
    }

    // Scroll: crane up into the night sky.
    const s = scroll.get();
    camTarget.y += s * s * 9;
    camTarget.z += s * 3;
    lookTarget.y += s * 14;
    lookTarget.z -= s * 10;

    const kf = 1 - Math.pow(e >= T_ARRIVE ? 0.15 : 0.0008, d);
    camera.position.lerp(camTarget, kf);
    lookAt.lerp(lookTarget, kf);

    // Impact shake + gentle handheld drift.
    const shake = fx.sinceImpact >= 0 ? 0.2 * Math.exp(-fx.sinceImpact * 3.2) : 0;
    camera.position.x += (Math.random() - 0.5) * shake + Math.sin(now * 0.9) * 0.004;
    camera.position.y += (Math.random() - 0.5) * shake + Math.cos(now * 1.3) * 0.004;
    camera.lookAt(lookAt);

    // ── Lights travel with the persona
    target.position.set(0, 1.2, P.z);
    target.updateMatrixWorld();
    if (key.current) {
      key.current.position.set(-2.4, 3.2, P.z + 3.2);
      key.current.target = target;
    }
    if (rim.current) {
      rim.current.position.set(1.2, 3, P.z - 4);
      rim.current.target = target;
      rim.current.intensity = 3.2 + P.glow * 2;
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

/** The falling comet and the light it throws on the street. */
const Comet = () => {
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const trailRotation = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), COMET_DIR), []);
  const trailOffset = useMemo(() => COMET_DIR.clone().multiplyScalar(7), []);

  useFrame(() => {
    if (group.current) {
      group.current.visible = fx.cometOn;
      group.current.position.copy(fx.comet);
    }
    if (light.current) {
      // Follows the comet, then flashes on impact and fades.
      const flash = fx.sinceImpact >= 0 ? 90 * Math.exp(-fx.sinceImpact * 5) : 0;
      light.current.intensity = fx.cometOn ? 40 : flash;
      if (fx.cometOn) light.current.position.copy(fx.comet);
      else light.current.position.set(COMET_TO.x, 1.2, COMET_TO.z);
    }
  });

  return (
    <>
      <group ref={group} visible={false}>
        <mesh>
          <sphereGeometry args={[0.7, 16, 12]} />
          {/* fog={false}: it is far up in the sky and must still blaze */}
          <meshBasicMaterial color="#ffffff" toneMapped={false} fog={false} />
        </mesh>
        <mesh quaternion={trailRotation} position={trailOffset}>
          <coneGeometry args={[0.65, 14, 12, 1, true]} />
          <meshBasicMaterial
            color="#3ee6d9"
            fog={false}
            transparent
            opacity={0.75}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      <pointLight ref={light} color="#9ff7f0" intensity={0} distance={26} decay={1.6} />
    </>
  );
};

/** Shockwave rings, a glowing crater and a burst of debris at the landing. */
const ImpactFx = () => {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const crater = useRef<THREE.Mesh>(null);
  const debris = useRef<THREE.Points>(null);
  const COUNT = 180;
  const { geom, vel } = useMemo(() => {
    const v = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * 4;
      v[i * 3] = Math.cos(a) * sp;
      v[i * 3 + 1] = 2.5 + Math.random() * 6;
      v[i * 3 + 2] = Math.sin(a) * sp;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    return { geom: g, vel: v };
  }, []);

  useFrame(() => {
    const t = fx.sinceImpact;
    const on = t >= 0;
    const ring = (m: THREE.Mesh | null, delay: number, speed: number, life: number) => {
      if (!m) return;
      const k = t - delay;
      m.visible = on && k >= 0 && k < life;
      if (!m.visible) return;
      m.scale.setScalar(0.5 + k * speed);
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - k / life) * 0.9;
    };
    ring(ring1.current, 0, 13, 1.1);
    ring(ring2.current, 0.12, 8, 1.4);

    if (crater.current) {
      crater.current.visible = on;
      // Glows hot, then cools to a faint scorch mark.
      (crater.current.material as THREE.MeshBasicMaterial).opacity = on ? 0.08 + 0.92 * Math.exp(-t * 0.9) : 0;
    }

    if (debris.current) {
      debris.current.visible = on && t < 2.6;
      if (debris.current.visible) {
        const pos = geom.getAttribute("position") as THREE.BufferAttribute;
        for (let i = 0; i < COUNT; i++) {
          const y = Math.max(0.02, vel[i * 3 + 1] * t - 4.9 * t * t);
          pos.setXYZ(i, vel[i * 3] * t, y, LAND_Z + vel[i * 3 + 2] * t);
        }
        pos.needsUpdate = true;
        (debris.current.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - t / 2.6);
      }
    }
  });

  const flat: [number, number, number] = [-Math.PI / 2, 0, 0];
  return (
    <>
      <mesh ref={ring1} position={[0, 0.03, LAND_Z]} rotation={flat} visible={false}>
        <ringGeometry args={[0.92, 1, 72]} />
        <meshBasicMaterial color="#9ff7f0" transparent toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={ring2} position={[0, 0.035, LAND_Z]} rotation={flat} visible={false}>
        <ringGeometry args={[0.85, 1, 72]} />
        <meshBasicMaterial color="#ff6b35" transparent toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={crater} position={[0, 0.025, LAND_Z]} rotation={flat} visible={false}>
        <ringGeometry args={[0.25, 1.15, 48]} />
        <meshBasicMaterial color="#ff6b35" transparent opacity={0} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <points ref={debris} geometry={geom} visible={false}>
        <pointsMaterial color="#ffd3a8" size={0.06} transparent depthWrite={false} toneMapped={false} />
      </points>
    </>
  );
};

export default function CityScene({
  play,
  active,
  scroll,
  skip,
  reduced,
  onBeat,
}: {
  play: boolean;
  active: boolean;
  scroll: MotionValue<number>;
  skip: number;
  reduced: boolean;
  onBeat: (beat: string) => void;
}) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={mobile ? [1, 1.25] : [1, 1.6]}
      camera={{ fov: 38, near: 0.05, far: 140 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#05060a"]} />
      <fog attach="fog" args={["#07080d", 7, 52]} />
      <City quality={mobile ? 0.5 : 1} />
      <Persona />
      <Comet />
      <ImpactFx />
      <Director play={play} scroll={scroll} skip={skip} reduced={reduced} onBeat={onBeat} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={1.25} luminanceThreshold={0.5} luminanceSmoothing={0.2} mipmapBlur />
        <Vignette offset={0.25} darkness={0.78} />
      </EffectComposer>
    </Canvas>
  );
}
