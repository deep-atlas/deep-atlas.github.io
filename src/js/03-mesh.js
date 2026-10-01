// ---- procedural meshes. A creature is built in its own frame: +x forward (the head), +y up, +z to its right,
// usually one unit long from tail (x = -0.5) to snout (x = +0.5), then drawn at its true length.
//
// Every vertex carries an animation vector aAnim:
//   x  where it sits along the body, 0 at the snout to 1 at the tail: how much the swimming wave moves it
//   y  flap: how far out along a wing or flipper (rays, turtles, penguins flap these up and down)
//   z  sway: tentacles, arms, kelp and plumes drift with the water
//   w  pulse: a jellyfish bell contracting
// and a colour aCol: rgb, and a = how strongly it glows (bioluminescence).

class MB {
  constructor() { this.P = []; this.N = []; this.C = []; this.A = []; this.I = []; }
  get count() { return this.P.length / 3; }
  v(p, c, a) {
    this.P.push(p[0], p[1], p[2]); this.N.push(0, 0, 0);
    this.C.push(c[0], c[1], c[2], c[3] || 0);
    a = a || ZA; this.A.push(a[0] || 0, a[1] || 0, a[2] || 0, a[3] || 0);
    return this.count - 1;
  }
  tri(a, b, c) { this.I.push(a, b, c); }
  quad(a, b, c, d) { this.I.push(a, b, c, a, c, d); }
  mark() { return { v:this.count, i:this.I.length }; }
  // move, turn or scale the vertices made since a mark: f(p) -> p'
  xform(mk, f) {
    for (let k = mk.v; k < this.count; k++) { const q = f([this.P[k * 3], this.P[k * 3 + 1], this.P[k * 3 + 2]]); this.P[k * 3] = q[0]; this.P[k * 3 + 1] = q[1]; this.P[k * 3 + 2] = q[2]; }
    return this;
  }
  // copy the part made since a mark, transformed (left and right fins, rows of legs)
  dup(mk, f, af) {
    const v0 = this.count, nv = this.count - mk.v, ni = this.I.length - mk.i;
    for (let k = mk.v; k < mk.v + nv; k++) {
      const p = f([this.P[k * 3], this.P[k * 3 + 1], this.P[k * 3 + 2]]);
      let a = [this.A[k * 4], this.A[k * 4 + 1], this.A[k * 4 + 2], this.A[k * 4 + 3]];
      if (af) a = af(a);
      this.v(p, [this.C[k * 4], this.C[k * 4 + 1], this.C[k * 4 + 2], this.C[k * 4 + 3]], a);
    }
    for (let k = mk.i; k < mk.i + ni; k++) this.I.push(this.I[k] - mk.v + v0);
    return this;
  }
  normals() {
    const P = this.P, N = this.N.fill(0), I = this.I;
    for (let k = 0; k < I.length; k += 3) {
      const a = I[k] * 3, b = I[k + 1] * 3, c = I[k + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
      const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const i of [a, b, c]) { N[i] += nx; N[i + 1] += ny; N[i + 2] += nz; }
    }
    for (let i = 0; i < N.length; i += 3) { const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1; N[i] /= l; N[i + 1] /= l; N[i + 2] /= l; }
    return this;
  }
}
const ZA = [0, 0, 0, 0];
const callOr = (f, ...a) => typeof f === 'function' ? f(...a) : f;

// a body lofted along x: sec(t) gives the cross-section at t (0 = front, 1 = back): { x, y, z, w (half-width), h (half-height), e (superellipse) }
function loft(mb, o) {
  const n = o.n || 40, m = o.m || 16, rows = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, s = o.sec(t), row = [];
    const e = s.e || 2;
    for (let j = 0; j < m; j++) {
      const th = j / m * TAU, cs = Math.cos(th), sn = Math.sin(th);
      const sy = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / e), sz = Math.sign(cs) * Math.pow(Math.abs(cs), 2 / e);
      const p = [s.x, (s.y || 0) + s.h * sy, (s.z || 0) + s.w * sz];
      row.push(mb.v(p, callOr(o.col, t, j / m, p, sy, sz), callOr(o.anim, t, j / m, p) || [t, 0, 0, 0]));
    }
    rows.push(row);
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    const j1 = (j + 1) % m;
    mb.quad(rows[i][j], rows[i + 1][j], rows[i + 1][j1], rows[i][j1]);
  }
  for (const [end, t] of [[0, 0], [n, 1]]) {
    if ((t === 0 && o.capStart === false) || (t === 1 && o.capEnd === false)) continue;
    const s = o.sec(t), p = [s.x, s.y || 0, s.z || 0];
    const c = mb.v(p, callOr(o.col, t, 0, p, 0, 0), callOr(o.anim, t, 0, p) || [t, 0, 0, 0]);
    for (let j = 0; j < m; j++) { const j1 = (j + 1) % m; if (t === 0) mb.tri(c, rows[end][j1], rows[end][j]); else mb.tri(c, rows[end][j], rows[end][j1]); }
  }
  return mb;
}

