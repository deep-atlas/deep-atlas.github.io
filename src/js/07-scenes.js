// ---- the large places, built in metres around an anchor on the floor. Every piece stands on the real floor height.

// the floor height under (dx, dz) from an anchor, relative to the anchor's own floor
const groundAt = (A, dx, dz) => floorY(A[0] + dx, A[2] + dz) - A[1];

// ---- corals
function brainCoral(mb, c, r, col, seed) {
  const k = 3 + hash1(seed) * 3;
  ellip(mb, c, [r, r * 0.7, r * 0.95], { n:10, m:16, shape:p => [p[0], Math.max(p[1], c[1] - r * 0.1), p[2]],
    col:(u, v, p) => Math.sin((p[0] - c[0]) / r * 9 * k / 4 + Math.sin((p[2] - c[2]) / r * k) * 2.5) > 0.2 ? col : mixc(col, [0.2, 0.15, 0.1], 0.5) });
}
function staghorn(mb, c, s, col, seed) {
  const r = rng(seed);
  const branch = (p, d, len, rad, depth) => {
    const end = vmad(p, d, len);
    tube(mb, { n:3, m:5, path:t => vlerp(p, end, t), r:t => rad * (1 - t * 0.3), col:t => t > 0.85 && depth > 2 ? mixc(col, [1, 1, 0.9], 0.6) : col, anim:t => [0, 0, 0, 0], capEnd:depth > 2 });
    if (depth > 2) return;
    const n = 2 + (r() < 0.5 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const nd = vnorm(vadd(d, [(r() - 0.5) * 1.3, r() * 0.5, (r() - 0.5) * 1.3]));
      branch(end, nd, len * (0.6 + r() * 0.3), rad * 0.7, depth + 1);
    }
  };
  for (let k = 0; k < 4; k++) branch(c, vnorm([(r() - 0.5) * 0.8, 1, (r() - 0.5) * 0.8]), s * (0.3 + r() * 0.15), s * 0.032, 0);
}
function tableCoral(mb, c, rad, col) {
  tube(mb, { n:3, m:6, path:t => [c[0], c[1] + t * rad * 0.5, c[2]], r:rad * 0.12, col:fc(mixc(col, [0.3, 0.25, 0.2], 0.4)) });
  const pts = []; for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; pts.push([Math.cos(a) * rad * (1 + 0.12 * Math.sin(a * 5)), Math.sin(a) * rad * (1 + 0.12 * Math.sin(a * 5))]); }
  fin(mb, pts, { origin:[c[0], c[1] + rad * 0.5, c[2]], ua:[1, 0, 0], va:[0, 0, 1], rings:5, center:[0, 0], col:(a, b, rr) => rr > 0.92 ? mixc(col, [1, 1, 0.9], 0.4) : (Math.sin(Math.atan2(b, a) * 30) > 0.5 ? mixc(col, [0, 0, 0], 0.25) : col) });
}
function seaFan(mb, c, s, col, seed) {
  const r = rng(seed), yaw = r() * PI, ax = [Math.cos(yaw), 0, Math.sin(yaw)];
  const pts = []; for (let k = 0; k <= 16; k++) { const a = k / 16 * PI; pts.push([Math.cos(a) * s * 0.55, Math.sin(a) * s * (0.9 + 0.1 * Math.sin(a * 7))]); }
  pts.push([-s * 0.05, 0], [s * 0.05, 0]);
  fin(mb, pts, { origin:c, ua:ax, va:[0, 1, 0], rings:6, center:[0, s * 0.1], col:(a, b) => (Math.abs(Math.sin(a * 40 / s + b * 5)) < 0.3 || Math.abs(Math.sin(b * 40 / s - a * 6)) < 0.3) ? col : mixc(col, [0.05, 0.05, 0.08], 0.75), anim:(a, b) => [0, 0, Math.max(0, b) / s * 0.4, 0] });
}
function uprightLoft(mb, c, h, prof, col, capEnd) {
  const mk = mb.mark();
  loft(mb, { n:8, m:14, capEnd, sec:t => { const w = prof(t) * h; return { x:t * h, y:0, w, h:w, e:2 }; }, col, anim:t => [0, 0, 0, 0] });
  mb.xform(mk, chain(rotZ(PI / 2), move(c)));
}
function softCoral(mb, c, s, col, seed) {
  const r = rng(seed);
  for (let k = 0; k < 9; k++) {
    const d = vnorm([(r() - 0.5) * 1.2, 1, (r() - 0.5) * 1.2]), L = s * (0.5 + r() * 0.5);
    tube(mb, { n:5, m:5, path:t => vadd(c, vmul(vadd(d, [0, -t * 0.3, 0]), t * L)), r:t => s * 0.06 * (1 - t * 0.4), col:t => mixc(col, [1, 1, 1], t * 0.3), anim:t => [0, 0, t * 0.3, 0] });
  }
}
function anemone(mb, c, s, col, tip) {
  uprightLoft(mb, c, s * 0.35, t => 0.45 - t * 0.05, fc(mixc(col, [0.4, 0.2, 0.2], 0.5)), true);
  const r = rng(Math.floor(c[0] * 13 + c[2] * 7));
  for (let k = 0; k < 70; k++) {
    const a = r() * TAU, d0 = Math.sqrt(r()) * s * 0.42, L = s * (0.25 + r() * 0.2);
    const b = [c[0] + Math.cos(a) * d0, c[1] + s * 0.35, c[2] + Math.sin(a) * d0];
    tube(mb, { n:5, m:4, path:t => [b[0] + Math.cos(a) * t * L * 0.6, b[1] + t * L * (1 - t * 0.3), b[2] + Math.sin(a) * t * L * 0.6], r:t => s * 0.025 * (1 - t * 0.3), col:t => t > 0.75 ? tip : col, anim:t => [0, 0, t * 0.6, 0] });
  }
}
function giantClam(mb, c, s, yaw) {
  const mk = mb.mark();
  for (const sz of [1, -1]) ellip(mb, [0, s * 0.18, sz * s * 0.1], [s * 0.5, s * 0.25, s * 0.12], { n:8, m:12, col:(u, v, p) => Math.sin(p[0] / s * 25) > 0.3 ? [0.82, 0.8, 0.72] : [0.7, 0.68, 0.6] });
  ellip(mb, [0, s * 0.38, 0], [s * 0.48, s * 0.06, s * 0.14], { n:6, m:12, col:(u, v, p) => Math.sin(p[0] / s * 40 + Math.sin(p[2] / s * 30) * 2) > 0 ? [0.15, 0.4, 0.95] : [0.3, 0.85, 0.8] });
  mb.xform(mk, chain(rotY(yaw), move(c)));
}

