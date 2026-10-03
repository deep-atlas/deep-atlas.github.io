// ---- more places: a seamount's coral garden, a cold seep and its brine pool, the underside of Arctic sea ice,
// a mangrove forest and a seagrass meadow. Built in metres round an anchor, standing on the real floor.

// ---- seamount: deep-sea corals (no algae in them, so they grow slowly: some colonies are thousands of years old)
function bambooCoral(mb, c, h, seed) {
  const r = rng(seed), white = [0.92, 0.9, 0.84], node = [0.12, 0.1, 0.09];
  const stem = t => [c[0] + Math.sin(t * 2 + seed) * h * 0.05, c[1] + t * h, c[2] + Math.cos(t * 2.3 + seed) * h * 0.05];
  tube(mb, { n:Math.ceil(h * 6), m:4, path:stem, r:t => 0.025 * (1 - t * 0.6), col:t => fract(t * h * 3.5) < 0.18 ? node : white, anim:t => [0, 0, t * 0.08, 0] });
  for (let k = 0; k < 7; k++) {
    const t0 = 0.35 + k * 0.09, p = stem(t0), a = r() * TAU, L = h * (0.25 + r() * 0.2);
    tube(mb, { n:6, m:3, path:t => [p[0] + Math.cos(a) * t * L * 0.6, p[1] + t * L, p[2] + Math.sin(a) * t * L * 0.6], r:t => 0.012 * (1 - t * 0.7), col:t => fract(t * L * 4) < 0.18 ? node : white, anim:t => [0, 0, t0 * 0.08 + t * 0.05, 0] });
  }
}
function fanTree(mb, c, s, col, seed) {
  // a branching tree in one plane (bubblegum coral, sea fans): fat knobbly branches
  const r = rng(seed), yaw = r() * PI, ax = [Math.cos(yaw), 0, Math.sin(yaw)];
  const branch = (p, dir2, len, rad, depth) => {
    const d = vnorm([ax[0] * dir2[0], dir2[1], ax[2] * dir2[0]]), e = vmad(p, d, len);
    tube(mb, { n:3, m:5, path:t => vlerp(p, e, t), r:t => rad * (1 - t * 0.25), col:t => t > 0.8 && depth >= 3 ? mixc(col, [1, 1, 1], 0.35) : col, anim:t => [0, 0, (depth + t) * 0.05, 0], capEnd:depth >= 3 });
    if (depth >= 3) return;
    for (const sgn of [-1, 1]) branch(e, [dir2[0] + sgn * (0.5 + r() * 0.4), 1], len * (0.62 + r() * 0.2), rad * 0.72, depth + 1);
  };
  branch(c, [0, 1], s * 0.38, s * 0.06, 0);
}
function crinoid(mb, c, h, col, seed) {
  // a sea lily: a stalk, and ten feathery arms opening into a cup to catch drifting food
  const top = [c[0], c[1] + h, c[2]];
  tube(mb, { n:Math.ceil(h * 8), m:3, path:t => [c[0] + Math.sin(t * 3 + seed) * 0.03, c[1] + t * h, c[2]], r:0.012, col:t => fract(t * h * 12) < 0.3 ? mixc(col, [0, 0, 0], 0.3) : col, anim:t => [0, 0, t * 0.06, 0] });
  for (let k = 0; k < 10; k++) {
    const a = k / 10 * TAU + seed;
    const arm = t => [top[0] + Math.cos(a) * (0.03 + t * 0.16), top[1] + Math.sin(t * 2.4) * 0.12 - t * t * 0.08, top[2] + Math.sin(a) * (0.03 + t * 0.16)];
    tube(mb, { n:8, m:3, path:arm, r:0.008, col:fc(col), anim:t => [0, 0, 0.06 + t * 0.1, 0] });
    for (let j = 1; j < 7; j++) { const t = j / 7, p = arm(t); for (const sg of [-1, 1]) { const d = vnorm([-Math.sin(a) * sg, 0.3, Math.cos(a) * sg]); tube(mb, { n:1, m:3, path:u => vmad(p, d, u * 0.035), r:0.003, col:fc(mixc(col, [1, 1, 1], 0.3)), anim:() => [0, 0, 0.06 + t * 0.1, 0] }); } }
  }
}
function mkOrangeRoughy() {
  const orange = [0.98, 0.42, 0.18];
  return fish({ H:0.21, W:0.08, tm:0.3, nose:0.4, ped:0.14, bodyLen:0.8, back:orange, belly:[1.0, 0.6, 0.4], eye:[0.1, 0.25, 0.05], eyeCol:[0.05, 0.05, 0.07], n:16, m:10,
    pattern:(t, sy) => t < 0.22 && Math.abs(Math.sin(t * 90 + sy * 6)) < 0.25 ? [0.7, 0.25, 0.1] : null,
    tail:'fork', tailH:0.14, tailCol:orange, dorsal:[{ at:0.3, len:0.4, h:0.08, col:orange }], anal:[{ at:0.6, len:0.2, h:0.06 }], pect:{ at:0.24, len:0.12, w:0.05, col:orange } });
}
function buildSeamountGarden(A, seed) {
  const mb = new MB(), r = rng(seed);
  for (let k = 0; k < 150; k++) {
    const a = r() * TAU, d = 1.5 + Math.pow(r(), 0.8) * 20, dx = Math.cos(a) * d, dz = Math.sin(a) * d, c = [dx, groundAt(A, dx, dz) - 0.05, dz], kind = r();
    if (kind < 0.24) fanTree(mb, c, 1 + r() * 2.2, [0.95, 0.32, 0.4], k);                          // bubblegum coral
    else if (kind < 0.42) bambooCoral(mb, c, 1 + r() * 2.0, k);
    else if (kind < 0.56) fanTree(mb, c, 0.8 + r() * 1.4, [0.98, 0.6, 0.25], k + 50);               // black coral (its living polyps are orange)
    else if (kind < 0.7) staghorn(mb, c, 0.6 + r() * 0.8, [0.95, 0.94, 0.88], k);                   // Lophelia, a stony cold-water reef coral
    else if (kind < 0.85) crinoid(mb, c, 0.4 + r() * 0.5, r() < 0.5 ? [0.95, 0.85, 0.4] : [0.9, 0.5, 0.75], k);
    else uprightLoft(mb, c, 0.4 + r() * 0.6, t => 0.2 + 0.16 * Math.sin(t * PI * 0.9), (t, u) => (Math.abs(Math.sin(u * TAU * 9 + t * 5)) < 0.25 || Math.abs(Math.sin(t * 26)) < 0.25) ? [0.96, 0.95, 0.9] : [0.62, 0.66, 0.66], false);
  }
  // boulders of black lava under it all
  for (let k = 0; k < 16; k++) {
    const a = r() * TAU, d = r() * 28, dx = Math.cos(a) * d, dz = Math.sin(a) * d, s = 0.8 + r() * 2;
    ellip(mb, [dx, groundAt(A, dx, dz) - s * 0.3, dz], [s, s * 0.6, s * 0.8], { n:6, m:9, col:(u, v, p) => Math.sin(p[0] * 5 + p[2] * 4) > 0.5 ? [0.3, 0.28, 0.27] : [0.18, 0.17, 0.17] });
  }
  return mb;
}

