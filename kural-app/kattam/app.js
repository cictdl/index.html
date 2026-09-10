/* குறள் குறுக்கெழுத்து — daily Tamil crossword prototype (CICT). Vanilla JS, no build step.
   Data: data/meta.json, data/mini.json (7×7 daily), data/weekly.json (11×11 weekly) from build_puzzles.py */
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const LIFELINES = 2;

// ------------------------------------------------------------ Tamil எழுத்து helpers (mirror build_puzzles.py)
const cp = ch => ch.codePointAt(0);
const isVowel = ch => { const o = cp(ch); return (o >= 0x0B85 && o <= 0x0B94) || o === 0x0B83; };
const isCons = ch => { const o = cp(ch); return o >= 0x0B95 && o <= 0x0BB9; };
const isSign = ch => { const o = cp(ch); return (o >= 0x0BBE && o <= 0x0BC2) || (o >= 0x0BC6 && o <= 0x0BC8) || (o >= 0x0BCA && o <= 0x0BCD) || o === 0x0BD7; };
const ZW = new RegExp('[' + String.fromCharCode(0x200B, 0x200C, 0x200D, 0xFEFF) + ']', 'g');
const SRI = 'ஸ்ரீ';
const norm = s => (s || '').replace(ZW, '').normalize('NFC');
function segment(s) {
  s = norm(s); const out = []; let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (isCons(ch)) {
      if (s.slice(i, i + 4) === SRI) { out.push(SRI); i += 4; continue; }
      let j = i + 1, cl = ch;
      while (j < s.length && isSign(s[j])) { cl += s[j]; j++; }
      out.push(cl); i = j;
    } else { out.push(ch); i++; }
  }
  return out;
}
/* compose a base cluster with a newly typed sign: கெ + ா → கொ (NFC), கா + ி → கி (replace), க + ் → க் */
function compose(base, sign) {
  const c = norm(base + sign);
  if (c.length === 2 && isSign(c[1])) return c;
  return base[0] + (sign === 'ௗ' ? 'ௌ' : sign);
}

// ------------------------------------------------------------ dates
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => ymd(new Date());
let EPOCH = '2026-09-07';
const dayIdx = s => Math.round((parseYmd(s) - parseYmd(EPOCH)) / 864e5);
const weekIdx = s => Math.floor(dayIdx(s) / 7);
const fmt = ms => { const t = Math.floor(ms / 1000); return `${Math.floor(t / 60)}:${pad(t % 60)}`; };

// ------------------------------------------------------------ state
const S = { kind: 'mini', puzzle: null, label: '', cells: [], sel: null, dir: 'A', pending: null,
  elapsed: 0, runFrom: null, tick: null, lifelines: LIFELINES, done: false, result: null, revealed: new Set(),
  banks: {}, nativeKb: false };

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
};
const totalElapsed = () => S.elapsed + (S.runFrom ? Date.now() - S.runFrom : 0);
function save() {
  if (!S.puzzle) return;
  store.set('kk:' + S.puzzle.id, { cells: S.cells, elapsed: totalElapsed(), lifelines: S.lifelines, done: S.done,
    result: S.result, revealed: [...S.revealed], dir: S.dir, sel: S.sel });
}

async function loadBank(kind) {
  if (S.banks[kind]) return S.banks[kind];
  const r = await fetch(`data/${kind}.json`); const b = await r.json();
  S.banks[kind] = b.puzzles; return b.puzzles;
}
const pick = (bank, idx) => bank[((idx % bank.length) + bank.length) % bank.length];

// ------------------------------------------------------------ puzzle prep
function prepare(p) {
  const n = p.size;
  p.map = Array.from({ length: n }, () => Array.from({ length: n }, () => ({ A: null, D: null })));
  p.ans = Array.from({ length: n }, () => Array(n).fill(null));
  for (const w of p.words) {
    w.cellsList = [];
    w.answer.forEach((ch, k) => {
      const r = w.r + (w.dir === 'D' ? k : 0), c = w.c + (w.dir === 'A' ? k : 0);
      p.map[r][c][w.dir] = w; p.ans[r][c] = ch; w.cellsList.push([r, c]);
    });
  }
  p.ordered = [...p.words.filter(w => w.dir === 'A'), ...p.words.filter(w => w.dir === 'D')];
}

