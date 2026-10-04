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
function mkPistolShrimp() {
  // a snapping (pistol) shrimp, one unit long, head at +x: one claw hugely oversized; snapping it shut fires a jet that makes a
  // collapsing bubble, as loud as a gunshot underwater and briefly as hot as the sun's surface
  const mb = new MB(), body = [0.95, 0.6, 0.45], band = [0.85, 0.35, 0.3], claw = [1.0, 0.5, 0.35];
  loft(mb, { n:22, m:10, sec:t => { const w = 0.09 * Math.sin(Math.min(1, t * 2 + 0.3) * PI / 2) * (1 - t * 0.35); return { x:0.3 - t * 0.7, y:0.015 * Math.sin(t * PI), w, h:w * 0.85, e:2.4 }; },
    col:t => t > 0.3 && Math.abs(Math.sin(t * 30)) < 0.2 ? band : body, anim:t => [0, 0, 0, 0] });
  fin(mb, [[0, 0.04], [-0.1, 0.09], [-0.12, 0], [-0.1, -0.09], [0, -0.04]], { origin:[-0.4, 0.01, 0], ua:[1, 0, 0], va:[0, 0, 1], col:fc(body) });
  // the big snapping claw on the right, a slim one on the left
  tube(mb, { n:4, m:5, path:t => [0.28 + t * 0.12, -0.02, 0.07 + t * 0.03], r:0.025, col:fc(claw) });
  ellip(mb, [0.5, -0.01, 0.1], [0.12, 0.06, 0.05], { n:6, m:10, col:(u, v, p) => p[0] > 0.58 ? [1.0, 0.85, 0.75] : claw });
  tube(mb, { n:3, m:4, path:t => [0.6 + t * 0.06, -0.035, 0.1], r:0.018, col:fc([1.0, 0.85, 0.75]) });
  tube(mb, { n:5, m:4, path:t => [0.28 + t * 0.2, -0.03, -0.06], r:t => 0.014 - t * 0.006, col:fc(body) });
  // long antennae: one is always kept touching the goby, which warns it of danger with a flick of its tail
  for (const sz of [1, -1]) tube(mb, { n:10, m:3, path:t => [0.32 + t * 0.55, 0.03 + t * 0.12, sz * (0.03 + t * 0.15)], r:0.004, col:fc(band), anim:t => [0, 0, t * 0.2, 0] });
  for (const sz of [1, -1]) ellip(mb, [0.33, 0.04, sz * 0.03], [0.015, 0.015, 0.015], { n:3, m:6, col:fc([0.1, 0.05, 0.05]) });
  return mb;
}
function mkWatchmanGoby() {
  const yel = [1.0, 0.85, 0.2], dot = [0.3, 0.6, 1.0];
  return fish({ H:0.15, W:0.1, tm:0.25, nose:0.35, ped:0.3, bodyLen:0.82, back:yel, belly:[1.0, 0.92, 0.6], eye:[0.09, 0.42, 0.05], n:16, m:10,
    pattern:(t, sy, sz, p) => Math.sin(p[0] * 70) * Math.sin(p[1] * 60 + p[2] * 40) > 0.75 ? dot : null,
    tail:'round', tailH:0.13, tailCol:yel, dorsal:[{ at:0.15, len:0.22, h:0.14, col:yel }, { at:0.45, len:0.35, h:0.1, col:yel }], anal:[{ at:0.5, len:0.3, h:0.08, col:yel }], pect:{ at:0.2, len:0.12, w:0.07, col:yel } });
}
function mkBurrow() {
  // a mound of sand round the burrow's mouth, in metres
  const mb = new MB();
  ellip(mb, [0, 0, 0], [0.1, 0.018, 0.09], { n:6, m:12, col:(u, v, p) => Math.hypot(p[0] - 0.02, p[2] - 0.01) < 0.035 && p[1] > 0.008 ? [0.04, 0.03, 0.02] : [0.7, 0.66, 0.55] });
  return mb;
}
function mkLeatherback() {
  // leatherback turtle, one unit long: no hard shell, but a leathery carapace with seven ridges running nose to tail, tapering to a
  // point behind; black, spotted white; front flippers longer than in any other turtle, spanning about its body length
  const mb = new MB(), black = [0.2, 0.21, 0.25], spot = [0.8, 0.83, 0.85], belly = [0.8, 0.76, 0.76];
  loft(mb, { n:28, m:28, sec:t => { const f = Math.sin(Math.min(1, t * 1.15) * PI * 0.92 + 0.12); return { x:0.3 - t * 0.78, y:0.02 * f, w:0.22 * Math.pow(Math.max(f, 0), 0.6) * (1 - t * 0.35), h:0.12 * Math.pow(Math.max(f, 0), 0.7), e:2 }; },
    // (the seven ridges: thin pale lines along the back)
    col:(t, u, p, sy, sz) => sy < -0.15 ? belly : (Math.abs(Math.sin(Math.atan2(sz, sy) * 3.5)) < 0.1 && sy > -0.1 ? [0.3, 0.32, 0.36] : (Math.sin(p[0] * 90) * Math.sin(p[2] * 80) > 0.8 ? spot : black)),
    anim:() => [0, 0, 0, 0] });
  // ridges raised a little
  for (let k = -3; k <= 3; k++) { const a = k / 3.5 * PI / 2; tube(mb, { n:16, m:3, path:t => { const x = 0.26 - t * 0.68, f = Math.sin(Math.min(1, (0.3 - x) / 0.78 * 1.15) * PI * 0.92 + 0.12); return [x, 0.02 * f + Math.cos(a) * 0.12 * Math.pow(Math.max(f, 0), 0.7), Math.sin(a) * 0.22 * Math.pow(Math.max(f, 0), 0.6) * (1 - (0.3 - x) / 0.78 * 0.35)]; }, r:0.006, col:fc([0.25, 0.26, 0.3]) }); }
  // the head: big, rounded, with a notched beak
  ellip(mb, [0.38, 0.0, 0], [0.11, 0.07, 0.07], { n:8, m:12, col:(u, v, p) => (p[0] > 0.42 && Math.abs(p[2]) > 0.04 && p[1] > 0.01) ? [0.02, 0.02, 0.02] : (Math.sin(p[0] * 120) * Math.sin(p[2] * 110) > 0.7 ? spot : black) });
  const front = mb.mark();
  fin(mb, [[0, 0.07], [0.08, 0.05], [0.55, -0.08], [0.62, -0.18], [0.45, -0.12], [0.05, -0.06]],
    { origin:[0.16, -0.03, 0.18], ua:vnorm([-0.3, -0.12, 1]), va:[1, 0, 0], col:(a, b) => (Math.sin(a * 70) * Math.sin(b * 70) > 0.6 ? spot : black), anim:(a, b, r, p) => [0, Math.max(0, p[2] - 0.16) * 1.4, 0, 0] });
  mb.dup(front, mirrorZ);
  const rear = mb.mark();
  fin(mb, [[0, 0.04], [0.14, 0.02], [0.12, -0.06], [0.0, -0.04]], { origin:[-0.3, -0.03, 0.08], ua:vnorm([-0.6, -0.1, 1]), va:[1, 0, 0], col:fc(black), anim:(a, b, r, p) => [0, Math.max(0, p[2] - 0.08) * 0.8, 0, 0] });
  mb.dup(rear, mirrorZ);
  return mb;
}
function mkPenguin() {
  // Adelie penguin swimming, one unit long, head at +x: a torpedo, black back and head, white belly and the white eye-ring,
  // stiff flippers it 'flies' with, feet and short tail trailing as a rudder
  const mb = new MB(), black = [0.08, 0.09, 0.11], white = [0.95, 0.95, 0.93];
  loft(mb, { n:26, m:16, sec:t => { const f = Math.pow(Math.sin(Math.min(1, t * 1.05 + 0.04) * PI), 0.62); return { x:0.5 - t, y:0.01 * Math.sin(t * PI), w:0.115 * f, h:0.125 * f, e:2 }; },
    col:(t, u, p, sy, sz) => {
      if (t < 0.17) return (t > 0.08 && t < 0.13 && Math.abs(sz) > 0.6 && sy > 0.15 && sy < 0.6) ? white : black;   // the head, and the white ring round the eye
      return sy < 0.1 - 0.15 * Math.abs(sz) ? white : black;
    }, anim:() => [0, 0, 0, 0] });
  // the short beak
  tube(mb, { n:3, m:5, path:t => [0.49 + t * 0.07, 0.01 - t * 0.008, 0], r:t => 0.022 * (1 - t * 0.7), col:fc([0.15, 0.13, 0.12]) });
  for (const sz of [1, -1]) ellip(mb, [0.42, 0.04, sz * 0.055], [0.008, 0.008, 0.005], { n:3, m:6, col:fc([0.02, 0.02, 0.02]) });
  // flippers, flapping up and down
  const fl = mb.mark();
  fin(mb, [[0, 0.035], [0.06, 0.03], [0.26, -0.01], [0.28, -0.03], [0.05, -0.03]], { origin:[0.24, 0.0, 0.1], ua:vnorm([-0.45, -0.1, 1]), va:[1, 0, 0], col:(a, b) => b < -0.01 ? white : black, anim:(a, b, r, p) => [0, Math.max(0, p[2] - 0.1) * 3, 0, 0] });
  mb.dup(fl, mirrorZ);
  // pink feet and the stiff tail, trailing
  for (const sz of [1, -1]) fin(mb, [[0, 0.02], [-0.07, 0.025], [-0.08, -0.02], [0, -0.015]], { origin:[-0.43, -0.03, sz * 0.03], ua:[1, 0, 0], va:[0, 0, 1], col:fc([0.9, 0.6, 0.6]) });
  tube(mb, { n:3, m:5, path:t => [-0.48 - t * 0.06, 0.01, 0], r:t => 0.02 * (1 - t * 0.6), col:fc(black) });
  return mb;
}
function mkGrouper() {
  // giant grouper, one unit long: a huge mouth, heavy body, mottled brown and grey with pale blotches
  const brown = [0.3, 0.26, 0.2], pale = [0.6, 0.55, 0.42], dark = [0.14, 0.12, 0.1];
  return fish({ H:0.15, W:0.11, tm:0.32, nose:0.45, ped:0.22, bodyLen:0.82, back:brown, belly:pale, eye:[0.1, 0.33, 0.022], n:18, m:12,
    pattern:(t, sy, sz, p) => { const n = Math.sin(p[0] * 34 + p[1] * 9) * Math.sin(p[1] * 30 + p[2] * 11); return n > 0.45 ? pale : n < -0.55 ? dark : null; },
    tail:'round', tailH:0.13, tailCol:brown, dorsal:[{ at:0.3, len:0.45, h:0.07, col:brown }], anal:[{ at:0.62, len:0.14, h:0.07, col:brown }],
    pect:{ at:0.3, len:0.12, w:0.07, col:brown },
    extra:mb => { for (const sz of [1, -1]) ellip(mb, [0.43, -0.03, sz * 0.03], [0.07, 0.02, 0.025], { n:4, m:8, col:fc([0.55, 0.3, 0.3]) }); } });   // (the mouth, held open to be cleaned)
}
function mkCleanerWrasse() {
  const blue = [0.3, 0.55, 1.0], white = [0.95, 0.95, 0.95];
  return fish({ H:0.12, W:0.06, tm:0.28, nose:0.6, ped:0.2, bodyLen:0.84, back:blue, belly:white, eye:[0.08, 0.3, 0.035], n:12, m:8,
    pattern:(t, sy) => Math.abs(sy + 0.05 - t * 0.2) < 0.18 && t > 0.05 ? [0.03, 0.03, 0.05] : (sy > 0.2 ? [0.55, 0.75, 1.0] : white),
    tail:'truncate', tailH:0.1, tailCol:blue, dorsal:[{ at:0.3, len:0.5, h:0.05, col:blue }], pect:{ at:0.24, len:0.08, w:0.03, col:white } });
}
function mkBlueRinged() {
  const tan = [0.82, 0.72, 0.4], brown = [0.55, 0.42, 0.22];
  return mkOctopus({ skin:tan, mott:brown, pat:p => {
    const n = Math.sin(p[0] * 55 + p[2] * 20) * Math.sin(p[1] * 60 + p[2] * 45), m = Math.abs(n);
    return m > 0.8 ? [0.01, 0.12, 0.5, 3.0] : m > 0.66 ? [0.06, 0.05, 0.03] : (n < -0.3 ? brown : tan);
  } });
}
function mkFlounder() {
  // peacock flounder, one unit long, lying on its left side: the body a flat oval seen from above, fringed all round by the
  // dorsal and anal fins; both eyes on the upper side, on short turrets; sandy, speckled, with blue rings
  const mb = new MB(), sand = [0.24, 0.22, 0.17], dark = [0.1, 0.09, 0.07], blue = [0.12, 0.3, 0.75];
  const col = (p) => { const rr = Math.hypot(fract(p[0] * 9) - 0.5, fract(p[2] * 9 + 0.3) - 0.5); if (Math.abs(rr - 0.3) < 0.05 && Math.sin(p[0] * 13 + p[2] * 7) > 0) return blue; return Math.sin(p[0] * 41 + p[2] * 17) * Math.sin(p[2] * 37) > 0.4 ? dark : sand; };
  ellip(mb, [0.02, 0.02, 0], [0.4, 0.035, 0.24], { n:10, m:24, shape:p => [p[0], p[1] < 0 ? p[1] * 0.3 : p[1], p[2]], col:(u, v, p) => p[1] < 0 ? [0.92, 0.9, 0.85] : col(p), anim:p => [Math.max(0, -p[0] - 0.1) * 1.5, 0, 0, 0] });
  // the fin fringe round the edge, rippling
  const fr = []; for (let k = 0; k <= 30; k++) { const a = k / 30 * TAU; fr.push([Math.cos(a) * 0.44 + 0.02, Math.sin(a) * 0.3]); }
  fin(mb, fr, { origin:[0, 0.005, 0], ua:[1, 0, 0], va:[0, 0, 1], col:(a, b, r) => r > 0.85 ? col([a, 0, b]) : col([a, 0, b]), center:[0.02, 0], anim:(a, b, r) => [0, r > 0.85 ? (0.5 + 0.5 * Math.sin(a * 20)) * 0.6 : 0, 0, 0] });
  // tail
  fin(mb, [[0, 0.06], [-0.12, 0.1], [-0.14, -0.1], [0, -0.06]], { origin:[-0.4, 0.005, 0], ua:[1, 0, 0], va:[0, 0, 1], col:(a, b) => col([a - 0.4, 0, b]), anim:() => [1, 0, 0, 0] });
  // the two eyes on the upper side, both on what was the right side of the larva
  for (const [x, z] of [[0.3, 0.05], [0.24, -0.04]]) { tube(mb, { n:2, m:6, path:t => [x, 0.04 + t * 0.03, z], r:0.025, col:fc(sand) }); ellip(mb, [x, 0.075, z], [0.022, 0.022, 0.022], { n:5, m:8, col:(u, v, p) => p[1] > 0.085 ? [0.02, 0.02, 0.02] : [0.55, 0.5, 0.4] }); }
  return mb;
}
function mkXmasBoulder() {
  // a boulder of brain coral, in metres, about 40 cm across
  const mb = new MB();
  ellip(mb, [0, 0.05, 0], [0.22, 0.15, 0.2], { n:10, m:16, shape:p => [p[0], Math.max(p[1], -0.02), p[2]], col:(u, v, p) => Math.sin(p[0] * 70 + Math.sin(p[2] * 50) * 2) > 0.2 ? [0.3, 0.26, 0.15] : [0.2, 0.17, 0.1] });
  return mb;
}
function mkXmasWorms() {
  // Christmas tree worms (Spirobranchus): each shows two spiral crowns of feeding tentacles, like little fir trees, from a tube
  // bored into the coral; every one a different colour
  const mb = new MB(), r = rng(1225), cols = [[1.0, 0.3, 0.2], [0.2, 0.45, 1.0], [1.0, 0.85, 0.2], [1.0, 0.55, 0.15], [0.95, 0.95, 0.95], [0.75, 0.3, 0.9], [0.3, 0.85, 0.5]];
  for (let k = 0; k < 9; k++) {
    const a = r() * TAU, el = 0.7 + r() * 0.75, n = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)];
    const base = [n[0] * 0.21, 0.05 + n[1] * 0.145, n[2] * 0.19], col = cols[k % cols.length];
    for (const side of [1, -1]) {
      const c0 = vadd(base, [-n[2] * side * 0.02, 0, n[0] * side * 0.02]);
      // a spiral cone, wide at the bottom: a ribbon wound five times round the axis
      tube(mb, { n:40, m:3, path:t => { const ang = t * TAU * 5 + side, rr = 0.024 * (1 - t); return vadd(c0, [Math.cos(ang) * rr, 0.004 + t * 0.055, Math.sin(ang) * rr]); }, r:t => 0.005 * (1 - t * 0.5), col:fc(col), anim:t => [0, 0, t * 0.2, 0] });
    }
  }
  return mb;
}
function mkBaskingShark() {
  // basking shark, one unit long: mouth gaping wide as it filter-feeds, the gill slits so long they nearly ring the head,
  // a pointed snout, mottled grey-brown
  const back = [0.32, 0.31, 0.3], belly = [0.6, 0.58, 0.56];
  return fish({ H:0.11, W:0.1, tm:0.35, nose:0.55, ped:0.12, bodyLen:0.8, back, belly, eye:[0.05, 0.2, 0.008], e:2.1,
    camber:t => -0.08 * Math.sin(t * PI), pattern:(t, sy, sz, p) => mixc(belly, back, smooth(-0.3, 0.1, sy)) .map((c, i) => c * (Math.sin(p[0] * 40 + p[1] * 25) * Math.sin(p[2] * 30) > 0.5 ? 0.8 : 1)),
    tail:'lunate', tailH:0.16, tailL:0.2, tailCol:back,
    dorsal:[{ at:0.36, len:0.14, h:0.13, sweep:0.6 }, { at:0.78, len:0.03, h:0.03 }], anal:[{ at:0.8, len:0.03, h:0.025 }],
    pect:{ at:0.32, len:0.16, w:0.07, down:0.55, back:0.5, y:-0.45, col:back }, pelv:{ at:0.62, len:0.05, w:0.03, y:-0.7 },
    extra:(mb, b) => {
      // the gill slits, almost meeting above and below
      for (let k = 0; k < 5; k++) for (const sz of [1, -1]) {
        const t = 0.15 + k * 0.028, x = 0.5 - t * b.bl, w = b.W * b.prof(t) * 1.03, h = b.H * b.prof(t);
        fin(mb, [[0, -0.95], [0.005, -0.95], [0.005, 0.9], [0, 0.9]].map(([a, c]) => [a, c * h]), { origin:[x, -0.01, sz * w * 0.9], ua:[1, 0, 0], va:[0, 1, 0], col:fc([0.05, 0.05, 0.06]), anim:finA, rings:1 });
      }
      // the open mouth: a dark ring-shaped cavern below the snout, with pale gill rakers inside
      // (a short wide funnel just under the snout: its rim pale, its inside black, the gill rakers a pale ring deep inside)
      const mx = 0.5 - 0.035 * b.bl;
      tube(mb, { n:4, m:18, path:t => [mx + 0.01 - t * 0.09, -0.03, 0], r:t => 0.06 - t * 0.012, col:t => t < 0.12 ? [0.7, 0.66, 0.6] : t > 0.85 ? [0.8, 0.78, 0.72] : [0.015, 0.012, 0.012], capEnd:true });
    } });
}
function mkClamShell() {
  // giant clam (Tridacna gigas), one unit long, lying hinge-down: two heavy valves with deep wavy folds, meeting along the top
  const mb = new MB(), white = [0.42, 0.4, 0.34], grey = [0.24, 0.23, 0.2];
  for (const sz of [1, -1]) {
    ellip(mb, [0, 0.2, sz * 0.02], [0.5, 0.24, 0.27], { n:12, m:24,
      shape:p => { if (p[2] * sz < 0) p = [p[0], p[1], 0]; const f = Math.sin(Math.atan2(p[1] - 0.2, p[0]) * 9); return [p[0], p[1] + f * 0.025 * Math.max(0, p[1] - 0.2) * 6, p[2] * (1 + 0.12 * f)]; },
      col:(u, v, p) => Math.sin(Math.atan2(p[1] - 0.2, p[0]) * 9) > 0.3 ? white : grey });
  }
  return mb;
}
function mkClamMantle() {
  // the mantle that bulges out between the valves: velvety blue, green and gold, dotted with iridescent spots (algae living in
  // it feed the clam), and the round inhalant siphon
  const mb = new MB();
  ellip(mb, [0, 0.44, 0], [0.5, 0.08, 0.2], { n:8, m:24,
    col:(u, v, p) => { const s = Math.sin(p[0] * 60) * Math.sin(p[2] * 70); return s > 0.6 ? [0.35, 0.95, 1.0, 0.6] : s < -0.6 ? [0.95, 0.8, 0.25, 0.3] : Math.sin(p[0] * 9) > 0 ? [0.15, 0.45, 0.9, 0.2] : [0.15, 0.7, 0.55, 0.2]; } });
  tube(mb, { n:3, m:10, path:t => [0.18, 0.46 + t * 0.04, 0], r:0.04, col:t => t > 0.6 ? [0.05, 0.05, 0.08] : [0.6, 0.8, 0.7] });
  return mb;
}
function mkTuna() {
  // Atlantic bluefin tuna: a torpedo built for speed, dark steel-blue above, silver below, a row of yellow finlets to the tail
  const back = [0.1, 0.16, 0.32], belly = [0.85, 0.87, 0.9], finC = [0.95, 0.8, 0.2];
  return fish({ H:0.13, W:0.11, tm:0.36, nose:0.62, ped:0.06, bodyLen:0.84, back, belly, eye:[0.08, 0.15, 0.02], e:2.1,
    pattern:(t, sy) => mixc(belly, back, smooth(-0.1, 0.2, sy + 0.05 * Math.sin(t * 30))),
    tail:'lunate', tailH:0.2, tailL:0.12, tailCol:back,
    dorsal:[{ at:0.3, len:0.14, h:0.07, col:back }, { at:0.52, len:0.08, h:0.08, col:[0.6, 0.55, 0.3] }], anal:[{ at:0.55, len:0.07, h:0.07, col:[0.6, 0.55, 0.3] }],
    pect:{ at:0.27, len:0.12, w:0.04, down:0.3, back:0.6, col:back },
    extra:(mb, b) => { for (let k = 0; k < 8; k++) for (const s of [1, -1]) { const t = 0.64 + k * 0.035, x = 0.5 - t * b.bl, h = b.H * b.prof(t);
      fin(mb, [[0, 0], [-0.012, s * 0.02], [-0.02, 0]], { origin:[x, s * h * 0.9, 0], ua:[1, 0, 0], va:[0, 1, 0], col:fc(finC), anim:finA }); } } });
}
function mkSeaKrait() {
  // banded sea krait (Laticauda colubrina), one unit long, head at +x: a slim snake ringed black and silvery blue, a yellow snout,
  // the tail flattened into a paddle
  const mb = new MB(), blue = [0.55, 0.7, 0.95], black = [0.04, 0.04, 0.06], yellow = [0.95, 0.85, 0.35];
  tube(mb, { n:60, m:7, path:t => [0.48 - t * 0.96, 0, 0], r:t => (t < 0.04 ? 0.012 + t * 0.2 : 0.02) * (t > 0.85 ? lerp(1, 0.5, (t - 0.85) / 0.15) : 1),
    col:t => t < 0.035 ? yellow : fract(t * 36) < 0.38 ? black : blue, anim:t => [t, 0, 0, 0] });
  // the paddle tail, flattened top to bottom
  fin(mb, [[0, 0.025], [-0.06, 0.035], [-0.07, -0.035], [0, -0.025]], { origin:[-0.47, 0, 0], ua:[1, 0, 0], va:[0, 1, 0], col:(a) => fract(a * 30) < 0.4 ? black : blue, anim:() => [1, 0, 0, 0] });
  for (const sz of [1, -1]) ellip(mb, [0.465, 0.008, sz * 0.012], [0.004, 0.004, 0.003], { n:3, m:5, col:fc(black) });
  return mb;
}
function mkCoconutOctopus() {
  // veined octopus (Amphioctopus marginatus), in metres, about 15 cm across: hunched over two half coconut shells, carrying one
  // under its body as it 'stilt-walks' across the sand; when threatened it climbs in and pulls the other half over itself
  const mb = new MB(), skin = [0.3, 0.2, 0.15], vein = [0.12, 0.07, 0.06], shell = [0.16, 0.1, 0.06], husk = [0.28, 0.2, 0.12], white = [0.55, 0.5, 0.42];
  const body = mkOctopus({ skin, mott:vein });
  const mk = mb.mark();
  // merge the octopus, scaled down and lifted onto the shell
  for (let k = 0; k < body.count; k++) mb.v([body.P[k * 3] * 0.13, body.P[k * 3 + 1] * 0.13 + 0.07, body.P[k * 3 + 2] * 0.13], [body.C[k * 4], body.C[k * 4 + 1], body.C[k * 4 + 2], body.C[k * 4 + 3]], [body.A[k * 4], body.A[k * 4 + 1], body.A[k * 4 + 2], body.A[k * 4 + 3]]);
  for (let k = 0; k < body.I.length; k++) mb.I.push(body.I[k] + mk.v);
  // the two shell halves: one held cupped under it, one beside it on the sand
  const half = (c, up) => ellip(mb, c, [0.07, 0.05, 0.065], { n:8, m:14, shape:q => [q[0], up ? Math.min(q[1], c[1] + 0.004) : Math.max(q[1], c[1] - 0.004), q[2]],
    col:(u, v, q) => Math.abs(q[1] - c[1]) < 0.006 ? white : Math.sin(q[0] * 260) * Math.sin(q[2] * 240) > 0.5 ? husk : shell });
  half([0, 0.055, 0], true);
  half([0.13, 0.0, 0.06], false);
  return mb;
}
function mkTorpedoRay() {
  // Atlantic torpedo ray, one unit long, head at +x: an almost round, thick, soft disc (the two kidney-shaped electric organs fill
  // its sides), a short stout tail with two dorsal fins and a broad paddle of a tail fin; dark brown-grey above, cream below
  const mb = new MB(), back = [0.22, 0.2, 0.2], belly = [0.9, 0.87, 0.8];
  loft(mb, { n:20, m:24, sec:t => { const f = Math.sin(clamp(t / 0.62, 0, 1) * PI); return { x:0.36 - t * 0.6, y:0, w:0.33 * Math.pow(f, 0.6) + 0.01, h:0.07 * Math.pow(f, 0.6) + 0.004, e:1.8 }; },
    col:(t, u, p, sy) => sy < 0 ? belly : (Math.sin(p[0] * 40) * Math.sin(p[2] * 36) > 0.8 ? [0.14, 0.12, 0.12] : back), anim:(t, u, p) => [0, Math.pow(Math.abs(p[2]) * 3, 2) * 0.05, 0, 0] });
  tube(mb, { n:8, m:8, path:t => [-0.0 - t * 0.38, 0.01, 0], r:t => 0.06 * (1 - t * 0.55), col:fc(back), anim:t => [t, 0, 0, 0] });
  fin(mb, [[0, 0], [-0.04, 0.06], [-0.08, 0.05], [-0.09, 0]], { origin:[-0.12, 0.05, 0], ua:[1, 0, 0], va:[0, 1, 0], col:fc(back), anim:() => [0.3, 0, 0, 0] });
  fin(mb, [[0, 0], [-0.03, 0.045], [-0.06, 0.04], [-0.07, 0]], { origin:[-0.24, 0.04, 0], ua:[1, 0, 0], va:[0, 1, 0], col:fc(back), anim:() => [0.6, 0, 0, 0] });
  fin(mb, [[0, 0.02], [-0.04, 0.09], [-0.1, 0.07], [-0.1, -0.07], [-0.04, -0.09], [0, -0.02]], { origin:[-0.37, 0.01, 0], ua:[1, 0, 0], va:[0, 1, 0], col:fc(back), anim:() => [1, 0, 0, 0] });
  for (const sz of [1, -1]) ellip(mb, [0.2, 0.07, sz * 0.04], [0.012, 0.008, 0.01], { n:3, m:6, col:fc([0.05, 0.05, 0.05]) });
  return mb;
}
function mkBatfish() {
  // red-lipped batfish (Ogcocephalus darwini), one unit long, head at +x: a flattened, roughly triangular body seen from above,
  // a pointed snout-horn, bright red lips, and pectoral and pelvic fins turned into legs it walks on across the sand
  const mb = new MB(), back = [0.22, 0.17, 0.14], belly = [0.6, 0.5, 0.42], red = [1.0, 0.1, 0.12, 0.6];
  loft(mb, { n:22, m:18, sec:t => { const f = t < 0.45 ? 0.45 + 0.55 * Math.sin(t / 0.45 * PI / 2) : 1 - 0.85 * smooth(0.45, 1, t); return { x:0.38 - t * 0.85, y:0.03 * (1 - t), w:0.3 * f * (t < 0.6 ? 1 : 0.5) + 0.02, h:0.1 * f + 0.01, e:2 }; },
    col:(t, u, p, sy) => sy < -0.2 ? belly : (Math.sin(p[0] * 70) * Math.sin(p[2] * 60) > 0.6 ? [0.45, 0.36, 0.28] : back), anim:t => [t > 0.6 ? (t - 0.6) * 2 : 0, 0, 0, 0] });
  tube(mb, { n:3, m:5, path:t => [0.38 + t * 0.12, 0.08 + t * 0.03, 0], r:t => 0.02 * (1 - t * 0.7), col:fc(back) });     // the snout horn
  ellip(mb, [0.4, 0.0, 0], [0.025, 0.02, 0.06], { n:4, m:10, col:fc(red) });                                              // the red lips
  for (const sz of [1, -1]) {
    ellip(mb, [0.3, 0.1, sz * 0.07], [0.02, 0.02, 0.016], { n:3, m:6, col:fc([0.08, 0.08, 0.06]) });
    // the front 'legs' (pectoral fins) bent out to the side and down to the sand, and the smaller hind pair under the body
    tube(mb, { n:5, m:5, path:t => [0.1 - t * 0.05, -0.02 - t * 0.09, sz * (0.18 + t * 0.12)], r:t => 0.03 - t * 0.012, col:fc(back), anim:t => [0, t * 0.3, 0, 0] });
    fin(mb, [[0, 0.03], [0.05, 0.02], [0.05, -0.03], [0, -0.03]], { origin:[0.05, -0.11, sz * 0.3], ua:[1, 0, 0], va:[0, 0, 1], col:fc(back) });
    tube(mb, { n:4, m:5, path:t => [0.18 - t * 0.04, -0.06 - t * 0.06, sz * (0.08 + t * 0.03)], r:t => 0.02 - t * 0.008, col:fc(back) });
  }
  return mb;
}
function mkMimicStriped() {
  // the mimic octopus's own look: brown and white bands round the arms
  return mkOctopus({ skin:[0.85, 0.78, 0.68], mott:[0.35, 0.22, 0.14], pat:p => Math.sin(Math.hypot(p[0], p[2]) * 70) > 0.1 ? [0.32, 0.2, 0.12] : [0.9, 0.85, 0.75] });
}
function mkMimicFlat() {
  // impersonating a flatfish (a sole, many of which are poisonous): arms pulled back into a flat leaf, gliding over the sand
  const mb = new MB(), c1 = [0.32, 0.2, 0.12], c2 = [0.9, 0.85, 0.75];
  ellip(mb, [0, 0.02, 0], [0.4, 0.03, 0.18], { n:6, m:20, col:(u, v, p) => Math.sin(p[0] * 40) > 0.2 ? c1 : c2 });
  for (const sz of [1, -1]) ellip(mb, [0.32, 0.06, sz * 0.03], [0.02, 0.02, 0.015], { n:3, m:6, col:fc([0.05, 0.05, 0.05]) });
  return mb;
}
function mkMimicSnake() {
  // impersonating a banded sea snake: body and six arms hidden in a hole, two arms stretched out in opposite directions
  const mb = new MB(), c1 = [0.12, 0.08, 0.06], c2 = [0.95, 0.9, 0.82];
  for (const dir of [1, -1]) tube(mb, { n:30, m:5, path:t => [dir * (0.02 + t * 0.55), 0.015, 0.06 * Math.sin(t * 7 + dir)], r:t => 0.022 * (1 - t * 0.6), col:t => fract(t * 9) < 0.45 ? c1 : c2, anim:t => [0, 0, t * 0.4, 0] });
  ellip(mb, [0, 0, 0], [0.04, 0.01, 0.04], { n:3, m:8, col:fc([0.05, 0.04, 0.03]) });
  return mb;
}
function mkMimicLion() {
  // impersonating a lionfish: arms spread out round it like venomous spines, banded and trailing
  const mb = new MB(), c1 = [0.32, 0.2, 0.12], c2 = [0.95, 0.9, 0.82];
  ellip(mb, [0, 0.08, 0], [0.09, 0.07, 0.07], { n:6, m:10, col:fc(c1) });
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, up = 0.2 + 0.25 * (k % 2);
    tube(mb, { n:12, m:4, path:t => [Math.cos(a) * t * 0.4, 0.08 + t * up * 0.4, Math.sin(a) * t * 0.4], r:t => 0.016 * (1 - t * 0.7), col:t => fract(t * 6) < 0.5 ? c1 : c2, anim:t => [0, 0, t * 0.3, 0] }); }
  return mb;
}
function mkFrogfish() {
  // giant frogfish (Antennarius commerson), one unit long: a lumpy, round, sponge-like body in bright yellow, a huge upturned mouth,
  // a lure (the esca) on a rod above its eyes, and leg-like pectoral fins it props itself up on
  const yel = [1.0, 0.82, 0.15], spot = [0.85, 0.55, 0.1];
  const mb = fish({ H:0.36, W:0.26, tm:0.45, nose:0.22, ped:0.3, bodyLen:0.75, back:yel, belly:[1.0, 0.9, 0.45], eye:[0.14, 0.42, 0.035], n:18, m:14,
    pattern:(t, sy, sz, p) => { const n = Math.sin(p[0] * 45 + p[1] * 20) * Math.sin(p[2] * 40 + p[1] * 35); return n > 0.55 ? spot : null; },
    tail:'round', tailH:0.2, tailCol:yel, dorsal:[{ at:0.45, len:0.35, h:0.14, col:yel }], anal:[{ at:0.6, len:0.15, h:0.1, col:yel }],
    pect:{ at:0.38, len:0.16, w:0.09, down:0.9, col:yel } });
  // the mouth, opening upwards, and the lure on its rod
  ellip(mb, [0.38, 0.08, 0], [0.06, 0.03, 0.14], { n:4, m:10, col:fc([0.3, 0.15, 0.08]) });
  tube(mb, { n:5, m:4, path:t => [0.33 + t * 0.12, 0.3 + t * 0.12, 0], r:0.009, col:fc(yel), anim:t => [0, 0, t * 0.6, 0] });
  ellip(mb, [0.46, 0.43, 0], [0.025, 0.02, 0.02], { n:3, m:6, col:fc([1.0, 0.95, 0.85]), anim:() => [0, 0, 0.6, 0] });
  // warty lumps all over, like a sponge
  const r = rng(3141); for (let k = 0; k < 40; k++) { const t = r(), a = r() * TAU, x = 0.42 - t * 0.6, rr = 0.25 * Math.sin(Math.min(1, t * 2) * PI / 2);
    ellip(mb, [x, Math.cos(a) * rr * 0.35 + 0.02, Math.sin(a) * rr * 0.25], [0.018, 0.018, 0.018], { n:3, m:5, col:fc(r() < 0.5 ? spot : yel) }); }
  return mb;
}
function mkFeatherStar() {
  // a feather star (comatulid crinoid), in metres, about 30 cm across: a small central cup and a crown of ten long feathery arms,
  // here swimming: the arms beat up and down in alternating sets of five
  const mb = new MB(), cols = [[1.0, 0.75, 0.15], [0.95, 0.35, 0.15]], r = rng(888);
  ellip(mb, [0, 0, 0], [0.025, 0.02, 0.025], { n:4, m:8, col:fc([0.6, 0.35, 0.15]) });
  for (let k = 0; k < 10; k++) {
    const a = k / 10 * TAU, col = cols[k % 2], L = 0.15 + r() * 0.03, up = k % 2 ? 1 : -1;
    const path = t => [Math.cos(a) * (0.02 + t * L), Math.sin(t * PI * 0.7) * 0.04 - t * t * 0.02, Math.sin(a) * (0.02 + t * L)];
    tube(mb, { n:10, m:3, path, r:t => 0.004 * (1 - t * 0.5), col:fc(col), anim:t => [0, t * up * 1.2, 0, 0] });
    for (let j = 1; j < 14; j++) { const t = j / 14, p = path(t), sd = vnorm([-Math.sin(a), 0, Math.cos(a)]);
      for (const s of [1, -1]) tube(mb, { n:1, m:3, path:u => vadd(p, vmul(vadd(vmul(sd, s), [0, 0.3, 0]), u * 0.018 * (1 - t * 0.5))), r:0.0015, col:fc(col), anim:() => [0, t * up * 1.2, 0, 0] }); }
  }
  return mb;
}
function mkStargazer() {
  // a stargazer (Uranoscopus), in metres, about 35 cm long, buried in sand: only the boxy top of its head shows, eyes on top looking
  // straight up, an upturned mouth with fringed lips; the sand piled round it
  const mb = new MB(), skin = [0.26, 0.22, 0.17], spot = [0.6, 0.56, 0.46], sand = [0.32, 0.29, 0.22];
  ellip(mb, [0, 0, 0], [0.11, 0.035, 0.08], { n:6, m:12, shape:p => [p[0], Math.max(p[1], -0.005), p[2]], col:(u, v, p) => Math.sin(p[0] * 120) * Math.sin(p[2] * 110) > 0.5 ? spot : skin });
  for (const sz of [1, -1]) { ellip(mb, [0.02, 0.036, sz * 0.026], [0.02, 0.016, 0.018], { n:5, m:8, col:(u, v, p) => p[1] > 0.044 ? [0.01, 0.01, 0.01] : [1.0, 0.92, 0.6] }); }
  // the upturned mouth and its fringe of lips
  ellip(mb, [0.095, 0.026, 0], [0.016, 0.022, 0.06], { n:4, m:8, col:fc([0.02, 0.015, 0.01]) });
  for (let k = 0; k < 14; k++) { const z = -0.05 + k * 0.0077; tube(mb, { n:1, m:3, path:t => [0.11 + t * 0.01, 0.045 + t * 0.008, z], r:0.002, col:fc([0.95, 0.9, 0.8]), anim:() => [0, 0, 0.1, 0] }); }
  return mb;
}
function mkNurseShark() {
  // nurse shark, one unit long: brown, blunt broad head with two fleshy barbels by the nostrils, small mouth, rounded fins,
  // two dorsal fins far back, a long upper tail lobe
  const brown = [0.3, 0.22, 0.14], belly = [0.5, 0.4, 0.28];
  const mb = fish({ H:0.09, W:0.1, tm:0.3, nose:0.3, ped:0.1, bodyLen:0.8, back:brown, belly, eye:[0.06, 0.25, 0.01], e:2.1,
    camber:t => -0.06 * Math.sin(t * PI),
    tail:'shark', tailH:0.09, tailL:0.24, tailCol:brown, dorsal:[{ at:0.5, len:0.1, h:0.06, col:brown }, { at:0.64, len:0.08, h:0.045, col:brown }],
    anal:[{ at:0.66, len:0.06, h:0.03, col:brown }], pect:{ at:0.24, len:0.13, w:0.07, down:0.6, back:0.3, y:-0.5, col:brown }, pelv:{ at:0.48, len:0.06, w:0.04, y:-0.7 } });
  for (const sz of [1, -1]) tube(mb, { n:3, m:4, path:t => [0.48 + t * 0.01, -0.03 - t * 0.025, sz * 0.025], r:0.004, col:fc(brown) });   // barbels
  return mb;
}
function mkCrownOfThorns() {
  // a crown-of-thorns starfish on a table coral, in metres: sixteen arms bristling with red-tipped spines, draped over the coral's
  // plate, which is bleached white where it has already fed and still brown-green beyond
  const mb = new MB(), live = [0.45, 0.36, 0.18], dead = [0.88, 0.87, 0.83], skin = [0.26, 0.1, 0.24], spine = [0.95, 0.3, 0.2], tip = [1.0, 0.75, 0.35];
  const S = [0.08, 0.47, 0.04];
  tube(mb, { n:4, m:8, path:t => [0, t * 0.38, 0], r:t => 0.07 - t * 0.03, col:fc([0.6, 0.58, 0.5]) });
  ellip(mb, [0, 0.38, 0], [0.55, 0.035, 0.48], { n:6, m:28, shape:p => [p[0], p[1] + 0.02 * Math.sin(p[0] * 30) * Math.sin(p[2] * 27), p[2]],
    col:(u, v, p) => Math.hypot(p[0] - S[0], p[2] - S[2]) < 0.36 + 0.04 * Math.sin(Math.atan2(p[2], p[0]) * 7) ? dead : live });
  ellip(mb, S, [0.15, 0.045, 0.15], { n:6, m:14, col:fc(skin) });
  const r = rng(77);
  for (let k = 0; k < 16; k++) {
    const a = k / 16 * TAU + 0.1, L = 0.13 + r() * 0.03, d = [Math.cos(a), 0, Math.sin(a)];
    const at = t => [S[0] + d[0] * (0.12 + t * L), S[1] - 0.01 - t * t * 0.025, S[2] + d[2] * (0.12 + t * L)];
    tube(mb, { n:6, m:5, path:at, r:t => 0.04 * (1 - t * 0.6), col:fc(skin), anim:t => [0, 0, t * 0.15, 0] });
    for (let j = 1; j <= 4; j++) {
      const p = at(j / 5), out = vnorm([d[0] * 0.5 + (r() - 0.5) * 0.4, 1, d[2] * 0.5 + (r() - 0.5) * 0.4]), ls = 0.05 * (1 - j * 0.12);
      tube(mb, { n:2, m:3, path:t => vmad(p, out, t * ls), r:t => 0.006 * (1 - t * 0.8), col:t => t > 0.6 ? tip : spine, anim:() => [0, 0, j / 5 * 0.15, 0] });
    }
  }
  for (let k = 0; k < 24; k++) { const a = r() * TAU, d = r() * 0.11, p = [S[0] + Math.cos(a) * d, S[1] + 0.035, S[2] + Math.sin(a) * d], out = vnorm([(r() - 0.5) * 0.6, 1, (r() - 0.5) * 0.6]);
    tube(mb, { n:2, m:3, path:t => vmad(p, out, t * 0.05), r:t => 0.006 * (1 - t * 0.8), col:t => t > 0.6 ? tip : spine }); }
  return mb;
}
function mkSwordfish() {
  // a swordfish: a long, flat bill a third of its length, a stiff sickle of a dorsal fin, long low pectorals, no pelvic fins, no
  // scales as an adult; dark bronze-purple above, paler below, and a huge eye (kept warm, with the brain, by a heater organ behind it)
  const back = [0.24, 0.17, 0.22], belly = [0.72, 0.7, 0.68];
  const mb = fish({ H:0.075, W:0.06, tm:0.3, nose:0.8, ped:0.05, bodyLen:0.66, back, belly, eye:[0.06, 0.15, 0.02], eyeCol:[0.08, 0.12, 0.2],
    pattern:(t, sy) => mixc(belly, back, smooth(-0.25, 0.15, sy)),
    tail:'lunate', tailH:0.2, tailL:0.14, tailCol:back,
    dorsal:[{ at:0.13, len:0.11, h:0.17, col:back, pts:[[0, 0], [0.1, 1], [-0.25, 0.95], [-0.45, 0.35], [-1, 0]] }, { at:0.9, len:0.02, h:0.025, col:back }],
    anal:[{ at:0.62, len:0.06, h:0.05, col:back }, { at:0.9, len:0.02, h:0.025, col:back }],
    pect:{ at:0.2, len:0.17, w:0.03, down:0.75, back:0.6, y:-0.55, col:back } });
  // the sword: flat, not round like a marlin's spear, and sharp-edged
  loft(mb, { n:10, m:8, sec:t => ({ x:0.83 - t * 0.35, y:-0.004, w:0.004 + 0.024 * t, h:0.002 + 0.009 * t, e:2 }), col:fc(mixc(back, belly, 0.2)), anim:() => [0, 0, 0, 0] });
  return mb;
}
function mkIcefish() {
  // a blackfin icefish: a ghostly pale body with dusky bands, a long flat crocodile snout, big eyes, black fins, broad fan pectorals,
  // and long pelvic fins it props itself on; its gills are white, because its blood has no red cells
  const pale = [0.86, 0.86, 0.84], band = [0.36, 0.35, 0.36], black = [0.07, 0.07, 0.08], gillW = [0.99, 0.99, 0.97];
  return fish({ H:0.07, W:0.075, tm:0.36, nose:0.28, ped:0.12, bodyLen:0.86, back:pale, belly:pale, eye:[0.17, 0.4, 0.028], e:2.3,
    hShape:t => lerp(0.42, 1, smooth(0.02, 0.32, t)), wShape:t => lerp(0.8, 1, smooth(0, 0.3, t)),
    pattern:(t, sy) => t > 0.24 && t < 0.29 && sy > -0.5 && sy < 0.4 ? gillW : (t > 0.32 && Math.sin(t * 26) > 0.55 && sy > -0.3 ? band : null),
    tail:'truncate', tailH:0.075, tailL:0.09, tailCol:black,
    dorsal:[{ at:0.33, len:0.08, h:0.08, col:black }, { at:0.45, len:0.38, h:0.045, col:black }], anal:[{ at:0.52, len:0.3, h:0.04, col:black }],
    pect:{ at:0.3, len:0.15, w:0.11, down:0.2, back:0.4, y:-0.2, col:[0.25, 0.25, 0.27] }, pelv:{ at:0.28, len:0.17, w:0.05, y:-0.85, col:black } });
}
function mkBobtail() {
  // a Hawaiian bobtail squid, one unit long (about 3 cm): a round mantle with two ear-like fins, big eyes, eight short arms,
  // speckled with pigment, and the light organ on its underside glowing faint blue with its bacteria
  const mb = new MB(), skin = [0.88, 0.72, 0.55], spot = [0.55, 0.25, 0.12];
  const sp = p => Math.sin(p[0] * 90) * Math.sin(p[1] * 80 + p[2] * 85) > 0.45 ? spot : skin;
  ellip(mb, [0.1, 0, 0], [0.24, 0.19, 0.2], { n:10, m:14, col:(u, v, p) => sp(p), anim:() => [0, 0, 0, 0.08] });
  for (const sz of [1, -1]) ellip(mb, [0.12, 0.03, sz * 0.22], [0.11, 0.02, 0.09], { n:5, m:10, col:fc(skin), anim:() => [0, 0.6, 0, 0] });
  ellip(mb, [-0.17, 0, 0], [0.11, 0.14, 0.17], { n:8, m:12, col:(u, v, p) => sp(p) });
  for (const sz of [1, -1]) ellip(mb, [-0.15, 0.04, sz * 0.13], [0.07, 0.07, 0.05], { n:5, m:8, col:fc([0.04, 0.05, 0.08]) });
  ellip(mb, [0.06, -0.16, 0], [0.11, 0.04, 0.09], { n:5, m:10, col:fc([...BIO, 1.2]) });
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * TAU + 0.2;
    tube(mb, { n:6, m:4, path:t => [-0.27 - t * 0.2, Math.cos(a) * (0.03 + t * 0.06), Math.sin(a) * (0.03 + t * 0.06)], r:t => 0.025 * (1 - t * 0.8), col:fc(skin), anim:t => [0, 0, t * 0.25, 0] });
  }
  return mb;
}
function mkPygmyFan() {
  // a sea fan (Muricella), in metres, branching in the y-z plane: pink branches dotted with red knobs (its polyps), the same knobs a
  // pygmy seahorse living on it grows over its own body
  const mb = new MB(), pink = [0.95, 0.5, 0.55], knob = [0.95, 0.22, 0.28], r = rng(919);
  const sway = p => [0, 0, Math.max(0, p[1]) * 0.35, 0];
  const branch = (p, a, len, rad, depth) => {
    const bend = (r() - 0.5) * 0.3, at = t => [0, p[1] + Math.cos(a + bend * t) * len * t, p[2] + Math.sin(a + bend * t) * len * t];
    tube(mb, { n:5, m:4, path:at, r:t => rad * (1 - t * 0.3), col:fc(pink), anim:t => sway(at(t)) });
    for (let k = 0; k < Math.ceil(len * 40); k++) { const q = at(r()); ellip(mb, [(r() - 0.5) * 0.008, q[1], q[2]], [0.0055, 0.0055, 0.0055], { n:3, m:5, col:fc(knob), anim:() => sway(q) }); }
    if (depth > 0) { const e = at(1); for (const s of [-1, 1]) branch(e, a + s * (0.32 + r() * 0.2), len * (0.68 + r() * 0.12), rad * 0.75, depth - 1); }
  };
  for (const a of [-0.55, -0.15, 0.2, 0.6]) branch([0, 0, 0], a, 0.2, 0.007, 4);
  return mb;
}
function mkElephantSeal() {
  // a northern elephant seal bull, one unit long, head at +x: a huge spindle of blubber, grey-brown, short fore flippers, hind flippers
  // that sweep side to side to swim, big dark eyes for the deep, and the drooping, trunk-like nose that names it
  const mb = new MB(), back = [0.74, 0.7, 0.64], belly = [0.86, 0.83, 0.78], dark = [0.42, 0.37, 0.32];
  loft(mb, { n:28, m:16, sec:t => {
      const f = t < 0.2 ? 0.55 + 0.45 * Math.sin(t / 0.2 * PI / 2) : 1 - 0.85 * Math.pow((t - 0.2) / 0.8, 1.8);
      return { x:0.34 - t * 0.78, y:0, w:0.15 * f, h:0.15 * f, e:2 };
    },
    col:(t, u, p, sy) => sy < -0.3 ? belly : (t < 0.18 && Math.sin(p[0] * 90) * Math.sin(p[2] * 80) > 0.5 ? dark : back), anim:t => [0.15 + t * 0.85, 0, 0, 0] });
  ellip(mb, [0.38, 0.01, 0], [0.09, 0.085, 0.085], { n:8, m:12, col:fc(back), anim:() => [0.08, 0, 0, 0] });
  tube(mb, { n:6, m:8, path:t => [0.45 + t * 0.07, 0.02 - t * t * 0.06, 0], r:t => 0.05 - t * 0.012, col:t => t > 0.9 ? dark : back, anim:() => [0.04, 0, 0, 0] });   // the nose
  for (const sz of [1, -1]) {
    ellip(mb, [0.43, 0.04, sz * 0.06], [0.022, 0.022, 0.012], { n:3, m:6, col:fc([0.02, 0.02, 0.03]), anim:() => [0.08, 0, 0, 0] });
    fin(mb, [[0, 0.02], [0.08, 0.025], [0.13, 0.0], [0.07, -0.02], [0, -0.02]], { origin:[0.22, -0.09, sz * 0.11], ua:vnorm([-0.4, -0.5, sz * 0.75]), va:[1, 0, 0], col:fc(dark), anim:a => [0.3, a * 1.5, 0, 0] });
    fin(mb, [[0, 0.015], [0.07, 0.05], [0.13, 0.06], [0.14, -0.01], [0.07, -0.02], [0, -0.015]], { origin:[-0.44, 0, sz * 0.015], ua:vnorm([-1, 0, sz * 0.35]), va:vnorm([0, 1, sz * 0.3]),
      col:fc(dark), anim:() => [1, 0, 0, 0] });
  }
  return mb;
}
function mkThresher() {
  // a pelagic thresher's body, one unit nose to tail tip with the tail drawn apart (mkThresherTail): the body is only the front
  // half, metallic blue-grey above and white below, with a big eye, a tall first dorsal, long pectorals and a tiny second dorsal
  const back = [0.6, 0.6, 0.72], belly = [0.95, 0.95, 0.92];
  return fish({ H:0.05, W:0.042, tm:0.36, nose:0.62, ped:0.16, bodyLen:0.5, back, belly, eye:[0.09, 0.22, 0.011], tail:'none',
    pattern:(t, sy) => mixc(belly, back, smooth(-0.3, -0.05, sy)),
    dorsal:[{ at:0.38, len:0.075, h:0.07, sweep:0.6, col:back }, { at:0.92, len:0.015, h:0.012, col:back }], anal:[{ at:0.93, len:0.015, h:0.012, col:back }],
    pect:{ at:0.26, len:0.14, w:0.045, down:0.6, back:0.55, y:-0.5, col:back }, pelv:{ at:0.7, len:0.04, w:0.025, y:-0.7, col:back },
    extra:(mb, b) => gills(mb, b, 0.24, 5) });
}
function mkThresherTail() {
  // the scythe: an upper tail lobe as long as the body, swept up a little, and a small lower lobe; its root is at the origin
  const mb = new MB(), col = [0.58, 0.58, 0.7], n = 18;
  const spine = t => [0.015 - 0.5 * t, 0.01 + 0.16 * t * (0.6 + 0.4 * t), 0], w = t => 0.04 * Math.pow(1 - t, 1.3) + 0.004;
  const anim = p => [sAt(p[0]), 0, 0, 0];
  let prev = null;
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = spine(t), b = [a[0] + w(t) * 0.35, a[1] - w(t), 0];
    const row = [mb.v(a, col, anim(a)), mb.v(b, col, anim(b))];
    if (prev) mb.quad(prev[0], row[0], row[1], prev[1]);
    prev = row;
  }
  fin(mb, [[0.015, 0.0], [-0.035, -0.05], [-0.055, -0.045], [-0.02, 0.005]], { ua:[1, 0, 0], va:[0, 1, 0], col:fc(col), anim:finA });
  return mb;
}
function addShallows(REEF) {
  const KELP = BYKEY.kelp.anchor;
  addObj({ key:'cuttlefish', name:'cuttlefish', type:'broadclub cuttlefish · Sepia latimanus', kind:'cephs', floor:[REEF[0] + 2.2, REEF[1] + 2.6, 2.4], size:0.4, rad:0.3, yaw:2.4,
    fact:'Colourblind, yet it matches its background in under a second: millions of pigment sacs in its skin are opened and closed by muscle. To mesmerise prey it sends bands of colour rippling over its body, the "passing cloud" display.',
    motion:{ type:'hover', amp:0.1, turn:0.4 },
    // every so often it hunts: the passing cloud ripples over it for a few seconds
    post:(o, t) => { const c = (t + 7) % 26, e = smooth(0, 1.5, c) * smooth(9, 7, c); o.parts[0].fx = e > 0.01 ? [-e, 0, 0, 0] : null; },
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
    views:[{ d:[0.25, 0.2, 1], k:2.2, hold:10, drift:0.025 }, { d:[0.8, 0.5, 0.6], k:2.4, hold:8, drift:0.03 }] });
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
  addObj({ key:'giantoctopus', name:'giant Pacific octopus', type:'Enteroctopus dofleini', kind:'cephs', floor:[KELP[0] - 5, KELP[2] - 6, 0.3], size:4, vsize:2.5, rad:1.6, yaw:2.2,
    fact:'The largest octopus: arms spanning up to about 6 m and weights over 50 kg have been recorded. It can squeeze through any gap larger than its beak, solves puzzles and recognises individual people. It lives only three to five years, and the female dies after guarding her eggs for months.',
    motion:{ type:'crawl', R:1.5, v:0.06 },
    parts:[part(() => mkOctopus({ skin:[0.85, 0.3, 0.2], mott:[0.6, 0.15, 0.12] }), { scale:2.2, mat:M_SKIN, sway:[0.1, 0.6, 3, 0], pulse:[0.5, 0.2, 0, 0] })],
    views:[{ d:[0.6, 0.45, 1], k:1.6, hold:10, drift:0.02 }, { d:[1, 0.15, 0.3], k:1.4, hold:9, drift:0.02 }] });
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
  addObj({ key:'goby', name:'goby and pistol shrimp', label:'goby and shrimp', type:'a partnership · Cryptocentrus and Alpheus', kind:'fish', floor:[REEF[0] + 33, REEF[1] - 9, 0], size:0.1, vsize:0.25, rad:0.25, yaw:0.4,
    fact:'The nearly blind shrimp digs and keeps up a burrow for both of them; the goby stands guard at its mouth. The shrimp keeps an antenna on the goby, and a flick of the goby’s tail sends both diving inside. The shrimp’s snapping claw is one of the loudest sounds in the sea.',
    // the shrimp bulldozes sand out of the burrow and goes back in for more; the goby stays on watch
    post:(o, t) => { const c = (t * 0.25) % 1, out = smooth(0, 0.25, c) * smooth(0.75, 0.5, c); o.parts[2].off = [0.02 + out * 0.1, 0.012 + out * 0.004, 0.02 - out * 0.06]; },
    parts:[part(mkBurrow, { mat:[1, 0.2, 1, 0.2] }),
      part(mkWatchmanGoby, { scale:0.1, off:[0.08, 0.03, -0.03], mat:M_SKIN, swim:[0.03, 0.8, 0.9, 0], swim2:[0, 2, 0, 0] }),
      part(mkPistolShrimp, { scale:0.045, off:[0.06, 0.012, 0.04], mat:M_SKIN, sway:[0.004, 2, 30, 0] })],
    views:[{ d:[0.3, 0.06, 1], k:1.2, hold:10, drift:0.02, off:[0.07, 0.03, 0] }, { d:[1, 0.08, 0.3], k:1.1, hold:9, drift:0.02, off:[0.07, 0.02, 0] }] });
  addObj({ key:'grouper', name:'grouper at a cleaning station', label:'cleaning station', type:'giant grouper · Epinephelus lanceolatus, and cleaner wrasses', kind:'fish', floor:[REEF[0] - 2, REEF[1] + 5, 1.4], size:1.6, rad:1.2, yaw:0.3,
    fact:'Big fish queue at cleaning stations, where cleaner wrasses pick parasites and dead skin off them, even from inside their mouths and gills. A grouper that could swallow the cleaner whole holds still, mouth open, and lets it work.',
    motion:{ type:'hover', amp:0.05, turn:0.15 },
    // the cleaners flit over its head, along its flanks, in and out of its open mouth
    post:(o, t) => { for (let i = 1; i < o.parts.length; i++) { const p = o.parts[i], u = t * (0.35 + i * 0.07) + i * 2.1;
      const s = 0.5 + 0.5 * Math.sin(u), side = i % 2 ? 1 : -1;
      p.off = [lerp(0.75, -0.1, s) + 0.08 * Math.sin(u * 3.1), 0.05 + 0.1 * Math.sin(u * 1.7 + i), side * (0.14 + 0.06 * Math.sin(u * 2.3))]; } },
    parts:[part(mkGrouper, { scale:1.6, mat:M_SKIN, ...FISH_SWIM(0.015, 0.4, 0.8, 2) }),
      ...[0, 1, 2, 3].map(i => part(mkCleanerWrasse, { scale:0.1, off:[0.7, 0.05, 0.15], mat:M_SKIN, ...FISH_SWIM(0.07, 4, 1, 1.6) }))],
    views:[{ d:[0.4, -0.3, 1], k:1.5, hold:11, drift:0.02, off:[0.3, 0, 0] }, { d:[0.8, -0.15, 0.7], k:0.9, hold:9, drift:0.02, off:[0.5, 0, 0] }] });
  addObj({ key:'blueringed', name:'blue-ringed octopus', type:'Hapalochlaena lunulata', kind:'cephs', floor:[REEF[0] + 34, REEF[1] - 6, 0.03], size:0.15, rad:0.12, yaw:1.2,
    fact:'Golf-ball sized and one of the most venomous animals in the sea: its saliva carries tetrodotoxin, enough to kill adult humans, with no antidote. At rest it is a dull tan; alarmed, its rings flash an electric blue, a warning to keep away.',
    motion:{ type:'hover', amp:0.01, turn:0.4 },
    post:o => { const e = smooth(0, 0.6, o.reactEnv || 0); o.parts[0].mat[2] = lerp(0.02, 4.5, e) * (0.6 + 0.4 * Math.sin((o.reactAge || 0) * 9)); },
    parts:[part(mkBlueRinged, { scale:0.15, mat:[1, 0.35, 0.04, 0.6], sway:[0.1, 0.8, 3, 0], pulse:[0.6, 0.25, 0, 0] })],
    views:[{ d:[0.6, 0.6, 1], k:2.2, hold:10, drift:0.025 }, { d:[1, 0.25, -0.2], k:2.0, hold:8, drift:0.02 }] });
  addObj({ key:'flounder', name:'peacock flounder', type:'Bothus lunatus', kind:'fish', floor:[REEF[0] + 31, REEF[1] - 2, 0.02], size:0.4, rad:0.3, yaw:0.9,
    fact:'It hatches as an ordinary upright fish; then one eye migrates over the top of its head, and it settles on its side on the bottom with both eyes facing up. It changes its colour and pattern to match the sand in a few seconds, and can move each eye on its own.',
    motion:{ type:'hover', amp:0.005, turn:0.05 },
    parts:[part(mkFlounder, { scale:0.4, mat:[1, 0.3, 1, 0.4], swim:[0.02, 0.6, 0.8, 0], swim2:[0, 2, 0, 0] })],
    views:[{ d:[0.3, 0.9, 0.5], k:2.0, hold:10, drift:0.02 }, { d:[1, 0.3, 0.4], k:2.0, hold:9, drift:0.02 }] });
  addObj({ key:'xmastree', name:'Christmas tree worms', type:'Spirobranchus giganteus', kind:'floor', floor:[REEF[0] + 2.5, REEF[1] - 3.2, 0], size:0.08, vsize:0.4, rad:0.3,
    fact:'Each worm lives in a tube it bores into living coral, and shows only two spiral crowns of feathery tentacles that catch plankton and serve as gills. A shadow or a ripple and they snap back into the tube in a split second, sealing it with a lid.',
    // they vanish into their tubes when you come close, and slowly come out again
    post:o => { const close = vlen(vsub(vadd(o.pos, [0, 0.18, 0]), CAM.pos)) < 0.12 && VIEW.mode !== 'flight'; o.hide = clamp((o.hide || 0) + (close ? 0.25 : -0.006), 0, 1);
      o.parts[1].scale = lerp(1, 0.05, o.hide); o.parts[1].off = [0, -0.03 * o.hide, 0];
      if (o.hide > 0.95 && !o._told) { o._told = true; toast('Snap: the Christmas tree worms have shot back into their tubes. Keep still a while and they will come out again.', 4500); }
      if (o.hide < 0.1) o._told = false; },
    parts:[part(mkXmasBoulder, { mat:[1, 0.2, 1, 0.3] }), part(mkXmasWorms, { mat:M_SKIN, sway:[0.004, 1.2, 40, 0] })],
    views:[{ d:[0.4, 0.5, 1], k:0.75, hold:10, drift:0.025, off:[0, 0.17, 0] }, { d:[1, 0.35, 0.3], k:0.7, hold:9, drift:0.025, off:[0, 0.17, 0] }] });
  addObj({ key:'giantclam', name:'giant clam', type:'Tridacna gigas', kind:'floor', floor:[REEF[0], REEF[1] - 14, 0], size:1.1, rad:0.7, yaw:0.4,
    fact:'The largest clam alive, over 1 m across and 200 kg, and over 100 years old. Algae living in its mantle feed it with sugar from sunlight, which is why it lies open to the sky in shallow water. Despite the legends it cannot trap a diver: it closes far too slowly.',
    // it draws in its mantle and closes up when a shadow falls over it
    post:o => { const close = vlen(vsub(vadd(o.pos, [0, 0.4, 0]), CAM.pos)) < 0.9 && VIEW.mode !== 'flight'; o.hide = clamp((o.hide || 0) + (close ? 0.03 : -0.004), 0, 1);
      const p = o.parts[1]; p.scale = 1.1 * lerp(1, 0.75, o.hide); p.off = [0, -0.18 * o.hide, 0]; },
    parts:[part(mkClamShell, { scale:1.1, mat:[1, 0.3, 1, 0.5] }), part(mkClamMantle, { scale:1.1, mat:[1, 0.6, 1.2, 0.9], sway:[0.008, 0.6, 6, 0] })],
    views:[{ d:[0.4, 0.55, 1], k:2.6, hold:10, drift:0.02, off:[0, 0.3, 0] }, { d:[1, 0.3, 0.2], k:2.2, hold:9, drift:0.02, off:[0, 0.3, 0] }] });
  addObj({ key:'seakrait', name:'banded sea krait', type:'Laticauda colubrina · a sea snake', kind:'fish', floor:[REEF[0] + 5, REEF[1] - 9, 1.6], size:1.2, rad:0.8,
    fact:'A sea snake that hunts eels in reef crevices by day and comes ashore to digest, rest and lay its eggs. Its venom is many times stronger than a cobra’s, but it is shy and very rarely bites. It holds its breath for an hour or more, steering with its paddle tail.',
    motion:{ type:'eight', R:2.5, v:0.45, bob:0.3, bank:0.1 },
    parts:[part(mkSeaKrait, { scale:1.2, mat:M_SKIN, swim:[0.07, 0.9, 1.6, 0], swim2:[0, 1.1, 0, 0] })],
    views:[{ d:[0.3, -0.35, 1], k:1.3, hold:10, drift:0.02 }, { d:[1, -0.15, 0.35], k:1.2, hold:9, drift:0.02 }] });
  addObj({ key:'coconutoctopus', name:'coconut octopus', type:'veined octopus · Amphioctopus marginatus', kind:'cephs', floor:[REEF[0] + 32, REEF[1] - 8, 0], size:0.15, vsize:0.3, rad:0.15, yaw:1.2,
    fact:'It collects discarded coconut shells and carries them under its body across open sand, walking on two arms, then assembles them into a shelter to hide in. Carrying something for later use was one of the first records of tool use by an invertebrate.',
    motion:{ type:'crawl', R:0.25, v:0.03 },
    parts:[part(mkCoconutOctopus, { mat:M_SKIN, sway:[0.004, 0.8, 30, 0] })],
    views:[{ d:[0.4, 0.12, 1], k:1.1, hold:10, drift:0.025, off:[0.04, 0.06, 0] }, { d:[1, 0.08, 0.3], k:1.0, hold:9, drift:0.025, off:[0.04, 0.06, 0] }] });
  addObj({ key:'torpedo', name:'Atlantic torpedo ray', label:'electric ray', type:'Tetronarce nobiliana', kind:'sharks', floor:[REEF[0] + 35, REEF[1] - 12, 0.04], size:1.2, rad:0.7, yaw:1.4,
    fact:'Two organs in its disc, built from modified muscle and stacked like batteries, can deliver over 200 volts: enough to knock a diver down. It lies buried in sand and stuns passing fish, then swallows them whole. The ancient Greeks used electric rays to numb pain.',
    motion:{ type:'hover', amp:0.01, turn:0.05 },
    parts:[part(mkTorpedoRay, { scale:1.2, mat:M_SKIN, swim2:[0, 2, 0.008, 0.3] })],
    views:[{ d:[0.4, 0.7, 1], k:1.8, hold:10, drift:0.02 }, { d:[1, 0.25, 0.4], k:1.6, hold:9, drift:0.02 }] });
  addObj({ key:'mimic', name:'mimic octopus', type:'Thaumoctopus mimicus', kind:'cephs', floor:[REEF[0] + 37, REEF[1] - 2, 0.02], size:0.6, rad:0.4, yaw:0.3,
    fact:'Out on open sand with nowhere to hide, it impersonates animals its attackers fear: it flattens into a poisonous sole, spreads its arms like a lionfish’s venomous spines, or hides in a hole and waves two banded arms like a sea snake. It seems to choose the disguise for the threat.',
    // disturbed, it cycles through its impersonations
    post:o => { const age = o.reactT > 0 ? o.reactAge : -1, k = age < 0 ? 0 : 1 + Math.floor(age / 3) % 3;
      o.parts.forEach((p, i) => { p.mimicOn = i === k; }); },
    parts:[part(mkMimicStriped, { scale:0.6, mat:M_SKIN, sway:[0.1, 0.8, 3, 0], pulse:[0.6, 0.25, 0, 0], show:o => o.parts[0].mimicOn !== false }),
      part(mkMimicFlat, { scale:0.6, mat:M_SKIN, swim:[0.03, 1.2, 0.8, 0], swim2:[1, 2, 0, 0], show:o => o.parts[1].mimicOn }),
      part(mkMimicLion, { scale:0.6, mat:M_SKIN, sway:[0.04, 0.8, 4, 0], show:o => o.parts[2].mimicOn }),
      part(mkMimicSnake, { scale:0.6, mat:M_SKIN, sway:[0.03, 0.9, 4, 0], show:o => o.parts[3].mimicOn })],
    views:[{ d:[0.4, 0.55, 1], k:2.0, hold:10, drift:0.02 }, { d:[1, 0.3, 0.3], k:1.8, hold:9, drift:0.02 }] });
  addObj({ key:'frogfish', name:'giant frogfish', type:'Antennarius commerson', kind:'fish', floor:[REEF[0] - 6, REEF[1] - 5, 0], size:0.35, rad:0.3, yaw:2.6,
    fact:'It sits still for days, coloured and textured like the sponge it rests on, twitching a lure above its mouth. When a fish comes close it opens its mouth to twelve times its size and swallows it in about six thousandths of a second, among the fastest strikes of any animal.',
    motion:{ type:'hover', amp:0.003, turn:0.02 },
    // every so often it waves its lure to tempt prey
    post:(o, t) => { o.parts[0].sway[0] = 0.02 + 0.06 * Math.max(0, Math.sin(t * 0.4)); },
    parts:[part(mkFrogfish, { scale:0.35, mat:M_SKIN, sway:[0.03, 4, 3, 0] })],
    views:[{ d:[0.6, 0.2, 1], k:2.0, hold:10, drift:0.02, off:[0, 0.08, 0] }, { d:[1, 0.15, 0.3], k:1.8, hold:9, drift:0.02, off:[0, 0.08, 0] }] });
  addObj({ key:'featherstar', name:'feather star', type:'a swimming crinoid · Comanthina', kind:'floor', floor:[REEF[0] + 1, REEF[1] + 8, 1.4], size:0.3, rad:0.25,
    fact:'A relative of starfish and sea urchins, with ten or more feathery arms that catch drifting food. Most of the time it clings to coral with hooked feet, but it can also swim, beating its arms up and down in two alternating sets of five, a rare sight on a night dive.',
    motion:{ type:'drift', amp:0.25, tilt:0.2 },
    parts:[part(mkFeatherStar, { mat:M_SKIN, swim2:[0, 2, 0.05, 0.7] })],
    views:[{ d:[0.4, 0.3, 1], k:1.6, hold:10, drift:0.025 }, { d:[0.3, 0.9, 0.4], k:1.6, hold:9, drift:0.025 }] });
  addObj({ key:'stargazer', name:'stargazer', type:'Uranoscopus · an ambush hunter', kind:'fish', floor:[REEF[0] + 33.5, REEF[1] - 5, 0], size:0.35, vsize:0.35, rad:0.25, yaw:2,
    fact:'It buries itself in sand with only its eyes and mouth showing, both on top of its head, and waits for a fish to swim over. Then it lunges upward and swallows it. Some stargazers can give an electric shock from organs behind their eyes, and it has venomous spines above its pectoral fins.',
    motion:{ type:'hover', amp:0.001, turn:0.01 },
    parts:[part(mkStargazer, { mat:M_SKIN })],
    views:[{ d:[1, 0.25, 0.15], k:0.8, hold:10, drift:0.02 }, { d:[0.8, 0.7, 0.6], k:0.9, hold:9, drift:0.02 }] });
  addObj({ key:'nurseshark', name:'nurse shark', type:'Ginglymostoma cirratum', kind:'sharks', floor:[REEF[0] + 6, REEF[1] - 18, 0.25], size:2.6, rad:1.4, yaw:0.4,
    fact:'Unlike most sharks it can pump water over its gills while lying still, so by day it rests on the sand or under ledges, often piled up with others. At night it hunts, sucking prey out of crevices with a force strong enough to pull a conch from its shell.',
    motion:{ type:'hover', amp:0.02, turn:0.08 },
    parts:[part(mkNurseShark, { scale:2.6, mat:M_SKIN, ...FISH_SWIM(0.015, 0.25, 0.8, 2.4) })],
    views:[{ d:[1, 0.12, 0.3], k:1.0, hold:10, drift:0.02 }, { d:[0.3, 0.35, 1], k:1.3, hold:9, drift:0.02 }] });
  addObj({ key:'thresher', name:'pelagic thresher shark', label:'thresher shark', type:'Alopias pelagicus, hunting sardines', kind:'sharks', at:[3300, 300, 12], size:3, vsize:8, rad:7,
    fact:'Half its length is tail. Hunting a school of sardines it swims in close, brakes, dips its head and whips the tail up and over like a trebuchet, so fast that the water fizzes with bubbles, stunning several fish at once to eat at leisure. The hunt was first filmed in 2013 off Malapascua in the Philippines, where divers see threshers at dawn on Monad Shoal being cleaned by small wrasse.',
    motion:{ type:'still', fn:thresherPost },
    parts:[part(mkSardine, { inst:schoolMill(260, 1.9, 1.6, 1771, 0.9), school:[0, 0.2, 1, 0], mat:M_SILVER, shy:6, ...FISH_SWIM(0.08, 4, 0.9, 1.8) }),
      part(mkThresher, { scale:3, body:true, fwd:function () { return this._f || [1, 0, 0]; }, up:function () { return this._u || [0, 1, 0]; }, mat:M_SKIN, ...FISH_SWIM(0.03, 0.8, 0.85, 2.2) }),
      part(mkThresherTail, { scale:3, tail:true, fwd:function () { return this._f || [1, 0, 0]; }, up:function () { return this._u || [0, 1, 0]; }, mat:M_SKIN, ...FISH_SWIM(0.03, 0.8, 0.85, 2.2) })],
    views:[{ d:[0.3, 0.05, 1], k:1.9, hold:16, drift:0.01, frame:'world' }, { d:[1, 0.45, 0.4], k:1.8, hold:14, drift:0.01, frame:'world' }] });
  addObj({ key:'swordfish', name:'swordfish', type:'Xiphias gladius', kind:'fish', at:[16000, 200, 450], size:3, rad:1.8,
    fact:'By day it hunts squid and fish far down in the cold dark, past 1,000 m at times; at night it rises close to the surface. A heater organ, a block of modified eye muscle, keeps its eyes and brain up to about 15 °C warmer than the water, which keeps its eyesight quick in the cold. It slashes at prey with its flat sword rather than spearing it.',
    motion:{ type:'circle', R:10, v:1.6, bob:3, bank:0.15 },
    // (deep by day, near the surface by night)
    post:o => { const d = lerp(450, 40, smooth(0.15, 0.85, night())); o.pos = [o.pos[0], o.pos[1] - o.anchor[1] - d, o.pos[2]]; },
    parts:[part(mkSwordfish, { scale:2.6, mat:M_SKIN, ...FISH_SWIM(0.045, 1.2, 0.85, 2.4) })], views:SIDE });
  addObj({ key:'icefish', name:'blackfin icefish', label:'icefish', type:'Chaenocephalus aceratus', kind:'fish', floor:[12200, 900, 0.12], size:0.6, rad:0.4, yaw:1.2,
    fact:'The only backboned animals with no red blood cells: their blood is clear and their gills white. Antarctic water near freezing holds so much oxygen that they get by on what dissolves straight into the plasma, with a big heart and wide vessels to pump a lot of it. Their blood also carries antifreeze proteins.',
    motion:{ type:'hover', amp:0.03, turn:0.15 },
    parts:[part(mkIcefish, { scale:0.6, mat:M_SKIN, ...FISH_SWIM(0.02, 0.4, 0.9, 2) })],
    views:[{ d:[0.3, 0.2, 1], k:2.2, hold:10, drift:0.02 }, { d:[1, 0.35, 0.4], k:2.2, hold:9, drift:0.02 }, { d:[0.9, 0.05, -0.1], k:1.8, hold:8, drift:0.02 }] });
  addObj({ key:'bobtail', name:'Hawaiian bobtail squid', label:'bobtail squid', type:'Euprymna scolopes · out only at night', kind:'cephs', floor:[REEF[0] + 12, REEF[1] + 20, 0.3], size:0.035, vsize:0.055, rad:0.06,
    fact:'By day it lies buried in the sand. At night it hunts in the shallows, and a light organ on its belly, filled with glowing bacteria, shines down to match the moonlight from above, so it casts no shadow for hunters below. Each dawn it squirts out most of the bacteria and buries itself again; the few left behind regrow by dusk.',
    motion:{ type:'hover', amp:0.06, turn:0.5 },
    parts:[part(mkBobtail, { scale:0.035, mat:M_SKIN, swim2:[0, 2, 0.04, 1.2] })],
    views:[{ d:[0.3, 0.15, 1], k:2.4, hold:10, drift:0.025 }, { d:[0.3, -0.7, 0.6], k:2.4, hold:9, drift:0.025 }] });
  addObj({ key:'pygmyseahorse', name:'pygmy seahorses', type:'Hippocampus bargibanti · on a sea fan', kind:'fish', floor:[REEF[0] - 17, REEF[1] + 11, 0], size:0.02, vsize:0.9, rad:0.6, yaw:0,
    fact:'About 2 cm long, they spend their whole adult lives on a single sea fan, and their bodies grow pink or yellow bumps that match its polyps so exactly that the first ones were only noticed in 1969, on a sea fan already collected for a museum. Can you spot the two here?',
    parts:[part(mkPygmyFan, { mat:M_SOLID, sway:[0.01, 0.4, 2, 0] }),
      ...[[0.55, 0.12, 1], [0.3, -0.2, -1]].map(([y, z, d]) => part(() => mkSeahorse({ skin:[0.96, 0.6, 0.66], ring:[0.9, 0.5, 0.58], knobs:[0.95, 0.22, 0.28] }),
        { scale:0.02, off:[0.012, y, z], fwd:o => vmul(o.side, d), up:o => o.up, mat:M_SOLID, sway:[0.02, 1, 4, 0] }))],
    views:[{ d:[1, 0.15, 0.25], k:1.5, hold:10, drift:0.015, off:[0, 0.4, 0] }, { d:[1, 0.08, 0.3], k:0.09, hold:9, drift:0.01, off:[0.01, 0.55, 0.12] }, { d:[1, 0.1, -0.3], k:0.09, hold:9, drift:0.01, off:[0.01, 0.3, -0.2] }] });
  addObj({ key:'elephantseal', name:'northern elephant seal', label:'elephant seal', type:'Mirounga angustirostris · asleep on a dive', kind:'air', at:[15000, 1100, 200], size:4.5, rad:2.4,
    fact:'At sea for months, it naps on deep dives instead of on the surface, where sharks and orcas hunt. Glide down, roll onto its back, and drift deeper in slow loops like a falling leaf: tags that read seals’ brain waves found them sleeping this way in 2023, for only about two hours a day. Then it wakes and swims back up to breathe.',
    motion:{ type:'still', fn:sealSleepPost },
    // (asleep, it stops swimming and just drifts)
    post:o => { o.parts[0].swim[0] = o.asleep ? 0.004 : 0.03; },
    readout:() => BYKEY.elephantseal.asleep ? 'asleep: upside down, drifting deeper in slow loops' : BYKEY.elephantseal.fwd[1] > 0 ? 'awake, swimming up to breathe' : 'gliding down into the dark',
    parts:[part(mkElephantSeal, { scale:4.5, mat:M_SKIN, swim:[0.03, 0.4, 0.6, 0], swim2:[1, 2.2, 0, 0] })],
    views:[{ d:[0.3, 0.15, 1], k:1.4, hold:12, drift:0.015 }, { d:[1, -0.4, 0.3], k:1.4, hold:10, drift:0.015 }] });
  addObj({ key:'cots', name:'crown-of-thorns starfish', label:'crown-of-thorns', type:'Acanthaster · eating a table coral', kind:'floor', floor:[REEF[0] - 14, REEF[1] + 14, 0], size:0.6, vsize:1.1, rad:0.6, yaw:0.3,
    fact:'A starfish up to about 80 cm across with as many as 21 arms, covered in venomous spines. It eats coral by pushing its stomach out over a colony and digesting the living tissue, leaving a bare white skeleton. In outbreaks, tens of thousands strip whole reefs; they are one of the main causes of coral loss on the Great Barrier Reef.',
    parts:[part(mkCrownOfThorns, { mat:M_SOLID, sway:[0.004, 0.4, 3, 0] })],
    views:[{ d:[0.5, 1.1, 0.7], k:2.1, hold:10, drift:0.02, off:[0, 0.42, 0] }, { d:[1, 0.35, 0.2], k:1.8, hold:9, drift:0.02, off:[0, 0.42, 0] }] });
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
  addObj({ key:'leatherback', name:'leatherback turtle', type:'Dermochelys coriacea', kind:'air', at:[9000, -600, 90], size:2, rad:1.6,
    fact:'The largest turtle alive, up to about 2 m long and over 500 kg, and the deepest-diving: past 1,000 m. Its shell is not bone plates but leathery skin over a mosaic of small bones. It lives on jellyfish, and keeps warm enough to hunt them in waters near freezing.',
    motion:{ type:'circle', R:18, v:0.8, bob:3, bank:0.12 },
    parts:[part(mkLeatherback, { scale:2, mat:M_SKIN, swim2:[0, 2, 0.28, 0.25] })],
    views:[{ d:[0.2, 0.15, 1], k:1.9, hold:10, drift:0.02 }, { d:[0.5, 0.8, 0.5], k:1.8, hold:9, drift:0.02 }, { d:[1, -0.3, 0.4], k:2, hold:8, drift:0.02 }] });
  addObj({ key:'baskingshark', name:'basking shark', type:'Cetorhinus maximus · the second-largest fish', kind:'sharks', at:[6800, 1400, 4], size:8, rad:5,
    fact:'The second-largest fish, up to about 10 m, swims slowly at the surface with its mouth wide open, straining up to 2,000 tonnes of water an hour for plankton through bristly gill rakers. Its gill slits nearly encircle its head.',
    motion:{ type:'circle', R:30, v:1.0, bob:0.6, bank:0.05 },
    parts:[part(mkBaskingShark, { scale:8, mat:M_SKIN, ...FISH_SWIM(0.04, 0.28, 0.8, 2.4) })],
    views:[{ d:[0.6, 0.05, 1], k:1.4, hold:11, drift:0.015 }, { d:[1, -0.05, 0.25], k:1.0, hold:9, drift:0.015 }, { d:[0.2, 0.6, 1], k:1.6, hold:9, drift:0.015 }] });
  addObj({ key:'tuna', name:'Atlantic bluefin tuna', label:'bluefin tuna', type:'a school of Thunnus thynnus', kind:'fish', at:[7600, -900, 35], size:2.2, vsize:14, rad:14, predator:true,
    fact:'Built like torpedoes, they swim nonstop their whole lives, keeping their muscles warmer than the sea, and cross the Atlantic in a few months. A big one is 3 m and 600 kg. Folding their fins into slots in the body, they can burst to around 70 km/h.',
    parts:[part(mkTuna, { inst:schoolMill(40, 9, 3, 911, 2.2), school:[0, 2.2, 1, 0], mat:M_SILVER, shy:4, ...FISH_SWIM(0.035, 1.8, 0.8, 2.6) })],
    views:[{ d:[0.3, 0.05, 1], k:0.9, hold:10, drift:0.02, frame:'world' }, { d:[0.2, -0.7, 0.5], k:0.8, hold:9, drift:0.02, frame:'world' }] });
  addObj({ key:'batfish', name:'red-lipped batfish', type:'Ogcocephalus darwini', kind:'fish', floor:[3150, -520, 0.06], size:0.25, rad:0.2, yaw:0.8,
    fact:'A poor swimmer that walks across the sand on fins shaped like legs. A little horn on its snout carries a lure it flicks out to attract small fish and shrimp. Nobody knows for sure what the bright red lips are for: perhaps for recognising each other when spawning.',
    motion:{ type:'crawl', R:0.4, v:0.03 },
    parts:[part(mkBatfish, { scale:0.25, mat:M_SKIN })],
    views:[{ d:[1, 0.12, 0.45], k:1.3, hold:10, drift:0.025, off:[0.05, 0.02, 0] }, { d:[0.5, 0.5, 1], k:1.5, hold:9, drift:0.025, off:[0.05, 0, 0] }] });
  addObj({ key:'orca', name:'orcas', type:'killer whales · Orcinus orca', kind:'air', at:[7800, 900, 15], size:7, vsize:9, rad:10, predator:true,
    fact:'The largest dolphin, and a top predator in every ocean. Each pod has its own calls and hunting methods passed down through generations: some wash seals off ice floes with waves, others hunt great white sharks for their livers.',
    motion:{ type:'circle', R:40, v:3, bob:2, bank:0.12 },
    parts:[0, 1, 2].map(i => part(mkOrca, { scale:7 - i * 1.2, off:[[0, 0, 0], [-6, 1.2, 4], [-9, -0.6, -4.5]][i], mat:M_SKIN, swim:[0.04, 0.4 + i * 0.05, 0.7, i * 1.7], swim2:[1, 2.5, 0, 0] })),
    views:[{ d:[0.2, 0.1, 1], k:1.6, hold:11, drift:0.02 }, { d:[1, 0.3, 0.4], k:1.3, hold:9, drift:0.02 }, { d:[0.3, -0.6, 0.6], k:1.5, hold:9, drift:0.02 }] });
}
