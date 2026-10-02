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
function mkPufferSlim() {
  // the same porcupinefish at ease: a blunt, broad-headed fish, spines lying flat, big green eyes and a round tail
  const skin = [0.85, 0.78, 0.55], spot = [0.25, 0.2, 0.12], belly = [0.97, 0.95, 0.9];
  return fish({ H:0.17, W:0.13, tm:0.3, nose:0.3, ped:0.3, bodyLen:0.82, back:skin, belly, eye:[0.11, 0.3, 0.06], eyeCol:[0.3, 0.65, 0.45], n:16, m:12,
    pattern:(t, sy, sz, p) => sy < -0.3 ? belly : (Math.sin(p[0] * 34) * Math.sin(p[2] * 31 + p[1] * 20) > 0.55 ? spot : skin),
    tail:'round', tailH:0.12, tailCol:skin, dorsal:[{ at:0.62, len:0.12, h:0.07, col:skin }], anal:[{ at:0.64, len:0.1, h:0.06, col:skin }], pect:{ at:0.28, len:0.1, w:0.07, col:skin } });
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
function mkGardenEels() {
  // a colony of garden eels, drawn in metres: each stands half out of its burrow in the sand, facing the current to catch plankton
  const mb = new MB(), r = rng(919);
  for (let k = 0; k < 40; k++) {
    const a = r() * TAU, d = Math.sqrt(r()) * 2.2, x = Math.cos(a) * d, z = Math.sin(a) * d, H = 0.25 + r() * 0.2, lean = 0.4 + r() * 0.2;
    const path = t => [x + Math.sin(t * PI * 0.6) * H * lean * 0.6, t * H, z];
    tube(mb, { n:10, m:5, path, r:t => 0.008 * (1 - t * 0.25), col:t => (fract(t * 9 + k * 0.3) < 0.35 ? [0.98, 0.95, 0.9] : [0.95, 0.6, 0.2]), anim:t => [0, 0, t * 0.6, 0] });
    const top = path(1); ellip(mb, vadd(top, [0.01, 0, 0]), [0.012, 0.01, 0.009], { n:4, m:6, col:fc([0.1, 0.1, 0.1]), anim:() => [0, 0, 0.6, 0] });
    // the burrow's rim
    ellip(mb, [x, 0, z], [0.02, 0.006, 0.02], { n:3, m:6, col:fc([0.2, 0.18, 0.15]) });
  }
  return mb;
}
function mkStingray() {
  // a southern stingray, half buried in sand: a flat rhomboid disc, eyes and spiracles on top, a long whip tail with its barb
  const mb = new MB(), back = [0.11, 0.1, 0.09], belly = [0.95, 0.94, 0.9];
  loft(mb, { n:20, m:24, sec:t => { const f = Math.sin(clamp(t / 0.9, 0, 1) * PI); return { x:0.3 - t * 0.55, y:0, w:0.4 * Math.pow(f, 0.9) + 0.01, h:0.035 * Math.pow(f, 0.6) + 0.003, e:1.4 }; },
    col:(t, u, p, sy) => sy < 0 ? belly : (Math.sin(p[0] * 50 + p[2] * 30) > 0.85 ? [0.28, 0.24, 0.2] : back), anim:(t, u, p) => [0, Math.pow(Math.abs(p[2]) * 2.5, 2) * 0.1, 0, 0] });
  for (const sz of [1, -1]) { ellip(mb, [0.12, 0.035, sz * 0.045], [0.018, 0.012, 0.012], { n:3, m:6, col:fc([0.08, 0.08, 0.08]) }); ellip(mb, [0.07, 0.03, sz * 0.05], [0.015, 0.006, 0.01], { n:3, m:6, col:fc([0.2, 0.17, 0.14]) }); }
  tube(mb, { n:12, m:4, path:t => [-0.25 - t * 0.6, 0, Math.sin(t * 3) * 0.04], r:t => 0.012 * (1 - t * 0.8), col:fc(back), anim:t => [0, 0, t * 0.15, 0] });
  tube(mb, { n:2, m:3, path:t => [-0.4 - t * 0.06, 0.012, 0], r:t => 0.004 * (1 - t), col:fc([0.85, 0.82, 0.75]) });
  return mb;
}
function mkBlacksmith() {
  const navy = [0.15, 0.2, 0.32], spot = [0.05, 0.06, 0.1];
  return fish({ H:0.16, W:0.06, tm:0.33, nose:0.5, ped:0.2, bodyLen:0.8, back:navy, belly:[0.3, 0.35, 0.45], eye:[0.1, 0.28, 0.035], n:14, m:9,
    pattern:(t, sy) => t > 0.6 && sy > 0 && Math.sin(t * 60) * Math.sin(sy * 30) > 0.6 ? spot : null,
    tail:'fork', tailH:0.13, tailCol:navy, dorsal:[{ at:0.25, len:0.45, h:0.07 }], anal:[{ at:0.6, len:0.15, h:0.06 }], pect:{ at:0.24, len:0.1, w:0.04 } });
}
function mkBarracuda() {
  // chevron barracuda: long and silver, a jutting lower jaw, two dorsal fins far apart, dark chevrons down the flanks
  const silver = [0.85, 0.88, 0.9], dark = [0.35, 0.4, 0.45];
  return fish({ H:0.08, W:0.055, tm:0.3, nose:0.85, ped:0.18, bodyLen:0.86, back:[0.55, 0.6, 0.65], belly:silver, eye:[0.08, 0.2, 0.028], n:18, m:8,
    pattern:(t, sy) => sy > -0.1 && t > 0.2 && t < 0.88 && fract(t * 16 + Math.abs(sy) * 1.6) < 0.28 ? dark : null,
    tail:'fork', tailH:0.13, tailCol:[0.5, 0.55, 0.6], dorsal:[{ at:0.3, len:0.1, h:0.06, col:dark }, { at:0.64, len:0.08, h:0.045, col:dark }],
    anal:[{ at:0.66, len:0.08, h:0.04, col:dark }], pect:{ at:0.24, len:0.07, w:0.025, col:silver } });
}
function mkSeadragon() {
  // leafy seadragon, one unit long, head at +x: a seahorse's cousin that swims level, hung all over with leafy lobes as camouflage
  const mb = new MB(), body = [0.85, 0.6, 0.25], band = [0.75, 0.45, 0.55], leaf = [0.5, 0.6, 0.22], leaf2 = [0.75, 0.62, 0.25];
  const spine = t => [0.38 - t * 0.86, 0.04 * Math.sin(t * PI) - (t > 0.7 ? Math.pow((t - 0.7) / 0.3, 2) * 0.08 : 0), 0];
  tube(mb, { n:40, m:8, path:spine, r:t => t < 0.12 ? 0.03 + t * 0.15 : 0.055 * Math.sin(Math.min(1, (t - 0.05) / 0.4) * PI * 0.5) * (1 - Math.max(0, t - 0.45) * 1.6) + 0.006,
    col:t => fract(t * 22) < 0.22 ? band : body, anim:t => [0, 0, t * 0.12, 0] });
  // head and the long thin snout
  ellip(mb, [0.4, 0.03, 0], [0.05, 0.035, 0.03], { n:5, m:8, col:fc(body) });
  tube(mb, { n:5, m:6, path:t => [0.44 + t * 0.14, 0.02 - t * 0.015, 0], r:t => 0.014 - t * 0.004, col:fc(body) });
  for (const sz of [1, -1]) ellip(mb, [0.42, 0.045, sz * 0.026], [0.012, 0.012, 0.008], { n:4, m:6, col:fc([0.08, 0.06, 0.05]) });
  // the leafy lobes: in pairs along the back, belly and tail, each a frond on a short stalk
  const r = rng(7171);
  const lobe = (t, up, side, L) => {
    // a thin stalk that forks into two or three narrow leaves
    const p = spine(t), base = vadd(p, [0, up * 0.035, side * 0.02]);
    const dir = vnorm([-0.45 + (r() - 0.5) * 0.4, up, side * 0.6]), tip = vadd(base, vmul(dir, L * 0.45));
    tube(mb, { n:3, m:3, path:u => vadd(base, vmul(dir, u * L * 0.45)), r:0.006, col:fc(body), anim:u => [0, 0, 0.1 + u * 0.3, 0] });
    const nl = 2 + (r() < 0.5 ? 1 : 0);
    for (let k = 0; k < nl; k++) {
      const d2 = vnorm(vadd(dir, [(k - (nl - 1) / 2) * 0.7, 0, (r() - 0.5) * 0.5])), w = vnorm(vcross(d2, [0, 0, 1]));
      const l = L * (0.5 + r() * 0.25), h = l * 0.16;
      const col = r() < 0.5 ? leaf : leaf2;
      fin(mb, [[0, 0], [l * 0.25, h], [l * 0.7, h * 0.8], [l, 0], [l * 0.7, -h * 0.8], [l * 0.25, -h]], { origin:tip, ua:d2, va:vlen(w) > 0.1 ? w : [1, 0, 0],
        col:(a) => a > l * 0.75 ? band : col, anim:(a) => [0, 0, 0.25 + a * 1.5, 0] });
    }
  };
  for (const [t, up, side, L] of [[0.0, 1, 0, 0.09], [0.12, 1, 0.6, 0.12], [0.12, 1, -0.6, 0.12], [0.22, -1, 0.5, 0.13], [0.22, -1, -0.5, 0.13], [0.33, 1, 0.3, 0.15], [0.33, 1, -0.3, 0.15],
    [0.45, -1, 0.4, 0.12], [0.45, -1, -0.4, 0.12], [0.58, 1, 0.5, 0.11], [0.58, 1, -0.5, 0.11], [0.72, -1, 0.3, 0.1], [0.72, -1, -0.3, 0.1], [0.86, 1, 0.2, 0.08], [0.86, -1, -0.2, 0.08]]) lobe(t, up, side, L);
  // the small see-through fins that actually drive it
  fin(mb, [[0, 0], [-0.04, 0.05], [-0.12, 0.05], [-0.14, 0]], { origin:spine(0.38), ua:[1, 0, 0], va:[0, 1, 0], col:fc([0.9, 0.85, 0.7]), anim:(a, b) => [0, 0, Math.abs(b) * 0.5, 0] });
  return mb;
}
function mkNautilus() {
  // chambered nautilus, one unit = the shell's diameter, head at +x. The shell is a logarithmic spiral that triples its size
  // each turn; the soft body sits in the last chamber, the leathery hood on top, a cluster of ridged tentacles in front
  const mb = new MB(), cream = [0.95, 0.9, 0.8], stripe = [0.62, 0.32, 0.16], hood = [0.55, 0.35, 0.25], flesh = [0.9, 0.78, 0.68];
  const b = Math.log(3) / TAU, thE = 4 * PI - PI / 3, R = 0.634, a = R / Math.exp(b * thE), th0 = thE - 5 * PI;
  const ro = th => a * Math.exp(b * th);
  const at = th => { const rc = ro(th) * 0.667; return [rc * Math.cos(th), rc * Math.sin(th), 0]; };
  const mk = mb.mark();
  tube(mb, { n:140, m:14, path:t => at(lerp(th0, thE, t)), r:t => ro(lerp(th0, thE, t)) * 0.333,
    col:(t, u, p) => {
      const th = lerp(th0, thE, t), rr = Math.hypot(p[0], p[1]), outer = rr > ro(th) * 0.7;
      // flame stripes on the older part of the shell, fading out before the aperture
      return t < 0.9 && outer && Math.sin(th * 5 + rr * 14) > -0.15 ? stripe : cream;
    } });
  mb.xform(mk, p => [p[0], p[1], p[2] * 0.62]);
  // the shell is centred on the coil; move it so the aperture sits near the origin
  const ap = at(thE), tan = vnorm([-Math.sin(thE), Math.cos(thE), 0]);
  mb.xform(mk, p => [p[0] - ap[0], p[1] - ap[1] + 0.05, p[2]]);
  const head = vadd(vmul(tan, 0.05), [0, 0.05, 0]);
  ellip(mb, head, [0.13, 0.11, 0.1], { n:8, m:12, col:fc(flesh) });
  // the hood, folded over the top of the head like a lid
  ellip(mb, vadd(head, [0.02, 0.08, 0]), [0.16, 0.06, 0.11], { n:6, m:12, col:(u, v, p) => Math.sin(p[0] * 60) * Math.sin(p[2] * 50) > 0.4 ? [0.4, 0.25, 0.18] : hood });
  // pinhole eyes on stalks
  for (const sz of [1, -1]) { ellip(mb, vadd(head, [0.03, 0.0, sz * 0.1]), [0.035, 0.035, 0.02], { n:4, m:8, col:fc(flesh) }); ellip(mb, vadd(head, [0.035, 0.0, sz * 0.118]), [0.012, 0.012, 0.005], { n:3, m:6, col:fc([0.05, 0.04, 0.04]) }); }
  // the tentacles: a few dozen, fanning forward and down
  const r = rng(4242);
  for (let k = 0; k < 34; k++) {
    const ang = r() * TAU, rad = 0.02 + r() * 0.06, L = 0.18 + r() * 0.16, droop = 0.05 + r() * 0.15, cy = Math.sin(ang) * rad * 0.8, cz = Math.cos(ang) * rad;
    const base = vadd(head, [0.1, cy - 0.02, cz]);
    tube(mb, { n:6, m:3, path:t => [base[0] + t * L, base[1] - t * t * droop + cy * t * 0.8, base[2] + cz * t * 1.6], r:t => 0.008 * (1 - t * 0.6),
      col:fc(flesh), anim:t => [0, 0, t * 0.5, 0] });
  }
  // the funnel it jets with, under the head
  tube(mb, { n:4, m:6, path:t => vadd(head, [0.05 + t * 0.06, -0.09, 0]), r:t => 0.025 - t * 0.008, col:fc(flesh) });
  return mb;
}
function mkSeaLion() {
  // California sea lion, one unit long, head at +x: a sleek torpedo that 'flies' with its long fore flippers and steers with the hind ones
  const mb = new MB(), back = [0.45, 0.32, 0.21], belly = [0.66, 0.53, 0.38], dark = [0.24, 0.17, 0.11];
  // the body, from the neck back: deepest at the chest, tapering to the hips
  loft(mb, { n:28, m:16, sec:t => {
      const f = t < 0.25 ? 0.62 + 0.38 * Math.sin(t / 0.25 * PI / 2) : 1 - 0.82 * Math.pow((t - 0.25) / 0.75, 1.5);
      return { x:0.32 - t * 0.8, y:0, w:0.105 * f, h:0.12 * f, e:2 };
    },
    col:(t, u, p, sy) => sy < -0.25 ? belly : back, anim:t => [0.15 + t * 0.85, 0, 0, 0] });
  // the head: round crown, a short tapered muzzle, big dark eyes and tiny ear flaps
  ellip(mb, [0.37, 0.025, 0], [0.085, 0.07, 0.065], { n:8, m:12, col:fc(back), anim:() => [0.08, 0, 0, 0] });
  tube(mb, { n:4, m:8, path:t => [0.43 + t * 0.07, 0.012 - t * 0.012, 0], r:t => 0.042 - t * 0.02, col:t => t > 0.85 ? dark : belly, anim:() => [0.04, 0, 0, 0] });
  for (const sz of [1, -1]) {
    ellip(mb, [0.42, 0.045, sz * 0.045], [0.016, 0.016, 0.01], { n:3, m:6, col:fc([0.03, 0.03, 0.03]), anim:() => [0.08, 0, 0, 0] });
    tube(mb, { n:2, m:3, path:t => [0.355 - t * 0.02, 0.07 + t * 0.012, sz * (0.045 + t * 0.008)], r:0.006, col:fc(dark), anim:() => [0.1, 0, 0, 0] });
    // the long fore flippers, angled down and back from the chest
    fin(mb, [[0, 0.025], [0.1, 0.035], [0.24, 0.015], [0.3, -0.01], [0.18, -0.025], [0, -0.03]], { origin:[0.2, -0.06, sz * 0.08], ua:vnorm([-0.5, -0.55, sz * 0.75]), va:[1, 0, 0],
      col:fc(dark), anim:(a) => [0.3, a * 3.5, 0, 0] });
    // the hind flippers, trailing behind the hips
    fin(mb, [[0, 0.012], [0.07, 0.035], [0.14, 0.04], [0.15, -0.01], [0.07, -0.014], [0, -0.012]], { origin:[-0.46, -0.005, sz * 0.012], ua:vnorm([-1, -0.1, sz * 0.4]), va:vnorm([0, 1, sz * 0.4]),
      col:fc(dark), anim:() => [1, 0, 0, 0] });
  }
  return mb;
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
  addObj({ key:'puffer', name:'pufferfish', type:'a porcupinefish · Diodon', kind:'fish', floor:[REEF[0], REEF[1] - 2.2, 1.8], size:0.4, rad:0.3,
    fact:'Threatened, it gulps water into an elastic stomach and swells to several times its size, its spines standing on end. Many pufferfish also carry tetrodotoxin, one of the most potent poisons known.',
    motion:{ type:'hover', amp:0.08, turn:0.5 },
    // it swims slim, and swells into a spiny ball when disturbed (swim up close, or "disturb it")
    post:o => { const e = smooth(0.15, 1, o.reactEnv || 0); o.parts[1].scale = 0.4 * lerp(0.45, 1, e); },
    parts:[part(mkPufferSlim, { scale:0.4, mat:M_SKIN, ...FISH_SWIM(0.04, 1.6, 0.9, 2), show:o => !(o.reactEnv > 0.15) }),
      part(mkPuffer, { scale:0.4, mat:M_SKIN, show:o => o.reactEnv > 0.15 })],
    views:[{ d:[1, 0.25, 0.6], k:2.2, hold:10, drift:0.025 }, { d:[0.3, 0.55, 1], k:2.4, hold:8, drift:0.03 }] });
  addObj({ key:'seaotter', name:'sea otter', type:'Enhydra lutris', kind:'air', at:[KELP[0] + 8, KELP[2] + 5, 0.08], size:1.3, rad:0.8, yaw:0.6,
    fact:'The densest fur of any animal, up to about a million hairs per square inch, keeps it warm without blubber. By eating sea urchins it protects the kelp forest: where otters vanished, urchins grazed the forests away.',
    motion:{ type:'hover', amp:0.15, turn:0.4 },
    parts:[part(mkSeaOtter, { scale:1.3, mat:[1, 0.5, 1, 0.4] })],
    views:[{ d:[0.6, 0.55, 1], k:2.4, hold:10, drift:0.02, air:true }, { d:[0.4, -0.55, 0.8], k:2.6, hold:9, drift:0.02 }] });
  addObj({ key:'sealion', name:'California sea lions', label:'sea lions', type:'Zalophus californianus', kind:'air', at:[KELP[0] - 6, KELP[2] + 8, 6], size:2, vsize:3, rad:3, predator:true,
    fact:'Sea lions swim by beating their long fore flippers like wings, steering with the hind ones, and turn tighter than almost any other large swimmer. Curious and playful, they often loop round divers in the kelp.',
    motion:{ type:'eight', R:7, v:2.6, bob:1.5, bank:0.5 },
    parts:[part(mkSeaLion, { scale:2, mat:[1, 0.45, 1, 0.5], swim:[0.025, 1.1, 0.6, 0], swim2:[1, 2.2, 0.06, 1.1] }),
      part(mkSeaLion, { scale:1.7, off:[-3, 0.8, 1.6], mat:[1, 0.45, 1, 0.5], swim:[0.025, 1.2, 0.6, 2], swim2:[1, 2.2, 0.05, 1.2] })],
    views:[{ d:[0.2, 0.1, 1], k:1.6, hold:10, drift:0.02 }, { d:[0.8, -0.3, 0.6], k:1.5, hold:9, drift:0.02 }, { d:[-0.5, 0.5, 0.7], k:1.8, hold:8, drift:-0.02 }] });
  addObj({ key:'blacksmith', name:'blacksmith', type:'a school of Chromis punctipinnis', kind:'fish', at:[KELP[0] + 2, KELP[2] - 3, 9], size:0.25, vsize:6, rad:5,
    fact:'Dark blue damselfish that hang in loose schools in the kelp’s open spaces, picking plankton from the current. At night they shelter in cracks in the rock below.',
    parts:[part(mkBlacksmith, { inst:schoolCloud(150, 5, 2.5, 727, 1, 0.5), school:[1, 0.25, 1, 0], mat:M_SKIN, shy:8, ...FISH_SWIM(0.06, 2.4, 0.9, 1.8) })],
    views:[{ d:[0.3, 0.1, 1], k:1.0, hold:10, drift:0.03, frame:'world' }, { d:[1, -0.4, 0.3], k:0.9, hold:9, drift:0.03, frame:'world' }] });
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
  addObj({ key:'gardeneels', name:'garden eels', type:'spotted garden eels · Heteroconger hassi', kind:'fish', floor:[REEF[0] + 38, REEF[1] - 12, 0], size:0.4, vsize:3, rad:2.5,
    fact:'Hundreds live together in a sand flat, each in its own burrow, rising half out of the sand to pick plankton from the current. Come too close and the whole garden sinks out of sight.',
    parts:[part(mkGardenEels, { mat:M_SKIN, sway:[0.03, 0.9, 3, 0] })],
    views:[{ d:[0.5, 0.25, 1], k:1.1, hold:10, drift:0.03, frame:'world', off:[0, 0.2, 0] }, { d:[1, 0.08, 0.3], k:0.6, hold:9, drift:0.03, frame:'world', off:[0, 0.2, 0] }] });
  addObj({ key:'stingray', name:'southern stingray', type:'Hypanus americanus', kind:'sharks', floor:[REEF[0] + 36, REEF[1] - 4, 0.02], size:1.5, rad:0.9, yaw:2.6,
    fact:'It spends much of the day buried in sand with only its eyes and spiracles showing, breathing through the spiracles so it does not take in sand. It hunts by blowing jets of water to uncover buried clams and worms.',
    parts:[part(mkStingray, { scale:1.5, mat:M_SKIN, swim2:[0, 2, 0.01, 0.2], sway:[0.01, 0.6, 3, 0] })],
    views:[{ d:[0.3, 1.2, 0.5], k:1.5, hold:10, drift:0.02 }, { d:[1, 0.25, 0.3], k:1.1, hold:9, drift:0.02 }] });
  addObj({ key:'barracuda', name:'chevron barracuda', label:'barracuda', type:'a tornado of Sphyraena qenie', kind:'fish', floor:[2300, 60, 8], size:0.9, vsize:8, rad:6,
    fact:'By day hundreds of chevron barracuda hang in a slowly turning tornado off the reef wall, then split up at dusk to hunt alone. A barracuda can lunge at over 40 km/h, snapping with fang-like teeth.',
    parts:[part(mkBarracuda, { inst:schoolMill(150, 2.8, 4.5, 717, 0.35), school:[0, 0.9, 1, 0], mat:M_SILVER, shy:4, ...FISH_SWIM(0.05, 1.6, 0.85, 2) })],
    views:[{ d:[0.3, 0.1, 1], k:1.4, hold:10, drift:0.025, frame:'world' }, { d:[0.2, -0.9, 0.3], k:0.9, hold:9, drift:0.03, frame:'world' }, { d:[1, 0.3, 0.2], k:0.55, hold:9, drift:0.03, frame:'world' }] });
  addObj({ key:'nautilus', name:'chambered nautilus', label:'nautilus', type:'Nautilus pompilius', kind:'cephs', floor:[11300, -300, 2.5], size:0.2, rad:0.25, yaw:0.5,
    fact:'A shelled relative of the octopus, little changed in 500 million years. It sinks and rises by pumping liquid in and out of the sealed chambers of its shell, and jets backwards with its funnel. By day it stays deep on reef slopes, rising at night to feed.',
    motion:{ type:'hover', amp:0.15, turn:0.3 },
    parts:[part(mkNautilus, { scale:0.2, mat:M_SKIN, swim2:[0, 1.6, 0.02, 0.15], sway:[0.03, 0.8, 3, 0] })],
    views:[{ d:[0.15, 0.12, 1], k:2.6, hold:10, drift:0.02 }, { d:[1, 0.2, 0.5], k:2.8, hold:9, drift:0.02 }, { d:[-0.7, 0.4, 0.7], k:2.8, hold:8, drift:-0.02 }] });
  addObj({ key:'orca', name:'orcas', type:'killer whales · Orcinus orca', kind:'air', at:[7800, 900, 15], size:7, vsize:9, rad:10, predator:true,
    fact:'The largest dolphin, and a top predator in every ocean. Each pod has its own calls and hunting methods passed down through generations: some wash seals off ice floes with waves, others hunt great white sharks for their livers.',
    motion:{ type:'circle', R:40, v:3, bob:2, bank:0.12 },
    parts:[0, 1, 2].map(i => part(mkOrca, { scale:7 - i * 1.2, off:[[0, 0, 0], [-6, 1.2, 4], [-9, -0.6, -4.5]][i], mat:M_SKIN, swim:[0.04, 0.4 + i * 0.05, 0.7, i * 1.7], swim2:[1, 2.5, 0, 0] })),
    views:[{ d:[0.2, 0.1, 1], k:1.6, hold:11, drift:0.02 }, { d:[1, 0.3, 0.4], k:1.3, hold:9, drift:0.02 }, { d:[0.3, -0.6, 0.6], k:1.5, hold:9, drift:0.02 }] });
}
