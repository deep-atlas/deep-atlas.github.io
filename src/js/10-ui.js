// ---- the interface

const body = document.body;
const fmtInt = n => Math.round(n).toLocaleString('en-US');
function fmtLen(m) {
  const a = Math.abs(m);
  if (a >= 1000) return (m / 1000).toFixed(a >= 10000 ? 0 : 1).replace(/\.0$/, '') + ' km';
  if (a >= 1) return (a >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, '')) + ' m';
  if (a >= 0.01) return (a >= 0.1 ? Math.round(m * 100) : (m * 100).toFixed(1).replace(/\.0$/, '')) + ' cm';
  if (a >= 0.001) return (m * 1000).toFixed(a >= 0.01 ? 0 : 1).replace(/\.0$/, '') + ' mm';
  return Math.max(0.1, m * 1e6).toFixed(m * 1e6 >= 10 ? 0 : 1).replace(/\.0$/, '') + ' µm';
}
const fmtDepth = d => d < -0.5 ? fmtInt(-d) + ' m above the sea' : d < 1 ? 'at the surface' : fmtInt(d) + ' m deep';
const depthOf = o => Math.max(0, -o.pos[1]);
const PLACES = () => OBJS.filter(o => o.place && !o.temp);
const byDepth = () => PLACES().sort((a, b) => depthOf(a) - depthOf(b));
// water temperature by depth (a tropical sea): warm on top, the thermocline, then near freezing all the way down
const tempAt = d => 1.6 + 25.4 * Math.exp(-d / 320);
function sunFrac(d) { const f = 0.5 * (Math.exp(-KD[1] * d) + Math.exp(-KD[2] * d)); return f * (1 - LIGHT.night * 0.999); }
function fmtFrac(f) {
  if (f > 0.1) return Math.round(f * 100) + '% of the light at the surface';
  if (f > 0.001) return (f * 100).toFixed(f > 0.01 ? 1 : 2) + '% of the light at the surface';
  if (f < 1e-15) return 'no sunlight at all';
  return 'about 1 part in 10^' + Math.round(-Math.log10(f)) + ' of the surface light';
}

// ---- toasts
let toastT = 0;
function toast(msg, ms = 2600) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }

// ---- seen places, kept on this device
const SEEN = new Set(load('seen', []));
let seenT = 0;
function markSeen(o) { if (!o.place || SEEN.has(o.key)) return; SEEN.add(o.key); save('seen', [...SEEN]); renderAtlas(); toast(`seen: ${o.name} · ${SEEN.size} of ${PLACES().length}`); }

