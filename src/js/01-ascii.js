// ---- the ASCII pipeline: scene (HDR) -> one glyph and one colour per cell -> glyphs from a font atlas, over a soft glow

// the font size of a cell, per detail level (CSS px): ultra, fine, normal, bold
const DETAIL_PX = [7.5, 9.5, 12, 15.5];
const SX = 4, SY = 6;   // scene samples per cell, across and down
const ASCII = { wb:[1, 1, 1], cols:0, rows:0, cw:0, ch:0, W:0, H:0, dpr:1, fontPx:0, scene:null, cell:null, glowA:null, glowB:null, atlas:null, lut:null, glyphs:'', ink:[], dir:[0, 0, 0, 0], fontReady:false };

// the characters the ramp may use; the ramp is chosen from them by measured ink
// the ramp, faint to dense; each is kept only if it really adds ink over the one before (measured in the page font)
const RAMP_CAND = ".`':;+=*cosaeO0%#8&@";
const DIR_GLYPHS = ['-', '/', '|', '\\'];

function buildAtlas() {
  const A = ASCII, cw = A.cw, ch = A.ch;
  const chars = [' ', ...new Set((RAMP_CAND + DIR_GLYPHS.join('')).split(''))];
  const cv = document.createElement('canvas');
  cv.width = cw * chars.length; cv.height = ch;
  const g = cv.getContext('2d', { willReadFrequently:true });
  g.clearRect(0, 0, cv.width, cv.height);
  g.fillStyle = '#fff';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `${500} ${A.fontPx * A.dpr}px ${A.fontReady ? '"IBM Plex Mono",' : ''}ui-monospace,Menlo,Consolas,monospace`;
  chars.forEach((c, i) => g.fillText(c, (i + 0.5) * cw, ch * 0.54));
  const px = g.getImageData(0, 0, cv.width, cv.height).data;
  const ink = chars.map((c, i) => {
    let s = 0;
    for (let y = 0; y < ch; y++) for (let x = i * cw; x < (i + 1) * cw; x++) s += px[(y * cv.width + x) * 4 + 3];
    return s / (cw * ch * 255);
  });
  // the ramp: by ink, keeping a glyph only when it adds a clear step over the one before (near-equal heavy glyphs read as confetti)
  const cand = [' ', ...RAMP_CAND].map(c => ({ c, i:chars.indexOf(c), k:ink[chars.indexOf(c)] }));
  const kmax = Math.max(...cand.map(o => o.k));
  const ramp = [cand[0]];
  for (const o of cand) if (o.k - ramp[ramp.length - 1].k > kmax * 0.022) ramp.push(o);
  // the brightness lookup: 256 levels -> the glyph whose ink is nearest the brightness wanted
  const lut = new Uint8Array(256 * 4);
  for (let j = 0; j < 256; j++) {
    const want = Math.pow(j / 255, 1.0) * kmax;
    let best = ramp[0], bd = 1e9;
    for (const o of ramp) { const d = Math.abs(o.k - want); if (d < bd) { bd = d; best = o; } }
    if (want < ramp[1].k * 0.85) best = ramp[0];   // the faintest light rounds down to nothing, so dark water stays dark
    lut[j * 4] = best.i; lut[j * 4 + 1] = Math.round(best.k / kmax * 255); lut[j * 4 + 2] = 0; lut[j * 4 + 3] = 255;
  }
  if (A.atlas) gl.deleteTexture(A.atlas);
  if (A.lut) gl.deleteTexture(A.lut);
  A.atlas = makeTex(cv.width, ch, 'r8', gl.NEAREST, alphaOnly(px, cv.width * ch));
  A.lut = makeTex(256, 1, 'rgba8', gl.NEAREST, lut);
  A.glyphs = chars.join('');
  A.ink = ink.map(k => k / kmax);
  A.dir = DIR_GLYPHS.map(c => chars.indexOf(c));
  A.ramp = ramp.map(o => o.c).join('');
}
function alphaOnly(rgba, n) { const a = new Uint8Array(n); for (let i = 0; i < n; i++) a[i] = rgba[i * 4 + 3]; return a; }

