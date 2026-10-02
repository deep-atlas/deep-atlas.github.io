// ---- drawing the scene into the HDR target the ASCII pass reads

// the camera: world position (doubles), basis, field of view. Everything is drawn relative to cam.pos.
const CAM = { pos:[300, -8, 0], fwd:[1, 0, 0], up:[0, 1, 0], right:[0, 0, 1], fov:0.9, far:4000, scale:10, depth:8 };

// the shared uniform block (std140, 384 bytes)
const UBO_DATA = new ArrayBuffer(384), UBO_F = new Float32Array(UBO_DATA), UBO_I = new Int32Array(UBO_DATA);
const UBO = gl.createBuffer();
gl.bindBuffer(gl.UNIFORM_BUFFER, UBO); gl.bufferData(gl.UNIFORM_BUFFER, 384, gl.DYNAMIC_DRAW);
gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, UBO);
function bindScene(P) {
  if (P._bound) return; P._bound = true;
  const i = gl.getUniformBlockIndex(P.p, 'Scene');
  if (i !== gl.INVALID_INDEX) gl.uniformBlockBinding(P.p, i, 0);
}
function sceneProg(P) { if (!P.ready()) return null; bindScene(P); return useProg(P); }

const VP = new Float32Array(16);
const LAMP_COL = [0.86, 0.95, 1.0];   // cool white LED floodlights
function updateUBO(time) {
  const A = ASCII, aspect = (A.cols * A.cw) / (A.rows * A.ch);
  const f = 1 / Math.tan(CAM.fov / 2), n = Math.max(1e-5, CAM.scale * 2e-4), fa = CAM.far;
  const P = [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0];
  const R = CAM.right, U = CAM.up, F = CAM.fwd;
  const V = [R[0], U[0], -F[0], 0, R[1], U[1], -F[1], 0, R[2], U[2], -F[2], 0, 0, 0, 0, 1];
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += P[k * 4 + r] * V[c * 4 + k]; VP[c * 4 + r] = s; }
  const U8 = UBO_F; U8.set(VP, 0);
  const wrap = v => v - Math.floor(v / 4096) * 4096;
  const d = CAM.depth;
  U8.set([wrap(CAM.pos[0]), CAM.pos[1], wrap(CAM.pos[2]), Math.max(d, 0)], 16);
  U8.set([...LIGHT.sun, LIGHT.surf], 20);
  U8.set([...LIGHT.sunDir, LIGHT.caustic], 24);
  U8.set([...KD, time], 28);
  // the haze thins for wide views (a whale from 30 m), so the biggest animals stay readable; small scenes keep the water's true clarity.
  // The water's glow is scaled with it, so open water looks the same either way.
  const fs = clamp(Math.pow(14 / Math.max(CAM.scale, 1e-6), 0.6), 0.4, 1);
  // where the lamps are the light, balance the colour as an ROV's camera does, for the light that comes back from the distance being looked at:
  // close up the reds return, a wide shot stays blue
  // (in the lamp-lit deep, red fades only a little faster than green with distance: legible colour over a strict colour cast)
  const beam = [lerp(BEAM[0], BEAM[1] * 1.5, LIGHT.lamp), BEAM[1], BEAM[2]];
  // the colour balance follows all the light there is: the sun's (blue at depth) and the lamps' (white, losing red with distance).
  // Where the lamps dominate the balance is gentle, so the deep keeps a cool blue cast and nothing near the lamps turns red.
  const D = Math.max(CAM.lampD || CAM.scale, 1e-4), path = Math.min(D, 3) * 0.7 + D;
  const att = beam.map(c => Math.exp(-c * fs * path));
  // in the sunlit shallows a photographer's strobe fills in what the water has taken: red returns near the camera,
  // distant things still fade to blue. It hands over to the floodlights as the sunlight fails.
  const fill = SET.strobe === false ? 0 : 0.28 * smooth(70, 12, CAM.depth) * (CAM.depth > 0.3 ? 1 : 0) * LIGHT.level;
  const lampLev = Math.max(LIGHT.lamp * 0.8, fill);
  const lampI = LAMP_COL.map((c, i) => c * lampLev * att[i]), sunI = LIGHT.sun;
  const illum = [0, 1, 2].map(i => sunI[i] + lampI[i]);
  const lf = (lampI[1] + lampI[2]) / Math.max(lampI[1] + lampI[2] + sunI[1] + sunI[2], 1e-9);
  const cap = lerp(LIGHT.wbCap || 12, 2.5, lf), kk = lerp(LIGHT.wbK || 0.9, 0.45, lf);
  ASCII.wb = illum.map(c => Math.pow(clamp(illum[2] / Math.max(c, 1e-9), 1, cap), kk));
  U8.set([...beam.map(v => v * fs), 0], 32);
  U8.set([...SCAT.map(v => v * fs), aspect], 36);
  const ls = lampLev;
  U8.set([LAMP_COL[0] * ls, LAMP_COL[1] * ls, LAMP_COL[2] * ls, Math.max(CAM.lampD || CAM.scale, 1e-4)], 40);
  U8.set([...CAM.fwd, 0.82], 44);
  U8.set([lerp(0.6, 1.0, LIGHT.lamp), 1 / CAM.far, LIGHT.night, CAM.scale], 48);
  const cx = Math.floor(CAM.pos[0] / 1024), cz = Math.floor(CAM.pos[2] / 1024);
  U8.set([CAM.pos[0] - cx * 1024, CAM.pos[2] - cz * 1024, CAM.pos[0], CAM.pos[2]], 52);
  UBO_I.set([cx, cz, 0, 0], 56);
  U8.set([...CAM.fwd, Math.max(0, -d)], 60);
  U8.set(typeof collectLights === 'function' ? collectLights() : new Float32Array(32), 64);
  gl.bindBuffer(gl.UNIFORM_BUFFER, UBO); gl.bufferSubData(gl.UNIFORM_BUFFER, 0, UBO_DATA);
}