// ---- tours
const TOURS = [
  { id:'dive', name:'the grand dive', blurb:'From the surface to the floor of the Challenger Deep, zone by zone.',
    stops:['surface', 'flyingfish', 'spinners', 'manowar', 'moonjelly', 'reef', 'clownfish', 'lionfish', 'turtle', 'manta', 'kelp', 'baitball', 'sailfish', 'dolphin', 'whaleshark', 'bluewhale', 'seep', 'krill', 'coelacanth', 'oarfish', 'lanternfish', 'siphonophore', 'barreleye', 'giantsquid', 'vampsquid', 'dragonfish', 'blobfish', 'spermwhale', 'anglerfish', 'gulper', 'vents', 'whalefall', 'titanic', 'dumbo', 'abyss', 'tripodfish', 'snailfish', 'amphipods', 'challenger'] },
  { id:'giants', name:'giants', blurb:'The biggest animals there are, and one that is a colony.',
    stops:['bluewhale', 'humpback', 'bubblenet', 'giantoctopus', 'whaleshark', 'baskingshark', 'tuna', 'orca', 'spermwhale', 'sleepingwhales', 'colossal', 'giantsquid', 'phantomjelly', 'humboldt', 'bigfin', 'siphonophore', 'oarfish', 'spidercrab', 'manta', 'leatherback', 'sunfish', 'greatwhite', 'hammerheads', 'beakedwhale'] },
  { id:'light', name:'living light', blurb:'Bioluminescence: most animals of the deep make their own light.',
    stops:['noctiluca', 'combjelly', 'lanternfish', 'hatchetfish', 'glasssquid', 'atolla', 'pyrosome', 'cookiecutter', 'cockeyed', 'helmetjelly', 'vampsquid', 'dragonfish', 'siphonophore', 'anglerfish', 'loosejaw', 'viperfish', 'gulper', 'chickenmonster'] },
  { id:'tiny', name:'tiny life', blurb:'The drifting plankton that feeds the ocean, down to a single cell.',
    stops:['copepod', 'krill', 'penguin', 'seaangel', 'seabutterfly', 'diatoms', 'radiolarian', 'noctiluca', 'prochlorococcus', 'xeno', 'amphipods'] },
  { id:'reef', name:'the reef', blurb:'A shallow coral reef and its neighbours.',
    stops:['reef', 'blacktip', 'snappers', 'grouper', 'clownfish', 'seahorse', 'lionfish', 'parrotfish', 'cuttlefish', 'mantisshrimp', 'nudibranch', 'xmastree', 'featherstar', 'puffer', 'gardeneels', 'goby', 'blueringed', 'flounder', 'giantclam', 'seakrait', 'coconutoctopus', 'mimic', 'frogfish', 'torpedo', 'stargazer', 'stingray', 'moray', 'octopus', 'bluetang', 'turtle', 'hatchlings', 'manta', 'barracuda', 'kelp', 'sealion', 'giantoctopus', 'blacksmith', 'garibaldi', 'seaotter'] },
  { id:'night', name:'a night dive', night:true, blurb:'The same sea after dark: corals spawning, flashlight fish blinking, the lanternfish risen from the deep, plankton that glow when touched.',
    stops:['reef', 'flashlight', 'fireflysquid', 'octopus', 'cuttlefish', 'manowar', 'noctiluca', 'lanternfish', 'combjelly', 'turtle', 'kelp', 'seaotter'] },
  { id:'hidden', name:'hidden worlds', blurb:'Places most people never hear of: forests in the sea, lakes on the seafloor, gardens on drowned volcanoes.',
    stops:['wreck', 'sargassum', 'sargassumfish', 'mangroves', 'boxjelly', 'seagrass', 'dugong', 'seadragon', 'seaice', 'narwhal', 'beluga', 'polarbear', 'walrus', 'lionsmane', 'kelp', 'seep', 'flowerbasket', 'lostcity', 'vents', 'yeticrab', 'seamount', 'roughy', 'whalefall', 'abyss', 'challenger'] },
  { id:'world', name:'around the world', blurb:'A loop round the planet: from California across the Pacific to Japan and the Mariana Trench, through Indonesia to Australia, across the Indian Ocean to Africa and Antarctica, and home over the Atlantic. (Open the map’s world tab to follow along.)',
    stops:['kelp', 'seaotter', 'greatwhite', 'bubblenet', 'humpback', 'abyss', 'challenger', 'giantsquid', 'spidercrab', 'nautilus', 'barracuda', 'nudibranch', 'reef', 'boxjelly', 'seadragon', 'whaleshark', 'mangroves', 'manta', 'scalyfoot', 'coelacanth', 'wreck', 'baitball', 'penguin', 'krill', 'titanic', 'sargassum', 'stingray'] },
  { id:'weird', name:'weird and wonderful', blurb:'Living fossils, slingshot jaws, a fish of jelly: the strangest faces of the deep.',
    stops:['seadragon', 'batfish', 'spidercrab', 'coelacanth', 'nautilus', 'oarfish', 'glasssquid', 'frilledshark', 'chimaera', 'isopod', 'goblinshark', 'barreleye', 'blobfish', 'vampsquid', 'loosejaw', 'seatoad', 'greenlandshark', 'anglerfish', 'fangtooth', 'bigfin', 'colossal', 'chickenmonster', 'tripodfish'] },
  { id:'dark', name:'life without the sun', blurb:'Where food comes from chemistry, or falls from above.',
    stops:['isopod', 'lostcity', 'vents', 'tubeworms', 'yeticrab', 'scalyfoot', 'whalefall', 'hagfish', 'sixgill', 'abyss', 'casper', 'seapig', 'chickenmonster', 'xeno', 'tripodfish', 'grenadier', 'trench', 'alicella', 'snailfish', 'amphipods', 'challenger'] },
  { id:'sizes', name:'from a whale to a microbe', blurb:'One long zoom through size: every animal at its true size beside the last, from a 25 m blue whale to a single cell under a thousandth of a millimetre.', journey:true },
  { id:'random', name:'a random swim', blurb:'Anywhere in the atlas, places you have not seen first.', random:true },
];
const TOUR = { id:null, i:0, playing:false, last:null, views:0, list:[] };
function tourStops(t) {
  if (!t.random) return t.stops.map(k => BYKEY[k]).filter(Boolean);
  // (night-only animals are left out by day: the swim would arrive at empty water)
  const all = PLACES().filter(o => o.kind !== 'subs' && !(NIGHT_ONLY.includes(o.key) && night() < 0.45)), un = all.filter(o => !SEEN.has(o.key)), sn = all.filter(o => SEEN.has(o.key));
  const sh = a => { const r = rng(Date.now() & 0xffff); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  return [...sh(un), ...sh(sn)].slice(0, 14);
}
function startTour(id, i = 0) {
  const t = TOURS.find(t => t.id === id); if (!t) return;
  if (t.journey) { startJourney(); renderTours(); return; }
  if (t.night && night() < 0.5) { TOD.min = 22 * 60 + 30; TOD.live = false; SET.clock = '0'; saveSettings(); syncSettings(); renderTime(); toast('a night dive: the clock is set to 22:30', 3500); }
  endJourney(true);
  stopRide(true);
  TOUR.id = id; TOUR.list = (TOUR.last && TOUR.last.id === id && TOUR.last.list) ? TOUR.last.list : tourStops(t);
  TOUR.i = clamp(i, 0, TOUR.list.length - 1); TOUR.playing = true; TOUR.last = null; TOUR.views = 0;
  VIEW.auto = true;
  flyTo(TOUR.list[TOUR.i]);
  renderTours(); updatePlay();
}
function leaveTour() {
  if (!TOUR.id) return;
  TOUR.last = { id:TOUR.id, i:TOUR.i, list:TOUR.list };
  TOUR.id = null; TOUR.playing = false;
  renderTours(); updatePlay();
}
function tourStep(dir) {
  if (RIDE.on) {
    // riding: send Nautile straight on to its next (or back to its previous) stop
    const t = simTime + SUB.off, tau = ((t % SUB.leg) + SUB.leg) % SUB.leg;
    SUB.off += dir > 0 ? SUB.leg - tau : -tau - SUB.leg + SUB.travel * 0.98;
    toast(dir > 0 ? 'on to the next stop' : 'back to the last stop', 1500); return;
  }
  if (JOURNEY.on) { journeyStep(dir); return; }
  if (TOUR.id) { const n = TOUR.i + dir; if (n < 0 || n >= TOUR.list.length) { if (n >= TOUR.list.length) toast('the end of the tour'); return; } TOUR.i = n; TOUR.views = 0; flyTo(TOUR.list[n]); }
  else if (TOUR.last) startTour(TOUR.last.id, TOUR.last.i + dir);
  else startTour('dive', 0);
}
const curTour = () => TOURS.find(t => t.id === TOUR.id);

// ---- camera events (from 09-camera.js)
function onFocus(o) { seenT = 0; renderInfo(); renderAtlasSel(); }
function onFlight(o) { renderInfo(); }
function onArrive(o) { TOUR.views = 0; renderInfo(); }
function onFree() { leaveTour(); renderInfo(); updatePlay(); }
function onViewDone(o) {
  if (TOUR.id && TOUR.playing && TOUR.list[TOUR.i] === o) {
    TOUR.views++;
    const want = Math.min(o.views.length, 2);
    if (TOUR.views >= want) {
      if (TOUR.i + 1 < TOUR.list.length) { TOUR.i++; TOUR.views = 0; flyTo(TOUR.list[TOUR.i]); renderInfo(); return; }
      if (curTour().random) { TOUR.list = tourStops(curTour()); TOUR.i = 0; TOUR.views = 0; flyTo(TOUR.list[0]); return; }
      toast('the end of the tour · pick another in tours');
      leaveTour(); TOUR.last = null; updatePlay();
    }
  }
  goView(VIEW.vi + 1);
}

// ---- going somewhere because the user asked
function userGo(o, vi = 0) {
  if (!o) return;
  if (NIGHT_ONLY.includes(o.key) && night() < 0.45) { TOD.min = 22 * 60 + 30; TOD.live = false; SET.clock = '0'; saveSettings(); syncSettings(); renderTime(); toast(`${o.name} only come out at night: the clock is set to 22:30`, 4000); }
  if (JOURNEY.on) endJourney(true);
  if (o.key === 'nautile') { startRide(); return; }
  stopRide(true);
  if (TOUR.id && TOUR.list[TOUR.i] !== o) leaveTour();
  endCompare();
  VIEW.auto = true; flyTo(o, vi); updatePlay();
}

// ---- the info panel
function renderInfo() {
  const o = RIDE.on ? BYKEY.nautile : (VIEW.mode === 'flight' ? VIEW.flight.o : VIEW.mode === 'free' ? null : VIEW.focus);
  const mode = $('mode');
  mode.className = 'mode';
  if (RIDE.on) { mode.textContent = 'riding'; mode.classList.add('m-ride'); }
  else if (JOURNEY.on) { mode.textContent = 'size journey'; mode.classList.add('m-tour'); }
  else if (VIEW.mode === 'free') { mode.textContent = 'free camera'; mode.classList.add('m-free'); }
  else if (TOUR.id) { mode.textContent = curTour().name; mode.classList.add('m-tour'); }
  else if (VIEW.mode === 'flight') mode.textContent = 'en route';
  else mode.textContent = 'locked on';
  const list = byDepth();
  $('stopInfo').textContent = TOUR.id ? `${TOUR.i + 1} / ${TOUR.list.length}` : (o && o.place ? `${list.indexOf(o) + 1} / ${list.length}` : `-- / ${list.length}`);
  NEAR.o = null;
  if (!o && CAM.depth < 0) {
    $('objName').textContent = 'above the waves';
    $('objType').textContent = 'the open sea, from the air';
    $('objFact').textContent = 'The ocean covers about 71 percent of the Earth and holds 97 percent of its water. It has taken up a quarter of the carbon dioxide we have released, and most of the extra heat. Press F to dive back in.';
  } else if (!o && (NEAR.o = nearPlace())) {
    const n = NEAR.o;
    $('objName').textContent = n.name;
    $('objType').textContent = (n.kind === 'places' ? 'you are at ' : 'near you: ') + n.type;
    $('objFact').textContent = n.fact || '';
  } else if (!o) {
    $('objName').textContent = 'open water';
    $('objType').textContent = zoneOf(CAM.depth).name + ' · ' + zoneOf(CAM.depth).sci;
    $('objFact').textContent = 'Swim with W A S D, rise and sink with R and F (rise all the way to come out above the waves), or drag the depth ladder. Click anything to lock on.';
  } else {
    $('objName').textContent = o.name;
    $('objType').textContent = o.type;
    $('objFact').textContent = o.fact || '';
  }
  $('infoPillName').textContent = o ? o.name : 'open water';
  const gn = $('goNext');
  if (TOUR.id && TOUR.i + 1 < TOUR.list.length) { gn.hidden = false; $('goNextTxt').textContent = 'next stop · ' + TOUR.list[TOUR.i + 1].label; }
  else gn.hidden = true;
  $('btnRideI').textContent = RIDE.on ? 'stop riding' : 'ride along';
  $('btnCockpit').hidden = !RIDE.on; $('btnCockpit').textContent = RIDE.cockpit ? 'outside' : 'cockpit';
  $('btnPoke').hidden = !(o && o.react && VIEW.mode !== 'flight');
  $('btnLock').hidden = !NEAR.o;
  if (NEAR.o && NEAR.o !== NEAR.last) toast(`you have reached ${NEAR.o.name}`);
  NEAR.last = NEAR.o;
  $('btnResume').hidden = !(TOUR.last && !TOUR.id);
}
// the lines that change every frame
let infoT = 0;
function updateInfoLive(dt) {
  infoT += dt; if (infoT < 0.2) return; infoT = 0;
  const o = RIDE.on ? BYKEY.nautile : (VIEW.mode === 'orbit' ? VIEW.focus : VIEW.mode === 'flight' ? VIEW.flight.o : null);
  const d = o ? depthOf(o) : CAM.depth;
  const z = zoneOf(d);
  $('objDist').textContent = `${fmtDepth(d)} · ${z.name}` + (o && o.size ? ` · ${o.kind === 'places' ? 'about ' : ''}${fmtLen(o.size)}${o.kind === 'places' ? ' across' : ' long'}` : '');
  const wl = o && !RIDE.on && WHERE[o.key] ? `in the wild: ${WHERE[o.key][2]}` : '';
  if ($('objWild').textContent !== wl) { $('objWild').textContent = wl; $('objWild').hidden = !wl; }
  const dd = Math.max(0, d);
  let ro = CAM.depth < 0 && !o ? `in the air · ${fmtInt(-CAM.depth)} m above the waves` : `${fmtInt(dd / 10 + 1)} atm · ${tempAt(dd).toFixed(1)} °C · ${fmtFrac(sunFrac(dd))}`;
  if (RIDE.on) ro = `Nautile is ${RIDE.status}\n` + ro;
  else if (o && o.readout) ro = o.readout() + '\n' + ro;
  if (VIEW.mode === 'flight') ro = `swimming to ${VIEW.flight.o.label} >>\n` + ro;
  $('readout').textContent = ro;
  // the ruler: a round length that makes a bar of a sensible size at the distance of what you are looking at
  const ppm = pxPerMetre(CAM.scale);
  let L = Math.pow(10, Math.floor(Math.log10(90 / ppm)));
  for (const k of [1, 2, 5, 10]) if (L * k * ppm <= 110) { var best = L * k; }
  $('scaleBar').style.width = Math.round(best * ppm) + 'px'; $('scaleTxt').textContent = '= ' + fmtLen(best);
  // the angle bar
  const fo = VIEW.focus;
  if (VIEW.mode === 'orbit' && fo && !RIDE.on) {
    const v = fo.views[VIEW.vi % fo.views.length], hold = (v.hold || 9) * DWELL[SET.dwell];
    const n = 18, k = VIEW.auto ? Math.round(clamp(VIEW.vt / hold, 0, 1) * n) : 0;
    $('progress').textContent = `angle ${VIEW.vi % fo.views.length + 1}/${fo.views.length}  [${'#'.repeat(k)}${'-'.repeat(n - k)}]${VIEW.auto ? '' : '  paused'}`;
  } else if (VIEW.mode === 'flight') {
    const n = 18, k = Math.round(clamp(VIEW.flight.t, 0, 1) * n);
    $('progress').textContent = `en route  [${'>'.repeat(k)}${'-'.repeat(n - k)}]`;
  } else $('progress').textContent = '';
  // seen after three seconds locked on
  if (VIEW.mode === 'orbit' && fo && !RIDE.on) { seenT += 0.2; if (seenT > 3) markSeen(fo); }
}

// ---- where you are while swimming freely: the place you are inside, or the creature you are next to
const NEAR = { o:null, last:null };
function nearPlace() {
  let best = null, bs = 1e9;
  for (const o of OBJS) {
    if (!o.place || o.hidden || o.kind === 'subs') continue;
    const d = vlen(vsub(o.pos, CAM.pos));
    const lim = o.kind === 'places' ? o.rad * 1.1 : Math.max(o.size * 4, vsizeOf(o) * 1.5, 0.5);
    if (d < lim && d / lim < bs) { bs = d / lim; best = o; }
  }
  return best;
}
$('btnLock').onclick = () => { if (NEAR.o) userGo(NEAR.o); };
$('btnPoke').onclick = () => triggerReact(VIEW.focus);

// ---- play, pause and the way back
function updatePlay() {
  const b = $('btnPlay'), s = b.querySelector('span');
  b.classList.toggle('paused', JOURNEY.on ? JOURNEY.paused : (!VIEW.auto || VIEW.mode === 'free'));
  if (VIEW.mode === 'free' && VIEW.last) s.textContent = 'back to ' + VIEW.last.label;
  else s.textContent = (JOURNEY.on ? !JOURNEY.paused : VIEW.auto) ? 'pause' : 'play';
  $('btnResume').hidden = !(TOUR.last && !TOUR.id);
  $('btnTourPause').textContent = TOUR.id && TOUR.playing ? 'pause tour' : 'play tour';
  $('btnTourPause').setAttribute('aria-pressed', String(!!(TOUR.id && !TOUR.playing)));
  $('btnFree').setAttribute('aria-pressed', String(VIEW.mode === 'free'));
}
function togglePlay() {
  if (JOURNEY.on) { JOURNEY.paused = !JOURNEY.paused; VIEW.manualT = 99; updatePlay(); toast(JOURNEY.paused ? 'paused · space to play' : 'playing'); return; }
  if (VIEW.mode === 'free') { if (VIEW.last) userGo(VIEW.last); return; }
  VIEW.auto = !VIEW.auto;
  if (TOUR.id) TOUR.playing = VIEW.auto;
  if (VIEW.auto) VIEW.manualT = 99;
  updatePlay(); toast(VIEW.auto ? 'playing' : 'paused · space to play');
}

// ---- search
let sugIdx = -1, sugList = [];
function searchMatches(q) {
  q = q.trim().toLowerCase(); if (!q) return [];
  const words = q.split(/\s+/);
  const kindName = o => (KINDS.find(k => k.id === o.kind) || {}).name || '';
  return PLACES().map(o => {
    const hay = `${o.name} ${o.label} ${o.type} ${kindName(o)} ${o.aka || ''} ${zoneOf(depthOf(o)).name}`.toLowerCase();
    const fact = (o.fact || '').toLowerCase(), where = (WHERE[o.key] ? WHERE[o.key][2] : '').toLowerCase();
    // names and kinds first; then where in the world it lives ("Japan", "Antarctica"); then words only in the facts ("glow", "teeth")
    const inHay = words.every(w => hay.includes(w));
    const inWhere = !inHay && words.every(w => hay.includes(w) || where.includes(w));
    const inFact = !inHay && !inWhere && words.every(w => hay.includes(w) || where.includes(w) || fact.includes(w));
    if (!inHay && !inWhere && !inFact) return null;
    const n = o.name.toLowerCase();
    return { o, s:(n.startsWith(q) ? 0 : n.includes(q) ? 1 : inHay ? 2 : inWhere ? 2.5 : 3) + depthOf(o) * 1e-6, fact:inFact, where:inWhere };
  }).filter(Boolean).sort((a, b) => a.s - b.s).map(m => { m.o._factHit = m.fact; m.o._whereHit = m.where; return m.o; });
}
function renderSuggest() {
  const q = $('search').value, box = $('suggest');
  const dm = /^\s*(\d[\d,\.]*)\s*(m|metres|meters|km)?\s*$/i.exec(q);
  sugList = searchMatches(q).slice(0, 8);
  box.innerHTML = '';
  if (dm) {
    let d = parseFloat(dm[1].replace(/,/g, '')); if (/km/i.test(dm[2] || '')) d *= 1000;
    d = clamp(d, 0, MAX_DEPTH);
    const b = document.createElement('button'); b.innerHTML = `<span>dive to ${fmtInt(d)} m</span><small>${zoneOf(d).name}</small>`;
    b.onclick = () => { diveTo(d); closeSearch(); }; box.appendChild(b);
    sugList.unshift({ dive:d });
  }
  for (const o of sugList) {
    if (o.dive != null) continue;
    const b = document.createElement('button');
    b.innerHTML = `<span></span><small></small>`;
    b.firstChild.textContent = o.name; b.lastChild.textContent = o._whereHit && WHERE[o.key] ? WHERE[o.key][2] : fmtDepth(depthOf(o));
    if (o._factHit) b.title = (o.fact || '').slice(0, 160);
    b.onclick = () => { userGo(o); closeSearch(); };
    box.appendChild(b);
  }
  box.hidden = !q.trim() || !box.children.length;
  sugIdx = -1;
}
function closeSearch() { $('search').value = ''; $('suggest').hidden = true; $('search').blur(); }
$('search').addEventListener('input', renderSuggest);
$('search').addEventListener('keydown', e => {
  const box = $('suggest'), n = box.children.length;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sugIdx = (sugIdx + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; [...box.children].forEach((c, i) => c.classList.toggle('kb', i === sugIdx)); }
  else if (e.key === 'Enter') { const c = box.children[Math.max(0, sugIdx)]; if (c) c.click(); else closeSearch(); }
  else if (e.key === 'Escape') closeSearch();
  e.stopPropagation();
});
$('search').addEventListener('blur', () => setTimeout(() => { $('suggest').hidden = true; }, 150));
function diveTo(d) { stopRide(true); leaveTour(); letGo(); VIEW.free.pitch = -0.15; FREE_DEPTH.target = d; FREE_DEPTH.dragging = false; updatePlay(); toast(`diving to ${fmtInt(d)} m`); }

// ---- panels: only one open at a time
const PANELS = { atlas:'btnAtlas', tours:'btnTours', timem:'btnTime', settings:'btnSettings', cmpPanel:null };
function openPanel(id, on) {
  for (const [p, b] of Object.entries(PANELS)) {
    const show = p === id ? (on ?? $(p).hidden) : false;
    $(p).hidden = !show; if (b) $(b).setAttribute('aria-expanded', String(show));
  }
  body.classList.toggle('atlas-open', !$('atlas').hidden);
  if (id === 'atlas' && !$('atlas').hidden) { renderAtlas(); scrollAtlasSel(); }
  if (id === 'tours' && !$('tours').hidden) renderTours();
  measureControls();
}
$('btnAtlas').onclick = () => openPanel('atlas'); $('atlasClose').onclick = () => openPanel('atlas', false);
$('btnTours').onclick = () => openPanel('tours'); $('toursClose').onclick = () => openPanel('tours', false);
$('btnTime').onclick = () => openPanel('timem'); $('timeClose').onclick = () => openPanel('timem', false);
$('btnSettings').onclick = () => openPanel('settings'); $('settingsClose').onclick = () => openPanel('settings', false);
$('cmpClose').onclick = () => openPanel('cmpPanel', false);
function measureControls() { const r = $('controls').getBoundingClientRect(); document.documentElement.style.setProperty('--ctl-b', Math.round(r.bottom) + 'px'); }

// ---- the atlas
const ATL = Object.assign({ sort:'kind', dir:1, unseen:false, cat:'all' }, load('atlas', {}));
function renderAtlas() {
  if ($('atlas').hidden) { updateSeenFoot(); return; }
  save('atlas', ATL);
  [...$('atlasSort').children].forEach(b => b.setAttribute('aria-checked', String(b.dataset.sort === ATL.sort)));
  $('atlasDir').querySelector('span').textContent = { kind:ATL.dir > 0 ? 'near first' : 'far first', depth:ATL.dir > 0 ? 'shallow first' : 'deep first', size:ATL.dir > 0 ? 'small first' : 'big first', name:ATL.dir > 0 ? 'a-z' : 'z-a' }[ATL.sort];
  $('atlasUnseen').setAttribute('aria-checked', String(ATL.unseen)); $('atlasUnseen').querySelector('b').textContent = ATL.unseen ? '[x]' : '[ ]';
  const all = PLACES();
  const cats = $('atlasCats');
  cats.innerHTML = '';
  const cell = (id, name, n) => { const b = document.createElement('button'); b.className = 'cell' + (id === 'all' ? ' allcell' : ''); b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(ATL.cat === id)); b.innerHTML = `<span></span><span class="n">${n}</span>`; b.firstChild.textContent = name; b.onclick = () => { ATL.cat = id; renderAtlas(); }; cats.appendChild(b); };
  cell('all', 'all', all.length);
  for (const k of KINDS) { const n = all.filter(o => o.kind === k.id).length; if (n) cell(k.id, k.name, n); }
  let list = all.filter(o => (ATL.cat === 'all' || o.kind === ATL.cat) && (!ATL.unseen || !SEEN.has(o.key)));
  const by = { kind:(a, b) => KINDS.findIndex(k => k.id === a.kind) - KINDS.findIndex(k => k.id === b.kind) || depthOf(a) - depthOf(b), depth:(a, b) => depthOf(a) - depthOf(b), size:(a, b) => a.size - b.size, name:(a, b) => a.name.localeCompare(b.name) }[ATL.sort];
  list.sort((a, b) => by(a, b) * (ATL.sort === 'kind' ? 1 : ATL.dir));
  if (ATL.sort === 'kind' && ATL.dir < 0) list = list.reverse();
  $('atlasCount').textContent = `${list.length} of ${all.length}`;
  const L = $('atlasList'); L.innerHTML = '';
  if (!list.length) { L.innerHTML = '<div class="atlas-empty">nothing here yet: every place of this kind has been seen</div>'; }
  let grp = null;
  for (const o of list) {
    const g = ATL.sort === 'kind' ? KINDS.find(k => k.id === o.kind).name : ATL.sort === 'depth' ? zoneOf(depthOf(o)).name : null;
    if (g && g !== grp) { grp = g; const h = document.createElement('div'); h.className = 'agroup'; h.innerHTML = `<b></b><span></span>`; h.firstChild.textContent = g; h.lastChild.textContent = ATL.sort === 'depth' ? zoneOf(depthOf(o)).sci : ''; L.appendChild(h); }
    const r = document.createElement('button'); r.className = 'arow'; r.setAttribute('role', 'option'); r.dataset.key = o.key;
    r.innerHTML = `<span class="an"></span><span class="ad"></span>`;
    r.firstChild.textContent = o.name;
    if (!SEEN.has(o.key)) { const i = document.createElement('i'); i.textContent = 'new'; r.firstChild.appendChild(i); }
    if (NIGHT_ONLY.includes(o.key)) { const i = document.createElement('i'); i.textContent = 'night'; i.style.color = 'var(--sub)'; r.firstChild.appendChild(i); }
    if (o.react) { const i = document.createElement('i'); i.textContent = 'reacts'; i.title = 'disturb it to see what it does'; i.style.color = 'var(--sub)'; r.firstChild.appendChild(i); }
    // (the depth, and for animals their length too: the two numbers that matter most here)
    r.lastChild.textContent = ATL.sort === 'size' ? fmtLen(o.size) : (o.kind === 'places' ? fmtDepth(depthOf(o)) : `${fmtLen(o.size)} · ${fmtInt(depthOf(o))} m`);
    r.onclick = () => userGo(o);
    L.appendChild(r);
  }
  renderAtlasSel(); updateSeenFoot();
}
function renderAtlasSel() { const k = VIEW.focus && VIEW.focus.key; for (const r of $('atlasList').querySelectorAll('.arow')) r.setAttribute('aria-selected', String(r.dataset.key === k)); }
function scrollAtlasSel() { const r = $('atlasList').querySelector('[aria-selected="true"]'); if (r) r.scrollIntoView({ block:'center' }); }
function updateSeenFoot() {
  const n = PLACES().length, s = [...SEEN].filter(k => BYKEY[k] && BYKEY[k].place).length;
  $('seenCount').textContent = `${s} of ${n}`;
  const w = 22, k = Math.round(s / n * w); $('seenBar').textContent = `[${'#'.repeat(k)}${'-'.repeat(w - k)}]`;
}
$('atlasSort').onclick = e => { const b = e.target.closest('button'); if (b) { ATL.sort = b.dataset.sort; renderAtlas(); } };
$('atlasDir').onclick = () => { ATL.dir = -ATL.dir; renderAtlas(); };
$('atlasUnseen').onclick = () => { ATL.unseen = !ATL.unseen; renderAtlas(); };

