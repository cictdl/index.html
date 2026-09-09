/* தாளக் குறள் · Thaala Kural — screens, routing, progress, speech.
   Plain JS, no framework. Tamil-first UI with optional English subtitles. */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const pad3 = n => String(n).padStart(3, '0');
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const NATIVE_TTS = typeof AndroidTTS !== 'undefined' ? AndroidTTS : null;
const IS_ANDROID_APP = !!NATIVE_TTS || SFX.native;

// ───────────────────────── settings & progress ─────────────────────────
function load(key, dflt) { try { return Object.assign({}, dflt, JSON.parse(localStorage.getItem(key) || '{}')); } catch (e) { return Object.assign({}, dflt); } }
const S = load('tk.settings.v1', { level: 1, tempo: 'normal', guide: true, sub: true, haptics: true, sound: true, offsetMs: 0, leftHand: false, contrast: false, bigText: false, seenHelp: false });
const P = load('tk.progress.v1', { stars: {}, best: {}, plays: 0, streak: 0, lastDay: '', lastKural: 0 });
const saveS = () => { try { localStorage.setItem('tk.settings.v1', JSON.stringify(S)); } catch (e) { } };
const saveP = () => { try { localStorage.setItem('tk.progress.v1', JSON.stringify(P)); } catch (e) { } };
const BPM = { 1: 64, 2: 78, 3: 94 };
const TEMPO_ADJ = { slow: -12, normal: 0, fast: 12 };
const bpmFor = level => BPM[level] + (TEMPO_ADJ[S.tempo] || 0);

// ───────────────────────── strings ─────────────────────────
const T = {
  play: ['விளையாடு', 'Play'], next: ['அடுத்த குறள்', 'Next kural'], map: ['வரைபடம்', 'Map'], daily: ['இன்றைய குறள்', 'Kural of the day'],
  settings: ['அமைப்பு', 'Settings'], about: ['பற்றி', 'About'], home: ['முகப்பு', 'Home'], again: ['மீண்டும்', 'Play again'],
  start: ['தொடங்கு', 'Start'], listen: ['கேள்', 'Listen'], demo: ['காட்டு', 'Show me'], meaning: ['பொருள்', 'Meaning'],
  stars: ['நட்சத்திரங்கள்', 'Stars'], played: ['விளையாடிய குறள்கள்', 'Kurals played'], streak: ['தொடர் நாள்கள்', 'Day streak'],
  level: ['நிலை', 'Level'], lv1: ['ஒரே தட்டு', 'one pad'], lv2: ['தா · தக', 'two pads'], lv3: ['வேகம்', 'fast'],
  howto: ['எப்படி விளையாடுவது?', 'How to play'], resume: ['தொடர்', 'Resume'], restart: ['மறுதொடக்கம்', 'Restart'], quit: ['வெளியேறு', 'Quit'],
  paused: ['இடைநிறுத்தம்', 'Paused'], result: ['முடிவு', 'Result'], perfect: ['சரியாக', 'perfect'], good: ['நன்று', 'good'], miss: ['தவறியது', 'missed'], wrong: ['மாறியது', 'wrong pad'],
  score: ['மதிப்பெண்', 'score'], best: ['சிறந்தது', 'best'], combo: ['தொடர்', 'combo'], locked: ['அலகிட முடியவில்லை', 'cannot be scanned'],
  calibrate: ['ஒலி சீரமைப்பு', 'Sound timing'], reset: ['முன்னேற்றத்தை அழி', 'Reset progress'], tempo: ['வேகம்', 'Tempo'],
  slow: ['மெதுவாக', 'slow'], normal: ['நடுத்தரம்', 'normal'], fast: ['வேகமாக', 'fast'], guide: ['வழிகாட்டி முரசு', 'Guide drums'],
  sound: ['ஒலி', 'Sound'], haptics: ['அதிர்வு', 'Vibration'], sub: ['ஆங்கிலத் துணை எழுத்து', 'English subtitles'],
  leftHand: ['இடக்கை', 'Left-hand pads'], contrast: ['அதிக மாறுபாடு', 'High contrast'], bigText: ['பெரிய எழுத்து', 'Big text'],
  lesson: ['யாப்புப் பாடம்', 'Learn the metre'],
};
const t = k => (T[k] || [k])[0];
const L = k => S.sub ? `${esc(t(k))} <small class="en">${esc((T[k] || ['', ''])[1])}</small>` : esc(t(k));
const JUDGE = { perfect: 'சரி!', good: 'நன்று', miss: 'தவறியது', wrong: 'மறு முரசு!' };