// sizes everything to the window; returns true when the grid changed
function asciiResize(force) {
  const A = ASCII;
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const fontPx = DETAIL_PX[+SET.detail] || DETAIL_PX[1];
  const W = Math.max(16, Math.round(innerWidth * dpr)), H = Math.max(16, Math.round(innerHeight * dpr));
  const cw = Math.max(3, Math.round(fontPx * 0.6 * dpr)), ch = Math.max(6, Math.round(fontPx * 1.18 * dpr));
  const cols = Math.ceil(W / cw), rows = Math.ceil(H / ch);
  const fontChanged = force || fontPx !== A.fontPx || dpr !== A.dpr || cw !== A.cw || ch !== A.ch;
  if (!fontChanged && cols === A.cols && rows === A.rows && W === A.W && H === A.H) return false;
  Object.assign(A, { dpr, fontPx, W, H, cw, ch, cols, rows });
  canvas.width = W; canvas.height = H;
  if (fontChanged || !A.atlas) buildAtlas();
  for (const k of ['scene', 'cell', 'glowA', 'glowB']) if (A[k]) A[k].free();
  A.scene = makeFBO(cols * SX, rows * SY, SCENE_FMT, true, gl.LINEAR);
  A.cell = makeFBO(cols, rows, 'rgba8', false, gl.NEAREST);
  const gw = Math.max(1, Math.ceil(cols / 2)), gh = Math.max(1, Math.ceil(rows / 2));
  A.glowA = makeFBO(gw, gh, SCENE_FMT, false, gl.LINEAR);
  A.glowB = makeFBO(gw, gh, SCENE_FMT, false, gl.LINEAR);
  return true;
}

const FS_CELL = `
uniform sampler2D uScene, uLut;
uniform ivec2 uSamp;            // samples per cell
uniform float uTime, uShimmer, uOutline, uVivid, uMono;
uniform vec4 uDir;              // glyph indices of the four edge glyphs: flat, rising, upright, falling
uniform vec2 uCellAspect;       // cell width, height in device px
uniform vec3 uWB;               // the eye's adaptation to the colour of the light
in vec2 vUv; out vec4 o;
// how bright light looks: luma, but saturated blue (the only light left below ~150 m) is not allowed to count for almost nothing
float seeL(vec3 c){ return max(luma(c), 0.42 * max(max(c.r, c.g), c.b)); }
float bright(float L){ return clamp(pow(1.0 - exp(-2.4 * L), 0.8), 0.0, 1.0); }
void main(){
  ivec2 cell = ivec2(gl_FragCoord.xy);
  ivec2 base = cell * uSamp;
  vec3 sum = vec3(0.0);
  float lL = 0.0, lR = 0.0, lB = 0.0, lT = 0.0, lmax = 0.0, lmin = 1e9, nLit = 0.0;
  int hx = uSamp.x / 2, hy = uSamp.y / 2;
  for (int j = 0; j < 8; j++){ if (j >= uSamp.y) break;
    for (int i = 0; i < 8; i++){ if (i >= uSamp.x) break;
      vec3 c = max(texelFetch(uScene, base + ivec2(i, j), 0).rgb, 0.0) * uWB;
      float l = bright(seeL(c));
      sum += c; lmax = max(lmax, l); lmin = min(lmin, l); nLit += step(0.12, l);
      if (i < hx) lL += l; else lR += l;
      if (j < hy) lB += l; else lT += l;
    }
  }
  float n = float(uSamp.x * uSamp.y);
  vec3 c = sum / n;
  float L = seeL(c);
  float b = bright(L);
  // shimmer: faint haze is dithered by a soft pattern that drifts slowly, so dim water glitters gently instead of sitting in flat bands
  float hs = hash2i(cell);
  float h = noise3(vec3(vec2(cell) * vec2(0.23, 0.41), uTime * 0.35)) * 0.75 + hs * 0.25;
  float dAmp = mix(0.07, 0.025, smoothstep(0.05, 0.4, b));
  b = clamp(b + (mix(hs, h, uShimmer) - 0.5) * dAmp, 0.0, 1.0);
  vec4 lut = texelFetch(uLut, ivec2(int(b * 255.0 + 0.5), 0), 0);
  float g = lut.r * 255.0, ink = max(lut.g, 0.08);
  // silhouettes: a strong step across the cell picks a glyph along the edge
  float half_ = n * 0.5;
  float gx = (lR - lL) / half_ / uCellAspect.x, gy = (lT - lB) / half_ / uCellAspect.y;
  float gm = length(vec2(gx, gy)) * uCellAspect.y;
  float contrast = lmax - lmin;
  // (a real edge lights a whole half of the cell; a lone speck of snow does not)
  float hiHalf = max(max(lL, lR), max(lB, lT)) / half_;
  bool shape = nLit >= n * 0.3 && nLit <= n * 0.8;   // (a shape's edge crosses the cell: neither a lone speck nor a filled cell)
  if (uOutline > 0.5 && gm > 0.55 && contrast > 0.45 && b > 0.14 && b < 0.75 && hiHalf > 0.65 * lmax && shape){
    float a = atan(gy, gx) + 1.5707963;   // the edge runs across the gradient
    a = mod(a, 3.14159265);
    int k = int(floor(a / 0.7853982 + 0.5)) % 4;
    g = k == 0 ? uDir.x : k == 1 ? uDir.y : k == 2 ? uDir.z : uDir.w;
    ink = 0.3;
  }
  if (b < 0.012) g = 0.0;
  // colour: the cell's hue at full strength, scaled so the glyph's ink gives the brightness wanted
  float m = max(max(c.r, c.g), c.b);
  vec3 chroma = m > 1e-6 ? c / m : vec3(0.0);
  float sat = mix(1.0, 1.35, uVivid);
  chroma = clamp(mix(vec3(dot(chroma, vec3(0.333))), chroma, sat), 0.0, 1.0);
  chroma = mix(chroma, vec3(0.55, 0.85, 1.0), uMono);
  // faint light reads as pale sea blue rather than a saturated one: a lighter mood
  chroma = mix(chroma, vec3(0.62, 0.84, 1.0), 0.35 * (1.0 - smoothstep(0.1, 0.45, b)) * (1.0 - uMono));
  float I = clamp(b / ink, 0.35, 1.0);
  // very bright cells wash towards white, as an overexposed photo does
  vec3 col = mix(chroma * I, vec3(1.0), smoothstep(0.85, 1.0, b) * 0.35);
  o = vec4(col, g / 255.0);
}`;