function buildReef(A, seed) {
  const mb = new MB(), r = rng(seed);
  const palette = [[1.0, 0.62, 0.32], [0.78, 0.5, 0.9], [1.0, 0.88, 0.38], [0.55, 0.9, 0.5], [1.0, 0.55, 0.62], [0.62, 0.75, 1.0], [1.0, 0.7, 0.42], [0.9, 0.9, 0.7]];
  const pick = () => palette[Math.floor(r() * palette.length)];
  // coral heads (bommies): clusters of colonies on rock mounds, densest round the anemone
  const heads = [[4.5, 1.5, 3.2]];
  for (let k = 0; k < 26; k++) { const a = r() * TAU, d = 4 + Math.pow(r(), 0.8) * 20; heads.push([Math.cos(a) * d, Math.sin(a) * d, 1.5 + r() * 3]); }
  for (const [hx, hz, hr] of heads) {
    const s = hr * 0.38;
    // rock mounds crusted with living colour: a patchwork of encrusting corals, sponges and algae
    ellip(mb, [hx, groundAt(A, hx, hz) - s * 0.35, hz], [s * 1.2, s * 0.6, s], { n:10, m:14,
      shape:p => [p[0], p[1] + 0.12 * s * Math.sin(p[0] * 3.1) * Math.sin(p[2] * 2.7), p[2]],
      col:(u, v, p) => { const n = Math.sin(p[0] * 2.3 + p[2] * 1.7) + Math.sin(p[1] * 3.7 - p[0] * 1.3) + Math.sin(p[2] * 4.1 + p[1]);
        return n > 1.0 ? palette[Math.floor(Math.abs(p[0] * 7 + p[2] * 3)) % palette.length] : n > 0.0 ? [0.42, 0.36, 0.3] : n > -0.9 ? [0.3, 0.36, 0.24] : [0.55, 0.32, 0.45]; } });
  }
  for (let k = 0; k < 340; k++) {
    const H = heads[Math.floor(Math.pow(r(), 1.4) * heads.length)];
    const a = r() * TAU, d = Math.sqrt(r()) * H[2], dx = H[0] + Math.cos(a) * d, dz = H[1] + Math.sin(a) * d;
    if (Math.hypot(dx, dz) < 3.2) continue;   // (a sand patch round the anemone)
    const mound = Math.max(0, H[2] * 0.38 * 0.65 * Math.sqrt(Math.max(0, 1 - Math.pow(d / (H[2] * 0.46), 2))));
    const c = [dx, groundAt(A, dx, dz) - 0.05 + mound * 0.8, dz], kind = r(), col = pick();
    if (kind < 0.26) brainCoral(mb, c, 0.3 + r() * 0.6, col, k);
    else if (kind < 0.48) staghorn(mb, c, 0.6 + r() * 0.9, col, k);
    else if (kind < 0.6) tableCoral(mb, c, 0.4 + r() * 0.8, col);
    else if (kind < 0.72) seaFan(mb, c, 0.8 + r() * 1.0, [0.75, 0.3, 0.6], k);
    else if (kind < 0.82) uprightLoft(mb, c, 0.6 + r() * 0.8, t => 0.32 + 0.1 * t, (t, u) => Math.abs(Math.sin(u * TAU * 7)) < 0.2 ? [0.3, 0.15, 0.1] : [0.7, 0.35, 0.2], false);
    else if (kind < 0.94) softCoral(mb, c, 0.4 + r() * 0.5, col, k);
    else giantClam(mb, c, 0.5 + r() * 0.4, r() * TAU);
  }
  // a few boulders between the heads
  for (let k = 0; k < 8; k++) {
    const a = r() * TAU, d = r() * 22, dx = Math.cos(a) * d, dz = Math.sin(a) * d, s = 0.8 + r() * 1.6;
    ellip(mb, [dx, groundAt(A, dx, dz) - s * 0.3, dz], [s, s * 0.6, s * 0.8], { n:6, m:9, col:(u, v, p) => Math.sin(p[0] * 7) * Math.sin(p[2] * 6) > 0.3 ? [0.65, 0.45, 0.5] : [0.55, 0.52, 0.45] });
  }
  // the clownfish's anemone, at the anchor
  anemone(mb, [0, groundAt(A, 0, 0), 0], 0.9, [0.85, 0.75, 0.55], [0.85, 0.4, 0.75]);
  return mb;
}

