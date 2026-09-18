/* திருக்குறள் · 22 மொழிகள் — offline-first PWA (no build step, no dependencies)
   Central Institute of Classical Tamil · data in ./data (see build/build_data.py) */
'use strict';

// ───────────────────────────── utilities ─────────────────────────────
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n, w) => String(n).padStart(w, '0');
const chOf = n => Math.ceil(n / 10);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ZW = /[​-‍﻿]/g;
// Fold diacritics on LATIN runs only — Indic combining marks (Tamil புள்ளி U+0BCD,
// Devanagari virama, every vowel sign) are meaning-bearing and must survive.
const LATIN_RUN = /[A-Za-zÀ-ɏḀ-ỿ̀-ͯ]+/g;
const foldLatin = s => s.replace(LATIN_RUN, m => m.normalize('NFD').replace(/[̀-ͯ]/g, ''));
const norm = s => foldLatin(String(s ?? '').normalize('NFC').replace(ZW, '')).toLowerCase();
const stripPunct = s => norm(s).replace(/[.,;:!?'"“”‘’()\[\]{}।॥|\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
const RT_CACHE = 'kural-rt-v1';

let toastTimer;
function toast(msg, ms = 2200) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

// ───────────────────────────── i18n (interface) ─────────────────────────────
const STR = {
  ta: {
    lnTitle: 'பாடம்', lnName: 'வழிகாட்டும் பாடம்', lnTag: 'நாளுக்கு 10 நிமிடம்', lnIntro: 'கேட்டு, பொருள் அறிந்து, சொல்லி, அமைத்துப் பார்க்கலாம்', lnStartShort: 'தொடங்கலாம்', lnBegin: 'தொடங்கலாம்',
    lnFrGoal: 'எதற்காகப் படிக்கிறீர்கள்?', lnGoalM: 'மனப்பாடமும் பொருளும்', lnGoalC: 'போட்டிக்குத் தயாராக', lnGoalU: 'பொருள் புரிந்தால் போதும்', lnFrMl: 'பொருள் எந்த மொழியில் வேண்டும்?', lnFrTa: 'தமிழ் எழுத்துகளைப் படிக்க முடியுமா?', lnTaYes: 'முடியும்', lnTaNo: 'இன்னும் பழகுகிறேன்',
    lnFrLater: 'மேலுள்ள மூன்று விடைகளையும் பின்னர் "என் வழி" பகுதியில் மாற்றலாம்.', lnMlTa: 'தமிழ் · மு.வ. உரை', lnLabTa: 'மு. வரதராசனார் உரை', lnLabEnProse: 'English prose meaning', lnLabTac: 'தமிழ் உரை · CICT',
    lnToday: 'இன்றைய பாடம்', lnTodayStart: 'பாடத்தைத் தொடங்கலாம்', lnResume: 'தொடரலாம்', lnDoneToday: '✓ இன்றைய பாடம் நிறைவு', lnAnother: 'இன்னொரு பாடம் படிக்கலாம்', lnBuilding: 'இன்றைய பாடம் தயாராகிறது…',
    lnRevShort: 'மீள்பார்வைப் பாடம்', lnCapShort: 'இன்றைக்கு இது போதும்; புதிய குறள்கள் நாளை', lnRevNow: 'இப்போது மீள்பார்வை செய்யலாம்', lnNothing: 'இப்போது மீள்பார்வைக்கு எதுவும் இல்லை.',
    lnStepOf: 'படி {i}/{n}', lnChShort: 'அதி.', lnNext: 'தொடரலாம்', lnEnough: 'இன்றைக்கு இது போதும்', lnSkipStep: 'இந்தப் படியைக் கடந்து செல்லலாம்', lnMore: 'மேலும்', lnLess: 'சுருக்கலாம்',
    lnRecapTitle: 'மீண்டும் வருக!', lnRecapSub: 'கடந்த முறை படித்த குறள்கள் இவை. விட்ட இடத்திலிருந்து தொடரலாம்.', lnRevHead: 'மீள்பார்வை · முன்பு படித்த குறள்',
    lnLearnHead: 'குறளும் பொருளும்', lnLearnHint: 'முதலில் குறளை ஒருமுறை படியுங்கள் அல்லது கேளுங்கள்.', lnShowMeaning: 'பொருளைப் பார்க்கலாம்', lnHear: 'கேட்கலாம்', lnNoAudio: 'ஒலி வராவிட்டால் வரிகளை உரக்கப் படிக்கலாம்.',
    lnMoreUrai: 'விரிவான உரை', lnWordsOpen: 'சொற்களைப் பார்க்கலாம்', lnSplitNote: 'பிரித்த வடிவம் பொருள் புரிய மட்டுமே; சொல்லும்போது அச்சிட்ட வடிவத்தையே சொல்லுங்கள்.', lnGlossEn: 'சொற்பொருள் ஆங்கிலத்தில் மட்டும் · word meanings in English only', lnWordsNone: 'சொற்பொருள் இப்போது கிடைக்கவில்லை.', lnWordsWhole: 'இக்குறளில் பிரித்துக் காட்ட வேண்டிய சொற்கள் இல்லை.',
    lnKnowIt: 'இந்தக் குறள் எனக்குத் தெரியும் (பயிற்சிகளைத் தவிர்த்து, பின்னர் அமைத்துப் பார்க்கலாம்)',
    lnSayHead: 'சொல்லிப் பாருங்கள்', lnSay1: 'கேட்டு, உடன் சேர்ந்து சொல்லுங்கள்', lnSay2: 'இரண்டாம் அடியை மறைத்துச் சொல்லுங்கள்', lnSay3: 'பார்க்காமல் சொல்லுங்கள்', lnSaidIt: 'சொன்னேன்', lnHide: 'மறைக்கலாம்', lnShowLine: 'காட்டுங்கள்', lnWithBeat: 'தாளத்துடன் கேட்கலாம்', lnVoiceCheck: 'குரல்வழிச் சரிபார்க்கலாம்',
    lnMeanQ: 'இந்தக் குறளின் பொருள் யாது?', lnWhichKural: 'இந்தப் பொருளுக்குரிய குறள் எது?', lnRight: '✓ சரி!', lnWrongMeaning: '✗ சரியான பொருள் மேலே ✓ குறியிடப்பட்டுள்ளது.', lnWrongKural: '✗ சரியான குறள் மேலே ✓ குறியிடப்பட்டுள்ளது.', lnWrongWord: '✗ சரியான விடை: {w}',
    lnFillSeer: 'விடுபட்ட சீர்களை வரிசையாகத் தேர்ந்தெடுங்கள்', lnFillWord: 'விடுபட்ட சொற்களை வரிசையாகத் தேர்ந்தெடுங்கள்',
    lnBuildHead: 'குறளை அமைத்துப் பாருங்கள்', lnBuildSeer: 'சீர்களைச் சரியான வரிசையில் தொடுங்கள்', lnBuildWord: 'சொற்களைச் சரியான வரிசையில் தொடுங்கள்', lnTileNo: 'இது அல்ல — இன்னொரு முறை முயலலாம்.', lnTileHelp: 'உதவி', lnTileHelped: 'உதவியுடன் அமைத்தீர்கள்; நாளை மீண்டும் முயலலாம்.', lnPrevOk: '{x} {i}: ✓ சரி', lnPrevMiss: '{x} {i}: சரியான விடை — {w}', lnTileHelpedMsg: 'உதவி: சரியான {x} "{w}" வைக்கப்பட்டது.', lnTileCount: '{a}/{b}', lnBuilt: '✓ குறள் அமைந்தது',
    lnStartsWith: '"{w}…" எனத் தொடங்கும் குறள் {n}', lnIntroduced: 'குறள் {n} அறிமுகம் ✓ — நாளை மீள்பார்வையில் வரும்.', lnIntroducedU: 'குறள் {n} அறிமுகம் ✓', lnNoted: '✓ குறித்துக்கொண்டோம்',
    lnRecallHead: 'மனத்திலிருந்து சொல்லுங்கள்', lnRecallHint: 'குறளை உரக்கச் சொல்லுங்கள்; பிறகு சரிபார்க்கலாம்.', lnShowKural: 'குறளைக் காட்டுங்கள்', lnRecallYes: '✓ சொல்ல முடிந்தது', lnRecallMore: 'இன்னும் பழகலாம்',
    lnChainHead: 'முதலிலிருந்து வரிசையாக', lnChainHint: 'இந்த அதிகாரத்தில் படித்த குறள்களை முதலிலிருந்து வரிசையாக உரக்கச் சொல்லுங்கள். நேரம் இருந்தால் குறிப்பேட்டில் எழுதியும் பார்க்கலாம்.', lnChainShow: 'குறள்களைக் காட்டுங்கள்', lnChainShown: 'குறள்கள் காட்டப்பட்டுள்ளன.', lnChainDone: 'சொல்லிப் பார்த்தேன் ✓',
    lnDoneSub: 'இன்று அறிமுகமான குறள்: {n} · மீள்பார்வை: {r}.', lnDoneTomorrow: 'அறிமுகமானவை நாளை மீள்பார்வையில் வரும்.', lnWeakLink: 'மேலும் பழகலாம்: குறள் {n}',
    lnChDone: 'அதிகாரம் {c} · {name} — எல்லாக் குறள்களும் அறிமுகம்.', lnChTest: 'அதிகாரத் தேர்வை எழுதிப் பார்க்கலாம்', lnChTestNote: 'இரண்டு நாள் கழித்து எழுதினால் நினைவு இன்னும் உறுதியாகும்.', lnBackToLesson: 'பாடத்திற்குத் திரும்பலாம்', lnChAllMet: 'அதிகாரம் {c}-இன் குறள்கள் எல்லாம் முன்பே அறிமுகமாகிவிட்டன; மீள்பார்வையில் வரும்.', lnChDonePart: 'அதிகாரம் {c} · {name} — பட்டியலில் உள்ள {y} குறள்களும் அறிமுகம்.', lnListFull: 'பட்டியல் நிறைந்துள்ளது; "என் வழி" பகுதியில் ஓர் இடத்தை விடுவித்துச் சேர்க்கலாம்.', lnAfterCurrent: 'அதிகாரம் {c} நடப்புப் பாடம் முடிந்த பின் தொடங்கும்.', lnPathAlso: 'பட்டியலில் இவையும் உள்ளன',
    lnNumDays: 'கற்ற நாட்கள்', lnNumRun: 'நாள் தொடர்ச்சி', lnNumSeen: 'படித்த குறள்கள்', lnNumFirm: 'நினைவில்', lnComeback: 'மீண்டும் வருக! விட்ட இடத்திலிருந்து தொடரலாம்.',
    lnMyWay: 'என் வழி', lnWayGoal: 'நோக்கம்', lnWayPath: 'எதைப் படிக்கலாம்?', lnWayPace: 'ஒரு பாடத்தில் எத்தனை புதிய குறள்கள்?', lnWayLater: 'மாற்றம் அடுத்த பாடத்திலிருந்து செயல்படும்.',
    lnPathBook: 'நூல் வரிசை', lnPathMine: 'என் பட்டியல்', lnPathSyl: 'பாடத்திட்டம்', lnInCh: 'அதிகார எண்கள் (எ.கா. 4, 8, 11, 40)', lnInNum: 'குறள் எண்கள் (எ.கா. 391-400, 43)', lnApplyList: 'இந்தப் பட்டியலைப் பயன்படுத்தலாம்', lnBadTokens: 'இவற்றைப் புரிந்துகொள்ள முடியவில்லை: {x}', lnListEmpty: 'அதிகார எண்களையோ குறள் எண்களையோ எழுதுங்கள்.',
    lnShareList: 'இந்தப் பட்டியலைப் பகிரலாம்', lnUseList: 'இந்தப் பட்டியலைப் பயன்படுத்தலாமா?', lnUseYes: 'பயன்படுத்தலாம்', lnUseNo: 'வேண்டாம்',
    lnContestDay: 'போட்டி நாள் (விருப்பம்)', lnContestToday: 'இன்று போட்டி நாள். வாழ்த்துகள்!', lnGoalLine: 'போட்டிக்கு இன்னும் உள்ள நாட்கள்: {N} · மீதமுள்ள குறள்கள்: {M}', lnGoalPace: 'ஒரு பாடத்திற்கு {p} வீதம் படித்தால் முடிக்கலாம்.', lnGoalMany: 'ஒரு நாளில் ஒன்றுக்கு மேற்பட்ட பாடங்கள் படிக்கலாம்.',
    lnMapTitle: 'பாட வரைபடம்', lnMapRow: 'படித்தது {x}/{y} · நினைவில் {z}/{y}', lnMapRowU: 'படித்தது {x}/{y}', lnMapNow: 'இப்போது', lnMapStar: '★ தேர்வு', lnFromHere: 'இங்கிருந்து கற்கலாம்', lnMapRead: 'படிக்கலாம்', lnMapTest: 'தேர்வு',
    lnRestart: 'புதிதாகத் தொடங்கலாம்', lnRestartArm: 'உறுதிசெய்ய மீண்டும் தொடுங்கள் (மனப்பாடப் பட்டியலும் தேர்வு முடிவுகளும் அப்படியே இருக்கும்)',
    lnNotCached: 'இந்த அதிகாரம் இன்னும் இக்கருவியில் சேமிக்கப்படவில்லை. இணையம் கிடைக்கும்போது திறக்கலாம்.', lnCantOpen: 'இப்போது இந்தக் குறளைத் திறக்க முடியவில்லை.',
    lnPathDone: 'இந்தப் பாதை நிறைவு. வாழ்த்துகள்! அடுத்த பாதையைத் தேர்ந்தெடுக்கலாம்.', lnPathEmpty: '"என் வழி" பகுதியில் படிக்க வேண்டிய பகுதியைத் தேர்ந்தெடுக்கலாம்.', lnChLink: 'பாடமாகப் படிக்கலாம்', lnNoSave: 'முன்னேற்றத்தைச் சேமிக்க இடமில்லை; பாடம் தொடரும்.',
    test: 'மனப்பாடத் தேர்வு', testShort: 'தேர்வு', testRun: 'தேர்வு', drillShort: 'பயிற்சி', boardShort: 'அதிகாரங்கள்', testPage: 'தேர்வுப் பக்கம்',
    testSub: 'பள்ளி ஒப்புவித்தல் போட்டிக்குத் தயாராகு — சீர் நிரப்பு, அடுத்த அடி, அதிகாரம், குறள் எண், நினைவிலிருந்து எழுது; மதிப்பெண், நேரம், சான்றிதழ்',
    testRange: 'பகுதி', testLevel: 'நிலை', lv1: 'எளிது', lv2: 'நடுத்தரம்', lv3: 'கடினம்', lv1a: 'எளிய', lv2a: 'நடுத்தர', lv3a: 'கடின',
    lv1h: 'ஒரு சீர் நிரப்பு · அடுத்த அடி · அதிகாரம் / குறள் எண் — 10 வினாக்கள்', lv2h: 'இரு சீர்கள் நிரப்பு · அடுத்த அடி · அதிகாரம் / குறள் எண் — 10 வினாக்கள்', lv3h: 'எண்ணைப் பார்த்துக் குறளை எழுது · இரு சீர்கள் · அதிகாரம் / குறள் எண் — 10 வினாக்கள்',
    testName: 'பெயர் (சான்றிதழுக்கு)', testStart: 'தேர்வைத் தொடங்கு', testDrill: 'ஒப்புவித்தல் பயிற்சி', testBoard: 'அதிகார வாரியாக', testBoardSub: '133 அதிகாரங்களிலும் உங்கள் சிறந்த மதிப்பெண்; தட்டினால் அந்த அதிகாரம் தேர்வுப் பக்கத்தில் தெரிவாகும்', testWorksheet: 'வினாத்தாள்',
    testChapter: 'அதிகாரம்', testCustom: 'குறள் எண்கள்', rangeFrom: 'முதல் குறள்', rangeTo: 'கடைசிக் குறள்', applyRange: 'இந்த எண்களைப் பயன்படுத்து', testToday: 'இன்றைய அதிகாரம்', testFirst100: 'முதல் 100 குறள்கள்', testPassedN: 'தேர்ச்சி', testAttempts: 'முயற்சிகள்', testKurals: 'குறள்கள்',
    testSeed: 'சுற்று எண்', testSeedHelp: 'வகுப்பு முழுவதும் ஒரே எண்ணைப் பயன்படுத்தினால் எல்லாத் தொலைபேசிகளிலும் ஒரே வினாத்தாள்; காலியாக விட்டால் ஒவ்வொரு முறையும் புதிய வினாக்கள்', seedRound: 'சுற்று',
    qFill: 'விடுபட்ட சீரை நிரப்பு', qFill2: 'விடுபட்ட இரு சீர்களையும் நிரப்பு', qFillW: 'விடுபட்ட சொல்லை நிரப்பு', qFill2W: 'விடுபட்ட இரு சொற்களையும் நிரப்பு', wordOne: 'சொல்',
    qNext: 'அடுத்த அடி எது?', qNum: 'இது எந்தக் குறள்?', qCh: 'இக்குறள் எந்த அதிகாரத்தில்?', qType: 'இக்குறளை நினைவிலிருந்து எழுது', qTypePh: 'இரு அடிகளையும் இங்கே எழுது…',
    check: 'சரிபார்', nextQ: 'அடுத்து', finish: 'முடி', skip: 'தெரியவில்லை', correct: 'சரி', wrong: 'தவறு', answerWas: 'சரியான விடை', typedCanon: 'மூலம்', typedYours: 'நீங்கள் எழுதியது', wordsMatched: 'சொற்கள் பொருந்தின',
    testResult: 'முடிவு', testTime: 'நேரம்', testBest: 'சிறந்தது', passedWord: 'தேர்ச்சி', testPassed: 'தேர்ச்சி 🎉 — சான்றிதழ் பெறலாம்', testFailed: 'சான்றிதழுக்கு 80% தேவை — மீண்டும் முயலலாம்', retry: 'மீண்டும்', certMin: 'சான்றிதழுக்கு 10 குறள்களாவது உள்ள பகுதி வேண்டும்',
    certificate: 'சான்றிதழ்', certs: 'சான்றிதழ்கள்', certTitle: 'மனப்பாடச் சான்றிதழ்', certTitleMcq: 'திருக்குறள் தேர்ச்சிச் சான்றிதழ்', certNeedName: 'சான்றிதழுக்குப் பெயரை எழுது', certGiven: 'இச்சான்றிதழ் வழங்கப்படுபவர்',
    certBody: 'திருக்குறள் · {range} ({n} குறள்கள்) — மனப்பாடத் தேர்வில் {score}/{total} மதிப்பெண்களுடன், {level} நிலையில், நிறைவு செய்ததற்காக', certRef: 'குறியீடு', certShare: 'பகிர் / சேமி', certZoom: 'பெரிதாக', confirmName: 'பெயரை உறுதிசெய்',
    certSign1: 'நடுவர் / ஆசிரியர்', certSign2: 'தலைமையாசிரியர்', certFoot: 'செயலியின் தானியங்கு மதிப்பீட்டால் வழங்கப்பட்டது · Issued on the app\u2019s automatic grading · cictdl.github.io/index.html/kural-app',
    drillShow: 'காட்டு', drillKnow: 'தெரியும்', drillForgot: 'மறந்தேன்', drillHint: 'குறிப்பு', drillDone: 'பயிற்சி முடிந்தது', drillAgainNo: 'மறந்தவற்றை மீண்டும்',
    drillSub: 'எண்ணைப் பார்த்து ஓது; பிறகு காட்டு — "தெரியும்" எனக் குறித்தவை மனப்பாடப் பட்டியலில் சேரும்',
    shareResult: 'முடிவைப் பகிர்', selfCheckNote: 'தேர்வு தானாக மதிப்பிடப்படுகிறது; ஒப்புவித்தல் பயிற்சி சுய மதிப்பீடு',
    testEmpty: 'இப்பகுதியில் குறள் இல்லை — பயிற்சியில் "மனப்பாடம் ஆயிற்று" எனவும் ஒப்புவித்தல் பயிற்சியில் "தெரியும்" எனவும் குறித்தவை இங்கே வரும்',
    wsKey: 'விடைகள்', wsName: 'பெயர்', wsScore: 'மதிப்பெண்', wsRegen: 'புதிய வினாத்தாள்',
    boardLegend: 'பச்சை = தேர்ச்சி (80%+) · மஞ்சள் = 50–79% · சிவப்பு = 50%க்குக் கீழ் · ★ = மனப்பாடம் செய்தவை · — = இன்னும் இல்லை · தட்டினால் அந்த அதிகாரம் தேர்வுப் பக்கத்தில் தெரிவாகும்',
    'tab.home': 'முகப்பு', 'tab.read': 'நூல்', 'tab.search': 'தேடு', 'tab.practice': 'பயிற்சி', 'tab.more': 'மேலும்',
    'offline.banner': 'இணையம் இல்லை — சேமித்த பக்கங்கள் மட்டும்',
    daily: 'இன்றைய குறள்', continue: 'தொடர்ந்து படிக்க', random: 'ஏதேனும் ஒரு குறள்', translations: 'மொழிபெயர்ப்புகள்',
    prose: 'எளிய உரை', grammar: 'இலக்கணக் குறிப்பு', metre: 'யாப்பு அலகிடுதல்', recite: 'ஓதுக', stop: 'நிறுத்து',
    commentary: 'உரை கேட்க', bookmark: 'குறியிடு', bookmarked: 'குறியிடப்பட்டது', share: 'பகிர்', copy: 'நகல்',
    practice: 'பயிற்சி', tapword: 'ஒவ்வொரு சொல்லையும் தொட்டு இலக்கணக் குறிப்பைக் காண்க',
    prev: '‹ முந்தைய', next: 'அடுத்த ›', kural: 'குறள்', adhigaram: 'அதிகாரம்', pal: 'பால்', iyal: 'இயல்',
    search: 'தேடு', searchPh: 'எந்த மொழியிலும் தேடுக — சொல், எண், ஒலிபெயர்ப்பு…', noresults: 'முடிவுகள் இல்லை',
    results: 'முடிவுகள்', loadingIdx: 'தேடல் அட்டவணை ஏற்றப்படுகிறது…', allLangs: 'எல்லா மொழிகளும்',
    langs: 'மொழிபெயர்ப்பு மொழிகள்', chooseLangs: 'காட்ட வேண்டிய மொழிகளைத் தேர்வு செய்க', scheduled: 'எட்டாம் அட்டவணை மொழிகள் (22)',
    others: 'பிற', translit: 'ஒலிபெயர்ப்பு (Latin)', showProse: 'எளிய உரையைக் காட்டு', fontSize: 'எழுத்து அளவு',
    theme: 'தோற்றம்', auto: 'தானியங்கி', light: 'வெளிச்சம்', dark: 'இருள்', voice: 'குரல்', rate: 'பேச்சு வேகம்',
    notify: 'தினமும் ஒரு குறள் அறிவிப்பு', notifyTime: 'நேரம்', notifyHelp: 'நிறுவிய செயலி (Add to Home Screen) ஆக இருக்கும்போது பின்னணியில் வரும்; இல்லையெனில் செயலியைத் திறக்கும்போது காட்டப்படும்.',
    offline: 'இணையமின்றி', dlText: 'எல்லா நூலையும் சேமி (≈ 32 MB)', dlTts: 'தமிழ் ஓதல் ஒலித் தொகுப்பு (≈ 30 MB)',
    dlBook: 'ஒலிப் புத்தகம் — 133 அதிகாரம் (≈ 200 MB)', clear: 'சேமிப்பை அழி', storage: 'சேமிப்பு',
    settings: 'அமைப்புகள்', about: 'நூல் பற்றி · நன்றி', bookmarks: 'குறிகள்', memorised: 'மனப்பாடம் செய்தவை',
    grammarX: 'இலக்கண ஆய்வு', noBookmarks: 'இன்னும் குறிகள் இல்லை', words: 'சொற்கள்', tags: 'குறிப்புகள்',
    listen: 'கேள்', tap: 'தட்டு', reciteCheck: 'ஓதிச் சரிபார்', memorise: 'மனப்பாடம்', tempo: 'வேகம் (ஒரு மாத்திரை)',
    withWords: 'சொற்களுடன்', start: 'தொடங்கு', tapHint: 'ஒவ்வொரு அசைக்கும் ஒரு முறை தட்டுக — நேர் (1 மாத்திரை) நீளம்; நிரை (2) இருமடங்கு.',
    tapBtn: 'தட்டு (Space)', score: 'மதிப்பெண்', again: 'மீண்டும்', reveal: 'காட்டு', iKnow: 'மனப்பாடம் ஆயிற்று',
    hideMore: 'மேலும் மறை', srNo: 'இந்த உலாவியில் பேச்சு அறிதல் இல்லை. Chrome/Edge (Android/Desktop) இல் முயற்சிக்கவும்.',
    srStart: 'ஓதத் தொடங்கு', srListening: 'கேட்கிறது…', matched: 'பொருந்திய சீர்கள்', noVoice: 'இந்தச் சாதனத்தில் இந்த மொழிக் குரல் இல்லை — அமைப்புகளில் பிற குரல் தேர்வு செய்யலாம்',
    playingClip: 'ஒலிக்கிறது…', proseNA: 'இந்த மொழியில் எளிய உரை இன்னும் தயாராகவில்லை — மொழிபெயர்ப்பைப் பார்க்கவும்.',
    aiNote: 'எளிய உரை: AI-உதவியுடன் உருவாக்கப்பட்ட வரைவு — CICT அறிஞர் சரிபார்ப்புக்கு உட்பட்டது.',
    grNote: 'இலக்கணக் குறிப்புகள் AI-உதவியுடன் உருவாக்கி இருமுறை சரிபார்க்கப்பட்ட வரைவு; நம்பகம் < 0.7 ஆனவை அறிஞர் மறுஆய்வுக்குரியவை.',
    report: 'பிழையைத் தெரிவி', reportHelp: 'உங்கள் அஞ்சல் செயலியில் முன்நிரப்பிய கடிதம் திறக்கும்; நீங்கள் அனுப்பும் வரை எதுவும் அனுப்பப்படாது.', rpStream: 'எந்தப் பகுதி', rpType: 'பிழை வகை', rpNote: 'என்ன தவறு?', rpFix: 'திருத்தம் (விருப்பம்)', rpEmail: 'மின்னஞ்சலில் அனுப்பு', rpShare: 'பகிர்', rpCopy: 'அறிக்கையை நகலெடு', rpOpened: 'அஞ்சல் செயலி திறக்கிறது…', rpReviewed: 'அறிக்கைகள் நிறுவனத்தில் சரிபார்க்கப்பட்ட பின்னரே பாடம் திருத்தப்படும்; திருத்தங்கள் “நூல் பற்றி” பக்கத்தில் பதிவாகும்.', rpTa: 'மூலம் (தமிழ்)', rpEnProse: 'English prose', rpOther: 'பிற', rpT_spelling: 'எழுத்துப் பிழை', rpT_text: 'வரி / சொல் தவறு', rpT_meaning: 'பொருள் / மொழிபெயர்ப்பு', rpT_grammar: 'இலக்கணக் குறிப்பு', rpT_metre: 'யாப்பு', rpT_ms: 'சுவடி வாசிப்பு', rpT_credit: 'மொழிபெயர்ப்பாளர் / பதிப்பு விவரம்', rpT_other: 'பிற', corrections: 'திருத்தங்கள்', reportIntro: 'பிழை கண்டால் அந்தக் குறளின் பக்கத்தில் ⚑ பொத்தானைத் தட்டுங்கள்; அறிக்கை மின்னஞ்சலாக நிறுவனத்தை அடையும்.',
    kattam: 'குறள் குறுக்கெழுத்து', kattamSub: 'தினமும் ஒரு தமிழ்க் குறுக்கெழுத்து — விடைகள் அனைத்தும் குறள் சொற்கள்', kattamGo: 'விளையாடு',
    occasions: 'நிகழ்வுக்கு ஒரு குறள்', occasionsSub: 'திருமணம், தொடக்க விழா, பிரியாவிடை, அஞ்சலி, பள்ளிக் கூட்டம் — பேச்சுக்கும் அழைப்பிதழுக்கும் பொருத்தமான குறள்கள்', occAll: 'எல்லா நிகழ்வுகளும்', occSee: 'மேலும் நிகழ்வுகள்', occCurated: 'செம்மொழித் தமிழாய்வு மத்திய நிறுவனம் தேர்ந்தெடுத்தவை · வேறு குறள் பொருத்தம் எனில் அக்குறளின் பக்கத்தில் ⚑ வழியாகத் தெரிவிக்கலாம்', occShare: 'உரையாகப் பகிர்', occCard: 'அட்டை', occOpen: 'திற',
    verify: 'மேற்கோளைச் சரிபார்', verifySub: 'பேச்சிலோ செய்தித்தாளிலோ சுவரொட்டியிலோ கண்ட குறள் மேற்கோளை ஒட்டுங்கள் — மூலப் பாடத்தைக் கண்டறிந்து, மாறுபடும் ஒவ்வொரு சொல்லையும் காட்டும்', verifyPh: 'குறளையோ அதன் மொழிபெயர்ப்பையோ இங்கே ஒட்டுங்கள்…', verifyBtn: 'சரிபார்', verifyPaste: 'ஒட்டு', verifyQuoted: 'மேற்கோள் காட்டியது', verifyCanon: 'மூலப் பாடம்', verifyScore: 'பொருத்தம்', verifyExact: 'மேற்கோள் சரியானது ✓', verifyDiff: 'சொற்கள் மாறுபடுகின்றன', verifyNone: 'பொருத்தமான குறள் கிடைக்கவில்லை — ஒரு வரியை மட்டும் ஒட்டிப் பாருங்கள்', verifyOthers: 'வேறு சாத்தியங்கள்', verifyCopy: 'மூலப் பாடத்தை நகலெடு', verifyLegend: 'சிவப்பு = மேற்கோளில் மாறிய/கூடுதல் சொல் · பச்சை = விடுபட்ட சொல்',
    widgetTitle: 'முகப்புத் திரையில் இன்றைய குறள்', widgetSub: 'செயலியைத் திறக்காமலே நாள்தோறும் ஒரு குறள் — நீங்கள் முதலில் தேர்ந்த மொழிபெயர்ப்புடன்', widgetAdd: 'விட்ஜெட்டைச் சேர்', widgetAsked: 'முகப்புத் திரையில் சேர்ப்பதை உறுதிப்படுத்துங்கள்', widgetOn: 'விட்ஜெட் முகப்புத் திரையில் உள்ளது ✓', widgetHow: 'முகப்புத் திரையின் காலி இடத்தை அழுத்திப் பிடித்து → விட்ஜெட்டுகள் → Tirukkural Multilingual', widgetOem: 'சில தொலைபேசிகளில் (Xiaomi, Oppo, Vivo, realme) விட்ஜெட் நாள்தோறும் மாற, இச்செயலிக்கு Autostart அனுமதி தேவைப்படலாம்; மின்கலக் கட்டுப்பாட்டையும் நீக்குங்கள்',
    confidence: 'நம்பகம்', audiobook: 'ஒலிப் புத்தகம் (அதிகாரம் முழுதும்)', saveOffline: 'சேமி', saved: 'சேமிக்கப்பட்டது',
    installed: 'நிறுவுக', install: 'செயலியாக நிறுவு', calendar: 'நாட்காட்டியில் சேர் (.ics)',
    kotd: 'இன்றைய குறள்', more: 'மேலும்', stats: 'புள்ளிவிவரம்', otherKurals: 'இதே குறிப்புள்ள பிற குறள்கள்',
    seer: 'சீர்', asai: 'அசை', thalai: 'தளை', paa: 'பா', eetru: 'ஈற்றுச்சீர்', etukai: 'எதுகை', monai: 'மோனை',
    reseg: 'அலகிடுவதற்காகச் சீர்கள் மறுபிரிக்கப்பட்டன', legend: 'நேர் = சிவப்பு · நிரை = நீலம் · ஒவ்வொரு சீரின் கீழும் வாய்பாடு',
    proseIs: 'இம்மொழியின் CICT மொழிபெயர்ப்பே உரைநடையில் உள்ளது — அதுவே எளிய உரை', dlPack: 'ஒலித் தொகுப்பு',
    palmleaf: 'ஓலைச்சுவடிச் சான்று', scribal: 'சுவடி வாசிப்பு', viewArchive: 'கணினி ஆவணக் காப்பகத்தில் காண்க',
    msNone: 'இக்குறளுக்கு இன்னும் சுவடிப் படிமம் இணைக்கப்படவில்லை (அதிகாரம் 1–100 மட்டும்).',
    msOffline: 'படிமம் காண இணையம் தேவை — சுவடி வாசிப்பு கீழே உள்ளது.',
    leafShow: 'ஓலைப் படிமத்தைக் காட்டு', leafLoading: '🌿 ஓலைப் படிமம் ஏற்றப்படுகிறது…', leafSlow: 'படிமம் வரவில்லை (காப்பகம் மெதுவாக உள்ளது).',
    leafFail: 'படிமத்தை ஏற்ற முடியவில்லை.',
    parallel: 'இணை வாசிப்பு', parallelHelp: 'தமிழும் ஒரு மொழியும் அருகருகே',
    study: 'மனப்பாடப் பயிற்சி', srsAdd: 'பயிற்சிக்குச் சேர்', srsIn: 'பயிற்சியில் உள்ளது', srsDue: 'இன்று திரும்பப் பார்க்க',
    srsEmpty: 'பயிற்சிப் பட்டியல் காலி — எந்தக் குறளிலும் "பயிற்சிக்குச் சேர்" என்பதைத் தட்டுங்கள்.',
    srsDone: 'இன்றைய பயிற்சி முடிந்தது 🎉', srsShow: 'விடையைக் காட்டு',
    again: 'மீண்டும்', hard: 'கடினம்', good: 'சரி', easy: 'எளிது', srsStats: 'கற்றவை',
    shareCard: 'படமாகப் பகிர்', cardMaking: 'படம் தயாராகிறது…', install: 'செயலியாக நிறுவு',
    installIos: 'iPhone/iPad: Safari-இல் பகிர் ⤴ → "Add to Home Screen"', installed: 'நிறுவப்பட்டது ✓',
    androidNote: 'இது Android செயலிப் பதிப்பு — நூல் முழுவதும் செயலிக்குள்ளேயே உள்ளது; இணையம் தேவையில்லை. ஒலி வாசிப்புக்கு சாதனத்தின் TextToSpeech (தமிழ்க் குரல்) பயன்படுகிறது.',
    singleFileNote: 'இது ஒரே கோப்பாக (single-file) வழங்கப்படும் பதிப்பு — நூல் முழுவதும் இக்கோப்பினுள்ளேயே உள்ளது; இணையம் தேவையில்லை. ஒலி வாசிப்பு உங்கள் சாதனத்தின் குரல் தொகுப்பைப் பயன்படுத்துகிறது.',
    autoScript: 'எழுத்துமுறைப்படி', autoScriptHelp: 'நீங்கள் தட்டச்சு செய்யும் எழுத்துமுறைக்கு உரிய மொழிகளில் மட்டும் தேடும்',
    scanned: 'தேடல் அட்டவணைகள்', scannedHelp: 'இத்தேடலில் பயன்படுத்திய அட்டவணைகளின் எண்ணிக்கை', searchAll: 'எல்லா 30 மொழிகளிலும் தேடு',
    compare: 'எல்லா மொழிகளிலும்', compareSub: '22 மொழிகள் · 30 மொழிபெயர்ப்புகள்', selected: 'தேர்ந்தவை', playAll: 'எல்லாம் ஒலிக்க',
    lineErr: 'இவ்வடி அலகிட முடியவில்லை', update: 'புதிய பதிப்பு உள்ளது — புதுப்பிக்க', ttsUnsupported: 'இந்த உலாவியில் பேச்சு ஒலி இல்லை',
  },
  en: {
    lnTitle: 'Lesson', lnName: 'Guided lesson', lnTag: '10 minutes a day', lnIntro: 'hear it, understand it, say it, rebuild it', lnStartShort: 'Start', lnBegin: 'Start',
    lnFrGoal: 'Why are you learning?', lnGoalM: 'Memorise and understand', lnGoalC: 'Prepare for a contest', lnGoalU: 'Understanding is enough', lnFrMl: 'Meanings in which language?', lnFrTa: 'Can you read Tamil script?', lnTaYes: 'Yes', lnTaNo: 'Still learning',
    lnFrLater: 'You can change these three answers later under "My way".', lnMlTa: 'Tamil · Mu. Va. prose (தமிழ்)', lnLabTa: 'Tamil prose by Mu. Varadarajan', lnLabEnProse: 'English prose meaning', lnLabTac: 'CICT Tamil commentary',
    lnToday: "Today's lesson", lnTodayStart: 'Start the lesson', lnResume: 'Continue', lnDoneToday: "✓ Today's lesson is done", lnAnother: 'Do another lesson', lnBuilding: "Preparing today's lesson…",
    lnRevShort: 'Review lesson', lnCapShort: 'Enough new couplets for today; more tomorrow', lnRevNow: 'Review now', lnNothing: 'There is nothing to review right now.',
    lnStepOf: 'Step {i}/{n}', lnChShort: 'Ch.', lnNext: 'Continue', lnEnough: 'Enough for today', lnSkipStep: 'Skip this step', lnMore: 'More', lnLess: 'Less',
    lnRecapTitle: 'Welcome back!', lnRecapSub: 'These are the couplets from last time. Carry on from where you stopped.', lnRevHead: 'Review · a couplet you met before',
    lnLearnHead: 'The couplet and its meaning', lnLearnHint: 'First read the couplet once, or listen to it.', lnShowMeaning: 'Show the meaning', lnHear: 'Listen', lnNoAudio: 'If there is no sound, read the lines aloud.',
    lnMoreUrai: 'Fuller commentary', lnWordsOpen: 'Look at the words', lnSplitNote: 'The split form is only to help you understand; recite the printed form.', lnGlossEn: 'Word meanings are in English only', lnWordsNone: 'Word meanings are not available right now.', lnWordsWhole: 'No word in this couplet needs splitting.',
    lnKnowIt: 'I already know this couplet (skip its practice; rebuild it later in the lesson)',
    lnSayHead: 'Say it', lnSay1: 'Listen and say it along', lnSay2: 'Hide the second line and say it', lnSay3: 'Say it without looking', lnSaidIt: 'Said it', lnHide: 'Hide', lnShowLine: 'Show', lnWithBeat: 'Listen with the beat', lnVoiceCheck: 'Check by voice',
    lnMeanQ: 'What does this couplet mean?', lnWhichKural: 'Which couplet has this meaning?', lnRight: '✓ Right!', lnWrongMeaning: '✗ The right meaning is marked ✓ above.', lnWrongKural: '✗ The right couplet is marked ✓ above.', lnWrongWord: '✗ The answer: {w}',
    lnFillSeer: 'Choose the missing feet in order', lnFillWord: 'Choose the missing words in order',
    lnBuildHead: 'Rebuild the couplet', lnBuildSeer: 'Tap the feet in the right order', lnBuildWord: 'Tap the words in the right order', lnTileNo: 'Not this one — try again.', lnTileHelp: 'help', lnTileHelped: 'You rebuilt it with help; try it again tomorrow.', lnPrevOk: '{x} {i}: ✓ right', lnPrevMiss: '{x} {i}: the answer — {w}', lnTileHelpedMsg: 'Help: the correct {x} "{w}" was placed.', lnTileCount: '{a}/{b}', lnBuilt: '✓ The couplet is rebuilt',
    lnStartsWith: 'Kural {n}, which begins "{w}…"', lnIntroduced: 'Kural {n} introduced ✓ — it returns in tomorrow’s review.', lnIntroducedU: 'Kural {n} introduced ✓', lnNoted: '✓ Noted',
    lnRecallHead: 'Say it from memory', lnRecallHint: 'Say the couplet aloud, then check.', lnShowKural: 'Show the couplet', lnRecallYes: '✓ I could say it', lnRecallMore: 'More practice',
    lnChainHead: 'From the beginning, in order', lnChainHint: 'Say the couplets you have met in this chapter aloud, from the first, in order. If you have time, write them in a notebook too.', lnChainShow: 'Show the couplets', lnChainShown: 'The couplets are shown.', lnChainDone: 'I said them ✓',
    lnDoneSub: 'Introduced today: {n} · reviewed: {r}.', lnDoneTomorrow: 'The new ones return in tomorrow’s review.', lnWeakLink: 'More practice: Kural {n}',
    lnChDone: 'Chapter {c} · {name} — every couplet introduced.', lnChTest: 'Try the chapter test', lnChTestNote: 'Taking it two days from now makes the memory firmer.', lnBackToLesson: 'Back to the lesson', lnChAllMet: 'Every couplet of chapter {c} has already been introduced; they return in reviews.', lnChDonePart: 'Chapter {c} · {name} — all {y} couplets on your list introduced.', lnListFull: 'The list is full; free a place under "My way" to add this chapter.', lnAfterCurrent: 'Chapter {c} starts after the current lesson.', lnPathAlso: 'Also on the list',
    lnNumDays: 'lesson days', lnNumRun: 'in a row', lnNumSeen: 'met', lnNumFirm: 'remembered', lnComeback: 'Welcome back! Carry on from where you stopped.',
    lnMyWay: 'My way', lnWayGoal: 'Goal', lnWayPath: 'What to learn', lnWayPace: 'New couplets per lesson', lnWayLater: 'Changes apply from the next lesson.',
    lnPathBook: 'Book order', lnPathMine: 'My list', lnPathSyl: 'Syllabus', lnInCh: 'Chapter numbers (e.g. 4, 8, 11, 40)', lnInNum: 'Kural numbers (e.g. 391-400, 43)', lnApplyList: 'Use this list', lnBadTokens: 'Could not understand: {x}', lnListEmpty: 'Enter chapter numbers or kural numbers.',
    lnShareList: 'Share this list', lnUseList: 'Use this list?', lnUseYes: 'Use it', lnUseNo: 'No',
    lnContestDay: 'Contest day (optional)', lnContestToday: 'The contest is today. Good luck!', lnGoalLine: 'Days to the contest: {N} · couplets left: {M}', lnGoalPace: '{p} per lesson will finish in time.', lnGoalMany: 'You can do more than one lesson a day.',
    lnMapTitle: 'Course map', lnMapRow: 'met {x}/{y} · remembered {z}/{y}', lnMapRowU: 'met {x}/{y}', lnMapNow: 'now', lnMapStar: '★ test', lnFromHere: 'Learn from here', lnMapRead: 'Read', lnMapTest: 'Test',
    lnRestart: 'Start afresh', lnRestartArm: 'Tap again to confirm (your memorised list and test results stay)',
    lnNotCached: 'This chapter is not on this device yet. Open it when you are online.', lnCantOpen: 'This couplet cannot be opened right now.',
    lnPathDone: 'This path is complete. Well done! Choose the next one.', lnPathEmpty: 'Choose what to learn under "My way".', lnChLink: 'Learn as a lesson', lnNoSave: 'No room to save progress; the lesson continues.',
    test: 'Recitation test', testShort: 'Test', testRun: 'Test', drillShort: 'Drill', boardShort: 'Chapters', testPage: 'Test page',
    testSub: 'Prepare for a school recitation contest: fill the missing foot, next line, chapter, kural number, type from memory; with score, time and a certificate',
    testRange: 'Range', testLevel: 'Level', lv1: 'Easy', lv2: 'Standard', lv3: 'Hard', lv1a: 'easy', lv2a: 'standard', lv3a: 'hard',
    lv1h: 'One missing foot · next line · chapter / kural number — 10 questions', lv2h: 'Two missing feet · next line · chapter / kural number — 10 questions', lv3h: 'Type the couplet from its number · two feet · chapter / kural number — 10 questions',
    testName: 'Name (for the certificate)', testStart: 'Start the test', testDrill: 'Recitation drill', testBoard: 'Chapter by chapter', testBoardSub: 'Your best score in each of the 133 chapters; tap one to select it on the test page', testWorksheet: 'Worksheet',
    testChapter: 'Chapter', testCustom: 'Kural numbers', rangeFrom: 'First kural', rangeTo: 'Last kural', applyRange: 'Apply the numbers', testToday: "Today's chapter", testFirst100: 'First 100 kurals', testPassedN: 'passed', testAttempts: 'attempts', testKurals: 'kurals',
    testSeed: 'Round number', testSeedHelp: 'Use one number across a class and every phone gets the same paper; leave it blank for fresh questions each time', seedRound: 'Round',
    qFill: 'Fill the missing foot (சீர்)', qFill2: 'Fill both missing feet', qFillW: 'Fill the missing word', qFill2W: 'Fill both missing words', wordOne: 'word',
    qNext: 'Which is the next line?', qNum: 'Which kural is this?', qCh: 'Which chapter is this kural in?', qType: 'Type this couplet from memory', qTypePh: 'Type both lines here…',
    check: 'Check', nextQ: 'Next', finish: 'Finish', skip: "Don't know", correct: 'Correct', wrong: 'Wrong', answerWas: 'Correct answer', typedCanon: 'Original', typedYours: 'What you typed', wordsMatched: 'words matched',
    testResult: 'Result', testTime: 'Time', testBest: 'Best', passedWord: 'Passed', testPassed: 'Passed 🎉 — certificate available', testFailed: 'Score 80% for a certificate — you can try again', retry: 'Try again', certMin: 'A certificate needs a range of at least 10 kurals',
    certificate: 'Certificate', certs: 'Certificates', certTitle: 'Certificate of Memorisation', certTitleMcq: 'Certificate of Achievement', certNeedName: 'Enter a name for the certificate', certGiven: 'This certificate is awarded to',
    certBody: 'for completing the Tirukkural recitation test — {range} ({n} couplets) — with a score of {score}/{total} at the {level} level', certRef: 'Ref', certShare: 'Share / save', certZoom: 'Zoom', confirmName: 'Confirm the name',
    certSign1: 'Examiner / Teacher', certSign2: 'Head of the institution', certFoot: 'Issued on the app\u2019s automatic grading · cictdl.github.io/index.html/kural-app',
    drillShow: 'Show', drillKnow: 'I know it', drillForgot: 'Forgot', drillHint: 'Hint', drillDone: 'Drill finished', drillAgainNo: 'Repeat the forgotten ones',
    drillSub: 'Recite from the number, then reveal; couplets marked "I know it" join your memorised list',
    shareResult: 'Share result', selfCheckNote: 'The test is auto-graded; the drill is self-assessed',
    testEmpty: 'No couplets in this range — those marked "I know this" in practice or "I know it" in the drill appear here',
    wsKey: 'Answer key', wsName: 'Name', wsScore: 'Score', wsRegen: 'New worksheet',
    boardLegend: 'Green = passed (80%+) · amber = 50–79% · red = below 50% · ★ = memorised · — = not yet · tap a chapter to select it on the test page',
    'tab.home': 'Home', 'tab.read': 'Read', 'tab.search': 'Search', 'tab.practice': 'Practice', 'tab.more': 'More',
    'offline.banner': 'Offline — showing saved pages only',
    daily: 'Kural of the day', continue: 'Continue reading', random: 'Random kural', translations: 'Translations',
    prose: 'In simple words', grammar: 'Word-by-word grammar', metre: 'Metre (யாப்பு)', recite: 'Recite', stop: 'Stop',
    commentary: 'Hear commentary', bookmark: 'Bookmark', bookmarked: 'Bookmarked', share: 'Share', copy: 'Copy',
    practice: 'Practice', tapword: 'Tap any word for its grammatical note',
    prev: '‹ Previous', next: 'Next ›', kural: 'Kural', adhigaram: 'Chapter', pal: 'Book', iyal: 'Section',
    search: 'Search', searchPh: 'Search in any language — word, number, transliteration…', noresults: 'No results',
    results: 'results', loadingIdx: 'Loading search index…', allLangs: 'All languages',
    langs: 'Translation languages', chooseLangs: 'Choose the languages to show', scheduled: 'Eighth-Schedule languages (22)',
    others: 'Other', translit: 'Transliteration (Latin)', showProse: 'Show simple prose', fontSize: 'Text size',
    theme: 'Theme', auto: 'Auto', light: 'Light', dark: 'Dark', voice: 'Voice', rate: 'Speech rate',
    notify: 'Daily kural notification', notifyTime: 'Time', notifyHelp: 'Arrives in the background when the app is installed (Add to Home Screen); otherwise it is shown when you next open the app.',
    offline: 'Offline', dlText: 'Save the whole book (≈ 32 MB)', dlTts: 'Tamil recitation audio pack (≈ 30 MB)',
    dlBook: 'Audiobook — 133 chapters (≈ 200 MB)', clear: 'Clear saved data', storage: 'Storage',
    settings: 'Settings', about: 'About · Credits', bookmarks: 'Bookmarks', memorised: 'Memorised',
    grammarX: 'Grammar explorer', noBookmarks: 'No bookmarks yet', words: 'words', tags: 'tags',
    listen: 'Listen', tap: 'Tap', reciteCheck: 'Recite & check', memorise: 'Memorise', tempo: 'Tempo (one mātrā)',
    withWords: 'with words', start: 'Start', tapHint: 'Tap once per asai — a நேர் is one mātrā long, a நிரை twice that.',
    tapBtn: 'Tap (Space)', score: 'Score', again: 'Again', reveal: 'Reveal', iKnow: 'I know this',
    hideMore: 'Hide more', srNo: 'Speech recognition is not available in this browser. Try Chrome/Edge (Android/Desktop).',
    srStart: 'Start reciting', srListening: 'Listening…', matched: 'Matched feet', noVoice: 'No voice for this language is installed on this device — pick another voice in Settings',
    playingClip: 'Playing…', proseNA: 'A simple-prose retelling is not yet available in this language — see the translation.',
    aiNote: 'Simple prose: AI-assisted draft, pending CICT scholarly review.',
    grNote: 'Grammar notes are an AI-assisted, double-verified draft; entries with confidence < 0.7 await scholarly review.',
    report: 'Report an error', reportHelp: 'Your mail app opens with a pre-filled message; nothing is sent until you send it.', rpStream: 'Which part', rpType: 'Type of error', rpNote: 'What is wrong?', rpFix: 'Suggested correction (optional)', rpEmail: 'Send by email', rpShare: 'Share', rpCopy: 'Copy report', rpOpened: 'Opening your mail app…', rpReviewed: 'Reports are checked at the Institute before the text is corrected; corrections are listed on the About page.', rpTa: 'Tamil original', rpEnProse: 'English prose', rpOther: 'Other', rpT_spelling: 'Spelling or typo', rpT_text: 'Wrong line or word', rpT_meaning: 'Meaning or translation', rpT_grammar: 'Grammar note', rpT_metre: 'Metre', rpT_ms: 'Manuscript reading', rpT_credit: 'Credit or edition details', rpT_other: 'Other', corrections: 'Corrections', reportIntro: 'Found an error? Tap ⚑ on that kural’s page; the report reaches the Institute by email.',
    kattam: 'Kural crossword', kattamSub: 'A daily Tamil crossword; every answer is a word from the Kural', kattamGo: 'Play',
    occasions: 'A Kural for the occasion', occasionsSub: 'Weddings, inaugurations, farewells, condolences, school assemblies: couplets that fit the moment, for a speech or an invitation', occAll: 'All occasions', occSee: 'More occasions', occCurated: 'Chosen at the Central Institute of Classical Tamil · if another couplet fits better, say so with ⚑ on its page', occShare: 'Share as text', occCard: 'Card', occOpen: 'Open',
    verify: 'Verify a quotation', verifySub: 'Paste a Kural quotation from a speech, a newspaper or a poster: the app finds the couplet and marks every word that differs', verifyPh: 'Paste the couplet, in Tamil or in a translation…', verifyBtn: 'Check', verifyPaste: 'Paste', verifyQuoted: 'As quoted', verifyCanon: 'Canonical text', verifyScore: 'match', verifyExact: 'The quotation is exact ✓', verifyDiff: 'words differ', verifyNone: 'No couplet matched; try pasting one line only', verifyOthers: 'Other possibilities', verifyCopy: 'Copy canonical text', verifyLegend: 'red = changed or extra in the quotation · green = missing from it',
    widgetTitle: 'Today’s kural on your home screen', widgetSub: 'A new couplet every day without opening the app, with the translation that is first in your list', widgetAdd: 'Add the widget', widgetAsked: 'Confirm adding it to your home screen', widgetOn: 'The widget is on your home screen ✓', widgetHow: 'Touch and hold an empty part of the home screen → Widgets → Tirukkural Multilingual', widgetOem: 'On some phones (Xiaomi, Oppo, Vivo, realme) the widget changes each day only if this app is allowed to autostart and is not battery-restricted',
    confidence: 'confidence', audiobook: 'Audiobook (whole chapter)', saveOffline: 'Save', saved: 'Saved',
    installed: 'Install', install: 'Install as app', calendar: 'Add to calendar (.ics)',
    kotd: 'Kural of the day', more: 'More', stats: 'Statistics', otherKurals: 'Other kurals with this tag',
    seer: 'foot (சீர்)', asai: 'asai', thalai: 'தளை', paa: 'metre', eetru: 'final foot', etukai: 'எதுகை', monai: 'மோனை',
    reseg: 'Feet were re-segmented to scan', legend: 'நேர் = red · நிரை = blue · vāypāṭu name under each foot',
    proseIs: 'The CICT translation into this language is itself in prose — that is the plain-language retelling', dlPack: 'audio pack',
    palmleaf: 'Palm-leaf witness', scribal: 'Scribal reading', viewArchive: 'Open in the Digital Archives',
    msNone: 'No palm-leaf image is linked for this kural yet (chapters 1–100 are digitised).',
    msOffline: 'The leaf image needs a connection — the scribal reading is below.',
    leafShow: 'Show the leaf', leafLoading: '🌿 loading the leaf…', leafSlow: 'The archive did not respond in time.',
    leafFail: 'Could not load the leaf image.',
    parallel: 'Parallel reading', parallelHelp: 'Tamil and one language, side by side',
    study: 'Study', srsAdd: 'Add to study', srsIn: 'In your deck', srsDue: 'Due today',
    srsEmpty: 'Your deck is empty — tap “Add to study” on any kural.',
    srsDone: 'Nothing left due today 🎉', srsShow: 'Show answer',
    again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy', srsStats: 'Learned',
    shareCard: 'Share as image', cardMaking: 'Making the card…', install: 'Install as app',
    installIos: 'iPhone/iPad: in Safari tap Share ⤴ → “Add to Home Screen”', installed: 'Installed ✓',
    androidNote: 'This is the Android app — the whole book is inside it, so no network is needed. Recitation uses the device TextToSpeech engine (install a Tamil voice in Android settings for the best result).',
    singleFileNote: 'This is the single-file edition — the entire book is inside this one HTML file, so there is nothing to download and no network needed. Audio uses your device’s own installed voices.',
    autoScript: 'Match my script', autoScriptHelp: 'Searches only the languages written in the script you are typing',
    scanned: 'indices', scannedHelp: 'How many language indices this search had to read', searchAll: 'search all 30 languages',
    compare: 'In all languages', compareSub: '22 languages · 30 translations', selected: 'selected', playAll: 'Play all',
    lineErr: 'This line could not be scanned', update: 'A new version is available — refresh', ttsUnsupported: 'Speech output is not available in this browser',
  },
};
const t = k => (STR[S.ui] && STR[S.ui][k]) || STR.en[k] || k;

// ───────────────────────────── settings ─────────────────────────────
const DEFAULTS = {
  ui: 'ta', langs: ['en', 'hi'], showTranslit: true, showProse: true, fontScale: 1, theme: 'auto', notify: false,
  notifyTime: '07:00', voices: {}, rate: 1, bookmarks: [], memorised: [], lastKural: 1, proseTab: 'ta_mv',
  tempo: 320, lastNotified: '', srs: {}, parallelLang: '', srsNew: 5, test: {}, testName: '', testLevel: 2, testSpec: '', testSeed: '', learn: null,
};
let S = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem('kural.settings') || '{}'));
if (S.learn) S.learn = Object.assign(learnDef(), S.learn);
// சாலமன் பாப்பையா / மு. கருணாநிதி are no longer carried; move those readers to மு. வரதராசனார்.
if (['ta_sp', 'ta_mk'].includes(S.proseTab)) S.proseTab = 'ta_mv';
function saveS() { localStorage.setItem('kural.settings', JSON.stringify(S)); applyPrefs(); pushPrefsToSW(); pushWidgetPrefs(); }
function applyPrefs() {
  document.documentElement.style.setProperty('--fs', (S.fontScale || 1) + 'rem');
  if (S.theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', S.theme);
  document.documentElement.lang = S.ui;
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $('#btn-uilang').textContent = S.ui === 'ta' ? 'EN' : 'த';
}
async function pushPrefsToSW() {
  if (!hasCaches()) return;
  try {
    const c = await caches.open('kural-prefs');
    await c.put('/__prefs', new Response(JSON.stringify({
      notify: S.notify, time: S.notifyTime, langs: S.langs, ui: S.ui, lastNotified: S.lastNotified,
    }), { headers: { 'Content-Type': 'application/json' } }));
  } catch { /* no cache API */ }
}

// ───────────────────────────── data access ─────────────────────────────
const D = { meta: null, ch: {}, gr: {}, idx: {}, glossary: null, tags: null, audio: null, ms: null };
// Every read goes through SRC.json(). The folder build fetches; the single-file build
// (Tirukkural-22-Languages.html) installs window.__KURAL_SRC, which answers the same URL
// keys out of an embedded, gzip-compressed payload. Nothing else in the app changes.
const SRC = window.__KURAL_SRC || {
  json: async url => { const r = await fetch(url); if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); },
};
const SINGLE = !!window.__KURAL_SRC;
async function getJSON(url) { return SRC.json(url); }
async function meta() { return D.meta || (D.meta = await getJSON('data/meta.json')); }
async function chapter(n) { return D.ch[n] || (D.ch[n] = await getJSON(`data/ch/${pad(n, 3)}.json`)); }
async function grammar(n) { return D.gr[n] || (D.gr[n] = await getJSON(`data/gr/${pad(n, 3)}.json`)); }
async function sindex(code) { return D.idx[code] || (D.idx[code] = await getJSON(`data/search/${code}.json`)); }
async function glossary() { return D.glossary || (D.glossary = await getJSON('data/glossary.json')); }
async function tags() { return D.tags || (D.tags = await getJSON('data/tags.json')); }
async function manuscripts() { return D.ms || (D.ms = await getJSON('data/manuscript.json').catch(() => ({}))); }
async function audioInfo() { return D.audio || (D.audio = await getJSON('data/audio.json').catch(() => ({ chapters: [], tts: {} }))); }
async function kural(n) { const ch = await chapter(chOf(n)); return ch.kurals[(n - 1) % 10]; }
function chMeta(n) { return D.meta.chapters[n - 1]; }
function L(code) { return D.meta.languages[code]; }
const scriptClass = code => { const s = (L(code) || {}).script || 'Latin'; return 'sc-' + s.replace('Meetei Mayek', 'Meetei').replace('Ol Chiki', 'OlChiki'); };
const dirAttr = code => (L(code) || {}).dir === 'rtl' ? ' dir="rtl"' : '';
// Which script is the query written in? Used to search only the indices that could match.
const SCRIPT_RANGES = [
  ['Tamil', /[஀-௿]/], ['Devanagari', /[ऀ-ॿ]/], ['Bengali', /[ঀ-৿]/],
  ['Gurmukhi', /[਀-੿]/], ['Gujarati', /[઀-૿]/], ['Odia', /[଀-୿]/],
  ['Telugu', /[ఀ-౿]/], ['Kannada', /[ಀ-೿]/], ['Malayalam', /[ഀ-ൿ]/],
  ['Arabic', /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/],
  ['Meetei Mayek', /[ꯀ-꯿]/], ['Latin', /[A-Za-z]/],
];
function queryScripts(q) { return SCRIPT_RANGES.filter(([, re]) => re.test(q)).map(([n]) => n); }
// Indices worth fetching for this query: everything written in the query's script,
// plus Tamil (the source) and whatever the reader has selected.
function searchTargets(q, filter) {
  const m = D.meta;
  if (filter && filter !== 'all' && filter !== 'auto') {
    return [filter, ...(filter === 'ta' ? ['translit', 'prose-ta'] : []), ...(filter === 'en' ? ['prose-en'] : []),
            ...(m.counts.proseLangs.includes(filter) ? ['prose-' + filter] : [])];
  }
  const all = ['translit', 'prose-ta', 'prose-en', ...m.langOrder,
               ...m.counts.proseLangs.filter(c => !['ta', 'en'].includes(c)).map(c => 'prose-' + c)];
  if (filter === 'all') return all;
  const scripts = queryScripts(q);
  if (!scripts.length) return ['ta', 'translit'];
  const codes = new Set(['ta', ...S.langs]);
  m.langOrder.forEach(c => { if (scripts.includes(L(c).script)) codes.add(c); });
  if (scripts.includes('Latin')) codes.add('translit');
  const out = [...codes];
  if (codes.has('ta')) out.push('prose-ta');
  if (codes.has('en')) out.push('prose-en');
  m.counts.proseLangs.forEach(c => { if (codes.has(c) && !['ta', 'en'].includes(c)) out.push('prose-' + c); });
  return [...new Set(out)];
}

