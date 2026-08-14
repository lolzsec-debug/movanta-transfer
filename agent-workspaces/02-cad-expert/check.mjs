// Verification harness for xc60Geometry.ts (run: node check.mjs from this dir).
import * as THREE from "three";
import { buildXC60Geometry } from "./.build/xc60Geometry.js";

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log("  PASS", msg);
  else {
    failures++;
    console.error("  FAIL", msg);
  }
};

const build = buildXC60Geometry();
const { group, wheels, slots, headlightAnchors } = build;

// --- structure -------------------------------------------------------------
ok(group.name === "xc60", "root group named xc60");
ok(wheels.length === 4, "4 wheel groups");
const wnames = wheels.map((w) => w.name).join(",");
ok(wnames === "wheelFL,wheelFR,wheelRL,wheelRR", `wheel names/order (${wnames})`);
const expectPos = [
  [-0.83, 0.3705, -1.4325],
  [0.83, 0.3705, -1.4325],
  [-0.83, 0.3705, 1.4325],
  [0.83, 0.3705, 1.4325],
];
wheels.forEach((w, i) => {
  const p = w.position;
  const e = expectPos[i];
  ok(
    Math.abs(p.x - e[0]) < 1e-6 && Math.abs(p.y - e[1]) < 1e-6 && Math.abs(p.z - e[2]) < 1e-6,
    `${w.name} at axle point`,
  );
});
ok(headlightAnchors.length === 2, "2 headlight anchors");
ok(!!group.getObjectByName("headlightL") && !!group.getObjectByName("headlightR"), "headlight empties");
ok(!!group.getObjectByName("tailGlow"), "tailGlow empty");
ok(!!group.getObjectByName("body"), "body sibling group");

// --- meshes vs slots -------------------------------------------------------
const meshes = [];
group.traverse((o) => {
  if (o.isMesh) meshes.push(o);
});
const slotMeshes = Object.values(slots).flat();
ok(meshes.length === slotMeshes.length, `every mesh listed once in slots (${meshes.length} vs ${slotMeshes.length})`);
ok(new Set(slotMeshes).size === slotMeshes.length, "no duplicates in slots");
ok(meshes.every((m) => typeof m.userData.slot === "string"), "userData.slot set on all meshes");
ok(meshes.every((m) => m.material.name === m.userData.slot), "material name matches slot");
for (const s of ["paint", "glass", "trim", "chrome", "tire", "rim", "lightFront", "lightRear", "underbody", "plate"]) {
  ok((slots[s] ?? []).length > 0, `slot ${s} non-empty (${(slots[s] ?? []).length} meshes)`);
}
ok((slots.glass ?? []).every((m) => !m.castShadow), "glass casts no shadow");
ok((slots.tire ?? []).length === 4 && (slots.rim ?? []).length === 4, "4 tires, 4 rims");
ok((slots.lightRear ?? []).length === 4, "taillight blades + hooks = 4 meshes");

// --- geometry sanity -------------------------------------------------------
group.updateMatrixWorld(true);
let nan = false;
let tris = 0;
for (const m of meshes) {
  const g = m.geometry;
  const pa = g.getAttribute("position");
  tris += (g.getIndex() ? g.getIndex().count : pa.count) / 3;
  for (let i = 0; i < pa.array.length; i++) {
    if (!Number.isFinite(pa.array[i])) nan = true;
  }
}
ok(!nan, "no NaN/Inf positions");
console.log(`  INFO total triangles: ${Math.round(tris)}`);
ok(tris < 60000, "triangle budget < 60k");

const bbox = new THREE.Box3().setFromObject(group);
console.log(
  `  INFO bbox x[${bbox.min.x.toFixed(3)},${bbox.max.x.toFixed(3)}] y[${bbox.min.y.toFixed(3)},${bbox.max.y.toFixed(3)}] z[${bbox.min.z.toFixed(3)},${bbox.max.z.toFixed(3)}]`,
);
ok(bbox.min.y > -1e-3, "nothing below ground");
ok(Math.abs(bbox.max.y - 1.658) < 0.03, "roof height ~1.658");
ok(bbox.min.z > -2.45 && bbox.max.z < 2.45, "length ~4.7 (+cap rounding)");
ok(bbox.max.x < 1.1 && bbox.min.x > -1.1, "width incl. mirrors < 2.2");

const hull = meshes.find((m) => m.name === "hull");
const hb = new THREE.Box3().setFromObject(hull);
ok(Math.abs(hb.max.x - 0.951) < 0.02 && Math.abs(hb.min.x + 0.951) < 0.02, "hull half-width ~0.951");

