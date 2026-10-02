// ---- the camera: orbiting what you are locked on, flying between places, or swimming freely

const VIEW = {
  mode:'orbit',            // orbit | flight | free
  focus:null,              // the object locked on
  yaw:0, pitch:0.2, dist:5, off:[0, 0, 0],   // orbit, in the view's frame
  frame:'obj', fyaw:0,     // object views turn with the animal's (smoothed) heading
  vi:0, vt:0, trans:null,  // the angle loop: which view, how long in it, a move between two
  auto:true,               // false while paused
  flight:null,
  free:{ yaw:0, pitch:0 },
  last:null,               // the object let go of (free camera)
  manualT:0,               // seconds since the user last turned the view
};
const vsizeOf = o => o.vsize || o.size;
const KEYS = new Set();

function frameYaw(o) {
  const f = o.fwd, h = Math.hypot(f[0], f[2]);
  return h > 0.2 ? Math.atan2(f[2], f[0]) : (o._fy ?? 0);
}
// on a tall narrow screen (a phone held upright) the view is framed by its width: pull back so the subject still fits
function portraitK() { const a = innerWidth / Math.max(innerHeight, 1); return a < 1 ? Math.pow(1.15 / a, 0.85) : 1; }
// the orbit parameters a view asks for
function viewParams(o, v) {
  const frame = v.frame || o.frame || 'obj';
  const d = vnorm(v.d);
  return { yaw:yawOf(d), pitch:pitchOf(d), dist:v.k * vsizeOf(o) * portraitK(), off:v.off || [0, 0, 0], frame, air:!!v.air };
}
function rotYaw(p, a) { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[2] * s, p[1], p[0] * s + p[2] * c]; }
// where the camera sits and looks for an orbit state
function orbitPose(o, yaw, pitch, dist, off, frame) {
  const fy = frame === 'world' ? 0 : VIEW.fyaw;
  const target = vadd(o.pos, rotYaw(off, fy));
  const dir = rotYaw(dirYP(yaw, pitch), fy);
  return { target, pos:vmad(target, dir, dist), dir };
}
function setBasis(fwd) {
  CAM.fwd = vnorm(fwd);
  let r = vcross(CAM.fwd, [0, 1, 0]);
  if (vlen(r) < 1e-4) r = vcross(CAM.fwd, [1, 0, 0]);
  CAM.right = vnorm(r); CAM.up = vcross(CAM.right, CAM.fwd);
}
// keep the camera in the water: under the surface and above the floor
function clampCam(p, dist, air) {
  const m = clamp(dist * 0.08, 0.002, 1.5);
  const fy = floorY(p[0], p[2]) + m;
  let y = Math.min(Math.max(p[1], fy), air ? 150 : -0.15);
  if (air && Math.abs(y) < 0.12) y = y >= 0 ? 0.12 : -0.12;   // (never exactly in the surface)
  return [p[0], y, p[2]];
}

// ---- lock on: start the angle loop round an object (instantly, or as the end of a flight)
function lockOn(o, vi = 0, keepPose) {
  VIEW.mode = 'orbit'; VIEW.focus = o; VIEW.flight = null; VIEW.vi = vi; VIEW.vt = 0; VIEW.trans = null;
  VIEW.fyaw = frameYaw(o); o._fy = VIEW.fyaw;
  if (!keepPose) {
    const p = viewParams(o, o.views[vi % o.views.length]);
    Object.assign(VIEW, { yaw:p.yaw, pitch:p.pitch, dist:p.dist, off:p.off, frame:p.frame });
  }
  onFocus(o);
}
function goView(vi) {
  const o = VIEW.focus; if (!o) return;
  VIEW.vi = (vi + o.views.length) % o.views.length; VIEW.vt = 0;
  const p = viewParams(o, o.views[VIEW.vi]);
  // a smooth move to the new angle; a change of frame is carried by turning the yaw into the other frame
  let yaw0 = VIEW.yaw;
  if (p.frame !== VIEW.frame) yaw0 += VIEW.frame === 'world' ? -VIEW.fyaw : VIEW.fyaw;
  VIEW.trans = { t:0, T:3.5, from:{ yaw:yaw0, pitch:VIEW.pitch, dist:VIEW.dist, off:VIEW.off.slice() }, to:p };
  VIEW.frame = p.frame; VIEW.yaw = yaw0;
}

