// ---- invertebrates, plankton and microbes, and the large places (built in metres, not body lengths)

// a jellyfish: the bell faces +x (they swim bell first). o: { bell:[colour], rimGlow, gonads, tentacles:{ n, len, col }, arms:{ n, len, col }, h (bell height / diameter) }
function jelly(o) {
  const mb = new MB(), R = 0.5, Hb = (o.h || 0.5) * 1.0;
  loft(mb, { n:16, m:28, capEnd:false,
    sec:t => { if (o.cone) { const w = R * 0.92 * Math.pow(t, 0.62) * (1 + 0.12 * t * t); return { x:Hb * (1 - t) - Hb * 0.4, y:0, w, h:w, e:2 }; }
      const a = t * PI / 2 * (o.flare || 1.08); return { x:Hb * Math.cos(a) - Hb * 0.4, y:0, w:R * Math.sin(Math.min(a, PI / 2)) * (1 + (o.flare ? 0.1 * t * t : 0)), h:R * Math.sin(Math.min(a, PI / 2)) * (1 + (o.flare ? 0.1 * t * t : 0)), e:o.e || 2 }; },
    col:(t, u, p) => {
      if (o.pattern) { const c = o.pattern(t, u, p); if (c) return c; }
      return o.bell;
    },
    anim:t => [0, 0, 0, t * t] });
  const rimX = o.cone ? -Hb * 0.4 : Hb * Math.cos(PI / 2 * (o.flare || 1.08)) - Hb * 0.4;
  if (o.tentacles) {
    const T = o.tentacles;
    for (let k = 0; k < T.n; k++) {
      const a = k / T.n * TAU, cy = Math.cos(a) * R * 0.97, cz = Math.sin(a) * R * 0.97, wob = 0.5 + hash1(k * 7 + 3);
      tube(mb, { n:T.seg || 14, m:3, path:t => [rimX - t * T.len * wob, cy * (1 - t * 0.15), cz * (1 - t * 0.15)], r:t => (T.r || 0.006) * (1 - t * 0.7),
        col:fc(T.col || o.bell), anim:t => [0, 0, t * (T.sway || 0.25), 1 - t * 0.8] });
    }
  }
  if (o.arms) {
    const A = o.arms;
    for (let k = 0; k < A.n; k++) {
      const a = k / A.n * TAU + 0.4;
      ribbon(mb, { n:16, path:t => [rimX + Hb * 0.25 - t * A.len, Math.cos(a) * (0.05 + t * 0.06), Math.sin(a) * (0.05 + t * 0.06)],
        side:t => [0, Math.cos(a + 1.5 + Math.sin(t * 9) * 0.6), Math.sin(a + 1.5 + Math.sin(t * 9) * 0.6)], w:t => (A.w || 0.05) * (1 - t * 0.6) * (0.8 + 0.4 * Math.sin(t * 17)),
        col:fc(A.col || o.bell), anim:t => [0, 0, t * 0.35, 0] });
    }
  }
  return mb;
}
function mkMoonJelly() {
  const bell = [0.72, 0.82, 0.95], gonad = [1.0, 0.45, 0.7, 0.9];   // (the gonads glow a little so they show through the clear bell)
  return jelly({ h:0.32, bell, flare:1.12,
    pattern:(t, u) => {
      // four horseshoe gonads seen through the bell
      const ph = (u * 4) % 1, r = Math.abs(t - 0.42);
      if (r < 0.08 && Math.abs(ph - 0.5) < 0.36 && Math.abs(ph - 0.5) > 0.12) return gonad;
      if (t > 0.94) return [0.9, 0.95, 1.0];
      return null;
    },
    tentacles:{ n:90, len:0.1, r:0.002, col:[0.85, 0.9, 1.0], seg:5 }, arms:{ n:4, len:0.18, w:0.03, col:[0.85, 0.85, 0.98] } });
}
function mkAtolla() {
  const bell = [0.5, 0.04, 0.07];
  return jelly({ h:0.38, bell, flare:1.18,
    pattern:(t, u) => {
      if (Math.abs(t - 0.62) < 0.035) return [0.3, 0.02, 0.05];       // the coronal groove
      if (t > 0.66 && Math.abs(Math.sin(u * PI * 22)) < 0.25) return [0.32, 0.03, 0.05];  // the rim lappets
      if (Math.abs(t - 0.78) < 0.05 && Math.sin(u * TAU * 8) > 0.2) return [...BIO, 3.5];  // its alarm: a wheel of blue light
      return null;
    },
    tentacles:{ n:20, len:0.45, r:0.004, col:[0.55, 0.08, 0.1], seg:8, sway:0.2 } });
}
function mkManOWar() {
  const mb = new MB(), fl = [0.55, 0.55, 0.98], crest = [0.85, 0.45, 0.85];
  // the float: a gas bladder with a crest it sails by, tentacles hanging below (this one is drawn in metres)
  ellip(mb, [0, 0, 0], [0.15, 0.05, 0.055], { n:10, m:16, shape:p => [p[0], p[1] + 0.02 * Math.cos(p[0] * 10), p[2]], col:(u, v, p) => p[1] > 0.03 ? [0.75, 0.7, 1.0] : fl, anim:() => [0, 0, 0.04, 0] });
  fin(mb, [[-0.12, 0], [-0.06, 0.06], [0.04, 0.075], [0.11, 0.03], [0.13, 0]], { origin:[0, 0.035, 0], ua:[1, 0, 0], va:[0, 1, 0], col:fc(crest), center:[0, 0.03], anim:() => [0, 0, 0.03, 0] });
  for (let k = 0; k < 40; k++) {
    const r = rng(k + 20), x0 = (r() - 0.6) * 0.18, z0 = (r() - 0.5) * 0.06, L = 1.5 + r() * (k < 6 ? 9 : 2.5);
    tube(mb, { n:k < 6 ? 30 : 10, m:3, path:t => [x0 - t * 0.3, -0.04 - t * L, z0 + Math.sin(t * 7 + k) * 0.1 * t], r:t => (k < 6 ? 0.006 : 0.004) * (1 - t * 0.6),
      col:t => mixc([0.32, 0.3, 0.75], [0.2, 0.2, 0.55], t), anim:t => [0, 0, t * 1.2, 0] });
  }
  for (let k = 0; k < 18; k++) { const r = rng(k + 90); ellip(mb, [(r() - 0.6) * 0.16, -0.06 - r() * 0.05, (r() - 0.5) * 0.06], [0.012, 0.025, 0.012], { n:4, m:6, col:fc([0.8, 0.5, 0.9]), anim:() => [0, 0, 0.05, 0] }); }
  return mb;
}
function mkCombJelly() {
  const mb = new MB();
  ellip(mb, [0, 0, 0], [0.5, 0.3, 0.3], { n:20, m:32, shape:p => [p[0], p[1] * (1 - 0.15 * (p[0] < 0 ? -p[0] * 2 : 0)), p[2] * (1 - 0.15 * (p[0] < 0 ? -p[0] * 2 : 0))],
    col:(u) => Math.abs(((u * 8) % 1) - 0.5) > 0.42 ? [0.9, 0.95, 1.0] : [0.7, 0.85, 0.95], anim:() => [0, 0, 0, 0] });
  // the mouth: an open slit at the back
  ellip(mb, [-0.47, 0, 0], [0.05, 0.12, 0.04], { n:4, m:8, col:fc([0.95, 0.75, 0.75]) });
  return mb;
}