function openPuzzle(kind, p, label, meta) {
  stopTick();
  S.kind = kind; S.puzzle = p; S.label = label; prepare(p);
  const saved = store.get('kk:' + p.id);
  S.cells = saved?.cells || p.grid.map(row => row.split('').map(ch => (ch === '#' ? null : '')));
  S.elapsed = saved?.elapsed || 0; S.lifelines = saved?.lifelines ?? LIFELINES; S.done = !!saved?.done;
  S.result = saved?.result || null; S.revealed = new Set(saved?.revealed || []);
  S.runFrom = null; S.pending = null;
  S.dir = saved?.dir || 'A';
  S.sel = saved?.sel || [p.ordered[0].r, p.ordered[0].c];
  $('#label').textContent = label;
  $('#pmeta').textContent = meta || '';
  renderGrid(); renderClues(); updateLife(); updateTimer(); updateSel(); markDoneClues();
  if (S.done) markAll();
  $('#k-submit').textContent = S.done ? 'முடிவைக் காட்டு' : 'நிறைவு செய்';
}

// ------------------------------------------------------------ rendering
const cellEl = (r, c) => $(`#grid .cell[data-r="${r}"][data-c="${c}"]`);
function renderGrid() {
  const p = S.puzzle, n = p.size, g = $('#grid');
  g.style.setProperty('--n', n); g.innerHTML = '';
  const nums = {}; p.words.forEach(w => { nums[w.r + ',' + w.c] = w.num; });
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const d = document.createElement('div'); d.className = 'cell'; d.dataset.r = r; d.dataset.c = c;
    if (S.cells[r][c] === null) d.classList.add('blk');
    else {
      const num = nums[r + ',' + c];
      if (num) { const s = document.createElement('span'); s.className = 'num'; s.textContent = num; d.appendChild(s); }
      const ch = document.createElement('span'); ch.className = 'ch'; ch.textContent = S.cells[r][c]; d.appendChild(ch);
      if (S.revealed.has(r + ',' + c)) d.classList.add('rev');
      d.setAttribute('role', 'gridcell');
    }
    g.appendChild(d);
  }
  fitAll();
}
function fit(el) {
  const ch = el.querySelector('.ch'); if (!ch || !ch.textContent) return;
  ch.style.fontSize = '';
  const max = el.clientWidth - 4; let size = parseFloat(getComputedStyle(ch).fontSize), guard = 0;
  while (ch.scrollWidth > max && guard++ < 8) { size *= 0.9; ch.style.fontSize = size + 'px'; }
}
const fitAll = () => $$('#grid .cell:not(.blk)').forEach(fit);

function clueHtml(w, compact) {
  const cl = w.clue;
  const len = `${w.answer.length} எழுத்து`;
  return `<span class="k">${cl.l1}<br>${cl.l2}</span>` +
    `<span class="${compact ? 'adh' : 'a'}">${w.num}${w.dir === 'A' ? ' குறுக்காக' : ' நெடுக்காக'} · ${cl.name} · ${len}</span>`;
}
function renderClues() {
  for (const dir of ['A', 'D']) {
    const ol = $(dir === 'A' ? '#across' : '#down'); ol.innerHTML = '';
    for (const w of S.puzzle.words.filter(x => x.dir === dir)) {
      const li = document.createElement('li'); li.dataset.id = w.dir + w.num;
      li.innerHTML = `<span class="n">${w.num}</span><div class="t"><div class="k">${w.clue.l1}<br>${w.clue.l2}</div><div class="a">${w.clue.name} · ${w.answer.length} எழுத்து</div></div>`;
      li.addEventListener('click', () => { S.dir = w.dir; S.sel = firstEmpty(w) || w.cellsList[0]; S.pending = null; updateSel(); focusKb(); });
      ol.appendChild(li);
    }
  }
}
function markDoneClues() {
  for (const w of S.puzzle.words) {
    const li = $(`#clues li[data-id="${w.dir + w.num}"]`);
    li.classList.toggle('done', w.cellsList.every(([r, c]) => !!S.cells[r][c]));
  }
}

