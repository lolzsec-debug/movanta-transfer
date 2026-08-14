/**
 * xc60Geometry.ts — procedural Volvo XC60 (2022, SPA) body-in-white + parts.
 *
 * Implements SPEC.md + sections.json from agent-workspaces/01-architect.
 * Frame: +x right, +y up, nose toward -z; origin at ground, mid-wheelbase,
 * centerline. Wheels rest on y = 0. Units: meters.
 *
 * Hull: 16 half-sections (10 semantic points P0..P9) lofted with uniform
 * Catmull-Rom both longitudinally (76 rings) and around each ring (37
 * ring-points per half, P_i lands exactly on ring-point j = 4i), mirrored and
 * welded into one watertight indexed mesh with fan-closed nose/tail caps.
 * Wheel arches are carved by radial projection onto the 0.46 m opening
 * cylinder (no booleans) with dark half-drum tunnels behind them.
 *
 * Triangle budget (measured by check.mjs): ~27k — well under the 60k cap.
 * Materials are per-slot placeholder MeshStandardMaterials; agent 3 replaces
 * them strictly by slot (also mirrored in mesh.userData.slot).
 */

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export type SlotName =
  | "paint"
  | "glass"
  | "trim"
  | "chrome"
  | "tire"
  | "rim"
  | "lightFront"
  | "lightRear"
  | "underbody"
  | "plate";

export type XC60Build = {
  group: THREE.Group; // whole car; nose -z; wheels rest on y=0; meters
  wheels: THREE.Object3D[]; // [FL, FR, RL, RR]; +x-axis spin animates rolling
  slots: Partial<Record<SlotName, THREE.Mesh[]>>; // every mesh listed exactly once
  headlightAnchors: THREE.Vector3[]; // local-space positions for light sources
};

// ---------------------------------------------------------------------------
// Section data (verbatim from 01-architect/sections.json)
// ---------------------------------------------------------------------------

type V2 = [number, number];

const SEC_Z: number[] = [
  -2.3505, -2.18, -1.95, -1.7, -1.4325, -1.05, -0.72, -0.4, -0.1, 0.45, 0.95,
  1.4325, 1.8, 2.1, 2.28, 2.3575,
];

const SEC_PTS: V2[][] = [
  [[0.0, 0.42], [0.3, 0.43], [0.52, 0.46], [0.6, 0.55], [0.64, 0.66], [0.65, 0.78], [0.6, 0.88], [0.45, 0.94], [0.25, 0.97], [0.0, 0.98]],
  [[0.0, 0.3], [0.4, 0.3], [0.68, 0.34], [0.78, 0.48], [0.83, 0.64], [0.85, 0.8], [0.8, 0.92], [0.62, 0.99], [0.32, 1.02], [0.0, 1.03]],
  [[0.0, 0.28], [0.42, 0.28], [0.74, 0.32], [0.85, 0.46], [0.9, 0.62], [0.92, 0.8], [0.86, 0.94], [0.66, 1.0], [0.34, 1.03], [0.0, 1.04]],
  [[0.0, 0.27], [0.44, 0.27], [0.78, 0.31], [0.88, 0.46], [0.93, 0.64], [0.945, 0.82], [0.88, 0.96], [0.68, 1.02], [0.35, 1.05], [0.0, 1.06]],
  [[0.0, 0.27], [0.45, 0.27], [0.8, 0.32], [0.9, 0.48], [0.945, 0.66], [0.951, 0.84], [0.89, 0.97], [0.69, 1.03], [0.36, 1.06], [0.0, 1.07]],
  [[0.0, 0.27], [0.45, 0.27], [0.79, 0.34], [0.89, 0.5], [0.94, 0.68], [0.949, 0.86], [0.88, 0.98], [0.68, 1.05], [0.36, 1.08], [0.0, 1.09]],
  [[0.0, 0.28], [0.45, 0.28], [0.79, 0.35], [0.89, 0.52], [0.94, 0.7], [0.951, 0.9], [0.87, 1.04], [0.76, 1.06], [0.42, 1.1], [0.0, 1.12]],
  [[0.0, 0.28], [0.45, 0.28], [0.78, 0.36], [0.88, 0.54], [0.935, 0.72], [0.949, 0.92], [0.9, 1.1], [0.8, 1.16], [0.52, 1.38], [0.0, 1.44]],
  [[0.0, 0.28], [0.45, 0.28], [0.78, 0.36], [0.88, 0.55], [0.935, 0.74], [0.951, 0.94], [0.905, 1.12], [0.82, 1.22], [0.6, 1.56], [0.0, 1.658]],
  [[0.0, 0.28], [0.45, 0.28], [0.78, 0.36], [0.88, 0.56], [0.935, 0.75], [0.951, 0.95], [0.905, 1.13], [0.82, 1.24], [0.6, 1.57], [0.0, 1.655]],
  [[0.0, 0.28], [0.45, 0.28], [0.79, 0.35], [0.89, 0.55], [0.94, 0.75], [0.951, 0.96], [0.9, 1.15], [0.81, 1.26], [0.58, 1.55], [0.0, 1.635]],
  [[0.0, 0.28], [0.45, 0.28], [0.8, 0.33], [0.9, 0.5], [0.945, 0.7], [0.951, 0.94], [0.89, 1.17], [0.79, 1.28], [0.56, 1.53], [0.0, 1.6]],
  [[0.0, 0.29], [0.44, 0.29], [0.78, 0.33], [0.88, 0.5], [0.93, 0.7], [0.94, 0.95], [0.87, 1.18], [0.75, 1.3], [0.5, 1.5], [0.0, 1.565]],
  [[0.0, 0.32], [0.42, 0.32], [0.74, 0.36], [0.84, 0.52], [0.89, 0.72], [0.9, 0.97], [0.83, 1.18], [0.68, 1.32], [0.42, 1.47], [0.0, 1.52]],
  [[0.0, 0.36], [0.38, 0.36], [0.66, 0.4], [0.76, 0.55], [0.8, 0.74], [0.81, 0.96], [0.74, 1.12], [0.58, 1.24], [0.34, 1.34], [0.0, 1.38]],
  [[0.0, 0.42], [0.32, 0.42], [0.54, 0.45], [0.62, 0.55], [0.66, 0.68], [0.67, 0.82], [0.6, 0.92], [0.46, 1.0], [0.26, 1.05], [0.0, 1.07]],
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NSEC = 16;
const RINGS = 76; // resampled loft rings (spec: 60–80)
const RP = 37; // ring-points per half; P_i lands exactly at j = 4*i
const M = 2 * RP - 2; // welded full-ring loop length (centerline shared)

const FRONT_AXLE = -1.4325;
const REAR_AXLE = 1.4325;
const WHEEL_R = 0.3705;
const WHEEL_X = 0.83;
const ARCH_R = 0.46;

// Ring-point indices of the semantic flow lines.
const J_P2 = 8;
const J_P3 = 12;
const J_P6 = 24; // beltline / DLO base
const J_P7 = 28;
const J_P8 = 32; // roof edge
const J_P9 = 36; // centerline top

type P3 = { x: number; y: number; z: number };

const SLOT_NAMES: SlotName[] = [
  "paint", "glass", "trim", "chrome", "tire", "rim",
  "lightFront", "lightRear", "underbody", "plate",
];

const NO_SHADOW = new Set<SlotName>(["glass", "lightFront", "lightRear", "plate", "underbody"]);

// ---------------------------------------------------------------------------
// Small math helpers
// ---------------------------------------------------------------------------

/** Uniform Catmull-Rom (scalar). */
function cr(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v));
}

function smoothstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

// ---------------------------------------------------------------------------
// Loft grid
// ---------------------------------------------------------------------------

/**
 * Resample the 16x10 half-sections into a RINGS x RP grid:
 * Catmull-Rom per flow line (P_i through all sections) longitudinally, then
 * Catmull-Rom around each ring with virtual control points mirrored across
 * x = 0 so the surface crosses the centerline flat (no crease).
 */
function buildRawGrid(): P3[][] {
  // Longitudinal pass: 10 flow lines, RINGS samples each.
  const flow: P3[][] = [];
  for (let i = 0; i < 10; i++) {
    const line: P3[] = [];
    for (let r = 0; r < RINGS; r++) {
      const s = ((NSEC - 1) * r) / (RINGS - 1);
      const k = Math.min(Math.floor(s), NSEC - 2);
      const t = s - k;
      const at = (kk: number): P3 => {
        const kc = clamp(kk, 0, NSEC - 1);
        const p = SEC_PTS[kc][i];
        return { x: p[0], y: p[1], z: SEC_Z[kc] };
      };
      const a = at(k - 1), b = at(k), c = at(k + 1), d = at(k + 2);
      line.push({
        x: cr(a.x, b.x, c.x, d.x, t),
        y: cr(a.y, b.y, c.y, d.y, t),
        z: cr(a.z, b.z, c.z, d.z, t),
      });
    }
    flow.push(line);
  }

  // Ring pass: smooth each 10-point ring to RP points.
  const grid: P3[][] = [];
  for (let r = 0; r < RINGS; r++) {
    const q: P3[] = [];
    for (let i = 0; i < 10; i++) q.push(flow[i][r]);
    // Extended controls: mirror P1 / P8 across x=0 for flat centerline crossing.
    const ext: P3[] = [
      { x: -q[1].x, y: q[1].y, z: q[1].z },
      ...q,
      { x: -q[8].x, y: q[8].y, z: q[8].z },
    ];
    const ring: P3[] = [];
    for (let j = 0; j < RP; j++) {
      const s = (9 * j) / (RP - 1);
      const i2 = Math.min(Math.floor(s), 8);
      const t = s - i2;
      const c0 = ext[i2], c1 = ext[i2 + 1], c2 = ext[i2 + 2], c3 = ext[i2 + 3];
      ring.push({
        x: cr(c0.x, c1.x, c2.x, c3.x, t),
        y: cr(c0.y, c1.y, c2.y, c3.y, t),
        z: cr(c0.z, c1.z, c2.z, c3.z, t),
      });
    }
    ring[0].x = 0;
    ring[RP - 1].x = 0;
    grid.push(ring);
  }
  return grid;
}