// ───────────────────────── data ─────────────────────────
let META = null;
const CH = {};
async function getMeta() { if (!META) META = await (await fetch('data/meta.json')).json(); return META; }
async function chapter(c) { if (!CH[c]) CH[c] = await (await fetch(`data/ch/${pad3(c)}.json`)).json(); return CH[c]; }
async function kural(n) { return (await chapter(Math.ceil(n / 10)))[(n - 1) % 10]; }
const chapterOf = n => META.chapters[Math.ceil(n / 10) - 1];
const playable = n => n >= 1 && n <= 1330 && !META.unplayable.includes(n);
const starsOf = n => P.stars[n] || 0;
function nextKural() {
  const start = P.lastKural || 0;
  for (let i = 1; i <= 1330; i++) { const n = ((start + i - 1) % 1330) + 1; if (playable(n) && starsOf(n) < 3) return n; }
  let n; do { n = 1 + Math.floor(Math.random() * 1330); } while (!playable(n)); return n;
}
function dailyN(d = new Date()) {
  const days = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
  let n = ((days * 1103) % 1330 + 1330) % 1330 + 1;
  while (!playable(n)) n = n % 1330 + 1;
  return n;
}
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad3(d.getMonth() + 1).slice(1)}-${pad3(d.getDate()).slice(1)}`; };
function starStr(s, max = 3) { let o = ''; for (let i = 0; i < max; i++) o += i < s ? '★' : '<span class="off">★</span>'; return o; }

// ───────────────────────── speech ─────────────────────────
const TTS = {
  voices: [], seq: 0, cur: null,
  init() { if (!('speechSynthesis' in window)) return; const load = () => { this.voices = speechSynthesis.getVoices(); }; load(); speechSynthesis.onvoiceschanged = load; },
  pick() {
    const v = this.voices;
    return v.find(x => /^ta[-_]/i.test(x.lang)) || v.find(x => /^ta/i.test(x.lang)) || null;
  },
  stop() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (NATIVE_TTS) { this.seq++; try { NATIVE_TTS.stop(); } catch (e) { } }
    if (this.cur) { this.cur.classList.remove('playing'); this.cur = null; }
  },
  speak(text, btn, onend) {
    this.stop();
    if (NATIVE_TTS) {
      const id = String(++this.seq); let ok = false;
      try { ok = NATIVE_TTS.speak(text, 'ta-IN', 0.85, id); } catch (e) { ok = false; }
      if (!ok) { toast('தமிழ்க் குரல் இல்லை · No Tamil voice on this device'); return false; }
      if (btn) { btn.classList.add('playing'); this.cur = btn; }
      this._pending = { id, btn, onend }; return true;
    }
    if (!('speechSynthesis' in window)) { toast('இந்த உலாவியில் குரல் இல்லை · No speech in this browser'); return false; }
    const v = this.pick();
    if (!v) { toast('தமிழ்க் குரல் இல்லை · No Tamil voice installed'); return false; }
    const u = new SpeechSynthesisUtterance(text); u.voice = v; u.lang = v.lang; u.rate = 0.85;
    u.onend = u.onerror = () => { if (btn) btn.classList.remove('playing'); if (this.cur === btn) this.cur = null; onend && onend(); };
    if (btn) { btn.classList.add('playing'); this.cur = btn; }
    speechSynthesis.speak(u); return true;
  },
  nativeDone(id) { const p = this._pending; if (!p || p.id !== id) return; this._pending = null; if (p.btn) p.btn.classList.remove('playing'); if (this.cur === p.btn) this.cur = null; p.onend && p.onend(); },
};
window.__ttsDone = id => TTS.nativeDone(id);

// ───────────────────────── shell helpers ─────────────────────────
let toastTimer = 0;
function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600); }
function setTop(title, sub, back) {
  $('#top-title').textContent = title || 'தாளக் குறள்';
  $('#top-sub').textContent = sub || 'Thaala Kural · CICT';
  $('#btn-back').hidden = !back;
}
function render(html, full) { const m = $('#main'); m.className = 'view' + (full ? ' full' : ''); m.innerHTML = html; window.scrollTo(0, 0); }
function applyBody() {
  document.body.classList.toggle('contrast', !!S.contrast);
  document.body.classList.toggle('bigtext', !!S.bigText);
  SFX.setMuted(!S.sound); SFX.setHaptics(!!S.haptics);
  $('#btn-sound').textContent = S.sound ? '🔊' : '🔇';
}

// ───────────────────────── routing ─────────────────────────
let game = null;          // the running Game controller, if any
let lastRoute = '';
function route() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = hash.split('?');
  const q = Object.fromEntries(new URLSearchParams(qs || ''));
  const parts = path.split('/').filter(Boolean);
  if (game) { game.stop(); game = null; }
  TTS.stop();
  lastRoute = path;
  getMeta().then(() => {
    if (parts.length === 0) return homeScreen();
    switch (parts[0]) {
      case 'map': return mapScreen();
      case 'ch': return chapterScreen(+parts[1]);
      case 'learn': return learnScreen(+parts[1]);
      case 'play': return playScreen(+parts[1], q);
      case 'next': location.replace('#/learn/' + nextKural()); return;
      case 'daily': location.replace('#/learn/' + dailyN()); return;
      case 'lesson': return lessonScreen(+parts[1] || 1);
      case 'settings': return settingsScreen();
      case 'calibrate': return calibrateScreen();
      case 'about': return aboutScreen();
      default: location.replace('#/');
    }
  }).catch(err => { render(`<div class="card"><h2>தரவு ஏற்ற முடியவில்லை</h2><p class="en">${esc(err.message || err)}</p></div>`); });
}

// ───────────────────────── home ─────────────────────────
function homeScreen() {
  setTop('தாளக் குறள்', 'Thaala Kural · CICT', false);
  const total = Object.values(P.stars).reduce((a, b) => a + b, 0);
  const played = Object.keys(P.stars).length;
  render(`
  <section class="hero">
    <h2>தாளக் குறள்</h2>
    <p class="tagline"><span class="N">தா</span> · <span class="I">தக</span> — குறளின் தாளத்தில் தட்டு!</p>
    <p>ஒவ்வொரு அசையும் ஒரு தட்டு. <span class="N">நேர்</span> என்றால் <b>தா</b>, <span class="I">நிரை</span> என்றால் <b>தக</b>.
      ${S.sub ? '<br><small class="en">Every metrical syllable is one tap. நேர் is <b>தா</b>, நிரை is <b>தக</b>. Chant all 1,330 kurals by their beat.</small>' : ''}</p>
    <div class="row">
      <a class="btn primary big" href="#/next">▶ ${L('play')}</a>
      <a class="btn ghost" style="color:#fff;border-color:rgba(255,255,255,.5)" href="#/daily">🌞 ${L('daily')}</a>
    </div>
  </section>
  <div class="stats">
    <div class="stat"><b>${total}</b><span>★ ${esc(t('stars'))}</span></div>
    <div class="stat"><b>${played}</b><span>${esc(t('played'))} / ${META.counts.playable}</span></div>
    <div class="stat"><b>${P.streak}</b><span>${esc(t('streak'))}</span></div>
  </div>
  <div class="levels" role="radiogroup" aria-label="${esc(t('level'))}">
    ${[1, 2, 3].map(l => `<button class="lv ${S.level === l ? 'on' : ''}" data-level="${l}" role="radio" aria-checked="${S.level === l}"><b>${esc(t('level'))} ${l}</b><small>${esc(t('lv' + l))}</small></button>`).join('')}
  </div>
  <div class="row" style="margin-bottom:12px">
    <a class="btn block" href="#/map">🗺 ${L('map')}</a>
    <a class="btn block navy" href="#/lesson/1">📚 ${L('lesson')}</a>
  </div>
  <div class="card">
    <h2>${L('howto')}</h2>
    <div class="howto">
      <div class="demo"><span class="note N">தா</span><div><b>நேர்</b><br><small>ஒரு தட்டு · one tap</small></div></div>
      <div class="demo"><span class="note I">தக</span><div><b>நிரை</b><br><small>ஒரு தட்டு · one tap</small></div></div>
    </div>
    <p class="muted" style="margin-top:10px;font-size:.92rem">வளையத்தை நோக்கி வரும் ஒவ்வொரு ஒலிக்கும் சரியான நேரத்தில் தட்டு. நிலை 1-ல் ஒரே பலகை; நிலை 2-ல் தா/தக பிரித்துத் தட்ட வேண்டும்; நிலை 3 வேகமானது.
      ${S.sub ? '<br><small class="en">Tap when each note reaches the ring. Level 1 has one pad; level 2 asks you to tell தா from தக; level 3 is faster.</small>' : ''}</p>
  </div>
  <p class="center muted" style="font-size:.8rem">யாப்பு அலகீடு: செம்மொழித் தமிழாய்வு மத்திய நிறுவனம் · <a href="#/about">${esc(t('about'))}</a></p>`);
  $$('.levels .lv').forEach(b => b.addEventListener('click', () => { S.level = +b.dataset.level; saveS(); homeScreen(); }));
}

// ───────────────────────── map ─────────────────────────
function mapScreen() {
  setTop(t('map'), '133 அதிகாரம் · 1330 குறள்', true);
  const chStars = c => { let s = 0; for (let n = (c - 1) * 10 + 1; n <= c * 10; n++) s += starsOf(n); return s; };
  render(META.pals.map(p => `
    <section class="pal">
      <h2>${esc(p.name)} <small class="en">${esc(p.nameEn)}</small></h2>
      ${p.iyals.map(iy => `
        <h3>${esc(iy.name)} <small class="en">${esc(iy.nameEn)}</small></h3>
        <div class="ch-grid">
          ${iy.chapters.map(c => { const ch = META.chapters[c - 1]; const s = chStars(c); return `
            <a class="ch ${s >= 30 ? 'done' : ''}" href="#/ch/${c}">
              <span class="num">அதிகாரம் ${c}</span>
              <span class="name">${esc(ch.name)}</span>
              <span class="bar"><i style="width:${Math.round(s / 30 * 100)}%"></i></span>
              <span class="st">★ ${s} / 30</span>
            </a>`; }).join('')}
        </div>`).join('')}
    </section>`).join(''));
}

// ───────────────────────── chapter ─────────────────────────
async function chapterScreen(c) {
  if (!(c >= 1 && c <= 133)) return location.replace('#/map');
  const ch = META.chapters[c - 1];
  setTop(`${c}. ${ch.name}`, ch.en, true);
  const ks = await chapter(c);
  render(`
    <div class="row spread" style="margin-bottom:10px">
      <a class="btn" href="#/ch/${c - 1}" ${c === 1 ? 'style="visibility:hidden"' : ''}>‹ ${c - 1}</a>
      <span class="muted">குறள் ${ch.start}–${ch.end}</span>
      <a class="btn" href="#/ch/${c + 1}" ${c === 133 ? 'style="visibility:hidden"' : ''}>${c + 1} ›</a>
    </div>
    <div class="k-list">
      ${ks.map(k => k.ok
        ? `<a class="k-row" href="#/learn/${k.n}"><span class="n">${k.n}</span><span class="l">${esc(k.l1)}<br>${esc(k.l2)}</span><span class="stars">${starStr(starsOf(k.n))}</span></a>`
        : `<div class="k-row locked"><span class="n">${k.n}</span><span class="l">${esc(k.l1)}<br>${esc(k.l2)}<br><small class="en">🔒 ${esc(t('locked'))}</small></span></div>`).join('')}
    </div>`);
}

// ───────────────────────── learn ─────────────────────────
function seerChip(s) {
  return `<span class="seer"><span class="asais">${s.a.map(a => `<span class="asai ${a.k}">${esc(a.s)}</span>`).join('')}</span><span class="seer-name">${esc(s.name)}</span></span>`;
}
async function learnScreen(n) {
  if (!playable(n)) { toast(t('locked')); return location.replace('#/map'); }
  const k = await kural(n), ch = chapterOf(n);
  setTop(`குறள் ${n}`, `${ch.name} · அதிகாரம் ${ch.n}`, true);
  render(`
    <div class="k-head"><span class="knum">குறள் ${n} <span class="stars">${starStr(starsOf(n))}</span></span><span class="kch">${esc(ch.name)}</span></div>
    <div class="kural-big"><p>${esc(k.l1)}</p><p>${esc(k.l2)}</p></div>
    ${k.lines.map(line => `<div class="seer-line">${line.seers.map(seerChip).join('')}</div>`).join('')}
    <p class="legend"><span class="dot N"></span>நேர் = தா &nbsp; <span class="dot I"></span>நிரை = தக &nbsp; · ${k.lines[0].seers.length + k.lines[1].seers.length} சீர், ${k.lines.reduce((a, l) => a + l.seers.reduce((b, s) => b + s.a.length, 0), 0)} அசை${k.reseg ? ' · சீர் பிரிப்பு அலகீட்டின்படி' : ''}</p>
    <div class="actions">
      <button class="btn" id="b-listen">🔈 ${L('listen')}</button>
      <button class="btn" id="b-demo">👀 ${L('demo')}</button>
    </div>
    <a class="btn primary big block" href="#/play/${n}">▶ ${L('start')} <small>· ${esc(t('level'))} ${S.level}</small></a>
    <details class="card" style="margin-top:12px"><summary>${L('meaning')}</summary><p>${esc(k.mv)}</p>${S.sub ? `<p class="en">${esc(k.en)}</p>` : ''}</details>`);
  $('#b-listen').addEventListener('click', e => TTS.speak(k.l1 + ' ' + k.l2, e.currentTarget));
  $('#b-demo').addEventListener('click', () => { location.hash = `#/play/${n}?demo=1`; });
}

