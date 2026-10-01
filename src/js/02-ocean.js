// ---- the ocean: how light moves through water, and the shape of the seafloor
//
// World units are metres. y is up, so a depth d is y = -d. x runs offshore, z along the coast.

// Clear open-ocean water (roughly Jerlov type I), per colour channel red, green, blue:
// KD: how fast downwelling sunlight fades with depth (1/m): red is gone by ~10 m, green by ~80 m, blue lasts past 200 m.
// BEAM: how fast light fades along a line of sight (1/m), always more than KD: it sets how far you can see.
// SCAT: how much light the water scatters towards the eye (display units), the blue glow of open water.
const KD = [0.35, 0.062, 0.026];
const BEAM = [0.09, 0.05, 0.034];   // (red fades along a line of sight a little faster than blue; the depth itself takes red out via KD)
const SCAT = [0.00016, 0.00048, 0.00085];   // (an azure tint: light blue, a little green)
const SUN_WHITE = [1.0, 0.96, 0.9];
const MOON_WHITE = [0.62, 0.74, 1.0];
const ZONES = [
  { name:'sunlight zone', from:0, to:200, sci:'epipelagic' },
  { name:'twilight zone', from:200, to:1000, sci:'mesopelagic' },
  { name:'midnight zone', from:1000, to:4000, sci:'bathypelagic' },
  { name:'the abyss', from:4000, to:6000, sci:'abyssopelagic' },
  { name:'the trenches', from:6000, to:11000, sci:'hadal zone' },
];
const zoneOf = d => ZONES.find(z => d < z.to) || ZONES[ZONES.length - 1];
const MAX_DEPTH = 10935;

// ---- the seafloor: a continental margin, compressed. Depths are real; the horizontal layout is not.
// (x offshore in metres, depth in metres)
const PROFILE = [
  [-3000, -2], [0, 0.6], [150, 2], [400, 3.6], [800, 5.2], [1300, 7], [1800, 13], [2400, 22], [3200, 32], [5000, 60], [7500, 120], [10000, 190],
  [11200, 330], [13000, 800], [15500, 1400], [18500, 2000], [21500, 2550], [24500, 3100], [27500, 3700], [30000, 4050], [35000, 4500],
  [45000, 4900], [55000, 5300], [63000, 5800], [69000, 6500], [74000, 7600], [78000, 8600], [81500, 9800], [83500, 10700], [84500, 10935],
  [85500, 10800], [88000, 9200], [92000, 7200], [98000, 6000], [110000, 5200], [200000, 5000],
];
function profileDepth(x) {
  const P = PROFILE, n = P.length;
  if (x <= P[0][0]) return P[0][1];
  if (x >= P[n - 1][0]) return P[n - 1][1];
  let i = 0; while (i < n - 2 && x > P[i + 1][0]) i++;
  const x0 = P[i][0], x1 = P[i + 1][0], y0 = P[i][1], y1 = P[i + 1][1];
  const m0 = i > 0 ? (y1 - P[i - 1][1]) / (x1 - P[i - 1][0]) : (y1 - y0) / (x1 - x0);
  const m1 = i < n - 2 ? (P[i + 2][1] - y0) / (P[i + 2][0] - x0) : (y1 - y0) / (x1 - x0);
  const dx = x1 - x0, t = (x - x0) / dx, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * dx * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * dx * m1;
}
// how rough the floor is at x, in four bands of scale (1 km .. 250 m, 128 .. 32 m, 16 .. 4 m, 2 .. 0.5 m)
function roughness(x) {
  const reef = smooth(60, 300, x) * (1 - smooth(1500, 2000, x));
  const kelp = smooth(1700, 2200, x) * (1 - smooth(3400, 4200, x));
  const shelf = smooth(1500, 2000, x) * (1 - smooth(9000, 11000, x));
  const slope = smooth(9500, 11500, x) * (1 - smooth(28000, 32000, x));
  const plain = smooth(28000, 32000, x) * (1 - smooth(66000, 70000, x));
  const trench = smooth(66000, 70000, x);
  return [
    reef * 1.0 + shelf * 3 + slope * 140 + plain * 70 + trench * 260,
    reef * 2.4 + shelf * 1.2 + kelp * 2.0 + slope * 30 + plain * 6 + trench * 70,
    reef * 0.9 + shelf * 0.35 + kelp * 1.4 + slope * 7 + plain * 0.6 + trench * 12,
    reef * 0.12 + shelf * 0.05 + kelp * 0.15 + slope * 0.35 + plain * 0.07 + trench * 0.6,
  ];
}
// one octave of lattice noise at frequency 2^k per 1024 m
function octave(x, z, k) {
  const s = Math.pow(2, k) / 1024, X = x * s, Z = z * s, ix = Math.floor(X), iz = Math.floor(Z);
  return vnoiseCell(ix, iz, X - ix, Z - iz);
}
const OCT_W = [0.5, 0.3, 0.2];
// flat ground where a wreck or a colony lies: [x, z, radius]; the floor there is the profile's depth at the middle, its bumps mostly smoothed
const PADS = [[28100, -400, 170], [25500, 500, 45], [21500, -300, 40], [45000, 0, 60], [84500, 0, 70], [12600, -900, 45], [40000, 3200, 70]];
// seamounts: extinct volcanoes rising from the abyss, [x, z, height, radius]; the floor is lifted by a rounded, ribbed cone
const SEAMOUNTS = [[40000, 3200, 3800, 2600]];
function seamountAt(x, z) {
  let h = 0;
  for (const [sx, sz, sh, sr] of SEAMOUNTS) {
    const dx = x - sx, dz = z - sz, r = Math.hypot(dx, dz) / sr;
    if (r > 3) continue;
    const rib = 1 + 0.06 * Math.sin(Math.atan2(dz, dx) * 7 + r * 5);
    h += sh * Math.exp(-r * r * 1.2) * rib;
  }
  return h;
}
const PAD_D = PADS.map(p => profileDepth(p[0]) - seamountAt(p[0], p[1]));   // (a pad on a seamount sits at the seamount's height)
function padAt(x, z) {
  let w = 0, d = 0;
  PADS.forEach((p, i) => { const k = smooth(p[2], p[2] * 0.45, Math.hypot(x - p[0], z - p[1])); if (k > w) { w = k; d = PAD_D[i]; } });
  return [w, d];
}
// the depth of the floor at (x, z), the same sum the terrain shader makes
function floorDepth(x, z) {
  const R = roughness(x);
  let h = 0;
  for (let b = 0; b < 4; b++) {
    if (R[b] < 1e-4) continue;
    let s = 0;
    for (let j = 0; j < 3; j++) s += octave(x, z, b * 3 + j) * OCT_W[j];
    h += s * R[b];
  }
  const [w, pd] = padAt(x, z);
  return Math.max(0.4, lerp(profileDepth(x) - h - seamountAt(x, z), pd - h * 0.2, w));
}
const floorY = (x, z) => -floorDepth(x, z);

