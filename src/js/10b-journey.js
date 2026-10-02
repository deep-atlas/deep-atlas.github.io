// ---- the size journey: one continuous zoom from the largest animal ever known down to a single cell. Every animal is drawn
// at its true size, each one set beside the last, so you always see what you came from as you shrink towards the next.

const JOURNEY = { on:false, items:[], i:0, t:0, paused:false, stage:[8600, -14, 2600] };
const JOURNEY_KEYS = ['bluewhale', 'whaleshark', 'greatwhite', 'dolphin', 'diver', 'octopus', 'lionfish', 'clownfish', 'krill', 'copepod', 'noctiluca', 'radiolarian', 'diatoms', 'prochlorococcus'];
const J_HOLD = 4.5, J_MOVE = 4;
// how each is named and measured on the way: one animal, not a school, and a single cell where the model shows a few
const J_AS = { dolphin:{ name:'a bottlenose dolphin', size:3 }, krill:{ name:'an Antarctic krill', size:0.05 }, diatoms:{ name:'a diatom', size:0.0001, frame:0.00018 },
  prochlorococcus:{ name:'a Prochlorococcus cell', size:0.0000006, frame:0.000006 }, lionfish:{ name:'a lionfish' }, copepod:{ name:'a copepod' } };

function journeyItems() {
  const list = [];
  for (const k of JOURNEY_KEYS) {
    if (k === 'diver') { list.push({ name:'a scuba diver', type:'for scale', size:1.8, frame:1.8, fact:'A diver for scale: about 1.8 m from head to fins.', part:{ build:mkDiver, scale:1, mat:M_SKIN, off:[0, 0, 0] }, src:null }); continue; }
    const o = BYKEY[k]; if (!o || !o.parts.length) continue;
    const p0 = o.parts[0], as = J_AS[k] || {};
    // (schools and pods are shown as a single animal; everything else exactly as in the atlas)
    const p = Object.assign({}, p0, { off:[0, 0, 0], school:null, inst:null, mesh:p0.inst ? null : p0.mesh, scale:p0.inst ? p0.school[1] : (k === 'dolphin' ? 3 : p0.scale) });
    const size = as.size || (p0.inst ? p0.school[1] : o.size);
    list.push({ name:as.name || o.name, type:o.type, size, frame:as.frame || size, fact:o.fact, part:p, src:o });
  }
  // lay them out in a row: each one just beyond the last, at the same depth
  let x = 0;
  list.forEach((it, i) => {
    if (i) x += list[i - 1].frame * 0.55 + it.frame * 0.65;
    it.local = [x, 0, 0];
  });
  return list;
}
function startJourney() {
  endJourney(true); endCompare(); stopRide(true); leaveTour(); openPanel(null);
  JOURNEY.items = journeyItems();
  JOURNEY.items.forEach((it, n) => {
    const pos = vadd(JOURNEY.stage, it.local);
    const o = { key:'j' + n, name:it.name, label:it.name, type:it.type, fact:it.fact, kind:'subs', size:it.size, rad:it.frame * 0.7, place:false, temp:true, hidden:false,
      anchor:pos, pos:pos.slice(), fwd:[1, 0, 0], up:[0, 1, 0], side:[0, 0, 1], parts:[it.part], views:[], motion:{ type:'still', fn:me => { me.pos = pos.slice(); me.fwd = [1, 0, 0]; me.up = [0, 1, 0]; me.side = [0, 0, 1]; } } };
    o.idx = OBJS.length; OBJS.push(o); it.obj = o;
  });
  JOURNEY.on = true; JOURNEY.i = 0; JOURNEY.t = 0; JOURNEY.paused = false;
  VIEW.mode = 'journey'; VIEW.flight = null; VIEW.focus = JOURNEY.items[0].obj;
  renderInfo(); updatePlay(); journeyCaption();
  toast('from a whale to a microbe · space pauses · [ ] step · esc ends', 4500);
}
function endJourney(quiet) {
  if (!JOURNEY.on) return;
  const cur = JOURNEY.items[JOURNEY.i];
  for (const it of JOURNEY.items) { const k = OBJS.indexOf(it.obj); if (k >= 0) OBJS.splice(k, 1); }
  JOURNEY.on = false; $('caption').hidden = true;
  if (!quiet) userGo((cur && cur.src) || BYKEY.reef);
}
function journeyStep(dir) {
  const n = JOURNEY.items.length;
  JOURNEY.i = clamp(JOURNEY.i + dir, 0, n - 1); JOURNEY.t = 0;
  VIEW.focus = JOURNEY.items[JOURNEY.i].obj; renderInfo(); journeyCaption();
}
function journeyCaption() {
  const L = JOURNEY.items, it = L[JOURNEY.i], prev = L[JOURNEY.i - 1];
  let s = `${JOURNEY.i + 1} / ${L.length} · ${it.name}, ${fmtLen(it.size)}`;
  if (prev) { const r = prev.size / it.size; s += r >= 1.3 ? ` · ${r >= 10 ? fmtInt(r) : r.toFixed(1)} times smaller than ${/^an? /.test(prev.name) ? prev.name.replace(/^an? /, 'the ') : 'the ' + prev.name}` : ''; }
  if (JOURNEY.i > 1) { const r = L[0].size / it.size; if (r >= 100) s += ` · ${fmtInt(r)} of them laid end to end make one blue whale`; }
  $('caption').hidden = false; $('capBtn').hidden = false; $('capBtn').textContent = 'end journey';
  $('capText').textContent = s;
}
const jDist = it => it.frame * (it.frame > 5 ? 1.05 : 1.5) * portraitK();
function updateJourney(dt) {
  const L = JOURNEY.items; if (!L.length) return;
  if (!JOURNEY.paused && VIEW.manualT > 3) JOURNEY.t += dt;
  const hold = J_HOLD * DWELL[SET.dwell], move = J_MOVE * ({ slow:1.5, quick:1, warp:0.5 }[SET.travel] || 1);
  if (JOURNEY.t > hold + move) {
    if (JOURNEY.i < L.length - 1) { JOURNEY.i++; JOURNEY.t = 0; VIEW.focus = L[JOURNEY.i].obj; renderInfo(); journeyCaption(); }
    else JOURNEY.t = hold + move;
  }
  const a = L[JOURNEY.i], b = L[Math.min(JOURNEY.i + 1, L.length - 1)];
  const s = ease(clamp((JOURNEY.t - hold) / move, 0, 1));
  const tgt = vadd(JOURNEY.stage, vlerp(a.local, b.local, s));
  const dist = Math.exp(lerp(Math.log(jDist(a)), Math.log(jDist(b)), s));
  // a slow drift round the animal, and the drag the user gives it
  JOURNEY.yaw = (JOURNEY.yaw ?? 1.15) + dt * 0.02;
  const dir = dirYP(JOURNEY.yaw, JOURNEY.pitch ?? 0.14);
  CAM.pos = vmad(tgt, dir, dist);
  setBasis(vsub(tgt, CAM.pos));
  CAM.scale = dist;
}
