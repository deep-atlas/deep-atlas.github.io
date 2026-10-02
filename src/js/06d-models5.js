// ---- more of the shallows: reef animals, the kelp forest's otter and garibaldi, and orcas

function mkCuttlefish() {
  // a broad flat mantle fringed all round by a rippling fin, a W-shaped pupil, eight short arms and two hidden tentacles;
  // its skin runs with travelling bands of colour (the "passing cloud" display)
  const mb = new MB(), base = [0.75, 0.55, 0.38], dark = [0.32, 0.2, 0.14], pale = [0.95, 0.88, 0.75];
  loft(mb, { n:24, m:20, sec:t => { const f = Math.pow(Math.sin(Math.min(1, t * 1.15 + 0.08) * PI), 0.45); return { x:0.4 - t * 0.62, y:0, w:0.14 * f, h:0.075 * f, e:2.2 }; },
    col:(t, u, p, sy) => sy < -0.3 ? pale : (Math.sin(p[0] * 70 + Math.sin(p[2] * 40) * 2) > 0.45 ? dark : base), anim:() => [0, 0, 0, 0] });
  // the fin skirt round the whole mantle, which ripples to swim
  for (const sz of [1, -1]) {
    const pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12, x = 0.38 - t * 0.6, f = Math.pow(Math.sin(Math.min(1, t * 1.15 + 0.08) * PI), 0.45); pts.push([x, sz * (0.14 * f + 0.045)]); }
    for (let k = 12; k >= 0; k--) { const t = k / 12, x = 0.38 - t * 0.6, f = Math.pow(Math.sin(Math.min(1, t * 1.15 + 0.08) * PI), 0.45); pts.push([x, sz * 0.13 * f]); }
    fin(mb, pts, { origin:[0, -0.01, 0], ua:[1, 0, 0], va:[0, 0, 1], rings:1, col:fc(mixc(base, pale, 0.4)), anim:(a, b) => [0, 0, Math.abs(b) * 0.15, 0], open:true });
  }
  // head, eyes with their W pupils, arms
  ellip(mb, [-0.24, 0, 0], [0.06, 0.06, 0.08], { n:6, m:10, col:(u, v, p) => Math.abs(p[2]) > 0.055 && p[1] > 0.0 ? [0.95, 0.85, 0.4] : base });
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * TAU, L = 0.1 + 0.03 * Math.cos(a);
    tube(mb, { n:6, m:4, path:t => [-0.3 - t * L, Math.cos(a) * (0.02 + t * 0.015), Math.sin(a) * (0.03 + t * 0.02)], r:t => 0.012 * (1 - t * 0.8), col:fc(base), anim:t => [0, 0, t * 0.2, 0] });
  }
  // (built mantle-forward; a cuttlefish hovers and swims arms first, so turn it round)
  mb.xform({ v:0, i:0 }, rotY(PI));
  return mb;
}
function mkMantisShrimp() {
  // the peacock mantis shrimp: a banded green body, orange clubs folded under like a praying mantis, stalked eyes that see colour
  // in a dozen channels and polarised light, and a red tail fan
  const mb = new MB(), green = [0.25, 0.75, 0.35], blue = [0.2, 0.45, 0.95], orange = [1.0, 0.45, 0.12], red = [0.95, 0.2, 0.25];
  loft(mb, { n:28, m:12, sec:t => { const w = 0.07 * Math.sin(Math.min(1, t * 2.2 + 0.25) * PI / 2); return { x:0.36 - t * 0.78, y:0.02 * Math.sin(t * PI), w, h:w * 0.75, e:2.6 }; },
    col:(t, u, p, sy) => t > 0.2 && Math.abs(Math.sin(t * 34)) < 0.18 ? blue : (sy < -0.4 ? [0.55, 0.8, 0.5] : green), anim:() => [0, 0, 0, 0] });
  // the tail fan, edged in red and blue
  fin(mb, [[0, 0.05], [-0.1, 0.11], [-0.14, 0.0], [-0.1, -0.11], [0, -0.05]], { origin:[-0.4, 0.0, 0], ua:[1, 0, 0], va:[0, 0, 1], col:(a, b, r) => r > 0.7 ? red : blue });
  for (const sz of [1, -1]) {
    // eyes on stalks
    tube(mb, { n:3, m:4, path:t => [0.37 + t * 0.03, 0.02 + t * 0.07, sz * (0.015 + t * 0.02)], r:0.007, col:fc(green) });
    ellip(mb, [0.405, 0.1, sz * 0.04], [0.018, 0.012, 0.016], { n:4, m:8, col:(u, v, p) => Math.abs(p[1] - 0.1) < 0.004 ? [0.1, 0.1, 0.1] : [0.6, 0.85, 0.35] });
    // the clubs (raptorial appendages), folded: they strike at about 23 m/s
    tube(mb, { n:8, m:5, path:t => [0.33 + Math.sin(t * PI) * 0.1, -0.03 - t * 0.04, sz * 0.045], r:t => 0.012 + 0.008 * Math.sin(t * PI), col:t => t > 0.7 ? orange : green });
    // antennae and the paddle-like antennal scales
    tube(mb, { n:10, m:3, path:t => [0.38 + t * 0.3, 0.03 + t * 0.06, sz * (0.03 + t * 0.12)], r:0.003, col:fc(orange), anim:t => [0, 0, t * 0.15, 0] });
    fin(mb, [[0, 0], [0.06, 0.01], [0.07, -0.02], [0.0, -0.015]], { origin:[0.38, 0.02, sz * 0.05], ua:[1, 0, 0], va:[0, 0, sz], col:fc([1.0, 0.6, 0.65]) });
    for (let k = 0; k < 3; k++) tube(mb, { n:3, m:3, path:t => [0.05 - k * 0.07, -0.03 - t * 0.04, sz * (0.05 + t * 0.03)], r:0.006, col:fc(red) });
  }
  return mb;
}
function mkNudibranchs() {
  // a few sea slugs, each a few centimetres long, drawn in metres round a point: bright warning colours, the frilly gills on the back
  const mb = new MB(), r = rng(808);
  const kinds = [
    { body:[0.1, 0.15, 0.85], rim:[1.0, 0.85, 0.1], spot:[0.05, 0.05, 0.1], gill:[1.0, 0.55, 0.1] },     // Chromodoris-like blue with a yellow rim
    { body:[0.98, 0.95, 0.9], rim:[1.0, 0.5, 0.1], spot:[0.6, 0.2, 0.9], gill:[1.0, 0.45, 0.1] },
    { body:[0.95, 0.3, 0.55], rim:[1.0, 0.95, 0.9], spot:[0.7, 0.1, 0.35], gill:[1.0, 0.9, 0.9] },
  ];
  for (let n = 0; n < 6; n++) {
    const k = kinds[n % 3], L = 0.035 + r() * 0.03, c = [(r() - 0.5) * 0.5, 0, (r() - 0.5) * 0.5], yaw = r() * TAU;
    const mk = mb.mark();
    loft(mb, { n:12, m:12, sec:t => { const w = 0.24 * Math.pow(Math.sin(Math.min(1, t * 1.2 + 0.05) * PI), 0.6); return { x:0.5 - t, y:0.1, w, h:w * 0.45, e:2 }; },
      col:(t, u, p, sy, sz) => Math.abs(sz) > 0.85 ? k.rim : (Math.sin(p[0] * 40) * Math.sin(p[2] * 45) > 0.75 ? k.spot : k.body) });
    for (const sz of [1, -1]) tube(mb, { n:3, m:3, path:t => [0.42 + t * 0.06, 0.18 + t * 0.12, sz * 0.05], r:0.025, col:fc(k.gill) });   // rhinophores
    for (let g = 0; g < 7; g++) { const a = g / 7 * TAU; tube(mb, { n:3, m:3, path:t => [-0.32 + Math.cos(a) * t * 0.1, 0.2 + t * 0.14, Math.sin(a) * t * 0.1], r:0.02 * 1, col:fc(k.gill), anim:t => [0, 0, t * 0.1, 0] }); }
    mb.xform(mk, chain(scl(L), rotY(yaw), move(c)));
  }
  return mb;
}
function mkPuffer() {
  // a pufferfish puffed up: a ball of water swallowed into its elastic stomach, spines standing out, a beak and big eyes
  const mb = new MB(), skin = [0.85, 0.78, 0.55], spot = [0.25, 0.2, 0.12], belly = [0.97, 0.95, 0.9];
  ellip(mb, [0, 0, 0], [0.42, 0.38, 0.38], { n:14, m:20, col:(u, v, p) => p[1] < -0.12 ? belly : (Math.sin(p[0] * 34) * Math.sin(p[2] * 31 + p[1] * 20) > 0.55 ? spot : skin), anim:() => [0, 0, 0, 0] });
  const r = rng(99);
  for (let k = 0; k < 90; k++) { const d = vnorm([r() - 0.5, r() - 0.5, r() - 0.5]); const b = [d[0] * 0.42, d[1] * 0.38, d[2] * 0.38]; tube(mb, { n:1, m:3, path:t => vmad(b, d, t * 0.07), r:t => 0.01 * (1 - t), col:fc(belly) }); }
  for (const sz of [1, -1]) ellip(mb, [0.25, 0.14, sz * 0.27], [0.07, 0.07, 0.04], { n:5, m:8, col:(u, v, p) => Math.hypot(p[0] - 0.27, p[1] - 0.14) < 0.035 ? [0.05, 0.08, 0.05] : [0.3, 0.65, 0.45] });
  ellip(mb, [0.42, -0.04, 0], [0.05, 0.05, 0.07], { n:4, m:8, col:fc([0.95, 0.9, 0.85]) });
  fin(mb, [[0, 0.1], [-0.18, 0.15], [-0.2, -0.15], [0, -0.1]], { origin:[-0.4, 0.02, 0], ua:[1, 0, 0], va:[0, 1, 0], col:fc(skin), anim:() => [0.8, 0, 0, 0] });
  for (const sz of [1, -1]) fin(mb, [[0, 0.05], [0.1, 0.08], [0.12, -0.04], [0, -0.05]], { origin:[0.05, 0, sz * 0.36], ua:[0, 0, sz], va:[1, 0, 0], col:fc(skin), anim:() => [0, 0, 0.3, 0] });
  return mb;
}
function mkSeaOtter() {
  // floating on its back at the surface, paws on its chest, feet and tail up: drawn lying along x, belly up (+y), head at +x
  const mb = new MB(), fur = [0.38, 0.27, 0.18], face = [0.82, 0.76, 0.68];
  loft(mb, { n:20, m:14, sec:t => { const f = Math.pow(Math.sin(Math.min(1, t * 1.1 + 0.08) * PI), 0.5); return { x:0.32 - t * 0.62, y:0, w:0.11 * f, h:0.09 * f, e:2 }; },
    col:(t, u, p, sy) => t < 0.12 && sy > -0.3 ? face : fur, anim:() => [0, 0, 0, 0] });
  ellip(mb, [0.38, 0.03, 0], [0.08, 0.07, 0.075], { n:8, m:12, col:(u, v, p) => (p[0] > 0.43 && Math.abs(p[2]) < 0.02 && p[1] > 0.04) ? [0.05, 0.04, 0.04] : (p[1] > 0.0 ? face : fur) });
  for (const sz of [1, -1]) {
    tube(mb, { n:4, m:4, path:t => [0.18 - t * 0.04, 0.06 + t * 0.06, sz * (0.08 - t * 0.06)], r:0.022, col:fc(fur) });        // forepaws on the chest
    tube(mb, { n:5, m:4, path:t => [-0.26 - t * 0.08, 0.04 + t * 0.12, sz * 0.05], r:t => 0.025 + t * 0.012, col:fc(fur) });     // hind feet up
    ellip(mb, [0.38, 0.1, sz * 0.05], [0.015, 0.015, 0.012], { n:3, m:5, col:fc(fur) });
  }
  tube(mb, { n:5, m:5, path:t => [-0.3 - t * 0.12, 0.02 + t * 0.06, 0], r:t => 0.03 * (1 - t * 0.4), col:fc(fur) });              // the flat tail
  ellip(mb, [0.15, 0.13, 0], [0.035, 0.025, 0.03], { n:4, m:8, col:fc([0.45, 0.15, 0.4]) });                                         // a sea urchin to crack
  return mb;
}
function mkGaribaldi() {
  const orange = [1.0, 0.45, 0.06];
  return fish({ H:0.21, W:0.08, tm:0.33, nose:0.4, ped:0.28, bodyLen:0.8, back:orange, belly:[1.0, 0.55, 0.15], eye:[0.11, 0.3, 0.035], pattern:() => orange,
    tail:'round', tailH:0.15, tailCol:orange, dorsal:[{ at:0.2, len:0.55, h:0.08, col:orange }], anal:[{ at:0.58, len:0.22, h:0.07, col:orange }], pect:{ at:0.24, len:0.12, w:0.06, col:orange } });
}
function mkOrca() {
  // black above, white below with the white eye patch and the grey saddle behind the tall dorsal fin
  const black = [0.04, 0.04, 0.05], white = [0.95, 0.95, 0.93], grey = [0.55, 0.56, 0.6];
  return cetacean({ back:black, belly:white, H:0.1, W:0.095, nose:0.5, bodyLen:0.86, eye:[0.12, 0.05, 0.008], tailH:0.13, tailL:0.1, tm:0.35,
    skin:(t, sy, sz, p) => {
      if (t > 0.08 && t < 0.2 && sy > -0.05 && sy < 0.4 && Math.abs(sz) > 0.55) return white;      // the eye patch
      if (t > 0.42 && t < 0.58 && sy > 0.7) return grey;                                            // the saddle
      if (sy < -0.35 + 0.25 * smooth(0.5, 0.75, t) * (t < 0.8 ? 1 : 0) - (t > 0.55 && t < 0.75 ? 0.3 * Math.sin((t - 0.55) / 0.2 * PI) : 0)) return white;
      return black;
    },
    dorsal:[{ at:0.38, len:0.12, h:0.2, col:black, pts:[[0, 0], [-0.25, 1], [-0.55, 0.95], [-0.7, 0.4], [-1, 0]] }],
    pect:{ at:0.22, len:0.16, w:0.09, down:0.65, back:0.45, y:-0.55, col:black, pts:[[0, 0.06], [0, -0.06], [0.1, -0.09], [0.16, -0.05], [0.14, 0.02], [0.07, 0.06]] } });
}