function dailyN(d = new Date()) { const days = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); return ((days * 1103) % 1330 + 1330) % 1330 + 1; }
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`; };

// ───────────────────────────── speech (TTS) ─────────────────────────────
// Android WebView ships no speechSynthesis at all, so the wrapper injects these bridges.
// Both are absent in a browser, where the Web Speech API path below is used instead.
const NATIVE_TTS = typeof AndroidTTS !== 'undefined' ? AndroidTTS : null;
const NATIVE_SHARE = typeof AndroidShare !== 'undefined' ? AndroidShare : null;
const NATIVE_NOTIFY = typeof AndroidNotify !== 'undefined' ? AndroidNotify : null;
// The Android home-screen widget shows the daily kural with the reader's first translation;
// tell the shell which one that is. Older shells have no such method, browsers no bridge.
function pushWidgetPrefs() {
  try { if (typeof AndroidNotify !== 'undefined' && typeof AndroidNotify.widgetPrefs === 'function') AndroidNotify.widgetPrefs(firstLang()); } catch (e) { }
}
const IS_ANDROID_APP = !!NATIVE_TTS;

const TTS = {
  voices: [], current: null, curBtn: null, audio: null, nativeSeq: 0,
  init() {
    if (!('speechSynthesis' in window)) return;
    const load = () => { this.voices = speechSynthesis.getVoices(); };
    load(); speechSynthesis.onvoiceschanged = load;
  },
  available(code) {
    if (NATIVE_TTS) { try { return NATIVE_TTS.isAvailable((L(code) || {}).voices ? L(code).voices[0] : 'en-IN'); } catch (e) { return true; } }
    return !!this.pick(code);
  },
  pick(code) {
    const l = L(code); if (!l) return null;
    if (S.voices[code]) { const v = this.voices.find(v => v.voiceURI === S.voices[code]); if (v) return v; }
    for (const c of l.voices) {
      const v = this.voices.find(v => v.lang === c) || this.voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(c.toLowerCase()));
      if (v) return v;
    }
    return null;
  },
  candidates(code) {
    const l = L(code); if (!l) return [];
    const pref = l.voices.map(c => c.toLowerCase().split('-')[0]);
    return this.voices.filter(v => pref.includes(v.lang.toLowerCase().replace('_', '-').split('-')[0]));
  },
  stop() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (NATIVE_TTS) { this.nativeSeq++; try { NATIVE_TTS.stop(); } catch (e) { } }
    if (this.audio) { this.audio.pause(); this.audio = null; }
    if (this.curBtn) { this.curBtn.classList.remove('playing'); this.curBtn = null; }
  },
  speak(text, code, btn, onend) {
    this.stop();
    if (NATIVE_TTS) return this.speakNative(text, code, btn, onend);
    if (!('speechSynthesis' in window)) { toast(t('ttsUnsupported')); return false; }
    const l = L(code) || { voices: ['en'], rate: 0.9 };
    const v = this.pick(code);
    if (!v) { toast(t('noVoice')); return false; }
    const u = new SpeechSynthesisUtterance(text);
    u.voice = v; u.lang = v.lang; u.rate = clamp((l.rate || 0.9) * (S.rate || 1), 0.5, 2);
    u.onend = u.onerror = () => { if (btn) btn.classList.remove('playing'); if (this.curBtn === btn) this.curBtn = null; onend && onend(); };
    if (btn) { btn.classList.add('playing'); this.curBtn = btn; }
    speechSynthesis.speak(u);
    return true;
  },
  // Hand off to the platform TextToSpeech engine through the wrapper's bridge.
  speakNative(text, code, btn, onend) {
    const l = L(code) || { voices: ['en'], rate: 0.9 };
    const tag = (l.voices && l.voices[0]) || 'en-IN';
    const rate = clamp((l.rate || 0.9) * (S.rate || 1), 0.5, 2);
    const id = String(++this.nativeSeq);
    let ok = false;
    try { ok = NATIVE_TTS.speak(text, tag, rate, id); } catch (e) { ok = false; }
    if (!ok) { toast(t('noVoice')); return false; }
    if (btn) { btn.classList.add('playing'); this.curBtn = btn; }
    TTS._pending = { id, btn, onend };
    return true;
  },
  // called from Java when an utterance finishes or fails
  nativeDone(id) {
    const p = TTS._pending;
    if (!p || p.id !== id) return;
    TTS._pending = null;
    if (p.btn) p.btn.classList.remove('playing');
    if (TTS.curBtn === p.btn) TTS.curBtn = null;
    if (p.onend) p.onend();
  },
  // play a bundled clip, falling back to on-device TTS
  clip(url, fallbackText, code, btn, onend) {
    this.stop();
    const a = new Audio(url); this.audio = a;
    if (btn) { btn.classList.add('playing'); this.curBtn = btn; }
    a.onended = () => { if (btn) btn.classList.remove('playing'); this.audio = null; onend && onend(); };
    a.onerror = () => { this.audio = null; if (btn) btn.classList.remove('playing'); this.speak(fallbackText, code, btn, onend); };
    a.play().catch(() => { this.audio = null; if (btn) btn.classList.remove('playing'); this.speak(fallbackText, code, btn, onend); });
  },
};

window.__ttsDone = id => TTS.nativeDone(id);

// ───────────────────────────── routing ─────────────────────────────
const view = () => $('#main');
function setTitle(a, b) { $('#top-title').textContent = a; $('#top-sub').textContent = b || ''; document.title = a.includes('திருக்குறள்') ? a : a + ' · திருக்குறள்'; }
function setTab(name) {
  $$('.tabs a').forEach(a => {
    const on = a.dataset.tab === name;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}
function render(html) { const v = view(); v.innerHTML = html; v.scrollTop = 0; window.scrollTo(0, 0); }
let pendingRoute = 0;
async function route() {
  const my = ++pendingRoute;
  const h = location.hash.slice(1) || '/';
  const [path, qs] = h.split('?');
  const p = path.split('/').filter(Boolean);
  const q = new URLSearchParams(qs || '');
  $('#btn-back').hidden = p.length === 0;
  try {
    await meta();
    if (my !== pendingRoute) return;
    const r = p[0] || 'home';
    const map = {
      home: viewHome, browse: viewBrowse, ch: () => viewChapter(+p[1]), k: () => viewKural(+p[1]),
      compare: () => viewCompare(+p[1]),
      parallel: () => viewParallel(+p[1]),
      study: viewStudy, test: () => viewTest(p[1], p[2], q), learn: () => p[1] === 'go' ? viewLearnGo() : viewLearn(q),
      search: () => viewSearch(q.get('q') || ''), practice: () => p[1] ? viewPractice(+p[1], p[2] || 'listen') : viewPracticeIndex(),
      more: viewMore, settings: viewSettings, about: viewAbout, daily: viewDaily, bookmarks: viewBookmarks,
      grammar: () => viewGrammar(q.get('type') || 'ilakkanam', q.get('tag') || ''), offline: viewOffline,
      occasions: () => viewOccasions(p[1] || ''),
      verify: () => viewVerify(q.get('q') || ''),
    };
    await (map[r] || viewHome)();
    setTab({ home: 'home', daily: 'home', browse: 'browse', ch: 'browse', k: 'browse', compare: 'browse',
             parallel: 'browse', search: 'search', practice: 'practice', study: 'practice', occasions: 'home', verify: 'search', test: 'practice', learn: 'practice' }[r] || 'more');
  } catch (e) {
    console.error(e);
    render(`<div class="card"><h2>⚠️</h2><p>${esc(e.message)}</p><p class="muted">${navigator.onLine ? '' : t('offline.banner')}</p></div>`);
  }
}

// ───────────────────────────── shared renderers ─────────────────────────────
function kuralLinkRow(k, trCode) {
  const tr = trCode && k.tr[trCode] ? k.tr[trCode].filter(Boolean).join(' ') : '';
  return `<a href="#/k/${k.n}"><span class="num">${k.n}</span><span class="tx"><span class="l">${esc(k.l1)}</span><span class="l">${esc(k.l2)}</span>${tr ? `<span class="tr ${scriptClass(trCode)}"${dirAttr(trCode)}>${esc(tr)}</span>` : ''}</span></a>`;
}
function firstLang() { return S.langs.find(c => c !== 'ta') || 'en'; }

function coupletHTML(k, opts = {}) {
  const lines = [k.l1, k.l2].map((ln, li) => {
    const toks = ln.split(/\s+/).filter(Boolean);
    return `<div class="line l${li + 1}">${toks.map((w, ti) => `<button class="w" data-li="${li}" data-ti="${ti}" type="button">${esc(w)}</button>`).join('')}</div>`;
  }).join('');
  const tl = (S.showTranslit && k.tl && k.tl[0]) ? `<div class="translit">${esc(k.tl[0])}<br>&nbsp;&nbsp;&nbsp;${esc(k.tl[1] || '')}</div>` : '';
  return `<div class="couplet ${opts.cls || ''}">${lines}</div>${tl}`;
}

function asaiSegHTML(seer) {
  return seer.asai.map(a => `<b class="${a.k}" title="${a.k === 'N' ? 'நேர்' : 'நிரை'}">${esc(a.u.map(u => u[1]).join(''))}</b>`).join('');
}
function matra(a) { return a.u.reduce((s, u) => s + ({ k: 1, n: 2, o: 0.5 }[u[0]] || 1), 0); }

function scanHTML(y, opts = {}) {
  let gi = 0;
  const out = y.lines.map((ln, li) => {
    if (ln.err || !ln.seers.length) return `<div class="adi"><span class="muted">${t('lineErr')}: ${esc(ln.err || ln.t)}</span></div>`;
    const parts = [];
    ln.seers.forEach((s, si) => {
      parts.push(`<div class="seer" data-gi="${gi++}"><div class="word asai">${asaiSegHTML(s)}</div><div class="name">${esc(s.name)}</div>${opts.beats ? `<div>${s.asai.map(a => a.k === 'N' ? '<i class="beat"></i>' : '<i class="beat"></i><i class="beat"></i>').join(' ')}</div>` : ''}</div>`);
      const th = ln.thalai[si];
      if (si < ln.seers.length - 1 && th) parts.push(`<div class="thalai">${esc(th)}</div>`);
    });
    const bt = y.boundary && y.boundary[li] && li < y.lines.length - 1 ? `<div class="muted" style="font-size:.72rem;margin:-2px 0 2px 8px">↳ அடி இணைப்புத் தளை: ${esc(y.boundary[li])}</div>` : '';
    return `<div class="adi">${parts.join('')}</div><div class="legend">${ln.seers.length} சீர் · ${esc(ln.adi || '')} · ${ln.matra} மாத்திரை</div>${bt}`;
  }).join('');
  const et = (y.lineEtukai || []).map(e => `${e.letters || ''}${e.agreement ? ' (' + e.agreement + ')' : ''}`).filter(Boolean).join(', ');
  const mo = (y.monai || []).map((arr, i) => arr.length ? `அடி ${i + 1}: ` + arr.map(m => `${m.letters || ''}${m.position ? ' ' + m.position : ''}`).join('; ') : '').filter(Boolean).join(' · ');
  return `<div class="scan">${out}</div>
  <div class="sep"></div>
  <div class="row" style="font-size:.85rem"><span class="chip">${t('paa')}: <b>${esc(y.paa)}</b></span>${y.eetru ? `<span class="chip">${t('eetru')}: ${esc(y.eetru)}</span>` : ''}${et ? `<span class="chip">${t('etukai')}: ${esc(et)}</span>` : ''}</div>
  ${mo ? `<div class="muted" style="font-size:.8rem;margin-top:4px">${t('monai')} — ${esc(mo)}</div>` : ''}
  ${y.reseg ? `<div class="muted" style="font-size:.78rem">⚠ ${t('reseg')}</div>` : ''}
  <div class="legend" style="margin-top:4px">${t('legend')}</div>`;
}

// ───────────────────────────── views ─────────────────────────────
async function viewHome() {
  setTitle('திருக்குறள்', 'Tirukkuṟaḷ · 22 மொழிகள் · CICT');
  const n = dailyN(); const k = await kural(n); const cm = chMeta(chOf(n));
  const f = firstLang(); const tr = k.tr[f];
  const last = S.lastKural || 1; const lk = await kural(last);
  const m = D.meta;
  const oc = await occasions().catch(() => null);
  const occChips = oc ? oc.occasions.slice(0, 8).map(x => `<a class="chip" href="#/occasions/${esc(x.id)}">${x.icon} ${esc(occName(x))}</a>`).join('') + `<a class="chip sel" href="#/occasions">${t('occSee')} ›</a>` : '';
  render(`
  ${learnCardHTML('top')}
  <section class="hero">
    <div class="label">${t('daily')} · ${todayKey()}</div>
    <div class="kural-head"><span class="n">${t('kural')} ${n}</span><a class="ch" href="#/ch/${cm.adhigaram}">${esc(cm.name)} · ${esc(cm.nameEn)}</a></div>
    <a href="#/k/${n}" style="text-decoration:none;color:inherit">${coupletHTML(k)}</a>
    ${tr ? `<div class="tr-text ${scriptClass(f)} ${L(f).dir === 'rtl' ? 'rtl' : ''}" style="font-size:1rem;margin-top:6px"${dirAttr(f)}>${esc(tr[0])}<span class="l2">${esc(tr[1] || '')}</span></div>` : ''}
    <div class="actions">
      <button class="btn primary" id="home-recite">🔊 ${t('recite')}</button>
      <a class="btn" href="#/k/${n}">📖 ${t('more')}</a>
      <a class="btn" href="#/practice/${n}">🎵 ${t('practice')}</a>
    </div>
  </section>
  ${learnCardHTML('bottom')}
  ${occChips ? `<div class="card"><h2>🎯 ${t('occasions')}</h2><div class="muted" style="font-size:.85rem">${t('occasionsSub')}</div><div style="margin-top:6px">${occChips}</div></div>` : ''}
  <div class="two">
    <a class="card" href="#/k/${last}" style="text-decoration:none;color:inherit"><h2>${t('continue')}</h2><div class="muted">${t('kural')} ${last} · ${esc(chMeta(chOf(last)).name)}</div><div style="font-family:var(--ta-serif)">${esc(lk.l1)}<br>${esc(lk.l2)}</div></a>
    <div class="card"><h2>${t('stats')}</h2><div class="stat">
      <div><b>1330</b><span>குறள்</span></div><div><b>133</b><span>அதிகாரம்</span></div>
      <div><b>${m.counts.scheduled}</b><span>மொழிகள் · languages</span></div><div><b>${Object.keys(m.languages).length}</b><span>translations</span></div>
      <div><b>${m.counts.wordTokens.toLocaleString()}</b><span>இலக்கணக் குறிப்புகள்</span></div></div></div>
  </div>
  <div class="card"><h2>${t('pal')}</h2><div class="grid">${m.pals.map(p => `<a class="tile" href="#/browse"><div class="n">${t('pal')} ${p.num}</div><b>${esc(p.name)}</b><div class="muted">${esc(p.nameEn)} · ${p.iyals.reduce((s, i) => s + i.chapters.length, 0)} ${t('adhigaram')}</div></a>`).join('')}</div></div>
  <div class="row"><a class="btn" href="#/k/${1 + Math.floor(Math.random() * 1330)}">🎲 ${t('random')}</a><a class="btn" href="#/test">🏆 ${t('test')}</a><a class="btn" href="#/search">🔍 ${t('search')}</a><a class="btn" href="#/daily">🔔 ${t('notify')}</a><button class="btn" id="btn-install" hidden>📲 ${t('install')}</button></div>`);
  $('#home-recite').onclick = e => reciteKural(k, e.currentTarget);
  wireInstall();
}

async function viewBrowse() {
  setTitle(t('tab.read'), 'பால் › இயல் › அதிகாரம்');
  const m = D.meta; const f = firstLang();
  render(m.pals.map(p => `<div class="card"><h2>${esc(p.name)} <span class="muted">· ${esc(p.nameEn)}</span></h2>
    ${p.iyals.map(iy => `<h3 style="margin-top:10px">${esc(iy.name)} <span class="muted">· ${esc(iy.nameEn)}</span></h3>
      <div class="grid">${iy.chapters.map(c => { const cm = chMeta(c); return `<a class="tile" href="#/ch/${c}"><div class="n">${t('adhigaram')} ${c} · ${cm.start}–${cm.end}</div><b>${esc(cm.name)}</b><div class="muted" style="font-size:.8rem">${esc(cm.nameEn)}</div></a>`; }).join('')}</div>`).join('')}
  </div>`).join(''));
}

async function viewChapter(n) {
  if (!(n >= 1 && n <= 133)) return viewBrowse();
  const ch = await chapter(n); const ai = await audioInfo(); const f = firstLang();
  setTitle(`${t('adhigaram')} ${n} · ${ch.name}`, `${ch.nameEn} · ${ch.pal} › ${ch.iyal}`);
  const hasBook = ai.chapters.includes(n);
  render(`<div class="nav-pn pn-top">${n > 1 ? `<a class="btn" href="#/ch/${n - 1}">${t('prev')}</a>` : '<span></span>'}${n < 133 ? `<a class="btn" href="#/ch/${n + 1}">${t('next')}</a>` : ''}</div>
  <div class="card">
    <div class="row"><div class="grow"><h2 style="font-size:1.2rem">${esc(ch.name)} <span class="muted">· ${esc(ch.nameEn)}</span></h2><div class="muted">${esc(ch.pal)} › ${esc(ch.iyal)} · ${t('kural')} ${ch.start}–${ch.end} · <i>${esc(ch.transliteration)}</i></div></div></div>
    <div class="row" style="margin-top:8px"><a class="btn small" href="#/parallel/${n}">⇔ ${t('parallel')}</a>
      <a class="btn small" href="#/practice/${ch.start}">🎵 ${t('practice')}</a>
      <a class="btn small" href="#/learn" onclick="learnFromChapter(${n});return false">📘 ${t('lnChLink')}</a></div>
    ${hasBook ? `<div class="sep"></div><div class="muted" style="font-size:.8rem">🎧 ${t('audiobook')}</div><div class="player"><audio controls preload="none" src="audio/ch/${pad(n, 3)}.mp3"></audio><button class="btn small" id="save-book">💾 ${t('saveOffline')}</button></div>` : ''}
  </div>
  <div class="card list">${ch.kurals.map(k => kuralLinkRow(k, f)).join('')}</div>`);
  const sb = $('#save-book');
  if (sb) sb.onclick = async () => { sb.disabled = true; await cacheUrls([`audio/ch/${pad(n, 3)}.mp3`]); sb.textContent = '✓ ' + t('saved'); };
}

let currentKural = null;
async function viewKural(n) {
  if (!(n >= 1 && n <= 1330)) return viewBrowse();
  const k = await kural(n); const cm = chMeta(chOf(n)); const ai = await audioInfo();
  currentKural = k; S.lastKural = n; localStorage.setItem('kural.settings', JSON.stringify(S));
  setTitle(`${t('kural')} ${n}`, `${cm.name} · ${cm.nameEn}`);
  const bm = S.bookmarks.includes(n);
  const trCards = S.langs.filter(c => c !== 'ta' && k.tr[c]).map(c => {
    const l = L(c); const [a, b] = k.tr[c];
    return `<div class="card tr-card"><div class="lang"><span class="nm ${scriptClass(c)}">${esc(l.native)}</span><span class="kind">${esc(l.name)} · ${l.kind === 'verse' ? 'verse' : 'prose'}</span><span class="grow"></span><button class="btn small rep-tr" data-code="${c}" title="${esc(t('report'))}" aria-label="${esc(t('report'))}">⚑</button><button class="btn small tts-tr" data-code="${c}" aria-label="play">🔊</button></div>
      <div class="tr-text ${scriptClass(c)} ${l.dir === 'rtl' ? 'rtl' : ''}"${dirAttr(c)}>${esc(a)}${b ? `<span class="l2">${esc(b)}</span>` : ''}</div>
      <div class="credit">${esc(l.credit)}</div></div>`;
  }).join('');
  // prose tabs
  const proseTabs = [['ta_mv', 'மு. வரதராசனார்'], ['tac', 'தமிழ் உரை · CICT'], ['en', 'English']];
  for (const c of S.langs) if (!['ta', 'en', 'tac'].includes(c) && L(c)) proseTabs.push([c, L(c).native]);
  if (!proseTabs.some(p => p[0] === S.proseTab)) S.proseTab = 'ta_mv';
  render(`<div class="nav-pn pn-top">${n > 1 ? `<a class="btn" href="#/k/${n - 1}">${t('prev')}</a>` : '<span></span>'}${n < 1330 ? `<a class="btn" href="#/k/${n + 1}">${t('next')}</a>` : ''}</div>
  <div class="card">
    <div class="kural-head"><span class="n">${t('kural')} ${n}</span><a class="ch" href="#/ch/${cm.adhigaram}">${t('adhigaram')} ${cm.adhigaram} · ${esc(cm.name)}</a><span class="pill">${esc(cm.pal || D.meta.pals[cm.palNum - 1].name)} · ${esc(D.meta.pals[cm.palNum - 1].iyals.find(i => i.num === cm.iyalNum).name)}</span></div>
    ${coupletHTML(k)}
    <div class="muted" style="font-size:.78rem">☝ ${t('tapword')}</div>
    <div class="actions">
      <button class="btn primary" id="k-recite">🔊 ${t('recite')}</button>
      <button class="btn" id="k-comm">🗣 ${t('commentary')}</button>
      <button class="btn ${bm ? 'on' : ''}" id="k-bm">${bm ? '★' : '☆'} ${bm ? t('bookmarked') : t('bookmark')}</button>
      <a class="btn" href="#/practice/${n}">🎵 ${t('practice')}</a>
      <button class="btn" id="k-study">${S.srs[n] ? '✓ ' + t('srsIn') : '🧠 ' + t('srsAdd')}</button>
      <button class="btn" id="k-share">⤴ ${t('share')}</button>
      <button class="btn" id="k-card">🖼 ${t('shareCard')}</button>
      <button class="btn" id="k-copy">⧉ ${t('copy')}</button>
      <button class="btn" id="k-report">⚑ ${t('report')}</button>
    </div>
  </div>
  <h3 class="muted" style="margin:4px 4px">${t('translations')} <button class="btn small" id="k-langs">🌐 ${t('langs')}</button> <a class="btn small" href="#/compare/${n}">⇔ ${t('compare')}</a></h3>
  ${trCards || `<div class="card muted">${t('chooseLangs')}</div>`}
  ${S.showProse ? `<div class="card"><h2>${t('prose')}</h2><div class="tabs-inline" id="prose-tabs">${proseTabs.map(p => `<button data-p="${p[0]}" class="${p[0] === S.proseTab ? 'on' : ''} ${scriptClass(p[0].startsWith('ta') ? 'ta' : p[0])}">${esc(p[1])}</button>`).join('')}</div><div id="prose-body"></div></div>` : ''}
  <div class="card"><h2>${t('metre')}</h2>${scanHTML(k.yappu)}<div class="row" style="margin-top:8px"><a class="btn small" href="#/practice/${n}">🎵 ${t('practice')}</a></div></div>
  <div class="card"><h2>${t('grammar')}</h2><div id="wordtable" class="wordtable"><span class="muted">…</span></div><div class="ai-note">${t('grNote')}</div></div>
  <div class="card" id="ms-card"><h2>🌿 ${t('palmleaf')}</h2><div id="ms-body"><span class="muted">…</span></div></div>`);

  // wiring
  $('#k-recite').onclick = e => reciteKural(k, e.currentTarget);
  $('#k-comm').onclick = e => speakCommentary(k, e.currentTarget);
  $('#k-bm').onclick = () => { toggleBookmark(n); viewKural(n); };
  $('#k-study').onclick = e => { srsAdd(n); e.currentTarget.classList.add('on'); e.currentTarget.textContent = '✓ ' + t('srsIn'); toast(t('srsIn')); };
  $('#k-share').onclick = () => shareKural(k, cm);
  $('#k-card').onclick = e => shareCard(k, cm, e.currentTarget);
  $('#k-copy').onclick = () => { navigator.clipboard.writeText(kuralText(k, cm)).then(() => toast('✓')); };
  $('#k-report').onclick = () => openReportSheet(k, cm, 'ta');
  $('#k-langs').onclick = openLangSheet;
  $$('.tts-tr').forEach(b => b.onclick = e => speakTranslation(k, b.dataset.code, e.currentTarget));
  $$('.rep-tr').forEach(b => b.onclick = () => openReportSheet(k, cm, b.dataset.code));
  const renderProse = () => {
    const body = $('#prose-body'); if (!body) return;
    const p = S.proseTab; let txt = k.prose[p]; let note = '';
    const code = p.startsWith('ta') ? 'ta' : p;
    if (!txt && k.tr[p]) {
      txt = k.tr[p].filter(Boolean).join(' ');
      // A prose-kind published translation *is* the plain-language retelling for that language.
      note = (L(p) && L(p).kind === 'prose') ? `${t('proseIs')} — ${esc(L(p).credit)}` : t('proseNA');
    }
    // Published editions carry their citation; only a commissioned retelling is an AI draft.
    const published = ['ta_mv', 'tac', 'en'];
    const isAI = !published.includes(p) && k.prose[p];
    const meta = L(p);
    const credit = p === 'ta_mv' ? 'மு. வரதராசனார் உரை'
                 : p === 'en' ? 'English prose paraphrase'
                 : (meta && published.includes(p)) ? meta.credit : '';
    const url = meta && meta.url;
    body.innerHTML = `<div class="prose ${scriptClass(code)} ${L(code) && L(code).dir === 'rtl' ? 'rtl' : ''}"${dirAttr(code)}>${esc(txt || '—')}</div>
      ${credit ? `<div class="credit">${esc(credit)}${url ? ` · <a href="${esc(url)}" target="_blank" rel="noopener">digitalarchives.cict.in</a>` : ''}</div>` : ''}
      ${note ? `<div class="ai-note">${note}</div>` : ''}${isAI ? `<div class="ai-note">${t('aiNote')}</div>` : ''}
      <div class="row" style="margin-top:6px"><button class="btn small" id="prose-play">🔊 ${t('listen')}</button></div>`;
    $('#prose-play').onclick = e => speakCommentary(k, e.currentTarget);
  };
  $$('#prose-tabs button').forEach(b => b.onclick = () => { S.proseTab = b.dataset.p; saveS(); $$('#prose-tabs button').forEach(x => x.classList.toggle('on', x === b)); renderProse(); });
  renderProse();
  // grammar
  try {
    const gr = (await grammar(chOf(n))).kurals[String(n)];
    const words = gr.words;
    const wt = $('#wordtable');
    if (wt) wt.innerHTML = words.map((w, i) => `<div class="wt" data-wi="${i}"><b>${esc(w.w)}</b><br>${w.c.map(c => `<span class="tag cat-${esc(c.cat)}">${esc(c.ilk || c.cat || '')}</span>`).join(' ')}${w.togai ? `<br><span class="muted">${esc(w.togai)}</span>` : ''}</div>`).join('');
    const open = i => openWordSheet(k, words[i], gr, i);
    $$('#wordtable .wt').forEach(el => el.onclick = () => open(+el.dataset.wi));
    $$('.couplet .w').forEach(btn => btn.onclick = () => {
      const li = +btn.dataset.li, ti = +btn.dataset.ti;
      let idx = words.findIndex(w => w.adi === li + 1 && w.pos === ti + 1);
      if (idx < 0) { const tx = stripPunct(btn.textContent); idx = words.findIndex(w => stripPunct(w.w) === tx); }
      if (idx >= 0) { $$('.couplet .w').forEach(x => x.classList.toggle('on', x === btn)); open(idx); } else toast('—');
    });
  } catch (e) { const wt = $('#wordtable'); if (wt) wt.innerHTML = `<span class="muted">${esc(e.message)}</span>`; }
  renderManuscript(n);
}

// The palm-leaf witness of this couplet — scribal reading (bundled, works offline) plus a
// IIIF region crop of the actual leaf line from the CICT corpus on Zenodo (needs a network).
async function renderManuscript(n) {
  const box = $('#ms-body'); if (!box) return;
  let ms = {};
  try { ms = await manuscripts(); } catch { }
  const m = ms[String(n)];
  if (!m) { box.innerHTML = `<span class="muted">${t('msNone')}</span>`; return; }
  box.innerHTML = `
    ${m.crop ? `<div class="leaf" id="leaf-box"><button class="btn small leaf-ph" id="leaf-go">🌿 ${t('leafShow')}</button></div>` : ''}
    <div class="muted" style="font-size:.75rem;margin-top:4px">${t('scribal')}</div>
    <div class="scribal">${esc(m.scribal || '—')}</div>
    <div class="row" style="margin-top:8px">
      ${m.record ? `<a class="btn small" href="${esc(m.record)}" target="_blank" rel="noopener">🔗 ${t('viewArchive')}</a>` : ''}
      ${m.doi ? `<span class="pill">DOI ${esc(m.doi)}</span>` : ''}
      ${m.ms ? `<span class="pill">${esc(m.ms)}</span>` : ''}
    </div>`;
  const leaf = $('#leaf-box'); if (!leaf) return;
  // The leaf image comes from Zenodo, so it is the one thing here that needs a network.
  // Load it only when the card is actually approached, and keep a visible state throughout —
  // an <img loading="lazy"> that never scrolls into view neither loads nor errors, which would
  // otherwise leave an empty box forever.
  const load = () => {
    if (leaf.dataset.started) return;
    leaf.dataset.started = '1';
    if (!navigator.onLine) { leaf.innerHTML = `<span class="muted leaf-ph">${esc(t('msOffline'))}</span>`; return; }
    leaf.innerHTML = `<span class="muted leaf-ph">${esc(t('leafLoading'))}</span>`;
    const img = new Image();
    img.alt = t('palmleaf') + ' — ' + (m.ms || '');
    img.decoding = 'async';
    const fail = msg => {
      leaf.dataset.started = '';
      leaf.innerHTML = `<span class="muted leaf-ph">${esc(msg)} <button class="btn small" id="leaf-retry">↻</button></span>`;
      const r = $('#leaf-retry'); if (r) r.onclick = () => renderManuscript(n);
    };
    const timer = setTimeout(() => { img.src = ''; fail(t('leafSlow')); }, 20000);
    img.onload = () => { clearTimeout(timer); leaf.innerHTML = ''; leaf.appendChild(img);
      if (m.full) { const a = document.createElement('a'); a.href = m.full; a.target = '_blank'; a.rel = 'noopener';
        a.title = t('viewArchive'); leaf.innerHTML = ''; a.appendChild(img); leaf.appendChild(a); } };
    img.onerror = () => { clearTimeout(timer); fail(t('leafFail')); };
    img.src = m.crop;
  };
  const go = $('#leaf-go'); if (go) go.onclick = load;
  // Auto-load when the card is actually approached — but only as an enhancement. The button
  // above is always the guaranteed path, since an observer never fires in a hidden or
  // zero-sized viewport, which would otherwise strand the placeholder.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); load(); } },
                                        { rootMargin: '400px' });
    io.observe(leaf);
  }
}

function kuralText(k, cm) {
  const f = firstLang(); const tr = k.tr[f] ? '\n' + k.tr[f].filter(Boolean).join('\n') : '';
  return `திருக்குறள் ${k.n} · ${cm.name}\n${k.l1}\n${k.l2}${tr}\n— CICT · ${appUrl()}#/k/${k.n}`;
}
function shareKural(k, cm) {
  const text = kuralText(k, cm);
  if (NATIVE_SHARE) { try { NATIVE_SHARE.text(`திருக்குறள் ${k.n}`, text); return; } catch (e) { } }
  if (navigator.share) navigator.share({ title: `திருக்குறள் ${k.n}`, text }).catch(() => { });
  else navigator.clipboard.writeText(text).then(() => toast('✓ ' + t('copy')));
}