// ------------------------------------------------------------ selection / movement
const curWord = () => (S.sel ? S.puzzle.map[S.sel[0]][S.sel[1]][S.dir] : null);
const idxInWord = w => w.cellsList.findIndex(([r, c]) => r === S.sel[0] && c === S.sel[1]);
const firstEmpty = w => w.cellsList.find(([r, c]) => !S.cells[r][c]);
function selectCell(r, c, click) {
  const m = S.puzzle.map[r][c];
  if (click && S.sel && S.sel[0] === r && S.sel[1] === c) { if (m.A && m.D) S.dir = S.dir === 'A' ? 'D' : 'A'; }
  else if (!m[S.dir]) S.dir = m.A ? 'A' : 'D';
  S.sel = [r, c]; S.pending = null; updateSel(); focusKb();
}
function updateSel() {
  $$('#grid .cell').forEach(el => el.classList.remove('sel', 'hl'));
  const w = curWord(); if (!w) return;
  w.cellsList.forEach(([r, c]) => cellEl(r, c).classList.add('hl'));
  cellEl(S.sel[0], S.sel[1]).classList.add('sel');
  $$('#clues li').forEach(li => li.classList.toggle('cur', li.dataset.id === w.dir + w.num));
  const cur = $('#clues li.cur'); if (cur && window.innerWidth >= 900) cur.scrollIntoView({ block: 'nearest' });
  $('#cluebar').innerHTML = clueHtml(w, true);
  save();
}
function advance() { const w = curWord(); const i = idxInWord(w); if (i < w.cellsList.length - 1) { S.sel = w.cellsList[i + 1]; updateSel(); return true; } return false; }
function retreat() { const w = curWord(); const i = idxInWord(w); if (i > 0) { S.sel = w.cellsList[i - 1]; updateSel(); return true; } return false; }
function nextWord(delta) {
  const ws = S.puzzle.ordered; let i = ws.indexOf(curWord()); i = (i + delta + ws.length) % ws.length;
  const nw = ws[i]; S.dir = nw.dir; S.sel = firstEmpty(nw) || nw.cellsList[0]; S.pending = null; updateSel();
}
function toggleDir() { const m = S.puzzle.map[S.sel[0]][S.sel[1]]; if (m.A && m.D) { S.dir = S.dir === 'A' ? 'D' : 'A'; S.pending = null; updateSel(); } }
function moveSel(dr, dc) {
  const n = S.puzzle.size; let [r, c] = S.sel;
  for (let k = 0; k < n; k++) { r += dr; c += dc; if (r < 0 || c < 0 || r >= n || c >= n) return; if (S.cells[r][c] !== null) break; }
  if (S.cells[r][c] === null) return;
  const m = S.puzzle.map[r][c]; const want = dr ? 'D' : 'A'; S.dir = m[want] ? want : (m.A ? 'A' : 'D');
  S.sel = [r, c]; S.pending = null; updateSel();
}

// ------------------------------------------------------------ typing
function setCell(r, c, v) {
  S.cells[r][c] = v; const el = cellEl(r, c); el.querySelector('.ch').textContent = v;
  el.classList.remove('wrong', 'ok', 'rev'); S.revealed.delete(r + ',' + c); fit(el); startTimer(); markDoneClues(); save();
}
function typeUnit(u) {
  if (S.done || !S.sel) return;
  u = norm(u); if (!u) return;
  const [r, c] = S.sel; const cur = S.cells[r][c] || '';
  if (u.length === 1 && isSign(u)) {                       // vowel sign / pulli
    if (cur && isCons(cur[0])) { setCell(r, c, compose(cur, u)); S.pending = null; advance(); }
    else if (!cur) {                                       // sign typed into an empty cell → apply to the previous cell
      const w = curWord(), i = idxInWord(w);
      if (i > 0) { const [pr, pc] = w.cellsList[i - 1]; const pv = S.cells[pr][pc] || ''; if (pv && isCons(pv[0])) setCell(pr, pc, compose(pv, u)); }
    }
    return;
  }
  if (u.length === 1 && isCons(u)) {                       // consonant: stays in the cell awaiting a sign
    if (cur && S.pending && S.pending[0] === r && S.pending[1] === c && advance()) {
      const [r2, c2] = S.sel; setCell(r2, c2, u); S.pending = [r2, c2]; return;
    }
    setCell(r, c, u); S.pending = [r, c]; return;
  }
  for (const x of segment(u)) {                            // independent vowel, ஃ, or whole clusters from an IME
    if (!isVowel(x) && !isCons(x[0])) continue;
    const [rr, cc] = S.sel; setCell(rr, cc, x); S.pending = null; if (!advance()) break;
  }
}
function del() {
  if (S.done || !S.sel) return;
  const [r, c] = S.sel;
  if (S.cells[r][c]) setCell(r, c, '');
  else if (retreat()) { const [r2, c2] = S.sel; setCell(r2, c2, ''); }
  S.pending = null;
}