// ---- the tours panel
function renderTours() {
  const L = $('tourList'); L.innerHTML = '';
  for (const t of TOURS) {
    const b = document.createElement('button'); b.className = 'trow';
    const n = t.random ? 'endless' : t.journey ? `${JOURNEY_KEYS.length} sizes` : `${t.stops.length} stops`;
    b.innerHTML = '<b></b><small></small><em></em>';
    b.children[0].textContent = t.name; b.children[1].textContent = t.blurb; b.children[2].textContent = n;
    b.setAttribute('aria-current', String(TOUR.id === t.id || (t.journey && JOURNEY.on)));
    b.onclick = () => { startTour(t.id, 0); openPanel('tours', false); };
    L.appendChild(b);
  }
  updatePlay();
}
$('btnTourPause').onclick = () => { if (TOUR.id) { TOUR.playing = !TOUR.playing; VIEW.auto = TOUR.playing; } else if (TOUR.last) startTour(TOUR.last.id, TOUR.last.i); else startTour('dive'); updatePlay(); };
$('btnFree').onclick = () => { if (VIEW.mode === 'free') { if (VIEW.last) userGo(VIEW.last); } else letGo(); updatePlay(); };
$('tourPrev').onclick = () => tourStep(-1);
$('tourNext').onclick = () => tourStep(1);
$('goNext').onclick = () => tourStep(1);
$('btnResume').onclick = () => { if (TOUR.last) startTour(TOUR.last.id, TOUR.last.i); };

