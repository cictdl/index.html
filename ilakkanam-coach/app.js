/* இலக்கணம் · Ilakkanam Coach — adaptive grammar drills over the CICT canon
   No framework, no build step. Data from data/ (built by build/build_data.py). */
'use strict';

const VERSION = '1.0.0';
const $ = sel => document.querySelector(sel);
const app = $('#app');

/* ------------------------------------------------------------ state */
const DATA = { meta: null, kurals: null, topics: {} };

const S = loadJSON('ic.settings', { lang: 'ta' });
const P = loadJSON('ic.progress.v1', {
  topics: {},          // tid -> {tags:{tag:{box,seen,ok}}, answered, correct, sessions}
  xp: 0, days: [], best: 0
});

function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch (e) { return fallback; }
}
function save() {
  try {
    localStorage.setItem('ic.settings', JSON.stringify(S));
    localStorage.setItem('ic.progress.v1', JSON.stringify(P));
  } catch (e) {}
}
function tp(tid) {
  if (!P.topics[tid]) P.topics[tid] = { tags: {}, answered: 0, correct: 0, sessions: 0 };
  return P.topics[tid];
}
function tagRec(tid, tag) {
  const t = tp(tid);
  if (!t.tags[tag]) t.tags[tag] = { box: 0, seen: 0, ok: 0 };
  return t.tags[tag];
}
function markDay() {
  const d = new Date().toISOString().slice(0, 10);
  if (!P.days.includes(d)) { P.days.push(d); if (P.days.length > 400) P.days.shift(); }
}

/* ------------------------------------------------------------ i18n */
const T = {
  ta: {
    brand: 'இலக்கணப் பயிற்சி', heroTitle: 'இலக்கணம் · Ilakkanam Coach',
    heroSub: 'செவ்விலக்கியச் சொல்தோறும் இலக்கணக் குறிப்பு — திருக்குறள் முழுவதிலிருந்து தன்னியக்கப் பயிற்சிகள்.',
    xp: 'புள்ளிகள்', streak: 'பயிற்சி நாட்கள்', mastered: 'தேர்ந்த குறிப்புகள்',
    items: 'பயிற்சிகள்', level: 'வகுப்பு', start: 'பயிற்சி தொடங்கு',
    qWordClass: 'சொல் வகை எது?', qFineTag: 'இலக்கணக் குறிப்பு எது?',
    qVetrumai: 'எந்த வேற்றுமை?', qTogai: 'எந்தத் தொகை?',
    qFind: 'குறளில் தொட்டுக் காட்டுக:',
    inKural: 'இக்குறளில்', theWord: 'என்ற சொல்லின்',
    correct: 'சரி!', wrong: 'தவறு', answerIs: 'விடை:',
    next: 'அடுத்தது →', done: 'முடிந்தது', skip: 'தவிர்',
    split: 'பிரிப்பு', gloss: 'பொருள்', urai: 'உரை (மு.வ.)',
    resultTitle: 'சுற்று முடிந்தது!', of: '/', backHome: '← முகப்பு',
    again: 'மீண்டும் பயிற்சி', weakTitle: 'கவனிக்க வேண்டியவை',
    statsTitle: 'முன்னேற்றம்', totAnswered: 'மொத்த விடைகள்', accuracy: 'திருத்தம்',
    byTopic: 'பாடம் வாரியாக', byTag: 'குறிப்பு வாரியாக (தேர்ச்சிப் பெட்டி 0–5)',
    backup: 'முன்னேற்றத்தைச் சேமி (பதிவிறக்கு)', restore: 'மீட்டெடு (கோப்பு)',
    about: 'தரவு: செம்மொழித் தமிழாய்வு மத்திய நிறுவனத்தின் திருக்குறள் இலக்கணக் குறிப்புத் தொகுப்பு — 1,330 குறள், 13,124 சொற்கள், 133/133 அதிகாரம் சரிபார்க்கப்பட்டது. AI-உதவியுடன் உருவாக்கி அறிஞர் மேற்பார்வைக்கு உட்பட்டது.',
    offline: 'இணையம் இன்றி முழுமையாக இயங்கும். முன்னேற்றம் இச்சாதனத்தில் சேமிக்கப்படும்.',
    loadingBank: 'பயிற்சித் தரவு ஏற்றப்படுகிறது…',
    caseNames: null,
  },
  en: {
    brand: 'Ilakkanam Coach', heroTitle: 'இலக்கணம் · Ilakkanam Coach',
    heroSub: 'Adaptive Tamil grammar drills generated from CICT’s word-by-word annotation of the Tirukkural.',
    xp: 'Points', streak: 'Practice days', mastered: 'Tags mastered',
    items: 'drills', level: 'Class', start: 'Start practice',
    qWordClass: 'Which word class?', qFineTag: 'Which grammatical tag?',
    qVetrumai: 'Which case (வேற்றுமை)?', qTogai: 'Which compound (தொகை)?',
    qFind: 'Tap the word in the couplet:',
    inKural: 'In this kural,', theWord: '— the word',
    correct: 'Correct!', wrong: 'Not quite', answerIs: 'Answer:',
    next: 'Next →', done: 'Done', skip: 'Skip',
    split: 'Split', gloss: 'Meaning', urai: 'Commentary (M.V.)',
    resultTitle: 'Round complete!', of: '/', backHome: '← Home',
    again: 'Practise again', weakTitle: 'Needs attention',
    statsTitle: 'Progress', totAnswered: 'Total answered', accuracy: 'Accuracy',
    byTopic: 'By topic', byTag: 'By tag (mastery box 0–5)',
    backup: 'Back up progress (download)', restore: 'Restore (file)',
    about: 'Data: CICT’s Tirukkural word-level grammatical annotation — 1,330 kurals, 13,124 words, all 133 chapters double-verified. AI-assisted, under scholarly review.',
    offline: 'Works fully offline. Progress is stored on this device.',
    loadingBank: 'Loading drill bank…',
  }
};
function t(k) { return (T[S.lang] && T[S.lang][k]) || T.ta[k] || k; }

