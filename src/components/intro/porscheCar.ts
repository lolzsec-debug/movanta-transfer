/**
 * porscheCar.ts — hero-car loader for the highway intro.
 *
 * Loads public/models/porsche-911.glb — "(FREE) Porsche 911 Carrera 4S" by
 * Karol Miklas (https://sketchfab.com/karolmiklas), CC-BY-SA-4.0, meshopt-
 * compressed from the original Sketchfab export (25 MB → 8 MB) with node
 * hierarchy and material names intact.
 *
 * The raw export is a Blender studio scene: Z-up, car nose toward -Y, studio
 * props (backdrop planes, floor card, softbox) baked in as meshes, and all
 * node transforms identity (geometry in world space). This module strips the
 * props, wraps the two axle-pair nodes in spin pivots, and normalizes the
 * model into the intro's car frame: nose toward -z, wheels resting on y = 0,
 * real-world meters. Lights ramp via the emissive light-unit material plus
 * headlight SpotLights and a red tail PointLight, mirroring the procedural
 * XC60's dressing so the intro timeline can drive either car identically.
 */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { withBasePath } from "@/lib/basePath";

export type PorscheRig = {
  /** Normalized car; add to the scene's car mount. */
  group: THREE.Group;
  /** Axle-pair pivots; rotation.x += dz * wheelSpin rolls them forward. */
  wheels: THREE.Object3D[];
  /** Signed roll rate in rad per meter of forward travel. */
  wheelSpin: number;
  /** 0..1 headlight/taillight ramp (same contract as the XC60 dressing). */
  setLightsOn(k: number): void;
  /** Free every GPU resource the GLB brought in. */
  dispose(): void;
};

const CAR_LENGTH = 4.52; // 992 Carrera 4S overall length, meters

/** Studio props baked into the Sketchfab scene — not part of the car. */
const PROPS = new Set(["Plane", "Plane.002", "Plane.003", "Plane.004", "Cube.001", "Cube.002"]);

/** Front and rear wheel pairs (each node holds tire+rim for both sides). */
const AXLES = ["Cylinder.001", "Cylinder.000"];

/** Env-map pickup per source material, tuned for the dim blue-hour PMREM. */
const ENV_BY_MATERIAL: Record<string, number> = {
  paint: 2.4,
  coat: 2.4,
  silver: 2.0,
  glass: 2.2,
  window: 2.2,
  lights: 2.0,
  tex_shiny: 1.6,
  full_black: 1.2,
  plastic: 0.8,
  rubber: 0.5,
};

const LIGHT_EMISSIVE_MAX = 3.0;
const SPOT_INTENSITY_MAX = 1400;
const SPOT_DISTANCE = 90;
const SPOT_ANGLE = 0.45;
const SPOT_PENUMBRA = 0.4;
const SPOT_DECAY = 1.6;
const SPOT_TARGET_AHEAD = 35;
const TAIL_GLOW_INTENSITY_MAX = 2.5;
const TAIL_GLOW_DISTANCE = 3.5;

const smooth01 = (k: number) => {
  const x = Math.min(1, Math.max(0, k));
  return x * x * (3 - 2 * x);
};

export function loadPorsche(): Promise<PorscheRig> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      withBasePath("/models/porsche-911.glb"),
      (gltf) => {
        try {
          resolve(rigUp(gltf.scene));
        } catch (err) {
          reject(err);
        }
      },
      undefined,
      reject
    );
  });
}