function buildKelp(A, seed) {
  const mb = new MB(), r = rng(seed);
  const kelp = [0.78, 0.62, 0.22], blade = [0.85, 0.72, 0.28];
  for (let k = 0; k < 46; k++) {
    const a = r() * TAU, d = Math.sqrt(r()) * 30, dx = Math.cos(a) * d, dz = Math.sin(a) * d;
    const y0 = groundAt(A, dx, dz), top = -A[1] - 0.6 - r() * 1.2;   // up to just under the surface
    const H = Math.max(2, top - y0), lean = r() * TAU, bend = 0.12 + r() * 0.1;
    const stipe = t => [dx + Math.cos(lean) * Math.pow(t, 2) * H * bend, y0 + t * H, dz + Math.sin(lean) * Math.pow(t, 2) * H * bend];
    tube(mb, { n:Math.ceil(H * 1.2), m:4, path:stipe, r:0.025, col:fc(kelp), anim:t => [0, 0, t, 0] });
    // the holdfast
    for (let j = 0; j < 6; j++) { const b = j / 6 * TAU; tube(mb, { n:3, m:3, path:t => [dx + Math.cos(b) * t * 0.35, y0 + 0.2 - t * 0.25, dz + Math.sin(b) * t * 0.35], r:0.03, col:fc([0.4, 0.3, 0.1]) }); }
    // blades along the stipe, each with its little gas float, and a canopy at the top
    const nb = Math.floor(H / 0.55);
    for (let j = 1; j < nb; j++) {
      const t = j / nb, p = stipe(t), side = (j % 2 ? 1 : -1), ang = lean + side * 1.4 + r() * 0.6;
      const L = 0.6 + r() * 0.4 + (t > 0.9 ? 1.2 : 0), dir = [Math.cos(ang), 0.55, Math.sin(ang)];
      ellip(mb, vmad(p, dir, 0.06), [0.035, 0.035, 0.035], { n:3, m:5, col:fc([0.7, 0.55, 0.2]), anim:() => [0, 0, t, 0] });
      ribbon(mb, { n:6, path:u => vadd(vmad(p, dir, 0.08 + u * L), [0, -u * u * 0.3, 0]), side:[-Math.sin(ang), 0, Math.cos(ang)], w:u => 0.07 * Math.sin(Math.min(1, u * 1.3 + 0.2) * PI) + 0.01,
        col:u => mixc(blade, [0.5, 0.42, 0.1], u), anim:u => [0, 0, t + u * 0.15, 0] });
    }
  }
  // rocks and urchins on the floor between the plants
  for (let k = 0; k < 22; k++) {
    const a = r() * TAU, d = r() * 28, dx = Math.cos(a) * d, dz = Math.sin(a) * d, s = 0.5 + r() * 1.2;
    ellip(mb, [dx, groundAt(A, dx, dz) - s * 0.25, dz], [s, s * 0.55, s * 0.8], { n:6, m:8, col:(u, v, p) => Math.sin(p[0] * 9 + p[2] * 4) > 0.4 ? [0.7, 0.4, 0.45] : [0.35, 0.33, 0.3] });
  }
  for (let k = 0; k < 30; k++) {
    const a = r() * TAU, d = r() * 25, dx = Math.cos(a) * d, dz = Math.sin(a) * d, c = [dx, groundAt(A, dx, dz) + 0.04, dz];
    ellip(mb, c, [0.05, 0.04, 0.05], { n:4, m:6, col:fc([0.35, 0.1, 0.4]) });
    for (let j = 0; j < 14; j++) { const d2 = vnorm([r() - 0.5, r() * 0.7, r() - 0.5]); tube(mb, { n:1, m:3, path:t => vmad(c, d2, 0.04 + t * 0.07), r:t => 0.006 * (1 - t), col:fc([0.4, 0.12, 0.45]) }); }
  }
  return mb;
}

