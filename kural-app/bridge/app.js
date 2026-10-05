/* குறள் பாலம் · Kural Bridge
   Read a Thirukkural couplet in your own language, then build it again in Tamil, word by word.
   No framework, no build step: data/ comes from build/build_data.py. */
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $('#app');
const STORE = 'kb.v1';
const APP_URL = 'https://cictdl.github.io/index.html/kural-app/#/k/';

/* ---------- interface texts. A stream shows the interface in its own language when there is a
   translation; otherwise in English. */
const UI = {
  en: {
    tagline: 'Read a Thirukkural couplet in your language. Build it again in Tamil, word by word.',
    read_in: 'Read the couplets in', level: 'Level',
    easy: 'Easy', easy_d: 'one line at a time', normal: 'Normal', normal_d: 'all words mixed',
    hard: 'Hard', hard_d: 'with extra words',
    daily: "Today's kural", daily_d: 'the same for everybody', journey: 'Chapter by chapter',
    journey_d: 'all 133 chapters', random: 'Any kural', random_d: 'one you have not built',
    built_of: '{n} of 1,330 kurals built', streak: '{n}-day streak',
    kural: 'Kural', chapter: 'Chapter', meaning_in: 'Meaning in {lang}',
    tap: 'Tap the Tamil words in the order of the couplet.',
    line1: 'Line 1', line2: 'Line 2', mistakes: 'mistakes', hints: 'hints',
    listen: 'Listen', hint: 'Hint', letters: 'In my script', skip: 'Skip',
    not_here: 'Not this word here. Try another.',
    built: 'Bridge built!', next: 'Next kural', again: 'Build it again',
    th_tamil: 'Tamil', th_script: 'In your script', th_meaning: 'Meaning (English)',
    read_app: 'Read it in the Thirukkural app', share: 'Share', copied: 'Copied',
    share_text: 'I built Kural {n} in Tamil from {lang} on Kural Bridge',
    chapters: 'Chapters', all_chapters: 'All chapters', home: 'Home', about: 'About', install: 'Install',
    loading: 'Loading…', offline: 'This kural is not on this device yet. Connect to the internet once.',
    about_title: 'About Kural Bridge',
    about_1: 'Kural Bridge helps a student of any Indian language take the first step into the Tamil original of the Thirukkural. You read a couplet in your own language; the Tamil words lie scattered; you lay them down in order, like the planks of a bridge.',
    about_2: 'Every Tamil word is also written in your own script, so that you can read it before you can read Tamil. The meaning of each word appears as you place it.',
    sources: 'Sources', src_text: 'Tamil text: the canonical text published by CICT.',
    src_tr: 'Translation shown now: {credit}.',
    src_gloss: 'Word meanings: the word-by-word grammar notes of CICT (AI-assisted, under review by Tamil scholars).',
    src_tl: 'Tamil words in other scripts: written letter by letter by the game.',
    free: 'Free, without advertisements or accounts. Your progress stays on this device.'
  },
  ta: {
    tagline: 'உங்கள் மொழியில் ஒரு குறளைப் படியுங்கள்; அதைத் தமிழில் சொல் சொல்லாக மீண்டும் கட்டுங்கள்.',
    read_in: 'குறள்களை இம்மொழியில் படிக்க', level: 'நிலை',
    easy: 'எளிது', easy_d: 'ஒரு நேரத்தில் ஓர் அடி', normal: 'இயல்பு', normal_d: 'எல்லாச் சொற்களும் கலந்து',
    hard: 'கடினம்', hard_d: 'கூடுதல் சொற்களுடன்',
    daily: 'இன்றைய குறள்', daily_d: 'எல்லாருக்கும் ஒன்றே', journey: 'அதிகாரம் அதிகாரமாக',
    journey_d: '133 அதிகாரங்களும்', random: 'ஏதேனும் ஒரு குறள்', random_d: 'இதுவரை கட்டாதது',
    built_of: '1,330 குறள்களில் {n} கட்டப்பட்டன', streak: 'தொடர்ந்து {n} நாள்',
    kural: 'குறள்', chapter: 'அதிகாரம்', meaning_in: '{lang} பொருள்',
    tap: 'குறளில் உள்ள வரிசைப்படி தமிழ்ச் சொற்களைத் தொடுங்கள்.',
    line1: 'முதல் அடி', line2: 'இரண்டாம் அடி', mistakes: 'தவறுகள்', hints: 'உதவிகள்',
    listen: 'கேளுங்கள்', hint: 'உதவி', letters: 'என் எழுத்தில்', skip: 'தவிர்',
    not_here: 'இங்கு இந்தச் சொல் அன்று. வேறொன்றை முயலுங்கள்.',
    built: 'பாலம் கட்டி முடிந்தது!', next: 'அடுத்த குறள்', again: 'மீண்டும் கட்டுக',
    th_tamil: 'தமிழ்', th_script: 'உங்கள் எழுத்தில்', th_meaning: 'பொருள் (ஆங்கிலம்)',
    read_app: 'திருக்குறள் செயலியில் படிக்க', share: 'பகிர்', copied: 'நகலெடுக்கப்பட்டது',
    share_text: 'குறள் பாலத்தில் {lang} வழியாகக் குறள் {n}-ஐத் தமிழில் கட்டினேன்',
    chapters: 'அதிகாரங்கள்', all_chapters: 'எல்லா அதிகாரங்களும்', home: 'முகப்பு', about: 'விவரம்', install: 'நிறுவு',
    loading: 'ஏற்றுகிறது…', offline: 'இக்குறள் இக்கருவியில் இன்னும் இல்லை. ஒருமுறை இணையத்தில் இணையுங்கள்.',
    about_title: 'குறள் பாலம் பற்றி',
    about_1: 'எந்த இந்திய மொழி பேசும் மாணவரும் திருக்குறளின் தமிழ் மூலத்துக்குள் முதலடி எடுத்துவைக்கக் குறள் பாலம் உதவுகிறது. உங்கள் மொழியில் குறளைப் படிக்கிறீர்கள்; தமிழ்ச் சொற்கள் சிதறிக் கிடக்கின்றன; பாலத்தின் பலகைகளைப் போல் அவற்றை வரிசையாக வைக்கிறீர்கள்.',
    about_2: 'ஒவ்வொரு தமிழ்ச் சொல்லும் உங்கள் எழுத்திலும் எழுதப்பட்டுள்ளது; தமிழ் படிக்கத் தெரிவதற்கு முன்பே அதைப் படிக்கலாம். ஒவ்வொரு சொல்லை வைக்கும்போதும் அதன் பொருள் தோன்றும்.',
    sources: 'மூலங்கள்', src_text: 'தமிழ் மூலம்: செம்மொழித் தமிழாய்வு மத்திய நிறுவனம் வெளியிட்ட பாடம்.',
    src_tr: 'இப்போது காட்டப்படும் மொழிபெயர்ப்பு: {credit}.',
    src_gloss: 'சொற்பொருள்: நிறுவனத்தின் சொல்வாரி இலக்கணக் குறிப்புகள் (செயற்கை நுண்ணறிவின் உதவியுடன்; தமிழறிஞர்களின் மீளாய்வில்).',
    src_tl: 'பிற எழுத்துகளில் தமிழ்ச் சொற்கள்: விளையாட்டே எழுத்துக்கு எழுத்தாக எழுதுகிறது.',
    free: 'கட்டணமில்லை, விளம்பரமில்லை, கணக்கு இல்லை. உங்கள் முன்னேற்றம் இக்கருவியிலேயே இருக்கும்.'
  },
  hi: {
    tagline: 'तिरुक्कुरल का एक दोहा अपनी भाषा में पढ़िए। फिर उसे तमिल में शब्द-दर-शब्द दोबारा बनाइए।',
    read_in: 'दोहे इस भाषा में पढ़ें', level: 'स्तर',
    easy: 'आसान', easy_d: 'एक बार में एक पंक्ति', normal: 'सामान्य', normal_d: 'सभी शब्द मिले हुए',
    hard: 'कठिन', hard_d: 'अतिरिक्त शब्दों के साथ',
    daily: 'आज का कुरल', daily_d: 'सबके लिए एक ही', journey: 'अध्याय-दर-अध्याय',
    journey_d: 'सभी 133 अध्याय', random: 'कोई भी कुरल', random_d: 'जो अभी तक नहीं बनाया',
    built_of: '1,330 में से {n} कुरल बनाए', streak: 'लगातार {n} दिन',
    kural: 'कुरल', chapter: 'अध्याय', meaning_in: '{lang} में अर्थ',
    tap: 'दोहे के क्रम में तमिल शब्दों को छुइए।',
    line1: 'पहली पंक्ति', line2: 'दूसरी पंक्ति', mistakes: 'गलतियाँ', hints: 'संकेत',
    listen: 'सुनिए', hint: 'संकेत', letters: 'मेरी लिपि में', skip: 'छोड़ें',
    not_here: 'यहाँ यह शब्द नहीं आता। कोई दूसरा आज़माइए।',
    built: 'पुल बन गया!', next: 'अगला कुरल', again: 'फिर से बनाइए',
    th_tamil: 'तमिल', th_script: 'आपकी लिपि में', th_meaning: 'अर्थ (अंग्रेज़ी)',
    read_app: 'तिरुक्कुरल ऐप में पढ़ें', share: 'साझा करें', copied: 'कॉपी हो गया',
    share_text: 'मैंने कुरल पुल पर हिंदी से कुरल {n} को तमिल में बनाया',
    chapters: 'अध्याय', all_chapters: 'सभी अध्याय', home: 'मुख पृष्ठ', about: 'परिचय', install: 'इंस्टॉल करें',
    loading: 'लोड हो रहा है…', offline: 'यह कुरल अभी इस उपकरण पर नहीं है। एक बार इंटरनेट से जुड़िए।',
    about_title: 'कुरल पुल के बारे में',
    about_1: 'कुरल पुल किसी भी भारतीय भाषा के विद्यार्थी को तिरुक्कुरल के तमिल मूल की ओर पहला कदम रखने में मदद करता है। आप दोहा अपनी भाषा में पढ़ते हैं; तमिल शब्द बिखरे पड़े हैं; आप उन्हें पुल के तख़्तों की तरह क्रम से रखते हैं।',
    about_2: 'हर तमिल शब्द आपकी अपनी लिपि में भी लिखा है, ताकि तमिल पढ़ना सीखने से पहले ही आप उसे पढ़ सकें। हर शब्द रखते ही उसका अर्थ दिखाई देता है।',
    sources: 'स्रोत', src_text: 'तमिल मूल पाठ: केंद्रीय शास्त्रीय तमिल संस्थान द्वारा प्रकाशित पाठ।',
    src_tr: 'अभी दिखाया जा रहा अनुवाद: {credit}।',
    src_gloss: 'शब्दार्थ: संस्थान की शब्द-दर-शब्द व्याकरण टिप्पणियाँ (एआई की सहायता से; तमिल विद्वानों द्वारा समीक्षाधीन)।',
    src_tl: 'अन्य लिपियों में तमिल शब्द: खेल स्वयं अक्षर-दर-अक्षर लिखता है।',
    free: 'निःशुल्क, बिना विज्ञापन और बिना खाते के। आपकी प्रगति इसी उपकरण पर रहती है।'
  }
};
// the language of the interface for each stream: Tamil for the Tamil commentary, else the stream's
// own (ui/<code>.json, loaded when the stream is chosen; English while it loads or if it is missing)
const UI_OF = { tac: 'ta' };
const RTL_UI = new Set(['ur', 'ksn']);
async function loadUi(code) {
  const c = UI_OF[code] || code;
  if (!c || UI[c]) return;
  try { UI[c] = await json(`ui/${c}.json`); } catch (e) { UI[c] = UI.en; }
}

