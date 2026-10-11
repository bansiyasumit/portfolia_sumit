"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { voiceState } from "@/lib/voice";

export type PersonaMode = "walk" | "idle" | "wave" | "talk" | "think";

/** Shared, mutable director state — written by the UI, read every frame. */
export const personaState = {
  mode: "walk" as PersonaMode,
  /** world position along the street (z); the director moves it */
  z: -26,
  /** set by the director: 0 = standing, 1 = full walking speed */
  walkAmount: 1,
};

// Palette taken from the profile photo.
const C = {
  skin: "#c98c69",
  skinShade: "#b07656",
  hair: "#17110d",
  beard: "#21180f",
  blazer: "#1d2638",
  blazerDark: "#151c2a",
  tee: "#f6f4ef",
  trousers: "#202329",
  shoes: "#0d0d0f",
  eye: "#120c09",
  lip: "#7a3f34",
};

const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, flatShading: true, ...extra });

const lerp = THREE.MathUtils.lerp;

/**
 * Stylized low-poly digital twin of Sumit: navy blazer over a white tee,
 * swept-up quiff and a full beard. Built from primitives on a simple joint
 * hierarchy and animated procedurally (walk cycle, wave, talk gestures,
 * thinking pose, breathing, blinking and lip-sync from the voice engine).
 */