// ---- squid and octopus
function mkSquid(o = {}) {
  const mb = new MB(), skin = o.skin || [0.75, 0.25, 0.15], dark = o.dark || [0.45, 0.1, 0.08];
  const ml = o.mantle ?? 0.32;   // mantle length (the body's share of the whole animal)
  const spots = (p, c) => Math.sin(p[0] * 210) * Math.sin(p[1] * 190 + p[2] * 170) > 0.55 ? dark : c;
  // the mantle (pulsing: squid swim by jet) with its fins at the tip
  loft(mb, { n:22, m:18, sec:t => ({ x:0.5 - t * ml, y:0, w:(o.mw || 0.07) * Math.pow(Math.sin(Math.min(1, t * 1.25) * PI / 2), 0.7), h:(o.mw || 0.07) * Math.pow(Math.sin(Math.min(1, t * 1.25) * PI / 2), 0.7), e:2 }),
    col:(t, u, p) => spots(p, skin), anim:(t) => [0, 0, 0, 0.12 * smooth(0.2, 1, t)] });
  const fw = o.fin ?? 0.09, fl = o.finLen ?? ml * 0.35;
  for (const sz of [1, -1]) fin(mb, [[0, 0], [-fl * 0.5, fw], [-fl, 0.0]].map(([a, b]) => [a, b]), { origin:[0.5 - 0.01, 0, 0], ua:[1, 0, 0], va:[0, 0, sz], col:fc(skin), anim:(a, b) => [0, Math.abs(b) * 1.5, 0, 0] });
  // the head and its great eyes
  const hx = 0.5 - ml - 0.035;
  ellip(mb, [hx, 0, 0], [0.05, (o.mw || 0.07) * 0.85, (o.mw || 0.07) * 0.95], { n:8, m:14, col:(u, v, p) => Math.hypot(p[0] - hx, p[1] - 0.01) < (o.eye || 0.03) && Math.abs(p[2]) > 0.03 ? (o.eyeCol || [0.05, 0.05, 0.06]) : skin, anim:() => [0, 0, 0, 0] });
  // eight arms, and two long tentacles with clubs
  const al = o.arms ?? 0.28, tl = o.tent ?? 0.5;
  for (let k = 0; k < 10; k++) {
    const a = k / 8 * TAU + 0.2, isT = k >= 8;
    const ang = isT ? (k === 8 ? 0.6 : -0.6) : a;
    const L = isT ? tl : al * (0.8 + 0.2 * Math.cos(a));
    const spread = isT ? 0.02 : 0.06;
    tube(mb, { n:isT ? 24 : 14, m:4, path:t => [hx - 0.04 - t * L, Math.cos(ang) * (0.02 + t * spread) + (isT ? 0 : Math.sin(t * 4 + k) * 0.01), Math.sin(ang) * (0.02 + t * spread)],
      r:t => isT ? (t > 0.85 ? 0.009 : 0.004) : 0.011 * (1 - t * 0.85), col:fc(skin), anim:t => [0, 0, t * (isT ? 0.3 : 0.18), 0] });
  }
  return mb;
}
// the dumbo octopus (Grimpoteuthis), about one unit across: a soft domed mantle with an ear-like fin each side near the top,
// big eyes, and eight short arms joined almost to their tips by a web that opens and closes like an umbrella as it drifts
function mkDumbo() {
  const mb = new MB(), skin = [0.98, 0.7, 0.66], pale = [1.0, 0.86, 0.82], deep = [0.85, 0.5, 0.5];
  ellip(mb, [0, 0.13, 0], [0.19, 0.24, 0.19], { n:14, m:18, shape:p => [p[0], p[1] < 0.02 ? 0.02 + (p[1] - 0.02) * 0.3 : p[1], p[2]],
    col:(u, v, p) => p[1] > 0.3 ? pale : skin, anim:() => [0, 0, 0, 0.06] });
  for (const sz of [1, -1]) {
    ellip(mb, [0.07, 0.06, sz * 0.165], [0.045, 0.05, 0.03], { n:5, m:9, col:(u, v, p) => Math.hypot(p[0] - 0.08, p[1] - 0.06) < 0.025 ? [0.05, 0.03, 0.04] : deep });
    // the ears: rounded paddles that flap to swim
    fin(mb, [[0, -0.08], [0.1, -0.06], [0.16, 0.02], [0.11, 0.1], [0.0, 0.1], [-0.05, 0.02]], { origin:[0, 0.25, sz * 0.15], ua:vnorm([0, 0.15, sz]), va:[1, 0, 0], rings:3,
      col:fc(skin), anim:(a, b, r) => [0, r * 0.9, 0, 0] });
  }
  // the web: rings flaring down and out, cut back between the arms so its edge is scalloped
  const nA = 8, N = 12, M = 64, armA = k => k / nA * TAU + PI / 8;
  const ry = t => 0.02 - t * 0.2, rr = t => 0.17 + t * 0.3;
  const rows = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, row = [];
    for (let j = 0; j < M; j++) {
      const ang = j / M * TAU, ph = Math.cos(nA * (ang - PI / 8));
      const tt = t * (0.72 + 0.28 * (1 + ph) / 2);
      row.push(mb.v([Math.cos(ang) * rr(tt), ry(tt), Math.sin(ang) * rr(tt)], t > 0.9 ? deep : mixc(skin, pale, t * 0.6), [0, 0, tt * 0.1, tt * 0.5]));
    }
    rows.push(row);
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const j1 = (j + 1) % M; mb.quad(rows[i][j], rows[i][j1], rows[i + 1][j1], rows[i + 1][j]); }
  // the arms along the web, their tips curling up past its edge, a row of suckers and fine cirri beneath
  for (let k = 0; k < nA; k++) {
    const a = armA(k), ca = Math.cos(a), sa = Math.sin(a);
    tube(mb, { n:14, m:5, path:t => { const tt = Math.min(t * 1.15, 1), cur = Math.max(0, t * 1.15 - 1) * 4; return [ca * (rr(tt) + cur * 0.02), ry(tt) + cur * 0.05, sa * (rr(tt) + cur * 0.02)]; },
      r:t => 0.022 * (1 - t * 0.7), col:t => t > 0.8 ? deep : skin, anim:t => [0, 0, t * 0.1, t * 0.5] });
  }
  return mb;
}
function mkOctopus(o = {}) {
  const mb = new MB(), skin = o.skin || [0.7, 0.4, 0.3], mott = o.mott || [0.45, 0.22, 0.18];
  const pat = p => o.dumbo ? skin : (Math.sin(p[0] * 60 + p[2] * 40) * Math.sin(p[1] * 70) > 0.3 ? mott : skin);
  // the mantle above and behind the head
  ellip(mb, [-0.12, 0.2, 0], [0.22, 0.17, 0.16], { n:12, m:16, col:(u, v, p) => pat(p), anim:() => [0, 0, 0, 0.08] });
  ellip(mb, [0.04, 0.05, 0], [0.11, 0.1, 0.12], { n:8, m:12, col:(u, v, p) => (Math.abs(p[2]) > 0.08 && p[1] > 0.08 && Math.abs(p[0] - 0.06) < 0.03) ? [0.05, 0.05, 0.03] : pat(p), anim:() => [0, 0, 0, 0] });
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * TAU + 0.2, L = o.dumbo ? 0.42 : 0.6 + 0.1 * Math.sin(k * 1.7), curl = o.dumbo ? 0.5 : 2.2 + hash1(k) * 1.5;
    tube(mb, { n:22, m:5, path:t => {
        const r = 0.08 + t * L * (o.dumbo ? 0.75 : 0.85), dn = o.dumbo ? -0.02 - t * 0.3 : -0.05 - Math.sin(t * PI) * 0.06 + Math.pow(t, 3) * 0.15;
        const ca = a + Math.sin(t * curl) * 0.4 * t;
        return [0.04 + Math.cos(ca) * r, dn, Math.sin(ca) * r];
      }, r:t => (o.dumbo ? 0.025 : 0.03) * (1 - t * 0.9), col:(t, u) => u > 0.4 && u < 0.6 ? [0.95, 0.85, 0.8] : pat([t, 0, k]), anim:t => [0, 0, t * 0.25, 0] });
  }
  return mb;
}