// ---- cold seep: methane and hydrogen sulphide seeping from the floor feed bacteria, which feed everything else
function buildSeep(A, seed) {
  const mb = new MB(), r = rng(seed), R = 5.5;
  // the brine pool: a lake of brine five times saltier than the sea, so dense it does not mix; it has a surface, and waves
  const ring = []; for (let k = 0; k < 40; k++) { const a = k / 40 * TAU; ring.push([Math.cos(a) * R * (1 + 0.12 * Math.sin(a * 3 + 1)), Math.sin(a) * R * (1 + 0.12 * Math.sin(a * 3 + 1))]); }
  fin(mb, ring, { origin:[0, groundAt(A, 0, 0) + 0.08, 0], ua:[1, 0, 0], va:[0, 0, 1], rings:8, center:[0, 0],
    col:(a, b, rr) => rr > 0.9 ? [0.55, 0.6, 0.62] : [0.3, 0.38, 0.45], anim:(a, b, rr) => [0, 0, rr < 0.95 ? 0.02 : 0, 0] });
  // its shore: a ring of seep mussels, packed shell to shell
  for (let k = 0; k < 520; k++) {
    const a = r() * TAU, rr = R * (1 + 0.12 * Math.sin(a * 3 + 1)) + 0.1 + r() * 1.6, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    const mk = mb.mark();
    ellip(mb, [0, 0, 0], [0.09, 0.035, 0.045], { n:3, m:6, col:(u, v, p) => p[1] > 0.01 ? [0.55, 0.45, 0.22] : [0.25, 0.2, 0.12] });
    mb.xform(mk, chain(rotZ((r() - 0.5) * 1.2), rotY(r() * TAU), move([x, groundAt(A, x, z) + 0.03, z])));
  }
  // bushes of seep tube worms (Lamellibrachia): long thin tangled tubes, some centuries old
  for (let g = 0; g < 7; g++) {
    const a = r() * TAU, d = R + 2.5 + r() * 6, gx = Math.cos(a) * d, gz = Math.sin(a) * d;
    for (let k = 0; k < 30; k++) {
      const dx = gx + (r() - 0.5) * 1, dz = gz + (r() - 0.5) * 1, y0 = groundAt(A, dx, dz) - 0.05, L = 0.8 + r() * 1.8;
      const lean = [(r() - 0.5) * 0.9, 1, (r() - 0.5) * 0.9], bend = r() * TAU;
      tube(mb, { n:6, m:4, path:t => [dx + lean[0] * t * L + Math.sin(t * 3 + bend) * 0.12, y0 + t * L, dz + lean[2] * t * L + Math.cos(t * 3 + bend) * 0.12], r:0.012,
        col:t => t > 0.92 ? [0.95, 0.15, 0.15] : mixc([0.75, 0.65, 0.4], [0.95, 0.92, 0.8], t), anim:t => [0, 0, t * 0.06, 0] });
    }
  }
  // mats of sulphur bacteria, white and orange, on the mud
  for (let k = 0; k < 14; k++) {
    const a = r() * TAU, d = R + 1 + r() * 9, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 0.6 + r() * 1.4, col = r() < 0.6 ? [0.95, 0.95, 0.9] : [0.95, 0.6, 0.25];
    const pts = []; for (let j = 0; j < 12; j++) { const b = j / 12 * TAU; pts.push([Math.cos(b) * s * (0.7 + 0.3 * Math.sin(b * 3 + k)), Math.sin(b) * s * (0.7 + 0.3 * Math.sin(b * 3 + k))]); }
    fin(mb, pts, { origin:[x, groundAt(A, x, z) + 0.02, z], ua:[1, 0, 0], va:[0, 0, 1], rings:2, center:[0, 0], col:fc(col) });
  }
  return mb;
}

// ---- under the Arctic ice: a slab of sea ice seen from below, its underside stained by ice algae, pressure ridges hanging down,
// and brinicles: icicles of frozen brine that grow down into the sea
function buildIce(A, seed) {
  const mb = new MB(), r = rng(seed), R = 140;
  const thick = (x, z) => 1.6 + 0.6 * Math.sin(x * 0.05) * Math.sin(z * 0.06) + 6 * Math.exp(-Math.pow((x * 0.3 + z * 0.95 + 20) / 6, 2)) + 4 * Math.exp(-Math.pow((x * 0.8 - z * 0.6 - 45) / 5, 2));
  const N = 70, rows = [];
  for (let i = 0; i <= N; i++) {
    const row = [];
    for (let j = 0; j <= N; j++) {
      const x = (i / N - 0.5) * 2 * R, z = (j / N - 0.5) * 2 * R, edge = smooth(R, R * 0.85, Math.hypot(x, z));
      const y = -thick(x, z) * edge - 0.15;
      const alg = Math.sin(x * 0.21 + Math.sin(z * 0.13) * 3) * Math.sin(z * 0.17 + x * 0.05) > 0.25;
      row.push(mb.v([x, y, z], alg ? [0.35, 0.3, 0.14, 0.5] : [0.55, 0.8, 0.9, 0.9]));
    }
    rows.push(row);
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) mb.quad(rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]);
  // the top of the floe, white, seen from above the water
  const top = [];
  for (let i = 0; i <= 24; i++) { const row = []; for (let j = 0; j <= 24; j++) { const x = (i / 24 - 0.5) * 2 * R, z = (j / 24 - 0.5) * 2 * R; row.push(mb.v([x, 0.35 * smooth(R, R * 0.85, Math.hypot(x, z)) + 0.05, z], Math.sin(x * 0.4 + z * 0.13) * Math.sin(z * 0.37) > 0.6 ? [0.42, 0.5, 0.58, 0.0] : [0.62, 0.66, 0.7, 0.0])); } top.push(row); }
  for (let i = 0; i < 24; i++) for (let j = 0; j < 24; j++) mb.quad(top[i][j], top[i + 1][j], top[i + 1][j + 1], top[i][j + 1]);
  for (let k = 0; k < 9; k++) {
    const x = (r() - 0.5) * 120, z = (r() - 0.5) * 120, L = 1.5 + r() * 4, y0 = -thick(x, z) - 0.1;
    tube(mb, { n:8, m:6, path:t => [x + Math.sin(t * 4 + k) * 0.15, y0 - t * L, z], r:t => 0.12 * (1 - t * 0.7) + 0.02 * Math.sin(t * 30), col:fc([0.85, 0.95, 1.0, 0.25]) });
  }
  return mb;
}
function mkNarwhal() {
  // mottled grey-black and white, no dorsal fin, flukes that sweep back; the male's left canine grows into a spiral tusk up to 3 m
  const dark = [0.3, 0.32, 0.36], pale = [0.85, 0.86, 0.86];
  return cetacean({ back:dark, belly:pale, H:0.085, W:0.085, nose:0.42, bodyLen:0.86, eye:[0.1, 0.0, 0.008], tailH:0.14, tailL:0.1, tm:0.35,
    skin:(t, sy, sz) => { const n = Math.sin(t * 70 + sz * 13) * Math.sin(sy * 23 + t * 31); const base = mixc(pale, dark, smooth(-0.6, 0.3, sy - 0.3 * t)); return n > 0.4 ? mixc(base, pale, 0.6) : n < -0.6 ? mixc(base, dark, 0.7) : base; },
    hShape:t => t < 0.15 ? lerp(0.75, 1, smooth(0, 0.15, t)) : 1,
    pect:{ at:0.22, len:0.08, w:0.035, down:0.6, back:0.5, y:-0.55, col:dark },
    dorsal:[{ at:0.5, len:0.15, h:0.012, col:dark }],
    extra:(mb) => tube(mb, { n:20, m:5, path:t => [0.47 + t * 0.55, 0.0 + t * 0.03, 0.012], r:t => 0.017 * (1 - t * 0.75), col:(t, u) => fract(t * 22 + u) < 0.3 ? [0.72, 0.66, 0.52] : [1.0, 0.97, 0.88], anim:p => swimA(p) }) });
}

