// ---- life: animals that react. Living lights that light their surroundings, schools that part round predators and the
// camera, defences you can set off, and plankton that flash when disturbed.

// ---- living lights: the brightest few near the camera light everything round them (GLSL glowAt in 02-ocean.js)
const GLOW_N = 4, GLOW = new Float32Array(GLOW_N * 8);
// where a point given in an object's own (model) units is in the world
function objPoint(o, at, s) {
  return vadd(o.pos, vadd(vadd(vmul(o.fwd, at[0] * s), vmul(o.up, at[1] * s)), vmul(o.side || vcross(o.fwd, o.up), at[2] * s)));
}
function collectLights() {
  const cand = [];
  for (const o of OBJS) {
    if (!o.lights || o.hidden || (DEBUG.solo && o !== DEBUG.solo)) continue;
    const dc = vlen(vsub(o.pos, CAM.pos));
    if (dc > Math.max(60, CAM.scale * 3)) continue;
    const s = o.lightScale || (o.parts[0] && o.parts[0].scale) || 1;
    for (const l of o.lights) {
      let pw = typeof l.power === 'function' ? l.power(o) : l.power;
      if (pw <= 0) continue;
      pw *= 0.85 + 0.15 * Math.sin(simTime * (l.flick || 1.3) + o.idx * 1.7);
      const w = objPoint(o, l.at, s);
      cand.push({ rel:vsub(w, CAM.pos), col:l.col, pw, reach:l.reach * (l.metres ? 1 : s), d:vlen(vsub(w, CAM.pos)) });
    }
  }
  cand.sort((a, b) => a.d / a.reach - b.d / b.reach);
  GLOW.fill(0);
  cand.slice(0, GLOW_N).forEach((c, i) => {
    GLOW.set([c.rel[0], c.rel[1], c.rel[2], c.reach], i * 4);
    GLOW.set([c.col[0] * c.pw, c.col[1] * c.pw, c.col[2] * c.pw, 1], GLOW_N * 4 + i * 4);
  });
  return GLOW;
}

// ---- reactions: o.react = { type:'alarm' | 'evert' | 'flash', dur, wheel, text }
function triggerReact(o) {
  if (!o || !o.react) return;
  if (o.reactT > 0) return;
  o.reactT = o.react.dur; o.reactAge = 0; o.reactCool = o.react.dur + 6;
  // an electric ray's discharge: a burst of crackling light round it, then a second, weaker one
  if (o.react.type === 'zap') { const p = vadd(o.pos, [0, o.size * 0.1, 0]); spark(p, o.size * 0.9, 500, 2.5, [0.75, 0.9, 1.0]); setTimeout(() => spark(p, o.size * 0.7, 300, 1.4, [0.75, 0.9, 1.0]), 350); }
  toast(o.react.text, 5200);
}
// animals that only come out at night
const NIGHT_ONLY = ['flashlight', 'fireflysquid'];
function tickNightLife() {
  for (const k of NIGHT_ONLY) { const f = BYKEY[k]; if (f) f.hidden = night() < 0.45; }
  // garden eels sink into their burrows when a diver comes near, and slowly rise again
  const g = BYKEY.gardeneels;
  if (g) {
    const close = vlen(vsub(g.pos, CAM.pos)) < 1.6 && VIEW.mode !== 'flight';
    g.sink = clamp((g.sink || 0) + (close ? 0.08 : -0.004), 0, 1);
    const b = g.anchor; g.pos = [b[0], b[1] - g.sink * 0.42, b[2]];
    if (close && g.sink > 0.95 && !g._told) { g._told = true; toast('Too close: the whole garden has ducked into its burrows. Back off and they will slowly come up again.', 5000); }
    if (g.sink < 0.1) g._told = false;
  }
}
function tickReactions(dt) {
  tickNightLife();
  for (const o of OBJS) {
    if (!o.react) continue;
    if (o.reactCool > 0) o.reactCool -= dt;
    // swimming freely right up to it sets it off
    if (VIEW.mode === 'free' && !(o.reactCool > 0) && vlen(vsub(o.pos, CAM.pos)) < o.size * 1.4) triggerReact(o);
    if (!(o.reactT > 0)) { o.fxDyn = null; o.reactEnv = 0; continue; }
    o.reactT -= dt; o.reactAge += dt;
    const env = smooth(0, 0.7, o.reactAge) * smooth(0, 1.5, o.reactT);
    o.reactEnv = env;
    const r = o.react;
    o.fxDyn = (r.type === 'puff' || r.type === 'colour' || r.type === 'slime' || r.type === 'zap') ? null : [0, r.type === 'evert' ? 0 : env, r.type === 'evert' ? env : 0, r.wheel ? 1 : r.type === 'wave' ? 3 : 2];
  }
}