// ───────────────────────── play ─────────────────────────
async function playScreen(n, q) {
  if (!playable(n)) return location.replace('#/map');
  const k = await kural(n), ch = chapterOf(n);
  const demo = q.demo === '1';
  const auto = demo || q.auto === '1';          // ?auto=1: the game plays itself but still shows the result (for testing)
  const level = demo ? 2 : S.level;
  setTop(`குறள் ${n}`, `${ch.name} · ${demo ? 'காட்சி' : t('level') + ' ' + level}`, true);
  let idx = 0;
  const kar = k.lines.map(line => `<p>${line.seers.map(s => s.a.map(a => `<span class="a ${a.k}" data-i="${idx++}">${esc(a.s)}</span>`).join('')).join('<span class="sp"> </span>')}</p>`).join('');
  render(`
  <section id="play" class="play ${S.leftHand ? 'left' : ''}">
    <div class="kar" id="kar">${kar}</div>
    <div class="hud"><div class="seer-now" id="seer-now">&nbsp;</div><div class="combo" id="combo"></div><button class="icon-btn pause" id="b-pause" aria-label="${esc(t('paused'))}">❚❚</button></div>
    <div class="lane-wrap"><canvas id="lane"></canvas><div class="judge" id="judge"></div><div class="count" id="count"></div></div>
    <div class="progress"><div class="bar" id="bar"></div></div>
    <div class="pads ${level === 1 ? 'single' : ''}">
      ${level === 1
        ? `<button class="pad any" data-k="any"><b>தட்டு</b><small>tap</small></button>`
        : `<button class="pad ner" data-k="N"><b>தா</b><small>நேர்</small></button><button class="pad nirai" data-k="I"><b>தக</b><small>நிரை</small></button>`}
    </div>
    <div class="overlay" id="overlay" hidden></div>
  </section>`, true);
  const spans = $$('#kar .a'), judgeEl = $('#judge'), countEl = $('#count'), comboEl = $('#combo'), seerEl = $('#seer-now'), bar = $('#bar');
  const pads = $$('.pad');
  if (auto) pads.forEach(p => { p.disabled = true; });
  let judgeTimer = 0;
  const hud = {
    onCount(c) { countEl.innerHTML = c ? `${c}<small>தயார்…</small>` : ''; },
    onNote(note) { spans.forEach((s, i) => { s.classList.toggle('now', i === note.i); s.classList.toggle('done', i < note.i); }); },
    onSeer(seer) { seerEl.textContent = `${seer.w} · ${seer.name}`; },
    onJudge(j, note, dt) {
      judgeEl.className = 'judge';
      void judgeEl.offsetWidth;                       // restart the animation
      judgeEl.textContent = j === 'wrong' ? `${JUDGE.wrong} ${note.k === 'N' ? 'தா' : 'தக'}` : JUDGE[j];
      judgeEl.className = 'judge show ' + j;
      if (j === 'miss') spans[note.i].style.opacity = .3;
    },
    onCombo(c) { comboEl.innerHTML = c >= 3 ? `<b>${c}</b> ${esc(t('combo'))}` : ''; },
    onProgress(done, total) { bar.style.width = Math.round(done / total * 100) + '%'; },
    onSeerDone(seer) { seerEl.textContent = `${seer.name} ✓`; },
    onPad(kind) { const p = pads.find(x => x.dataset.k === kind) || pads[0]; if (!p) return; p.classList.add('hit'); setTimeout(() => p.classList.remove('hit'), 90); },
    onEnd(res) { game = null; if (demo) { toast('இப்போது நீ! · Now you try'); setTimeout(() => { location.hash = '#/learn/' + n; }, 900); } else showResult(n, k, res); },
  };
  const opts = { kural: k, level, bpm: bpmFor(level), guide: auto ? false : !!S.guide, offsetMs: S.offsetMs || 0, canvas: $('#lane'), auto, hud };
  const begin = () => { game = Game.start(opts); };
  requestAnimationFrame(begin);

  const ts = e => (typeof e.timeStamp === 'number' && Math.abs(e.timeStamp - performance.now()) < 5000) ? e.timeStamp : performance.now();
  pads.forEach(p => p.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (!game) return;
    SFX.unlock();
    game.tap(p.dataset.k === 'any' ? null : p.dataset.k, ts(e));
  }));
  const keys = e => {
    if (!game || e.repeat) return;
    const k = e.key;
    let kind = null;
    if (k === 'f' || k === 'F' || k === 'ArrowLeft') kind = 'N';
    else if (k === 'j' || k === 'J' || k === 'ArrowRight') kind = 'I';
    else if (k === ' ') kind = null;
    else if (k === 'Escape') { pause(); return; }
    else return;
    e.preventDefault();
    game.tap(level === 1 ? null : (kind || 'N'), ts(e));
  };
  window.addEventListener('keydown', keys);
  const cleanup = () => { window.removeEventListener('keydown', keys); document.removeEventListener('visibilitychange', onHide); window.removeEventListener('hashchange', cleanup); window.__appPause = null; };
  window.__appPause = () => pause();               // the Android wrapper calls this from onPause()
  const onHide = () => { if (document.hidden) pause(); };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('hashchange', cleanup);

  function pause() {
    if (!game || game.state() === 'done') return;
    game.pause();
    const ov = $('#overlay'); ov.hidden = false;
    ov.innerHTML = `<div class="panel"><h2>${L('paused')}</h2>
      <button class="btn primary" id="p-resume">▶ ${L('resume')}</button>
      <button class="btn" id="p-restart">↻ ${L('restart')}</button>
      <a class="btn" href="#/learn/${n}">✕ ${L('quit')}</a></div>`;
    $('#p-resume').addEventListener('click', () => { ov.hidden = true; game.resume(); });
    $('#p-restart').addEventListener('click', () => { ov.hidden = true; game.stop(); playScreen(n, q); });
  }
  $('#b-pause').addEventListener('click', pause);
}