// ------------------------------------------------------------ timer
function startTimer() { if (!S.runFrom && !S.done) { S.runFrom = Date.now(); S.tick = setInterval(updateTimer, 1000); } }
function stopTick() { if (S.runFrom) { S.elapsed += Date.now() - S.runFrom; S.runFrom = null; } clearInterval(S.tick); S.tick = null; updateTimer(); }
function updateTimer() { if (S.puzzle) $('#timer').textContent = fmt(S.done && S.result ? S.result.elapsed : totalElapsed()); }
document.addEventListener('visibilitychange', () => { if (document.hidden) { stopTick(); save(); } });

// ------------------------------------------------------------ lifelines / check / submit
function updateLife() {
  $('#life').textContent = `💡 ${S.lifelines}`;
  $('#k-hint').disabled = S.done || S.lifelines <= 0;
  $('#k-check').disabled = S.done;
}
function reveal() {
  if (S.done || S.lifelines <= 0 || !S.sel) return;
  const w = curWord(), k = idxInWord(w), [r, c] = S.sel;
  setCell(r, c, w.answer[k]); cellEl(r, c).classList.add('rev'); S.revealed.add(r + ',' + c);
  S.lifelines--; updateLife(); advance(); save();
}
function check() {
  let wrong = 0, filled = 0;
  const p = S.puzzle;
  for (let r = 0; r < p.size; r++) for (let c = 0; c < p.size; c++) {
    const v = S.cells[r][c]; if (!v) continue; filled++;
    if (v !== p.ans[r][c]) { cellEl(r, c).classList.add('wrong'); wrong++; }
  }
  toast(!filled ? 'இன்னும் எதுவும் எழுதவில்லை' : wrong ? `${wrong} எழுத்து தவறு` : 'எழுதியவை அனைத்தும் சரி ✔');
}
function grammarNote() {
  const w = curWord(); if (!w) return;
  toast(w.hint ? `இலக்கணம் (${w.num}${w.dir === 'A' ? 'கு' : 'நெ'}): ${w.hint}` : 'இச்சொல்லுக்குக் குறிப்பு இல்லை', 6000);
}
function markAll() {
  const p = S.puzzle;
  for (let r = 0; r < p.size; r++) for (let c = 0; c < p.size; c++) {
    if (S.cells[r][c] === null) continue;
    const el = cellEl(r, c); el.classList.remove('wrong', 'ok');
    el.classList.add(S.cells[r][c] === p.ans[r][c] ? 'ok' : 'wrong');
  }
}
function submit() {
  if (S.done) { showResult(); return; }
  const p = S.puzzle; let empty = 0;
  for (let r = 0; r < p.size; r++) for (let c = 0; c < p.size; c++) if (S.cells[r][c] === '') empty++;
  if (empty && !confirm(`${empty} கட்டங்கள் நிரப்பப்படவில்லை. நிறைவு செய்யவா?`)) return;
  stopTick(); S.done = true;
  let ok = 0;
  for (const w of p.words) { w.ok = w.cellsList.every(([r, c], k) => S.cells[r][c] === w.answer[k]); if (w.ok) ok++; }
  S.result = { ok, total: p.words.length, elapsed: S.elapsed, lifelines: LIFELINES - S.lifelines, date: today() };
  markAll(); updateLife(); updateTimer(); save(); updateStreak();
  $('#k-submit').textContent = 'முடிவைக் காட்டு';
  showResult();
}
function updateStreak() {
  if (S.kind !== 'mini' || !S.label.includes(today())) return;
  const st = store.get('kk:streak') || { last: null, count: 0 };
  if (st.last === today()) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  st.count = st.last === ymd(y) ? st.count + 1 : 1; st.last = today(); store.set('kk:streak', st); renderStreak();
}
function renderStreak() {
  const st = store.get('kk:streak'); const el = $('#streak');
  if (!st || !st.count) { el.textContent = ''; return; }
  const y = new Date(); y.setDate(y.getDate() - 1);
  el.textContent = (st.last === today() || st.last === ymd(y)) ? `🔥 ${st.count}` : '';
}

