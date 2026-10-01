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
  toast(o.react.text, 5200);
}
function tickReactions(dt) {
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
    o.fxDyn = [0, r.type === 'evert' ? 0 : env, r.type === 'evert' ? env : 0, r.wheel ? 1 : 2];
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
  PRED.set([0, 0, 0, Math.min(L * (p.shy ?? 10), 4) * (VIEW.mode === 'flight' ? 0 : 1)], 0);
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
function spark(pos, radius, n, power) {
  if (SPARKS.length > 24) SPARKS.shift();
  SPARKS.push({ pos:pos.slice(), r:radius, n:Math.min(n, SNOW_N), age:0, power:power ?? 1, seed:Math.random() * 1000 });
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
in float vA; in float vW; out vec4 o;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0; if (dot(q, q) > 1.0) discard;
  float bright = mix(0.35, 1.0, uLamp.w > 0.0 ? 1.0 : 1.0);
  o = vec4(vec3(0.25, 0.85, 1.0) * vA * bright * (1.0 - dot(q, q) * 0.6) * 1.8, 0.0);
  gl_FragDepth = clamp(vW * uMisc.y, 0.0, 1.0);
}`;
const P_SPARK = program(VS_SPARK, FS_SPARK, 'sparks');
function drawSparks() {
  if (!SPARKS.length) return;
  const u = sceneProg(P_SPARK); if (!u) return;
  gl.uniform1f(u.uPx, ASCII.rows * SY / Math.tan(CAM.fov / 2) * 0.5);
  gl.bindVertexArray(SNOW_VAO);
  for (const s of SPARKS) {
    const r = vsub(s.pos, CAM.pos);
    gl.uniform4f(u.uBurst, r[0], r[1], r[2], s.r);
    gl.uniform3f(u.uAge, s.age, s.seed, s.power);
    gl.drawArrays(gl.POINTS, 0, s.n);
  }
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
  set('combjelly', { react:{ type:'flash', dur:4, text:'Some comb jellies glow when touched: the rainbows are reflected sunlight, but this blue flash is their own.' } });
  // Nautile's floodlights light whatever it passes, once it is deep enough to need them
  set('nautile', { lights:[{ at:[6.5, 0, 0], col:[0.9, 0.95, 1.0], power:o => 0.9 * deep(o), reach:7, metres:true }] });
  // the hunters at the bait ball, and everything else schools keep clear of
  for (const k of ['sailfish', 'dolphin', 'greatwhite', 'whaleshark', 'humpback', 'manta', 'bluewhale']) set(k, { predator:true });
  const bb = BYKEY.baitball;
  if (bb) {
    set('sailfish', { anchor:bb.anchor.slice(), motion:{ type:'rose', R:12, v:4.5, k:2, bob:1.2, ph:0.6 } });
    set('dolphin', { anchor:[bb.anchor[0], bb.anchor[1] + 4, bb.anchor[2]], motion:{ type:'rose', R:17, v:5, k:3, bob:2.5, ph:2.2 } });
  }
}