// --- normal orientation checks --------------------------------------------
function normalNear(mesh, target) {
  const pa = mesh.geometry.getAttribute("position");
  const na = mesh.geometry.getAttribute("normal");
  let best = Infinity;
  let n = null;
  for (let i = 0; i < pa.count; i++) {
    const dx = pa.getX(i) - target.x;
    const dy = pa.getY(i) - target.y;
    const dz = pa.getZ(i) - target.z;
    const d = dx * dx + dy * dy + dz * dz;
    if (d < best) {
      best = d;
      n = new THREE.Vector3(na.getX(i), na.getY(i), na.getZ(i));
    }
  }
  return n;
}
const nShoulder = normalNear(hull, new THREE.Vector3(0.951, 0.9, 0.3));
ok(nShoulder.x > 0.5, `hull shoulder normal outward (+x) [${nShoulder.x.toFixed(2)}]`);
const nShoulderL = normalNear(hull, new THREE.Vector3(-0.951, 0.9, 0.3));
ok(nShoulderL.x < -0.5, `hull left shoulder normal outward (-x) [${nShoulderL.x.toFixed(2)}]`);
const nRoof = normalNear(hull, new THREE.Vector3(0, 1.658, -0.1));
ok(nRoof.y > 0.8, `roof normal up [${nRoof.y.toFixed(2)}]`);
const nNose = normalNear(hull, new THREE.Vector3(0, 0.7, -2.38));
ok(nNose.z < -0.5, `nose cap normal -z [${nNose.z.toFixed(2)}]`);
const nTail = normalNear(hull, new THREE.Vector3(0, 0.75, 2.39));
ok(nTail.z > 0.5, `tail cap normal +z [${nTail.z.toFixed(2)}]`);

const ws = meshes.find((m) => m.name === "windshield");
const nWs = normalNear(ws, new THREE.Vector3(0, 1.3, -0.4));
ok(nWs.y > 0.3 && nWs.z < 0, `windshield normal up/forward [${nWs.y.toFixed(2)},${nWs.z.toFixed(2)}]`);
const dlos = meshes.filter((m) => m.name === "sideDLO");
const nDlo = normalNear(dlos[0], new THREE.Vector3(0.9, 1.3, 0.4));
const nDlo2 = normalNear(dlos[1], new THREE.Vector3(-0.9, 1.3, 0.4));
ok(Math.abs(nDlo.x) > 0.5 && Math.abs(nDlo2.x) > 0.5 && nDlo.x * nDlo2.x < 0, "side glass normals outward both sides");
const rw = meshes.find((m) => m.name === "rearWindow");
ok(normalNear(rw, new THREE.Vector3(0, 1.3, 2.2)).z > 0.5, "rear window normal +z");
const grille = meshes.find((m) => m.name === "grille");
ok(normalNear(grille, new THREE.Vector3(0, 0.72, -2.3)).z < -0.5, "grille panel normal -z");

// Taillight blade: outward-ish normal at the outer face near y ~1.0.
const blades = meshes.filter((m) => m.name === "taillightBlade");
ok(blades.length === 2, "2 taillight blades");
const bb = new THREE.Box3().setFromBufferAttribute(blades[0].geometry.getAttribute("position"));
console.log(`  INFO blade R bbox x[${bb.min.x.toFixed(2)},${bb.max.x.toFixed(2)}] y[${bb.min.y.toFixed(2)},${bb.max.y.toFixed(2)}] z[${bb.min.z.toFixed(2)},${bb.max.z.toFixed(2)}]`);
ok(bb.max.y > 1.45 && bb.min.y < 0.65, "blade spans bumper-top to D-pillar");
const nBlade = normalNear(blades[0], new THREE.Vector3(bb.max.x, 1.0, 2.3));
ok(nBlade.x > 0.2 || nBlade.z > 0.2, `blade outer normal outward [${nBlade.x.toFixed(2)},${nBlade.z.toFixed(2)}]`);

// Arch drum: inner wall normals point toward the wheel (inward = -radial).
const wall = meshes.find((m) => m.name === "archWallFR");
const nWall = normalNear(wall, new THREE.Vector3(0.63, WHEELR(), -1.4325 - 0.47));
function WHEELR() { return 0.3705; }
ok(nWall.z > 0.3, `arch drum wall faces inward [${nWall.z.toFixed(2)}]`);

// Hull carve: opening exists — hull vertices near wheel center pushed to rim.
{
  const pa = hull.geometry.getAttribute("position");
  let minD = Infinity;
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i);
    if (x < 0.6 || pa.getY(i) < 0.05) continue; // ground-clamped tunnel verts excluded
    const dy = pa.getY(i) - 0.3705;
    const dz = pa.getZ(i) - 1.4325;
    const d = Math.hypot(dy, dz);
    if (d < minD) minD = d;
  }
  ok(minD > 0.44, `rear-right arch opening carved (nearest skin vertex at r=${minD.toFixed(3)})`);
}

// Per-slot triangle breakdown.
const bySlot = {};
for (const m of meshes) {
  const g = m.geometry;
  const t = (g.getIndex() ? g.getIndex().count : g.getAttribute("position").count) / 3;
  bySlot[m.userData.slot] = (bySlot[m.userData.slot] ?? 0) + t;
}
console.log("  INFO tris by slot:", Object.fromEntries(Object.entries(bySlot).map(([k, v]) => [k, Math.round(v)])));

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);
