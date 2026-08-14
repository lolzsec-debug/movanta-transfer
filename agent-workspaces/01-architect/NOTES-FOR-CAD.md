# NOTES FOR CAD (agent 2)

You are skinning `sections.json` into three.js BufferGeometry. Read SPEC.md for parts, slots and
budgets; this file is the how.

## Consuming sections.json

1. **Loft the half-hull.** 16 sections, monotonic z, 10 points each with fixed semantics
   (P0…P9). Corresponding indices are the longitudinal flow lines — connect P_i of section k to
   P_i of section k+1. Straight pairwise lofting works but looks faceted; instead:
   - Fit a Catmull-Rom curve **per point index** through all 16 sections (16 samples in z →
     resample ~60 rings).
   - Within each resampled ring, fit a Catmull-Rom through the 10 points and resample to
     ~24 ring-points. Keep P0 and P9 pinned at x = 0 (tangent handling: mirror the first/last
     control point across x = 0 so the surface crosses the centerline flat, no crease).
   - Result: ~60 × 24 grid per half → indexed quad strip, ~11k tris for the full body.
2. **Cap the ends.** Nose (z −2.3505) and tail (z +2.3575) sections are small rounded rings —
   close each with a triangle fan to the ring centroid, pushed 0.03 outward in z for a rounded tip.
3. **Mirror for the left side.** Build the half-hull for x ≥ 0, then either (a) `geometry.clone()`
   + scale(−1, 1, 1) + `Mesh` with `side` handled by flipping index winding, or (b) mirror the
   ring points before triangulating and emit one watertight geometry. Prefer (b): one mesh, one
   draw call, correct normals via `computeVertexNormals()` after welding the centerline seam
   (P0/P9 points are exactly x = 0 — weld by index reuse, don't duplicate them).

## Greenhouse = separate geometry, not part of the hull skin

The hull loft includes the glasshouse volume (points P6–P9 above the beltline) so the silhouette
is right. Cut the visual glass as SEPARATE inset patches (SPEC §4): windshield, one side-DLO band
per side, rear window. Build them by sampling the SAME loft surface (reuse your resampled grid
rows between beltline flow-line P6 and roof-edge flow-line P8) and offsetting 0.012 along the
normal INWARD. Assign slot `glass`. The hull region behind glass stays `paint` — agent 3 darkens
the DLO surround, so no cutting.

## Wheel arches: tunnels, not booleans

Do NOT boolean-cut the hull. For each axle (z = ∓1.4325, wheel center x = ±0.83, y = 0.3705):

1. When generating hull grid vertices, test each vertex against the arch cylinder: axis along x,
   center (y 0.3705, z axle), radius 0.46. If a vertex with |x| > 0.60 falls inside the cylinder,
   it belongs to the opening zone.
2. Instead of deleting faces, **project** those vertices radially outward in (y,z) to the 0.46
   circle and then pull them inboard to |x| = 0.78 — this forms the arch tunnel wall (a smooth
   inward funnel). Vertices already outside are untouched. Snap the rim of the funnel to the
   circle so the opening edge is a clean arc.
3. Add an inner drum: half-cylinder radius 0.47, width 0.30 (from |x| 0.78 down to 0.48), open
   at the bottom, slot `underbody`, so the camera never sees through the car.
4. The cladding lip (slot `trim`) is a swept strip along the same 0.46 arc, proud 0.02,
   tube 0.025 — see SPEC §4.

Clamp all tunnel geometry to y ≥ 0.02 (never below ground).

## Assembly / exported API

Deliver one module, e.g. `agent-workspaces/02-cad/xc60.ts`:

```ts
export interface XC60Handles {
  root: THREE.Group;        // name "xc60", origin per SPEC §2, resting on y=0
  body: THREE.Group;        // everything except wheels
  wheels: THREE.Group[];    // [FL, FR, RL, RR], spin about local +x
  headlightL: THREE.Object3D;  // empties per SPEC §8
  headlightR: THREE.Object3D;
  tailGlow: THREE.Object3D;
  byMaterialSlot: Record<string, THREE.Mesh[]>; // keyed by SPEC §6 slot names
}
export function buildXC60(): XC60Handles;
```

- Build with placeholder `MeshStandardMaterial`s, ONE material instance per slot, stored on the
  meshes and also set as `mesh.userData.slot` — agent 3 replaces materials strictly by slot.
- Wheel groups positioned at axle points; wheel geometry centered on the group origin.
- `castShadow = true` on hull, wheels, mirrors; `receiveShadow = false` everywhere; glass casts
  nothing.
- Merge static same-slot meshes where convenient (BufferGeometryUtils) but never merge across
  slots, never merge wheels into the body, and keep each taillight blade its own mesh.
- Stay under the 60k-triangle cap; print `renderer.info`-style triangle count in a comment.

## Quality bar (chase-camera priorities, in order)

1. Rear: taillight L-blades, tailgate plane, bumper, exhaust trims, plate.
2. Right-rear ¾: rear arch + cladding, shoulder-line highlight continuity, D-pillar.
3. Side/roof silhouette during the crane-down: roofline curve, rails, mirror.
4. Front: cheap — it is essentially never on camera.