// ---- creatures: one mesh, deformed as it swims
const GLSL_DEFORM = `
uniform vec4 uSwim;   // amplitude (body lengths), beats per second, waves along the body, phase
uniform vec4 uSwim2;  // axis (0: side to side like a fish, 1: up and down like a whale), envelope power, flap amplitude, flap beats per second
uniform vec4 uSway;   // amplitude, speed, spatial scale, phase
uniform vec4 uPulse;  // amplitude, beats per second, phase
uniform vec4 uFx;     // y: alarm, z: cloak turned inside out, w: alarm style
void deform(inout vec3 p, inout vec3 n, vec4 an, float t, float ph0){
  float s = an.x;
  if (uSwim.x != 0.0 && s > 0.0){
    float env = pow(s, uSwim2.y);
    float ph = 6.2831853 * (s * uSwim.z - uSwim.y * t) + uSwim.w + ph0;
    float off = uSwim.x * env * sin(ph);
    float dds = uSwim.x * (uSwim2.y * pow(max(s, 1e-3), uSwim2.y - 1.0) * sin(ph) + env * cos(ph) * 6.2831853 * uSwim.z);
    float th = atan(dds), c = cos(th), sn = sin(th);
    if (uSwim2.x < 0.5){ p.z += off; n = vec3(n.x * c - n.z * sn, n.y, n.x * sn + n.z * c); }
    else { p.y += off; n = vec3(n.x * c - n.y * sn, n.x * sn + n.y * c, n.z); }
  }
  if (an.y > 0.0){
    float ph = 6.2831853 * uSwim2.w * t + uSwim.w + ph0 - an.y * 2.0;
    p.y += uSwim2.z * an.y * sin(ph);
  }
  if (an.z > 0.0){
    float tt = t * uSway.y + uSway.w + ph0; vec3 q = p * uSway.z;
    p += uSway.x * an.z * vec3(0.35 * sin(tt * 0.73 + q.z * 1.3), sin(tt + q.x * 1.7 + q.z * 1.1), cos(tt * 0.81 + q.x * 1.3 + q.y * 0.9));
  }
  if (an.w > 0.0){
    float pl = 0.5 + 0.5 * sin(6.2831853 * uPulse.y * t + uPulse.z + ph0); pl = pl * pl * pl;
    float k = uPulse.x * an.w * pl;
    p.yz *= 1.0 - k; p.x -= k * 0.15;
  }
  if (uFx.z > 0.0 && an.w > 0.0){
    // the vampire squid's "pineapple" defence: the cloak folds forward over the mantle, its spiny inside facing out
    float e = uFx.z, x0 = -0.05, L = max(x0 - p.x, 0.0), r = length(p.yz);
    vec2 dir = r > 1e-5 ? p.yz / r : vec2(1.0, 0.0);
    p.x = mix(p.x, x0 + L * 1.1, e);
    p.yz = dir * mix(r, 0.19 + 0.04 * sin(L * 20.0), e);
    n = normalize(mix(n, vec3(0.1, dir), e));
  }
}`;

const VS_MESH = GLSL_SCENE + GLSL_DEFORM + `
uniform mat4 uModel;
layout(location = 0) in vec3 aPos; layout(location = 1) in vec3 aNor; layout(location = 2) in vec4 aCol; layout(location = 3) in vec4 aAnim;
out vec3 vRel; out vec3 vN; out vec4 vCol; out float vW; out vec3 vObj;
void main(){
  vec3 p = aPos, n = aNor;
  deform(p, n, aAnim, uKd.w, 0.0);
  vec4 w = uModel * vec4(p, 1.0);
  vRel = w.xyz; vN = mat3(uModel) * n; vCol = aCol; vObj = aPos;
  gl_Position = uVP * vec4(vRel, 1.0); vW = gl_Position.w;
}`;