// ------------------------------------------------------------ result sheet
function showResult() {
  const p = S.puzzle, res = S.result; if (!res) return;
  for (const w of p.words) w.ok = w.cellsList.every(([r, c], k) => S.cells[r][c] === w.answer[k]);
  $('#res-title').textContent = res.ok === res.total ? '🎉 அனைத்தும் சரி!' : `${res.ok} / ${res.total} சொற்கள் சரி`;
  $('#res-stats').innerHTML = `<span>⏱ ${fmt(res.elapsed)}</span><span>✔ ${res.ok}/${res.total}</span><span>💡 ${res.lifelines} துணை</span><span>${S.label}</span>`;
  const mark = (line, ans) => line.replace(/_{4,}/, `<mark>${ans}</mark>`);
  $('#res-words').innerHTML = p.words.map(w => {
    const ans = w.answer.join(''); const typed = w.cellsList.map(([r, c]) => S.cells[r][c] || '·').join('');
    const cl = w.clue;
    return `<div class="w">
      <div><span class="ans ${w.ok ? 'good' : 'bad'}">${w.num}${w.dir === 'A' ? 'கு' : 'நெ'} · ${ans}</span>${w.ok ? '' : ` <span class="typed">நீங்கள்: ${typed}</span>`}</div>
      <div class="kural">${mark(cl.l1, ans)}<br>${mark(cl.l2, ans)}</div>
      <div class="src">${cl.pal} · ${cl.name} (${cl.nameEn}) · குறள் ${cl.kural}</div>
      <details><summary>பொருள் · meaning · இலக்கணம்</summary>
        <p>${cl.ta || ''}</p>${cl.en ? `<p class="en">${cl.en}</p>` : ''}
        ${w.hint ? `<div class="gram">இலக்கணக் குறிப்பு: ${w.hint}</div>` : ''}
      </details></div>`;
  }).join('');
  $('#modal').hidden = false;
}
function shareText() {
  const p = S.puzzle, res = S.result;
  const rows = p.grid.map((row, r) => row.split('').map((ch, c) => ch === '#' ? '⬛' :
    S.revealed.has(r + ',' + c) ? '🟨' : (S.cells[r][c] === p.ans[r][c] ? '🟩' : '🟥')).join(''));
  // inside the Android shell location is the asset-loader URL, which means nothing to a recipient: use the public site
  const site = window.AndroidApp ? '../index.html' : location.origin + location.pathname;
  return `குறள் குறுக்கெழுத்து · ${S.label}\n⏱ ${fmt(res.elapsed)} · ✔ ${res.ok}/${res.total} · 💡 ${res.lifelines}\n${rows.join('\n')}\n${site}`;
}
async function share() {
  const text = shareText();
  try {
    if (window.AndroidShare) { AndroidShare.text('குறள் குறுக்கெழுத்து', text); return; }   // WebView shell has no navigator.share
    if (navigator.share) { await navigator.share({ text }); return; }
    await navigator.clipboard.writeText(text); toast('நகலெடுக்கப்பட்டது · copied');
  } catch (e) { toast('பகிர முடியவில்லை'); }
}