// ───────────────────────────── report an error (the correction loop) ─────────────────────────────
// Nothing leaves the device by itself: the report is composed here and handed to the reader's own
// mail app (or the share sheet / clipboard), so the app stays free of servers and tracking.
const REPORT_TYPES = ['spelling', 'text', 'meaning', 'grammar', 'metre', 'ms', 'credit', 'other'];
function reportStreams(k) {
  const s = [['ta', t('rpTa')]];
  for (const c of S.langs) if (c !== 'ta' && k.tr[c] && L(c)) s.push([c, `${L(c).native} · ${L(c).name}`]);
  s.push(['ta_mv', 'மு. வரதராசனார் உரை'], ['tac', 'தமிழ் உரை · CICT'], ['en-prose', t('rpEnProse')],
         ['grammar', t('grammar')], ['metre', t('metre')], ['manuscript', t('palmleaf')], ['other', t('rpOther')]);
  return s;
}
function reportShownText(k, code) {
  if (code === 'ta' || code === 'grammar' || code === 'metre' || code === 'other') return `${k.l1}\n${k.l2}`;
  if (k.tr[code]) return k.tr[code].filter(Boolean).join('\n');
  if (code === 'ta_mv') return k.prose.ta_mv || '';
  if (code === 'tac') return k.prose.tac || '';
  if (code === 'en-prose') return k.prose.en || '';
  if (code === 'manuscript') { const m = D.ms && D.ms[String(k.n)]; return m ? `${m.scribal || ''}\n${m.ms || ''} ${m.doi || ''}`.trim() : ''; }
  return '';
}
function buildReport(k, cm, code, type, note, fix) {
  const label = (reportStreams(k).find(s => s[0] === code) || [code, code])[1];
  const credit = L(code) ? L(code).credit : '';
  const m = D.meta; const edition = IS_ANDROID_APP ? 'android' : SINGLE ? 'single-file' : 'web';
  return ['திருக்குறள் · Tirukkural Multilingual — பிழை அறிக்கை / error report',
    `குறள் / Kural: ${k.n} · அதிகாரம் ${cm.adhigaram} ${cm.name} (${cm.nameEn})`,
    `பகுதி / Part: ${label}${credit ? ` — ${credit}` : ''}`,
    `வகை / Type: ${t('rpT_' + type)}`,
    '', 'காட்டப்பட்ட பாடம் / Text shown:', reportShownText(k, code) || '—',
    '', 'தவறு / What is wrong:', note || '—',
    '', 'திருத்தம் / Suggested correction:', fix || '—',
    '', `App: ${edition} · build ${m.built} · v${m.version} · ui ${S.ui}`,
    `Link: ${appUrl()}#/k/${k.n}`].join('\n');
}
function openReportSheet(k, cm, code) {
  const streams = reportStreams(k); if (!streams.some(s => s[0] === code)) code = 'ta';
  openSheet(`<h2>⚑ ${t('report')}</h2><div class="muted" style="font-size:.85rem">${t('reportHelp')}</div>
    <div class="field"><label class="muted" for="rp-stream">${t('rpStream')}</label><select id="rp-stream">${streams.map(s => `<option value="${esc(s[0])}"${s[0] === code ? ' selected' : ''}>${esc(s[1])}</option>`).join('')}</select></div>
    <div class="field"><label class="muted" for="rp-type">${t('rpType')}</label><select id="rp-type">${REPORT_TYPES.map(x => `<option value="${x}">${esc(t('rpT_' + x))}</option>`).join('')}</select></div>
    <div class="field"><label class="muted" for="rp-note">${t('rpNote')}</label><textarea id="rp-note" rows="3"></textarea></div>
    <div class="field"><label class="muted" for="rp-fix">${t('rpFix')}</label><textarea id="rp-fix" rows="2"></textarea></div>
    <div class="row" style="margin-top:10px"><button class="btn primary" id="rp-email">✉ ${t('rpEmail')}</button>${(NATIVE_SHARE || navigator.share) ? `<button class="btn" id="rp-share">⤴ ${t('rpShare')}</button>` : ''}<button class="btn" id="rp-copy">⧉ ${t('rpCopy')}</button><span class="grow"></span><button class="btn small" onclick="closeSheet()">✕</button></div>
    <div class="muted" style="font-size:.78rem;margin-top:8px">${t('rpReviewed')}</div>`);
  const text = () => buildReport(k, cm, $('#rp-stream').value, $('#rp-type').value, $('#rp-note').value.trim(), $('#rp-fix').value.trim());
  const subject = () => `[Tirukkural ${k.n}] ${$('#rp-stream').selectedOptions[0].textContent} — ${$('#rp-type').selectedOptions[0].textContent}`;
  const to = () => (D.meta.credits && D.meta.credits.contact) || 'kannan.k@cict.in';
  $('#rp-email').onclick = () => { location.href = `mailto:${to()}?subject=${encodeURIComponent(subject())}&body=${encodeURIComponent(text())}`; toast(t('rpOpened')); };
  const sh = $('#rp-share'); if (sh) sh.onclick = () => { const body = text(); if (NATIVE_SHARE) { try { NATIVE_SHARE.text(subject(), body); return; } catch (e) { } } navigator.share({ title: subject(), text: body }).catch(() => { }); };
  $('#rp-copy').onclick = () => navigator.clipboard.writeText(text()).then(() => toast('✓ ' + t('rpCopy')));
  $('#rp-note').focus();
}
function toggleBookmark(n) {
  const i = S.bookmarks.indexOf(n); if (i >= 0) S.bookmarks.splice(i, 1); else S.bookmarks.push(n); saveS();
}
// Play through a pre-rendered offline pack when one exists, else on-device speech.
async function playPack(pack, n, text, code, btn, onend) {
  if (TTS.curBtn === btn) { TTS.stop(); return; }
  const ai = await audioInfo();
  if (ai.tts && ai.tts[pack]) TTS.clip(`audio/tts/${pack}/${pad(n, 4)}.mp3`, text, code, btn, onend);
  else TTS.speak(text, code, btn, onend);
}
async function reciteKural(k, btn) { return playPack('ta', k.n, `${k.l1} ${k.l2}`, 'ta', btn); }
async function speakTranslation(k, code, btn, onend) {
  const [a, b] = k.tr[code] || ['', ''];
  return playPack(code, k.n, [a, b].filter(Boolean).join('. '), code, btn, onend);
}
async function speakCommentary(k, btn) {
  const p = S.proseTab || 'ta_mv'; const code = p.startsWith('ta') ? 'ta' : p;
  const txt = k.prose[p] || (k.tr[p] ? k.tr[p].filter(Boolean).join('. ') : k.prose.ta_mv);
  const pack = p === 'ta_mv' ? 'ta-prose' : p === 'en' ? 'en-prose' : null;
  if (pack) return playPack(pack, k.n, txt, code, btn);
  if (TTS.curBtn === btn) { TTS.stop(); return; }
  TTS.speak(txt, code, btn);
}