// ---- schools: who they keep clear of. The camera, and any predator swimming near them.
function partPos(o, p) {
  const sd = o.side || vcross(o.fwd, o.up);
  return vadd(o.pos, vadd(vadd(vmul(o.fwd, p.off[0]), vmul(o.up, p.off[1])), vmul(sd, p.off[2])));
}
const PRED = new Float32Array(16);
function schoolPredators(o, p) {
  PRED.fill(0);
  const L = p.school[1];
  // the camera: fish give a diver some room (more the shyer they are), but never more than a few metres
  // (and never so much, when you are looking at the school itself, that it is pushed out of its own picture)
  let Rc = Math.min(L * (p.shy ?? 10), 4) * (VIEW.mode === 'flight' ? 0 : 1);
  if (VIEW.focus === o && VIEW.mode === 'orbit') Rc = Math.min(Rc, VIEW.dist * 0.4);
  PRED.set([0, 0, 0, Rc], 0);
  const cand = [];
  for (const q of OBJS) {
    if (!q.predator || q === o || q.hidden) continue;
    for (const qp of q.parts) {
      const w = partPos(q, qp), d = vlen(vsub(w, o.pos));
      if (d < o.rad + q.size * 2 + 6) cand.push({ w, d, r:q.size * 0.55 + L * 6 });
    }
  }
  cand.sort((a, b) => a.d - b.d);
  cand.slice(0, 3).forEach((c, i) => PRED.set([...vsub(c.w, CAM.pos), c.r], (i + 1) * 4));
  return PRED;
}

// ---- flashes in the water: dinoflagellates light up wherever the water is disturbed
const SPARKS = [];
function spark(pos, radius, n, power, col) {
  if (SPARKS.length > 24) SPARKS.shift();
  SPARKS.push({ pos:pos.slice(), r:radius, n:Math.min(n, SNOW_N), age:0, power:power ?? 1, seed:Math.random() * 1000, col:col || [0.25, 0.85, 1.0] });
}
// a click on open water: the plankton there flash
function waterSpark(cx, cy) {
  const A = ASCII, aspect = (A.cols * A.cw) / (A.rows * A.ch), ty = Math.tan(CAM.fov / 2);
  const nx = cx / innerWidth * 2 - 1, ny = 1 - cy / innerHeight * 2;
  const dir = vnorm(vadd(CAM.fwd, vadd(vmul(CAM.right, nx * ty * aspect), vmul(CAM.up, ny * ty))));
  let d = clamp(CAM.scale * 0.6, 1.2, 25);
  const p = vmad(CAM.pos, dir, d);
  if (p[1] > -0.05) return;
  spark(p, Math.max(d * 0.22, 0.3), 320, 1.3);
}
let wakeT = 0;
function tickSparks(dt) {
  for (const s of SPARKS) s.age += dt;
  while (SPARKS.length && SPARKS[0].age > 3.5) SPARKS.shift();
  // a glowing wake: swimming through dark water sets the plankton flashing all round you
  const moving = VIEW.mode === 'free' && ['w', 'a', 's', 'd', 'r', 'f'].some(k => KEYS.has(k));
  if (moving && CAM.depth > 1 && (CAM.depth > 220 || LIGHT.night > 0.5)) {
    wakeT -= dt;
    if (wakeT <= 0) { wakeT = 0.18; const s = Math.max(CAM.scale, 0.3); spark(vmad(vadd(CAM.pos, [(Math.random() - 0.5) * s, (Math.random() - 0.5) * s * 0.6, (Math.random() - 0.5) * s]), CAM.fwd, s * 0.8), Math.max(s * 0.3, 0.3), 120, 0.9); }
  }
}
const VS_SPARK = GLSL_SCENE + `
uniform vec4 uBurst;      // xyz: centre relative to the camera, w: radius
uniform vec3 uAge;        // x: age (s), y: seed, z: power
uniform vec3 uCol;
uniform float uPx;
layout(location = 0) in vec4 aSeed;
out float vA; out float vW;
void main(){
  vec3 q = (aSeed.xyz - 0.5) * 2.0;
  float inside = step(dot(q, q), 1.0);
  float age = uAge.x - aSeed.w * 0.35;           // (not all at once: the flash spreads)
  vec3 p = uBurst.xyz + q * uBurst.w * (0.7 + 0.3 * min(uAge.x, 1.0));
  float on = step(0.0, age) * exp(-max(age, 0.0) * (1.4 + aSeed.w * 2.0));
  float flick = 0.55 + 0.45 * sin(age * 31.0 + aSeed.x * 60.0 + uAge.y);
  vA = inside * on * flick * uAge.z;
  gl_Position = uVP * vec4(p, 1.0); vW = gl_Position.w;
  // (at least about a character cell across: a smaller point is averaged away into the cell round it)
  gl_PointSize = clamp(uPx * uBurst.w * 0.08 / max(gl_Position.w, 1e-6), 4.0, 9.0);
}`;
const FS_SPARK = GLSL_SCENE + `
uniform vec3 uCol;
uniform vec3 uWB;   // (the eye's colour balance, undone so a flash shows its own colour: white spray stays white seen from 25 m down)
in float vA; in float vW; out vec4 o;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0; if (dot(q, q) > 1.0) discard;
  float bright = mix(0.35, 1.0, uLamp.w > 0.0 ? 1.0 : 1.0);
  o = vec4(uCol / max(uWB, vec3(1e-3)) * vA * bright * (1.0 - dot(q, q) * 0.6) * 1.8, 0.0);
  gl_FragDepth = clamp(vW * uMisc.y, 0.0, 1.0);
}`;
const P_SPARK = program(VS_SPARK, FS_SPARK, 'sparks');
function drawSparks() {
  drawSpawn();
  drawBubbleNet();
  if (!SPARKS.length) return;
  const u = sceneProg(P_SPARK); if (!u) return;
  gl.uniform1f(u.uPx, ASCII.rows * SY / Math.tan(CAM.fov / 2) * 0.5);
  gl.uniform3fv(u.uWB, ASCII.wb || [1, 1, 1]);
  gl.bindVertexArray(SNOW_VAO);
  for (const s of SPARKS) {
    const r = vsub(s.pos, CAM.pos);
    gl.uniform4f(u.uBurst, r[0], r[1], r[2], s.r);
    gl.uniform3f(u.uAge, s.age, s.seed, s.power);
    gl.uniform3fv(u.uCol, s.col);
    gl.drawArrays(gl.POINTS, 0, s.n);
  }
}

