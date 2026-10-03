// deepatlas: the bundle's one scope opens here and closes in 99-main.js
(() => {
'use strict';

const $ = id => document.getElementById(id);
const canvas = $('view');
const gl = canvas.getContext('webgl2', { antialias:false, alpha:false, depth:false, stencil:false, premultipliedAlpha:false, preserveDrawingBuffer:false, powerPreference:'high-performance' });
if (!gl) { $('nogl').hidden = false; return; }
const HALF_FLOAT = !!gl.getExtension('EXT_color_buffer_float');
gl.getExtension('OES_texture_float_linear');
const PARALLEL = gl.getExtension('KHR_parallel_shader_compile');
gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);   // (the glyph atlas is one byte per pixel and any width)

// ---- small maths. Vectors are plain arrays; matrices are column-major Float32Arrays.
const PI = Math.PI, TAU = PI * 2;
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const fract = x => x - Math.floor(x);
const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vmul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const vmad = (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vlen = a => Math.hypot(a[0], a[1], a[2]);
const vnorm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const vlerp = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
// a direction from yaw (round the vertical) and pitch (up is positive)
const dirYP = (yaw, pitch) => [Math.cos(pitch) * Math.cos(yaw), Math.sin(pitch), Math.cos(pitch) * Math.sin(yaw)];
const yawOf = d => Math.atan2(d[2], d[0]);
const pitchOf = d => Math.asin(clamp(d[1] / (vlen(d) || 1), -1, 1));
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; };

function mat4() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; }
// a model matrix: translation t, rotation from the basis (fx forward, up, side) and a scale
function modelMat(out, t, fx, up, s) {
  const sz = vcross(fx, up);
  out[0] = fx[0] * s; out[1] = fx[1] * s; out[2] = fx[2] * s; out[3] = 0;
  out[4] = up[0] * s; out[5] = up[1] * s; out[6] = up[2] * s; out[7] = 0;
  out[8] = sz[0] * s; out[9] = sz[1] * s; out[10] = sz[2] * s; out[11] = 0;
  out[12] = t[0]; out[13] = t[1]; out[14] = t[2]; out[15] = 1;
  return out;
}
// a basis from a heading (yaw), pitch and roll: forward, up
function basisYPR(yaw, pitch, roll) {
  const f = dirYP(yaw, pitch);
  let side = vnorm(vcross(f, [0, 1, 0]));
  if (!isFinite(side[0])) side = [0, 0, 1];
  let up = vcross(side, f);
  if (roll) { const c = Math.cos(roll), s = Math.sin(roll); up = vadd(vmul(up, c), vmul(side, s)); }
  return [f, up];
}

// ---- deterministic hashing and noise, identical in JS and GLSL (integer hashing, no sin())
function hashU(x) {
  x = x >>> 0;
  x ^= x >>> 16; x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15; x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= x >>> 16; return x >>> 0;
}
const hash2i = (x, y) => hashU((Math.imul(x | 0, 1597334677) ^ hashU(y | 0)) >>> 0) / 4294967295;
const hash1 = n => hashU(n | 0) / 4294967295;
// value noise on an integer lattice: cell (ix, iz) and the position inside it (fx, fz)
function vnoiseCell(ix, iz, fx, fz) {
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10), uz = fz * fz * fz * (fz * (fz * 6 - 15) + 10);
  const a = hash2i(ix, iz), b = hash2i(ix + 1, iz), c = hash2i(ix, iz + 1), d = hash2i(ix + 1, iz + 1);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uz) * 2 - 1;
}
// a seeded random stream for building models
function rng(seed) { let s = hashU(seed * 7919 + 1); return () => (s = hashU(s + 0x9e3779b9)) / 4294967295; }