// ───────────────────────────── sheets ─────────────────────────────
let sheetOpener = null;
function openSheet(html) {
  const prev = sheetOpener || document.activeElement;
  closeSheet();
  sheetOpener = prev && prev.focus ? prev : null;
  const root = $('#sheet-root');
  root.innerHTML = `<div class="sheet-back" id="sheet-back"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(t('grammar'))}" tabindex="-1"><div class="handle"></div>${html}</div>`;
  $('#sheet-back').onclick = closeSheet;
  document.addEventListener('keydown', sheetKeys, true);
  const sheet = $('#sheet-root .sheet');
  (sheet.querySelector('button, a, select, input, textarea') || sheet).focus();
}
function sheetKeys(e) {
  if (e.key === 'Escape') { e.stopPropagation(); closeSheet(); return; }
  if (e.key !== 'Tab') return;
  const f = $$('#sheet-root button, #sheet-root a[href], #sheet-root select, #sheet-root input, #sheet-root textarea').filter(el => el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
function closeSheet() {
  if (!$('#sheet-root').innerHTML) return;
  $('#sheet-root').innerHTML = '';
  document.removeEventListener('keydown', sheetKeys, true);
  $$('.couplet .w.on').forEach(x => x.classList.remove('on'));
  if (sheetOpener && document.contains(sheetOpener)) sheetOpener.focus();
  sheetOpener = null;
}

const FEAT = { thinai: 'திணை', paal: 'பால்', eN: 'எண்', idam: 'இடம்', kaalam: 'காலம்' };
async function openWordSheet(k, w, gr, i) {
  const g = await glossary().catch(() => ({ terms: {} }));
  const term = x => { const d = g.terms && g.terms[x]; return d ? `<div class="gloss-tip">${esc(S.ui === 'ta' ? d.ta : d.en)}</div>` : ''; };
  const rows = w.c.map(c => {
    const vet = c.vet && typeof c.vet === 'object' ? `${c.vet.number || ''} · ${c.vet.name || ''}${c.vet.urupu ? ` (${c.vet.urupu})` : ''}` : (c.vet || '');
    const feats = Object.entries(c.feat || {}).map(([a, b]) => `${FEAT[a] || a}: ${b}`).join(' · ');
    return `<table class="gtable">
      <tr><th>சொல்</th><td><b style="font-family:var(--ta-serif);font-size:1.1rem">${esc(c.s)}</b>${c.split && c.split !== c.s ? ` <span class="muted">(${esc(c.split)})</span>` : ''}</td></tr>
      <tr><th>பகுதி</th><td><span class="tag cat-${esc(c.cat)}">${esc(c.cat || '')}</span>${term(c.cat)}</td></tr>
      <tr><th>${t('grammar')}</th><td><span class="tag cat-${esc(c.cat)}">${esc(c.ilk || '')}</span> <a class="muted" href="#/grammar?type=ilakkanam&tag=${encodeURIComponent(c.ilk || '')}" onclick="closeSheet()" style="font-size:.78rem">↗ ${t('otherKurals')}</a>${term(c.ilk)}</td></tr>
      ${feats ? `<tr><th>இயல்புகள்</th><td>${esc(feats)}</td></tr>` : ''}
      ${vet ? `<tr><th>வேற்றுமை</th><td>${esc(vet)}${term((c.vet && c.vet.name) || '')}</td></tr>` : ''}
      ${c.todar ? `<tr><th>தொடர்</th><td>${esc(c.todar)}${term(c.todar)}</td></tr>` : ''}
      ${c.gloss ? `<tr><th>பொருள் · gloss</th><td>${esc(c.gloss)}</td></tr>` : ''}
      <tr><th>${t('confidence')}</th><td><span class="conf"><i style="width:${Math.round((c.conf || 0) * 100)}%"></i></span> ${c.conf ?? '–'}</td></tr>
    </table>`;
  }).join('<div class="sep"></div>');
  const flags = (gr.flags || []).filter(f => f.includes(w.w) || w.c.some(c => f.includes(c.s)));
  openSheet(`<h2>${esc(w.w)} <span class="muted" style="font-size:.8rem">அடி ${w.adi} · சீர் ${w.pos}${w.togai ? ` · ${esc(w.togai)}` : ''}</span></h2>
    ${rows}
    ${w.togai ? `<div class="gloss-tip" style="margin-top:8px"><b>தொகை:</b> ${esc(w.togai)} ${term(w.togai).replace('<div class="gloss-tip">', '').replace('</div>', '')}</div>` : ''}
    ${flags.length ? `<div class="ai-note">⚑ ${flags.map(esc).join('<br>')}</div>` : ''}
    <div class="row" style="margin-top:10px"><button class="btn small" id="ws-say">🔊 ${esc(w.w)}</button>${i > 0 ? `<button class="btn small" id="ws-prev">‹</button>` : ''}${i < gr.words.length - 1 ? `<button class="btn small" id="ws-next">›</button>` : ''}<span class="grow"></span><button class="btn small" onclick="closeSheet()">✕</button></div>`);
  $('#ws-say').onclick = e => TTS.speak(w.w, 'ta', e.currentTarget);
  const pv = $('#ws-prev'), nx = $('#ws-next');
  if (pv) pv.onclick = () => openWordSheet(k, gr.words[i - 1], gr, i - 1);
  if (nx) nx.onclick = () => openWordSheet(k, gr.words[i + 1], gr, i + 1);
}

function openLangSheet() {
  const m = D.meta;
  const groups = {}; m.langOrder.forEach(c => { (groups[L(c).group] ||= []).push(c); });
  const sched = Object.keys(groups).filter(g => L(groups[g][0]).scheduled).sort((a, b) => L(groups[a][0]).name.localeCompare(L(groups[b][0]).name));
  const other = Object.keys(groups).filter(g => !L(groups[g][0]).scheduled);
  const chip = c => `<button class="chip ${S.langs.includes(c) ? 'sel' : ''} ${scriptClass(c)}" data-c="${c}" title="${esc(L(c).name)}">${esc(L(c).native)}${L(c).coverage < 1330 ? ' *' : ''}${groups[L(c).group].length > 1 ? ` <small>${esc(L(c).name.replace(/^[^(]*\(?/, '').replace(')', ''))}</small>` : ''}</button>`;
  openSheet(`<h2 style="font-family:var(--ta)">${t('langs')}</h2><div class="muted">${t('chooseLangs')}</div>
    <h3 style="margin:10px 0 4px">${t('scheduled')}</h3><div>${sched.map(g => groups[g].filter(c => c !== 'ta').map(chip).join('')).join('')}</div>
    <h3 style="margin:10px 0 4px">${t('others')}</h3><div>${other.map(g => groups[g].map(chip).join('')).join('')}</div>
    <div class="row" style="margin-top:12px"><span class="muted" style="font-size:.75rem">* partial coverage</span><span class="grow"></span><button class="btn primary" onclick="closeSheet();route()">✓</button></div>`);
  $$('#sheet-root .chip').forEach(b => b.onclick = () => {
    const c = b.dataset.c; const i = S.langs.indexOf(c); if (i >= 0) S.langs.splice(i, 1); else S.langs.push(c);
    b.classList.toggle('sel'); saveS();
  });
}

// Every CICT translation of one kural, side by side — the "parallel translations" view.
async function viewCompare(n) {
  if (!(n >= 1 && n <= 1330)) return viewBrowse();
  const k = await kural(n); const cm = chMeta(chOf(n)); const m = D.meta;
  setTitle(`${t('compare')} · ${t('kural')} ${n}`, t('compareSub'));
  const groups = [];
  m.langOrder.forEach(c => {
    if (c === 'ta') return;
    const g = groups.find(x => x.group === L(c).group);
    if (g) g.codes.push(c); else groups.push({ group: L(c).group, codes: [c], scheduled: L(c).scheduled });
  });
  groups.sort((a, b) => (b.scheduled - a.scheduled) || L(a.codes[0]).name.localeCompare(L(b.codes[0]).name));
  const cell = c => {
    const tr = k.tr[c];
    const sel = S.langs.includes(c);
    return `<div class="cmp ${sel ? 'sel' : ''}">
      <div class="lang"><span class="nm ${scriptClass(c)}">${esc(L(c).native)}</span>
        <span class="kind">${esc(L(c).name)} · ${L(c).kind}</span><span class="grow"></span>
        ${tr ? `<button class="btn small cmp-play" data-code="${c}" aria-label="${esc(L(c).name)}">🔊</button>` : ''}
        <button class="btn small cmp-pick" data-code="${c}" aria-pressed="${sel}" title="${esc(t('selected'))}">${sel ? '★' : '☆'}</button></div>
      ${tr ? `<div class="tr-text ${scriptClass(c)} ${L(c).dir === 'rtl' ? 'rtl' : ''}"${dirAttr(c)}>${esc(tr[0])}${tr[1] ? `<span class="l2">${esc(tr[1])}</span>` : ''}</div>`
           : `<div class="muted">— ${esc(t('proseNA'))}</div>`}
      <div class="credit">${esc(L(c).credit)}</div></div>`;
  };
  render(`<div class="nav-pn pn-top">${n > 1 ? `<a class="btn" href="#/compare/${n - 1}">${t('prev')}</a>` : '<span></span>'}${n < 1330 ? `<a class="btn" href="#/compare/${n + 1}">${t('next')}</a>` : ''}</div>
  <div class="card">
    <div class="kural-head"><span class="n">${t('kural')} ${n}</span><a class="ch" href="#/k/${n}">${esc(cm.name)} · ${esc(cm.nameEn)}</a></div>
    ${coupletHTML(k)}
    <div class="actions"><button class="btn primary" id="c-recite">🔊 ${t('recite')}</button><a class="btn" href="#/k/${n}">📖 ${t('more')}</a><button class="btn" id="c-all">▶ ${t('playAll')}</button><button class="btn" id="c-stop">■ ${t('stop')}</button></div>
    <div class="muted" style="font-size:.78rem">${esc(D.meta.credits.publisher)}</div>
  </div>
  <div class="cmp-grid">${groups.map(g => g.codes.map(cell).join('')).join('')}</div>`);
  $('#c-recite').onclick = e => reciteKural(k, e.currentTarget);
  $('#c-stop').onclick = () => { queueStop = true; TTS.stop(); };
  $('#c-all').onclick = async e => {
    queueStop = false; const btn = e.currentTarget; btn.classList.add('playing');
    const list = ['ta', ...m.langOrder.filter(c => c !== 'ta' && k.tr[c])];
    for (const c of list) {
      if (queueStop) break;
      const el = $(`.cmp-play[data-code="${c}"]`); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      await new Promise(res => { c === 'ta' ? playPack('ta', n, `${k.l1} ${k.l2}`, 'ta', el, res) : speakTranslation(k, c, el, res); setTimeout(res, 25000); });
    }
    btn.classList.remove('playing');
  };
  $$('.cmp-play').forEach(b => b.onclick = e => speakTranslation(k, b.dataset.code, e.currentTarget));
  $$('.cmp-pick').forEach(b => b.onclick = () => {
    const c = b.dataset.code; const i = S.langs.indexOf(c); if (i >= 0) S.langs.splice(i, 1); else S.langs.push(c);
    saveS(); b.textContent = S.langs.includes(c) ? '★' : '☆'; b.setAttribute('aria-pressed', S.langs.includes(c));
    b.closest('.cmp').classList.toggle('sel', S.langs.includes(c));
  });
}
let queueStop = false;

// ── two-stream parallel reading (spec §7.1: "any two translation streams side by side") ──
async function viewParallel(n) {
  if (!(n >= 1 && n <= 133)) return viewBrowse();
  const ch = await chapter(n); const m = D.meta;
  const pick = S.parallelLang && L(S.parallelLang) ? S.parallelLang : firstLang();
  S.parallelLang = pick;
  setTitle(`${t('parallel')} · ${ch.name}`, `${t('adhigaram')} ${n} · ${ch.nameEn}`);
  const opts = m.langOrder.filter(c => c !== 'ta')
    .map(c => `<option value="${c}" ${c === pick ? 'selected' : ''}>${esc(L(c).native)}${L(c).name === L(c).native ? '' : ' — ' + esc(L(c).name)}</option>`).join('');
  render(`<div class="nav-pn pn-top">${n > 1 ? `<a class="btn" href="#/parallel/${n - 1}">${t('prev')}</a>` : '<span></span>'}${n < 133 ? `<a class="btn" href="#/parallel/${n + 1}">${t('next')}</a>` : ''}</div>
  <div class="card">
      <div class="row"><div class="grow"><h2 style="font-size:1.1rem">${esc(ch.name)} <span class="muted">· ${esc(ch.nameEn)}</span></h2>
      <div class="muted">${t('parallelHelp')}</div></div><a class="btn small" href="#/ch/${n}">☰</a></div>
      <div class="row" style="margin-top:8px"><span class="chip sel">தமிழ்</span><span class="muted">↔</span>
        <select id="par-lang" style="max-width:60%" aria-label="${esc(t('parallel'))}">${opts}</select></div>
    </div>
    <div class="card" style="padding:0;overflow:clip">
      <div class="par-head"><div>தமிழ்</div><div class="${scriptClass(pick)}">${esc(L(pick).native)}</div></div>
      ${ch.kurals.map(k => {
        const tr = k.tr[pick];
        return `<div class="par-row">
          <div class="par-n">${k.n}</div>
          <div class="par-a"><a href="#/k/${k.n}">${esc(k.l1)}<br>${esc(k.l2)}</a>
            ${S.showTranslit && k.tl ? `<div class="translit">${esc(k.tl[0])} ${esc(k.tl[1] || '')}</div>` : ''}</div>
          <div class="par-b ${scriptClass(pick)} ${L(pick).dir === 'rtl' ? 'rtl' : ''}"${dirAttr(pick)}>${tr ? esc(tr[0]) + (tr[1] ? '<br>' + esc(tr[1]) : '') : '<span class="muted">—</span>'}</div>
          <div class="par-p"><button class="btn small par-play" data-n="${k.n}" aria-label="play ${k.n}">🔊</button></div>
        </div>`; }).join('')}
    </div>
    <div class="muted" style="font-size:.75rem;margin:0 4px 10px">${esc(L(pick).credit)}</div>`);
  $('#par-lang').onchange = e => { S.parallelLang = e.target.value; saveS(); viewParallel(n); };
  $$('.par-play').forEach(b => b.onclick = e => {
    const k = ch.kurals.find(x => x.n === +b.dataset.n);
    if (TTS.curBtn === e.currentTarget) { TTS.stop(); return; }
    playPack('ta', k.n, k.l1 + ' ' + k.l2, 'ta', e.currentTarget, () => speakTranslation(k, pick, e.currentTarget));
  });
}

// ── spaced repetition (SM-2 lite) ────────────────────────────────────────────
const DAY = 864e5;
const dayNo = () => Math.floor(Date.now() / DAY);
function srsAdd(n) {
  if (!S.srs[n]) S.srs[n] = { due: dayNo(), ivl: 0, ease: 2.5, reps: 0, lapses: 0 };
  saveS();
}
function srsApply(n, q) {                 // q: 0 again · 1 hard · 2 good · 3 easy — mutation only, no save
  const c = S.srs[n] || { due: dayNo(), ivl: 0, ease: 2.5, reps: 0, lapses: 0 };
  if (q === 0) { c.ivl = 0; c.lapses++; c.ease = Math.max(1.3, c.ease - 0.2); }
  else {
    c.reps++;
    if (c.ivl === 0) c.ivl = q === 1 ? 1 : q === 2 ? 2 : 4;
    else c.ivl = Math.max(1, Math.round(c.ivl * (q === 1 ? 1.2 : q === 2 ? c.ease : c.ease * 1.3)));
    c.ease = Math.min(3.2, Math.max(1.3, c.ease + (q === 1 ? -0.15 : q === 3 ? 0.1 : 0)));
  }
  c.due = dayNo() + c.ivl;
  S.srs[n] = c;
}
function srsGrade(n, q) { srsApply(n, q); saveS(); }
const srsDue = () => Object.keys(S.srs).map(Number).filter(n => S.srs[n].due <= dayNo()).sort((a, b) => a - b);

async function viewStudy() {
  setTitle(t('study'), 'spaced repetition · மனப்பாடம்');
  const due = srsDue(); const all = Object.keys(S.srs).map(Number);
  const learned = all.filter(n => (S.srs[n].ivl || 0) >= 21).length;
  if (!all.length) {
    render(`<div class="card"><h2>🧠 ${t('study')}</h2><p class="muted">${t('srsEmpty')}</p>
      <div class="row"><a class="btn primary" href="#/k/${dailyN()}">${t('daily')}</a><a class="btn" href="#/browse">${t('tab.read')}</a></div></div>`);
    return;
  }
  if (!due.length) {
    const next = Math.min.apply(null, all.map(n => S.srs[n].due)) - dayNo();
    const rows = await Promise.all(all.slice(0, 40).map(kural));
    render(`<div class="card"><h2>🎉</h2><p>${t('srsDone')}</p>
      <div class="stat"><div><b>${all.length}</b><span>${t('study')}</span></div><div><b>${learned}</b><span>${t('srsStats')}</span></div><div><b>${next}</b><span>days</span></div></div></div>
      <div class="card list">${rows.map(k => kuralLinkRow(k, firstLang())).join('')}</div>`);
    return;
  }
  const n = due[0]; const k = await kural(n); const cm = chMeta(chOf(n));
  const f = firstLang();
  render(`<div class="card">
      <div class="row"><span class="chip sel">${due.length} ${t('srsDue')}</span><span class="grow"></span><span class="muted">${all.length} · ${learned} ${t('srsStats')}</span></div>
      <div class="kural-head" style="margin-top:8px"><span class="n">${t('kural')} ${n}</span><span class="ch">${esc(cm.name)}</span></div>
      <div id="srs-q">${k.tr[f] ? `<div class="tr-text ${scriptClass(f)} ${L(f).dir === 'rtl' ? 'rtl' : ''}"${dirAttr(f)}>${esc(k.tr[f].filter(Boolean).join(' '))}</div>` : `<div class="prose">${esc(k.prose.ta_mv)}</div>`}</div>
      <div id="srs-a" hidden>${coupletHTML(k)}</div>
      <div class="actions" id="srs-actions"><button class="btn primary" id="srs-show">👁 ${t('srsShow')}</button></div>
    </div>`);
  $('#srs-show').onclick = () => {
    $('#srs-a').hidden = false;
    $('#srs-actions').innerHTML = `<button class="btn" data-q="0">${t('again')}</button><button class="btn" data-q="1">${t('hard')}</button>
      <button class="btn primary" data-q="2">${t('good')}</button><button class="btn" data-q="3">${t('easy')}</button>
      <button class="btn" id="srs-say">🔊</button><a class="btn" href="#/k/${n}">📖</a>`;
    $('#srs-say').onclick = e => reciteKural(k, e.currentTarget);
    $$('#srs-actions [data-q]').forEach(b => b.onclick = () => { srsGrade(n, +b.dataset.q); TTS.stop(); viewStudy(); });
  };
}

// ── shareable image card ─────────────────────────────────────────────────────
async function shareCard(k, cm, btn) {
  const old = btn.textContent; btn.textContent = '⏳'; btn.disabled = true;
  try {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const W = 1080, H = 1080;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#faf7f2'); g.addColorStop(1, '#f0e6d4');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = '#8f2f1c'; x.fillRect(0, 0, W, 16);
    x.fillStyle = '#c8961e'; x.fillRect(0, 16, W, 5);
    x.textAlign = 'center';
    const wrap = (text, font, maxW) => {
      x.font = font; const words = String(text).split(/\s+/); const lines = []; let cur = '';
      for (const w of words) {
        const tst = cur ? cur + ' ' + w : w;
        if (x.measureText(tst).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tst;
      }
      if (cur) lines.push(cur);
      return lines;
    };
    let y = 170;
    x.fillStyle = '#8f2f1c'; x.font = '700 44px "Noto Sans Tamil",sans-serif';
    x.fillText('குறள் ' + k.n, W / 2, y); y += 50;
    x.fillStyle = '#6f6459'; x.font = '400 28px "Noto Sans Tamil",sans-serif';
    x.fillText(cm.name + ' · ' + cm.nameEn, W / 2, y); y += 90;
    const VF = '500 54px "Noto Serif Tamil","Noto Sans Tamil",serif';
    x.fillStyle = '#332a1e';
    for (const ln of [k.l1, k.l2]) {
      for (const seg of wrap(ln, VF, W - 150)) { x.font = VF; x.fillText(seg, W / 2, y); y += 74; }
    }
    const f = firstLang(); const tr = k.tr[f];
    if (tr) {
      y += 20;
      x.strokeStyle = '#d9cdb8'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(W / 2 - 110, y); x.lineTo(W / 2 + 110, y); x.stroke();
      y += 56; x.fillStyle = '#4a3b2a';
      const fam = L(f).script === 'Tamil' ? '"Noto Sans Tamil"'
        : L(f).script === 'Latin' ? 'system-ui'
        : '"Noto Sans ' + L(f).script + '"';
      const TF = '400 36px ' + fam + ',system-ui,sans-serif';
      for (const seg of wrap(tr.filter(Boolean).join(' '), TF, W - 190).slice(0, 5)) { x.font = TF; x.fillText(seg, W / 2, y); y += 52; }
      x.fillStyle = '#6f6459'; x.font = '400 22px system-ui,sans-serif';
      x.fillText(L(f).name, W / 2, y + 12);
    }
    const logo = $('.top .logo');
    if (logo && logo.complete && logo.naturalWidth) { try { x.drawImage(logo, W / 2 - 34, H - 210, 68, 68); } catch (e) { } }
    x.fillStyle = '#8f2f1c'; x.font = '700 28px "Noto Sans Tamil",sans-serif';
    x.fillText('திருக்குறள் — 22 மொழிகள்', W / 2, H - 108);
    x.fillStyle = '#6f6459'; x.font = '400 22px system-ui,sans-serif';
    x.fillText('செம்மொழித் தமிழாய்வு மத்திய நிறுவனம் · Central Institute of Classical Tamil', W / 2, H - 66);
    if (NATIVE_SHARE) {
      // hand the PNG to the Android share sheet as base64 — no blob URLs in the WebView
      const b64 = cv.toDataURL('image/png').split(',')[1];
      try { NATIVE_SHARE.png('kural-' + k.n + '.png', b64, kuralText(k, cm)); btn.textContent = old; btn.disabled = false; return; } catch (e) { }
    }
    const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
    const file = new File([blob], 'kural-' + k.n + '.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'திருக்குறள் ' + k.n, text: kuralText(k, cm) });
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      toast('✓');
    }
  } catch (e) { toast('✕ ' + e.message); }
  btn.textContent = old; btn.disabled = false;
}

// Short label for a search stream: 'ta' → த, 'translit' → Aa, 'prose-ta' → த·உரை
function streamTag(c) {
  if (c === 'translit') return 'Aa';
  const base = c.replace('prose-', '');
  const l = L(base);
  return (l ? l.short : base) + (c.startsWith('prose-') ? '·' + (S.ui === 'ta' ? 'உரை' : 'prose') : '');
}

// ───────────────────────────── search ─────────────────────────────
let searchTimer;
async function viewSearch(q0) {
  setTitle(t('search'), 'தேடல் · 22 மொழிகள்');
  render(`<div class="search-box"><input type="search" id="q" placeholder="${esc(t('searchPh'))}" value="${esc(q0)}" autocomplete="off" enterkeyhint="search"></div>
    <div class="row" id="lang-filter"></div><div class="row" style="margin:2px 4px"><a class="chip" id="verify-link" href="#/verify">✔ ${t('verify')}</a></div><div id="results"></div>`);
  const input = $('#q'); input.focus();
  const m = D.meta;
  let filter = 'auto';
  $('#lang-filter').innerHTML = `<button class="chip sel" data-f="auto" title="${esc(t('autoScriptHelp'))}">${t('autoScript')}</button><button class="chip" data-f="all">${t('allLangs')}</button>`
    + ['ta', ...S.langs.filter(c => c !== 'ta')].map(c => `<button class="chip ${scriptClass(c)}" data-f="${c}">${esc(L(c).native)}</button>`).join('');
  $$('#lang-filter .chip').forEach(b => b.onclick = () => { filter = b.dataset.f; $$('#lang-filter .chip').forEach(x => x.classList.toggle('sel', x === b)); run(); });
  const run = async () => {
    const q = input.value.trim(); location.replace('#/search?q=' + encodeURIComponent(q));
    const vl = $('#verify-link'); if (vl) vl.href = '#/verify?q=' + encodeURIComponent(q);
    const res = $('#results'); if (!res) return;
    if (!q) { res.innerHTML = ''; return; }
    if (/^\d+$/.test(q) && +q >= 1 && +q <= 1330) { location.hash = '#/k/' + (+q); return; }
    res.innerHTML = `<div class="muted">${t('loadingIdx')}</div>`;
    const want = searchTargets(q, filter);
    const idx = {};
    await Promise.all(want.map(async c => { try { idx[c] = await sindex(c); } catch { } }));
    if (input.value.trim() !== q) return;
    const nq = stripPunct(q); const hits = new Map();
    outer:
    for (const [c, arr] of Object.entries(idx)) {
      for (const [n, a, b] of arr) {
        const s = a + ' ' + (b || '');
        const ns = stripPunct(s);
        const at = ns.indexOf(nq);
        if (at >= 0) { const h = hits.get(n) || []; if (h.length < 4) h.push({ c, s, at }); hits.set(n, h); }
        if (hits.size > 300) break outer;
      }
    }
    const ta = await sindex('ta');
    const ns = [...hits.keys()].sort((x, y) => x - y);
    if (!ns.length) { res.innerHTML = `<div class="card muted">${t('noresults')}</div>`; return; }
    const snippet = (s, at) => { const raw = s; const i = norm(raw).indexOf(norm(q)); if (i < 0) return esc(raw); const st = Math.max(0, i - 40); return (st ? '…' : '') + esc(raw.slice(st, i)) + '<mark>' + esc(raw.slice(i, i + q.length)) + '</mark>' + esc(raw.slice(i + q.length, i + q.length + 80)); };
    const scanned = Object.keys(idx).length;
    res.innerHTML = `<div class="muted" style="margin:4px">${ns.length} ${t('results')} · <span title="${esc(t('scannedHelp'))}">${scanned} ${t('scanned')}</span>${filter === 'auto' && scanned < 8 ? ` · <a href="#" id="widen">${t('searchAll')}</a>` : ''}</div><div class="card list">` + ns.slice(0, 150).map(n => {
      const [, l1, l2] = ta[n - 1];
      return `<a href="#/k/${n}" class="result"><span class="num">${n}</span><span class="tx"><span class="l">${esc(l1)} ${esc(l2)}</span>${hits.get(n).filter(h => h.c !== 'ta').map(h => `<span class="tr ${scriptClass(h.c.replace('prose-', ''))}"${dirAttr(h.c.replace('prose-', ''))}><span class="lang-tag">${esc(streamTag(h.c))}</span>${snippet(h.s, h.at)}</span>`).join('')}</span></a>`;
    }).join('') + '</div>';
  };
  view().addEventListener('click', e => {
    if (e.target && e.target.id === 'widen') { e.preventDefault(); filter = 'all'; $$('#lang-filter .chip').forEach(x => x.classList.toggle('sel', x.dataset.f === 'all')); run(); }
  });
  input.oninput = () => { clearTimeout(searchTimer); searchTimer = setTimeout(run, 250); };
  input.onkeydown = e => { if (e.key === 'Enter') run(); };
  if (q0) run();
}

// ───────────────────────────── practice (யாப்பு) ─────────────────────────────
async function viewPracticeIndex() {
  setTitle(t('practice'), 'யாப்பு · ஓதல் · மனப்பாடம்');
  const n = dailyN(); const k = await kural(n);
  render(`${learnCardHTML('any')}<div class="card"><h2>${t('daily')}</h2>${coupletHTML(k)}<div class="actions"><a class="btn primary" href="#/practice/${n}">🎵 ${t('start')}</a></div></div>
  <div class="card"><h2>🏆 ${t('test')}</h2><div class="muted">${t('testSub')}</div><div class="row" style="margin-top:8px"><a class="btn primary" href="#/test">🏆 ${t('test')}</a><a class="btn" href="#/test/board">📊 ${t('testBoard')}</a></div></div>
  ${SINGLE ? '' : `<div class="card"><h2>🧩 ${t('kattam')}</h2><div class="muted">${t('kattamSub')}</div><div class="row" style="margin-top:8px"><a class="btn primary" href="kattam/index.html">🧩 ${t('kattamGo')}</a></div></div>`}
  <div class="card"><h2>${t('kural')}</h2><div class="row"><input type="text" inputmode="numeric" id="pn" placeholder="1–1330" style="max-width:140px"><button class="btn" id="pgo">→</button><a class="btn" href="#/practice/${1 + Math.floor(Math.random() * 1330)}">🎲 ${t('random')}</a></div></div>
  <div class="card"><h2>🧠 ${t('study')}</h2><div class="muted">spaced repetition</div>
    <div class="stat" style="margin-top:8px"><div><b>${srsDue().length}</b><span>${t('srsDue')}</span></div><div><b>${Object.keys(S.srs).length}</b><span>${t('study')}</span></div></div>
    <div class="row" style="margin-top:8px"><a class="btn primary" href="#/study">${t('start')}</a></div></div>
  <div class="card"><h2>${t('bookmarks')}</h2>${S.bookmarks.length ? S.bookmarks.map(b => `<a class="chip" href="#/practice/${b}">${b}</a>`).join('') : `<span class="muted">${t('noBookmarks')}</span>`}</div>
  <div class="card"><h2>${t('memorised')}</h2><div class="stat"><div><b>${S.memorised.length}</b><span>/ 1330</span></div></div>${S.memorised.slice(-40).map(b => `<a class="chip" href="#/k/${b}">${b}</a>`).join('')}</div>`);
  $('#pgo').onclick = () => { const v = +$('#pn').value; if (v >= 1 && v <= 1330) location.hash = '#/practice/' + v; };
  $('#pn').onkeydown = e => { if (e.key === 'Enter') $('#pgo').click(); };
}

const Beat = {
  ctx: null, timers: [], running: false,
  ac() { return this.ctx || (this.ctx = new (window.AudioContext || window.webkitAudioContext)()); },
  tone(at, dur, hi) {
    const ac = this.ac(); const o = ac.createOscillator(); const g = ac.createGain();
    o.type = 'sine'; o.frequency.value = hi ? 660 : 440; g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.5, at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(0.05, dur * 0.9));
    o.connect(g).connect(ac.destination); o.start(at); o.stop(at + dur);
  },
  stop() { this.running = false; this.timers.forEach(clearTimeout); this.timers = []; TTS.stop(); },
};

async function viewPractice(n, mode) {
  if (!(n >= 1 && n <= 1330)) return viewPracticeIndex();
  const k = await kural(n); const cm = chMeta(chOf(n)); const y = k.yappu;
  setTitle(`${t('practice')} · ${t('kural')} ${n}`, cm.name);
  Beat.stop();
  const seers = []; y.lines.forEach((ln, li) => ln.seers.forEach(s => seers.push({ ...s, li })));
  const asais = []; seers.forEach((s, gi) => s.asai.forEach(a => asais.push({ gi, k: a.k, m: matra(a) })));
  const modes = [['listen', t('listen')], ['tap', t('tap')], ['recite', t('reciteCheck')], ['memorise', t('memorise')]];
  render(`<div class="nav-pn pn-top">${n > 1 ? `<a class="btn" href="#/practice/${n - 1}/${mode}">${t('prev')}</a>` : '<span></span>'}<a class="btn" href="#/k/${n}">📖</a>${n < 1330 ? `<a class="btn" href="#/practice/${n + 1}/${mode}">${t('next')}</a>` : ''}</div>
  <div class="card">
    <div class="kural-head"><span class="n">${t('kural')} ${n}</span><a class="ch" href="#/k/${n}">${esc(cm.name)}</a></div>
    <div id="cloze">${coupletHTML(k, { cls: 'cloze' })}</div>
    <div class="tabs-inline">${modes.map(([m, l]) => `<a href="#/practice/${n}/${m}"><button class="${m === mode ? 'on' : ''}">${l}</button></a>`).join('')}</div>
    <div id="pr-body"></div>
  </div>
  <div class="card"><h2>${t('metre')}</h2><div id="scan">${scanHTML(y, { beats: true })}</div></div>`);
  const body = $('#pr-body');
  const hl = gi => { $$('#scan .seer').forEach(el => el.classList.toggle('cur', +el.dataset.gi === gi)); };
  const beatEls = () => $$('#scan .beat');
  const tempoRow = () => `<div class="row"><label style="font-size:.85rem">${t('tempo')}: <b id="tempo-v">${S.tempo}</b> ms</label></div><input type="range" id="tempo" min="160" max="640" step="20" value="${S.tempo}">`;
  const wireTempo = () => { const r = $('#tempo'); if (r) r.oninput = () => { S.tempo = +r.value; $('#tempo-v').textContent = r.value; localStorage.setItem('kural.settings', JSON.stringify(S)); }; };

  if (mode === 'listen') {
    body.innerHTML = `${tempoRow()}<div class="row"><button class="btn primary" id="go">▶ ${t('start')}</button><button class="btn" id="stop">■ ${t('stop')}</button><label class="btn"><input type="checkbox" id="ww" checked> ${t('withWords')}</label><button class="btn" id="full">🔊 ${t('recite')}</button></div><div class="muted" style="font-size:.8rem;margin-top:6px">${t('legend')}</div>`;
    wireTempo();
    $('#full').onclick = e => reciteKural(k, e.currentTarget);
    $('#stop').onclick = () => { Beat.stop(); hl(-1); };
    $('#go').onclick = async () => {
      Beat.stop(); Beat.running = true; const ac = Beat.ac(); await ac.resume();
      const unit = S.tempo / 1000; let tm = ac.currentTime + 0.15; let bi = 0; const bels = beatEls();
      const withWords = $('#ww').checked;
      seers.forEach((s, gi) => {
        const startMs = (tm - ac.currentTime) * 1000;
        Beat.timers.push(setTimeout(() => { if (!Beat.running) return; hl(gi); if (withWords) TTS.speak(s.w, 'ta'); }, startMs));
        s.asai.forEach(a => {
          const m = matra(a);
          if (a.k === 'N') { Beat.tone(tm, unit * m, false); const b = bels[bi++]; Beat.timers.push(setTimeout(() => b && b.classList.add('on'), (tm - ac.currentTime) * 1000)); tm += unit * m; }
          else { const half = unit * m / 2; Beat.tone(tm, half, true); Beat.tone(tm + half, half, true); const b1 = bels[bi++], b2 = bels[bi++]; Beat.timers.push(setTimeout(() => b1 && b1.classList.add('on'), (tm - ac.currentTime) * 1000)); Beat.timers.push(setTimeout(() => b2 && b2.classList.add('on'), (tm + half - ac.currentTime) * 1000)); tm += unit * m; }
        });
        tm += unit * 0.35; // foot gap
        if (gi < seers.length - 1 && seers[gi + 1].li !== s.li) tm += unit * 0.8;
      });
      Beat.timers.push(setTimeout(() => { hl(-1); bels.forEach(b => b.classList.remove('on')); Beat.running = false; }, (tm - ac.currentTime) * 1000 + 200));
    };
  }

  if (mode === 'tap') {
    body.innerHTML = `<div class="muted" style="font-size:.85rem">${t('tapHint')}</div>
      <div class="row" style="margin:10px 0"><button class="btn primary" id="tapb" style="font-size:1.2rem;padding:18px 28px">👆 ${t('tapBtn')}</button><button class="btn" id="reset">↺ ${t('again')}</button><span class="grow"></span><span class="muted"><span id="tc">0</span>/${asais.length}</span></div>
      <div id="tap-out"></div>`;
    let taps = [];
    const bels = beatEls();
    const onTap = () => {
      if (taps.length >= asais.length) return;
      const now = performance.now(); taps.push(now);
      const i = taps.length - 1; hl(asais[i].gi);
      let bi = 0; for (let j = 0; j < i; j++) bi += asais[j].k === 'N' ? 1 : 2;
      if (asais[i].k === 'N') bels[bi] && bels[bi].classList.add('on'); else { bels[bi] && bels[bi].classList.add('on'); bels[bi + 1] && bels[bi + 1].classList.add('on'); }
      $('#tc').textContent = taps.length;
      if (taps.length === asais.length) finish();
    };
    const finish = () => {
      const got = []; for (let i = 1; i < taps.length; i++) got.push(taps[i] - taps[i - 1]);
      const expM = asais.slice(0, -1).map(a => a.m); // interval i ~ duration of asai i
      const T = got.reduce((a, b) => a + b, 0); const M = expM.reduce((a, b) => a + b, 0); const unit = T / M;
      const errs = got.map((g, i) => Math.abs(g - expM[i] * unit) / (expM[i] * unit));
      const score = Math.round(100 * errs.reduce((a, e) => a + Math.max(0, 1 - e), 0) / errs.length);
      const mx = Math.max(...got, ...expM.map(m => m * unit));
      $('#tap-out').innerHTML = `<div class="row"><span class="score">${score}</span><span class="muted">/100 · ${t('score')} · ${Math.round(unit)} ms / மாத்திரை</span></div>
        <div class="bars">${got.map((g, i) => `<i class="exp" style="height:${Math.round(100 * expM[i] * unit / mx)}%" title="expected ${Math.round(expM[i] * unit)}"></i><i class="got" style="height:${Math.round(100 * g / mx)}%" title="you ${Math.round(g)}"></i>`).join('')}</div>
        <div class="legend">blue = expected (மாத்திரை × ${Math.round(unit)} ms) · red = your taps</div>`;
      hl(-1);
    };
    $('#tapb').onclick = onTap;
    const key = e => { if (e.code === 'Space' && location.hash.includes('/tap')) { e.preventDefault(); onTap(); } };
    document.addEventListener('keydown', key, { once: false });
    $('#reset').onclick = () => { taps = []; $('#tc').textContent = 0; $('#tap-out').innerHTML = ''; bels.forEach(b => b.classList.remove('on')); hl(-1); };
    window.addEventListener('hashchange', () => document.removeEventListener('keydown', key), { once: true });
  }

  if (mode === 'recite') {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) body.innerHTML = `<div class="muted">${t('srNo')}</div><div class="row" style="margin-top:8px"><button class="btn" id="full">🔊 ${t('recite')}</button></div>`;
    else body.innerHTML = `<div class="row"><button class="btn primary" id="sr">🎤 ${t('srStart')}</button><button class="btn" id="full">🔊 ${t('recite')}</button></div><div id="sr-out" style="margin-top:8px"></div>`;
    $('#full').onclick = e => reciteKural(k, e.currentTarget);
    if (SR) {
      const btn = $('#sr');
      btn.onclick = () => {
        const r = new SR(); r.lang = 'ta-IN'; r.interimResults = true; r.continuous = false; r.maxAlternatives = 3;
        btn.textContent = '🎤 ' + t('srListening'); btn.disabled = true;
        let finalTx = '';
        r.onresult = ev => { let tx = ''; for (const res of ev.results) tx += res[0].transcript + ' '; finalTx = tx; $('#sr-out').innerHTML = `<div class="prose">${esc(tx)}</div>`; };
        r.onend = () => {
          btn.textContent = '🎤 ' + t('srStart'); btn.disabled = false;
          const heard = stripPunct(finalTx).replace(/\s+/g, '');
          const words = [...$$('.cloze .w')];
          let ok = 0;
          words.forEach(w => { const tok = stripPunct(w.textContent).replace(/\s+/g, ''); const hit = tok && heard.includes(tok); w.classList.toggle('hl', !!hit); if (hit) ok++; });
          $('#sr-out').innerHTML += `<div class="row"><span class="score">${ok}/${words.length}</span><span class="muted">${t('matched')}</span></div>`;
        };
        r.onerror = () => { btn.textContent = '🎤 ' + t('srStart'); btn.disabled = false; toast('🎤 ✕'); };
        r.start();
      };
    }
  }

  if (mode === 'memorise') {
    const words = $$('.cloze .w'); let level = 1; const total = words.length;
    const order = words.map((_, i) => i).sort((a, b) => ((a * 7919 + n) % 31) - ((b * 7919 + n) % 31));
    const apply = () => { words.forEach(w => w.classList.remove('hidden-w')); order.slice(0, Math.min(level, total)).forEach(i => words[i].classList.add('hidden-w')); $('#lv').textContent = `${Math.min(level, total)}/${total}`; };
    const known = S.memorised.includes(n);
    body.innerHTML = `<div class="row"><button class="btn" id="more">🙈 ${t('hideMore')}</button><button class="btn" id="show">👁 ${t('reveal')}</button><span class="muted" id="lv"></span><span class="grow"></span><button class="btn ${known ? 'on' : ''}" id="know">${known ? '✓ ' : ''}${t('iKnow')}</button><button class="btn" id="full">🔊</button></div>`;
    apply();
    words.forEach(w => w.onclick = () => w.classList.remove('hidden-w'));
    $('#more').onclick = () => { level = Math.min(total, level + 1); apply(); };
    $('#show').onclick = () => { words.forEach(w => w.classList.remove('hidden-w')); };
    $('#full').onclick = e => reciteKural(k, e.currentTarget);
    $('#know').onclick = () => { const i = S.memorised.indexOf(n); if (i >= 0) S.memorised.splice(i, 1); else S.memorised.push(n); saveS(); viewPractice(n, mode); };
  }
}

// ───────────────────────────── மனப்பாடத் தேர்வு · recitation test ─────────────────────────────
// A school-contest layer over the couplets already in the app; it needs no new data. Blanks are
// whitespace tokens of the printed line — what a contestant memorises — and the metre layer lends
// each token its சீர் class so the distractors scan alike. Where the scanner's split differs from the
// printed words (51 lines) the blanks are labelled சொல் rather than சீர், and tokens that are bare
// fragments never become blanks. Kurals with an unscannable line (K347/434/651/1117) or a broken
// token (K408 "பட் ட") are not sampled at all. The next-line / chapter / number questions draw on the
// same range; the typed question is judged on the letters (spacing and punctuation ignored), with
// the word diff shown only as feedback. Results live in S.test per range key; a certificate is drawn
// on a canvas once an auto-graded test of at least TEST_N questions reaches TEST_PASS. The drill is
// deliberately self-assessed and never feeds a certificate.

const TEST_PASS = 0.8, TEST_N = 10;
const PUBLIC_URL = 'https://cictdl.github.io/index.html/kural-app/';
const appUrl = () => (IS_ANDROID_APP || SINGLE || !location.protocol.startsWith('http')) ? PUBLIC_URL : location.href.split('#')[0];
const TEST = { key: '', qs: [], i: 0, t0: 0, lv: 2, tick: 0, done: null, R: null, seed: '', pausedAt: 0 };
const DRILL = { key: '', ns: [], i: 0, ok: [], no: [], done: false, R: null };
const rangeN = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
const chNs = c => rangeN(chMeta(c).start, chMeta(c).end);
const tWord = w => stripPunct(w).replace(/\s+/g, '');          // comparison form of a token
const tPunct = w => (String(w).match(/[.,;:!?]+$/) || [''])[0]; // trailing punctuation stays outside a blank
const shuffle = (a, rnd = Math.random) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n, rnd = Math.random) => shuffle(a.slice(), rnd).slice(0, n);
// A class can share one paper: the same சுற்று எண் + range + level seeds every choice below.
function fnv1a(str) { let h = 0x811c9dc5; for (const ch of String(str)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const seedOk = v => /^\d{4}$/.test(String(v || ''));
const fmtSecs = s => `${Math.floor(s / 60)}:${pad(s % 60, 2)}`;
const fmt = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
const chName = cm => S.ui === 'ta' ? cm.name : `${cm.name} · ${cm.nameEn}`;
const refCode = s => fnv1a(s).toString(36).toUpperCase().padStart(7, '0').slice(-6);
function levenshtein(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
function shareText(title, text) {
  if (NATIVE_SHARE) { try { NATIVE_SHARE.text(title, text); return; } catch (e) { } }
  if (navigator.share) navigator.share({ title, text }).catch(() => { });
  else navigator.clipboard.writeText(text).then(() => toast('✓ ' + t('copy')));
}
async function sharePNG(dataUrl, filename, title, text) {
  if (NATIVE_SHARE) { try { NATIVE_SHARE.png(filename, dataUrl.split(',')[1], text); return; } catch (e) { } }
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title, text });
  else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); toast('✓'); }
}
function wrapText(x, text, font, maxW) {
  x.font = font; const words = String(text).split(/\s+/); const lines = []; let cur = '';
  for (const w of words) { const tst = cur ? cur + ' ' + w : w; if (x.measureText(tst).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tst; }
  if (cur) lines.push(cur);
  return lines;
}

// Range specs: ch-12 · r-1-100 · pal-1 · iyal-1-3 · memo (the reader's memorised list) · book.
// nameTa is fixed Tamil (used on the certificate and in share text), name follows the UI language.
function testRange(spec) {
  const m = D.meta; const s = String(spec || ''); let x, r = null;
  if (s === 'memo') r = { key: s, ns: S.memorised.slice().sort((a, b) => a - b), nameTa: 'மனப்பாடம் செய்த குறள்கள்', nameEn: 'Memorised couplets' };
  else if (s === 'book') r = { key: s, ns: rangeN(1, 1330), nameTa: 'முழு நூல்', nameEn: 'The whole book' };
  else if ((x = s.match(/^ch-(\d+)$/)) && +x[1] >= 1 && +x[1] <= 133) { const c = +x[1], cm = chMeta(c); r = { key: `ch-${c}`, ns: chNs(c), ch: c, nameTa: `அதிகாரம் ${c} · ${cm.name}`, nameEn: `Chapter ${c} · ${cm.nameEn}` }; }
  else if ((x = s.match(/^r-(\d+)-(\d+)$/))) { let a = clamp(+x[1], 1, 1330), b = clamp(+x[2], 1, 1330); if (a > b) [a, b] = [b, a]; r = { key: `r-${a}-${b}`, ns: rangeN(a, b), nameTa: `குறள் ${a}–${b}`, nameEn: `Kurals ${a}–${b}` }; }
  else if ((x = s.match(/^pal-([123])$/))) { const p = m.pals[+x[1] - 1]; r = { key: s, ns: p.iyals.flatMap(i => i.chapters).flatMap(chNs), nameTa: p.name, nameEn: p.nameEn }; }
  else if ((x = s.match(/^iyal-([123])-(\d+)$/))) { const p = m.pals[+x[1] - 1]; const iy = p.iyals.find(i => i.num === +x[2]); if (iy) r = { key: s, ns: iy.chapters.flatMap(chNs), nameTa: `${p.name} · ${iy.name}`, nameEn: `${p.nameEn} · ${iy.nameEn}` }; }
  if (r) r.name = S.ui === 'ta' ? r.nameTa : `${r.nameTa} · ${r.nameEn}`;
  return r;
}
// Printed tokens of a couplet: [{w, cls, li}]. cls comes from the metre layer only where its split
// matches the printed words token for token; otherwise it is '' and distractors match on length.
function testTokens(k) {
  const out = [];
  [k.l1, k.l2].forEach((line, li) => {
    const toks = line.split(/\s+/).filter(Boolean);
    const ln = k.yappu && k.yappu.lines[li];
    const seers = ln && !ln.err && ln.seers ? ln.seers : null;
    const ok = !!seers && seers.length === toks.length && seers.every((s, i) => tWord(s.w) === tWord(toks[i]));
    toks.forEach((w, i) => out.push({ w, cls: ok ? seers[i].cls : '', li }));
  });
  return out;
}
// A token may be blanked when the metre layer vouches for it as a சீர், or when it is at least a
// four-letter word; bare fragments such as "இவ்" or "பட்" never become blanks.
const blankable = (toks, j) => !!toks[j].cls || tWord(toks[j].w).length >= 4;
const testable = k => !(k.yappu && k.yappu.lines.some(l => l.err)) && testTokens(k).every(x => tWord(x.w).length >= 2);
function mcqOpts(answer, others, rnd) { const opts = shuffle([answer, ...others], rnd); return { opts, ans: opts.indexOf(answer) }; }
function uniq3(list, not, rnd) { const seen = new Set([not]); const out = []; for (const v of shuffle(list.slice(), rnd)) { if (seen.has(v)) continue; seen.add(v); out.push(v); if (out.length === 3) break; } return out; }
async function buildTest(R, lv, seed) {
  const rnd = seedOk(seed) ? mulberry32(fnv1a(`${seed}|${R.key}|${lv}`)) : Math.random;
  let ns = pick(R.ns, Math.min(TEST_N + 4, R.ns.length), rnd);     // a few spares for kurals the test must skip
  const chs = [...new Set(ns.map(chOf))];
  await Promise.all(chs.map(chapter));                              // the sampled chapters also feed the distractors
  const pool = chs.flatMap(c => D.ch[c].kurals);
  const byN = n => pool.find(x => x.n === n);
  ns = ns.filter(n => testable(byN(n))).slice(0, TEST_N);
  const words = pool.filter(testable).flatMap(k => testTokens(k).map(x => ({ ...x, n: k.n })));
  const rangeChs = [...new Set(R.ns.map(chOf))];
  const chQ = rangeChs.length >= 4;                                 // across chapters ask "which அதிகாரம்", within one ask the number
  const kinds = lv === 1 ? ['fill1', 'fill1', 'fill1', 'fill1', 'fill1', 'fill1', 'next', 'next', 'num', 'num']
    : lv === 2 ? ['fill2', 'fill2', 'fill2', 'fill2', 'fill2', 'next', 'next', 'next', 'num', 'num']
      : ['type', 'type', 'type', 'type', 'type', 'type', 'fill2', 'fill2', 'num', 'num'];
  const kk = shuffle(kinds, rnd).slice(0, ns.length);
  return ns.map((n, i) => {
    const k = byN(n); const kind = kk[i]; const c = chOf(n);
    const mates = D.ch[c].kurals.filter(x => x.n !== n);
    if (kind === 'next') return { kind, k, ...mcqOpts(k.l2, uniq3(mates.map(x => x.l2), k.l2, rnd), rnd) };
    if (kind === 'num') {
      if (chQ) return { kind: 'ch', k, ...mcqOpts(c, uniq3(rangeChs, c, rnd), rnd) };
      return { kind, k, ...mcqOpts(n, uniq3(mates.map(x => x.n), n, rnd), rnd) };
    }
    if (kind === 'type') return { kind, k };
    const toks = testTokens(k); const cnt = kind === 'fill2' ? 2 : 1;
    const idx = pick(toks.map((_, j) => j).filter(j => blankable(toks, j)), cnt).sort((a, b) => a - b);
    const blanks = idx.map(j => {
      const a = toks[j]; const aw = tWord(a.w);
      let cand = words.filter(w => w.n !== n && tWord(w.w) !== aw && (a.cls ? w.cls === a.cls : Math.abs(tWord(w.w).length - aw.length) <= 2));
      if (cand.length < 3) cand = words.filter(w => w.n !== n && tWord(w.w) !== aw);
      const seen = new Set([aw]); const opts = [];
      for (const w of shuffle(cand, rnd)) { const cw = tWord(w.w); if (seen.has(cw)) continue; seen.add(cw); opts.push(stripPunct(w.w)); if (opts.length === 3) break; }
      return { j, seer: !!a.cls, ...mcqOpts(stripPunct(a.w), opts, rnd) };
    });
    return { kind: 'fill', k, toks, blanks };
  });
}
const blankWord = b => t(b.seer ? 'seer' : 'wordOne');
function testCoupletHTML(k, toks, blanks, reveal) {
  const set = new Map((blanks || []).map((b, i) => [b.j, i]));
  const lines = [[], []];
  toks.forEach((x, j) => {
    const bi = set.get(j);
    if (bi === undefined) lines[x.li].push(`<span class="tw">${esc(x.w)}</span>`);
    else lines[x.li].push(`<span class="tw blank ${reveal ? 'shown' : ''}" role="img" aria-label="${esc(blankWord(blanks[bi]))} ${bi + 1}${reveal ? ': ' + esc(stripPunct(x.w)) : ''}">${reveal ? esc(stripPunct(x.w)) : `<i>${bi + 1}</i>`}${esc(tPunct(x.w))}</span>`);
  });
  return `<div class="couplet test-c"><div class="line l1">${lines[0].join(' ')}</div><div class="line l2">${lines[1].join(' ')}</div></div>`;
}
const translitHTML = k => (S.showTranslit && k.tl && k.tl[0]) ? `<div class="translit">${esc(k.tl[0])}<br>&nbsp;&nbsp;&nbsp;${esc(k.tl[1] || '')}</div>` : '';
const qLabel = q => q.kind === 'fill' ? (q.blanks.every(b => b.seer) ? (q.blanks.length > 1 ? 'qFill2' : 'qFill') : (q.blanks.length > 1 ? 'qFill2W' : 'qFillW'))
  : q.kind === 'next' ? 'qNext' : q.kind === 'num' ? 'qNum' : q.kind === 'ch' ? 'qCh' : 'qType';

async function viewTest(sub, arg, q) {
  await meta();
  if (sub === 'run') return viewTestRun(arg, +(q.get('lv') || S.testLevel || 2), q.get('seed') || '');
  if (sub === 'drill') return viewTestDrill(arg);
  if (sub === 'board') return viewTestBoard();
  return viewTestIndex();
}
function testStats() { const ks = Object.keys(S.test || {}); return { passed: ks.filter(k => S.test[k].passed).length, attempts: ks.reduce((s, k) => s + (S.test[k].attempts || 0), 0) }; }
function certList() {
  const ks = Object.keys(S.test || {}).filter(k => S.test[k].passed && S.test[k].cert);
  if (!ks.length) return '';
  return `<div class="card"><h2>🏅 ${t('certs')}</h2><div class="list">${ks.map(k => { const R = testRange(k); const c = S.test[k].cert; return R ? `<div class="item"><span class="num">${c.score}/${c.total}</span><span class="tx"><span class="l">${esc(R.name)}</span><span class="tr">${t('lv' + c.lv)} · ${c.date}</span></span><button class="btn small" data-cert="${k}" aria-label="${esc(t('certificate'))} · ${esc(R.name)}">🏅</button></div>` : ''; }).join('')}</div><div id="t-certbox"></div></div>`;
}
async function viewTestIndex() {
  setTitle(t('testShort'), 'மனப்பாடம் · ஒப்புவித்தல் · Recitation test');
  const today = chOf(dailyN()); const lv = S.testLevel || 2; const P = D.meta.pals;
  const palName = p => S.ui === 'ta' ? p.name : `${p.name} · ${p.nameEn}`;
  const presets = [['ch-' + today, `${t('testToday')} · ${chName(chMeta(today))}`], ['r-1-100', t('testFirst100')], ['pal-1', palName(P[0])], ['pal-2', palName(P[1])], ['pal-3', palName(P[2])], ['memo', `${t('memorised')} (${S.memorised.length})`]];
  const sel = S.testSpec || presets[0][0]; const R = testRange(sel); const ok = !!(R && R.ns.length); const st = testStats();
  render(`<div class="card"><h2>🏆 ${t('test')}</h2><div class="muted">${t('testSub')}</div>
    <div class="stat" style="margin-top:8px"><div><b>${st.passed}</b><span>${t('testPassedN')}</span></div><div><b>${st.attempts}</b><span>${t('testAttempts')}</span></div><div><b>${S.memorised.length}</b><span>${t('memorised')}</span></div></div></div>
  <div class="card"><h2>${t('testRange')}</h2>
    <div class="chips t-chips" id="t-presets">${presets.map(([k, l]) => `<button class="chip ${k === sel ? 'sel' : ''}" data-k="${k}" aria-pressed="${k === sel}">${esc(l)}</button>`).join('')}</div>
    <label class="muted" for="t-ch" style="display:block;margin-top:10px">${t('testChapter')}</label>
    <select id="t-ch" style="width:100%;margin-top:4px">${D.meta.chapters.map(c => `<option value="ch-${c.adhigaram}" ${sel === 'ch-' + c.adhigaram ? 'selected' : ''}>${c.adhigaram} · ${esc(chName(c))}</option>`).join('')}</select>
    <div class="row" style="margin-top:8px"><label class="muted" for="t-a">${t('testCustom')}</label><input type="text" inputmode="numeric" id="t-a" placeholder="1" style="max-width:76px" aria-label="${esc(t('rangeFrom'))}"><span aria-hidden="true">–</span><input type="text" inputmode="numeric" id="t-b" placeholder="100" style="max-width:76px" aria-label="${esc(t('rangeTo'))}"><button class="btn" id="t-r" aria-label="${esc(t('applyRange'))}">→</button></div>
    <div id="t-sel" style="margin-top:8px">${ok ? `<b>${esc(R.name)}</b> · ${R.ns.length} ${t('testKurals')}${R.ns.length < TEST_N ? ` <span class="muted">· ${t('certMin')}</span>` : ''}` : `<span class="muted">${t('testEmpty')}</span>`}</div></div>
  <div class="card"><h2>${t('testLevel')}</h2>
    <div class="tabs-inline t-lv" id="t-lv">${[1, 2, 3].map(l => `<button class="${l === lv ? 'on' : ''}" data-lv="${l}" aria-pressed="${l === lv}">${t('lv' + l)}</button>`).join('')}</div>
    <div class="muted" id="t-lvh">${t('lv' + lv + 'h')}</div>
    <div class="row" style="margin-top:10px"><label class="muted" for="t-name">${t('testName')}</label><input type="text" id="t-name" value="${esc(S.testName || '')}" style="flex:1;min-width:120px"></div>
    <div class="row" style="margin-top:6px"><label class="muted" for="t-seed">${t('testSeed')}</label><input type="text" inputmode="numeric" maxlength="4" id="t-seed" value="${esc(S.testSeed || '')}" placeholder="0000" style="max-width:90px"><button class="btn" id="t-seed-r" aria-label="${esc(t('random'))}">🎲</button></div>
    <div class="muted" style="font-size:.8rem">${t('testSeedHelp')}</div>
    <div class="actions"><button class="btn primary" id="t-go" ${ok ? '' : 'disabled'}>🏆 ${t('testStart')}</button><button class="btn" id="t-drill" ${ok ? '' : 'disabled'}>🃏 ${t('testDrill')}</button><button class="btn" id="t-ws" ${ok ? '' : 'disabled'}>📝 ${t('testWorksheet')}</button></div>
    <div class="muted" style="font-size:.8rem">${t('selfCheckNote')}</div></div>
  <div id="t-wsbox"></div>
  <div class="card"><h2>📊 ${t('testBoard')}</h2><div class="muted">${t('testBoardSub')}</div><div class="row" style="margin-top:8px"><a class="btn" href="#/test/board">📊 ${t('testBoard')}</a></div></div>
  ${certList()}`);
  const setSpec = k => { S.testSpec = k; saveS(); viewTestIndex(); };
  $$('#t-presets .chip').forEach(b => b.onclick = () => setSpec(b.dataset.k));
  $('#t-ch').onchange = e => setSpec(e.target.value);
  $('#t-r').onclick = () => { const a = +$('#t-a').value, b = +$('#t-b').value; if (a >= 1 && b >= 1 && a <= 1330 && b <= 1330) setSpec(`r-${Math.min(a, b)}-${Math.max(a, b)}`); else toast('1–1330'); };
  $$('#t-a,#t-b').forEach(el => el.onkeydown = e => { if (e.key === 'Enter') $('#t-r').click(); });
  $$('#t-lv button').forEach(b => b.onclick = () => { S.testLevel = +b.dataset.lv; saveS(); $$('#t-lv button').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); $('#t-lvh').textContent = t('lv' + S.testLevel + 'h'); });
  $('#t-name').onchange = e => { S.testName = e.target.value.trim(); saveS(); };
  const seedEl = $('#t-seed');
  seedEl.onchange = () => { const v = seedEl.value.replace(/\D/g, '').slice(0, 4); seedEl.value = v; S.testSeed = seedOk(v) ? v : ''; saveS(); if (v && !seedOk(v)) toast('0000–9999'); };
  $('#t-seed-r').onclick = () => { seedEl.value = String(1000 + Math.floor(Math.random() * 9000)); seedEl.onchange(); };
  if (ok) {
    $('#t-go').onclick = () => { S.testName = $('#t-name').value.trim(); seedEl.onchange(); saveS(); TEST.done = true; location.hash = `#/test/run/${R.key}?lv=${S.testLevel || 2}${S.testSeed ? '&seed=' + S.testSeed : ''}`; };
    $('#t-drill').onclick = () => { DRILL.done = true; location.hash = `#/test/drill/${R.key}`; };
    $('#t-ws').onclick = () => worksheet(R, $('#t-wsbox'));
  }
  $$('[data-cert]').forEach(b => b.onclick = () => testCertificate(b.dataset.cert, $('#t-certbox')));
}

// ── the test itself ──
async function viewTestRun(spec, lv, seed) {
  const R = testRange(spec);
  if (!R || !R.ns.length) { location.hash = '#/test'; return; }
  lv = clamp(lv || 2, 1, 3); seed = seedOk(seed) ? String(seed) : '';
  const key = `${R.key}:${lv}:${seed}`;
  if (TEST.key !== key || !TEST.qs.length || TEST.done) {   // a fresh paper unless this same one is mid-way
    TEST.key = key; TEST.R = R; TEST.lv = lv; TEST.seed = seed; TEST.qs = await buildTest(R, lv, seed); TEST.i = 0; TEST.t0 = Date.now(); TEST.done = null; TEST.pausedAt = 0;
    if (!TEST.qs.length) { toast(t('testEmpty')); location.hash = '#/test'; return; }
  } else if (TEST.pausedAt) { TEST.t0 += Date.now() - TEST.pausedAt; TEST.pausedAt = 0; }   // time away (reading a kural) is not charged
  if (TEST.done) return renderTestResult();
  renderTestQ();
}
function renderTestQ() {
  const q = TEST.qs[TEST.i], R = TEST.R, k = q.k, cm = chMeta(chOf(k.n)), last = TEST.i === TEST.qs.length - 1;
  setTitle(`${t('testRun')} ${TEST.i + 1}/${TEST.qs.length}`, R.name);
  const head = `<div class="row"><span class="chip sel">${TEST.i + 1} / ${TEST.qs.length}</span><span class="muted">${t('lv' + TEST.lv)}${TEST.seed ? ` · ${t('seedRound')} ${TEST.seed}` : ''}</span><span class="grow"></span><span class="muted" id="t-time">⏱ ${fmtSecs(Math.round((Date.now() - TEST.t0) / 1000))}</span></div>
    <div class="t-prog"><i style="width:${Math.round(100 * TEST.i / TEST.qs.length)}%"></i></div>`;
  const opt = (bi, oi, label) => `<button class="btn t-opt" data-b="${bi}" data-o="${oi}">${label}</button>`;
  const chHead = `<div class="kural-head"><span class="ch">${esc(chName(cm))}</span></div>`;
  let body;
  if (q.kind === 'fill') body = `<h2 id="t-q">${t(qLabel(q))}</h2>${chHead}${testCoupletHTML(k, q.toks, q.blanks)}
    ${q.blanks.map((b, bi) => `<div class="t-group"${q.blanks.length > 1 ? ` role="group" aria-label="${esc(blankWord(b))} ${bi + 1}"` : ''}>${q.blanks.length > 1 ? `<div class="t-gh">${esc(blankWord(b))} ${bi + 1}</div>` : ''}<div class="t-opts">${b.opts.map((o, oi) => opt(bi, oi, esc(o))).join('')}</div></div>`).join('')}`;
  else if (q.kind === 'next') body = `<h2 id="t-q">${t('qNext')}</h2>${chHead}<div class="couplet test-c"><div class="line l1"><span class="tw">${esc(k.l1)}</span></div><div class="line l2"><span class="tw blank-line" id="t-l2">…</span></div></div>
    <div class="t-opts t-lines">${q.opts.map((o, oi) => opt(0, oi, esc(o))).join('')}</div>`;
  else if (q.kind === 'num') body = `<h2 id="t-q">${t('qNum')}</h2>${chHead}${testCoupletHTML(k, testTokens(k), [])}
    <div class="t-opts">${q.opts.map((o, oi) => opt(0, oi, `${t('kural')} ${o}`)).join('')}</div>`;
  else if (q.kind === 'ch') body = `<h2 id="t-q">${t('qCh')}</h2>${testCoupletHTML(k, testTokens(k), [])}
    <div class="t-opts t-lines">${q.opts.map((o, oi) => opt(0, oi, `${o} · ${esc(chName(chMeta(o)))}`)).join('')}</div>`;
  else body = `<h2 id="t-q">${t('qType')}</h2><div class="kural-head"><span class="n">${t('kural')} ${k.n}</span><span class="ch">${esc(chName(cm))}</span></div>
    <textarea id="t-typed" class="ta" rows="3" lang="ta" aria-labelledby="t-q" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="${esc(t('qTypePh'))}"></textarea>
    <div class="row" style="margin-top:8px"><button class="btn primary" id="t-check">✔ ${t('check')}</button><button class="btn" id="t-skip">${t('skip')}</button></div>`;
  render(`<div class="card">${head}${body}<div id="t-fb" role="status" aria-live="polite" tabindex="-1"></div></div>`);
  clearInterval(TEST.tick);
  TEST.tick = setInterval(() => { const el = $('#t-time'); if (!el) { TEST.pausedAt = TEST.pausedAt || Date.now(); return clearInterval(TEST.tick); } el.textContent = '⏱ ' + fmtSecs(Math.round((Date.now() - TEST.t0) / 1000)); }, 1000);
  const feedback = (ok, extra) => {
    const fb = $('#t-fb');
    fb.innerHTML = `<div class="t-fb ${ok ? 'ok' : 'bad'}"><b>${ok ? '✓ ' + t('correct') : '✗ ' + t('wrong')}</b>${extra || ''}
      <div class="row" style="margin-top:8px"><a class="btn" href="#/k/${k.n}">📖 ${t('kural')} ${k.n}</a><button class="btn" id="t-say" aria-label="${esc(t('recite'))}">🔊</button><span class="grow"></span><button class="btn primary" id="t-next">${last ? t('finish') : t('nextQ')} →</button></div></div>`;
    $('#t-say').onclick = e => reciteKural(k, e.currentTarget);
    $('#t-next').onclick = () => { TTS.stop(); TEST.i++; if (TEST.i >= TEST.qs.length) finishTest(); else renderTestQ(); };
    fb.focus();
  };
  if (q.kind === 'type') {
    const ta = $('#t-typed');
    const grade = typed => {
      // judged on the letters: spaces and punctuation ignored, up to 5% of the letters (min 2) may differ
      const canonS = vNorm(k.l1 + ' ' + k.l2).replace(/\s+/g, ''), typedS = vNorm(typed).replace(/\s+/g, '');
      const dist = levenshtein(typedS, canonS);
      q.ok = typedS.length > 0 && dist <= Math.max(2, Math.floor(canonS.length * 0.05)); q.typed = typed;
      // the word diff is only feedback
      const ct = vTokens(k.l1 + '\n' + k.l2, true), qt = vTokens(typed); const ops = vDiff(qt, ct);
      const eq = ops.filter(o => o[0] === 'eq').length; const extra = qt.length - eq;
      const tok = (x, c) => `${x.br ? '<br>' : ''}<span class="${c}">${esc(x.t)}</span>`;
      const canon = ops.map(o => o[0] === 'eq' ? tok(ct[o[2]], 'q-ok') : o[0] === 'ins' ? tok(ct[o[2]], 'q-miss') : '').join(' ');
      const quoted = ops.map(o => o[0] === 'eq' ? tok(qt[o[1]], 'q-ok') : o[0] === 'del' ? tok(qt[o[1]], 'q-bad') : '').join(' ');
      ta.disabled = true; $('#t-check').disabled = true; $('#t-skip').disabled = true;
      feedback(q.ok, `<div class="muted" style="font-size:.85rem">${eq}/${ct.length} ${t('wordsMatched')}</div><div class="t-lab">${t('typedCanon')}</div><div class="couplet t-canon">${canon}</div>${typed.trim() && (extra || eq < ct.length) ? `<div class="t-lab">${t('typedYours')}</div><div class="t-quoted">${quoted}</div>` : ''}`);
    };
    $('#t-check').onclick = () => grade(ta.value);
    $('#t-skip').onclick = () => grade('');
    ta.onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('#t-check').click(); };
    if (q.typed !== undefined) { ta.value = q.typed; grade(q.typed); } else ta.focus();   // coming back to an answered question restores it
    return;
  }
  q.given = q.given || [];
  const opts = $$('.t-opt');
  const ansOf = bi => q.kind === 'fill' ? q.blanks[bi].ans : q.ans;
  const allGiven = () => (q.blanks || [0]).every((_, i) => q.given[i] !== undefined);
  const grade = () => {
    const ok = (q.blanks || [0]).every((_, bi) => q.given[bi] === ansOf(bi));
    q.ok = ok;
    opts.forEach(b => {
      const bi = +b.dataset.b, oi = +b.dataset.o; b.disabled = true;
      if (oi === ansOf(bi)) { b.classList.add('ok'); b.textContent = '✓ ' + b.textContent; b.setAttribute('aria-label', `${t('correct')}: ${b.textContent}`); }
      else if (q.given[bi] === oi) { b.classList.add('bad'); b.textContent = '✗ ' + b.textContent; b.setAttribute('aria-label', `${t('wrong')}: ${b.textContent}`); }
    });
    if (q.kind === 'fill') $('.test-c').outerHTML = testCoupletHTML(k, q.toks, q.blanks, true);
    if (q.kind === 'next') { const l2 = $('#t-l2'); l2.textContent = k.l2; l2.classList.remove('blank-line'); }
    feedback(ok, q.kind === 'num' ? `<div class="muted">${t('answerWas')}: ${t('kural')} ${k.n}</div>` : q.kind === 'ch' ? `<div class="muted">${t('answerWas')}: ${t('adhigaram')} ${chOf(k.n)} · ${esc(cm.name)}</div>` : '');
  };
  const mark = () => q.given.forEach((oi, bi) => { if (oi === undefined) return; $$(`.t-opt[data-b="${bi}"]`).forEach(x => x.classList.toggle('sel', +x.dataset.o === oi)); });
  opts.forEach(b => b.onclick = () => {
    if (q.ok !== undefined) return;
    q.given[+b.dataset.b] = +b.dataset.o; mark();          // a choice can be changed until every blank has one
    if (allGiven()) grade();
    else { const nxt = $(`.t-opt[data-b="${q.given.findIndex(v => v === undefined)}"]`); if (nxt) nxt.focus(); }
  });
  mark(); if (q.ok !== undefined || allGiven()) grade();     // coming back to an answered question restores it
}
function finishTest() {
  clearInterval(TEST.tick);
  const qs = TEST.qs, R = TEST.R; const score = qs.filter(q => q.ok).length, total = qs.length;
  const secs = Math.round((Date.now() - TEST.t0) / 1000); const passed = score / total >= TEST_PASS;
  const certOk = passed && total >= TEST_N;                 // a certificate needs a full paper
  S.test = S.test || {};
  const rec = S.test[R.key] || { best: 0, attempts: 0, passed: false };
  rec.attempts++; rec.best = Math.max(rec.best, score); rec.last = { score, total, lv: TEST.lv, secs, date: todayKey(), seed: TEST.seed };
  if (passed) rec.passed = true;
  if (certOk && (!rec.cert || score >= rec.cert.score)) rec.cert = { score, total, lv: TEST.lv, secs, date: todayKey(), seed: TEST.seed, n: R.ns.length };
  if (S.learn && S.learn.goal !== 'u') for (const q of qs) { const c = S.srs[q.k.n]; if (!q.ok && c && learnHas(q.k.n)) c.due = Math.min(c.due, Math.max(dayNo(), learnDay()) + 1); }
  S.test[R.key] = rec; saveS();
  TEST.done = { score, total, secs, passed, certOk, key: R.key };
  renderTestResult();
}
function renderTestResult() {
  const d = TEST.done, R = TEST.R, rec = S.test[d.key] || { best: d.score, attempts: 1 };
  const pct = Math.round(100 * d.score / d.total);
  setTitle(t('testResult'), R.name);
  render(`<div class="card"><div class="row"><span class="score">${d.score}/${d.total}</span><span class="muted">${pct}% · ${t('testTime')} ${fmtSecs(d.secs)} · ${t('lv' + TEST.lv)}${TEST.seed ? ` · ${t('seedRound')} ${TEST.seed}` : ''}</span></div>
    <div class="t-prog"><i style="width:${pct}%"></i></div>
    <div class="${d.passed ? 't-pass' : 'muted'}">${d.certOk ? t('testPassed') : d.passed ? `${t('passedWord')} · ${t('certMin')}` : t('testFailed')}</div>
    <div class="stat" style="margin-top:8px"><div><b>${rec.best}</b><span>${t('testBest')}</span></div><div><b>${rec.attempts}</b><span>${t('testAttempts')}</span></div></div>
    <div class="actions">${d.certOk ? `<button class="btn primary" id="t-cert">🏅 ${t('certificate')}</button>` : ''}<button class="btn ${d.certOk ? '' : 'primary'}" id="t-retry">↺ ${t('retry')}</button><a class="btn" href="#/test/drill/${R.key}">🃏 ${t('testDrill')}</a><button class="btn" id="t-share">📤 ${t('shareResult')}</button>${S.learn ? `<button class="btn" id="t-learn">📘 ${t('lnBackToLesson')}</button>` : ''}<a class="btn" href="#/test">📋 ${t('testPage')}</a></div>
    <div id="t-certbox"></div></div>
  <div class="card list">${TEST.qs.map((q, i) => `<a href="#/k/${q.k.n}"><span class="num ${q.ok ? 't-ok' : 't-bad'}" aria-label="${q.ok ? t('correct') : t('wrong')}">${q.ok ? '✓' : '✗'}</span><span class="tx"><span class="l">${i + 1}. ${t(qLabel(q))} · ${t('kural')} ${q.k.n}</span><span class="tr">${esc(q.k.l1)} ${esc(q.k.l2)}</span></span></a>`).join('')}</div>`);
  const c = $('#t-cert'); if (c) c.onclick = () => testCertificate(d.key, $('#t-certbox'));
  $('#t-retry').onclick = () => { TEST.done = true; viewTestRun(R.key, TEST.lv, TEST.seed); };
  const tl = $('#t-learn'); if (tl) tl.onclick = () => { location.hash = '#/learn'; };
  $('#t-share').onclick = () => shareText(t('test'), `🏆 ${t('test')} · ${R.nameTa}${S.ui === 'ta' ? '' : ' · ' + R.nameEn}\n${d.score}/${d.total} (${pct}%) · ${t('lv' + TEST.lv)}${TEST.seed ? ` · ${t('seedRound')} ${TEST.seed}` : ''} · ⏱ ${fmtSecs(d.secs)}\n— ${D.meta.title} · CICT · ${appUrl()}#/test`);
}

