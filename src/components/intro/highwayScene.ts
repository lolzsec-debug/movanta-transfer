import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { buildXC60Geometry } from "./xc60Geometry";
import { applyXC60Materials } from "./xc60Materials";
import { loadPorsche, type PorscheRig } from "./porscheCar";
import { loadTunnel, type TunnelRig } from "./tunnelRoad";

/**
 * Cinematic landing intro: a fast night run through a motorway tunnel.
 * The world is the Sketchfab "Tunnel Road" section (see tunnelRoad.ts)
 * cloned into an infinite treadmill of three tiles that recycle behind the
 * camera; merged additive strips fake the sodium ceiling lights and their
 * pools on the asphalt. The hero car is the Porsche 911 GLB with the
 * procedural Volvo XC60 as offline fallback.
 *
 * Both models preload BEFORE the timeline starts (capped by MODEL_WAIT, the
 * page cover is black anyway), so exactly one car ever renders — no mid-run
 * swap pop. Performance: no shadow maps, pixel ratio capped at 1.5, and the
 * whole world is a handful of draw calls. Everything is disposed at the end.
 */

export type IntroHandle = {
  /** Jump straight to the end fade. */
  skip: () => void;
  /** Stop rendering and free all GPU resources. */
  dispose: () => void;
};

const DURATION = 2.45; // seconds; onDone fires earlier so the CSS fade overlaps the drive
const DONE_AT = 1.9;
const MODEL_WAIT = 2600; // ms to hold the black cover for the GLBs before falling back

const SPEED = 44; // m/s peak; the world scrolls +z past the static car anchor
const TILES = 3;

// Two-lane bore, one lane each way (road ±4.5 m after the unbend): the car
// starts still straddling the center line finishing an overtake, and tucks
// back into the right lane as the first oncoming headlights close in.
const LANE_OUT = 2.2; // right-lane center — where the car ends up
const LANE_IN = -0.7; // mid-overtake position — nose still in the oncoming lane

const FOG_COLOR = 0x171208; // warm sodium-lit dark

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Progress 0→1 across [t0, t1]. */
const seg = (t: number, t0: number, t1: number) => clamp01((t - t0) / (t1 - t0));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
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