// ---- the hunt: a sperm whale patrols near the giant squid, then charges through; the squid jets away and drifts back
const HUNT = { T:130, start:0.55, len:0.2 };
function huntMotion(o, t) {
  const S = BYKEY.giantsquid, A = S.anchor, R = 70, v = 1.4;
  const patrol = tt => { const a = tt * v / R; return [A[0] + R * Math.cos(a), A[1] - 40 + 15 * Math.sin(tt * 0.05), A[2] + R * Math.sin(a)]; };
  const at = tt => {
    const u = ((tt % HUNT.T) + HUNT.T) % HUNT.T / HUNT.T, c0 = tt - (u - HUNT.start) * HUNT.T;
    const p = patrol(tt);
    if (u < HUNT.start || u > HUNT.start + HUNT.len) return p;
    const s = (u - HUNT.start) / HUNT.len, P0 = patrol(c0), sq = S.basePos || S.pos;   // (it charges where the squid was)
    const charge = vadd(P0, vmul(vsub(sq, P0), 2 * s));
    const w = smooth(0, 0.2, s) * (1 - smooth(0.8, 1, s));
    return vlerp(p, charge, w);
  };
  o.pos = at(t);
  const d = vsub(at(t + 0.1), o.pos);
  o.fwd = vlen(d) > 1e-6 ? vnorm(d) : o.fwd;
  const sd = vnorm(vcross(o.fwd, [0, 1, 0])); o.up = isFinite(sd[0]) ? vnorm(vcross(sd, o.fwd)) : [0, 1, 0]; o.side = vcross(o.fwd, o.up);
  const u = ((t % HUNT.T) + HUNT.T) % HUNT.T / HUNT.T;
  o.charging = u > HUNT.start && u < HUNT.start + HUNT.len;
  if (o.charging && !o._toldHunt && (VIEW.focus === o || VIEW.focus === S) && VIEW.mode === 'orbit') {
    toast('The sperm whale closes in, clicking. Nobody has filmed this fight; the sucker scars on sperm whales tell how it goes.', 6000);
    o._toldHunt = true;
  }
  if (!o.charging) o._toldHunt = false;
}
// the squid: when the whale comes within reach it jets away, its mantle pumping, then drifts back to its patch
function squidPost(o, t) {
  const W = BYKEY.spermwhale, dt = o._pt == null ? 0 : clamp(t - o._pt, 0, 0.5); o._pt = t;
  o.fleeOff = o.fleeOff || [0, 0, 0]; o.fleeV = o.fleeV || [0, 0, 0];
  o.basePos = o.pos.slice();
  const away = vsub(vadd(o.pos, o.fleeOff), W.pos), dist = vlen(away);
  if (dist < 30 && vlen(o.fleeV) < 1) {
    // dodge sideways, out of the whale's path, rather than racing straight ahead of it
    let side = vsub(away, vmul(W.fwd, vdot(away, W.fwd)));
    if (vlen(side) < 1e-3) side = vcross(W.fwd, [0, 1, 0]);
    o.fleeV = vmul(vnorm(vadd(vnorm(side), vmul(vnorm(away), 0.4))), 9);
  }
  o.fleeOff = vadd(vmul(o.fleeOff, 1 - dt * 0.04), vmul(o.fleeV, dt));
  o.fleeV = vmul(o.fleeV, Math.exp(-dt * 0.45));
  o.pos = vadd(o.pos, o.fleeOff);
  if (vlen(o.fleeV) > 0.8) { o.fwd = vnorm(o.fleeV); const sd = vnorm(vcross(o.fwd, [0, 1, 0])); o.up = isFinite(sd[0]) ? vnorm(vcross(sd, o.fwd)) : [0, 1, 0]; o.side = vcross(o.fwd, o.up); }   // (jetting, a squid goes mantle first, arms trailing)
  const p = o.parts[0]; if (p.pulse) p.pulse[1] = vlen(o.fleeV) > 0.8 ? 1.4 : 0.35;
}