function buildVents(A, seed) {
  const mb = new MB(), r = rng(seed), tops = [];
  const chimneys = [[0, 0, 11], [7, 4, 7], [-6, 6, 8.5], [3, -8, 5.5]];
  for (const [cx, cz, H] of chimneys) {
    const y0 = groundAt(A, cx, cz) - 0.3, w = (r() - 0.5) * 0.8;
    const path = t => [cx + Math.sin(t * 3 + w) * 0.3, y0 + t * H, cz + Math.cos(t * 2.5 + w) * 0.25];
    tube(mb, { n:Math.ceil(H * 2), m:12, path, capEnd:true,
      r:t => (1.4 - t * 1.0) * (1 + 0.25 * Math.sin(t * 23 + w * 5)) * (H / 10 + 0.3),
      col:(t, u, p) => {
        const n = Math.sin(p[1] * 3.1 + u * 11) * Math.sin(u * 23 + p[1] * 1.7);
        if (n > 0.55) return [0.75, 0.42, 0.15];          // iron oxides
        if (n < -0.7) return [0.85, 0.85, 0.8];           // bacterial mats and anhydrite
        return [0.16, 0.15, 0.15];
      } });
    // ledges (flanges) that hot water pools under
    for (let j = 0; j < 2; j++) { const t = 0.35 + j * 0.25, p = path(t); ellip(mb, [p[0] + 0.4, p[1], p[2]], [0.9, 0.12, 0.7], { n:4, m:10, col:fc([0.25, 0.2, 0.18]) }); }
    tops.push(vadd(path(1), [0, 0.1, 0]));
  }
  // giant tube worms in thickets around the chimneys' feet, mussels between them
  for (let g = 0; g < 9; g++) {
    const a = r() * TAU, d = 1.6 + r() * 5, gx = g ? Math.cos(a) * d : 3, gz = g ? Math.sin(a) * d : 2;
    for (let k = 0; k < 26; k++) {
      const dx = gx + (r() - 0.5) * 1.4, dz = gz + (r() - 0.5) * 1.4, y0 = groundAt(A, dx, dz) - 0.1;
      const L = 0.6 + r() * 1.5, lean = vnorm([(r() - 0.5) * 0.6, 1, (r() - 0.5) * 0.6]), rad = 0.02 + r() * 0.025;
      const top = vmad([dx, y0, dz], lean, L);
      tube(mb, { n:4, m:5, path:t => vadd(vmad([dx, y0, dz], lean, t * L), [0, 0, 0]), r:rad, col:fc([0.9, 0.88, 0.8]), anim:t => [0, 0, t * 0.05, 0] });
      ellip(mb, vmad(top, lean, rad * 3), [rad * 1.8, rad * 4, rad * 1.8], { n:5, m:7, col:(u, v) => Math.sin(u * 40) > 0 ? [0.95, 0.08, 0.1] : [0.75, 0.05, 0.08], anim:() => [0, 0, 0.12, 0] });
    }
    for (let k = 0; k < 18; k++) { const dx = gx + (r() - 0.5) * 2.4, dz = gz + (r() - 0.5) * 2.4; ellip(mb, [dx, groundAt(A, dx, dz), dz], [0.08, 0.03, 0.04], { n:3, m:6, col:fc([0.5, 0.42, 0.3]) }); }
  }
  // pale crabs and fish on the rock: just a few, for scale
  for (let k = 0; k < 12; k++) { const a = r() * TAU, d = 1 + r() * 7, dx = Math.cos(a) * d, dz = Math.sin(a) * d; ellip(mb, [dx, groundAt(A, dx, dz) + 0.03, dz], [0.06, 0.025, 0.05], { n:3, m:6, col:fc([0.95, 0.92, 0.85]) }); }
  mb.tops = tops;
  return mb;
}