// ---- settings: segmented choices and toggles bound to SET
function syncSettings() {
  for (const seg of document.querySelectorAll('.seg[data-key]')) {
    const k = seg.dataset.key;
    for (const b of seg.querySelectorAll('button')) b.setAttribute('aria-checked', String(String(SET[k]) === b.dataset.v));
  }
  for (const b of document.querySelectorAll('.tog button[data-key]')) b.setAttribute('aria-pressed', String(!!SET[b.dataset.key]));
  document.documentElement.style.setProperty('--ts', SET.ts);
  $('textSize').value = SET.ts; $('tsTxt').textContent = Math.round(SET.ts * 100) + '%';
  $('volume').value = SET.volume;
  $('detailInfo').textContent = ASCII.cols ? `${ASCII.cols} x ${ASCII.rows} characters` : '';
  $('btnSound').classList.toggle('on', !!SET.sound);
  $('btnSound').setAttribute('aria-pressed', String(!!SET.sound));
  $('btnSound').textContent = SET.sound ? 'sound' : 'sound off';
  $('btnSub').setAttribute('aria-pressed', String(!!SET.subMark));
  $('labels').style.display = SET.labels ? '' : 'none';
}
document.addEventListener('click', e => {
  const b = e.target.closest('.seg[data-key] button[data-v]');
  if (b) { const k = b.closest('.seg').dataset.key; SET[k] = b.dataset.v; saveSettings(); syncSettings(); onSetting(k); return; }
  const t = e.target.closest('.tog button[data-key]');
  if (t) { const k = t.dataset.key; SET[k] = !SET[k]; saveSettings(); syncSettings(); onSetting(k); }
});
function onSetting(k) {
  if (k === 'detail') { asciiResize(true); syncSettings(); }
  if (k === 'sound') soundOn(SET.sound);
  if (k === 'clock') { TOD.live = false; }
  if (k === 'travel') toast('travel: ' + SET.travel);
}
$('textSize').oninput = e => { SET.ts = +e.target.value; saveSettings(); syncSettings(); measureControls(); };
$('volume').oninput = e => { SET.volume = +e.target.value; saveSettings(); soundVolume(); };
$('btnSound').onclick = () => { SET.sound = !SET.sound; saveSettings(); syncSettings(); soundOn(SET.sound); };
$('btnSub').onclick = () => { SET.subMark = !SET.subMark; saveSettings(); syncSettings(); };
$('btnPlay').onclick = togglePlay;
$('btnHelp').onclick = () => { $('help').hidden = false; };
// ---- how deep is deep: famous depths on one scale (linear, so the true emptiness of the deep shows)
const DEPTH_FACTS = [
  [40, 'recreational scuba limit'], [214, 'deepest free dive, one breath'], [332, 'deepest scuba dive'],
  [450, 'lanternfish by day', 'lanternfish'], [828, 'Burj Khalifa, stood on the floor'], [1000, 'last trace of sunlight'], [1280, 'leatherback turtle, record dive', 'leatherback'],
  [2000, 'sperm whales hunting', 'spermwhale'], [2992, 'beaked whale, record dive', 'beakedwhale'], [3800, 'the Titanic', 'titanic'], [4900, 'the abyssal plain', 'abyss'],
  [6000, 'Nautile’s rated depth'], [8336, 'deepest fish filmed', 'snailfish'], [8849, 'Everest, floor to surface'], [10935, 'the Challenger Deep', 'challenger']];
function renderDepths() {
  const C = $('depthChart'); C.innerHTML = '';
  const y = d => (d / 11000 * 100).toFixed(2) + '%';
  for (const z of ZONES) { const e = document.createElement('div'); e.className = 'dz'; e.style.top = y(z.from); e.textContent = z.from ? z.name : ''; C.appendChild(e); }
  // (labels too close together on one side are nudged apart, so the crowded top of the scale stays readable)
  const H = C.clientHeight || 600, last = [-1e9, -1e9];
  DEPTH_FACTS.forEach(([d, t, key], i) => {
    const side = i % 2, px = Math.max(d / 11000 * H, last[side] + 17); last[side] = px;
    const b = document.createElement('button'); b.className = 'dl' + (side ? ' r' : ''); b.style.top = px + 'px';
    b.innerHTML = '<i></i><b></b><span></span>'; b.children[1].textContent = fmtInt(d) + ' m'; b.children[2].textContent = t;
    b.onclick = () => { $('depths').hidden = true; if (key && BYKEY[key]) userGo(BYKEY[key]); else diveTo(d); };
    C.appendChild(b);
  });
}
$('depthsClose').onclick = () => { $('depths').hidden = true; };
$('depths').onclick = e => { if (e.target === $('depths')) $('depths').hidden = true; };
$('ladder').querySelector('.lad-cap').onclick = () => { $('depths').hidden = false; renderDepths(); };
$('btnNotes').onclick = () => { $('notes').hidden = false; save('notesSeen', NOTES_V); $('btnNotes').classList.remove('fresh'); };
$('notesClose').onclick = () => { $('notes').hidden = true; };
$('notes').onclick = e => { if (e.target === $('notes')) $('notes').hidden = true; };
const NOTES_V = '0.12';
if (load('notesSeen', '') !== NOTES_V) $('btnNotes').classList.add('fresh');
$('helpClose').onclick = () => { $('help').hidden = true; };
$('settingsHelp').onclick = () => { $('help').hidden = false; };
$('help').onclick = e => { if (e.target === $('help')) $('help').hidden = true; };
$('brand').onclick = () => userGo(BYKEY.reef);
$('prevObj').onclick = () => stepPlace(-1);
$('nextObj').onclick = () => stepPlace(1);
function stepPlace(dir) { const L = byDepth(), o = VIEW.focus || (VIEW.mode === 'flight' && VIEW.flight.o); const i = L.indexOf(o); userGo(L[(i + dir + L.length) % L.length]); }

