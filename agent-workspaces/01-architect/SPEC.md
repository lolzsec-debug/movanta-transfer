# SPEC — Volvo XC60 (2022, SPA) procedural model

Master build specification. Agent 2 (CAD / BufferGeometry) implements geometry from this file plus
`sections.json`. Agent 3 (shading) dresses the material slots listed in §6. Target renderer: the
blue-hour highway scene in `src/components/intro/highwayScene.ts` (three ^0.185, ACES, fog,
RoomEnvironment @ 0.35). The camera dwells at the REAR and RIGHT-REAR; spend quality there.

---

## 1. Official exterior dimensions (meters)

| Quantity                | Value  |
|-------------------------|--------|
| Overall length          | 4.708  |
| Overall width (no mirrors) | 1.902 (half-width 0.951) |
| Overall height          | 1.658  |
| Wheelbase               | 2.865  |
| Front overhang          | 0.918  |
| Rear overhang           | 0.925  |
| Track (front ≈ rear)    | 1.66 (wheel centers at x = ±0.83) |
| Tire/wheel OD (235/55R19) | 0.741 → radius 0.3705, axle height y = 0.3705 |
| Tire section width      | 0.235  |
| Ground clearance        | 0.216 (lowest hardware); modelled floor pan sits at y ≈ 0.27 |

## 2. Coordinate frame contract (binding)

- Local origin: ground level, mid-wheelbase, on the car's centerline.
- **+x = right side of car, +y = up, nose toward −z.** Matches `carMount` in highwayScene.ts.
- Front axle: z = **−1.4325**. Rear axle: z = **+1.4325**.
- Nose tip: z = **−2.3505**. Rear bumper tip: z = **+2.3575**. (Sum = 4.708.)
- Wheels rest on y = 0. Body roll = 0. The whole car parents under one `Group` named `xc60`.

## 3. Body-section plan (the loft)

16 lateral cross-sections, half-hull (x ≥ 0), mirrored in x for the left side. Each section is
10 points with a fixed semantic index so sections loft pairwise into a clean quad strip:

| idx | meaning |
|-----|---------|
| P0  | centerline underside (x = 0, floor) |
| P1  | outer underside / valance edge |
| P2  | rocker / bumper bottom outer corner (≈ y 0.32–0.46) |
| P3  | lower body / cladding top (≈ y 0.46–0.56) |
| P4  | mid door surface |
| P5  | **shoulder line** — widest point of the section (never exceeds x 0.951) |
| P6  | beltline / DLO base (start of tumblehome) |
| P7  | glass lower-mid (or bonnet outer edge ahead of the cowl) |
| P8  | glass upper / roof edge |
| P9  | centerline top (x = 0) |

Full numeric data lives in `sections.json`; the stations and design intent:

| # | z | intent |
|---|-------|--------|
| 1 | −2.3505 | nose/bumper tip, rounded, top = bonnet leading edge y 0.98 |
| 2 | −2.18 | full front fascia: upright grille face, bumper bottom y 0.30, grille top y ~1.02 |
| 3 | −1.95 | headlight zone, fenders swelling to x 0.92 |
| 4 | −1.70 | front arch leading edge |
| 5 | −1.4325 | front axle: arch apex, full width 0.951 at shoulder |
| 6 | −1.05 | bonnet mid — long, nearly flat bonnet with strong shoulder (P5 y 0.86) |
| 7 | −0.72 | cowl / windshield base: bonnet top y ~1.05, glass just starting (top y 1.12) |
| 8 | −0.40 | mid-windshield, raked A-pillar (top y 1.44), greenhouse tapering in |
| 9 | −0.10 | roof peak **y 1.658**, roof half-width 0.60 |
| 10 | +0.45 | B-pillar: roofline near level (1.655) |
| 11 | +0.95 | rear door: roof falling gently (1.635), belt rising a touch |
| 12 | +1.4325 | rear axle: roof 1.60, rear arch full width |
| 13 | +1.80 | D-pillar: rakish-but-upright, greenhouse pinching (P8 x 0.50), roof 1.565 |
| 14 | +2.10 | tail-lamp station / spoiler lip: **tail top y 1.52**, body still wide (0.90) |
| 15 | +2.28 | tailgate face upper + bumper corner — near-vertical tailgate plane |
| 16 | +2.3575 | rear bumper tip, rounded, top y 1.07 |