const CASES = [
  { n: 1, ta: 'முதல் (எழுவாய்)', urupu: '—' },
  { n: 2, ta: 'இரண்டாம் (ஐ)', urupu: 'ஐ' },
  { n: 3, ta: 'மூன்றாம் (ஆல், ஒடு)', urupu: 'ஆல்/ஒடு' },
  { n: 4, ta: 'நான்காம் (கு)', urupu: 'கு' },
  { n: 5, ta: 'ஐந்தாம் (இன், இல்)', urupu: 'இன்/இல்' },
  { n: 6, ta: 'ஆறாம் (அது)', urupu: 'அது' },
  { n: 7, ta: 'ஏழாம் (கண், இடம்)', urupu: 'கண்' },
  { n: 8, ta: 'எட்டாம் (விளி)', urupu: 'விளி' },
];
const TOGAIS = ['வேற்றுமைத்தொகை','பண்புத்தொகை','வினைத்தொகை','உம்மைத்தொகை','உவமைத்தொகை','அன்மொழித்தொகை'];
const CATS = ['பெயர்', 'வினை', 'இடை', 'உரி'];

/* ------------------------------------------------------------ data */
async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ' → ' + r.status);
  return r.json();
}
async function ensureMeta() {
  if (!DATA.meta) DATA.meta = await fetchJSON('data/meta.json');
  return DATA.meta;
}
async function ensureKurals() {
  if (!DATA.kurals) DATA.kurals = await fetchJSON('data/kurals.json');
  return DATA.kurals;
}
async function ensureTopic(tid) {
  if (!DATA.topics[tid]) DATA.topics[tid] = await fetchJSON('data/topics/' + tid + '.json');
  return DATA.topics[tid];
}
function glossFor(tag) {
  const g = DATA.meta && DATA.meta.glossary && DATA.meta.glossary[tag];
  return g || null;
}