// ---- info panel: less, hide
function setInfo(state) {
  body.classList.toggle('info-compact', state === 'compact'); body.classList.toggle('info-hidden', state === 'hidden');
  $('infoPill').hidden = state !== 'hidden'; $('infoMore').textContent = state === 'compact' ? 'more' : 'less';
  INFO_STATE = state;
}
let INFO_STATE = 'full';
$('infoMore').onclick = () => setInfo(INFO_STATE === 'compact' ? 'full' : 'compact');
$('infoHide').onclick = () => setInfo('hidden');
$('infoPill').onclick = () => setInfo('full');

// ---- time of day
function renderTime() {
  const m = Math.round(TOD.min) % 1440, h = Math.floor(m / 60), mm = m % 60;
  $('tmClock').textContent = `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  const elev = Math.sin((m / 60 - 6) / 12 * PI);
  $('tmSub').textContent = TOD.live ? 'your local time' : elev > 0.25 ? 'day: sunlight reaches down to about 1,000 m' : elev > -0.08 ? (m < 720 ? 'dawn' : 'dusk') + ': the light is changing' : 'night: moonlight, and the migrators have risen';
  if (document.activeElement !== $('tmSlider')) $('tmSlider').value = m;
}
$('tmSlider').oninput = e => { TOD.min = +e.target.value; TOD.live = false; renderTime(); };
$('tmNow').onclick = () => { const d = new Date(); TOD.min = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; TOD.live = true; SET.clock = '1'; saveSettings(); syncSettings(); renderTime(); };
// the night migration, sped up: from late afternoon until the lanternfish are near the surface
const MIG = { on:false };
function startMigration() {
  openPanel(null); stopRide(true); leaveTour();
  TOD.min = 16 * 60 + 50; TOD.live = false; SET.clock = '45'; saveSettings(); syncSettings();
  const o = BYKEY.lanternfish; moveObj(o, simTime); lockOn(o, 1); VIEW.auto = false;
  MIG.on = true; renderTime(); updatePlay();
  toast('dusk, sped up: watch the lanternfish rise', 4000);
}
function tickMigration() {
  if (!MIG.on) return;
  const o = BYKEY.lanternfish;
  if (VIEW.focus !== o || VIEW.mode !== 'orbit') { MIG.on = false; $('caption').hidden = true; return; }
  const d = -o.pos[1], clock = $('tmClock').textContent;
  $('caption').hidden = false; $('capBtn').hidden = true;
  $('capText').textContent = d > 430 ? `${clock} · day: the lanternfish wait in the twilight zone at ${fmtInt(d)} m, where hunters cannot see them`
    : d > 70 ? `${clock} · dusk: the migration has begun. ${fmtInt(d)} m deep and rising, ${Math.max(1, Math.round((o.climb || 0) * 60 / (+SET.clock || 1) * 60))} m an hour in real time`
    : `${clock} · night: risen to ${fmtInt(d)} m to feed on the plankton near the surface. They will sink again before dawn.`;
  if (d <= 70 && TOD.min > 19 * 60) { SET.clock = '0'; saveSettings(); syncSettings(); }
}
$('tmMigrate').onclick = startMigration;
function tickTime(dt) {
  tickMigration();
  const rate = +SET.clock || 0;
  if (rate) TOD.min = (TOD.min + dt * rate / 60 + 1440) % 1440;
}

// ---- the depth ladder
const LAD_MAX = MAX_DEPTH + 65;
const ladF = d => Math.log(1 + Math.max(0, d) / 20) / Math.log(1 + LAD_MAX / 20);
const ladD = f => 20 * (Math.exp(clamp(f, 0, 1) * Math.log(1 + LAD_MAX / 20)) - 1);
const LAD_PICK = ['surface', 'reef', 'kelp', 'bluewhale', 'lanternfish', 'giantsquid', 'spermwhale', 'anglerfish', 'vents', 'titanic', 'abyss', 'snailfish', 'challenger'];
function buildLadder() {
  const tr = $('ladTrack'), lad = $('ladder');
  for (const t of lad.querySelectorAll('.tick')) t.remove();
  const H = tr.getBoundingClientRect().height - 12;
  const put = (d, el) => { el.style.top = (ladF(d) * (lad.getBoundingClientRect().height)) + 'px'; lad.appendChild(el); };
  for (const z of ZONES) { const e = document.createElement('div'); e.className = 'tick zone'; e.textContent = z.name; put(z.from + (z.from ? 0 : 0.5), e); e.style.transform = 'translateY(2px)'; }
  const used = [];
  for (const k of LAD_PICK) {
    const o = BYKEY[k]; if (!o) continue;
    const y = ladF(depthOf(o)) * lad.getBoundingClientRect().height;
    if (used.some(u => Math.abs(u - y) < 19)) continue; used.push(y);
    const b = document.createElement('button'); b.className = 'tick'; b.textContent = o.label; b.dataset.key = k;
    b.onclick = e => { e.stopPropagation(); userGo(o); };
    put(depthOf(o), b);
  }
}
function updateLadder() {
  const lad = $('ladder'), h = lad.getBoundingClientRect().height;
  const d = CAM.depth;
  $('ladMark').style.top = (ladF(Math.max(d, 0)) * h) + 'px';
  $('ladTxt').textContent = d < -0.5 ? 'above' : d < 1 ? fmtLen(Math.max(d, 0.01)) : fmtInt(d) + ' m';
  const fk = VIEW.focus && VIEW.focus.key;
  for (const t of lad.querySelectorAll('.tick[data-key]')) t.classList.toggle('here', t.dataset.key === fk);
}
{
  const lad = $('ladder');
  const depthAtY = y => { const r = lad.getBoundingClientRect(); return clamp(ladD((y - r.top) / r.height), 0.3, MAX_DEPTH - 2); };
  let drag = false;
  const down = e => { e.preventDefault(); drag = true; lad.classList.add('dragging'); stopRide(true); leaveTour(); letGo(); VIEW.free.pitch = clamp(VIEW.free.pitch, -0.4, 0.2); FREE_DEPTH.dragging = true; FREE_DEPTH.target = depthAtY(e.clientY); e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId); updatePlay(); };
  const move = e => { if (!drag) return; FREE_DEPTH.target = depthAtY(e.clientY); };
  const up = () => { if (!drag) return; drag = false; lad.classList.remove('dragging'); FREE_DEPTH.dragging = false; };
  $('ladMark').addEventListener('pointerdown', down); $('ladTrack').addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  $('ladMark').addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); letGo(); const f = ladF(CAM.depth) + (e.key === 'ArrowDown' ? 0.02 : -0.02); FREE_DEPTH.target = ladD(f); }
  });
}

// ---- labels on what is near
const LABELS = new Map();
function labelFor(o) {
  let el = LABELS.get(o);
  if (!el) { el = document.createElement('button'); el.className = 'lab' + (o.key === 'nautile' ? ' sub' : ''); el.textContent = o.label; el.tabIndex = -1; el.onclick = () => userGo(o); $('labels').appendChild(el); LABELS.set(o, el); }
  return el;
}
function updateLabels() {
  if (!SET.labels || body.classList.contains('photo') && !PHOTO.labels) { for (const el of LABELS.values()) el.classList.remove('on'); return; }
  const R = visRange() * 2.2, cand = [];
  for (const o of OBJS) {
    if (!o.place || o.hidden) continue;
    const d = vlen(vsub(o.pos, CAM.pos));
    if (o === VIEW.focus && VIEW.mode === 'orbit' && !RIDE.on) { if (LABELS.has(o)) LABELS.get(o).classList.remove('on'); continue; }
    if (d - o.rad > R || o.rad / d < 0.0004) { if (LABELS.has(o)) LABELS.get(o).classList.remove('on'); continue; }
    const s = project(vadd(o.pos, [0, o.rad * 0.6, 0]));
    if (!s || s.x < 10 || s.y < 40 || s.x > innerWidth - 90 || s.y > innerHeight - 20) { if (LABELS.has(o)) LABELS.get(o).classList.remove('on'); continue; }
    cand.push({ o, d, s });
  }
  cand.sort((a, b) => a.d - b.d);
  const shown = [];
  cand.forEach((c, i) => {
    const el = labelFor(c.o);
    const clash = shown.some(p => Math.abs(p.x - c.s.x) < 90 && Math.abs(p.y - c.s.y) < 16);
    if (i > 9 || clash) { el.classList.remove('on'); return; }
    shown.push(c.s);
    el.style.transform = `translate(${Math.round(c.s.x + 8)}px, ${Math.round(c.s.y - 10)}px)`;
    el.classList.add('on');
  });
  for (const [o, el] of LABELS) if (!cand.some(c => c.o === o)) el.classList.remove('on');
}

// ---- today's discovery
function setupDaily() {
  const day = Math.floor(Date.now() / 864e5), all = byDepth().filter(o => o.kind !== 'subs');
  // today's pick, chosen from what you have not seen yet (the same pick all day); "another" deals a fresh one
  let roll = 0;
  const pick = () => { const un = all.filter(o => !SEEN.has(o.key)), L = un.length ? un : all; return L[hashU(day * 31 + 7 + roll * 977) % L.length]; };
  if (load('dailyX', -1) === day) return;
  const show = () => { const o = pick(); $('dailyName').textContent = o.name; $('dailyType').textContent = o.type; $('dailyGo').onclick = () => userGo(o); $('dailyShare').onclick = () => share(o); };
  $('daily').hidden = false; show();
  $('dailyAnother').onclick = () => { roll++; show(); };
  $('dailyClose').onclick = () => { $('daily').hidden = true; save('dailyX', day); };
}

// ---- share: a link to this place and angle
function share(o) {
  o = o || VIEW.focus;
  // the place, the angle, and the time of day when it is not daytime (a night dive is shared as a night dive)
  const tod = night() > 0.3 ? `@${String(Math.floor(TOD.min / 60)).padStart(2, '0')}${String(Math.floor(TOD.min % 60)).padStart(2, '0')}` : '';
  const url = location.origin + location.pathname + (o ? `#${o.key}${VIEW.focus === o && VIEW.vi ? '/' + VIEW.vi : ''}${tod}` : '');
  try { history.replaceState(null, '', url); } catch (e) {}
  (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast('link copied'), () => toast(url, 5000));
}
$('btnShare').onclick = () => share();
$('btnFull').onclick = () => {
  try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => toast('full screen is not available here')); }
  catch (e) { toast('full screen is not available here'); }
};
document.addEventListener('fullscreenchange', () => { $('btnFull').innerHTML = document.fullscreenElement ? '&#9974; leave full screen' : '&#9974; full screen'; });
if (!document.documentElement.requestFullscreen) $('btnFull').parentElement.hidden = true;   // (iPhones cannot)
$('objWild').onclick = () => { openPanel('mapPanel', true); setMapMode('world'); };
function fromHash() {
  const m = /^#([a-z0-9]+)(?:\/(\d+))?(?:@(\d\d)(\d\d))?/.exec(location.hash || '');
  if (m && m[3]) { TOD.min = (+m[3] * 60 + +m[4]) % 1440; TOD.live = false; }
  if (m && BYKEY[m[1]]) return { o:BYKEY[m[1]], vi:+(m[2] || 0) };
  return null;
}

