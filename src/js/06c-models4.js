// ---- more of the deep: the vampire squid, and ten more animals of the dark. Same conventions: one unit long, +x forward,
// unless a builder says it is drawn in metres or standing upright.

// ---- the vampire squid, in its umbrella posture: the mantle ahead, the eight-armed cloak flared open behind like a bell
function mkVampireSquid() {
  const mb = new MB();
  const skin = [0.46, 0.1, 0.11], mott = [0.3, 0.06, 0.07], web = [0.32, 0.06, 0.08], rimC = [0.12, 0.03, 0.04], cirri = [0.88, 0.82, 0.8], tip = [0.03, 0.02, 0.02];
  const mottled = p => Math.sin(p[0] * 61 + p[2] * 37) * Math.sin(p[1] * 53 + p[0] * 19) > 0.45 ? mott : skin;
  // the mantle: a soft rounded dome
  loft(mb, { n:16, m:20, capEnd:false,
    sec:t => { const f = Math.pow(Math.sin(Math.min(1, t * 1.2 + 0.05) * PI / 2), 0.55); return { x:0.48 - t * 0.42, y:0, w:0.165 * f, h:0.155 * f, e:2 }; },
    col:(t, u, p) => mottled(p), anim:t => [0, 0, 0, 0.05 * t] });
  // the head, with the large eyes (they shine blue in a light: proportionally among the biggest eyes of any animal)
  ellip(mb, [0.03, 0, 0], [0.08, 0.135, 0.145], { n:10, m:16, col:(u, v, p) => mottled(p) });
  for (const sz of [1, -1]) {
    ellip(mb, [0.04, 0.055, sz * 0.122], [0.042, 0.048, 0.026], { n:6, m:10, col:(u, v, p) => Math.hypot(p[0] - 0.04, p[1] - 0.055) < 0.022 ? [0.04, 0.05, 0.08] : [0.45, 0.68, 1.0, 0.6] });
    // the fins: two rounded paddles towards the back of the mantle, a light organ glowing at the base of each
    fin(mb, [[0.0, 0.0], [0.07, 0.03], [0.05, 0.13], [-0.03, 0.145], [-0.075, 0.06], [-0.05, 0.0]], { origin:[0.34, 0.02, sz * 0.14], ua:[1, 0, 0], va:vnorm([0, 0.25, sz]), rings:3,
      col:(a, b) => b > 0.12 ? mott : skin, anim:(a, b) => [0, Math.abs(b) * 1.6, 0, 0] });
    ellip(mb, [0.36, 0.01, sz * 0.158], [0.02, 0.02, 0.012], { n:4, m:6, col:fc([...BIO, 3.5]) });
  }
  // little photophores scattered over the skin
  { const r = rng(404); for (let k = 0; k < 26; k++) { const a = r() * TAU, x = 0.1 + r() * 0.35, f = Math.pow(Math.sin(Math.min(1, (0.48 - x) / 0.42 * 1.2 + 0.05) * PI / 2), 0.55);
      ellip(mb, [x, Math.cos(a) * 0.157 * f, Math.sin(a) * 0.167 * f], [0.006, 0.006, 0.006], { n:2, m:4, col:fc([...BIO, 1.6]) }); } }
  // the cloak: a web joining the eight arms, flared into a bell; its rim is cut back between the arms, so the edge is scalloped
  const nA = 8, N = 16, M = nA * 8, armA = k => k / nA * TAU + PI / nA;
  const bx = t => -0.05 - t * 0.34, br = t => 0.125 + 0.25 * Math.sin(t * PI * 0.55) / Math.sin(PI * 0.55);
  const rows = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, row = [];
    for (let j = 0; j < M; j++) {
      const a = j / M * TAU, ph = Math.cos(nA * (a - PI / nA));            // 1 along an arm, -1 halfway between two
      const tt = t * (0.7 + 0.3 * (1 + ph) / 2);
      const p = [bx(tt), Math.cos(a) * br(tt), Math.sin(a) * br(tt)];
      row.push(mb.v(p, t > 0.92 ? rimC : (Math.sin(a * 23 + t * 7) > 0.6 ? mott : web), [0, 0, 0, tt * 0.55]));
    }
    rows.push(row);
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const j1 = (j + 1) % M; mb.quad(rows[i][j], rows[i + 1][j], rows[i + 1][j1], rows[i][j1]); }
  // the arms run along the web and a little past it, ending in black tips with a light organ; soft pale spines (cirri) line their inner faces
  for (let k = 0; k < nA; k++) {
    const a = armA(k) - PI / nA + PI / nA, ca = Math.cos(a), sa = Math.sin(a);
    const at = t => { const tt = t * 1.1; return [bx(tt) + Math.max(0, tt - 1) * 0.1, ca * (br(Math.min(tt, 1)) + Math.max(0, tt - 1) * 0.05 + 0.006), sa * (br(Math.min(tt, 1)) + Math.max(0, tt - 1) * 0.05 + 0.006)]; };
    tube(mb, { n:14, m:4, path:at, r:t => 0.017 * (1 - t * 0.55), col:t => t > 0.86 ? tip : skin, anim:t => [0, 0, 0, t * 0.55] });
    const e = at(1); ellip(mb, e, [0.011, 0.011, 0.011], { n:3, m:5, col:fc([...BIO, 3.0]), anim:() => [0, 0, 0, 0.6] });
    for (let c = 0; c < 9; c++) {
      const t = 0.12 + c * 0.085, p = at(t), inward = vnorm([-0.5, -ca, -sa]);
      tube(mb, { n:2, m:3, path:u => vmad(p, inward, u * 0.04), r:u => 0.0045 * (1 - u * 0.7), col:fc(cirri), anim:() => [0, 0, 0, t * 0.55] });
    }
  }
  // the two velar filaments: thin sensory threads, longer than the animal, uncoiled from pockets in the web to feel for marine snow
  for (const sz of [1, -1]) tube(mb, { n:24, m:3, path:t => [-0.1 - t * 0.85, sz * 0.03 + Math.sin(t * 5) * 0.03 * t, sz * (0.06 + t * 0.1)], r:0.0035, col:fc(cirri), anim:t => [0, 0, t * 0.5, 0] });
  return mb;
}

// ---- floor and slope
function mkGiantIsopod() {
  // a woodlouse half a metre long: seven overlapping plates, a rounded tail fan, big compound eyes, two pairs of antennae, seven pairs of legs
  const mb = new MB(), shell = [0.5, 0.45, 0.46], seam = [0.3, 0.27, 0.28], under = [0.6, 0.55, 0.5];
  const prof = t => Math.pow(Math.sin(Math.min(1, t * 1.6 + 0.12) * PI / 2), 0.5) * lerp(1, 0.75, smooth(0.6, 1, t));
  loft(mb, { n:40, m:20, sec:t => ({ x:0.46 - t * 0.86, y:0.04 * prof(t), w:0.21 * prof(t), h:0.075 * prof(t), e:2.8 }),
    col:(t, u, p, sy) => sy < -0.3 ? under : (Math.abs(fract(t * 9.5) - 0.5) > 0.44 && t > 0.12 && t < 0.86 ? seam : shell) });
  // the tail fan (pleotelson) with its fringe of spines
  fin(mb, [[0, 0.2], [-0.08, 0.17], [-0.12, 0.08], [-0.13, 0], [-0.12, -0.08], [-0.08, -0.17], [0, -0.2]], { origin:[-0.39, 0.03, 0], ua:[1, 0, 0], va:[0, 0, 1], col:fc(shell), center:[-0.05, 0] });
  for (let k = 0; k < 7; k++) { const a = -0.9 + k * 0.3; tube(mb, { n:1, m:3, path:t => [-0.5 - t * 0.04 * Math.cos(a), 0.03, Math.sin(a) * (0.13 + t * 0.03)], r:t => 0.006 * (1 - t), col:fc(shell) }); }
  for (const sz of [1, -1]) {
    ellip(mb, [0.43, 0.035, sz * 0.085], [0.025, 0.02, 0.035], { n:5, m:8, col:fc([0.05, 0.05, 0.06]) });
    tube(mb, { n:12, m:3, path:t => [0.46 + t * 0.12, 0.03 + Math.sin(t * PI) * 0.04, sz * (0.05 + t * 0.32)], r:t => 0.008 * (1 - t * 0.6), col:fc(shell), anim:t => [0, 0, t * 0.15, 0] });
    tube(mb, { n:4, m:3, path:t => [0.47 + t * 0.06, 0.02, sz * (0.03 + t * 0.06)], r:0.006, col:fc(shell) });
    for (let k = 0; k < 7; k++) { const x = 0.3 - k * 0.08; tube(mb, { n:4, m:3, path:t => [x - t * 0.02, -0.01 - t * 0.06, sz * (0.16 * prof(0.4) + t * 0.08)], r:0.008, col:fc(under), anim:t => [0, 0, t * 0.1, 0] }); }
  }
  return mb;
}
function mkSeaCucumberSwimmer() {
  // Enypniastes, the "headless chicken monster": a swimming sea cucumber, see-through red, a webbed veil in front and a brim behind
  const mb = new MB(), body = [0.92, 0.3, 0.4], gut = [0.6, 0.2, 0.15], veil = [0.95, 0.42, 0.5];
  loft(mb, { n:18, m:16, sec:t => ({ x:0.32 - t * 0.66, y:0, w:0.15 * Math.pow(Math.sin(Math.min(1, t * 1.4 + 0.1) * PI / 2), 0.6) * lerp(1, 0.7, t), h:0.12 * Math.pow(Math.sin(Math.min(1, t * 1.4 + 0.1) * PI / 2), 0.6), e:2 }),
    col:(t, u, p) => Math.abs(p[1]) < 0.025 && Math.abs(p[2]) < 0.04 ? gut : body, anim:() => [0, 0, 0, 0] });
  // the gut, seen through the body: a looped dark-red tube
  tube(mb, { n:20, m:4, path:t => [0.25 - t * 0.5, Math.sin(t * 9) * 0.03, Math.cos(t * 7) * 0.04], r:0.012, col:fc(gut) });
  // the veil: a broad webbed hood that rows the animal through the water
  const vp = []; for (let k = 0; k <= 14; k++) { const a = -PI / 2 + k / 14 * PI; vp.push([0.2 * Math.cos(a) * (1 + 0.08 * Math.cos(a * 6)), 0.24 * Math.sin(a)]); }
  fin(mb, vp, { origin:[0.3, 0.06, 0], ua:vnorm([0.4, 1, 0]), va:[0, 0, 1], rings:4, center:[0.05, 0], col:(a, b, r) => r > 0.85 ? body : veil, anim:(a, b, r) => [0, r * 0.8, 0, 0] });
  // the rear brim, and the little feeding tentacles under the front
  fin(mb, [[0, 0.13], [-0.12, 0.16], [-0.14, 0], [-0.12, -0.16], [0, -0.13]], { origin:[-0.3, 0.05, 0], ua:[1, 0.5, 0], va:[0, 0, 1], col:fc(veil), anim:(a, b) => [0, 0.3, 0, 0] });
  for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; tube(mb, { n:3, m:3, path:t => [0.3 + t * 0.04, -0.05 + Math.cos(a) * 0.04 - t * 0.04, Math.sin(a) * 0.05], r:0.01, col:fc(veil), anim:t => [0, 0, t * 0.2, 0] }); }
  return mb;
}
function mkYetiCrabs() {
  // a few yeti crabs (Kiwa), drawn in metres: pale bodies, long arms thick with bristles where they farm bacteria
  const mb = new MB(), shell = [0.93, 0.9, 0.84], hair = [0.88, 0.84, 0.72], r = rng(707);
  const crab = () => {
    const c = new MB();
    ellip(c, [0, 0.03, 0], [0.06, 0.028, 0.045], { n:6, m:10, col:fc(shell) });
    for (const sz of [1, -1]) {
      const arm = t => [0.05 + t * 0.11, 0.035 + Math.sin(t * PI) * 0.03, sz * (0.04 + t * 0.05)];
      tube(c, { n:8, m:4, path:arm, r:t => 0.012 * (1 - t * 0.3), col:fc(shell), anim:t => [0, 0, t * t * 1.0, 0] });
      for (let k = 0; k < 16; k++) { const t = 0.2 + k * 0.05, p = arm(t), d = vnorm([r() - 0.5, r() * 0.6 - 0.1, r() - 0.5]); tube(c, { n:1, m:3, path:u => vmad(p, d, u * 0.03), r:0.0025, col:fc(hair), anim:() => [0, 0, t * t * 1.0, 0] }); }
      for (let k = 0; k < 4; k++) tube(c, { n:4, m:3, path:t => [0.02 - k * 0.025 - t * 0.02, 0.02 - t * 0.04 + Math.sin(t * PI) * 0.02, sz * (0.04 + t * 0.07)], r:0.006, col:fc(shell) });
    }
    return c;
  };
  for (let k = 0; k < 6; k++) {
    const mk = mb.mark(); mergeInto(mb, crab());
    const a = k / 6 * TAU + r() * 0.6, d = 0.12 + r() * 0.22, s = 0.8 + r() * 0.4;
    mb.xform(mk, chain(scl(s), rotY(r() * TAU), move([Math.cos(a) * d, 0, Math.sin(a) * d])));
  }
  return mb;
}
function mkSpiderCrab() {
  // the Japanese spider crab, drawn with its legs reaching out to a span of one unit (3.7 m): a small bumpy carapace, long jointed legs
  const mb = new MB(), orange = [0.92, 0.46, 0.2], spot = [0.98, 0.92, 0.86], pale = [0.95, 0.75, 0.55];
  const legC = t => Math.sin(t * 31) > 0.55 ? spot : orange;
  ellip(mb, [0, 0.07, 0], [0.065, 0.032, 0.052], { n:8, m:12, shape:p => [p[0] + Math.max(0, p[0]) * 0.3, p[1] + 0.006 * Math.sin(p[0] * 120) * Math.sin(p[2] * 110), p[2] * (1 - Math.max(0, p[0]) * 3)],
    col:(u, v, p) => Math.sin(p[0] * 150) * Math.sin(p[2] * 140) > 0.6 ? spot : orange });
  for (const sz of [1, -1]) {
    tube(mb, { n:3, m:4, path:t => [0.08 + t * 0.03, 0.07, sz * (0.008 + t * 0.006)], r:0.004, col:fc(pale) });   // the two horns at the front
    // the claws (chelipeds): long, held forward and down
    tube(mb, { n:12, m:5, path:t => [0.05 + t * 0.2, 0.06 + Math.sin(t * PI) * 0.03 - t * 0.04, sz * (0.035 + t * 0.07)], r:t => 0.008 * (1 - t * 0.4), col:legC, anim:t => [0, 0, t * 0.03, 0] });
    // four walking legs a side: out and up to the knee, then down to the floor, fanning from front to back
    for (let k = 0; k < 4; k++) {
      const phi = 0.75 - k * 0.45, dir = [Math.sin(phi), 0, sz * Math.cos(phi)], L = 0.44 - Math.abs(k - 1.2) * 0.025;
      const base = [0.03 - k * 0.025, 0.065, sz * 0.045];
      tube(mb, { n:16, m:4, path:t => { const reach = t * L, h = 0.065 + 0.12 * Math.sin(Math.min(1, t * 1.8) * PI / 2) - 0.185 * smooth(0.45, 1, t);
          return [base[0] + dir[0] * reach, h, base[2] + dir[2] * reach]; },
        r:t => 0.007 * (1 - t * 0.5), col:legC, anim:t => [0, 0, t * 0.02, 0] });
    }
  }
  return mb;
}

