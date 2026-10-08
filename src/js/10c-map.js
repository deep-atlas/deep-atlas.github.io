// ---- the map: a cross-section of this ocean, from the shore out to the Challenger Deep, drawn in characters, and a world map.
// Both share one view that can be zoomed (wheel, buttons, or clicking a crowd) and dragged. Distance offshore and depth are drawn on
// square-root scales, so the crowded shallows get room and the trench still fits. Dots that would sit on top of each other are
// spread apart (a thin line points back to where each really is), and names are drawn wherever there is room for them.
const MAP = { XMAX:86000, DMAX:11000, prof:null, profKey:'', hover:null, pick:[], mode:'ocean', find:'', drag:null, lay:null, layKey:'',
  views:{ ocean:{ u0:0, u1:1, v0:0, v1:1 }, world:{ u0:0, u1:1, v0:0, v1:1 } } };
PANELS.mapPanel = 'btnMap';
const MAP_MIN = { ocean:0.006, world:0.08 };   // (the most it zooms in: the share of the whole map left in view)
function mapGeom() {
  const cv = $('mapCanvas'), dpr = Math.min(devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 600, narrow = w < 520, W = Math.round(w * dpr), H = Math.round(Math.min(w * (MAP.mode === 'world' ? 0.5 : narrow ? 0.85 : 0.5), innerHeight * 0.55) * dpr);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const fs = Math.round((narrow ? 9 : 11) * dpr), ocean = MAP.mode === 'ocean';
  const g = { cv, dpr, W, H, fs, narrow, pl:Math.round(8 * dpr), pr:Math.round((ocean ? (narrow ? 62 : 96) : 6) * dpr), pt:Math.round((ocean ? 16 : 4) * dpr), pb:Math.round((ocean ? 18 : 4) * dpr) };
  const V = MAP.views[MAP.mode];
  // map coordinates (u across, v down, each 0..1 over the whole map) to canvas pixels, through the current view
  g.sx = u => g.pl + (u - V.u0) / (V.u1 - V.u0) * (W - g.pl - g.pr);
  g.sy = v => g.pt + (v - V.v0) / (V.v1 - V.v0) * (H - g.pt - g.pb);
  g.ux = x => V.u0 + (x - g.pl) / (W - g.pl - g.pr) * (V.u1 - V.u0);
  g.vy = y => V.v0 + (y - g.pt) / (H - g.pt - g.pb) * (V.v1 - V.v0);
  return g;
}
function mapCss(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#ccc'; }
const mapFont = () => getComputedStyle(document.body).getPropertyValue('--mono') || 'monospace';
// where a place sits on each map (u, v), or null when it has no spot there
const oceanU = x => Math.sqrt(clamp(x / MAP.XMAX, 0, 1)), oceanV = d => Math.sqrt(clamp(d / MAP.DMAX, 0, 1));
function mapUV(o) {
  if (MAP.mode === 'world') { const w = WHERE[o.key]; return w ? [(w[1] + 180) / 360, (WORLD.lat0 - w[0]) / (WORLD.lat0 - WORLD.lat1)] : null; }
  return [oceanU(o.anchor[0]), oceanV(Math.max(0, -o.anchor[1]))];
}
const mapPlaces = () => PLACES().filter(o => o.key !== 'nautile');
function mapMatch(o) {
  const q = MAP.find.trim().toLowerCase(); if (!q) return false;
  // (on the world map, where each lives counts too: "Japan" finds everything filmed there)
  return (o.name + ' ' + (o.label || '') + ' ' + (o.type || '') + ' ' + (MAP.mode === 'world' && WHERE[o.key] ? WHERE[o.key][2] : '')).toLowerCase().includes(q);
}
// the dots, spread so none sits on another, and as many names as fit without covering anything (cached until the view changes)
function mapLayout(g, c) {
  const V = MAP.views[MAP.mode], list = mapPlaces();
  const key = [MAP.mode, V.u0, V.u1, V.v0, V.v1, g.W, g.H, list.length, MAP.find].join('|');
  if (MAP.lay && MAP.layKey === key) return MAP.lay;
  const cw = c.measureText('0').width, minD = cw * 1.25, L = g.pl, R = g.W - g.pr, T = g.pt, B = g.H - g.pb;
  const pts = [];
  for (const o of list) {
    const uv = mapUV(o); if (!uv) continue;
    const tx = g.sx(uv[0]), ty = g.sy(uv[1]);
    if (tx < L - 2 || tx > R + 2 || ty < T - 2 || ty > B + 2) continue;
    pts.push({ o, tx, ty, x:tx, y:ty });
  }
  // push overlapping dots apart, a little at a time
  for (let it = 0; it < 14; it++) {
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j]; let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d >= minD) continue;
      if (d < 1e-3) { const t = (i * 7 + j * 13) % 360 * PI / 180; dx = Math.cos(t); dy = Math.sin(t); d = 1; }
      const k = (minD - d) / d * 0.5; a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k;
    }
    for (const p of pts) { p.x = clamp(p.x, L, R); p.y = clamp(p.y, T, B); }
  }
  // names: places first, then what you have seen, then the rest; each tried to the right of its dot, then the left
  const ch = g.fs * 1.2, boxes = [], labels = [];
  const hits = (r) => boxes.some(b => r.x < b.x + b.w && r.x + r.w > b.x && r.y < b.y + b.h && r.y + r.h > b.y)
    || pts.some(p => p.x > r.x - cw * 0.3 && p.x < r.x + r.w + cw * 0.3 && p.y > r.y && p.y < r.y + r.h);
  const order = pts.slice().sort((a, b) => (b.o.kind === 'places') - (a.o.kind === 'places') || SEEN.has(b.o.key) - SEEN.has(a.o.key));
  for (const p of order) {
    const t = p.o.label || p.o.name, w = c.measureText(t).width;
    for (const side of [1, -1]) {
      const r = { x:side > 0 ? p.x + cw * 0.9 : p.x - cw * 0.9 - w, y:p.y - ch / 2, w, h:ch };
      if (r.x < L || r.x + r.w > R || r.y < T - ch * 0.5 || r.y + r.h > B + ch * 0.5 || hits(r)) continue;
      boxes.push(r); labels.push({ p, t, x:r.x, y:p.y }); break;
    }
  }
  MAP.lay = { pts, labels, cw, ch }; MAP.layKey = key;
  return MAP.lay;
}
function drawMap() { if (MAP.mode === 'world') drawWorldMap(); else drawOceanMap(); }
// the dots, their leader lines, the names, and the one under the pointer picked out with a boxed name
function drawPlaces(g, c) {
  const lay = mapLayout(g, c), { cw, ch } = lay, flare = mapCss('--flare'), dim = mapCss('--dim'), faint = mapCss('--faint'), ink = mapCss('--ink'), soft = mapCss('--soft');
  const finding = !!MAP.find.trim(), here = hereNow();
  c.strokeStyle = faint; c.lineWidth = Math.max(1, g.dpr * 0.6);
  for (const p of lay.pts) if (Math.hypot(p.x - p.tx, p.y - p.ty) > cw * 0.6) {
    c.beginPath(); c.moveTo(p.tx, p.ty); c.lineTo(p.x, p.y); c.stroke();
    c.fillStyle = faint; c.fillRect(p.tx - g.dpr, p.ty - g.dpr, 2 * g.dpr, 2 * g.dpr);
  }
  c.textAlign = 'center';
  for (const p of lay.pts) {
    const o = p.o, hot = MAP.hover === o || MAP.pick.includes(o), match = finding && mapMatch(o);
    c.fillStyle = hot || match ? '#fff' : finding ? faint : o === here ? mapCss('--sub') : SEEN.has(o.key) ? flare : dim;
    c.fillText(o.kind === 'places' ? '#' : 'o', p.x, p.y);
  }
  c.textAlign = 'left';
  for (const l of lay.labels) {
    if (finding && !mapMatch(l.p.o)) continue;
    if (l.p.o === MAP.hover) continue;
    c.fillStyle = finding ? ink : l.p.o.kind === 'places' ? soft : SEEN.has(l.p.o.key) ? flare : dim;
    c.globalAlpha = finding || l.p.o.kind === 'places' ? 1 : 0.85; c.fillText(l.t, l.x, l.y); c.globalAlpha = 1;
  }
  // the one you point at always gets its name, boxed so it reads over anything
  for (const p of lay.pts) {
    const o = p.o, hot = MAP.hover === o;
    if (!hot) continue;
    const t = (o.label || o.name) + (hot && MAP.mode === 'ocean' ? ` · ${fmtInt(Math.max(0, -o.anchor[1]))} m` : ''), w = c.measureText(t).width;
    let x = p.x + cw * 0.9; if (x + w > g.W - 2) x = p.x - cw * 0.9 - w;
    const y = p.y - ch * (hot ? 1.1 : 0);
    c.fillStyle = mapCss('--void'); c.globalAlpha = 0.85; c.fillRect(x - cw * 0.3, y - ch / 2, w + cw * 0.6, ch); c.globalAlpha = 1;
    c.fillStyle = '#fff'; c.fillText(t, x, y);
  }
  MAP.pts = lay.pts;
}
function drawOceanMap() {
  const g = mapGeom(), { cv, W, H, fs, pl, pr, pt, pb, dpr } = g, c = cv.getContext('2d'), V = MAP.views.ocean;
  c.clearRect(0, 0, W, H);
  c.font = `${fs}px ${mapFont()}`; c.textBaseline = 'middle';
  const cw = c.measureText('0').width, ch = fs * 1.25, L = pl, R = W - pr, T = pt, B = H - pb;
  const cols = Math.floor((R - L) / cw);
  const ink = mapCss('--ink'), dim = mapCss('--dim'), faint = mapCss('--faint'), sub = mapCss('--sub');
  // the seafloor profile across the view, along the line straight out from the shore
  const pkey = [cols, V.u0, V.u1].join('|');
  if (!MAP.prof || MAP.profKey !== pkey) {
    MAP.profKey = pkey; MAP.prof = [];
    for (let i = 0; i < cols; i++) { const u = V.u0 + (i + 0.5) / cols * (V.u1 - V.u0); MAP.prof.push(floorDepth(u * u * MAP.XMAX, 0)); }
  }
  c.save(); c.beginPath(); c.rect(L - cw, T - ch, R - L + cw * 2, B - T + ch * 2); c.clip();
  // depth gridlines at round numbers, as many as fit
  const dTicks = [0, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 3000, 4000, 6000, 8000, 10000];
  let lastY = -1e9; const used = [];
  for (const d of dTicks) { const y = g.sy(oceanV(d)); if (y < T - 1 || y > B + 1 || y - lastY < ch * 1.4) continue; lastY = y; used.push([d, y]); }
  c.fillStyle = faint; c.textAlign = 'left';
  for (const [d, y] of used) if (d > 0) for (let x = L; x < R; x += cw * 3) c.fillText('.', x, y);
  // the surface (when in view) and the floor, filled with denser characters the deeper the rock
  const ys = g.sy(0); if (ys >= T - 2) { c.fillStyle = sub; for (let i = 0; i < cols; i++) c.fillText('~', L + i * cw, ys); }
  for (let i = 0; i < cols; i++) {
    const yf = g.sy(oceanV(MAP.prof[i])), x = L + i * cw;
    if (yf > B + ch) continue;
    c.fillStyle = ink; c.fillText(i && Math.abs(g.sy(oceanV(MAP.prof[i - 1])) - yf) > ch * 0.7 ? '|' : '_', x, yf - ch * 0.3);
    c.fillStyle = faint;
    for (let y = Math.max(yf + ch * 0.7, T), k = 0; y < B + ch * 0.5; y += ch, k++) c.fillText(k < 1 ? '%' : k < 4 ? ':' : '.', x, y);
  }
  drawPlaces(g, c);
  // Nautile, and you
  const N = BYKEY.nautile;
  if (N) { c.fillStyle = '#ffd84a'; c.textAlign = 'center'; c.fillText('N', g.sx(oceanU(N.pos[0])), g.sy(oceanV(depthOf(N)))); }
  const yx = g.sx(oceanU(CAM.pos[0])), yy = g.sy(oceanV(Math.max(0, CAM.depth)));
  if (yx > L - 2 && yx < R + 2 && yy > T - 2 && yy < B + 2) {
    c.fillStyle = sub; c.textAlign = 'center'; c.fillText('+', yx, yy);
    c.textAlign = 'left'; c.fillText('you', Math.min(yx + 6 * dpr, R - cw * 3), yy + (yy < T + ch * 2.5 ? ch * 1.1 : -ch * 0.8));
  }
  c.restore();
  // the depth scale on the right, with the zone each depth is in
  c.textAlign = 'left';
  for (const [d, y] of used) { c.fillStyle = dim; c.fillText(d ? fmtInt(d) + ' m' : '0 m', R + 4 * dpr, y); }
  for (const z of ZONES) { const y = g.sy(oceanV(z.from)) + ch * 0.9; if (y < T || y > B) continue; if (used.some(u => Math.abs(u[1] - y) < ch * 0.8)) continue;
    c.fillStyle = faint; c.fillText(z.name.replace(/^the /, '').replace(' zone', ''), R + 4 * dpr, y); }
  // and distance offshore along the bottom
  c.fillStyle = faint; let lastX = -1e9;
  for (const km of [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 40, 60, 80]) {
    const x = g.sx(oceanU(km * 1000)), t = km < 1 ? fmtInt(km * 1000) + ' m' : km + ' km', w = c.measureText(t).width;
    if (x < L || x + w > R || x - lastX < w + cw * 2) continue; lastX = x;
    c.fillText('|' + t, x, H - pb * 0.45);
  }
  c.textAlign = 'right'; c.fillText('out to sea >', W - 4 * dpr, H - pb * 0.45);
}
// ---- the other tab: where in the world each place really is, on a world map in characters
function worldGrid() {
  if (MAP.grid) return MAP.grid;
  MAP.grid = WORLD.rle.split('|').map(r => r.split(',').filter(Boolean).map(t => t[0].repeat(+(t.slice(1) || 1))).join(''));
  return MAP.grid;
}
function hereNow() { return VIEW.focus || (VIEW.flight && VIEW.flight.o) || null; }
function drawWorldMap() {
  const g = mapGeom(), { cv, W, H, dpr } = g, c = cv.getContext('2d'), G = worldGrid(), V = MAP.views.world;
  c.clearRect(0, 0, W, H); c.textBaseline = 'middle'; c.textAlign = 'center';
  // the land, cell by cell over what is in view (several cells share a character when zoomed right out on a small screen)
  const cellW = (g.sx(1) - g.sx(0)) / WORLD.cols, cellH = (g.sy(1) - g.sy(0)) / WORLD.rows;
  const step = Math.max(1, Math.ceil(5.5 * dpr / cellW));
  c.font = `${Math.round(clamp(Math.min(cellW * step * 1.5, cellH * step * 1.05), 6 * dpr, 22 * dpr))}px ${mapFont()}`;
  const faint = mapCss('--faint'), dim = mapCss('--dim'), sub = mapCss('--sub');
  const i0 = Math.max(0, Math.floor(V.u0 * WORLD.cols / step) - 1), i1 = Math.min(Math.ceil(WORLD.cols / step), Math.ceil(V.u1 * WORLD.cols / step) + 1);
  const j0 = Math.max(0, Math.floor(V.v0 * WORLD.rows / step) - 1), j1 = Math.min(Math.ceil(WORLD.rows / step), Math.ceil(V.v1 * WORLD.rows / step) + 1);
  for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
    let land = 0, n = 0;
    for (let b = 0; b < step; b++) for (let a = 0; a < step; a++) { const v = +(G[j * step + b] || '')[i * step + a] || 0; land += v; n++; }
    if (!land) continue;
    c.fillStyle = land / n > 1.2 ? dim : faint;
    c.fillText(land / n > 1.2 ? '#' : ':', g.sx((i + 0.5) * step / WORLD.cols), g.sy((j + 0.5) * step / WORLD.rows));
  }
  const X = lon => g.sx((lon + 180) / 360), Y = lat => g.sy((WORLD.lat0 - lat) / (WORLD.lat0 - WORLD.lat1));
  c.fillStyle = faint; c.font = `italic ${Math.round(g.fs * 0.95)}px ${mapFont()}`;
  for (const [t, lat, lon] of [['Pacific', 0, -150], ['Atlantic', 10, -35], ['Indian', -20, 80], ['Southern Ocean', -58, -120], ['Arctic', 79, -150]]) c.fillText(t, X(lon), Y(lat));
  c.font = `${g.fs}px ${mapFont()}`;
  drawPlaces(g, c);
  const here = hereNow();
  if (here && WHERE[here.key]) {
    const w = WHERE[here.key], x = X(w[1]), y = Y(w[0]), t = `you: ${here.label || here.name}`;
    c.fillStyle = sub; c.textAlign = 'center'; c.fillText('+', x, y);
    c.textAlign = 'left'; const tw = c.measureText(t).width; c.fillText(t, Math.min(Math.max(x + 6 * dpr, 2 * dpr), W - tw - 2 * dpr), y + g.fs * 1.3);
  }
}
// ---- zooming and panning
function mapClampView(V) {
  const su = V.u1 - V.u0, sv = V.v1 - V.v0;
  if (V.u0 < 0) { V.u0 = 0; V.u1 = su; } if (V.u1 > 1) { V.u1 = 1; V.u0 = 1 - su; }
  if (V.v0 < 0) { V.v0 = 0; V.v1 = sv; } if (V.v1 > 1) { V.v1 = 1; V.v0 = 1 - sv; }
}
function mapZoom(f, cu, cv) {
  // (the view keeps its shape: across and down shrink or grow together)
  const V = MAP.views[MAP.mode], su = V.u1 - V.u0, sv = V.v1 - V.v0;
  const k = clamp(su * f, MAP_MIN[MAP.mode], 1) / su, k2 = Math.min(k, 1 / sv);
  cu = cu ?? (V.u0 + V.u1) / 2; cv = cv ?? (V.v0 + V.v1) / 2;
  V.u0 = cu - (cu - V.u0) * k; V.u1 = V.u0 + su * k; V.v0 = cv - (cv - V.v0) * k2; V.v1 = V.v0 + sv * k2;
  mapClampView(V); mapZoomUI(); drawMap();
}
function mapShow(u0, u1, v0, v1) {
  const V = MAP.views[MAP.mode], s = clamp(Math.max(u1 - u0, v1 - v0), MAP_MIN[MAP.mode], 1), cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  Object.assign(V, { u0:cu - s / 2, u1:cu + s / 2, v0:cv - s / 2, v1:cv + s / 2 }); mapClampView(V); mapZoomUI(); drawMap();
}
function mapZoomUI() {
  const V = MAP.views[MAP.mode], z = 1 / (V.u1 - V.u0);
  $('mapZoomTxt').textContent = z > 1.05 ? `${z < 10 ? z.toFixed(1) : Math.round(z)}× · drag to move` : 'scroll or click a crowd to zoom';
  $('mapShallow').hidden = MAP.mode !== 'ocean';
}
function setMapMode(m) {
  MAP.mode = m; MAP.pick = []; MAP.hover = null; MAP.lay = null;
  if (MAP.find.trim()) setTimeout(() => $('mapFind').dispatchEvent(new Event('input')));
  for (const b of document.querySelectorAll('#mapTabs button')) b.setAttribute('aria-pressed', String(b.dataset.v === m));
  $('mapNote').textContent = m === 'world'
    ? 'where each one really lives: a typical spot, or where it was famously filmed. The atlas puts them all in one ocean.'
    : 'distance out to sea and depth are both stretched near the top, so the crowded shallows have room · dots spread apart where crowded; a thin line points to the true spot · O opens and closes';
  mapZoomUI(); mapFoot([]); drawMap();
}
for (const b of document.querySelectorAll('#mapTabs button')) b.onclick = () => setMapMode(b.dataset.v);
// what is under the pointer: the nearest place, or every place within reach of it
function mapNear(e, R) {
  const g = mapGeom(), r = g.cv.getBoundingClientRect(), mx = (e.clientX - r.left) * g.dpr, my = (e.clientY - r.top) * g.dpr, rr = R * g.dpr;
  return (MAP.pts || []).map(p => ({ o:p.o, d:Math.hypot(p.x - mx, p.y - my) })).filter(p => p.d < rr).sort((a, b) => a.d - b.d).map(p => p.o);
}
function mapFoot(list) {
  const f = $('mapFoot'); f.innerHTML = '';
  if (!list.length) {
    f.textContent = MAP.mode === 'world' ? 'click a dot to swim there · orange: seen · + where you are now'
      : 'click a dot to swim there · # places · o animals · orange: seen · + you · N Nautile';
    return;
  }
  for (const o of list.slice(0, 16)) {
    const b = document.createElement('button'); b.className = 'btn';
    b.textContent = MAP.mode === 'world' && list.length === 1 && WHERE[o.key] ? `${o.label || o.name} · ${WHERE[o.key][2]}` : `${o.label || o.name} · ${fmtInt(Math.max(0, -o.anchor[1]))} m`;
    b.onclick = () => { openPanel('mapPanel', false); userGo(o); };
    b.onpointerenter = () => { MAP.hover = o; drawMap(); };
    f.appendChild(b);
  }
  if (list.length > 16) { const s = document.createElement('span'); s.textContent = ` +${list.length - 16} more`; f.appendChild(s); }
}
$('btnMap').onclick = () => { openPanel('mapPanel'); if (!$('mapPanel').hidden) { MAP.pick = []; mapZoomUI(); mapFoot([]); drawMap(); } };
$('mapClose').onclick = () => openPanel('mapPanel', false);
$('mapIn').onclick = () => mapZoom(0.5);
$('mapOut').onclick = () => mapZoom(2);
$('mapFit').onclick = () => { MAP.pick = []; mapFoot([]); mapShow(0, 1, 0, 1); };
// (the shallows: shore to about 4 km out, surface to about 110 m)
$('mapShallow').onclick = () => { MAP.views.ocean = { u0:0, u1:0.22, v0:0, v1:0.1 }; mapZoomUI(); drawMap(); };
$('mapFind').addEventListener('input', e => {
  MAP.find = e.target.value; MAP.lay = null;
  const n = MAP.find.trim() ? mapPlaces().filter(mapMatch) : [];
  MAP.pick = []; mapFoot(n); drawMap();
});
$('mapFind').addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.key === 'Escape') { e.target.value = ''; e.target.dispatchEvent(new Event('input')); return; }
  if (e.key !== 'Enter') return;
  // enter: one match swims there; several zoom the map to show them all
  const n = mapPlaces().filter(mapMatch), uv = n.map(mapUV).filter(Boolean);
  if (n.length === 1) { openPanel('mapPanel', false); userGo(n[0]); return; }
  if (uv.length) { const us = uv.map(p => p[0]), vs = uv.map(p => p[1]), pad = 0.03;
    mapShow(Math.min(...us) - pad, Math.max(...us) + pad, Math.min(...vs) - pad, Math.max(...vs) + pad); }
});
const cvs = $('mapCanvas');
cvs.addEventListener('wheel', e => {
  e.preventDefault();
  const g = mapGeom(), r = cvs.getBoundingClientRect(), x = (e.clientX - r.left) * g.dpr, y = (e.clientY - r.top) * g.dpr;
  mapZoom(e.deltaY > 0 ? 1.25 : 0.8, g.ux(x), g.vy(y));
}, { passive:false });
cvs.addEventListener('pointerdown', e => {
  const V = MAP.views[MAP.mode];
  MAP.drag = { x:e.clientX, y:e.clientY, V:{ ...V }, moved:false };
  cvs.setPointerCapture && cvs.setPointerCapture(e.pointerId);
});
cvs.addEventListener('pointermove', e => {
  const D = MAP.drag;
  if (D) {
    const dx = e.clientX - D.x, dy = e.clientY - D.y;
    if (!D.moved && Math.hypot(dx, dy) > 5) D.moved = true;
    if (D.moved) {
      const g = mapGeom(), V = MAP.views[MAP.mode];
      const du = dx * g.dpr / (g.W - g.pl - g.pr) * (D.V.u1 - D.V.u0), dv = dy * g.dpr / (g.H - g.pt - g.pb) * (D.V.v1 - D.V.v0);
      Object.assign(V, { u0:D.V.u0 - du, u1:D.V.u1 - du, v0:D.V.v0 - dv, v1:D.V.v1 - dv }); mapClampView(V);
      cvs.style.cursor = 'grabbing'; drawMap(); return;
    }
  }
  const o = mapNear(e, 10)[0] || null;
  if (o !== MAP.hover) { MAP.hover = o; if (!MAP.pick.length && !MAP.find.trim()) mapFoot(o ? [o] : []); drawMap(); }
});
cvs.addEventListener('pointerup', e => {
  const D = MAP.drag; MAP.drag = null; cvs.style.cursor = '';
  if (!D || D.moved) return;
  const n = mapNear(e, 12);
  if (n.length === 1) { openPanel('mapPanel', false); userGo(n[0]); return; }
  // a crowd: list them, and zoom in on it so they spread out (or, on empty water, just zoom in there)
  const g = mapGeom(), r = cvs.getBoundingClientRect();
  MAP.pick = n; mapFoot(n);
  if (n.length > 1) mapZoom(0.4, g.ux((e.clientX - r.left) * g.dpr), g.vy((e.clientY - r.top) * g.dpr)); else drawMap();
});
cvs.addEventListener('pointerleave', () => { if (MAP.drag) return; MAP.hover = null; if (!MAP.pick.length && !MAP.find.trim()) mapFoot([]); drawMap(); });
// keep the "you" marker moving while the map is open, a few times a second
setInterval(() => { if (!$('mapPanel').hidden) drawMap(); }, 300);
addEventListener('resize', () => { MAP.lay = null; if (!$('mapPanel').hidden) drawMap(); });