function mkBeluga() {
  // beluga: all white, no dorsal fin (a low ridge instead, for breaking through ice), a bulbous forehead (the melon) it can reshape
  // as it calls, a short beak and a neck that turns, which most whales cannot do
  const white = [0.93, 0.94, 0.93], ridge = [0.82, 0.84, 0.84];
  return cetacean({ back:white, belly:white, H:0.11, W:0.1, nose:0.32, bodyLen:0.86, eye:[0.11, 0.05, 0.008], tailH:0.15, tailL:0.1, tm:0.36,
    skin:(t, sy) => sy > 0.85 && t > 0.4 && t < 0.65 ? ridge : white,
    hShape:t => t < 0.12 ? lerp(0.7, 1.08, smooth(0, 0.12, t)) : t < 0.2 ? lerp(1.08, 0.92, smooth(0.12, 0.2, t)) : lerp(0.92, 1, smooth(0.2, 0.35, t)),
    pect:{ at:0.22, len:0.09, w:0.045, down:0.6, back:0.4, y:-0.55, col:white },
    dorsal:[{ at:0.45, len:0.2, h:0.01, col:ridge }] });
}

// ---- a raft of sargassum: golden-brown weed that never roots, floating on berry-like air bladders; drawn in metres round its middle
function buildSargassum(seed) {
  const mb = new MB(), r = rng(seed), stem = [0.3, 0.2, 0.06], leaf = [0.42, 0.3, 0.08], leaf2 = [0.34, 0.24, 0.06], berry = [0.5, 0.36, 0.1];
  for (let c = 0; c < 40; c++) {
    const a = r() * TAU, d = Math.sqrt(r()) * 2.6, c0 = [Math.cos(a) * d * 1.3, -0.05, Math.sin(a) * d];
    for (let b = 0; b < 6; b++) {
      const ya = r() * TAU, dip = 0.15 + r() * 0.5, L = 0.3 + r() * 0.35, cv = (r() - 0.5) * 2;
      const path = t => vadd(c0, [Math.cos(ya + cv * t) * L * t, -dip * t * t, Math.sin(ya + cv * t) * L * t]);
      tube(mb, { n:6, m:3, path, r:0.006, col:fc(stem), anim:t => [0, 0, t * 0.5, 0] });
      for (let k = 1; k <= 4; k++) {
        const p = path(k / 4.2), la = r() * TAU, ll = 0.08 + r() * 0.06, d2 = vnorm([Math.cos(la), (r() - 0.5) * 0.6, Math.sin(la)]);
        fin(mb, [[0, 0], [ll * 0.5, ll * 0.22], [ll, 0], [ll * 0.5, -ll * 0.22]], { origin:p, ua:d2, va:vnorm(vcross(d2, [0, 1, 0.01])), col:fc(r() < 0.5 ? leaf : leaf2), anim:() => [0, 0, 0.5, 0] });
        if (r() < 0.6) ellip(mb, vadd(p, [0, 0.01, 0]), [0.012, 0.012, 0.012], { n:3, m:5, col:fc(berry), anim:() => [0, 0, 0.5, 0] });
      }
    }
  }
  return mb;
}
function mkSargassumFish() {
  // the sargassum fish (Histrio histrio), a frogfish: lumpy, fringed with weed-like tassels, it clambers through the raft on hand-like fins
  const mb = fish({ H:0.3, W:0.17, tm:0.4, nose:0.35, ped:0.35, bodyLen:0.75, back:[0.75, 0.6, 0.2], belly:[0.9, 0.8, 0.45], eye:[0.12, 0.35, 0.025], n:16, m:12,
    pattern:(t, sy, sz, p) => Math.sin(p[0] * 50 + p[1] * 20) * Math.sin(p[2] * 45 + p[1] * 30) > 0.45 ? [0.4, 0.3, 0.1] : (Math.sin(p[0] * 80) * Math.sin(p[1] * 70) > 0.85 ? [0.98, 0.95, 0.85] : null),
    tail:'round', tailH:0.18, tailCol:[0.7, 0.55, 0.2], dorsal:[{ at:0.35, len:0.4, h:0.14, col:[0.7, 0.55, 0.2] }], anal:[{ at:0.55, len:0.2, h:0.1, col:[0.7, 0.55, 0.2] }],
    pect:{ at:0.3, len:0.13, w:0.08, down:0.7, col:[0.75, 0.6, 0.2] } });
  const r = rng(77);
  for (let k = 0; k < 30; k++) { const t = r(), a = r() * TAU, x = 0.4 - t * 0.6, p = [x, Math.cos(a) * 0.12, Math.sin(a) * 0.07]; tube(mb, { n:2, m:3, path:u => vadd(p, [0, Math.cos(a) * u * 0.05, Math.sin(a) * u * 0.05]), r:0.006, col:fc([0.8, 0.65, 0.25]) }); }
  return mb;
}

// ---- a wreck turned reef: a 60 m steel freighter on the sand at 30 m, listing to port, grown over with soft corals and sea fans
function buildWreck(A, seed) {
  const mb = new MB(), r = rng(seed), rust = [0.62, 0.42, 0.28], rustL = [0.85, 0.6, 0.38], hole = [0.02, 0.02, 0.02], deck = [0.55, 0.45, 0.35];
  const growth = [[0.75, 0.3, 0.75], [1.0, 0.5, 0.2], [0.95, 0.85, 0.3], [0.9, 0.4, 0.5], [0.6, 0.75, 0.45]];
  const enc = p => { const n = Math.sin(p[0] * 1.3 + p[1] * 2.1) * Math.sin(p[2] * 1.7 + p[0] * 0.6) + 0.5 * Math.sin(p[0] * 4.1 + p[2] * 3.3);
    return n > 0.75 ? growth[Math.floor(fract(p[0] * 0.37 + p[1] * 0.11) * growth.length)] : n > 0.35 ? rustL : rust; };
  const L = 60, X0 = -30, halfW = x => 5 * Math.pow(1 - Math.pow(clamp((x - 12) / 18, 0, 1), 2), 0.6) * (x < -26 ? lerp(0.6, 1, (x + 30) / 4) : 1) + 0.1, H = 7;
  const m0 = mb.mark();
  loft(mb, { n:50, m:24, capStart:true, capEnd:true, sec:t => { const x = X0 + t * L; return { x, y:H / 2 + 0.6 * smooth(10, 30, x), w:halfW(x), h:H / 2, e:4 }; },
    col:(t, u, p, sy, sz) => { if (sy > 0.95) { const x = p[0]; return [-14, -2, 9].some(h => Math.abs(x - h) < 3) && Math.abs(p[2]) < 2.5 ? hole : deck; }
      if (Math.abs(sz) > 0.4 && Math.abs(p[1] - 5.6) < 0.25 && fract(p[0] / 1.8) < 0.3 && p[0] < -18) return hole; return enc(p); } });
  // the bridge and accommodation aft, a funnel, a fallen mast across the deck
  loft(mb, { n:2, m:4, sec:t => ({ x:-20 - t * 8, y:H + 2.2, w:3.6, h:2.2, e:9 }), col:(t, u, p, sy, sz) => Math.abs(sz) > 0.6 && Math.abs(p[1] - H - 3) < 0.4 && fract(p[0] / 1.2) < 0.4 ? hole : enc(p) });
  loft(mb, { n:2, m:4, sec:t => ({ x:-21 - t * 5, y:H + 5.2, w:2.6, h:0.9, e:9 }), col:(t, u, p) => enc(p) });
  tube(mb, { n:3, m:10, path:t => [-26, H + 4.4 + t * 3.4, 0], r:t => 1.0 - t * 0.1, col:t => t > 0.85 ? hole : enc([-26, H + 5 + t * 3, 1]) });
  tube(mb, { n:10, m:5, path:t => [2 + t * 13, H + 0.4 + Math.sin(t * PI) * 0.4, -1 + t * 4.5], r:0.22, col:t => enc([2 + t * 13, H, t * 4]) });
  for (const x of [-14, -2, 9]) for (const sz of [1, -1]) loft(mb, { n:1, m:4, sec:t => ({ x:x - 3 + t * 6, y:H + 0.4, w:0.15, h:0.4, e:9 }), col:() => enc([x, H, sz * 2.6]) }), mb.xform(mb.mark(), q => q);
  // list to port 25 degrees, settle into the sand, and lie on the floor's slope
  const c = Math.cos(0.44), sn = Math.sin(0.44);
  mb.xform(m0, q => { const y = q[1], z = q[2]; return [q[0], y * c - z * sn - 1.2, y * sn + z * c]; });
  mb.xform(m0, q => [q[0], q[1] + groundAt(A, q[0], 0), q[2]]);
  // soft corals and sea fans grown on the upturned side and the deck edge
  for (let k = 0; k < 70; k++) {
    const x = X0 + 3 + r() * (L - 6), side = r() < 0.7 ? 1 : -1, ang = side > 0 ? 0.44 : 0.44 - 1.0, hw = halfW(x);
    // a point on the starboard (upper) side or along the deck
    const y0 = r() * H, z0 = hw * 1.02, y = y0 * c - z0 * sn - 1.2 + groundAt(A, x, 0), z = y0 * sn + z0 * c;
    const col = growth[Math.floor(r() * growth.length)];
    if (r() < 0.35) fanTree(mb, [x, y, z], 1 + r() * 1.5, col, k + 900); else softCoral(mb, [x, y, z], 0.5 + r() * 0.6, col, k + 700);
  }
  return mb;
}

