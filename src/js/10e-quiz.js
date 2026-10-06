// ---- the quiz: which lives deeper? Two places from the atlas, pick the deeper one, keep a streak going
// (depths come from where each sits in this ocean, which follows where it really lives)
const QUIZ = { a:null, b:null, done:false, streak:0, best:load('quizBest', 0), last:[] };
// (some move up and down by the hour, so their depth would be a trick question)
const QUIZ_SKIP = ['swordfish', 'lanternfish', 'elephantseal', 'smack'];
PANELS.quizPanel = 'btnQuiz';
function quizDepth(o) { return Math.max(0, -o.anchor[1]); }
function quizPool() { return PLACES().filter(o => o.kind !== 'subs' && !QUIZ_SKIP.includes(o.key) && !QUIZ.last.includes(o.key)); }
function quizNew() {
  const pool = quizPool();
  // two that are clearly apart: at least half as deep again, and a few metres between them
  for (let tries = 0; tries < 200; tries++) {
    const a = pool[Math.floor(Math.random() * pool.length)], b = pool[Math.floor(Math.random() * pool.length)];
    if (a === b) continue;
    const da = quizDepth(a), db = quizDepth(b), lo = Math.min(da, db), hi = Math.max(da, db);
    if (hi - lo < 4 || hi < lo * 1.5) continue;
    QUIZ.a = a; QUIZ.b = b; break;
  }
  QUIZ.done = false;
  QUIZ.last = [QUIZ.a.key, QUIZ.b.key, ...QUIZ.last].slice(0, 12);
  renderQuiz();
}
function quizPick(side) {
  if (QUIZ.done) return;
  const pick = side === 'a' ? QUIZ.a : QUIZ.b, other = side === 'a' ? QUIZ.b : QUIZ.a;
  const right = quizDepth(pick) > quizDepth(other);
  QUIZ.done = true; QUIZ.right = right; QUIZ.pick = side;
  QUIZ.streak = right ? QUIZ.streak + 1 : 0;
  if (QUIZ.streak > QUIZ.best) { QUIZ.best = QUIZ.streak; save('quizBest', QUIZ.best); }
  renderQuiz();
}
function renderQuiz() {
  const { a, b } = QUIZ; if (!a) return;
  const card = (o, side) => {
    const el = $(side === 'a' ? 'quizA' : 'quizB');
    el.querySelector('.qn').textContent = o.name;
    el.querySelector('.qt').textContent = o.type || '';
    el.querySelector('.qd').textContent = QUIZ.done ? fmtDepth(quizDepth(o)) : '?';
    const deeper = quizDepth(o) > quizDepth(side === 'a' ? b : a);
    el.classList.toggle('right', QUIZ.done && deeper);
    el.classList.toggle('wrong', QUIZ.done && !deeper && QUIZ.pick === side);
    el.disabled = QUIZ.done;
  };
  card(a, 'a'); card(b, 'b');
  const deep = quizDepth(a) > quizDepth(b) ? a : b, shallow = deep === a ? b : a;
  const ratio = quizDepth(deep) / Math.max(quizDepth(shallow), 0.5);
  $('quizRes').textContent = !QUIZ.done ? 'which lives deeper? pick one (or press 1 or 2)'
    : (QUIZ.right ? 'right! ' : 'not quite. ') + `Deeper: ${deep.name}, ${ratio > 1.95 ? `about ${fmtInt(+ratio.toPrecision(ratio < 100 ? 2 : 1))} times as deep` : `${fmtInt(quizDepth(deep) - quizDepth(shallow))} m deeper`}.`;
  $('quizStreak').textContent = `streak ${QUIZ.streak} · best ${QUIZ.best}`;
  $('quizGo').hidden = $('quizNext').hidden = !QUIZ.done;
  $('quizGoA').textContent = 'go to ' + a.label; $('quizGoB').textContent = 'go to ' + b.label;
}
$('btnQuiz').onclick = () => { openPanel('quizPanel'); if (!$('quizPanel').hidden && (!QUIZ.a || QUIZ.done)) quizNew(); };
$('quizClose').onclick = () => openPanel('quizPanel', false);
$('quizA').onclick = () => quizPick('a'); $('quizB').onclick = () => quizPick('b');
$('quizNext').onclick = quizNew;
$('quizGoA').onclick = () => { openPanel('quizPanel', false); userGo(QUIZ.a); };
$('quizGoB').onclick = () => { openPanel('quizPanel', false); userGo(QUIZ.b); };
// 1 and 2 pick while it is open; enter goes on to the next pair
addEventListener('keydown', e => {
  if ($('quizPanel').hidden || e.target.tagName === 'INPUT' || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === '1') quizPick('a'); else if (e.key === '2') quizPick('b'); else if (e.key === 'Enter' && QUIZ.done) quizNew(); else return;
  e.preventDefault(); e.stopPropagation();
}, true);