// a flat fin or membrane: an outline of [a, b] points in the plane origin + a*ua + b*va, filled in rings so it can bend
function fin(mb, pts, o) {
  const org = o.origin || [0, 0, 0], ua = o.ua || [1, 0, 0], va = o.va || [0, 1, 0], R = o.rings || 3;
  const to3 = (a, b) => [org[0] + ua[0] * a + va[0] * b, org[1] + ua[1] * a + va[1] * b, org[2] + ua[2] * a + va[2] * b];
  let ca = 0, cb = 0; for (const p of pts) { ca += p[0]; cb += p[1]; } ca /= pts.length; cb /= pts.length;
  if (o.center) { ca = o.center[0]; cb = o.center[1]; }
  const mkv = (a, b, r) => { const p = to3(a, b); return mb.v(p, callOr(o.col, a, b, r, p), callOr(o.anim, a, b, r, p) || [0, 0, 0, 0]); };
  const c = mkv(ca, cb, 0), rings = [];
  for (let r = 1; r <= R; r++) rings.push(pts.map(p => mkv(lerp(ca, p[0], r / R), lerp(cb, p[1], r / R), r / R)));
  const n = pts.length;
  for (let j = 0; j < n; j++) { const j1 = (j + 1) % n; if (!o.open || j1) mb.tri(c, rings[0][j], rings[0][j1]); }
  for (let r = 0; r < R - 1; r++) for (let j = 0; j < n; j++) { const j1 = (j + 1) % n; if (o.open && !j1) continue; mb.quad(rings[r][j], rings[r + 1][j], rings[r + 1][j1], rings[r][j1]); }
  return mb;
}

// a tube along a path: path(t) -> point, r(t) -> radius
function tube(mb, o) {
  const n = o.n || 16, m = o.m || 6, rows = [];
  const pts = []; for (let i = 0; i <= n; i++) pts.push(o.path(i / n));
  let prevN = null;
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = pts[i];
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)];
    const T = vnorm(vsub(b, a));
    let Nn;
    if (!prevN) { const ref = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; Nn = vnorm(vcross(vcross(T, ref), T)); }
    else { Nn = vnorm(vsub(prevN, vmul(T, vdot(prevN, T)))); }
    prevN = Nn;
    const B = vcross(T, Nn), r = callOr(o.r, t), row = [];
    for (let j = 0; j < m; j++) {
      const th = j / m * TAU, cs = Math.cos(th), sn = Math.sin(th);
      const q = [p[0] + (Nn[0] * cs + B[0] * sn) * r, p[1] + (Nn[1] * cs + B[1] * sn) * r, p[2] + (Nn[2] * cs + B[2] * sn) * r];
      row.push(mb.v(q, callOr(o.col, t, j / m, q), callOr(o.anim, t, q) || [0, 0, 0, 0]));
    }
    rows.push(row);
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const j1 = (j + 1) % m; mb.quad(rows[i][j], rows[i][j1], rows[i + 1][j1], rows[i + 1][j]); }
  if (o.capEnd !== false) {
    const p = pts[n], c = mb.v(p, callOr(o.col, 1, 0, p), callOr(o.anim, 1, p) || [0, 0, 0, 0]);
    for (let j = 0; j < m; j++) mb.tri(c, rows[n][j], rows[n][(j + 1) % m]);
  }
  if (o.capStart) {
    const p = pts[0], c = mb.v(p, callOr(o.col, 0, 0, p), callOr(o.anim, 0, p) || [0, 0, 0, 0]);
    for (let j = 0; j < m; j++) mb.tri(c, rows[0][(j + 1) % m], rows[0][j]);
  }
  return mb;
}

