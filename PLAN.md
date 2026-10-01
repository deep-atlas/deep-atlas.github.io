# deepatlas: plan

An explorable atlas of the real ocean, drawn entirely in ASCII characters.
From the sunlit surface to the floor of the Challenger Deep (10,935 m), from a blue whale down to a single diatom.

Inspired by gcdatlas (github.com/eshin087/gcdatlas). That repo has no licence, so none of its code is copied:
the interface layout and look are matched, and every line here is written fresh.

## How it renders (zero dependencies, WebGL 2)

1. **Scene pass**: the 3D ocean is drawn into an HDR offscreen texture (half the screen resolution):
   - procedural creature meshes (lofted bodies, fins, tentacles) that swim in the vertex shader
   - instanced schools (sardines, lanternfish, krill) whose paths are worked out on the GPU
   - an endless seafloor following the camera: reef shelf, continental slope, abyssal plain, the Mariana Trench
   - marine snow, bubbles, god rays, caustics
2. **Cell pass**: the scene is averaged over each character cell; brightness picks a glyph from a ramp
   sorted by measured ink; strong edges pick a directional glyph (`- / | \`).
3. **Final pass**: glyphs from a font atlas, coloured per cell, over a soft glow.

## The physics behind the colour

- Sunlight is absorbed by water per colour channel (clear ocean: red gone by ~10 m, green by ~80 m, blue lasts to ~200 m+).
- The view adapts like an eye: the twilight zone (200 m to 1,000 m) still shows a faint blue; below 1,000 m there is no sunlight.
- Below ~150 m the view is lit like an ROV's floodlights: light falls off with distance and is absorbed on the way.
- Bioluminescence (blue-green, ~480 nm) is emissive: lures, photophores, glowing jellies.
- Distance fades everything into the water colour of that depth.

## World layout

Depths are real. The horizontal layout is a compressed continental margin: shore, reef and kelp on the shelf, the shelf edge (200 m),
the continental slope, the abyssal plain (~4,000 to 6,000 m) and the trench down to the Challenger Deep. Open-water animals sit at their
true depths above deep water.

## Interface (matches gcdatlas)

Brand top left; info panel (stop, name, actions, type, depth, fact, readout, ruler, angle bar); top-right controls
(search, atlas, tours < >, time, sub, ride, sound, settings, ?, pause, resume tour, travel slow/quick/warp);
right-side **depth ladder** (drag to dive; zones and places as ticks); today's discovery card; labels on creatures;
atlas panel (sort, filter, seen); tours; time of day (diel vertical migration); settings; help; photo mode (save, copy as text);
share links; compare size; a made-up submersible you can ride along with; a generative underwater soundtrack.

## Build

`node build.mjs` concatenates `src/` into `dist/index.html`. `node serve.mjs` serves it on http://localhost:5173.