/**
 * Arch-tunnel carve (NOTES-FOR-CAD recipe): vertices inside the 0.46 opening
 * cylinder (axis x) with x > 0.60 are projected radially onto the circle and
 * pulled inboard to x = 0.78; a thin outside annulus is compressed toward the
 * rim so the opening edge reads as a clean arc.
 */
function carveArches(grid: P3[][]): void {
  const BLEND = 0.58;
  for (let r = 0; r < RINGS; r++) {
    for (let j = 0; j < RP; j++) {
      const p = grid[r][j];
      if (p.x <= 0.6) continue;
      for (const az of [FRONT_AXLE, REAR_AXLE]) {
        const dy = p.y - WHEEL_R;
        const dz = p.z - az;
        const d = Math.hypot(dy, dz);
        if (d < ARCH_R) {
          const f = ARCH_R / Math.max(d, 1e-4);
          p.y = Math.max(WHEEL_R + dy * f, 0.02);
          p.z = az + dz * f;
          p.x = 0.78;
        } else if (d < BLEND) {
          // Compress the annulus toward the rim: clean opening edge + flare.
          const u = (d - ARCH_R) / (BLEND - ARCH_R);
          const d2 = ARCH_R + (BLEND - ARCH_R) * u * u;
          const f = d2 / d;
          p.y = Math.max(WHEEL_R + dy * f, 0.02);
          p.z = az + dz * f;
        }
      }
    }
  }
}

/** Outward surface normal of the half-grid at (r, j) via finite differences. */
function gridNormal(grid: P3[][], r: number, j: number): P3 {
  const rowM = grid[Math.max(0, r - 1)];
  const rowP = grid[Math.min(RINGS - 1, r + 1)];
  const tr = { x: rowP[j].x - rowM[j].x, y: rowP[j].y - rowM[j].y, z: rowP[j].z - rowM[j].z };
  const pm = j - 1 < 0
    ? { x: -grid[r][1].x, y: grid[r][1].y, z: grid[r][1].z }
    : grid[r][j - 1];
  const pp = j + 1 > RP - 1
    ? { x: -grid[r][RP - 2].x, y: grid[r][RP - 2].y, z: grid[r][RP - 2].z }
    : grid[r][j + 1];
  const tj = { x: pp.x - pm.x, y: pp.y - pm.y, z: pp.z - pm.z };
  // outward = t_j x t_r
  const n = {
    x: tj.y * tr.z - tj.z * tr.y,
    y: tj.z * tr.x - tj.x * tr.z,
    z: tj.x * tr.y - tj.y * tr.x,
  };
  const l = Math.hypot(n.x, n.y, n.z) || 1;
  n.x /= l; n.y /= l; n.z /= l;
  return n;
}

/** x of the outer body wall at (y, z), interpolated on the raw grid. */
function skinXAt(raw: P3[][], y: number, z: number): number {
  let r = 0;
  while (r < RINGS - 2 && raw[r + 1][20].z < z) r++;
  const z0 = raw[r][20].z;
  const z1 = raw[r + 1][20].z;
  const t = clamp((z - z0) / (z1 - z0 || 1), 0, 1);
  return ringXAtY(raw[r], y) * (1 - t) + ringXAtY(raw[r + 1], y) * t;
}

function ringXAtY(ring: P3[], y: number): number {
  if (y <= ring[J_P2].y) return ring[J_P2].x;
  for (let j = J_P2; j < RP - 1; j++) {
    const a = ring[j], b = ring[j + 1];
    if (y <= b.y) {
      const t = (y - a.y) / (b.y - a.y || 1);
      return a.x + (b.x - a.x) * t;
    }
  }
  return 0;
}

/** y of the roof surface at |x| = xq, interpolated on the raw grid. */
function roofYAt(raw: P3[][], xq: number, z: number): number {
  let r = 0;
  while (r < RINGS - 2 && raw[r + 1][20].z < z) r++;
  const yAt = (ring: P3[]): number => {
    for (let j = RP - 1; j > 0; j--) {
      const a = ring[j], b = ring[j - 1]; // a nearer center (smaller x)
      if (b.x >= xq) {
        const t = (xq - a.x) / (b.x - a.x || 1);
        return a.y + (b.y - a.y) * t;
      }
    }
    return ring[RP - 1].y;
  };
  const z0 = raw[r][20].z;
  const z1 = raw[r + 1][20].z;
  const t = clamp((z - z0) / (z1 - z0 || 1), 0, 1);
  return yAt(raw[r]) * (1 - t) + yAt(raw[r + 1]) * t;
}