// ---- if the graphics card resets (a driver update, too many tabs, a laptop waking up), the page would stay blank: instead it
// reloads itself where it was. (Never more than twice a minute, so a card that keeps failing cannot trap it in a loop.)
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); toast('the graphics card reset: bringing the view back...', 8000); setTimeout(glReload, 4000); });
canvas.addEventListener('webglcontextrestored', () => glReload());
function glReload() {
  if (glReload.done) return; glReload.done = true;
  let n = []; try { n = JSON.parse(sessionStorage.getItem('glReloads') || '[]').filter(t => Date.now() - t < 60000); } catch (e) {}
  if (n.length >= 2) { $('nogl').textContent = 'The graphics card keeps resetting. Reload the page to try again.'; $('nogl').hidden = false; return; }
  try { sessionStorage.setItem('glReloads', JSON.stringify([...n, Date.now()])); } catch (e) {}
  const o = VIEW.focus, tod = `@${String(Math.floor(TOD.min / 60)).padStart(2, '0')}${String(Math.floor(TOD.min % 60)).padStart(2, '0')}`;
  location.replace(location.pathname + location.search + (o ? `#${o.key}${VIEW.vi ? '/' + VIEW.vi : ''}${tod}` : ''));
  setTimeout(() => location.reload(), 50);   // (a hash-only change would not reload by itself)
}

// ---- photo mode
const PHOTO = { on:false, labels:false, frozen:false, keepTime:'1', want:null };
function photo(on) {
  PHOTO.on = on; body.classList.toggle('photo', on); $('photoBar').hidden = !on;
  if (!on && PHOTO.frozen) { SET.time = PHOTO.keepTime; PHOTO.frozen = false; $('phFreeze').setAttribute('aria-pressed', 'false'); }
}
$('btnPhoto').onclick = () => photo(true);
$('phClose').onclick = () => photo(false);
$('phLabels').onclick = () => { PHOTO.labels = !PHOTO.labels; $('phLabels').setAttribute('aria-pressed', String(PHOTO.labels)); };
$('phFreeze').onclick = () => { PHOTO.frozen = !PHOTO.frozen; if (PHOTO.frozen) { PHOTO.keepTime = SET.time; SET.time = '0'; } else SET.time = PHOTO.keepTime; $('phFreeze').setAttribute('aria-pressed', String(PHOTO.frozen)); };
$('phSave').onclick = () => { PHOTO.want = 'png'; };
$('phText').onclick = () => { PHOTO.want = 'text'; };
function afterFrame() {
  if (!PHOTO.want) return;
  const w = PHOTO.want; PHOTO.want = null;
  const name = `deepatlas-${(VIEW.focus && VIEW.focus.key) || 'ocean'}`;
  if (w === 'png') canvas.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name + '.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('picture saved'); });
  else { const t = asciiText(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast(`copied ${ASCII.cols} x ${ASCII.rows} characters`), () => toast('the clipboard is not available here')); }
}

// ---- compare sizes: another creature beside this one, at true scale
const CMP = { obj:null };
function openCompare() {
  const o = VIEW.focus; if (!o || VIEW.mode !== 'orbit') { toast('lock on to something first'); return; }
  const L = $('cmpList'); L.innerHTML = '';
  const choices = [{ key:'diver', name:'a scuba diver', size:1.8, build:mkDiver }, { key:'bus', name:'a double-decker bus', size:11, build:mkBus }, ...PLACES().filter(p => p !== o && p.parts.length && p.kind !== 'places' && !p.parts[0].inst && p.kind !== 'subs').map(p => ({ key:p.key, name:p.name, size:p.size, src:p }))];
  choices.sort((a, b) => a.size - b.size);
  for (const c of choices) {
    const b = document.createElement('button'); b.className = 'arow'; b.innerHTML = '<span class="an"></span><span class="ad"></span>';
    b.firstChild.textContent = c.name; b.lastChild.textContent = fmtLen(c.size);
    b.onclick = () => { startCompare(o, c); openPanel('cmpPanel', false); };
    L.appendChild(b);
  }
  openPanel('cmpPanel', true);
}
function startCompare(o, c) {
  endCompare();
  const src = c.src ? c.src.parts[0] : { build:c.build, scale:1, mat:M_SKIN };
  // stacked one above the other, both in profile, so their lengths line up for comparing
  const big = Math.max(o.size, c.size), off = (o.size + c.size) * 0.22 + big * 0.12;
  const p = Object.assign({}, src, { off:[0, 0, 0], school:null, inst:null, mesh:src.inst ? null : src.mesh });
  const cmp = { key:'cmp', name:c.name, label:c.name, type:'for comparison', kind:'subs', size:c.size, rad:c.size * 0.6, place:false, temp:true, hidden:false,
    anchor:[0, 0, 0], pos:[0, 0, 0], fwd:[1, 0, 0], up:[0, 1, 0], parts:[p], views:[], motion:{ type:'still', fn:(me) => {
      const f = vnorm([o.fwd[0], 0, o.fwd[2]]);
      me.pos = vadd(o.pos, [0, -off, 0]); me.fwd = isFinite(f[0]) ? f : [1, 0, 0]; me.up = [0, 1, 0]; me.side = vcross(me.fwd, me.up);
    } } };
  cmp.idx = OBJS.length; OBJS.push(cmp); CMP.obj = cmp;
  // hold the animal level and still while comparing, so both stay in profile
  const f0 = vnorm([o.fwd[0], 0, o.fwd[2]]); o.fwd = isFinite(f0[0]) ? f0 : [1, 0, 0]; o.up = [0, 1, 0]; o.side = vcross(o.fwd, o.up);
  o.frozen = true; CMP.src = o; VIEW.fyaw = frameYaw(o);
  // frame both from the side
  VIEW.trans = { t:0, T:3, from:{ yaw:VIEW.yaw, pitch:VIEW.pitch, dist:VIEW.dist, off:VIEW.off.slice() }, to:{ yaw:PI / 2, pitch:0.05, dist:Math.max(big * 0.78, off * 2.4) * portraitK(), off:[0, -off / 2, 0], frame:'obj' } };
  VIEW.frame = 'obj'; VIEW.auto = false; updatePlay();
  $('caption').hidden = false; $('capBtn').hidden = false;
  $('capText').textContent = `${c.name} (${fmtLen(c.size)}) beside ${o.name} (${fmtLen(o.size)}), at true scale`;
}
function endCompare() {
  if (!CMP.obj) return;
  if (CMP.src) { CMP.src.frozen = false; CMP.src = null; }
  const i = OBJS.indexOf(CMP.obj); if (i >= 0) OBJS.splice(i, 1);
  CMP.obj = null; $('caption').hidden = true;
}
$('btnCompare').onclick = openCompare;
$('capBtn').onclick = () => { if (JOURNEY.on) { endJourney(); return; } endCompare(); VIEW.auto = true; goView(VIEW.vi); updatePlay(); };

