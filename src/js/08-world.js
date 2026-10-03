// ---- everything in the ocean: places, creatures and scenery, each an object with parts, a motion and camera angles

const OBJS = [], BYKEY = {};
const KINDS = [
  { id:'places', name:'places' }, { id:'fish', name:'fish' }, { id:'sharks', name:'sharks & rays' }, { id:'air', name:'air-breathers' },
  { id:'jellies', name:'jellies & drifters' }, { id:'cephs', name:'squid & octopus' }, { id:'floor', name:'floor life' },
  { id:'micro', name:'plankton & microbes' }, { id:'subs', name:'submersibles' },
];
// the time of day (minutes after midnight), driving sunlight and the nightly migration
const TOD = { min:630, live:false };
const night = () => 1 - smooth(-0.08, 0.25, Math.sin((TOD.min / 60 - 6) / 12 * PI));

// o: { key, name, type, kind, fact, size (m), at:[x, z, depth] | floor:[x, z, height above floor], motion, parts, views, rad }
function addObj(o) {
  o.idx = OBJS.length;
  o.place = o.place !== false;
  o.label = o.label || o.name;
  o.size = o.size || 1;
  o.rad = o.rad || o.size * 0.6;
  if (o.floor) { const [x, z, h] = o.floor; o.anchor = [x, floorY(x, z) + h, z]; }
  else { const [x, z, d] = o.at; o.anchor = [x, -d, z]; }
  o.pos = o.anchor.slice(); o.fwd = [1, 0, 0]; o.up = [0, 1, 0]; o.yaw = o.yaw ?? 0;
  o.motion = o.motion || { type:'still' };
  o.parts = (o.parts || []).map(p => Object.assign({ scale:1, off:[0, 0, 0] }, p));
  o.views = (o.views || [{ d:[0.3, 0.25, 1], k:2.2, hold:9, drift:0.03 }, { d:[-1, 0.3, 0.4], k:2.6, hold:8, drift:0.03 }, { d:[0.9, -0.2, -0.6], k:1.8, hold:8, drift:-0.03 }])
    .map(v => o.kind === 'places' ? v : Object.assign({}, v, { k:v.k * 0.7 }));   // (creatures framed a little closer than places)
  o.vis = 0;
  OBJS.push(o); BYKEY[o.key] = o;
  return o;
}
// a part built from a model function, uploaded the first time it is needed
function part(build, o = {}) { return Object.assign({ build }, o); }
function ensureMesh(p) {
  if (p.mesh || p.failed) return !!p.mesh;
  try { const mb = p.build(); p.mesh = upload(mb, p.inst); if (mb.tops) p.tops = mb.tops; }
  catch (e) { console.error('model failed', e); p.failed = true; }
  return !!p.mesh;
}

// ---- motions: where an object is and which way it faces, at time t
function moveObj(o, t) {
  const m = o.motion, A = o.anchor;
  if (o.frozen) return;   // (held still: an animal being compared)
  if (m.fn) { m.fn(o, t); return; }
  let pos = A, fwd = null, up = [0, 1, 0];
  switch (m.type) {
    case 'circle': {
      // swims a loose circle (radius R, m/s v), bobbing, banked into the turn
      const dir = m.dir || 1, a = t * m.v / m.R * dir + (m.ph || 0), bob = m.bob ?? m.R * 0.08;
      pos = [A[0] + m.R * Math.cos(a), A[1] + bob * Math.sin(t * 0.11 + (m.ph || 0)), A[2] + m.R * Math.sin(a)];
      const vy = clamp(bob * 0.11 * Math.cos(t * 0.11 + (m.ph || 0)), -0.12 * m.v, 0.12 * m.v);   // (a gentle climb, whatever the speed)
      fwd = vnorm([-Math.sin(a) * m.v * dir, vy, Math.cos(a) * m.v * dir]);
      const side = vnorm(vcross(fwd, [0, 1, 0])), bank = (m.bank ?? 0.12) * dir;
      up = vnorm(vadd(vcross(side, fwd), vmul(side, -bank)));
      break;
    }
    case 'eight': {
      // a figure of eight, for long swimmers that need room
      const a = t * m.v / m.R * 0.5 + (m.ph || 0);
      const p = [Math.sin(a) * m.R, Math.sin(t * 0.07) * (m.bob ?? 2), Math.sin(a) * Math.cos(a) * m.R * 0.8];
      const d = [Math.cos(a) * m.R, Math.cos(t * 0.07) * 0.07 * (m.bob ?? 2) * 2 / m.v, Math.cos(2 * a) * m.R * 0.8];
      pos = vadd(A, p); fwd = vnorm(d);
      break;
    }
    case 'hover': {
      const a = m.amp ?? o.size * 0.15;
      pos = [A[0] + a * Math.sin(t * 0.13), A[1] + a * 0.5 * Math.sin(t * 0.21 + 1), A[2] + a * Math.cos(t * 0.11)];
      const yaw = o.yaw + (m.turn ?? 0.35) * Math.sin(t * 0.05 + o.idx);
      fwd = dirYP(yaw, (m.pitch ?? 0) + 0.08 * Math.sin(t * 0.17));
      break;
    }
    case 'drift': {
      // jellies: bell up, rising a little with each pulse, rocking
      const a = m.amp ?? o.size * 0.4;
      pos = [A[0] + a * Math.sin(t * 0.05 + o.idx), A[1] + a * 0.6 * Math.sin(t * 0.09), A[2] + a * Math.cos(t * 0.04 + o.idx)];
      const tilt = m.tilt ?? 0.25;
      fwd = vnorm([tilt * Math.sin(t * 0.13 + o.idx), 1, tilt * Math.cos(t * 0.11)]);
      up = vnorm(vcross(vcross(fwd, [1, 0, 0]), fwd));
      break;
    }
    case 'rose': {
      // loops that pass through the centre again and again: hunters slashing through a bait ball
      const P = tt => { const a = tt * m.v / (m.R * (m.k || 2)) + (m.ph || 0), r = m.R * Math.cos((m.k || 2) * a);
        return [A[0] + r * Math.cos(a), A[1] + (m.bob ?? 1) * Math.sin(tt * 0.23 + (m.ph || 0)), A[2] + r * Math.sin(a)]; };
      pos = P(t); fwd = vnorm(vsub(P(t + 0.05), pos));
      break;
    }
    case 'crawl': {
      // walks a slow loop over the floor, following its every bump
      const a = t * m.v / m.R + (m.ph || 0), x = A[0] + m.R * Math.cos(a), z = A[2] + m.R * Math.sin(a);
      pos = [x, floorY(x, z) + (m.h || 0), z];
      fwd = [-Math.sin(a), 0, Math.cos(a)];
      break;
    }
    case 'migrate': {
      // lanternfish: deep by day, near the surface by night
      const d = lerp(m.day, m.night, smooth(0.15, 0.85, night()));
      pos = [A[0], -d, A[2]];
      fwd = [1, 0, 0];
      // how fast it is climbing (m/s, + up): the fish point the way they swim
      if (o._lastD != null && o._lastT != null && t !== o._lastT) o.climb = lerp(o.climb || 0, (o._lastD - d) / (t - o._lastT), 0.1);
      o._lastD = d; o._lastT = t;
      break;
    }
    case 'still': default:
      fwd = dirYP(o.yaw, 0);
  }
  o.pos = pos; o.fwd = fwd || [1, 0, 0];
  const sd = vnorm(vcross(o.fwd, up));
  o.up = isFinite(sd[0]) ? vnorm(vcross(sd, o.fwd)) : [0, 1, 0];
  o.side = vcross(o.fwd, o.up);
  if (o.post) o.post(o, t);
}

// ---- drawing: everything within sight, solid things first, see-through things after (far to near)
const DRAWN = [];
function visRange() { return LIGHT.lamp > 0.5 ? 90 : 160; }
const DEBUG = { solo:null };
function drawWorld(trans) {
  if (!trans) {
    DRAWN.length = 0;
    const R = visRange();
    for (const o of OBJS) {
      if (o.hidden || (DEBUG.solo && o !== DEBUG.solo)) continue;
      const d = vlen(vsub(o.pos, CAM.pos)) - o.rad;
      o.camDist = d + o.rad;
      if (d > Math.max(R, CAM.scale * 4)) { o.vis = 0; continue; }
      // things far too small to see are skipped
      if (o.rad / Math.max(d, 1e-9) < 0.0015) { o.vis = 0; continue; }
      o.vis = 1; DRAWN.push(o);
    }
    for (const o of DRAWN) for (const p of o.parts) if (!p.trans) drawPart(o, p);
    for (const o of DRAWN) if (o.plume) drawPlume(o);
  } else {
    DRAWN.sort((a, b) => b.camDist - a.camDist);
    for (const o of DRAWN) for (const p of o.parts) if (p.trans) drawPart(o, p);
    drawSparks();
  }
}
const _it = {};
function drawPart(o, p) {
  if (p.show && !p.show(o)) return;
  if (!ensureMesh(p)) return;
  const f = p.fwd ? p.fwd(o) : o.fwd, u = p.up ? p.up(o) : o.up, sd = vcross(f, u);
  _it.pos = vadd(o.pos, vadd(vadd(vmul(o.fwd, p.off[0]), vmul(o.up, p.off[1])), vmul(o.side || sd, p.off[2])));
  _it.fwd = f; _it.up = u; _it.scale = p.scale;
  _it.mesh = p.mesh; _it.mat = p.mat; _it.tint = p.tint; _it.swim = p.swim; _it.swim2 = p.swim2; _it.sway = p.sway; _it.pulse = p.pulse; _it.school = p.school;
  _it.glowSun = p.glowSun;
  if (p.school && p.school[0] === 1 && o.climb != null) p.school[3] = clamp(Math.atan(o.climb * 40) * 0.9, -1.1, 1.1);
  _it.fx = o.fxDyn ? [(p.fx || ZA)[0], o.fxDyn[1], o.fxDyn[2], o.fxDyn[3]] : p.fx;
  _it.pred = p.school ? schoolPredators(o, p) : null;
  drawCreature(_it, p.school ? P_SCHOOL : P_MESH);
}