function showResult(n, k, res) {
  const prevStars = starsOf(n), prevBest = P.best[n] || 0;
  const day = todayKey();
  if (!res.auto) {                               // a self-played round earns nothing
    if (P.lastDay !== day) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yesterday = `${y.getFullYear()}-${pad3(y.getMonth() + 1).slice(1)}-${pad3(y.getDate()).slice(1)}`;
      P.streak = P.lastDay === yesterday ? P.streak + 1 : 1;
      P.lastDay = day;
    }
    P.plays++; P.lastKural = n;
    if (res.stars > prevStars) P.stars[n] = res.stars;
    if (res.score > prevBest) P.best[n] = res.score;
    saveP();
  }
  if (res.stars >= 2) SFX.play('star', 0.7);
  const lesson = Object.entries(res.seerStats).map(([name, c]) => `<b>${esc(name)}</b> ×${c}`).join(' · ');
  const ov = $('#overlay'); ov.hidden = false;
  ov.innerHTML = `<div class="panel">
    <h2>${res.stars >= 3 ? 'அருமை!' : res.stars === 2 ? 'நன்று!' : res.stars === 1 ? 'பரவாயில்லை' : 'மீண்டும் முயல்வோம்'}</h2>
    <div class="stars big">${starStr(res.stars)}</div>
    <div class="score"><b>${res.score}</b> ${esc(t('score'))}${res.score > prevBest && prevBest ? ' · 🎉 புதிய சிறந்தது' : ''}${res.stars > prevStars && prevStars ? ' · ★ புதிய நட்சத்திரம்' : ''}</div>
    <div class="result-grid">
      <div class="p"><b>${res.perfect}</b><small>${esc(t('perfect'))}</small></div>
      <div><b>${res.good}</b><small>${esc(t('good'))}</small></div>
      <div class="m"><b>${res.miss}</b><small>${esc(t('miss'))}</small></div>
      <div class="m"><b>${res.wrong}</b><small>${esc(t('wrong'))}</small></div>
    </div>
    <p class="center muted"><small>${esc(t('combo'))} ${res.maxCombo} · ${Math.round(res.accuracy * 100)}% · ${esc(t('level'))} ${res.level} · ${res.bpm} bpm</small></p>
    <p class="kural-small">${esc(k.l1)}<br>${esc(k.l2)}</p>
    <p class="meaning">${esc(k.mv)}</p>
    <p class="seer-lesson">இந்தக் குறளின் சீர்கள்: ${lesson}</p>
    <button class="btn" id="r-listen">🔈 ${L('listen')}</button>
    <a class="btn primary" href="#/learn/${nextKural()}">${L('next')} ›</a>
    <a class="btn" href="#/play/${n}">↻ ${L('again')}</a>
    <a class="btn ghost" href="#/map">🗺 ${L('map')}</a>
  </div>`;
  $('#r-listen').addEventListener('click', e => TTS.speak(k.l1 + ' ' + k.l2, e.currentTarget));
}

