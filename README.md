# deepatlas

An explorable atlas of the real ocean, drawn entirely in ASCII characters.

**Live at https://deep-atlas.github.io/**

[![An anglerfish drawn in ASCII characters, its lure glowing in the dark](src/preview.png)](https://deep-atlas.github.io/)

Swim from the sunlit surface to the floor of the Challenger Deep, 10,935 m down, and zoom from a 25 m blue whale to a
single 0.6 µm cell. Creatures swim, jellies pulse, kelp sways, marine snow drifts, and the light changes with depth and the time of day.

More light means a denser character. Colour comes from the physics: water absorbs sunlight colour by colour (red is gone
by about 10 m, blue reaches 1,000 m), the view adapts as an eye would, and below the twilight zone the only light is a
submersible's lamps and the animals' own bioluminescence. Depths and sizes are real; the look of each creature is an artist's model.

Zero dependencies. One HTML file, WebGL 2.

## Run it

```bash
node serve.mjs
```

Then open http://localhost:5173. The server rebuilds the page on every reload, so edits in `src/` show up immediately.
To build once without serving: `node build.mjs`, which writes `dist/index.html`. That file is self-contained apart from the
Google Fonts link, and works opened straight from disk too.

## Put it online

`dist/index.html` is the whole site in one file (fonts come from Google Fonts), so any static host works.
With GitHub Pages: push this repository to GitHub, then in **Settings > Pages** set the source to **GitHub Actions**.
The workflow in `.github/workflows/pages.yml` builds and publishes the page on every push to `main`.
This copy is published from https://github.com/deep-atlas/deep-atlas.github.io.

## What's in it

- **189 places** across five zones, plus Nautile. By zone:
  - **Surface and open water**: Snell's window seen from below, flying fish gliding over the waves, a Portuguese man o' war with a blue dragon sea slug feeding on it, a fleet of by-the-wind sailors,
    a sargassum raft with a sargassum fish hidden in it, moon jellies, a comb jelly, a sardine bait ball with dolphins,
    sailfish and a Bryde's whale lunging through it, spinner dolphins leaping and spinning, mobula rays leaping and belly-flopping, vaquitas (the rarest marine mammal), whale shark (with remoras), a basking shark, great white,
    hammerheads, a thresher shark tail-slapping sardines, bluefin tuna, a swordfish (deep by day, near the surface at night), sunfish, orcas, a leatherback turtle, humpbacks (breaching, and bubble-net feeding on a herring school), a
    family of sperm whales asleep upright, an elephant seal asleep in a falling-leaf spiral on a deep dive, and the blue whale. Plankton: copepod, chains of salps, a pram bug in its salp barrel, diatoms, radiolarian, sea sparkle, Prochlorococcus, and a krill swarm with Adélie
    penguins hunting through it and a leopard seal stalking them.
  - **Reef, kelp and shallows**: a coral reef at 5 m with clownfish, seahorse, tangs, lionfish, parrotfish, moray, a
    camouflaged octopus, cuttlefish, mantis shrimp, nudibranchs, Christmas tree worms, a crown-of-thorns starfish bleaching a table coral, two pygmy seahorses hiding on a sea fan, a feather star, a giant clam, a frogfish, a sea krait, a pufferfish, a blue-ringed octopus,
    blacktip and grey reef sharks (with a threat display), a pack of giant trevallies, a tasselled wobbegong, a yellow boxfish, a decorator crab, a resting nurse shark, snappers, a grouper at a cleaning station, flashlight fish, a bobtail squid and a swimming Spanish dancer at night, and on the sand garden eels, a
    goby sharing a burrow with a pistol shrimp, a coconut octopus, a flamboyant cuttlefish walking the sand, a mimic octopus, a peacock flounder, a buried stargazer, spiny lobsters marching in single file, an electric ray and a stingray. A tornado of chevron barracuda off the
    drop-off, a manta, a school of cownose rays, a green turtle and a stream of
    turtle hatchlings heading out to sea; the kelp forest with a sea otter, sea lions, a giant Pacific octopus, garibaldi and blacksmith; a shipwreck at
    30 m turned into a reef; a red-lipped batfish walking on the sand; a Galapagos marine iguana grazing algae off a lava boulder; a chambered nautilus on the deep reef slope.
  - **Coasts and poles**: mangroves with an archerfish shooting beetles off the leaves, a box jellyfish, a sawfish raking the sand and a manatee in the channel, a seagrass meadow with a dugong and a leafy
    seadragon, horseshoe crabs gathering in the shallows, and the underside of Arctic sea ice with ice algae, brinicles, narwhals, a bowhead whale, belugas, a walrus, a swimming polar bear, a lion's mane
    jellyfish, sea angels and the sea butterflies they hunt.
  - **Twilight and midnight zones**: lanternfish, hatchetfish, a 40 m siphonophore, barreleye, giant, colossal, bigfin, glass,
    cock-eyed and Humboldt squid (flashing red and white), a see-through glass octopus, firefly squid at night, Atolla, the helmet jellyfish, a giant phantom jelly, a pyrosome, a warm-blooded opah, vampire squid, sperm whale,
    anglerfish, viperfish, a black swallower with a fish twice its size inside it, black dragonfish, stoplight loosejaw, gulper eel, fangtooth, oarfish (upright, as they hang),
    coelacanth, goblin, frilled, cookiecutter, dwarf lantern and Greenland sharks, a ghost shark, an Antarctic icefish with clear blood, blobfish, a beaked whale, Japanese spider crab and a
    glass sponge reef; a seamount's deep coral garden with orange roughy and a basket star spreading its branching arms.
  - **The deep floor**: black-smoker vents with giant tube worms, Pompeii worms in tubes on a chimney wall, yeti crabs and iron-armoured scaly-foot snails; the
    Lost City's white limestone towers; a cold seep
    whose brine pool is a lake on the seafloor, with a Venus' flower basket; a whale fall with hagfish and a sixgill shark; the Titanic's
    bow; giant isopod; a giant sea spider; a meadow of sea pens that glow when disturbed; squat lobsters at the seep; the Octopus Garden, thousands of brooding octopuses on a warm seep; dumbo octopus; a sea toad; the abyssal plain with the ghost octopus "Casper", sea pigs, xenophyophores, tripod fish, grenadiers and the
    swimming sea cucumber; the Mariana Trench with a supergiant amphipod, snailfish, hadal amphipods and the Challenger Deep.
- **A living ocean**: schools part round sailfish and dolphins slashing through the bait ball, and give a diver room; glowing
  animals light what is near them (the anglerfish's lure, the loosejaw's red searchlight, Nautile's floodlights); defences you
  can set off with "disturb it" or a click (Atolla's spinning alarm, the vampire squid's inside-out cloak, the swimming sea
  cucumber's flash, the helmet jelly's rings of light, the pyrosome's running wave of light, the pufferfish swelling into
  a spiny ball, the octopus flushing red and squirting ink, the blue-ringed octopus flashing its rings, hagfish
  flooding the water with slime, the electric ray's discharge, the mimic octopus's impersonations); shy animals hide
  when you swim close (garden eels, Christmas tree worms, the giant clam); the cuttlefish hunts with its passing-cloud display; click open
  water and the plankton flash blue, swim through the dark and leave a glowing wake.
- **Events**: the humpback breaches every couple of minutes; a Bryde's whale lunges through the bait ball; humpbacks bubble-net feed on a herring school; at night the
  reef spawns, flashlight fish come out, firefly squid swarm near the surface and the parrotfish sleeps in a
  mucus cocoon; a sperm whale hunts near the giant squid;
  at dusk you can watch the lanternfish rise (time of day > watch the night migration).
- **Night**: stars, the moon and its glade above the water; a night dive tour.
- **From a whale to a microbe**: one long zoom through size, every animal at its true size beside the last, from a 25 m blue
  whale to a single Prochlorococcus cell 0.6 µm across.
- **Nautile**, Ifremer's real yellow deep submersible (8 m long, rated to 6,000 m, dived on the Titanic in 1987), modelled to its
  true size; it roams the atlas down to its rated depth, keeping clear of everything, and you can ride along with it (B).
- **Above the waves**: swim up (R) through Snell's window and out of the water to see the sky, the clouds and the sea from above,
  with the reef glowing through it. The grand dive starts up there.
- **Map** (O): a cross-section of this ocean from the shore to the Challenger Deep, drawn in characters, with every place,
  Nautile and you marked. Click a dot to swim there; where places crowd together (the reef) it lists them to choose from.
  Its second tab is a world map, also in characters, showing where each animal and place really lives (a typical spot,
  or where it was famously filmed), with you marked. Coastlines from Natural Earth (public domain).
- **Where you are**: swimming freely, the info panel names the place you have reached (the coral reef, the kelp forest...) with a
  button to lock on to it.
- **Tours**: the grand dive (surface to the Challenger Deep), giants, living light, tiny life, the reef, hidden worlds, around the
  world, weird and wonderful, life without the sun, a night dive, the size journey, and an endless random swim. Screensaver mode (Z).
- **Time of day**: sunlight, dusk and night, and the nightly vertical migration (lanternfish rise from 450 m to 60 m).
- **Interface** modelled on gcdatlas: info panel (name, type, depth, fact, live readout of pressure, temperature and
  sunlight, ruler, angle bar), search, atlas (sort, filter, seen), tours, settings, help, a depth ladder you can drag
  to dive, labels, today's discovery, photo mode (save a PNG or copy the view as ASCII text), share links, compare size,
  and a generative underwater soundscape that follows what is near you (a reef's snapping shrimp, a black smoker's roar,
  a sperm whale's clicks, humpback and blue whale song, dolphin whistles, beluga chirps, a walrus's bell song, orca calls, barking sea lions).

## Controls

| | |
|---|---|
| drag | swim round what you're locked on |
| scroll, pinch, + - | zoom |
| right-drag, W A S D R F | let go and swim freely (shift: faster); keep rising with R to come out above the waves |
| click | swim there and lock on; click it again to disturb it; click open water and the plankton flash |
| depth ladder | drag to dive, or click a name |
| / | search (names, kinds, where in the world like `Japan`, or a depth like `4000 m`) |
| space | pause / play |
| [ ] | previous / next tour stop |
| ← → | previous / next place by depth |
| H | home (the reef) |
| B, P, Z, I | ride along with Nautile, photo, screensaver, info panel |
| N, X, O | day or night, disturb what you're locked on, map |
| Q | quiz: which lives deeper, or which is bigger? (1 / 2 to pick) |
| V, Y, G, L, M | detail, travel speed, glow, labels, sound |

## How it renders

1. **Scene pass** into a half-float target at 4 x 6 samples per character cell: a water background (scattered light,
   Snell's window, light shafts, lamp haze), an endless seafloor around the camera, procedural creature meshes,
   instanced schools whose paths are computed on the GPU, marine snow, and vent smoke. Everything is drawn relative to
   the camera in double precision on the CPU, and depth is written linearly to a float buffer, so a 1 µm cell and a
   100 km trench share one scene.
2. **Cell pass**: each cell's light is averaged and tone-mapped. Brightness picks a glyph from a ramp ordered by
   measured ink (` .':;*oaO0@`). A strong edge across a cell picks `- / | \` instead. Faint light is dithered so dim
   water shimmers.
3. **Glow and final pass**: glyphs from a font atlas, coloured per cell, over a soft blur of the scene's light.

## The ocean model

- `KD` (sunlight attenuation per metre, red/green/blue) and `BEAM` (line of sight) in `src/js/02-ocean.js` follow clear
  open-ocean water. Display brightness adapts with depth down to the end of sunlight near 1,000 m.
- The eye's colour adaptation is modelled as a white balance with a cap, so reef colours read in the shallows and red is
  still gone below about 20 m. In lamp-lit scenes the balance follows the lamps, as an ROV camera's would.
- For wide views (a whale from 30 m) the haze is thinned so the largest animals stay readable. Small scenes keep the
  water's true clarity.
- The seafloor is one function, `floorDepth(x, z)`, implemented identically in JavaScript and GLSL with integer hashing,
  so animals and wrecks sit exactly on the GPU-drawn floor. Flat pads under the Titanic, the vents, the whale fall and
  the deep sites keep them level.

**What is not real:** the horizontal layout is a compressed continental margin (shore, reef and kelp, shelf edge, slope,
abyssal plain, trench), arranged so every zone is a swim from the next; a tropical reef and a temperate kelp forest
would not share a coast. Swimming speeds and pulses are adjusted to be seen. Nautile is real, but its route here is invented, and its
yellow hull is given a faint glow (its own work lights) so it reads as yellow at any depth.

## Code

`src/head.html` (styles), `src/body.html` (markup), and `src/js/` in load order:

| file | |
|---|---|
| `00-core.js` | the bundle's scope, maths, settings, WebGL helpers, shared GLSL noise |
| `01-ascii.js` | glyph atlas, cell pass, glow, final pass, text export |
| `02-ocean.js` | water optics, zones, the seafloor profile and noise (JS + GLSL), lighting GLSL |
| `03-mesh.js` | mesh builders: loft, fin, tube, ellipsoid, ribbon |
| `04-render.js` | camera uniforms, creature and school shaders, terrain, background, marine snow |
| `05-models.js` | fish, sharks, rays, turtles, whales, deep-sea fish |
| `06-models2.js` | jellies, squid, octopus, plankton, microbes, floor life, Nautile, a diver |
| `06b-models3.js` | blobfish, oarfish, coelacanth, goblin, frilled and Greenland sharks, fangtooth, lionfish, parrotfish, moray, flying fish |
| `06d-models5.js` | cuttlefish, mantis shrimp, nudibranchs, pufferfish, sea otter, garibaldi, orca |
| `06c-models4.js` | the vampire squid and ten more deep-sea animals (squids, dragonfish, loosejaw, chimaera, isopod, crabs, sea cucumber) |
| `07-scenes.js` | the reef, kelp forest, vents, whale fall, Titanic, abyssal and hadal floors, schools |
| `07b-scenes2.js` | the seamount garden, cold seep, Arctic sea ice, mangroves, seagrass; narwhal, dugong, orange roughy |
| `08-world.js` | the object system, motions, drawing, and the catalogue of places |
| `08b-life.js` | living lights, reactions, schools parting round predators, plankton flashes |
| `09-camera.js` | orbit, angle loop, flights, free swimming, picking |
| `10-ui.js` | the interface, tours, atlas, search, ladder, labels, photo, compare, ride, screensaver |
| `10c-map.js` | the map: cross-section and world tabs |
| `10d-world.js` | the world map grid and each place's real location |
| `10e-quiz.js` | the which-lives-deeper quiz |
| `10b-journey.js` | the size journey, from a whale to a microbe |
| `11-sound.js` | the generative soundscape |
| `99-main.js` | the frame loop and test hooks (`window.__deep`; `__deep.save(name)` posts a PNG of the canvas to the dev server, which writes it to `.shots/`) |

## Credits

Inspired by [gcdatlas](https://github.com/eshin087/gcdatlas), whose interface this follows. That repository has no
licence, so no code was taken from it; everything here is written from scratch.