// ---- settings, kept on this device
const STORE = 'deepatlas.';
const load = (k, d) => { try { const v = localStorage.getItem(STORE + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(STORE + k, JSON.stringify(v)); } catch (e) {} };
const SET = Object.assign({
  detail:'1', travel:'quick', dwell:'normal', ts:1, fadeUI:'slow', time:'1', glow:true, labels:true, snow:true, shimmer:true, outline:true,
  subMark:false, palette:'true', sound:false, volume:0.6, clock:'0',
}, load('settings', {}));
const saveSettings = () => save('settings', SET);
// people who ask their system for less motion start with the water still (no shimmer) and the camera drifting more slowly;
// they can still turn the shimmer back on in settings
const CALM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
if (CALM && load('settings', null) == null) SET.shimmer = false;

// ---- WebGL helpers
const GLSL_HEAD = `#version 300 es
precision highp float;
precision highp int;
`;
function compile(type, src, name) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  return s;
}
const PROGS = [];
// a program compiles lazily; prog.ready() says whether it can be used yet (in the background where the GPU allows it)
function program(vs, fs, name) {
  const P = { name, vs, fs, p:null, u:{}, ok:false, failed:false, started:false };
  P.start = () => {
    if (P.started) return; P.started = true;
    const v = compile(gl.VERTEX_SHADER, GLSL_HEAD + vs, name), f = compile(gl.FRAGMENT_SHADER, GLSL_HEAD + GLSL_COMMON + fs, name);
    const p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f);
    gl.bindAttribLocation(p, 0, 'aPos'); gl.bindAttribLocation(p, 1, 'aNor'); gl.bindAttribLocation(p, 2, 'aCol'); gl.bindAttribLocation(p, 3, 'aAnim');
    gl.bindAttribLocation(p, 4, 'iA'); gl.bindAttribLocation(p, 5, 'iB');
    gl.linkProgram(p);
    P.p = p; P._v = v; P._f = f;
  };
  P.ready = () => {
    if (P.ok) return true; if (P.failed) return false;
    if (!P.started) P.start();
    if (PARALLEL && !gl.getProgramParameter(P.p, PARALLEL.COMPLETION_STATUS_KHR)) return false;
    if (!gl.getProgramParameter(P.p, gl.LINK_STATUS)) {
      P.failed = true;
      const log = (s, src) => { const l = gl.getShaderInfoLog(s); if (l) console.error(name, l, '\n', numbered(src, l)); };
      log(P._v, GLSL_HEAD + vs); log(P._f, GLSL_HEAD + GLSL_COMMON + fs);
      console.error(name, gl.getProgramInfoLog(P.p));
      return false;
    }
    const n = gl.getProgramParameter(P.p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(P.p, i); const nm = info.name.replace(/\[0\]$/, ''); P.u[nm] = gl.getUniformLocation(P.p, info.name); }
    P.ok = true; return true;
  };
  PROGS.push(P);
  return P;
}
function numbered(src, log) {
  const m = /0:(\d+)/.exec(log); if (!m) return '';
  const L = src.split('\n'), at = +m[1];
  return L.slice(Math.max(0, at - 4), at + 2).map((l, i) => (Math.max(0, at - 4) + i + 1) + ': ' + l).join('\n');
}
function useProg(P) { gl.useProgram(P.p); return P.u; }

function makeTex(w, h, fmt, filter, data) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  const F = { rgba8:[gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE], rgba16f:[gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT], r8:[gl.R8, gl.RED, gl.UNSIGNED_BYTE] }[fmt];
  gl.texImage2D(gl.TEXTURE_2D, 0, F[0], w, h, 0, F[1], F[2], data || null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter || gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter || gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}
function makeFBO(w, h, fmt, withDepth, filter) {
  const tex = makeTex(w, h, fmt, filter);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  let rb = null;
  if (withDepth) {
    rb = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT32F, w, h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fb, tex, rb, w, h, free() { gl.deleteFramebuffer(fb); gl.deleteTexture(tex); if (rb) gl.deleteRenderbuffer(rb); } };
}
const SCENE_FMT = HALF_FLOAT ? 'rgba16f' : 'rgba8';

// one full-screen triangle for the screen passes
const VS_FULL = `
out vec2 vUv;
void main(){ vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
const EMPTY_VAO = gl.createVertexArray();
function drawFull() { gl.bindVertexArray(EMPTY_VAO); gl.drawArrays(gl.TRIANGLES, 0, 3); }

// ---- GLSL shared by every fragment shader: the same hash and noise as hashU / vnoiseCell above
const GLSL_COMMON = `
uint hashU(uint x){ x ^= x >> 16u; x *= 0x7feb352du; x ^= x >> 15u; x *= 0x846ca68bu; x ^= x >> 16u; return x; }
float hash2i(ivec2 p){ return float(hashU(uint(p.x) * 1597334677u ^ hashU(uint(p.y)))) / 4294967295.0; }
float hash1i(int n){ return float(hashU(uint(n))) / 4294967295.0; }
float vnoiseCell(ivec2 c, vec2 f){
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash2i(c), b = hash2i(c + ivec2(1, 0)), d = hash2i(c + ivec2(0, 1)), e = hash2i(c + ivec2(1, 1));
  return mix(mix(a, b, u.x), mix(d, e, u.x), u.y) * 2.0 - 1.0;
}
// float noise for patterns that need no exact match with JS
float hash3(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float noise3(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a * noise3(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
`;