// ── certificate ──
async function testCertificate(key, box) {
  const rec = (S.test || {})[key], R = testRange(key); if (!rec || !rec.cert || !R || !box) return;
  const name = (S.testName || '').trim();
  if (!name) {
    box.innerHTML = `<div class="row" style="margin-top:8px"><input type="text" id="t-cert-name" placeholder="${esc(t('testName'))}" aria-label="${esc(t('testName'))}" style="flex:1;min-width:120px"><button class="btn primary" id="t-cert-name-ok" aria-label="${esc(t('confirmName'))}">→</button></div><div class="muted">${t('certNeedName')}</div>`;
    const inp = $('#t-cert-name', box); inp.focus();
    $('#t-cert-name-ok', box).onclick = () => { S.testName = inp.value.trim(); saveS(); testCertificate(key, box); };
    inp.onkeydown = e => { if (e.key === 'Enter') $('#t-cert-name-ok', box).click(); };
    return;
  }
  box.innerHTML = '<div class="muted">⏳</div>';
  try {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const c = rec.cert, n = c.n || R.ns.length, W = 1754, H = 1240;
    const titleTa = c.lv >= 3 ? STR.ta.certTitle : STR.ta.certTitleMcq, titleEn = c.lv >= 3 ? STR.en.certTitle : STR.en.certTitleMcq;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
    const TA = '"Noto Sans Tamil","Nirmala UI",sans-serif', TS = '"Noto Serif Tamil","Noto Sans Tamil",Georgia,serif', EN = 'system-ui,"Segoe UI",sans-serif';
    x.fillStyle = '#fbf7ef'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#8f2f1c'; x.lineWidth = 10; x.strokeRect(40, 40, W - 80, H - 80);
    x.strokeStyle = '#c8961e'; x.lineWidth = 3; x.strokeRect(62, 62, W - 124, H - 124);
    x.fillStyle = '#c8961e'; [[62, 62], [W - 62, 62], [62, H - 62], [W - 62, H - 62]].forEach(([cx, cy]) => { x.beginPath(); x.moveTo(cx, cy - 18); x.lineTo(cx + 18, cy); x.lineTo(cx, cy + 18); x.lineTo(cx - 18, cy); x.closePath(); x.fill(); });
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    const logo = $('.top .logo'); if (logo && logo.complete && logo.naturalWidth) { try { x.drawImage(logo, W / 2 - 55, 92, 110, 110); } catch (e) { } }
    x.fillStyle = '#8f2f1c'; x.font = '700 34px ' + TA; x.fillText('செம்மொழித் தமிழாய்வு மத்திய நிறுவனம்', W / 2, 252);
    x.fillStyle = '#6f6459'; x.font = '400 24px ' + EN; x.fillText('Central Institute of Classical Tamil · Chennai', W / 2, 288);
    x.fillStyle = '#8f2f1c'; x.font = '700 78px ' + TS; x.fillText(titleTa, W / 2, 402);
    x.fillStyle = '#6f6459'; x.font = '400 32px ' + EN; x.fillText(titleEn, W / 2, 448);
    x.fillStyle = '#4a3b2a'; x.font = '400 28px ' + TA; x.fillText(`${STR.ta.certGiven} · ${STR.en.certGiven}`, W / 2, 520);
    x.fillStyle = '#1f1b16'; x.font = '700 70px ' + TS; x.fillText(name, W / 2, 612);
    const nw = Math.min(W - 300, x.measureText(name).width); x.strokeStyle = '#c8961e'; x.lineWidth = 3; x.beginPath(); x.moveTo(W / 2 - nw / 2 - 24, 636); x.lineTo(W / 2 + nw / 2 + 24, 636); x.stroke();
    const vars = { n, score: c.score, total: c.total };
    const bodyTa = fmt(STR.ta.certBody, { ...vars, range: R.nameTa, level: STR.ta['lv' + c.lv + 'a'] });
    const bodyEn = fmt(STR.en.certBody, { ...vars, range: R.nameEn, level: STR.en['lv' + c.lv] });
    let y = 712; x.fillStyle = '#332a1e';
    for (const seg of wrapText(x, bodyTa, '400 32px ' + TA, W - 320)) { x.fillText(seg, W / 2, y); y += 50; }
    y += 10; x.fillStyle = '#6f6459';
    for (const seg of wrapText(x, bodyEn, '400 26px ' + EN, W - 320)) { x.fillText(seg, W / 2, y); y += 38; }
    const date = c.date.split('-').reverse().join('-');
    y += 34; x.fillStyle = '#332a1e'; x.font = '600 28px ' + TA; x.fillText(`நாள் · Date: ${date}${c.seed ? `   ·   ${STR.ta.seedRound} · ${STR.en.seedRound}: ${c.seed}` : ''}`, W / 2, y);
    // signature rules for the examiner and the head, so a school can countersign the printout
    x.strokeStyle = '#8a7a66'; x.lineWidth = 2;
    for (const [sx, l1, l2] of [[300, STR.ta.certSign1, STR.en.certSign1], [W - 300, STR.ta.certSign2, STR.en.certSign2]]) {
      x.beginPath(); x.moveTo(sx - 210, H - 232); x.lineTo(sx + 210, H - 232); x.stroke();
      x.fillStyle = '#4a3b2a'; x.font = '500 24px ' + TA; x.fillText(l1, sx, H - 198);
      x.fillStyle = '#6f6459'; x.font = '400 20px ' + EN; x.fillText(l2, sx, H - 170);
    }
    const ref = refCode(`${key}|${name}|${c.score}|${c.total}|${n}|${c.date}`);
    x.fillStyle = '#6f6459'; x.font = '400 22px ' + EN; x.textAlign = 'left'; x.fillText(`${STR.en.certRef} ${ref}`, 112, H - 112);
    x.textAlign = 'right'; x.font = '400 22px ' + TA; x.fillText('திருக்குறள் — 22 மொழிகள் · Tirukkural Multilingual', W - 112, H - 112);
    x.textAlign = 'center'; x.font = '400 20px ' + TA; x.fillText(STR.ta.certFoot, W / 2, H - 80);
    const dataUrl = cv.toDataURL('image/png');             // encoded once; the canvas itself is dropped
    const alt = `${titleTa} · ${titleEn} · ${name} · ${R.nameTa} · ${R.nameEn} · ${c.score}/${c.total} · ${STR.en['lv' + c.lv]} · ${date} · ${STR.en.certRef} ${ref}`;
    box.innerHTML = `<div class="t-cert"><div class="t-certwrap"><img alt="${esc(alt)}" src="${dataUrl}" title="${esc(t('certZoom'))}"></div><div class="muted" style="font-size:.8rem">${esc(bodyTa)}</div><div class="row" style="margin-top:8px"><button class="btn primary" id="t-certshare">📤 ${t('certShare')}</button><button class="btn" id="t-certzoom" aria-pressed="false">🔍 ${t('certZoom')}</button><span class="muted">${STR.en.certRef} ${ref}</span></div></div>`;
    const wrap = $('.t-certwrap', box);
    $('#t-certzoom', box).onclick = e => { const on = wrap.classList.toggle('zoom'); e.currentTarget.setAttribute('aria-pressed', on); };
    $('img', wrap).onclick = () => $('#t-certzoom', box).click();
    $('#t-certshare', box).onclick = async e => { const b = e.currentTarget; b.disabled = true; try { await sharePNG(dataUrl, `kural-certificate-${key}.png`, titleTa, `${titleTa} · ${name} · ${R.nameTa} · ${c.score}/${c.total}`); } catch (err) { toast('✕ ' + err.message); } b.disabled = false; };
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) { box.innerHTML = ''; toast('✕ ' + e.message); }
}

// ── recitation drill (flash cards, self-assessed) ──
async function viewTestDrill(spec) {
  const R = testRange(spec);
  if (!R || !R.ns.length) { location.hash = '#/test'; return; }
  if (DRILL.key !== R.key || DRILL.done) { DRILL.key = R.key; DRILL.R = R; DRILL.ns = shuffle(R.ns.slice()); DRILL.i = 0; DRILL.ok = []; DRILL.no = []; DRILL.done = false; }
  renderDrill();
}
async function renderDrill() {
  const R = DRILL.R;
  if (DRILL.i >= DRILL.ns.length) { DRILL.done = true; return renderDrillDone(); }
  const n = DRILL.ns[DRILL.i]; let k;
  try { k = await kural(n); } catch (e) { toast(navigator.onLine ? '✕ ' + e.message : t('offline.banner')); return; }
  const cm = chMeta(chOf(n));
  setTitle(`${t('drillShort')} ${DRILL.i + 1}/${DRILL.ns.length}`, R.name);
  render(`<div class="card"><div class="row"><span class="chip sel">${DRILL.i + 1} / ${DRILL.ns.length}</span><span class="muted">✓ ${DRILL.ok.length} · ✗ ${DRILL.no.length}</span></div>
    <div class="t-prog"><i style="width:${Math.round(100 * DRILL.i / DRILL.ns.length)}%"></i></div>
    <div class="kural-head" style="margin-top:8px"><span class="n">${t('kural')} ${n}</span><span class="ch">${esc(chName(cm))}</span></div>
    <div class="muted" style="font-size:.85rem">${t('drillSub')}</div>
    <div class="actions" id="d-actions"><button class="btn" id="d-hint-b">💡 ${t('drillHint')}</button><button class="btn primary" id="d-show">👁 ${t('drillShow')}</button></div>
    <div id="d-hint" class="couplet muted" hidden></div>
    <div id="d-a" hidden>${testCoupletHTML(k, testTokens(k), [])}${translitHTML(k)}</div></div>`);
  $('#d-hint-b').onclick = () => { const h = $('#d-hint'); h.hidden = false; h.textContent = k.l1.split(/\s+/)[0] + ' …'; };
  // the verdict row stays above the couplet, so it is never pushed under the tab bar
  const advance = async known => {
    const next = DRILL.i + 1;
    try { if (next < DRILL.ns.length) await kural(DRILL.ns[next]); } catch (e) { toast(navigator.onLine ? '✕ ' + e.message : t('offline.banner')); return; }
    if (known) { DRILL.ok.push(n); if (!S.memorised.includes(n)) { S.memorised.push(n); saveS(); } } else DRILL.no.push(n);
    TTS.stop(); DRILL.i = next; renderDrill();
  };
  $('#d-show').onclick = () => {
    $('#d-a').hidden = false; $('#d-hint').hidden = true;
    $('#d-actions').innerHTML = `<button class="btn" id="d-no">✗ ${t('drillForgot')}</button><button class="btn primary" id="d-ok">✓ ${t('drillKnow')}</button><button class="btn" id="d-say" aria-label="${esc(t('recite'))}">🔊</button><a class="btn" href="#/practice/${n}/memorise">🙈 ${t('memorise')}</a>`;
    $('#d-say').onclick = e => reciteKural(k, e.currentTarget);
    $('#d-ok').onclick = () => advance(true);
    $('#d-no').onclick = () => advance(false);
    $('#d-ok').focus();
  };
}
function renderDrillDone() {
  const R = DRILL.R; setTitle(t('drillDone'), R.name);
  render(`<div class="card"><h2>🎉 ${t('drillDone')}</h2><div class="stat"><div><b>${DRILL.ok.length}</b><span>✓ ${t('drillKnow')}</span></div><div><b>${DRILL.no.length}</b><span>✗ ${t('drillForgot')}</span></div></div>
    ${DRILL.no.length ? `<div class="row" style="margin-top:8px">${DRILL.no.map(n => `<a class="btn small" href="#/practice/${n}/memorise">🙈 ${n}</a>`).join('')}</div>` : ''}
    <div class="actions">${DRILL.no.length ? `<button class="btn primary" id="d-again">↺ ${t('drillAgainNo')}</button>` : ''}<a class="btn ${DRILL.no.length ? '' : 'primary'}" href="#/test/run/${R.key}?lv=${S.testLevel || 2}">🏆 ${t('testStart')}</a></div></div>`);
  const b = $('#d-again'); if (b) b.onclick = () => { DRILL.ns = shuffle(DRILL.no.slice()); DRILL.no = []; DRILL.ok = []; DRILL.i = 0; DRILL.done = false; renderDrill(); };
}

// ── chapter board: tap a chapter to select it on the test page ──
async function viewTestBoard() {
  setTitle(t('boardShort'), t('testBoard'));
  const T = S.test || {};
  const band = c => { const r = T['ch-' + c]; if (!r) return ''; const p = r.best / ((r.last && r.last.total) || TEST_N); return p >= TEST_PASS ? 'b3' : p >= 0.5 ? 'b2' : 'b1'; };
  const memoIn = c => S.memorised.filter(n => chOf(n) === c).length;
  render(`<div class="card"><div class="muted" style="font-size:.85rem">${t('boardLegend')}</div></div>` + D.meta.pals.map(p => `<div class="card"><h2>${esc(p.name)} <span class="muted" style="font-weight:400">· ${esc(p.nameEn)}</span></h2>
    ${p.iyals.map(iy => `<div class="muted" style="margin:8px 0 4px">${esc(iy.name)} · ${esc(iy.nameEn)}</div><div class="t-board">${iy.chapters.map(c => { const r = T['ch-' + c]; const m = memoIn(c); const cm = chMeta(c); return `<button class="t-tile ${band(c)}" data-ch="${c}" aria-label="${c} · ${esc(cm.name)} · ${esc(cm.nameEn)}${r ? ` · ${r.best}/${(r.last && r.last.total) || TEST_N}` : ''}${band(c) === 'b3' ? ' · ' + esc(t('passedWord')) : ''}"><b>${c}</b><span>${r ? `${r.best}/${(r.last && r.last.total) || TEST_N}` : m ? `${m}★` : '—'}</span></button>`; }).join('')}</div>`).join('')}</div>`).join(''));
  $$('.t-tile').forEach(b => b.onclick = () => { S.testSpec = 'ch-' + b.dataset.ch; saveS(); location.hash = '#/test'; });
}

// ── worksheet: shown on the page first, then shared or copied as text ──
async function worksheet(R, box) {
  if (!box) return;
  box.innerHTML = '<div class="card muted">⏳</div>';
  try {
    const ns = pick(R.ns, Math.min(TEST_N + 4, R.ns.length));
    await Promise.all([...new Set(ns.map(chOf))].map(chapter));
    const ks = ns.map(n => D.ch[chOf(n)].kurals[(n - 1) % 10]).filter(testable).slice(0, TEST_N).sort((a, b) => a.n - b.n);
    const qLines = [], keyLines = [];
    ks.forEach((k, i) => {
      const toks = testTokens(k); const cand = toks.map((_, j) => j).filter(j => blankable(toks, j));
      const j = cand.length ? cand[Math.floor(Math.random() * cand.length)] : 0;
      const l = [[], []]; toks.forEach((x, jj) => l[x.li].push(jj === j ? '________' + tPunct(x.w) : x.w));
      qLines.push(`${i + 1}. ${l[0].join(' ')}`, `    ${l[1].join(' ')}`, '');
      keyLines.push(`${i + 1}. ${stripPunct(toks[j].w)} (${t('kural')} ${k.n})`);
    });
    const head = [`திருக்குறள் · ${t('testWorksheet')} · ${R.nameTa}`, `${t('wsName')}: ______________   ${t('wsScore')}: ____ / ${ks.length}`, ''];
    const text = [...head, ...qLines, `${t('wsKey')}:`, ...keyLines, '', `— ${D.meta.title} · CICT · ${appUrl()}`].join('\n');
    box.innerHTML = `<div class="card"><h2>📝 ${t('testWorksheet')} · ${esc(R.name)}</h2><pre class="ws">${esc([...head, ...qLines].join('\n').trim())}</pre>
      <details><summary>${t('wsKey')}</summary><pre class="ws">${esc(keyLines.join('\n'))}</pre></details>
      <div class="row" style="margin-top:8px"><button class="btn primary" id="ws-share">📤 ${t('share')}</button><button class="btn" id="ws-copy">📋 ${t('copy')}</button><button class="btn" id="ws-new">🎲 ${t('wsRegen')}</button></div></div>`;
    $('#ws-share', box).onclick = () => shareText(`${t('testWorksheet')} · ${R.nameTa}`, text);
    $('#ws-copy', box).onclick = () => navigator.clipboard.writeText(text).then(() => toast('✓ ' + t('copy')), () => toast('✕'));
    $('#ws-new', box).onclick = () => worksheet(R, box);
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) { box.innerHTML = ''; toast(navigator.onLine ? '✕ ' + e.message : t('offline.banner')); }
}

// ───────────────────────────── வழிகாட்டும் பாடம் · guided lesson ─────────────────────────────
// A lesson is a frozen, tiny plan over tools the app already has; the course itself is derived.
// Course position is never stored: it is recomputed from the path (testRange specs) and ONE
// 10-bit "introduced" mask per chapter, so changing path, pace or goal can never corrupt progress.
// The day's lesson, however, is built once into S.learn.cur.plan (step codes = letter + kural
// number; a lower-case letter is ungraded practice) so that Back, a reload, a settings change or
// a flaky network can never shift the step under the cursor. Every step finishes after at most
// one wrong answer: MCQs are answer-once with reveal, the tile rebuild helps itself after two
// misses, audio never gates, self-report buttons are always enabled. Memory stays in S.srs,
// mastery stays with the chapter test; the lesson only introduces, schedules and sequences.
// It never writes S.memorised. There are no timers, so nothing runs while the learner is away.
//
// TWO DAY SYSTEMS COEXIST ON PURPOSE: dayNo() is the UTC day the SRS deck has always used;
// learnDay() is the LOCAL calendar day (same expression as dailyN) used for the habit counters.
// They meet in learnGrade() (write side: never due again the same local day, east of UTC) and in
// learnDueDay() (read side: the same promise west of UTC). "Fixing" either creates an off-by-one.
const LEARN_LISTS = [];   // syllabus / starter slot: {id, nameTa, nameEn, src:'source + year', specs:[...]}. Empty until CICT signs a list off.
const LEARN_CAP = { few: 6, many: 15, rev: 10, dayNew: 6 };
const LEARN_SPEC = /^(book|pal-[123]|iyal-[123]-\d{1,2}|ch-\d{1,3}|r-\d{1,4}-\d{1,4})$/;
const LEARN = { tok: 0, busy: false, warned: false, rev: false, armed: 0, t: 0, wayOpen: false, open: false };
const learnDay = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
const learnDueDay = () => Math.min(dayNo(), learnDay());
function learnDef() { return { v: 1, goal: 'm', ta: 1, ml: 'ta', path: ['book'], pid: '', pace: 2, at: 0, td: 0, ch: {}, cur: null, last: null, days: 0, run: { n: 0, last: 0, g: 0 }, best: 0, nw: [0, 0], rvn: 0 }; }
// One guarded write per lesson action. saveS() also pushes to the service worker and the widget
// bridge; doing that fifteen times a lesson is waste, so it runs only at commit and on setup changes.
function saveLearn() { try { localStorage.setItem('kural.settings', JSON.stringify(S)); } catch (e) { if (!LEARN.warned) { LEARN.warned = true; toast(t('lnNoSave'), 4000); } } }
function learnSaveAll() { try { saveS(); } catch (e) { saveLearn(); } }     // a throwing setItem must never freeze a screen
function learnGrade(n, q) { srsApply(n, q); const c = S.srs[n]; c.due = Math.max(dayNo(), learnDay()) + Math.max(c.ivl, 1); }
const learnStillDue = n => !!S.srs[n] && S.srs[n].due <= learnDueDay();      // a card graded elsewhere since the plan was built is not graded again
const learnOnGo = () => location.hash.startsWith('#/learn/go');
window.addEventListener('storage', e => {   // another tab or the installed copy wrote the settings
  if (e.key !== 'kural.settings' || !e.newValue) return;
  try {
    const live = $('#ln-step') ? S.learn : undefined;                         // a lesson on screen keeps its own state: its steps hold references into it
    Object.assign(S, JSON.parse(e.newValue));
    if (live !== undefined) S.learn = live; else if (S.learn) S.learn = Object.assign(learnDef(), S.learn);
  } catch (err) { }
});