// ---- the catalogue. Depths and sizes are real; x runs offshore (the shore at 0, the Challenger Deep at 84.5 km), z along the coast.
const M_SOLID = [1, 0.25, 1, 0.35], M_SKIN = [1, 0.35, 1, 0.6], M_GLASS = [0.2, 0.9, 0.7, 0.6], M_JELLY = [0.3, 1.6, 1, 0.5], M_SILVER = [1, 0.8, 1, 1.4];
const FISH_SWIM = (amp, hz, k, pow) => ({ swim:[amp, hz, k ?? 0.9, 0], swim2:[0, pow ?? 2, 0, 0] });
const WHALE_SWIM = (amp, hz) => ({ swim:[amp, hz, 0.7, 0], swim2:[1, 2.5, 0, 0] });
const SIDE = [{ d:[0.15, 0.12, 1], k:2.0, hold:10, drift:0.025 }, { d:[1, 0.25, 0.6], k:2.4, hold:8, drift:0.03 }, { d:[-0.6, 0.5, 0.8], k:2.2, hold:8, drift:-0.03 }];

function buildCatalog() {
  // ---------------- the sunlight zone
  const REEF = [900, 0];
  addObj({ key:'surface', name:'the surface', type:'the ocean’s ceiling, seen from below', kind:'places', at:[4000, 34, 2], size:20, rad:8,
    fact:'From below, the whole sky is squeezed into one bright circle overhead, about 97° across: Snell’s window. Outside it the surface turns into a mirror that reflects the dark water underneath.',
    views:[{ d:[1, 0.42, 0.35], k:0.65, hold:11, drift:0.015, frame:'world', air:true }, { d:[1, -0.62, 0.35], k:0.3, hold:12, drift:0.015, frame:'world' }, { d:[1, -0.3, 0.2], k:0.7, hold:10, drift:0.02, frame:'world' }, { d:[0.3, -0.97, 0.1], k:1.0, hold:9, drift:0.015, frame:'world' }] });
  addObj({ key:'reef', name:'the coral reef', label:'coral reef', type:'a reef built by animals', kind:'places', floor:[REEF[0], REEF[1], 0], size:50, rad:28,
    fact:'Reefs cover less than one percent of the seafloor but shelter about a quarter of all marine species. Every coral head is a colony of tiny animals, fed by algae living inside them that turn sunlight into sugar.',
    parts:[part(() => buildReef(BYKEY.reef.anchor, 5), { mat:[1, 0.15, 1, 0.2], sway:[0.06, 0.9, 0.7, 0] })],
    views:[{ d:[0.4, 0.32, 1], k:0.15, hold:12, drift:0.03, frame:'world', off:[0, 0.8, 0] }, { d:[-0.8, 0.5, 0.5], k:0.15, hold:10, drift:0.03, frame:'world', off:[0, 0.6, 0] }, { d:[0.1, 0.55, 0.6], k:0.2, hold:9, drift:0.02, frame:'world' }] });
  addObj({ key:'clownfish', name:'clownfish', type:'orange clownfish · Amphiprion percula', kind:'fish', floor:[REEF[0], REEF[1], 0.95], size:0.11, rad:0.3,
    fact:'Clownfish live among the stinging tentacles of a sea anemone, protected by a coat of mucus. All are born male; when the female of a group dies, the largest male turns female.',
    motion:{ type:'circle', R:0.22, v:0.06, bob:0.05, bank:0.05 },
    parts:[part(mkClownfish, { scale:0.11, mat:M_SKIN, ...FISH_SWIM(0.07, 2.4, 1.0, 1.8) })],
    views:[{ d:[0.2, 0.15, 1], k:3.2, hold:10, drift:0.02 }, { d:[1, 0.5, 0.4], k:3.5, hold:8, drift:0.02, frame:'world' }, { d:[-0.5, 0.2, 0.9], k:2.5, hold:8, drift:0.02 }] });
  addObj({ key:'bluetang', vsize:6, name:'blue tangs', type:'a school of surgeonfish · Paracanthurus hepatus', kind:'fish', floor:[REEF[0] - 6, REEF[1] + 9, 2.5], size:0.25, rad:4,
    fact:'Tangs are called surgeonfish for the scalpel-sharp spine on each side of the tail. They graze algae off the reef, keeping it clear for corals to grow.',
    parts:[part(mkBlueTang, { inst:schoolMill(40, 3.2, 1.6, 21, 0.4), school:[0, 0.25, 1, 0], mat:M_SKIN, ...FISH_SWIM(0.06, 2.6, 0.9, 1.8) })],
    views:[{ d:[0.2, 0.2, 1], k:1.6, hold:10, drift:0.03, frame:'world' }, { d:[1, -0.2, 0.2], k:1.3, hold:8, drift:0.04, frame:'world' }] });
  addObj({ key:'anthias', name:'anthias', type:'a cloud of fairy basslets', kind:'fish', place:false, floor:[REEF[0] + 8, REEF[1] - 5, 2], size:0.1, rad:4,
    parts:[part(mkAnthias, { inst:schoolCloud(70, 3, 1.4, 22, 1, 0.3), school:[1, 0.1, 1, 0], mat:M_SKIN, ...FISH_SWIM(0.07, 3, 0.9, 1.8) })] });
  addObj({ key:'seahorse', name:'seahorse', type:'a fish that swims upright · Hippocampus', kind:'fish', floor:[REEF[0] + 3.5, REEF[1] + 2, 0.12], size:0.15, rad:0.12, yaw:2.2,
    fact:'Seahorses are fish that swim upright, fanning a tiny fin on their back. The male carries the eggs in a pouch and gives birth to as many as 2,000 young.',
    motion:{ type:'hover', amp:0.02, turn:0.5 },
    parts:[part(mkSeahorse, { scale:0.15, mat:M_SKIN, sway:[0.05, 1.2, 4, 0] })],
    views:[{ d:[0.3, 0.1, 1], k:3.5, hold:10, drift:0.02 }, { d:[1, 0.2, 0.1], k:3.2, hold:8, drift:0.02 }] });
  addObj({ key:'octopus', name:'octopus', type:'common octopus · Octopus vulgaris', kind:'cephs', floor:[REEF[0] - 4, REEF[1] - 3, 0.15], size:0.9, rad:0.6, yaw:1,
    fact:'Two thirds of an octopus’s neurons are in its arms, and each arm can taste what it touches. It can change colour and the texture of its skin in a fraction of a second.',
    motion:{ type:'hover', amp:0.05, turn:0.3 },
    // at rest it matches the reef (a dull sandy green); swim close or disturb it and it flushes dark red, then slowly fades back
    post:o => {
      // a squirt of ink, billowing out behind it and thinning as it spreads
      const ink = o.parts[1], age = o.reactT > 0 ? o.reactAge : 99;
      ink.inkOn = age < 6; ink.scale = 0.2 + Math.sqrt(Math.min(age, 6)) * 0.45; ink.mat[0] = 0.85 * smooth(6, 1.5, age); ink.off = [-0.45 - age * 0.18, 0.35 + age * 0.08, 0];
      const e = smooth(0, 1, o.reactEnv || 0); o.parts[0].tint = vlerp([0.95, 1.05, 0.95], [1.25, 0.55, 0.5], e).map((c, i) => lerp(c, [0.85, 1.25, 1.2][i], (1 - e) * 0.55)); },
    parts:[part(() => mkOctopus(), { scale:0.9, mat:M_SKIN, sway:[0.1, 0.8, 3, 0], pulse:[0.6, 0.25, 0, 0] }),
      part(() => mkInk(), { scale:0.5, mat:[0.8, 0, 0, 0], trans:true, show:o => o.parts[1].inkOn })],
    views:[{ d:[0.6, 0.6, 1], k:2.2, hold:10, drift:0.025 }, { d:[1, 0.25, -0.2], k:2.0, hold:8, drift:0.02 }] });
  addObj({ key:'turtle', name:'green sea turtle', type:'Chelonia mydas', kind:'air', floor:[REEF[0] + 60, REEF[1] - 40, 3], size:1.1, rad:0.8,
    fact:'Green turtles can rest underwater for hours on one breath. They graze seagrass and algae, and the females swim back across whole oceans to the beach where they hatched to lay their eggs.',
    motion:{ type:'circle', R:10, v:0.5, bob:0.8, bank:0.15 },
    parts:[part(mkTurtle, { scale:1.1, mat:M_SKIN, swim2:[0, 2, 0.22, 0.3] })], views:SIDE });
  addObj({ key:'hatchlings', name:'turtle hatchlings', type:'green turtles, a few days old', kind:'air', at:[1350, -60, 1.2], size:0.06, vsize:1.6, rad:6,
    fact:'Hatching at night, they dig out of the sand together and race for the sea, then swim nonstop for a day or more in a “frenzy” that carries them out to open water. Perhaps one in a thousand lives to grow up. The survivors return decades later to the beach where they hatched.',
    // a stream of them swimming offshore, wrapping round so the line never ends
    parts:[part(mkTurtle, { inst:schoolStream(40, 14, 1.2, 2026), school:[2, 0.06, 0.6, 14], mat:M_SKIN, shy:2, swim2:[0, 2, 0.22, 2.2] })],
    views:[{ d:[0.2, 0.3, 1], k:1.0, hold:10, drift:0.02, frame:'world' }, { d:[0.6, 0.15, 1], k:0.7, hold:9, drift:0.02, frame:'world' }] });
  addObj({ key:'manta', name:'manta ray', type:'reef manta · Mobula alfredi', kind:'sharks', at:[2900, -150, 13], size:4.5, rad:2.6,
    fact:'Mantas have one of the largest brains for their size of any fish, and come to cleaning stations on the reef to have small fish pick them clean. A reef manta’s wings span up to 5 m.',
    motion:{ type:'circle', R:22, v:1.0, bob:1.5, bank:0.25 },
    parts:[part(mkManta, { scale:4.5, mat:M_SKIN, swim2:[0, 2, 0.32, 0.2] }),
      ...[[0.1, -0.16, 0.18], [-0.25, -0.15, -0.15]].map((off, i) => part(mkRemora, { scale:0.45, off, up:o => vmul(o.up, -1), mat:M_SKIN, swim:[0.02, 1.5, 0.8, i], swim2:[0, 2, 0, 0] }))],
    views:[{ d:[0.3, -0.4, 1], k:2.4, hold:10, drift:0.02 }, { d:[0.2, 0.9, 0.4], k:2.2, hold:8, drift:0.02 }, { d:[1, -0.3, 0.2], k:2.6, hold:8, drift:0.02 }] });
  addObj({ key:'kelp', name:'the kelp forest', label:'kelp forest', type:'giant kelp · Macrocystis pyrifera', kind:'places', floor:[2600, 400, 0], size:60, rad:32,
    fact:'Giant kelp can grow 60 cm in a day, among the fastest of anything alive. Gas-filled floats hold its blades up to the light, and the forest shelters fish, seals and sea otters.',
    parts:[part(() => buildKelp(BYKEY.kelp.anchor, 8), { mat:[1, 1.1, 1, 0.3], sway:[1.1, 0.35, 0.08, 0] })],
    views:[{ d:[0.6, -0.45, 1], k:0.28, hold:12, drift:0.02, frame:'world', off:[0, 10, 0] }, { d:[0.2, -0.85, 0.4], k:0.22, hold:10, drift:0.02, frame:'world', off:[2, 8, 3] }, { d:[1, 0.05, 0.3], k:0.3, hold:9, drift:0.02, frame:'world', off:[0, 4, 0] }] });
  addObj({ key:'manowar', vsize:4, name:'Portuguese man o’ war', label:'man o’ war', type:'a siphonophore that sails · Physalia physalis', kind:'jellies', at:[4000, 40, 0.15], size:0.3, rad:4,
    fact:'Not one animal but a colony of specialised individuals. Its gas float sails before the wind, while venomous tentacles trail beneath it, usually about 10 m and sometimes 30 m long.',
    // it floats: the bladder rides half out of the water, drifting and turning slowly before the wind
    motion:{ type:'still', fn:(o, t) => { const A = o.anchor; o.pos = [A[0] + 0.4 * Math.sin(t * 0.05), -0.02 + 0.015 * Math.sin(t * 1.3), A[2] + 0.4 * Math.cos(t * 0.04)];
      o.fwd = dirYP(o.yaw + 0.5 * Math.sin(t * 0.03), 0.04 * Math.sin(t * 1.1)); o.up = [0, 1, 0]; o.side = vnorm(vcross(o.fwd, o.up)); } },
    parts:[part(mkManOWar, { scale:1, mat:[0.55, 1.2, 1, 0.8], trans:true, sway:[0.35, 0.5, 0.5, 0] })],
    views:[{ d:[0.7, 0.55, 1], k:0.3, hold:10, drift:0.02, frame:'world', off:[0, 0.05, 0], air:true }, { d:[1, -0.55, 0.4], k:0.75, hold:10, drift:0.02, frame:'world', off:[0, -0.6, 0] }, { d:[1, -0.1, 0.2], k:1.3, hold:9, drift:0.02, frame:'world', off:[0, -2.5, 0] }] });
  // a smack of moon jellies drifting under the surface (scenery)
  addObj({ key:'smack', name:'moon jellies', place:false, at:[4002.2, 34.9, 3.4], size:4, rad:5, motion:{ type:'drift', amp:0.25, tilt:0.15 },
    parts:[[0, 0, 0, 0.32], [1.6, 1.1, -0.9, 0.26], [-1.4, -0.8, 1.3, 0.3], [0.6, 2.2, 1.8, 0.22], [-2.1, 1.5, -1.6, 0.28], [2.4, -1.7, 0.9, 0.24]].map(([x, y, z, s], i) =>
      part(mkMoonJelly, { scale:s, off:[y, x, z], mat:M_JELLY, trans:true, pulse:[0.18, 0.5 + i * 0.04, i * 1.3, 0], sway:[0.04, 0.7, 6, i] })) });
  addObj({ key:'noctiluca', name:'sea sparkle', type:'a glowing single cell · Noctiluca scintillans', kind:'micro', at:[4100, 60, 1.2], size:0.0008, rad:0.0006,
    fact:'A single-celled plankter about a millimetre wide that flashes blue when disturbed. On some nights breaking waves and swimming fish light up with millions of them.',
    motion:{ type:'hover', amp:0.0002, turn:1 },
    parts:[part(mkNoctiluca, { scale:0.0008, mat:[0.4, 1.4, 1, 0.6], trans:true, sway:[0.04, 0.5, 2, 0] })], views:SIDE });
  addObj({ key:'moonjelly', name:'moon jellyfish', type:'Aurelia aurita', kind:'jellies', at:[5000, -200, 8], size:0.3, rad:0.3,
    fact:'Moon jellies have no brain, heart or bones and are about 95 percent water. The four rings seen through the bell are its reproductive organs.',
    motion:{ type:'drift', amp:0.2, tilt:0.3 },
    parts:[part(mkMoonJelly, { scale:0.3, mat:M_JELLY, trans:true, pulse:[0.18, 0.55, 0, 0], sway:[0.04, 0.7, 6, 0] })],
    views:[{ d:[0.25, 0.95, 0.2], k:2.4, hold:10, drift:0.03, frame:'world' }, { d:[0.2, 0.15, 1], k:2.6, hold:8, drift:0.03, frame:'world' }, { d:[0.2, -0.9, 0.3], k:2.6, hold:8, drift:0.03, frame:'world' }] });
  addObj({ key:'combjelly', name:'comb jelly', type:'a ctenophore · Beroe', kind:'jellies', at:[5200, 100, 20], size:0.1, rad:0.07,
    fact:'Comb jellies swim with eight rows of beating cilia. The running rainbows are not their own light: the combs split sunlight like a prism as they beat.',
    motion:{ type:'drift', amp:0.04, tilt:0.2 },
    parts:[part(mkCombJelly, { scale:0.1, mat:M_GLASS, trans:true, fx:[1, 0, 0, 0] })], views:SIDE });
  addObj({ key:'baitball', name:'sardine bait ball', label:'bait ball', type:'Pacific sardines · Sardinops sagax', kind:'fish', at:[6500, 300, 25], size:7, rad:6,
    fact:'Under attack, sardines pack into a tight spinning ball, each fish trying to reach the middle. Dolphins, sharks, sailfish and seabirds feed on it from every side.',
    parts:[part(mkSardine, { inst:schoolMill(1800, 3.6, 3, 11, 1.4), school:[0, 0.2, 1, 0], mat:M_SILVER, ...FISH_SWIM(0.08, 4, 0.9, 1.8) })],
    views:[{ d:[0.2, 0.15, 1], k:1.6, hold:10, drift:0.03, frame:'world' }, { d:[0.3, -0.8, 0.4], k:1.4, hold:8, drift:0.04, frame:'world' }, { d:[1, 0.1, 0], k:0.6, hold:8, drift:0.05, frame:'world' }] });
  addObj({ key:'sailfish', name:'sailfish', type:'Istiophorus platypterus', kind:'fish', at:[6500, 300, 22], size:3, rad:1.8,
    fact:'Sailfish raise their great dorsal fin to herd sardines, then slash through the ball with their bill. They can flash their skin from silver to striped blue in an instant.',
    motion:{ type:'circle', R:11, v:2.2, bob:2, bank:0.2, dir:-1, ph:1.2 },
    parts:[part(mkSailfish, { scale:3, mat:M_SILVER, ...FISH_SWIM(0.05, 1.6, 0.85, 2.4) })], views:SIDE });
  addObj({ key:'dolphin', vsize:3.6, name:'bottlenose dolphins', label:'dolphins', type:'Tursiops truncatus', kind:'air', at:[6560, 260, 12], size:3, rad:2,
    fact:'Dolphins rest one half of the brain at a time, and call one another by name: each has its own signature whistle that others copy to address it.',
    motion:{ type:'circle', R:14, v:3, bob:3, bank:0.3, ph:2.5 },
    parts:[part(mkDolphin, { scale:3, mat:M_SKIN, ...WHALE_SWIM(0.05, 1.3) }), part(mkDolphin, { scale:2.7, off:[-2.5, 1.2, 2.2], mat:M_SKIN, swim:[0.05, 1.4, 0.7, 1.7], swim2:[1, 2.5, 0, 0] }), part(mkDolphin, { scale:2.8, off:[-3.5, -0.8, -2.4], mat:M_SKIN, swim:[0.05, 1.35, 0.7, 3.1], swim2:[1, 2.5, 0, 0] })],
    views:[{ d:[0.1, 0.1, 1], k:2.8, hold:10, drift:0.02 }, { d:[-1, 0.3, 0.5], k:3.2, hold:8, drift:0.02 }] });
  addObj({ key:'whaleshark', name:'whale shark', type:'the largest fish · Rhincodon typus', kind:'sharks', at:[5500, 400, 15], size:12, rad:7,
    fact:'The largest fish alive, up to about 18 m long, eats some of the smallest food in the sea: plankton and fish eggs, sieved through a mouth more than a metre wide. Every whale shark’s pattern of spots is its own.',
    motion:{ type:'circle', R:60, v:1.1, bob:3, bank:0.06 },
    // remoras ride underneath, held by the sucking discs on their heads (upside down against the belly, so their discs are on it)
    parts:[part(mkWhaleShark, { scale:12, mat:M_SKIN, ...FISH_SWIM(0.045, 0.32, 0.8, 2.4) }),
      ...[[1.8, -0.75, 0.25], [0.6, -0.95, -0.2], [-0.8, -0.8, 0.35]].map((off, i) => part(mkRemora, { scale:0.55 - i * 0.05, off, up:o => vmul(o.up, -1), mat:M_SKIN, swim:[0.02, 1.5, 0.8, i], swim2:[0, 2, 0, 0] }))], views:SIDE });
  addObj({ key:'greatwhite', name:'great white shark', type:'Carcharodon carcharias', kind:'sharks', at:[7000, -300, 30], size:4.5, rad:2.8,
    fact:'Great whites sense the faint electric fields of living animals through jelly-filled pores on the snout, and keep their muscles warmer than the water around them.',
    motion:{ type:'circle', R:25, v:1.4, bob:3, bank:0.12 },
    parts:[part(mkGreatWhite, { scale:4.5, mat:M_SKIN, ...FISH_SWIM(0.05, 0.6, 0.85, 2.4) })], views:SIDE });
  addObj({ key:'hammerheads', vsize:40, name:'hammerhead school', label:'hammerheads', type:'scalloped hammerheads · Sphyrna lewini', kind:'sharks', at:[8000, 200, 60], size:3, rad:25,
    fact:'By day scalloped hammerheads gather in schools of hundreds around seamounts, then hunt alone at night. The wide head spaces their eyes and electrical sensors far apart.',
    parts:[part(mkHammerhead, { inst:schoolMill(60, 13, 7, 31, 1.2), school:[0, 3, 1, 0], mat:M_SKIN, ...FISH_SWIM(0.05, 0.7, 0.85, 2.4) })],
    views:[{ d:[0.2, 0.05, 1], k:0.75, hold:12, drift:0.02, frame:'world' }, { d:[0.2, -0.8, 0.4], k:0.7, hold:9, drift:0.02, frame:'world' }, { d:[1, 0.1, 0.2], k:0.3, hold:9, drift:0.03, frame:'world', off:[0, 0, 13] }] });
  addObj({ key:'sunfish', vsize:3.4, name:'ocean sunfish', type:'Mola mola', kind:'fish', at:[9000, -100, 35], size:2.2, rad:1.6,
    fact:'The heaviest bony fish, up to about two tonnes. It hatches from an egg smaller than a millimetre and can gain some 60 million times its weight as it grows.',
    motion:{ type:'circle', R:12, v:0.4, bob:2, bank:0.05 },
    parts:[part(mkSunfish, { scale:2.2, mat:M_SKIN, swim:[0.015, 0.25, 0.4, 0], swim2:[0, 3, 0, 0] })], views:SIDE });
  addObj({ key:'humpback', name:'humpback whale', type:'Megaptera novaeangliae', kind:'air', at:[9500, 500, 25], size:15, rad:9,
    fact:'Male humpbacks sing songs that last up to about 20 minutes and repeat them for hours. All the males of a population sing the same song, and it changes from year to year.',
    motion:{ type:'circle', R:90, v:1.8, bob:4, bank:0.12 },
    parts:[part(mkHumpback, { scale:15, mat:M_SKIN, ...WHALE_SWIM(0.04, 0.22) })],
    views:[{ d:[0.3, -0.45, 1], k:1.3, hold:12, drift:0.015 }, { d:[0.2, 0.05, 1], k:1.4, hold:9, drift:0.015 }, { d:[-1, 0.3, 0.6], k:1.6, hold:9, drift:0.02 }, { d:[0.3, 0.12, 1], k:2.2, hold:12, drift:0.01, frame:'world', air:true }] });
  addObj({ key:'bubblenet', name:'bubble-net feeding', label:'bubble net', type:'humpbacks hunting together', kind:'air', at:[8800, -1100, 12], size:13, vsize:22, rad:24,
    fact:'A few humpbacks circle beneath a school of herring, blowing a spiral curtain of bubbles that the fish will not swim through. As the net closes they dive below it and lunge up through the middle together, mouths open, swallowing tonnes of water and fish. One whale often gives a loud feeding call just before they rise.',
    motion:{ type:'still', fn:bubbleNetPost },
    parts:[part(mkSardine, { inst:schoolMill(500, 3.2, 2.5, 444, 1.2), school:[0, 0.25, 1, 0], herring:true, show:o => o.bnU < 0.72 || o.bnU > 0.97, mat:M_SILVER, shy:6, ...FISH_SWIM(0.08, 4, 0.9, 1.8) }),
      ...[0, 1, 2].map(i => part(mkHumpback, { scale:13 - i, whale:true, fwd:function () { return this._f || [1, 0, 0]; }, up:function () { return this._u || [0, 1, 0]; }, mat:M_SKIN, ...WHALE_SWIM(0.035, 0.25 + i * 0.03) }))],
    views:[{ d:[1, 0.05, 0.3], k:2.1, hold:16, drift:0.008, frame:'world' }, { d:[0.5, -0.45, 0.8], k:1.9, hold:14, drift:0.008, frame:'world', off:[0, -2, 0] }] });
  addObj({ key:'spinners', name:'spinner dolphins', type:'Stenella longirostris', kind:'air', at:[6200, -400, 2], size:1.9, vsize:9, rad:10,
    fact:'They leap clear of the water and spin on their long axis, up to seven times in one leap, before crashing back. Nobody is sure why: to shake off remoras, to signal to the pod in the noise of the open sea, or simply because they can. They rest by day in sheltered bays and hunt at night.',
    motion:{ type:'still', fn:spinnerPost },
    parts:[0, 1, 2, 3, 4].map(i => part(mkDolphin, { scale:1.9 - (i % 2) * 0.2, fwd:function () { return this._f || [1, 0, 0]; }, up:function () { return this._u || [0, 1, 0]; }, mat:M_SKIN, ...WHALE_SWIM(0.05, 1.2 + i * 0.1) })),
    views:[{ d:[0.3, 0.1, 1], k:1.5, hold:14, drift:0.01, frame:'world', air:true, off:[0, 2.5, 0] }, { d:[0.4, -0.2, 1], k:1.4, hold:12, drift:0.01, frame:'world', off:[0, -1.5, 0] }] });
  addObj({ key:'sleepingwhales', name:'sleeping sperm whales', label:'sleeping whales', type:'a family of Physeter macrocephalus, napping upright', kind:'air', at:[11800, 600, 14], size:12, vsize:18, rad:14,
    fact:'Sperm whales sleep in short naps of a few minutes, hanging motionless and upright just below the surface, heads up, often a whole family together. They were only discovered doing this in 2008, when a research boat drifted into a sleeping group that did not wake.',
    // hanging upright, swaying very slightly; every so often the family stirs
    motion:{ type:'still', fn:(o, t) => { const A = o.anchor; o.pos = [A[0], A[1] + 0.3 * Math.sin(t * 0.07), A[2]]; o.fwd = [1, 0, 0]; o.up = [0, 1, 0]; o.side = [0, 0, 1]; } },
    parts:[[0, 0, 0, 12], [4.5, -1.5, 3, 11], [-4, -0.8, 4.2, 10.5], [2, -3, -4.5, 9.5], [-3.5, 1, -3.5, 6]].map(([x, y, z, sc], i) =>
      part(mkSpermWhale, { scale:sc, off:[x, y, z], fwd:() => vnorm([0.06 * Math.sin(i * 2), 1, 0.05 * Math.cos(i * 3)]), up:() => vnorm([Math.cos(i * 1.7), 0, Math.sin(i * 1.7)]),
        mat:M_SKIN, swim:[0.004, 0.05, 0.7, i], swim2:[1, 2.5, 0, 0] })),
    views:[{ d:[0.4, -0.2, 1], k:1.6, hold:14, drift:0.01, frame:'world' }, { d:[1, -0.05, 0.3], k:1.2, hold:12, drift:0.01, frame:'world', off:[0, -2, 0] }, { d:[0.2, -0.95, 0.3], k:1.5, hold:10, drift:0.01, frame:'world' }] });
  addObj({ key:'bluewhale', name:'blue whale', type:'the largest animal ever known · Balaenoptera musculus', kind:'air', at:[10500, -400, 60], size:25, rad:15,
    fact:'The largest animal ever known: up to about 30 m long and 190 tonnes. Its heart weighs about 180 kg, and its calls, too low for us to hear, carry for hundreds of kilometres.',
    motion:{ type:'circle', R:150, v:2.2, bob:5, bank:0.06 },
    parts:[part(mkBlueWhale, { scale:25, mat:M_SKIN, ...WHALE_SWIM(0.035, 0.15) })],
    views:[{ d:[0.15, 0.05, 1], k:1.8, hold:12, drift:0.012 }, { d:[1, 0.2, 0.5], k:1.5, hold:9, drift:0.02 }, { d:[-0.5, -0.5, 0.8], k:1.6, hold:9, drift:0.02 }] });
  addObj({ key:'copepod', name:'copepod', type:'Calanus finmarchicus · 2 mm', kind:'micro', at:[6000, 0, 40], size:0.003, rad:0.002,
    fact:'Copepods may be the most numerous animals on Earth. This one is about 2 mm long, stores an orange drop of oil to last the winter, and can leap hundreds of body lengths a second to escape.',
    motion:{ type:'hover', amp:0.0006, turn:0.8, pitch:0.1 },
    parts:[part(mkCopepod, { scale:0.003, mat:[0.35, 0.9, 1, 0.6], trans:true, sway:[0.012, 3, 4, 0] })],
    views:[{ d:[0.1, 0.35, 1], k:2.0, hold:10, drift:0.03 }, { d:[1, 0.3, 0.3], k:2.2, hold:8, drift:0.03 }, { d:[0.2, 1, 0.1], k:2.0, hold:8, drift:0.03 }] });
  addObj({ key:'diatoms', name:'diatoms', type:'algae in houses of glass · 0.1 mm', kind:'micro', at:[6000, 20, 15], size:0.0002, rad:0.00016,
    fact:'Diatoms are single-celled algae that build their walls from glass. Drifting in sunlit water, they produce roughly a fifth of all the oxygen made on Earth each year.',
    motion:{ type:'hover', amp:0.00002, turn:0.6 },
    parts:[part(mkDiatoms, { scale:0.0001, mat:M_GLASS, trans:true })],
    views:[{ d:[0.6, 0.4, 1], k:1.7, hold:10, drift:0.04 }, { d:[1, 0.1, 0.1], k:1.6, hold:8, drift:0.04 }] });
  addObj({ key:'penguin', name:'Adélie penguins', type:'Pygoscelis adeliae', kind:'air', at:[10001, 200, 29], size:0.7, vsize:2, rad:2.5, predator:true,
    fact:'Penguins fly underwater: the wing has become a stiff flipper, beaten up and down like a bird’s in the air. Adélies dive to around 50 m, sometimes 180 m, to snap up krill, and can eat about 2 kg of them in a day.',
    motion:{ type:'eight', R:4, v:2.2, bob:2.5, bank:0.5 },
    parts:[0, 1, 2].map(i => part(mkPenguin, { scale:0.7 - i * 0.04, off:[[0, 0, 0], [-0.9, 0.4, 0.6], [-1.4, -0.3, -0.5]][i], mat:[1, 0.4, 1, 0.8], swim:[0.02, 2.5 + i * 0.2, 0.6, i * 2], swim2:[1, 2, 0.06, 2.6 + i * 0.3] })),
    views:[{ d:[0.2, 0.1, 1], k:1.6, hold:10, drift:0.02 }, { d:[0.8, -0.4, 0.6], k:1.5, hold:9, drift:0.02 }] });
  addObj({ key:'radiolarian', name:'radiolarian', type:'a single cell in a glass skeleton · 0.2 mm', kind:'micro', at:[8500, 0, 100], size:0.0002, rad:0.00015,
    fact:'One cell inside a glass lattice, its spines spreading to catch food and slow its sinking. When radiolarians die their skeletons settle into ooze that covers parts of the deep floor.',
    motion:{ type:'hover', amp:0.00002, turn:1 },
    parts:[part(mkRadiolarian, { scale:0.0002, mat:M_GLASS, trans:true })], views:SIDE });
  addObj({ key:'prochlorococcus', name:'Prochlorococcus', type:'the smallest photosynthesiser · 0.6 µm', kind:'micro', at:[9000, 50, 80], size:0.000006, rad:0.000005,
    fact:'The smallest and most abundant photosynthetic life: each cell is under a thousandth of a millimetre, and there are some 3 octillion of them. The pale crescents beside them are SAR11, perhaps the most numerous living thing on Earth.',
    motion:{ type:'hover', amp:0.0000005, turn:0.6 },
    parts:[part(mkProchloro, { scale:0.000001, mat:[0.7, 1.2, 1, 0.6], trans:true })],
    views:[{ d:[0.4, 0.4, 1], k:1.2, hold:10, drift:0.03 }, { d:[1, -0.2, 0.3], k:0.9, hold:8, drift:0.04 }] });
  addObj({ key:'krill', vsize:5, name:'krill swarm', label:'krill', type:'Antarctic krill · Euphausia superba', kind:'micro', at:[10000, 200, 30], size:0.05, rad:3,
    fact:'Krill gather in swarms so dense they tint the sea, the largest weighing millions of tonnes. Together the world’s Antarctic krill may weigh as much as all the people on Earth.',
    parts:[part(mkKrill, { inst:schoolCloud(900, 1.6, 1.0, 41, 1, 0.08), school:[1, 0.05, 1.5, 0], mat:[0.85, 0.9, 1.6, 0.7], shy:3, sway:[0.01, 4, 30, 0] })],
    views:[{ d:[0.2, 0.2, 1], k:0.75, hold:10, drift:0.03, frame:'world' }, { d:[0.5, 0.1, 0.3], k:0.09, hold:9, drift:0.03, frame:'world' }] });

  // ---------------- the twilight zone
  addObj({ key:'lanternfish', vsize:10, name:'lanternfish', type:'myctophids · the nightly migrators', kind:'fish', at:[14500, 0, 450], size:0.07, rad:5,
    fact:'Lanternfish may be the most common vertebrates on Earth. Each night they rise hundreds of metres to feed near the surface and sink before dawn: the largest migration on the planet, every day.',
    motion:{ type:'migrate', day:450, night:60 },
    parts:[part(mkLanternfish, { inst:schoolCloud(800, 4, 2.4, 51, 1, 0.3), school:[1, 0.07, 1, 0], mat:M_SKIN, ...FISH_SWIM(0.06, 3, 0.9, 1.8) })],
    views:[{ d:[0.2, 0.1, 1], k:0.75, hold:10, drift:0.03, frame:'world' }, { d:[0.6, 0.1, 0.4], k:0.25, hold:9, drift:0.03, frame:'world' }],
    readout:() => night() > 0.5 ? 'night: risen to feed near the surface' : 'day: hiding in the twilight' });
  addObj({ key:'hatchetfish', vsize:2.4, name:'hatchetfish', type:'Argyropelecus · silver hatchetfish', kind:'fish', at:[15000, -200, 600], size:0.06, rad:2,
    fact:'Lights along its belly match the faint glow from above, erasing its silhouette for hunters looking up: counter-illumination. Its tubular eyes look straight up.',
    parts:[part(mkHatchetfish, { inst:schoolCloud(40, 1.1, 0.8, 61, 1, 0.1), school:[1, 0.06, 1, 0], shy:4, mat:M_SILVER, ...FISH_SWIM(0.05, 2.5, 0.9, 2) })],
    views:[{ d:[0.2, 0.1, 1], k:0.8, hold:10, drift:0.03, frame:'world' }, { d:[0.4, -0.3, 0.6], k:0.3, hold:9, drift:0.03, frame:'world' }] });
  addObj({ key:'siphonophore', vsize:9, name:'giant siphonophore', label:'siphonophore', type:'a colony longer than a blue whale · Apolemia', kind:'jellies', at:[16000, 300, 700], size:40, rad:22,
    fact:'One colony of thousands of linked bodies, each specialised to swim, sting, feed or breed. Some grow longer than a blue whale: a coiled one about 45 m long was found in 2020.',
    motion:{ type:'hover', amp:1.5, turn:0.15 },
    parts:[part(mkSiphonophore, { scale:40, mat:[0.6, 1.2, 1, 0.5], trans:true, sway:[1.2, 0.2, 0.15, 0] })],
    views:[{ d:[0.3, 0.75, 0.6], k:1.6, hold:12, drift:0.02, frame:'world' }, { d:[1, 0.25, 0.15], k:0.35, hold:10, drift:0.03, frame:'world', off:[3.8, 0, 0] }, { d:[0.2, 0.15, 1], k:1.3, hold:9, drift:0.02, frame:'world' }] });
  addObj({ key:'barreleye', name:'barreleye', type:'Macropinna microstoma', kind:'fish', at:[15500, 100, 700], size:0.15, rad:0.12,
    fact:'The green tubes in its see-through head are its eyes, looking up for the silhouettes of prey. They can swivel forward to watch as it eats. Its true shape was only seen alive in 2009.',
    motion:{ type:'hover', amp:0.03, turn:0.3 },
    parts:[part(mkBarreleye, { scale:0.15, mat:M_SKIN, ...FISH_SWIM(0.03, 0.8, 0.9, 2) }), part(mkBarreleyeDome, { scale:0.15, mat:M_GLASS, trans:true, ...FISH_SWIM(0.03, 0.8, 0.9, 2) })],
    views:[{ d:[0.15, 0.25, 1], k:1.5, hold:10, drift:0.02 }, { d:[0.8, 0.45, 0.5], k:1.4, hold:9, drift:0.02 }, { d:[1, 0.15, 0.6], k:1.7, hold:8, drift:0.02 }] });
  addObj({ key:'giantsquid', name:'giant squid', type:'Architeuthis dux', kind:'cephs', at:[17000, -300, 800], size:12, rad:7,
    fact:'Giant squid have eyes up to about 27 cm across, the largest of any animal alongside the colossal squid, perhaps to spot the glow stirred up by an approaching sperm whale. It was first filmed alive in its deep home in 2012.',
    motion:{ type:'circle', R:20, v:0.6, bob:2, bank:0.05 },
    parts:[part(() => mkSquid({ mantle:0.2, arms:0.2, tent:0.55, mw:0.045, eye:0.03, fin:0.05 }), { scale:12, mat:M_SKIN, pulse:[1, 0.35, 0, 0], sway:[0.25, 0.4, 0.5, 0], swim2:[0, 2, 0.25, 0.35] })],
    views:[{ d:[0.2, 0.15, 1], k:0.95, hold:11, drift:0.02, off:[1.5, 0, 0] }, { d:[-1, 0.2, 0.4], k:1.0, hold:9, drift:0.02 }, { d:[0.9, 0.1, 0.4], k:0.4, hold:8, drift:0.02, off:[2.5, 0, 0] }] });
  addObj({ key:'atolla', name:'Atolla jellyfish', label:'Atolla', type:'the alarm jellyfish · Atolla wyvillei', kind:'jellies', at:[16500, 200, 850], size:0.15, rad:0.25,
    fact:'When grabbed, Atolla sets off a spinning wheel of blue light. This burglar alarm may draw bigger hunters to eat whatever is attacking it.',
    motion:{ type:'drift', amp:0.08, tilt:0.2 },
    parts:[part(mkAtolla, { scale:0.15, mat:[0.7, 0.8, 1, 0.6], trans:true, pulse:[0.12, 0.45, 0, 0], sway:[0.04, 0.4, 4, 0] })],
    views:[{ d:[0.3, 0.25, 1], k:2.4, hold:10, drift:0.03, frame:'world' }, { d:[0.1, 1, 0.2], k:2.2, hold:8, drift:0.03, frame:'world' }] });
  addObj({ key:'vampsquid', name:'vampire squid', type:'Vampyroteuthis infernalis', kind:'cephs', at:[17500, 0, 900], size:0.3, rad:0.25,
    fact:'Neither vampire nor squid: it eats marine snow, not blood, and lives where the water holds almost no oxygen. Threatened, it pulls its webbed cloak inside out over its body.',
    motion:{ type:'hover', amp:0.06, turn:0.4 },
    parts:[part(mkVampireSquid, { scale:0.3, mat:M_SKIN, pulse:[0.25, 0.3, 0, 0], sway:[0.02, 0.5, 4, 0], swim2:[0, 2, 0.3, 0.4] })], views:SIDE });
  addObj({ key:'spermwhale', name:'sperm whale', type:'Physeter macrocephalus', kind:'air', at:[18000, 300, 1100], size:16, rad:10,
    fact:'The largest toothed predator dives past 1,000 m for an hour or more, hunting squid by echolocation in total darkness. Its clicks are the loudest sounds made by any animal.',
    motion:{ type:'circle', R:80, v:1.4, bob:6, bank:0.08 },
    parts:[part(mkSpermWhale, { scale:16, mat:M_SKIN, ...WHALE_SWIM(0.035, 0.18) })], views:SIDE });

  // ---------------- the midnight zone
  addObj({ key:'anglerfish', name:'anglerfish', type:'humpback anglerfish · Melanocetus johnsonii', kind:'fish', at:[19000, 0, 1600], size:0.18, rad:0.18,
    fact:'In the dark, the female fishes with a lure that glows with bacteria. In some anglerfish the tiny male bites onto a female and fuses to her for life.',
    motion:{ type:'hover', amp:0.02, turn:0.3 },
    parts:[part(mkAnglerfish, { scale:0.18, mat:M_SKIN, sway:[0.04, 0.6, 3, 0], swim:[0.02, 0.8, 0.5, 0], swim2:[0, 2, 0, 0] })],
    views:[{ d:[0.8, 0.15, 0.7], k:2.6, hold:10, drift:0.02 }, { d:[1, 0.3, 0.1], k:2.2, hold:8, drift:0.02 }, { d:[-0.3, 0.3, 1], k:2.8, hold:8, drift:0.02 }] });
  addObj({ key:'viperfish', name:'viperfish', type:'Sloane’s viperfish · Chauliodus sloani', kind:'fish', at:[19500, -100, 1500], size:0.3, rad:0.2,
    fact:'Its fangs are so long they do not fit inside its closed mouth. A lit lure on its back and rows of lights along its belly draw prey within reach.',
    motion:{ type:'hover', amp:0.05, turn:0.3 },
    parts:[part(mkViperfish, { scale:0.3, mat:M_SKIN, ...FISH_SWIM(0.04, 1.0, 1.0, 1.6) })], views:SIDE });
  addObj({ key:'gulper', name:'gulper eel', type:'pelican eel · Eurypharynx pelecanoides', kind:'fish', at:[20000, 100, 2000], size:0.75, rad:0.5,
    fact:'Its loosely hinged mouth opens wide enough to swallow prey much bigger than itself, though it mostly eats small shrimp. The tip of its whip-like tail glows pink.',
    motion:{ type:'circle', R:2, v:0.25, bob:0.3, bank:0.1 },
    parts:[part(mkGulperEel, { scale:0.75, mat:M_SKIN, ...FISH_SWIM(0.06, 0.5, 1.6, 1.2) })],
    views:[{ d:[0.15, 0.12, 1], k:1.5, hold:10, drift:0.025 }, { d:[1, 0.25, 0.6], k:1.7, hold:8, drift:0.03 }, { d:[0.4, 0.5, 0.8], k:1.4, hold:8, drift:-0.03 }] });
  addObj({ key:'beakedwhale', name:'Cuvier’s beaked whale', label:'beaked whale', type:'the deepest-diving mammal · Ziphius cavirostris', kind:'air', at:[23000, -500, 2100], size:6, rad:4,
    fact:'The deepest-diving mammal known: one dive reached 2,992 m, and another lasted 3 hours and 42 minutes on a single breath.',
    motion:{ type:'circle', R:40, v:1.5, bob:5, bank:0.08 },
    parts:[part(mkBeakedWhale, { scale:6, mat:M_SKIN, ...WHALE_SWIM(0.04, 0.35) })], views:SIDE });
  const VENTS = [21500, -300];
  addObj({ key:'vents', name:'hydrothermal vents', label:'black smokers', type:'black smokers on a mid-ocean ridge', kind:'places', floor:[VENTS[0], VENTS[1], 0], size:20, rad:14,
    fact:'Seawater heated to around 400 °C by magma gushes from chimneys of metal sulphides. Life here runs on chemical energy instead of sunlight: bacteria feed on hydrogen sulphide, and animals feed on them.',
    parts:[part(() => buildVents(BYKEY.vents.anchor, 13), { mat:[1, 0.2, 1, 0.3], sway:[0.05, 0.5, 2, 0] }),
      part(mkVentShrimp, { inst:ventShrimp(), school:[1, 0.05, 0.7, 0], mat:M_SKIN, ...FISH_SWIM(0.04, 3, 1, 1.6) })],
    plume:true,
    views:[{ d:[0.6, 0.25, 1], k:1.1, hold:12, drift:0.02, frame:'world', off:[0, 5, 0] }, { d:[0.2, 0.05, 1], k:0.5, hold:9, drift:0.02, frame:'world', off:[0, 9, 0] }, { d:[-1, 0.5, 0.3], k:0.9, hold:9, drift:0.02, frame:'world', off:[0, 3, 0] }] });
  addObj({ key:'tubeworms', vsize:3, name:'giant tube worms', label:'tube worms', type:'Riftia pachyptila', kind:'floor', floor:[VENTS[0] + 3, VENTS[1] + 2, 0.6], size:1.5, rad:3, place:true,
    fact:'Giant tube worms have no mouth and no gut. Bacteria living inside them make food from the vent’s chemicals; the red plumes are full of haemoglobin to gather sulphide and oxygen for them.',
    views:[{ d:[0.5, 0.3, 1], k:1.6, hold:10, drift:0.03, frame:'world' }, { d:[0.1, 0.9, 0.3], k:1.4, hold:8, drift:0.03, frame:'world' }] });
  addObj({ key:'whalefall', name:'whale fall', type:'a whale’s skeleton feeding the deep', kind:'places', floor:[25500, 500, 0], size:14, rad:9,
    fact:'When a whale dies and sinks, its body feeds the deep for decades: scavengers first, then bone-eating Osedax worms, then bacteria that live off the oils in the bones.',
    parts:[part(() => buildWhaleFall(BYKEY.whalefall.anchor, 17), { mat:[1, 0.2, 1, 0.3], sway:[0.02, 0.6, 5, 0] }),
      part(mkHagfish, { inst:schoolCloud(14, 5, 0.6, 71, 1, 0.8), school:[1, 0.5, 0.6, 0], off:[0, 0.6, 0], mat:M_SKIN, ...FISH_SWIM(0.08, 1.2, 1.5, 1.2) })],
    views:[{ d:[0.4, 0.32, 1], k:1.0, hold:12, drift:0.02, frame:'world' }, { d:[1, 0.3, 0.2], k:0.55, hold:9, drift:0.02, frame:'world', off:[5, 0, 0] }] });
  addObj({ key:'hagfish', name:'hagfish', type:'Eptatretus · the slime eels', kind:'fish', floor:[25500 + 2.5, 500 - 1.5, 0.35], size:0.5, rad:0.6,
    fact:'Jawless, nearly blind scavengers that burrow into carcasses and feed from the inside, absorbing food through their skin. Grabbed by a shark, a hagfish floods the shark’s mouth and gills with slime in a fraction of a second: a single fish can turn a bucket of water to jelly.',
    motion:{ type:'hover', amp:0.15, turn:0.6 },
    // the slime: a pale cloud thrown out all round, swelling and slowly settling
    post:o => { const sl = o.parts[o.parts.length - 1], age = o.reactT > 0 ? o.reactAge : 99;
      sl.slimeOn = age < 9; sl.scale = 0.1 + Math.sqrt(Math.min(age, 9)) * 0.17; sl.mat[0] = 0.28 * smooth(9, 3, age); sl.off = [0, 0.05 - age * 0.02, 0]; },
    parts:[[0, 0, 0, 0], [-0.2, 0.08, 0.18, 1.3], [0.15, -0.05, -0.2, 2.6]].map(([x, y, z, ph]) => part(mkHagfish, { scale:0.5, off:[x, y, z], mat:M_SKIN, swim:[0.12, 0.9, 1.6, ph], swim2:[0, 1.1, 0, 0] })).concat(
      [part(() => mkInk([0.55, 0.6, 0.55]), { scale:0.3, mat:[0.28, 0.6, 0, 0], trans:true, show:o => o.parts[o.parts.length - 1].slimeOn })]),
    views:[{ d:[0.3, 0.4, 1], k:2.0, hold:10, drift:0.02 }, { d:[1, 0.2, 0.3], k:1.8, hold:9, drift:0.02 }] });
  addObj({ key:'titanic', name:'the Titanic', label:'Titanic', type:'RMS Titanic · the bow section', kind:'places', floor:[28100, -400, 0], size:140, rad:75, yaw:-0.35, frame:'obj',
    fact:'The RMS Titanic sank on 15 April 1912. Her bow stands upright 3,800 m down, slowly eaten by iron-eating bacteria that hang from it in rusticles.',
    parts:[part(() => buildTitanic(BYKEY.titanic.anchor), { mat:[1, 0.15, 1, 0.25] })],
    views:[{ d:[1, 0.14, 0.95], k:0.3, hold:12, drift:0.012, off:[56, 4, 0] }, { d:[0.85, 0.5, 0.3], k:0.13, hold:10, drift:0.012, off:[52, 14, 0] }, { d:[0.3, 0.12, 1], k:0.38, hold:10, drift:0.008, off:[20, 6, 0] }] });
  addObj({ key:'dumbo', name:'dumbo octopus', type:'Grimpoteuthis', kind:'cephs', floor:[27000, 200, 2.5], size:0.25, rad:0.22,
    fact:'Dumbo octopuses live deeper than any other octopus, down to about 7,000 m, hovering over the floor by flapping their ear-like fins. They swallow their prey whole.',
    motion:{ type:'hover', amp:0.15, turn:0.5 },
    parts:[part(mkDumbo, { scale:0.25, mat:[0.9, 0.7, 1, 0.5], sway:[0.03, 0.5, 4, 0], pulse:[0.25, 0.3, 0, 0], swim2:[0, 2, 0.05, 0.6] })],
    views:[{ d:[0.6, 0.3, 1], k:2.6, hold:10, drift:0.025 }, { d:[1, 0.1, 0.2], k:2.3, hold:8, drift:0.025 }] });

  // ---------------- the abyss
  const ABYSS = [45000, 0];
  addObj({ key:'abyss', name:'the abyssal plain', label:'abyssal plain', type:'the flattest places on Earth', kind:'places', floor:[ABYSS[0], ABYSS[1], 0], size:30, rad:15,
    fact:'Abyssal plains are the flattest places on Earth, covered in fine ooze that settles a few millimetres every thousand years. The dark manganese nodules scattered on it grow a few millimetres every million years.',
    parts:[part(() => buildAbyss(BYKEY.abyss.anchor, 23), { mat:[0.95, 0.5, 1, 0.4], sway:[0.02, 0.4, 3, 0] })],
    views:[{ d:[0.5, 0.35, 1], k:0.9, hold:12, drift:0.02, frame:'world' }, { d:[1, 0.15, 0.3], k:0.35, hold:9, drift:0.02, frame:'world', off:[3, 0, 0] }] });
  addObj({ key:'casper', name:'ghost octopus', label:'“Casper”', type:'an undescribed incirrate octopus', kind:'cephs', floor:[ABYSS[0] - 4, ABYSS[1] + 3, 0.05], size:0.1, vsize:0.3, rad:0.1, yaw:0.8,
    fact:'Seen for the first time in 2016, sitting on a rock 4,290 m down off Hawaii: a small, ghostly white octopus with almost no pigment and no fins, nicknamed Casper. Females guard their eggs for years, laid on the stalks of dead sponges that grow only on metal-rich nodules.',
    motion:{ type:'hover', amp:0.005, turn:0.1 },
    parts:[part(() => mkOctopus({ skin:[0.95, 0.93, 0.92, 0.15], mott:[0.85, 0.82, 0.84, 0.1], pat:p => [0.95, 0.93, 0.92, 0.12] }), { scale:0.1, mat:[0.65, 1.1, 1, 0.4], trans:true, sway:[0.08, 0.5, 3, 0], pulse:[0.4, 0.2, 0, 0] })],
    views:[{ d:[0.5, 0.35, 1], k:2.0, hold:10, drift:0.02 }, { d:[1, 0.15, 0.3], k:1.8, hold:9, drift:0.02 }] });
  addObj({ key:'seapig', vsize:2.5, name:'sea pigs', type:'Scotoplanes · a sea cucumber', kind:'floor', floor:[ABYSS[0] + 3, ABYSS[1], 0.05], size:0.15, rad:1.6,
    motion:{ type:'crawl', R:5, v:0.012, h:0 },
    parts:[part(mkSeaPigHerd, { mat:[1, 0.5, 1, 0.4], sway:[0.012, 1.4, 25, 0] })],
    fact:'Sea pigs are sea cucumbers that walk on inflated tube feet, grazing the ooze in herds. They tend to face into the current, perhaps to smell fresh food falling from above.',
    views:[{ d:[1, 0.3, 0.6], k:2.0, hold:10, drift:0.02, frame:'world' }, { d:[0.9, 0.12, 0.1], k:0.9, hold:8, drift:0.02, frame:'world' }] });
  addObj({ key:'xeno', name:'xenophyophore', type:'a single cell the size of a fist', kind:'floor', floor:[ABYSS[0] - 1, ABYSS[1] + 8, 0.06], size:0.12, rad:0.1, place:true,
    parts:[part(() => mkXenophyophore(99), { scale:0.14, mat:[1, 0.3, 1, 0.2] })],
    fact:'A single cell up to about 20 cm across, among the largest cells known. It glues sediment grains into a fragile shell and lives from the abyss down into the trenches.',
    views:[{ d:[0.6, 0.6, 1], k:2.4, hold:10, drift:0.03, frame:'world' }] });
  addObj({ key:'tripodfish', name:'tripod fish', type:'Bathypterois grallator', kind:'fish', floor:[ABYSS[0] + 1000, ABYSS[1] + 300, 0.36], size:0.3, rad:0.4, yaw:0.3,
    fact:'It stands on three long fin rays, facing into the current, and waits for small crustaceans to drift into the feelers it holds out in front.',
    motion:{ type:'still' },
    parts:[part(mkTripodFish, { scale:0.3, mat:M_SKIN, sway:[0.01, 0.6, 20, 0] })], views:SIDE });
  addObj({ key:'grenadier', name:'grenadier', type:'a rattail · Coryphaenoides armatus', kind:'fish', floor:[ABYSS[0] + 600, ABYSS[1] - 400, 1.2], size:0.7, rad:0.5,
    fact:'Among the commonest fish of the deep floor. Rattails smell carrion from far away and are often the first to arrive at anything that sinks.',
    motion:{ type:'circle', R:4, v:0.25, bob:0.3, bank:0.05 },
    parts:[part(mkGrenadier, { scale:0.7, mat:M_SKIN, ...FISH_SWIM(0.07, 0.6, 1.3, 1.3) })], views:SIDE });

  // ---------------- the trenches
  addObj({ key:'trench', name:'the Mariana Trench', label:'Mariana Trench', type:'where one plate dives under another', kind:'places', floor:[77000, 0, 2], size:400, rad:150,
    parts:[part(() => { const A = BYKEY.trench.anchor, mb = buildHadal(A, 37), r = rng(41); for (let k = 0; k < 40; k++) { const dx = (r() - 0.5) * 36, dz = (r() - 0.5) * 36, sz = 0.3 + r() * 2.2; ellip(mb, [dx, groundAt(A, dx, dz) - sz * 0.3, dz], [sz, sz * 0.55, sz * 0.8], { n:6, m:9, shape:p => [p[0] + Math.sin(p[1] * 6) * sz * 0.08, p[1], p[2]], col:(u, v, p) => Math.sin(p[0] * 4 + p[2] * 3) > 0.4 ? [0.34, 0.3, 0.27] : [0.2, 0.19, 0.18] }); } return mb; }, { mat:[0.95, 0.4, 1, 0.3], sway:[0.02, 0.4, 3, 0] })],
    fact:'The trench forms where the Pacific plate dives beneath the Mariana plate. It runs about 2,550 km; Everest set on its floor would still be under more than 2 km of water.',
    views:[{ d:[-1, 0.55, 0.35], k:0.03, hold:12, drift:0.02, frame:'world', off:[0, 1, 0] }, { d:[0.4, 0.6, 1], k:0.025, hold:10, drift:0.02, frame:'world', off:[0, 1, 0] }] });
  addObj({ key:'snailfish', vsize:0.35, name:'Mariana snailfish', label:'snailfish', type:'Pseudoliparis swirei', kind:'fish', floor:[75200, 0, 0.6], size:0.11, rad:0.4,
    fact:'Among the deepest-living fish known, at home near 8,000 m. Its body is soft and jelly-like with little hard bone, built for a pressure some 800 times that at the surface.',
    motion:{ type:'hover', amp:0.06, turn:0.3 },
    // a few together, hovering over the trench wall where amphipods gather
    parts:[[0, 0, 0], [-0.12, 0.06, 0.1], [0.06, -0.05, -0.13]].map((off, i) => part(mkSnailfish, { scale:0.11 - i * 0.012, off, mat:[0.85, 0.8, 1, 0.5], swim:[0.07, 0.7 + i * 0.1, 1.2, i * 2], swim2:[0, 1.2, 0, 0] })),
    views:[{ d:[0.3, 0.15, 1], k:1.6, hold:10, drift:0.02 }, { d:[1, 0.2, 0.4], k:1.5, hold:9, drift:0.02 }] });
  const DEEP = [84500, 0];
  addObj({ key:'challenger', name:'the Challenger Deep', label:'Challenger Deep', type:'the deepest point of the ocean', kind:'places', floor:[DEEP[0], DEEP[1], 0], size:30, rad:14,
    fact:'The deepest known point of the ocean, about 10,935 m down in the Mariana Trench, at over 1,000 times the pressure at the surface. Jacques Piccard and Don Walsh first reached it in 1960 in the bathyscaphe Trieste.',
    parts:[part(() => buildHadal(BYKEY.challenger.anchor, 29), { mat:[0.95, 0.5, 1, 0.4], sway:[0.02, 0.4, 3, 0] })],
    views:[{ d:[0.5, 0.3, 1], k:1.0, hold:12, drift:0.02, frame:'world' }, { d:[1, 0.1, 0.4], k:0.35, hold:9, drift:0.02, frame:'world' }] });
  addObj({ key:'alicella', name:'supergiant amphipod', type:'Alicella gigantea', kind:'floor', floor:[71000, -40, 0.4], size:0.3, rad:0.3, yaw:1.1,
    fact:'Most amphipods are a few millimetres long, sand hoppers of the beach. This one, found at 4,000 to 7,000 m, reaches 34 cm: deep-sea gigantism, perhaps helped by cold water, slow lives and the need to travel far between rare meals. Baited traps in the trenches can fill with them.',
    motion:{ type:'hover', amp:0.1, turn:0.5 },
    parts:[part(mkAmphipod, { scale:0.3, mat:[0.85, 0.7, 1, 0.6], sway:[0.006, 3, 20, 0] })],
    views:[{ d:[0.4, 0.04, 1], k:1.6, hold:10, drift:0.02 }, { d:[1, 0.06, 0.3], k:1.5, hold:9, drift:0.02 }] });
  addObj({ key:'amphipods', vsize:1.2, name:'hadal amphipods', label:'amphipods', type:'Hirondellea gigas', kind:'floor', floor:[DEEP[0] + 2, DEEP[1] - 1.5, 0.25], size:0.04, rad:0.6,
    fact:'Hirondellea gigas lives on the floor of the Challenger Deep. It digests sunken wood with enzymes unknown in other animals, and armours its shell with a gel of aluminium against the pressure.',
    parts:[part(mkAmphipod, { inst:schoolCloud(60, 0.5, 0.15, 91, 1, 0.05), school:[1, 0.035, 1.2, 0], mat:[0.85, 0.7, 1, 0.6], sway:[0.006, 4, 40, 0] })],
    views:[{ d:[0.6, 0.4, 1], k:1.7, hold:10, drift:0.03, frame:'world' }, { d:[1, 0.15, 0.2], k:0.2, hold:9, drift:0.03, frame:'world' }] });
  addMoreFish(REEF);
  addDeepFolk(VENTS);
  addPlaces2();
  addShallows(REEF);
}