// the same in GLSL. Positions arrive split: a 1024 m cell (exact integers) and a local offset in it, so cm-scale detail works 100 km out.
const GLSL_FLOOR = `
const int NPROF = ${PROFILE.length};
const vec2 PROF[NPROF] = vec2[NPROF](${PROFILE.map(p => `vec2(${p[0].toFixed(1)}, ${p[1].toFixed(2)})`).join(',')});
float profileDepth(float x){
  if (x <= PROF[0].x) return PROF[0].y;
  if (x >= PROF[NPROF - 1].x) return PROF[NPROF - 1].y;
  int i = 0; for (int k = 0; k < NPROF - 2; k++){ if (x > PROF[k + 1].x) i = k + 1; }
  vec2 a = PROF[i], b = PROF[i + 1];
  vec2 pa = i > 0 ? PROF[i - 1] : a, pb = i < NPROF - 2 ? PROF[i + 2] : b;
  float m0 = i > 0 ? (b.y - pa.y) / (b.x - pa.x) : (b.y - a.y) / (b.x - a.x);
  float m1 = i < NPROF - 2 ? (pb.y - a.y) / (pb.x - a.x) : (b.y - a.y) / (b.x - a.x);
  float dx = b.x - a.x, t = (x - a.x) / dx, t2 = t * t, t3 = t2 * t;
  return (2.0 * t3 - 3.0 * t2 + 1.0) * a.y + (t3 - 2.0 * t2 + t) * dx * m0 + (-2.0 * t3 + 3.0 * t2) * b.y + (t3 - t2) * dx * m1;
}
float sm(float a, float b, float x){ return smoothstep(a, b, x); }
vec4 roughness(float x){
  float reef = sm(60.0, 300.0, x) * (1.0 - sm(1500.0, 2000.0, x));
  float kelp = sm(1700.0, 2200.0, x) * (1.0 - sm(3400.0, 4200.0, x));
  float shelf = sm(1500.0, 2000.0, x) * (1.0 - sm(9000.0, 11000.0, x));
  float slope = sm(9500.0, 11500.0, x) * (1.0 - sm(28000.0, 32000.0, x));
  float plain = sm(28000.0, 32000.0, x) * (1.0 - sm(66000.0, 70000.0, x));
  float trench = sm(66000.0, 70000.0, x);
  return vec4(reef * 1.0 + shelf * 3.0 + slope * 140.0 + plain * 70.0 + trench * 260.0,
              reef * 2.4 + shelf * 1.2 + kelp * 2.0 + slope * 30.0 + plain * 6.0 + trench * 70.0,
              reef * 0.9 + shelf * 0.35 + kelp * 1.4 + slope * 7.0 + plain * 0.6 + trench * 12.0,
              reef * 0.12 + shelf * 0.05 + kelp * 0.15 + slope * 0.35 + plain * 0.07 + trench * 0.6);
}
float octave(ivec2 cell, vec2 L, int k){
  float s = float(1 << k) / 1024.0;
  vec2 X = L * s, f = floor(X);
  return vnoiseCell(cell * (1 << k) + ivec2(f), X - f);
}
const int NSM = ${SEAMOUNTS.length};
const vec4 SM[NSM] = vec4[NSM](${SEAMOUNTS.map(s => `vec4(${s.map(v => v.toFixed(1)).join(', ')})`).join(',')});
float seamountAt(float x, float z){
  float h = 0.0;
  for (int i = 0; i < NSM; i++){
    vec2 d = vec2(x, z) - SM[i].xy; float r = length(d) / SM[i].w;
    if (r > 3.0) continue;
    float rib = 1.0 + 0.06 * sin(atan(d.y, d.x) * 7.0 + r * 5.0);
    h += SM[i].z * exp(-r * r * 1.2) * rib;
  }
  return h;
}
const int NPADS = ${PADS.length};
const vec3 PADS[NPADS] = vec3[NPADS](${PADS.map(p => `vec3(${p[0].toFixed(1)}, ${p[1].toFixed(1)}, ${p[2].toFixed(1)})`).join(',')});
const float PAD_D[NPADS] = float[NPADS](${PAD_D.map(d => d.toFixed(3)).join(',')});
vec2 padAt(float x, float z){
  float w = 0.0, d = 0.0;
  for (int i = 0; i < NPADS; i++){ float k = smoothstep(PADS[i].z, PADS[i].z * 0.45, length(vec2(x, z) - PADS[i].xy)); if (k > w){ w = k; d = PAD_D[i]; } }
  return vec2(w, d);
}
// the floor depth at the split position (cell, L); xAbs is the plain float x for the smooth profile
float floorDepth(ivec2 cell, vec2 L, float xAbs, int bands){
  vec4 R = roughness(xAbs);
  float h = 0.0;
  for (int b = 0; b < 4; b++){
    if (b >= bands) break;
    float r = R[b]; if (r < 1e-4) continue;
    h += r * (octave(cell, L, b * 3) * 0.5 + octave(cell, L, b * 3 + 1) * 0.3 + octave(cell, L, b * 3 + 2) * 0.2);
  }
  return max(0.4, profileDepth(xAbs) - h);
}
`;

