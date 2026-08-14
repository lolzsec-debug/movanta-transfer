import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { buildXC60Geometry } from "./xc60Geometry";
import { applyXC60Materials } from "./xc60Materials";
import { loadPorsche } from "./porscheCar";

/**
 * Cinematic landing intro: a blue-hour cruise down a mountain motorway.
 * Snow-capped ridges rise on both sides of the road, pine forest climbs the
 * lower slopes, and the carriageway is dressed with everything a real
 * motorväg has — median barrier with reflectors, W-beam guardrails on posts,
 * dashed lane lines with cat-eye studs, delineator posts, lit lamp masts and
 * an overhead sign gantry. The camera cranes down into a chase position
 * behind `carMount`, an (intentionally) empty anchor group: the CAD-based car
 * model being prepared in a separate session attaches there later.
 *
 * The world is an infinite treadmill: three 300 m tiles per element recycle
 * behind the camera, and every noise function is periodic over the tile
 * length so the seams are invisible. Everything is procedural — no model
 * downloads — and the whole scene is disposed once the intro finishes.
 */

export type IntroHandle = {
  /** Jump straight to the end fade. */
  skip: () => void;
  /** Stop rendering and free all GPU resources. */
  dispose: () => void;
};

const DURATION = 2.45; // seconds; onDone fires earlier so the CSS fade overlaps the drive
const DONE_AT = 1.9;

const SPEED = 44; // m/s peak; the world scrolls +z past the static car anchor
const TILE = 300; // treadmill tile length; all periodic noise repeats over this
const TILES = 3; // tiles per recycled element (span = TILE * TILES)

// Carriageway layout (meters). Travel direction is -z, right-hand traffic:
// median barrier at x=0, our lanes on +x, oncoming mirrored on -x.
const LANE_OUT = 6.4; // cruising-lane center — where the car ends up
const LANE_IN = 2.8; // overtaking-lane center — where the car starts its merge
const EDGE_IN = 1.0; // solid line against the median
const EDGE_OUT = 8.3; // solid line against the shoulder
const DASH_X = 4.6; // dashed divider between the two lanes
const RAIL_X = 9.9; // guardrail
const TERRAIN_IN = 11.5; // where the mountainsides start
const ROAD_LEN = 900;