// ---------------------------------------------------------------------------
// Geometry builders
// ---------------------------------------------------------------------------

/** Welded, mirrored, capped hull from the carved half-grid. */
function buildHullGeometry(grid: P3[][]): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];

  for (let r = 0; r < RINGS; r++) {
    for (let m = 0; m < M; m++) {
      const j = m < RP ? m : 2 * RP - 2 - m;
      const side = m < RP ? 1 : -1;
      const p = grid[r][j];
      pos.push(p.x * side, p.y, p.z);
    }
  }
  for (let r = 0; r < RINGS - 1; r++) {
    for (let m = 0; m < M; m++) {
      const a = r * M + m;
      const b = r * M + ((m + 1) % M);
      const c = (r + 1) * M + ((m + 1) % M);
      const d = (r + 1) * M + m;
      idx.push(a, b, c, a, c, d);
    }
  }

  // Nose / tail caps: fan to centroid pushed 0.03 outward in z (rounded tip).
  const capCentroid = (r: number, push: number): number => {
    let cy = 0, cz = 0;
    for (let m = 0; m < M; m++) {
      cy += pos[(r * M + m) * 3 + 1];
      cz += pos[(r * M + m) * 3 + 2];
    }
    pos.push(0, cy / M, cz / M + push);
    return pos.length / 3 - 1;
  };
  const cn = capCentroid(0, -0.03);
  for (let m = 0; m < M; m++) idx.push(cn, (m + 1) % M, m); // faces -z
  const ct = capCentroid(RINGS - 1, 0.03);
  const base = (RINGS - 1) * M;
  for (let m = 0; m < M; m++) idx.push(ct, base + m, base + ((m + 1) % M)); // faces +z

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

type Col = { j: number; s: 1 | -1 };

/**
 * Extract a hull-following patch (rows = ring indices, cols ordered in the
 * hull's own winding sense), offset along the surface normal (+out / -in).
 */
function buildPatch(
  grid: P3[][],
  rows: number[],
  cols: Col[],
  offset: number,
  yShift?: (r: number, col: Col) => number,
): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let ri = 0; ri < rows.length; ri++) {
    for (let ci = 0; ci < cols.length; ci++) {
      const r = rows[ri];
      const { j, s } = cols[ci];
      const p = grid[r][j];
      const n = gridNormal(grid, r, j);
      const dy = yShift ? yShift(r, cols[ci]) : 0;
      pos.push((p.x + n.x * offset) * s, p.y + n.y * offset + dy, p.z + n.z * offset);
    }
  }
  const C = cols.length;
  for (let ri = 0; ri < rows.length - 1; ri++) {
    for (let ci = 0; ci < C - 1; ci++) {
      const a = ri * C + ci;
      const b = ri * C + ci + 1;
      const c = (ri + 1) * C + ci + 1;
      const d = (ri + 1) * C + ci;
      idx.push(a, b, c, a, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function rowsForZ(grid: P3[][], z0: number, z1: number): number[] {
  const rows: number[] = [];
  for (let r = 0; r < RINGS; r++) {
    const z = grid[r][20].z;
    if (z >= z0 && z <= z1) rows.push(r);
  }
  return rows;
}

function colsRange(j0: number, j1: number, s: 1 | -1): Col[] {
  // Right side ascends j; mirrored side descends j (matches hull winding).
  const cols: Col[] = [];
  if (s === 1) for (let j = j0; j <= j1; j++) cols.push({ j, s });
  else for (let j = j1; j >= j0; j--) cols.push({ j, s });
  return cols;
}

/**
 * Sweep a closed 2D shape (CCW in the (W, N) frame plane) along a path.
 * Frame: T = path tangent, W = normalize(ref x T), N = T x W. With a CCW
 * shape this yields outward-facing normals.
 */
function sweep(
  path: THREE.Vector3[],
  shape: V2[],
  refFn: (p: THREE.Vector3, i: number) => THREE.Vector3,
  capStart = true,
  capEnd = true,
): THREE.BufferGeometry {
  const n = path.length;
  const S = shape.length;
  const pos: number[] = [];
  const idx: number[] = [];
  const T = new THREE.Vector3();
  const W = new THREE.Vector3();
  const N = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const p = path[i];
    T.subVectors(path[Math.min(n - 1, i + 1)], path[Math.max(0, i - 1)]).normalize();
    W.crossVectors(refFn(p, i), T).normalize();
    N.crossVectors(T, W);
    for (let s = 0; s < S; s++) {
      tmp.copy(p).addScaledVector(W, shape[s][0]).addScaledVector(N, shape[s][1]);
      pos.push(tmp.x, tmp.y, tmp.z);
    }
  }
  for (let i = 0; i < n - 1; i++) {
    for (let s = 0; s < S; s++) {
      const a = i * S + s;
      const b = i * S + ((s + 1) % S);
      const c = (i + 1) * S + ((s + 1) % S);
      const d = (i + 1) * S + s;
      idx.push(a, b, c, a, c, d);
    }
  }
  if (capStart) {
    pos.push(path[0].x, path[0].y, path[0].z);
    const cIdx = pos.length / 3 - 1;
    for (let s = 0; s < S; s++) idx.push(cIdx, (s + 1) % S, s);
  }
  if (capEnd) {
    const p = path[n - 1];
    pos.push(p.x, p.y, p.z);
    const cIdx = pos.length / 3 - 1;
    const b0 = (n - 1) * S;
    for (let s = 0; s < S; s++) idx.push(cIdx, b0 + s, b0 + ((s + 1) % S));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function ellipseShape(n: number, ru: number, rv: number, cv: number): V2[] {
  const pts: V2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([Math.cos(a) * ru, cv + Math.sin(a) * rv]);
  }
  return pts;
}

function rectShape(w: number, v0: number, v1: number): V2[] {
  return [[-w / 2, v0], [w / 2, v0], [w / 2, v1], [-w / 2, v1]];
}

/** Simple x/y parametric grid, +z-facing winding. */
function gridGeometry(
  nx: number,
  ny: number,
  fn: (i: number, j: number) => [number, number, number],
): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const p = fn(i, j);
      pos.push(p[0], p[1], p[2]);
    }
  }
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      const b = j * nx + i + 1;
      const c = (j + 1) * nx + i + 1;
      const d = (j + 1) * nx + i;
      idx.push(a, b, c, a, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Reverse triangle winding in place (and recompute normals). */
function flipFaces(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const index = g.getIndex();
  if (index) {
    const arr = index.array;
    for (let i = 0; i < index.count; i += 3) {
      const t = arr[i + 1];
      arr[i + 1] = arr[i + 2];
      arr[i + 2] = t;
    }
    index.needsUpdate = true;
  }
  g.computeVertexNormals();
  return g;
}

/** Clamp all vertex y to >= minY (used to keep tunnel parts above ground). */
function clampY(g: THREE.BufferGeometry, minY: number): THREE.BufferGeometry {
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) < minY) p.setY(i, minY);
  }
  p.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------