/* ------------------------------------------------------------ helpers */
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function sample(arr, n, exclude) {
  const pool = arr.filter(x => x !== exclude);
  return shuffle(pool.slice()).slice(0, n);
}
// word rec: [sol, cat, tag, gloss, split, conf, feat, vet]
const W = { SOL: 0, CAT: 1, TAG: 2, GLOSS: 3, SPLIT: 4, CONF: 5, FEAT: 6, VET: 7 };

function coupletHTML(k, hlIdx, tappable) {
  // renders line1+line2 with each word wrapped; word order matches .words order
  const rec = DATA.kurals[String(k)];
  const words = rec.words;
  const l1n = rec.l1.trim().split(/\s+/).length;
  let html = '';
  let idx = 0;
  const renderWord = (txt, i) => {
    if (tappable) return `<button class="word-btn" data-wi="${i}">${esc(txt)}</button>`;
    if (i === hlIdx) return `<span class="hl">${esc(txt)}</span>`;
    return esc(txt);
  };
  const l1w = rec.l1.trim().split(/\s+/), l2w = rec.l2.trim().split(/\s+/);
  // words array is per-component (may exceed surface words when a சீர் has
  // multiple components); map surface tokens to first matching component run.
  // Simplest robust approach: if counts match, 1:1; else fall back to surface
  // highlight by matching sol text.
  const flat = l1w.concat(l2w);
  if (flat.length === words.length) {
    html = l1w.map((w, i) => renderWord(w, i)).join(' ') + '<br>' +
           l2w.map((w, i) => renderWord(w, l1w.length + i)).join(' ');
  } else {
    // component count differs from surface tokens: match by text where possible
    const used = new Set();
    const mapIdx = tok => {
      for (let i = 0; i < words.length; i++) {
        if (!used.has(i) && words[i][W.SOL] === tok) { used.add(i); return i; }
      }
      return -1;
    };
    const rl = arr => arr.map(tok => {
      const i = mapIdx(tok);
      if (i < 0) return esc(tok);
      return renderWord(tok, i);
    }).join(' ');
    html = rl(l1w) + '<br>' + rl(l2w);
  }
  return `<div class="couplet">${html}<span class="kno">குறள் ${k} · ${esc(rec.an)}</span></div>`;
}

/* ------------------------------------------------------------ drill engine */
const SESSION_LEN = 10;
let session = null;

function pickSessionItems(tid, items) {
  // weight items toward tags in low mastery boxes
  const prog = tp(tid);
  const weight = it => {
    const tag = itemTag(tid, it);
    const box = (prog.tags[tag] && prog.tags[tag].box) || 0;
    return 6 - box; // box 0 → w6 … box 5 → w1
  };
  const picked = [];
  const pool = items.slice();
  const seenKurals = new Set();
  for (let n = 0; n < SESSION_LEN && pool.length; n++) {
    let tot = 0;
    const ws = pool.map(it => {
      let w = weight(it);
      if (seenKurals.has(it[0])) w *= 0.2;
      tot += w; return w;
    });
    let r = Math.random() * tot, j = 0;
    while (j < ws.length - 1 && (r -= ws[j]) > 0) j++;
    picked.push(pool[j]); seenKurals.add(pool[j][0]);
    pool.splice(j, 1);
  }
  return picked;
}
function itemTag(tid, it) {
  const rec = DATA.kurals[String(it[0])];
  if (tid === 'togai') {
    const tg = rec.tg.find(x => x[0] === it[1]);
    return tg ? tg[1] : 'தொகை';
  }
  const w = rec.words[it[1]];
  if (!w) return '?';
  if (tid === 'solvagai') return w[W.CAT];
  if (tid === 'vetrumai') return 'வேற்றுமை-' + (w[W.VET].split('|')[0] || '?');
  return w[W.TAG];
}