The near-vertical tailgate is produced by the tight z-spacing of stations 14→16 (1.52 → 1.38 →
1.07 over 0.26 m). The windshield rake is stations 7→9. The concave grille is NOT in the hull —
the hull carries a flat fascia between stations 1–2; the grille is a separate inset part (§4).

Sanity constraints (already satisfied in sections.json — do not violate when tweaking):
monotonic z; identical point count (10) per section; max |x| = 0.951; rocker bottom ≈ 0.32–0.36;
bonnet 1.05 at cowl; roof peak 1.658 at z −0.10; tail top 1.52 at z +2.10.

## 4. Part list (placement + sizes, meters)

**Wheels × 4** — separate objects (see §7). Tire torus/cylinder OD 0.741, width 0.235, centers at
(±0.83, 0.3705, ∓1.4325). Rim face diameter 0.4826 (19"), dished ~0.04 inboard. Rim style:
5 double-spokes (10 thin spokes paired), slot `rim`; small center cap, slot `chrome`.

**Wheel arches × 4** — arch tunnels in the hull (see NOTES-FOR-CAD) with opening radius 0.46
around each axle center, plus a protruding **black cladding lip**: a quarter-torus strip, tube
radius 0.025, following the opening from front-lower to rear-lower, proud of the body by 0.02,
slot `trim`. Squared-off "boxy" look: flatten the lip's top 60° span slightly (scale y 0.94).

**Greenhouse glass** — three pieces, slot `glass`:
- Windshield: lofted quad patch spanning stations 7–9, inset 0.01 from hull surface.
- Side DLO: ONE wrapped band per side from A-pillar (z −0.55) to D-pillar (z +1.85), between
  beltline (P6) and roof edge (P8), inset 0.012; kick-up of the belt at the D-pillar (+0.06 y
  over the last 0.35 m). Do not model door glass splits — agent 3 fakes the divider bars.
- Rear window: quad patch on the tailgate plane, x ∈ [−0.48, 0.48], y ∈ [1.13, 1.46] at z ≈ +2.16,
  tilted to match the 14→15 loft.

**Roof rails × 2** — low-profile bars, 1.9 long (z −0.35 → +1.55), cross-section 0.035 × 0.045,
at x = ±0.55, sitting on the roof surface, slot `trim` (satin silver is acceptable via trim slot;
agent 3 decides tint).

**Door mirrors × 2** — teardrop shell 0.20 (z) × 0.12 (y) × 0.10 (x) on a 0.06 stalk at
(±0.98, 1.02, −0.45), slot `paint` shell with `trim` stalk. They may exceed the 1.902 body width.

**Door handles × 4** — flush bump bars 0.16 × 0.03 × 0.015 proud by 0.01, at y 0.95,
z ≈ −0.35 and +0.75, slot `chrome`.

**Front grille** — inset concave panel behind a 0.90 × 0.55 (w × h) opening centered at
(0, 0.72, −2.31); panel bows inward 0.05 at center (the XC60's concave grille). Slot `trim`
(vertical bars are shading). **Iron mark**: diagonal bar 0.03 wide from upper-left to lower-right
of a 0.16 circle at grille center, slot `chrome`.

**Headlights × 2 (Thor's hammer)** — housing: shallow box 0.42 (x) × 0.13 (y) × 0.10 (z) wrapping
the fender corner at inner edge (±0.30, 0.86, −2.28), outer edge sweeping back to z −2.10. Slot
`lightFront` for the lens face; put a T-shaped DRL blade (the hammer: horizontal bar 0.36 long +
stem 0.10 toward the grille) as separate thin geometry 0.012 proud, also `lightFront` (agent 3
gives it the emissive). **Headlight anchor**: empty `Object3D` named `headlightL`/`headlightR` at
(±0.62, 0.83, −2.30) for the scene to attach spotlights.

**Taillights × 2 (vertical L)** — the signature: full-height blade climbing the D-pillar.
Outer vertical run: from bumper top (±0.86, 0.62, +2.30) up along the tail edge to (±0.72, 1.46,
+2.14), width 0.09, proud 0.012; then the L kicks forward along the D-pillar to (±0.60, 1.50,
+1.90). Plus the inner horizontal hook toward the tailgate center at y 0.72, 0.25 long. All slot
`lightRear`. This is the most camera-facing part of the car — model it with real geometry, ~40
segments each.

**Rear bumper + skid plate** — bumper is stations 14–16 of the hull (slot `paint` upper, `trim`
lower band below y 0.50). Skid plate: trapezoid plate 0.70 wide × 0.12 tall on the bumper face at
y 0.36, slot `chrome` (satin alu). **Exhaust trims × 2**: horizontal rounded-rect tubes
0.10 × 0.05, at (±0.58, 0.40, +2.34), slot `chrome`, black interior disc slot `trim`.

**Front splitter / chin** — trim band below y 0.42 on stations 1–3, slot `trim`, with a subtle
lip ledge 0.02 at y 0.30.

**Antenna fin** — shark fin 0.18 (z) × 0.06 (y) × 0.035 (x) at (0, 1.66 local roof, +1.45),
slot `paint`.

**License plate** — 0.52 × 0.11 plate at (0, 0.55, +2.36), slot `plate`, with 0.01 chrome frame
optional.

**Underbody** — single dark closing panel at y 0.26 spanning the floor, slot `underbody`.

**Panel gaps** — model NONE as geometry. Bonnet shutline, door cuts, tailgate seam, charge/fuel
door: all agent 3's job (dark AO lines in the paint shading). Exception: the tailgate spoiler lip
at station 14 gets a real 0.015 step because it is silhouette-visible from the chase camera.

## 5. What the hull does NOT include

Grille cavity (separate part), headlight/taillight cutouts (parts sit proud/inset on the hull —
no boolean cuts), wheel openings (arch tunnels, see NOTES-FOR-CAD), mirrors, rails, fin.

## 6. Material slot map

Every mesh gets `mesh.userData.slot` = one of:

| slot | parts |
|------|-------|
| `paint` | hull, bonnet region, mirrors shells, antenna fin, spoiler lip |
| `glass` | windshield, side DLO bands, rear window |
| `trim` | grille panel, splitter, rocker/cladding lips, arch lips, lower bumper bands, mirror stalks, roof rails, exhaust inner |
| `chrome` | iron mark, window surround strip (optional), door handles, skid plate, exhaust tips, plate frame |
| `tire` | 4 tires |
| `rim` | 4 rims + spokes |
| `lightFront` | headlight lenses + DRL blades |
| `lightRear` | taillight L-blades + inner hooks |
| `underbody` | floor panel, arch tunnel interiors |
| `plate` | license plate face |

## 7. Level of detail (budget ≤ ~60k triangles)

Geometry money goes to what the camera sees: **taillights, tail/rear-quarter hull curvature,
rear arches, wheels, roofline silhouette.**

- Hull loft: 16 sections × 10 points, but SUBDIVIDE the loft (Catmull-Rom through sections
  longitudinally, smooth the 10-point rings) to ≈ 60 rings × 24 ring-points per half ≈ 5.5k tris
  per half → ~11k for the body. Do not exceed 80 rings.
- Wheels: ≤ 3.5k tris each including spokes (torus 24×12, spokes as boxes).
- Taillights: ~1.2k each. Headlights: ~600 each (they are barely seen).
- Everything else primitive-level. Total target 35–50k, hard cap 60k.
- Fake with shading: panel lines, badges ("VOLVO" lettering, model script), grille bars, wiper,
  sensors, glass divider bars, door seals.

## 8. Animation & scene integration notes

- **Wheels spin**: each wheel is its own `Group` named `wheelFL`, `wheelFR`, `wheelRL`, `wheelRR`,
  positioned at the axle point, geometry centered on its own origin, spinning about **local x**.
  Angular velocity = speed / 0.3705. No steering articulation needed (straight motorway).
- **Headlight anchors**: `headlightL`, `headlightR` empties as in §4; also add `tailGlow` empty at
  (0, 1.0, +2.30) for a rear glow sprite.
- Car sits at lane center (the scene sets `carMount.position`); body roll 0, pitch 0. A subtle
  vertical body shimmy, if any, is applied by the scene to a child group `body` (everything except
  wheels), so keep body vs. wheels as sibling groups under `xc60`.
- Shadows: hull + wheels `castShadow = true`; glass does not cast.