function mkPompeiiWorms(C, O) {
  // a colony of Pompeii worms on the wall of chimney C, in metres relative to O: papery tubes crowded together, each standing out
  // from the wall, a worm's head poking from many with a crown of red gills and the grey fleece of bacteria on its back just showing
  const mb = new MB(), r = rng(551), tubeC = [0.95, 0.93, 0.88], dirt = [0.62, 0.5, 0.36], gill = [1.0, 0.2, 0.18], fleece = [0.78, 0.78, 0.76];
  for (let k = 0; k < 50; k++) {
    const t = 0.2 + r() * 0.14, phi = PI + (r() - 0.5) * 1.1, n = [Math.cos(phi), 0, Math.sin(phi)];
    const base = vsub(vmad(C.path(t), n, C.rad(t) * 0.93), O), L = 0.2 + r() * 0.14;
    const dir = vnorm(vadd(n, [(r() - 0.5) * 0.3, 0.2 + r() * 0.4, (r() - 0.5) * 0.3])), at = u => vmad(base, dir, u * L);
    tube(mb, { n:5, m:5, path:at, r:u => 0.013 * (1 + 0.15 * Math.sin(u * 9 + k)), col:u => Math.sin(u * 11 + k * 2.3) > 0.6 ? dirt : tubeC, capEnd:false });
    if (r() < 0.6) {
      const o = at(1), out = 0.03 + r() * 0.03;
      tube(mb, { n:3, m:5, path:u => vmad(o, dir, u * out), r:0.009, col:fc(fleece), anim:u => [0, 0, u * 0.5, 0] });
      const h = vmad(o, dir, out), sd = vnorm(vcross(dir, [0, 1, 0])), sd2 = vcross(dir, sd);
      for (let g = 0; g < 4; g++) {
        const a = g / 4 * TAU, gd = vnorm(vadd(dir, vadd(vmul(sd, Math.cos(a) * 0.9), vmul(sd2, Math.sin(a) * 0.9))));
        tube(mb, { n:3, m:3, path:u => vmad(h, gd, u * 0.045), r:u => 0.006 * (1 - u * 0.6), col:fc(gill), anim:u => [0, 0, 0.5 + u * 0.4, 0] });
      }
    }
  }
  return mb;
}
function mkSeaPens(A) {
  // a meadow of phosphorescent sea pens (Pennatula), in metres: each a colony like a quill, a fleshy stalk dug into the mud and a
  // feathered top of leaf-like rows of polyps, standing in the current; touched, a wave of green light runs along them
  const mb = new MB(), r = rng(4242), stalk = [0.9, 0.62, 0.55], leaf = [0.95, 0.42, 0.42], tip = [1.0, 0.85, 0.75];
  for (let k = 0; k < 26; k++) {
    const a = r() * TAU, d = Math.sqrt(r()) * 1.3, x = Math.cos(a) * d, z = Math.sin(a) * d, H = 0.32 + r() * 0.2, lean = 0.15 + r() * 0.15, y0 = groundAt(A, x, z) - 0.03;
    const at = t => [x + lean * t * t * H, y0 + t * H, z];
    tube(mb, { n:6, m:5, path:at, r:t => 0.016 * (1 - t * 0.5), col:fc(stalk), anim:t => [0, 0, t * 0.5, 0] });
    for (let j = 0; j < 9; j++) { const t = 0.35 + j * 0.07, p = at(t), w = 0.075 * Math.sin((j + 0.5) / 9 * PI) + 0.015;
      for (const s of [1, -1]) fin(mb, [[0, -0.008], [w, -0.004], [w * 0.9, 0.012], [0, 0.01]], { origin:p, ua:[0, 0.25, s], va:[1, 0.2, 0], col:(a2) => a2 > w * 0.6 ? tip : leaf, anim:() => [0, 0, t * 0.5, 0], rings:1 }); }
  }
  return mb;
}
function mkSalpChain() {
  // a chain of salps, one unit long: a string of clear barrels, each ringed with muscle bands it squeezes to jet water through itself,
  // with a small orange-brown gut showing through; the chain wavers as it swims
  const mb = new MB(), clear = [0.82, 0.9, 1.0], band = [0.9, 0.96, 1.0, 0.25], gut = [0.95, 0.5, 0.2];
  const n = 11;
  for (let k = 0; k < n; k++) {
    const x = 0.46 - k / (n - 1) * 0.92, z = Math.sin(k * 0.9) * 0.02, sd = k % 2 ? 1 : -1;
    ellip(mb, [x, 0, z + sd * 0.02], [0.045, 0.034, 0.04], { n:6, m:10, col:(u, v, p) => Math.abs(Math.sin((p[0] - x) * 110)) < 0.25 ? band : clear, anim:() => [k / n, 0, 0, 0.15] });
    ellip(mb, [x - 0.025, -0.006, z + sd * 0.02], [0.01, 0.01, 0.01], { n:3, m:5, col:fc(gut), anim:() => [k / n, 0, 0, 0] });
  }
  return mb;
}
// copy the whole of mesh src into dst, its points moved by f (for scattering many copies of one creature through a scene);
// mirror: f turns it inside out (flips one axis), so the triangles are wound the other way to keep their outsides out
function stamp(dst, src, f, mirror) {
  const v0 = dst.count, I = src.I;
  for (let k = 0; k < src.count; k++) dst.v(f([src.P[k * 3], src.P[k * 3 + 1], src.P[k * 3 + 2]]), [src.C[k * 4], src.C[k * 4 + 1], src.C[k * 4 + 2], src.C[k * 4 + 3]], [src.A[k * 4], src.A[k * 4 + 1], src.A[k * 4 + 2], src.A[k * 4 + 3]]);
  for (let k = 0; k < I.length; k += 3) dst.I.push(I[k] + v0, I[k + (mirror ? 2 : 1)] + v0, I[k + (mirror ? 1 : 2)] + v0);
}
function buildOctopusGarden(A) {
  // the Octopus Garden, in metres: outcrops of dark pillow lava where warm water seeps out, and thousands of pearl octopuses (here a
  // few dozen) clinging to them upside down, arms wrapped over their eggs, the brooding mothers pale, almost white
  const mb = new MB(), r = rng(3203), lava = [0.06, 0.06, 0.07], mat = [0.3, 0.27, 0.22];
  const rocks = [[0, 0, 1.1], [2.2, 1.4, 0.8], [-2, 1.6, 0.9], [1.2, -2.2, 0.8], [-1.6, -1.8, 0.7], [3.4, -1, 0.6]];
  for (const [x, z, s] of rocks) ellip(mb, [x, groundAt(A, x, z) - s * 0.15, z], [s, s * 0.4, s * 0.85], { n:8, m:12,
    shape:p => [p[0], p[1] + 0.06 * s * Math.sin(p[0] * 5) * Math.sin(p[2] * 6), p[2]], col:(u, v, p) => Math.sin(p[0] * 9) * Math.sin(p[2] * 8) > 0.6 ? mat : lava });
  const pale = mkOctopus({ skin:[0.96, 0.9, 0.92], mott:[0.85, 0.75, 0.82] }), pink = mkOctopus({ skin:[0.88, 0.6, 0.72], mott:[0.7, 0.45, 0.58] });
  for (let k = 0; k < 46; k++) {
    const R = rocks[k % rocks.length], a = r() * TAU, d = Math.sqrt(r()) * R[2] * 0.85, x = R[0] + Math.cos(a) * d, z = R[1] + Math.sin(a) * d * 0.85;
    const top = groundAt(A, R[0], R[1]) - R[2] * 0.15 + R[2] * 0.4 * Math.sqrt(Math.max(0, 1 - (d / R[2]) ** 2)), s = 0.4 + r() * 0.12, yaw = r() * TAU, tilt = (r() - 0.5) * 0.5;
    // (upside down, the mantle hanging low and the webbed arms curled up over the eggs on the rock)
    stamp(mb, r() < 0.7 ? pale : pink, p => { const q = [p[0] * s, -p[1] * s * 0.8, p[2] * s], c = Math.cos(yaw), sn = Math.sin(yaw);
      return [x + q[0] * c - q[2] * sn, top + 0.12 + q[1] + q[0] * tilt, z + q[0] * sn + q[2] * c]; }, true);
  }
  return mb;
}
function mkLanternshark() {
  // a dwarf lanternshark, one unit long (about 20 cm): a slim dark-brown shark with big green-glinting eyes, two dorsal fins each
  // with a spine, and the belly and flanks dotted with tiny light organs that glow blue to erase its silhouette from below
  const back = [0.2, 0.15, 0.12], belly = [0.12, 0.1, 0.1];
  return fish({ H:0.075, W:0.065, tm:0.32, nose:0.6, ped:0.1, bodyLen:0.8, back, belly, eye:[0.09, 0.25, 0.03], eyeCol:[0.2, 0.75, 0.55], eyeRing:[0.1, 0.3, 0.25],
    glowAt:(t, sy, sz, p) => sy < -0.35 && t > 0.08 && t < 0.85 && Math.sin(p[0] * 260) * Math.sin(p[2] * 240) > 0.2 ? [...BIO, 2.2] : null,
    tail:'shark', tailH:0.09, tailL:0.2, tailCol:back,
    dorsal:[{ at:0.36, len:0.08, h:0.06, col:back }, { at:0.62, len:0.08, h:0.07, col:back }],
    pect:{ at:0.25, len:0.1, w:0.05, col:back }, pelv:{ at:0.55, len:0.06, w:0.03, y:-0.7, col:back },
    extra:(mb, b) => gills(mb, b, 0.2, 5) });
}
function mkBlackSwallower() {
  // a black swallower that has just eaten, one unit long: a slim dark fish with long jaws, its stomach stretched into a thin clear
  // balloon hanging under it, a fish twice its own length curled up inside and showing through
  const black = [0.1, 0.09, 0.1];
  const mb = fish({ H:0.06, W:0.04, tm:0.25, nose:0.55, ped:0.1, bodyLen:0.84, back:black, belly:black, eye:[0.07, 0.3, 0.018], eyeCol:[0.4, 0.45, 0.5],
    tail:'fork', tailH:0.07, tailL:0.12, tailCol:black,
    dorsal:[{ at:0.3, len:0.08, h:0.04, col:black }, { at:0.45, len:0.3, h:0.04, col:black }], anal:[{ at:0.45, len:0.32, h:0.04, col:black }],
    pect:{ at:0.2, len:0.08, w:0.03, col:black } });
  ellip(mb, [0.12, -0.2, 0], [0.2, 0.17, 0.12], { n:10, m:16, col:fc([0.85, 0.8, 0.82, 0.15]), anim:() => [0.2, 0, 0, 0] });   // the stretched stomach
  // the swallowed fish, folded double inside it, pale grey-brown
  tube(mb, { n:20, m:6, path:t => { const a = t * PI * 1.15; return [0.12 + Math.cos(a) * 0.12, -0.2 + Math.sin(a) * 0.09, 0]; }, r:t => 0.035 * Math.sin(Math.min(1, t * 1.2 + 0.1) * PI) + 0.006, col:fc([0.55, 0.5, 0.45]), anim:() => [0.2, 0, 0, 0] });
  return mb;
}
function mkOpah() {
  // an opah (moonfish), one unit long: a deep round disc of a body, steel-blue above shading to rose below and speckled with white
  // spots, with bright crimson fins and jaws, a big gold-ringed eye, and long sickle pectorals it flaps like wings
  const blue = [0.3, 0.38, 0.6], rose = [0.85, 0.55, 0.6], spot = [0.95, 0.95, 0.95], red = [0.95, 0.15, 0.15];
  return fish({ H:0.3, W:0.07, tm:0.42, nose:0.55, ped:0.07, bodyLen:0.84, back:blue, belly:rose, eye:[0.12, 0.25, 0.04], eyeRing:[1.0, 0.8, 0.3],
    pattern:(t, sy, sz, p) => Math.sin(p[0] * 70) * Math.sin(p[1] * 60 + p[2] * 40) > 0.7 ? spot : (t < 0.05 ? red : mixc(rose, blue, smooth(-0.4, 0.3, sy))),
    tail:'lunate', tailH:0.2, tailL:0.12, tailCol:red,
    dorsal:[{ at:0.3, len:0.5, h:0.22, col:red, pts:[[0, 0], [0.05, 1], [-0.2, 0.55], [-1, 0.12], [-1, 0]] }],
    anal:[{ at:0.45, len:0.4, h:0.07, col:red }],
    pect:{ at:0.3, len:0.26, w:0.05, down:0.1, back:0.8, y:0, col:red }, pectFlap:1.4,
    pelv:{ at:0.42, len:0.18, w:0.04, y:-0.8, col:red } });
}
function mkPhronima() {
  // a pram bug (Phronima), one unit = its barrel, about 3 cm: a clear, hollowed-out salp barrel open at both ends, and inside it the
  // see-through amphipod with huge red eyes and grasping legs, pushing it along
  const mb = new MB(), clear = [0.85, 0.93, 1.0, 0.15], ring = [0.92, 0.97, 1.0, 0.3], body = [0.95, 0.85, 0.85], eye = [0.95, 0.2, 0.15];
  tube(mb, { n:8, m:14, path:t => [0.3 - t * 0.6, 0, 0], r:t => 0.2 - 0.03 * Math.sin(t * PI), capEnd:false, col:(t) => Math.abs(Math.sin(t * 18)) < 0.2 ? ring : clear, anim:t => [0, 0, 0, 0.06] });
  // the amphipod, clinging in the barrel's mouth
  loft(mb, { n:10, m:8, sec:t => ({ x:0.32 - t * 0.35, y:0.04, w:0.05 * Math.sin(Math.min(1, t * 2 + 0.2) * PI / 2) * (1 - t * 0.5), h:0.06 * (1 - t * 0.5), e:2 }), col:fc(body), anim:() => [0, 0, 0, 0] });
  for (const sz of [1, -1]) ellip(mb, [0.33, 0.1, sz * 0.04], [0.06, 0.06, 0.045], { n:5, m:8, col:fc(eye) });
  for (const sz of [1, -1]) for (let k = 0; k < 3; k++) tube(mb, { n:4, m:3, path:t => [0.25 - k * 0.06 + t * 0.05, 0.02 - t * 0.12, sz * (0.03 + t * 0.12)], r:0.01, col:fc(body), anim:t => [0, 0, t * 0.3, 0] });
  return mb;
}
function mkSeaSpider() {
  // a giant sea spider (Colossendeis), legs spanning one unit: almost no body, just a thin trunk with a long proboscis in front and
  // eight stilt legs, banded at the joints. Its gut runs out into the legs, which do its breathing and pump its blood
  const mb = new MB(), red = [0.85, 0.3, 0.2], pale = [0.98, 0.8, 0.65];
  const legC = t => Math.abs(Math.sin(t * PI * 3.5)) < 0.12 ? pale : red;
  tube(mb, { n:8, m:6, path:t => [0.05 - t * 0.11, 0.16, 0], r:t => 0.012 * (1 - t * 0.3), col:fc(red), capStart:true });   // the trunk
  tube(mb, { n:6, m:6, path:t => [0.05 + t * 0.12, 0.16 - t * 0.03, 0], r:t => 0.014 * (1 - t * 0.35), col:fc(mixc(red, pale, 0.25)) });   // the proboscis
  ellip(mb, [0.035, 0.18, 0], [0.008, 0.012, 0.008], { n:4, m:6, col:fc([0.1, 0.06, 0.05]) });   // the eye tubercle
  for (const sz of [1, -1]) for (let k = 0; k < 4; k++) {
    const phi = 1.2 - k * 0.55, dir = [Math.sin(phi) * 0.9, 0, sz * Math.cos(phi)], L = 0.48;
    const base = [0.03 - k * 0.025, 0.16, sz * 0.012];
    tube(mb, { n:20, m:4, path:t => { const reach = t * L, h = 0.16 + 0.12 * Math.sin(Math.min(1, t * 2.2) * PI / 2) - 0.28 * smooth(0.4, 1, t);
        return [base[0] + dir[0] * reach, h, base[2] + dir[2] * reach]; },
      r:t => 0.006 * (1 - t * 0.6), col:legC, anim:t => [0, 0, t * 0.04, 0] });
  }
  return mb;
}