function mkSeaAngel() {
  // Clione limacina, a sea angel: a shell-less swimming snail about 3 cm long, drawn upright (head at +x, swimming head-first),
  // glass-clear with an orange-red gut and head, rowing with two wing-like flaps
  const mb = new MB(), glass = [0.8, 0.9, 1.0, 0.3], red = [1.0, 0.35, 0.2, 0.6];
  loft(mb, { n:20, m:12, sec:t => { const f = Math.pow(Math.sin(Math.min(1, t * 1.1 + 0.05) * PI), 0.6) * (1 - t * 0.55); return { x:0.5 - t, y:0, w:0.13 * f, h:0.13 * f, e:2 }; }, col:fc(glass), anim:() => [0, 0, 0, 0] });
  ellip(mb, [0.38, 0, 0], [0.09, 0.075, 0.075], { n:6, m:10, col:fc(red) });           // the head
  ellip(mb, [0.05, 0, 0], [0.16, 0.05, 0.05], { n:6, m:10, col:fc([0.95, 0.45, 0.2, 0.5]) });   // the gut
  for (const sz of [1, -1]) fin(mb, [[0, 0.02], [0.08, 0.06], [0.06, 0.2], [-0.02, 0.26], [-0.07, 0.1], [-0.04, 0]], { origin:[0.24, 0, sz * 0.06], ua:[1, 0, 0], va:[0, 0, sz], col:fc(glass), anim:(a, b) => [0, Math.abs(b) * 4, 0, 0] });
  return mb;
}

function mkPolarBear() {
  // a polar bear swimming, one unit long, head at +x: a long body and neck, small head with short ears, the huge front paws
  // it paddles with (the hind legs trail as rudders); the fur looks white but the hairs are clear, over black skin
  const mb = new MB(), fur = [0.92, 0.9, 0.82], shade = [0.78, 0.76, 0.68], black = [0.05, 0.05, 0.06];
  loft(mb, { n:28, m:16, sec:t => {
      const f = t < 0.18 ? 0.45 + 0.55 * smooth(0, 0.18, t) : t < 0.7 ? 1 : 1 - 0.75 * smooth(0.7, 1, t);
      return { x:0.3 - t * 0.8, y:0.01 * Math.sin(t * PI), w:0.13 * f, h:0.14 * f, e:2 };
    }, col:(t, u, p, sy) => sy < -0.3 ? shade : fur, anim:t => [0.2 + t * 0.6, 0, 0, 0] });
  // the head on its long neck, a black nose and eyes, round ears
  ellip(mb, [0.39, 0.03, 0], [0.1, 0.075, 0.07], { n:8, m:12, col:fc(fur), anim:() => [0.05, 0, 0, 0] });
  tube(mb, { n:3, m:8, path:t => [0.45 + t * 0.06, 0.02 - t * 0.01, 0], r:t => 0.045 - t * 0.012, col:t => t > 0.85 ? black : fur, capEnd:true, anim:() => [0.05, 0, 0, 0] });
  for (const sz of [1, -1]) {
    ellip(mb, [0.43, 0.06, sz * 0.04], [0.008, 0.008, 0.006], { n:3, m:5, col:fc(black), anim:() => [0.05, 0, 0, 0] });
    ellip(mb, [0.36, 0.1, sz * 0.045], [0.015, 0.02, 0.012], { n:3, m:6, col:fc(shade), anim:() => [0.05, 0, 0, 0] });
    // front legs paddling, with broad paws
    tube(mb, { n:5, m:6, path:t => [0.18 - t * 0.05, -0.06 - t * 0.17, sz * (0.08 + t * 0.03)], r:t => 0.045 - t * 0.012, col:fc(fur), anim:t => [0, 0, 0, 0] , capEnd:true });
    ellip(mb, [0.12, -0.24, sz * 0.11], [0.06, 0.02, 0.045], { n:4, m:8, col:fc(shade) });
    // hind legs trailing
    tube(mb, { n:5, m:6, path:t => [-0.38 - t * 0.12, -0.03 - t * 0.04, sz * (0.06 + t * 0.02)], r:t => 0.045 - t * 0.015, col:fc(fur), anim:() => [1, 0, 0, 0], capEnd:true });
  }
  return mb;
}

// ---- the Lost City: white carbonate towers on an undersea mountain in the mid-Atlantic, some as tall as a 20-storey building,
// built by warm alkaline water seeping from the rock below (no black smoke: the fluid is clear and only about 40 to 90 degrees C)
function buildLostCity(A, seed) {
  const mb = new MB(), r = rng(seed), cream = [0.95, 0.93, 0.86], grey = [0.72, 0.7, 0.64], tip = [1.0, 1.0, 0.97];
  const towers = [[0, 0, 42, 3.2], [9, -5, 22, 2.2], [-8, 6, 26, 2.4], [5, 11, 14, 1.6], [-12, -7, 16, 1.8], [14, 6, 10, 1.3], [-4, -13, 12, 1.5], [18, -10, 7, 1.0], [-17, 2, 9, 1.2], [3, -20, 6, 0.9], [-2, 18, 8, 1.1], [11, 18, 5, 0.8]];
  for (const [cx, cz, H, R] of towers) {
    const y0 = groundAt(A, cx, cz) - 0.5, w = r() * TAU;
    const path = t => [cx + Math.sin(t * 2.2 + w) * R * 0.5 * t, y0 + t * H, cz + Math.cos(t * 1.7 + w) * R * 0.5 * t];
    tube(mb, { n:Math.ceil(H * 1.2), m:12, path, r:t => R * (1.25 - t * 0.75) * (0.85 + 0.25 * Math.sin(t * H * 0.9 + w)),
      col:(t, u, p) => t > 0.92 ? tip : Math.sin(p[1] * 1.3 + u * 9) > 0.55 ? grey : cream, capEnd:true });
    // the flanges: ledges that grow out sideways where fluid seeps from the tower's flanks, warm water pooling under them
    const nf = Math.floor(H / 6);
    for (let k = 0; k < nf; k++) {
      const t = 0.3 + r() * 0.6, p = path(t), a = r() * TAU, rr = R * (1.25 - t * 0.75) + 0.6 + r() * 1.2, c = [p[0] + Math.cos(a) * rr * 0.5, p[1], p[2] + Math.sin(a) * rr * 0.5];
      ellip(mb, c, [rr, 0.25, rr * 0.8], { n:4, m:12, shape:q => [q[0], q[1] < 0 ? q[1] * 0.3 : q[1], q[2]], col:(u, v, q) => q[1] < c[1] ? grey : cream });
    }
  }
  // rubble and smaller chimneys round the base
  for (let k = 0; k < 40; k++) { const a = r() * TAU, d = 4 + r() * 22, x = Math.cos(a) * d, z = Math.sin(a) * d, h = 0.5 + r() * 2.5;
    tube(mb, { n:3, m:6, path:t => [x, groundAt(A, x, z) - 0.2 + t * h, z], r:t => (0.4 + r() * 0.1) * (1 - t * 0.6), col:fc(r() < 0.5 ? cream : grey), capEnd:true }); }
  return mb;
}