function buildWhaleFall(A, seed) {
  const mb = new MB(), r = rng(seed), bone = [0.88, 0.84, 0.74], mat = [0.95, 0.95, 0.92], rust = [0.9, 0.55, 0.2];
  const spine = t => { const x = 7 - t * 14, z = Math.sin(t * 2.4) * 1.2; return [x, groundAt(A, x, z) + 0.25 * (1 - t), z]; };
  const coat = (p, c) => { const n = Math.sin(p[0] * 5.3 + p[2] * 2) * Math.sin(p[1] * 9 + p[0] * 3); return n > 0.55 ? mat : n < -0.65 ? rust : c; };
  // the skull and the two great jaw bones
  const s0 = spine(0);
  ellip(mb, vadd(s0, [0.9, 0.2, 0]), [1.9, 0.6, 1.1], { n:8, m:12, col:(u, v, p) => coat(p, bone) });
  for (const sz of [1, -1]) tube(mb, { n:12, m:6, path:t => { const x = s0[0] + 1.6 - t * 4.2, z = s0[2] + sz * (0.9 + Math.sin(t * PI) * 0.9); return [x, groundAt(A, x, z) + 0.18, z]; }, r:0.2, col:(t, u, p) => coat(p, bone) });
  // vertebrae down the spine, ribs fallen out to either side
  for (let k = 0; k < 42; k++) {
    const t = k / 41, p = spine(0.05 + t * 0.95), s = lerp(0.45, 0.12, t);
    ellip(mb, p, [s * 0.6, s, s], { n:4, m:7, col:(u, v, q) => coat(q, bone) });
    if (k > 2 && k < 17) for (const sz of [1, -1]) {
      const L = 1.6 + Math.sin(k / 15 * PI) * 1.2, fall = 0.6 + r() * 0.4;
      tube(mb, { n:8, m:4, path:u => { const x = p[0] - u * 0.6, z = p[2] + sz * Math.sin(u * fall * PI / 2) * L; return [x, groundAt(A, x, z) + 0.08 + Math.cos(u * fall * PI / 2) * 0.5 * (1 - fall), z]; }, r:0.09, col:(u, v, q) => coat(q, bone) });
    }
  }
  // bone-eating worms (Osedax): a red fuzz on the bones
  for (let k = 0; k < 80; k++) { const t = r(), p = spine(t); ellip(mb, vadd(p, [(r() - 0.5) * 0.6, 0.15 + r() * 0.1, (r() - 0.5) * 0.6]), [0.02, 0.05, 0.02], { n:3, m:4, col:fc([0.9, 0.15, 0.15]), anim:() => [0, 0, 0.05, 0] }); }
  return mb;
}