const SKY_HORIZON = "#c26a3a";
const FOG_COLOR = 0x1b2438;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Progress 0→1 across [t0, t1]. */
const seg = (t: number, t0: number, t1: number) => clamp01((t - t0) / (t1 - t0));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (v: number, a: number, b: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** Deterministic pseudo-random in [0,1) — stable across frames and reloads. */
const hash = (i: number, s: number) => {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

function radialTexture(stops: [number, string][]): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/** Vertical sky gradient for the inside of the dome. */
function skyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0, "#070b1c"); // zenith
  g.addColorStop(0.42, "#131f3d");
  g.addColorStop(0.62, "#27395f");
  g.addColorStop(0.74, "#4b4a63");
  g.addColorStop(0.82, SKY_HORIZON); // afterglow band
  g.addColorStop(0.9, "#e09050");
  g.addColorStop(1.0, "#f4b56a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Speckled asphalt; scrolled along v to sell the road surface moving. */
function asphaltTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#202329";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 2600; i++) {
    const shade = 24 + hash(i, 7) * 34;
    ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 5})`;
    ctx.fillRect(hash(i, 1) * size, hash(i, 2) * size, 1 + hash(i, 3) * 2, 1 + hash(i, 4) * 2);
  }
  // faint longitudinal tire polish in the lanes
  ctx.fillStyle = "rgba(12,13,16,0.35)";
  for (const u of [0.18, 0.36, 0.64, 0.82]) ctx.fillRect(u * size - 7, 0, 14, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Swedish-style green motorway sign for the overhead gantry. */
function signTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 320;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0d6b3c";
  ctx.beginPath();
  ctx.roundRect(6, 6, 756, 308, 26);
  ctx.fill();
  ctx.strokeStyle = "#f4f7f5";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.roundRect(16, 16, 736, 288, 20);
  ctx.stroke();
  ctx.fillStyle = "#f4f7f5";
  ctx.textBaseline = "middle";
  ctx.font = "700 84px system-ui, sans-serif";
  ctx.fillText("Sundsvall", 150, 106);
  ctx.fillText("Movanta", 150, 220);
  ctx.font = "700 64px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("84", 700, 106);
  ctx.fillText("1", 700, 220);
  ctx.textAlign = "left";
  // up arrows
  for (const y of [106, 220]) {
    ctx.beginPath();
    ctx.moveTo(72, y - 40);
    ctx.lineTo(102, y + 2);
    ctx.lineTo(84, y + 2);
    ctx.lineTo(84, y + 40);
    ctx.lineTo(60, y + 40);
    ctx.lineTo(60, y + 2);
    ctx.lineTo(42, y + 2);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// Terrain: ridged, periodic height field shared by the ground mesh, the tree
// planter and anything else that must sit on the slope. `lat` is the lateral
// distance from the terrain's inner edge; `phase` differentiates the sides.
// ---------------------------------------------------------------------------
const TAU = Math.PI * 2;

function terrainHeight(lat: number, z: number, phase: number): number {
  const u = clamp01(lat / 115);
  const base = Math.pow(u, 1.2) * 110;
  const zz = (z / TILE) * TAU; // integer multiples of zz keep everything periodic
  const n =
    Math.sin(zz * 2 + phase + lat * 0.045) * 0.55 +
    Math.sin(zz * 5 - lat * 0.09 + phase * 2.7 + 1.3) * 0.3 +
    Math.sin(zz * 11 + lat * 0.16 + 4.1) * 0.15;
  const ridge = 1 - Math.abs(n); // fold the noise for sharp crests
  const undulate = 0.5 + 0.5 * Math.sin(zz * 3 + phase * 1.9 + lat * 0.02);
  let h = base * (0.42 + 0.5 * ridge * (0.5 + 0.5 * undulate));
  h += u * 3.5 * (Math.sin(zz * 23 + lat * 0.7) + Math.sin(zz * 17 - lat * 0.5)) * 0.5;
  return Math.max(0, h);
}

const GRASS = new THREE.Color(0x22301f);
const ROCK = new THREE.Color(0x474d57);
const SNOW = new THREE.Color(0xe6edf6);

function buildTerrainTile(side: 1 | -1): THREE.Mesh {
  const width = 170;
  const phase = side > 0 ? 0.9 : 3.7;
  const geo = new THREE.PlaneGeometry(width, TILE, 46, 84);
  geo.rotateX(-Math.PI / 2); // local +y (length) → world -z, local x stays lateral
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const lat = pos.getX(i) + width / 2; // 0 at inner edge
    pos.setY(i, terrainHeight(lat, pos.getZ(i), phase));
  }
  geo.computeVertexNormals();

  // Vertex colors: alpine grass low, bare rock on the steeps, snow up high.
  const colors = new Float32Array(pos.count * 3);
  const normal = geo.attributes.normal as THREE.BufferAttribute;
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const h = pos.getY(i);
    const ny = normal.getY(i);
    c.copy(GRASS).lerp(ROCK, smooth(h + (1 - ny) * 22, 9, 30));
    c.lerp(SNOW, smooth(h - (1 - ny) * 45, 42, 58));
    const v = 0.88 + 0.24 * hash(i, phase);
    colors[i * 3] = c.r * v;
    colors[i * 3 + 1] = c.g * v;
    colors[i * 3 + 2] = c.b * v;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 })
  );
  mesh.position.x = side * (TERRAIN_IN + width / 2);
  if (side < 0) mesh.scale.x = -1; // mirror so the inner edge hugs the road on both sides
  mesh.receiveShadow = true;
  return mesh;
}

/** Pine forest for one tile+side, merged into two meshes (foliage + trunks). */
function buildForestTile(side: 1 | -1): THREE.Group {
  const phase = side > 0 ? 0.9 : 3.7;
  const foliage: THREE.BufferGeometry[] = [];
  const trunks: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 130; i++) {
    const lat = 4 + hash(i, 11 + phase) * 85;
    const z = (hash(i, 23 + phase) - 0.5) * TILE;
    const h = terrainHeight(lat, z, phase);
    if (h > 30) continue; // treeline
    const s = 0.8 + hash(i, 31 + phase) * 0.9;
    const x = side * (TERRAIN_IN + lat);
    // three stacked cones read as a spruce from every distance
    for (const [ty, r, ch] of [
      [2.2, 1.55, 2.6],
      [3.9, 1.15, 2.2],
      [5.3, 0.75, 1.8],
    ]) {
      const cone = new THREE.ConeGeometry(r * s, ch * s, 7);
      cone.translate(x, h + ty * s, z);
      foliage.push(cone);
    }
    const trunk = new THREE.CylinderGeometry(0.14 * s, 0.2 * s, 1.6 * s, 5);
    trunk.translate(x, h + 0.7 * s, z);
    trunks.push(trunk);
  }
  const group = new THREE.Group();
  if (foliage.length) {
    const m = new THREE.Mesh(
      mergeGeometries(foliage),
      new THREE.MeshStandardMaterial({ color: 0x1c2b1e, roughness: 0.95 })
    );
    m.castShadow = true;
    group.add(m);
    for (const g of foliage) g.dispose();
  }
  if (trunks.length) {
    group.add(
      new THREE.Mesh(mergeGeometries(trunks), new THREE.MeshStandardMaterial({ color: 0x3a2d22, roughness: 0.9 }))
    );
    for (const g of trunks) g.dispose();
  }
  return group;
}

export function startHighwayIntro(canvas: HTMLCanvasElement, onDone: () => void): IntroHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(FOG_COLOR, 70, 470);

  // Soft studio reflections so paint/metal read as curved surfaces. Dim, so
  // the blue-hour mood survives. (The future car's clearcoat needs this too.)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environment = envTex;
  scene.environmentIntensity = 0.35;

  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 1400);
  camera.position.set(11.5, 7.0, 30);
  const lookTarget = new THREE.Vector3(2, 4, -80);

  // ---------- sky ----------
  const skyTex = skyTexture();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(640, 32, 20),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
  );
  scene.add(sky);

  // Early stars in the upper dome.
  const starPos = new Float32Array(280 * 3);
  for (let i = 0; i < 280; i++) {
    const az = hash(i, 41) * TAU;
    const alt = 0.18 + hash(i, 43) * 1.25; // radians above horizon
    const r = 600;
    starPos[i * 3] = Math.cos(alt) * Math.cos(az) * r;
    starPos[i * 3 + 1] = Math.sin(alt) * r;
    starPos[i * 3 + 2] = Math.cos(alt) * Math.sin(az) * r;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xd8e4ff,
    size: 1.7,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.8,
    fog: false,
  });
  scene.add(new THREE.Points(starGeo, starMat));

  // Sunset afterglow low ahead-left, plus a rising moon high right.
  const glowTex = radialTexture([
    [0, "rgba(255,166,86,0.5)"],
    [0.35, "rgba(230,120,60,0.2)"],
    [0.7, "rgba(180,85,55,0.05)"],
    [1, "rgba(180,85,55,0)"],
  ]);
  const afterglow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false })
  );
  afterglow.position.set(-150, 26, -600);
  afterglow.scale.set(320, 170, 1);
  scene.add(afterglow);

  const moonTex = radialTexture([
    [0, "rgba(235,240,250,1)"],
    [0.28, "rgba(235,240,250,0.95)"],
    [0.34, "rgba(210,222,245,0.28)"],
    [1, "rgba(210,222,245,0)"],
  ]);
  const moon = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: moonTex, depthWrite: false, transparent: true, fog: false })
  );
  moon.position.set(220, 300, -460);
  moon.scale.set(46, 46, 1);
  scene.add(moon);

  // A far settlement twinkling in the valley ahead-left, under the afterglow —
  // warm pinpricks that give the horizon depth and a destination.
  const townPos = new Float32Array(90 * 3);
  for (let i = 0; i < 90; i++) {
    townPos[i * 3] = -30 - hash(i, 51) * 250;
    townPos[i * 3 + 1] = 1.5 + hash(i, 53) * 9;
    townPos[i * 3 + 2] = -500 - hash(i, 57) * 90;
  }
  const townGeo = new THREE.BufferGeometry();
  townGeo.setAttribute("position", new THREE.BufferAttribute(townPos, 3));
  const townMat = new THREE.PointsMaterial({
    color: 0xffc27a,
    size: 2.0,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.7,
    fog: false,
  });
  scene.add(new THREE.Points(townGeo, townMat));

  // ---------- lights ----------
  scene.add(new THREE.HemisphereLight(0x2c3c5e, 0x0b0d10, 0.78));

  // Low sun just under the horizon ahead-left: warm rim on ridges and snow.
  const sun = new THREE.DirectionalLight(0xff9d5c, 1.35);
  sun.position.set(-120, 34, -420);
  scene.add(sun);

  // Cool fill from behind the camera so the road side of the mountains reads.
  const fill = new THREE.DirectionalLight(0x41567e, 0.55);
  fill.position.set(30, 60, 180);
  fill.castShadow = true;
  fill.shadow.mapSize.set(1024, 1024);
  fill.shadow.camera.left = -35;
  fill.shadow.camera.right = 35;
  fill.shadow.camera.top = 35;
  fill.shadow.camera.bottom = -35;
  fill.shadow.camera.far = 400;
  fill.shadow.bias = -0.002;
  scene.add(fill);

  // ---------- road (static: uniform surfaces show no motion; texture scrolls) ----------
  const asphaltTex = asphaltTexture();
  asphaltTex.repeat.set(2, ROAD_LEN / 22.5);
  // Slightly damp surface: lower roughness + env pickup so the lamps and
  // afterglow smear along the lanes like a road that saw rain an hour ago.
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(21, ROAD_LEN),
    new THREE.MeshStandardMaterial({ map: asphaltTex, color: 0x9aa0aa, roughness: 0.62, metalness: 0.08, envMapIntensity: 1.3 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.z = -ROAD_LEN / 2 + 220;
  road.receiveShadow = true;
  scene.add(road);

  // Verges: dark gravel strips between shoulder and terrain.
  const vergeMat = new THREE.MeshStandardMaterial({ color: 0x191d1a, roughness: 1 });
  for (const side of [-1, 1] as const) {
    const verge = new THREE.Mesh(new THREE.PlaneGeometry(TERRAIN_IN - 10.4, ROAD_LEN), vergeMat);
    verge.rotation.x = -Math.PI / 2;
    verge.position.set(side * (10.4 + (TERRAIN_IN - 10.4) / 2), -0.01, road.position.z);
    scene.add(verge);
  }

  // Solid edge lines (continuous → no visible motion → static).
  const paintMat = new THREE.MeshStandardMaterial({ color: 0xb9c2cc, roughness: 0.55 });
  const lineGeo = new THREE.PlaneGeometry(0.15, ROAD_LEN);
  for (const x of [-EDGE_OUT, -EDGE_IN, EDGE_IN, EDGE_OUT]) {
    const line = new THREE.Mesh(lineGeo, paintMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.012, road.position.z);
    scene.add(line);
  }

  // Median: concrete barrier + steel W-beam guardrails along both shoulders.
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x74777d, roughness: 0.9 });
  const median = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.85, ROAD_LEN), concreteMat);
  median.position.set(0, 0.425, road.position.z);
  median.castShadow = true;
  scene.add(median);

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x8d949c, metalness: 0.85, roughness: 0.45 });
  const railGeo = new THREE.BoxGeometry(0.07, 0.32, ROAD_LEN);
  for (const side of [-1, 1] as const) {
    const rail = new THREE.Mesh(railGeo, steelMat);
    rail.position.set(side * RAIL_X, 0.62, road.position.z);
    scene.add(rail);
  }

  // ---------- recycled world tiles ----------
  // Each tile carries everything periodic for one 300 m stretch: mountains,
  // forest, dashes, cat-eyes, guardrail posts, delineators, lamp masts,
  // barrier reflectors. Tiles slide +z and wrap by TILE*TILES.
  const movers: THREE.Object3D[] = [];
  const addMover = (obj: THREE.Object3D, z: number, recycleAt: number, span: number) => {
    obj.position.z = z;
    obj.userData.recycleAt = recycleAt;
    obj.userData.span = span;
    scene.add(obj);
    movers.push(obj);
  };

  const whitePaint = new THREE.MeshStandardMaterial({ color: 0xc6cdd6, roughness: 0.5 });
  const catEyeMat = new THREE.MeshStandardMaterial({ color: 0x776a3a, emissive: 0xffe9a8, emissiveIntensity: 2.2 });
  const redReflMat = new THREE.MeshStandardMaterial({ color: 0x4a1512, emissive: 0xff3b26, emissiveIntensity: 1.6 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x565b62, metalness: 0.8, roughness: 0.5 });
  const lampHeadMat = new THREE.MeshStandardMaterial({ color: 0x30302a, emissive: 0xffd9a0, emissiveIntensity: 0 });
  const poolTex = radialTexture([
    [0, "rgba(255,205,140,0.55)"],
    [0.5, "rgba(255,195,130,0.16)"],
    [1, "rgba(255,195,130,0)"],
  ]);
  const poolMat = new THREE.MeshBasicMaterial({
    map: poolTex,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: 0,
  });

  const buildTile = (): THREE.Group => {
    const tile = new THREE.Group();

    for (const side of [-1, 1] as const) {
      tile.add(buildTerrainTile(side));
      tile.add(buildForestTile(side));
    }

    // Dashed lane dividers (3 m dash / 6 m gap) on both carriageways.
    const dashes: THREE.BufferGeometry[] = [];
    for (let i = 0; i < TILE / 9; i++) {
      for (const x of [-DASH_X, DASH_X]) {
        const d = new THREE.PlaneGeometry(0.15, 3);
        d.rotateX(-Math.PI / 2);
        d.translate(x, 0.012, -TILE / 2 + i * 9);
        dashes.push(d);
      }
    }
    const dashMesh = new THREE.Mesh(mergeGeometries(dashes), whitePaint);
    for (const g of dashes) g.dispose();
    tile.add(dashMesh);

    // Cat-eye studs beside the dashes every 18 m.
    const eyes: THREE.BufferGeometry[] = [];
    for (let i = 0; i < TILE / 18; i++) {
      for (const x of [-DASH_X, DASH_X]) {
        const e = new THREE.BoxGeometry(0.12, 0.045, 0.2);
        e.translate(x, 0.025, -TILE / 2 + 4.5 + i * 18);
        eyes.push(e);
      }
    }
    const eyeMesh = new THREE.Mesh(mergeGeometries(eyes), catEyeMat);
    for (const g of eyes) g.dispose();
    tile.add(eyeMesh);

    // Guardrail posts every 4 m.
    const posts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < TILE / 4; i++) {
      for (const side of [-1, 1]) {
        const p = new THREE.BoxGeometry(0.1, 0.58, 0.14);
        p.translate(side * RAIL_X, 0.29, -TILE / 2 + i * 4);
        posts.push(p);
      }
    }
    const postMesh = new THREE.Mesh(mergeGeometries(posts), poleMat);
    for (const g of posts) g.dispose();
    tile.add(postMesh);

    // White delineator posts with reflectors every 50 m on the shoulders.
    const sticks: THREE.BufferGeometry[] = [];
    const refl: THREE.BufferGeometry[] = [];
    for (let i = 0; i < TILE / 50; i++) {
      for (const side of [-1, 1]) {
        const s = new THREE.BoxGeometry(0.07, 1.15, 0.07);
        s.translate(side * (RAIL_X + 0.55), 0.575, -TILE / 2 + 21 + i * 50);
        sticks.push(s);
        const r = new THREE.BoxGeometry(0.075, 0.12, 0.075);
        r.translate(side * (RAIL_X + 0.55), 0.98, -TILE / 2 + 21 + i * 50);
        refl.push(r);
      }
    }
    const stickMesh = new THREE.Mesh(mergeGeometries(sticks), whitePaint);
    const reflMesh = new THREE.Mesh(mergeGeometries(refl), catEyeMat);
    for (const g of [...sticks, ...refl]) g.dispose();
    tile.add(stickMesh, reflMesh);

    // Yellow reflectors along the median barrier every 25 m.
    const medRefl: THREE.BufferGeometry[] = [];
    for (let i = 0; i < TILE / 25; i++) {
      for (const side of [-1, 1]) {
        const r = new THREE.BoxGeometry(0.05, 0.09, 0.14);
        r.translate(side * 0.27, 0.62, -TILE / 2 + 8 + i * 25);
        medRefl.push(r);
      }
    }
    const medReflMesh = new THREE.Mesh(mergeGeometries(medRefl), redReflMat);
    for (const g of medRefl) g.dispose();
    tile.add(medReflMesh);

    // Median lamp masts every 60 m: pole, twin arms, lit heads + light pools.
    for (let i = 0; i < TILE / 60; i++) {
      const z = -TILE / 2 + 30 + i * 60;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 10, 8), poleMat);
      pole.position.set(0, 5, z);
      pole.castShadow = true;
      tile.add(pole);
      const arms = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.12, 0.12), poleMat);
      arms.position.set(0, 9.7, z);
      tile.add(arms);
      for (const side of [-1, 1]) {
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.14, 0.3), lampHeadMat);
        head.position.set(side * 2.55, 9.62, z);
        tile.add(head);
        const pool = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), poolMat);
        pool.rotation.x = -Math.PI / 2;
        pool.position.set(side * 3.4, 0.03, z);
        tile.add(pool);
      }
    }

    return tile;
  };

  for (let i = 0; i < TILES; i++) {
    // Tiles cover z ∈ [-600, 300]; recycle once a tile is fully behind camera.
    addMover(buildTile(), -450 + i * TILE, 450, TILE * TILES);
  }

  // ---------- overhead sign gantry (recycles every 900 m, passes once) ----------
  const gantry = new THREE.Group();
  const legGeo = new THREE.BoxGeometry(0.55, 7.2, 0.55);
  for (const x of [-10.8, 10.8]) {
    const leg = new THREE.Mesh(legGeo, poleMat);
    leg.position.set(x, 3.6, 0);
    leg.castShadow = true;
    gantry.add(leg);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(22.7, 1.0, 0.8), poleMat);
  beam.position.y = 7.4;
  gantry.add(beam);
  const truss = new THREE.Mesh(new THREE.BoxGeometry(22.7, 0.14, 0.14), poleMat);
  truss.position.set(0, 6.7, 0.35);
  gantry.add(truss);
  const signTex = signTexture();
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(6.6, 2.75),
    new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false })
  );
  sign.position.set(4.6, 6.9, 0.46); // over our carriageway, facing the driver
  gantry.add(sign);
  const signBack = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 2.75), poleMat);
  signBack.rotation.y = Math.PI;
  signBack.position.set(4.6, 6.9, 0.44);
  gantry.add(signBack);
  addMover(gantry, -68, 460, TILE * TILES);

  // ---------- car ----------
  // The hero car mounts at carMount: nose toward -z, wheels resting on y=0,
  // cruising-lane center. The world treadmills past it, so the car itself
  // stays at z=0 and only the wheels spin; lights ramp with the street lamps.
  // The procedural Volvo XC60 renders from the first frame; the Sketchfab
  // Porsche 911 GLB streams in behind it and swaps in as soon as it's ready
  // (kept if it would arrive too late — no visible pop near the camera).
  const carMount = new THREE.Group();
  carMount.position.set(LANE_IN, 0, 0); // starts mid-overtake, merges right
  scene.add(carMount);
  const car = buildXC60Geometry();
  const carDress = applyXC60Materials(car);
  carMount.add(car.group);

  // One dressing-agnostic handle the timeline drives, whichever car is live.
  type ActiveCar = {
    body: THREE.Object3D; // gets the merge yaw/lean
    wheels: THREE.Object3D[];
    wheelSpin: number; // signed rad per meter of forward travel
    setLights(k: number): void;
    dispose(): void;
  };
  let active: ActiveCar = {
    body: car.group,
    wheels: car.wheels,
    wheelSpin: -1 / 0.37, // XC60 wheel radius 0.37 m; -x spin rolls forward
    setLights: carDress.setLightsOn,
    dispose: () => carDress.dispose(),
  };
  let lightsK = 0;

  // Taillight bloom: additive sprites hugging the rear lights so the rear
  // signature blooms once the lights ramp (the chase camera lives back here).
  const tailFlareTex = radialTexture([
    [0, "rgba(255,64,48,0.9)"],
    [0.4, "rgba(230,32,24,0.25)"],
    [1, "rgba(230,32,24,0)"],
  ]);
  const tailFlareMat = new THREE.SpriteMaterial({
    map: tailFlareTex,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: 0,
  });
  const addTailFlares = (target: THREE.Object3D, x: number, y: number, z: number) => {
    for (const side of [-1, 1]) {
      const flare = new THREE.Sprite(tailFlareMat);
      flare.position.set(side * x, y, z);
      flare.scale.set(0.55, 0.55, 1);
      target.add(flare);
    }
  };
  addTailFlares(car.group, 0.63, 0.98, 2.4); // on the XC60's L-blades

  loadPorsche()
    .then((rig) => {
      // Swapping right in front of the camera would read as a glitch; only
      // take the GLB if it arrives while the camera is still craning down.
      if (disposed || t > 1.1) {
        rig.dispose();
        return;
      }
      carMount.remove(car.group);
      carDress.dispose();
      car.group.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose(); // sprites share geometry/material — leave them
      });
      carMount.add(rig.group);
      addTailFlares(rig.group, 0.6, 0.78, 2.28); // on the 911's tail bar, proud of the skin
      active = {
        body: rig.group,
        wheels: rig.wheels,
        wheelSpin: rig.wheelSpin,
        setLights: rig.setLightsOn,
        dispose: rig.dispose,
      };
      active.setLights(lightsK);
    })
    .catch(() => {
      // Model missing or WebGL hiccup: the procedural XC60 carries the intro.
    });

  // ---------- oncoming traffic ----------
  // Two cars sweep past on the other carriageway: dark bodies, hot headlight
  // glare that pierces the fog. At combined ~65 m/s they cross the frame fast.
  const glareTex = radialTexture([
    [0, "rgba(255,240,214,0.95)"],
    [0.25, "rgba(255,225,180,0.35)"],
    [1, "rgba(255,225,180,0)"],
  ]);
  const oncomingMat = new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.85, metalness: 0.2 });
  const oncoming: THREE.Group[] = [];
  const buildOncoming = (laneX: number, z0: number): void => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.95, 4.4), oncomingMat);
    body.position.y = 0.75;
    g.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 2.1), oncomingMat);
    cabin.position.set(0, 1.45, 0.2);
    g.add(cabin);
    for (const x of [-0.62, 0.62]) {
      const glare = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: glareTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 1, fog: false })
      );
      glare.position.set(x, 0.72, 2.28); // nose faces +z — toward the camera
      glare.scale.set(2.6, 2.6, 1);
      g.add(glare);
    }
    // Wide soft halo so the pair reads as one hot glow from far away.
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glareTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.3, fog: false })
    );
    halo.position.set(0, 0.8, 2.3);
    halo.scale.set(7, 3.2, 1);
    g.add(halo);
    g.position.set(laneX, 0, z0);
    scene.add(g);
    oncoming.push(g);
  };
  buildOncoming(-LANE_OUT, -65); // whooshes past at ~0.9 s
  buildOncoming(-LANE_IN, -125); // second pass right before the fade

  // ---------- timeline ----------
  let raf = 0;
  let prev = performance.now();
  let t = 0;
  let disposed = false;
  let doneFired = false;

  const finish = () => {
    if (!doneFired) {
      doneFired = true;
      onDone();
    }
  };

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  };
  window.addEventListener("resize", onResize);

  const advance = (dt: number) => {
    t += dt;

    // The car is still accelerating out of the overtake: the treadmill speed
    // ramps 80% → 115% of cruise, which (with the FOV kick) sells the surge.
    const dz = SPEED * (0.8 + 0.35 * seg(t, 0, 1.6)) * dt;
    for (const m of movers) {
      m.position.z += dz;
      while (m.position.z > (m.userData.recycleAt as number)) m.position.z -= m.userData.span as number;
    }
    asphaltTex.offset.y += dz / 22.5; // one texture repeat = 22.5 m of road

    // Wheels roll to match the treadmill speed (contact patch moves +z).
    for (const w of active.wheels) w.rotation.x += dz * active.wheelSpin;

    // Overtake finished: the car merges from the fast lane into the cruising
    // lane with a touch of counter-yaw and body lean.
    const mergeT = seg(t, 0.3, 1.2);
    carMount.position.x = LANE_IN + (LANE_OUT - LANE_IN) * easeInOutCubic(mergeT);
    const mergeBell = Math.sin(Math.PI * mergeT);
    active.body.rotation.y = -0.1 * mergeBell;
    active.body.rotation.z = 0.024 * mergeBell;

    // Oncoming traffic closes at combined speed and sweeps past the camera.
    for (const o of oncoming) {
      o.position.z += (SPEED + 34) * dt;
      if (o.position.z > 70) o.position.z -= 460;
    }

    // Street lights snap on early; the car lights up right behind them.
    const lampsOn = seg(t, 0.05, 0.5);
    lampHeadMat.emissiveIntensity = lampsOn * 2.6;
    poolMat.opacity = lampsOn * 0.2;
    lightsK = seg(t, 0.12, 0.6);
    active.setLights(lightsK);
    tailFlareMat.opacity = lightsK * 0.5;

    // Camera: a quick crane down from the valley reveal into a low chase
    // position behind the car, a gentle highway sway, a touch of roll as the
    // car merges, and a widening FOV kick that sells the acceleration.
    const k = easeInOutCubic(seg(t, 0.02, 1.3));
    const sway = seg(t, 0.55, 1.4);
    camera.position.set(
      11.5 + (7.3 - 11.5) * k + Math.sin(t * 2.2) * 0.14 * sway,
      7.0 + (2.85 - 7.0) * k + Math.sin(t * 4.1) * 0.045 * sway,
      30 + (12.5 - 30) * k
    );
    lookTarget.set(
      2 + (LANE_OUT - 0.4 - 2) * k + Math.sin(t * 1.8) * 0.3 * sway,
      4 + (1.5 - 4) * k,
      -80 + (-32 - -80) * k
    );
    camera.lookAt(lookTarget);
    camera.rotateZ(0.03 * mergeBell); // lean with the merge
    camera.fov = 52 + 9 * easeInOutCubic(seg(t, 0.8, 2.1));
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);
  };

  const tick = (now: number) => {
    if (disposed) return;
    // Clamp dt so a backgrounded tab resumes gracefully instead of jump-cutting.
    const dt = Math.min((now - prev) / 1000, 0.05);
    prev = now;
    advance(dt);

    if (t >= DONE_AT) finish();
    if (t < DURATION) {
      raf = requestAnimationFrame(tick);
    }
  };
  raf = requestAnimationFrame(tick);

  if (process.env.NODE_ENV === "development") {
    // Debug-only scrubber, stripped from production builds. __introSeek(sec)
    // pauses the clock and renders the frame at an absolute second (so the
    // intro never fades out from under an inspection); __introPlay() resumes.
    const w = window as unknown as { __introSeek?: (sec: number) => void; __introPlay?: () => void };
    w.__introSeek = (sec: number) => {
      cancelAnimationFrame(raf);
      const delta = Math.max(0, sec) - t;
      prev = performance.now();
      advance(delta);
    };
    w.__introPlay = () => {
      prev = performance.now();
      raf = requestAnimationFrame(tick);
    };
  }

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    active.dispose();
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite || obj instanceof THREE.Points) {
        obj.geometry?.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) m?.dispose();
      }
    });
    for (const tex of [skyTex, asphaltTex, signTex, glowTex, moonTex, poolTex, tailFlareTex, glareTex]) tex.dispose();
    envTex.dispose();
    renderer.dispose();
  };

  return { skip: finish, dispose };
}