/** Speckled asphalt for the no-tunnel fallback road. */
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
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function startHighwayIntro(canvas: HTMLCanvasElement, onDone: () => void): IntroHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  // No shadow maps at all — the tunnel look doesn't need them and they were
  // the single biggest frame-time cost of the old open-air scene.

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(FOG_COLOR, 35, 230);
  scene.background = new THREE.Color(FOG_COLOR);

  // Soft studio reflections so the car paint reads as curved surfaces.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environment = envTex;
  scene.environmentIntensity = 0.35;

  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 600);
  camera.position.set(1.6, 3.4, 26);
  const lookTarget = new THREE.Vector3(0, 1.8, -70);

  // ---------- lights (no shadows) ----------
  scene.add(new THREE.HemisphereLight(0xffc890, 0x0d0a06, 0.4));
  const key = new THREE.DirectionalLight(0xffdcae, 0.32);
  key.position.set(4, 30, 20);
  scene.add(key);

  // ---------- treadmill ----------
  const movers: THREE.Object3D[] = [];
  const addMover = (obj: THREE.Object3D, z: number, recycleAt: number, span: number) => {
    obj.position.z = z;
    obj.userData.recycleAt = recycleAt;
    obj.userData.span = span;
    scene.add(obj);
    movers.push(obj);
  };

  // ---------- shared sprite/glow textures ----------
  const poolTex = radialTexture([
    [0, "rgba(255,190,120,0.5)"],
    [0.5, "rgba(255,180,110,0.14)"],
    [1, "rgba(255,180,110,0)"],
  ]);
  const glareTex = radialTexture([
    [0, "rgba(255,240,214,0.95)"],
    [0.25, "rgba(255,225,180,0.35)"],
    [1, "rgba(255,225,180,0)"],
  ]);
  const tailFlareTex = radialTexture([
    [0, "rgba(255,64,48,0.9)"],
    [0.4, "rgba(230,32,24,0.25)"],
    [1, "rgba(230,32,24,0)"],
  ]);
  const extraTextures: THREE.Texture[] = [poolTex, glareTex, tailFlareTex];

  // Ceiling strips + road pools fade in during the first beat.
  const stripMat = new THREE.MeshBasicMaterial({
    color: 0xffd9a4,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: 0,
  });
  const poolMat = new THREE.MeshBasicMaterial({
    map: poolTex,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: 0,
  });

  // ---------- world: tunnel treadmill (or minimal fallback road) ----------
  const buildTunnelWorld = (rig: TunnelRig) => {
    const L = rig.tileLength;
    // Just below the inner ceiling apex (~6.3 m).
    const ceilY = Math.min(rig.ceilingHeight - 0.7, 5.6);
    for (let i = 0; i < TILES; i++) {
      const tile = new THREE.Group();
      tile.add(rig.buildTile());

      // A single center row of sodium strips on the ceiling every 16 m,
      // merged into one mesh; matching pools on the asphalt below.
      const strips: THREE.BufferGeometry[] = [];
      const pools: THREE.BufferGeometry[] = [];
      for (let k = 0; k < L / 16; k++) {
        const z = -L / 2 + 8 + k * 16;
        const strip = new THREE.PlaneGeometry(0.7, 2.6);
        strip.rotateX(Math.PI / 2); // face down
        strip.translate(0, ceilY, z);
        strips.push(strip);
        const pool = new THREE.PlaneGeometry(11, 11);
        pool.rotateX(-Math.PI / 2);
        pool.translate(0, 0.04, z + 1.5);
        pools.push(pool);
      }
      const stripMesh = new THREE.Mesh(mergeGeometries(strips), stripMat);
      const poolMesh = new THREE.Mesh(mergeGeometries(pools), poolMat);
      for (const g of [...strips, ...pools]) g.dispose();
      tile.add(stripMesh, poolMesh);

      // Tiles cover z ∈ [-1.5L, 1.5L]; recycle once fully behind the camera.
      addMover(tile, -L * 1.5 + (i + 0.5) * L, 30 + L / 2, L * TILES);
    }
  };

  const buildFallbackRoad = () => {
    // Offline / load-failure fallback: a bare night road in the fog.
    const asphaltTex = asphaltTexture();
    asphaltTex.repeat.set(2, 600 / 22.5);
    extraTextures.push(asphaltTex);
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 600),
      new THREE.MeshStandardMaterial({ map: asphaltTex, color: 0x9aa0aa, roughness: 0.7 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.z = -150;
    scene.add(road);
    const paint = new THREE.MeshStandardMaterial({ color: 0xb9c2cc, roughness: 0.55 });
    const dashes: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 60; i++) {
      for (const x of [-4.6, 0, 4.6]) {
        const d = new THREE.PlaneGeometry(0.15, 3);
        d.rotateX(-Math.PI / 2);
        d.translate(x, 0.01, -i * 9);
        dashes.push(d);
      }
    }
    const dashTile = new THREE.Mesh(mergeGeometries(dashes), paint);
    for (const g of dashes) g.dispose();
    addMover(dashTile, 200, 220, 540);
  };

  // ---------- car mount + preload ----------
  const carMount = new THREE.Group();
  carMount.position.set(LANE_IN, 0, 0); // starts mid-overtake, merges right
  scene.add(carMount);

  type ActiveCar = {
    body: THREE.Object3D; // gets the merge yaw/lean
    wheels: THREE.Object3D[];
    wheelSpin: number; // signed rad per meter of forward travel
    setLights(k: number): void;
    dispose(): void;
  };
  let active: ActiveCar | null = null;
  let lightsK = 0;

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

  // Both GLBs preload while the black cover is still up; the timeline starts
  // when they're in (or MODEL_WAIT expires). Exactly one car is ever added,
  // so there is no visible model swap during the run.
  let porscheRig: PorscheRig | null = null;
  let tunnelRig: TunnelRig | null = null;
  let started = false;
  let disposed = false;

  const carLoad = loadPorsche()
    .then((rig) => {
      if (disposed || started) rig.dispose();
      else porscheRig = rig;
    })
    .catch(() => {});
  const tunnelLoad = loadTunnel()
    .then((rig) => {
      if (disposed || started) rig.dispose();
      else tunnelRig = rig;
    })
    .catch(() => {});

  const beginTimeline = () => {
    if (disposed || started) return;
    started = true;

    if (porscheRig) {
      carMount.add(porscheRig.group);
      addTailFlares(porscheRig.group, 0.6, 0.78, 2.28);
      active = {
        body: porscheRig.group,
        wheels: porscheRig.wheels,
        wheelSpin: porscheRig.wheelSpin,
        setLights: porscheRig.setLightsOn,
        dispose: porscheRig.dispose,
      };
    } else {
      const car = buildXC60Geometry();
      const dress = applyXC60Materials(car);
      carMount.add(car.group);
      addTailFlares(car.group, 0.63, 0.98, 2.4);
      active = {
        body: car.group,
        wheels: car.wheels,
        wheelSpin: -1 / 0.37,
        setLights: dress.setLightsOn,
        dispose: () => dress.dispose(),
      };
    }

    if (tunnelRig) buildTunnelWorld(tunnelRig);
    else buildFallbackRoad();

    prev = performance.now();
    raf = requestAnimationFrame(tick);
  };

  Promise.race([
    Promise.allSettled([carLoad, tunnelLoad]),
    new Promise((res) => window.setTimeout(res, MODEL_WAIT)),
  ]).then(beginTimeline);

  // ---------- oncoming traffic ----------
  // Two cars sweep past on the other side of the bore — hot headlight glare
  // piercing the tunnel haze.
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
  buildOncoming(-2.2, -60); // the oncoming near-miss at ~0.8 s
  buildOncoming(-2.2, -115); // second pass right before the fade

  // ---------- timeline ----------
  let raf = 0;
  let prev = performance.now();
  let t = 0;
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

    // Still accelerating out of the overtake: the treadmill speed ramps
    // 80% → 115% of cruise, which (with the FOV kick) sells the surge.
    const dz = SPEED * (0.8 + 0.35 * seg(t, 0, 1.6)) * dt;
    for (const m of movers) {
      m.position.z += dz;
      while (m.position.z > (m.userData.recycleAt as number)) m.position.z -= m.userData.span as number;
    }

    if (active) {
      // Wheels roll to match the treadmill speed (contact patch moves +z).
      for (const w of active.wheels) w.rotation.x += dz * active.wheelSpin;

      // Overtake finished: merge from the fast lane into the cruising lane
      // with a touch of counter-yaw and body lean.
      const mergeT = seg(t, 0.3, 1.2);
      carMount.position.x = LANE_IN + (LANE_OUT - LANE_IN) * easeInOutCubic(mergeT);
      const mergeBell = Math.sin(Math.PI * mergeT);
      active.body.rotation.y = -0.1 * mergeBell;
      active.body.rotation.z = 0.024 * mergeBell;

      // Tunnel lighting snaps up in the first beat; car lights right behind.
      const glow = seg(t, 0, 0.3);
      stripMat.opacity = glow * 0.9;
      poolMat.opacity = glow * 0.22;
      lightsK = seg(t, 0.05, 0.45);
      active.setLights(lightsK);
      tailFlareMat.opacity = lightsK * 0.5;

      // Camera: settle from a high rear vantage under the ceiling into the
      // low chase position, with highway sway, a touch of roll on the merge
      // and a widening FOV kick that sells the acceleration.
      const k = easeInOutCubic(seg(t, 0.02, 1.3));
      const sway = seg(t, 0.55, 1.4);
      camera.position.set(
        1.6 + (3.3 - 1.6) * k + Math.sin(t * 2.2) * 0.1 * sway,
        3.4 + (2.35 - 3.4) * k + Math.sin(t * 4.1) * 0.045 * sway,
        26 + (12.5 - 26) * k
      );
      lookTarget.set(
        (LANE_OUT - 0.2) * k + Math.sin(t * 1.8) * 0.2 * sway,
        1.8 + (1.3 - 1.8) * k,
        -70 + (-32 - -70) * k
      );
      camera.lookAt(lookTarget);
      camera.rotateZ(0.03 * mergeBell); // lean with the merge
      camera.fov = 52 + 9 * easeInOutCubic(seg(t, 0.8, 2.1));
      camera.updateProjectionMatrix();
    }

    // Oncoming traffic closes at combined speed and sweeps past the camera.
    for (const o of oncoming) {
      o.position.z += (SPEED + 34) * dt;
      if (o.position.z > 70) o.position.z -= 460;
    }

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
    active?.dispose();
    porscheRig?.dispose();
    tunnelRig?.dispose();
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite || obj instanceof THREE.Points) {
        obj.geometry?.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) m?.dispose();
      }
    });
    for (const tex of extraTextures) tex.dispose();
    envTex.dispose();
    renderer.dispose();
  };

  return { skip: finish, dispose };
}