function mkFlashlightFish() {
  // Anomalops: a small dark fish with a big light organ under each eye, full of glowing bacteria; it blinks them by rolling them down
  const black = [0.06, 0.06, 0.08];
  return fish({ H:0.15, W:0.07, tm:0.3, nose:0.4, ped:0.18, bodyLen:0.8, back:black, belly:[0.1, 0.1, 0.12], eye:[0.1, 0.35, 0.04], eyeCol:[0.05, 0.05, 0.06], eyeRing:[0.3, 0.3, 0.35],
    tail:'fork', tailH:0.12, dorsal:[{ at:0.3, len:0.15, h:0.08 }, { at:0.55, len:0.2, h:0.06 }], anal:[{ at:0.6, len:0.18, h:0.06 }], pect:{ at:0.24, len:0.1, w:0.05 },
    extra:(mb) => { for (const sz of [1, -1]) ellip(mb, [0.42, -0.02, sz * 0.05], [0.04, 0.025, 0.02], { n:4, m:8, col:fc([0.55, 1.0, 0.9, 5]), anim:p => swimA(p) }); } });
}
function mkBlacktip() {
  // a blacktip reef shark: sandy grey above, white below, every fin tip dipped in black
  const back = [0.55, 0.53, 0.48], belly = [0.95, 0.94, 0.9], tip = [0.04, 0.04, 0.05];
  const tipped = (a, b, h) => Math.abs(b) > h * 0.65 ? tip : back;
  return fish({ H:0.085, W:0.075, tm:0.36, nose:0.7, ped:0.12, bodyLen:0.77, back, belly, eye:[0.07, 0.2, 0.012],
    pattern:(t, sy) => mixc(belly, back, smooth(-0.2, 0.05, sy)),
    tail:'shark', tailH:0.12, tailL:0.22, tailPat:(a, b) => (b > 0.1 || b < -0.07) ? tip : back,
    dorsal:[{ at:0.34, len:0.13, h:0.12, sweep:0.7, pat:(a, b) => tipped(a, b, 0.12) }, { at:0.78, len:0.03, h:0.03 }], anal:[{ at:0.8, len:0.03, h:0.025 }],
    pect:{ at:0.3, len:0.17, w:0.07, down:0.55, back:0.5, y:-0.45, pat:(a) => a > 0.11 ? tip : back }, pelv:{ at:0.64, len:0.05, w:0.03, y:-0.7 },
    extra:(mb, b) => gills(mb, b, 0.21, 5) });
}
function mkSnapper() {
  const yellow = [1.0, 0.85, 0.15], silver = [0.92, 0.92, 0.88];
  return fish({ H:0.14, W:0.06, tm:0.33, nose:0.55, ped:0.16, bodyLen:0.8, back:yellow, belly:silver, eye:[0.09, 0.25, 0.03], n:14, m:9,
    pattern:(t, sy) => Math.abs(sy - 0.05) < 0.1 && t > 0.1 ? [1.0, 0.75, 0.05] : (Math.abs(sy - 0.45) < 0.06 && t > 0.15 ? [0.35, 0.55, 0.95] : (sy > 0.2 ? [0.85, 0.85, 0.6] : silver)),
    tail:'fork', tailH:0.12, tailCol:yellow, dorsal:[{ at:0.25, len:0.45, h:0.07, col:yellow }], anal:[{ at:0.6, len:0.15, h:0.06, col:yellow }], pect:{ at:0.24, len:0.1, w:0.04, col:yellow } });
}
function addShallows(REEF) {
  const KELP = BYKEY.kelp.anchor;
  addObj({ key:'cuttlefish', name:'cuttlefish', type:'broadclub cuttlefish · Sepia latimanus', kind:'cephs', floor:[REEF[0] + 2.2, REEF[1] + 2.6, 2.4], size:0.4, rad:0.3, yaw:2.4,
    fact:'Colourblind, yet it matches its background in under a second: millions of pigment sacs in its skin are opened and closed by muscle. To mesmerise prey it sends bands of colour rippling over its body, the "passing cloud" display.',
    motion:{ type:'hover', amp:0.1, turn:0.4 },
    parts:[part(mkCuttlefish, { scale:0.4, mat:M_SKIN, swim2:[0, 2, 0.02, 1.5], sway:[0.008, 2, 10, 0] })],
    views:[{ d:[0.3, -0.2, 1], k:2.4, hold:10, drift:0.02 }, { d:[0.9, -0.1, 0.4], k:2.2, hold:9, drift:0.02 }, { d:[0.2, 0.7, 0.6], k:2.6, hold:8, drift:0.02 }] });
  addObj({ key:'mantisshrimp', name:'peacock mantis shrimp', label:'mantis shrimp', type:'Odontodactylus scyllarus', kind:'floor', floor:[REEF[0] - 4.5, REEF[1] + 5, 0.03], size:0.15, rad:0.12, yaw:0.5,
    fact:'Its clubs strike at about 23 m/s, fast enough to boil the water in front of them into collapsing bubbles. Its eyes have a dozen kinds of colour receptor and see polarised light.',
    motion:{ type:'crawl', R:0.3, v:0.015, h:0.03 },
    parts:[part(mkMantisShrimp, { scale:0.15, mat:M_SKIN, sway:[0.004, 2, 30, 0] })],
    views:[{ d:[0.7, 0.45, 1], k:2.4, hold:10, drift:0.02 }, { d:[1, 0.15, 0.2], k:2.0, hold:9, drift:0.02 }] });
  addObj({ key:'nudibranch', name:'nudibranchs', type:'sea slugs · a few centimetres each', kind:'floor', floor:[REEF[0] + 1.5, REEF[1] - 2.2, 0.0], size:0.05, vsize:0.35, rad:0.35,
    fact:'Their bright colours are a warning: many store the stinging cells or toxins of the sponges, anemones and corals they eat, and use them for their own defence. The frilly tuft on the back is their gills.',
    parts:[part(mkNudibranchs, { scale:1, mat:M_SKIN, sway:[0.002, 1, 50, 0] })],
    views:[{ d:[0.4, 0.75, 0.5], k:1.6, hold:10, drift:0.03, frame:'world' }, { d:[1, 0.35, 0.3], k:1.2, hold:9, drift:0.03, frame:'world' }] });
  addObj({ key:'puffer', name:'pufferfish', type:'a puffed-up porcupinefish · Diodon', kind:'fish', floor:[REEF[0] + 7.5, REEF[1] - 1, 1.6], size:0.4, rad:0.3,
    fact:'Threatened, it gulps water into an elastic stomach and swells to several times its size, its spines standing on end. Many pufferfish also carry tetrodotoxin, one of the most potent poisons known.',
    motion:{ type:'hover', amp:0.08, turn:0.5 },
    parts:[part(mkPuffer, { scale:0.4, mat:M_SKIN })], views:SIDE });
  addObj({ key:'seaotter', name:'sea otter', type:'Enhydra lutris', kind:'air', at:[KELP[0] + 8, KELP[2] + 5, 0.08], size:1.3, rad:0.8, yaw:0.6,
    fact:'The densest fur of any animal, up to about a million hairs per square inch, keeps it warm without blubber. By eating sea urchins it protects the kelp forest: where otters vanished, urchins grazed the forests away.',
    motion:{ type:'hover', amp:0.15, turn:0.4 },
    parts:[part(mkSeaOtter, { scale:1.3, mat:[1, 0.5, 1, 0.4] })],
    views:[{ d:[0.6, 0.55, 1], k:2.4, hold:10, drift:0.02, air:true }, { d:[0.4, -0.55, 0.8], k:2.6, hold:9, drift:0.02 }] });
  addObj({ key:'garibaldi', name:'garibaldi', type:'Hypsypops rubicundus', kind:'fish', floor:[KELP[0] - 3, KELP[2] + 4, 1.2], size:0.3, rad:0.22,
    fact:'California’s state marine fish, bright orange and fiercely territorial. The male clears a nest of red algae and defends it, clicking loudly at intruders, even divers.',
    motion:{ type:'circle', R:1.2, v:0.25, bob:0.2, bank:0.1 },
    parts:[part(mkGaribaldi, { scale:0.3, mat:M_SKIN, ...FISH_SWIM(0.06, 2, 1, 1.8) })], views:SIDE });
  addObj({ key:'flashlight', name:'flashlight fish', type:'Anomalops katoptron · out only at night', kind:'fish', floor:[REEF[0] - 6, REEF[1] + 6, 2.5], size:0.3, vsize:5, rad:3,
    fact:'By day it hides in caves on the reef. At night schools come out, flashing the light organs under their eyes, glowing with bacteria, on and off to find food, signal to each other and confuse hunters.',
    parts:[part(mkFlashlightFish, { inst:schoolCloud(40, 2.5, 1, 303, 1, 0.4), school:[1, 0.3, 1.4, 0], mat:M_SKIN, ...FISH_SWIM(0.05, 2.5, 0.9, 1.8) })],
    views:[{ d:[0.3, 0.2, 1], k:1.1, hold:10, drift:0.03, frame:'world' }, { d:[1, 0.1, 0.3], k:0.6, hold:9, drift:0.03, frame:'world' }] });
  addObj({ key:'blacktip', name:'blacktip reef sharks', type:'Carcharhinus melanopterus', kind:'sharks', floor:[REEF[0], REEF[1], 2.0], size:1.5, vsize:3, rad:2, predator:true,
    fact:'The commonest shark on Indo-Pacific reefs, often seen patrolling the shallows with its black-tipped dorsal fin cutting the surface. Harmless to people, it hunts reef fish, often in loose groups.',
    motion:{ type:'circle', R:11, v:0.9, bob:0.6, bank:0.15 },
    parts:[part(mkBlacktip, { scale:1.5, mat:M_SKIN, ...FISH_SWIM(0.05, 0.9, 0.85, 2.4) }), part(mkBlacktip, { scale:1.3, off:[-4, 0.5, 2.5], mat:M_SKIN, swim:[0.05, 1.0, 0.85, 2], swim2:[0, 2.4, 0, 0] })],
    views:[{ d:[0.25, 0.05, 1], k:1.4, hold:10, drift:0.02 }, { d:[0.6, -0.4, 0.8], k:1.3, hold:9, drift:0.02 }, { d:[-0.8, 0.2, 0.6], k:1.6, hold:8, drift:0.02 }] });
  addObj({ key:'snappers', name:'bluestripe snappers', label:'snappers', type:'a school of Lutjanus kasmira', kind:'fish', floor:[REEF[0] + 10, REEF[1] + 8, 2.4], size:0.3, vsize:5, rad:4,
    fact:'By day they mill in tight schools beside coral heads, then scatter to hunt over the sand at night. Schooling confuses predators: it is hard to pick out one fish from a glittering, turning crowd.',
    parts:[part(mkSnapper, { inst:schoolMill(120, 3, 1.5, 515, 0.5), school:[0, 0.3, 1, 0], mat:M_SKIN, shy:8, ...FISH_SWIM(0.06, 2.6, 0.9, 1.8) })],
    views:[{ d:[0.3, 0.15, 1], k:1.0, hold:10, drift:0.03, frame:'world' }, { d:[1, -0.3, 0.2], k:0.8, hold:9, drift:0.03, frame:'world' }] });
  addObj({ key:'orca', name:'orcas', type:'killer whales · Orcinus orca', kind:'air', at:[7800, 900, 15], size:7, vsize:9, rad:10, predator:true,
    fact:'The largest dolphin, and a top predator in every ocean. Each pod has its own calls and hunting methods passed down through generations: some wash seals off ice floes with waves, others hunt great white sharks for their livers.',
    motion:{ type:'circle', R:40, v:3, bob:2, bank:0.12 },
    parts:[0, 1, 2].map(i => part(mkOrca, { scale:7 - i * 1.2, off:[[0, 0, 0], [-6, 1.2, 4], [-9, -0.6, -4.5]][i], mat:M_SKIN, swim:[0.04, 0.4 + i * 0.05, 0.7, i * 1.7], swim2:[1, 2.5, 0, 0] })),
    views:[{ d:[0.2, 0.1, 1], k:1.6, hold:11, drift:0.02 }, { d:[1, 0.3, 0.4], k:1.3, hold:9, drift:0.02 }, { d:[0.3, -0.6, 0.6], k:1.5, hold:9, drift:0.02 }] });
}