// ---- the humpback breach: every couple of minutes it surges up and throws most of its body out of the water, then crashes back
const BREACH = { T:150, at:0.82, len:0.075 };
function breachPost(o, t) {
  const u = ((t % BREACH.T) + BREACH.T) % BREACH.T / BREACH.T, s = (u - BREACH.at) / BREACH.len;
  o.breaching = s > 0 && s < 1;
  if (!o.breaching) { o._splashed = false; o._rose = false; return; }
  // an arc: up from 25 m, out of the water to about two thirds of its length, over and back
  const L = o.size, y0 = o.pos[1];
  const h = s < 0.45 ? lerp(y0, L * 0.35, ease(s / 0.45)) : lerp(L * 0.35, y0, ease((s - 0.45) / 0.55));
  o.pos = [o.pos[0], h, o.pos[2]];
  const pitch = lerp(1.25, -1.0, smooth(0.15, 0.85, s));
  const flat = vnorm([o.fwd[0], 0, o.fwd[2]]);
  o.fwd = vnorm(vadd(vmul(flat, Math.cos(pitch)), [0, Math.sin(pitch), 0]));
  const sd = vnorm(vcross(o.fwd, [0, 1, 0])); o.up = isFinite(sd[0]) ? vnorm(vcross(sd, o.fwd)) : [0, 1, 0]; o.side = vcross(o.fwd, o.up);
  const white = [0.85, 0.95, 1.0];
  if (!o._rose && h > -L * 0.3) { o._rose = true; spark([o.pos[0], 0.3, o.pos[2]], L * 0.35, 400, 1.5, white); }
  if (!o._splashed && s > 0.75) {
    o._splashed = true; spark([o.pos[0], 0.5, o.pos[2]], L * 0.6, 600, 2.2, white);
    if ((VIEW.focus === o || vlen(vsub(o.pos, CAM.pos)) < 200) && !RIDE.on) toast('A breach: 30 tonnes of whale, almost clear of the water. Nobody is sure why they do it: to signal, to shake off parasites, or for play.', 6000);
  }
}