function buildTitanic(A) {
  // the bow section as it lies today: about 140 m long, upright, nose-down in the mud, torn open where it broke from the stern.
  // x runs from the break (-70) to the stem (+70); y from the keel up.
  const mb = new MB(), r = rng(1912);
  const rust = [0.34, 0.16, 0.07], rustL = [0.62, 0.33, 0.13], black = [0.08, 0.06, 0.05], white = [0.62, 0.56, 0.47], deckC = [0.3, 0.22, 0.15], hole = [0.01, 0.008, 0.006];
  const L = 140, X0 = -70;
  // the plan: straight sides, then the bow narrowing to a sharp stem over the last 45 m; the deck rises towards the bow (sheer)
  const halfW = x => 14 * Math.pow(1 - Math.pow(clamp((x - 25) / 45, 0, 1), 2.2), 0.55) + 0.12;
  const deckH = x => 19 + 2.5 * smooth(10, 70, x);
  const hullCol = (t, u, p, sy, sz) => {
    const x = p[0], y = p[1];
    if (t < 0.004) return hole;                                                        // the open break
    if (sy > 0.96) return deckC;                                                       // the deck
    if (Math.abs(sz) > 0.4 && x < 63 && [12.8, 15.4, 17.9].some(h => Math.abs(y - h) < 0.5) && fract(x / 2.2) < 0.36) return hole;   // portholes
    if (Math.abs(sz) > 0.3 && x > 58 && x < 62 && Math.abs(y - 16.2) < 0.9) return hole;                                               // hawse pipes
    if (Math.sin(x * 2.9 + Math.sin(y * 0.7) * 1.5) > 0.66) return rustL;             // rusticles in streaks
    return y > 12 && fract(x * 0.31 + y * 0.13) < 0.35 ? black : rust;                // patches of the old black paint
  };
  loft(mb, { n:80, m:28, capStart:true, capEnd:true, sec:t => { const x = X0 + t * L, H = deckH(x); return { x, y:H / 2, w:halfW(x), h:H / 2, e:5 }; }, col:hullCol });
  // jagged plates where the hull tore apart
  for (let k = 0; k < 16; k++) {
    const y = 2 + r() * 17, z = (r() - 0.5) * 26, s = 2 + r() * 4;
    fin(mb, [[0, 0], [-s * (0.4 + r()), s * 0.3], [-s * 0.6, -s * 0.5], [0, -s * 0.4]], { origin:[X0 + 0.3, y, z], ua:vnorm([1, (r() - 0.5) * 0.6, (r() - 0.5) * 0.8]), va:vnorm([(r() - 0.5) * 0.5, 1, (r() - 0.5) * 0.5]), col:fc(r() < 0.5 ? rust : black) });
  }
  const box = (x0, x1, y0, h, w, col) => loft(mb, { n:2, m:4, sec:t => ({ x:x1 - t * (x1 - x0), y:y0 + h / 2, w, h:h / 2, e:9 }), col });
  // the forecastle: a raised deck at the bow with capstans, anchor chains and a railing round its edge
  loft(mb, { n:16, m:4, sec:t => { const x = 46 + t * 23.5; return { x, y:deckH(x) + 1.3, w:halfW(x) * 0.97, h:1.3, e:9 }; }, col:(t, u, p, sy) => sy > 0.9 ? deckC : rust });
  const fy = x => deckH(x) + 2.6;
  for (const [x, z, rad] of [[58, 2.6, 0.7], [58, -2.6, 0.7], [64, 0, 0.55], [52, 4.5, 0.45], [52, -4.5, 0.45]]) tube(mb, { n:2, m:10, path:t => [x, fy(x) + t * 1.1, z], r:rad, col:fc(black) });
  for (const sz of [1, -1]) tube(mb, { n:8, m:4, path:t => [58 + t * 3.5, fy(58) + 0.1 - t * 0.6, sz * (2.6 + t * (halfW(61.5) - 3))], r:0.18, col:fc(rustL) });
  for (let k = 0; k <= 24; k++) {
    const x = 47 + k * 0.95, z = halfW(x) * 0.95;
    for (const sz of [1, -1]) tube(mb, { n:1, m:3, path:t => [x, fy(x) + t * 1.2, sz * z], r:0.06, col:fc(rust) });
  }
  for (const sz of [1, -1]) tube(mb, { n:24, m:3, path:t => { const x = 47 + t * 22.8; return [x, fy(x) + 1.2, sz * halfW(x) * 0.95]; }, r:0.07, col:fc(rust) });
  // the well deck's cargo cranes
  for (const sz of [1, -1]) {
    tube(mb, { n:1, m:6, path:t => [40, deckH(40) + t * 4.5, sz * 5], r:0.35, col:fc(black) });
    tube(mb, { n:2, m:5, path:t => [40 + t * 4, deckH(40) + 4.5 - t * 1.5, sz * (5 - t * 1)], r:0.2, col:fc(rust) });
  }
  // the superstructure, collapsed in places: deckhouses, the bridge, the opening of the Grand Staircase
  const sup = (t, u, p, sy) => {
    if (sy > 0.9) return Math.abs(p[0] + 4) < 4 && Math.abs(p[2]) < 4 ? hole : deckC;                   // (the Grand Staircase: a hole in the roof)
    if (Math.abs(p[1] - (deckH(p[0]) + 1.6)) < 0.45 && fract(p[0] / 2.4) < 0.45) return hole;          // windows
    return Math.sin(p[0] * 1.7 + p[1] * 3) > 0.45 ? rustL : white;
  };
  box(-66, -42, deckH(-50), 3.2, 9.5, sup);
  box(-42, 14, deckH(0), 6.2, 10.5, sup);
  box(14, 24, deckH(20), 4.2, 7.5, sup);
  loft(mb, { n:2, m:4, sec:t => ({ x:23 - t * 3, y:deckH(22) + 3.6, w:12.5, h:0.35, e:9 }), col:fc(white) });   // the bridge wings
  // lifeboat davits along the boat deck, empty
  for (let k = 0; k < 8; k++) for (const sz of [1, -1]) {
    const x = -38 + k * 6.5, y0 = deckH(x) + 6.2;
    tube(mb, { n:5, m:3, path:t => [x, y0 + Math.sin(t * PI / 2) * 2, sz * (10.3 + Math.sin(t * PI / 2) * 1.4 - t * t * 0.6)], r:0.12, col:fc(black) });
  }
  // the foremast, fallen back across the bridge
  tube(mb, { n:6, m:8, path:t => [44 - t * 26, deckH(44) + 0.5 + t * 5.5, t * 1.4], r:t => 0.55 - t * 0.2, col:fc(rust) });
  tube(mb, { n:2, m:6, path:t => [36, deckH(36) + 1.1 + t * 3, 0.4], r:0.25, col:fc(black) });   // the crow's nest's stump
  // sunk nose-first: the stem is ~11 m into the mud, the break ~5 m
  mb.xform({ v:0, i:0 }, p => [p[0], p[1] - 8 - p[0] / 70 * 3, p[2]]);
  return mb;
}

