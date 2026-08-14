/**
 * tunnelRoad.ts — tunnel environment loader for the highway intro.
 *
 * Loads public/models/tunnel-road.glb — "Tunnel Road" by Low poly 3d Models
 * (https://sketchfab.com/lowpoly3dmodels), CC-BY-4.0 — a single low-poly
 * mesh (~700 tris, one JPEG atlas). The raw export is a miniature (~5 m
 * long); this module normalizes it into the intro's world frame: bore
 * running along z, road surface on y = 0, scaled so one section is
 * TILE_LENGTH meters long. The intro clones the section into a treadmill.
 *
 * Everything is measured (world-space Box3), never assumed — Sketchfab
 * wrapper nodes carry baked matrices.
 *
 * The source section is a symmetric ARC (road center swings ~21 m across the
 * tile, measured from the vertices), which a straight treadmill can't tile.
 * rigUp bakes an "unbend" into the geometry: each vertex is shifted by the
 * fitted curve so the bore runs straight along z with the road centered on
 * x = 0. After unbending, the drivable road spans roughly x ±4.5 with walls
 * beyond ±5; the inner ceiling apex sits near y 6.3.
 */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { withBasePath } from "@/lib/basePath";

export type TunnelRig = {
  /** New instance of one normalized tunnel section (shares GPU resources). */
  buildTile(): THREE.Object3D;
  /** Section length in meters along z. */
  tileLength: number;
  /** Bore ceiling height above the road, meters. */
  ceilingHeight: number;
  /** Free geometry/material/texture. */
  dispose(): void;
};

/** One tunnel section is stretched/squeezed to exactly this many meters. */
const TILE_LENGTH = 240;
/** Slide the whole bore sideways so the right-hand lanes sit under the car. */
const LATERAL_SHIFT = 0;
/** Lift/sink the mesh if the lowest geometry isn't the road surface. */
const FLOOR_LIFT = 0;

/**
 * Fitted lateral arc of the source section's road centerline, in the
 * normalized frame (length-relative, so it survives TILE_LENGTH changes):
 * x(z) = L * (0.043 - 0.348 * (z/L)^2), i.e. +10.3 m mid-tile swinging to
 * -10.6 m at the portals. Subtracting it straightens the bore onto x = 0.
 */
const curveX = (z: number): number => {
  const u = z / TILE_LENGTH;
  return TILE_LENGTH * (0.043 - 0.348 * u * u);
};

export function loadTunnel(): Promise<TunnelRig> {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(
      withBasePath("/models/tunnel-road.glb"),
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

function rigUp(raw: THREE.Group): TunnelRig {
  raw.updateMatrixWorld(true);

  // The bore runs along the model's longest horizontal axis; spin it onto z.
  const box0 = new THREE.Box3().setFromObject(raw);
  const size0 = box0.getSize(new THREE.Vector3());
  const spin = new THREE.Group();
  if (size0.x > size0.z) spin.rotation.y = Math.PI / 2;
  spin.add(raw);

  const template = new THREE.Group();
  template.add(spin);
  template.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(template);
  const s = TILE_LENGTH / (box.max.z - box.min.z);
  spin.scale.setScalar(s);
  const center = box.getCenter(new THREE.Vector3());
  spin.position.set(
    -center.x * s + LATERAL_SHIFT,
    -box.min.y * s + FLOOR_LIFT,
    -center.z * s
  );

  const ceilingHeight = (box.max.y - box.min.y) * s;

  // Bake the unbend: move every vertex into the normalized frame, subtract
  // the road arc, and write it back. Done once — tile clones share the
  // straightened geometry.
  template.updateMatrixWorld(true);
  const seen = new Set<THREE.BufferGeometry>();
  const vw = new THREE.Vector3();
  template.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || seen.has(o.geometry)) return;
    seen.add(o.geometry);
    const inv = o.matrixWorld.clone().invert();
    const pos = o.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      vw.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      vw.x -= curveX(vw.z);
      vw.applyMatrix4(inv);
      pos.setXYZ(i, vw.x, vw.y, vw.z);
    }
    // Keep the authored normals: the unbend only tilts true normals by a few
    // degrees, while recomputing them from the low-poly indexed mesh flips
    // half the interior faces dark.
    pos.needsUpdate = true;
    o.geometry.computeBoundingBox();
    o.geometry.computeBoundingSphere();
  });

  // Dress the single material: sharpen the road texture at grazing angles
  // and collect resources for disposal.
  const geometries: THREE.BufferGeometry[] = [];
  const materials = new Set<THREE.Material>();
  template.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    geometries.push(o.geometry);
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      materials.add(m);
      if (m instanceof THREE.MeshStandardMaterial && m.map) {
        m.map.anisotropy = 8;
        m.envMapIntensity = 0.4;
      }
    }
    o.castShadow = false;
    o.receiveShadow = false;
  });

  const buildTile = (): THREE.Object3D => template.clone(true);

  const dispose = (): void => {
    for (const g of geometries) g.dispose();
    for (const m of materials) {
      if (m instanceof THREE.MeshStandardMaterial) m.map?.dispose();
      m.dispose();
    }
  };

  return { buildTile, tileLength: TILE_LENGTH, ceilingHeight, dispose };
}
