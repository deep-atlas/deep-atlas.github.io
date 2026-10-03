// ---- the map: a cross-section of this ocean, from the shore out to the Challenger Deep, drawn in characters.
// Distance offshore and depth are both drawn on square-root scales, so the crowded shallows get room and the trench still fits.
const MAP = { XMAX:86000, DMAX:11000, prof:null, profW:0, hover:null, pick:[], t:0, mode:'ocean' };
PANELS.mapPanel = 'btnMap';
const mapX = (x, W, pl, pr) => pl + Math.sqrt(clamp(x / MAP.XMAX, 0, 1)) * (W - pl - pr);
const mapY = (d, H, pt, pb) => pt + Math.sqrt(clamp(d / MAP.DMAX, 0, 1)) * (H - pt - pb);
function mapGeom() {
  const cv = $('mapCanvas'), dpr = Math.min(devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 600, narrow = w < 520, W = Math.round(w * dpr), H = Math.round(Math.min(w * (MAP.mode === 'world' ? 0.5 : narrow ? 0.85 : 0.44), innerHeight * 0.5) * dpr);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const fs = Math.round((narrow ? 9 : 11) * dpr);
  return { cv, dpr, W, H, fs, pl:Math.round(8 * dpr), pr:Math.round((narrow ? 62 : 96) * dpr), pt:Math.round(16 * dpr), pb:Math.round(8 * dpr) };
}
function mapCss(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#ccc'; }
function drawMap() { if (MAP.mode === 'world') drawWorldMap(); else drawOceanMap(); }
function drawOceanMap() {
  const g = mapGeom(), { cv, W, H, fs, pl, pr, pt, pb, dpr } = g, c = cv.getContext('2d');
  const font = getComputedStyle(document.body).getPropertyValue('--mono') || 'monospace';
  c.clearRect(0, 0, W, H);
  c.font = `${fs}px ${font}`; c.textBaseline = 'middle';
  const cw = c.measureText('0').width, ch = fs * 1.25;
  const cols = Math.floor((W - pl - pr) / cw), X0 = pl;
  // the seafloor profile, along the line straight out from the shore (cached: it never changes)
  if (!MAP.prof || MAP.profW !== cols) {
    MAP.profW = cols; MAP.prof = [];
    for (let i = 0; i < cols; i++) { const u = (i + 0.5) / cols, x = u * u * MAP.XMAX; MAP.prof.push(floorDepth(x, 0)); }
  }
  const ink = mapCss('--ink'), dim = mapCss('--dim'), faint = mapCss('--faint'), flare = mapCss('--flare'), sub = mapCss('--sub');
  // zone boundaries and the depth scale on the right
  c.textAlign = 'left';
  for (const z of ZONES) {
    const y = mapY(z.from, H, pt, pb);
    if (z.from > 0) { c.fillStyle = faint; for (let x = X0; x < W - pr; x += cw * 2) c.fillText('.', x, y); }
    c.fillStyle = dim; c.fillText(z.from ? fmtInt(z.from) + ' m' : '0 m', W - pr + 4 * dpr, y);
    c.fillStyle = faint; c.fillText(z.name.replace(/^the /, '').replace(' zone', ''), W - pr + 4 * dpr, y + ch * 0.9);
  }
  c.fillStyle = dim; c.fillText(fmtInt(MAX_DEPTH) + ' m', W - pr + 4 * dpr, mapY(MAX_DEPTH, H, pt, pb));
  // the surface, and the floor filled with denser characters the deeper the rock
  c.fillStyle = sub; for (let i = 0; i < cols; i++) c.fillText('~', X0 + i * cw, pt);
  for (let i = 0; i < cols; i++) {
    const yf = mapY(MAP.prof[i], H, pt, pb), x = X0 + i * cw;
    c.fillStyle = ink; c.fillText(i && Math.abs(mapY(MAP.prof[i - 1], H, pt, pb) - yf) > ch * 0.7 ? '|' : '_', x, yf - ch * 0.3);
    c.fillStyle = faint;
    for (let y = yf + ch * 0.7, k = 0; y < H - pb + ch * 0.5; y += ch, k++) c.fillText(k < 1 ? '%' : k < 4 ? ':' : '.', x, y);
  }
  // every place, its dot at its true depth and its distance out to sea
  const pts = [];
  for (const o of PLACES()) {
    if (o.key === 'nautile') continue;
    const x = mapX(o.pos[0], W, pl, pr), y = mapY(depthOf(o), H, pt, pb);
    pts.push({ o, x, y });
    const big = o.kind === 'places', seen = SEEN.has(o.key), hot = MAP.hover === o || MAP.pick.includes(o);
    c.fillStyle = hot ? '#fff' : seen ? flare : dim;
    c.textAlign = 'center'; c.fillText(big ? '#' : 'o', x, y);
  }
  MAP.pts = pts;
  // a few landmarks, labelled
  c.fillStyle = soft(); c.textAlign = 'left';
  for (const k of ['reef', 'kelp', 'titanic', 'vents', 'abyss', 'challenger']) {
    const o = BYKEY[k]; if (!o) continue;
    const x = mapX(o.pos[0], W, pl, pr), y = mapY(depthOf(o), H, pt, pb);
    const t = o.label || o.name, tw = c.measureText(t).width;
    c.fillText(t, Math.min(x + 6 * dpr, W - pr - tw), y + (k === 'challenger' || k === 'reef' ? -ch * 0.9 : ch * 0.9));
  }
  // Nautile, and you
  const N = BYKEY.nautile;
  if (N) { c.fillStyle = '#ffd84a'; c.textAlign = 'center'; c.fillText('N', mapX(N.pos[0], W, pl, pr), mapY(depthOf(N), H, pt, pb)); }
  const yx = mapX(CAM.pos[0], W, pl, pr), yy = mapY(Math.max(0, CAM.depth), H, pt, pb);
  c.fillStyle = sub; c.textAlign = 'center'; c.fillText('+', yx, yy);
  c.textAlign = 'left'; c.fillText('you', Math.min(yx + 6 * dpr, W - pr - cw * 3), yy - ch * 0.8);
}
function soft() { return mapCss('--soft'); }
// ---- the other tab: where in the world each place really is, on a world map in characters
function worldGrid() {
  if (MAP.grid) return MAP.grid;
  MAP.grid = WORLD.rle.split('|').map(r => r.split(',').filter(Boolean).map(t => t[0].repeat(+(t.slice(1) || 1))).join(''));
  return MAP.grid;
}
function hereNow() { return VIEW.focus || (VIEW.flight && VIEW.flight.o) || null; }
function drawWorldMap() {
  const g = mapGeom(), { cv, W, H, dpr } = g, c = cv.getContext('2d'), G = worldGrid();
  const font = getComputedStyle(document.body).getPropertyValue('--mono') || 'monospace';
  c.clearRect(0, 0, W, H); c.textBaseline = 'middle'; c.textAlign = 'center';
  // (on a small screen several grid cells share one character)
  const step = Math.max(1, Math.ceil(5.5 * dpr / (W / WORLD.cols))), cols = Math.floor(WORLD.cols / step), rows = Math.floor(WORLD.rows / step);
  const cw = W / cols, chh = H / rows;
  c.font = `${Math.round(Math.min(cw * 1.5, chh * 1.05))}px ${font}`;
  const faint = mapCss('--faint'), dim = mapCss('--dim'), flare = mapCss('--flare'), sub = mapCss('--sub');
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    let land = 0, n = 0;
    for (let b = 0; b < step; b++) for (let a = 0; a < step; a++) { const v = +(G[j * step + b] || '')[i * step + a] || 0; land += v; n++; }
    if (!land) continue;
    c.fillStyle = land / n > 1.2 ? dim : faint;
    c.fillText(land / n > 1.2 ? '#' : ':', (i + 0.5) * cw, (j + 0.5) * chh);
  }
  const X = lon => (lon + 180) / 360 * W, Y = lat => (WORLD.lat0 - lat) / (WORLD.lat0 - WORLD.lat1) * H;
  const here = hereNow(), pts = [];
  c.font = `${g.fs}px ${font}`;
  for (const o of PLACES()) {
    const w = WHERE[o.key]; if (!w) continue;
    const x = X(w[1]), y = Y(w[0]), hot = MAP.hover === o || MAP.pick.includes(o);
    pts.push({ o, x, y });
    if (o === here) continue;
    c.fillStyle = hot ? '#fff' : SEEN.has(o.key) ? flare : '#9fb4c8';
    c.fillText('o', x, y);
  }
  MAP.pts = pts;
  // where you are now, and a few ocean names for bearings
  c.fillStyle = faint; c.font = `italic ${Math.round(g.fs * 0.95)}px ${font}`;
  for (const [t, lat, lon] of [['Pacific', 0, -150], ['Atlantic', 10, -35], ['Indian', -20, 80], ['Southern Ocean', -58, -120], ['Arctic', 79, -150]]) c.fillText(t, X(lon), Y(lat));
  c.font = `${g.fs}px ${font}`;
  if (here && WHERE[here.key]) {
    const w = WHERE[here.key], x = X(w[1]), y = Y(w[0]), t = `you: ${here.label || here.name}`;
    c.fillStyle = sub; c.fillText('+', x, y);
    c.textAlign = 'left'; const tw = c.measureText(t).width; c.fillText(t, Math.min(Math.max(x + 6 * dpr, 2 * dpr), W - tw - 2 * dpr), y - g.fs * 1.1);
  }
}
function setMapMode(m) {
  MAP.mode = m; MAP.pick = []; MAP.hover = null;
  for (const b of document.querySelectorAll('#mapTabs button')) b.setAttribute('aria-pressed', String(b.dataset.v === m));
  $('mapNote').textContent = m === 'world'
    ? 'where each one really lives: a typical spot, or where it was famously filmed. The atlas puts them all in one ocean.'
    : 'distance out to sea and depth are both stretched near the top, so the crowded shallows have room · O opens and closes';
  mapFoot([]); drawMap();
}
for (const b of document.querySelectorAll('#mapTabs button')) b.onclick = () => setMapMode(b.dataset.v);
// what is under the pointer: the nearest place, or every place within reach of it
function mapNear(e, R) {
  const g = mapGeom(), r = g.cv.getBoundingClientRect(), mx = (e.clientX - r.left) * g.dpr, my = (e.clientY - r.top) * g.dpr, rr = R * g.dpr;
  return (MAP.pts || []).map(p => ({ o:p.o, d:Math.hypot(p.x - mx, p.y - my) })).filter(p => p.d < rr).sort((a, b) => a.d - b.d).map(p => p.o);
}
function mapFoot(list) {
  const f = $('mapFoot'); f.innerHTML = '';
  if (!list.length) { f.textContent = MAP.mode === 'world' ? 'click a dot to swim there · orange: seen · + where you are now' : 'click a dot to swim there · # places · o animals · orange: seen · + you · N Nautile'; return; }
  for (const o of list.slice(0, 12)) {
    const b = document.createElement('button'); b.className = 'btn';
    b.textContent = MAP.mode === 'world' && list.length === 1 && WHERE[o.key] ? `${o.label || o.name} · ${WHERE[o.key][2]}` : `${o.label || o.name} · ${fmtInt(depthOf(o))} m`;
    b.onclick = () => { openPanel('mapPanel', false); userGo(o); };
    f.appendChild(b);
  }
  if (list.length > 12) { const s = document.createElement('span'); s.textContent = `+${list.length - 12} more: zoom in by swimming there`; f.appendChild(s); }
}
$('btnMap').onclick = () => { openPanel('mapPanel'); if (!$('mapPanel').hidden) { MAP.pick = []; mapFoot([]); drawMap(); } };
$('mapClose').onclick = () => openPanel('mapPanel', false);
$('mapCanvas').addEventListener('pointermove', e => {
  const n = mapNear(e, 10), o = n[0] || null;
  if (o !== MAP.hover) { MAP.hover = o; if (!MAP.pick.length) mapFoot(o ? [o] : []); drawMap(); }
});
$('mapCanvas').addEventListener('pointerleave', () => { MAP.hover = null; if (!MAP.pick.length) mapFoot([]); drawMap(); });
$('mapCanvas').addEventListener('click', e => {
  const n = mapNear(e, 12);
  if (n.length === 1) { openPanel('mapPanel', false); userGo(n[0]); return; }
  // several close together (the reef is crowded): list them to choose from
  MAP.pick = n; mapFoot(n); drawMap();
});
// keep the "you" marker moving while the map is open, a few times a second
setInterval(() => { if (!$('mapPanel').hidden) drawMap(); }, 300);
addEventListener('resize', () => { if (!$('mapPanel').hidden) drawMap(); });
