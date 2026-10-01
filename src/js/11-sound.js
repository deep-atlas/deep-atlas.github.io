// ---- sound: an ocean made live in the browser. Swell and bubbles near the surface, a slow drone that darkens with depth,
// whale song in the distance, sonar pings and the creak of pressure in the deep. Nothing is recorded; everything is synthesised.

const SND = { ctx:null, master:null, wet:null, bed:null, bedF:null, swell:null, pad:[], padF:null, padG:null, next:{}, chordT:0, chord:0, what:'' };
const PAD_CHORDS = [[0, 7, 12, 16], [-3, 4, 9, 12], [-5, 2, 7, 14], [-7, 0, 5, 12], [2, 9, 14, 17]];

function makeNoise(ctx, secs, brown) {
  const n = ctx.sampleRate * secs, b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c); let last = 0;
    for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
  }
  return b;
}
function makeReverb(ctx, secs) {
  const n = ctx.sampleRate * secs, b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
  const v = ctx.createConvolver(); v.buffer = b; return v;
}
function startAudio() {
  if (SND.ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const ctx = SND.ctx = new AC();
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.connect(ctx.destination);
  SND.master = ctx.createGain(); SND.master.gain.value = 0; SND.master.connect(comp);
  SND.master.gain.setTargetAtTime(SET.volume * 0.55, ctx.currentTime, 1.5);
  const rev = makeReverb(ctx, 4.5); SND.wet = ctx.createGain(); SND.wet.gain.value = 0.9; SND.wet.connect(rev); rev.connect(SND.master);
  // the bed: brown noise through a low-pass that closes with depth, swelling slowly like waves overhead
  const src = ctx.createBufferSource(); src.buffer = makeNoise(ctx, 6, true); src.loop = true;
  SND.bedF = ctx.createBiquadFilter(); SND.bedF.type = 'lowpass'; SND.bedF.frequency.value = 600; SND.bedF.Q.value = 0.4;
  SND.bed = ctx.createGain(); SND.bed.gain.value = 0.25;
  SND.swell = ctx.createGain(); SND.swell.gain.value = 0.7;
  const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.09; lg.gain.value = 0.3; lfo.connect(lg); lg.connect(SND.swell.gain); lfo.start();
  src.connect(SND.bedF); SND.bedF.connect(SND.swell); SND.swell.connect(SND.bed); SND.bed.connect(SND.master); SND.bed.connect(SND.wet);
  src.start();
  // the drone: four soft voices on a slowly turning chord
  SND.padF = ctx.createBiquadFilter(); SND.padF.type = 'lowpass'; SND.padF.frequency.value = 900; SND.padF.Q.value = 0.7;
  SND.padG = ctx.createGain(); SND.padG.gain.value = 0.0; SND.padF.connect(SND.padG); SND.padG.connect(SND.master); SND.padG.connect(SND.wet);
  for (let i = 0; i < 4; i++) {
    const o = ctx.createOscillator(), g = ctx.createGain(), d = ctx.createOscillator();
    o.type = i % 2 ? 'triangle' : 'sine'; d.type = 'sine';
    d.frequency.value = 0.07 + i * 0.03; const dg = ctx.createGain(); dg.gain.value = 1.5; d.connect(dg); dg.connect(o.detune);
    g.gain.value = 0.11 / (1 + i * 0.3); o.connect(g); g.connect(SND.padF); o.start(); d.start();
    SND.pad.push(o);
  }
  setChord(0, true);
  for (const k of ['whale', 'ping', 'bubbles', 'creak', 'click']) SND.next[k] = 3 + Math.random() * 8;
}
function setChord(i, now) {
  const ctx = SND.ctx, root = 110 * Math.pow(2, -CAM.depth / 6000);
  PAD_CHORDS[i % PAD_CHORDS.length].forEach((s, k) => {
    const f = root * Math.pow(2, s / 12) * (k === 3 ? 2 : 1);
    SND.pad[k].frequency.setTargetAtTime(f, ctx.currentTime, now ? 0.01 : 4);
  });
}
function soundOn(on) {
  if (on) { startAudio(); if (SND.ctx && SND.ctx.state === 'suspended') SND.ctx.resume(); }
  else if (SND.ctx) SND.ctx.suspend();
  $('nowPlaying').textContent = on ? (SND.what || 'the sea') : 'silent';
}
function soundVolume() { if (SND.master) SND.master.gain.setTargetAtTime(SET.volume * 0.55, SND.ctx.currentTime, 0.2); }
// a voice that comes and goes
function blip(o) {
  const ctx = SND.ctx, t = ctx.currentTime + (o.delay || 0);
  const osc = ctx.createOscillator(), g = ctx.createGain(), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(o.f0, t);
  if (o.curve) { const n = o.curve.length; o.curve.forEach((f, i) => osc.frequency.linearRampToValueAtTime(f, t + o.dur * (i + 1) / n)); }
  else if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
  if (o.vib) { const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = o.vib[0]; vg.gain.value = o.vib[1]; v.connect(vg); vg.connect(osc.frequency); v.start(t); v.stop(t + o.dur + 0.1); }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.amp, t + (o.att ?? 0.02));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  let out = g;
  if (o.bp) { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = o.bp; f.Q.value = o.q || 1; g.connect(f); out = f; }
  osc.connect(g);
  if (pan) { pan.pan.value = o.pan ?? (Math.random() * 2 - 1) * 0.7; out.connect(pan); out = pan; }
  out.connect(o.dry === false ? SND.wet : SND.master); out.connect(SND.wet);
  osc.start(t); osc.stop(t + o.dur + 0.05);
}
function noiseBurst(o) {
  const ctx = SND.ctx, t = ctx.currentTime + (o.delay || 0);
  const src = ctx.createBufferSource(); src.buffer = SND.nb || (SND.nb = makeNoise(ctx, 2, false));
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = o.f; f.Q.value = o.q || 6;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.amp, t + o.att); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  src.connect(f); f.connect(g); g.connect(SND.wet); if (o.dry) g.connect(SND.master);
  src.start(t, Math.random()); src.stop(t + o.dur + 0.05);
}
function tickSound(dt) {
  if (!SND.ctx || !SET.sound || SND.ctx.state !== 'running') return;
  const d = CAM.depth, ctx = SND.ctx, now = ctx.currentTime;
  const shallow = smooth(60, 3, d), deep = smooth(400, 3000, d), abyss = smooth(3500, 8000, d);
  // the mix by depth
  SND.bedF.frequency.setTargetAtTime(lerp(140, 1400, shallow) * lerp(1, 0.5, abyss), now, 0.5);
  SND.bed.gain.setTargetAtTime(lerp(0.32, 0.6, shallow) * lerp(1, 0.55, deep), now, 0.5);
  SND.padF.frequency.setTargetAtTime(lerp(1100, 380, deep), now, 1);
  SND.padG.gain.setTargetAtTime(lerp(0.55, 0.9, deep) * (1 - shallow * 0.5), now, 2);
  SND.chordT += dt;
  if (SND.chordT > 14) { SND.chordT = 0; SND.chord++; setChord(SND.chord); }
  const due = k => (SND.next[k] -= dt) <= 0;
  let what = shallow > 0.5 ? 'waves overhead, bubbles' : deep < 0.3 ? 'the open sea, whales far off' : abyss > 0.5 ? 'the deep floor: pressure creaks, a sonar' : 'the hum of the deep, a sonar';
  // whale song: long moaning glides (humpback-like in the upper ocean, slow low calls deeper)
  if (due('whale')) {
    SND.next.whale = 9 + Math.random() * 16;
    if (d < 2500) {
      const base = d < 400 ? 180 + Math.random() * 200 : 60 + Math.random() * 40, n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) blip({ f0:base, curve:[base * 1.6, base * 2.2, base * 1.3, base * 0.8], dur:1.8 + Math.random() * 1.6, amp:0.035, att:0.4, vib:[5 + Math.random() * 2, base * 0.02], delay:i * 2.6, bp:base * 1.5, q:0.7, dry:false });
    }
  }
  if (d < 25 && due('bubbles')) {
    SND.next.bubbles = 1.5 + Math.random() * 4;
    const n = 3 + Math.floor(Math.random() * 8);
    for (let i = 0; i < n; i++) { const f = 300 + Math.random() * 700; blip({ f0:f, f1:f * 2.2, dur:0.05 + Math.random() * 0.05, amp:0.025, att:0.005, delay:i * (0.04 + Math.random() * 0.12) }); }
  }
  if ((d > 250 || RIDE.on) && due('ping')) {
    SND.next.ping = 7 + Math.random() * 8;
    blip({ f0:1480, dur:0.5, amp:0.03, att:0.004, pan:0, bp:1480, q:4 });
    blip({ f0:1480, dur:0.4, amp:0.012, att:0.004, delay:0.9 + d / 3000, pan:-0.3, bp:1480, q:4, dry:false });
  }
  if (d > 1500 && due('creak')) {
    SND.next.creak = 6 + Math.random() * 10;
    noiseBurst({ f:90 + Math.random() * 120, q:12, amp:0.08, att:0.4, dur:1.6 + Math.random() * 1.5 });
  }
  if (d > 600 && d < 2500 && due('click')) {
    // a sperm whale far away, echolocating: a train of clicks
    SND.next.click = 14 + Math.random() * 14;
    const n = 6 + Math.floor(Math.random() * 10), gap = 0.4 + Math.random() * 0.4;
    for (let i = 0; i < n; i++) noiseBurst({ f:3000 + Math.random() * 1000, q:2, amp:0.03, att:0.002, dur:0.03, delay:i * gap, dry:true });
  }
  if (what !== SND.what) { SND.what = what; $('nowPlaying').textContent = what; }
}
// the browser only lets sound start after a click or key
window.addEventListener('pointerdown', () => { if (SET.sound && !SND.ctx) soundOn(true); }, { once:true });