// ── the course, derived ──
function learnQueue() {
  const seen = new Set(), q = [];
  for (const s of S.learn.path) { if (!LEARN_SPEC.test(s)) continue; const R = testRange(s); if (!R) continue; for (const n of R.ns) if (!seen.has(n)) { seen.add(n); q.push(n); } }
  const at = S.learn.at; if (at) { const i = q.findIndex(n => chOf(n) === at); if (i > 0) return q.slice(i).concat(q.slice(0, i)); }
  return q;
}
const learnHas = n => !!(((S.learn.ch[chOf(n)] || 0) >> ((n - 1) % 10)) & 1);
const learnSet = n => { const c = chOf(n); S.learn.ch[c] = (S.learn.ch[c] || 0) | (1 << ((n - 1) % 10)); };
const popc = m => { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; };
const learnFirm = n => !!(S.srs[n] && S.srs[n].ivl >= 7) || S.memorised.includes(n);
const learnIntroduced = () => Object.keys(S.learn.ch).flatMap(cc => chNs(+cc)).filter(learnHas);
function learnShares(queue) { const sh = {}; for (const n of queue) { const c = chOf(n); sh[c] = (sh[c] || 0) | (1 << ((n - 1) % 10)); } return sh; }
const learnAid = () => S.learn.ta === 0;                       // script aid: transliteration everywhere, saying is skippable
function learnPreset() { const en = S.ui === 'en'; const f = firstLang(); return { goal: en ? 'u' : 'm', ml: en ? f : 'ta', ta: en ? 0 : 1 }; }
function learnCreate(p) { S.learn = Object.assign(learnDef(), p, { pace: p.goal === 'm' ? 2 : p.goal === 'c' ? 3 : 5 }); }

// ── meaning, always in the language the learner chose, always labelled ──
const learnStreams = () => [S.learn.ml, 'p-en', 'ta'].filter((v, i, a) => a.indexOf(v) === i);
function learnText(k, code) { if (code === 'ta') return k.prose.ta_mv || ''; if (code === 'p-en') return k.prose.en || ''; const tr = k.tr[code]; return tr ? tr.filter(Boolean).join(' ') : ''; }
const learnOneStream = ks => learnStreams().find(c => ks.every(k => learnText(k, c))) || 'ta';
const learnLang = code => code === 'ta' ? 'ta' : code === 'p-en' ? 'en' : code;
const learnLangName = c => L(c).native === L(c).name ? L(c).native : `${L(c).native} · ${L(c).name}`;
const learnLabel = code => code === 'ta' ? t('lnLabTa') : code === 'p-en' ? t('lnLabEnProse') : (L(code) ? learnLangName(code) : code);
function learnMeanHTML(k, code, clamp, open) {
  code = code || learnOneStream([k]); const lang = learnLang(code); const rtl = L(lang) && L(lang).dir === 'rtl'; const cl = clamp && !open;
  return `<div class="ln-mean ${cl ? 'clamp' : ''} ${scriptClass(lang)} ${rtl ? 'rtl' : ''}" lang="${esc(lang)}"${dirAttr(lang)}>${esc(learnText(k, code))}</div>${clamp ? `<button class="ln-more" aria-expanded="${!cl}">${t(cl ? 'lnMore' : 'lnLess')}</button>` : `<div class="ln-lab">${esc(learnLabel(code))}</div>`}`;
}
// testTokens + a transliteration per token when k.tl splits into the same number of words line by line
function learnToks(k) {
  const toks = testTokens(k); const per = [0, 1].map(li => ((k.tl || [])[li] || '').split(/\s+/).filter(Boolean));
  const ok = [0, 1].every(li => per[li].length === toks.filter(x => x.li === li).length);
  if (ok) { const at = [0, 0]; toks.forEach(x => { x.tl = per[x.li][at[x.li]++]; }); }
  toks.aligned = ok; return toks;
}
const learnTl = k => (k.tl && k.tl[0]) ? `<div class="translit"><div class="tl1">${esc(k.tl[0])}</div><div class="tl2">&nbsp;&nbsp;&nbsp;${esc(k.tl[1] || '')}</div></div>` : '';
// the transliteration with the blanked words struck out, so it cannot give the answers away
function learnTlMasked(toks, hide) { if (!toks.aligned) return ''; const ln = li => toks.map((x, j) => x.li === li ? (hide.has(j) ? '___' : esc(x.tl)) : '').filter(Boolean).join(' '); return `<div class="translit"><div class="tl1">${ln(0)}</div><div class="tl2">&nbsp;&nbsp;&nbsp;${ln(1)}</div></div>`; }
const learnShowTl = () => learnAid() || S.showTranslit;
const learnCouplet = k => testCoupletHTML(k, testTokens(k), []) + (learnShowTl() ? learnTl(k) : '');
const learnTlUnder = x => (learnAid() && x.tl) ? `<span class="ln-tl">${esc(x.tl)}</span>` : '';
const learnCantBuild = k => !testable(k) || (learnAid() && !learnToks(k).aligned);
const learnFirstWord = k => testable(k) ? stripPunct(k.l1.split(/\s+/)[0]) + (learnAid() && k.tl && k.tl[0] ? ` (${k.tl[0].split(/\s+/)[0]})` : '') : '';
function learnSayLive(msg) { const el = $('#ln-fb'); if (!el) return; el.textContent = ''; requestAnimationFrame(() => { el.textContent = msg; }); }
const learnArm = () => { LEARN.t = performance.now(); };                       // freshly painted choices ignore taps for a moment: a double tap must not answer twice
const learnTooSoon = () => performance.now() - LEARN.t < 350;
// Two blanks for the fill steps. The pool is the kural's own chapter and never holds a word of the couplet itself.
function learnFill(k, cnt, rnd) {
  const toks = learnToks(k); const own = new Set(toks.map(x => tWord(x.w)));
  const idx = pick(toks.map((_, j) => j).filter(j => blankable(toks, j)), cnt, rnd).sort((a, b) => a - b);
  const pool = D.ch[chOf(k.n)].kurals.filter(x => x.n !== k.n && testable(x)).flatMap(x => learnToks(x)).filter(w => !own.has(tWord(w.w)) && tWord(w.w).length >= 2);
  const blanks = idx.map(j => {
    const a = toks[j]; const aw = tWord(a.w);
    let cand = pool.filter(w => a.cls ? w.cls === a.cls : Math.abs(tWord(w.w).length - aw.length) <= 2); if (cand.length < 3) cand = pool;
    const seen = new Set([aw]); const others = [];
    for (const w of shuffle(cand.slice(), rnd)) { const cw = tWord(w.w); if (seen.has(cw)) continue; seen.add(cw); others.push(w); if (others.length === 3) break; }
    const opts = shuffle([a, ...others], rnd);
    return { j, seer: !!a.cls, opts, ans: opts.indexOf(a) };
  });
  return { toks, blanks };
}
const learnRace = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);   // a stalled fetch must not freeze a step
async function learnLoadChapters(ns, ms) {   // the chapters that are in memory, or arrive within ms
  const chs = [...new Set(ns.map(chOf))]; const ok = new Set(chs.filter(c => D.ch[c])); const need = chs.filter(c => !D.ch[c]);
  if (need.length) await Promise.race([Promise.allSettled(need.map(c => chapter(c).then(() => ok.add(c)))), new Promise(r => setTimeout(r, ms))]);
  return ok;
}

// ── building the day's lesson: everything that shapes the step list is decided here, once ──
async function buildLesson(revOnly, tok) {
  const Ls = S.learn, today = learnDay(), goal = Ls.goal; const stale = () => tok !== LEARN.tok || !learnOnGo();
  const queue = learnQueue(); const first = revOnly ? 0 : (queue.find(n => !learnHas(n)) || 0);
  const c = first ? chOf(first) : 0;
  if (c) { try { await learnRace(chapter(c), 8000); } catch (e) { return { err: 'nc', c }; } grammar(c).catch(() => { }); }
  if (stale()) return { err: 'stale' };
  const byN = n => D.ch[chOf(n)].kurals[(n - 1) % 10];
  const gap = Ls.last ? today - Math.min(Ls.last.d, today) : 0;
  const byDue = (a, b) => S.srs[a].due - S.srs[b].due || a - b;
  const dueAll = goal === 'u' ? [] : Object.keys(S.srs).map(Number).filter(learnStillDue);
  const duePath = dueAll.filter(learnHas).sort(byDue), dueOther = dueAll.filter(n => !learnHas(n)).sort(byDue);   // only path-taught cards throttle
  let nNew = Ls.pace, nRev = 4, cap = 0;
  if (goal === 'u') nRev = 2;
  else if (goal === 'c') nRev = 6;                                   // a contestant keeps learning until nothing is left; after that every lesson is revision anyway
  else {
    if (Ls.days === 0) nRev = 2;                                                                                  // the first lesson ever always teaches
    else if (duePath.length >= LEARN_CAP.many && Ls.rvn < 2) { nNew = 0; nRev = LEARN_CAP.rev; }
    else if (duePath.length > LEARN_CAP.few) { nNew = 1; nRev = 6; }
    if (Ls.nw[0] === today && Ls.nw[1] >= LEARN_CAP.dayNew) { nNew = 0; nRev = Math.max(nRev, 6); cap = 1; }
  }
  if (!first) { nNew = 0; nRev = Math.max(nRev, LEARN_CAP.rev); }
  const ns = [], fast = [];
  if (nNew) {
    const share = queue.filter(n => chOf(n) === c && !learnHas(n));       // this chapter's untaught path kurals, in path order
    for (const n of share) {
      if (goal !== 'u' && learnFirm(n)) { if (fast.length < 3) { fast.push(n); ns.push(n); } continue; }   // known already: meet it and rebuild it, no more
      if (ns.length - fast.length >= nNew) break;
      ns.push(n);
    }
    const left = share.filter(n => !ns.includes(n));
    if (left.length === 1 && nNew >= 2 && !(goal !== 'u' && learnFirm(left[0]))) ns.push(left[0]);           // never leave a one-kural tail
  }
  let rv = [], picks = [];
  if (goal !== 'u') {
    const cand = [];
    if (Ls.last && Ls.last.d < today) for (const n of Ls.last.ns) { if (cand.length >= 2) break; if (!ns.includes(n) && S.srs[n]) cand.push({ n, g: learnStillDue(n) }); }   // yesterday's couplets take the first TWO slots, graded only if the deck calls them due
    for (const n of duePath.concat(dueOther)) if (!ns.includes(n) && !cand.some(x => x.n === n)) cand.push({ n, g: true });
    let pool = cand.slice(0, 12);
    if (!ns.length && pool.length < 4) {                                   // never a zero-step lesson: practise the youngest introduced couplets
      const intro = learnIntroduced().filter(n => !pool.some(x => x.n === n)).sort((a, b) => ((S.srs[a] || {}).ivl || 0) - ((S.srs[b] || {}).ivl || 0) || a - b);
      pool = pool.concat(intro.slice(0, 8).map(n => ({ n, g: false })));
    }
    const okCh = await learnLoadChapters(pool.map(x => x.n), 2500);
    if (stale()) return { err: 'stale' };
    rv = pool.filter(x => okCh.has(chOf(x.n))).slice(0, nRev);              // a review whose chapter is not on the device is dropped HERE and stays due
  } else {
    const intro = learnIntroduced().filter(n => !ns.includes(n));         // from the masks, not from what happens to be in memory
    const pref = (Ls.last ? Ls.last.ns : []).filter(n => learnHas(n) && !ns.includes(n));
    const cands = [...new Set(pref.concat(shuffle(intro, mulberry32(fnv1a('learn|' + today + '|p')))))].slice(0, ns.length ? 6 : 12);
    const okCh = await learnLoadChapters(cands, 2500);
    if (stale()) return { err: 'stale' };
    picks = cands.filter(n => okCh.has(chOf(n))).slice(0, ns.length ? 2 : 8);
  }
  const form = x => { const k = byN(x.n); const ivl = (S.srs[x.n] || {}).ivl || 0; const f = learnCantBuild(k) ? 'Q' : (ivl >= 7 && gap < 7) ? 'T' : 'R'; return (x.g ? f : f.toLowerCase()) + x.n; };
  const plan = [];
  if (gap >= 3 && Ls.last && Ls.last.ns.length) plan.push('Z0');
  if (goal === 'u') {
    picks.forEach(n => plan.push('P' + n));
    for (let i = 0; i < ns.length; i += 2) { const pair = ns.slice(i, i + 2); pair.forEach(n => plan.push('L' + n)); pair.forEach(n => plan.push('M' + n)); }   // meet two, then tell them apart
    if (ns.length >= 2) ns.slice(0, 2).forEach(n => plan.push('X' + n));
  } else {
    const codes = rv.map(form); const slow = ns.filter(n => !fast.includes(n));
    plan.push(...codes.slice(0, 2));                                        // a short retrieval of yesterday, then straight to the new couplet
    ns.forEach(n => { plan.push('L' + n); if (!fast.includes(n)) plan.push('S' + n); });
    slow.forEach(n => plan.push('M' + n));
    slow.filter(n => !learnCantBuild(byN(n)) && learnToks(byN(n)).some((_, j, a) => blankable(a, j))).forEach(n => plan.push('F' + n));
    plan.push(...codes.slice(2));                                           // the rest of the reviews are the spacer before the rebuild
    ns.forEach(n => plan.push((learnCantBuild(byN(n)) ? 'C' : 'B') + n));
    if (c && ns.length && chNs(c).filter(n => learnHas(n) || ns.includes(n)).length >= 2) plan.push('K' + c);
  }
  if (!plan.length || (plan.length === 1 && plan[0] === 'Z0')) return { err: 'empty' };
  if (S.learn !== Ls) return { err: 'stale' };                        // another tab rewrote the settings while this was building
  Ls.cur = { d: today, c, k: ns.length ? 'new' : 'rev', plan, i: 0, a: null, seed: (today * 31 + c) & 0xffff, nw: [], rc: 0, weak: [], cap };
  saveLearn();
  return { ok: true };
}

// ── the player: one hash for the whole lesson, the step lives in S.learn.cur.i ──
function learnEnter(rev) { LEARN.rev = !!rev; if (location.hash.startsWith('#/learn') && !learnOnGo()) location.replace('#/learn/go'); else location.hash = '#/learn/go'; }   // from the hub the player REPLACES the hub entry, so finishing never leaves two identical entries behind
async function viewLearnGo() {
  await meta();
  if (!S.learn) { location.replace('#/learn'); return; }
  const my = ++LEARN.tok; const today = learnDay(); let cur = S.learn.cur;
  const wasRev = !!(cur && cur.k === 'rev' && !cur.c);            // an untouched review-only lesson is rebuilt as one (offline, the next chapter may not be there)
  if (cur && ((cur.i === 0 && !cur.a) || today - Math.min(cur.d, today) > 7)) cur = S.learn.cur = null;   // nothing answered yet, or too old to mean anything
  setTitle(t('lnTitle'), t('lnName'));
  if (!cur) {
    render(`<div class="card muted">⏳ ${t('lnBuilding')}</div>`);
    const r = await buildLesson(LEARN.rev || wasRev, my); LEARN.rev = false;
    if (my !== LEARN.tok || !learnOnGo()) return;                        // the learner left while it was building: render nothing over the new view
    if (!r.ok || !S.learn.cur) { location.replace('#/learn' + (r.err === 'nc' ? '?nc=' + r.c : r.err === 'empty' ? '?e=1' : '')); return; }
    cur = S.learn.cur;
  }
  render(`<div class="card ln" aria-live="off"><div class="row"><span class="chip sel" id="ln-count"></span><span class="muted" id="ln-kind"></span></div>
    <div class="t-prog"><i id="ln-bar"></i></div><div id="ln-step"></div><div id="ln-fb" class="ln-sr" role="status" aria-live="polite"></div>
    <div class="ln-foot"><button class="ln-link" id="ln-enough" hidden>${t('lnEnough')}</button></div></div>`);
  $('#ln-enough').onclick = () => { if (LEARN.busy) return; LEARN.busy = true; commitLesson(); };
  goStep();
}
function learnAdvance() { const cur = S.learn && S.learn.cur; if (!cur) { LEARN.busy = false; location.replace('#/learn'); return; } cur.i++; cur.a = null; saveLearn(); goStep(); }
function learnNextHTML(label, hidden) { return `<div class="actions ln-actions"><button class="btn primary" id="ln-next" ${hidden ? 'hidden' : ''}>${label || t('lnNext')} →</button></div>`; }
function learnWireNext(before) { const b = $('#ln-next'); if (b) b.onclick = () => { if (LEARN.busy) return; LEARN.busy = true; if (before) before(); learnAdvance(); }; }
function learnWireMore(host, onToggle) { $$('.ln-more', host).forEach(b => b.onclick = () => { const m = b.previousElementSibling; const open = m.classList.toggle('clamp') === false; b.setAttribute('aria-expanded', open); b.textContent = open ? t('lnLess') : t('lnMore'); if (onToggle) onToggle(open); }); }
function learnSettle(sel) { const h = $('#ln-step .ln-h'); if (h) h.focus({ preventScroll: true }); const el = sel && $(sel); if (el) el.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0); }   // F, B and T open on the part that is tapped, not on a screen of cue text
function learnAnswered(el) { el = el || $('#ln-res'); if (!el) return; el.focus({ preventScroll: true }); const nx = $('#ln-next'); (nx || el).scrollIntoView({ block: 'nearest' }); const en = $('#ln-enough'), cur = S.learn.cur; if (en && cur) en.hidden = !(cur.nw.length >= 1 || cur.rc >= 3); }
async function goStep() {
  const my = ++LEARN.tok; const cur = S.learn && S.learn.cur; const host = $('#ln-step'); if (!cur || !host) return;
  TTS.stop(); closeSheet(); LEARN.open = false;                 // step swaps fire no hashchange, so audio and sheets are closed here
  if (cur.i >= cur.plan.length) return commitLesson();
  const code = cur.plan[cur.i], K = code[0].toUpperCase(), graded = code[0] === K, n = +code.slice(1);
  setTitle(t('lnTitle'), `${cur.c ? t('lnChShort') + ' ' + cur.c + ' · ' : ''}${fmt(t('lnStepOf'), { i: cur.i + 1, n: cur.plan.length })}`);
  $('#ln-count').textContent = `${cur.i + 1} / ${cur.plan.length}`;
  $('#ln-kind').textContent = cur.cap ? t('lnCapShort') : cur.k === 'rev' ? t('lnRevShort') : '';
  $('#ln-bar').style.width = Math.round(100 * cur.i / cur.plan.length) + '%';
  $('#ln-enough').hidden = !(cur.nw.length >= 1 || cur.rc >= 3);
  let k = null, recap = [];
  try {
    if (K === 'K') await learnRace(chapter(n), 6000);
    else if (K === 'Z') recap = (await Promise.allSettled((S.learn.last ? S.learn.last.ns : []).slice(0, 3).map(kural))).filter(r => r.status === 'fulfilled').map(r => r.value);
    else { k = await learnRace(kural(n), 6000); if ((K === 'M' || K === 'X') && cur.c) await learnRace(chapter(cur.c), 4000).catch(() => { }); }   // today's other couplets are distractors: the same set on every render
  } catch (e) { if (my !== LEARN.tok || !$('#ln-step')) return; host.innerHTML = `<h2 class="ln-h" tabindex="-1">${t('lnCantOpen')}</h2>${learnNextHTML()}`; learnWireNext(); learnSettle(''); learnSayLive(t('lnCantOpen')); LEARN.busy = false; return; }   // grades nothing, removes nothing
  if (my !== LEARN.tok || !$('#ln-step') || !learnOnGo()) return;
  const run = { Z: stepRecap, L: stepLearn, S: stepSay, M: stepMeaning, P: stepMeaning, X: stepWhich, F: stepFill, R: stepFill, B: stepBank, T: stepBank, C: stepRecall, Q: stepRecall, K: stepChain }[K];
  if (!run) { host.innerHTML = `<h2 class="ln-h" tabindex="-1">${t('lnCantOpen')}</h2>${learnNextHTML()}`; learnWireNext(); learnSettle(''); learnSayLive(t('lnCantOpen')); LEARN.busy = false; return; }   // a step letter from a newer version
  run(host, K === 'Z' ? recap : k, n, K, graded);
  learnWireMore(host, o => { LEARN.open = o; }); learnSettle('FRBT'.includes(K) && !(cur.a && (cur.a.e !== undefined || (cur.a.p && K !== 'F' && K !== 'R'))) ? '#ln-step .ln-focus' : '');
  LEARN.busy = false;                                            // the latch opens only once the new step is on screen, so a double tap cannot skip one
}
const learnRevChip = K => 'RTQP'.includes(K) ? `<div class="ln-lab">${t('lnRevHead')}</div>` : '';
const learnAudioHTML = () => `<div class="row"><button class="btn" id="ln-hear">🔊 ${t('lnHear')}</button></div><div class="ln-hint">${t('lnNoAudio')}</div>`;
const learnWireAudio = k => { const b = $('#ln-hear'); if (b) b.onclick = e => reciteKural(k, e.currentTarget); };
const learnHead = (k, n, focus) => `<div class="kural-head ${focus ? 'ln-focus' : ''}"><span class="n">${t('kural')} ${n}</span><span class="ch">${esc(chName(chMeta(chOf(n))))}</span></div>`;

function stepRecap(host, ks) {
  host.innerHTML = `<h2 class="ln-h" tabindex="-1">${t('lnRecapTitle')}</h2><div class="muted">${t('lnRecapSub')}</div>
    ${ks.map(k => `<div class="ln-block">${learnHead(k, k.n)}${learnCouplet(k)}${learnMeanHTML(k, null, false)}<div class="row"><button class="btn ln-hearn" data-n="${k.n}">🔊 ${t('lnHear')}</button></div></div>`).join('')}
    <div class="ln-hint">${t('lnNoAudio')}</div>${learnNextHTML()}`;
  $$('.ln-hearn', host).forEach(b => b.onclick = e => reciteKural(ks.find(k => k.n === +b.dataset.n), e.currentTarget));
  learnWireNext();
}
function stepLearn(host, k, n) {
  const cur = S.learn.cur, ml = S.learn.ml, shown = !!(cur.a && cur.a.r); const code = learnOneStream([k]);
  const extra = code === 'ta' ? (k.prose.tac ? `<details class="ln-det"><summary>${t('lnMoreUrai')}</summary><div class="ln-mean">${esc(k.prose.tac)}</div><div class="ln-lab">${t('lnLabTac')}</div></details>` : '')
    : (code !== 'p-en' && k.prose.en ? `<details class="ln-det"><summary>${t('lnLabEnProse')}</summary><div class="ln-mean" lang="en">${esc(k.prose.en)}</div></details>` : '');
  const canSkip = S.learn.goal !== 'u' && cur.plan.indexOf('B' + n) > cur.i && !(cur.to || []).includes(n) && cur.plan.indexOf('S' + n) > cur.i;
  host.innerHTML = `<h2 class="ln-h" tabindex="-1">${t('lnLearnHead')}</h2>${learnHead(k, n)}${learnCouplet(k)}${learnAudioHTML()}
    <div class="muted" id="ln-inst">${t('lnLearnHint')}</div>
    <div id="ln-mbox" ${shown ? '' : 'hidden'}>${learnMeanHTML(k, code)}${extra}
      <details class="ln-det" id="ln-words"><summary>${t('lnWordsOpen')}</summary><div id="ln-wbody" class="muted">…</div></details></div>
    <div class="actions ln-actions"><button class="btn primary" id="ln-show" ${shown ? 'hidden' : ''}>${t('lnShowMeaning')}</button><button class="btn primary" id="ln-next" ${shown ? '' : 'hidden'}>${t('lnNext')} →</button></div>
    ${canSkip ? `<button class="ln-link" id="ln-know">${t('lnKnowIt')}</button>` : ''}`;
  learnWireAudio(k); learnWireNext();
  $('#ln-show').onclick = () => { cur.a = { r: 1 }; saveLearn(); $('#ln-mbox').hidden = false; $('#ln-show').hidden = true; $('#ln-next').hidden = false; $('#ln-inst').hidden = true; learnSayLive(learnText(k, code)); $('#ln-next').focus({ preventScroll: true }); };
  const kn = $('#ln-know'); if (kn) kn.onclick = () => {           // test-out: its practice steps are dropped; the rebuild stays where it is and still has to be passed
    if (LEARN.busy) return; LEARN.busy = true;
    cur.plan = cur.plan.filter((c, j) => j <= cur.i || !(/^[SMF]/.test(c) && +c.slice(1) === n)); cur.to = (cur.to || []).concat(n); learnAdvance();
  };
  $('#ln-words').ontoggle = async e => {
    if (!e.currentTarget.open || e.currentTarget.dataset.done) return; e.currentTarget.dataset.done = 1; const body = $('#ln-wbody');
    try {
      const gr = (await grammar(chOf(n))).kurals[String(n)]; if (!$('#ln-wbody')) return; const words = gr.words;
      const clean = s => String(s || '').replace(/\s*[(\[][^)\]]*[)\]]/g, '').trim();
      let rows;
      if (ml === 'ta') rows = words.map((w, i) => ({ i, a: w.w, b: w.c.map(c => c.s).join(' + ') })).filter(r => tWord(r.b) !== tWord(r.a) && r.b[0] === r.a[0]);   // பதம் பிரித்தல் only; a fragment whose first letter belongs to the previous word is left to the word sheet
      else rows = words.map((w, i) => ({ i, w, a: w.w, b: w.c.map(c => clean(c.gloss)).filter(Boolean).join(' + ') })).filter(r => r.b && r.w.c.some(c => ['பெயர்', 'வினை', 'உரி'].includes(c.cat)) && r.w.c.every(c => (c.conf || 0) >= 0.7)).slice(0, 4);
      body.classList.remove('muted');
      body.innerHTML = (rows.length ? rows.map(r => `<div class="ln-wrow"><b>${esc(r.a)}</b><span ${ml === 'ta' ? '' : 'lang="en"'}>${esc(r.b)}</span><button class="btn small ln-wbtn" data-i="${r.i}" aria-label="${esc(r.a)} · ${esc(t('grammar'))}">📚</button></div>`).join('') : `<div class="muted">${t(ml === 'ta' ? 'lnWordsWhole' : 'lnWordsNone')}</div>`)
        + `<div class="ln-lab">${ml === 'ta' ? t('lnSplitNote') : t('lnGlossEn')}</div>`;
      $$('.ln-wbtn', body).forEach(b => b.onclick = () => openWordSheet(k, words[+b.dataset.i], gr, +b.dataset.i));
    } catch (err) { if (body) body.textContent = t('lnWordsNone'); }
  };
}
function stepSay(host, k, n) {
  const toks = testTokens(k); const seer = toks.every(x => x.cls);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const task = (i, label, hide) => `<div class="ln-say"><div class="ln-sayt">${i}. ${label}</div><div class="row">${hide ? `<button class="btn ln-hide" data-h="${hide}">🙈 ${t('lnHide')}</button>` : `<button class="btn ln-hearb">🔊 ${t('lnHear')}</button>`}<button class="btn ln-said" aria-pressed="false">${t('lnSaidIt')}</button></div></div>`;
  host.innerHTML = `<h2 class="ln-h" tabindex="-1">${t('lnSayHead')}</h2>${learnHead(k, n)}<div id="ln-saybox" data-h="0">${learnCouplet(k)}</div><div class="ln-lab">${t(seer ? 'seer' : 'wordOne')} · ${toks.length}</div>
    ${task(1, t('lnSay1'), 0)}${task(2, t('lnSay2'), 1)}${task(3, t('lnSay3'), 2)}
    <div class="ln-hint">${t('lnNoAudio')}</div>
    <div class="row ln-links"><a class="ln-link" href="#/practice/${n}/listen">🎵 ${t('lnWithBeat')}</a>${SR ? `<a class="ln-link" href="#/practice/${n}/recite">🎤 ${t('lnVoiceCheck')}</a>` : ''}</div>
    ${learnNextHTML(learnAid() ? t('lnSkipStep') : '')}`;
  const box = $('#ln-saybox');
  $$('.ln-hearb', host).forEach(b => b.onclick = e => reciteKural(k, e.currentTarget));
  $$('.ln-hide', host).forEach(b => b.onclick = () => { const on = box.dataset.h !== b.dataset.h; box.dataset.h = on ? b.dataset.h : '0'; $$('.ln-hide', host).forEach(x => { x.textContent = (x === b && on) ? '👁 ' + t('lnShowLine') : '🙈 ' + t('lnHide'); }); });   // the label carries the state
  $$('.ln-said', host).forEach(b => b.onclick = () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); b.classList.toggle('on', on); b.textContent = (on ? '✓ ' : '') + t('lnSaidIt'); });
  learnWireNext();                                               // enabled from the first frame: a silent room never blocks
}
// answer-once multiple choice with the right answer revealed; the answered state lives in cur.a.p
function learnMCQ(host, o) {
  const cur = S.learn.cur;
  host.innerHTML = `${o.chip || ''}<h2 class="ln-h" tabindex="-1">${o.head}</h2>${o.promptHTML}<div class="t-opts t-lines ln-opts">${o.opts.map((h, i) => `<button class="btn t-opt ln-opt" data-o="${i}">${h}</button>`).join('')}</div><div id="ln-res" tabindex="-1"></div>`;
  learnArm();
  const show = (pickI, fresh) => {
    $$('.ln-opt', host).forEach(b => { const i = +b.dataset.o; b.disabled = true; if (i === o.ans) { b.classList.add('ok'); b.insertAdjacentHTML('afterbegin', '<b>✓ </b>'); b.setAttribute('aria-label', `${t('correct')}: ${b.textContent}`); } else if (i === pickI) { b.classList.add('bad'); b.insertAdjacentHTML('afterbegin', '<b>✗ </b>'); } });
    const ok = pickI === o.ans;
    $('#ln-res').innerHTML = `<div class="t-fb ${ok ? 'ok' : 'bad'}"><b>${ok ? t('lnRight') : o.wrongLead}</b>${o.after || ''}${learnNextHTML()}</div>`;
    if (fresh) { cur.a = { p: [pickI] }; if (o.onDone) o.onDone(ok); saveLearn(); learnAnswered(); }
    learnWireNext();
  };
  const a = cur.a && cur.a.p ? cur.a.p[0] : undefined;
  if (a !== undefined) show(a, false); else $$('.ln-opt', host).forEach(b => b.onclick = () => { if (learnTooSoon()) return; show(+b.dataset.o, true); });
}
const learnTodayNew = cur => cur.plan.filter(c => c[0] === 'L').map(c => +c.slice(1));
const learnLastOwn = (cur, n) => !cur.plan.some((c, j) => j > cur.i && /^[BCX]/.test(c) && +c.slice(1) === n);   // the commit point comes from the frozen plan, not from the live goal
function stepMeaning(host, k, n, K) {
  const cur = S.learn.cur; const rnd = mulberry32(fnv1a(`learn|${cur.seed}|${cur.i}`));
  const mates = D.ch[chOf(n)].kurals.filter(x => x.n !== n);
  const others = K === 'P' ? [] : learnTodayNew(cur).filter(x => x !== n && D.ch[chOf(x)]).map(x => D.ch[chOf(x)].kurals[(x - 1) % 10]).slice(0, 2);   // today's other couplet is the distractor that matters
  const pool = others.concat(shuffle(mates.filter(x => !others.includes(x)), rnd));
  const code = learnOneStream([k, ...pool.slice(0, 2)]); const seen = new Set([learnText(k, code)]); const wrong = [];
  for (const x of pool) { const tx = learnText(x, code); if (!tx || seen.has(tx)) continue; seen.add(tx); wrong.push(tx); if (wrong.length === 2) break; }
  const m = mcqOpts(learnText(k, code), wrong, rnd); const lang = learnLang(code); const rtl = L(lang) && L(lang).dir === 'rtl';
  const isCommit = K === 'M' && !cur.plan.some((c, j) => /^[BC]/.test(c) && +c.slice(1) === n) && learnLastOwn(cur, n);
  learnMCQ(host, {
    chip: learnRevChip(K), head: t('lnMeanQ'), promptHTML: `${learnHead(k, n)}<div class="ln-compact">${learnCouplet(k)}</div><div class="ln-lab">${esc(learnLabel(code))}</div>`,
    opts: m.opts.map(tx => `<span class="${scriptClass(lang)} ${rtl ? 'rtl' : ''}" lang="${esc(lang)}"${dirAttr(lang)}>${esc(tx)}</span>`), ans: m.ans, wrongLead: t('lnWrongMeaning'),   // the whole meaning: Tamil is verb-final, a clipped option loses the part that tells two meanings apart
    after: isCommit ? `<div class="ln-ok">${fmt(t('lnIntroducedU'), { n })}</div>` : '',
    onDone: () => { if (isCommit) learnCommit(n); if (K === 'P') cur.rc++; },
  });
}
function stepWhich(host, k, n) {
  const cur = S.learn.cur; const rnd = mulberry32(fnv1a(`learn|${cur.seed}|${cur.i}`)); const code = learnOneStream([k]); const mine = learnText(k, code);
  const ns = learnTodayNew(cur).filter(x => D.ch[chOf(x)] && (x === n || learnText(D.ch[chOf(x)].kurals[(x - 1) % 10], code) !== mine));   // two couplets with one translation cannot be told apart by it
  let others = shuffle(ns.filter(x => x !== n), rnd).slice(0, 2);
  if (others.length < 2) others = others.concat(shuffle(D.ch[chOf(n)].kurals.filter(x => x.n !== n && !others.includes(x.n) && learnText(x, code) !== mine).map(x => x.n), rnd)).slice(0, 2);   // top up from the chapter
  const m = mcqOpts(n, others, rnd);
  const opt = x => { const kk = D.ch[chOf(x)].kurals[(x - 1) % 10]; return `<span class="ln-mini">${esc(kk.l1)}<br>${esc(kk.l2)}</span>${kk.tl && kk.tl[0] ? `<span class="ln-tl">${esc(kk.tl[0])} ${esc(kk.tl[1] || '')}</span>` : ''}`; };
  learnMCQ(host, {
    head: t('lnWhichKural'), promptHTML: learnMeanHTML(k, code), opts: m.opts.map(opt), ans: m.ans, wrongLead: t('lnWrongKural'),
    after: `<div class="ln-ok">${fmt(t('lnIntroducedU'), { n })}</div>`, onDone: () => learnCommit(n),
  });
}
// two blanks, answered one after the other; R grades the card, r and F do not
function stepFill(host, k, n, K, graded) {
  const cur = S.learn.cur; const rnd = mulberry32(fnv1a(`learn|${cur.seed}|${cur.i}`));
  const { toks, blanks } = learnFill(k, 2, rnd);
  if (!blanks.length) return stepRecall(host, k, n, K === 'F' ? 'C' : 'Q', graded);
  const given = cur.a && cur.a.p ? cur.a.p.slice() : []; const done = given.length >= blanks.length; const at = given.length;
  const slot = (x, j) => { const bi = blanks.findIndex(b => b.j === j); if (bi < 0) return `<span class="tw">${esc(x.w)}</span>`;
    if (bi < at) { const ok = given[bi] === blanks[bi].ans; return `<span class="tw blank shown ${ok ? '' : 'miss'}">${ok ? '✓ ' : '→ '}${esc(stripPunct(x.w))}${esc(tPunct(x.w))}</span>`; }   // the text of the kural never carries a cross
    return `<span class="tw blank ${bi === at ? 'cur' : ''}" role="img" aria-label="${esc(t(blanks[bi].seer ? 'seer' : 'wordOne'))} ${bi + 1}"><i>${bi + 1}</i>${esc(tPunct(x.w))}</span>`; };
  const lines = [0, 1].map(li => toks.map((x, j) => x.li === li ? slot(x, j) : '').filter(Boolean).join(' '));
  const right = given.filter((g, i) => g === blanks[i].ans).length; const hide = new Set(done ? [] : blanks.slice(at).map(b => b.j));
  host.innerHTML = `${learnRevChip(K)}<h2 class="ln-h" tabindex="-1">${t(blanks.every(b => b.seer) ? 'lnFillSeer' : 'lnFillWord')}</h2>${learnHead(k, n, true)}
    ${K === 'F' ? learnMeanHTML(k, null, true, LEARN.open) : ''}
    <div class="couplet test-c"><div class="line l1">${lines[0]}</div><div class="line l2">${lines[1]}</div></div>${learnAid() ? learnTlMasked(toks, hide) : ''}
    ${done ? `<div class="t-fb ${right === blanks.length ? 'ok' : 'bad'}" id="ln-res" tabindex="-1"><b>${right === blanks.length ? t('lnRight') : fmt(t('lnWrongWord'), { w: blanks.filter((b, i) => given[i] !== b.ans).map(b => stripPunct(toks[b.j].w)).join(' · ') })}</b>
        <div class="row" style="margin-top:6px"><button class="btn" id="ln-hear">🔊 ${t('lnHear')}</button><a class="btn" href="#/k/${n}">📖 ${t('kural')} ${n}</a></div>${learnNextHTML()}</div>`
      : `${at > 0 ? `<div class="ln-prev ${given[at - 1] === blanks[at - 1].ans ? 'ok' : ''}">${given[at - 1] === blanks[at - 1].ans ? fmt(t('lnPrevOk'), { x: t(blanks[at - 1].seer ? 'seer' : 'wordOne'), i: at }) : fmt(t('lnPrevMiss'), { x: t(blanks[at - 1].seer ? 'seer' : 'wordOne'), i: at, w: stripPunct(toks[blanks[at - 1].j].w) })}</div>` : ''}<div class="ln-lab">${t(blanks[at].seer ? 'seer' : 'wordOne')} ${at + 1}</div><div class="t-opts t-lines ln-opts">${blanks[at].opts.map((w, oi) => `<button class="btn t-opt ln-opt" data-o="${oi}">${esc(stripPunct(w.w))}${learnTlUnder(w)}</button>`).join('')}</div>`}`;
  if (done) { learnWireAudio(k); learnWireNext(); return; }
  learnArm();
  $$('.ln-opt', host).forEach(b => b.onclick = () => {
    if (LEARN.busy || learnTooSoon()) return; LEARN.busy = true;
    const oi = +b.dataset.o; given.push(oi); cur.a = { p: given }; const hit = oi === blanks[at].ans;
    if (given.length >= blanks.length) {                          // the grade and the answered state go out in ONE write, so a reload cannot regrade
      const ok = given.filter((g, i) => g === blanks[i].ans).length;
      if (K === 'R') { cur.rc++; if (graded && learnStillDue(n)) learnGrade(n, ok === blanks.length ? 2 : ok > 0 ? 1 : 0); }
    }
    saveLearn(); LEARN.busy = false; stepFill(host, k, n, K, graded); learnWireMore(host, o => { LEARN.open = o; });
    if ($('#ln-res')) learnAnswered(); else { learnSayLive(`${hit ? '✓' : '✗ ' + t('answerWas') + ':'} ${stripPunct(toks[blanks[at].j].w)}`); const f = $('.ln-opt', host); if (f) f.focus({ preventScroll: true }); }
  });
}
// the lesson's real test: rebuild the whole couplet from tiles. Guessing costs more than remembering, yet nobody gets stuck.
function stepBank(host, k, n, K, graded) {
  const cur = S.learn.cur, goalC = S.learn.goal === 'c'; const rnd = mulberry32(fnv1a(`learn|${cur.seed}|${cur.i}`));
  const toks = learnToks(k); const own = new Set(toks.map(x => tWord(x.w))); const seer = toks.every(x => x.cls);
  const pre = toks.map((x, j) => !blankable(toks, j) || (goalC && j === 0));
  const need = toks.map((_, j) => j).filter(j => !pre[j]);
  const extra = toks.length <= 7 ? shuffle(D.ch[chOf(n)].kurals.filter(x => x.n !== n && testable(x)).flatMap(x => learnToks(x)).filter(w => !own.has(tWord(w.w)) && tWord(w.w).length >= 3), rnd).filter((w, i, a) => a.findIndex(y => tWord(y.w) === tWord(w.w)) === i).slice(0, 2) : [];
  const tiles = shuffle(need.map(j => ({ x: toks[j], used: false })).concat(extra.map(x => ({ x, used: false }))), rnd);
  const st = { pos: 0, e: 0, miss: 0, help: false, bad: -1, msg: '', filled: {}, lastI: -1, lastT: 0 }; const t0 = performance.now();
  const finish = fresh => {
    const a = cur.a; const q = (a.h || a.e >= 4) ? 0 : a.e >= 2 ? 1 : 2;
    if (fresh) {
      if (K === 'T') { cur.rc++; if (graded && learnStillDue(n)) learnGrade(n, q); } else learnCommit(n, q, (cur.to || []).includes(n));
      if (a.e >= 3 && !cur.weak.includes(n) && cur.weak.length < 3) cur.weak.push(n);
      saveLearn();
    }
    host.innerHTML = `${learnRevChip(K)}<h2 class="ln-h" tabindex="-1">${t('lnBuildHead')}</h2>${learnHead(k, n)}${learnCouplet(k)}
      <div class="t-fb ok" id="ln-res" tabindex="-1"><b>${K === 'B' ? fmt(t('lnIntroduced'), { n }) : t('lnBuilt')}</b>${a.h ? `<div class="muted">${t('lnTileHelped')}</div>` : ''}
        <div class="row" style="margin-top:6px"><button class="btn" id="ln-hear">🔊 ${t('lnHear')}</button><a class="btn" href="#/k/${n}">📖 ${t('kural')} ${n}</a></div>${learnNextHTML()}</div>`;
    learnWireAudio(k); learnWireNext();
    if (fresh) learnAnswered();
  };
  if (cur.a && cur.a.e !== undefined) return finish(false);
  const paint = focusI => {
    // an empty slot holds its own word, invisibly: empty and filled slots are exactly as wide, so nothing re-wraps and the bank never moves
    const slot = (x, j) => pre[j] ? `<span class="ln-slot pre">${esc(x.w)}</span>`
      : st.filled[j] ? `<span class="ln-slot ${st.filled[j] === 2 ? 'help' : 'ok'}">${esc(stripPunct(x.w))}${esc(tPunct(x.w))}${st.filled[j] === 2 ? `<i>${t('lnTileHelp')}</i>` : ''}</span>`
        : `<span class="ln-slot ${need[st.pos] === j ? 'cur' : ''}" role="img" aria-label="${esc(t(x.cls ? 'seer' : 'wordOne'))} ${need.indexOf(j) + 1}"><span class="ln-ghost" aria-hidden="true">${esc(stripPunct(x.w))}${esc(tPunct(x.w))}</span></span>`;
    const lines = [0, 1].map(li => toks.map((x, j) => x.li === li ? slot(x, j) : '').filter(Boolean).join(' '));
    const cue = goalC ? `${learnHead(k, n, true)}<details class="ln-det" ${LEARN.open ? 'open' : ''}><summary>${t('prose')}</summary>${learnMeanHTML(k)}</details>` : `${learnHead(k, n, true)}${learnMeanHTML(k, null, true, LEARN.open)}`;
    host.innerHTML = `${learnRevChip(K)}<h2 class="ln-h" tabindex="-1">${t('lnBuildHead')}</h2>${cue}
      <div class="ln-slots"><div class="ln-sl l1">${lines[0]}</div><div class="ln-sl l2">${lines[1]}</div></div>
      <div class="ln-lab">${t(seer ? 'lnBuildSeer' : 'lnBuildWord')} · ${fmt(t('lnTileCount'), { a: st.pos, b: need.length })}</div>
      <div class="ln-hint ln-tilemsg" id="ln-tilemsg">${esc(st.msg)}</div>
      <div class="ln-bank">${tiles.map((tl, i) => `<button class="ln-tile ${st.bad === i ? 'bad' : ''} ${tl.used ? 'used' : ''}" data-i="${i}" ${tl.used ? 'disabled aria-hidden="true" tabindex="-1"' : ''}>${esc(stripPunct(tl.x.w))}${learnTlUnder(tl.x)}</button>`).join('')}</div>`;   // used tiles keep their place, so the bank never moves under the finger
    learnWireMore(host, o => { LEARN.open = o; });
    const det = $('.ln-det', host); if (det) det.ontoggle = () => { LEARN.open = det.open; };
    $$('.ln-tile:not(.used)', host).forEach(b => b.onclick = () => tap(+b.dataset.i));
    if (focusI !== undefined) { const order = tiles.map((_, x) => (focusI + x) % tiles.length).filter(x => !tiles[x].used); const f = order.length && $(`.ln-tile[data-i="${order[0]}"]`, host); if (f) f.focus({ preventScroll: true }); }   // the tapped tile if it is still there, else the next one along
  };
  const place = (j, how, i) => { st.filled[j] = how; st.pos++; st.miss = 0; if (i === undefined || tWord(tiles[i].x.w) !== tWord(toks[j].w) || tiles[i].used) i = tiles.findIndex(tl => !tl.used && tWord(tl.x.w) === tWord(toks[j].w)); if (i >= 0) tiles[i].used = true; };
  const tap = i => {
    const now = performance.now();                                // only a repeat tap on the SAME tile is a double tap; a fast tap on another tile is a learner who knows the couplet
    if (tiles[i].used || now - t0 < 350 || (i === st.lastI && now - st.lastT < 350)) return; st.lastI = i; st.lastT = now;
    const j = need[st.pos]; const word = stripPunct(toks[j].w); const label = t(toks[j].cls ? 'seer' : 'wordOne');
    if (tWord(tiles[i].x.w) === tWord(toks[j].w)) { place(j, 1, i); st.bad = -1; st.msg = ''; learnSayLive(`${word} ✓ ${fmt(t('lnTileCount'), { a: st.pos, b: need.length })}`); }
    else {
      st.e++; st.miss++; st.bad = i;
      if (st.miss >= 2) { st.help = true; place(j, 2); st.bad = -1; st.msg = fmt(t('lnTileHelpedMsg'), { w: word, x: label }); learnSayLive(`${st.msg} · ${fmt(t('lnTileCount'), { a: st.pos, b: need.length })}`); }
      else { st.msg = t('lnTileNo'); learnSayLive(st.msg); }
    }
    if (st.pos >= need.length) { cur.a = { e: st.e, h: st.help ? 1 : 0 }; return finish(true); }
    paint(i);
  };
  if (!need.length) { cur.a = { e: 0, h: 0 }; return finish(true); }
  paint();
}
function learnCommit(n, q, testedOut) {                          // the kural's last own step: mask bit + first card, kept even if the lesson is abandoned
  const Ls = S.learn, cur = Ls.cur; if (!cur || cur.nw.includes(n)) return;
  learnSet(n);
  if (Ls.goal !== 'u') { const c = S.srs[n]; if (!c) learnGrade(n, testedOut && q === 2 ? 2 : 1); else if (learnStillDue(n)) learnGrade(n, q === undefined ? 1 : q); }
  cur.nw.push(n); const d = learnDay(); if (Ls.nw[0] !== d) Ls.nw = [d, 0]; Ls.nw[1]++;
}
// self-marked recall, only where the rebuild cannot run (five untestable kurals, unaligned transliteration)
function stepRecall(host, k, n, K, graded) {
  const cur = S.learn.cur; const isNew = K === 'C'; const first = learnFirstWord(k);
  const a = cur.a && cur.a.p ? cur.a.p[0] : undefined;
  const result = () => `<div class="t-fb ok" id="ln-res" tabindex="-1"><b>${isNew ? fmt(t('lnIntroduced'), { n }) : t('lnNoted')}</b>${learnNextHTML()}</div>`;
  host.innerHTML = `${learnRevChip(K)}<h2 class="ln-h" tabindex="-1">${t('lnRecallHead')}</h2>${learnHead(k, n)}${learnMeanHTML(k, null, true)}
    ${first ? `<div class="ln-lab">${fmt(t('lnStartsWith'), { w: first, n })}</div>` : ''}
    <div class="muted" id="ln-rhint">${t('lnRecallHint')}</div>
    <div id="ln-ans" ${a === undefined ? 'hidden' : ''}>${learnCouplet(k)}<div class="row"><button class="btn" id="ln-hear">🔊 ${t('lnHear')}</button></div></div>
    <div id="ln-rbox">${a !== undefined ? result() : `<div class="actions ln-actions"><button class="btn primary" id="ln-reveal">👁 ${t('lnShowKural')}</button>${learnAid() ? `<button class="btn" id="ln-pass">${t('lnSkipStep')}</button>` : ''}</div>`}</div>`;
  learnWireAudio(k);
  const mark = v => {                                             // v: 1 could say it · 0 more practice · -1 skipped
    if (LEARN.busy) return; LEARN.busy = true; cur.a = { p: [v] };
    if (isNew) { learnCommit(n, 1); if (v === 0 && !cur.weak.includes(n) && cur.weak.length < 3) cur.weak.push(n); }
    else { cur.rc++; if (v >= 0 && graded && learnStillDue(n)) learnGrade(n, v === 1 ? 2 : 1); }     // never q0, never a cross: this is self-report. A skipped review stays due.
    saveLearn(); LEARN.busy = false; $('#ln-rbox').innerHTML = result(); learnWireNext(); learnAnswered();
  };
  if (a !== undefined) return learnWireNext();
  $('#ln-reveal').onclick = () => { $('#ln-ans').hidden = false; $('#ln-rhint').hidden = true;
    $('#ln-rbox').innerHTML = `<div class="actions ln-actions"><button class="btn primary" id="ln-yes">${t('lnRecallYes')}</button><button class="btn" id="ln-more2">${t('lnRecallMore')}</button></div>`;
    $('#ln-yes').onclick = () => mark(1); $('#ln-more2').onclick = () => mark(0); $('#ln-more2').scrollIntoView({ block: 'nearest' }); $('#ln-yes').focus({ preventScroll: true }); };
  const ps = $('#ln-pass'); if (ps) ps.onclick = () => mark(-1);
}
function stepChain(host, k0, c) {
  const cm = chMeta(c); const ks = D.ch[c].kurals.filter(k => learnHas(k.n)).slice(0, 10);
  host.innerHTML = `<h2 class="ln-h" tabindex="-1">${t('lnChainHead')}</h2><div class="kural-head"><span class="ch">${t('adhigaram')} ${c} · ${esc(chName(cm))}</span></div>
    <div class="muted">${t('lnChainHint')}</div>
    <ul class="ln-chain">${ks.map(k => `<li><b>${k.n}</b>${learnFirstWord(k) ? ` · ${esc(learnFirstWord(k))} …` : ''}<div class="ln-chainfull" hidden>${esc(k.l1)}<br>${esc(k.l2)}${learnAid() && k.tl && k.tl[0] ? `<span class="ln-tl">${esc(k.tl[0])} ${esc(k.tl[1] || '')}</span>` : ''}</div></li>`).join('')}</ul>
    <div class="actions ln-actions"><button class="btn" id="ln-cshow">👁 ${t('lnChainShow')}</button><button class="btn primary" id="ln-next">${learnAid() ? t('lnSkipStep') : t('lnChainDone')} →</button></div>`;
  $('#ln-cshow').onclick = () => { $$('.ln-chainfull', host).forEach(e => { e.hidden = false; }); $('#ln-next').focus({ preventScroll: true }); $('#ln-cshow').hidden = true; learnSayLive(t('lnChainShown')); };
  learnWireNext();
}
function commitLesson() {
  const Ls = S.learn, cur = Ls && Ls.cur;
  if (cur) {                                                       // a second tap finds nothing to commit
    const d = learnDay(); const did = cur.nw.length + cur.rc > 0;
    if (did) {
      const r = Ls.run;
      if (r.last > d) r.last = d;                                  // the clock was ahead once; do not freeze the run on it
      else if (r.last !== d) {
        Ls.days++;
        if (d - r.last === 1) r.n++;
        else if (d - r.last === 2 && d - r.g >= 7) { r.n++; r.g = d - 1; }   // one missed day a week is forgiven, silently
        else r.n = 1;
        Ls.best = Math.max(Ls.best, r.n); r.last = d;
      }
      Ls.rvn = cur.k === 'rev' ? Ls.rvn + 1 : 0;
      const same = Ls.last && Ls.last.d === d;
      Ls.last = { d, c: cur.c || (same ? Ls.last.c : 0), k: cur.k, ns: [...new Set((same ? Ls.last.ns : []).concat(cur.nw))].slice(-8), nn: (same ? (Ls.last.nn || 0) : 0) + cur.nw.length, nr: (same ? Ls.last.nr : 0) + cur.rc, weak: [...new Set((same ? Ls.last.weak : []).concat(cur.weak))].slice(-3) };
    }
    if (Ls.at) { const left = learnQueue().some(n => chOf(n) === Ls.at && !learnHas(n)); if (!left) Ls.at = 0; }
    Ls.cur = null; learnSaveAll();
    const nx = learnQueue().find(n => !learnHas(n)); if (nx) { chapter(chOf(nx)).catch(() => { }); grammar(chOf(nx)).catch(() => { }); }   // tomorrow's chapter, while the network is here
  }
  LEARN.busy = false;
  if (location.hash.split('?')[0] === '#/learn') route(); else location.replace('#/learn');   // an identical hash fires no hashchange, so render the hub directly
}