// ---- riding along with Nautile
const RIDE = { on:false, status:'', cockpit:false };
function toggleCockpit() { if (!RIDE.on) startRide(); RIDE.cockpit = !RIDE.cockpit; $('btnCockpit').textContent = RIDE.cockpit ? 'outside' : 'cockpit'; toast(RIDE.cockpit ? 'in the cockpit: three crew lie in a titanium sphere looking out of small windows like this' : 'outside, following Nautile', 3500); }
function startRide() {
  // (each ride starts somewhere new on the route, so riding shows more than the shallows)
  if (!SUB.started) { SUB.started = true; SUB.off += Math.floor(Math.random() * SUB.stops.length) * SUB.leg; }
  endCompare(); leaveTour();
  RIDE.on = true; VIEW.mode = 'ride'; VIEW.flight = null;
  $('btnRide').setAttribute('aria-pressed', 'true');
  renderInfo(); toast('riding along with Nautile · B or esc to stop');
}
function stopRide(quiet) {
  if (!RIDE.on) return;
  RIDE.on = false; RIDE.cockpit = false; $('btnRide').setAttribute('aria-pressed', 'false');
  if (!quiet) { lockOn(BYKEY.nautile); }
  renderInfo();
}
$('btnRide').onclick = () => RIDE.on ? stopRide() : startRide();
$('btnRideI').onclick = () => RIDE.on ? stopRide() : startRide();
$('btnCockpit').onclick = toggleCockpit;
function updateRide(dt) {
  const s = BYKEY.nautile;
  if (RIDE.cockpit) {
    // in the crew sphere, looking out of the nose window; the floodlights reach about 8 m ahead
    CAM.pos = vmad(vmad(s.pos, s.fwd, 4.4), s.up, -0.45);
    setBasis(vlerp(CAM.fwd, vnorm(vadd(s.fwd, vmul(s.up, -0.12))), 1 - Math.exp(-dt * 6)));
    CAM.scale = 8; CAM.lampD = 8;
    return;
  }
  const back = vmad(vmad(s.pos, s.fwd, -17), [0, 1, 0], 5);
  const want = clampCam(back, 10);
  const k = 1 - Math.exp(-dt * 2.5);
  CAM.pos = vlerp(CAM.pos, want, k);
  const look = vmad(s.pos, s.fwd, 7);
  setBasis(vlerp(CAM.fwd, vnorm(vsub(look, CAM.pos)), k * 1.5));
  CAM.scale = vlen(vsub(s.pos, CAM.pos));
}
// the sub's own itinerary: it visits places from the surface down and back, lingering at each
const SUB = { stops:[], leg:70, travel:24, off:0 };
function subMotion(o, t) {
  const S = SUB.stops; if (!S.length) return;
  t += SUB.off;
  const N = S.length * 2 - 2, cyc = SUB.leg * N, tt = ((t % cyc) + cyc) % cyc;
  const k = Math.floor(tt / SUB.leg), tau = tt - k * SUB.leg;
  const idx = i => { i = ((i % N) + N) % N; return i < S.length ? i : N - i; };
  const ring = (p, tw) => { const R = Math.max(11, p.rad * 1.3 + 8), a = tw * 0.06 + p.idx; return [p.pos[0] + R * Math.cos(a), Math.min(-2, p.pos[1] + Math.max(2, p.rad * 0.4)), p.pos[2] + R * Math.sin(a)]; };
  const cur = S[idx(k)], prev = S[idx(k - 1)];
  let pos, look;
  if (tau < SUB.travel) {
    const a = ring(prev, SUB.leg - SUB.travel + SUB.leg * 0), b = ring(cur, 0), s = tau / SUB.travel;
    const down = b[1] < a[1];
    const hx = ease(clamp(down ? s / 0.6 : (s - 0.4) / 0.6, 0, 1)), vy = ease(clamp(down ? (s - 0.4) / 0.6 : s / 0.6, 0, 1));
    pos = [lerp(a[0], b[0], hx), lerp(a[1], b[1], vy), lerp(a[2], b[2], hx)];
    RIDE.status = `on its way to ${cur.label}`;
  } else {
    pos = ring(cur, tau - SUB.travel);
    RIDE.status = `visiting ${cur.label}`;
  }
  // keep clear: never inside another animal or place, at least 4 m off the floor and 3 m under the surface
  for (const q of OBJS) {
    if (q === o || q.temp || !q.pos || q.kind === 'subs') continue;
    // (wide flat places like the reef are kept clear of sideways; animals and wrecks all round)
    const flat = q.kind === 'places' && !!q.floor;
    const dv = flat ? [pos[0] - q.pos[0], 0, pos[2] - q.pos[2]] : vsub(pos, q.pos), dd = vlen(dv), lim = q.rad + (flat ? 10 : 6);
    if (dd < lim && dd > 1e-6) { const np = vmad(q.pos, dv, lim / dd); pos = flat ? [np[0], pos[1], np[2]] : np; }
  }
  pos[1] = Math.min(Math.max(pos[1], floorY(pos[0], pos[2]) + 4), -3);
  const vel = vsub(pos, o._last || pos);
  o._last = pos;
  if (vlen(vel) > 1e-6) o._dir = vnorm(vlerp(o._dir || vel, vnorm(vel), 0.08));
  o.pos = pos; o.fwd = o._dir || [1, 0, 0];
  const sd = vnorm(vcross(o.fwd, [0, 1, 0])); o.up = isFinite(sd[0]) ? vnorm(vcross(sd, o.fwd)) : [0, 1, 0]; o.side = vcross(o.fwd, o.up);
  o.visiting = cur;
}
function addSub() {
  addObj({ key:'nautile', name:'Nautile', label:'Nautile', type:'Ifremer\u2019s deep submersible \u00b7 rated to 6,000 m', kind:'subs', at:[1200, 40, 5], size:8, rad:4.6,
    fact:'France\u2019s deep-diving submersible, in service since 1984: three crew lie in a titanium sphere in the nose, looking out through three small windows. In 1987 it made the first dives to recover objects from the Titanic\u2019s debris field.',
    motion:{ type:'still', fn:subMotion },
    parts:[part(mkNautile, { mat:[1, 0.3, 1.6, 0.9] })],
    views:[{ d:[0.7, 0.3, 1], k:1.5, hold:10, drift:0.02 }, { d:[1, 0.05, 0.25], k:1.2, hold:8, drift:0.02 }, { d:[-1, 0.4, 0.6], k:1.5, hold:8, drift:0.02 }] });
  // its route: everything it can reach, down to its rated 6,000 m (the trenches are beyond it)
  const SHALLOWS = ['surface', 'manowar', 'noctiluca', 'reef', 'clownfish', 'seahorse', 'octopus', 'bluetang', 'kelp', 'turtle', 'lionfish', 'parrotfish', 'moray', 'flyingfish', 'cuttlefish', 'mantisshrimp', 'nudibranch', 'puffer', 'seaotter', 'garibaldi', 'blacktip', 'snappers', 'flashlight', 'gardeneels', 'stingray', 'seaice', 'narwhal', 'mangroves', 'seagrass', 'dugong', 'sargassum', 'sargassumfish', 'grouper', 'blueringed', 'bubblenet', 'beluga', 'lionsmane', 'boxjelly', 'seadragon', 'sealion', 'goby', 'barracuda', 'leatherback', 'fireflysquid', 'flounder', 'wreck', 'baskingshark', 'xmastree', 'giantclam', 'polarbear', 'tuna', 'seakrait', 'coconutoctopus', 'torpedo', 'sleepingwhales', 'batfish', 'humboldt', 'mimic', 'spinners', 'walrus', 'hatchlings', 'frogfish', 'featherstar', 'seabutterfly', 'giantoctopus', 'stargazer'];
  SUB.stops = byDepth().filter(o => o.kind !== 'micro' && o.size < 200 && o.kind !== 'subs' && o.key !== 'trench' && !SHALLOWS.includes(o.key) && depthOf(o) < 6000
    && floorDepth(o.pos[0], o.pos[2]) > 15);   // (nor into water too shallow for it)
}
function updateSubMark() {
  const m = $('subMark'), s = BYKEY.nautile;
  if (!SET.subMark || RIDE.on || body.classList.contains('photo')) { m.hidden = true; return; }
  const p = project(s.pos);
  if (!p || p.x < 0 || p.y < 0 || p.x > innerWidth || p.y > innerHeight) { m.hidden = true; return; }
  const r = Math.max(20, s.rad * pxPerMetre(p.w));
  m.hidden = false; m.style.width = m.style.height = 2 * r + 'px';
  m.style.transform = `translate(${p.x - r}px, ${p.y - r}px)`;
}
$('subMark').onclick = () => userGo(BYKEY.nautile);

