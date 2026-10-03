// ---- more fish: the odd, the ancient and the beautiful. Each in its own frame, one unit long, snout at +x.

function mkBlobfish() {
  // in its own home, 600 to 1,200 m down, a big soft head on a tapering body; the droopy "blob" is what decompression does to it
  const skin = [0.62, 0.44, 0.42], pale = [0.72, 0.56, 0.53];
  const mb = fish({ H:0.22, W:0.24, tm:0.24, nose:0.28, ped:0.06, bodyLen:0.94, taper:0.55, back:skin, belly:pale, eye:[0.1, 0.35, 0.02], eyeCol:[0.05, 0.04, 0.05], eyeRing:skin,
    camber:t => -0.2 * Math.sin(Math.min(1, t * 2) * PI / 2) * (1 - t),
    pattern:(t, sy, sz) => mixc(pale, skin, smooth(-0.6, 0.6, sy)) .map((c, i) => c * (0.92 + 0.08 * Math.sin(t * 37 + sz * 9))),
    tail:'round', tailH:0.06, tailL:0.07, tailCol:skin, dorsal:[{ at:0.45, len:0.4, h:0.04, col:skin }], anal:[{ at:0.5, len:0.35, h:0.035, col:skin }],
    pect:{ at:0.28, len:0.16, w:0.16, down:0.5, back:0.4, y:-0.4, col:pale },
    extra:(mb) => {
      // the soft bulb over the mouth, and the wide down-turned mouth beneath it
      ellip(mb, [0.45, -0.01, 0], [0.07, 0.065, 0.085], { n:8, m:12, col:fc(mixc(skin, [1, 0.7, 0.68], 0.4)), anim:p => swimA(p) });
      tube(mb, { n:10, m:5, path:t => { const a = (t - 0.5) * 2.2; return [0.4 + Math.cos(a) * 0.04, -0.12 - Math.abs(Math.sin(a)) * 0.03, Math.sin(a) * 0.13]; }, r:0.012, col:fc([0.55, 0.3, 0.32]), anim:p => [0.1, 0, 0, 0] });
    } });
  return mb;
}
function mkOarfish() {
  // a ribbon of silver up to 8 m long, a red fin down its whole back, a red crest and two long red oar-like pelvic rays
  const silver = [0.86, 0.88, 0.92], red = [0.95, 0.15, 0.18];
  return fish({ H:0.034, W:0.007, tm:0.06, nose:0.45, ped:0.15, bodyLen:0.985, taper:0.7, back:silver, belly:silver, eye:[0.012, 0.25, 0.006], n:90, m:10,
    pattern:(t, sy) => (Math.sin(t * 160) > 0.82 && sy > -0.3) ? [0.3, 0.35, 0.45] : (Math.abs(Math.sin(t * 70 + sy * 4)) < 0.08 ? [0.45, 0.5, 0.6] : null),
    tail:'none', dorsal:[{ at:0.03, len:0.95, h:0.016, col:red, pts:[[0, 0], [-0.02, 1], [-0.98, 0.8], [-1, 0]] }],
    extra:(mb) => {
      for (let k = 0; k < 7; k++) tube(mb, { n:8, m:3, path:t => [0.49 - k * 0.004 - t * 0.02, 0.03 + t * (0.06 + k * 0.012), 0], r:0.0025, col:fc(red), anim:t => [0.02, 0, t * 0.6, 0] });
      for (const sz of [1, -1]) {
        tube(mb, { n:12, m:3, path:t => [0.47 - t * 0.12, -0.03 - t * 0.05, sz * (0.004 + t * 0.02)], r:0.0018, col:fc(red), anim:t => [0.05, 0, t * 0.5, 0] });
        ellip(mb, [0.35, -0.08, sz * 0.024], [0.008, 0.004, 0.002], { n:3, m:5, col:fc(red), anim:() => [0.15, 0, 0.5, 0] });
      }
    } });
}
function mkCoelacanth() {
  // steel blue with pale blotches, fleshy lobed fins that move like walking legs, a three-lobed tail
  const blue = [0.2, 0.28, 0.4], blot = [0.82, 0.85, 0.9];
  const blotchy = (t, sy, sz) => { const n = Math.sin(t * 41 + sz * 3) * Math.sin(sy * 13 + t * 17); return n > 0.72 ? blot : null; };
  return fish({ H:0.13, W:0.075, tm:0.36, nose:0.45, ped:0.28, bodyLen:0.82, back:blue, belly:[0.3, 0.38, 0.5], eye:[0.09, 0.2, 0.025], eyeCol:[0.3, 0.6, 0.4], e:2.1,
    pattern:blotchy, tail:'none',
    dorsal:[{ at:0.28, len:0.1, h:0.11, col:blue, pts:[[0, 0], [-0.1, 1], [-0.6, 0.8], [-1, 0]] }, { at:0.64, len:0.08, h:0.08, col:blue, pts:[[0, 0], [-0.3, 0.9], [-0.8, 0.8], [-1, 0]] }],
    anal:[{ at:0.66, len:0.08, h:0.08, col:blue, pts:[[0, 0], [-0.3, 0.9], [-0.8, 0.8], [-1, 0]] }],
    extra:(mb, b) => {
      // the tail: upper and lower lobes, and the small lobe between them (diphycercal)
      fin(mb, [[0.02, 0.03], [-0.08, 0.13], [-0.15, 0.1], [-0.14, 0.02], [-0.22, 0.03], [-0.24, -0.03], [-0.14, -0.02], [-0.15, -0.1], [-0.08, -0.13], [0.02, -0.03]],
        { origin:[b.tx + 0.04, 0, 0], ua:[1, 0, 0], va:[0, 1, 0], col:(a, c) => blotchy(a, c * 4, 0) || blue, anim:finA, center:[-0.08, 0] });
      // lobed paired fins: a fleshy stalk with a fin fringe, front and rear
      for (const [t, y, down] of [[0.26, -0.45, 0.6], [0.55, -0.85, 0.9]]) for (const sz of [1, -1]) {
        const x = 0.5 - t * b.bl, z = sz * b.W * b.prof(t) * 0.8;
        tube(mb, { n:5, m:6, path:u => [x - u * 0.09, y * b.H * b.prof(t) - u * down * 0.05, z + sz * u * 0.06], r:u => 0.018 * (1 - u * 0.6), col:fc(blue), anim:u => [sAt(x), 0, u * 0.3, 0] });
        fin(mb, [[0, 0.02], [0.05, 0.04], [0.09, 0], [0.05, -0.04], [0, -0.02]], { origin:[x - 0.06, y * b.H * b.prof(t) - down * 0.03, z + sz * 0.04], ua:vnorm([-0.3, -down * 0.3, sz]), va:[1, 0, 0], col:fc(blue), anim:(a, c) => [sAt(x), 0, 0.3, 0] });
      }
    } });
}
function mkGoblinShark() {
  // pink with blood showing through the skin, a long flat blade of a snout, and jaws that sling forward to strike
  const pink = [0.9, 0.62, 0.62], pale = [0.95, 0.78, 0.76], tooth = [0.95, 0.95, 0.9];
  return fish({ H:0.07, W:0.06, tm:0.32, nose:0.7, ped:0.1, bodyLen:0.72, back:pink, belly:pale, eye:[0.15, 0.2, 0.008], e:2.2,
    hShape:t => lerp(0.55, 1, smooth(0.05, 0.25, t)), tail:'none',
    dorsal:[{ at:0.42, len:0.08, h:0.05, col:pink }, { at:0.58, len:0.07, h:0.045, col:pink }], anal:[{ at:0.62, len:0.1, h:0.035, col:pink }],
    pect:{ at:0.27, len:0.08, w:0.05, down:0.6, back:0.4, y:-0.5, col:pink }, pelv:{ at:0.5, len:0.05, w:0.04, y:-0.8, col:pink },
    extra:(mb, b) => {
      // the long low tail, almost all upper lobe
      fin(mb, [[0.02, 0.02], [-0.12, 0.05], [-0.3, 0.06], [-0.29, 0.0], [-0.12, -0.035], [-0.04, -0.02]], { origin:[b.tx + 0.02, 0, 0], ua:[1, 0, 0], va:[0, 1, 0], col:fc(pink), anim:finA, center:[-0.1, 0] });
      // the flat blade of a snout
      loft(mb, { n:8, m:10, sec:t => ({ x:0.6 - t * 0.14, y:0.02, w:0.03 * Math.sin(Math.min(1, t * 1.6 + 0.15) * PI / 2), h:0.008 + t * 0.012, e:2 }), col:fc(pale), anim:(t, u, p) => swimA(p) });
      // the jaws, slung forward, studded with nail-like teeth
      loft(mb, { n:8, m:10, capStart:true, sec:t => ({ x:0.52 - t * 0.12, y:-0.06 + t * 0.02, w:0.032, h:0.014, e:2 }), col:fc([0.75, 0.35, 0.38]), anim:(t, u, p) => swimA(p) });
      for (let k = 0; k < 9; k++) for (const sz of [1, -1]) { const x = 0.51 - k * 0.012; tube(mb, { n:1, m:3, path:t => [x, -0.05 + t * 0.018, sz * (0.026 - k * 0.0015)], r:t => 0.002 * (1 - t), col:fc(tooth) }); }
    } });
}
function mkFrilledShark() {
  // eel-like and dark brown, six frilled gill slits ringing the throat, a broad snake-like head with its mouth at the very front
  const brown = [0.38, 0.3, 0.26], frill = [0.62, 0.36, 0.34];
  return fish({ H:0.042, W:0.04, tm:0.18, nose:0.35, ped:0.25, bodyLen:0.8, taper:0.6, back:brown, belly:[0.48, 0.4, 0.36], eye:[0.04, 0.3, 0.012], eyeCol:[0.2, 0.3, 0.25], n:50,
    tail:'none', dorsal:[{ at:0.72, len:0.08, h:0.025 }], anal:[{ at:0.66, len:0.12, h:0.025 }],
    pect:{ at:0.17, len:0.05, w:0.03, down:0.5, back:0.5, y:-0.5 }, pelv:{ at:0.6, len:0.05, w:0.03, y:-0.8 },
    extra:(mb, b) => {
      fin(mb, [[0.02, 0.02], [-0.1, 0.03], [-0.22, 0.02], [-0.21, -0.025], [-0.1, -0.03], [0.02, -0.02]], { origin:[b.tx + 0.02, 0, 0], ua:[1, 0, 0], va:[0, 1, 0], col:fc(brown), anim:finA, center:[-0.1, 0] });
      for (let k = 0; k < 6; k++) {
        const t = 0.08 + k * 0.016, x = 0.5 - t * b.bl, r = b.H * b.prof(t);
        tube(mb, { n:20, m:4, path:u => { const a = u * TAU; return [x - 0.004 * Math.abs(Math.sin(a * 5)), Math.sin(a) * r * 1.05, Math.cos(a) * b.W * b.prof(t) * 1.05]; }, r:0.004, col:fc(frill), anim:() => [sAt(x), 0, 0, 0], capEnd:false });
      }
      // the wide mouth at the tip of the snout, rows of three-pronged teeth glinting
      fin(mb, [[0, -0.025], [0.012, 0], [0, 0.025], [-0.02, 0]].map(([a, c]) => [c, a]), { origin:[0.495, -0.008, 0], ua:[0, 0, 1], va:[1, -0.3, 0], col:fc([0.12, 0.08, 0.07]), anim:finA, rings:1 });
    } });
}
function mkFangtooth() {
  // a small, deep, dark fish with the largest teeth for its size of any fish
  const skin = [0.2, 0.15, 0.13], fang = [0.95, 0.94, 0.88];
  return fish({ H:0.22, W:0.1, tm:0.3, nose:0.25, ped:0.14, bodyLen:0.84, back:skin, belly:[0.26, 0.2, 0.17], eye:[0.12, 0.35, 0.03], eyeCol:[0.12, 0.2, 0.2],
    hShape:t => lerp(1.15, 1, smooth(0.1, 0.4, t)), pattern:(t, sy, sz) => (Math.abs(Math.sin(t * 50 + sy * 6)) < 0.1 ? [0.12, 0.09, 0.08] : null),
    tail:'truncate', tailH:0.12, dorsal:[{ at:0.38, len:0.3, h:0.07 }], anal:[{ at:0.62, len:0.12, h:0.06 }], pect:{ at:0.3, len:0.12, w:0.07 },
    extra:(mb) => {
      fin(mb, [[0, -0.12], [0.03, 0], [0, 0.12], [-0.05, 0]].map(([a, c]) => [c, a]), { origin:[0.49, -0.05, 0], ua:[0, 0, 1], va:[1, -0.2, 0], col:fc([0.05, 0.03, 0.03]), anim:finA, rings:1 });
      for (const [x, z, y0, dir, L] of [[0.47, 0.035, -0.11, 1, 0.16], [0.47, -0.035, -0.11, 1, 0.16], [0.45, 0.06, 0.01, -1, 0.09], [0.45, -0.06, 0.01, -1, 0.09], [0.44, 0.075, -0.1, 1, 0.07], [0.44, -0.075, -0.1, 1, 0.07]])
        tube(mb, { n:4, m:4, path:t => [x + t * 0.01, y0 + dir * t * L, z], r:t => 0.008 * (1 - t), col:fc(fang), anim:() => [0.02, 0, 0, 0] });
    } });
}
function mkLionfish() {
  // red and white bands, great feathery fans for pectoral fins, venomous spines raised along its back
  const red = [0.75, 0.22, 0.12], white = [0.96, 0.92, 0.88];
  const bands = (t, sy) => Math.sin(t * 46 + sy * 2.5) > 0.15 ? red : white;
  return fish({ H:0.13, W:0.07, tm:0.32, nose:0.45, ped:0.22, bodyLen:0.8, back:red, belly:white, eye:[0.1, 0.3, 0.035], pattern:bands,
    tail:'round', tailH:0.11, tailPat:(a, c) => Math.sin(a * 120) > 0.3 ? red : white,
    anal:[{ at:0.6, len:0.15, h:0.08, pat:(a) => Math.sin(a * 140) > 0 ? red : white }],
    extra:(mb, b) => {
      // the dorsal spines, each with a scrap of membrane, banded
      for (let k = 0; k < 13; k++) {
        const t = 0.18 + k * 0.035, x = 0.5 - t * b.bl, y0 = b.H * b.prof(t) * 0.9, L = 0.13 + 0.05 * Math.sin(k * 0.5) - (k > 9 ? 0.06 : 0);
        tube(mb, { n:4, m:3, path:u => [x - u * 0.03, y0 + u * L, 0], r:u => 0.004 * (1 - u * 0.6), col:u => Math.sin(u * 20) > 0 ? red : white, anim:u => [sAt(x), 0, u * 0.15, 0] });
      }
      // the pectoral fans: long rays spread out like feathers
      for (const sz of [1, -1]) for (let k = 0; k < 11; k++) {
        const a = -0.4 + k * 0.13, x0 = 0.5 - 0.24 * b.bl;
        ribbon(mb, { n:6, path:u => [x0 - u * 0.32 * Math.cos(a) - 0.02, -0.02 - u * 0.2 * Math.sin(a + 0.3), sz * (0.04 + u * 0.22)], side:[1, 0.3, 0], w:u => 0.009 * (1 - u * 0.5),
          col:u => Math.sin(u * 30 + k) > 0.2 ? red : white, anim:u => [sAt(x0), 0, u * 0.25, 0] });
      }
      // little tentacles over the eyes
      for (const sz of [1, -1]) tube(mb, { n:4, m:3, path:u => [0.42, 0.06 + u * 0.06, sz * (0.03 + u * 0.02)], r:0.004, col:fc(white) });
    } });
}
function mkParrotfish() {
  // blue-green scales edged in pink, a beak of fused teeth for biting coral
  const teal = [0.15, 0.65, 0.6], pink = [0.95, 0.5, 0.6], beak = [0.95, 0.95, 0.85];
  return fish({ H:0.17, W:0.08, tm:0.35, nose:0.5, ped:0.28, bodyLen:0.82, back:teal, belly:[0.4, 0.75, 0.7], eye:[0.12, 0.3, 0.025],
    pattern:(t, sy, sz) => { const u = t * 26, v = sy * 7 + (Math.floor(u) % 2) * 0.5; return (Math.abs(u - Math.round(u)) < 0.12 || Math.abs(v - Math.round(v)) < 0.1) ? pink : (t < 0.12 && sy < 0 ? [0.95, 0.75, 0.4] : null); },
    tail:'lunate', tailH:0.13, tailCol:teal, tailPat:(a) => a < -0.12 ? pink : teal,
    dorsal:[{ at:0.22, len:0.6, h:0.06, col:pink, pts:[[0, 0], [-0.05, 1], [-0.95, 1], [-1, 0]] }], anal:[{ at:0.6, len:0.25, h:0.05, col:pink }],
    pect:{ at:0.26, len:0.12, w:0.06, col:teal }, pelv:{ at:0.33, len:0.06, w:0.03, y:-0.8, col:pink },
    extra:(mb) => ellip(mb, [0.49, -0.015, 0], [0.025, 0.035, 0.03], { n:5, m:8, col:fc(beak), anim:p => swimA(p) }) });
}
function mkCleanerShrimp() {
  // Pacific cleaner shrimp (Lysmata amboinensis), one unit long: a red stripe down a white-backed, golden body, long white antennae
  const mb = new MB(), gold = [1.0, 0.75, 0.25], red = [0.95, 0.15, 0.12], white = [1.0, 0.98, 0.95];
  loft(mb, { n:16, m:8, sec:t => { const w = 0.08 * Math.sin(Math.min(1, t * 2 + 0.2) * PI / 2) * (1 - t * 0.5); return { x:0.4 - t * 0.85, y:-0.04 * t * t, w, h:w, e:2 }; },
    col:(t, u, p, sy, sz) => Math.abs(sz) < 0.15 && sy > 0 ? white : (Math.abs(sz) < 0.4 && sy > 0 ? red : gold) });
  for (const sz of [1, -1]) {
    tube(mb, { n:10, m:3, path:t => [0.4 + t * 0.7, 0.04 + t * 0.15, sz * (0.02 + t * 0.15)], r:0.004, col:fc(white), anim:t => [0, 0, t * 0.5, 0] });
    for (let k = 0; k < 4; k++) tube(mb, { n:3, m:3, path:t => [0.2 - k * 0.1, -0.03 - t * 0.08, sz * (0.04 + t * 0.06)], r:0.006, col:fc(gold), anim:t => [0, 0, t * 0.3, 0] });
  }
  fin(mb, [[0, 0.04], [-0.1, 0.09], [-0.12, -0.09], [0, -0.04]], { origin:[-0.44, -0.04, 0], ua:[1, 0, 0], va:[0, 0, 1], col:(a, b) => Math.abs(b) < 0.03 ? red : gold });
  return mb;
}
function mkMoray() {
  // a long muscular eel, mottled, mouth open as it breathes (and to show the teeth); a second set of jaws waits in its throat
  const skin = [0.45, 0.42, 0.2], spot = [0.12, 0.1, 0.06], tooth = [0.95, 0.95, 0.9];
  return fish({ H:0.05, W:0.035, tm:0.12, nose:0.4, ped:0.35, bodyLen:0.97, taper:0.6, back:skin, belly:[0.55, 0.52, 0.3], eye:[0.04, 0.4, 0.012], eyeCol:[0.6, 0.55, 0.1], n:50,
    pattern:(t, sy, sz) => Math.sin(t * 90 + Math.sin(sy * 9) * 3) * Math.sin(sy * 17 + sz * 5 + t * 30) > 0.45 ? spot : null,
    tail:'none', dorsal:[{ at:0.12, len:0.85, h:0.02 }], anal:[{ at:0.5, len:0.47, h:0.015 }],
    extra:(mb) => {
      fin(mb, [[0, -0.022], [0.016, 0], [0, 0.022], [-0.03, 0]].map(([a, c]) => [c, a]), { origin:[0.48, -0.012, 0], ua:[0, 0, 1], va:[1, -0.5, 0], col:fc([0.35, 0.08, 0.08]), anim:finA, rings:1 });
      for (let k = 0; k < 6; k++) for (const sz of [1, -1]) tube(mb, { n:1, m:3, path:t => [0.47 - k * 0.006, -0.008 - t * 0.008, sz * 0.012], r:t => 0.0018 * (1 - t), col:fc(tooth) });
    } });
}
function mkGreenlandShark() {
  // heavy, slow and grey-brown, small fins, a blunt rounded snout; often a pale parasitic copepod trails from each eye
  const skin = [0.4, 0.38, 0.35], belly = [0.48, 0.46, 0.43];
  return fish({ H:0.085, W:0.085, tm:0.35, nose:0.4, ped:0.14, bodyLen:0.8, back:skin, belly, eye:[0.09, 0.22, 0.01], e:2.1,
    pattern:(t, sy, sz) => Math.sin(t * 70 + sz * 13) * Math.sin(sy * 19) > 0.7 ? [0.32, 0.3, 0.28] : null,
    tail:'shark', tailH:0.1, tailL:0.2, dorsal:[{ at:0.42, len:0.06, h:0.035 }, { at:0.62, len:0.06, h:0.03 }],
    pect:{ at:0.25, len:0.09, w:0.05, down:0.5, back:0.4, y:-0.5 }, pelv:{ at:0.6, len:0.05, w:0.03, y:-0.8 },
    extra:(mb, b) => {
      gills(mb, b, 0.18, 5);
      for (const sz of [1, -1]) tube(mb, { n:6, m:3, path:t => [0.45 - t * 0.04, 0.02 - t * 0.012, sz * (0.033 + t * 0.006)], r:0.003, col:fc([0.92, 0.9, 0.82]), anim:t => [0.05, 0, t * 0.3, 0] });
    } });
}
function mkFlyingFish() {
  // a slim silver-blue torpedo with pectoral fins as long as its body, spread like wings, and a tail whose lower lobe is longer
  const back = [0.12, 0.3, 0.65], silver = [0.88, 0.9, 0.95], wing = [0.55, 0.7, 0.9];
  return fish({ H:0.07, W:0.065, tm:0.35, nose:0.6, ped:0.15, bodyLen:0.82, back, belly:silver, eye:[0.08, 0.15, 0.03],
    tail:'none', dorsal:[{ at:0.62, len:0.1, h:0.04 }],
    pect:{ at:0.22, len:0.55, w:0.1, down:0.02, back:0.35, y:0.2, col:wing, pts:[[0, 0.04], [0, -0.04], [0.25, -0.12], [0.52, -0.2], [0.55, -0.15], [0.35, -0.02]] },
    pelv:{ at:0.55, len:0.2, w:0.04, down:0.05, back:0.3, y:-0.6, col:wing },
    extra:(mb, b) => fin(mb, [[0.01, 0.02], [-0.12, 0.08], [-0.18, 0.1], [-0.1, 0.0], [-0.24, -0.13], [-0.1, -0.06], [0.01, -0.02]], { origin:[b.tx + 0.02, 0, 0], ua:[1, 0, 0], va:[0, 1, 0], col:fc(back), anim:finA, center:[-0.08, 0] }) });
}
// flying fish leave the water: swim fast near the surface, burst out, glide a few seconds a metre above the waves, drop back in
function flyerMotion(o, t) {
  const A = o.anchor, m = o.motion, T = 9, u = (((t + (m.ph || 0)) % T) + T) % T / T;
  const yaw = (m.yaw || 0) + Math.floor((t + (m.ph || 0)) / T) * 2.4;
  const dir = [Math.cos(yaw), 0, Math.sin(yaw)], along = (u - 0.5) * 34;
  // under water for the first part of the cycle, then the glide: a low arc over the surface
  const glide = smooth(0.35, 0.42, u) * (1 - smooth(0.85, 0.92, u));
  const h = glide > 0 ? 1.1 * Math.sin(clamp((u - 0.38) / 0.52, 0, 1) * PI) * glide : 0;
  const y = lerp(-0.6, 0, smooth(0.25, 0.38, u)) * (1 - glide) + h + (u > 0.9 ? -0.6 * smooth(0.9, 1, u) : 0);
  o.pos = [A[0] + dir[0] * along, y, A[2] + dir[2] * along];
  const dy = 1.1 * PI / 0.52 * Math.cos(clamp((u - 0.38) / 0.52, 0, 1) * PI) * glide / 34;
  o.fwd = vnorm([dir[0], dy, dir[2]]); o.up = [0, 1, 0];
  const sd = vnorm(vcross(o.fwd, [0, 1, 0])); o.up = vnorm(vcross(sd, o.fwd)); o.side = vcross(o.fwd, o.up);
  o.flying = glide > 0.5;
}

