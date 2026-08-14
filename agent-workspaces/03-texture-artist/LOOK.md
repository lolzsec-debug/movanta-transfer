# LOOK — XC60 material dressing

Target: `highwayScene.ts` — ACES filmic @ exposure 1.15, RoomEnvironment PMREM @
`environmentIntensity 0.35`, fog 0x1b2438 from 70 m, chase camera at REAR / RIGHT-REAR.

## Per-slot materials

| slot | type | key params |
|---|---|---|
| paint | MeshPhysical | color `#35536f` (Denim Blue), metalness 0.85, roughness 0.34, clearcoat 1.0 / ccRoughness 0.06, envMapIntensity **2.6** |
| glass | MeshPhysical | color `#0a0e13` opaque, roughness 0.05, clearcoat 1.0, envMapIntensity 2.2, specularIntensity 1.2, DoubleSide, polygonOffset −1/−1 |
| trim | MeshStandard | `#141619`, roughness 0.7, metalness 0, envMapIntensity 0.9 (satin plastic) |
| chrome | MeshStandard | `#e8ecef`, metalness 1.0, roughness 0.12, envMapIntensity 2.2 |
| tire | MeshStandard | `#0b0b0c`, roughness 1.0, procedural 64² speckle CanvasTexture as bumpMap (scale 0.6) |
| rim | MeshStandard | `#b9bec6`, metalness 0.95, roughness 0.3, envMapIntensity 1.6 |
| underbody | MeshStandard | `#07080a`, roughness 1.0, envMapIntensity 0.2 |
| plate | MeshStandard | `#dfe3e4`, roughness 0.5, constant emissive `#9aa4ae` @ 0.06 (retroreflective feel) |
| lightFront | MeshPhysical | dark lens `#0c1016`, emissive `#dfe9ff`, intensity = **2.6 × k** (linear) |
| lightRear | MeshPhysical | dark red `#2a0806`, emissive `#ff2a1e`, intensity = **1.0 + 3.2 × k** once k > 0 (running lights; always brighter than DRL) |

## Light sources (parented in `build.group`)

- 2 × SpotLight `0xfff1d8` at the headlight anchors: angle 0.45, penumbra 0.4,
  distance 90, decay **1.6** (below physical 2 so the pool carries further in fog),
  target at road level 35 m ahead, castShadow false. Intensity = 1400 cd × smoothstep(k).
- 1 × PointLight `0xff2a1e` on the `tailGlow` empty: distance 3.5, decay 2,
  intensity = 2.5 × k — red bounce on tailgate/bumper.
- `setLightsOn(0)` is applied on dress, so the car starts dark.

## Why these numbers under ACES @ 0.35 env

The PMREM is dim (0.35), so anything reflective must over-sample it: paint at
envMapIntensity 2.6 puts the room-env highlight on the shoulder line at roughly
the level a 1.0 material would see in a normally lit scene, and ACES rolls off
the top so nothing clips. Base paint color sits a step above the #2e4a66
reference because metalness 0.85 kills diffuse — at the reference hex the body
crushed to black between lamps. Clearcoat (cc 1.0 / 0.06) supplies the tight
wet-gloss streak from the warm sun rim without brightening the whole body.
Rear emissive tops out at 4.2 vs DRL 2.6: the camera lives behind the car, the
taillights are the hero, and 4.2 under ACES @ 1.15 glows hot without blowing
to white. Opaque glass (no transmission) is free and indistinguishable from
tinted glass at blue hour.

## Tuning knobs (top of xc60Materials.ts)

- `PAINT_ENV_INTENSITY` (2.6) — overall paint liveliness / shoulder-line glow.
- `DRL_EMISSIVE_MAX` (2.6) — Thor's-hammer brightness at k = 1.
- `REAR_EMISSIVE_BASE` / `REAR_EMISSIVE_SPAN` (1.0 / 3.2) — taillight floor & ramp.
- `SPOT_INTENSITY_MAX` (1400 cd), `SPOT_DECAY` (1.6), `SPOT_TARGET_AHEAD` (35 m) —
  size/reach of the beam pool on the asphalt.
- `TAIL_GLOW_INTENSITY_MAX` (2.5) — red bodywork bounce.