// ---- the pointer on the ocean: drag to orbit, right-drag to let go, wheel and pinch to zoom, click to go
{
  let drag = null, moved = 0;
  const ptrs = new Map();
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    drag = { x:e.clientX, y:e.clientY, b:e.button }; moved = 0; canvas.classList.add('dragging'); wake();
    if (e.button === 2 && VIEW.mode !== 'free') { stopRide(true); letGo(); updatePlay(); }
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    if (ptrs.has(e.pointerId)) {
      const prev = ptrs.get(e.pointerId);
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()], d0 = Math.hypot(a[0] - b[0], a[1] - b[1]);
        ptrs.set(e.pointerId, [e.clientX, e.clientY]);
        const [c, d] = [...ptrs.values()], d1 = Math.hypot(c[0] - d[0], c[1] - d[1]);
        if (d0 > 0 && d1 > 0) zoomBy(d0 / d1);
        moved += 10; return;
      }
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      const dx = e.clientX - prev[0], dy = e.clientY - prev[1];
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved < 4) return;
      turnBy(dx, dy);
    }
  });
  const end = e => {
    ptrs.delete(e.pointerId);
    if (!drag) return;
    canvas.classList.remove('dragging');
    if (moved < 4 && drag.b === 0 && ptrs.size === 0) { const o = pick(e.clientX, e.clientY); if (o && o === VIEW.focus && o.react && VIEW.mode === 'orbit') triggerReact(o); else if (o) userGo(o); else waterSpark(e.clientX, e.clientY); }
    if (ptrs.size === 0) drag = null;
  };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', e => { e.preventDefault(); wake(); zoomBy(Math.exp(e.deltaY * (e.deltaMode ? 0.05 : 0.0015))); }, { passive:false });
}
function turnBy(dx, dy) {
  VIEW.manualT = 0;
  if (RIDE.on) return;
  if (VIEW.mode === 'journey') { JOURNEY.yaw += dx * 0.006; JOURNEY.pitch = clamp((JOURNEY.pitch ?? 0.14) + dy * 0.005, -1.3, 1.3); return; }
  if (VIEW.mode === 'free') { VIEW.free.yaw += dx * 0.004; VIEW.free.pitch = clamp(VIEW.free.pitch - dy * 0.004, -1.5, 1.5); return; }
  if (VIEW.mode === 'flight') return;
  VIEW.trans = null;
  VIEW.yaw += dx * 0.006; VIEW.pitch = clamp(VIEW.pitch + dy * 0.005, -1.45, 1.45);
}
function zoomBy(f) {
  VIEW.manualT = 0;
  if (VIEW.mode === 'free') { CAM.scale = clamp(CAM.scale * f, 1e-6, 400); CAM.pos = vmad(CAM.pos, CAM.fwd, CAM.scale * (1 - f)); return; }
  if (VIEW.mode !== 'orbit' || !VIEW.focus) return;
  if (VIEW.trans) { VIEW.trans.to.dist *= f; return; }
  const o = VIEW.focus;
  VIEW.dist = clamp(VIEW.dist * f, Math.max(vsizeOf(o) * 0.12, 1e-7), Math.max(400, vsizeOf(o) * 6));
}

// ---- keys
window.addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input')) return;
  if (SAVER.on) { stopSaver(); e.preventDefault(); return; }
  wake();
  const k = e.key.toLowerCase();
  if ('wasdrf'.includes(k) && k.length === 1 && !e.ctrlKey && !e.metaKey) {
    if (VIEW.mode !== 'free') { stopRide(true); letGo(); updatePlay(); }
    KEYS.add(k); return;
  }
  if (e.key === 'Shift') { KEYS.add('shift'); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  switch (k) {
    case '/': e.preventDefault(); $('search').focus(); break;
    case ' ': e.preventDefault(); togglePlay(); break;
    case 'h': userGo(BYKEY.reef); break;
    case '?': $('help').hidden = !$('help').hidden; break;
    case 'i': setInfo(INFO_STATE === 'hidden' ? 'full' : 'hidden'); break;
    case 'p': photo(!PHOTO.on); break;
    case 'z': startSaver(); break;
    case 'b': RIDE.on ? stopRide() : startRide(); break;
    case 'c': toggleCockpit(); break;
    case 'o': $('btnMap').click(); break;
    case 'n': { const dark = night() > 0.45; TOD.min = dark ? 10 * 60 + 30 : 22 * 60 + 30; TOD.live = false; SET.clock = '0'; saveSettings(); syncSettings(); renderTime(); toast(dark ? 'day: 10:30' : 'night: 22:30'); break; }
    case 'x': if (VIEW.focus && VIEW.focus.react) triggerReact(VIEW.focus); else if (VIEW.focus) toast(`${VIEW.focus.name}: nothing happens when disturbed`); break;
    case 'g': SET.glow = !SET.glow; saveSettings(); syncSettings(); toast('glow ' + (SET.glow ? 'on' : 'off')); break;
    case 'l': SET.labels = !SET.labels; saveSettings(); syncSettings(); toast('labels ' + (SET.labels ? 'on' : 'off')); break;
    case 'm': SET.sound = !SET.sound; saveSettings(); syncSettings(); soundOn(SET.sound); break;
    case 'v': SET.detail = String((+SET.detail + 1) % 4); saveSettings(); asciiResize(true); syncSettings(); toast('detail: ' + ['ultra', 'fine', 'normal', 'bold'][+SET.detail]); break;
    case 'y': SET.travel = { slow:'quick', quick:'warp', warp:'slow' }[SET.travel]; saveSettings(); syncSettings(); toast('travel: ' + SET.travel); break;
    case '[': tourStep(-1); break;
    case ']': tourStep(1); break;
    case '+': case '=': zoomBy(0.8); break;
    case '-': case '_': zoomBy(1.25); break;
    case 'arrowleft': stepPlace(-1); break;
    case 'arrowright': stepPlace(1); break;
    case 'escape':
      if (!$('help').hidden) { $('help').hidden = true; break; }
      if (!$('notes').hidden) { $('notes').hidden = true; break; }
      if (!$('depths').hidden) { $('depths').hidden = true; break; }
      if (PHOTO.on) { photo(false); break; }
      if (JOURNEY.on) { endJourney(); break; }
      if (CMP.obj) { $('capBtn').click(); break; }
      if ([...Object.keys(PANELS)].some(p => !$(p).hidden)) { openPanel(null); break; }
      if (RIDE.on) { stopRide(); break; }
      if (VIEW.mode !== 'free') { letGo(); updatePlay(); }
      break;
  }
});
window.addEventListener('keyup', e => { KEYS.delete(e.key.toLowerCase()); if (e.key === 'Shift') KEYS.delete('shift'); });
window.addEventListener('blur', () => KEYS.clear());

// ---- screensaver: full screen, an endless random swim, the interface gone; any input ends it
const SAVER = { on:false, t:0, key:null };
function startSaver() {
  openPanel(null); photo(false); endCompare(); stopRide(true);
  SAVER.on = true; SAVER.t = 0; body.classList.add('saver'); $('saverHud').hidden = false;
  try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); } catch (e) {}
  startTour('random', 0);
}
function stopSaver() {
  if (!SAVER.on) return;
  SAVER.on = false; body.classList.remove('saver'); $('saverHud').hidden = true;
  try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
  wake();
}
function tickSaver(dt) {
  if (!SAVER.on) return;
  SAVER.t += dt;
  const d = new Date(); $('svTime').textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const o = VIEW.mode === 'flight' ? VIEW.flight.o : VIEW.focus;
  if (o && o.key !== SAVER.key) { SAVER.key = o.key; $('saverHud').classList.add('dim'); setTimeout(() => { $('svObj').textContent = `${o.name} · ${fmtDepth(depthOf(o))}`; $('svFact').textContent = o.fact || ''; $('saverHud').classList.remove('dim'); }, 1700); }
}
$('btnSaver').onclick = startSaver;
['pointermove', 'pointerdown', 'wheel'].forEach(ev => window.addEventListener(ev, () => { if (SAVER.on && SAVER.t > 1.5) stopSaver(); }, { passive:true }));

// ---- fading the interface when left alone
let idleT = 0;
function wake() { idleT = 0; body.classList.remove('ui-idle'); }
['pointermove', 'pointerdown', 'touchstart'].forEach(ev => window.addEventListener(ev, wake, { passive:true }));
function tickIdle(dt) {
  idleT += dt;
  const lim = { off:1e9, slow:9, quick:3.5 }[SET.fadeUI] || 9;
  const busy = Object.keys(PANELS).some(p => !$(p).hidden) || !$('help').hidden || document.activeElement === $('search');
  if (idleT > lim && !busy) body.classList.add('ui-idle');
  if (idleT > 6) $('hint').style.opacity = '0';
}

// ---- every frame
function tick(dt) {
  tickTime(dt);
  if (RIDE.on) { for (const o of OBJS) if (o.motion.type !== 'still' || o.motion.fn || o.post || !o._placed) { moveObj(o, simTime); o._placed = true; } updateRide(dt); }
  else updateCamera(dt);
  if (RIDE.on && RIDE.cockpit) CAM.lampD = 8;
  else if (VIEW.mode === 'free' || VIEW.mode === 'flight') CAM.lampD = Math.max(CAM.scale, 2); else CAM.lampD = CAM.scale;
  updateInfoLive(dt);
  updateLadder();
  updateLabels();
  updateSubMark();
  tickIdle(dt);
  tickSaver(dt);
  tickReactions(dt);
  tickSparks(dt);
  tickSound(dt);
  if (Math.floor(simTime) !== Math.floor(simTime - dt)) { renderTime(); if (VIEW.mode === 'flight' || VIEW.mode === 'free') renderInfo(); }
}

// ---- start
function boot() {
  buildCatalog();
  addSub();
  addLife();
  syncSettings(); renderTime(); renderAtlas(); renderTours(); setInfo('full');
  measureControls(); buildLadder(); setupDaily();
  window.addEventListener('resize', () => { measureControls(); buildLadder(); });
  for (const o of OBJS) moveObj(o, 0);
  const h = fromHash();
  if (h) { lockOn(h.o, h.vi); }
  else { lockOn(BYKEY.surface); startTour('dive', 0); }
  // start where the first stop is, rather than flying in from nowhere
  updateCamera(0);
  if (VIEW.mode === 'flight') { VIEW.flight.t = 0.999; }
  renderInfo(); updatePlay();
  setTimeout(() => { $('hint').style.opacity = '0'; }, 14000);
}