// ---- light at the camera's depth, for the time of day
const LIGHT = { level:1, sun:[1, 1, 1], lamp:0, night:0, sunDir:[0.25, -1, 0.1], surf:1, caustic:1 };
// how bright the scene is drawn at depth d: the view adapts like an eye, down to the end of sunlight near 1,000 m
function dispLevel(d) { return Math.exp(-d / 300) * smooth(1250, 600, d); }
const LIGHT_SURF_DAY = s => clamp((s - 0.1) / 0.9, 0, 1);
function updateLight(depth, tod) {
  // the sun: up from 6:00 to 18:00, highest at noon (a tropical sea)
  const h = tod / 60, elev = Math.sin((h - 6) / 12 * PI);
  const day = smooth(-0.08, 0.25, elev), night = 1 - day;
  const tint = vlerp(MOON_WHITE, vlerp([1.0, 0.72, 0.5], SUN_WHITE, smooth(0.0, 0.45, elev)), day);
  const surf = lerp(0.1, 1.0, day) * lerp(0.75, 1.0, smooth(0.1, 0.6, elev));   // adapted: dawn and dusk are dimmer, night is dark but seen
  const dNight = depth * lerp(2.2, 1, day);   // at night the light runs out far sooner
  const level = surf * dispLevel(dNight) * lerp(1.05, 2.0, smooth(5, 160, depth));   // (bright shallows need less exposure than the dim deep)
  const sun = [0, 1, 2].map(i => tint[i] * Math.exp(-(KD[i] - KD[2]) * Math.min(depth, 3000)) * level);
  LIGHT.level = level; LIGHT.sun = sun; LIGHT.night = night; LIGHT.surf = surf;
  LIGHT.lamp = smooth(0.8, 0.12, level);   // the lamps come on through the twilight zone
  // the eye adapts to the colour of the light, as a diver's does (or a camera's white balance): most of the blue cast is taken back out,
  // but never by more than 8x, so in the shallows a clownfish is orange and by 20 m or so red is simply gone. Not at all once the lamps light the view.
  const k = SET.palette === 'vivid' ? 1.0 : 0.9, cap = SET.palette === 'vivid' ? 18 : 12;
  LIGHT.wbK = k; LIGHT.wbCap = cap;
  // the dark between the characters: a pale sea blue near the surface, deep navy below, never black
  const sh = smooth(1200, 0, dNight);
  const lt = sh * LIGHT_SURF_DAY(surf);
  ASCII.void = [lerp(0.008, 0.05, lt), lerp(0.022, 0.13, lt), lerp(0.05, 0.22, lt)];
  // the sun's direction below the surface: refracted, so never lower than 48.6 degrees from straight down
  const az = 0.6, zen = Math.acos(clamp(Math.max(elev, 0.05), 0, 1));
  const zw = Math.asin(Math.sin(zen) / 1.333);
  LIGHT.sunDir = vnorm([Math.sin(zw) * Math.cos(az), -Math.cos(zw), Math.sin(zw) * Math.sin(az)]);
  LIGHT.caustic = day * smooth(40, 2, depth) * smooth(0.05, 0.4, elev);
  // the sun in the sky (not refracted), for the view above the water
  const zs = Math.acos(clamp(Math.max(elev, 0.04), 0, 1));
  LIGHT.sunAir = [Math.sin(zs) * Math.cos(az), Math.cos(zs), Math.sin(zs) * Math.sin(az)];
}

