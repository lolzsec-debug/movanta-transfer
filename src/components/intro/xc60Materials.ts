/**
 * xc60Materials.ts — PBR dressing for the procedural Volvo XC60.
 *
 * Replaces the geometry module's per-slot placeholder materials with tuned
 * MeshPhysical/MeshStandard materials, wires up real light sources (headlight
 * SpotLights + taillight PointLight) and exposes a small runtime API for the
 * intro timeline (setLightsOn / update / dispose).
 *
 * Tuned for src/components/intro/highwayScene.ts: blue hour, ACES filmic at
 * exposure 1.15, RoomEnvironment PMREM at environmentIntensity 0.35, fog
 * 0x1b2438 from 70 m, chase camera at the REAR / RIGHT-REAR. The env map is
 * dim, so reflective slots run envMapIntensity well above 1 to keep the paint
 * shoulder line and glass alive; taillights are the hero and run brighter
 * than the DRLs.
 */

import * as THREE from "three";
import type { XC60Build } from "./xc60Geometry";

export type XC60Dressed = {
  /** 0..1 headlight/taillight/DRL intensity ramp driven by the intro timeline. */
  setLightsOn(k: number): void;
  /** Advance any time-based effects (optional no-op). */
  update(dt: number): void;
  /** Dispose every material/texture/light this module created. */
  dispose(): void;
};

type Slot = keyof NonNullable<XC60Build["slots"]>;

// ---------------------------------------------------------------------------
// Tuning knobs (the integrator's dials)
// ---------------------------------------------------------------------------

/** Paint env pickup — the main "does the shoulder line catch the afterglow" dial. */
const PAINT_ENV_INTENSITY = 2.6;
/** Thor's-hammer DRL emissive at k = 1 (cool white, kept below ACES bloom-out). */
const DRL_EMISSIVE_MAX = 2.6;
/** Taillight emissive: BASE lights up as running lights the moment k > 0. */
const REAR_EMISSIVE_BASE = 0.55;
const REAR_EMISSIVE_SPAN = 1.1; // total at k=1: BASE + SPAN = 1.65 — ACES pushes the
// 0xff2a1e primary toward orange well before this, so staying low keeps it red
/** Headlight SpotLight peak intensity (candela; three r155+ physical units). */
const SPOT_INTENSITY_MAX = 1400;
const SPOT_DISTANCE = 90;
const SPOT_ANGLE = 0.45;
const SPOT_PENUMBRA = 0.4;
/** Physical decay is 2; slightly lower throws the beam pool further up-road in fog. */
const SPOT_DECAY = 1.6;
/** How far ahead of the car (m) the spot targets sit, at road level. */
const SPOT_TARGET_AHEAD = 35;
/** Faint red bounce on the tailgate/bumper from the taillights. */
const TAIL_GLOW_INTENSITY_MAX = 2.5;
const TAIL_GLOW_DISTANCE = 3.5;

// ---------------------------------------------------------------------------
// Procedural helpers
// ---------------------------------------------------------------------------

/**
 * Tiny gray-noise CanvasTexture used as a bump map on the tire sidewall so
 * the rubber breaks up specular from the street lamps. Null in SSR contexts.
 */
function makeSpeckleTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 108 + Math.floor(Math.random() * 40); // mid-gray speckle
    img.data[i * 4 + 0] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 3);
  return tex;
}