export function buildXC60Geometry(): XC60Build {
  const mats = {} as Record<SlotName, THREE.MeshStandardMaterial>;
  for (const s of SLOT_NAMES) mats[s] = new THREE.MeshStandardMaterial({ name: s });

  const slots: Partial<Record<SlotName, THREE.Mesh[]>> = {};
  const add = (
    parent: THREE.Object3D,
    geo: THREE.BufferGeometry,
    slot: SlotName,
    name?: string,
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(geo, mats[slot]);
    mesh.userData.slot = slot;
    mesh.castShadow = !NO_SHADOW.has(slot);
    mesh.receiveShadow = false;
    if (name) mesh.name = name;
    (slots[slot] ||= []).push(mesh);
    parent.add(mesh);
    return mesh;
  };

  const root = new THREE.Group();
  root.name = "xc60";
  const body = new THREE.Group();
  body.name = "body";
  root.add(body);

  // ---- hull -------------------------------------------------------------
  const raw = buildRawGrid(); // pristine copy for surface queries
  const grid = buildRawGrid();
  carveArches(grid);
  add(body, buildHullGeometry(grid), "paint", "hull");

  // ---- arch tunnels (drum + inner cap), both axles, both sides ----------
  for (const az of [FRONT_AXLE, REAR_AXLE]) {
    for (const s of [1, -1] as const) {
      const wall = new THREE.CylinderGeometry(0.47, 0.47, 0.3, 20, 1, true, -0.35, Math.PI + 0.7);
      wall.rotateZ(Math.PI / 2);
      wall.translate(s * 0.63, WHEEL_R, az);
      clampY(wall, 0.03);
      flipFaces(wall); // camera sees the inside
      add(body, wall, "underbody", `archWall${az < 0 ? "F" : "R"}${s > 0 ? "R" : "L"}`);

      const cap = new THREE.CircleGeometry(0.47, 20);
      cap.rotateY(s * (Math.PI / 2)); // face outboard
      cap.translate(s * 0.48, WHEEL_R, az);
      clampY(cap, 0.03);
      add(body, cap, "underbody");
    }
  }

  // ---- arch cladding lips (quarter-torus-ish swept strip) ---------------
  const lipShape = ellipseShape(8, 0.025, 0.025, 0);
  for (const az of [FRONT_AXLE, REAR_AXLE]) {
    for (const s of [1, -1] as const) {
      const path: THREE.Vector3[] = [];
      const th0 = (-28 * Math.PI) / 180;
      const th1 = (208 * Math.PI) / 180;
      const NSAMP = 36;
      for (let i = 0; i <= NSAMP; i++) {
        const th = th0 + ((th1 - th0) * i) / NSAMP;
        let y = WHEEL_R + ARCH_R * Math.sin(th);
        const z = az + ARCH_R * Math.cos(th);
        // squared-off look: flatten the top 60 degrees slightly
        const deg = (th * 180) / Math.PI;
        if (deg > 60 && deg < 120) y = WHEEL_R + (y - WHEEL_R) * 0.94;
        y = Math.max(y, 0.03);
        const x = skinXAt(raw, y, z) - 0.005; // tube proud of skin by 0.02
        path.push(new THREE.Vector3(s * x, y, z));
      }
      const ref = new THREE.Vector3(s, 0, 0);
      add(body, sweep(path, lipShape, () => ref), "trim", "archLip");
    }
  }

  // ---- glass ------------------------------------------------------------
  // Windshield: stations 7-9, full width, inset 0.01.
  {
    const rows = rowsForZ(grid, -0.73, -0.08);
    const cols: Col[] = [];
    for (let j = J_P7; j <= J_P9; j++) cols.push({ j, s: 1 });
    for (let j = J_P9 - 1; j >= J_P7; j--) cols.push({ j, s: -1 });
    add(body, buildPatch(grid, rows, cols, -0.01), "glass", "windshield");
  }
  // Side DLO bands: A-pillar to D-pillar, beltline to roof edge, inset 0.012,
  // with the XC60 belt kick-up at the D-pillar.
  for (const s of [1, -1] as const) {
    const rows = rowsForZ(grid, -0.55, 1.85);
    const kick = (r: number, col: Col): number => {
      const z = grid[r][20].z;
      const w = (J_P8 - col.j) / (J_P8 - J_P6);
      return 0.06 * smoothstep((z - 1.5) / 0.35) * w;
    };
    add(body, buildPatch(grid, rows, colsRange(J_P6, J_P8, s), -0.012, kick), "glass", "sideDLO");
  }
  // Rear window: quad patch on the tailgate plane, tilted to the 14->15 loft.
  {
    const geo = gridGeometry(9, 5, (i, j) => {
      const x = -0.48 + (0.96 * i) / 8;
      const y = 1.13 + (0.33 * j) / 4;
      const u = x / 0.48;
      const z = 2.18 - 0.45 * (y - 1.295) + 0.012 * (1 - u * u);
      return [x, y, z];
    });
    add(body, geo, "glass", "rearWindow");
  }

  // ---- trim bands following the hull ------------------------------------
  // Front splitter / chin (below ~y0.42 on stations 1-3).
  for (const s of [1, -1] as const) {
    const rows = rowsForZ(grid, -2.36, -1.93);
    add(body, buildPatch(grid, rows, colsRange(0, 10, s), 0.006), "trim", "splitter");
  }
  {
    const ledge = new THREE.BoxGeometry(1.1, 0.02, 0.08);
    ledge.translate(0, 0.3, -2.24);
    add(body, ledge, "trim", "chinLedge");
  }
  // Rocker cladding between the arches.
  for (const s of [1, -1] as const) {
    const rows = rowsForZ(grid, -0.95, 0.95);
    add(body, buildPatch(grid, rows, colsRange(6, J_P3, s), 0.008), "trim", "rocker");
  }
  // Rear lower bumper band.
  for (const s of [1, -1] as const) {
    const rows = rowsForZ(grid, 2.03, 2.36);
    add(body, buildPatch(grid, rows, colsRange(2, J_P3, s), 0.006), "trim", "rearBand");
  }

  // ---- grille (concave panel proud of the fascia) + iron mark -----------
  {
    const panel = gridGeometry(11, 7, (i, j) => {
      const x = -0.45 + (0.9 * i) / 10;
      const y = 0.445 + (0.55 * j) / 6;
      const u = x / 0.45;
      const v = (y - 0.72) / 0.275;
      const dome = Math.max(0, 1 - (u * u + v * v) * 0.75);
      return [x, y, -2.352 + 0.055 * dome]; // concave: center bows inward
    });
    flipFaces(panel); // faces -z
    add(body, panel, "trim", "grille");

    const frames: THREE.BufferGeometry[] = [];
    const bar = (w: number, h: number, x: number, y: number, z: number): THREE.BufferGeometry => {
      const b = new THREE.BoxGeometry(w, h, 0.03);
      b.translate(x, y, z);
      return b;
    };
    frames.push(bar(0.96, 0.03, 0, 1.0, -2.34));
    frames.push(bar(0.96, 0.03, 0, 0.44, -2.33));
    frames.push(bar(0.03, 0.59, 0.465, 0.72, -2.33));
    frames.push(bar(0.03, 0.59, -0.465, 0.72, -2.33));
    const frame = mergeGeometries(frames);
    if (frame) add(body, frame, "trim", "grilleFrame");

    const ring = new THREE.TorusGeometry(0.08, 0.011, 8, 24);
    ring.translate(0, 0.72, -2.315);
    add(body, ring, "chrome", "ironRing");
    const diag = new THREE.BoxGeometry(0.2, 0.028, 0.014);
    diag.rotateZ(Math.PI / 4); // upper-left -> lower-right seen from the front
    diag.translate(0, 0.72, -2.315);
    add(body, diag, "chrome", "ironBar");
  }

  // ---- headlights (Thor's hammer DRL) -----------------------------------
  const headlightAnchors: THREE.Vector3[] = [
    new THREE.Vector3(-0.62, 0.83, -2.3),
    new THREE.Vector3(0.62, 0.83, -2.3),
  ];
  for (const s of [1, -1] as const) {
    const lamp = new THREE.Group();
    lamp.position.set(s * 0.52, 0.865, -2.2);
    lamp.rotation.y = -s * 0.4; // outer edge sweeps back around the fender
    body.add(lamp);

    const housing = new THREE.BoxGeometry(0.42, 0.13, 0.1);
    add(lamp, housing, "lightFront", "headlightHousing");
    const drl = new THREE.BoxGeometry(0.36, 0.022, 0.012);
    drl.translate(0, -0.008, -0.056);
    add(lamp, drl, "lightFront", "drlBar");
    const stem = new THREE.BoxGeometry(0.1, 0.022, 0.012);
    stem.translate(-s * 0.21, -0.008, -0.05);
    add(lamp, stem, "lightFront", "drlStem");

    const empty = new THREE.Object3D();
    empty.name = s < 0 ? "headlightL" : "headlightR";
    empty.position.set(s * 0.62, 0.83, -2.3);
    body.add(empty);
  }

  // ---- taillights (vertical L-blades, hull-hugging sweep) ---------------
  {
    // (y, z) waypoints of the signature blade: up the tail edge, then the L
    // kicks forward along the D-pillar. x is snapped to the skin + 8 mm.
    const yz: V2[] = [
      [0.6, 2.315], [0.9, 2.3], [1.2, 2.25], [1.46, 2.16], [1.49, 2.02], [1.5, 1.9],
    ];
    const bladeShape = ellipseShape(12, 0.048, 0.028, -0.012);
    for (const s of [1, -1] as const) {
      const ctrl = yz.map(([y, z]) => new THREE.Vector3(s * (skinXAt(raw, y, z) + 0.008), y, z));
      const curve = new THREE.CatmullRomCurve3(ctrl);
      const path = curve.getPoints(40).map((p) => {
        const x = skinXAt(raw, p.y, p.z) + 0.008;
        return new THREE.Vector3(s * x, p.y, p.z);
      });
      const ref = (p: THREE.Vector3): THREE.Vector3 =>
        new THREE.Vector3(s * 0.9, 0.15, Math.max(0.12, (p.z - 1.55) * 0.9)).normalize();
      add(body, sweep(path, bladeShape, ref), "lightRear", "taillightBlade");

      const hook = new THREE.BoxGeometry(0.24, 0.065, 0.03);
      hook.translate(0, 0, 0);
      const hookMesh = add(body, hook, "lightRear", "taillightHook");
      hookMesh.position.set(s * 0.6, 0.72, 2.325);
      hookMesh.rotation.y = -s * 0.12;
    }
  }

  // ---- mirrors -----------------------------------------------------------
  for (const s of [1, -1] as const) {
    const shell = new THREE.SphereGeometry(1, 14, 10);
    shell.scale(0.05, 0.06, 0.1);
    const shellMesh = add(body, shell, "paint", "mirrorShell");
    shellMesh.position.set(s * 0.98, 1.02, -0.45);
    const stalk = new THREE.BoxGeometry(0.1, 0.028, 0.06);
    const stalkMesh = add(body, stalk, "trim", "mirrorStalk");
    stalkMesh.position.set(s * 0.935, 0.995, -0.45);
    stalkMesh.rotation.z = s * 0.35;
  }

  // ---- roof rails (swept along the roof surface) ------------------------
  {
    const railShape = rectShape(0.035, -0.03, 0.045);
    const up = new THREE.Vector3(0, 1, 0);
    for (const s of [1, -1] as const) {
      const path: THREE.Vector3[] = [];
      for (let i = 0; i <= 12; i++) {
        const z = -0.35 + (1.9 * i) / 12;
        path.push(new THREE.Vector3(s * 0.55, roofYAt(raw, 0.55, z), z));
      }
      add(body, sweep(path, railShape, () => up), "trim", "roofRail");
    }
  }

  // ---- door handles ------------------------------------------------------
  for (const s of [1, -1] as const) {
    for (const z of [-0.35, 0.75]) {
      const handle = new THREE.BoxGeometry(0.015, 0.03, 0.16);
      const mesh = add(body, handle, "chrome", "doorHandle");
      mesh.position.set(s * (skinXAt(raw, 0.95, z) + 0.006), 0.95, z);
    }
  }

  // ---- roof: antenna fin, spoiler lip ------------------------------------
  {
    const fin = new THREE.BoxGeometry(0.035, 0.06, 0.18);
    fin.translate(0, 0.028, 0);
    const finMesh = add(body, fin, "paint", "antennaFin");
    finMesh.position.set(0, roofYAt(raw, 0.0, 1.45), 1.45);
    finMesh.rotation.x = -0.22;

    const lip = new THREE.BoxGeometry(0.84, 0.022, 0.09);
    lip.translate(0, 1.513, 2.125);
    add(body, lip, "paint", "spoilerLip");
  }

  // ---- rear hardware: skid plate, exhaust, plate ------------------------
  {
    const skid = new THREE.BoxGeometry(0.7, 0.12, 0.02);
    const skidMesh = add(body, skid, "chrome", "rearSkid");
    skidMesh.position.set(0, 0.36, 2.35);
    skidMesh.rotation.x = -0.18;

    for (const s of [1, -1] as const) {
      const tip = new THREE.CylinderGeometry(0.027, 0.027, 0.07, 14, 1, true);
      tip.rotateX(Math.PI / 2);
      tip.scale(1.9, 1, 1);
      const tipMesh = add(body, tip, "chrome", "exhaustTip");
      tipMesh.position.set(s * 0.58, 0.4, 2.335);

      const inner = new THREE.CircleGeometry(0.023, 12);
      inner.scale(1.9, 1, 1);
      const innerMesh = add(body, inner, "trim", "exhaustInner");
      innerMesh.position.set(s * 0.58, 0.4, 2.36);
    }

    const frame = new THREE.BoxGeometry(0.55, 0.14, 0.012);
    frame.translate(0, 0.55, 2.35);
    add(body, frame, "chrome", "plateFrame");
    const plate = new THREE.BoxGeometry(0.52, 0.11, 0.008);
    plate.translate(0, 0.55, 2.358);
    add(body, plate, "plate", "licensePlate");

    const tailGlow = new THREE.Object3D();
    tailGlow.name = "tailGlow";
    tailGlow.position.set(0, 1.0, 2.3);
    body.add(tailGlow);
  }

  // ---- underbody ---------------------------------------------------------
  {
    const floor = new THREE.BoxGeometry(1.5, 0.03, 4.05);
    floor.translate(0, 0.255, 0.03);
    add(body, floor, "underbody", "floorPan");
  }

  // ---- wheels ------------------------------------------------------------
  const wheels: THREE.Object3D[] = [];
  const wheelDefs: { name: string; s: 1 | -1; z: number }[] = [
    { name: "wheelFL", s: -1, z: FRONT_AXLE },
    { name: "wheelFR", s: 1, z: FRONT_AXLE },
    { name: "wheelRL", s: -1, z: REAR_AXLE },
    { name: "wheelRR", s: 1, z: REAR_AXLE },
  ];
  for (const def of wheelDefs) {
    const w = new THREE.Group();
    w.name = def.name;
    w.position.set(def.s * WHEEL_X, WHEEL_R, def.z);
    root.add(w);
    wheels.push(w);
    const s = def.s;

    // Tire: torus stretched to the 235 section width; OD 0.741.
    const tire = new THREE.TorusGeometry(0.306, 0.0646, 12, 28);
    tire.rotateY(Math.PI / 2);
    tire.scale(0.235 / 0.129, 1, 1);
    add(w, tire, "tire", "tire");

    // Rim: barrel + outer annulus + 5 double spokes + hub, merged.
    const rimParts: THREE.BufferGeometry[] = [];
    const barrel = new THREE.CylinderGeometry(0.2413, 0.2413, 0.16, 24, 1, true);
    barrel.rotateZ(Math.PI / 2);
    rimParts.push(barrel);
    const face = new THREE.RingGeometry(0.055, 0.2413, 24, 1);
    face.rotateY(s * (Math.PI / 2));
    face.translate(s * 0.078, 0, 0);
    rimParts.push(face);
    for (let k = 0; k < 10; k++) {
      const pair = Math.floor(k / 2);
      const phi = (pair * 2 * Math.PI) / 5 + (k % 2 === 0 ? -0.1 : 0.1);
      const spoke = new THREE.BoxGeometry(0.03, 0.16, 0.03);
      spoke.translate(0, 0.125, 0);
      spoke.rotateX(phi);
      spoke.translate(s * 0.055, 0, 0);
      rimParts.push(spoke);
    }
    const hub = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12);
    hub.rotateZ(Math.PI / 2);
    hub.translate(s * 0.05, 0, 0);
    rimParts.push(hub);
    const rim = mergeGeometries(rimParts);
    if (rim) add(w, rim, "rim", "rim");

    const cap = new THREE.CylinderGeometry(0.032, 0.032, 0.02, 12);
    cap.rotateZ(Math.PI / 2);
    cap.translate(s * 0.078, 0, 0);
    add(w, cap, "chrome", "wheelCap");

    // Dark backing disc so spoke gaps never see through the car.
    const disc = new THREE.CircleGeometry(0.21, 20);
    disc.rotateY(s * (Math.PI / 2));
    disc.translate(s * 0.012, 0, 0);
    add(w, disc, "underbody", "wheelBacking");
  }

  return { group: root, wheels, slots, headlightAnchors };
}