/* ---------- state kept on this device */
function load() {
  try { return Object.assign({ lang: '', level: 'easy', letters: true, solved: {}, days: [] }, JSON.parse(localStorage.getItem(STORE) || '{}')); }
  catch (e) { return { lang: '', level: 'easy', letters: true, solved: {}, days: [] }; }
}
let S = load();
function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { /* private window: progress lasts the visit */ } }

let META = null, SCRIPTS = null;
const CH = {}, TR = {};
async function json(url) { const r = await fetch(url); if (!r.ok) throw new Error(url); return r.json(); }
async function chapter(n) { return CH[n] || (CH[n] = await json(`data/ch/${String(n).padStart(3, '0')}.json`)); }
async function translation(code) { return TR[code] || (TR[code] = await json(`data/tr/${code}.json`)); }
async function kural(n) { return (await chapter(Math.ceil(n / 10))).kurals.find(k => k.n === n); }

function stream() { return META.streams.find(s => s.code === S.lang) || null; }
function uiLang() { const c = UI_OF[S.lang] || S.lang; return c && UI[c] ? c : 'en'; }
function t(key, vars) {
  let s = (UI[uiLang()] || UI.en)[key] ?? UI.en[key] ?? key;
  for (const [k, v] of Object.entries(vars || {})) s = s.replace(`{${k}}`, v);
  return s;
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ---------- Tamil words in the player's script */
const SCRIPT_TABLE = { Devanagari: 'Devanagari', Bengali: 'Bengali', Gurmukhi: 'Gurmukhi', Gujarati: 'Gujarati',
  Odia: 'Oriya', Telugu: 'Telugu', Kannada: 'Kannada', Malayalam: 'Malayalam' };
const LAT_C = { 'க': 'k', 'ங': 'ṅ', 'ச': 'c', 'ஞ': 'ñ', 'ட': 'ṭ', 'ண': 'ṇ', 'த': 't', 'ந': 'n', 'ப': 'p', 'ம': 'm',
  'ய': 'y', 'ர': 'r', 'ல': 'l', 'வ': 'v', 'ழ': 'ḻ', 'ள': 'ḷ', 'ற': 'ṟ', 'ன': 'ṉ', 'ஜ': 'j', 'ஷ': 'ṣ', 'ஸ': 's',
  'ஹ': 'h', 'ஶ': 'ś' };
const LAT_V = { 'அ': 'a', 'ஆ': 'ā', 'இ': 'i', 'ஈ': 'ī', 'உ': 'u', 'ஊ': 'ū', 'எ': 'e', 'ஏ': 'ē', 'ஐ': 'ai', 'ஒ': 'o',
  'ஓ': 'ō', 'ஔ': 'au', 'ஃ': 'ḵ' };
const LAT_S = { 'ா': 'ā', 'ி': 'i', 'ீ': 'ī', 'ு': 'u', 'ூ': 'ū', 'ெ': 'e', 'ே': 'ē', 'ை': 'ai', 'ொ': 'o', 'ோ': 'ō',
  'ௌ': 'au', '்': '' };
function toLatin(word) {
  const cs = [...word]; let out = '';
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i], nx = cs[i + 1];
    if (LAT_C[c]) { out += LAT_C[c]; if (nx in LAT_S) { out += LAT_S[nx]; i++; } else out += 'a'; }
    else if (LAT_V[c]) out += LAT_V[c];
    else if (!(c in LAT_S)) out += c;
  }
  return out;
}
function inScript(word, latin) {
  const s = stream();
  if (!s || s.script === 'Tamil') return '';
  const table = SCRIPTS[SCRIPT_TABLE[s.script]];
  if (table) return [...word].map(c => (c in table ? table[c] : c)).join('');
  return latin || toLatin(word);
}