// ---- the longest and the smallest drifters
function mkSiphonophore() {
  const mb = new MB();
  // the colony coiled into a loose spiral, as big ones hang while they fish (about 2 turns, ~1 unit of stem)
  const stem = t => { const a = t * 2.2 * TAU, R = 0.095 - t * 0.045; return [R * Math.cos(a), Math.sin(t * 9) * 0.004 - t * 0.01, R * Math.sin(a)]; };
  tube(mb, { n:120, m:3, path:stem, r:0.0012, col:fc([0.95, 0.75, 0.7]), anim:t => [0, 0, t * 0.04, 0] });
  // swimming bells at the front, then the same colony unit (cormidium) over and over
  for (let k = 0; k < 10; k++) { const p = stem(k * 0.006); ellip(mb, [p[0] - 0.003, p[1] + (k % 2 ? 0.004 : -0.004), p[2]], [0.004, 0.003, 0.003], { n:5, m:8, col:fc([0.8, 0.9, 1.0, 0.4]), anim:() => [0, 0, 0, 0.3] }); }
  for (let k = 0; k < 90; k++) {
    const t = 0.07 + k * 0.0102, p = stem(t);
    ellip(mb, [p[0], p[1] - 0.002, p[2]], [0.0018, 0.0026, 0.0018], { n:3, m:5, col:fc([1.0, 0.55, 0.45, 0.6]), anim:() => [0, 0, t * 0.04, 0] });
    tube(mb, { n:4, m:3, path:u => [p[0] - u * 0.004, p[1] - 0.003 - u * 0.012, p[2] + Math.sin(u * 3 + k) * 0.003], r:0.0004, col:fc([1.0, 0.7, 0.6, 0.3]), anim:u => [0, 0, t * 0.04 + u * 0.01, 0] });
  }
  return mb;
}
function mkKrill() {
  const mb = new MB(), shell = [0.95, 0.45, 0.35], clear = [0.95, 0.8, 0.75];
  // the carapace and the curved, banded tail
  loft(mb, { n:28, m:10, sec:t => {
      const w = 0.075 * Math.sin(Math.min(1, t * 2.5 + 0.15) * PI / 2) * lerp(1, 0.35, smooth(0.35, 1, t));
      return { x:0.42 - t * 0.85, y:-0.08 * Math.pow(Math.max(0, t - 0.4), 2) * 2, w, h:w * 1.15, e:2 };
    },
    col:(t, u, p, sy) => (t > 0.38 && Math.abs(Math.sin(t * 52)) < 0.25) ? shell : (sy > 0.3 ? shell : clear),
    anim:(t, u, p) => [0, 0, 0, 0] });
  // eyes, antennae, legs, and the light organs
  for (const sz of [1, -1]) {
    ellip(mb, [0.43, 0.03, sz * 0.045], [0.025, 0.025, 0.025], { n:5, m:8, col:fc([0.05, 0.03, 0.03]) });
    tube(mb, { n:12, m:3, path:t => [0.45 + t * 0.4, 0.04 + t * 0.12, sz * (0.03 + t * 0.12)], r:0.003, col:fc(shell), anim:t => [0, 0, t * 0.2, 0] });
    tube(mb, { n:8, m:3, path:t => [0.45 + t * 0.15, 0.0 + t * 0.03, sz * (0.03 + t * 0.06)], r:0.004, col:fc(shell), anim:t => [0, 0, t * 0.2, 0] });
    for (let k = 0; k < 6; k++) tube(mb, { n:4, m:3, path:t => [0.32 - k * 0.04 - t * 0.02, -0.05 - t * 0.09, sz * (0.02 + t * 0.03)], r:0.003, col:fc(clear), anim:t => [0, 0, t * 0.15, 0] });
    for (const t of [0.22, 0.5, 0.62, 0.74]) ellip(mb, [0.42 - t * 0.85, -0.05, sz * 0.02], [0.012, 0.01, 0.01], { n:3, m:5, col:fc([...BIO, 3.0]) });
  }
  fin(mb, [[0, 0.03], [-0.1, 0.05], [-0.12, 0], [-0.1, -0.05], [0, -0.03]].map(([a, b]) => [a, b]), { origin:[-0.42, -0.1, 0], ua:[1, -0.3, 0], va:[0, 0, 1], col:fc(shell) });
  return mb;
}
function mkCopepod() {
  const mb = new MB(), body = [0.85, 0.9, 0.95], amber = [1.0, 0.7, 0.25];
  // the prosome (a teardrop) and the thin urosome tail
  loft(mb, { n:20, m:12, sec:t => ({ x:0.38 - t * 0.5, y:0, w:0.11 * Math.pow(Math.sin(Math.min(1, t * 1.6 + 0.1) * PI / 2), 0.6) * lerp(1, 0.55, t), h:0.12 * Math.pow(Math.sin(Math.min(1, t * 1.6 + 0.1) * PI / 2), 0.6) * lerp(1, 0.55, t), e:2 }),
    col:(t, u, p, sy) => (Math.abs(Math.sin(t * 25)) < 0.12 ? [0.7, 0.8, 0.9] : body), anim:() => [0, 0, 0, 0] });
  tube(mb, { n:6, m:6, path:t => [-0.12 - t * 0.28, -0.01, 0], r:t => 0.022 * (1 - t * 0.4), col:fc(body), anim:t => [0, 0, t * 0.05, 0] });
  // the oil sac (its winter fuel, seen through the shell) and the single red eye
  ellip(mb, [0.12, 0.02, 0], [0.12, 0.045, 0.045], { n:6, m:10, col:fc(amber) });
  ellip(mb, [0.37, 0.03, 0], [0.012, 0.012, 0.012], { n:3, m:6, col:fc([1.0, 0.1, 0.05, 0.6]) });
  // the first antennae, longer than the body, held out like wings; the swimming legs below
  for (const sz of [1, -1]) {
    tube(mb, { n:20, m:3, path:t => [0.35 - t * 0.12, 0.03 - t * 0.05, sz * (0.04 + t * 0.62)], r:t => 0.008 * (1 - t * 0.7), col:fc(body), anim:t => [0, 0, t * 0.03, 0] });
    for (let k = 0; k < 4; k++) tube(mb, { n:3, m:3, path:t => [0.2 - k * 0.07 - t * 0.04, -0.09 - t * 0.08, sz * (0.02 + t * 0.06)], r:0.006, col:fc(body), anim:t => [0, 0, t * 0.04, 0] });
    for (let k = 0; k < 2; k++) tube(mb, { n:5, m:3, path:t => [-0.4 - t * 0.18, -0.01 - t * 0.02 * k, sz * (0.01 + t * 0.07 * (k + 1))], r:0.003, col:fc(body) });
  }
  return mb;
}
function mkDiatoms() {
  // a few diatoms, glass-walled algae, drawn 1 unit = 0.1 mm: a round Coscinodiscus, two boat-shaped pennates and a chain
  const mb = new MB(), glass = [0.85, 0.92, 0.9], gold = [0.85, 0.6, 0.15];
  loft(mb, { n:6, m:48, sec:t => ({ x:0.08 - t * 0.16, y:0, w:0.5 * (1 - 0.06 * Math.pow(Math.abs(t - 0.5) * 2, 4)), h:0.5 * (1 - 0.06 * Math.pow(Math.abs(t - 0.5) * 2, 4)), e:2 }),
    col:(t, u) => glass, anim:() => [0, 0, 0, 0] });
  // the two valve faces: rings of pores (areolae) radiating out
  for (const sx of [1, -1]) {
    const pts = []; for (let k = 0; k < 48; k++) { const a = k / 48 * TAU; pts.push([0.5 * Math.cos(a), 0.5 * Math.sin(a)]); }
    fin(mb, pts, { origin:[sx * 0.08, 0, 0], ua:[0, 1, 0], va:[0, 0, 1], rings:10, center:[0, 0],
      col:(a, b) => { const r = Math.hypot(a, b), th = Math.atan2(b, a); return Math.sin(r * 120) * Math.sin(th * 40 + r * 20) > 0.3 ? [0.55, 0.7, 0.68] : glass; } });
  }
  for (let k = 0; k < 14; k++) { const r = rng(k + 5), a = r() * TAU, d = r() * 0.38; ellip(mb, [0, Math.cos(a) * d, Math.sin(a) * d], [0.04, 0.05, 0.035], { n:3, m:6, col:fc(gold) }); }
  // pennate diatoms
  for (const [c, rz] of [[[0.2, 0.75, 0.3], 0.4], [[-0.3, -0.7, -0.4], -0.9]]) {
    const mk = mb.mark();
    loft(mb, { n:20, m:10, sec:t => ({ x:0.45 - t * 0.9, y:0, w:0.09 * Math.sin(t * PI) + 0.01, h:0.06 * Math.sin(t * PI) + 0.008, e:2 }),
      col:(t) => Math.abs(Math.sin(t * 60)) < 0.3 ? [0.6, 0.72, 0.7] : (Math.abs(t - 0.5) < 0.25 ? gold : glass), anim:() => [0, 0, 0, 0] });
    mb.xform(mk, chain(rotY(rz), rotX(0.3), move(c)));
  }
  // a short chain of cylinders joined end to end
  const mk = mb.mark();
  for (let k = 0; k < 5; k++) loft(mb, { n:3, m:14, sec:t => ({ x:k * 0.13 + t * 0.11, y:0, w:0.06, h:0.06, e:2.5 }), col:(t) => t > 0.4 && t < 0.6 ? gold : glass, anim:() => [0, 0, 0, 0] });
  mb.xform(mk, chain(rotZ(0.6), move([-0.5, 0.1, 0.6])));
  return mb;
}
function mkRadiolarian() {
  const mb = new MB(), glass = [0.88, 0.92, 0.95], core = [0.95, 0.6, 0.35];
  ellip(mb, [0, 0, 0], [0.22, 0.22, 0.22], { n:22, m:32, col:(u, v) => (Math.sin(u * TAU * 12) * Math.sin(v * PI * 11) > 0.25 ? [0.4, 0.5, 0.55] : glass) });
  ellip(mb, [0, 0, 0], [0.12, 0.12, 0.12], { n:8, m:12, col:fc(core) });
  const r = rng(77);
  for (let k = 0; k < 40; k++) {
    const d = vnorm([r() - 0.5, r() - 0.5, r() - 0.5]), L = 0.2 + r() * 0.3;
    tube(mb, { n:3, m:3, path:t => vmul(d, 0.2 + t * L), r:t => 0.01 * (1 - t), col:fc(glass), anim:t => [0, 0, t * 0.01, 0] });
  }
  return mb;
}
function mkNoctiluca() {
  const mb = new MB();
  ellip(mb, [0, 0, 0], [0.45, 0.45, 0.45], { n:14, m:20, col:fc([0.8, 0.9, 1.0, 0.25]), anim:() => [0, 0, 0, 0] });
  ellip(mb, [0.25, 0.05, 0], [0.12, 0.1, 0.1], { n:6, m:8, col:fc([0.95, 0.75, 0.5]) });
  const r = rng(31);
  for (let k = 0; k < 16; k++) { const d = vnorm([r() - 0.2, r() - 0.5, r() - 0.5]); tube(mb, { n:6, m:3, path:t => vlerp([0.25, 0.05, 0], vmul(d, 0.42), t), r:0.008, col:fc([0.6, 0.9, 1.0, 1.5]) }); }
  tube(mb, { n:8, m:4, path:t => [0.4 + t * 0.35, Math.sin(t * 3) * 0.08, 0], r:t => 0.04 * (1 - t * 0.7), col:fc([0.9, 0.85, 0.8]), anim:t => [0, 0, t * 0.2, 0] });
  return mb;
}
function mkProchloro() {
  // a cluster of Prochlorococcus, 1 unit = 1 micrometre: tiny green spheres with their light-catching membranes in rings
  const mb = new MB(), r = rng(9);
  for (let k = 0; k < 26; k++) {
    const c = [(r() - 0.5) * 6, (r() - 0.5) * 3, (r() - 0.5) * 6], s = 0.28 + r() * 0.08;
    ellip(mb, c, [s * 1.15, s, s], { n:8, m:12, col:(u, v) => (Math.sin(v * PI * 9) > 0.55 ? [0.2, 0.75, 0.3] : [0.55, 0.85, 0.5]) });
  }
  // and a few SAR11 (Pelagibacter), the most numerous living thing in the sea: thin crescents
  for (let k = 0; k < 14; k++) {
    const c = [(r() - 0.5) * 7, (r() - 0.5) * 3, (r() - 0.5) * 7], a = r() * TAU, b = r() * TAU;
    const mk = mb.mark();
    tube(mb, { n:8, m:6, path:t => [Math.sin((t - 0.5) * 1.6) * 0.25, Math.cos((t - 0.5) * 1.6) * 0.25 - 0.25, 0], r:t => 0.07 * Math.sin(t * PI) + 0.02, col:fc([0.85, 0.8, 0.65]) });
    mb.xform(mk, chain(rotZ(a), rotY(b), move(c)));
  }
  return mb;
}