// ---- the uniform block every scene shader shares
const GLSL_SCENE = `
layout(std140) uniform Scene {
  mat4 uVP;          // projection x view rotation; positions arrive relative to the camera
  vec4 uCam;         // xyz: camera world position wrapped to 4096 m (for patterns), w: camera depth (m)
  vec4 uSun;         // rgb: sunlight at the camera's depth in display units, w: surface light level
  vec4 uSunDir;      // xyz: the direction sunlight travels, w: caustics strength
  vec4 uKd;          // rgb: sunlight attenuation per metre, w: time (s)
  vec4 uC;           // rgb: line-of-sight attenuation per metre, w: unused
  vec4 uScat;        // rgb: water's scattered glow, w: aspect
  vec4 uLamp;        // rgb: lamp colour x strength, w: the distance the lamp is set for (m)
  vec4 uLampDir;     // xyz: the lamp's aim, w: cone
  vec4 uMisc;        // x: bioluminescence, y: 1/far (depth), z: night, w: view scale (m)
  vec4 uTerr;        // xy: camera x, z inside its 1024 m cell; zw: camera x, z (plain floats)
  ivec4 uTerrCell;   // xy: the camera's 1024 m cell
  vec4 uCamFwd;      // xyz: camera forward, w: height above the sea (0 underwater)
  vec4 uGLp[4];      // living lights: xyz position relative to the camera, w: reach (m)
  vec4 uGLc[4];      // their colour x strength; w: 1 when in use
};
`;