/* ---------- days, streak, the kural of the day */
const DAY0 = Date.UTC(2026, 0, 1);
function today() { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - DAY0) / 864e5); }
function dailyKural(day = today()) { return ((day * 37) % 1330 + 1330) % 1330 + 1; }
function streak() {
  const days = new Set(S.days); let n = 0, d = today();
  if (!days.has(d)) d -= 1;
  while (days.has(d)) { n++; d--; }
  return n;
}
function stars() { return Object.values(S.solved).reduce((a, b) => a + b, 0); }
function builtCount() { return Object.keys(S.solved).length; }
function nextUnsolved(from = 1) {
  for (let i = 0; i < 1330; i++) { const n = ((from - 1 + i) % 1330) + 1; if (!S.solved[n]) return n; }
  return from;
}
function paintScore() {
  const st = streak();
  $('#score').textContent = `★ ${stars()}` + (st ? `  🔥 ${st}` : '');
  $('#score').title = t('built_of', { n: builtCount().toLocaleString('en-IN') });
}

/* ---------- small helpers */
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.hidden = false;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => { el.hidden = true; }, 1800);
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
let VOICE = null;
function findVoice() {
  if (!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices();
  return vs.find(v => /^ta(-|_|$)/i.test(v.lang)) || null;
}
function speak(text) {
  if (!VOICE) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.voice = VOICE; u.lang = VOICE.lang; u.rate = 0.8;
  speechSynthesis.speak(u);
}

/* ---------- home */
function bridgeArt(left) {
  return `<svg viewBox="0 0 420 150" role="img" aria-label="">
    <rect x="0" y="108" width="420" height="42" rx="6" fill="var(--river)" opacity=".25"/>
    <path d="M0 150 V92 Q40 84 74 96 V150 Z" fill="var(--stone-edge)"/>
    <path d="M420 150 V92 Q380 84 346 96 V150 Z" fill="var(--stone-edge)"/>
    <path d="M74 96 Q210 18 346 96" fill="none" stroke="var(--river-2)" stroke-width="7" stroke-linecap="round"/>
    ${[0, 1, 2, 3, 4, 5, 6].map(i => { const x = 98 + i * 34; return `<rect x="${x}" y="84" width="28" height="12" rx="3" fill="var(--gold)" opacity="${0.55 + i * 0.06}"/>`; }).join('')}
    <line x1="74" y1="96" x2="346" y2="96" stroke="var(--river-2)" stroke-width="3"/>
    <text x="37" y="80" text-anchor="middle" font-size="15" fill="var(--ink)">${esc(left)}</text>
    <text x="383" y="80" text-anchor="middle" font-size="16" fill="var(--ink)" font-family="Noto Sans Tamil, Nirmala UI, sans-serif">தமிழ்</text>
  </svg>`;
}
function renderHome() {
  const s = stream();
  const langs = META.streams.map(x => `<button class="lang ${x.code === S.lang ? 'on' : ''}" data-lang="${x.code}" dir="${x.dir}">
      <b lang="${x.code === 'tac' ? 'ta' : x.code}">${esc(x.native)}</b><span>${esc(x.name)}</span></button>`).join('');
  const levels = ['easy', 'normal', 'hard'].map(l => `<button class="level ${S.level === l ? 'on' : ''}" data-level="${l}">
      <b>${esc(t(l))}</b><span>${esc(t(l + '_d'))}</span></button>`).join('');
  const st = streak();
  app.innerHTML = `
    <section class="hero">${bridgeArt(s ? s.native : '…')}
      <h1><span lang="ta">குறள் பாலம்</span> · Kural Bridge</h1><p>${esc(t('tagline'))}</p></section>
    <section class="card"><h2>1 · ${esc(t('read_in'))}</h2><div class="langs">${langs}</div></section>
    <section class="card"><h2>2 · ${esc(t('level'))}</h2><div class="levels">${levels}</div></section>
    <nav class="modes" aria-label="">
      <a class="mode" href="#/play/daily"><span class="ic">📅</span><div><b>${esc(t('daily'))}</b><span>${esc(t('daily_d'))}</span></div></a>
      <a class="mode" href="#/chapters"><span class="ic">📚</span><div><b>${esc(t('journey'))}</b><span>${esc(t('journey_d'))}</span></div></a>
      <a class="mode" href="#/play/random"><span class="ic">🎲</span><div><b>${esc(t('random'))}</b><span>${esc(t('random_d'))}</span></div></a>
    </nav>
    <p class="muted small" style="text-align:center;margin-top:14px">${esc(t('built_of', { n: builtCount().toLocaleString('en-IN') }))}
      · ★ ${stars()}${st ? ' · 🔥 ' + esc(t('streak', { n: st })) : ''}</p>`;
  $$('.lang', app).forEach(b => b.onclick = async () => { S.lang = b.dataset.lang; save(); await loadUi(S.lang); applyUi(); renderHome(); });
  $$('.level', app).forEach(b => b.onclick = () => { S.level = b.dataset.level; save(); renderHome(); });
  $$('.mode', app).forEach(a => a.addEventListener('click', e => {
    if (!S.lang) { e.preventDefault(); toast(t('read_in') + '…'); $('.langs').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }));
}

/* ---------- chapters */
function renderChapters() {
  const byPal = META.pals.map(p => {
    const chs = META.chapters.filter(c => c.pal === p.num).map(c => {
      let done = 0, st = 0;
      for (let n = c.start; n <= c.end; n++) if (S.solved[n]) { done++; st += S.solved[n]; }
      const first = (() => { for (let n = c.start; n <= c.end; n++) if (!S.solved[n]) return n; return c.start; })();
      return `<a class="chap ${done === 10 ? 'full' : ''}" href="#/play/k/${first}">
        <span class="no">${c.n}</span><span class="grow"><span class="nm" lang="ta">${esc(c.ta)}</span><br><span class="en">${esc(c.en)}</span></span>
        <span class="pg">${done}/10${st ? ' · ★' + st : ''}</span></a>`;
    }).join('');
    return `<h2 class="pal"><span lang="ta">${esc(p.name)}</span> · ${esc(p.nameEn)}</h2><div class="chapters">${chs}</div>`;
  }).join('');
  app.innerHTML = `<div class="row"><h1 class="grow">${esc(t('chapters'))}</h1>
    <a class="btn" href="#/play/k/${nextUnsolved(1)}">▶ ${esc(t('journey'))}</a></div>${byPal}`;
}

/* ---------- play */
let P = null;   // the kural being built
async function startPlay(mode, n) {
  if (!S.lang) { location.hash = '#/'; return; }
  if (mode === 'daily') n = dailyKural();
  else if (mode === 'random') { n = 1 + Math.floor(Math.random() * 1330); n = nextUnsolved(n); }
  n = Math.min(1330, Math.max(1, n || 1));
  app.innerHTML = `<p class="muted">${esc(t('loading'))}</p>`;
  let k, tr;
  try { [k, tr] = await Promise.all([kural(n), translation(S.lang)]); }
  catch (e) { app.innerHTML = `<div class="card">${esc(t('offline'))}</div>`; return; }
  const words = k.w.map(([w, line, latin, gloss], i) => ({ i, w, line, latin, gloss }));
  let decoys = [];
  if (S.level === 'hard') {
    const ch = await chapter(Math.ceil(n / 10));
    const own = new Set(words.map(x => x.w));
    const pool = [...new Set(ch.kurals.filter(o => o.n !== n).flatMap(o => o.w.map(x => x[0])))].filter(w => !own.has(w));
    decoys = shuffle(pool).slice(0, 3).map((w, j) => {
      const src = ch.kurals.flatMap(o => o.w).find(x => x[0] === w);
      return { i: 100 + j, w, line: 0, latin: src ? src[2] : '', gloss: '', decoy: true };
    });
  }
  P = { n, mode, words, tiles: shuffle([...words, ...decoys]).map(x => ({ ...x, used: false })), filled: 0,
        mistakes: 0, hints: 0, helped: new Set(), clue: tr[n] || [], last: null };
  // the shuffled tray must not already stand in the order of the couplet
  if (P.tiles.every((x, j) => x.i === j)) P.tiles.reverse();
  renderPlay();
}
function chapterOf(n) { return META.chapters[Math.ceil(n / 10) - 1]; }
function renderPlay() {
  const s = stream(), c = chapterOf(P.n), lines = [1, 2];
  const nextLine = P.filled < P.words.length ? P.words[P.filled].line : 0;
  const plank = x => {
    const done = x.i < P.filled;
    return `<div class="plank ${done ? 'done' : ''} ${x.i === P.filled ? 'next' : ''} ${P.helped.has(x.i) ? 'helped' : ''}">
      ${done ? `<span class="w" lang="ta">${esc(x.w)}</span>${S.letters && s.script !== 'Tamil' ? `<span class="tl">${esc(inScript(x.w, x.latin))}</span>` : ''}` : '<span class="tl">&nbsp;</span>'}</div>`;
  };
  const tiles = P.tiles.filter(x => !x.used && (S.level !== 'easy' || x.line === nextLine)).map(x => `
    <button class="tile" data-i="${x.i}"><span class="w" lang="ta">${esc(x.w)}</span>${S.letters && s.script !== 'Tamil' ? `<span class="tl">${esc(inScript(x.w, x.latin))}</span>` : ''}</button>`).join('');
  const last = P.last ? `<b lang="ta">${esc(P.last.w)}</b>${s.script !== 'Tamil' ? ' · ' + esc(inScript(P.last.w, P.last.latin)) : ''}${P.last.gloss ? ' — ' + esc(P.last.gloss) : ''}` : esc(t('tap'));
  app.innerHTML = `
    <div class="playhead">
      <div class="where"><b>${esc(t('kural'))} ${P.n}</b><br><span lang="ta">${esc(c.ta)}</span> · ${esc(c.en)}</div>
      <div class="counters"><span class="counter">✗ ${P.mistakes} ${esc(t('mistakes'))}</span><span class="counter">💡 ${P.hints} ${esc(t('hints'))}</span></div>
    </div>
    <section class="card clue"><div class="lbl">${esc(t('meaning_in', { lang: s.native }))}</div>
      <div class="tx" dir="${s.dir}" lang="${s.code === 'tac' ? 'ta' : s.code}">${P.clue.map(l => `<span>${esc(l)}</span>`).join('')}</div></section>
    <section class="bridge" dir="ltr" aria-label="">${lines.map(l => `<div class="span">${P.words.filter(x => x.line === l).map(plank).join('')}</div>`).join('')}</section>
    <p class="gloss">${last}</p>
    <section class="tray" dir="ltr" aria-label="">${tiles}</section>
    <div class="tools">
      ${VOICE ? `<button class="tool" id="t-listen">🔊 ${esc(t('listen'))}</button>` : ''}
      <button class="tool" id="t-hint">💡 ${esc(t('hint'))}</button>
      ${s.script !== 'Tamil' ? `<button class="tool ${S.letters ? 'on' : ''}" id="t-letters">अ↔அ ${esc(t('letters'))}</button>` : ''}
      <button class="tool" id="t-skip">⏭ ${esc(t('skip'))}</button>
    </div>`;
  $$('.tile', app).forEach(b => b.onclick = () => place(+b.dataset.i, b));
  const L = $('#t-listen'); if (L) L.onclick = () => speak(P.words.slice(0, P.filled).map(x => x.w).join(' ') || P.words.map(x => x.w).join(' '));
  $('#t-hint').onclick = () => {
    const want = P.words[P.filled]; const tile = P.tiles.find(x => !x.used && x.w === want.w);
    P.hints++; P.helped.add(P.filled); if (tile) place(tile.i, null, true);
  };
  const T = $('#t-letters'); if (T) T.onclick = () => { S.letters = !S.letters; save(); renderPlay(); };
  $('#t-skip').onclick = () => next();
}
function place(i, el, hinted) {
  const tile = P.tiles.find(x => x.i === i && !x.used);
  const want = P.words[P.filled];
  if (!tile || !want) return;
  if (tile.w !== want.w) {
    P.mistakes++;
    if (el) { el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong'); }
    toast(t('not_here'));
    $('.counter').textContent = `✗ ${P.mistakes} ${t('mistakes')}`;
    return;
  }
  tile.used = true; P.filled++; P.last = want;
  if (P.filled === P.words.length) return finish();
  renderPlay();
  const nextTile = $('.tile', app); if (nextTile && !hinted) nextTile.focus({ preventScroll: true });
}
function finish() {
  const score = P.mistakes === 0 && P.hints === 0 ? 3 : (P.mistakes <= 2 && P.hints <= 1 ? 2 : 1);
  S.solved[P.n] = Math.max(S.solved[P.n] || 0, score);
  const d = today(); if (!S.days.includes(d)) S.days = [...S.days.slice(-400), d];
  save(); paintScore();
  const s = stream(), k = P.words, lineOf = l => k.filter(x => x.line === l);
  const tl = l => lineOf(l).map(x => inScript(x.w, x.latin)).join(' ');
  const rows = k.map(x => `<tr><td class="ta" lang="ta">${esc(x.w)}</td>${s.script !== 'Tamil' ? `<td>${esc(inScript(x.w, x.latin))}</td>` : ''}<td>${esc(x.gloss || '—')}</td></tr>`).join('');
  const shareText = t('share_text', { n: P.n, lang: s.native }) + ' ' + '★'.repeat(score);
  app.innerHTML = `
    <section class="card done-card">
      <div class="stars" aria-label="${score}/3">${'★'.repeat(score)}<span class="off">${'★'.repeat(3 - score)}</span></div>
      <h1>${esc(t('built'))}</h1>
      <p class="muted">${esc(t('kural'))} ${P.n} · <span lang="ta">${esc(chapterOf(P.n).ta)}</span> · ✗ ${P.mistakes} · 💡 ${P.hints}</p>
      <div class="couplet" lang="ta" dir="ltr"><span>${esc(lineOf(1).map(x => x.w).join(' '))}</span><span>${esc(lineOf(2).map(x => x.w).join(' '))}</span></div>
      ${s.script !== 'Tamil' ? `<div class="couplet-tl" dir="ltr"><div>${esc(tl(1))}</div><div>${esc(tl(2))}</div></div>` : ''}
      <div class="row" style="justify-content:center;margin-top:14px">
        <button class="btn gold" id="d-next">▶ ${esc(t('next'))}</button>
        ${VOICE ? `<button class="btn ghost" id="d-listen">🔊 ${esc(t('listen'))}</button>` : ''}
        <button class="btn ghost" id="d-share">↗ ${esc(t('share'))}</button>
      </div>
    </section>
    <section class="card clue"><div class="lbl">${esc(t('meaning_in', { lang: s.native }))}</div>
      <div class="tx" dir="${s.dir}" lang="${s.code === 'tac' ? 'ta' : s.code}">${P.clue.map(l => `<span>${esc(l)}</span>`).join('')}</div></section>
    <section class="card"><table class="words"><thead><tr><th>${esc(t('th_tamil'))}</th>${s.script !== 'Tamil' ? `<th>${esc(t('th_script'))}</th>` : ''}<th>${esc(t('th_meaning'))}</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p class="small" style="margin-top:12px"><a href="${APP_URL}${P.n}" target="_blank" rel="noopener">📖 ${esc(t('read_app'))} ↗</a>
        · <a href="#/play/k/${P.n}">↺ ${esc(t('again'))}</a></p></section>`;
  $('#d-next').onclick = () => next();
  const L = $('#d-listen'); if (L) L.onclick = () => speak(k.map(x => x.w).join(' '));
  $('#d-share').onclick = async () => {
    const url = location.href.split('#')[0];
    try { if (navigator.share) { await navigator.share({ title: 'Kural Bridge', text: shareText, url }); return; } } catch (e) { return; }
    try { await navigator.clipboard.writeText(`${shareText} ${url}`); toast(t('copied')); } catch (e) { /* nothing to do */ }
  };
  if (VOICE) setTimeout(() => speak(k.map(x => x.w).join(' ')), 400);
  $('#d-next').focus({ preventScroll: true });
}
function next() {
  if (P.mode === 'daily' || P.mode === 'random') location.hash = '#/play/random';
  else location.hash = `#/play/k/${nextUnsolved(P.n % 1330 + 1)}`;
  if (location.hash === '#/play/random') route();
}

/* ---------- about */
function renderAbout() {
  const s = stream();
  app.innerHTML = `<section class="card about"><h1>${esc(t('about_title'))}</h1>
    <p>${esc(t('about_1'))}</p><p>${esc(t('about_2'))}</p>
    <h2>${esc(t('sources'))}</h2><ul>
      <li>${esc(t('src_text'))}</li>${s ? `<li>${esc(t('src_tr', { credit: s.credit }))}</li>` : ''}
      <li>${esc(t('src_gloss'))}</li><li>${esc(t('src_tl'))}</li></ul>
    <p class="muted">${esc(t('free'))}</p>
    <p><a class="btn" href="#/">${esc(t('home'))}</a></p></section>`;
}

/* ---------- routing */
async function route() {
  window.scrollTo(0, 0);
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  const parts = (location.hash || '#/').slice(2).split('/');
  if (parts[0] === 'play') {
    if (parts[1] === 'k') return startPlay('k', +parts[2]);
    return startPlay(parts[1] || 'random');
  }
  if (parts[0] === 'chapters') return renderChapters();
  if (parts[0] === 'about') return renderAbout();
  return renderHome();
}
function applyUi() {
  document.documentElement.lang = uiLang();
  document.documentElement.dir = RTL_UI.has(uiLang()) ? 'rtl' : 'ltr';
  $$('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  paintScore();
}

/* ---------- start */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; $('#btn-install').hidden = false; });
$('#btn-install').onclick = async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; $('#btn-install').hidden = true; };

(async function start() {
  try { [META, SCRIPTS] = await Promise.all([json('data/meta.json'), json('data/scripts.json')]); }
  catch (e) { app.innerHTML = '<div class="card">Kural Bridge could not load its data. Please check the connection and reload.</div>'; return; }
  if (S.lang && !stream()) S.lang = '';
  await loadUi(S.lang);
  VOICE = findVoice();
  if ('speechSynthesis' in window && !VOICE) speechSynthesis.onvoiceschanged = () => { VOICE = findVoice(); };
  applyUi();
  window.addEventListener('hashchange', route);
  route();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