// ───────────────────────── settings ─────────────────────────
function settingsScreen() {
  setTop(t('settings'), 'Settings', true);
  const seg = (key, opts) => `<span class="seg" data-key="${key}">${opts.map(([v, lbl]) => `<button data-v="${v}" class="${String(S[key]) === String(v) ? 'on' : ''}">${esc(lbl)}</button>`).join('')}</span>`;
  const sw = (key, lbl, sub) => `<div class="setting"><div class="lbl">${esc(lbl)}<small>${esc(sub)}</small></div><button class="switch" data-key="${key}" aria-pressed="${!!S[key]}" aria-label="${esc(lbl)}"></button></div>`;
  render(`
  <div class="card">
    <div class="setting"><div class="lbl">${esc(t('level'))}<small>1 ${esc(t('lv1'))} · 2 ${esc(t('lv2'))} · 3 ${esc(t('lv3'))}</small></div>${seg('level', [[1, '1'], [2, '2'], [3, '3']])}</div>
    <div class="setting"><div class="lbl">${esc(t('tempo'))}<small>${bpmFor(S.level)} bpm</small></div>${seg('tempo', [['slow', t('slow')], ['normal', t('normal')], ['fast', t('fast')]])}</div>
    ${sw('guide', t('guide'), 'The drums play on time so you can follow them')}
    ${sw('sound', t('sound'), 'Sound')}
    ${sw('haptics', t('haptics'), SFX.hasHaptic ? 'Vibrate on every tap' : 'Not available on this device')}
    ${sw('sub', t('sub'), 'Show English under the Tamil')}
    ${sw('leftHand', t('leftHand'), 'Swap the two pads')}
    ${sw('contrast', t('contrast'), 'Stronger colours')}
    ${sw('bigText', t('bigText'), 'Larger text everywhere')}
  </div>
  <div class="card">
    <div class="setting"><div class="lbl">${esc(t('calibrate'))}<small>${S.offsetMs ? `${S.offsetMs > 0 ? '+' : ''}${S.offsetMs} ms` : 'Tap along with eight ticks to measure your device’s delay'}</small></div><a class="btn" href="#/calibrate">🎯</a></div>
    <div class="setting"><div class="lbl">${esc(t('reset'))}<small>Erase stars and scores on this device</small></div><button class="btn danger" id="b-reset">🗑</button></div>
    <div class="setting"><div class="lbl">${esc(t('about'))}<small>Central Institute of Classical Tamil</small></div><a class="btn" href="#/about">ℹ</a></div>
  </div>`);
  $$('.seg button').forEach(b => b.addEventListener('click', () => { const key = b.parentElement.dataset.key; S[key] = key === 'level' ? +b.dataset.v : b.dataset.v; saveS(); settingsScreen(); }));
  $$('.switch').forEach(b => b.addEventListener('click', () => { S[b.dataset.key] = !S[b.dataset.key]; saveS(); applyBody(); settingsScreen(); }));
  $('#b-reset').addEventListener('click', () => {
    if (!confirm('நட்சத்திரங்களும் மதிப்பெண்களும் அழிக்கப்படும். தொடரவா? · Erase all progress?')) return;
    P.stars = {}; P.best = {}; P.plays = 0; P.streak = 0; P.lastDay = ''; P.lastKural = 0; saveP(); toast('அழிக்கப்பட்டது · Progress erased');
  });
}