// schools: one mesh drawn many times; every fish's path is worked out here from its instance numbers
const VS_SCHOOL = GLSL_SCENE + GLSL_DEFORM + `
uniform mat4 uModel;
uniform vec4 uSchool;   // x: mode, y: fish length (m), z: speed, w: spread
uniform float uSchoolPx;  // scene pixels per metre at 1 m
uniform vec4 uPred[4];    // what the school keeps clear of: xyz relative to the camera, w: how far
layout(location = 0) in vec3 aPos; layout(location = 1) in vec3 aNor; layout(location = 2) in vec4 aCol; layout(location = 3) in vec4 aAnim;
layout(location = 4) in vec4 iA; layout(location = 5) in vec4 iB;
out vec3 vRel; out vec3 vN; out vec4 vCol; out float vW; out vec3 vObj;
void main(){
  float t = uKd.w * uSchool.z;
  vec3 c, f;
  int mode = int(uSchool.x);
  if (mode == 0){
    // a mill: fish circle a common centre (a bait ball, a school of jacks); iA = radius, angle, height, angular speed; iB = phase, wobble, size, tilt
    float a = iA.y + iA.w * t;
    float r = iA.x * (1.0 + 0.12 * sin(t * 0.37 + iB.x * 3.0));
    float h = iA.z + iB.y * sin(t * 0.53 + iB.x * 5.0);
    c = vec3(r * cos(a), h, r * sin(a));
    f = normalize(vec3(-sin(a) * sign(iA.w), iB.w + 0.1 * cos(t * 0.53 + iB.x * 5.0), cos(a) * sign(iA.w)));
  } else if (mode == 1){
    // a loose cloud, each fish hanging in place and turning slowly (lanternfish, hatchetfish); iA = position, yaw; iB = phase, drift, size, pitch
    float yaw = iA.w + 0.6 * sin(t * 0.07 + iB.x * 6.0);
    float pitch = clamp(iB.w + uSchool.w, -1.3, 1.3);   // (w: the whole cloud rising or sinking tips every fish that way)
    f = vec3(cos(yaw) * cos(pitch), sin(pitch), sin(yaw) * cos(pitch));
    c = iA.xyz + f * iB.y * sin(t * 0.11 + iB.x * 4.0) + vec3(0.0, 0.3 * iB.y * sin(t * 0.05 + iB.x), 0.0);
  } else {
    // a stream along +x, wrapping round a box (a migrating school); iA = position, -; iB = phase, -, size, lane wobble
    vec3 b = iA.xyz;
    float L = uSchool.w;
    float x = mod(b.x + t * (1.0 + 0.15 * sin(iB.x * 7.0)) + L * 0.5, L) - L * 0.5;
    c = vec3(x, b.y + iB.w * sin(t * 0.4 + iB.x * 3.0), b.z + iB.w * cos(t * 0.31 + iB.x * 2.0));
    f = normalize(vec3(1.0, 0.25 * iB.w * cos(t * 0.4 + iB.x * 3.0), -0.2 * iB.w * sin(t * 0.31 + iB.x * 2.0)));
  }
  vec3 sd = normalize(cross(f, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(sd, f);
  float L = uSchool.y * iB.z;
  vec3 p = aPos, n = aNor;
  deform(p, n, aAnim, uKd.w, iB.x * 6.2831);
  vec3 lp = c + (f * p.x + up * p.y + sd * p.z) * L;
  vec4 w = uModel * vec4(lp, 1.0);
  // part round predators and divers: each fish is pushed out of a bubble round them, the push easing off at its edge
  vec3 cw = (uModel * vec4(c, 1.0)).xyz, push = vec3(0.0);
  for (int i = 0; i < 4; i++){
    float R = uPred[i].w; if (R <= 0.0) continue;
    vec3 d = cw - uPred[i].xyz; float dl = length(d);
    push += (dl > 1e-4 ? d / dl : vec3(0.0, 1.0, 0.0)) * R * (1.0 - smoothstep(R * 0.2, R * 1.15, dl)) * 0.75;
  }
  w.xyz += push;
  vRel = w.xyz; vN = mat3(uModel) * (f * n.x + up * n.y + sd * n.z); vCol = aCol; vObj = aPos;
  gl_Position = uVP * vec4(vRel, 1.0); vW = gl_Position.w;
  // a fish smaller than a pixel would flicker in and out between samples: leave it out instead
  if (L * uSchoolPx / max(gl_Position.w, 1e-6) < 0.7) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;

const FS_MESH = GLSL_SCENE + GLSL_LIGHT + `
uniform vec4 uMat;    // x: opacity (1 solid), y: rim, z: glow, w: shine
uniform vec3 uTint;
uniform vec3 uWB;
uniform float uGlowSun;   // 1: the glow is sunlight passing through (ice), coloured by the water like the sun's light
uniform vec4 uFx;     // x: comb rows (a comb jelly's beating cilia split the light into running rainbows)
in vec3 vRel; in vec3 vN; in vec4 vCol; in float vW; in vec3 vObj;
out vec4 o;
void main(){
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 V = -normalize(vRel);
  float depth = -(uCam.y + vRel.y);
  vec3 alb = vCol.rgb * uTint;
  vec3 col = shade(vRel, N, alb, depth, uMat.w);
  float fr = pow(1.0 - abs(dot(N, V)), 2.5);
  vec3 Ld; vec3 lamp = lampAt(vRel, N, Ld);
  col += (sunAt(depth) * 0.35 + lamp * 0.5) * fr * uMat.y * mix(alb, vec3(1.0), 0.5);
  // (light through ice is already the sea's colour: undo the eye's colour correction for it, scaled by the daylight at its depth)
  col += vCol.rgb * vCol.a * uMisc.x * uMat.z * mix(vec3(1.0), luma(sunAt(depth)) / uWB, uGlowSun);
  if (uFx.y > 0.0){
    // an alarm: Atolla's wheel of light chasing round its rim, or a whole-body flash
    float ang = atan(vObj.z, vObj.y);
    float wheel = uFx.w < 1.5 ? pow(0.5 + 0.5 * sin(ang * 3.0 - uKd.w * 7.0), 5.0) * step(0.01, vCol.a) * 4.0
                              : 0.5 + 0.5 * sin(uKd.w * 21.0 + vObj.x * 37.0 + ang * 3.0);
    col += vec3(0.25, 0.85, 1.0) * wheel * uFx.y * 1.6;
  }
  if (uFx.x > 0.0){
    float row = smoothstep(0.36, 0.46, abs(fract(atan(vObj.y, vObj.z) / 6.2831853 * 8.0) - 0.5));
    float ph = vObj.x * 22.0 - uKd.w * 5.0;
    vec3 rb = 0.5 + 0.5 * cos(6.2831853 * (ph * 0.08 + vec3(0.0, 0.33, 0.67)));
    col += rb * row * (0.55 + 0.45 * sin(ph)) * (luma(sunAt(depth)) + luma(lamp) + 0.05) * 2.5 * uFx.x;
  }
  col = fogMix(col, vRel);
  float a = 1.0;
  if (uMat.x < 0.999) a = clamp(uMat.x + fr * 0.55 + vCol.a * 0.25, 0.0, 1.0);
  o = vec4(col * a, a);
  gl_FragDepth = clamp(vW * uMisc.y, 0.0, 1.0);
}`;

const P_MESH = program(VS_MESH, FS_MESH, 'mesh');
const P_SCHOOL = program(VS_SCHOOL, FS_MESH, 'school');

const MODEL = new Float32Array(16);
// draw one creature: it = { mesh, pos, fwd, up, scale, mat, tint, swim, swim2, sway, pulse, school }
function drawCreature(it, P) {
  const u = sceneProg(P); if (!u) return;
  const rel = vsub(it.pos, CAM.pos);
  modelMat(MODEL, rel, it.fwd || [1, 0, 0], it.up || [0, 1, 0], it.scale || 1);
  gl.uniformMatrix4fv(u.uModel, false, MODEL);
  const m = it.mat || DEF_MAT;
  gl.uniform4f(u.uMat, m[0], m[1], m[2], m[3]);
  const tn = it.tint || [1, 1, 1]; gl.uniform3f(u.uTint, tn[0], tn[1], tn[2]);
  gl.uniform1f(u.uGlowSun, it.glowSun ? 1 : 0); gl.uniform3fv(u.uWB, ASCII.wb);
  const sw = it.swim || ZA, s2 = it.swim2 || [0, 2, 0, 0], sy = it.sway || ZA, pu = it.pulse || ZA;
  gl.uniform4f(u.uSwim, sw[0], sw[1], sw[2], sw[3]);
  gl.uniform4f(u.uSwim2, s2[0], s2[1], s2[2], s2[3]);
  gl.uniform4f(u.uSway, sy[0], sy[1], sy[2], sy[3]);
  gl.uniform4f(u.uPulse, pu[0], pu[1], pu[2], pu[3]);
  const fx = it.fx || ZA; gl.uniform4f(u.uFx, fx[0], fx[1], fx[2], fx[3]);
  if (it.school && it.pred) gl.uniform4fv(u.uPred, it.pred);
  if (it.school) { gl.uniform4f(u.uSchool, it.school[0], it.school[1], it.school[2], it.school[3]); gl.uniform1f(u.uSchoolPx, ASCII.rows * SY / (2 * Math.tan(CAM.fov / 2))); }
  gl.bindVertexArray(it.mesh.vao);
  if (it.school) gl.drawElementsInstanced(gl.TRIANGLES, it.mesh.count, gl.UNSIGNED_INT, 0, it.mesh.icount);
  else gl.drawElements(gl.TRIANGLES, it.mesh.count, gl.UNSIGNED_INT, 0);
}
const DEF_MAT = [1, 0.25, 1, 0.3];

// ---- the seafloor: a ring grid round the camera, its height from floorDepth() in the vertex shader
const TER_RINGS = 110, TER_SEGS = 160;
const VS_TERRAIN = GLSL_SCENE + GLSL_COMMON + GLSL_FLOOR + `
uniform vec2 uGridK;   // r = k.x * (k.y^ring - 1)
layout(location = 0) in vec3 aPos;
out vec3 vRel; out vec3 vN; out float vW; out float vX; out float vD; out float vSM;
vec4 bandsFor(float spacing){ return vec4(1.0, smoothstep(160.0, 40.0, spacing), smoothstep(20.0, 5.0, spacing), smoothstep(2.5, 0.6, spacing)); }
float fd(vec2 L, float x, float z, vec4 bw){
  vec4 R = roughness(x) * bw;
  float h = 0.0;
  for (int b = 0; b < 4; b++){
    float r = R[b]; if (r < 1e-4) continue;
    h += r * (octave(uTerrCell.xy, L, b * 3) * 0.5 + octave(uTerrCell.xy, L, b * 3 + 1) * 0.3 + octave(uTerrCell.xy, L, b * 3 + 2) * 0.2);
  }
  vec2 pd = padAt(x, z);
  return max(0.4, mix(profileDepth(x) - h - seamountAt(x, z), pd.y - h * 0.2, pd.x));
}
void main(){
  float r = uGridK.x * (pow(uGridK.y, aPos.z) - 1.0);
  float spacing = max(uGridK.x * pow(uGridK.y, aPos.z) * (uGridK.y - 1.0), r * 0.04);
  vec4 bw = bandsFor(spacing);
  vec2 dir = aPos.xy;
  vec2 off = dir * r;
  vec2 L = uTerr.xy + off;
  float x = uTerr.z + off.x, z = uTerr.w + off.y;
  float d = fd(L, x, z, bw);
  float e = max(spacing * 0.5, 0.002);
  float dx = fd(L + vec2(e, 0.0), x + e, z, bw), dz = fd(L + vec2(0.0, e), x, z + e, bw);
  vN = normalize(vec3((dx - d) / e, 1.0, (dz - d) / e));
  vRel = vec3(off.x, uCam.w - d, off.y);
  vX = x; vD = d; vSM = seamountAt(x, z) / 3800.0;
  gl_Position = uVP * vec4(vRel, 1.0); vW = gl_Position.w;
}`;
const FS_TERRAIN = GLSL_SCENE + GLSL_LIGHT + `
in vec3 vRel; in vec3 vN; in float vW; in float vX; in float vD; in float vSM;
out vec4 o;
void main(){
  vec3 wp = uCam.xyz + vRel;
  float x = vX;
  float sc = clamp(length(vRel) * 0.004, 0.0, 1.0);
  // fine bumps the grid is too coarse for
  vec3 N = normalize(vN);
  float n1 = fbm3(wp * 1.7), n2 = noise3(wp * 9.0), n3 = noise3(wp * 0.25);
  vec3 bump = vec3(noise3(wp * 3.1 + 7.0) - 0.5, 0.0, noise3(wp * 3.1 + 19.0) - 0.5);
  float rip = sin((wp.x + 0.25 * wp.z) * 12.566 + n1 * 5.0);
  bump.x += rip * 0.12 * smoothstep(3500.0, 300.0, x) * (1.0 - sc);
  N = normalize(N + bump * 0.35 * (1.0 - sc));
  // what the floor is made of, by where it is
  // pale sand broken by patches of seagrass and rubble, so the shallows are not one glaring sheet
  float patchy = noise3(wp * 0.12) * 0.6 + noise3(wp * 0.5) * 0.4;
  float ripB = 0.7 + 0.3 * sin((wp.x + 0.25 * wp.z) * 3.1 + n1 * 4.0) * (1.0 - sc);
  vec3 sand = mix(vec3(0.16, 0.155, 0.13), vec3(0.06, 0.1, 0.05), smoothstep(0.45, 0.62, patchy) * 0.85) * mix(0.65, 1.15, n1) * ripB;
  vec3 rubble = vec3(0.62, 0.55, 0.47) * mix(0.7, 1.1, n2);
  vec3 rock = vec3(0.28, 0.27, 0.26) * mix(0.6, 1.2, n1);
  vec3 coralline = vec3(0.75, 0.42, 0.5);
  vec3 mud = vec3(0.28, 0.26, 0.22) * mix(0.8, 1.1, n1);
  vec3 ooze = vec3(0.31, 0.3, 0.27) * mix(0.8, 1.08, n1);
  vec3 nodule = vec3(0.12, 0.1, 0.09);
  vec3 alb = sand;
  alb = mix(alb, rubble, smoothstep(0.55, 0.75, n3) * smoothstep(100.0, 400.0, x) * (1.0 - smoothstep(1400.0, 1800.0, x)));
  float kelp = smoothstep(1600.0, 2100.0, x) * (1.0 - smoothstep(3300.0, 4200.0, x));
  alb = mix(alb, mix(rock, coralline, smoothstep(0.6, 0.8, n2) * 0.7), kelp);
  alb = mix(alb, mud, smoothstep(3500.0, 6000.0, x));
  alb = mix(alb, mix(mud, rock, smoothstep(0.45, 0.7, n1)), smoothstep(10000.0, 12000.0, x) * (1.0 - smoothstep(27000.0, 31000.0, x)));
  alb = mix(alb, ooze, smoothstep(28000.0, 32000.0, x));
  float nod = smoothstep(0.72, 0.8, noise3(wp * 6.0)) * smoothstep(34000.0, 38000.0, x) * (1.0 - smoothstep(60000.0, 66000.0, x));
  alb = mix(alb, nodule, nod * 0.85);
  alb = mix(alb, mix(rock * 0.9, ooze * 0.85, smoothstep(0.3, 0.1, N.y < 0.85 ? 0.0 : 0.5)), smoothstep(67000.0, 71000.0, x));
  // a seamount's flanks are bare volcanic rock, dusted with ooze where they level off
  alb = mix(alb, mix(rock * 0.75, ooze * 0.9, smoothstep(0.8, 0.95, N.y) * 0.6), smoothstep(0.08, 0.25, vSM));
  vec3 col = shade(vRel, N, alb, vD, 0.05);
  col = fogMix(col, vRel);
  o = vec4(col, 1.0);
  gl_FragDepth = clamp(vW * uMisc.y, 0.0, 1.0);
}`;
const P_TERRAIN = program(VS_TERRAIN, FS_TERRAIN, 'terrain');
let TER_VAO = null, TER_COUNT = 0;
function buildTerrainGrid() {
  const v = [], idx = [];
  v.push(0, 0, 0);
  for (let r = 1; r <= TER_RINGS; r++) for (let s = 0; s < TER_SEGS; s++) { const a = s / TER_SEGS * TAU; v.push(Math.cos(a), Math.sin(a), r); }
  const at = (r, s) => r === 0 ? 0 : 1 + (r - 1) * TER_SEGS + (s % TER_SEGS);
  for (let s = 0; s < TER_SEGS; s++) idx.push(0, at(1, s + 1), at(1, s));
  for (let r = 1; r < TER_RINGS; r++) for (let s = 0; s < TER_SEGS; s++) idx.push(at(r, s), at(r, s + 1), at(r + 1, s + 1), at(r, s), at(r + 1, s + 1), at(r + 1, s));
  TER_VAO = gl.createVertexArray(); gl.bindVertexArray(TER_VAO);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), gl.STATIC_DRAW);
  gl.bindVertexArray(null); TER_COUNT = idx.length;
}
buildTerrainGrid();
function drawTerrain() {
  if (typeof DEBUG !== 'undefined' && DEBUG.solo) return;
  // only when the floor could be seen: within sight of the camera, or lit by the lamps
  const fd = floorDepth(CAM.pos[0], CAM.pos[2]), above = fd - CAM.depth;
  if (above > 420) return;
  const u = sceneProg(P_TERRAIN); if (!u) return;
  const r0 = clamp(Math.min(CAM.scale, Math.max(above, 0.01)) * 0.02, 0.0004, 4), rMax = 1500;
  const q = Math.pow(rMax / r0, 1 / TER_RINGS);
  gl.uniform2f(u.uGridK, r0 / (q - 1), q);
  gl.bindVertexArray(TER_VAO);
  gl.drawElements(gl.TRIANGLES, TER_COUNT, gl.UNSIGNED_INT, 0);
}

// ---- above the water: the sky, and the sea's surface from above (its own colour, the sky reflected, the sun's glitter)
const GLSL_SKY = `
uniform vec3 uSunAir;
float waves(vec2 q, float t){
  return sin(dot(q, vec2(0.62, 0.21)) * 1.1 + t * 1.3) * 0.5 + sin(dot(q, vec2(-0.3, 0.9)) * 1.7 - t * 1.7) * 0.3
       + sin(dot(q, vec2(0.85, -0.6)) * 3.1 + t * 2.3) * 0.15 + (noise3(vec3(q * 1.3, t * 0.4)) - 0.5) * 0.6;
}
const vec3 MOON = normalize(vec3(-0.55, 0.42, 0.35));
vec3 skyCol(vec3 d, float clouds){
  float y = max(d.y, 0.0);
  vec3 c = mix(vec3(0.55, 0.75, 0.95), vec3(0.12, 0.35, 0.85), pow(y, 0.5)) * 0.07;
  float k = max(dot(d, uSunAir), 0.0);
  c += vec3(1.0, 0.95, 0.85) * (pow(k, 300.0) * 6.0 + pow(k, 8.0) * 0.25);
  vec2 q = d.xz / (y + 0.12) * 0.9 + vec2(uKd.w * 0.01, 0.0);
  float cl = smoothstep(0.55, 0.8, fbm3(vec3(q, 1.7)));
  c = mix(c, vec3(0.95, 0.97, 1.0) * 0.8, cl * 0.8 * smoothstep(0.0, 0.15, y) * clouds);
  c *= uSun.w * 0.45;
  // at night: stars (hidden by cloud), and the moon
  float nt = uMisc.z;
  if (nt > 0.0){
    vec3 g = floor(d * 260.0);
    float st = step(0.9965, hash3(g)) * (0.4 + 0.6 * hash3(g + 7.0)) * smoothstep(0.02, 0.2, y) * (1.0 - cl * clouds);
    float mk = max(dot(d, MOON), 0.0);
    c += nt * (vec3(0.85, 0.9, 1.0) * st * 0.9 + vec3(0.9, 0.93, 1.0) * (step(0.99965, mk) * 3.0 + pow(mk, 40.0) * 0.08));
  }
  return c;
}
vec3 skyCol(vec3 d){ return skyCol(d, 1.0); }
// the sea from above at a point hit along dir, tt away, from hgt metres up: rgb, and how opaque it is
vec4 seaAbove(vec3 dir, vec3 hit, float tt, float hgt){
  float t = uKd.w;
  float near = 1.0 - smoothstep(hgt * 3.0 + 6.0, hgt * 30.0 + 80.0, tt);
  vec2 q = hit.xz * 0.3;
  float w = waves(q, t), gx = waves(q + vec2(0.06, 0.0), t) - w, gz = waves(q + vec2(0.0, 0.06), t) - w;
  vec3 n = normalize(vec3(-gx * 2.5 * near, 1.0, -gz * 2.5 * near));
  float cosI = max(dot(-dir, n), 0.0);
  float fres = 0.02 + 0.98 * pow(1.0 - cosI, 5.0);
  vec3 body = vec3(0.004, 0.02, 0.035) * uSun.w;
  vec3 r = reflect(dir, n);
  vec3 c = mix(body, skyCol(vec3(r.x, abs(r.y), r.z), 0.0), fres);
  float glit = 0.4 + 0.6 * smoothstep(0.3, 0.8, noise3(vec3(hit.xz * 1.5, t * 2.0)));
  c += vec3(1.0, 0.97, 0.9) * pow(max(dot(r, uSunAir), 0.0), 60.0) * 2.5 * uSun.w * glit;
  c += vec3(0.85, 0.9, 1.0) * pow(max(dot(r, MOON), 0.0), 40.0) * 0.9 * uMisc.z * glit;   // the moon's glade on the water
  c = mix(c, skyCol(normalize(vec3(dir.x, 0.02, dir.z))), smoothstep(hgt * 20.0 + 50.0, hgt * 300.0 + 2000.0, tt));
  return vec4(c, mix(0.6, 0.97, pow(1.0 - cosI, 2.0)));
}
`;

// ---- the water itself: its glow, the surface overhead with Snell's window, and shafts of sunlight
const FS_BG = GLSL_SCENE + GLSL_LIGHT + GLSL_SKY + `
uniform vec3 uRight, uUp, uFwd; uniform vec2 uTan;
in vec2 vUv; out vec4 o;
void main(){
  vec3 dir = normalize(uFwd + (vUv.x * 2.0 - 1.0) * uTan.x * uRight + (vUv.y * 2.0 - 1.0) * uTan.y * uUp);
  float t = uKd.w;
  float hgt = uCamFwd.w;
  if (hgt > 0.0){
    vec3 c = dir.y > 0.0 ? skyCol(dir) : seaAbove(dir, uCam.xyz + dir * (hgt / -dir.y), hgt / -dir.y, hgt).rgb;
    o = vec4(c, 1.0); return;
  }
  vec3 col = waterInf(dir);
  // shafts of sunlight, fanning down from the sun's direction, gone by about 120 m
  vec3 s = -uSunDir.xyz;
  float k = dot(dir, s);
  if (uSunDir.w > 0.0 || uCam.w < 140.0){
    vec3 a = normalize(cross(s, vec3(0.0, 0.0, 1.0))), b = cross(s, a);
    float ang = atan(dot(dir, b), dot(dir, a));
    float n = noise3(vec3(cos(ang) * 5.0, sin(ang) * 5.0, t * 0.12)) * 0.65 + noise3(vec3(cos(ang) * 13.0, sin(ang) * 13.0, t * 0.2)) * 0.35;
    float ray = smoothstep(0.62, 0.9, n) * smoothstep(0.0, 0.95, k) * smoothstep(140.0, 5.0, uCam.w);
    col += uSun.rgb * ray * 0.045 * (0.3 + 0.7 * k * k);
  }
  // the surface overhead: Snell's window, a soft bright disc gently rippled by the waves; outside it the surface mirrors the blue below.
  // Ripple detail fades with distance, so the far surface stays smooth instead of breaking into stripes.
  if (dir.y > 0.0 && uCam.w < 400.0){
    float d = max(uCam.w, 0.05), tt = d / dir.y;
    vec3 hit = uCam.xyz + dir * tt;
    float near = 1.0 - smoothstep(d * 1.5 + 2.0, d * 5.0 + 10.0, tt);
    vec2 q = hit.xz * 0.3;
    float w = waves(q, t);
    float gx = (waves(q + vec2(0.06, 0.0), t) - w) * near, gz = (waves(q + vec2(0.0, 0.06), t) - w) * near;
    float cosT = clamp(dir.y + (gx * dir.x + gz * dir.z) * 1.4, 0.0, 1.0);
    float win = smoothstep(0.6, 0.71, cosT);
    float glint = smoothstep(0.35, 0.9, noise3(vec3(hit.xz * 0.9, t * 0.5))) * near;
    float sunk = max(dot(dir, s), 0.0);
    vec3 skyL = vec3(0.72, 0.88, 1.0) * mix(0.13, 0.32, smoothstep(0.66, 1.0, cosT)) * (0.8 + 0.2 * w * near + 0.45 * glint)
              + vec3(1.0, 0.98, 0.92) * (2.5 * pow(sunk, 90.0) + 0.35 * pow(sunk, 10.0));
    vec3 refl = waterInf(vec3(dir.x, -dir.y, dir.z)) / max(uSun.rgb, 1e-6);
    float rim = smoothstep(0.57, 0.63, cosT) * (1.0 - smoothstep(0.63, 0.71, cosT));
    vec3 surf = mix(refl * (1.1 + 0.15 * w * near), skyL * uSun.w, win) + vec3(0.55, 0.8, 1.0) * rim * 0.25 * uSun.w;
    vec3 T = exp(clamp(uKd.rgb * d - uC.rgb * tt, -40.0, 8.0));
    vec3 Tv = exp(-uC.rgb * tt);
    col = uSun.rgb * surf * T + col * (1.0 - Tv);
  }
  o = vec4(col, 1.0);
}`;
const P_BG = program(VS_FULL, FS_BG, 'background');
function drawBackground() {
  const u = sceneProg(P_BG); if (!u) return;
  const A = ASCII, aspect = (A.cols * A.cw) / (A.rows * A.ch), ty = Math.tan(CAM.fov / 2);
  gl.uniform3fv(u.uRight, CAM.right); gl.uniform3fv(u.uUp, CAM.up); gl.uniform3fv(u.uFwd, CAM.fwd);
  gl.uniform2f(u.uTan, ty * aspect, ty);
  gl.uniform3fv(u.uSunAir, LIGHT.sunAir || [0, 1, 0]);
  drawFull();
}

// the surface as a see-through sheet when the camera is above it, so what is underneath shows faintly through
const VS_SEA = GLSL_SCENE + `
uniform vec2 uGridK;
layout(location = 0) in vec3 aPos;
out vec3 vRel; out float vW;
void main(){
  float r = uGridK.x * (pow(uGridK.y, aPos.z) - 1.0);
  vRel = vec3(aPos.x * r, -uCamFwd.w, aPos.y * r);
  gl_Position = uVP * vec4(vRel, 1.0); vW = gl_Position.w;
}`;
const FS_SEA = GLSL_SCENE + GLSL_LIGHT + GLSL_SKY + `
in vec3 vRel; in float vW; out vec4 o;
void main(){
  float tt = length(vRel);
  vec4 s = seaAbove(vRel / tt, uCam.xyz + vRel, tt, uCamFwd.w);
  o = vec4(s.rgb * s.a, s.a);
  gl_FragDepth = clamp(vW * uMisc.y, 0.0, 1.0);
}`;
const P_SEA = program(VS_SEA, FS_SEA, 'sea');
function drawSeaFromAbove() {
  const hgt = -CAM.pos[1]; if (hgt >= 0) return;
  const u = sceneProg(P_SEA); if (!u) return;
  const r0 = Math.max(0.02, -hgt * 0.03), rMax = 4000, q = Math.pow(rMax / r0, 1 / TER_RINGS);
  gl.uniform2f(u.uGridK, r0 / (q - 1), q);
  gl.uniform3fv(u.uSunAir, LIGHT.sunAir || [0, 1, 0]);
  gl.bindVertexArray(TER_VAO);
  gl.drawElements(gl.TRIANGLES, TER_COUNT, gl.UNSIGNED_INT, 0);
}

// ---- marine snow: the drifting flakes that fill all water, in boxes that wrap round the camera at two scales
const SNOW_N = 1400;
const VS_SNOW = GLSL_SCENE + `
uniform vec4 uBox;     // xyz: camera offset inside the box (m), w: box size (m)
uniform float uFade, uPx;
layout(location = 0) in vec4 aSeed;
out float vA; out vec3 vRel; out float vW;
void main(){
  float B = uBox.w;
  vec3 p = fract(aSeed.xyz - uBox.xyz / B) * B - 0.5 * B;
  float t = uKd.w;
  p += B * 0.01 * vec3(sin(t * 0.13 + aSeed.w * 40.0), sin(t * 0.07 + aSeed.x * 30.0), cos(t * 0.11 + aSeed.y * 50.0));
  vRel = p;
  float edge = 1.0 - smoothstep(0.32, 0.5, max(max(abs(p.x), abs(p.y)), abs(p.z)) / B);
  vA = edge * uFade * (0.4 + 0.6 * aSeed.w) * step(p.y, uCam.w - 0.05);   // (no snow above the water)
  gl_Position = uVP * vec4(p, 1.0); vW = gl_Position.w;
  float sz = uPx * B * 0.004 * (0.5 + aSeed.w) / max(gl_Position.w, 1e-6);
  vA *= smoothstep(0.7, 2.4, sz);
  gl_PointSize = clamp(sz, 1.0, 5.0);
}`;
const FS_SNOW = GLSL_SCENE + GLSL_LIGHT + `
in float vA; in vec3 vRel; in float vW;
out vec4 o;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0; if (dot(q, q) > 1.0) discard;
  float depth = -(uCam.y + vRel.y);
  vec3 Ld; vec3 lamp = lampAt(vRel, vec3(0.0, 1.0, 0.0), Ld);
  vec3 c = sunAt(depth) * 0.3 + lamp * 0.45 + glowAt(vRel, vec3(0.0)) * 0.8;
  vec3 T = exp(-uC.rgb * length(vRel));
  o = vec4(c * vA * T, 0.0);
  gl_FragDepth = clamp(vW * uMisc.y, 0.0, 1.0);
}`;
const P_SNOW = program(VS_SNOW, FS_SNOW, 'snow');
let SNOW_VAO = null;
{
  const r = rng(11), d = new Float32Array(SNOW_N * 4);
  for (let i = 0; i < d.length; i++) d[i] = r();
  SNOW_VAO = gl.createVertexArray(); gl.bindVertexArray(SNOW_VAO);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);
  gl.bindVertexArray(null);
}
function drawSnow(time) {
  if (!SET.snow) return;
  const u = sceneProg(P_SNOW); if (!u) return;
  const l2 = Math.log2(Math.max(CAM.scale, 1e-4) * 2.5), b0 = Math.floor(l2), fr = l2 - b0;
  const sink = time * 0.015;
  const pxH = ASCII.rows * SY;
  gl.uniform1f(u.uPx, pxH / Math.tan(CAM.fov / 2) * 0.5);
  gl.bindVertexArray(SNOW_VAO);
  for (const [k, f] of [[b0, 1 - fr], [b0 + 1, fr]]) {
    const B = Math.pow(2, k);
    const off = [CAM.pos[0], CAM.pos[1] + sink, CAM.pos[2]].map(v => v - Math.floor(v / B) * B);
    gl.uniform4f(u.uBox, off[0], off[1], off[2], B);
    gl.uniform1f(u.uFade, f * (CAM.depth > 0.3 ? 1 : 0));
    gl.drawArrays(gl.POINTS, 0, SNOW_N);
  }
}