// ---- open water of the twilight and midnight zones
function mkDragonfish() {
  // the black dragonfish: velvet-black, rows of lights along its belly, a glowing cheek organ, and a chin barbel tipped with a lure
  const black = [0.035, 0.035, 0.045];
  return fish({ H:0.05, W:0.034, tm:0.2, nose:0.5, ped:0.2, bodyLen:0.92, taper:0.8, back:black, belly:[0.06, 0.06, 0.08], eye:[0.05, 0.3, 0.018], eyeCol:[0.1, 0.25, 0.3], eyeRing:[0.2, 0.2, 0.25], n:44,
    tail:'fork', tailH:0.05, tailL:0.07, dorsal:[{ at:0.82, len:0.06, h:0.04 }], anal:[{ at:0.76, len:0.1, h:0.04 }],
    extra:(mb, b) => {
      photophores(mb, b, [[0.1, 0.88, -0.65, 24], [0.14, 0.82, -0.2, 16]], BIO, 0.006);
      tube(mb, { n:16, m:3, path:t => [0.45 - t * 0.06, -0.04 - t * 0.25 + Math.sin(t * 3) * 0.02, 0], r:0.0025, col:fc(black), anim:t => [0.05, 0, t * 0.6, 0] });
      ellip(mb, [0.39, -0.29, 0], [0.012, 0.02, 0.012], { n:4, m:6, col:fc([0.6, 0.9, 1.0, 4]), anim:() => [0.05, 0, 0.6, 0] });
      for (const sz of [1, -1]) ellip(mb, [0.45, -0.005, sz * 0.022], [0.012, 0.006, 0.004], { n:3, m:6, col:fc([...BIO, 3]) });
      for (const [x, z] of [[0.48, 0.01], [0.48, -0.01], [0.46, 0.016], [0.46, -0.016], [0.44, 0.02], [0.44, -0.02]]) tube(mb, { n:2, m:3, path:t => [x + t * 0.005, -0.01 - t * 0.03, z], r:t => 0.003 * (1 - t), col:fc([0.92, 0.95, 0.95]) });
    } });
}
function mkLoosejaw() {
  // the stoplight loosejaw: a jaw with no floor, just a hinged frame of bone; a red light under each eye and a smaller blue-green one behind
  const black = [0.06, 0.05, 0.06];
  return fish({ H:0.07, W:0.04, tm:0.25, nose:0.4, ped:0.18, bodyLen:0.88, back:black, belly:[0.08, 0.07, 0.08], eye:[0.07, 0.3, 0.025], eyeCol:[0.2, 0.2, 0.25], eyeRing:[0.25, 0.2, 0.2],
    tail:'fork', tailH:0.06, dorsal:[{ at:0.78, len:0.08, h:0.05 }], anal:[{ at:0.74, len:0.12, h:0.05 }],
    extra:(mb, b) => {
      for (const sz of [1, -1]) {
        tube(mb, { n:6, m:4, path:t => [0.4 + t * 0.14, -0.03 - t * 0.09, sz * (0.022 - t * 0.014)], r:0.0055, col:fc([0.14, 0.11, 0.11]) });
        for (let k = 0; k < 6; k++) tube(mb, { n:1, m:3, path:t => [0.43 + k * 0.018, -0.045 - k * 0.012 + t * 0.018, sz * (0.018 - k * 0.002)], r:t => 0.0022 * (1 - t), col:fc([0.95, 0.95, 0.9]) });
        ellip(mb, [0.43, -0.018, sz * 0.024], [0.017, 0.012, 0.005], { n:4, m:6, col:fc([1.0, 0.1, 0.06, 6]) });
        ellip(mb, [0.395, 0.012, sz * 0.024], [0.008, 0.008, 0.004], { n:3, m:6, col:fc([...BIO, 3]) });
      }
      photophores(mb, b, [[0.15, 0.85, -0.6, 18]], BIO, 0.005);
    } });
}
function mkBigfinSquid() {
  // Magnapinna, drawn standing upright and one unit tall: a small mantle with huge fins at the top, ten arms held out level,
  // then bent sharply down at the "elbows" and hanging, thread-thin, almost the whole height of the animal
  const mb = new MB(), pale = [0.6, 0.5, 0.46], fins = [0.66, 0.56, 0.52];
  const top = 0.92;
  ellip(mb, [0, top + 0.035, 0], [0.012, 0.04, 0.012], { n:8, m:10, col:fc(pale), anim:() => [0, 0, 0.02, 0] });
  ellip(mb, [0, top - 0.008, 0], [0.011, 0.012, 0.011], { n:5, m:8, col:(u, v, p) => Math.abs(p[2]) > 0.007 && p[1] > top - 0.008 ? [0.05, 0.05, 0.06] : pale });
  for (const sz of [1, -1]) fin(mb, [[0.03, 0], [0.02, 0.03], [-0.005, 0.036], [-0.03, 0.025], [-0.035, 0]], { origin:[0, top + 0.045, 0], ua:[0, 1, 0], va:[0, 0, sz], rings:3, col:fc(fins), anim:(a, b) => [0, Math.abs(b) * 1.5, 0, 0] });
  for (let k = 0; k < 10; k++) {
    const a = k / 10 * TAU + 0.15, ca = Math.cos(a), sa = Math.sin(a), r0 = 0.055 + 0.015 * Math.sin(k * 2.1), L = 0.82 + 0.08 * Math.sin(k * 1.3);
    tube(mb, { n:28, m:3, path:t => {
        const e = 0.1;   // the elbow
        if (t < e) { const u = t / e; return [ca * r0 * u, top - 0.012 - u * 0.006, sa * r0 * u]; }
        const u = (t - e) / (1 - e); return [ca * (r0 + u * 0.03), top - 0.018 - u * L, sa * (r0 + u * 0.03)];
      }, r:t => t < 0.1 ? 0.0035 : 0.0018, col:fc(pale), anim:t => [0, 0, Math.max(0, t - 0.1) * 0.35, 0] });
  }
  return mb;
}
function mkGlassSquid() {
  // a cranchiid glass squid: a clear barrel of a body, an orange digestive gland showing through, light organs under the eyes
  const mb = mkSquid({ mantle:0.6, mw:0.17, arms:0.12, tent:0.18, fin:0.06, finLen:0.1, eye:0.04, skin:[0.78, 0.86, 0.95], dark:[0.66, 0.76, 0.88], eyeCol:[0.05, 0.05, 0.07] });
  ellip(mb, [0.15, 0, 0], [0.05, 0.025, 0.025], { n:6, m:8, col:fc([1.0, 0.55, 0.15, 0.3]) });
  for (const sz of [1, -1]) ellip(mb, [-0.13, -0.05, sz * 0.09], [0.02, 0.008, 0.012], { n:3, m:6, col:fc([...BIO, 3]) });
  return mb;
}
function mkGlassOctopus() {
  // Vitreledonella: a clear, gelatinous octopus. All you can see are what it cannot make transparent: the eyes (long and narrow, which
  // makes their silhouette smaller from below), the optic nerves and a spindle of a digestive gland, held upright for the same reason
  const clear = [0.8, 0.88, 0.97], mb = mkOctopus({ skin:clear, mott:[0.72, 0.82, 0.94], pat:() => clear });
  for (const sz of [1, -1]) {
    ellip(mb, [0.07, 0.1, sz * 0.085], [0.022, 0.05, 0.018], { n:5, m:8, col:fc([0.06, 0.06, 0.08]) });
    tube(mb, { n:4, m:4, path:t => [0.07 - t * 0.08, 0.1 + t * 0.03, sz * (0.08 - t * 0.06)], r:0.007, col:fc([0.9, 0.85, 0.75, 0.3]) });   // the optic nerves
  }
  ellip(mb, [-0.1, 0.2, 0], [0.025, 0.1, 0.025], { n:8, m:8, col:fc([0.95, 0.7, 0.4, 0.3]) });
  return mb;
}
function mkChimaera() {
  // a ghost shark (Hydrolagus): a big blunt head, huge green-glinting eyes, wing-like pectoral fins, a venomous spine before the first dorsal
  // fin, and a body that tapers into a long thin whip of a tail
  const skin = [0.6, 0.56, 0.6], belly = [0.82, 0.8, 0.82], spot = [0.92, 0.92, 0.95];
  return fish({ H:0.1, W:0.07, tm:0.2, nose:0.55, ped:0.03, bodyLen:0.97, taper:0.45, back:skin, belly, eye:[0.09, 0.3, 0.055], eyeCol:[0.15, 0.6, 0.45], eyeRing:[0.4, 0.8, 0.6],
    pattern:(t, sy, sz) => Math.sin(t * 55 + sz * 9) * Math.sin(sy * 21 + t * 13) > 0.75 && sy > -0.2 ? spot : null,
    tail:'none',
    dorsal:[{ at:0.2, len:0.1, h:0.15, col:skin, pts:[[0, 0], [0.02, 1.0], [-0.35, 0.85], [-1, 0]] }, { at:0.36, len:0.55, h:0.035, col:skin, pts:[[0, 0], [-0.05, 1], [-0.95, 0.6], [-1, 0]] }],
    anal:[{ at:0.6, len:0.3, h:0.025 }],
    pect:{ at:0.22, len:0.24, w:0.11, down:0.15, back:0.7, y:-0.35, col:skin, pts:[[0, 0.05], [0, -0.05], [0.12, -0.12], [0.24, -0.2], [0.2, -0.08], [0.1, 0.0]] }, pectFlap:1.6,
    pelv:{ at:0.45, len:0.07, w:0.04, y:-0.8 },
    extra:(mb) => {
      tube(mb, { n:3, m:4, path:t => [0.5 - 0.2 * 0.97 + 0.01, 0.09 + t * 0.17, 0], r:t => 0.006 * (1 - t), col:fc([0.85, 0.85, 0.8]) });   // the venomous spine
      ellip(mb, [0.475, -0.045, 0], [0.012, 0.01, 0.018], { n:4, m:6, col:fc([0.95, 0.93, 0.85]) });                                  // the tooth plates: a rabbit's buck teeth
    } });
}