// the glow source: the cells' light, blurred twice at half the grid
// the glow: the scene's light above a threshold, blurred at half the grid (first pass across, from the scene; second down)
const FS_GLOW = `
uniform sampler2D uSrc; uniform vec2 uDir; uniform int uFirst; uniform vec3 uWB; uniform float uGlowOn, uBack;
in vec2 vUv; out vec4 o;
// the light above a threshold (the glow), plus a little of all of it (a soft backdrop behind the characters, so water reads as water)
vec3 src(vec2 uv){
  vec3 c = max(texture(uSrc, uv).rgb, 0.0) * uWB;
  float L = max(luma(c), 0.42 * max(max(c.r, c.g), c.b)), b = 1.0 - exp(-1.6 * L);
  return c / max(L, 1e-5) * max(b - 0.18, 0.0) * uGlowOn + min(c, vec3(0.3)) * uBack;
}
void main(){
  vec3 s = vec3(0.0); float w = 0.0;
  for (int i = -6; i <= 6; i++){
    float k = exp(-float(i * i) / 14.0);
    vec2 uv = vUv + uDir * float(i);
    vec3 c = uFirst == 1 ? src(uv) : texture(uSrc, uv).rgb;
    s += c * k; w += k;
  }
  o = vec4(s / w, 1.0);
}`;

const FS_FINAL = `
uniform sampler2D uCell, uAtlas, uGlow;
uniform ivec2 uCellPx, uOff, uGrid;
uniform float uGlowAmt;
uniform vec3 uVoid;
in vec2 vUv; out vec4 o;
void main(){
  ivec2 p = ivec2(gl_FragCoord.xy) + uOff;
  ivec2 cell = p / uCellPx;
  ivec2 loc = p - cell * uCellPx;
  vec4 cd = texelFetch(uCell, cell, 0);
  int g = int(cd.a * 255.0 + 0.5);
  float a = g == 0 ? 0.0 : texelFetch(uAtlas, ivec2(g * uCellPx.x + loc.x, uCellPx.y - 1 - loc.y), 0).r;
  vec2 guv = (vec2(p) + 0.5) / vec2(uGrid * uCellPx);
  vec3 glow = texture(uGlow, guv).rgb * uGlowAmt;
  vec3 col = uVoid + glow + cd.rgb * a;
  o = vec4(col, 1.0);
}`;