function buildQuestion(tid, it) {
  const rec = DATA.kurals[String(it[0])];
  const q = { tid, k: it[0], rec };

  if (tid === 'togai') {
    const tg = rec.tg.find(x => x[0] === it[1]);
    q.mode = 'mcq'; q.qtype = t('qTogai');
    q.subject = tg[2]; q.answer = tg[1];
    q.options = shuffle([tg[1]].concat(sample(TOGAIS, 3, tg[1])));
    q.tag = tg[1];
    return q;
  }

  const w = rec.words[it[1]];
  q.wi = it[1]; q.word = w;

  if (tid === 'vetrumai') {
    const n = parseInt(w[W.VET].split('|')[0], 10);
    q.mode = 'mcq'; q.qtype = t('qVetrumai');
    q.subject = w[W.SOL]; q.answerN = n;
    q.answer = CASES[n - 1].ta;
    q.options = shuffle([q.answer].concat(sample(CASES.map(c => c.ta), 3, q.answer)));
    q.tag = 'வேற்றுமை-' + n;
    return q;
  }

  if (tid === 'solvagai') {
    q.tag = w[W.CAT];
    // adaptive: high box → find-in-verse on the fine tag's category
    const box = tagRec(tid, q.tag).box;
    if (box >= 3 && findPossible(rec, W.CAT, w[W.CAT])) {
      q.mode = 'find'; q.qtype = t('qFind');
      q.field = W.CAT; q.answer = w[W.CAT];
      return q;
    }
    q.mode = 'mcq'; q.qtype = t('qWordClass');
    q.subject = w[W.SOL]; q.answer = w[W.CAT];
    q.options = shuffle(CATS.slice());
    return q;
  }

  // fine-tag topics
  q.tag = w[W.TAG];
  const box = tagRec(tid, q.tag).box;
  if (box >= 3 && findPossible(rec, W.TAG, w[W.TAG])) {
    q.mode = 'find'; q.qtype = t('qFind');
    q.field = W.TAG; q.answer = w[W.TAG];
    return q;
  }
  q.mode = 'mcq'; q.qtype = t('qFineTag');
  q.subject = w[W.SOL]; q.answer = w[W.TAG];
  const topicTags = (DATA.meta.topics.find(x => x.id === tid) || {}).tags || [];
  let distr = sample(topicTags, 3, q.answer);
  if (distr.length < 3) {
    const globals = Object.keys(DATA.meta.tagCounts);
    distr = distr.concat(sample(globals.filter(g => !distr.includes(g)), 3 - distr.length, q.answer));
  }
  q.options = shuffle([q.answer].concat(distr));
  return q;
}
function findPossible(rec, field, val) {
  // find-in-verse is fair only when every word of that value is confidently tagged
  let targets = 0;
  for (const w of rec.words) {
    if (w[field] === val) {
      if (w[W.CONF] < 0.7) return false;
      targets++;
    }
  }
  return targets >= 1 && targets < rec.words.length;
}

async function startSession(tid) {
  render(`<div class="loading">${t('loadingBank')}</div>`);
  await ensureMeta(); await ensureKurals();
  const items = await ensureTopic(tid);
  session = {
    tid, items: pickSessionItems(tid, items),
    i: 0, correct: 0, wrongTags: {},
  };
  tp(tid).sessions++;
  markDay(); save();
  showQuestion();
}

function showQuestion() {
  const q = buildQuestion(session.tid, session.items[session.i]);
  session.q = q;
  const topic = DATA.meta.topics.find(x => x.id === session.tid);
  const pct = Math.round(session.i / session.items.length * 100);

  let body = '';
  if (q.mode === 'find') {
    const g = glossFor(q.answer);
    body = coupletHTML(q.k, -1, true) +
      `<p class="qtext">${esc(q.qtype)} <b>${esc(q.answer)}</b>` +
      (S.lang === 'en' && g ? ` <span class="small">(${esc(g.en.split(' — ')[0])})</span>` : '') + `</p>`;
  } else {
    body = coupletHTML(q.k, q.wi === undefined ? -1 : q.wi, false) +
      `<p class="qtext">${q.subject ? `<b>${esc(q.subject)}</b> — ` : ''}${esc(q.qtype)}</p>` +
      `<div class="opts">` +
      q.options.map((o, i) => `<button class="opt" dir="ltr" data-i="${i}">${esc(o)}</button>`).join('') +
      `</div>`;
  }

  render(`
    <div class="drill-head">
      <a href="#/home" class="chip" style="color:var(--navy);border-color:var(--navy)">✕</a>
      <div class="prog"><i style="width:${pct}%"></i></div>
      <span class="cnt">${session.i + 1} ${t('of')} ${session.items.length} · ${esc(topic.ta)}</span>
    </div>
    <div class="qcard">
      <div class="qtype">${esc(topic.ta)} · ${esc(q.qtype)}</div>
      ${body}
      <div id="explain"></div>
    </div>`);

  if (q.mode === 'find') {
    app.querySelectorAll('.word-btn').forEach(b => b.addEventListener('click', () => answerFind(parseInt(b.dataset.wi, 10), b)));
  } else {
    app.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => answerMCQ(q.options[parseInt(b.dataset.i, 10)], b)));
  }
}