// an ellipsoid at c with radii r = [rx, ry, rz]; f(p, u, v) can reshape each point
function ellip(mb, c, r, o = {}) {
  const n = o.n || 12, m = o.m || 16, rows = [];
  for (let i = 0; i <= n; i++) {
    const v = i / n, ph = v * PI, row = [];
    for (let j = 0; j < m; j++) {
      const u = j / m, th = u * TAU;
      let p = [c[0] + r[0] * Math.cos(ph), c[1] + r[1] * Math.sin(ph) * Math.sin(th), c[2] + r[2] * Math.sin(ph) * Math.cos(th)];
      if (o.shape) p = o.shape(p, u, v);
      row.push(mb.v(p, callOr(o.col, u, v, p), callOr(o.anim, u, v, p) || [0, 0, 0, 0]));
    }
    rows.push(row);
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const j1 = (j + 1) % m; mb.quad(rows[i][j], rows[i + 1][j], rows[i + 1][j1], rows[i][j1]); }
  return mb;
}

// a flat ribbon along a path: path(t), width(t), side(t) (the direction across)
function ribbon(mb, o) {
  const n = o.n || 20, rows = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = o.path(t), sd = vnorm(callOr(o.side, t)), w = callOr(o.w, t);
    const a = vmad(p, sd, -w), b = vmad(p, sd, w);
    rows.push([mb.v(a, callOr(o.col, t, 0, a), callOr(o.anim, t, a) || ZA), mb.v(b, callOr(o.col, t, 1, b), callOr(o.anim, t, b) || ZA)]);
  }
  for (let i = 0; i < n; i++) mb.quad(rows[i][0], rows[i][1], rows[i + 1][1], rows[i + 1][0]);
  return mb;
}

// rotations about the axes, as functions on points
const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return p => [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]; };
const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return p => [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; };
const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return p => [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; };
const move = d => p => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
const scl = s => p => Array.isArray(s) ? [p[0] * s[0], p[1] * s[1], p[2] * s[2]] : [p[0] * s, p[1] * s, p[2] * s];
const chain = (...fs) => p => fs.reduce((q, f) => f(q), p);
const mirrorZ = p => [p[0], p[1], -p[2]];

// to the GPU: one interleaved buffer (pos 3, normal 3, colour 4, anim 4) and an index buffer
const STRIDE = 14 * 4;
function upload(mb, inst) {
  mb.normals();
  const nv = mb.count, data = new Float32Array(nv * 14);
  let rad = 0; const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (let k = 0; k < nv; k++) {
    data.set([mb.P[k * 3], mb.P[k * 3 + 1], mb.P[k * 3 + 2]], k * 14);
    data.set([mb.N[k * 3], mb.N[k * 3 + 1], mb.N[k * 3 + 2]], k * 14 + 3);
    data.set([mb.C[k * 4], mb.C[k * 4 + 1], mb.C[k * 4 + 2], mb.C[k * 4 + 3]], k * 14 + 6);
    data.set([mb.A[k * 4], mb.A[k * 4 + 1], mb.A[k * 4 + 2], mb.A[k * 4 + 3]], k * 14 + 10);
    for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], mb.P[k * 3 + i]); hi[i] = Math.max(hi[i], mb.P[k * 3 + i]); }
    rad = Math.max(rad, Math.hypot(mb.P[k * 3], mb.P[k * 3 + 1], mb.P[k * 3 + 2]));
  }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  const at = (loc, n, off) => { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, n, gl.FLOAT, false, STRIDE, off * 4); };
  at(0, 3, 0); at(1, 3, 3); at(2, 4, 6); at(3, 4, 10);
  const ib = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(mb.I), gl.STATIC_DRAW);
  let ibuf = null, icount = 0;
  if (inst) {
    ibuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ibuf); gl.bufferData(gl.ARRAY_BUFFER, inst, gl.STATIC_DRAW);
    for (const [loc, off] of [[4, 0], [5, 4]]) { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 32, off * 4); gl.vertexAttribDivisor(loc, 1); }
    icount = inst.length / 8;
  }
  gl.bindVertexArray(null);
  return { vao, count:mb.I.length, rad, lo, hi, icount, tris:mb.I.length / 3 };
}