function mkSixgill() {
  // the bluntnose sixgill: a broad, rounded head, six gill slits (most sharks have five), one dorsal fin far back, green-glowing eyes
  const skin = [0.36, 0.33, 0.31], belly = [0.55, 0.52, 0.48];
  return fish({ H:0.085, W:0.09, tm:0.32, nose:0.4, ped:0.12, bodyLen:0.74, back:skin, belly, eye:[0.07, 0.25, 0.018], eyeCol:[0.15, 0.6, 0.45], eyeRing:[0.3, 0.75, 0.55], e:2.2,
    pattern:(t, sy) => mixc(belly, skin, smooth(-0.3, 0.1, sy)),
    tail:'none', dorsal:[{ at:0.62, len:0.09, h:0.06, col:skin }], anal:[{ at:0.7, len:0.07, h:0.03 }],
    pect:{ at:0.24, len:0.13, w:0.07, down:0.5, back:0.5, y:-0.5, col:skin }, pelv:{ at:0.55, len:0.06, w:0.04, y:-0.7 },
    extra:(mb, b) => {
      gills(mb, b, 0.15, 6);
      fin(mb, [[0.02, 0.02], [-0.12, 0.06], [-0.28, 0.07], [-0.27, 0.0], [-0.1, -0.04], [-0.02, -0.02]], { origin:[b.tx + 0.02, 0, 0], ua:[1, 0, 0], va:[0, 1, 0], col:fc(skin), anim:finA, center:[-0.1, 0] });
    } });
}
function mkHelmetJelly() {
  // Periphylla: a tall conical bell, deep red-brown (red is invisible in the deep: it hides the glow of the prey in its gut)
  return jelly({ h:0.8, bell:[0.5, 0.08, 0.1], cone:true,
    pattern:(t, u) => {
      if (Math.abs(t - 0.55) < 0.03) return [0.3, 0.04, 0.06];
      if (t > 0.6 && Math.abs(Math.sin(u * PI * 12)) < 0.2) return [0.65, 0.12, 0.14];
      if (t < 0.25 && Math.sin(u * TAU * 4) > 0.6) return [...BIO, 2.0];   // flashes on the bell
      return null;
    },
    tentacles:{ n:12, len:0.6, r:0.008, col:[0.55, 0.15, 0.15], seg:8, sway:0.18 } });
}
function mkCockeyedSquid() {
  // Histioteuthis: one huge upward-looking eye for daylight from above, one small downward eye for living lights below
  const mb = mkSquid({ mantle:0.42, mw:0.11, arms:0.3, tent:0.4, fin:0.08, finLen:0.12, eye:0.001, skin:[0.75, 0.15, 0.2], dark:[0.5, 0.08, 0.12] });
  const hx = 0.5 - 0.42 - 0.035;
  ellip(mb, [hx, 0.03, 0.09], [0.045, 0.05, 0.035], { n:6, m:10, col:(u, v, p) => Math.hypot(p[0] - hx, p[1] - 0.03) < 0.028 ? [0.05, 0.05, 0.06] : [0.85, 0.8, 0.5] });
  ellip(mb, [hx, -0.01, -0.09], [0.02, 0.022, 0.015], { n:4, m:8, col:fc([0.05, 0.05, 0.06]) });
  // photophores all over the mantle and arms
  const r = rng(5150);
  for (let k = 0; k < 60; k++) { const t = r(), a = r() * TAU, x = 0.5 - t * 0.42, w = 0.11 * Math.pow(Math.sin(Math.min(1, t * 1.25) * PI / 2), 0.7);
    ellip(mb, [x, Math.cos(a) * w * 1.04, Math.sin(a) * w * 1.04], [0.008, 0.008, 0.008], { n:2, m:4, col:fc([...BIO, 2.5]) }); }
  return mb;
}
function mkLionsMane() {
  // lion's mane jellyfish, one unit = the bell's width: a shallow lobed bell, a mass of frilled oral arms, and eight clusters of
  // hair-fine tentacles trailing many times the bell's width (in the biggest, over 30 m)
  const mb = jelly({ h:0.3, bell:[0.85, 0.45, 0.2], flare:1.15,
    pattern:(t, u) => {
      if (t > 0.8 && fract(u * 16) < 0.12) return [0.6, 0.25, 0.1];          // the lobes of the rim
      if (t < 0.6 && Math.abs(Math.sin(u * PI * 16)) < 0.25) return [0.95, 0.7, 0.4];   // radiating canals
      return null;
    },
    arms:{ n:8, len:0.9, w:0.12, col:[0.9, 0.55, 0.35] } });
  const r = rng(808);
  for (let g = 0; g < 8; g++) {
    const a0 = (g + 0.5) / 8 * TAU;
    for (let k = 0; k < 7; k++) {
      // each tentacle drifts out and away from the others as it trails, so the bundle opens into a loose veil
      const a = a0 + (r() - 0.5) * 0.4, rr = 0.36 + r() * 0.08, L = 3 + r() * 3.5, cy = Math.cos(a) * rr, cz = Math.sin(a) * rr, ph = r() * 6, sp = 0.6 + r() * 1.4;
      tube(mb, { n:24, m:3, path:t => [-0.15 - t * L, cy * (1 + t * sp) + Math.sin(t * 6 + ph) * 0.35 * t, cz * (1 + t * sp) + Math.cos(t * 4.5 + ph) * 0.35 * t],
        r:t => 0.005 * (1 - t * 0.5), col:fc([0.75, 0.48, 0.32]), anim:t => [0, 0, t * 0.6, 0.6 - t * 0.5] });
    }
  }
  return mb;
}
function mkBoxJelly() {
  // box jellyfish (Chironex), one unit = the bell's width: a clear, squarish bell, a cluster of eyes on each of its four sides,
  // and from each corner a fleshy arm (pedalium) carrying a bunch of long tentacles
  const mb = jelly({ h:0.9, bell:[0.8, 0.88, 0.95], flare:1.0, e:3.2,
    pattern:(t, u) => (t > 0.55 && t < 0.62 && fract(u * 4 + 0.125) < 0.06) ? [0.15, 0.12, 0.1] : null });
  const rimX = -0.9 * 0.4;
  for (let k = 0; k < 4; k++) {
    const a = (k + 0.5) / 4 * TAU, cy = Math.cos(a) * 0.5, cz = Math.sin(a) * 0.5, base = [rimX + 0.05, cy, cz];
    tube(mb, { n:4, m:5, path:t => [base[0] - t * 0.18, cy * (1 - t * 0.15), cz * (1 - t * 0.15)], r:t => 0.04 * (1 - t * 0.4), col:fc([0.75, 0.82, 0.9]) });
    for (let j = 0; j < 8; j++) {
      const sp = (j - 3.5) * 0.02, ph = j * 1.3 + k;
      tube(mb, { n:18, m:3, path:t => [base[0] - 0.18 - t * (2.2 + j * 0.15), cy * 0.85 + sp * Math.sin(a) + Math.sin(t * 5 + ph) * 0.06 * t, cz * 0.85 - sp * Math.cos(a) + Math.cos(t * 4 + ph) * 0.06 * t],
        r:t => 0.006 * (1 - t * 0.5), col:fc([0.8, 0.85, 0.95]), anim:t => [0, 0, t * 0.5, 0.5 - t * 0.4] });
    }
  }
  // the eye clusters (rhopalia), one on each flat side
  for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; ellip(mb, [rimX + 0.12, Math.cos(a) * 0.47, Math.sin(a) * 0.47], [0.03, 0.03, 0.03], { n:3, m:6, col:fc([0.12, 0.1, 0.08]) }); }
  return mb;
}
function mkPyrosome() {
  // Pyrosoma: a colony of thousands of tiny filter-feeders (zooids) living as one closed-ended tube, one unit long, open end at -x;
  // each zooid pumps water through the wall into the tube, and the outflow jets the whole colony slowly along
  const mb = new MB(), wall = [0.95, 0.75, 0.8];
  const R = t => 0.13 * Math.pow(Math.sin(Math.min(1, t * 1.6 + 0.12) * PI / 2), 0.8) * (1 - 0.1 * t);
  loft(mb, { n:24, m:18, capEnd:false, sec:t => ({ x:0.5 - t, y:0, w:R(t), h:R(t), e:2 }), col:fc(wall), anim:t => [0, 0, 0, 0] });
  // the zooids, studding the wall, each with its pair of light organs
  const r = rng(321);
  for (let k = 0; k < 140; k++) {
    const t = 0.03 + r() * 0.95, a = r() * TAU, rr = R(t) * 1.02, p = [0.5 - t, Math.cos(a) * rr, Math.sin(a) * rr], n = [0, Math.cos(a), Math.sin(a)];
    tube(mb, { n:2, m:4, path:u => vmad(p, vnorm(vadd(n, [0.35, 0, 0])), u * 0.035), r:u => 0.012 * (1 - u * 0.6), col:u => u > 0.7 ? [0.4, 1.0, 0.85, 0.6] : wall });
  }
  return mb;
}
function mkScalyFoot() {
  // a cluster of scaly-foot snails (Chrysomallon squamiferum) on the vent rock, in metres: each about 4 cm, the foot
  // armoured with overlapping scales of iron sulphide, the shell's outer layer iron too
  const mb = new MB(), r = rng(4545), iron = [0.3, 0.3, 0.33], sheen = [0.75, 0.72, 0.65], shell = [0.55, 0.45, 0.35];
  for (let k = 0; k < 14; k++) {
    const a = r() * TAU, d = Math.sqrt(r()) * 0.09, c = [Math.cos(a) * d, 0.006, Math.sin(a) * d], yaw = r() * TAU, s = 0.9 + r() * 0.4;
    const fw = [Math.cos(yaw), 0, Math.sin(yaw)], sd = [-fw[2], 0, fw[0]];
    const at = (x, y, z) => vadd(c, vadd(vmul(fw, x * s), vadd([0, y * s, 0], vmul(sd, z * s))));
    // the shell: a few whorls coiling up off the back
    for (let w = 0; w < 4; w++) { const rr = 0.014 * Math.pow(0.7, w); ellip(mb, at(-0.004 - w * 0.004, 0.012 + w * 0.006, 0.002 * w), [rr, rr * 0.8, rr], { n:4, m:7, col:fc(w ? shell : sheen) }); }
    // the foot, and the scales tiled along its sides
    ellip(mb, at(0.006, 0.0, 0), [0.016, 0.006, 0.011], { n:4, m:8, col:fc(iron) });
    for (let j = 0; j < 6; j++) for (const z of [1, -1]) ellip(mb, at(0.016 - j * 0.006, 0.002, z * 0.011), [0.004, 0.0035, 0.002], { n:2, m:4, col:fc(j % 2 ? iron : sheen) });
  }
  return mb;
}
function mkFireflySquid() {
  // Watasenia scintillans, about 7 cm: a small squid studded with hundreds of tiny blue light organs, and three big ones at the
  // tip of each of the fourth pair of arms
  const mb = mkSquid({ mantle:0.45, mw:0.09, arms:0.3, tent:0.3, fin:0.08, finLen:0.14, eye:0.03, skin:[0.3, 0.5, 0.9, 0.6], dark:[0.2, 0.45, 1.0, 1.2] });
  const r = rng(6262);
  for (let k = 0; k < 50; k++) { const t = r(), a = r() * TAU, x = 0.5 - t * 0.45, w = 0.09 * Math.pow(Math.sin(Math.min(1, t * 1.25) * PI / 2), 0.7);
    ellip(mb, [x, Math.cos(a) * w * 1.04, Math.sin(a) * w * 1.04], [0.018, 0.018, 0.018], { n:2, m:4, col:fc([0.2, 0.55, 1.0, 3.0]) }); }
  for (const sz of [1, -1]) ellip(mb, [0.5 - 0.45 - 0.33, -0.02, sz * 0.04], [0.025, 0.025, 0.025], { n:3, m:6, col:fc([0.3, 0.7, 1.0, 4.0]) });
  return mb;
}
function mkFlowerBasket() {
  // Venus' flower basket (Euplectella), drawn in metres, about 25 cm tall: a curved tube woven of glass (silica) spicules in a
  // square lattice with spiral ridges, a sieve plate over the top, a tuft of glassy rootlets anchoring it in the mud
  const mb = new MB(), glass = [0.85, 0.92, 0.95, 0.25], H = 0.25;
  const axis = t => [0.02 * Math.sin(t * PI), t * H, 0];
  const R = t => 0.018 + 0.022 * Math.sin(Math.min(1, t * 1.15) * PI * 0.6);
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; tube(mb, { n:14, m:3, path:t => vadd(axis(t), [Math.cos(a) * R(t), 0, Math.sin(a) * R(t)]), r:0.0012, col:fc(glass) }); }
  for (let j = 1; j < 14; j++) { const t = j / 14; tube(mb, { n:16, m:3, path:u => vadd(axis(t), [Math.cos(u * TAU) * R(t), 0, Math.sin(u * TAU) * R(t)]), r:0.001, col:fc(glass) }); }
  for (const dir of [1, -1]) for (let k = 0; k < 3; k++) tube(mb, { n:30, m:3, path:t => { const a = k / 3 * TAU + dir * t * TAU * 1.2; return vadd(axis(t * 0.95), [Math.cos(a) * R(t) * 1.08, 0, Math.sin(a) * R(t) * 1.08]); }, r:0.0018, col:fc(glass) });
  // the sieve plate and its frilled rim
  ellip(mb, axis(1), [R(1), 0.003, R(1)], { n:3, m:12, col:fc([0.9, 0.95, 1.0, 0.4]) });
  for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, p = vadd(axis(1), [Math.cos(a) * R(1), 0, Math.sin(a) * R(1)]); tube(mb, { n:2, m:3, path:t => vadd(p, [Math.cos(a) * t * 0.008, t * 0.008, Math.sin(a) * t * 0.008]), r:0.0012, col:fc(glass) }); }
  // rootlets
  for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; tube(mb, { n:5, m:3, path:t => [Math.cos(a) * (0.012 + t * 0.04), -t * 0.03, Math.sin(a) * (0.012 + t * 0.04)], r:0.0008, col:fc(glass) }); }
  // the pair of shrimp living inside, too big to get out through the lattice
  for (const [y, z] of [[0.11, 0.006], [0.15, -0.008]]) ellip(mb, [0.01, y, z], [0.012, 0.004, 0.004], { n:3, m:6, col:fc([1.0, 0.75, 0.6, 0.4]) });
  return mb;
}
function mkCookiecutter() {
  // cookiecutter shark (Isistius brasiliensis), about 45 cm: a cigar-shaped body, brown above, its belly covered in light organs
  // that glow green-blue, all but a dark collar round the throat, which from below looks like a small fish to bigger hunters
  const brown = [0.3, 0.24, 0.2], belly = [0.35, 0.3, 0.26], glow = [0.3, 0.95, 0.75, 2.2];
  return fish({ H:0.09, W:0.085, tm:0.3, nose:0.45, ped:0.15, bodyLen:0.85, back:brown, belly, eye:[0.08, 0.2, 0.025], eyeCol:[0.15, 0.4, 0.35],
    glowAt:(t, sy) => sy < -0.15 && !(t > 0.13 && t < 0.22) ? glow : null,
    tail:'lunate', tailH:0.1, tailL:0.12, tailCol:brown, dorsal:[{ at:0.6, len:0.06, h:0.035, col:brown }, { at:0.7, len:0.06, h:0.035, col:brown }],
    pect:{ at:0.24, len:0.07, w:0.03, down:0.4, col:brown }, extra:(mb, b) => gills(mb, b, 0.14, 5) });
}
function mkHumboldt() {
  // Humboldt squid (Dosidicus gigas), up to about 1.5 m: a big muscular mantle with a broad arrow-shaped fin, skin packed with
  // chromatophores it flashes from deep red to white
  return mkSquid({ mantle:0.5, mw:0.075, arms:0.25, tent:0.3, fin:0.11, finLen:0.2, eye:0.03, skin:[0.85, 0.25, 0.2], dark:[0.6, 0.12, 0.1] });
}
function mkPhantomJelly() {
  // giant phantom jelly, one unit = the bell's width: a broad, deep red-brown bell and four huge, wavy, curtain-like oral arms
  // that trail several times its width (up to about 10 m); no stinging tentacles at all
  const mb = jelly({ h:0.35, bell:[0.4, 0.1, 0.12], flare:1.12,
    pattern:(t, u) => t > 0.75 && fract(u * 24) < 0.15 ? [0.28, 0.06, 0.08] : null });
  for (let k = 0; k < 4; k++) {
    const a = (k + 0.5) / 4 * TAU, ph = k * 1.7, L = 5 + k * 0.6;
    ribbon(mb, { n:60, path:t => [-0.15 - t * L, Math.cos(a) * (0.08 + t * 0.35) + Math.sin(t * 5 + ph) * 0.25 * t, Math.sin(a) * (0.08 + t * 0.35) + Math.cos(t * 4 + ph) * 0.25 * t],
      side:t => [0, Math.cos(a + 1.5 + Math.sin(t * 8 + ph) * 0.9), Math.sin(a + 1.5 + Math.sin(t * 8 + ph) * 0.9)],
      w:t => 0.22 * (1 - t * 0.55) * (0.85 + 0.3 * Math.sin(t * 13 + ph)), col:t => fract(t * 9 + k * 0.3) < 0.2 ? [0.3, 0.06, 0.08] : [0.48, 0.12, 0.14], anim:t => [0, 0, t * 0.6, 0.4 - t * 0.35] });
  }
  return mb;
}
function mkSeaToad() {
  // sea toad (Chaunacops coloratus), about 20 cm: a round, puffy, pink-red anglerfish covered in tiny spines, a short lure tucked
  // in a groove on its snout, and fins it walks on across the floor
  const pink = [0.95, 0.42, 0.42], pale = [1.0, 0.7, 0.65];
  return fish({ H:0.3, W:0.24, tm:0.42, nose:0.25, ped:0.3, bodyLen:0.78, back:pink, belly:pale, eye:[0.12, 0.4, 0.04], eyeCol:[0.1, 0.3, 0.35], n:16, m:12,
    pattern:(t, sy, sz, p) => Math.sin(p[0] * 90) * Math.sin(p[1] * 80 + p[2] * 70) > 0.75 ? [1.0, 0.85, 0.8] : null,
    tail:'round', tailH:0.14, tailCol:pink, dorsal:[{ at:0.6, len:0.18, h:0.07, col:pink }], anal:[{ at:0.62, len:0.12, h:0.06, col:pink }],
    pect:{ at:0.35, len:0.12, w:0.08, down:0.85, col:pink },
    extra:mb => { tube(mb, { n:3, m:4, path:t => [0.38 + t * 0.05, 0.18 + t * 0.04, 0], r:0.008, col:fc(pink) }); ellip(mb, [0.43, 0.23, 0], [0.018, 0.014, 0.014], { n:3, m:6, col:fc([1.0, 0.95, 0.85, 0.8]) }); } });
}
function addDeepFolk(VENTS) {
  addObj({ key:'sixgill', name:'bluntnose sixgill shark', label:'sixgill shark', type:'Hexanchus griseus', kind:'sharks', floor:[25500, 500, 3.5], size:4.5, rad:3,
    fact:'An ancient lineage: six gill slits where most sharks have five, and a body plan little changed for about 200 million years. It rises from the deep at night to feed, and comes to whale falls to tear at the carcass.',
    motion:{ type:'circle', R:9, v:0.5, bob:0.8, bank:0.08 },
    parts:[part(mkSixgill, { scale:4.5, mat:M_SKIN, ...FISH_SWIM(0.045, 0.4, 0.85, 2.4) })], views:SIDE });
  addObj({ key:'helmetjelly', name:'helmet jellyfish', type:'Periphylla periphylla', kind:'jellies', at:[18600, -800, 1300], size:0.3, rad:0.4,
    fact:'Its deep red bell is a disguise: red light does not reach the deep, so red looks black, and it hides the glow of the bioluminescent prey it has swallowed. Disturbed, it sets off waves of blue light round its bell.',
    motion:{ type:'drift', amp:0.15, tilt:0.2 },
    parts:[part(mkHelmetJelly, { scale:0.3, mat:[0.75, 0.8, 1, 0.5], trans:true, pulse:[0.12, 0.35, 0, 0], sway:[0.04, 0.4, 4, 0] })],
    views:[{ d:[0.3, 0.15, 1], k:3.2, hold:10, drift:0.03, frame:'world' }, { d:[0.2, -0.8, 0.3], k:3, hold:8, drift:0.03, frame:'world' }] });
  addObj({ key:'cockeyed', name:'cock-eyed squid', type:'Histioteuthis heteropsis', kind:'cephs', at:[17800, 700, 950], size:0.3, rad:0.25,
    fact:'One eye is twice the size of the other. It swims tilted, the big eye looking up for the silhouettes of prey against the last faint daylight, the small one looking down for flashes of living light.',
    motion:{ type:'hover', amp:0.05, turn:0.4 },
    parts:[part(mkCockeyedSquid, { scale:0.3, mat:M_SKIN, pulse:[0.6, 0.3, 0, 0], sway:[0.02, 0.5, 4, 0], swim2:[0, 2, 0.2, 0.35] })], views:[{ d:[0.2, 0.3, 1], k:1.3, hold:10, drift:0.025 }, { d:[-0.5, 0.2, 0.8], k:1.4, hold:8, drift:-0.03 }] });
  addObj({ key:'salps', name:'salps', type:'chains of Salpa · clear barrels that swim by jet', kind:'jellies', at:[14700, -800, 80], size:0.5, vsize:1.3, rad:1.2,
    fact:'Not jellyfish but relatives of ours, distant ones: each salp is a clear barrel that pumps water through itself to swim and to filter food. They bud off clones in long chains, and when food is plentiful a bloom can grow faster than almost any other animal. Their dense droppings sink fast, carrying carbon down into the deep sea.',
    motion:{ type:'drift', amp:0.4, tilt:0.1 },
    parts:[0, 1, 2].map(i => part(mkSalpChain, { scale:0.55 - i * 0.08, off:[i * 0.25 - 0.25, i * 0.22 - 0.2, (i - 1) * 0.3], fwd:o => vnorm([1, 0.15 * Math.sin(simTime * 0.2 + i), 0.3 * Math.cos(simTime * 0.15 + i * 2)]), up:() => [0, 1, 0],
      mat:[0.3, 1.3, 1, 0.8], trans:true, swim:[0.06, 0.6 + i * 0.1, 1, 0], swim2:[0, 1, 0, 0], pulse:[0.4, 0.3, 0, 0] })),
    views:[{ d:[0.3, 0.2, 1], k:1.6, hold:10, drift:0.02, frame:'world' }, { d:[1, -0.3, 0.2], k:1.4, hold:9, drift:0.02, frame:'world' }] });
  addObj({ key:'lanternshark', name:'dwarf lanternsharks', label:'lanternsharks', type:'Etmopterus perryi · the smallest known shark', kind:'sharks', at:[16500, -500, 400], size:0.2, vsize:1.2, rad:1,
    fact:'About 20 cm long, small enough to sit in your hand: the smallest shark known. Like many lanternsharks it glows: thousands of tiny light organs on its belly match the faint light from above, so a hunter looking up sees no shadow. The light organs on its flanks may help others of its kind recognise it in the dark.',
    parts:[part(mkLanternshark, { inst:schoolCloud(9, 0.8, 0.4, 2020, 1, 0.3), school:[1, 0.2, 0.8, 0], mat:[1, 0.35, 1.4, 0.6], shy:2, ...FISH_SWIM(0.06, 1.2, 1, 2) })],
    views:[{ d:[0.3, 0.1, 1], k:1.4, hold:10, drift:0.02, frame:'world' }, { d:[0.2, -0.9, 0.3], k:1.3, hold:9, drift:0.02, frame:'world' }] });
  addObj({ key:'blackswallower', name:'black swallower', type:'Chiasmodon niger · after a big meal', kind:'fish', at:[19300, 250, 1300], size:0.25, vsize:0.28, rad:0.25,
    fact:'About 25 cm long, it can swallow fish more than twice its own length and ten times its weight, walking its jaws over them a bit at a time; its stomach stretches into a thin bag hanging below it. Sometimes it is too ambitious: swallowers have been found floating dead at the surface, the meal decaying inside them faster than they could digest it.',
    motion:{ type:'hover', amp:0.12, turn:0.3 },
    parts:[part(mkBlackSwallower, { scale:0.25, mat:M_SKIN, trans:true, ...FISH_SWIM(0.02, 0.6, 0.8, 2) })],
    views:[{ d:[0.15, 0.1, 1], k:2.6, hold:10, drift:0.02 }, { d:[0.5, -0.6, 0.6], k:2.6, hold:9, drift:0.02 }] });
  addObj({ key:'phronima', name:'pram bug', type:'Phronima · an amphipod in a hollowed-out salp', kind:'micro', at:[14705, -797, 82], size:0.03, vsize:0.045, rad:0.04,
    fact:'A small see-through amphipod that catches a salp, eats out its insides and moves into the empty barrel. The female lays her eggs inside it and swims the barrel along like a pram, pushing her young about until they can fend for themselves. Its two pairs of huge eyes are thought to have inspired the creature in the film Alien.',
    motion:{ type:'hover', amp:0.08, turn:0.6 },
    parts:[part(mkPhronima, { scale:0.03, mat:[0.4, 1.3, 1, 0.8], trans:true, pulse:[0.4, 0.4, 0, 0], sway:[0.004, 2, 30, 0] })],
    views:[{ d:[0.3, 0.15, 1], k:2.4, hold:10, drift:0.02 }, { d:[1, 0.3, 0.3], k:2.4, hold:9, drift:0.02 }] });
  addObj({ key:'pyrosome', name:'pyrosome', type:'a glowing colony · Pyrosoma atlanticum', kind:'jellies', at:[15400, 500, 550], size:0.5, rad:0.4,
    fact:'Not one animal but thousands of tiny clones sharing a tube, each pumping water through the wall to feed. Touch it and it glows: one zooid lights up, its neighbours see the light and answer, and a wave of blue-green light runs along the colony. Some kinds grow to over 10 m long.',
    motion:{ type:'hover', amp:0.3, turn:0.25, pitch:-0.15 },
    parts:[part(mkPyrosome, { scale:0.5, mat:[0.55, 0.9, 0.5, 0.5], trans:true, sway:[0.01, 0.6, 4, 0] })],
    views:[{ d:[0.25, 0.15, 1], k:2.2, hold:10, drift:0.02 }, { d:[-1, 0.2, 0.3], k:2, hold:8, drift:0.02 }] });
  addObj({ key:'fireflysquid', name:'firefly squid', type:'Watasenia scintillans · out only at night', kind:'cephs', at:[6200, 1600, 6], size:0.07, vsize:2, rad:2,
    fact:'By day it lives 200 to 400 m down; at night it rises to feed, and in spring millions gather to spawn in the shallows of Toyama Bay, Japan, lighting the water blue. Its hundreds of light organs can flash, and the three on the tip of each of two arms are bright enough to dazzle.',
    parts:[part(mkFireflySquid, { inst:schoolCloud(500, 1.6, 1.1, 627, 1, 0.3), school:[1, 0.07, 1, 0], mat:[1, 0.4, 2.2, 0.5], shy:6, pulse:[0.5, 1.4, 0, 0], sway:[0.01, 2, 20, 0] })],
    views:[{ d:[0.3, 0.1, 1], k:0.75, hold:10, drift:0.02, frame:'world' }, { d:[1, -0.3, 0.3], k:0.35, hold:9, drift:0.02, frame:'world' }] });
  addObj({ key:'flowerbasket', name:'Venus’ flower basket', type:'a glass sponge · Euplectella aspergillum', kind:'floor', floor:[12620, -905, 0], size:0.25, vsize:0.3, rad:0.2,
    fact:'A sponge whose skeleton is a lattice of glass fibres, stronger for its weight than most things engineers build. A male and female shrimp often enter it young and grow too big to leave, living out their lives inside; in Japan the dried baskets were once given as wedding gifts.',
    parts:[part(mkFlowerBasket, { mat:[0.3, 1.3, 1, 0.8], trans:true, sway:[0.004, 0.3, 4, 0] })],
    views:[{ d:[0.3, 0.15, 1], k:2.1, hold:10, drift:0.025, off:[0, 0.12, 0] }, { d:[0.5, 0.9, 0.4], k:1.3, hold:9, drift:0.025, off:[0, 0.12, 0] }] });
  addObj({ key:'cookiecutter', name:'cookiecutter shark', type:'Isistius brasiliensis', kind:'sharks', at:[16700, 900, 850], size:0.45, rad:0.35,
    fact:'A small shark whose belly glows, all but a dark collar round the throat. Seen from below the collar looks like a little fish, luring tuna, dolphins and even great whites close; then it latches on with sucking lips and twists, carving out a round plug of flesh. It has even bitten submarines.',
    motion:{ type:'circle', R:2.5, v:0.4, bob:0.4, bank:0.1 },
    parts:[part(mkCookiecutter, { scale:0.45, mat:M_SKIN, ...FISH_SWIM(0.06, 1.2, 0.9, 2.2) })],
    views:[{ d:[0.3, -0.45, 1], k:2.2, hold:10, drift:0.02 }, { d:[0.15, 0.1, 1], k:2.0, hold:9, drift:0.02 }] });
  addObj({ key:'opah', name:'opah', type:'Lampris guttatus · the warm-blooded fish', kind:'fish', at:[15400, -300, 300], size:1.2, rad:0.8,
    fact:'The first fish known to be fully warm-blooded, found in 2015: it flaps its red pectoral fins like wings, and the work of those muscles heats its blood, which is kept warm by a counter-current heat exchanger in its gills. Its heart and brain stay about 5 °C above the cold water of the twilight zone, so it stays quick while its prey slows down.',
    motion:{ type:'circle', R:6, v:0.8, bob:1, bank:0.1 },
    parts:[part(mkOpah, { scale:1.2, mat:M_SILVER, swim:[0.01, 1, 0.8, 0], swim2:[1, 2.4, 0, 0] })], views:SIDE });
  addObj({ key:'humboldt', name:'Humboldt squid', type:'Dosidicus gigas · the red devils', kind:'cephs', at:[15200, -700, 550], size:1.2, vsize:7, rad:6, predator:true,
    fact:'Hunting in packs of hundreds, they rise from the twilight zone at night to feed. Their skin flickers between deep red and white in fractions of a second, perhaps signalling to each other as they hunt; fishermen call them red devils. They can swim at over 20 km/h.',
    // the whole pack flickering red and white, out of step across the body of the school
    post:(o, t) => { const f = 0.5 + 0.5 * Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1); o.parts[0].tint = [lerp(1, 1.05, f), lerp(1, 3.0, f), lerp(1, 3.4, f)].map(c => c * lerp(1.3, 1, f)); },
    parts:[part(mkHumboldt, { inst:schoolMill(40, 2.0, 1.2, 3131, 1.4), school:[0, 1.2, 1, 0], mat:M_SKIN, shy:0.6, pulse:[0.5, 1.6, 0, 0], sway:[0.02, 1.5, 6, 0] })],
    views:[{ d:[0.3, 0.1, 1], k:0.55, hold:10, drift:0.02, frame:'world' }, { d:[0.2, -0.7, 0.5], k:0.45, hold:9, drift:0.02, frame:'world' }] });
  addObj({ key:'phantomjelly', name:'giant phantom jelly', type:'Stygiomedusa gigantea', kind:'jellies', at:[19800, -400, 1100], size:1, vsize:4, rad:4,
    fact:'One of the largest invertebrate predators in the deep: a bell about a metre across and four curtain-like arms up to 10 m long, with no stinging tentacles. Described over a century ago, it has been seen alive only about a hundred times. Small fish sometimes shelter among its arms.',
    motion:{ type:'drift', amp:0.4, tilt:0.15 },
    parts:[part(mkPhantomJelly, { scale:1, mat:[0.75, 0.7, 1, 0.4], trans:true, pulse:[0.08, 0.2, 0, 0], sway:[0.15, 0.25, 1.5, 0] })],
    views:[{ d:[0.3, 0.12, 1], k:2.3, hold:11, drift:0.015, frame:'world', off:[0, -2.2, 0] }, { d:[0.5, 0.5, 0.8], k:0.9, hold:9, drift:0.015, frame:'world', off:[0, -0.3, 0] }] });
  addObj({ key:'seatoad', name:'sea toad', type:'Chaunacops coloratus · a deep-sea anglerfish', kind:'fish', floor:[33000, 300, 0.07], size:0.2, rad:0.18, yaw:1.4,
    fact:'A round, pink anglerfish that walks slowly over the deep floor on its fins, dangling a short lure. It can hold its breath for minutes at a time, puffing its gill chamber full of water: perhaps to save energy in water poor in food, or to look bigger to a hunter.',
    motion:{ type:'crawl', R:0.4, v:0.02 },
    // it fills its gill chamber with water and holds it, swelling slowly, then lets it go
    post:(o, t) => { const u = ((t * 0.04) % 1), s = smooth(0, 0.15, u) * smooth(0.9, 0.7, u); o.parts[0].scale = 0.2 * (1 + 0.18 * s); },
    parts:[part(mkSeaToad, { scale:0.2, mat:M_SKIN, ...FISH_SWIM(0.02, 0.4, 0.9, 2) })],
    views:[{ d:[0.4, 0.15, 1], k:2.2, hold:10, drift:0.02 }, { d:[1, 0.3, 0.3], k:2.0, hold:9, drift:0.02 }] });
  addObj({ key:'isopod', name:'giant isopod', type:'Bathynomus giganteus', kind:'floor', floor:[15600, 300, 0.07], size:0.4, rad:0.3,
    fact:'A deep-sea relative of the woodlouse that grows to about half a metre, scavenging whatever falls to the floor. It can go years between meals: one in a Japanese aquarium refused food for more than five years.',
    motion:{ type:'crawl', R:1.2, v:0.03, h:0.07 },
    parts:[part(mkGiantIsopod, { scale:0.4, mat:[1, 0.4, 1, 0.6], sway:[0.01, 2, 20, 0] })],
    views:[{ d:[0.7, 0.45, 1], k:2.4, hold:10, drift:0.02 }, { d:[1, 0.2, 0.2], k:1.9, hold:9, drift:0.02 }, { d:[0.1, 0.95, 0.2], k:2.4, hold:8, drift:0.02 }] });
  addObj({ key:'seapens', name:'sea pens', type:'a meadow of Pennatula · touch them and they glow', kind:'floor', floor:[13000, 700, 0], size:0.45, vsize:1.6, rad:1.5,
    fact:'Each looks like an old quill pen but is a colony of polyps: one anchors it in the mud, the rest feed from the current on its feathery leaves. Disturbed, sea pens glow, a wave of green light rippling along the colony, and some can deflate and pull themselves down into the mud.',
    parts:[part(() => mkSeaPens(BYKEY.seapens.anchor), { mat:M_SKIN, sway:[0.03, 0.5, 3, 0] })],
    views:[{ d:[0.4, 0.6, 1], k:1.3, hold:10, drift:0.02, frame:'world', off:[0, 0.3, 0] }, { d:[1, 0.25, 0.3], k:0.7, hold:9, drift:0.02, frame:'world', off:[0, 0.3, 0] }] });
  addObj({ key:'octopusgarden', name:'the Octopus Garden', label:'octopus garden', type:'thousands of brooding pearl octopuses · Muusoctopus robustus', kind:'places', floor:[25200, -900, 0], size:8, rad:5,
    fact:'Found in 2018 on an extinct volcano off California, 3,200 m down: about 6,000 octopuses, mostly mothers, clinging upside down to the rocks with their eggs. They gather where warm water seeps from the seafloor, which speeds the eggs’ growth: here they hatch in under two years, when in the cold they would take far longer.',
    parts:[part(() => buildOctopusGarden(BYKEY.octopusgarden.anchor), { mat:M_SKIN, sway:[0.02, 0.4, 2, 0] })],
    views:[{ d:[0.4, 0.55, 1], k:0.9, hold:12, drift:0.015, frame:'world', off:[0, 0.4, 0] }, { d:[0.3, 0.8, 0.6], k:0.45, hold:10, drift:0.015, frame:'world', off:[0, 0.4, 0] }] });
  addObj({ key:'seaspider', name:'giant sea spider', type:'Colossendeis · a pycnogonid', kind:'floor', floor:[17000, 900, 0.0], size:0.6, rad:0.35,
    fact:'Not a true spider: a sea spider is nearly all legs, with a body so thin that its gut and reproductive organs run out into them. It has no gills; oxygen soaks in through its leg cuticle, and the gut squeezing in and out pumps its blood. Deep and polar species grow far bigger than shallow ones, with legs spanning up to about 70 cm.',
    motion:{ type:'crawl', R:0.8, v:0.02, h:0 },
    parts:[part(mkSeaSpider, { scale:0.6, mat:[1, 0.35, 1, 0.5], sway:[0.012, 1.4, 25, 0] })],
    views:[{ d:[0.8, 0.45, 1], k:1.9, hold:10, drift:0.02 }, { d:[1, 0.12, 0.25], k:1.6, hold:9, drift:0.02 }] });
  addObj({ key:'chickenmonster', name:'headless chicken monster', label:'swimming sea cucumber', type:'a swimming sea cucumber · Enypniastes eximia', kind:'floor', floor:[44200, 500, 1.2], size:0.25, rad:0.25,
    fact:'A sea cucumber that swims. It settles to scoop up sediment, then lifts off again by rowing with its webbed veil, its gut visible through its see-through body. Disturbed, it can glow and shed glowing skin to distract a predator.',
    motion:{ type:'drift', amp:0.15, tilt:0.0 },
    parts:[part(mkSeaCucumberSwimmer, { scale:0.25, mat:[0.55, 1.2, 1, 0.6], trans:true, swim2:[0, 2, 0.06, 0.5] })],
    views:[{ d:[0.6, 0.25, 1], k:3.0, hold:10, drift:0.02 }, { d:[1, 0.1, 0.25], k:2.6, hold:9, drift:0.02 }] });
  addObj({ key:'yeticrab', name:'yeti crabs', type:'Kiwa · bristly vent crabs', kind:'floor', floor:[VENTS[0] - 3.6, VENTS[1] + 2.4, 0.03], size:0.15, vsize:0.8, rad:0.5, yaw:0.6,
    fact:'First found at vents in the South Pacific in 2005. Watch them wave their arms in slow rhythm: yeti crabs farm bacteria on the bristles of their arms and chest, waving them through the vent’s chemical-rich water, then comb the bacteria off with their mouthparts to eat.',
    parts:[part(mkYetiCrabs, { scale:1, mat:[1, 0.5, 1, 0.4], sway:[0.02, 2.2, 3, 0] })],
    views:[{ d:[0.6, 0.55, 1], k:1.8, hold:10, drift:0.025, frame:'world' }, { d:[1, 0.25, 0.3], k:1.3, hold:9, drift:0.025, frame:'world' }] });
  // (their colony sits on the real wall of the second chimney, about a quarter of the way up)
  const VA = BYKEY.vents.anchor, PC = ventChimneyAt(VA, 1, 13), PO = vmad(PC.path(0.27), [-1, 0, 0], PC.rad(0.27)), PW = vadd(VA, PO);
  addObj({ key:'pompeii', name:'Pompeii worms', type:'Alvinella pompejana · in tubes on a chimney wall', kind:'floor', at:[PW[0], PW[2], -PW[1]], size:0.13, vsize:1.2, rad:0.7, yaw:0,
    fact:'Among the most heat-tolerant animals known. They live in papery tubes on the walls of black smokers, where the water at the tail end of a tube has been measured at around 80 °C while the head, poking out, sits nearer 20 °C. A fleece of bacteria grows on their backs, perhaps insulating them, fed by mucus the worms secrete.',
    parts:[part(() => mkPompeiiWorms(PC, PO), { mat:[1, 0.45, 1, 0.4], sway:[0.012, 1.6, 6, 0] })],
    views:[{ d:[-0.6, 0.25, 0.8], k:2.0, hold:10, drift:0.015, frame:'world' }, { d:[-0.55, -0.15, -0.85], k:1.5, hold:9, drift:0.015, frame:'world' }] });
  addObj({ key:'scalyfoot', name:'scaly-foot snails', type:'Chrysomallon squamiferum · armoured with iron', kind:'floor', floor:[VENTS[0] - 2, VENTS[1] - 5, 0.04], size:0.05, vsize:0.4, rad:0.3,
    fact:'The only animal known to build its armour from iron: its foot is covered in hundreds of scales of iron sulphide, drawn from the vent water. It does not need to hunt: bacteria living in a swollen gland in its throat make its food from the vent’s chemicals.',
    parts:[part(mkScalyFoot, { mat:[1, 0.5, 1, 1.4] })],
    views:[{ d:[0.5, 0.6, 1], k:0.65, hold:10, drift:0.025, frame:'world' }, { d:[1, 0.3, 0.3], k:0.5, hold:9, drift:0.025, frame:'world' }] });
  addObj({ key:'spidercrab', name:'Japanese spider crab', type:'the widest legs of any arthropod · Macrocheira kaempferi', kind:'floor', floor:[11150, 200, 0.0], size:3.7, rad:2,
    fact:'Its legs can span about 3.7 m, the widest of any arthropod. It lives on the floor off Japan between about 50 and 600 m down and may live a hundred years.',
    motion:{ type:'crawl', R:3, v:0.04, h:0 },
    parts:[part(mkSpiderCrab, { scale:3.7, mat:[1, 0.35, 1, 0.5] })],
    views:[{ d:[0.8, 0.55, 1], k:1.0, hold:10, drift:0.02 }, { d:[1, 0.2, 0.2], k:0.8, hold:9, drift:0.02 }, { d:[0.2, 0.95, 0.2], k:1.0, hold:8, drift:0.02 }] });
  addObj({ key:'dragonfish', name:'black dragonfish', type:'Idiacanthus atlanticus', kind:'fish', at:[16200, -600, 1050], size:0.4, rad:0.25,
    fact:'The female, up to about 40 cm long, fishes with a glowing barbel that hangs from her chin. The male is a tenth her size, with no teeth and no working gut: he lives only to mate. Their larvae have eyes on stalks up to a third as long as their bodies.',
    motion:{ type:'hover', amp:0.08, turn:0.3 },
    parts:[part(mkDragonfish, { scale:0.4, mat:M_SKIN, ...FISH_SWIM(0.05, 0.8, 1.2, 1.5) })], views:SIDE });
  addObj({ key:'loosejaw', name:'stoplight loosejaw', type:'Malacosteus niger', kind:'fish', at:[19300, -400, 1300], size:0.25, rad:0.18,
    fact:'One of the very few animals that make red light, which most deep-sea animals cannot see: a private searchlight. To see it itself, its eyes use a pigment made from chlorophyll it gets from its food. Its lower jaw has no floor, just a hinged frame of bone.',
    motion:{ type:'hover', amp:0.05, turn:0.35 },
    parts:[part(mkLoosejaw, { scale:0.25, mat:M_SKIN, ...FISH_SWIM(0.05, 1.0, 1.0, 1.6) })], views:SIDE });
  addObj({ key:'bigfin', name:'bigfin squid', type:'Magnapinna', kind:'cephs', floor:[22500, 400, 0.6], size:7, vsize:7, rad:4,
    fact:'Known for decades only from small damaged juveniles. Since the late 1980s, submersible cameras have found adults hanging in the dark with their arms held out level, then bent sharply down at the "elbows" and trailing, perhaps 7 m long or more.',
    motion:{ type:'hover', amp:0.3, turn:0.15 },
    parts:[part(mkBigfinSquid, { scale:7, mat:[0.85, 0.8, 1, 0.5], swim2:[0, 2, 0.02, 0.4], sway:[0.12, 0.25, 0.4, 0] })],
    views:[{ d:[0.3, 0.05, 1], k:1.55, hold:12, drift:0.015, frame:'world', off:[0, 3.7, 0] }, { d:[0.5, 0.3, 1], k:0.2, hold:10, drift:0.02, frame:'world', off:[0, 6.4, 0] }, { d:[0.2, -0.8, 0.5], k:0.8, hold:9, drift:0.015, frame:'world', off:[0, 3.4, 0] }] });
  addObj({ key:'colossal', name:'colossal squid', type:'the heaviest invertebrate · Mesonychoteuthis hamiltoni', kind:'cephs', at:[26500, -700, 1900], size:9, rad:5.5,
    fact:'The heaviest invertebrate known: a female caught in 2007 weighed about 495 kg. Its eyes, around 27 cm across, are the largest of any animal, and its arms carry swivelling hooks. It was first filmed alive, as a 30 cm juvenile, only in 2025.',
    motion:{ type:'circle', R:15, v:0.5, bob:2, bank:0.05 },
    parts:[part(() => mkSquid({ mantle:0.46, arms:0.2, tent:0.36, mw:0.085, eye:0.045, fin:0.12, finLen:0.2, skin:[0.8, 0.32, 0.2], dark:[0.55, 0.16, 0.1] }), { scale:9, mat:M_SKIN, pulse:[1, 0.3, 0, 0], sway:[0.2, 0.35, 0.5, 0], swim2:[0, 2, 0.3, 0.3] })],
    views:[{ d:[0.2, 0.15, 1], k:1.5, hold:11, drift:0.02 }, { d:[-1, 0.2, 0.4], k:1.3, hold:9, drift:0.02 }, { d:[0.9, 0.1, 0.4], k:0.55, hold:8, drift:0.02, off:[1, 0, 0] }] });
  addObj({ key:'glasssquid', name:'glass squid', type:'a cranchiid squid · nearly transparent', kind:'cephs', at:[14200, 500, 600], size:0.3, rad:0.2,
    fact:'Almost invisible: its body is a clear bag filled with ammonium-rich fluid that is lighter than seawater, so it floats without effort. Light organs under its eyes erase the shadows of the only parts it cannot make transparent.',
    motion:{ type:'hover', amp:0.06, turn:0.4, pitch:0.5 },
    parts:[part(mkGlassSquid, { scale:0.3, mat:[0.3, 1.3, 1, 0.8], trans:true, pulse:[0.6, 0.3, 0, 0], sway:[0.02, 0.5, 4, 0] })], views:SIDE });
  addObj({ key:'glassoctopus', name:'glass octopus', type:'Vitreledonella richardi · nearly transparent', kind:'cephs', at:[13600, -400, 450], size:0.45, rad:0.35,
    fact:'Clear as glass except for its eyes, optic nerves and digestive gland. Its eyes are long and narrow rather than round, and it holds its gland upright, both of which shrink the shadow it casts for hunters looking up from below. It is so rarely seen that most of what was known came from pieces in the stomachs of predators, until a research ship filmed it alive in 2021.',
    motion:{ type:'hover', amp:0.12, turn:0.3 },
    parts:[part(mkGlassOctopus, { scale:0.45, mat:[0.3, 1.3, 1, 0.8], trans:true, pulse:[0.5, 0.25, 0, 0], sway:[0.03, 0.5, 3, 0] })],
    views:[{ d:[0.4, 0.3, 1], k:2.4, hold:10, drift:0.025 }, { d:[0.3, -0.8, 0.5], k:2.4, hold:9, drift:0.025 }] });
  addObj({ key:'chimaera', name:'ghost shark', type:'a chimaera · Hydrolagus', kind:'sharks', floor:[15000, 700, 2.5], size:1.0, rad:0.7,
    fact:'Chimaeras split from the sharks about 400 million years ago. They "fly" with their wing-like pectoral fins, grind shellfish with plates instead of teeth, and the males carry a club-like clasper on the forehead used in mating.',
    motion:{ type:'circle', R:4, v:0.3, bob:0.5, bank:0.1 },
    parts:[part(mkChimaera, { scale:1.0, mat:M_SILVER, swim:[0.02, 0.4, 1.3, 0], swim2:[0, 1.4, 0.06, 0.45] })], views:SIDE });
}