// ---- coral spawning: at night the reef releases bundles of eggs and sperm that float up towards the surface
const VS_SPAWN = GLSL_SCENE + `
uniform vec3 uBase;     // the reef's centre relative to the camera
uniform float uPx, uOn, uR, uH;
layout(location = 0) in vec4 aSeed;
out float vA; out float vW; out vec3 vRel;
void main(){
  float t = uKd.w;
  float age = fract(t * 0.012 * (0.7 + aSeed.w * 0.6) + aSeed.z);
  float a = aSeed.x * 6.2831, r = sqrt(aSeed.y) * uR;
  vec3 p = uBase + vec3(cos(a) * r + sin(t * 0.3 + aSeed.w * 9.0) * 0.3, age * uH, sin(a) * r + cos(t * 0.27 + aSeed.x * 7.0) * 0.3);
  vRel = p;
  vA = uOn * smoothstep(0.0, 0.05, age) * (1.0 - smoothstep(0.75, 1.0, age));
  gl_Position = uVP * vec4(p, 1.0); vW = gl_Position.w;
  gl_PointSize = clamp(uPx * 0.02 / max(gl_Position.w, 1e-6), 4.0, 10.0);
}`;
const FS_SPAWN = GLSL_SCENE + GLSL_LIGHT + `
in float vA; in float vW; in vec3 vRel; out vec4 o;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0; float d = dot(q, q); if (d > 1.0) discard;
  float depth = -(uCam.y + vRel.y);
  vec3 Ld; vec3 lamp = lampAt(vRel, vec3(0.0, 1.0, 0.0), Ld);
  vec3 c = vec3(1.0, 0.45, 0.55) * (sunAt(depth) + lamp * 2.5 + glowAt(vRel, vec3(0.0)) + 0.04) * vA * (1.0 - d * 0.5);
  o = vec4(fogMix(c, vRel) * vA, 0.0);
  gl_FragDepth = clamp(vW * uMisc.y, 0.0, 1.0);
}`;
const P_SPAWN = program(VS_SPAWN, FS_SPAWN, 'spawn');
function drawSpawn() {
  const R = BYKEY.reef; if (!R || !R.vis) return;
  const on = smooth(0.4, 0.9, night()); if (on <= 0) return;
  const u = sceneProg(P_SPAWN); if (!u) return;
  gl.uniform3fv(u.uBase, vsub(R.pos, CAM.pos)); gl.uniform1f(u.uOn, on); gl.uniform1f(u.uR, 9); gl.uniform1f(u.uH, -R.pos[1] + 0.5);
  gl.uniform1f(u.uPx, ASCII.rows * SY / Math.tan(CAM.fov / 2) * 0.5);
  gl.bindVertexArray(SNOW_VAO);
  gl.drawArrays(gl.POINTS, 0, SNOW_N);
}