function smooth01(k: number): number {
  const x = Math.min(1, Math.max(0, k));
  return x * x * (3 - 2 * x);
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export function applyXC60Materials(build: XC60Build): XC60Dressed {
  const textures: THREE.Texture[] = [];
  const speckle = makeSpeckleTexture();
  if (speckle) textures.push(speckle);

  // ---- material bank ------------------------------------------------------

  // Volvo "Denim Blue" metallic. Base kept a notch above the reference hex so
  // metalness 0.85 + dim env (0.35) doesn't crush to black under ACES; the
  // clearcoat supplies the wet-gloss highlight, envMapIntensity the body glow.
  const paint = new THREE.MeshPhysicalMaterial({
    name: "paint",
    color: 0x35536f,
    metalness: 0.85,
    roughness: 0.34,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    envMapIntensity: PAINT_ENV_INTENSITY,
  });

  // Opaque near-black privacy glass: cheap, and at blue hour reads exactly
  // like real tinted glass — pure specular/env response over a dark body.
  const glass = new THREE.MeshPhysicalMaterial({
    name: "glass",
    color: 0x0a0e13,
    metalness: 0.0,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 2.2,
    specularIntensity: 1.2,
    side: THREE.DoubleSide, // open patches (DLO kick-up) never show holes
    polygonOffset: true, // insets hug the hull; nudge to kill any z-fight
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const trim = new THREE.MeshStandardMaterial({
    name: "trim",
    color: 0x141619,
    metalness: 0.0,
    roughness: 0.7,
    envMapIntensity: 0.9,
  });

  const chrome = new THREE.MeshStandardMaterial({
    name: "chrome",
    color: 0xe8ecef,
    metalness: 1.0,
    roughness: 0.12,
    envMapIntensity: 2.2,
  });

  const tire = new THREE.MeshStandardMaterial({
    name: "tire",
    color: 0x0b0b0c,
    metalness: 0.0,
    roughness: 1.0,
    envMapIntensity: 0.5,
    ...(speckle ? { bumpMap: speckle, bumpScale: 0.6 } : {}),
  });

  const rim = new THREE.MeshStandardMaterial({
    name: "rim",
    color: 0xb9bec6,
    metalness: 0.95,
    roughness: 0.3,
    envMapIntensity: 1.6,
  });

  const underbody = new THREE.MeshStandardMaterial({
    name: "underbody",
    color: 0x07080a,
    metalness: 0.0,
    roughness: 1.0,
    envMapIntensity: 0.2,
  });

  // Light diffuse plate with a tiny constant emissive — fakes the
  // retroreflective sheet catching the fill/lamps behind the car.
  const plate = new THREE.MeshStandardMaterial({
    name: "plate",
    color: 0xaeb4b8,
    metalness: 0.0,
    roughness: 0.6,
    emissive: 0x9aa4ae,
    emissiveIntensity: 0,
    envMapIntensity: 0.6,
  });

  // Headlight lens + Thor's-hammer DRL blades. At k=0 this is dark smoked
  // glass; setLightsOn ramps the cool-white emissive.
  const lightFront = new THREE.MeshPhysicalMaterial({
    name: "lightFront",
    color: 0x0c1016,
    metalness: 0.0,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 2.0,
    emissive: 0xdfe9ff,
    emissiveIntensity: 0,
  });

  // Volvo signature red L-blades — the most camera-facing element. Dark red
  // acrylic when off; running-light base + ramp when on. Brighter than DRLs.
  const lightRear = new THREE.MeshPhysicalMaterial({
    name: "lightRear",
    color: 0x2a0806,
    metalness: 0.0,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.6,
    emissive: 0xe8140e,
    emissiveIntensity: 0,
  });

  const materials: Record<Slot, THREE.Material> = {
    paint,
    glass,
    trim,
    chrome,
    tire,
    rim,
    lightFront,
    lightRear,
    underbody,
    plate,
  };

  // ---- swap placeholders in, retire them ---------------------------------

  const retired = new Set<THREE.Material>();
  for (const slotName of Object.keys(materials) as Slot[]) {
    const meshes = build.slots[slotName];
    if (!meshes) continue;
    for (const mesh of meshes) {
      const old = mesh.material;
      if (old instanceof THREE.Material) retired.add(old);
      mesh.material = materials[slotName];
    }
  }
  for (const m of retired) m.dispose();

  // ---- real light sources (parented inside build.group → move with car) --

  const spots: THREE.SpotLight[] = [];
  const spotTargets: THREE.Object3D[] = [];
  for (const anchor of build.headlightAnchors) {
    const spot = new THREE.SpotLight(
      0xfff1d8,
      0,
      SPOT_DISTANCE,
      SPOT_ANGLE,
      SPOT_PENUMBRA,
      SPOT_DECAY,
    );
    spot.position.copy(anchor);
    spot.castShadow = false;

    const target = new THREE.Object3D();
    target.name = "headlightTarget";
    // Road level, well ahead of the nose (nose points toward -z).
    target.position.set(anchor.x, 0.05, anchor.z - SPOT_TARGET_AHEAD);
    build.group.add(target);
    spot.target = target;

    build.group.add(spot);
    spots.push(spot);
    spotTargets.push(target);
  }

  const tailLight = new THREE.PointLight(0xff2a1e, 0, TAIL_GLOW_DISTANCE, 2);
  tailLight.castShadow = false;
  const tailAnchor = build.group.getObjectByName("tailGlow");
  if (tailAnchor) {
    tailAnchor.add(tailLight);
  } else {
    tailLight.position.set(0, 1.0, 2.3); // SPEC fallback position
    build.group.add(tailLight);
  }

  // ---- runtime API --------------------------------------------------------

  const setLightsOn = (k: number): void => {
    const t = Math.min(1, Math.max(0, k));
    const eased = smooth01(t);

    // DRL: cool white, linear ramp, dark lens at 0.
    lightFront.emissiveIntensity = DRL_EMISSIVE_MAX * t;

    // Taillights: running-light base the moment k > 0, then ramp. Rear owns
    // the frame, so it lands brighter than the DRLs at every k.
    lightRear.emissiveIntensity =
      t <= 0 ? 0 : REAR_EMISSIVE_BASE + REAR_EMISSIVE_SPAN * t;

    // Beam pool on the asphalt ahead; eased so the fade-in feels electrical.
    for (const s of spots) s.intensity = SPOT_INTENSITY_MAX * eased;

    // Red bounce on the tailgate/bumper.
    tailLight.intensity = TAIL_GLOW_INTENSITY_MAX * t;
  };

  const update = (dt: number): void => {
    void dt; // no time-based effects yet; hook kept for the integrator
  };

  const dispose = (): void => {
    for (const m of Object.values(materials)) m.dispose();
    for (const tex of textures) tex.dispose();
    for (const s of spots) {
      s.removeFromParent();
      s.dispose();
    }
    for (const target of spotTargets) target.removeFromParent();
    tailLight.removeFromParent();
    tailLight.dispose();
  };

  setLightsOn(0);
  return { setLightsOn, update, dispose };
}