// ---- small animals of the floor
function mkSeaPig() {
  const mb = new MB(), pink = [0.95, 0.72, 0.72];
  ellip(mb, [0, 0, 0], [0.5, 0.18, 0.2], { n:10, m:14, shape:p => [p[0], Math.max(p[1], -0.12), p[2]], col:(u, v, p) => p[1] > 0.1 ? [0.98, 0.8, 0.8] : pink });
  for (let k = 0; k < 6; k++) for (const sz of [1, -1]) {
    const x = 0.35 - k * 0.14;
    tube(mb, { n:3, m:4, path:t => [x, -0.1 - t * 0.1, sz * (0.16 + t * 0.08)], r:t => 0.04 * (1 - t * 0.5), col:fc(pink), anim:t => [0, 0, t * 0.05, 0] });
  }
  for (const [x, sz] of [[0.25, 1], [0.25, -1], [0.38, 1], [0.38, -1]]) tube(mb, { n:6, m:4, path:t => [x + t * 0.05, 0.15 + t * 0.2, sz * (0.04 + t * 0.06)], r:t => 0.03 * (1 - t * 0.7), col:fc([0.98, 0.78, 0.8]), anim:t => [0, 0, t * 0.1, 0] });
  return mb;
}
function mkAmphipod() {
  const mb = new MB(), shell = [0.92, 0.88, 0.8];
  loft(mb, { n:24, m:10, sec:t => ({ x:0.42 - t * 0.8, y:0.12 * Math.sin(t * PI) - 0.05, w:0.09 * Math.sin(Math.min(1, t * 3) * PI / 2) * lerp(1, 0.4, smooth(0.5, 1, t)), h:0.13 * Math.sin(Math.min(1, t * 3) * PI / 2) * lerp(1, 0.4, smooth(0.5, 1, t)), e:2.2 }),
    col:(t) => Math.abs(Math.sin(t * 40)) < 0.2 ? [0.75, 0.7, 0.62] : shell, anim:() => [0, 0, 0, 0] });
  for (const sz of [1, -1]) {
    for (let k = 0; k < 7; k++) tube(mb, { n:4, m:3, path:t => [0.3 - k * 0.08, -0.08 + 0.1 * Math.sin((0.12 + k * 0.1) * PI) - t * 0.18, sz * (0.07 + t * 0.06)], r:0.01, col:fc(shell), anim:t => [0, 0, t * 0.15, 0] });
    tube(mb, { n:6, m:3, path:t => [0.42 + t * 0.2, -0.02 + t * 0.12, sz * (0.03 + t * 0.06)], r:0.008, col:fc(shell), anim:t => [0, 0, t * 0.15, 0] });
  }
  return mb;
}
function mkSeahorse() {
  // drawn standing: one unit tall, the snout facing +x
  const mb = new MB(), skin = [1.0, 0.75, 0.2], ring = [0.85, 0.55, 0.1];
  const spine = t => {
    if (t < 0.15) return [0.05 + t * 0.4, 0.42 - t * 0.2, 0];
    if (t < 0.6) { const u = (t - 0.15) / 0.45; return [0.1 - Math.sin(u * PI) * 0.12, 0.39 - u * 0.5, 0]; }
    const u = (t - 0.6) / 0.4, a = u * 4.2, r = 0.16 * (1 - u * 0.7);
    return [-0.02 + Math.sin(a) * r * 0.9 - 0.0, -0.11 - (1 - Math.cos(a)) * r * 0.8 - u * 0.25, 0];
  };
  tube(mb, { n:50, m:10, path:spine, r:t => t < 0.15 ? 0.06 : t < 0.6 ? 0.075 * Math.sin(lerp(0.4, 1, (t - 0.15) / 0.45) * PI * 0.9) + 0.02 : 0.04 * (1 - (t - 0.6) / 0.42) + 0.005,
    col:(t) => Math.abs(Math.sin(t * 90)) < 0.25 ? ring : skin, anim:t => [0, 0, t > 0.6 ? (t - 0.6) * 0.3 : 0, 0] });
  // the long snout and the eye
  tube(mb, { n:5, m:6, path:t => [0.1 + t * 0.2, 0.4 - t * 0.05, 0], r:t => 0.025 - t * 0.008, col:fc(skin) });
  for (const sz of [1, -1]) ellip(mb, [0.12, 0.43, sz * 0.045], [0.018, 0.018, 0.01], { n:4, m:6, col:fc([0.05, 0.05, 0.05]) });
  fin(mb, [[0, 0], [-0.05, 0.08], [-0.13, 0.07], [-0.15, 0]], { origin:[-0.06, 0.12, 0], ua:[0.2, -1, 0], va:[-1, -0.1, 0], col:fc([1, 0.9, 0.6]), anim:(a, b) => [0, 0, Math.abs(b) * 0.4, 0] });
  // the coronet
  tube(mb, { n:3, m:5, path:t => [0.02, 0.46 + t * 0.06, 0], r:0.02, col:fc(ring) });
  return mb;
}
function mkXenophyophore(seed) {
  const mb = new MB(), r = rng(seed);
  const lumps = [...Array(8)].map(() => [r() - 0.5, r() - 0.5, r() - 0.5, r()]);
  ellip(mb, [0, 0, 0], [0.5, 0.4, 0.5], { n:16, m:22,
    shape:(p, u, v) => { let s = 1; for (const l of lumps) s += 0.25 * Math.max(0, vdot(vnorm(p), vnorm(l)) - 0.6) * l[3] * 3; const k = 1 + 0.08 * Math.sin(u * 40) * Math.sin(v * 30); return [p[0] * s * k, Math.max(-0.3, p[1] * s * k), p[2] * s * k]; },
    col:(u, v) => Math.sin(u * 50) * Math.sin(v * 40) > 0.5 ? [0.45, 0.4, 0.33] : [0.72, 0.66, 0.55] });
  return mb;
}
function mkBrittleStar(mb, c, s, seed) {
  const r = rng(seed), col = [0.85, 0.65, 0.45];
  ellip(mb, c, [0.08 * s, 0.03 * s, 0.08 * s], { n:4, m:8, col:fc(col) });
  for (let k = 0; k < 5; k++) {
    const a = k / 5 * TAU + r(), cv = (r() - 0.5) * 2;
    tube(mb, { n:10, m:3, path:t => [c[0] + Math.cos(a + cv * t) * t * 0.45 * s, c[1] + 0.01 * s, c[2] + Math.sin(a + cv * t) * t * 0.45 * s], r:t => 0.02 * s * (1 - t * 0.8), col:t => Math.sin(t * 30) > 0 ? col : [0.7, 0.5, 0.35], anim:t => [0, 0, t * 0.02, 0] });
  }
}