// ------------------------------------------------------------ keyboard (on-screen + physical)
const KEYS = {
  uyir: ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ', 'ஃ'],
  mei1: ['க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம'],
  mei2: ['ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன', 'ஜ', 'ஷ', 'ஸ', 'ஹ'],
  signs1: ['்', 'ா', 'ி', 'ீ', 'ு', 'ூ'],
  signs2: ['ெ', 'ே', 'ை', 'ொ', 'ோ', 'ௌ'],
};
function buildKeyboard() {
  for (const [row, keys] of Object.entries(KEYS)) {
    const el = $(`.krow[data-row="${row}"]`);
    for (const k of keys) {
      const b = document.createElement('button'); b.className = 'key' + (isSign(k) ? ' sign' : ''); b.dataset.k = k;
      b.textContent = isSign(k) ? '◌' + k : k; b.setAttribute('aria-label', k);
      el.appendChild(b);
    }
    if (row === 'signs2') { const d = document.createElement('button'); d.className = 'key del'; d.id = 'k-del'; d.textContent = '⌫'; el.appendChild(d); }
  }
  const kb = $('#keyboard');
  kb.addEventListener('mousedown', e => e.preventDefault());   // keep focus on the hidden input
  kb.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.k) typeUnit(b.dataset.k);
    else if (b.id === 'k-del') del();
    else if (b.id === 'k-dir') toggleDir();
    else if (b.id === 'k-check') check();
    else if (b.id === 'k-hint') reveal();
    else if (b.id === 'k-gram') grammarNote();
    else if (b.id === 'k-submit') submit();
    else if (b.id === 'k-native') toggleNative();
    if (b.id !== 'k-native') focusKb();
  });
}
const kbIn = () => $('#kb-in');
function focusKb() { const i = kbIn(); if (document.activeElement !== i) i.focus({ preventScroll: true }); }
function toggleNative() {
  S.nativeKb = !S.nativeKb; const i = kbIn();
  i.inputMode = S.nativeKb ? 'text' : 'none'; $('#keyboard').classList.toggle('native', S.nativeKb);
  i.blur(); setTimeout(() => i.focus({ preventScroll: true }), 50);
  toast(S.nativeKb ? 'சாதனத் தட்டச்சுப் பலகை' : 'திரைப் பலகை');
}
function flushKb() {
  const i = kbIn(); const v = i.value; i.value = '';
  if (!v || !S.puzzle) return;
  for (const ch of norm(v)) { if (isSign(ch) || isCons(ch) || isVowel(ch)) typeUnit(ch); }
}
function bindPhysical() {
  const i = kbIn();
  i.addEventListener('keydown', e => {
    if (!S.puzzle || $('#view-play').hidden) return;
    const k = e.key;
    if (k === 'Backspace') { e.preventDefault(); del(); }
    else if (k === 'Delete') { e.preventDefault(); const [r, c] = S.sel; setCell(r, c, ''); }
    else if (k === 'ArrowLeft') { e.preventDefault(); moveSel(0, -1); }
    else if (k === 'ArrowRight') { e.preventDefault(); moveSel(0, 1); }
    else if (k === 'ArrowUp') { e.preventDefault(); moveSel(-1, 0); }
    else if (k === 'ArrowDown') { e.preventDefault(); moveSel(1, 0); }
    else if (k === 'Tab') { e.preventDefault(); nextWord(e.shiftKey ? -1 : 1); }
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); toggleDir(); }
  });
  i.addEventListener('input', e => { if (!e.isComposing) flushKb(); });
  i.addEventListener('compositionend', flushKb);
  $('#grid').addEventListener('click', e => {
    const cell = e.target.closest('.cell'); if (!cell || cell.classList.contains('blk')) return;
    selectCell(+cell.dataset.r, +cell.dataset.c, true);
  });
  $('#prev-word').addEventListener('click', () => { nextWord(-1); focusKb(); });
  $('#next-word').addEventListener('click', () => { nextWord(1); focusKb(); });
  $('#cluebar-wrap').addEventListener('mousedown', e => e.preventDefault());
  $('#clues').addEventListener('mousedown', e => { if (e.target.closest('li')) e.preventDefault(); });
}

// ------------------------------------------------------------ toast
let toastT = null;
function toast(msg, ms = 2200) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, ms); }