// vent shrimp: a cloud hugging the chimneys
function mkVentShrimp() { return mkKrill(); }
function ventShrimp() {
  const r = rng(61), d = new Float32Array(260 * 8);
  for (let k = 0; k < 260; k++) {
    const a = r() * TAU, h = r() * 8, rad = 1.3 - h * 0.08 + r() * 0.3;
    d.set([Math.cos(a) * rad, h + 0.5, Math.sin(a) * rad, a + PI / 2, r(), 0.06, 0.8 + r() * 0.4, 1.1 + (r() - 0.5) * 0.6], k * 8);
  }
  return d;
}

// the vents' smoke: dark particles boiling up from each chimney top
const PLUME_N = 900;
const VS_PLUME = GLSL_SCENE + `
uniform vec3 uOrigin;   // the chimney top, relative to the camera
uniform float uPx, uH;
layout(location = 0) in vec4 aSeed;
out float vA; out vec3 vRel; out float vW; out float vAge;
void main(){
  float t = uKd.w;
  float age = fract(t * 0.05 * (0.8 + aSeed.w * 0.4) + aSeed.x);
  float ang = aSeed.y * 6.2831 + age * 3.0;
  float r = 0.15 + age * age * uH * 0.35 * (0.6 + aSeed.z * 0.6);
  vec3 p = uOrigin + vec3(cos(ang) * r, age * uH + sin(t * 0.7 + aSeed.x * 20.0) * 0.2 * age, sin(ang) * r);
  vRel = p; vAge = age;
  vA = smoothstep(0.0, 0.08, age) * (1.0 - smoothstep(0.55, 1.0, age));
  gl_Position = uVP * vec4(p, 1.0); vW = gl_Position.w;
  gl_PointSize = clamp(uPx * (0.25 + age * 1.6) / max(gl_Position.w, 1e-6), 1.0, 40.0);
}`;
const FS_PLUME = GLSL_SCENE + GLSL_LIGHT + `
in float vA; in vec3 vRel; in float vW; in float vAge;
out vec4 o;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0; float d = dot(q, q); if (d > 1.0) discard;
  float depth = -(uCam.y + vRel.y);
  vec3 Ld; vec3 lamp = lampAt(vRel, vec3(0.0, 1.0, 0.0), Ld);
  vec3 c = vec3(0.1, 0.1, 0.1) * (lamp + sunAt(depth));
  float a = vA * (1.0 - d) * 0.25;
  c = fogMix(c, vRel);
  o = vec4(c * a, a);
  gl_FragDepth = clamp(vW * uMisc.y, 0.0, 1.0);
}`;
const P_PLUME = program(VS_PLUME, FS_PLUME, 'plume');
let PLUME_VAO = null;
function drawPlume(o) {
  const p = o.parts[0]; if (!p.tops) return;
  const u = sceneProg(P_PLUME); if (!u) return;
  if (!PLUME_VAO) {
    const r = rng(5), d = new Float32Array(PLUME_N * 4); for (let i = 0; i < d.length; i++) d[i] = r();
    PLUME_VAO = gl.createVertexArray(); gl.bindVertexArray(PLUME_VAO);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);
  }
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  gl.uniform1f(u.uPx, ASCII.rows * SY / Math.tan(CAM.fov / 2) * 0.5);
  gl.bindVertexArray(PLUME_VAO);
  p.tops.forEach((t, i) => {
    gl.uniform3fv(u.uOrigin, vsub(vadd(o.pos, t), CAM.pos));
    gl.uniform1f(u.uH, 6 + i * 2);
    gl.drawArrays(gl.POINTS, Math.floor(i * PLUME_N / p.tops.length), Math.floor(PLUME_N / p.tops.length));
  });
  gl.depthMask(true); gl.disable(gl.BLEND);
}