const GLSL_LIGHT = `
// sunlight reaching depth d (display units)
vec3 sunAt(float d){ return uSun.rgb * exp(clamp(-uKd.rgb * (max(d, 0.0) - uCam.w), -40.0, 40.0)); }
// the glow of open water seen along dir (to infinity) from the camera's depth
vec3 waterInf(vec3 dir){
  vec3 L = uScat.rgb * uSun.rgb / max(uC.rgb - uKd.rgb * dir.y, 0.008);
  return L * (1.0 + 0.6 * max(dir.y, 0.0));
}
vec3 fogMix(vec3 col, vec3 rel){
  float d = length(rel);
  if (uCamFwd.w > 0.0){
    // looking from the air: only the part of the sight line below the surface is hazed by water
    float py = rel.y + uCamFwd.w;   // (the point's height above the sea)
    if (py >= 0.0) return col;
    d *= -py / max(-rel.y, 1e-6);
  }
  vec3 T = exp(-uC.rgb * d);
  return col * T + waterInf(rel / max(d, 1e-9)) * (1.0 - T);
}
// caustics: the bright net that surface waves focus onto anything shallow (moving cells, their edges lit)
vec2 cHash(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
float cellEdge(vec2 p, float t){
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 g = vec2(x, y), h = cHash(i + g);
    vec2 r = g + 0.5 + 0.42 * sin(t * (0.6 + h * 0.5) + 6.2831 * h) - f;
    float d = dot(r, r);
    if (d < d1){ d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return sqrt(d2) - sqrt(d1);
}
float caustic(vec2 xz, float t){
  float a = cellEdge(xz * 0.9, t * 1.1), b = cellEdge(xz * 1.7 + 3.1, t * 1.4);
  return pow(1.0 - smoothstep(0.0, 0.22, a), 3.0) * 0.7 + pow(1.0 - smoothstep(0.0, 0.18, b), 3.0) * 0.45;
}
// the lamps: a submersible's floodlights at the camera, set for the distance being looked at
vec3 lampAt(vec3 rel, vec3 N, out vec3 Ldir){
  float r = length(rel);
  Ldir = -rel / max(r, 1e-9);
  if (uLamp.w <= 0.0 || dot(uLamp.rgb, vec3(1.0)) <= 0.0) return vec3(0.0);
  float D = uLamp.w;
  float fall = pow(D / max(r, D * 0.8), 2.0);
  float cone = mix(0.25, 1.0, smoothstep(uLampDir.w, 1.0, dot(-Ldir, uLampDir.xyz)));
  vec3 ab = exp(-uC.rgb * (min(r, 3.0) * 0.7 + max(r - D, 0.0) * 2.0));
  return uLamp.rgb * fall * cone * ab;
}
// the light of living things (a lure, a searchlight, a sub's floodlights): N may be zero for points that face every way
vec3 glowAt(vec3 rel, vec3 N){
  vec3 c = vec3(0.0);
  for (int i = 0; i < 4; i++){
    float R = uGLp[i].w; if (R <= 0.0) continue;
    vec3 d = uGLp[i].xyz - rel; float r2 = dot(d, d), r = sqrt(r2);
    float fall = R * R / (r2 + R * R * 0.05);
    float nl = dot(N, N) > 0.0 ? max(dot(N, d / max(r, 1e-9)), 0.0) * 0.85 + 0.15 : 1.0;
    c += uGLc[i].rgb * fall * nl * exp(-uC.rgb * r);
  }
  return c;
}
// light on a surface: rel from the camera, normal N, albedo, the surface's depth; returns lit colour
vec3 shade(vec3 rel, vec3 N, vec3 alb, float depth, float spec){
  vec3 E = sunAt(depth);
  float ndl = max(dot(N, -uSunDir.xyz), 0.0);
  // light from the sun's direction, plus the water's own glow from every side: brightest from above, faint from below
  float up = 0.5 + 0.5 * N.y;
  vec3 c = E * (ndl * 0.8 + mix(0.16, 0.62, up));
  if (uSunDir.w > 0.0){
    vec3 wp = uCam.xyz + rel;
    float k = caustic(wp.xz + wp.y * 0.2, uKd.w) * uSunDir.w * max(N.y, 0.0) * exp(-max(depth, 0.0) * 0.04);
    c += E * k * 0.45;
  }
  vec3 Ld; vec3 lamp = lampAt(rel, N, Ld);
  float nl = max(dot(N, Ld), 0.0);
  c += lamp * (nl * 1.1 + 0.15);
  c += glowAt(rel, N);
  vec3 col = alb * c;
  col += lamp * spec * pow(nl, 40.0) * 0.6;
  // sunlight glancing off wet skin and silver scales
  vec3 V = -rel / max(length(rel), 1e-9);
  col += E * spec * pow(max(dot(reflect(uSunDir.xyz, N), V), 0.0), 12.0) * 0.8;
  return col;
}
`;