function rigUp(raw: THREE.Group): PorscheRig {
  // ---- strip studio props ----
  const doomed: THREE.Object3D[] = [];
  raw.traverse((o) => {
    if (PROPS.has(o.name)) doomed.push(o);
  });
  for (const o of doomed) o.removeFromParent();

  // ---- wheel pivots ----
  // The meshopt/quantize pass moved real transforms onto the nodes (the
  // Sketchfab wrapper now carries the Z-up→Y-up rotation and a uniform
  // scale), so nothing here may assume identity: boxes are measured in world
  // space and pivot centers converted into the axle node's parent space.
  // Parent-local space is still the original Blender frame (Z-up, nose -Y),
  // so rolling forward is +x spin on the pivots.
  raw.updateMatrixWorld(true);
  const wheels: THREE.Object3D[] = [];
  let rawWheelRadius = 0.35;
  for (const name of AXLES) {
    const node = raw.getObjectByName(name);
    if (!node || !node.parent) continue;
    const box = new THREE.Box3().setFromObject(node);
    rawWheelRadius = (box.max.y - box.min.y) / 2; // loader world is Y-up
    const centerLocal = node.parent.worldToLocal(box.getCenter(new THREE.Vector3()));
    const pivot = new THREE.Group();
    pivot.position.copy(centerLocal);
    node.parent.add(pivot);
    pivot.add(node);
    node.position.sub(centerLocal);
    wheels.push(pivot);
  }

  // ---- orient into the car frame ----
  // The loaded scene is already Y-up (glTF convention); only the nose needs
  // to point toward -z. Detect which end the front bumper sits on rather
  // than hard-coding, so a re-exported asset can't silently reverse the car.
  const frontNode = raw.getObjectByName("bumper_front.004");
  let noseZ = 1; // current asset: nose toward +z
  if (frontNode) {
    const fb = new THREE.Box3().setFromObject(frontNode);
    noseZ = fb.getCenter(new THREE.Vector3()).z >= 0 ? 1 : -1;
  }
  const yaw = new THREE.Group();
  if (noseZ > 0) yaw.rotation.y = Math.PI;
  yaw.add(raw);

  // ---- scale to real meters, wheels on y = 0, centered on x/z ----
  // `norm` carries the scale/offset; the returned `group` stays identity so
  // lights and flares can attach to it in real-world meters.
  const norm = new THREE.Group();
  norm.add(yaw);
  norm.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(norm);
  const s = CAR_LENGTH / (box.max.z - box.min.z);
  norm.scale.setScalar(s);
  const center = box.getCenter(new THREE.Vector3());
  norm.position.set(-center.x * s, -box.min.y * s, -center.z * s);

  const group = new THREE.Group();
  group.name = "porsche911";
  group.add(norm);

  const wheelRadius = rawWheelRadius * s;
  // Raw frame: rolling toward the nose (-Y_raw) moves the wheel top toward
  // -Y_raw, which is rotation.x increasing on the raw-space pivots.
  const wheelSpin = 1 / wheelRadius;

  // ---- material dressing ----
  let lightUnits: THREE.MeshStandardMaterial | null = null;
  const seen = new Set<THREE.Material>();
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  group.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    geometries.push(o.geometry);
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    let transparent = false;
    for (const m of mats) {
      if (!(m instanceof THREE.MeshStandardMaterial)) continue;
      transparent = transparent || m.transparent;
      if (seen.has(m)) continue;
      seen.add(m);
      materials.push(m);
      m.envMapIntensity = ENV_BY_MATERIAL[m.name] ?? 1.0;
      if (m.name === "tex_shiny") {
        // The light units: emissive texture covering DRLs + the tail bar.
        m.emissiveIntensity = 0;
        lightUnits = m;
      }
    }
    o.castShadow = !transparent;
    o.receiveShadow = false;
  });

  // ---- real light sources ----
  const spots: THREE.SpotLight[] = [];
  for (const x of [-0.65, 0.65]) {
    const spot = new THREE.SpotLight(0xfff1d8, 0, SPOT_DISTANCE, SPOT_ANGLE, SPOT_PENUMBRA, SPOT_DECAY);
    spot.position.set(x, 0.62, -CAR_LENGTH / 2 + 0.25);
    spot.castShadow = false;
    const target = new THREE.Object3D();
    target.position.set(x, 0.05, -CAR_LENGTH / 2 - SPOT_TARGET_AHEAD);
    group.add(target);
    spot.target = target;
    group.add(spot);
    spots.push(spot);
  }
  const tailLight = new THREE.PointLight(0xff2a1e, 0, TAIL_GLOW_DISTANCE, 2);
  tailLight.position.set(0, 0.75, CAR_LENGTH / 2 - 0.25);
  tailLight.castShadow = false;
  group.add(tailLight);

  const setLightsOn = (k: number): void => {
    const t = Math.min(1, Math.max(0, k));
    if (lightUnits) lightUnits.emissiveIntensity = LIGHT_EMISSIVE_MAX * t;
    for (const spot of spots) spot.intensity = SPOT_INTENSITY_MAX * smooth01(t);
    tailLight.intensity = TAIL_GLOW_INTENSITY_MAX * t;
  };

  const dispose = (): void => {
    for (const g of geometries) g.dispose();
    for (const m of materials) {
      if (m instanceof THREE.MeshStandardMaterial) {
        m.map?.dispose();
        m.normalMap?.dispose();
        m.metalnessMap?.dispose();
        m.roughnessMap?.dispose();
        m.emissiveMap?.dispose();
        m.aoMap?.dispose();
      }
      m.dispose();
    }
    for (const spot of spots) spot.dispose();
    tailLight.dispose();
  };

  setLightsOn(0);
  return { group, wheels, wheelSpin, setLightsOn, dispose };
}