// ---- flights: out, then down (or up, then in), so the path stays in the water; the view widens on long trips
function flyTo(o, vi = 0) {
  if (!o) return;
  const from = { pos:CAM.pos.slice(), dir:CAM.fwd.slice(), dist:CAM.scale };
  from.target = vmad(from.pos, from.dir, from.dist);
  VIEW.mode = 'flight'; VIEW.trans = null;
  VIEW.flight = { o, vi, from, t:0 };
  const p = viewParams(o, o.views[vi % o.views.length]);
  VIEW.fyaw = frameYaw(o); o._fy = VIEW.fyaw;
  const end = orbitPose(o, p.yaw, p.pitch, p.dist, p.off, p.frame);
  const span = vlen(vsub(end.target, from.target));
  const k = { slow:1.6, quick:1, warp:0.45 }[SET.travel] || 1;
  VIEW.flight.T = k * clamp(2.2 + 1.25 * Math.log10(1 + span / Math.max(from.dist + p.dist, 1e-3)), 2, 9);
  VIEW.flight.span = span;
  onFlight(o);
}
function updateFlight(dt) {
  const F = VIEW.flight, o = F.o;
  F.t += dt / F.T;
  const s = Math.min(1, F.t);
  const p = viewParams(o, o.views[F.vi % o.views.length]);
  VIEW.fyaw = frameYaw(o); o._fy = VIEW.fyaw;
  const end = orbitPose(o, p.yaw, p.pitch, p.dist, p.off, p.frame);
  const a = F.from.target, b = end.target;
  // going deeper: across first, then down; going up: up first, then across
  const down = b[1] < a[1];
  const hx = ease(clamp(down ? s / 0.62 : (s - 0.38) / 0.62, 0, 1)), vy = ease(clamp(down ? (s - 0.38) / 0.62 : s / 0.62, 0, 1));
  const big = F.span > 30 * (F.from.dist + p.dist);
  const c = big ? [lerp(a[0], b[0], hx), lerp(a[1], b[1], vy), lerp(a[2], b[2], hx)] : vlerp(a, b, ease(s));
  // the view widens in the middle of a long trip
  const bump = Math.min(4, Math.log10(1 + F.span / Math.max(F.from.dist + p.dist, 1e-6)) * 1.2);
  const lw = lerp(Math.log(F.from.dist), Math.log(p.dist), ease(s)) + bump * Math.sin(PI * s) * 0.9;
  const w = Math.exp(lw);
  const dir = vnorm(vlerp(F.from.dir, vmul(end.dir, -1), smooth(0.1, 0.9, s)));
  let pos = vmad(c, dir, -w);
  // never rise above the higher of the two ends: widening the view on a long trip must not lift the camera to the surface
  pos[1] = Math.min(pos[1], Math.max(F.from.pos[1], end.pos[1]) + 1);
  pos = clampCam(pos, w, p.air && s > 0.5);
  CAM.pos = pos; setBasis(dir); CAM.scale = w;
  if (s >= 1) { Object.assign(VIEW, { yaw:p.yaw, pitch:p.pitch, dist:p.dist, off:p.off, frame:p.frame }); lockOn(o, F.vi, true); onArrive(o); }
}

// ---- the free camera
function letGo() {
  if (VIEW.mode === 'free') return;
  if (JOURNEY.on) endJourney(true);
  VIEW.last = VIEW.focus || VIEW.last;
  VIEW.mode = 'free'; VIEW.flight = null; VIEW.trans = null;
  VIEW.free.yaw = yawOf(CAM.fwd); VIEW.free.pitch = pitchOf(CAM.fwd);
  onFree();
}
function updateFree(dt) {
  const f = dirYP(VIEW.free.yaw, VIEW.free.pitch);
  setBasis(f);
  const sp = Math.max(CAM.scale, 0.02) * (KEYS.has('shift') ? 4 : 1.2);
  let mv = [0, 0, 0];
  if (KEYS.has('w')) mv = vadd(mv, CAM.fwd); if (KEYS.has('s')) mv = vsub(mv, CAM.fwd);
  if (KEYS.has('d')) mv = vadd(mv, CAM.right); if (KEYS.has('a')) mv = vsub(mv, CAM.right);
  if (KEYS.has('r')) mv = vadd(mv, [0, 1, 0]); if (KEYS.has('f')) mv = vsub(mv, [0, 1, 0]);
  if (vlen(mv) > 0) CAM.pos = vmad(CAM.pos, vnorm(mv), sp * dt);
  if (FREE_DEPTH.target != null) {
    // the depth ladder: dive or rise to a depth; past the local floor, drift offshore to where the water is deep enough
    const d = FREE_DEPTH.target, y = -d;
    CAM.pos[1] = lerp(CAM.pos[1], y, 1 - Math.exp(-dt * 3));
    const need = -CAM.pos[1] + Math.max(25, CAM.scale * 2);
    if (floorDepth(CAM.pos[0], CAM.pos[2]) < need) {
      let x = CAM.pos[0]; while (x < 84000 && profileDepth(x) < need + 40) x += 100;
      CAM.pos[0] = lerp(CAM.pos[0], x, 1 - Math.exp(-dt * 2.5));
    }
    if (Math.abs(CAM.pos[1] - y) < 0.01 * Math.max(1, d) && !FREE_DEPTH.dragging) FREE_DEPTH.target = null;
  }
  CAM.pos = clampCam(CAM.pos, CAM.scale, true);
}
const FREE_DEPTH = { target:null, dragging:false };