// ── the hub: today, numbers, my way, the map. It renders from S and D.meta alone. ──
function learnNumbers() {
  const Ls = S.learn; let seen = 0, firm = 0;
  for (const cc of Object.keys(Ls.ch)) { seen += popc(Ls.ch[cc]); if (Ls.goal !== 'u') firm += chNs(+cc).filter(n => learnHas(n) && learnFirm(n)).length; }
  const d = learnDay(); const gapRun = d - Ls.run.last; const alive = Ls.run.n > 1 && (gapRun <= 1 || (gapRun === 2 && d - Ls.run.g >= 7));
  return `<div class="stat ln-stat"><div><b>${Ls.days}</b><span>${t('lnNumDays')}</span></div>${alive ? `<div><b>${Ls.run.n}</b><span>${t('lnNumRun')}</span></div>` : ''}<div><b>${seen}</b><span>${t('lnNumSeen')}</span></div>${Ls.goal !== 'u' ? `<div><b>${firm}</b><span>${t('lnNumFirm')}</span></div>` : ''}</div>`;
}
function learnTestSpec(c, share) {                                  // never test a child on kurals the path did not teach
  if (share === 1023) return 'ch-' + c; const cm = chMeta(c); const idx = []; for (let i = 0; i < 10; i++) if (share >> i & 1) idx.push(i);
  if (idx.length >= 2 && idx[idx.length - 1] - idx[0] === idx.length - 1) return `r-${cm.start + idx[0]}-${cm.start + idx[idx.length - 1]}`;
  return '';
}
function learnCardHTML(slot) {                                      // Home, Practice, Daily: no awaits, so they cannot break offline
  if (!D.meta) return '';
  const Ls = S.learn, d = learnDay();
  const card = (body, top) => (slot === 'any' || (slot === 'top') === top) ? `<div class="card ln-card">${body}</div>` : '';
  if (!Ls) return card(`<div class="row"><div class="grow"><b>📘 ${t('lnName')}</b><div class="muted">${t('lnTag')}</div></div><a class="btn" href="#/learn">${t('lnStartShort')}</a></div>`, false);
  if (Ls.cur && (Ls.cur.i > 0 || Ls.cur.a)) return card(`<div class="row"><div class="grow"><b>📘 ${t('lnToday')}</b><div class="muted">${fmt(t('lnStepOf'), { i: Ls.cur.i + 1, n: Ls.cur.plan.length })}</div></div><a class="btn primary" href="#/learn/go">${t('lnResume')}</a></div>`, true);
  if (Ls.last && Ls.last.d === d) return card(`<div class="row"><div class="grow"><b>${t('lnDoneToday')}</b></div><a class="btn" href="#/learn">📘 ${t('lnTitle')}</a></div>`, false);
  const nx = learnQueue().find(n => !learnHas(n));
  return card(`<div class="row"><div class="grow"><b>📘 ${t('lnToday')}</b><div class="muted">${nx ? `${t('lnChShort')} ${chOf(nx)} · ${esc(chName(chMeta(chOf(nx))))}` : t('lnRevShort')}</div></div><a class="btn primary" href="#/learn/go">${t('lnTodayStart')}</a></div>`, true);
}
function learnFromChapter(c) {                                      // "learn as a lesson" on #/ch/N: that chapter, or an honest word about why not
  if (!S.learn) learnCreate(learnPreset());
  const Ls = S.learn; const untaught = () => learnQueue().some(n => chOf(n) === c && !learnHas(n));
  if (!untaught()) {
    const allMet = chNs(c).every(learnHas);
    if (!allMet && Ls.path.length < 40) { Ls.path = Ls.path.concat('ch-' + c); Ls.pid = ''; }   // outside the path: it joins the path
    if (!untaught()) { learnSaveAll(); toast(allMet ? fmt(t('lnChAllMet'), { c }) : t('lnListFull'), 4000); location.hash = '#/learn'; return; }
  }
  if (Ls.cur && (Ls.cur.i > 0 || Ls.cur.a) && Ls.cur.c !== c) toast(fmt(t('lnAfterCurrent'), { c }), 4000);   // the frozen lesson finishes first
  Ls.at = c; if (Ls.cur && Ls.cur.i === 0 && !Ls.cur.a) Ls.cur = null; learnSaveAll(); location.hash = '#/learn/go';
}
function learnParsePath(chTxt, numTxt) {
  const specs = [], bad = [];
  String(chTxt || '').split(/[\s,;]+/).filter(Boolean).forEach(tk => { const v = +tk; if (/^\d+$/.test(tk) && v >= 1 && v <= 133) specs.push('ch-' + v); else bad.push(tk); });
  String(numTxt || '').split(/[\s,;]+/).filter(Boolean).forEach(tk => { const m = tk.match(/^(\d+)(?:[-–](\d+))?$/); const a = m && +m[1], b = m && +(m[2] || m[1]); if (m && a >= 1 && b >= 1 && a <= 1330 && b <= 1330) specs.push(`r-${Math.min(a, b)}-${Math.max(a, b)}`); else bad.push(tk); });
  return { specs: [...new Set(specs)].slice(0, 40), bad };
}
async function viewLearn(q, keep) {
  await meta(); setTitle(t('lnTitle'), t('lnName'));
  const d = learnDay(); const chip = (on, attrs, label) => `<button class="chip ${on ? 'sel' : ''}" aria-pressed="${on}" ${attrs}>${label}</button>`;
  const group = (id, label, chips) => `<div class="ln-q" id="${id}">${label}</div><div class="chips t-chips" role="group" aria-labelledby="${id}">${chips}</div>`;
  const mlTa = () => t('lnMlTa');
  // a shared list is shown and confirmed before anything is written
  const shared = q && q.get('path') ? q.get('path').split(',').filter(s => LEARN_SPEC.test(s) && testRange(s)).slice(0, 40) : null;
  if (shared && shared.length) {
    const g = ['m', 'c', 'u'].includes(q.get('goal')) ? q.get('goal') : ''; const tdS = q.get('td') || ''; const tdD = /^\d{8}$/.test(tdS) ? learnDay(new Date(+tdS.slice(0, 4), +tdS.slice(4, 6) - 1, +tdS.slice(6, 8))) : 0;
    render(`<div class="card"><h2>📘 ${t('lnUseList')}</h2><div class="list">${shared.map(s => `<div class="item"><span class="tx">${esc(testRange(s).name)}</span></div>`).join('')}</div>
      <div class="actions"><button class="btn primary" id="ln-useyes">${t('lnUseYes')}</button><a class="btn" href="#/learn">${t('lnUseNo')}</a></div></div>`);
    $('#ln-useyes').onclick = () => { if (!S.learn) learnCreate(learnPreset()); S.learn.path = shared; S.learn.pid = ''; S.learn.at = 0; if (g) S.learn.goal = g; if (tdD > d) S.learn.td = tdD; if (S.learn.cur && S.learn.cur.i === 0 && !S.learn.cur.a) S.learn.cur = null; learnSaveAll(); location.replace('#/learn'); };
    return;
  }
  if (!S.learn) {                                                   // first run: the button first, three preselected answers under it; a child taps once
    const p = learnPreset(); const f = firstLang();
    render(`<div class="card"><h2>📘 ${t('lnName')}</h2><div class="muted">${t('lnTag')} · ${t('lnIntro')}</div>
      <div class="actions"><button class="btn primary" id="ln-begin">📘 ${t('lnBegin')}</button></div>
      ${group('ln-g1', t('lnFrGoal'), [['m', t('lnGoalM')], ['c', t('lnGoalC')], ['u', t('lnGoalU')]].map(([v, l]) => chip(p.goal === v, `data-k="goal" data-v="${v}"`, l)).join(''))}
      ${group('ln-g2', t('lnFrMl'), chip(p.ml === 'ta', 'data-k="ml" data-v="ta"', mlTa()) + (f !== 'ta' && L(f) ? chip(p.ml === f, `data-k="ml" data-v="${f}"`, esc(learnLangName(f))) : ''))}
      ${group('ln-g3', t('lnFrTa'), chip(p.ta === 1, 'data-k="ta" data-v="1"', t('lnTaYes')) + chip(p.ta === 0, 'data-k="ta" data-v="0"', t('lnTaNo')))}
      <div class="muted" style="font-size:.8rem;margin-top:8px">${t('lnFrLater')}</div></div>`);
    $$('#main [data-k]').forEach(b => b.onclick = () => { const kx = b.dataset.k; p[kx] = kx === 'ta' ? +b.dataset.v : b.dataset.v; $$(`#main [data-k="${kx}"]`).forEach(x => { const on = x === b; x.classList.toggle('sel', on); x.setAttribute('aria-pressed', on); }); });   // toggled in place: no re-render, no lost focus, no jump to the top
    $('#ln-begin').onclick = () => { learnCreate(p); learnSaveAll(); learnEnter(); };
    return;
  }
  const Ls = S.learn; const queue = learnQueue(); const shares = learnShares(queue); const nx = queue.find(n => !learnHas(n)); const nowCh = nx ? chOf(nx) : 0;
  const gap = Ls.last ? d - Math.min(Ls.last.d, d) : 0; const nc = q && +q.get('nc'); const emptyMsg = q && q.get('e') ? `<div class="ln-note" role="status">${t('lnNothing')}</div>` : '';
  const canReview = learnIntroduced().length > 0 || (Ls.goal !== 'u' && Object.keys(S.srs).length > 0);
  let today;
  if (Ls.cur && (Ls.cur.i > 0 || Ls.cur.a)) today = `<h2>📘 ${t('lnToday')}</h2><div class="muted">${fmt(t('lnStepOf'), { i: Ls.cur.i + 1, n: Ls.cur.plan.length })}</div><div class="actions"><button class="btn primary ln-go">${t('lnResume')} →</button></div>`;
  else if (nc) today = `<h2>📘 ${t('lnToday')}</h2><div>${t('lnNotCached')}</div><div class="actions">${canReview ? `<button class="btn primary ln-go" data-rev="1">${t('lnRevNow')}</button>` : ''}<a class="btn ${canReview ? '' : 'primary'}" href="#/offline">📥 ${t('offline')}</a></div>`;
  else if (Ls.last && Ls.last.d === d) {
    let rows = ''; try { rows = (await Promise.all(Ls.last.ns.map(kural))).map(k => kuralLinkRow(k)).join(''); } catch (e) { rows = ''; }
    const c = Ls.last.c; const chDone = c && Ls.goal !== 'u' && shares[c] && (Ls.ch[c] & shares[c]) === shares[c] && Ls.last.ns.some(n => chOf(n) === c); const spec = chDone ? learnTestSpec(c, shares[c]) : '';
    today = `<h2 class="ln-h" tabindex="-1">${t('lnDoneToday')}</h2><div>${fmt(t('lnDoneSub'), { n: Ls.last.nn === undefined ? Ls.last.ns.length : Ls.last.nn, r: Ls.last.nr })}${Ls.last.ns.length && Ls.goal !== 'u' ? ' ' + t('lnDoneTomorrow') : ''}</div>
      ${rows ? `<div class="list">${rows}</div>` : ''}
      ${Ls.last.weak.length ? `<div class="row ln-rowact" style="padding-left:0">${Ls.last.weak.map(n => `<a class="btn" href="#/practice/${n}/memorise">🙈 ${fmt(t('lnWeakLink'), { n })}</a>`).join('')}</div>` : ''}
      ${chDone ? `<div class="ln-ok">${fmt(t(shares[c] === 1023 ? 'lnChDone' : 'lnChDonePart'), { c, name: esc(chName(chMeta(c))), y: popc(shares[c]) })}</div>${spec ? `<div class="row"><a class="ln-link" href="#/test/run/${spec}?lv=${Ls.goal === 'c' ? (S.testLevel || 2) : 1}">🏆 ${t('lnChTest')}</a></div><div class="muted" style="font-size:.8rem">${t('lnChTestNote')}</div>` : ''}` : ''}
      <div class="actions ln-actions"><a class="btn primary" href="#/">${t('tab.home')}</a><button class="btn ln-go">${t('lnAnother')}</button></div>`;
  } else if (!nx && !Object.keys(Ls.ch).length) today = `<h2>📘 ${t('lnToday')}</h2><div>${t('lnPathEmpty')}</div>`;
  else if (!nx) today = `<h2>📘 ${t('lnPathDone')}</h2>${canReview ? `<div class="actions"><button class="btn primary ln-go">${t('lnRevNow')}</button></div>` : ''}`;
  else today = `<h2>📘 ${t('lnToday')}</h2>${gap >= 3 ? `<div>${t('lnComeback')}</div>` : ''}<div class="muted">${t('lnChShort')} ${nowCh} · ${esc(chName(chMeta(nowCh)))}</div><div class="actions"><button class="btn primary ln-go">${t('lnTodayStart')} →</button></div>`;
  const contestHTML = () => { if (!(Ls.goal === 'c' && Ls.td >= d)) return ''; const N = Ls.td - d, M = queue.filter(n => !learnHas(n)).length, pz = Math.ceil(M / Math.max(1, N)); return `<div class="card"><b>${N === 0 ? t('lnContestToday') : fmt(t('lnGoalLine'), { N, M })}</b>${N > 0 && M > 0 ? `<div class="muted">${pz <= 5 ? fmt(t('lnGoalPace'), { p: Math.max(1, pz) }) : t('lnGoalMany')}</div>` : ''}</div>`; };
  const contest = `<div id="ln-contest">${contestHTML()}</div>`;
  const langs = ['ta'].concat(D.meta.langOrder.filter(c => c !== 'ta' && c !== 'tac' && L(c)));
  const pathKind = Ls.path.length === 1 && ['book', 'pal-1', 'pal-2', 'pal-3'].includes(Ls.path[0]) ? Ls.path[0] : 'mine';
  const tdVal = Ls.td ? new Date(Ls.td * 864e5).toISOString().slice(0, 10) : '';
  const way = `<details class="card ln-way" ${LEARN.wayOpen ? 'open' : ''}><summary><b>⚙ ${t('lnMyWay')}</b></summary>
    ${group('ln-w1', t('lnWayGoal'), [['m', t('lnGoalM')], ['c', t('lnGoalC')], ['u', t('lnGoalU')]].map(([v, l]) => chip(Ls.goal === v, `data-wg="${v}"`, l)).join(''))}
    <label class="ln-q" for="ln-ml">${t('lnFrMl')}</label><select id="ln-ml" style="width:100%">${langs.map(c => `<option value="${c}" ${Ls.ml === c ? 'selected' : ''}>${c === 'ta' ? mlTa() : esc(learnLangName(c))}</option>`).join('')}</select>
    ${group('ln-w2', t('lnFrTa'), chip(Ls.ta === 1, 'data-wt="1"', t('lnTaYes')) + chip(Ls.ta === 0, 'data-wt="0"', t('lnTaNo')))}
    ${group('ln-w3', t('lnWayPath'), chip(pathKind === 'book', 'data-wp="book"', t('lnPathBook')) + D.meta.pals.map((p, i) => chip(pathKind === 'pal-' + (i + 1), `data-wp="pal-${i + 1}"`, esc(S.ui === 'ta' ? p.name : p.name + ' · ' + p.nameEn))).join('') + chip(pathKind === 'mine', 'data-wp="mine"', t('lnPathMine')))}
    ${LEARN_LISTS.length ? group('ln-w4', t('lnPathSyl'), LEARN_LISTS.map(x => chip(Ls.pid === x.id, `data-wl="${esc(x.id)}"`, esc(S.ui === 'ta' ? x.nameTa : x.nameEn))).join('')) : ''}
    <div id="ln-mine" ${pathKind === 'mine' ? '' : 'hidden'}><label class="muted" for="ln-inch">${t('lnInCh')}</label><input type="text" inputmode="numeric" id="ln-inch" aria-describedby="ln-bad" style="width:100%" value="${esc(Ls.path.filter(s => /^ch-/.test(s)).map(s => s.slice(3)).join(', '))}">
      <label class="muted" for="ln-innum">${t('lnInNum')}</label><input type="text" id="ln-innum" aria-describedby="ln-bad" style="width:100%" value="${esc(Ls.path.filter(s => /^r-/.test(s)).map(s => { const m = s.split('-'); return m[1] === m[2] ? m[1] : m[1] + '-' + m[2]; }).join(', '))}">
      ${Ls.path.some(s => !/^(ch|r)-/.test(s)) ? `<div class="muted" style="font-size:.85rem">${t('lnPathAlso')}: ${Ls.path.filter(s => !/^(ch|r)-/.test(s)).map(s => esc(testRange(s).name)).join(', ')}</div>` : ''}
      <div class="row" style="margin-top:6px"><button class="btn" id="ln-apply">${t('lnApplyList')}</button><button class="btn" id="ln-share">📤 ${t('lnShareList')}</button></div><div class="muted" id="ln-bad" role="alert"></div></div>
    ${group('ln-w5', t('lnWayPace'), [1, 2, 3].concat(Ls.goal === 'm' ? [] : [5]).map(v => chip(Ls.pace === v, `data-wn="${v}"`, String(v))).join(''))}
    ${Ls.goal === 'c' ? `<label class="ln-q" for="ln-td">${t('lnContestDay')}</label><input type="date" id="ln-td" value="${tdVal}">` : ''}
    <div class="muted" style="font-size:.8rem;margin-top:8px">${t('lnWayLater')}</div>
    <div class="row" style="margin-top:10px"><button class="btn" id="ln-restart">${t('lnRestart')}</button></div><div class="ln-sr" role="status" id="ln-rs"></div></details>`;
  const map = `<div class="card"><h2>🗺 ${t('lnMapTitle')}</h2>${D.meta.pals.map(p => { const chs = p.iyals.flatMap(iy => iy.chapters).filter(c => shares[c]); if (!chs.length) return '';
    return `<details class="ln-pal" ${chs.includes(nowCh) || (!nowCh && p.num === 1) ? 'open' : ''}><summary><b>${esc(p.name)}</b> <span class="muted">· ${esc(p.nameEn)} · ${chs.reduce((s, c) => s + popc((Ls.ch[c] || 0) & shares[c]), 0)}/${chs.reduce((s, c) => s + popc(shares[c]), 0)}</span></summary>
      ${p.iyals.map(iy => { const cs = iy.chapters.filter(c => shares[c]); return cs.length ? `<div class="muted ln-iyal">${esc(iy.name)} · ${esc(iy.nameEn)}</div>${cs.map(c => { const y = popc(shares[c]), x = popc((Ls.ch[c] || 0) & shares[c]); const z = chNs(c).filter(n => (shares[c] >> ((n - 1) % 10) & 1) && learnHas(n) && learnFirm(n)).length; const star = S.test && S.test['ch-' + c] && S.test['ch-' + c].passed;
        return `<button class="ln-row" data-c="${c}" aria-expanded="false" ${c === nowCh ? 'aria-current="true"' : ''}><span class="ln-rn">${c}</span><span class="ln-rt">${esc(chName(chMeta(c)))}<span class="muted"> — ${fmt(t(Ls.goal === 'u' ? 'lnMapRowU' : 'lnMapRow'), { x, y, z })}${star ? ' · ' + t('lnMapStar') : ''}${c === nowCh ? ' · ' + t('lnMapNow') : ''}</span></span></button><div class="ln-rowact" id="ln-ra-${c}" hidden></div>`; }).join('')}` : ''; }).join('')}</details>`; }).join('')}</div>`;
  render(`<div class="card">${today}${emptyMsg}</div>${learnNumbers()}${contest}${way}${map}`);
  if (keep) { window.scrollTo(0, keep.y); const f = keep.sel && $(keep.sel); if (f) f.focus({ preventScroll: true }); } else { const hd = $('#main .ln-h'); if (hd) hd.focus({ preventScroll: true }); }
  $$('.ln-go').forEach(b => b.onclick = () => learnEnter(b.dataset.rev));
  // chips re-render the hub (pace and the contest date depend on the goal, the map on the path) but keep the scroll position and the focus
  const change = (fn, sel) => { fn(); if (Ls.cur && Ls.cur.i === 0 && !Ls.cur.a) Ls.cur = null; LEARN.wayOpen = true; learnSaveAll(); viewLearn(null, { y: window.scrollY, sel }); };
  $('.ln-way').ontoggle = e => { LEARN.wayOpen = e.currentTarget.open; };
  $$('[data-wg]').forEach(b => b.onclick = () => change(() => { Ls.goal = b.dataset.wg; if (Ls.goal === 'm' && Ls.pace > 3) Ls.pace = 2; }, `[data-wg="${b.dataset.wg}"]`));
  $$('[data-wt]').forEach(b => b.onclick = () => change(() => { Ls.ta = +b.dataset.wt; }, `[data-wt="${b.dataset.wt}"]`));
  $$('[data-wn]').forEach(b => b.onclick = () => change(() => { Ls.pace = +b.dataset.wn; }, `[data-wn="${b.dataset.wn}"]`));
  $$('[data-wp]').forEach(b => b.onclick = () => { if (b.dataset.wp === 'mine') { $('#ln-mine').hidden = false; $$('[data-wp]').forEach(x => { const on = x === b; x.classList.toggle('sel', on); x.setAttribute('aria-pressed', on); }); $('#ln-inch').focus(); } else change(() => { Ls.path = [b.dataset.wp]; Ls.pid = ''; Ls.at = 0; }, `[data-wp="${b.dataset.wp}"]`); });
  $$('[data-wl]').forEach(b => b.onclick = () => change(() => { const x = LEARN_LISTS.find(y => y.id === b.dataset.wl); if (x) { Ls.path = x.specs.filter(s => LEARN_SPEC.test(s)).slice(0, 40); Ls.pid = x.id; Ls.at = 0; } }, `[data-wl="${b.dataset.wl}"]`));
  // the select and the date save in place: re-rendering them mid-keystroke would make them unusable from a keyboard
  $('#ln-ml').onchange = e => { Ls.ml = e.target.value; learnSaveAll(); };
  const tdEl = $('#ln-td'); if (tdEl) tdEl.onchange = () => { const v = tdEl.value; Ls.td = v ? learnDay(new Date(+v.slice(0, 4), +v.slice(5, 7) - 1, +v.slice(8, 10))) : 0; learnSaveAll(); $('#ln-contest').innerHTML = contestHTML(); };
  $('#ln-apply').onclick = () => { const r = learnParsePath($('#ln-inch').value, $('#ln-innum').value); if (r.bad.length) $('#ln-bad').textContent = fmt(t('lnBadTokens'), { x: r.bad.join(', ') }); if (!r.specs.length && !(pathKind === 'mine' && Ls.path.some(s => !/^(ch|r)-/.test(s)))) { if (!r.bad.length) $('#ln-bad').textContent = t('lnListEmpty'); return; } const msg = r.bad.length ? fmt(t('lnBadTokens'), { x: r.bad.join(', ') }) : ''; const keepSpecs = pathKind === 'mine' ? Ls.path.filter(s => !/^(ch|r)-/.test(s)) : []; change(() => { Ls.path = keepSpecs.concat(r.specs).slice(0, 40); Ls.pid = ''; Ls.at = 0; }, '#ln-apply'); if (msg) { const bd = $('#ln-bad'); if (bd) bd.textContent = msg; } };
  $('#ln-share').onclick = () => { const r = learnParsePath($('#ln-inch').value, $('#ln-innum').value); if (!r.specs.length) { $('#ln-bad').textContent = t('lnListEmpty'); return; } const tdq = Ls.goal === 'c' && Ls.td ? '&td=' + new Date(Ls.td * 864e5).toISOString().slice(0, 10).replace(/-/g, '') : ''; shareText(t('lnName'), `${t('lnName')} · ${r.specs.map(s => testRange(s).name).join(', ')}\n${appUrl()}#/learn?path=${r.specs.join(',')}&goal=${Ls.goal}${tdq}`); };
  $('#ln-restart').onclick = e => { const b = e.currentTarget; if (LEARN.armed && Date.now() - LEARN.armed < 6000) { LEARN.armed = 0; S.learn = null; learnSaveAll(); viewLearn(); } else { LEARN.armed = Date.now(); b.textContent = t('lnRestartArm'); $('#ln-rs').textContent = t('lnRestartArm'); } };
  $$('.ln-row').forEach(b => b.onclick = () => {
    const c = +b.dataset.c; const box = $('#ln-ra-' + c); const open = box.hidden; box.hidden = !open; b.setAttribute('aria-expanded', open); if (!open) return;
    const spec = Ls.goal === 'u' ? '' : learnTestSpec(c, shares[c]);
    box.innerHTML = `<button class="btn" data-from="${c}">📘 ${t('lnFromHere')}</button><a class="btn" href="#/ch/${c}">📖 ${t('lnMapRead')}</a>${spec ? `<a class="btn" href="#/test/run/${spec}?lv=${S.testLevel || 2}">🏆 ${t('lnMapTest')}</a>` : ''}`;
    $('[data-from]', box).onclick = () => { Ls.at = c; if (Ls.cur && Ls.cur.i === 0 && !Ls.cur.a) Ls.cur = null; learnSaveAll(); toast(t('lnWayLater')); viewLearn(null, { y: window.scrollY, sel: `.ln-row[data-c="${c}"]` }); };
  });
}

