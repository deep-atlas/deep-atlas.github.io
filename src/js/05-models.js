// ---- the creature builders. Each returns an MB in the creature's frame (one unit long, snout at +x).

const hex = h => { const n = parseInt(h.replace('#', ''), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const BIO = [0.25, 0.85, 1.0];       // bioluminescence: blue-green, near 480 nm
const sAt = x => clamp(0.5 - x, 0, 1);  // where a point sits along a one-unit body: 0 at the snout, 1 at the tail
const swimA = p => [sAt(p[0]), 0, 0, 0];
const finA = (a, b, r, p) => [sAt(p[0]), 0, 0, 0];
const fc = c => () => c;

// a fish. o:
//   H, W: the body's greatest half-height and half-width (body lengths); tm: where it is thickest (0..1 of the body)
//   nose: roundness of the head (smaller is blunter); ped: the tail stalk's thickness; bodyLen: body without the tail fin
//   back, belly: colours; pattern(t, sy, sz) -> colour or null; eye: [t, height, size]
//   tail: 'fork' | 'lunate' | 'round' | 'truncate' | 'shark' | 'none'; tailH: tail fin height; tailL: its length
//   dorsal: [{ at, len, h, sweep, col }], anal: [...], pect: { at, len, w, down, col }, pelv: {...}
function fish(o) {
  const mb = new MB();
  const bl = o.bodyLen || 0.84, H = o.H || 0.11, W = o.W || 0.06, tm = o.tm || 0.32, nose = o.nose ?? 0.55, ped = o.ped ?? 0.16;
  const back = o.back || [0.3, 0.35, 0.4], belly = o.belly || [0.85, 0.87, 0.9];
  const prof = t => {
    const f = Math.pow(Math.sin(clamp(t / tm, 0, 1) * PI / 2), nose);
    const b = lerp(1, ped, Math.pow(smooth(tm, 1, t), o.taper || 1));
    return f * b;
  };
  const eye = o.eye || [0.1, 0.25, 0.035];
  const body = (t, u, p, sy, sz) => {
    if (o.glowAt) { const g = o.glowAt(t, sy, sz, p); if (g) return g; }
    const pt = o.pattern && o.pattern(t, sy, sz, p);
    let c = pt || mixc(belly, back, smooth(-0.35, 0.45, sy));
    // the eye: a dark disc with a pale ring, on each side of the head
    const de = Math.hypot((t - eye[0]) * bl, (sy - eye[1]) * H * prof(t)) / eye[2];
    if (Math.abs(sz) > 0.3 && de < 1) c = de < 0.7 ? (o.eyeCol || [0.03, 0.03, 0.04]) : (o.eyeRing || [0.8, 0.78, 0.65]);
    return c;
  };
  loft(mb, {
    n:o.n || 36, m:o.m || 18,
    sec:t => ({ x:0.5 - t * bl, y:(o.camber ? o.camber(t) : 0) * H, w:W * prof(t) * (o.wShape ? o.wShape(t) : 1), h:H * prof(t) * (o.hShape ? o.hShape(t) : 1), e:o.e ? callOr(o.e, t) : 2 }),
    col:body, anim:(t, u, p) => [sAt(p[0]), 0, 0, 0],
  });
  const tx = 0.5 - bl;
  const tH = o.tailH ?? H * 1.5, tL = o.tailL ?? (1 - bl) + 0.02, tc = o.tailCol || back;
  const tails = {
    fork:[[0.01, 0.02], [-tL * 0.55, tH * 0.55], [-tL, tH], [-tL * 0.55, 0], [-tL, -tH], [-tL * 0.55, -tH * 0.55], [0.01, -0.02]],
    lunate:[[0.01, 0.02], [-tL * 0.4, tH * 0.7], [-tL, tH * 1.15], [-tL * 0.5, 0.0], [-tL, -tH * 1.15], [-tL * 0.4, -tH * 0.7], [0.01, -0.02]],
    round:[[0.01, 0.03], [-tL * 0.5, tH * 0.85], [-tL * 0.95, tH * 0.5], [-tL, 0], [-tL * 0.95, -tH * 0.5], [-tL * 0.5, -tH * 0.85], [0.01, -0.03]],
    truncate:[[0.01, 0.03], [-tL * 0.8, tH * 0.9], [-tL, tH * 0.85], [-tL * 0.97, 0], [-tL, -tH * 0.85], [-tL * 0.8, -tH * 0.9], [0.01, -0.03]],
    shark:[[0.02, 0.02], [-tL * 0.55, tH * 0.9], [-tL, tH * 1.25], [-tL * 0.62, tH * 0.2], [-tL * 0.5, -tH * 0.1], [-tL * 0.62, -tH * 0.6], [-tL * 0.2, -tH * 0.3], [0.01, -0.02]],
  };
  if (o.tail && o.tail !== 'none') {
    const ty = o.camber ? o.camber(1) * H : 0;
    if (o.flukes) fin(mb, tails[o.tail].map(([a, b]) => [a, b]), { origin:[tx + 0.02, ty, 0], ua:[1, 0, 0], va:[0, 0, 1], col:fc(tc), anim:finA, center:[-tL * 0.3, 0] });
    else fin(mb, tails[o.tail], { origin:[tx + 0.02, ty, 0], ua:[1, 0, 0], va:[0, 1, 0], col:o.tailPat || fc(tc), anim:finA, center:[-tL * 0.3, 0] });
  }
  const finOn = (f, top) => {
    const x0 = 0.5 - f.at * bl, len = f.len, h = f.h, sw = f.sweep ?? 0.4;
    const tt = clamp(f.at + len / bl * 0.5, 0, 1);
    const y0 = (top ? 1 : -1) * H * prof(tt) * (o.hShape ? o.hShape(tt) : 1) * 0.85 + (o.camber ? o.camber(f.at) * H : 0);
    const sg = top ? 1 : -1;
    const pts = f.pts ? f.pts.map(([a, b]) => [a * len, b * h * sg]) : [[0, 0], [-len * sw * 0.6, sg * h], [-len * (sw * 0.6 + 0.25), sg * h * 0.85], [-len, 0]];
    fin(mb, pts, { origin:[x0, y0, 0], ua:[1, 0, 0], va:[0, 1, 0], col:f.pat || fc(f.col || tc), anim:finA });
  };
  (o.dorsal || []).forEach(f => finOn(f, true));
  (o.anal || []).forEach(f => finOn(f, false));
  // paired fins: the right one, then a mirror copy
  const paired = (f, flapK) => {
    if (!f) return;
    const x0 = 0.5 - f.at * bl, len = f.len, w = f.w, down = f.down ?? 0.5;
    const y0 = (f.y ?? -0.25) * H * prof(f.at) + (o.camber ? o.camber(f.at) * H : 0), z0 = W * prof(f.at) * (o.wShape ? o.wShape(f.at) : 1) * 0.8;
    const out = vnorm([-(f.back ?? 0.3), -down, 1]);
    // outline points are [out from the body, along the body (forward +)]
    const pts = f.pts || [[0, w * 0.5], [0, -w * 0.5], [len, -w * 0.5 - len * 0.35], [len * 0.85, -len * 0.05]];
    const mk = mb.mark();
    fin(mb, pts, { origin:[x0, y0, z0], ua:out, va:[1, 0, 0], col:f.pat || fc(f.col || tc),
      anim:(a, b, r, p) => [sAt(p[0]), flapK ? Math.max(0, p[2] - z0) * flapK : 0, 0, 0] });
    mb.dup(mk, mirrorZ);
  };
  paired(o.pect, o.pectFlap);
  paired(o.pelv);
  if (o.extra) o.extra(mb, { bl, H, W, prof, tx });
  return mb;
}
// little glowing dots (photophores) in rows along a fish's sides and belly
function photophores(mb, b, rows, col, size) {
  for (const [t0, t1, sy, n] of rows) for (let k = 0; k < n; k++) {
    const t = lerp(t0, t1, n > 1 ? k / (n - 1) : 0.5), x = 0.5 - t * b.bl;
    const h = b.H * b.prof(t), w = b.W * b.prof(t);
    const cy = Math.max(-1, Math.min(1, sy)), ang = Math.asin(cy);
    for (const sz of [1, -1]) ellip(mb, [x, h * Math.sin(ang) * 1.02, sz * w * Math.cos(ang) * 1.04], [size, size, size], { n:3, m:5, col:fc([...col, 3.0]), anim:p => swimA(p) });
  }
}

// ---- reef fish
function mkClownfish() {
  const orange = [1.0, 0.42, 0.05], white = [0.97, 0.97, 0.95], black = [0.05, 0.04, 0.04];
  const band = t => Math.abs(t - 0.2) < 0.045 || Math.abs(t - 0.52) < 0.055 || Math.abs(t - 0.96) < 0.03 ? white
    : Math.abs(t - 0.2) < 0.06 || Math.abs(t - 0.52) < 0.07 || Math.abs(t - 0.96) < 0.045 ? black : null;
  return fish({ H:0.19, W:0.085, tm:0.35, nose:0.35, ped:0.3, bodyLen:0.8, eye:[0.12, 0.25, 0.04],
    pattern:t => band(t) || orange,
    tail:'round', tailH:0.15, tailCol:orange, tailPat:(a) => a < -0.17 ? black : orange,
    dorsal:[{ at:0.22, len:0.5, h:0.09, sweep:0.2, col:orange, pts:[[0, 0], [-0.1, 0.8], [-0.35, 0.55], [-0.5, 0.9], [-0.9, 1], [-1, 0]] }],
    anal:[{ at:0.6, len:0.18, h:0.08, col:orange }],
    pect:{ at:0.22, len:0.14, w:0.08, col:orange }, pelv:{ at:0.3, len:0.1, w:0.05, y:-0.8, col:black } });
}
function mkBlueTang() {
  const blue = [0.12, 0.35, 0.95], dark = [0.03, 0.05, 0.2], yellow = [1, 0.85, 0.1];
  return fish({ H:0.3, W:0.06, tm:0.4, nose:0.4, ped:0.25, bodyLen:0.8, eye:[0.12, 0.3, 0.04],
    pattern:(t, sy) => (sy > 0.2 && sy < 0.75 && t > 0.15 && t < 0.85 && Math.abs(sy - 0.5 - 0.25 * Math.sin(t * 6)) < 0.18) ? dark : blue,
    tail:'truncate', tailH:0.2, tailCol:yellow, dorsal:[{ at:0.15, len:0.68, h:0.06, col:dark }], anal:[{ at:0.45, len:0.38, h:0.05, col:dark }],
    pect:{ at:0.25, len:0.14, w:0.08, col:yellow } });
}
function mkAnthias() {
  const pink = [1.0, 0.45, 0.35], gold = [1, 0.7, 0.2];
  return fish({ H:0.15, W:0.06, tm:0.33, nose:0.5, bodyLen:0.78, back:pink, belly:[1, 0.75, 0.6], eye:[0.1, 0.25, 0.04],
    tail:'lunate', tailH:0.13, tailCol:pink, dorsal:[{ at:0.2, len:0.5, h:0.08, col:gold }], anal:[{ at:0.6, len:0.15, h:0.06 }], pect:{ at:0.22, len:0.12, w:0.06, col:pink } });
}
function mkSardine() {
  const back = [0.15, 0.32, 0.45], belly = [0.92, 0.95, 0.97];
  return fish({ H:0.09, W:0.06, tm:0.35, nose:0.65, ped:0.14, bodyLen:0.82, back, belly, eye:[0.08, 0.15, 0.025], n:14, m:8,
    pattern:(t, sy) => mixc(belly, back, smooth(0.0, 0.5, sy)), tail:'fork', tailH:0.09, tailCol:[0.4, 0.5, 0.6],
    dorsal:[{ at:0.38, len:0.14, h:0.06 }], pect:{ at:0.2, len:0.08, w:0.04 } });
}
function mkGreatWhite() {
  const back = [0.32, 0.36, 0.4], belly = [0.92, 0.92, 0.9];
  return fish({ H:0.105, W:0.095, tm:0.38, nose:0.75, ped:0.12, bodyLen:0.78, back, belly, eye:[0.075, 0.18, 0.012], e:2.2,
    camber:t => -0.12 * Math.sin(t * PI), pattern:(t, sy) => mixc(belly, back, smooth(-0.15, 0.05, sy + 0.08 * Math.sin(t * 20))),
    tail:'lunate', tailH:0.14, tailL:0.2, tailCol:back,
    dorsal:[{ at:0.33, len:0.15, h:0.14, sweep:0.75 }, { at:0.8, len:0.03, h:0.03 }], anal:[{ at:0.82, len:0.03, h:0.025 }],
    pect:{ at:0.3, len:0.2, w:0.09, down:0.55, back:0.5, y:-0.45, col:back }, pelv:{ at:0.65, len:0.05, w:0.03, y:-0.7 },
    extra:(mb, b) => gills(mb, b, 0.2, 5) });
}
function gills(mb, b, t0, n) {
  for (let k = 0; k < n; k++) for (const sz of [1, -1]) {
    const t = t0 + k * 0.022, x = 0.5 - t * b.bl, w = b.W * b.prof(t) * 1.02;
    fin(mb, [[0, -0.6], [0.004, -0.6], [0.004, 0.5], [0, 0.5]].map(([a, c]) => [a, c * b.H * b.prof(t)]), { origin:[x, -0.01, sz * w], ua:[1, 0, 0], va:[0, 1, 0], col:fc([0.08, 0.08, 0.1]), anim:finA, rings:1 });
  }
}
function mkHammerhead() {
  const back = [0.45, 0.47, 0.42], belly = [0.9, 0.9, 0.86];
  return fish({ H:0.08, W:0.075, tm:0.36, nose:0.6, ped:0.11, bodyLen:0.75, back, belly, eye:[0.0, 0.0, 0.0001],
    pattern:(t, sy) => mixc(belly, back, smooth(-0.15, 0.1, sy)),
    tail:'shark', tailH:0.13, tailL:0.25, dorsal:[{ at:0.3, len:0.13, h:0.17, sweep:0.6 }, { at:0.78, len:0.03, h:0.03 }],
    pect:{ at:0.3, len:0.13, w:0.06, down:0.5, back:0.4, y:-0.5 }, pelv:{ at:0.6, len:0.04, w:0.03, y:-0.7 },
    extra:(mb, b) => {
      // the cephalofoil: a flat wing across the head, an eye at each tip
      loft(mb, { n:6, m:12, sec:t => ({ x:0.47 - t * 0.09, y:0.005, w:0.13 * Math.sin(lerp(0.4, 1, Math.min(1, t * 1.3)) * PI / 2), h:0.016, e:2 }),
        col:(t, u, p) => Math.abs(p[2]) > 0.115 ? [0.02, 0.02, 0.02] : back, anim:p => swimA(p) });
      gills(mb, b, 0.17, 5);
    } });
}
function mkWhaleShark() {
  const back = [0.22, 0.28, 0.36], belly = [0.88, 0.88, 0.85], spot = [0.92, 0.92, 0.88];
  return fish({ H:0.085, W:0.12, tm:0.3, nose:0.35, ped:0.12, bodyLen:0.8, back, belly, eye:[0.05, 0.05, 0.01], e:t => lerp(3.2, 2, smooth(0, 0.4, t)),
    camber:t => -0.1 * Math.sin(t * PI),
    pattern:(t, sy, sz) => {
      if (sy < -0.15) return belly;
      // the pale spots and stripes of a whale shark: a checkerboard of dots
      const u = t * 60, v = sy * 9 + (sz > 0 ? 0 : 3.1);
      const fu = u - Math.round(u), fv = v - Math.round(v);
      if (Math.abs(fu) < 0.06 && t > 0.15) return mixc(back, spot, 0.7);
      if (Math.hypot(fu, fv * 1.4) < 0.28 && (Math.round(u) + Math.round(v)) % 2 === 0) return spot;
      return back;
    },
    tail:'lunate', tailH:0.15, tailL:0.2, dorsal:[{ at:0.42, len:0.13, h:0.11, sweep:0.7 }, { at:0.78, len:0.04, h:0.035 }],
    pect:{ at:0.27, len:0.2, w:0.08, down:0.35, back:0.45, y:-0.5 }, pelv:{ at:0.66, len:0.05, w:0.03, y:-0.7 },
    extra:(mb, b) => {
      // the wide mouth across the front of the flat head
      fin(mb, [[0, -0.06], [0.015, 0], [0, 0.06], [-0.004, 0]].map(([a, c]) => [c, a]), { origin:[0.495, -0.02, 0], ua:[0, 0, 1], va:[1, -0.2, 0], col:fc([0.05, 0.04, 0.05]), anim:finA, rings:1 });
      gills(mb, b, 0.15, 5);
    } });
}
function mkSailfish() {
  const back = [0.1, 0.2, 0.45], belly = [0.85, 0.88, 0.92], sail = [0.2, 0.35, 0.8];
  return fish({ H:0.07, W:0.04, tm:0.33, nose:0.9, ped:0.08, bodyLen:0.78, back, belly, eye:[0.08, 0.2, 0.012],
    pattern:(t, sy) => (Math.abs(Math.sin(t * 60)) < 0.15 && sy > -0.1 && sy < 0.6 && t > 0.2) ? [0.4, 0.6, 1.0] : mixc(belly, back, smooth(-0.2, 0.3, sy)),
    tail:'lunate', tailH:0.14, tailL:0.18, tailCol:back,
    dorsal:[{ at:0.12, len:0.5, h:0.2, col:sail, pts:[[0, 0], [-0.08, 1], [-0.4, 1.05], [-0.7, 0.85], [-1, 0.25], [-1, 0]],
      pat:(a, b2) => Math.abs(Math.sin(a * 220)) < 0.25 ? [0.05, 0.1, 0.35] : sail }],
    anal:[{ at:0.62, len:0.1, h:0.05 }], pect:{ at:0.2, len:0.1, w:0.03 }, pelv:{ at:0.24, len:0.14, w:0.012, y:-0.8 },
    extra:(mb) => tube(mb, { n:6, m:6, path:t => [0.49 + t * 0.2, 0.0, 0], r:t => 0.008 * (1 - t) + 0.001, col:fc(back), anim:p => swimA(p) }) });
}
function mkSunfish() {
  const skin = [0.62, 0.64, 0.66], belly = [0.86, 0.86, 0.84];
  return fish({ H:0.42, W:0.1, tm:0.48, nose:0.5, ped:0.62, bodyLen:0.86, back:skin, belly, eye:[0.1, 0.25, 0.025], taper:1.4,
    pattern:(t, sy) => mixc(belly, skin, smooth(-0.6, 0.4, sy + 0.1 * Math.sin(t * 13 + sy * 7))),
    tail:'none',
    dorsal:[{ at:0.55, len:0.2, h:0.5, col:skin, pts:[[0, 0], [-0.15, 0.95], [-0.55, 1], [-1, 0]] }],
    anal:[{ at:0.55, len:0.2, h:0.5, col:skin, pts:[[0, 0], [-0.15, 0.95], [-0.55, 1], [-1, 0]] }],
    pect:{ at:0.3, len:0.08, w:0.06 },
    extra:(mb, b) => {
      // the clavus: the scalloped flap that stands in for a tail
      const pts = []; for (let k = 0; k <= 16; k++) { const a = -PI / 2 + k / 16 * PI; pts.push([-0.05 * Math.cos(a) - 0.015 * Math.cos(a * 8) - 0.0, 0.36 * Math.sin(a)]); }
      pts.push([0.02, 0.3], [0.02, -0.3]);
      fin(mb, pts, { origin:[b.tx + 0.04, 0, 0], ua:[1, 0, 0], va:[0, 1, 0], col:fc(skin), anim:finA, center:[-0.02, 0] });
    } });
}
// a dolphin or whale: a fish that swims up and down, flukes flat
function cetacean(o) {
  const back = o.back, belly = o.belly;
  return fish(Object.assign({ tail:'lunate', flukes:true, tailCol:back, tm:0.33, ped:0.12, eyeCol:[0.02, 0.02, 0.02], eyeRing:back,
    pattern:(t, sy, sz, p) => o.skin ? o.skin(t, sy, sz, p) : mixc(belly, back, smooth(-0.3, 0.15, sy)) }, o));
}
function mkDolphin() {
  const back = [0.38, 0.42, 0.48], belly = [0.85, 0.86, 0.88];
  return cetacean({ back, belly, H:0.09, W:0.085, nose:0.8, bodyLen:0.86, eye:[0.12, 0.08, 0.012], tailH:0.14, tailL:0.12,
    skin:(t, sy) => mixc(belly, mixc(back, [0.55, 0.58, 0.62], smooth(0.3, 0.5, t) * smooth(0.6, 0.2, sy) * 0.6), smooth(-0.35, 0.05, sy - 0.2 * Math.sin(t * PI))),
    hShape:t => t < 0.1 ? lerp(0.45, 1, smooth(0, 0.1, t)) : 1,
    dorsal:[{ at:0.42, len:0.14, h:0.09, col:back, pts:[[0, 0], [-0.25, 0.7], [-0.75, 1], [-0.6, 0.6], [-1, 0]] }],
    pect:{ at:0.24, len:0.13, w:0.05, down:0.6, back:0.5, y:-0.55, col:back },
    extra:(mb) => ellip(mb, [0.43, 0.0, 0], [0.07, 0.018, 0.022], { n:6, m:10, col:fc(back), anim:p => swimA(p) }) });
}
function mkHumpback() {
  const back = [0.2, 0.21, 0.24], belly = [0.82, 0.82, 0.8];
  return cetacean({ back, belly, H:0.105, W:0.1, nose:0.55, bodyLen:0.85, eye:[0.2, -0.05, 0.008], tailH:0.17, tailL:0.12, e:t => lerp(2.4, 2, smooth(0.2, 0.5, t)),
    skin:(t, sy, sz) => {
      // throat grooves under the jaw, knobs (tubercles) on the head, a pale belly
      if (sy < -0.2 && t < 0.45 && Math.abs(Math.sin(sz * 40)) < 0.3) return [0.55, 0.5, 0.5];
      if (t < 0.2 && sy > 0.3 && Math.abs(Math.sin(t * 160) * Math.sin(sz * 30)) > 0.85) return [0.5, 0.5, 0.5];
      return mixc(belly, back, smooth(-0.55, -0.15, sy + 0.25 * Math.sin(t * 10)));
    },
    hShape:t => t < 0.25 ? lerp(0.6, 1, smooth(0, 0.25, t)) : 1,
    dorsal:[{ at:0.62, len:0.07, h:0.03, col:back }],
    pect:{ at:0.27, len:0.33, w:0.055, down:0.3, back:1.1, y:-0.35, col:[0.62, 0.62, 0.6],
      pts:[[0, 0.03], [0, -0.025], [0.1, -0.05], [0.22, -0.08], [0.33, -0.1], [0.31, -0.07], [0.2, -0.03], [0.1, 0.0]] },
    tailPat:() => back });
}
function mkBlueWhale() {
  const back = [0.38, 0.45, 0.55], belly = [0.62, 0.66, 0.7];
  return cetacean({ back, belly, H:0.06, W:0.065, nose:0.5, bodyLen:0.88, eye:[0.17, -0.1, 0.005], tailH:0.11, tailL:0.09, ped:0.1, tm:0.35,
    e:t => lerp(2.6, 2, smooth(0.1, 0.4, t)),
    skin:(t, sy, sz) => {
      const m = Math.sin(t * 90 + sz * 11) * Math.sin(sy * 23 + t * 41);
      const base = mixc(belly, back, smooth(-0.4, 0.1, sy));
      if (sy < -0.25 && t < 0.5 && Math.abs(Math.sin(sz * 50)) < 0.35) return mixc(base, [0.3, 0.33, 0.38], 0.5);
      return mixc(base, [0.6, 0.66, 0.72], m > 0.6 ? 0.5 : 0);
    },
    hShape:t => t < 0.22 ? lerp(0.5, 1, smooth(0, 0.22, t)) : 1,
    dorsal:[{ at:0.74, len:0.03, h:0.012, col:back }],
    pect:{ at:0.24, len:0.09, w:0.025, down:0.6, back:0.5, y:-0.5, col:back } });
}
function mkSpermWhale() {
  // the great square head is a third of the animal: flat on top, blunt in front, the narrow pale lower jaw tucked beneath;
  // behind it a wrinkled grey-brown body, a low dorsal hump then a row of knuckles to the broad triangular flukes
  const skin = [0.5, 0.47, 0.45], dark = [0.38, 0.35, 0.34], jaw = [0.88, 0.86, 0.82];
  const mb = cetacean({ back:skin, belly:skin, H:0.1, W:0.075, nose:0.06, bodyLen:0.88, eye:[0.31, -0.3, 0.008], tailH:0.16, tailL:0.11, tm:0.22, ped:0.13,
    e:t => lerp(4.0, 2.0, smooth(0.28, 0.42, t)),
    camber:t => -0.25 * smooth(0.3, 0.75, t),
    skin:(t, sy, sz) => {
      if (Math.abs(t - 0.33) < 0.012) return dark;                                       // where the head meets the body
      if (t > 0.35 && Math.sin(t * 150 + Math.sin(sy * 9) * 3) > 0.6) return dark;     // the wrinkled skin of the body
      if (t < 0.33 && sy < -0.75) return jaw;                                            // pale lips round the mouth
      return t < 0.03 ? mixc(skin, [0.65, 0.6, 0.56], 0.5) : skin;
    },
    hShape:t => t < 0.33 ? 1.1 : lerp(1.1, 0.85, smooth(0.33, 0.45, t)),
    dorsal:[{ at:0.6, len:0.07, h:0.03, col:skin, pts:[[0, 0], [-0.3, 1], [-0.7, 0.9], [-1, 0]] }, { at:0.7, len:0.025, h:0.014, col:skin }, { at:0.75, len:0.025, h:0.012, col:skin }, { at:0.8, len:0.025, h:0.01, col:skin }],
    pect:{ at:0.37, len:0.07, w:0.035, down:0.5, back:0.6, y:-0.55, col:skin },
    tailPat:(a) => a < -0.08 ? dark : skin,
    extra:(mb) => {
      // the long narrow lower jaw, rows of conical teeth along it
      loft(mb, { n:12, m:8, sec:t => ({ x:0.47 - t * 0.3, y:-0.105 + t * 0.012, w:0.011 + 0.016 * t, h:0.009, e:2 }), col:fc(jaw), anim:(t, u, p) => swimA(p) });
      for (let k = 0; k < 10; k++) for (const sz of [1, -1]) tube(mb, { n:1, m:3, path:t => [0.45 - k * 0.022, -0.097 + t * 0.012, sz * (0.009 + k * 0.0012)], r:t => 0.003 * (1 - t), col:fc([0.98, 0.97, 0.92]) });
      // the blowhole, off to the left at the front of the head
      ellip(mb, [0.47, 0.105, 0.025], [0.012, 0.004, 0.006], { n:3, m:6, col:fc([0.15, 0.14, 0.14]) });
    } });
  return mb;
}
function mkBeakedWhale() {
  const skin = [0.42, 0.36, 0.32], head = [0.75, 0.72, 0.66];
  return cetacean({ back:skin, belly:[0.55, 0.5, 0.46], H:0.08, W:0.075, nose:0.9, bodyLen:0.86, eye:[0.13, 0.05, 0.01], tailH:0.12, tailL:0.1,
    skin:(t, sy, sz) => {
      if (t < 0.18) return head;
      if (Math.abs(Math.sin(t * 37 + sz * 13 + sy * 5)) < 0.03) return [0.85, 0.82, 0.78];   // scars from rivals' teeth
      return mixc([0.55, 0.5, 0.46], skin, smooth(-0.5, 0.2, sy));
    },
    hShape:t => t < 0.12 ? lerp(0.5, 1, smooth(0, 0.12, t)) : 1,
    dorsal:[{ at:0.64, len:0.07, h:0.04, col:skin }], pect:{ at:0.25, len:0.07, w:0.03, down:0.6, back:0.5, y:-0.5, col:skin } });
}

// ---- turtles and rays
function mkTurtle() {
  const mb = new MB();
  const shell = [0.38, 0.3, 0.16], scute = [0.2, 0.15, 0.08], skin = [0.55, 0.5, 0.35], belly = [0.9, 0.85, 0.65];
  // the shell: a flattened dome with its plates drawn as darker seams
  loft(mb, { n:24, m:24, sec:t => { const f = Math.sin(t * PI); return { x:0.32 - t * 0.66, y:0.03 * f, w:0.27 * Math.pow(f, 0.5), h:0.12 * Math.pow(f, 0.7), e:2 }; },
    col:(t, u, p, sy, sz) => {
      if (sy < -0.1) return belly;
      const a = Math.abs(Math.sin(t * PI * 5)), b = Math.abs(Math.sin(sz * PI * 1.6));
      return (a < 0.12 || b < 0.1) ? scute : mixc(shell, [0.55, 0.42, 0.22], Math.max(0, Math.sin(t * 31 + sz * 17)) * 0.5);
    }, anim:() => [0, 0, 0, 0] });
  // head and neck
  ellip(mb, [0.42, 0.0, 0], [0.11, 0.055, 0.06], { col:(u, v, p) => (p[0] > 0.47 && Math.abs(p[2]) > 0.035 && p[1] > 0.005) ? [0.02, 0.02, 0.02] : skin, anim:() => [0, 0, 0, 0] });
  // flippers: long front ones that flap like wings, short rear ones that steer
  const front = mb.mark();
  fin(mb, [[0, 0.06], [0.05, 0.04], [0.42, -0.05], [0.5, -0.15], [0.38, -0.1], [0.05, -0.05]].map(([a, b]) => [a, b]),
    { origin:[0.18, -0.02, 0.22], ua:vnorm([-0.35, -0.1, 1]), va:[1, 0, 0], col:(a, b) => (Math.sin(a * 60) * Math.sin(b * 60) > 0.5 ? [0.75, 0.7, 0.55] : skin), anim:(a, b, r, p) => [0, Math.max(0, p[2] - 0.2) * 1.6, 0, 0] });
  mb.dup(front, mirrorZ);
  const rear = mb.mark();
  fin(mb, [[0, 0.04], [0.15, 0.0], [0.12, -0.06], [0.0, -0.04]], { origin:[-0.28, -0.02, 0.12], ua:vnorm([-0.5, -0.1, 1]), va:[1, 0, 0], col:fc(skin), anim:(a, b, r, p) => [0, Math.max(0, p[2] - 0.12) * 1.0, 0, 0] });
  mb.dup(rear, mirrorZ);
  return mb;
}
function mkManta() {
  // one unit = the wingspan. The disc is lofted nose to tail; its cross-section is a thin lens, its width the wings
  const mb = new MB();
  const back = [0.2, 0.21, 0.25], belly = [0.93, 0.93, 0.9], patch = [0.88, 0.88, 0.86];
  loft(mb, { n:28, m:30, sec:t => {
      // a broad head, the wings widening to pointed tips a little forward of the middle, then a concave trailing edge
      const span = t < 0.42 ? 0.06 + 0.44 * Math.pow(Math.sin(t / 0.42 * PI / 2), 1.1) : 0.5 * Math.pow(Math.max(0, 1 - (t - 0.42) / 0.55), 1.8) + 0.012;
      return { x:0.2 - t * 0.42, y:0, w:span, h:0.045 * Math.pow(Math.sin(clamp(t * 1.05, 0, 1) * PI), 0.6) + 0.003, e:1.25 };
    },
    col:(t, u, p, sy) => {
      const az = Math.abs(p[2]);
      if (sy < 0) return (az < 0.12 && t > 0.15 && t < 0.5 && Math.sin(p[2] * 90) * Math.sin(p[0] * 70) > 0.7) ? [0.25, 0.25, 0.25] : belly;
      if (az > 0.06 && az < 0.26 && t > 0.05 && t < 0.36 && az < 0.26 - (t - 0.05) * 0.55) return patch;   // the pale shoulder patches
      return back;
    },
    anim:(t, u, p) => [0, Math.pow(Math.abs(p[2]) * 2, 1.4) * 0.5, 0, 0] });
  // sweep the wingtips back
  for (let k = 0; k < mb.count; k++) { const z = Math.abs(mb.P[k * 3 + 2]); mb.P[k * 3] -= 0.16 * Math.pow(z / 0.5, 1.8); }
  // the cephalic fins either side of the mouth, rolled forward
  for (const sz of [1, -1]) fin(mb, [[0, 0.012], [0.07, 0.012], [0.08, -0.01], [0, -0.012]], { origin:[0.2, -0.005, sz * 0.055], ua:[1, -0.1, 0], va:[0, 1, 0], col:fc(back), anim:() => [0, 0, 0, 0] });
  // the slender tail
  tube(mb, { n:10, m:4, path:t => [-0.2 - t * 0.32, 0, 0], r:t => 0.006 * (1 - t) + 0.0015, col:fc(back), anim:t => [0, 0, t * 0.4, 0] });
  return mb;
}

// ---- deep-sea fish
function mkLanternfish() {
  const back = [0.1, 0.1, 0.14], side = [0.55, 0.6, 0.7];
  return fish({ H:0.11, W:0.06, tm:0.3, nose:0.4, bodyLen:0.8, back, belly:side, eye:[0.08, 0.2, 0.05], n:16, m:10, eyeCol:[0.05, 0.08, 0.1],
    tail:'fork', tailH:0.1, dorsal:[{ at:0.38, len:0.14, h:0.07 }], pect:{ at:0.2, len:0.08, w:0.03 },
    extra:(mb, b) => photophores(mb, b, [[0.12, 0.75, -0.55, 9], [0.2, 0.6, -0.15, 5]], BIO, 0.012) });
}
function mkHatchetfish() {
  const silver = [0.82, 0.86, 0.9], back = [0.25, 0.28, 0.35];
  return fish({ H:0.36, W:0.05, tm:0.3, nose:0.25, ped:0.12, bodyLen:0.8, back, belly:silver, eye:[0.1, 0.5, 0.06], eyeCol:[0.05, 0.1, 0.12],
    camber:t => -0.4 * Math.sin(Math.min(1, t * 1.6) * PI) * (1 - t),
    hShape:t => lerp(1, 0.4, smooth(0.35, 0.8, t)),
    pattern:(t, sy) => mixc(silver, back, smooth(0.5, 0.8, sy)),
    tail:'fork', tailH:0.1, dorsal:[{ at:0.35, len:0.12, h:0.08 }], pect:{ at:0.3, len:0.1, w:0.05 },
    extra:(mb, b) => photophores(mb, b, [[0.15, 0.6, -0.92, 10]], BIO, 0.016) });
}
function mkAnglerfish() {
  const mb = new MB();
  const skin = [0.12, 0.1, 0.1], mouth = [0.02, 0.0, 0.0], tooth = [0.92, 0.9, 0.85];
  // a round dark body with an enormous upturned mouth
  ellip(mb, [0.0, 0.0, 0], [0.33, 0.3, 0.24], { n:18, m:24,
    shape:(p, u, v) => { const r = [p[0], p[1], p[2]]; if (r[0] > 0.12 && r[1] < 0.1) r[0] -= (r[0] - 0.12) * 0.5 * smooth(0.1, -0.2, r[1]); return r; },
    col:(u, v, p) => (p[0] > 0.2 && p[1] < 0.08 && p[1] > -0.12) ? mouth : (Math.hypot(p[0] - 0.18, p[1] - 0.17) < 0.035 && Math.abs(p[2]) > 0.12 ? [0.01, 0.01, 0.01] : skin),
    anim:p => [sAt(p[0] + 0.3) * 0.4, 0, 0, 0] });
  // needle teeth along both jaws
  for (let k = 0; k < 14; k++) {
    const a = (k / 13 - 0.5) * 2.4;
    for (const [y, dir] of [[0.09, -1], [-0.13, 1]]) {
      const base = [0.2 + 0.11 * Math.cos(a) , y, 0.2 * Math.sin(a)];
      const len = 0.07 + 0.04 * Math.abs(Math.sin(k * 2.3));
      tube(mb, { n:2, m:4, path:t => [base[0] + t * 0.02, base[1] + dir * t * len, base[2]], r:t => 0.008 * (1 - t), col:fc(tooth), anim:() => [0, 0, 0, 0] });
    }
  }
  // the fishing rod and its glowing lure (the esca, lit by bacteria)
  tube(mb, { n:12, m:4, path:t => [0.15 + t * 0.35, 0.28 + Math.sin(t * PI) * 0.18, 0], r:0.008, col:fc(skin), anim:t => [0, 0, t * 0.4, 0] });
  ellip(mb, [0.5, 0.28, 0], [0.04, 0.045, 0.04], { n:6, m:8, col:fc([0.6, 1.0, 0.95, 4.0]), anim:() => [0, 0, 0.4, 0] });
  // small fins
  fin(mb, [[0, 0], [-0.1, 0.12], [-0.25, 0.1], [-0.3, 0]], { origin:[-0.15, 0.22, 0], ua:[1, 0, 0], va:[0, 1, 0], col:fc(skin), anim:finA });
  fin(mb, [[0, 0.06], [-0.15, 0.1], [-0.18, -0.1], [0, -0.06]], { origin:[-0.32, 0, 0], ua:[1, 0, 0], va:[0, 1, 0], col:fc(skin), anim:p => [0.6, 0, 0, 0] });
  for (const sz of [1, -1]) fin(mb, [[0, 0], [0.1, -0.03], [0.08, -0.09], [0, -0.05]].map(([a, b]) => [a, b]), { origin:[-0.05, -0.05, sz * 0.23], ua:[0, 0, sz], va:[1, 0, 0], col:fc(skin), anim:() => [0, 0, 0.2, 0] });
  return mb;
}
function mkGulperEel() {
  const mb = new MB(), skin = [0.06, 0.06, 0.08];
  // a whip of a body behind a mouth that is a quarter of the animal
  loft(mb, { n:50, m:10, sec:t => ({ x:0.32 - t * 0.82, y:0, w:0.02 * (1 - t) + 0.003, h:0.024 * (1 - t) + 0.003, e:2 }),
    col:(t) => t > 0.97 ? [1.0, 0.35, 0.4, 3.0] : skin, anim:(t, u, p) => [sAt(p[0]) * 1.0, 0, 0, 0] });
  // the jaws: a long upper jaw and a great pouch of a lower one
  loft(mb, { n:14, m:16, sec:t => ({ x:0.5 - t * 0.2, y:-0.03 * Math.sin(t * PI), w:0.07 * Math.sin(Math.min(1, t * 1.4) * PI * 0.5) + 0.004, h:0.09 * Math.sin(t * PI) + 0.004, e:2 }),
    col:(t, u, p, sy) => sy > 0.4 ? skin : [0.1, 0.06, 0.07], anim:(t, u, p) => [sAt(p[0]) * 0.3, 0, 0, 0] });
  ellip(mb, [0.33, 0.035, 0.025], [0.008, 0.008, 0.008], { n:4, m:6, col:fc([0.6, 0.6, 0.6]) });
  ellip(mb, [0.33, 0.035, -0.025], [0.008, 0.008, 0.008], { n:4, m:6, col:fc([0.6, 0.6, 0.6]) });
  return mb;
}
function mkViperfish() {
  const skin = [0.08, 0.1, 0.12], fang = [0.95, 0.95, 0.9];
  return fish({ H:0.07, W:0.04, tm:0.25, nose:0.35, ped:0.12, bodyLen:0.86, back:skin, belly:[0.2, 0.25, 0.3], eye:[0.07, 0.3, 0.025], eyeCol:[0.1, 0.25, 0.3],
    tail:'fork', tailH:0.06, dorsal:[{ at:0.16, len:0.04, h:0.2, col:skin, pts:[[0, 0], [-0.2, 1], [-1, 0.1], [-1, 0]] }], anal:[{ at:0.75, len:0.08, h:0.05 }],
    pect:{ at:0.18, len:0.06, w:0.02 },
    extra:(mb, b) => {
      photophores(mb, b, [[0.1, 0.85, -0.7, 16]], BIO, 0.008);
      for (const [x, z, up] of [[0.47, 0.02, 1], [0.47, -0.02, 1], [0.44, 0.025, -1], [0.44, -0.025, -1]])
        tube(mb, { n:3, m:4, path:t => [x + t * 0.03, -0.01 + up * t * 0.07, z], r:t => 0.005 * (1 - t), col:fc(fang), anim:() => [0, 0, 0, 0] });
      ellip(mb, [0.42, 0.07 + 0.12, 0], [0.012, 0.012, 0.012], { n:4, m:6, col:fc([...BIO, 4]) });
    } });
}
function mkBarreleye() {
  const mb = fish({ H:0.12, W:0.07, tm:0.3, nose:0.5, ped:0.2, bodyLen:0.82, back:[0.35, 0.33, 0.33], belly:[0.6, 0.58, 0.55], eye:[0.1, 0.0, 0.001],
    pattern:(t, sy, sz) => Math.sin(t * 50 + sy * 9) > 0.6 ? [0.2, 0.18, 0.18] : null,
    tail:'fork', tailH:0.09, dorsal:[{ at:0.42, len:0.1, h:0.05 }], pect:{ at:0.24, len:0.12, w:0.06, down:0.2 }, anal:[{ at:0.7, len:0.06, h:0.04 }] });
  // the green tubular eyes, pointing up inside a clear dome
  for (const sz of [1, -1]) {
    tube(mb, { n:4, m:8, path:t => [0.33 + t * 0.01, 0.05 + t * 0.09, sz * 0.026], r:t => 0.024 + t * 0.004, col:t => t > 0.75 ? [0.3, 1.0, 0.45, 1.6] : [0.2, 0.7, 0.3, 0.6], anim:() => [0.1, 0, 0, 0] });
    // the nostrils above the mouth: they look like eyes, which is why it went unrecognised for so long
    ellip(mb, [0.405, 0.035, sz * 0.022], [0.009, 0.009, 0.006], { n:3, m:6, col:fc([0.05, 0.05, 0.06]), anim:() => [0.1, 0, 0, 0] });
  }
  return mb;
}
function mkBarreleyeDome() {
  // the transparent shield over the head, drawn as a separate see-through part
  const mb = new MB();
  ellip(mb, [0.33, 0.08, 0], [0.12, 0.1, 0.06], { n:10, m:14, shape:p => p[1] < 0.04 ? [p[0], 0.04, p[2]] : p, col:fc([0.7, 0.9, 0.95, 0.3]), anim:p => [0.1, 0, 0, 0] });
  return mb;
}
function mkSnailfish() {
  const pink = [0.95, 0.75, 0.75];
  return fish({ H:0.12, W:0.1, tm:0.18, nose:0.3, ped:0.05, bodyLen:0.97, back:pink, belly:[1, 0.85, 0.85], eye:[0.07, 0.25, 0.018], taper:0.6, eyeCol:[0.1, 0.1, 0.12],
    pattern:(t, sy) => mixc([1, 0.86, 0.86], [0.85, 0.6, 0.62], smooth(0.2, 1, t) * 0.5 + (Math.sin(t * 40) > 0.85 ? 0.2 : 0)),
    tail:'none', dorsal:[{ at:0.25, len:0.7, h:0.06, col:[0.95, 0.8, 0.8] }], anal:[{ at:0.35, len:0.6, h:0.05, col:[0.95, 0.8, 0.8] }],
    pect:{ at:0.14, len:0.14, w:0.12, down:0.7, col:[0.95, 0.8, 0.8] } });
}
function mkTripodFish() {
  const skin = [0.55, 0.5, 0.42];
  const mb = fish({ H:0.07, W:0.05, tm:0.25, nose:0.6, ped:0.15, bodyLen:0.82, back:skin, belly:[0.65, 0.6, 0.52], eye:[0.06, 0.25, 0.015],
    tail:'truncate', tailH:0.06, dorsal:[{ at:0.25, len:0.12, h:0.06 }], anal:[{ at:0.55, len:0.2, h:0.04 }] });
  // three stilts: the two pelvic rays and the lower ray of the tail, longer than the fish
  for (const [x0, z0, x1, z1] of [[0.25, 0.03, 0.35, 0.1], [0.25, -0.03, 0.35, -0.1], [-0.42, 0, -0.62, 0]])
    tube(mb, { n:10, m:4, path:t => [lerp(x0, x1, t), -0.05 - t * 0.55 + Math.sin(t * PI) * 0.05, lerp(z0, z1, t)], r:0.004, col:fc([0.8, 0.75, 0.65]), anim:() => [0, 0, 0, 0] });
  // the pectoral rays held forward like antennae, feeling the current
  for (const sz of [1, -1]) tube(mb, { n:10, m:3, path:t => [0.3 + t * 0.35, 0.05 + t * 0.15, sz * (0.04 + t * 0.12)], r:0.003, col:fc([0.75, 0.7, 0.62]), anim:t => [0, 0, t * 0.3, 0] });
  return mb;
}
function mkHagfish() {
  const skin = [0.62, 0.48, 0.5];
  return fish({ H:0.045, W:0.04, tm:0.1, nose:0.2, ped:0.4, bodyLen:0.97, back:skin, belly:[0.75, 0.62, 0.62], eye:[0.05, 0.2, 0.001], tail:'none', e:2,
    dorsal:[{ at:0.7, len:0.27, h:0.02 }],
    extra:(mb) => { for (const sz of [1, -1]) tube(mb, { n:3, m:3, path:t => [0.5 + t * 0.03, -0.01, sz * 0.012], r:0.003, col:fc(skin) }); } });
}
function mkGrenadier() {
  const skin = [0.5, 0.48, 0.45];
  return fish({ H:0.09, W:0.06, tm:0.15, nose:0.45, ped:0.02, bodyLen:0.98, taper:0.5, back:skin, belly:[0.62, 0.6, 0.55], eye:[0.07, 0.3, 0.03], eyeCol:[0.08, 0.1, 0.1],
    tail:'none', dorsal:[{ at:0.15, len:0.08, h:0.1, col:skin }, { at:0.3, len:0.65, h:0.02 }], anal:[{ at:0.3, len:0.65, h:0.025 }], pect:{ at:0.14, len:0.1, w:0.03 } });
}