// ───────────────────────── calibration ─────────────────────────
function calibrateScreen() {
  setTop(t('calibrate'), 'Sound timing', true);
  render(`
  <div class="card cal">
    <p>எட்டு ஒலிகள் கேட்கும். ஒவ்வொன்றிலும் வட்டத்தைத் தட்டு.<br><small class="en">Eight ticks will sound. Tap the circle on each one.</small></p>
    <button class="target" id="cal-target">தட்டு</button>
    <p class="result" id="cal-result">${S.offsetMs ? `இப்போது: <b>${S.offsetMs > 0 ? '+' : ''}${S.offsetMs} ms</b>` : '&nbsp;'}</p>
    <div class="actions"><button class="btn primary" id="cal-start">▶ தொடங்கு</button><button class="btn" id="cal-zero">0 ms</button></div>
  </div>`);
  const target = $('#cal-target'), out = $('#cal-result');
  let ticks = [], taps = [], timer = 0, running = false;
  const BEAT = 750;
  function stop() { running = false; clearTimeout(timer); }
  $('#cal-zero').addEventListener('click', () => { S.offsetMs = 0; saveS(); out.innerHTML = 'இப்போது: <b>0 ms</b>'; });
  $('#cal-start').addEventListener('click', () => {
    SFX.unlock(); stop(); ticks = []; taps = []; running = true; out.innerHTML = '…';
    let i = 0;
    const tick = () => {
      if (!running) return;
      SFX.play(i === 0 ? 'tick1' : 'tick', 0.8); ticks.push(performance.now());
      target.classList.add('beat'); setTimeout(() => target.classList.remove('beat'), 120);
      if (++i < 8) timer = setTimeout(tick, BEAT);
      else timer = setTimeout(done, BEAT);
    };
    const done = () => {
      running = false;
      const ds = [];
      for (const tp of taps) { let best = null; for (const tk of ticks) { const d = tp - tk; if (Math.abs(d) < 350 && (best == null || Math.abs(d) < Math.abs(best))) best = d; } if (best != null) ds.push(best); }
      if (ds.length < 4) { out.innerHTML = 'போதுமான தட்டுகள் இல்லை · Not enough taps'; return; }
      ds.sort((a, b) => a - b);
      const mid = ds.slice(1, -1);
      const mean = Math.round(mid.reduce((a, b) => a + b, 0) / mid.length);
      S.offsetMs = mean; saveS();
      out.innerHTML = `உங்கள் தாமதம்: <b>${mean > 0 ? '+' : ''}${mean} ms</b> · சேமிக்கப்பட்டது<br><small class="en">Saved. Taps will be judged ${Math.abs(mean)} ms ${mean > 0 ? 'later' : 'earlier'}.</small>`;
    };
    timer = setTimeout(tick, 600);
  });
  target.addEventListener('pointerdown', e => { e.preventDefault(); if (!running) return; taps.push(performance.now()); SFX.play('ta', 0.5); SFX.haptic(20); });
  window.addEventListener('hashchange', stop, { once: true });
}