// ---- bubble-net feeding: humpbacks circle under a school of herring blowing a spiral curtain of bubbles the fish will not cross,
// then dive beneath and lunge up through the middle together, mouths open, breaking the surface
const BNET = { T:75 };
function bnetU(t) { return (((t % BNET.T) + BNET.T) % BNET.T) / BNET.T; }
function bnetPos(i, u, y0) {
  // where whale i is (relative to the net's centre, in metres) at phase u; y0 is the centre's height
  const a0 = i * 0.55, b = i * TAU / 3, sp = s => { const a = a0 + s * TAU * 2.5, R = 11 - 3 * s; return [Math.cos(a) * R, lerp(-22, -9, s) - i * 1.2 - y0, Math.sin(a) * R]; };
  const L0 = [Math.cos(b) * 2.5, -17 - y0, Math.sin(b) * 2.5], L1 = [Math.cos(b) * 2, -2.5 - y0, Math.sin(b) * 2], L2 = [Math.cos(b) * 4.5, -13 - y0, Math.sin(b) * 4.5];
  if (u < 0.6) return sp(u / 0.6);
  if (u < 0.68) return vlerp(sp(1), L0, ease((u - 0.6) / 0.08));
  if (u < 0.78) return vlerp(L0, L1, ease((u - 0.68) / 0.1));
  if (u < 0.88) return vlerp(L1, L2, ease((u - 0.78) / 0.1));
  return vlerp(L2, sp(0), ease((u - 0.88) / 0.12));
}
function bubbleNetPost(o, t) {
  const u = bnetU(t), A = o.anchor;
  o.pos = A.slice(); o.fwd = [1, 0, 0]; o.up = [0, 1, 0]; o.side = [0, 0, 1]; o.bnU = u;
  let k = 0;
  for (const p of o.parts) {
    if (p.herring) { p.off = [0, -6 - A[1] + lerp(0, 3, smooth(0.3, 0.6, u)), 0]; continue; }
    if (!p.whale) continue;
    const i = k++, pos = bnetPos(i, u, A[1]), nxt = bnetPos(i, u + 0.004, A[1]);
    let d = vnorm(vsub(nxt, pos));
    // falling back after the lunge, the whale tips over from upright to level instead of turning nose-down
    if (u > 0.78 && u < 0.9) { const s = smooth(0.78, 0.9, u), out = vnorm([pos[0], 0, pos[2]]); d = vnorm(vadd(vmul([0, 1, 0], 1 - s), vmul(out, s + 0.05))); }
    if (u > 0.68 && u < 0.78) d = vnorm(vadd([0, 1, 0], vmul(vnorm([pos[0], 0, pos[2]]), 0.15)));
    p._dir = p._dir ? vnorm(vlerp(p._dir, d, 0.15)) : d;
    p.off = pos;
    const f = p._dir, sd = vnorm(vcross(f, Math.abs(f[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0])), up = vnorm(vcross(sd, f));
    p._f = f; p._u = up;
  }
  if (!o._lunged && u > 0.74 && u < 0.8) {
    o._lunged = true; spark([A[0], 0.5, A[2]], 9, 700, 2.2, [0.85, 0.95, 1.0]);
    if ((VIEW.focus === o || vlen(vsub(A, CAM.pos)) < 120) && !RIDE.on) toast('The lunge: the humpbacks burst up through the middle of the net together, mouths open, each taking in tonnes of water and fish.', 6000);
  }
  if (u < 0.7) o._lunged = false;
}
const VS_BNET = GLSL_SCENE + `
uniform vec3 uBase; uniform float uPx, uOn, uArc, uY0;
layout(location = 0) in vec4 aSeed;
out float vA; out float vW; out vec3 vRel;
void main(){
  float t = uKd.w;
  float a = aSeed.x * 6.2831;
  float age = fract(t * (0.08 + aSeed.w * 0.06) + aSeed.z);
  float y = mix(uY0, 0.0, age);
  float R = 9.5 - (y - uY0) * 0.08 + (aSeed.y - 0.5) * 1.2 + 0.4 * sin(age * 9.0 + aSeed.w * 20.0);
  vec3 p = uBase + vec3(cos(a) * R, y, sin(a) * R);
  vRel = p;
  // the curtain is laid down round the circle as the whales spiral, then rises and thins
  vA = uOn * step(aSeed.x, uArc) * smoothstep(0.0, 0.08, age) * (1.0 - smoothstep(0.85, 1.0, age));
  gl_Position = uVP * vec4(p, 1.0); vW = gl_Position.w;
  gl_PointSize = clamp(uPx * 0.22 / max(gl_Position.w, 1e-6), 2.0, 14.0);
}`;
const FS_BNET = GLSL_SCENE + GLSL_LIGHT + `
in float vA; in float vW; in vec3 vRel; out vec4 o;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0; float d = dot(q, q); if (d > 1.0) discard;
  float depth = -(uCam.y + vRel.y);
  vec3 c = vec3(0.85, 0.95, 1.0) * (sunAt(depth) * 2.4 + 0.05) * vA * mix(1.0, 0.4, d);
  o = vec4(fogMix(c, vRel) * vA, 0.0);
  gl_FragDepth = clamp(vW * uMisc.y, 0.0, 1.0);
}`;
const P_BNET = program(VS_BNET, FS_BNET, 'bubblenet');
function drawBubbleNet() {
  const o = BYKEY.bubblenet; if (!o || !o.vis || o.bnU == null) return;
  const u = o.bnU, on = smooth(0.05, 0.12, u) * (1 - smooth(0.7, 0.8, u)); if (on <= 0) return;
  const pr = sceneProg(P_BNET); if (!pr) return;
  gl.uniform3fv(pr.uBase, vsub([o.anchor[0], 0, o.anchor[2]], CAM.pos)); gl.uniform1f(pr.uOn, on);
  gl.uniform1f(pr.uArc, clamp((u - 0.06) / 0.45, 0, 1)); gl.uniform1f(pr.uY0, -22);
  gl.uniform1f(pr.uPx, ASCII.rows * SY / Math.tan(CAM.fov / 2) * 0.5);
  gl.bindVertexArray(SNOW_VAO);
  gl.drawArrays(gl.POINTS, 0, SNOW_N);
}

// ---- breathing: air-breathers that live near the floor rise to the surface every so often
function breathePost(o, t) {
  const T = o.breatheT || 110, u = (((t + o.idx * 13) % T) + T) % T / T, a = 0.78, b = 0.97;
  if (u < a || u > b) return;
  const s = (u - a) / (b - a), lift = Math.sin(s * PI);
  const y0 = o.pos[1];
  o.pos = [o.pos[0], lerp(y0, -o.size * 0.25, smooth(0, 0.45, s) * (1 - smooth(0.6, 1, s))), o.pos[2]];
  const pitch = Math.cos(s * PI) * 0.7 * lift;
  const flat = vnorm([o.fwd[0], 0, o.fwd[2]]);
  o.fwd = vnorm(vadd(vmul(flat, Math.cos(pitch)), [0, Math.sin(pitch), 0]));
  const sd = vnorm(vcross(o.fwd, [0, 1, 0])); o.up = isFinite(sd[0]) ? vnorm(vcross(sd, o.fwd)) : [0, 1, 0]; o.side = vcross(o.fwd, o.up);
  o.breathing = s > 0.4 && s < 0.6;
}

// ---- who lights, who hunts, who reacts
function addLife() {
  const set = (k, v) => { if (BYKEY[k]) Object.assign(BYKEY[k], v); };
  const deep = o => smooth(80, 300, -o.pos[1]);
  set('anglerfish', { lights:[{ at:[0.5, 0.28, 0], col:[0.5, 1.0, 0.9], power:0.9, reach:0.8, flick:0.7 }] });
  set('dragonfish', { lights:[{ at:[0.39, -0.29, 0], col:[0.55, 0.9, 1.0], power:0.35, reach:0.45 }] });
  set('loosejaw', { lights:[{ at:[0.46, -0.02, 0], col:[1.0, 0.12, 0.06], power:0.7, reach:0.9, flick:0.4 }] });
  set('viperfish', { lights:[{ at:[0.42, 0.19, 0], col:BIO, power:0.3, reach:0.4 }] });
  set('gulper', { lights:[{ at:[-0.5, 0, 0], col:[1.0, 0.35, 0.45], power:0.25, reach:0.35, flick:2.5 }] });
  set('vampsquid', { lights:[{ at:[0.36, 0.0, 0], col:BIO, power:0.25, reach:0.5 }],
    react:{ type:'evert', dur:7, text:'Threatened, the vampire squid turns its cloak inside out over its body, hiding behind a wall of soft spines.' } });
  set('atolla', { lights:[{ at:[0, 0, 0], col:BIO, power:o => (o.reactEnv || 0) * 1.4, reach:0.6, flick:9 }],
    react:{ type:'alarm', wheel:true, dur:7, text:'Atolla’s burglar alarm: a wheel of blue light that can be seen far off, and may bring a bigger hunter to eat whatever grabbed it.' } });
  set('chickenmonster', { lights:[{ at:[0, 0, 0], col:BIO, power:o => (o.reactEnv || 0) * 1.0, reach:0.8, flick:7 }],
    react:{ type:'flash', dur:5, text:'Disturbed, the swimming sea cucumber flashes blue, and can shed glowing skin to stick to an attacker while it rows away.' } });
  set('helmetjelly', { lights:[{ at:[0, 0, 0], col:BIO, power:o => (o.reactEnv || 0) * 1.2, reach:0.7, flick:6 }],
    react:{ type:'alarm', dur:6, text:'Disturbed, the helmet jelly sends rings of blue light rippling round its bell.' } });
  set('puffer', { react:{ type:'puff', dur:10, text:'Alarmed, the porcupinefish gulps water and swells into a ball two or three times its size, every spine standing on end.' } });
  set('octopus', { react:{ type:'colour', dur:9, text:'The octopus flushes dark red and squirts a cloud of ink, a decoy to hide behind while it gets away. Then it fades back into the colours of the reef: its skin is packed with colour cells it opens and closes at will.' } });
  set('pyrosome', { lights:[{ at:[0, 0, 0], col:[0.35, 1.0, 0.8], power:o => (o.reactEnv || 0) * 0.3, reach:0.8, flick:4 }],
    react:{ type:'wave', dur:8, text:'Touched, the pyrosome lights up: each tiny zooid answers its neighbour’s light, and a glow runs the length of the colony.' } });
  set('blueringed', { react:{ type:'colour', dur:8, text:'Alarmed, the blue-ringed octopus flashes its rings electric blue: a warning that it carries enough venom to kill.' } });
  set('fireflysquid', { lights:[{ at:[0, 0, 0], col:[0.25, 0.6, 1.0], power:0.6, reach:1.8, flick:1.2 }] });
  set('cookiecutter', { lights:[{ at:[0, -0.05, 0], col:[0.3, 0.95, 0.75], power:0.25, reach:0.6 }] });
  set('hagfish', { react:{ type:'slime', dur:10, text:'The hagfish floods the water with slime: threads from its skin glands swell up with seawater in a fraction of a second, enough to clog any attacker’s gills.' } });
  set('torpedo', { react:{ type:'zap', dur:3, text:'Zap: the torpedo ray fires its electric organs, over 200 volts, enough to stun a fish or knock a diver over.' } });
  set('combjelly', { react:{ type:'flash', dur:4, text:'Some comb jellies glow when touched: the rainbows are reflected sunlight, but this blue flash is their own.' } });
  // Nautile's floodlights light whatever it passes, once it is deep enough to need them
  set('nautile', { lights:[{ at:[6.5, 0, 0], col:[0.9, 0.95, 1.0], power:o => 0.9 * deep(o), reach:7, metres:true }] });
  // the hunters at the bait ball, and everything else schools keep clear of
  for (const k of ['sailfish', 'dolphin', 'greatwhite', 'whaleshark', 'humpback', 'manta', 'bluewhale']) set(k, { predator:true });
  // the sperm whale moves in to hunt round the giant squid
  set('spermwhale', { motion:{ type:'still', fn:huntMotion }, hunt:true });
  set('giantsquid', { post:squidPost });
  set('humpback', { post:breachPost });
  set('turtle', { post:breathePost, breatheT:120, readout:() => BYKEY.turtle.breathing ? 'up at the surface for a breath' : 'can stay under for hours when resting, minutes when active' });
  // a line of numbers for the animals that have a striking one
  const STAT = {
    bluewhale:'up to 30 m and 190 t · heart ~180 kg · calls heard 1,000 km away',
    spermwhale:'dives to 2,000 m+ · holds its breath ~90 min · brain 8 kg, the largest of any animal',
    beakedwhale:'record dive 2,992 m · record breath-hold 3 h 42 min',
    humpback:'flippers up to 5 m · migrates ~8,000 km each way',
    greenlandshark:'lives 270 to ~400 years · grows ~1 cm a year · cruises at ~1 km/h',
    sailfish:'bursts often quoted at 100 km/h; measured strikes ~30 km/h',
    greatwhite:'up to 6 m · senses a billionth of a volt · bursts to ~40 km/h',
    whaleshark:'up to ~18 m · filters ~6,000 litres of water an hour',
    colossal:'eyes ~27 cm across · ~495 kg · swivelling hooks on its arms',
    giantsquid:'up to ~12 m · eyes up to 27 cm · first filmed alive in 2012',
    mantisshrimp:'strike ~23 m/s · 12 to 16 kinds of colour receptor (we have 3)',
    coelacanth:'lineage ~400 million years · lives ~100 years · pregnancy ~5 years',
    frilledshark:'pregnancy up to 3.5 years · ~300 three-pronged teeth',
    oarfish:'up to ~8 m long · hangs upright in the water',
    narwhal:'tusk up to 3 m · dives below 1,500 m under the ice',
    seaotter:'up to ~1 million hairs per square inch · eats ~25% of its weight a day',
    orca:'up to ~9 m · pods with their own dialects · bursts to ~50 km/h',
    blobfish:'lives 600 to 1,200 m down · flesh a little less dense than water',
    tubeworms:'up to 2 m · grows up to 85 cm a year · no mouth, no gut',
    amphipods:'lives at 10,900 m · pressure ~1,100 atmospheres',
    snailfish:'deepest fish filmed ~8,336 m · soft body, little hard bone',
    dumbo:'deepest octopus known, to ~7,000 m',
    seamount:'black corals dated at over 4,000 years',
    leatherback:'up to ~2 m and 900 kg · dives past 1,200 m · migrates ~10,000 km',
    lionsmane:'bell up to 2 m · tentacles 30 m+',
    boxjelly:'24 eyes · swims up to ~2 m/s · among the most venomous animals',
    blueringed:'golf-ball sized · venom enough for ~26 adults · no antidote',
    penguin:'dives to ~180 m · swims at ~8 km/h · eats ~2 kg of krill a day',
    beluga:'up to ~5 m · 50 or more distinct calls · turns its head, unlike most whales',
    sealion:'up to ~40 km/h underwater · dives to ~270 m',
    barracuda:'lunges at 40 km/h+ · schools of hundreds by day',
    nautilus:'lineage ~500 million years · up to 90 tentacles, no suckers',
    pyrosome:'colonies up to 18 m long, big enough for a diver to swim into',
    scalyfoot:'iron-sulphide scales · lives at 2,400 to 2,900 m',
    seadragon:'up to ~45 cm · the male carries ~250 eggs on its tail',
    fireflysquid:'~7 cm · ~1,000 light organs · gathers in millions to spawn',
    grouper:'giant grouper up to ~2.7 m and 400 kg · swallows prey whole',
    bubblenet:'nets up to ~30 m across · lunge mouthfuls of ~15 tonnes of water',
  };
  for (const [k, v] of Object.entries(STAT)) if (v && BYKEY[k] && !BYKEY[k].readout) BYKEY[k].readout = () => v;
  set('reef', { readout:() => night() > 0.5 ? 'night: the corals are spawning, bundles of eggs and sperm rising to the surface\n(on real reefs this happens a few nights a year, just after a full moon)' : 'day: the coral polyps are pulled in; at night they open to feed' });
  const bb = BYKEY.baitball;
  if (bb) {
    set('sailfish', { anchor:bb.anchor.slice(), motion:{ type:'rose', R:12, v:4.5, k:2, bob:1.2, ph:0.6 } });
    set('dolphin', { anchor:[bb.anchor[0], bb.anchor[1] + 4, bb.anchor[2]], motion:{ type:'rose', R:17, v:5, k:3, bob:2.5, ph:2.2 } });
  }
}