function mkWalrus() {
  // a walrus swimming, one unit long, head at +x: a vast wrinkled brown body, a small head with a broad bristly muzzle, two long
  // ivory tusks pointing down and back, fore flippers it steers with and hind flippers it swims with
  const mb = new MB(), skin = [0.55, 0.38, 0.3], dark = [0.4, 0.27, 0.22], ivory = [0.95, 0.92, 0.82];
  loft(mb, { n:28, m:16, sec:t => {
      const f = t < 0.15 ? 0.5 + 0.5 * smooth(0, 0.15, t) : t < 0.55 ? 1 : 1 - 0.8 * smooth(0.55, 1, t);
      return { x:0.3 - t * 0.78, y:0.01, w:0.17 * f, h:0.15 * f, e:2 };
    }, col:(t, u, p, sy) => Math.sin(p[0] * 70 + p[1] * 30) > 0.7 ? dark : skin, anim:t => [0.15 + t * 0.7, 0, 0, 0] });
  ellip(mb, [0.35, 0.0, 0], [0.09, 0.08, 0.09], { n:8, m:12, col:fc(skin), anim:() => [0.05, 0, 0, 0] });
  ellip(mb, [0.42, -0.03, 0], [0.05, 0.06, 0.085], { n:6, m:10, col:(u, v, p) => Math.sin(p[2] * 200) > 0.3 ? [0.8, 0.7, 0.55] : dark, anim:() => [0.05, 0, 0, 0] });   // the whiskered muzzle
  for (const sz of [1, -1]) {
    tube(mb, { n:6, m:6, path:t => [0.43 - t * 0.06, -0.06 - t * 0.2, sz * (0.035 - t * 0.008)], r:t => 0.014 * (1 - t * 0.6), col:fc(ivory), anim:() => [0.05, 0, 0, 0] });   // the tusks
    ellip(mb, [0.38, 0.05, sz * 0.06], [0.01, 0.01, 0.007], { n:3, m:5, col:fc([0.05, 0.04, 0.04]), anim:() => [0.05, 0, 0, 0] });
    fin(mb, [[0, 0.03], [0.1, 0.04], [0.2, 0.0], [0.1, -0.04], [0, -0.03]], { origin:[0.16, -0.1, sz * 0.12], ua:vnorm([-0.5, -0.3, sz]), va:[1, 0, 0], col:fc(dark), anim:(a) => [0.2, a * 2, 0, 0] });
    fin(mb, [[0, 0.03], [0.08, 0.06], [0.16, 0.05], [0.17, -0.02], [0, -0.03]], { origin:[-0.46, -0.02, sz * 0.03], ua:vnorm([-1, 0, sz * 0.3]), va:[0, 0, sz], col:fc(dark), anim:() => [1, 0, 0, 0] });
  }
  return mb;
}

// ---- mangroves: trees standing in the sea on arching prop roots; the roots shelter young fish
function buildMangroves(A, seed) {
  const mb = new MB(), r = rng(seed), bark = [0.45, 0.33, 0.24], root = [0.38, 0.3, 0.22], leaf = [0.25, 0.55, 0.22], leaf2 = [0.35, 0.65, 0.28];
  for (let k = 0; k < 16; k++) {
    const a = r() * TAU, d = Math.sqrt(r()) * 22, x = Math.cos(a) * d, z = Math.sin(a) * d, H = 4 + r() * 4, base = 1.6 + r() * 0.8;
    tube(mb, { n:6, m:6, path:t => [x + Math.sin(t * 2 + k) * 0.3, -A[1] + base + t * H, z + Math.cos(t * 2 + k) * 0.3], r:t => 0.16 * (1 - t * 0.5), col:fc(bark) });
    for (let j = 0; j < 9; j++) {
      const b = j / 9 * TAU + r(), reach = 1.2 + r() * 1.3, gx = x + Math.cos(b) * reach, gz = z + Math.sin(b) * reach, gy = groundAt(A, gx, gz) - 0.1;
      const y0 = -A[1] + base + 0.2 + r() * 0.8;
      tube(mb, { n:10, m:4, path:t => [lerp(x, gx, t), lerp(y0, gy, t) + Math.sin(t * PI) * 0.9, lerp(z, gz, t)], r:0.05, col:t => (A[1] + lerp(y0, gy, t) + Math.sin(t * PI) * 0.9) < 0.1 ? mixc(root, [0.25, 0.3, 0.12], 0.5) : root });
    }
    // the canopy: clumps of leaves
    for (let j = 0; j < 9; j++) { const c = [x + (r() - 0.5) * 3.5, -A[1] + base + H + (r() - 0.3) * 1.6, z + (r() - 0.5) * 3.5], s = 1 + r() * 1.2;
      ellip(mb, c, [s, s * 0.6, s], { n:6, m:9, shape:p => vadd(p, [Math.sin(p[1] * 9) * 0.15, 0, Math.cos(p[0] * 8) * 0.15]), col:(u, v, p) => Math.sin(p[0] * 7 + p[2] * 5) > 0 ? leaf : leaf2, anim:() => [0, 0, 0.3, 0] }); }
  }
  // upside-down jellyfish (Cassiopea) lying bell-down on the mud, arms up, farming algae in their tissues in the sun
  for (let k = 0; k < 10; k++) {
    const a = r() * TAU, d = r() * 18, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 0.15 + r() * 0.1;
    const mk = mb.mark();
    mergeInto(mb, jelly({ h:0.25, bell:[0.62, 0.6, 0.38], arms:{ n:8, len:0.25, w:0.06, col:[0.45, 0.55, 0.3] } }));
    mb.xform(mk, chain(rotZ(-PI / 2), scl(s), move([x, groundAt(A, x, z) + s * 0.1, z])));
  }
  return mb;
}
// ---- seagrass: a flowering plant that went back to the sea; one meadow can store carbon faster than a rainforest
function buildSeagrass(A, seed) {
  const mb = new MB(), r = rng(seed);
  // the meadow's floor: a dense dark mat of leaves and roots over the sand
  const N = 40, rows = [];
  for (let i = 0; i <= N; i++) { const row = []; for (let j = 0; j <= N; j++) { const x = (i / N - 0.5) * 60, z = (j / N - 0.5) * 60, e = smooth(30, 22, Math.hypot(x, z) * (1 + 0.15 * Math.sin(Math.atan2(z, x) * 5)));
      row.push(mb.v([x, groundAt(A, x, z) + 0.03 * e - 0.02, z], e > 0.02 ? mixc([0.24, 0.24, 0.18], [0.08, 0.15, 0.06], e * (0.7 + 0.3 * Math.sin(x * 1.3) * Math.sin(z * 1.1))) : [0.24, 0.24, 0.18])); } rows.push(row); }
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) mb.quad(rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]);
  for (let k = 0; k < 3200; k++) {
    const a = r() * TAU, d = Math.sqrt(r()) * 24, x = Math.cos(a) * d, z = Math.sin(a) * d, L = 0.3 + r() * 0.5, y0 = groundAt(A, x, z) - 0.02, lean = r() * TAU;
    const side = [Math.cos(lean + 1.57), 0, Math.sin(lean + 1.57)];
    ribbon(mb, { n:4, path:t => [x + Math.cos(lean) * t * t * L * 0.4, y0 + t * L, z + Math.sin(lean) * t * t * L * 0.4], side, w:0.012,
      col:t => mixc([0.25, 0.42, 0.12], [0.55, 0.65, 0.25], t), anim:t => [0, 0, t * 0.6, 0] });
  }
  return mb;
}
function mkDugong() {
  // a sea cow: grey-brown, a broad downturned snout with a bristly upper lip for grazing seagrass, paddle flippers, a whale-like fluke
  const skin = [0.55, 0.47, 0.42], belly = [0.66, 0.58, 0.52];
  return cetacean({ back:skin, belly, H:0.12, W:0.12, nose:0.32, bodyLen:0.87, eye:[0.06, 0.2, 0.01], tailH:0.17, tailL:0.12, tm:0.38, ped:0.15,
    camber:t => t < 0.12 ? -0.35 * (1 - t / 0.12) : 0,
    hShape:t => t < 0.1 ? lerp(0.8, 1, t / 0.1) : 1,
    pect:{ at:0.2, len:0.1, w:0.05, down:0.7, back:0.4, y:-0.5, col:skin },
    extra:(mb) => ellip(mb, [0.47, -0.06, 0], [0.04, 0.035, 0.05], { n:5, m:8, col:fc([0.62, 0.52, 0.45]), anim:p => swimA(p) }) });
}
// a dugong grazes slowly along the floor, nose down, surfacing now and then to breathe
function grazeMotion(o, t) {
  const A = o.anchor, cyc = 70, u = ((t % cyc) + cyc) % cyc / cyc, a = t * 0.02;
  const x = A[0] + Math.cos(a) * 9, z = A[2] + Math.sin(a) * 9, fl = floorY(x, z);
  const breathe = smooth(0.82, 0.88, u) * (1 - smooth(0.94, 1, u));
  const y = lerp(fl + 0.45, -0.6, breathe);
  o.pos = [x, y, z];
  o.fwd = vnorm([-Math.sin(a), lerp(-0.12, 0.25, breathe), Math.cos(a)]);
  const sd = vnorm(vcross(o.fwd, [0, 1, 0])); o.up = vnorm(vcross(sd, o.fwd)); o.side = vcross(o.fwd, o.up);
}