function answerMCQ(choice, btn) {
  const q = session.q;
  const ok = choice === q.answer;
  app.querySelectorAll('.opt').forEach(b => {
    b.disabled = true;
    if (b.textContent === q.answer) b.classList.add('ok');
  });
  if (!ok) btn.classList.add('bad');
  scoreAnswer(ok);
  showExplain(ok);
}
function answerFind(wi, btn) {
  const q = session.q;
  const w = q.rec.words[wi];
  const ok = w && w[q.field] === q.answer;
  app.querySelectorAll('.word-btn').forEach(b => {
    b.disabled = true;
    const bw = q.rec.words[parseInt(b.dataset.wi, 10)];
    if (bw && bw[q.field] === q.answer) b.classList.add('reveal');
  });
  btn.classList.add(ok ? 'picked-ok' : 'picked-bad');
  if (ok) { q.wi = wi; q.word = w; }
  scoreAnswer(ok);
  showExplain(ok);
}
function scoreAnswer(ok) {
  const q = session.q;
  const r = tagRec(session.tid, q.tag);
  const prog = tp(session.tid);
  r.seen++; prog.answered++;
  if (ok) {
    r.ok++; r.box = Math.min(5, r.box + 1);
    prog.correct++; session.correct++;
    P.xp += q.mode === 'find' ? 15 : 10;
  } else {
    r.box = Math.max(0, r.box - 1);
    P.xp += 2;
    session.wrongTags[q.tag] = (session.wrongTags[q.tag] || 0) + 1;
  }
  save();
}
function showExplain(ok) {
  const q = session.q;
  const g = glossFor(q.mode === 'mcq' && q.tid === 'vetrumai' ? 'வேற்றுமை' : q.answer) || glossFor(q.answer);
  const w = q.word;
  let wordinfo = '';
  if (w) {
    const bits = [];
    if (w[W.SPLIT] && w[W.SPLIT] !== w[W.SOL]) bits.push(`${t('split')}: ${esc(w[W.SPLIT])}`);
    if (w[W.GLOSS]) bits.push(`${t('gloss')}: ${esc(w[W.GLOSS])}`);
    if (w[W.FEAT]) bits.push(esc(w[W.FEAT].split('|').filter(Boolean).join(' · ')));
    if (q.tid !== 'solvagai' && w[W.TAG]) bits.push(esc(w[W.CAT]) + ' → ' + esc(w[W.TAG]));
    if (bits.length) wordinfo = `<div class="wordinfo"><b>${esc(w[W.SOL])}</b> — ${bits.join(' · ')}</div>`;
  }
  const isLast = session.i + 1 >= session.items.length;
  $('#explain').innerHTML = `
    <div class="explain">
      <div class="verdict ${ok ? 'ok' : 'bad'}">${ok ? '✓ ' + t('correct') : '✗ ' + t('wrong') + ' — ' + t('answerIs') + ' ' + esc(q.answer)}</div>
      ${wordinfo}
      ${g ? `<div class="g-ta">${esc(g.ta)}</div><div class="g-en">${esc(g.en)}</div>` : ''}
      ${q.rec.u ? `<div class="small" style="margin-top:8px">${t('urai')}: ${esc(q.rec.u)}</div>` : ''}
      <button class="next-btn" id="next-q">${isLast ? t('done') : t('next')}</button>
    </div>`;
  $('#next-q').addEventListener('click', () => {
    session.i++;
    if (session.i >= session.items.length) showResult(); else showQuestion();
  });
  $('#next-q').focus();
}
function showResult() {
  const total = session.items.length;
  const pc = Math.round(session.correct / total * 100);
  if (pc > (P.best || 0)) P.best = pc;
  save();
  const weak = Object.entries(session.wrongTags).sort((a, b) => b[1] - a[1]).slice(0, 4);
  render(`
    <div class="result">
      <div class="big">${session.correct} ${t('of')} ${total}</div>
      <div class="msg">${pc >= 80 ? 'அருமை! 🎉' : pc >= 50 ? 'நன்று — தொடர்ந்து பயிலுங்கள்.' : 'கவலை வேண்டாம், மீண்டும் முயலுங்கள்.'}</div>
      ${weak.length ? `<div class="weak"><b>${t('weakTitle')}:</b> ${weak.map(x => esc(x[0])).join(' · ')}</div>` : ''}
      <button class="primary-btn" id="r-again">${t('again')}</button>
      <button class="ghost-btn" id="r-home">${t('backHome')}</button>
    </div>`);
  $('#r-again').addEventListener('click', () => startSession(session.tid));
  $('#r-home').addEventListener('click', () => { location.hash = '#/home'; });
}