// ---- Nautile, Ifremer's deep submersible (in metres, after the real one: 8 m long, 2.7 m wide, rated to 6,000 m, three crew
// in a titanium sphere in the nose). Yellow hull, cross tail with a ducted propeller, arms and a sample basket at the front.
function mkNautile() {
  // (the yellow carries a faint glow: the sub's own work lights washing its hull, so it reads yellow at any depth)
  const mb = new MB(), yellow = [1.0, 0.8, 0.08, 0.5], ochre = [0.85, 0.62, 0.08, 0.35], grey = [0.32, 0.33, 0.35], dark = [0.06, 0.06, 0.07], steel = [0.6, 0.62, 0.64];
  // the hull: blunt rounded nose, a broad body, tapering to the stern
  const hullW = t => 1.35 * Math.pow(Math.sin(Math.min(1, t / 0.2) * PI / 2), 0.5) * lerp(1, 0.32, smooth(0.62, 1, t));
  const hullH = t => 1.32 * Math.pow(Math.sin(Math.min(1, t / 0.2) * PI / 2), 0.5) * lerp(1, 0.38, smooth(0.6, 1, t));
  loft(mb, { n:40, m:24, sec:t => ({ x:3.9 - t * 7.3, y:0.15 * smooth(0.6, 1, t), w:hullW(t), h:hullH(t), e:2.5 }),
    col:(t, u, p, sy) => {
      if (Math.abs(t - 0.34) < 0.008 || Math.abs(t - 0.7) < 0.006) return ochre;      // panel seams
      if (sy < -0.7) return ochre;                                                   // the shaded underside
      return yellow;
    } });
  // three viewports in the nose, where the crew lie looking out
  for (const [y, z] of [[-0.55, 0], [-0.35, 0.55], [-0.35, -0.55]]) {
    const x = 3.9 - (1 - Math.cos(Math.asin(clamp(Math.hypot(y, z) / 1.3, 0, 0.95)))) * 1.1;
    ellip(mb, [x, y, z], [0.06, 0.13, 0.13], { n:4, m:10, col:fc(dark) });
  }
  // the hatch tower on top, with its mast and strobe
  tube(mb, { n:2, m:16, path:t => [0.9, 1.15 + t * 0.55, 0], r:0.48, col:fc(yellow), capEnd:true });
  tube(mb, { n:2, m:6, path:t => [0.6, 1.6 + t * 0.7, 0], r:0.04, col:fc(steel) });
  ellip(mb, [0.6, 2.33, 0], [0.07, 0.07, 0.07], { n:4, m:6, col:fc([1.0, 0.6, 0.2, 2.5]) });
  // the cross tail and its ducted propeller
  fin(mb, [[0, 0], [-0.9, 0.0], [-1.1, 1.0], [-0.55, 1.05]], { origin:[-2.6, 0.45, 0], ua:[1, 0, 0], va:[0, 1, 0], col:fc(yellow) });
  fin(mb, [[0, 0], [-0.9, 0.0], [-1.1, -0.9], [-0.55, -0.95]], { origin:[-2.6, -0.15, 0], ua:[1, 0, 0], va:[0, 1, 0], col:fc(yellow) });
  for (const sz of [1, -1]) fin(mb, [[0, 0], [-0.9, 0.0], [-1.1, 1.0], [-0.55, 1.05]], { origin:[-2.6, 0.15, sz * 0.4], ua:[1, 0, 0], va:[0, 0, sz], col:fc(yellow) });
  tube(mb, { n:28, m:6, path:t => [-3.75, 0.15 + 0.62 * Math.cos(t * TAU), 0.62 * Math.sin(t * TAU)], r:0.1, col:fc(grey), capEnd:false });
  for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; fin(mb, [[0, 0], [0.12, 0.05], [0.1, 0.55], [-0.02, 0.5]], { origin:[-3.75, 0.15, 0], ua:[1, 0, 0], va:[0, Math.cos(a), Math.sin(a)], col:fc(dark) }); }
  // side thrusters
  for (const sz of [1, -1]) loft(mb, { n:3, m:12, sec:t => ({ x:-1.6 - t * 0.7, y:0.1, z:sz * 1.25, w:0.28, h:0.28, e:2 }), col:t => t > 0.9 ? dark : grey });
  // skids beneath, on struts
  for (const sz of [1, -1]) {
    tube(mb, { n:2, m:6, path:t => [3.0 - t * 5.8, -1.55, sz * 0.8], r:0.07, col:fc(grey) });
    for (const x of [2.4, 0.4, -1.8]) tube(mb, { n:1, m:5, path:t => [x, -1.55 + t * 0.55, sz * 0.8], r:0.05, col:fc(grey) });
  }
  // the sample basket and two manipulator arms, folded, at the front
  loft(mb, { n:2, m:4, sec:t => ({ x:4.25 - t * 0.7, y:-1.15, w:0.75, h:0.18, e:8 }), col:fc(grey) });
  for (const sz of [1, -1]) {
    tube(mb, { n:10, m:6, path:t => [3.55 + Math.sin(t * PI) * 0.5, -0.8 - t * 0.25, sz * (0.75 - t * 0.2)], r:0.075, col:fc(steel) });
    tube(mb, { n:3, m:5, path:t => [3.55, -1.05 + t * 0.2, sz * (0.55 + t * 0.1)], r:0.05, col:fc(dark) });
  }
  // floodlights on the bow
  for (const [y, z] of [[0.45, 0.95], [0.45, -0.95], [-0.25, 1.12], [-0.25, -1.12], [0.95, 0.4], [0.95, -0.4]]) {
    const x = 3.9 - (1 - Math.cos(Math.asin(clamp(Math.hypot(y, z) / 1.4, 0, 0.98)))) * 1.25 - 0.1;
    loft(mb, { n:2, m:8, sec:t => ({ x:x + 0.25 - t * 0.25, y, z, w:0.12, h:0.12, e:2 }), col:t => t < 0.3 ? [1.0, 0.96, 0.85, 6] : grey });
  }
  return mb;
}
// a red double-decker bus, 11 m long, for comparing sizes (in metres)
function mkBus() {
  const mb = new MB(), red = [0.85, 0.08, 0.06], win = [0.08, 0.1, 0.14], black = [0.05, 0.05, 0.05];
  loft(mb, { n:6, m:4, sec:t => ({ x:5.5 - t * 11, y:2.2, w:1.25, h:2.0, e:8 }),
    col:(t, u, p, sy, sz) => (Math.abs(sz) > 0.9 || t < 0.02) && ((p[1] > 1.3 && p[1] < 2.0) || (p[1] > 2.8 && p[1] < 3.6)) && fract(p[0] * 0.55) < 0.8 ? win : red });
  for (const x of [3.6, -3.4]) for (const sz of [1, -1]) loft(mb, { n:2, m:12, sec:t => ({ x, y:0.5, z:sz * (1.15 + t * 0.15), w:0.5, h:0.5, e:2 }), col:fc(black) });
  return mb;
}
// a scuba diver, for comparing sizes (1.8 m, swimming flat, head at +x; in metres)
function mkDiver() {
  const mb = new MB(), suit = [0.08, 0.09, 0.1], tank = [1.0, 0.8, 0.1], skin = [0.85, 0.65, 0.5];
  ellip(mb, [0.35, 0, 0], [0.32, 0.12, 0.18], { col:fc(suit) });
  ellip(mb, [0.78, 0.02, 0], [0.11, 0.1, 0.09], { col:(u, v, p) => p[0] > 0.84 && p[1] > -0.02 ? [0.3, 0.45, 0.6] : suit });
  tube(mb, { n:2, m:10, path:t => [0.6 - t * 0.6, 0.18, 0], r:0.09, col:fc(tank) });
  for (const sz of [1, -1]) {
    tube(mb, { n:6, m:6, path:t => [0.55 + t * 0.35, -0.05 - t * 0.1, sz * (0.18 + t * 0.1)], r:0.045, col:fc(suit) });
    tube(mb, { n:10, m:6, path:t => [0.05 - t * 0.85, -0.02 + Math.sin(t * 3) * 0.04 * sz, sz * (0.1 - t * 0.02)], r:t => 0.075 * (1 - t * 0.4), col:fc(suit), anim:t => [0, 0, 0, 0] });
    fin(mb, [[0, 0.06], [-0.4, 0.1], [-0.42, -0.1], [0, -0.06]], { origin:[-0.8, -0.02, sz * 0.08], ua:[1, 0, 0], va:[0, 0, 1], col:fc([0.1, 0.4, 0.9]) });
  }
  return mb;
}