// ------------------------------------------------------------ archive
function status(id) { const s = store.get('kk:' + id); if (!s) return '○'; if (s.done) return s.result && s.result.ok === s.result.total ? '✅' : '✔'; return '◐'; }
async function renderArchive() {
  const [mini, weekly] = await Promise.all([loadBank('mini'), loadBank('weekly')]);
  const t = today(); const di = dayIdx(t);
  const ol = $('#arch-mini'); ol.innerHTML = '';
  for (let i = di; i >= Math.max(0, di - 59); i--) {
    const d = parseYmd(EPOCH); d.setDate(d.getDate() + i); const ds = ymd(d); const p = pick(mini, i);
    ol.insertAdjacentHTML('beforeend', `<li><a href="#/mini/${ds}"><span>#${i + 1} · ${ds}</span><span class="st">${status(p.id)}</span></a></li>`);
  }
  const ow = $('#arch-weekly'); ow.innerHTML = '';
  for (let w = weekIdx(t); w >= 0; w--) {
    const p = pick(weekly, w);
    ow.insertAdjacentHTML('beforeend', `<li><a href="#/weekly/${w + 1}"><span>வாரம் ${w + 1}</span><span class="st">${status(p.id)}</span></a></li>`);
  }
}
async function randomPractice() {
  const kind = Math.random() < 0.75 ? 'mini' : 'weekly'; const bank = await loadBank(kind);
  const p = bank[Math.floor(Math.random() * bank.length)];
  location.hash = `#/practice/${kind}/${p.id}`;
}

// ------------------------------------------------------------ router
function showView(name) {
  for (const v of $$('.view')) v.hidden = v.id !== 'view-' + name;
  $$('.tabs a').forEach(a => a.classList.toggle('active', a.dataset.view === name || (name === 'play' && a.dataset.view === S.kind && !S.practice)));
  $('#modal').hidden = true;
}
async function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const view = parts[0] || 'mini';
  if (view === 'archive') { showView('archive'); renderArchive(); return; }
  if (view === 'about') { showView('about'); return; }
  S.practice = view === 'practice';
  try {
    if (view === 'mini') {
      let date = parts[1] || today(); if (!/^\d{4}-\d\d-\d\d$/.test(date) || dayIdx(date) < 0 || date > today()) date = today();
      const i = dayIdx(date); const p = pick(await loadBank('mini'), i);
      S.kind = 'mini'; openPuzzle('mini', p, `குட்டிக் கட்டம் #${i + 1} · ${date}`, `7×7 · ${p.words.length} சொற்கள் · ${date === today() ? 'இன்றையது' : 'பழையது'}`);
    } else if (view === 'weekly') {
      let w = parts[1] ? +parts[1] - 1 : weekIdx(today()); if (!(w >= 0) || w > weekIdx(today())) w = weekIdx(today());
      const p = pick(await loadBank('weekly'), w);
      S.kind = 'weekly'; openPuzzle('weekly', p, `வாரக் கட்டம் #${w + 1}`, `11×11 · ${p.words.length} சொற்கள்`);
    } else if (view === 'practice') {
      const kind = parts[1] === 'weekly' ? 'weekly' : 'mini'; const bank = await loadBank(kind);
      const p = bank.find(x => x.id === parts[2]) || bank[0];
      S.kind = kind; openPuzzle(kind, p, `பயிற்சி · ${p.id}`, `${p.size}×${p.size} · ${p.words.length} சொற்கள்`);
    } else { location.hash = '#/mini'; return; }
    showView('play'); focusKb();
  } catch (e) { console.error(e); toast('கட்டத்தை ஏற்ற முடியவில்லை'); }
}

// ------------------------------------------------------------ boot
async function boot() {
  try { const m = await (await fetch('data/meta.json')).json(); EPOCH = m.epoch || EPOCH; } catch (e) { /* offline first run */ }
  buildKeyboard(); bindPhysical(); renderStreak();
  $('#res-close').addEventListener('click', () => { $('#modal').hidden = true; });
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') $('#modal').hidden = true; });
  $('#res-share').addEventListener('click', share);
  $('#res-next').addEventListener('click', randomPractice);
  $('#btn-random').addEventListener('click', randomPractice);
  window.addEventListener('hashchange', route);
  window.addEventListener('resize', fitAll);
  await route();
  setupPwa();
}

// ------------------------------------------------------------ PWA: install prompt, iOS hint, update flow
// Inside the Tirukkural app: its service worker caches this folder, so the game registers
// no worker and offers no install prompt of its own.
function setupPwa() {
  const about = $('#about-version');
  if (about) about.textContent = window.AndroidApp ? 'திருக்குறள் Android செயலிக்குள்' : 'திருக்குறள் செயலிக்குள் · inside the Tirukkural app';
}
boot();