/* ------------------------------------------------------------ views */
function render(html) { app.innerHTML = html; window.scrollTo(0, 0); }

function topicMastery(tid) {
  const prog = P.topics[tid];
  if (!prog) return { pct: 0, mastered: 0, answered: 0 };
  const tags = Object.values(prog.tags);
  if (!tags.length) return { pct: 0, mastered: 0, answered: prog.answered };
  const pct = Math.round(tags.reduce((s, r) => s + r.box, 0) / (tags.length * 5) * 100);
  return { pct, mastered: tags.filter(r => r.box >= 4).length, answered: prog.answered };
}

async function viewHome() {
  render(`<div class="loading">${t('loadingBank')}</div>`);
  const meta = await ensureMeta();
  const masteredAll = Object.keys(P.topics).reduce((s, tid) => s + topicMastery(tid).mastered, 0);
  render(`
    <div class="hero">
      <h1>${t('heroTitle')}</h1>
      <p>${t('heroSub')}</p>
      <div class="xp">
        <span>⭐ <b>${P.xp}</b> ${t('xp')}</span>
        <span>🔥 <b>${P.days.length}</b> ${t('streak')}</span>
        <span>🏅 <b>${masteredAll}</b> ${t('mastered')}</span>
      </div>
    </div>
    <div class="topic-grid">
      ${meta.topics.filter(x => x.n > 0).map(x => {
        const m = topicMastery(x.id);
        return `
        <a class="topic-card" href="#/drill/${x.id}">
          <h3>${esc(x.ta)}</h3>
          <div class="sub">${esc(x.en)} · <span class="badge">${t('level')} ${esc(x.level)}</span> · ${x.n.toLocaleString()} ${t('items')}</div>
          <div class="meter ${m.pct >= 90 ? 'done' : ''}"><i style="width:${m.pct}%"></i></div>
          <div class="stats-line"><span>${m.pct}%</span><span>${m.answered ? m.answered + ' ✓' : t('start') + ' →'}</span></div>
        </a>`;
      }).join('')}
    </div>
    <p class="small" style="margin-top:16px">${t('about')}</p>
    <p class="small">${t('offline')}</p>`);
}