function buildAbyss(A, seed) {
  const mb = new MB(), r = rng(seed);
  // a herd of sea pigs on the ooze, all facing into the current
  for (let k = 0; k < 9; k++) {
    const dx = 3 + (r() - 0.5) * 6, dz = (r() - 0.5) * 6, s = 0.12 + r() * 0.06, yaw = 0.3 + (r() - 0.5) * 0.4;
    const mk = mb.mark(); const pig = mkSeaPig(); mergeInto(mb, pig);
    mb.xform(mk, chain(scl(s), rotY(yaw), move([dx, groundAt(A, dx, dz) + s * 0.2, dz])));
  }
  for (let k = 0; k < 7; k++) {
    const dx = (r() - 0.5) * 24, dz = (r() - 0.5) * 24, s = 0.1 + r() * 0.12;
    const mk = mb.mark(); mergeInto(mb, mkXenophyophore(k + 3));
    mb.xform(mk, chain(scl(s), move([dx, groundAt(A, dx, dz) + s * 0.25, dz])));
  }
  for (let k = 0; k < 26; k++) { const dx = (r() - 0.5) * 26, dz = (r() - 0.5) * 26; mkBrittleStar(mb, [dx, groundAt(A, dx, dz), dz], 0.25 + r() * 0.2, k); }
  // glass sponges: a lattice of silica, rooted in the mud
  for (let k = 0; k < 4; k++) {
    const dx = -6 + (r() - 0.5) * 10, dz = (r() - 0.5) * 12, h = 0.4 + r() * 0.5;
    uprightLoft(mb, [dx, groundAt(A, dx, dz), dz], h, t => 0.12 + 0.08 * Math.sin(t * PI * 0.9), (t, u) => (Math.abs(Math.sin(u * TAU * 10 + t * 4)) < 0.25 || Math.abs(Math.sin(t * 30)) < 0.25) ? [0.95, 0.95, 0.9] : [0.55, 0.6, 0.6], false);
  }
  return mb;
}
function buildHadal(A, seed) {
  const mb = new MB(), r = rng(seed);
  for (let k = 0; k < 6; k++) {
    const dx = (r() - 0.5) * 20, dz = (r() - 0.5) * 20, s = 0.06 + r() * 0.06;
    const mk = mb.mark(); mergeInto(mb, mkXenophyophore(k + 40));
    mb.xform(mk, chain(scl(s), move([dx, groundAt(A, dx, dz) + s * 0.25, dz])));
  }
  // translucent sea cucumbers, the commonest large animals this deep
  for (let k = 0; k < 7; k++) {
    const dx = (r() - 0.5) * 16, dz = (r() - 0.5) * 16, s = 0.12 + r() * 0.1, yaw = r() * TAU;
    const mk = mb.mark();
    ellip(mb, [0, 0, 0], [0.5, 0.16, 0.18], { n:8, m:10, col:(u, v, p) => Math.sin(p[0] * 30) > 0.6 ? [0.95, 0.6, 0.65] : [0.9, 0.75, 0.78] });
    mb.xform(mk, chain(scl(s), rotY(yaw), move([dx, groundAt(A, dx, dz) + s * 0.12, dz])));
  }
  for (let k = 0; k < 10; k++) { const dx = (r() - 0.5) * 20, dz = (r() - 0.5) * 20; mkBrittleStar(mb, [dx, groundAt(A, dx, dz), dz], 0.15 + r() * 0.1, k + 100); }
  return mb;
}
// copy one MB's geometry into another (for herds built from single animals)
function mergeInto(dst, src) {
  const v0 = dst.count;
  for (let k = 0; k < src.count; k++) dst.v([src.P[k * 3], src.P[k * 3 + 1], src.P[k * 3 + 2]], [src.C[k * 4], src.C[k * 4 + 1], src.C[k * 4 + 2], src.C[k * 4 + 3]], [src.A[k * 4], src.A[k * 4 + 1], src.A[k * 4 + 2], src.A[k * 4 + 3]]);
  for (const i of src.I) dst.I.push(i + v0);
}

