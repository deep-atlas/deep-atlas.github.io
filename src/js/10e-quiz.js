// ---- the quiz: two places from the atlas, pick the one that lives deeper (or, for animals, the bigger one); keep a streak going
// (depths come from where each sits in this ocean, which follows where it really lives; sizes are each animal's real length)
const QUIZ_MODES = {
  deeper:{ title:'which lives deeper?', val:o => Math.max(0, -o.anchor[1]), fmt:d => fmtDepth(d), word:'deep', unit:'m deeper', minGap:4 },
  bigger:{ title:'which is bigger?', val:o => o.size, fmt:s => fmtLen(s) + ' long', word:'long', unit:'longer', minGap:0 },
};
const QUIZ = { mode:load('quizMode', 'deeper'), a:null, b:null, done:false, streak:0, best:load('quizBests', { deeper:load('quizBest', 0), bigger:0 }), last:[] };
// (some move up and down by the hour, so their depth would be a trick question; places have no single length to compare)
const QUIZ_SKIP = { deeper:['swordfish', 'lanternfish', 'elephantseal', 'smack'], bigger:['smack'] };
PANELS.quizPanel = 'btnQuiz';
const quizM = () => QUIZ_MODES[QUIZ.mode];
function quizPool() {
  return PLACES().filter(o => o.kind !== 'subs' && !QUIZ_SKIP[QUIZ.mode].includes(o.key) && !QUIZ.last.includes(o.key) && (QUIZ.mode !== 'bigger' || o.kind !== 'places'));
}
function quizNew() {
  const pool = quizPool(), M = quizM();
  // two that are clearly apart: at least half as big again (and, for depth, a few metres between them)
  for (let tries = 0; tries < 300; tries++) {
    const a = pool[Math.floor(Math.random() * pool.length)], b = pool[Math.floor(Math.random() * pool.length)];
    if (a === b) continue;
    const va = M.val(a), vb = M.val(b), lo = Math.min(va, vb), hi = Math.max(va, vb);
    if (hi - lo < M.minGap || hi < lo * 1.5) continue;
    QUIZ.a = a; QUIZ.b = b; break;
  }
  QUIZ.done = false;
  QUIZ.last = [QUIZ.a.key, QUIZ.b.key, ...QUIZ.last].slice(0, 12);
  renderQuiz();
}
function quizPick(side) {
  if (QUIZ.done) return;
  const M = quizM(), pick = side === 'a' ? QUIZ.a : QUIZ.b, other = side === 'a' ? QUIZ.b : QUIZ.a;
  const right = M.val(pick) > M.val(other);
  QUIZ.done = true; QUIZ.right = right; QUIZ.pick = side;
  QUIZ.streak = right ? QUIZ.streak + 1 : 0;
  if (QUIZ.streak > (QUIZ.best[QUIZ.mode] || 0)) { QUIZ.best[QUIZ.mode] = QUIZ.streak; save('quizBests', QUIZ.best); }
  renderQuiz();
}
function setQuizMode(m) {
  if (m === QUIZ.mode && QUIZ.a) return;
  QUIZ.mode = m; QUIZ.streak = 0; QUIZ.last = []; save('quizMode', m);
  for (const b of $('quizTabs').querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.v === m));
  quizNew();
}
function renderQuiz() {
  const { a, b } = QUIZ, M = quizM(); if (!a) return;
  $('quizTitle').textContent = M.title;
  const card = (o, side) => {
    const el = $(side === 'a' ? 'quizA' : 'quizB');
    el.querySelector('.qn').textContent = o.name;
    el.querySelector('.qt').textContent = o.type || '';
    el.querySelector('.qd').textContent = QUIZ.done ? M.fmt(M.val(o)) : '?';
    const win = M.val(o) > M.val(side === 'a' ? b : a);
    el.classList.toggle('right', QUIZ.done && win);
    el.classList.toggle('wrong', QUIZ.done && !win && QUIZ.pick === side);
    el.disabled = QUIZ.done;
  };
  card(a, 'a'); card(b, 'b');
  const hi = M.val(a) > M.val(b) ? a : b, lo = hi === a ? b : a, vh = M.val(hi), vl = M.val(lo);
  const ratio = vh / Math.max(vl, QUIZ.mode === 'deeper' ? 0.5 : 1e-9);
  const how = ratio > 1.95 ? `about ${fmtInt(+ratio.toPrecision(ratio < 100 ? 2 : 1))} times as ${M.word}`
    : QUIZ.mode === 'deeper' ? `${fmtInt(vh - vl)} ${M.unit}` : `${fmtLen(vh - vl)} ${M.unit}`;
  $('quizRes').textContent = !QUIZ.done ? `${M.title} pick one (or press 1 or 2)`
    : (QUIZ.right ? 'right! ' : 'not quite. ') + `${QUIZ.mode === 'deeper' ? 'Deeper' : 'Bigger'}: ${hi.name}, ${how}.`;
  $('quizStreak').textContent = `streak ${QUIZ.streak} · best ${QUIZ.best[QUIZ.mode] || 0}`;
  $('quizGo').hidden = $('quizNext').hidden = !QUIZ.done;
  $('quizGoA').textContent = 'go to ' + a.label; $('quizGoB').textContent = 'go to ' + b.label;
}
$('btnQuiz').onclick = () => {
  openPanel('quizPanel'); if ($('quizPanel').hidden) return;
  if (!QUIZ.a) setQuizMode(QUIZ.mode); else if (QUIZ.done) quizNew();   // (the first time, the tabs are set up too)
};
$('quizClose').onclick = () => openPanel('quizPanel', false);
$('quizA').onclick = () => quizPick('a'); $('quizB').onclick = () => quizPick('b');
$('quizNext').onclick = quizNew;
$('quizGoA').onclick = () => { openPanel('quizPanel', false); userGo(QUIZ.a); };
$('quizGoB').onclick = () => { openPanel('quizPanel', false); userGo(QUIZ.b); };
for (const b of $('quizTabs').querySelectorAll('button')) b.onclick = () => setQuizMode(b.dataset.v);
// 1 and 2 pick while it is open; enter goes on to the next pair
addEventListener('keydown', e => {
  if ($('quizPanel').hidden || e.target.tagName === 'INPUT' || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === '1') quizPick('a'); else if (e.key === '2') quizPick('b'); else if (e.key === 'Enter' && QUIZ.done) quizNew(); else return;
  e.preventDefault(); e.stopPropagation();
}, true);
