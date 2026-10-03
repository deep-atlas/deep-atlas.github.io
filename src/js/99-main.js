// ---- the main loop

let simTime = 0, lastNow = performance.now(), frameErrors = 0;
function frame(now) {
  requestAnimationFrame(frame);
  try { drawFrame(now); }
  catch (e) { if (frameErrors++ < 5) console.error('frame failed:', e && e.stack || e); }
}
function drawFrame(now) {
  const dt = Math.min(0.1, (now - lastNow) / 1000); lastNow = now;
  simTime += dt * (+SET.time);
  // (set DEBUG.prof = {} to add up where each frame's time goes, in ms per stage)
  const PF = DEBUG.prof, T = PF ? () => performance.now() : null; let t0 = PF ? T() : 0;
  const lap = PF ? k => { const t = T(); PF[k] = (PF[k] || 0) + t - t0; t0 = t; } : null;
  asciiResize();
  if (typeof tick === 'function') tick(dt, now / 1000);
  if (PF) lap('tick');
  // a camera that has gone non-finite would draw nothing ever again: put it back somewhere safe
  if (!CAM.pos.every(isFinite) || !CAM.fwd.every(isFinite) || !isFinite(CAM.scale)) {
    console.warn('camera reset: it had become non-finite');
    if (typeof endJourney === 'function') endJourney(true);
    lockOn(BYKEY.reef); updateCamera(0);
  }
  CAM.depth = -CAM.pos[1];
  updateLight(DEBUG.solo ? 6 : Math.max(0, CAM.depth), typeof TOD !== 'undefined' ? TOD.min : 630);
  if (PF) lap('updateLight');
  updateUBO(simTime % 20000);
  if (PF) lap('light');
  const A = ASCII;
  gl.bindFramebuffer(gl.FRAMEBUFFER, A.scene.fb);
  gl.viewport(0, 0, A.scene.w, A.scene.h);
  gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
  drawBackground();
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.depthMask(true);
  gl.clearDepth(1); gl.clear(gl.DEPTH_BUFFER_BIT);
  drawTerrain();
  if (PF) lap('bg+terrain');
  if (typeof drawWorld === 'function') drawWorld(false);
  if (PF) lap('world');
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
  drawSnow(simTime);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  drawSeaFromAbove();
  if (typeof drawWorld === 'function') drawWorld(true);
  gl.depthMask(true); gl.disable(gl.BLEND);
  if (PF) lap('snow+trans');
  asciiCompose(now / 1000);
  if (PF) lap('ascii');
  if (typeof afterFrame === 'function') afterFrame();
  if (PF) { lap('after'); PF.frames = (PF.frames || 0) + 1; }
}

// the font: build the glyph atlas again once the page font has arrived
if (document.fonts && document.fonts.load) {
  document.fonts.load('500 12px "IBM Plex Mono"').then(() => { ASCII.fontReady = true; asciiResize(true); }).catch(() => {});
}
for (const P of PROGS) P.start();
if (typeof boot === 'function') boot();
requestAnimationFrame(frame);
// test hooks; step() draws frames by hand (a hidden tab gets no animation frames)
window.__deep = { CAM, SET, ASCII, LIGHT, floorDepth, asciiText, BYKEY, OBJS, VIEW, TOD, userGo, startTour, letGo, lockOn, goView, PROGS, DEBUG, simT:() => simTime, waterSpark, triggerReact, SPARKS, KEYS,
  step(n = 1, dt = 1 / 30) { for (let i = 0; i < n; i++) { lastNow -= dt * 1000; drawFrame(performance.now()); } return asciiText(); },
  // one object alone, evenly lit, from a chosen angle (for checking models)
  async studio(key, yaw, pitch, k) {
    const o = BYKEY[key]; DEBUG.solo = o; lockOn(o); VIEW.auto = false;
    if (yaw != null) { VIEW.yaw = yaw; VIEW.pitch = pitch; VIEW.frame = 'obj'; }
    if (k) VIEW.dist = k * (o.vsize || o.size);
    for (let i = 0; i < 60 && !PROGS.every(p => p.ok || p.failed); i++) await new Promise(r => setTimeout(r, 80));
    await new Promise(r => setTimeout(r, 400)); document.body.classList.add('photo');
  },
  // draw a frame and post the canvas to the dev server (serve.mjs saves it in .shots/)
  async save(name, n = 2) {
    let blob = null;
    for (let i = 0; i < n; i++) { lastNow -= 33; drawFrame(performance.now()); }
    blob = await new Promise(r => canvas.toBlob(r));
    if (!blob) { drawFrame(performance.now()); blob = await new Promise(r => { drawFrame(performance.now()); canvas.toBlob(r); }); }
    await fetch('/__shot/' + name + '.png', { method:'POST', body:blob });
    return name;
  },
  async stop(i, tour = 'dive') { startTour(tour, i); if (VIEW.flight) VIEW.flight.t = 0.999; await new Promise(r => setTimeout(r, 1800)); return VIEW.focus && VIEW.focus.key; } };
})();