// ---- instances for schools: n fish as packed (iA, iB) pairs
function schoolMill(n, R, H, seed, speed) {
  const r = rng(seed), d = new Float32Array(n * 8);
  for (let k = 0; k < n; k++) {
    const rad = R * Math.sqrt(0.15 + r() * 0.85), w = (speed || 0.5) / Math.max(rad, 0.3) * (r() < 0.5 ? 1 : 1);
    d.set([rad, r() * TAU, (r() - 0.5) * H, w, r(), H * 0.08, 0.8 + r() * 0.4, (r() - 0.5) * 0.15], k * 8);
  }
  return d;
}
function schoolCloud(n, R, H, seed, size, drift) {
  const r = rng(seed), d = new Float32Array(n * 8);
  for (let k = 0; k < n; k++) {
    let p; do { p = [(r() - 0.5) * 2, (r() - 0.5) * 2, (r() - 0.5) * 2]; } while (vlen(p) > 1);
    d.set([p[0] * R, p[1] * H, p[2] * R, r() * TAU, r(), drift ?? R * 0.05, (size || 1) * (0.75 + r() * 0.5), (r() - 0.5) * 0.4], k * 8);
  }
  return d;
}
function schoolStream(n, L, W, seed) {
  const r = rng(seed), d = new Float32Array(n * 8);
  for (let k = 0; k < n; k++) d.set([(r() - 0.5) * L, (r() - 0.5) * W * 0.5, (r() - 0.5) * W, 0, r(), 0, 0.85 + r() * 0.3, W * 0.05], k * 8);
  return d;
}