function addMoreFish(REEF) {
  addObj({ key:'blobfish', name:'blobfish', type:'Psychrolutes marcidus', kind:'fish', floor:[13400, -150, 0.5], size:0.3, rad:0.22, yaw:0.8,
    fact:'Voted the world’s ugliest animal, but its famous droopy face is damage from being hauled up from the deep. At home, 600 to 1,200 m down, its jelly-like flesh is a little less dense than water, so it hovers over the floor with almost no muscle, eating whatever drifts by.',
    motion:{ type:'hover', amp:0.04, turn:0.25 },
    parts:[part(mkBlobfish, { scale:0.3, mat:[1, 0.5, 1, 0.3], ...FISH_SWIM(0.03, 0.4, 0.8, 2) })],
    views:[{ d:[0.55, 0.25, 1], k:2.8, hold:10, drift:0.02 }, { d:[0.1, 0.3, 1], k:3.0, hold:9, drift:0.02 }, { d:[1, 0.15, 0.35], k:2.4, hold:8, drift:0.015 }] });
  addObj({ key:'oarfish', name:'oarfish', type:'giant oarfish · Regalecus glesne', kind:'fish', at:[12500, 400, 250], size:8, rad:4.2,
    fact:'The longest bony fish, reliably measured to about 8 m. It hangs upright in the water, rippling the red fin that runs the length of its back, and is so rarely seen alive that stranded ones may lie behind old tales of sea serpents.',
    motion:{ type:'hover', amp:0.6, turn:0.2, pitch:1.4 },
    parts:[part(mkOarfish, { scale:8, mat:M_SILVER, ...FISH_SWIM(0.012, 0.35, 2.5, 1.0) })],
    views:[{ d:[0.15, 0.1, 1], k:1.2, hold:11, drift:0.02, frame:'world' }, { d:[0.3, -0.2, 1], k:0.35, hold:9, drift:0.02, frame:'world', off:[0, 3.2, 0] }, { d:[1, 0.3, 0.2], k:0.8, hold:8, drift:0.02, frame:'world' }] });
  addObj({ key:'coelacanth', name:'coelacanth', type:'a living fossil · Latimeria chalumnae', kind:'fish', floor:[10000, 600, 2.5], size:1.8, rad:1.1, yaw:2.2,
    fact:'Known only from 66-million-year-old fossils until a fisherman landed one off South Africa in 1938. It paddles its lobed fins in the same alternating pattern as a four-legged animal walking, and can live about a hundred years.',
    motion:{ type:'hover', amp:0.4, turn:0.3 },
    parts:[part(mkCoelacanth, { scale:1.8, mat:M_SKIN, ...FISH_SWIM(0.025, 0.4, 0.8, 2), sway:[0.03, 0.8, 1.5, 0] })], views:SIDE });
  addObj({ key:'goblinshark', name:'goblin shark', type:'Mitsukurina owstoni', kind:'sharks', at:[15800, -500, 900], size:3.2, rad:2,
    fact:'It catches prey by slinging its jaws far out of its head, one of the fastest jaw strikes known in sharks. Its pink colour is blood showing through thin, translucent skin.',
    motion:{ type:'circle', R:12, v:0.5, bob:1, bank:0.05 },
    parts:[part(mkGoblinShark, { scale:3.2, mat:M_SKIN, ...FISH_SWIM(0.04, 0.45, 0.85, 2.2) })],
    views:[{ d:[0.4, 0.1, 1], k:1.5, hold:10, drift:0.02 }, { d:[1, 0.1, 0.35], k:1.1, hold:9, drift:0.02 }, { d:[-0.6, 0.3, 0.8], k:1.6, hold:8, drift:0.02 }] });
  addObj({ key:'frilledshark', name:'frilled shark', type:'Chlamydoselachus anguineus', kind:'sharks', at:[14800, 350, 700], size:1.8, rad:1.1,
    fact:'An eel-like shark with six frilled gill slits and about 300 three-pronged teeth. Its pregnancy may last three and a half years, the longest known of any animal.',
    motion:{ type:'circle', R:6, v:0.35, bob:0.6, bank:0.05 },
    parts:[part(mkFrilledShark, { scale:1.8, mat:M_SKIN, ...FISH_SWIM(0.07, 0.45, 1.5, 1.2) })], views:[{ d:[0.2, 0.12, 1], k:1.3, hold:10, drift:0.02 }, { d:[0.9, 0.2, 0.5], k:1.2, hold:9, drift:0.02 }, { d:[-0.6, 0.4, 0.8], k:1.4, hold:8, drift:-0.02 }] });
  addObj({ key:'fangtooth', name:'fangtooth', type:'Anoplogaster cornuta', kind:'fish', at:[20500, 300, 2000], size:0.16, rad:0.12,
    fact:'For its size it has the largest teeth of any fish. The two longest are so big that it has sockets either side of its brain to hold them when its mouth closes.',
    motion:{ type:'hover', amp:0.03, turn:0.3 },
    parts:[part(mkFangtooth, { scale:0.16, mat:M_SKIN, ...FISH_SWIM(0.04, 1.2, 0.9, 2) })],
    views:[{ d:[0.3, 0.12, 1], k:2.4, hold:10, drift:0.02 }, { d:[1, 0.1, 0.5], k:2.6, hold:9, drift:0.02 }] });
  addObj({ key:'greenlandshark', name:'Greenland shark', type:'Somniosus microcephalus', kind:'sharks', at:[17200, 600, 1200], size:5, rad:3,
    fact:'The longest-lived vertebrate known: some are thought to be around 400 years old, growing barely a centimetre a year in near-freezing water. It cruises at a walking pace, one of the slowest fish for its size.',
    motion:{ type:'circle', R:25, v:0.3, bob:2, bank:0.04 },
    parts:[part(mkGreenlandShark, { scale:5, mat:M_SKIN, ...FISH_SWIM(0.035, 0.18, 0.8, 2.4) })], views:SIDE });
  addObj({ key:'lionfish', name:'lionfish', type:'red lionfish · Pterois volitans', kind:'fish', floor:[REEF[0] - 1.8, REEF[1] + 2.0, 0.7], size:0.3, rad:0.3, yaw:1.4,
    fact:'Its showy fins carry venomous spines. Native to the Indo-Pacific, it has invaded the Atlantic and the Caribbean, where it eats young reef fish faster than they can be replaced.',
    motion:{ type:'hover', amp:0.06, turn:0.4 },
    parts:[part(mkLionfish, { scale:0.3, mat:M_SKIN, sway:[0.015, 0.7, 6, 0], ...FISH_SWIM(0.02, 0.6, 0.8, 2) })],
    views:[{ d:[0.35, -0.3, 1], k:2.3, hold:10, drift:0.02 }, { d:[1, -0.15, 0.4], k:2.1, hold:9, drift:0.02 }] });
  addObj({ key:'parrotfish', name:'parrotfish', type:'Scarus · a reef parrotfish', kind:'fish', floor:[REEF[0] - 8, REEF[1] + 3, 1.8], size:0.6, rad:0.4,
    fact:'It bites algae off coral with a beak of fused teeth and grinds the stony coral into fine sand: a single big parrotfish can make hundreds of kilograms of sand a year. Many sleep at night inside a cocoon of their own mucus.',
    // by day it swims its circuit; at night it settles by a coral head and blows a bubble of mucus round itself to sleep in
    motion:{ type:'still', fn:(o, t) => {
      const A = o.anchor, n = night(), a = t * 0.35 / 3, R = 3 * (1 - n);
      o.pos = [A[0] + R * Math.cos(a), A[1] + 0.3 * Math.sin(t * 0.11) * (1 - n) - n * 1.2, A[2] + R * Math.sin(a)];
      const f = vnorm(vlerp([-Math.sin(a), 0, Math.cos(a)], [1, 0, 0], n)); o.fwd = f; o.up = [0, 1, 0]; o.side = vnorm(vcross(f, o.up));
      o.parts[0].swim[0] = 0.05 * (1 - n * 0.9); o.cocoon = n > 0.5; } },
    readout:() => BYKEY.parrotfish.cocoon ? 'asleep in its mucus cocoon: it takes about an hour to blow, and may hide its scent from moray eels' : 'by day it grazes; at night it sleeps in a cocoon of mucus',
    parts:[part(mkParrotfish, { scale:0.6, mat:M_SKIN, ...FISH_SWIM(0.05, 1.4, 0.9, 1.8) }),
      part(() => { const mb = new MB(); ellip(mb, [0, 0, 0], [0.62, 0.32, 0.3], { n:12, m:18, shape:p => [p[0] * (1 + 0.04 * Math.sin(p[1] * 30)), p[1], p[2]], col:fc([0.35, 0.42, 0.45, 0]) }); return mb; },
        { scale:0.6, mat:[0.07, 0.9, 0, 0.6], trans:true, sway:[0.01, 0.4, 4, 0], show:o => o.cocoon })], views:SIDE });
  addObj({ key:'moray', name:'moray eel', type:'giant moray · Gymnothorax javanicus', kind:'fish', floor:[REEF[0] - 2.4, REEF[1] - 1.4, 0.2], size:1.6, rad:0.9, yaw:-0.6,
    fact:'Morays have a second set of jaws in the throat that shoot forward to grab prey and drag it down. Giant morays sometimes hunt with groupers, which signal them with head-shakes. This one has cleaner shrimp picking parasites from its open mouth, safe from those jaws.',
    motion:{ type:'hover', amp:0.05, turn:0.25 },
    // cleaner shrimp picking over its head and in and out of its open mouth
    post:(o, t) => { for (let i = 1; i < o.parts.length; i++) { const p = o.parts[i], u = t * (0.2 + i * 0.05) + i * 2.3, side = i % 2 ? 1 : -1;
      p.off = [0.72 + 0.06 * Math.sin(u), 0.035 + 0.02 * Math.sin(u * 1.7), side * (0.03 + 0.02 * Math.sin(u * 1.3))]; } },
    parts:[part(mkMoray, { scale:1.6, mat:M_SKIN, ...FISH_SWIM(0.05, 0.3, 1.4, 1.2) }),
      ...[0, 1, 2].map(i => part(mkCleanerShrimp, { scale:0.05, off:[0.72, 0.04, 0], mat:M_SKIN, sway:[0.002, 2, 40, 0] }))],
    views:[{ d:[0.9, 0.25, 0.6], k:1.4, hold:10, drift:0.02 }, { d:[1, 0.1, 0.1], k:0.6, hold:9, drift:0.02, off:[0.5, 0, 0] }] });
  addObj({ key:'flyingfish', name:'flying fish', type:'Exocoetidae · gliding over the waves', kind:'fish', at:[3990, 30, 0.3], size:0.3, rad:0.4,
    fact:'Chased from below, it bursts out of the water and glides on wing-like fins, sometimes for 400 m in a run of glides, beating its tail on the surface to take off again.',
    motion:{ type:'still', fn:flyerMotion, yaw:0.4 },
    parts:[part(mkFlyingFish, { scale:0.3, mat:M_SILVER, ...FISH_SWIM(0.06, 4, 0.9, 1.8) })],
    views:[{ d:[0.2, 0.3, 1], k:6, hold:12, drift:0.0, frame:'world', air:true }, { d:[1, 0.45, 0.3], k:8, hold:9, drift:0.0, frame:'world', air:true }] });
}