// ───────────────────────── about ─────────────────────────
function aboutScreen() {
  setTop(t('about'), 'About', true);
  const c = META.counts;
  render(`
  <div class="card about">
    <h2>தாளக் குறள் · Thaala Kural</h2>
    <p>திருக்குறளின் ஒவ்வொரு குறள் வெண்பாவின் அசைகளே இந்த விளையாட்டின் தாளம். நேர் அசை ஒரு தட்டு (தா), நிரை அசை ஒரு தட்டு (தக). வெண்பாவின் ஓசையே மனப்பாடத்தின் கருவி; இது அதைத் தட்டக் கூடியதாக ஆக்குகிறது.</p>
    <p class="en">A rhythm game for children built from the metre of every Tirukkural couplet. The அசை chart of each kural comes from the CICT reference metrical scanner (Yappu-Metrical-Scanner, scan_verse_best) as serialised in the multilingual Kural app: ${c.playable} of ${c.kurals} kurals scan cleanly as குறள் வெண்பா (${c.notes.toLocaleString()} அசை: ${c.ner.toLocaleString()} நேர், ${c.nirai.toLocaleString()} நிரை). The four with known source corruptions (${META.unplayable.join(', ')}) are shown but not played.</p>
    <p class="en">Text: canonical Tirukkuṟaḷ with மு. வரதராசனார் urai. No accounts, no advertising, no data leaves the device; progress is kept in this browser's local storage only.</p>
    <p class="en">Central Institute of Classical Tamil (செம்மொழித் தமிழாய்வு மத்திய நிறுவனம்), Chennai · Digital Archives. Fonts: Noto Sans Tamil (OFL).</p>
    <p class="muted"><small>Data build ${esc(META.source.built)} · ${esc(META.source.version)}${IS_ANDROID_APP ? ' · Android' : ''}</small></p>
  </div>`);
}

// ───────────────────────── boot ─────────────────────────
function boot() {
  applyBody();
  TTS.init();
  $('#btn-back').addEventListener('click', () => {
    if (lastRoute.startsWith('/play/')) { const n = lastRoute.split('/')[2]; location.hash = '#/learn/' + n; return; }
    if (lastRoute.startsWith('/learn/')) { const n = +lastRoute.split('/')[2]; location.hash = '#/ch/' + Math.ceil(n / 10); return; }
    if (lastRoute.startsWith('/ch/')) { location.hash = '#/map'; return; }
    location.hash = '#/';
  });
  $('#btn-sound').addEventListener('click', () => { S.sound = !S.sound; saveS(); applyBody(); toast(S.sound ? 'ஒலி உண்டு' : 'ஒலி இல்லை'); });
  $('#btn-settings').addEventListener('click', () => { location.hash = '#/settings'; });
  const first = () => { SFX.unlock(); SFX.load(); window.removeEventListener('pointerdown', first); window.removeEventListener('keydown', first); };
  window.addEventListener('pointerdown', first); window.addEventListener('keydown', first);
  window.addEventListener('hashchange', route);
  route();
  if ('serviceWorker' in navigator && !IS_ANDROID_APP && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => { });
  }
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