async function viewStats() {
  await ensureMeta();
  const meta = DATA.meta;
  let answered = 0, correct = 0;
  for (const tid in P.topics) { answered += P.topics[tid].answered; correct += P.topics[tid].correct; }
  const acc = answered ? Math.round(correct / answered * 100) : 0;
  const topicRows = meta.topics.filter(x => x.n > 0).map(x => {
    const m = topicMastery(x.id);
    return `<div class="tagbar"><span class="nm">${esc(x.ta)}</span>
      <span class="bar"><i style="width:${m.pct}%;background:var(--accent)"></i></span>
      <span class="pc">${m.pct}%</span></div>`;
  }).join('');
  const tagRows = [];
  for (const tid in P.topics) {
    for (const [tag, r] of Object.entries(P.topics[tid].tags)) {
      if (r.seen) tagRows.push({ tag, r });
    }
  }
  tagRows.sort((a, b) => a.r.box - b.r.box || b.r.seen - a.r.seen);
  render(`
    <h1 style="color:var(--navy);margin-bottom:14px">📊 ${t('statsTitle')}</h1>
    <div class="stat-grid">
      <div class="stat-box"><div class="n">${P.xp}</div><div class="l">⭐ ${t('xp')}</div></div>
      <div class="stat-box"><div class="n">${answered}</div><div class="l">${t('totAnswered')}</div></div>
      <div class="stat-box"><div class="n">${acc}%</div><div class="l">${t('accuracy')}</div></div>
      <div class="stat-box"><div class="n">${P.days.length}</div><div class="l">🔥 ${t('streak')}</div></div>
    </div>
    <section class="block"><h2>${t('byTopic')}</h2>${topicRows}</section>
    ${tagRows.length ? `<section class="block"><h2>${t('byTag')}</h2>${
      tagRows.slice(0, 40).map(x => `<div class="tagbar"><span class="nm">${esc(x.tag)}</span>
        <span class="bar"><i style="width:${x.r.box / 5 * 100}%;background:${x.r.box >= 4 ? 'var(--ok)' : x.r.box >= 2 ? 'var(--accent)' : 'var(--bad)'}"></i></span>
        <span class="pc">${x.r.box}/5</span></div>`).join('')}</section>` : ''}
    <section class="block">
      <h2>💾</h2>
      <button class="primary-btn" id="bk">${t('backup')}</button>
      <button class="ghost-btn" id="rs">${t('restore')}</button>
      <input type="file" id="rs-file" accept=".json" hidden>
    </section>
    <a href="#/home" class="chip" style="color:var(--navy);border-color:var(--navy)">${t('backHome')}</a>`);
  $('#bk').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ settings: S, progress: P, version: VERSION })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ilakkanam-coach-progress.json';
    a.click(); URL.revokeObjectURL(a.href);
  });
  $('#rs').addEventListener('click', () => $('#rs-file').click());
  $('#rs-file').addEventListener('change', ev => {
    const f = ev.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const d = JSON.parse(rd.result);
        if (d.progress) { Object.assign(P, d.progress); save(); viewStats(); }
      } catch (e) { alert('Invalid file'); }
    };
    rd.readAsText(f);
  });
}

/* ------------------------------------------------------------ router */
function route() {
  const h = location.hash || '#/home';
  const m = h.match(/^#\/(\w[\w-]*)(?:\/([^/]+))?/);
  const page = m ? m[1] : 'home';
  if (page === 'drill' && m[2]) return startSession(m[2]);
  if (page === 'stats') return viewStats();
  return viewHome();
}
window.addEventListener('hashchange', route);

/* ------------------------------------------------------------ lang toggle */
function applyLang() {
  $('#lang-btn').textContent = S.lang === 'ta' ? 'EN' : 'த';
  $('#brand-title').textContent = t('brand');
  document.documentElement.lang = S.lang;
}
$('#lang-btn').addEventListener('click', () => {
  S.lang = S.lang === 'ta' ? 'en' : 'ta';
  save(); applyLang(); route();
});

/* ------------------------------------------------------------ boot */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').then(reg => {
    // precache the full drill bank in the background so drilling works fully offline
    const idle = window.requestIdleCallback || (fn => setTimeout(fn, 3000));
    idle(async () => {
      try {
        await navigator.serviceWorker.ready;            // SW must control fetches
        const meta = await ensureMeta();
        const urls = ['data/meta.json', 'data/kurals.json',
          'assets/icon-192.png', 'assets/icon-512.png', 'assets/icon-maskable-512.png']
          .concat(meta.topics.map(x => 'data/topics/' + x.id + '.json'));
        for (const u of urls) await fetch(u).catch(() => {});
      } catch (e) {}
    });
  }).catch(() => {});
}
applyLang();
route();