// ---- every frame
function updateCamera(dt) {
  for (const o of OBJS) if (o.motion.type !== 'still' || o.motion.fn || !o._placed) { moveObj(o, simTime); o._placed = true; }
  VIEW.manualT += dt;
  if (VIEW.mode === 'journey') { updateJourney(dt); return; }
  if (VIEW.mode === 'flight') { updateFlight(dt); return; }
  if (VIEW.mode === 'free') { updateFree(dt); return; }
  const o = VIEW.focus; if (!o) return;
  // the frame follows the animal's heading, smoothed so turns do not swing the view about
  const fy = frameYaw(o); o._fy = fy;
  VIEW.fyaw += angDiff(VIEW.fyaw, fy) * (1 - Math.exp(-dt * 0.8));
  const v = o.views[VIEW.vi % o.views.length];
  if (VIEW.trans) {
    const T = VIEW.trans; T.t += dt / T.T; const e = ease(Math.min(1, T.t));
    VIEW.yaw = T.from.yaw + angDiff(T.from.yaw, T.to.yaw) * e;
    VIEW.pitch = lerp(T.from.pitch, T.to.pitch, e);
    VIEW.dist = Math.exp(lerp(Math.log(T.from.dist), Math.log(T.to.dist), e));
    VIEW.off = vlerp(T.from.off, T.to.off, e);
    if (T.t >= 1) VIEW.trans = null;
  } else if (VIEW.auto && VIEW.manualT > 4) {
    VIEW.yaw += (v.drift || 0) * dt;
  }
  if (VIEW.auto && !VIEW.trans) {
    VIEW.vt += dt;
    const hold = (v.hold || 9) * DWELL[SET.dwell];
    if (VIEW.vt > hold && VIEW.manualT > 6) onViewDone(o);
  }
  const P = orbitPose(o, VIEW.yaw, VIEW.pitch, VIEW.dist, VIEW.off, VIEW.frame);
  CAM.pos = clampCam(P.pos, VIEW.dist, v.air);
  setBasis(vsub(P.target, CAM.pos));
  CAM.scale = vlen(vsub(P.target, CAM.pos));
}
const DWELL = { short:0.6, normal:1, long:1.7 };

// ---- where a world point lands on screen, in CSS pixels
function project(p) {
  const r = vsub(p, CAM.pos);
  const x = VP[0] * r[0] + VP[4] * r[1] + VP[8] * r[2] + VP[12];
  const y = VP[1] * r[0] + VP[5] * r[1] + VP[9] * r[2] + VP[13];
  const w = VP[3] * r[0] + VP[7] * r[1] + VP[11] * r[2] + VP[15];
  if (w <= 1e-9) return null;
  const A = ASCII, gw = A.cols * A.cw, gh = A.rows * A.ch;
  const ox = Math.floor((gw - A.W) / 2), oy = Math.floor((gh - A.H) / 2);
  return { x:((x / w) * 0.5 + 0.5) * gw / A.dpr - ox / A.dpr, y:(1 - ((y / w) * 0.5 + 0.5)) * gh / A.dpr - oy / A.dpr, w };
}
// how many CSS pixels a length makes at a distance
function pxPerMetre(dist) { return (ASCII.rows * ASCII.ch / ASCII.dpr) / (2 * Math.tan(CAM.fov / 2) * Math.max(dist, 1e-12)); }

// what is under a click: the nearest place whose drawn size covers the point
function pick(x, y) {
  let best = null, bs = 1e9;
  for (const o of OBJS) {
    if (!o.place || o.hidden) continue;
    const d = vlen(vsub(o.pos, CAM.pos));
    if (d - o.rad > visRange() * 1.2) continue;
    const s = project(o.pos); if (!s) continue;
    const r = Math.max(18, o.rad * pxPerMetre(d) * 0.8);
    const e = Math.hypot(s.x - x, s.y - y);
    if (e < r) { const score = e / r + d * 1e-4; if (score < bs) { bs = score; best = o; } }
  }
  return best;
}