function addPlaces2() {
  const SM = [40000, 3200], SEEP = [12600, -900], ICE = [6000, -3000], MANG = [45, -300], GRASS = [520, -650];
  addObj({ key:'seamount', name:'a seamount', label:'seamount', type:'a deep coral garden on an underwater volcano', kind:'places', floor:[SM[0], SM[1], 0], size:50, rad:30,
    fact:'There may be over 100,000 seamounts over 1,000 m tall, most never visited. Currents sweeping up their flanks bring food to slow-growing deep corals: some black corals have been dated at over 4,000 years old, among the oldest living things known.',
    parts:[part(() => buildSeamountGarden(BYKEY.seamount.anchor, 31), { mat:[1, 0.3, 1, 0.3], sway:[0.05, 0.6, 1.5, 0] }),
      part(mkOrangeRoughy, { inst:schoolMill(220, 5, 2.5, 77, 0.6), school:[0, 0.35, 1, 0], off:[0, 7, 0], mat:M_SKIN, shy:6, ...FISH_SWIM(0.05, 1.4, 0.9, 1.8) })],
    views:[{ d:[0.5, 0.25, 1], k:0.24, hold:12, drift:0.025, frame:'world', off:[0, 1.5, 0] }, { d:[-0.8, 0.12, 0.5], k:0.12, hold:10, drift:0.025, frame:'world', off:[3, 1, -2] }, { d:[0.3, 0.15, 1], k:0.3, hold:9, drift:0.02, frame:'world', off:[0, 6, 0] }] });
  addObj({ key:'roughy', name:'orange roughy', type:'Hoplostethus atlanticus', kind:'fish', place:true, floor:[SM[0], SM[1], 7], size:0.35, vsize:10, rad:7,
    fact:'They gather over seamounts to feed and spawn, and can live for 150 years or more, not breeding until they are about 30. Fished hard from the 1980s, many populations collapsed before anyone knew how slowly they grow.',
    views:[{ d:[0.3, 0.15, 1], k:0.45, hold:10, drift:0.02, frame:'world', off:[4, 0, 0] }, { d:[1, 0.1, 0.3], k:0.35, hold:9, drift:0.02, frame:'world', off:[0, 0, 4] }] });
  addObj({ key:'seep', name:'cold seep & brine pool', label:'brine pool', type:'a lake at the bottom of the sea', kind:'places', floor:[SEEP[0], SEEP[1], 0], size:20, rad:13,
    fact:'Brine seeping up through ancient salt beds is so much denser than seawater that it pools on the floor as a lake, with a shore and waves of its own. Mussels and tube worms line its edge, living on bacteria fed by methane; animals that swim into the brine can die there.',
    parts:[part(() => buildSeep(BYKEY.seep.anchor, 41), { mat:[1, 0.3, 1, 1.4], sway:[0.15, 0.7, 0.8, 0] })],
    views:[{ d:[0.6, 0.45, 1], k:0.75, hold:12, drift:0.02, frame:'world' }, { d:[1, 0.12, 0.2], k:0.4, hold:10, drift:0.02, frame:'world', off:[3, 0, 0] }, { d:[0.1, 0.95, 0.2], k:0.8, hold:9, drift:0.02, frame:'world' }] });
  addObj({ key:'seaice', name:'under the Arctic ice', label:'sea ice', type:'the underside of sea ice', kind:'places', at:[ICE[0], ICE[1], 0], size:60, rad:150,
    fact:'Sea ice is not solid: it is threaded with channels of brine where algae grow, staining its underside brown and feeding the Arctic food web from the top down. As the brine drains, it can freeze the water round it into a hollow icicle, a brinicle, that grows down to the floor.',
    parts:[part(() => buildIce(BYKEY.seaice.anchor, 51), { mat:[1, 0.3, 0.7, 0.8], glowSun:true, tint:[0.3, 0.3, 0.3] }),
      part(mkSardine, { inst:schoolMill(180, 5, 2, 88, 0.6), school:[0, 0.2, 1, 0], off:[14, -9, 6], tint:[0.45, 0.5, 0.45], mat:M_SKIN, ...FISH_SWIM(0.08, 3, 0.9, 1.8) })],
    views:[{ d:[0.6, -0.35, 1], k:0.22, hold:12, drift:0.015, frame:'world', off:[0, -3, 0] }, { d:[0.2, -0.85, 0.5], k:0.15, hold:10, drift:0.02, frame:'world', off:[0, -2, 0] }, { d:[0.5, 0.4, 1], k:0.6, hold:9, drift:0.015, frame:'world', air:true }] });
  addObj({ key:'narwhal', name:'narwhals', type:'Monodon monoceros · the unicorns of the sea', kind:'air', at:[ICE[0] + 10, ICE[1] + 5, 14], size:4.5, vsize:5.5, rad:6, predator:true,
    fact:'The tusk is a tooth, usually the male’s upper left canine, that spirals out through the lip to as much as 3 m. It is packed with nerve endings and may sense the water. Narwhals dive below 1,500 m under the winter pack ice to hunt halibut and squid.',
    motion:{ type:'circle', R:22, v:1.6, bob:2, bank:0.12 },
    parts:[0, 1, 2, 3].map(i => part(mkNarwhal, { scale:4.5 - i * 0.25, off:[[0, 0, 0], [-4, 1.5, 3], [-6, -1, -2.8], [-10, 0.6, 1]][i], mat:M_SKIN, swim:[0.04, 0.5 + i * 0.03, 0.7, i * 1.3], swim2:[1, 2.5, 0, 0] })),
    views:[{ d:[0.45, 0.12, 1], k:1.3, hold:11, drift:0.02, off:[1.5, 0, 0] }, { d:[1, 0.2, 0.5], k:1.1, hold:9, drift:0.02, off:[2, 0, 0] }, { d:[0.3, -0.6, 0.6], k:2.2, hold:9, drift:0.02 }] });
  addObj({ key:'beluga', name:'belugas', type:'Delphinapterus leucas · the white whale', kind:'air', at:[ICE[0] - 25, ICE[1] - 12, 12], size:4.2, vsize:5, rad:6,
    fact:'Called the sea canary for its whistles, chirps and clicks, which carry through the ice. It has no dorsal fin, so it can swim right up under the ice, and a flexible neck that lets it turn its head. Its forehead, the melon, changes shape as it focuses its calls.',
    motion:{ type:'circle', R:18, v:1.3, bob:1.5, bank:0.1 },
    parts:[0, 1, 2].map(i => part(mkBeluga, { scale:4.2 - i * 0.5, off:[[0, 0, 0], [-4.5, 1.2, 2.6], [-3, -1, -3.2]][i], mat:M_SKIN, swim:[0.04, 0.45 + i * 0.04, 0.7, i * 1.7], swim2:[1, 2.5, 0, 0] })),
    views:[{ d:[0.4, 0.1, 1], k:1.3, hold:11, drift:0.02, off:[1, 0, 0] }, { d:[1, -0.3, 0.4], k:1.2, hold:9, drift:0.02 }] });
  addObj({ key:'seaangel', name:'sea angels', type:'Clione limacina · a swimming snail', kind:'micro', at:[ICE[0] + 4, ICE[1] - 6, 6], size:0.03, vsize:0.2, rad:0.3,
    fact:'A snail that has lost its shell and turned its foot into a pair of flapping wings. It hunts only one prey, the sea butterfly, a shelled cousin, seizing it with six tentacles that shoot from its head and pulling the snail out of its shell.',
    motion:{ type:'hover', amp:0.04, turn:0.6, pitch:1.2 },
    parts:[[0, 0, 0], [-0.04, -0.03, 0.05], [0.05, 0.02, -0.05]].map((off, i) => part(mkSeaAngel, { scale:0.03 - i * 0.004, off, mat:[0.5, 1.4, 1, 0.5], trans:true, swim2:[0, 2, 0.008, 2.6 + i * 0.4] })),
    views:[{ d:[0.3, 0.1, 1], k:1.5, hold:10, drift:0.02 }, { d:[1, 0.3, 0.3], k:1.4, hold:9, drift:0.02 }] });
  addObj({ key:'polarbear', name:'polar bear', type:'Ursus maritimus · a marine mammal', kind:'air', at:[ICE[0] + 18, ICE[1] + 16, 1.2], size:2.3, rad:1.6,
    fact:'Classed as a marine mammal: it lives on the sea ice and hunts seals from it, and can swim for days at a stretch, one female for over 680 km. It paddles with its huge front paws and can dive for a minute or more to stalk a seal. As the summer ice shrinks, it must swim farther.',
    motion:{ type:'circle', R:9, v:0.7, bob:0.15, bank:0.05 },
    parts:[part(mkPolarBear, { scale:2.3, mat:[1, 0.5, 1, 0.4], swim:[0.02, 0.6, 0.6, 0], swim2:[1, 2, 0.12, 0.9] })],
    views:[{ d:[0.3, -0.35, 1], k:1.8, hold:10, drift:0.02 }, { d:[1, -0.2, 0.3], k:1.6, hold:9, drift:0.02 }, { d:[0.2, -0.85, 0.4], k:1.6, hold:9, drift:0.02 }] });
  addObj({ key:'walrus', name:'walrus', type:'Odobenus rosmarus', kind:'air', at:[ICE[0] + 30, ICE[1] - 4, 5], size:3.2, rad:2.2,
    fact:'Up to 1.5 tonnes and 3.5 m. It feeds on the seafloor, finding clams with its 400 or more sensitive whiskers and sucking them out of their shells with its powerful mouth. The tusks, up to a metre long, are for fighting, for show, and for hauling out onto the ice.',
    motion:{ type:'circle', R:10, v:0.8, bob:1, bank:0.08 },
    parts:[part(mkWalrus, { scale:3.2, mat:M_SKIN, swim:[0.02, 0.5, 0.6, 0], swim2:[1, 2, 0.06, 0.6] })],
    views:[{ d:[0.3, 0.1, 1], k:1.7, hold:10, drift:0.02 }, { d:[1, -0.2, 0.3], k:1.5, hold:9, drift:0.02 }] });
  addObj({ key:'lionsmane', name:'lion’s mane jellyfish', label:'lion’s mane', type:'Cyanea capillata', kind:'jellies', at:[ICE[0] - 14, ICE[1] + 8, 9], size:1.6, vsize:4, rad:3,
    fact:'The largest known jellyfish. Its bell can reach 2 m across and its hundreds of sticky tentacles trail over 30 m: one found in 1870 was longer than a blue whale. It thrives in cold Arctic and North Atlantic water.',
    motion:{ type:'drift', amp:0.4, tilt:0.15 },
    parts:[part(mkLionsMane, { scale:1.6, mat:[0.8, 0.7, 1, 0.4], trans:true, pulse:[0.1, 0.3, 0, 0], sway:[0.12, 0.3, 2, 0] })],
    views:[{ d:[0.3, 0.1, 1], k:1.6, hold:11, drift:0.02, frame:'world', off:[0, -1.5, 0] }, { d:[0.2, 0.9, 0.3], k:1.0, hold:9, drift:0.02, frame:'world' }, { d:[0.5, -0.5, 0.8], k:1.2, hold:9, drift:0.02, frame:'world', off:[0, -3, 0] }] });
  addObj({ key:'lostcity', name:'the Lost City', label:'Lost City', type:'white carbonate towers on the Mid-Atlantic Ridge', kind:'places', floor:[12900, 1100, 0], size:45, rad:28,
    fact:'Discovered in 2000 on an undersea mountain in the mid-Atlantic: towers of white limestone up to 60 m tall, built over 100,000 years or more by warm, alkaline water rising through the rock. Unlike black smokers it runs on reactions between seawater and mantle rock, and some scientists think life on Earth may have begun in a place like it.',
    parts:[part(() => buildLostCity(BYKEY.lostcity.anchor, 2000), { mat:[1, 0.3, 1, 0.3] })],
    views:[{ d:[0.6, 0.15, 1], k:1.55, hold:12, drift:0.015, frame:'world', off:[0, 20, 0] }, { d:[0.2, 0.05, 1], k:0.55, hold:10, drift:0.015, frame:'world', off:[0, 28, 0] }, { d:[-0.8, 0.6, 0.5], k:0.9, hold:9, drift:0.015, frame:'world', off:[0, 10, 0] }] });
  const WRECK = [3200, -600];
  addObj({ key:'wreck', name:'a wreck turned reef', label:'shipwreck', type:'a 60 m freighter on the sand at 30 m', kind:'places', floor:[WRECK[0], WRECK[1], 0], size:60, rad:32, yaw:0.5, frame:'obj',
    fact:'A sunken ship is a ready-made reef. Within months its steel is coated with algae and sponges; within years soft corals, sea fans and anemones cover it, and fish shelter in its holds. Some navies and harbours now sink old ships on purpose to make new reefs.',
    parts:[part(() => buildWreck(BYKEY.wreck.anchor, 33), { mat:[1, 0.2, 1, 0.3], sway:[0.04, 0.7, 1.2, 0] }),
      part(mkSardine, { inst:schoolCloud(350, 3, 1.5, 133, 1, 0.3), school:[1, 0.06, 1, 0], off:[-2, 6, 2], tint:[1.0, 0.85, 0.6], mat:M_SILVER, shy:10, ...FISH_SWIM(0.06, 3, 0.9, 1.8) })],
    views:[{ d:[0.45, 0.3, 1], k:0.5, hold:12, drift:0.015, off:[0, 3, 0] }, { d:[0.6, 0.15, 1], k:0.35, hold:10, drift:0.015, off:[20, 3, 0] }, { d:[-0.5, 0.45, 0.8], k:0.26, hold:9, drift:0.015, off:[-22, 6, 0] }] });
  const SARG = [5200, 900];
  addObj({ key:'sargassum', name:'sargassum raft', label:'sargassum', type:'a floating forest · Sargassum natans', kind:'places', at:[SARG[0], SARG[1], 0.2], size:7, rad:4,
    fact:'Golden-brown seaweed that never touches the bottom, buoyed up by berry-like air bladders. In the Sargasso Sea rafts of it gather into floating forests that shelter baby turtles, eels on their way from their spawning grounds, and fish found nowhere else.',
    motion:{ type:'still', fn:(o, t) => { const A = o.anchor; o.pos = [A[0] + 0.5 * Math.sin(t * 0.03), 0, A[2]]; o.fwd = [1, 0, 0]; o.up = [0, 1, 0]; o.side = [0, 0, 1]; } },
    parts:[part(() => buildSargassum(91), { mat:[1, 0.35, 1, 0.3], sway:[0.06, 0.6, 1.5, 0] })],
    views:[{ d:[0.3, -0.75, 0.6], k:1.0, hold:11, drift:0.02, frame:'world' }, { d:[0.6, -0.35, 1], k:1.1, hold:9, drift:0.02, frame:'world', off:[0, -0.8, 0] }] });
  addObj({ key:'sargassumfish', name:'sargassum fish', type:'Histrio histrio · a frogfish', kind:'fish', at:[SARG[0] + 0.6, SARG[1] - 0.4, 0.5], size:0.15, rad:0.12, yaw:2,
    fact:'A frogfish that lives its whole life in floating weed, coloured and fringed to match it. It clambers through the raft on fins shaped like hands, and swallows prey nearly its own size with a mouth that opens in a few thousandths of a second.',
    motion:{ type:'hover', amp:0.04, turn:0.4 },
    parts:[part(mkSargassumFish, { scale:0.15, mat:M_SKIN, ...FISH_SWIM(0.03, 1, 0.9, 2) })],
    views:[{ d:[0.3, 0.1, 1], k:2.4, hold:10, drift:0.02 }, { d:[1, -0.3, 0.4], k:2.4, hold:9, drift:0.02 }] });
  addObj({ key:'mangroves', name:'the mangroves', label:'mangroves', type:'a forest standing in the sea', kind:'places', floor:[MANG[0], MANG[1], 0], size:44, rad:24,
    fact:'Mangrove trees stand in salt water on arching prop roots, filtering out salt as they drink. The tangle of roots is a nursery: many reef fish spend their first years hiding there. Mangrove forests break storm waves and store several times more carbon than inland forests.',
    parts:[part(() => buildMangroves(BYKEY.mangroves.anchor, 61), { mat:[1, 0.3, 1, 0.3] }),
      part(mkAnthias, { inst:schoolCloud(90, 8, 0.3, 66, 1, 0.4), school:[1, 0.08, 1, 0], off:[0, 0.5, 0], tint:[0.6, 0.7, 0.55], mat:M_SKIN, shy:16, ...FISH_SWIM(0.07, 3, 0.9, 1.8) })],
    views:[{ d:[0.6, -0.1, 1], k:0.2, hold:12, drift:0.02, frame:'world', off:[0, 0.4, 0] }, { d:[0.6, 0.35, 1], k:0.75, hold:10, drift:0.015, frame:'world', off:[0, 3, 0], air:true }, { d:[1, 0.02, 0.2], k:0.12, hold:9, drift:0.02, frame:'world', off:[2, 0.2, 2] }] });
  addObj({ key:'boxjelly', name:'box jellyfish', type:'sea wasp · Chironex fleckeri', kind:'jellies', at:[MANG[0] + 115, MANG[1], 0.9], size:0.25, vsize:0.6, rad:0.6,
    fact:'One of the most venomous animals alive: its tentacles carry millions of stinging cells. Unlike most jellyfish it swims fast and sees: 24 eyes in four clusters, some with lenses, steer it along the channels off the mangroves, where it hunts shrimp and small fish.',
    motion:{ type:'drift', amp:0.25, tilt:0.35 },
    parts:[part(mkBoxJelly, { scale:0.25, mat:[0.4, 0.8, 0.2, 0.4], trans:true, pulse:[0.16, 0.9, 0, 0], sway:[0.05, 0.7, 4, 0] })],
    views:[{ d:[0.3, 0.05, 1], k:2.6, hold:10, drift:0.02, frame:'world', off:[0, -0.15, 0] }, { d:[0.5, -0.3, 0.8], k:2.4, hold:9, drift:0.02, frame:'world' }] });
  addObj({ key:'seagrass', name:'seagrass meadow', label:'seagrass', type:'turtle grass · a flowering plant of the sea', kind:'places', floor:[GRASS[0], GRASS[1], 0], size:50, rad:26,
    fact:'Seagrasses are flowering plants that returned to the sea about 100 million years ago; they even pollinate underwater. Meadows cover a fraction of a percent of the seafloor but bury a tenth of the ocean’s carbon each year.',
    parts:[part(() => buildSeagrass(BYKEY.seagrass.anchor, 71), { mat:[1, 0.2, 1, 0.2], sway:[0.12, 0.9, 2, 0] })],
    views:[{ d:[0.6, 0.35, 1], k:0.08, hold:12, drift:0.025, frame:'world', off:[0, 0.4, 0] }, { d:[1, 0.1, 0.2], k:0.04, hold:9, drift:0.02, frame:'world', off:[0, 0.3, 0] }, { d:[0.3, 0.7, 0.6], k:0.2, hold:9, drift:0.02, frame:'world' }] });
  addObj({ key:'dugong', name:'dugong', type:'Dugong dugon · a sea cow', kind:'air', floor:[GRASS[0], GRASS[1], 0.5], size:3, rad:2,
    fact:'The only strictly marine plant-eating mammal. It grazes seagrass up roots and all, leaving tell-tale trails across the meadow, and rises every few minutes to breathe. Sailors’ tales of mermaids may owe something to dugongs and manatees.',
    motion:{ type:'still', fn:grazeMotion },
    parts:[part(mkDugong, { scale:3, mat:M_SKIN, ...WHALE_SWIM(0.03, 0.3) })], views:SIDE });
  addObj({ key:'seadragon', name:'leafy seadragon', type:'Phycodurus eques', kind:'fish', floor:[GRASS[0] + 29, GRASS[1] - 3, 0.6], size:0.35, rad:0.3, yaw:0.6,
    fact:'A cousin of the seahorse, from the kelp and seagrass of southern Australia. The leafy lobes are only camouflage: it drifts like a scrap of weed, driven by tiny, almost invisible fins on its neck and back. As with seahorses, the male carries the eggs.',
    motion:{ type:'hover', amp:0.08, turn:0.15 },
    parts:[part(mkSeadragon, { scale:0.35, mat:M_SKIN, sway:[0.03, 0.7, 3, 0] })],
    views:[{ d:[0.15, -0.1, 1], k:1.5, hold:10, drift:0.02 }, { d:[0.8, 0.05, 0.6], k:1.6, hold:9, drift:0.02 }] });
}