// ───────────────────────────── daily + notifications ─────────────────────────────
async function viewDaily() {
  const n = dailyN(); const k = await kural(n); const cm = chMeta(chOf(n));
  setTitle(t('daily'), todayKey());
  const perm = ('Notification' in window) ? Notification.permission : 'unsupported';
  // Android app only: offer the home-screen widget. Launchers that cannot place it on request get the manual route.
  // (a device with no home screen for widgets - ChromeOS, a TV - gets no card at all)
  let wb = NATIVE_NOTIFY && typeof NATIVE_NOTIFY.canPinWidget === 'function' ? NATIVE_NOTIFY : null;
  let canPin = false, placed = 0;
  if (wb) { try { if (typeof wb.canHostWidget === 'function' && !wb.canHostWidget()) wb = null; else { canPin = !!wb.canPinWidget(); placed = +wb.widgetCount() || 0; } } catch (e) { } }
  // The manual route is always shown: some launchers accept a placement request and then do nothing.
  const widgetCard = !wb ? '' : `<div class="card"><h2>📱 ${t('widgetTitle')}</h2><div class="muted">${t('widgetSub')}</div>
    ${placed ? `<div style="margin-top:6px;color:var(--ok)">${t('widgetOn')}</div>` : ''}
    ${canPin ? `<div class="row" style="margin-top:8px"><button class="btn ${placed ? '' : 'primary'}" id="w-pin">＋ ${t('widgetAdd')}</button></div>` : ''}
    <div class="muted" style="font-size:.8rem;margin-top:8px">${t('widgetHow')}</div>
    ${placed ? `<div class="muted" style="font-size:.8rem;margin-top:4px">${t('widgetOem')}</div>` : ''}</div>`;
  render(`${learnCardHTML('any')}<div class="card"><div class="kural-head"><span class="n">${t('kural')} ${n}</span><a class="ch" href="#/ch/${cm.adhigaram}">${esc(cm.name)}</a></div>${coupletHTML(k)}
    ${S.langs.filter(c => k.tr[c]).map(c => `<div class="tr-text ${scriptClass(c)} ${L(c).dir === 'rtl' ? 'rtl' : ''}" style="font-size:1rem;margin-top:6px"${dirAttr(c)}>${esc(k.tr[c][0])}<span class="l2">${esc(k.tr[c][1] || '')}</span></div>`).join('')}
    <div class="actions"><button class="btn primary" id="d-recite">🔊 ${t('recite')}</button><a class="btn" href="#/k/${n}">📖</a><a class="btn" href="#/practice/${n}">🎵</a></div></div>
  <div class="card"><h2>🔔 ${t('notify')}</h2>
    <div class="toggle"><label for="nt">${t('notify')}</label><input type="checkbox" class="switch" id="nt" ${S.notify ? 'checked' : ''} ${perm === 'unsupported' ? 'disabled' : ''}></div>
    <div class="toggle"><label for="ntime">${t('notifyTime')}</label><input type="time" id="ntime" value="${S.notifyTime}" style="max-width:140px"></div>
    <div class="muted" style="font-size:.8rem;margin-top:6px">${t('notifyHelp')} ${perm === 'denied' ? '⚠ Notifications are blocked in browser settings.' : ''}</div>
    <div class="row" style="margin-top:8px"><button class="btn" id="ics">📅 ${t('calendar')}</button><button class="btn" id="test-n" ${perm !== 'granted' ? 'disabled' : ''}>🔔 test</button></div></div>${widgetCard}`);
  // The launcher confirms in its own sheet and tells the page nothing, so watch the count for
  // half a minute and redraw the card when the widget lands - otherwise the button still looks
  // untouched and a second tap places a duplicate.
  if ($('#w-pin')) $('#w-pin').onclick = e => {
    let ok = false; try { ok = !!wb.pinWidget(); } catch (err) { }
    toast(ok ? t('widgetAsked') : t('widgetHow'), 3000);
    if (!ok) return;
    const btn = e.currentTarget; btn.disabled = true;
    const before = placed; let tries = 0;
    const timer = setInterval(() => {
      let now = before; try { now = +wb.widgetCount() || 0; } catch (err) { }
      const here = location.hash.startsWith('#/daily');
      if (now > before || ++tries >= 30 || !here) { clearInterval(timer); if (here) viewDaily(); }
    }, 1000);
  };
  $('#d-recite').onclick = e => reciteKural(k, e.currentTarget);
  $('#nt').onchange = async e => { await setNotify(e.target.checked); viewDaily(); };
  $('#ntime').onchange = e => { S.notifyTime = e.target.value || '07:00'; saveS(); };
  $('#ics').onclick = () => {
    const [h, mi] = S.notifyTime.split(':');
    const d = new Date(); const dt = `${d.getFullYear()}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}T${h}${mi}00`;
    const url = location.href.split('#')[0] + '#/daily';
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CICT//Tirukkural//TA', 'BEGIN:VEVENT', `UID:daily-kural@cict.in`, `DTSTART:${dt}`, 'DURATION:PT5M', 'RRULE:FREQ=DAILY', 'SUMMARY:இன்றைய குறள் · Kural of the day', `DESCRIPTION:${url}`, `URL:${url}`, 'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:திருக்குறள்', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'daily-kural.ics'; a.click();
  };
  $('#test-n').onclick = () => showDailyNotification(true);
}
async function setNotify(on) {
  // Inside the Android wrapper the alarm is scheduled natively — a WebView can neither
  // post a system notification nor wake itself at 07:00.
  if (NATIVE_NOTIFY) {
    if (!on) { try { NATIVE_NOTIFY.disable(); } catch (e) { } S.notify = false; saveS(); return; }
    let ok = false;
    try { ok = NATIVE_NOTIFY.enable(S.notifyTime || '07:00'); } catch (e) { ok = false; }
    // false means Android is still showing its permission prompt; reflect the real state
    // once the answer lands rather than claiming success now.
    S.notify = ok; saveS();
    toast(ok ? '✓' : '…');
    if (!ok) setTimeout(() => { try { S.notify = NATIVE_NOTIFY.isEnabled(); saveS(); route(); } catch (e) { } }, 1500);
    return;
  }
  if (!('Notification' in window)) return;
  if (on) {
    const p = await Notification.requestPermission();
    if (p !== 'granted') { S.notify = false; saveS(); toast('✕'); return; }
    S.notify = true; saveS();
    try { const reg = await navigator.serviceWorker.ready; if ('periodicSync' in reg) await reg.periodicSync.register('daily-kural', { minInterval: 12 * 3600 * 1000 }); } catch (e) { console.log('periodicSync', e.message); }
    toast('✓');
  } else {
    S.notify = false; saveS();
    try { const reg = await navigator.serviceWorker.ready; if ('periodicSync' in reg) await reg.periodicSync.unregister('daily-kural'); } catch { }
  }
}
async function showDailyNotification(force) {
  if (NATIVE_NOTIFY) return;          // the native alarm owns this
  if (!S.notify && !force) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const key = todayKey(); if (!force && S.lastNotified === key) return;
  const [h, mi] = S.notifyTime.split(':').map(Number); const now = new Date();
  if (!force && (now.getHours() * 60 + now.getMinutes()) < h * 60 + mi) return;
  const n = dailyN(); const k = await kural(n); const f = firstLang();
  const body = `${k.l1}\n${k.l2}` + (k.tr[f] ? `\n${k.tr[f].filter(Boolean).join(' ')}` : '');
  const opts = { body, icon: 'assets/icon-192.png', badge: 'assets/icon-192.png', tag: 'daily-kural', data: { n }, lang: 'ta' };
  try { const reg = await navigator.serviceWorker.ready; await reg.showNotification(`இன்றைய குறள் ${n} · ${chMeta(chOf(n)).name}`, opts); }
  catch { try { new Notification(`இன்றைய குறள் ${n}`, opts); } catch { } }
  if (!force) { S.lastNotified = key; saveS(); }
}

// ───────────────────────────── more / settings / offline / about ─────────────────────────────
async function viewMore() {
  setTitle(t('tab.more'), 'CICT');
  render(`<div class="card list">
    <a href="#/daily"><span class="num">🔔</span><span class="tx">${t('daily')} · ${t('notify')}</span></a>
    <a href="#/bookmarks"><span class="num">★</span><span class="tx">${t('bookmarks')} (${S.bookmarks.length})</span></a>
    <a href="#/grammar"><span class="num">📚</span><span class="tx">${t('grammarX')} — ${t('grammar')}</span></a>
    <a href="#/learn"><span class="num">📘</span><span class="tx">${t('lnName')} — ${t('lnTag')}</span></a>
    <a href="#/test"><span class="num">🏆</span><span class="tx">${t('test')} — ${t('testDrill')} · ${t('certificate')}</span></a>
    <a href="#/practice"><span class="num">🎵</span><span class="tx">${t('practice')} · ${t('memorised')} (${S.memorised.length})</span></a>
    ${SINGLE ? '' : `<a href="kattam/index.html"><span class="num">🧩</span><span class="tx">${t('kattam')}</span></a>`}
    <a href="#/occasions"><span class="num">🎯</span><span class="tx">${t('occasions')}</span></a>
    <a href="#/verify"><span class="num">✔</span><span class="tx">${t('verify')}</span></a>
    <a href="#/study"><span class="num">🧠</span><span class="tx">${t('study')} — spaced repetition (${srsDue().length} ${t('srsDue')})</span></a>
    <a href="#/offline"><span class="num">📥</span><span class="tx">${t('offline')} · ${t('storage')}</span></a>
    <a href="#/settings"><span class="num">⚙</span><span class="tx">${t('settings')}</span></a>
    <a href="#/about"><span class="num">ℹ</span><span class="tx">${t('about')}</span></a>
  </div>
  <div class="card" id="install-card" hidden><h2>📲 ${t('install')}</h2>
    <div class="muted" id="install-note"></div>
    <div class="row" style="margin-top:8px"><button class="btn primary" id="btn-install2" hidden>📲 ${t('install')}</button></div></div>`);
  renderInstallCard();
}

// Install affordance. Chromium fires beforeinstallprompt; iOS Safari never does, so it gets
// the Add-to-Home-Screen instruction instead. Already-installed windows say so.
function renderInstallCard() {
  const card = $('#install-card'); if (!card) return;
  if (IS_ANDROID_APP) { card.hidden = true; return; }
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const note = $('#install-note'); const btn = $('#btn-install2');
  if (standalone) { card.hidden = false; note.textContent = t('installed'); return; }
  if (deferredInstall) {
    card.hidden = false; note.textContent = t('parallelHelp') === '' ? '' : '';
    note.textContent = D.meta.title;
    btn.hidden = false;
    btn.onclick = async () => { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; renderInstallCard(); };
    return;
  }
  if (ios) { card.hidden = false; note.textContent = t('installIos'); }
}
// ───────────────────────────── நிகழ்வுக்கு ஒரு குறள் · a Kural for the occasion ─────────────────────────────
// Curated in build/occasions.json at the Institute; each occasion offers a few couplets with the reader's
// translation and the same share actions as the kural page, for a speech, a card or an invitation.
async function occasions() { return D.occ || (D.occ = await getJSON('data/occasions.json')); }
function occName(o) { return S.ui === 'ta' ? o.ta : o.en; }
function occNote(o) { return S.ui === 'ta' ? o.note_ta : o.note_en; }
async function viewOccasions(id) {
  const oc = await occasions(); const f = firstLang();
  const o = oc.occasions.find(x => x.id === id);
  if (!o) {
    setTitle(t('occasions'), t('occasionsSub'));
    render(`<div class="card"><h2>🎯 ${t('occasions')}</h2><div class="muted">${t('occasionsSub')}</div></div>` +
      oc.groups.map(g => `<div class="card"><h2>${esc(S.ui === 'ta' ? g.ta : g.en)}</h2><div class="occ-grid">${oc.occasions.filter(x => x.group === g.id).map(x =>
        `<a class="occ" href="#/occasions/${esc(x.id)}"><span class="ic">${x.icon}</span><b>${esc(occName(x))}</b><span class="muted">${esc(occNote(x))}</span></a>`).join('')}</div></div>`).join('') +
      `<div class="card muted" style="font-size:.85rem">${t('occCurated')}</div>`);
    return;
  }
  const ks = await Promise.all(o.kurals.map(kural));
  setTitle(`${o.icon} ${occName(o)}`, t('occasions'));
  render(`<div class="card"><div class="muted">${esc(occNote(o))}</div></div>` + ks.map(k => {
    const cm = chMeta(chOf(k.n)); const tr = k.tr[f];
    return `<div class="card occ-k" data-n="${k.n}">
      <div class="kural-head"><span class="n">${t('kural')} ${k.n}</span><a class="ch" href="#/ch/${cm.adhigaram}">${esc(cm.name)} · ${esc(cm.nameEn)}</a></div>
      <a href="#/k/${k.n}" style="text-decoration:none;color:inherit">${coupletHTML(k)}</a>
      ${tr ? `<div class="tr-text ${scriptClass(f)} ${L(f).dir === 'rtl' ? 'rtl' : ''}" style="font-size:1rem;margin-top:6px"${dirAttr(f)}>${esc(tr[0])}${tr[1] ? `<span class="l2">${esc(tr[1])}</span>` : ''}</div><div class="credit">${esc(L(f).credit)}</div>` : ''}
      <div class="actions"><button class="btn primary occ-share" type="button">⤴ ${t('occShare')}</button><button class="btn occ-card" type="button">🖼 ${t('occCard')}</button><a class="btn" href="#/k/${k.n}">📖 ${t('occOpen')}</a></div></div>`;
  }).join('') + `<div class="row" style="margin:8px 4px"><a class="btn" href="#/occasions">‹ ${t('occAll')}</a></div><div class="card muted" style="font-size:.85rem">${t('occCurated')}</div>`);
  $$('.occ-k').forEach(card => {
    const k = ks.find(x => x.n === +card.dataset.n); const cm = chMeta(chOf(k.n));
    card.querySelector('.occ-share').onclick = () => shareKural(k, cm);
    card.querySelector('.occ-card').onclick = e => shareCard(k, cm, e.currentTarget);
  });
}

// ───────────────────────────── மேற்கோளைச் சரிபார் · verify a quotation ─────────────────────────────
// The Kural is quoted more than any Tamil text, and misquoted almost as often. Paste the quotation,
// in Tamil or in any translation: character-trigram similarity over the search indices finds the
// couplet, then a word-level alignment marks what was changed, added or dropped. Offline, no server.
const V_STOP = new Set(['குறள்', 'திருக்குறள்', 'திருவள்ளுவர்', 'kural', 'tirukkural', 'thirukkural', 'thiruvalluvar', 'tiruvalluvar', 'valluvar']);
const vNorm = s => norm(s).replace(/[\p{P}\p{S}]+/gu, ' ').replace(/\s+/g, ' ').trim();
function vTokens(text, keepBreaks) {
  const out = [];
  String(text).split(/\n/).forEach((line, li) => line.split(/\s+/).forEach((w, wi) => {
    const k = vNorm(w); if (!k || /^\d+$/.test(k) || V_STOP.has(k)) return;
    out.push({ t: w, k, br: keepBreaks && li > 0 && wi === 0 });
  }));
  return out;
}
function vTri(s) { const m = new Map(); const x = ' ' + s + ' '; for (let i = 0; i + 3 <= x.length; i++) { const g = x.slice(i, i + 3); m.set(g, (m.get(g) || 0) + 1); } return m; }
function vSim(a, b) { let inter = 0, na = 0, nb = 0; for (const v of a.values()) na += v; for (const v of b.values()) nb += v; if (!na || !nb) return 0; for (const [g, v] of a) { const w = b.get(g); if (w) inter += Math.min(v, w); } return 0.5 * (inter / na) + 0.5 * (2 * inter / (na + nb)); }
function vDiff(q, c) {
  const n = q.length, m = c.length, dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = q[i].k === c[j].k ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops = []; let i = 0, j = 0;
  while (i < n && j < m) { if (q[i].k === c[j].k) { ops.push(['eq', i, j]); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push(['del', i, -1]); i++; } else { ops.push(['ins', -1, j]); j++; } }
  while (i < n) ops.push(['del', i++, -1]); while (j < m) ops.push(['ins', -1, j++]);
  return ops;
}
function vStreamLabel(code) {
  if (code === 'ta') return t('rpTa'); if (code === 'translit') return t('translit');
  if (code === 'prose-ta') return 'மு. வரதராசனார் உரை'; if (code === 'prose-en') return t('rpEnProse');
  if (code.startsWith('prose-')) { const l = L(code.slice(6)); return l ? `${l.native} · ${t('prose')}` : code; }
  const l = L(code); return l ? `${l.native} · ${l.name}` : code;
}
async function verifyQuote(q) {
  const qn = vNorm(vTokens(q).map(x => x.k).join(' ')); if (qn.length < 4) return [];
  const qt = vTri(qn); const out = [];
  D.vtri = D.vtri || {};
  for (const code of searchTargets(q, 'auto')) {
    const idx = await sindex(code).catch(() => null); if (!idx) continue;
    const tri = D.vtri[code] || (D.vtri[code] = idx.map(e => vTri(vNorm(e.slice(1).filter(Boolean).join(' ')))));
    idx.forEach((e, i) => { const sc = vSim(qt, tri[i]); if (sc > 0.45) out.push({ n: e[0], code, lines: e.slice(1).filter(Boolean), score: sc }); });
  }
  out.sort((a, b) => b.score - a.score);
  const seen = new Set(); return out.filter(r => { const k = r.code + ':' + r.n; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 4);
}
async function viewVerify(q0) {
  setTitle(t('verify'), t('search'));
  render(`<div class="card"><h2>✔ ${t('verify')}</h2><div class="muted" style="font-size:.85rem">${t('verifySub')}</div>
    <textarea id="vq" rows="4" placeholder="${esc(t('verifyPh'))}" style="margin-top:8px">${esc(q0 || '')}</textarea>
    <div class="row" style="margin-top:8px"><button class="btn primary" id="vgo" type="button">✔ ${t('verifyBtn')}</button>${navigator.clipboard && navigator.clipboard.readText ? `<button class="btn" id="vpaste" type="button">📋 ${t('verifyPaste')}</button>` : ''}</div></div>
    <div id="vres"></div>`);
  let seq = 0;
  const run = async () => {
    const my = ++seq; const q = $('#vq').value.trim(); let box = $('#vres'); if (!box) return;
    location.replace('#/verify?q=' + encodeURIComponent(q));
    if (!q) { box.innerHTML = ''; return; }
    box.innerHTML = `<div class="card muted">…</div>`;
    const res = await verifyQuote(q); box = $('#vres'); if (my !== seq || !box) return;
    if (!res.length) { box.innerHTML = `<div class="card muted">${t('verifyNone')}</div>`; return; }
    const best = res[0]; const cm = chMeta(chOf(best.n)); const k = await kural(best.n);
    const qt = vTokens(q, true), ct = vTokens(best.lines.join('\n'), true);
    const ops = vDiff(qt, ct);
    const lineOf = ct.map((x, i) => ct.slice(0, i + 1).filter(y => y.br).length); const touched = new Set(ops.filter(o => o[0] === 'eq').map(o => lineOf[o[2]]));
    const dim = i => !touched.has(lineOf[i]);
    const diffs = ops.filter(o => o[0] === 'del' || (o[0] === 'ins' && !dim(o[2]))).length;
    const cls = best.code === 'translit' ? 'Latin' : (best.code.startsWith('prose-') ? (best.code === 'prose-en' ? 'en' : best.code.slice(6)) : best.code);
    const sc = scriptClass(cls === 'Latin' ? 'en' : cls); const dir = dirAttr(cls === 'Latin' ? 'en' : cls);
    const tok = (x, klass) => `${x.br ? '<br>' : ''}<span class="${klass}">${esc(x.t)}</span>`;
    const quoted = ops.map(o => o[0] === 'eq' ? tok(qt[o[1]], 'q-ok') : o[0] === 'del' ? tok(qt[o[1]], 'q-bad') : '').join(' ');
    const canon = ops.map(o => o[0] === 'eq' ? tok(ct[o[2]], 'q-ok') : o[0] === 'ins' ? tok(ct[o[2]], dim(o[2]) ? 'q-dim' : 'q-miss') : '').join(' ');
    const credit = L(best.code) ? L(best.code).credit : (best.code === 'prose-ta' ? 'மு. வரதராசனார் உரை' : '');
    box.innerHTML = `<div class="card">
      <div class="kural-head"><span class="n">${t('kural')} ${best.n}</span><a class="ch" href="#/ch/${cm.adhigaram}">${esc(cm.name)} · ${esc(cm.nameEn)}</a><span class="pill">${Math.round(best.score * 100)}% ${t('verifyScore')}</span></div>
      <div class="muted" style="font-size:.85rem">${esc(vStreamLabel(best.code))}</div>
      <div class="${diffs ? 'v-diff' : 'v-exact'}">${diffs ? `${diffs} ${t('verifyDiff')}` : t('verifyExact')}</div>
      <div class="v-lbl">${t('verifyQuoted')}</div><div class="v-text ${sc}"${dir}>${quoted}</div>
      <div class="v-lbl">${t('verifyCanon')}</div><div class="v-text ${sc}"${dir}>${canon}</div>
      ${credit ? `<div class="credit">${esc(credit)}</div>` : ''}
      <div class="muted" style="font-size:.75rem;margin-top:6px">${t('verifyLegend')}</div>
      <div class="actions"><button class="btn primary" id="vcopy" type="button">⧉ ${t('verifyCopy')}</button><a class="btn" href="#/k/${best.n}">📖 ${t('occOpen')}</a><button class="btn" id="vshare" type="button">⤴ ${t('share')}</button></div></div>`
      + (res.length > 1 ? `<div class="card"><h3 class="muted" style="margin:0 0 6px">${t('verifyOthers')}</h3><div class="list">${res.slice(1).map(r => `<a href="#/verify?q=${encodeURIComponent(q)}" data-n="${r.n}" data-code="${esc(r.code)}"><span class="num">${r.n}</span><span class="tx"><span class="l">${esc(r.lines[0])}</span>${r.lines[1] ? `<span class="l">${esc(r.lines[1])}</span>` : ''}<span class="muted" style="font-size:.75rem">${esc(vStreamLabel(r.code))} · ${Math.round(r.score * 100)}%</span></span></a>`).join('')}</div></div>` : '');
    $('#vcopy').onclick = () => navigator.clipboard.writeText(best.lines.join('\n')).then(() => toast('✓ ' + t('copy'))).catch(() => toast('—'));
    $('#vshare').onclick = () => shareKural(k, cm);
    $$('#vres .list a').forEach(a => a.onclick = e => { e.preventDefault(); location.hash = '#/k/' + a.dataset.n; });
  };
  $('#vgo').onclick = run;
  const vp = $('#vpaste'); if (vp) vp.onclick = async () => { try { $('#vq').value = await navigator.clipboard.readText(); run(); } catch (e) { toast('—'); } };
  $('#vq').onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); };
  if (q0) run(); else $('#vq').focus();
}

async function viewBookmarks() {
  setTitle(t('bookmarks'), '');
  const f = firstLang();
  const ks = await Promise.all(S.bookmarks.map(kural));
  render(`<div class="card list">${ks.length ? ks.map(k => kuralLinkRow(k, f)).join('') : `<div class="muted">${t('noBookmarks')}</div>`}</div>`);
}
async function viewGrammar(type, tag) {
  const tg = await tags(); const g = await glossary().catch(() => ({ terms: {} }));
  setTitle(t('grammarX'), t('grammar'));
  const types = Object.keys(tg);
  const tabs = `<div class="tabs-inline">${types.map(ty => `<a href="#/grammar?type=${ty}"><button class="${ty === type ? 'on' : ''}">${ty}</button></a>`).join('')}</div>`;
  if (!tag) {
    render(`<div class="card">${tabs}<div>${Object.entries(tg[type] || {}).map(([tgk, arr]) => `<a class="chip" href="#/grammar?type=${type}&tag=${encodeURIComponent(tgk)}" title="${esc((g.terms[tgk] || {})[S.ui] || '')}">${esc(tgk)} <small>${arr.length}</small></a>`).join('')}</div></div>`);
    return;
  }
  const nums = (tg[type] || {})[tag] || [];
  const def = g.terms[tag];
  render(`<div class="card">${tabs}<h2>${esc(tag)} <span class="muted">· ${nums.length} ${t('kural')}</span></h2>${def ? `<div class="gloss-tip">${esc(def.ta)}<br><i>${esc(def.en)}</i></div>` : ''}</div><div class="card list" id="gl"><div class="muted">…</div></div>`);
  const ta = await sindex('ta'); const f = firstLang();
  $('#gl').innerHTML = nums.slice(0, 400).map(n => `<a href="#/k/${n}"><span class="num">${n}</span><span class="tx"><span class="l">${esc(ta[n - 1][1])} ${esc(ta[n - 1][2])}</span></span></a>`).join('') + (nums.length > 400 ? `<div class="muted">… +${nums.length - 400}</div>` : '');
}
async function viewSettings() {
  setTitle(t('settings'), '');
  const voiceRows = ['ta', ...S.langs.filter(c => c !== 'ta')].map(c => {
    const cands = TTS.candidates(c);
    return `<div class="toggle"><label>${esc(L(c).native)} <span class="muted">${esc(L(c).name)}</span></label><select data-v="${c}" style="max-width:55%">${cands.length ? `<option value="">${t('auto')}</option>` + cands.map(v => `<option value="${esc(v.voiceURI)}" ${S.voices[c] === v.voiceURI ? 'selected' : ''}>${esc(v.name)} (${v.lang})</option>`).join('') : `<option value="">— ${t('noVoice')}</option>`}</select></div>`;
  }).join('');
  render(`<div class="card"><h2>${t('langs')}</h2><div class="row">${S.langs.map(c => `<span class="chip sel ${scriptClass(c)}">${esc(L(c).native)}</span>`).join('')}<button class="btn small" id="s-langs">🌐 ${t('chooseLangs')}</button></div></div>
  <div class="card">
    <div class="toggle"><label>UI</label><select id="s-ui" style="max-width:50%"><option value="ta" ${S.ui === 'ta' ? 'selected' : ''}>தமிழ்</option><option value="en" ${S.ui === 'en' ? 'selected' : ''}>English</option></select></div>
    <div class="toggle"><label for="s-tl">${t('translit')}</label><input type="checkbox" class="switch" id="s-tl" ${S.showTranslit ? 'checked' : ''}></div>
    <div class="toggle"><label for="s-pr">${t('showProse')}</label><input type="checkbox" class="switch" id="s-pr" ${S.showProse ? 'checked' : ''}></div>
    <div class="toggle"><label>${t('fontSize')}</label><input type="range" id="s-fs" min="0.85" max="1.4" step="0.05" value="${S.fontScale}" style="max-width:50%"></div>
    <div class="toggle"><label>${t('theme')}</label><select id="s-th" style="max-width:50%"><option value="auto" ${S.theme === 'auto' ? 'selected' : ''}>${t('auto')}</option><option value="light" ${S.theme === 'light' ? 'selected' : ''}>${t('light')}</option><option value="dark" ${S.theme === 'dark' ? 'selected' : ''}>${t('dark')}</option></select></div>
  </div>
  <div class="card"><h2>🔊 ${t('voice')}</h2>${voiceRows}<div class="toggle"><label>${t('rate')} <b id="rv">${S.rate}</b>×</label><input type="range" id="s-rate" min="0.6" max="1.4" step="0.05" value="${S.rate}" style="max-width:50%"></div></div>
  <div class="card"><h2>🔔 ${t('notify')}</h2><div class="toggle"><label for="s-nt">${t('notify')}</label><input type="checkbox" class="switch" id="s-nt" ${S.notify ? 'checked' : ''}></div><div class="toggle"><label>${t('notifyTime')}</label><input type="time" id="s-ntime" value="${S.notifyTime}" style="max-width:140px"></div></div>
  <div class="row"><a class="btn" href="#/offline">📥 ${t('offline')}</a><a class="btn" href="#/about">ℹ ${t('about')}</a></div>`);
  $('#s-langs').onclick = openLangSheet;
  $('#s-ui').onchange = e => { S.ui = e.target.value; saveS(); viewSettings(); };
  $('#s-tl').onchange = e => { S.showTranslit = e.target.checked; saveS(); };
  $('#s-pr').onchange = e => { S.showProse = e.target.checked; saveS(); };
  $('#s-fs').oninput = e => { S.fontScale = +e.target.value; saveS(); };
  $('#s-th').onchange = e => { S.theme = e.target.value; saveS(); };
  $('#s-rate').oninput = e => { S.rate = +e.target.value; $('#rv').textContent = S.rate; saveS(); };
  $$('select[data-v]').forEach(sel => sel.onchange = () => { if (sel.value) S.voices[sel.dataset.v] = sel.value; else delete S.voices[sel.dataset.v]; saveS(); TTS.speak(sel.dataset.v === 'ta' ? currentKural ? currentKural.l1 : 'திருக்குறள்' : 'Tirukkural', sel.dataset.v); });
  $('#s-nt').onchange = async e => { await setNotify(e.target.checked); viewSettings(); };
  $('#s-ntime').onchange = e => { S.notifyTime = e.target.value || '07:00'; saveS(); };
}
// woff2 subsets listed in assets/fonts.css — read once so the offline download covers them.
let FONT_URLS = [];
async function loadFontUrls() {
  if (SINGLE || FONT_URLS.length) return FONT_URLS;   // fonts are inlined in the single file
  try {
    const css = await (await fetch('assets/fonts.css')).text();
    FONT_URLS = [...new Set([...css.matchAll(/url\((fonts\/[^)]+)\)/g)].map(m => 'assets/' + m[1]))];
  } catch { FONT_URLS = []; }
  return FONT_URLS;
}

const hasCaches = () => typeof caches !== 'undefined' && location.protocol.startsWith('http');
async function cacheUrls(urls, onProgress) {
  if (!hasCaches()) return;
  const c = await caches.open(RT_CACHE); let done = 0;
  const work = urls.slice();
  async function worker() {
    while (work.length) {
      const u = work.shift();
      try { if (!(await c.match(u))) { const r = await fetch(u, { cache: 'no-cache' }); if (r.ok) await c.put(u, r); } } catch { }
      done++; onProgress && onProgress(done, urls.length);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
}
function packLabel(p) {
  const base = p.replace('-prose', ''); const l = L(base);
  return `${l ? esc(l.native) : esc(base)}${p.endsWith('-prose') ? ' · ' + t('prose') : ' · ' + t('recite')}`;
}
async function viewOffline() {
  setTitle(t('offline'), t('storage'));
  if (SINGLE || IS_ANDROID_APP || !hasCaches()) {
    const est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null;
    render(`<div class="card"><h2>${t('offline')}</h2><p>${IS_ANDROID_APP ? t('androidNote') : t('singleFileNote')}</p>
      <div class="muted" style="font-size:.8rem">${esc(D.meta.credits.publisher)} · v${D.meta.version} · ${D.meta.built}</div></div>`);
    return;
  }
  await loadFontUrls();
  const ai = await audioInfo(); const m = D.meta;
  const est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null;
  const textUrls = ['assets/fonts.css', ...FONT_URLS, 'kattam/index.html', 'kattam/app.js', 'kattam/styles.css', 'kattam/assets/icon.svg', 'kattam/data/meta.json', 'kattam/data/mini.json', 'kattam/data/weekly.json', 'data/occasions.json']; for (let i = 1; i <= 133; i++) textUrls.push(`data/ch/${pad(i, 3)}.json`, `data/gr/${pad(i, 3)}.json`);
  ['translit', 'prose-ta', 'prose-en', ...m.langOrder, ...m.counts.proseLangs.filter(c => !['ta', 'en'].includes(c)).map(c => 'prose-' + c)].forEach(c => textUrls.push(`data/search/${c}.json`));
  const packs = Object.keys(ai.tts || {});
  const packUrls = p => Array.from({ length: 1330 }, (_, i) => `audio/tts/${p}/${pad(i + 1, 4)}.mp3`).slice(0, (ai.tts || {})[p] || 0);
  const bookUrls = ai.chapters.map(n => `audio/ch/${pad(n, 3)}.mp3`);
  const c = await caches.open(RT_CACHE);
  const keys = new Set((await c.keys()).map(r => new URL(r.url).pathname.split('/').slice(-2).join('/')));
  const have = urls => urls.reduce((n, u) => n + (keys.has(u.split('/').slice(-2).join('/')) ? 1 : 0), 0);
  // Nothing to offer for a pack that is not deployed — leave the row out entirely.
  const row = (id, label, urls) => !urls.length ? '' : `<div class="toggle"><label>${label}<br><span class="muted" style="font-size:.75rem"><span id="${id}-c">${have(urls)}</span>/${urls.length}</span></label><button class="btn" id="${id}">📥</button></div><progress id="${id}-p" value="0" max="1" hidden></progress>`;
  render(`<div class="card"><h2>${t('storage')}</h2>${est ? `<div class="muted">${(est.usage / 1e6).toFixed(1)} MB / ${(est.quota / 1e9).toFixed(1)} GB</div>` : ''}
    ${row('dl-text', t('dlText'), textUrls)}
    ${packs.map((p, i) => row('dl-p' + i, `${packLabel(p)} ${t('dlPack')} <span class="muted">(≈ ${Math.round((ai.tts[p] || 0) * 26 / 1024)} MB)</span>`, packUrls(p))).join('')}
    ${row('dl-book', t('dlBook'), bookUrls)}
    <div class="row" style="margin-top:10px"><button class="btn" id="clear">🗑 ${t('clear')}</button><span class="muted" style="font-size:.75rem">${navigator.onLine ? 'online' : 'offline'} · v${m.version} · ${m.built}</span></div></div>`);
  const wire = (id, urls) => { const b = $('#' + id); if (!b) return; b.onclick = async () => { b.disabled = true; const p = $('#' + id + '-p'); p.hidden = false; await cacheUrls(urls, (d, n) => { p.value = d / n; $('#' + id + '-c').textContent = d; }); b.textContent = '✓'; toast(t('saved')); }; };
  wire('dl-text', textUrls); packs.forEach((p, i) => wire('dl-p' + i, packUrls(p))); wire('dl-book', bookUrls);
  $('#clear').onclick = async () => { for (const k of await caches.keys()) if (k !== 'kural-prefs') await caches.delete(k); toast('✓'); viewOffline(); };
}
async function viewAbout() {
  const m = D.meta; setTitle(t('about'), 'CICT');
  const fixes = (m.changelog || []).map(e => `<li><b>${esc(e.date)}</b> · ${esc(S.ui === 'ta' ? e.ta : e.en)}</li>`).join('');
  const langs = m.langOrder.map(c => `<tr><td class="${scriptClass(c)}"${dirAttr(c)}>${esc(L(c).native)}</td><td>${esc(L(c).name)}</td><td class="muted" style="font-size:.8rem">${esc(L(c).credit)} · ${L(c).coverage}/1330</td></tr>`).join('');
  render(`<div class="card"><h2>திருக்குறள் · Tirukkuṟaḷ — 22 மொழிகள்</h2>
    <p>${esc(m.credits.publisher)}</p>
    <p class="muted">All 1330 kurals with CICT's translations into the ${m.counts.scheduled} languages of the Eighth Schedule (plus English and Bhojpuri), three Tamil உரை and an English prose retelling, word-by-word இலக்கணக்குறிப்பு, a live யாப்பு scansion of every couplet, audio recitation, and metre-aware practice. Free · offline-first · ${esc(m.credits.licence)}.</p>
    <h3>Sources</h3><ul class="muted" style="font-size:.85rem;padding-left:18px"><li>${esc(m.credits.text)}</li><li>${esc(m.credits.grammar)}</li><li>${esc(m.credits.metre)}</li><li>${esc(m.credits.audio)}</li></ul>
    <div class="muted" style="font-size:.78rem">Build ${m.built} · v${m.version} · scan: ${m.scan.kural_venpa}/1330 குறள் வெண்பா, ${m.scan.reseg} re-segmented</div></div>
  <div class="card"><h3>⚑ ${t('corrections')}</h3>${fixes ? `<ul class="muted" style="font-size:.85rem;padding-left:18px">${fixes}</ul>` : ''}<p class="muted" style="font-size:.85rem">${t('reportIntro')}</p></div>
  <div class="card"><h3>${t('translations')}</h3><div style="overflow-x:auto"><table class="gtable">${langs}</table></div></div>`);
}

// ───────────────────────────── install / SW / boot ─────────────────────────────
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; wireInstall(); });
function wireInstall() { const b = $('#btn-install'); if (!b) return; b.hidden = !deferredInstall; b.onclick = async () => { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; b.hidden = true; }; }

async function boot() {
  applyPrefs(); TTS.init();
  $('#btn-back').onclick = () => history.length > 1 ? history.back() : (location.hash = '#/');
  $('#btn-uilang').onclick = () => { S.ui = S.ui === 'ta' ? 'en' : 'ta'; saveS(); route(); };
  $('#btn-langs').onclick = openLangSheet;
  const ob = $('#offline-banner'); const upd = () => { ob.hidden = navigator.onLine; }; upd();
  window.addEventListener('online', upd); window.addEventListener('offline', upd);
  window.addEventListener('hashchange', () => { TTS.stop(); Beat.stop(); closeSheet(); route(); });
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || $('#sheet-root').innerHTML) return;
    const el = document.activeElement;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    const p = location.hash.slice(1).split('?')[0].split('/').filter(Boolean);
    const seq = { k: 'k', compare: 'compare' }[p[0]];
    const n = +p[1];
    if (seq && n >= 1 && n <= 1330) {
      if (e.key === 'ArrowLeft' && n > 1) { e.preventDefault(); location.hash = `#/${seq}/${n - 1}`; }
      if (e.key === 'ArrowRight' && n < 1330) { e.preventDefault(); location.hash = `#/${seq}/${n + 1}`; }
    }
    if (p[0] === 'practice' && n >= 1 && n <= 1330) {
      if (e.key === 'ArrowLeft' && n > 1) { e.preventDefault(); location.hash = `#/practice/${n - 1}/${p[2] || 'listen'}`; }
      if (e.key === 'ArrowRight' && n < 1330) { e.preventDefault(); location.hash = `#/practice/${n + 1}/${p[2] || 'listen'}`; }
    }
    if (e.key === '/' ) { e.preventDefault(); location.hash = '#/search'; }
  });
  if ('serviceWorker' in navigator && !SINGLE && !IS_ANDROID_APP && location.protocol.startsWith('http')) {
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      reg.addEventListener('updatefound', () => { const nw = reg.installing; nw && nw.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) toast(t('update'), 5000); }); });
      navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'open') location.hash = e.data.hash; });
      // warm the text cache in the background on first run
      if (!localStorage.getItem('kural.warmed')) { setTimeout(async () => { const urls = []; for (let i = 1; i <= 133; i++) urls.push(`data/ch/${pad(i, 3)}.json`); await cacheUrls(urls); localStorage.setItem('kural.warmed', '1'); }, 4000); }
    } catch (e) { console.log('sw', e.message); }
  }
  await route();
  pushPrefsToSW();
  pushWidgetPrefs();
  showDailyNotification(false); setInterval(() => showDailyNotification(false), 60000);
  if (location.hash.startsWith('#/k/')) S.lastKural = +location.hash.split('/')[2] || S.lastKural;
}
boot();