export const Persona = () => {
  const m = useMemo(
    () => ({
      skin: mat(C.skin),
      skinShade: mat(C.skinShade),
      hair: mat(C.hair, { roughness: 0.9 }),
      beard: mat(C.beard, { roughness: 1 }),
      blazer: mat(C.blazer, { roughness: 0.85 }),
      blazerDark: mat(C.blazerDark, { roughness: 0.85 }),
      tee: mat(C.tee, { roughness: 0.95, emissive: "#2a2a2a" }),
      trousers: mat(C.trousers),
      shoes: mat(C.shoes, { roughness: 0.4, metalness: 0.2 }),
      eye: mat(C.eye, { roughness: 0.2 }),
      eyeWhite: mat("#efe9e2", { roughness: 0.4 }),
      lip: mat(C.lip),
      mouth: mat("#2a0f0b"),
    }),
    []
  );

  const j = {
    root: useRef<THREE.Group>(null),
    hips: useRef<THREE.Group>(null),
    spine: useRef<THREE.Group>(null),
    chest: useRef<THREE.Group>(null),
    neck: useRef<THREE.Group>(null),
    head: useRef<THREE.Group>(null),
    shoulderL: useRef<THREE.Group>(null),
    shoulderR: useRef<THREE.Group>(null),
    elbowL: useRef<THREE.Group>(null),
    elbowR: useRef<THREE.Group>(null),
    thighL: useRef<THREE.Group>(null),
    thighR: useRef<THREE.Group>(null),
    kneeL: useRef<THREE.Group>(null),
    kneeR: useRef<THREE.Group>(null),
    jaw: useRef<THREE.Group>(null),
    mouth: useRef<THREE.Mesh>(null),
    lids: useRef<THREE.Group>(null),
  };

  const phase = useRef(0);
  const mouthOpen = useRef(0);
  const blink = useRef({ next: 2, t: 0 });
  const gesture = useRef({ next: 1.5, side: 1, t: 0 });

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const d = Math.min(dt, 0.05);
    const mode = personaState.mode;
    const w = personaState.walkAmount; // 0..1 blend toward walking
    const k = 1 - Math.pow(0.0015, d); // frame-rate independent smoothing

    phase.current += d * 2 * Math.PI * 0.9 * Math.max(w, 0.0001);
    const p = phase.current;
    const s = Math.sin(p), c = Math.cos(p);

    if (j.root.current) j.root.current.position.z = personaState.z;

    // ── Lower body: walk cycle blended with a relaxed stance
    if (j.hips.current) {
      j.hips.current.position.y = 0.95 + w * Math.abs(c) * 0.035 - w * 0.02 + Math.sin(t * 1.6) * 0.003;
      j.hips.current.rotation.y = w * s * 0.09;
      j.hips.current.rotation.z = w * c * 0.03;
    }
    const legSwing = 0.48 * w;
    if (j.thighL.current) j.thighL.current.rotation.x = lerp(j.thighL.current.rotation.x, -s * legSwing, k);
    if (j.thighR.current) j.thighR.current.rotation.x = lerp(j.thighR.current.rotation.x, s * legSwing, k);
    if (j.kneeL.current) j.kneeL.current.rotation.x = lerp(j.kneeL.current.rotation.x, 0.05 + w * Math.max(0, c) * 0.95, k);
    if (j.kneeR.current) j.kneeR.current.rotation.x = lerp(j.kneeR.current.rotation.x, 0.05 + w * Math.max(0, -c) * 0.95, k);

    // ── Torso: counter-twist, breathing
    if (j.spine.current) {
      j.spine.current.rotation.y = -w * s * 0.12;
      j.spine.current.rotation.x = lerp(j.spine.current.rotation.x, w * 0.06 + (mode === "think" ? 0.05 : 0), k);
    }
    if (j.chest.current) j.chest.current.scale.setScalar(1 + Math.sin(t * 1.7) * 0.008);

    // ── Arms: targets per mode
    let lx = w * s * 0.42, lz = 0.09, lex = -0.25 - w * 0.1, lez = 0;
    let rx = -w * s * 0.42, rz = -0.09, rex = -0.25 - w * 0.1, rez = 0;

    if (mode === "wave") {
      rz = -2.55;
      rx = -0.15;
      rex = 0;
      rez = -0.35 + Math.sin(t * 9) * 0.38;
    } else if (mode === "think") {
      // right hand to the chin, left arm folded across to support the elbow
      rx = -1.0;
      rz = 0.38;
      rex = -2.35;
      lx = -0.55;
      lz = -0.45;
      lex = -1.55;
    } else if (mode === "talk") {
      const g = gesture.current;
      g.t += d;
      if (g.t > g.next) {
        g.t = 0;
        g.next = 1.2 + Math.random() * 1.6;
        g.side = Math.random() > 0.5 ? 1 : -1;
      }
      const lift = Math.sin(Math.min(1, g.t / 0.5) * Math.PI) * 0.9 + 0.25;
      const beat = Math.sin(t * 3.2) * 0.12;
      if (g.side > 0) {
        rx = -0.35 - lift * 0.35;
        rex = -1.2 - beat;
        rz = -0.25;
      } else {
        lx = -0.35 - lift * 0.35;
        lex = -1.2 + beat;
        lz = 0.25;
      }
    }

    if (j.shoulderL.current) {
      j.shoulderL.current.rotation.x = lerp(j.shoulderL.current.rotation.x, lx, k);
      j.shoulderL.current.rotation.z = lerp(j.shoulderL.current.rotation.z, lz, k);
    }
    if (j.shoulderR.current) {
      j.shoulderR.current.rotation.x = lerp(j.shoulderR.current.rotation.x, rx, k);
      j.shoulderR.current.rotation.z = lerp(j.shoulderR.current.rotation.z, rz, k);
    }
    if (j.elbowL.current) {
      j.elbowL.current.rotation.x = lerp(j.elbowL.current.rotation.x, lex, k);
      j.elbowL.current.rotation.z = lerp(j.elbowL.current.rotation.z, lez, k);
    }
    if (j.elbowR.current) {
      j.elbowR.current.rotation.x = lerp(j.elbowR.current.rotation.x, rex, k);
      j.elbowR.current.rotation.z = lerp(j.elbowR.current.rotation.z, rez, k);
    }

    // ── Head: look at the camera, nod while talking, tilt while thinking
    if (j.head.current) {
      const cam = state.camera.position;
      const headWorld = new THREE.Vector3();
      j.head.current.getWorldPosition(headWorld);
      const yaw = Math.atan2(cam.x - headWorld.x, cam.z - headWorld.z);
      const pitch = -Math.atan2(cam.y - headWorld.y, Math.hypot(cam.x - headWorld.x, cam.z - headWorld.z)) * 0.6;
      const nod = mode === "talk" ? Math.sin(t * 4.1) * 0.05 + Math.sin(t * 1.3) * 0.03 : 0;
      j.head.current.rotation.y = lerp(j.head.current.rotation.y, THREE.MathUtils.clamp(yaw, -0.7, 0.7), k * 0.6);
      j.head.current.rotation.x = lerp(j.head.current.rotation.x, pitch + nod + (mode === "think" ? 0.12 : 0), k * 0.6);
      j.head.current.rotation.z = lerp(j.head.current.rotation.z, mode === "think" ? 0.12 : w * c * 0.03, k);
    }

    // ── Lip-sync from the voice engine
    voiceState.wordPulse = Math.max(0, voiceState.wordPulse - d * 5);
    const talking = voiceState.speaking;
    const target = talking ? 0.25 + voiceState.wordPulse * 0.55 + (Math.sin(t * 17) * 0.5 + 0.5) * 0.35 : 0;
    mouthOpen.current = lerp(mouthOpen.current, target, 1 - Math.pow(0.0001, d));
    if (j.mouth.current) j.mouth.current.scale.y = 0.15 + mouthOpen.current * 1.4;
    if (j.jaw.current) j.jaw.current.rotation.x = mouthOpen.current * 0.12;

    // ── Blink
    const b = blink.current;
    b.t += d;
    if (b.t > b.next) {
      b.t = 0;
      b.next = 2 + Math.random() * 3;
    }
    if (j.lids.current) j.lids.current.scale.y = b.t < 0.12 ? 1 : 0.001;
  });

  // Reusable limb geometries (low-poly)
  const g = useMemo(
    () => ({
      thigh: new THREE.CapsuleGeometry(0.085, 0.32, 3, 7),
      shin: new THREE.CapsuleGeometry(0.07, 0.34, 3, 7),
      upperArm: new THREE.CapsuleGeometry(0.068, 0.22, 3, 7),
      foreArm: new THREE.CapsuleGeometry(0.058, 0.2, 3, 7),
      hand: new THREE.SphereGeometry(0.055, 7, 6),
      shoe: new THREE.BoxGeometry(0.11, 0.08, 0.27),
      head: new THREE.SphereGeometry(0.115, 12, 10),
      beard: new THREE.SphereGeometry(0.121, 12, 8, Math.PI / 2 - 1.5, 3.0, Math.PI * 0.6, Math.PI * 0.32),
      hairCap: new THREE.SphereGeometry(0.124, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.4),
      quiff: new THREE.SphereGeometry(0.07, 8, 6),
    }),
    []
  );

  const Leg = ({ side }: { side: 1 | -1 }) => (
    <group ref={side === 1 ? j.thighL : j.thighR} position={[0.095 * side, -0.02, 0]}>
      <mesh geometry={g.thigh} material={m.trousers} position={[0, -0.22, 0]} />
      <group ref={side === 1 ? j.kneeL : j.kneeR} position={[0, -0.44, 0]}>
        <mesh geometry={g.shin} material={m.trousers} position={[0, -0.22, 0]} />
        <mesh geometry={g.shoe} material={m.shoes} position={[0, -0.46, 0.05]} />
      </group>
    </group>
  );

  const Arm = ({ side }: { side: 1 | -1 }) => (
    <group ref={side === 1 ? j.shoulderL : j.shoulderR} position={[0.215 * side, -0.005, 0]}>
      <mesh geometry={g.upperArm} material={m.blazer} position={[0, -0.15, 0]} />
      <group ref={side === 1 ? j.elbowL : j.elbowR} position={[0, -0.3, 0]}>
        <mesh geometry={g.foreArm} material={m.blazer} position={[0, -0.13, 0]} />
        {/* tee cuff peeking out, then the hand */}
        <mesh material={m.skin} geometry={g.hand} position={[0, -0.3, 0.01]} scale={[0.9, 1.15, 0.7]} />
      </group>
    </group>
  );

  return (
    <group ref={j.root}>
      <group ref={j.hips} position={[0, 0.95, 0]}>
        {/* pelvis */}
        <mesh material={m.trousers} position={[0, -0.02, 0]} scale={[1, 0.6, 0.8]}>
          <sphereGeometry args={[0.16, 8, 6]} />
        </mesh>
        <Leg side={1} />
        <Leg side={-1} />

        <group ref={j.spine} position={[0, 0.04, 0]}>
          {/* blazer body — slightly tapered, open at the front over the tee */}
          <mesh material={m.blazer} position={[0, 0.27, -0.01]}>
            <cylinderGeometry args={[0.2, 0.17, 0.56, 9]} />
          </mesh>
          <mesh material={m.tee} position={[0, 0.3, 0.135]} scale={[1, 1, 0.5]}>
            <cylinderGeometry args={[0.075, 0.1, 0.5, 6]} />
          </mesh>
          {/* lapels */}
          <mesh material={m.blazerDark} position={[0.085, 0.36, 0.165]} rotation={[0.12, 0, -0.32]}>
            <boxGeometry args={[0.05, 0.3, 0.02]} />
          </mesh>
          <mesh material={m.blazerDark} position={[-0.085, 0.36, 0.165]} rotation={[0.12, 0, 0.32]}>
            <boxGeometry args={[0.05, 0.3, 0.02]} />
          </mesh>
          {/* pocket */}
          <mesh material={m.blazerDark} position={[-0.1, 0.12, 0.17]}>
            <boxGeometry args={[0.09, 0.012, 0.01]} />
          </mesh>

          <group ref={j.chest} position={[0, 0.5, 0]}>
            {/* shoulders */}
            <mesh material={m.blazer} position={[0, 0.0, -0.01]} scale={[1, 0.38, 0.62]}>
              <sphereGeometry args={[0.235, 10, 6]} />
            </mesh>
            {/* tee neckline */}
            <mesh material={m.tee} position={[0, 0.045, 0.03]}>
              <cylinderGeometry args={[0.058, 0.07, 0.04, 8]} />
            </mesh>
            <Arm side={1} />
            <Arm side={-1} />

            <group ref={j.neck} position={[0, 0.07, 0]}>
              <mesh material={m.skinShade} position={[0, 0.04, 0]}>
                <cylinderGeometry args={[0.048, 0.055, 0.1, 8]} />
              </mesh>

              <group ref={j.head} position={[0, 0.17, 0.01]}>
                <mesh geometry={g.head} material={m.skin} scale={[0.9, 1.08, 0.97]} />
                {/* ears */}
                <mesh material={m.skinShade} position={[0.1, 0, -0.005]} scale={[0.35, 0.8, 0.6]}>
                  <sphereGeometry args={[0.04, 6, 5]} />
                </mesh>
                <mesh material={m.skinShade} position={[-0.1, 0, -0.005]} scale={[0.35, 0.8, 0.6]}>
                  <sphereGeometry args={[0.04, 6, 5]} />
                </mesh>
                {/* nose */}
                <mesh material={m.skinShade} position={[0, -0.005, 0.112]} rotation={[0.25, 0, 0]}>
                  <coneGeometry args={[0.02, 0.055, 5]} />
                </mesh>
                {/* eyes */}
                {[1, -1].map((sx) => (
                  <group key={sx} position={[0.038 * sx, 0.025, 0.098]}>
                    <mesh material={m.eyeWhite} scale={[1, 0.6, 0.5]}>
                      <sphereGeometry args={[0.017, 8, 6]} />
                    </mesh>
                    <mesh material={m.eye} position={[0, 0, 0.007]}>
                      <sphereGeometry args={[0.009, 8, 6]} />
                    </mesh>
                    {/* brow — thick and straight like the photo */}
                    <mesh material={m.hair} position={[0.002 * sx, 0.028, 0.006]} rotation={[0, 0, -0.08 * sx]}>
                      <boxGeometry args={[0.042, 0.009, 0.01]} />
                    </mesh>
                  </group>
                ))}
                {/* eyelids for blinking */}
                <group ref={j.lids} position={[0, 0.03, 0.103]} scale={[1, 0.001, 1]}>
                  {[1, -1].map((sx) => (
                    <mesh key={sx} material={m.skin} position={[0.038 * sx, 0, 0]}>
                      <boxGeometry args={[0.04, 0.025, 0.012]} />
                    </mesh>
                  ))}
                </group>

                {/* hair: short sides + a tall swept quiff */}
                <mesh geometry={g.hairCap} material={m.hair} position={[0, 0.028, -0.01]} scale={[0.84, 0.95, 0.95]} />
                {/* voluminous quiff swept up and to his left, like the photo */}
                <mesh geometry={g.quiff} material={m.hair} position={[0.012, 0.155, 0.05]} scale={[1.35, 1.15, 1.05]} rotation={[-0.6, 0, -0.25]} />
                <mesh geometry={g.quiff} material={m.hair} position={[-0.04, 0.135, 0.015]} scale={[1.05, 1, 1.25]} rotation={[-0.3, 0, 0.3]} />
                <mesh geometry={g.quiff} material={m.hair} position={[0.045, 0.13, -0.02]} scale={[1, 0.95, 1.3]} rotation={[0, 0, -0.4]} />
                <mesh geometry={g.quiff} material={m.hair} position={[0, 0.105, -0.055]} scale={[1.3, 0.85, 1.15]} />

                {/* beard + moustache, with a jaw hinge for speech */}
                <group ref={j.jaw} position={[0, 0.0, 0]}>
                  <mesh geometry={g.beard} material={m.beard} scale={[0.92, 1.08, 0.99]} />
                </group>
                <mesh material={m.beard} position={[0, -0.043, 0.122]} rotation={[0.2, 0, 0]}>
                  <boxGeometry args={[0.06, 0.014, 0.012]} />
                </mesh>
                {/* mouth */}
                <mesh ref={j.mouth} material={m.mouth} position={[0, -0.06, 0.125]} scale={[1, 0.15, 1]}>
                  <boxGeometry args={[0.042, 0.022, 0.01]} />
                </mesh>
                <mesh material={m.lip} position={[0, -0.07, 0.126]}>
                  <boxGeometry args={[0.04, 0.006, 0.01]} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};