const P_CELL = program(VS_FULL, FS_CELL, 'cell');
const P_GLOW = program(VS_FULL, FS_GLOW, 'glow');
const P_FINAL = program(VS_FULL, FS_FINAL, 'final');

function asciiCompose(time) {
  const A = ASCII;
  if (!P_CELL.ready() || !P_GLOW.ready() || !P_FINAL.ready()) return;
  gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
  // cells
  gl.bindFramebuffer(gl.FRAMEBUFFER, A.cell.fb); gl.viewport(0, 0, A.cols, A.rows);
  let u = useProg(P_CELL);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.scene.tex); gl.uniform1i(u.uScene, 0);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, A.lut); gl.uniform1i(u.uLut, 1);
  gl.uniform2i(u.uSamp, SX, SY);
  gl.uniform1f(u.uTime, time);
  gl.uniform1f(u.uShimmer, SET.shimmer ? 1 : 0);
  gl.uniform1f(u.uOutline, SET.outline ? 1 : 0);
  gl.uniform1f(u.uVivid, SET.palette === 'vivid' ? 1 : 0);
  gl.uniform1f(u.uMono, SET.palette === 'mono' ? 1 : 0);
  gl.uniform4f(u.uDir, A.dir[0], A.dir[1], A.dir[2], A.dir[3]);
  gl.uniform2f(u.uCellAspect, A.cw, A.ch);
  gl.uniform3fv(u.uWB, A.wb);
  drawFull();
  // glow and backdrop
  {
    u = useProg(P_GLOW);
    gl.uniform1f(u.uGlowOn, SET.glow ? 1 : 0); gl.uniform1f(u.uBack, CAM.pos[1] > 0 ? 1.6 : 0.32);   // (above the water the sky's blue is a fill, the characters are clouds and glitter)
    gl.bindFramebuffer(gl.FRAMEBUFFER, A.glowA.fb); gl.viewport(0, 0, A.glowA.w, A.glowA.h);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.scene.tex);
    gl.uniform1i(u.uSrc, 0); gl.uniform1i(u.uFirst, 1); gl.uniform2f(u.uDir, 1 / A.glowA.w, 0);
    gl.uniform3fv(u.uWB, A.wb);
    drawFull();
    gl.bindFramebuffer(gl.FRAMEBUFFER, A.glowB.fb);
    gl.bindTexture(gl.TEXTURE_2D, A.glowA.tex);
    gl.uniform1i(u.uFirst, 0); gl.uniform2f(u.uDir, 0, 1 / A.glowA.h);
    drawFull();
  }
  // final
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, A.W, A.H);
  u = useProg(P_FINAL);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.cell.tex); gl.uniform1i(u.uCell, 0);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, A.atlas); gl.uniform1i(u.uAtlas, 1);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, A.glowB.tex); gl.uniform1i(u.uGlow, 2);
  gl.uniform2i(u.uCellPx, A.cw, A.ch);
  gl.uniform2i(u.uOff, Math.floor((A.cols * A.cw - A.W) / 2), Math.floor((A.rows * A.ch - A.H) / 2));
  gl.uniform2i(u.uGrid, A.cols, A.rows);
  gl.uniform1f(u.uGlowAmt, 0.55);
  gl.uniform3fv(u.uVoid, A.void || [0.008, 0.02, 0.04]);
  drawFull();
}

// the current view as text, one line per row (photo mode)
function asciiText() {
  const A = ASCII, px = new Uint8Array(A.cols * A.rows * 4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, A.cell.fb);
  gl.readPixels(0, 0, A.cols, A.rows, gl.RGBA, gl.UNSIGNED_BYTE, px);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const lines = [];
  for (let r = A.rows - 1; r >= 0; r--) {
    let s = '';
    for (let c = 0; c < A.cols; c++) s += A.glyphs[px[(r * A.cols + c) * 4 + 3]] || ' ';
    lines.push(s.replace(/\s+$/, ''));
  }
  return lines.join('\n');
}
