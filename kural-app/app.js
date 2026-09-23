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
    cards: "படங்கள்",
    cardsSub: "பகிரக் கூடிய குறள் படம் — எந்த மொழியிலும்",
    cardSource: "எதைப் பகிர",
    cardToday: "இன்றைய குறள்",
    cardPick: "குறள் எண்",
    cardOcc: "நிகழ்வு",
    cardTheme: "வடிவம்",
    cardOlai: "ஓலை",
    cardIravu: "இரவு",
    cardVizha: "விழா",
    cardSize: "அளவு",
    cardSq: "சதுரம்",
    cardSt: "நிலை",
    cardShow: "காட்ட",
    cardTranslit: "ஒலிபெயர்ப்பு",
    cardChapter: "அதிகாரம்",
    cardQr: "QR + இணைப்பு",
    cardLangs: "மொழிகள் (2 வரை)",
    cardSave: "⬇ சேமி",
    cardNext: "🎲 அடுத்த குறள்",
    cardMade: "சேமிக்கப்பட்டது",
    meanWeakLangs: "இந்த மொழிகளில் பொருள் தேடல் இன்னும் வலுவில்லை — அங்கே சொல் தேடலைப் பயன்படுத்துக: {l}",
    meanWeakScript: "இந்த எழுத்தில் பொருள் தேடல் வலுவில்லை; 🔤 சொல் தேடல் நம்பகமானது.",
    meanTab: "💡 பொருள்",
    wordTab: "🔤 சொல்",
    meanPh: "ஒரு கருத்தை உங்கள் சொற்களில் எழுதுக — எந்த மொழியிலும்",
    meanIntro: "குறளின் சொற்கள் தெரியாவிட்டாலும், நீங்கள் சொல்ல வரும் கருத்தைச் சொல்லும் குறள்களைக் கண்டுபிடிக்கலாம் — 22 மொழிகளில் எதில் எழுதினாலும். ஒவ்வொரு விடையுடனும் பொருந்திய உரை அல்லது மொழிபெயர்ப்பு வரி காட்டப்படும்.",
    meanDl: "📥 பொருள் தேடலைப் பதிவிறக்குக ({mb} MB)",
    meanDlNote: "ஒருமுறை மட்டும் — அதன் பின் இணையம் இல்லாமலும் இயங்கும். மொழி மாதிரி உங்கள் கருவியிலேயே ஓடுகிறது; நீங்கள் தேடுவது எங்கும் அனுப்பப்படுவதில்லை. Wi-Fi-இல் பதிவிறக்குவது நல்லது.",
    meanDling: "பதிவிறக்கம் {p}% ({a}/{b} MB)",
    meanCheck: "சரிபார்க்கிறது…",
    meanPrep: "பொருள் மாதிரியைத் தயார் செய்கிறது… (முதல் முறை சில விநாடிகள்)",
    meanOffline: "பதிவிறக்க இணையம் தேவை.",
    meanFail: "பதிவிறக்கம் முடியவில்லை: {e}. மீண்டும் முயல்க.",
    meanErr: "பொருள் தேடல் இந்தக் கருவியில் இயங்கவில்லை: {e}",
    meanUnavail: "பொருள் தேடல் இணைய / Android பதிப்பில் மட்டும் (ஒற்றைக் கோப்புப் பதிப்பில் இல்லை).",
    meanReady: "✓ பதிவிறக்கப்பட்டது · {mb} MB",
    meanRemove: "🗑 நீக்குக",
    meanUpdate: "புதுப்பிப்பு உள்ளது ({mb} MB)",
    meanTry: "எடுத்துக்காட்டுகள்:",
    meanEx: "துன்பத்தில் கைவிடாத நண்பன்|கோபத்தை அடக்குவது எப்படி|பிறர் செய்த உதவியை மறக்கக் கூடாது|a leader who listens to advice",
    meanNone: "பொருந்தும் குறள் எதுவும் இல்லை — வேறு சொற்களில் முயல்க.",
    meanHonest: "முன்னோட்டம்: பொருள் தேடல் உங்கள் கேள்விக்கு மிக அருகிலுள்ள குறள்களை எப்போதும் காட்டும் — குறள் அதைப் பற்றிப் பேசாவிட்டாலும். ஆகவே ஒவ்வொரு விடையிலும் பொருந்திய வரியைப் படித்து முடிவு செய்க. 170 சோதனைக் கேள்விகளில் 83%-க்குப் பொருத்தமான குறள் முதல் பத்தில் வந்தது (சொல் தேடல்: 46%). CICT ஆசிரியர் குழுவின் சோதனைக்குக் காத்திருக்கிறது.",
    meanVerse: "மூலம்",
    meanMv: "மு. வ. உரை",
    meanTac: "தமிழ் உரை",
    meanEnP: "ஆங்கில உரைநடை",
    meanWordsNone: "சொல் தேடலில் கிடைக்கவில்லை — 💡 பொருள் தேடலில் முயல்க.",
    meanTime: "{n} குறள் · {ms} ms · உங்கள் கருவியில்",
    uiLang: "இடைமுக மொழி",
    exTitle: 'தேர்வுப் பயிற்சி', exSub: 'இலக்கணம் · புணர்ச்சி · யாப்பு · அணி', exCardSub: 'இலக்கணக் குறிப்பு · பிரித்து எழுதுக · அலகிடுதல் · மோனை எதுகை — குறள்களிலிருந்தே', exOpen: 'தொடங்கலாம்',
    exLevel: 'நிலை', exPickLv: 'எந்த நிலையிலிருந்து தொடங்கலாம்?', exLv1: 'நிலை 1', exLv2: 'நிலை 2',
    exLv3: 'நிலை 3', exLv0: 'எல்லாம் · போட்டி / பெரியவர்', exLvHint: 'தோராயப் பரிந்துரை: நிலை 1 ≈ வகுப்பு 6–7 · நிலை 2 ≈ 8–9 · நிலை 3 ≈ 10–12. இது CICT ஆசிரியர் குழுவின் ஒப்புதலுக்குக் காத்திருக்கும் தற்காலிகப் பிரிவு; பாடத்திட்டத்துடன் இன்னும் ஒப்பிடப்படவில்லை.', exSrc: 'எந்தக் குறள்களிலிருந்து?',
    exSrcMine: 'நான் படித்தவை', exSrcToday: 'இன்றைய பாடம்', exSrcBook: 'முழு நூல்', exSrcCh: 'அதிகாரம்',
    exSrcMemo: 'மனப்பாடம்', exStart: 'கலவைச் சுற்றைத் தொடங்கலாம்', exResume: 'தொடரலாம் · {i}/{n}', exMissBtn: 'பிழைத்தவற்றை மீண்டும் ({n})',
    exStats: 'பயிற்சி நாள்கள்: {d} · விடையளித்தவை: {q} · சரி: {p}%', exTopics: 'பயிற்சிப் பகுதிகள்', exGrpGram: 'இலக்கணம்', exGrpWord: 'சொல்',
    exGrpMetre: 'யாப்பு · தொடை', exGrpAni: 'அணி', exMastered: 'கைவந்தவை {a}/{b}', exItems: 'வினாக்கள்: {n}',
    exPractise: 'பயிற்சி செய்யலாம்', exFewData: 'இந்த நிலையில் இதற்குப் போதுமான உறுதியான வினாக்கள் இல்லை', exSl: 'சொல்லறிவு · ஆங்கிலப் பொருள்', exSlSub: 'பொருள் ஆங்கிலத்தில் மட்டும் உள்ளது; தமிழ்ப் பொருள் இன்னும் தரவில் இல்லை.',
    exSlOpt: 'விருப்பப் பயிற்சி', exKnown: 'ஆங்கிலப் பொருள் அறிந்த சொற்கள்: {n} / {t}', exHonestT: 'இந்த வினாக்கள் எப்படி அமைக்கப்பட்டன', exHonest1: 'இலக்கணக் குறிப்புகள் AI-உதவியுடன் உருவாக்கப்பட்டு இருமுறை சரிபார்க்கப்பட்ட வரைவு. நம்பகம் குறைந்தவையும், சரிபார்ப்பாளர் ஐயம் தெரிவித்த சொற்களும் வினாக்களாக வருவதில்லை; சரிபார்ப்பில் திருத்தப்பட்ட சொற்களுக்கு அக்குறிப்பு காட்டப்படும்.',
    exHonest2: 'யாப்பு வினாக்கள் கணினி விதிப்படி அலகிட்டவை; ஐயமான சீர்கள் விலக்கப்பட்டன.', exTextbook: 'பாடநூல் விடை வேறுபட்டால் பாடநூலையே பின்பற்றுங்கள்; ⚑ மூலம் எங்களுக்குத் தெரிவிக்கலாம்.', exConfLegend: 'நம்பகம்: உயர் ≥ 0.90 · நல்ல 0.80–0.89 · நடுத்தரம் 0.70–0.79 (“எல்லாம்” நிலையில் மட்டும்) · அணிக்கு நம்பக மதிப்பு இல்லை', exTermsLink: '📘 சொல் விளக்கங்கள்',
    exExplorer: '🔎 இலக்கணத் தொகுப்பு', exNoSave: 'இக்கருவியில் சேமிக்க இடமில்லை; பயிற்சி முன்னேற்றம் சேமிக்கப்படாமல் போகலாம்.', exNoBank: 'தேர்வுப் பயிற்சித் தரவைத் திறக்க முடியவில்லை. இணையம் கிடைக்கும்போது மீண்டும் முயலலாம்.', exExamLabel: 'தேர்வு வினா: {x}',
    exEnough: 'இப்போதைக்குப் போதும்', exNext: 'தொடரலாம் →', exFinish: 'முடிவைப் பார்க்கலாம் →', exCheck: 'சரிபார்க்கலாம்',
    exI_mcq: 'சரியான விடையைத் தேர்ந்தெடுங்கள்.', exI_rows: 'ஒவ்வொரு வரியிலும் ஒன்றைத் தேர்ந்தெடுத்து, சரிபார்க்கலாம்.', exI_pr: 'சேர்ந்துள்ள சொற்களைச் சரியாகப் பிரித்துக் காட்டும் விடையைத் தேர்ந்தெடுங்கள்.', exI_al: 'ஒவ்வொரு சீருக்கும் வாய்பாட்டைத் தேர்ந்தெடுங்கள்.',
    exWrong: '✗ இது அல்ல — CICT குறிப்பின்படி விடை: {x}', exRowsVerdict: '{a}/{b} சரி', exRowsHint: 'ஒவ்வொரு வரியிலும் ஒன்றைத் தேர்ந்தெடுத்த பிறகு சரிபார்க்கலாம்.', exYourPick: 'நீங்கள் தேர்ந்தது',
    exL_vm: 'இலக்கணக் குறிப்பு தருக', exQ_find2: 'இக்குறளில் {x} ஆக வரும் இரண்டு சொற்களையும் தொட்டுக் காட்டுங்கள்.', exTgNote: 'வேற்றுமை உருபு மறைந்து வந்த தொகை இது; எந்த வேற்றுமை என்பது இவ்வினாவில் கேட்கப்படவில்லை.', exAlVerdict: '✗ {k}/7 சீர்கள் சரி — முழு அலகீடு கீழே.',
    exRowsWrong: '✗ முழுமையாகச் சரியில்லை — சரியான விடை: {x}', exFindWrong: '✗ முழுமையாகச் சரியில்லை — சரியான சொற்கள் குறிக்கப்பட்டுள்ளன.', exWrongRule: '✗ இது அல்ல — விதிப்படி விடை: {x}', exAnchor: 'முதல் சீர்',
    exDraft: 'வரைவு', exFewK: 'இக்குறளில் வினாக்கள் குறைவு', gxOtherVet: 'சரிபார்க்க வேண்டியவை', exPart: '◐ கணக்கில் சேர்க்கவில்லை — CICT குறிப்பின்படி விடை: {x}',
    exPartSuper: '«{p}» சரியே; ஆனால் முழுமையான இலக்கணக் குறிப்பு «{x}».', exPartAlt: 'CICT குறிப்பு இதை «{x}» எனக் கொள்கிறது. «{p}», «{x}» ஆகிய இரண்டுக்கும் இடையிலான எல்லையைத் தரவு எப்போதும் ஒரே மாதிரிக் குறிப்பதில்லை; அதனால் இந்த விடை பிழையாகக் கணக்கிடப்படவில்லை.', exFindHint: 'குறைந்தது ஒரு சொல்லைத் தொட்ட பிறகு சரிபார்க்கலாம்.', exCict: 'CICT குறிப்பு',
    exConfHi: 'உயர் நம்பகம்', exConfGood: 'நல்ல நம்பகம்', exConfMid: 'நடுத்தர நம்பகம் · வரைவு', exConfParts: 'சொற்களின் நம்பகம் (தொகைக்குத் தனி நம்பக எண் இல்லை)',
    exConfNone: 'நம்பக மதிப்பு இல்லை — அறிஞர் சரிபார்ப்புக்கு உட்பட்டது', exMetreConf: 'விதிவழிக் கணிப்பு · யாப்பு நம்பகம் {c} · வெண்டளை விதிப்படி சரிபார்க்கப்பட்டது', exRhymeConf: 'எழுத்து ஒப்புமை விதிப்படி கணினி கண்டது', exDef: 'விளக்கம் · வரைவு',
    exMore: 'விளக்கம்', exWord: '📚 சொல் விவரம்', exKural: '📖 குறள் {n}', exListen: '🔊 கேட்கலாம்',
    exReport: '⚑ விடை தவறு எனத் தோன்றினால் தெரிவிக்கலாம்', exVoided: 'இந்த வினா இனி இக்கருவியில் வராது; இந்த விடை கணக்கில் சேரவில்லை.', exVoidItem: '⚑ கணக்கில் இல்லை', exCorrNote: 'இச்சொல்லின் குறிப்பு சரிபார்ப்பில் திருத்தப்பட்டது; விவரம் “சொல் விவரம்” பகுதியில்.',
    exSkip: 'இந்த வினா இப்போது கிடைக்கவில்லை; அடுத்ததற்குச் செல்லலாம்.', exBuilding: '⏳ வினாக்கள் தயாராகின்றன…', exNoItems: 'இப்பகுதியில் இப்போது வினாக்கள் அமையவில்லை. வேறு பகுதியைத் தேர்ந்தெடுக்கலாம்.', exNotCached: 'இந்த அதிகாரங்களின் தரவு இக்கருவியில் இன்னும் இல்லை. இணையம் கிடைக்கும்போது திறக்கலாம், அல்லது “இணையமின்றி” பக்கத்தில் முழு நூலையும் சேமிக்கலாம்.',
    exFallback: 'நீங்கள் படித்த குறள்களில் போதுமான வினாக்கள் இல்லை; முழு நூலிலிருந்து எடுக்கப்பட்டன.', exShort: 'இப்பகுதியிலிருந்து அமைந்த வினாக்கள்: {n}', exReplaced: 'முந்தைய சுற்றில் விடையளித்தவை சேமிக்கப்பட்டன.', exNeutralLegend: 'மங்கலாக உள்ள சொற்கள் கணக்கில் இல்லை: அவற்றின் குறிப்பு இன்னும் உறுதியாகவில்லை.',
    exNeutralRhyme: 'மங்கலாக உள்ள சீர்கள் ஐயத்துக்குரியவை (இன எழுத்து, உயிர் வேறுபாடு, நீள வேறுபாடு); இப்பயிற்சியில் கணக்கில் இல்லை.', exOffTile: '(கணக்கில் இல்லை)', exFindCount: 'தொட வேண்டியவை: {k}', exFound: '✓ கண்டீர்கள்',
    exMissed: 'விடுபட்டது', exNotThis: 'இது அல்ல', exRowThinai: 'திணை', exRowPaal: 'பால்',
    exRowEN: 'எண்', exRowIdam: 'இடம்', exAsaiSeg: 'அசை {i}: {s}', exNer: 'நேர்',
    exNirai: 'நிரை', exAlProg: 'சீர் {i}/7', exAlCols: 'சீர்|அசை|வாய்பாடு', exAlDone: 'இக்குறள் «{x}» என்னும் வாய்பாட்டில் முடிகிறது.',
    exPaa: 'பா: குறள் வெண்பா', exSplitNote: 'தேர்வில் பிரித்த வடிவத்தை எழுதலாம்; குறளை ஓதும்போது அச்சிட்ட வடிவத்தையே சொல்லுங்கள்.', exTail: 'இறுதியில் உள்ள {c} அடுத்த சொல் «{nx}» வல்லினத்தில் தொடங்குவதால் மிகுந்தது; பிரிக்கும்போது அதை விடலாம்.', exUrupu: 'உருபு: {u}',
    exVtNote: 'வேற்றுமை அதன் உருபைக் கொண்டு அறியப்படுகிறது.', exTgNoNum: 'வேற்றுமை எண் தரவில் குறிக்கப்படவில்லை', exTgCase: '{x} வேற்றுமைத் தொகை', exTgPanbu: 'பண்புத் தொகை: “மை” விகுதியும் “ஆகிய / ஆன” உருபும் மறைந்து வருவது.',
    exAnNote: 'CICT அணிக் குறிப்பு · வரைவு', exAnMore: 'தரவு குறிக்கும் அணி இது; இக்குறளில் வேறு அணியும் இருக்கலாம்.', exAnEka: 'ஒரு பகுதியை மட்டும் உருவகம் செய்து மற்றதை உருவகம் செய்யாமல் விடுவது ஏகதேச உருவக அணி; பாடநூல் அப்படிக் குறிப்பிட்டால் அதையே பின்பற்றுங்கள்.', exPvSix: 'பொருள், இடம், காலம், சினை, பண்பு, தொழில் — ஆறு வகை',
    exTpAgree: 'உயர்திணை → ஆண்பால் / பெண்பால் / பலர்பால்; அஃறிணை → ஒன்றன்பால் / பலவின்பால்', exR_asai: 'நேர் = தனிக்குறில் அல்லது தனிநெடில் (ஒற்றுடனும்); நிரை = குறிலிணை அல்லது குறில்நெடில் (ஒற்றுடனும்).', exR_final: 'குற்றியலுகரத்தில் முடியும் ஈற்றுச்சீர் ஓரசையாகக் கொள்ளப்படும்: நேர்பு → காசு, நிரைபு → பிறப்பு; நேர் → நாள், நிரை → மலர்.', exR_th: '{a} ({cls}) முன் {asai} → {x}',
    exR_tp: 'விகுதி -{v} → {x}', exR_tpDem: 'சுட்டுப்பெயர் {w} → {x}', exR_monai: 'மோனை: சீர்களின் முதல் எழுத்து ஒன்றி வருவது (உயிர் இன வரிசை: அ ஆ ஐ ஔ · இ ஈ எ ஏ · உ ஊ ஒ ஓ).', exR_etukai: 'எதுகை: முதல் எழுத்து அளவொத்து நிற்க, இரண்டாம் எழுத்து ஒன்றி வருவது.',
    exAdiEtukai: 'அடி எதுகை: «{a}» – «{b}»', exThB: '(முதல் அடியின் இறுதிச் சீரும் இரண்டாம் அடியின் முதல் சீரும்)', exAdi1: 'முதல்', exAdi2: 'இரண்டாம்',
    exRpNote: 'தேர்வுப் பயிற்சி · {d} · «{w}» · செயலியின் விடை: {x} · நான் தேர்ந்தெடுத்தது: {y}', exT_sv: 'சொல் வகை', exT_pv: 'பெயர்ச்சொல் வகை', exT_pr: 'பிரித்து எழுதுக',
    exT_td: 'மோனை · எதுகை', exT_ec: 'எச்சம்', exT_tp: 'திணை · பால் · எண் · இடம்', exT_vt: 'வேற்றுமை',
    exT_sr: 'சீர்: அசை · வாய்பாடு', exT_th: 'தளை', exT_vm: 'வினைமுற்று · வினையாலணையும் பெயர் · தொழிற்பெயர்', exT_tg: 'தொகைநிலைத் தொடர்',
    exT_an: 'அணி', exT_al: 'அலகிட்டு வாய்பாடு தருக', exT_sl: 'சொல்லறிவு', exL_sv: 'சொல் வகை அறிக',
    exL_pv: 'பெயர்ச்சொல் வகை அறிக', exL_pr: 'பிரித்து எழுதுக', exL_td_m: 'மோனைச் சொற்களை எடுத்து எழுதுக', exL_td_e: 'எதுகைச் சொற்களை எடுத்து எழுதுக',
    exL_ec: 'இலக்கணக் குறிப்பு தருக', exL_find: 'எடுத்து எழுதுக', exL_tp: 'திணை, பால், எண், இடம் கூறுக', exL_vt: 'வேற்றுமை உருபைக் கண்டு வேற்றுமையைக் குறிப்பிடுக',
    exL_sr: 'அலகிடுக', exL_th: 'தளை கண்டறிக', exL_tg: 'இலக்கணக் குறிப்பு தருக', exL_an: 'அணியைக் குறிப்பிடுக',
    exL_al: 'அலகிட்டு வாய்பாடு தருக', exQ_sv: '«{w}» — இது எவ்வகைச் சொல்?', exQ_pv: '«{w}» — இது எவ்வகைப் பெயர்ச்சொல்?', exQ_pr: '«{stem}» — சரியான பிரிப்பு எது?',
    exQ_td_m: '{adi} அடியில், முதல் சீர் «{w}» உடன் மோனையாக வரும் சீர்களைத் தொடுங்கள்.', exQ_td_e: '{adi} அடியில், முதல் சீர் «{w}» உடன் எதுகையாக வரும் சீர்களைத் தொடுங்கள்.', exQ_ec: '«{w}» — இதன் இலக்கணக் குறிப்பு எது?', exQ_find: 'இக்குறளில் {x} எது? தொட்டுக் காட்டுங்கள்.',
    exQ_tp: '«{w}» — இச்சொல்லின் திணை, பால், எண், இடம் எவை?', exQ_vt: '«{w}» — இச்சொல்லில் வந்துள்ள வேற்றுமை எது?', exQ_srA: '«{s}» — ஒவ்வோர் அசையும் நேரா, நிரையா?', exQ_srN: '«{s}» — இச்சீரின் வாய்பாடு எது?',
    exQ_srF: 'ஈற்றுச்சீர் «{s}» — இதன் வாய்பாடு எது?', exQ_th: '«{a}» — «{b}» : இவ்விரு சீர்களுக்கும் இடையிலான தளை எது?', exQ_tg: '«{w}» — இது எவ்வகைத் தொகைநிலைத் தொடர்?', exQ_an: 'உவமை, எடுத்துக்காட்டு உவமை, உருவகம் — இவற்றுள் இக்குறளில் பயின்று வருவது எது?',
    exQ_sl: '«{w}» — இக்குறளில் இச்சொல்லின் பொருள் எது?', exResT: 'சுற்றின் முடிவு', exScore: '{a}/{b} சரி · {p}%', exVoidN: 'கணக்கில் இல்லை: {n}',
    exMoved: 'முன்னேறியவை: {up} · மீண்டும் பழக வேண்டியவை: {dn}', exAgain: 'இன்னொரு சுற்று', exHub: 'தேர்வுப் பயிற்சிப் பக்கம்', exTermsT: 'சொல் விளக்கங்கள்',
    exTermsNote: 'இவ்விளக்கங்கள் வரைவு; CICT ஆசிரியர் குழு சரிபார்த்து வருகிறது.', exOnKural: '📝 இக்குறளில் தேர்வுப் பயிற்சி', gxT_ilakkanam: 'இலக்கணக் குறிப்பு', gxT_category: 'சொல் வகை',
    gxT_vetrumai: 'வேற்றுமை', gxT_togai: 'தொகைநிலைத் தொடர்', gxT_ani: 'அணி', gxT_todar: 'அடைமொழி · அடுக்குத்தொடர்',
    gxOther: 'பிற குறிப்புகள் (அணி அல்லாதவை / சரிபார்க்க வேண்டியவை)', gxPractise: '📝 இக்குறிப்பைப் பயிற்சி செய்யலாம்',
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
    malai: 'திருவள்ளுவமாலை', malaiSub: 'திருக்குறளையும் திருவள்ளுவரையும் போற்றும் 55 வாழ்த்துப் பாடல்கள் — ஔவையார், கபிலர், பரணர், நக்கீரர், இடைக்காடர் உள்ளிட்ட 53 புலவர்களின் பெயரால்', malaiToday: 'இன்றைய வாழ்த்துப் பாடல்', malaiPoet: 'புலவர்', malaiGloss: 'பொழிப்புரை', malaiAll: 'எல்லாப் பாடல்களும்', malaiFrom: 'திருவள்ளுவமாலையிலிருந்து', malaiVerse: 'பாடல்', malaiNote: 'சங்கப் புலவர்கள் பாடியதாக மரபு கூறும் தொகுப்பு; ஆசிரியர்களும் காலமும் ஆய்வாளர்களிடையே விவாதத்திற்குரியவை. 53 வெண்பாக்களும் 2 குறட்பாக்களும்.', malaiSource: 'மூலம்: பொதுக்களப் பதிப்புகள் (Project Madurai · விக்கிமூலம்), இரண்டையும் ஒப்பிட்டு. பாடல்கள் 1–20 சந்தி சேர்ந்த பழைய எழுத்துமுறையிலும், 21–55 சொற்பிரிப்பு முறையிலும் மூலத்தில் உள்ளவாறே.',
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
    cards: "Cards",
    cardsSub: "A kural image to share — in any language",
    cardSource: "What to share",
    cardToday: "Kural of the day",
    cardPick: "Kural number",
    cardOcc: "Occasion",
    cardTheme: "Design",
    cardOlai: "Palm",
    cardIravu: "Night",
    cardVizha: "Festive",
    cardSize: "Size",
    cardSq: "Square",
    cardSt: "Status",
    cardShow: "Show",
    cardTranslit: "Transliteration",
    cardChapter: "Chapter",
    cardQr: "QR + link",
    cardLangs: "Languages (up to 2)",
    cardSave: "⬇ Save",
    cardNext: "🎲 Another kural",
    cardMade: "Saved",
    meanWeakLangs: "Still weak in these languages — use word search for them: {l}",
    meanWeakScript: "Meaning search is weak for this script; 🔤 word search is more reliable.",
    meanTab: "💡 Meaning",
    wordTab: "🔤 Words",
    meanPh: "Describe an idea in your own words — any language",
    meanIntro: "Find kurals that say what you mean even when you don't know their words — type in any of the 22 languages. Each result shows the commentary or translation line that matched.",
    meanDl: "📥 Download meaning search ({mb} MB)",
    meanDlNote: "One time only — after that it works without internet. The language model runs on your device; what you search for is never sent anywhere. Best downloaded on Wi-Fi.",
    meanDling: "Downloading {p}% ({a}/{b} MB)",
    meanCheck: "Checking…",
    meanPrep: "Preparing the meaning model… (a few seconds the first time)",
    meanOffline: "The download needs an internet connection.",
    meanFail: "The download did not finish: {e}. Please try again.",
    meanErr: "Meaning search could not run on this device: {e}",
    meanUnavail: "Meaning search is available in the web and Android editions (not in the single-file edition).",
    meanReady: "✓ Downloaded · {mb} MB",
    meanRemove: "🗑 Remove",
    meanUpdate: "Update available ({mb} MB)",
    meanTry: "Try:",
    meanEx: "a friend who stands by you in hard times|how to control anger|never forget a kindness|கல்வியின் பெருமை",
    meanNone: "Nothing found — try other words.",
    meanHonest: "Preview: meaning search always shows the kurals nearest to your question — even when the Kural does not speak about it. Read the matched line under each result and judge for yourself. On 170 test questions a fitting kural was in the top ten for 83% (keyword search: 46%). Awaiting testing by the CICT teacher panel.",
    meanVerse: "verse",
    meanMv: "Mu. Va. commentary",
    meanTac: "Tamil commentary",
    meanEnP: "English prose",
    meanWordsNone: "No word matches — try 💡 meaning search.",
    meanTime: "{n} kurals · {ms} ms · on your device",
    uiLang: "Interface language",
    exTitle: 'Exam practice', exSub: 'Grammar · sandhi · metre · figures of speech', exCardSub: 'Grammar notes · word splitting · scansion · rhyme — from the couplets themselves', exOpen: 'Open',
    exLevel: 'Level', exPickLv: 'Which level would you like to start at?', exLv1: 'Level 1', exLv2: 'Level 2',
    exLv3: 'Level 3', exLv0: 'All · contests / adults', exLvHint: 'Rough guide: Level 1 ≈ classes 6–7 · Level 2 ≈ 8–9 · Level 3 ≈ 10–12. This grouping is provisional, awaiting the CICT teacher panel, and has not yet been matched to any syllabus.', exSrc: 'From which couplets?',
    exSrcMine: 'Ones I have studied', exSrcToday: 'Today’s lesson', exSrcBook: 'The whole book', exSrcCh: 'Chapter',
    exSrcMemo: 'Memorised', exStart: 'Start a mixed round', exResume: 'Continue · {i}/{n}', exMissBtn: 'Redo my mistakes ({n})',
    exStats: 'Practice days: {d} · answered: {q} · right: {p}%', exTopics: 'Topics', exGrpGram: 'Grammar', exGrpWord: 'Words',
    exGrpMetre: 'Metre · rhyme', exGrpAni: 'Figures of speech', exMastered: 'Mastered {a}/{b}', exItems: 'questions: {n}',
    exPractise: 'Practise', exFewData: 'Not enough confident questions for this at this level', exSl: 'Word meanings (English)', exSlSub: 'Meanings are in English only; the data has no Tamil meanings yet.',
    exSlOpt: 'Optional', exKnown: 'Words whose English meaning you know: {n} / {t}', exHonestT: 'How these questions are made', exHonest1: 'The grammar notes are an AI-assisted, double-verified draft. Low-confidence tags and words a reviewer questioned never become questions; words corrected during review are marked as such.',
    exHonest2: 'Metre questions come from rule-based scansion; doubtful feet are left out.', exTextbook: 'If your textbook’s answer differs, follow the textbook, and tell us with ⚑.', exConfLegend: 'Confidence: high ≥ 0.90 · good 0.80–0.89 · moderate 0.70–0.79 (level “All” only) · figures of speech carry no score', exTermsLink: '📘 Terms used',
    exExplorer: '🔎 Grammar explorer', exNoSave: 'No storage space left on this device; practice progress may not be saved.', exNoBank: 'The exam-practice data could not be opened. Please try again when online.', exExamLabel: 'Exam wording: {x}',
    exEnough: 'Enough for now', exNext: 'Next →', exFinish: 'See the result →', exCheck: 'Check',
    exI_mcq: 'Choose the right answer.', exI_rows: 'Choose one in each row, then check.', exI_pr: 'Choose the answer that splits the joined words correctly.', exI_al: 'Choose the pattern for each foot.',
    exWrong: '✗ Not this one — per the CICT note, the answer is: {x}', exRowsVerdict: '{a}/{b} right', exRowsHint: 'Choose one in every row first, then check.', exYourPick: 'your choice',
    exL_vm: 'Give the grammatical note', exQ_find2: 'Tap the two words in this couplet that are a {x}.', exTgNote: 'A case compound: the case ending is hidden here. Which case it is, is not asked in this question.', exAlVerdict: '✗ {k} of 7 feet right — the full scansion is below.',
    exRowsWrong: '✗ Not all right — the answer is: {x}', exFindWrong: '✗ Not quite — the right words are marked.', exWrongRule: '✗ Not this one — by the rule, the answer is: {x}', exAnchor: 'first foot',
    exDraft: 'draft', exFewK: 'too few questions here', gxOtherVet: 'To be checked', exPart: '◐ Not counted either way — per the CICT note, the answer is: {x}',
    exPartSuper: '«{p}» is right, but the complete grammatical note is «{x}».', exPartAlt: 'The CICT note reads it as «{x}». The data does not always draw the line between «{p}» and «{x}» the same way, so this answer is not counted as wrong.', exFindHint: 'Tap at least one word first, then check.', exCict: 'CICT note',
    exConfHi: 'high confidence', exConfGood: 'good confidence', exConfMid: 'moderate confidence · draft', exConfParts: 'Confidence of the parts (the compound has no score of its own)',
    exConfNone: 'No confidence score — subject to scholarly review', exMetreConf: 'Rule-based scansion · metre confidence {c} · checked against the veṇṭaḷai rule', exRhymeConf: 'Found by a letter-matching rule', exDef: 'Definition · draft',
    exMore: 'Explanation', exWord: '📚 Word details', exKural: '📖 Kural {n}', exListen: '🔊 Listen',
    exReport: '⚑ Report if this answer looks wrong', exVoided: 'This question will not come back on this device, and this answer is not counted.', exVoidItem: '⚑ not counted', exCorrNote: 'This word’s note was corrected during verification; see Word details.',
    exSkip: 'This question is not available now; let’s go to the next.', exBuilding: '⏳ Preparing questions…', exNoItems: 'No questions could be made from this selection. Please pick another.', exNotCached: 'These chapters are not on this device yet. Open them when you are online, or save the whole book on the Offline page.',
    exFallback: 'Not enough questions in the couplets you have studied, so they come from the whole book.', exShort: 'Questions available from this selection: {n}', exReplaced: 'Your answers from the previous round were saved.', exNeutralLegend: 'Greyed-out words don’t count: their notes are not yet certain.',
    exNeutralRhyme: 'Greyed-out feet are borderline cases (related letters, a different vowel or length); they don’t count in this drill.', exOffTile: '(not counted)', exFindCount: 'To find: {k}', exFound: '✓ found',
    exMissed: 'missed', exNotThis: 'not this one', exRowThinai: 'Class (tiṇai)', exRowPaal: 'Gender (pāl)',
    exRowEN: 'Number', exRowIdam: 'Person', exAsaiSeg: 'Unit {i}: {s}', exNer: 'nēr',
    exNirai: 'nirai', exAlProg: 'Foot {i}/7', exAlCols: 'Foot|Units|Pattern', exAlDone: 'This couplet ends in the foot pattern «{x}».',
    exPaa: 'Metre: kuṟaḷ veṇpā', exSplitNote: 'In the exam, write the split form; when reciting, say the printed form.', exTail: 'The final {c} was added because the next word «{nx}» begins with a hard consonant (vallinam mikutal); leave it out when splitting.', exUrupu: 'Case ending: {u}',
    exVtNote: 'A case is recognised by its ending.', exTgNoNum: 'The data does not record the case number', exTgCase: 'Case compound of the {x} case', exTgPanbu: 'Quality compound: the -mai suffix and the linking “ākiya / āṉa” are both dropped.',
    exAnNote: 'CICT note on the figure · draft', exAnMore: 'This is the figure the data records; the couplet may use others too.', exAnEka: 'When one part is turned into a metaphor and the matching part is stated plainly, not as a metaphor, it is ēkatēca uruvakam; if your textbook says so, follow it.', exPvSix: 'Thing, place, time, part, quality, action — six kinds',
    exTpAgree: 'uyartiṇai → āṇpāl / peṇpāl / palarpāl; aḵṟiṇai → oṉṟaṉpāl / palaviṉpāl', exR_asai: 'nēr = a lone short or long syllable (with any following consonant); nirai = two shorts, or a short then a long (with any following consonant).', exR_final: 'A last foot ending in a short u counts as one unit: nērpu → kācu, niraipu → piṟappu; nēr → nāḷ, nirai → malar.', exR_th: '{a} ({cls}) before {asai} → {x}',
    exR_tp: 'Ending -{v} → {x}', exR_tpDem: 'Demonstrative pronoun {w} → {x}', exR_monai: 'mōṉai: feet whose first letters match (vowel sets: a ā ai au · i ī e ē · u ū o ō).', exR_etukai: 'etukai: the first letters are of equal length and the second letters match.',
    exAdiEtukai: 'Line-initial rhyme (aṭi etukai): «{a}» – «{b}»', exThB: '(last foot of line 1 and first foot of line 2)', exAdi1: '1', exAdi2: '2',
    exRpNote: 'Exam practice · {d} · «{w}» · app’s answer: {x} · my choice: {y}', exT_sv: 'Word class', exT_pv: 'Kinds of noun', exT_pr: 'Split the word',
    exT_td: 'Rhyme: mōṉai · etukai', exT_ec: 'Participles', exT_tp: 'Class · gender · number · person', exT_vt: 'Case',
    exT_sr: 'A foot: units and pattern', exT_th: 'Linkage (taḷai)', exT_vm: 'Finite verbs, participial and verbal nouns', exT_tg: 'Compounds (tokai)',
    exT_an: 'Figures of speech', exT_al: 'Scan and give the patterns', exT_sl: 'Word meanings', exL_sv: 'Identify the word class',
    exL_pv: 'Identify the kind of noun', exL_pr: 'Split and write', exL_td_m: 'Pick out the mōṉai words', exL_td_e: 'Pick out the etukai words',
    exL_ec: 'Give the grammatical note', exL_find: 'Pick it out', exL_tp: 'State the class, gender, number and person', exL_vt: 'Find the case ending and name the case',
    exL_sr: 'Scan', exL_th: 'Find the linkage', exL_tg: 'Give the grammatical note', exL_an: 'Name the figure of speech',
    exL_al: 'Scan and give the patterns', exQ_sv: 'What kind of word is «{w}»?', exQ_pv: 'What kind of noun is «{w}»?', exQ_pr: 'Which is the right split of «{stem}»?',
    exQ_td_m: 'In line {adi}, tap the feet that alliterate (mōṉai) with the first foot «{w}».', exQ_td_e: 'In line {adi}, tap the feet that rhyme (etukai) with the first foot «{w}».', exQ_ec: 'What is the grammatical note for «{w}»?', exQ_find: 'Which word in this couplet is a {x}? Tap it.',
    exQ_tp: 'What are the class, gender, number and person of «{w}»?', exQ_vt: 'Which case does «{w}» carry?', exQ_srA: 'In «{s}», is each unit nēr or nirai?', exQ_srN: 'What is the pattern (vāypāṭu) of the foot «{s}»?',
    exQ_srF: 'The last foot «{s}» — what is its pattern?', exQ_th: 'Which taḷai links «{a}» and «{b}»?', exQ_tg: 'What kind of compound is «{w}»?', exQ_an: 'Simile, illustrative simile or metaphor — which of these is used in this couplet?',
    exQ_sl: 'What does «{w}» mean in this couplet?', exResT: 'Round result', exScore: '{a}/{b} right · {p}%', exVoidN: 'Not counted: {n}',
    exMoved: 'Moved up: {up} · to practise again: {dn}', exAgain: 'Another round', exHub: 'Exam practice home', exTermsT: 'Terms used in exam practice',
    exTermsNote: 'These definitions are drafts under review by the CICT teacher panel.', exOnKural: '📝 Exam practice on this couplet', gxT_ilakkanam: 'Grammatical note', gxT_category: 'Word class',
    gxT_vetrumai: 'Case', gxT_togai: 'Compounds', gxT_ani: 'Figures of speech', gxT_todar: 'Modifiers & repetition',
    gxOther: 'Other notes (not figures of speech / to be checked)', gxPractise: '📝 Practise this',
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
    malai: 'Tiruvalluvamalai', malaiSub: 'The 55 verses of tribute to the Kural and its poet, in the names of 53 poets — Avvaiyar, Kapilar, Paranar, Nakkirar, Idaikkadar and others', malaiToday: 'Tribute verse of the day', malaiPoet: 'poet', malaiGloss: 'Meaning', malaiAll: 'All verses', malaiFrom: 'From the Tiruvalluvamalai', malaiVerse: 'verse', malaiNote: 'A garland traditionally ascribed to the Sangam poets; the authorship and date are debated by scholars. 53 venba and 2 kural-form verses.', malaiDraft: "English gloss: an AI-assisted draft awaiting review by CICT scholars; report an error with ⚑. The Tamil பொழிப்புரை is from the published edition credited under each verse.", malaiSource: 'Text from public-domain editions (Project Madurai · Tamil Wikisource), cross-checked against each other; verses 1–20 keep the sandhi-joined spelling and 21–55 the word-split spelling of the source.',
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
  hi: {
    cards: "कार्ड",
    cardsSub: "साझा करने योग्य कुरल चित्र — किसी भी भाषा में",
    cardSource: "क्या साझा करें",
    cardToday: "आज का कुरल",
    cardPick: "कुरल संख्या",
    cardOcc: "अवसर",
    cardTheme: "डिज़ाइन",
    cardOlai: "ताड़",
    cardIravu: "रात",
    cardVizha: "उत्सव",
    cardSize: "आकार",
    cardSq: "वर्ग",
    cardSt: "स्टेटस",
    cardShow: "दिखाएँ",
    cardTranslit: "लिप्यंतरण",
    cardChapter: "अध्याय",
    cardQr: "QR + लिंक",
    cardLangs: "भाषाएँ (2 तक)",
    cardSave: "⬇ सेव",
    cardNext: "🎲 दूसरा कुरल",
    cardMade: "सेव हो गया",
    meanWeakLangs: "इन भाषाओं में अर्थ-खोज अभी कमज़ोर है — इनके लिए शब्द-खोज इस्तेमाल करें: {l}",
    meanWeakScript: "इस लिपि में अर्थ-खोज कमज़ोर है; 🔤 शब्द-खोज अधिक भरोसेमंद है।",
    meanTab: "💡 अर्थ",
    wordTab: "🔤 शब्द",
    meanPh: "कोई विचार अपने शब्दों में लिखिए — किसी भी भाषा में",
    meanIntro: "कुरल के शब्द न पता हों, तब भी वे कुरल खोजिए जो आपकी बात कहते हैं — 22 भाषाओं में से किसी में भी लिखिए। हर परिणाम के साथ वह व्याख्या या अनुवाद-पंक्ति दिखती है जिससे मेल हुआ।",
    meanDl: "📥 अर्थ-खोज डाउनलोड करें ({mb} MB)",
    meanDlNote: "सिर्फ़ एक बार — उसके बाद बिना इंटरनेट के चलता है। भाषा-मॉडल आपके ही डिवाइस पर चलता है; आप जो खोजते हैं वह कहीं नहीं भेजा जाता। Wi-Fi पर डाउनलोड करना बेहतर है।",
    meanDling: "डाउनलोड हो रहा है {p}% ({a}/{b} MB)",
    meanCheck: "जाँच हो रही है…",
    meanPrep: "अर्थ-मॉडल तैयार हो रहा है… (पहली बार कुछ सेकंड)",
    meanOffline: "डाउनलोड के लिए इंटरनेट चाहिए।",
    meanFail: "डाउनलोड पूरा नहीं हुआ: {e}। फिर से कोशिश करें।",
    meanErr: "अर्थ-खोज इस डिवाइस पर नहीं चल सकी: {e}",
    meanUnavail: "अर्थ-खोज वेब और Android संस्करण में उपलब्ध है (एकल-फ़ाइल संस्करण में नहीं)।",
    meanReady: "✓ डाउनलोड हो चुका · {mb} MB",
    meanRemove: "🗑 हटाएँ",
    meanUpdate: "अपडेट उपलब्ध ({mb} MB)",
    meanTry: "उदाहरण:",
    meanEx: "मुश्किल समय में साथ देने वाला मित्र|क्रोध पर काबू कैसे पाएँ|किसी के उपकार को न भूलना|a leader who listens to advice",
    meanNone: "कुछ नहीं मिला — दूसरे शब्दों में कोशिश करें।",
    meanHonest: "पूर्वावलोकन: अर्थ-खोज आपके प्रश्न के सबसे निकट के कुरल हमेशा दिखाती है — तब भी जब कुरल उस विषय पर कुछ नहीं कहता। इसलिए हर परिणाम के नीचे मेल खाने वाली पंक्ति पढ़कर स्वयं निर्णय करें। 170 परीक्षण-प्रश्नों में से 83% में उपयुक्त कुरल पहले दस में आया (कीवर्ड खोज: 46%)। CICT शिक्षक-मंडल की जाँच की प्रतीक्षा है।",
    meanVerse: "मूल",
    meanMv: "मु. व. व्याख्या",
    meanTac: "तमिल व्याख्या",
    meanEnP: "अंग्रेज़ी गद्य",
    meanWordsNone: "शब्द-खोज में कुछ नहीं मिला — 💡 अर्थ-खोज आज़माइए।",
    meanTime: "{n} कुरल · {ms} ms · आपके डिवाइस पर",
    exTitle: "परीक्षा अभ्यास",
    exSub: "व्याकरण · संधि · छंद · अलंकार",
    exCardSub: "व्याकरणिक टिप्पणी · शब्द-विच्छेद · छंद-विश्लेषण · अनुप्रास — सीधे कुरलों से",
    exOpen: "खोलें",
    exLevel: "स्तर",
    exPickLv: "आप किस स्तर से शुरू करना चाहेंगे?",
    exLv1: "स्तर 1",
    exLv2: "स्तर 2",
    exLv3: "स्तर 3",
    exLv0: "सभी · प्रतियोगिता / वयस्क",
    exLvHint: "मोटा अनुमान: स्तर 1 ≈ कक्षा 6–7 · स्तर 2 ≈ 8–9 · स्तर 3 ≈ 10–12. यह वर्गीकरण अस्थायी है, CICT शिक्षक-मंडल की स्वीकृति की प्रतीक्षा में है, और अभी किसी पाठ्यक्रम से मिलाया नहीं गया है।",
    exSrc: "किन कुरलों से?",
    exSrcMine: "जो मैंने पढ़े हैं",
    exSrcToday: "आज का पाठ",
    exSrcBook: "पूरा ग्रंथ",
    exSrcCh: "अध्याय",
    exSrcMemo: "कंठस्थ",
    exStart: "मिश्रित दौर शुरू करें",
    exResume: "जारी रखें · {i}/{n}",
    exMissBtn: "मेरी गलतियाँ दोबारा ({n})",
    exStats: "अभ्यास के दिन: {d} · उत्तर दिए: {q} · सही: {p}%",
    exTopics: "विषय",
    exGrpGram: "व्याकरण",
    exGrpWord: "शब्द",
    exGrpMetre: "छंद · अनुप्रास",
    exGrpAni: "अलंकार",
    exMastered: "सीखे गए {a}/{b}",
    exItems: "प्रश्न: {n}",
    exPractise: "अभ्यास करें",
    exFewData: "इस स्तर पर इसके लिए पर्याप्त विश्वसनीय प्रश्न नहीं हैं",
    exSl: "शब्दार्थ (अंग्रेज़ी)",
    exSlSub: "अर्थ केवल अंग्रेज़ी में हैं; डेटा में अभी तमिल अर्थ नहीं हैं।",
    exSlOpt: "वैकल्पिक",
    exKnown: "शब्द जिनका अंग्रेज़ी अर्थ आप जानते हैं: {n} / {t}",
    exHonestT: "ये प्रश्न कैसे बनाए गए हैं",
    exHonest1: "व्याकरणिक टिप्पणियाँ AI की सहायता से बना, दो बार जाँचा गया प्रारूप हैं। कम विश्वसनीयता वाले टैग और जिन शब्दों पर समीक्षक ने संदेह जताया, वे कभी प्रश्न नहीं बनते; समीक्षा में सुधारे गए शब्दों पर इसका संकेत दिखाया जाता है।",
    exHonest2: "छंद के प्रश्न नियम-आधारित छंद-विश्लेषण से बनते हैं; संदिग्ध सीर् (चरण-खंड) छोड़ दिए गए हैं।",
    exTextbook: "यदि आपकी पाठ्यपुस्तक का उत्तर अलग हो, तो पाठ्यपुस्तक का ही पालन करें, और ⚑ से हमें सूचित करें।",
    exConfLegend: "विश्वसनीयता: उच्च ≥ 0.90 · अच्छी 0.80–0.89 · मध्यम 0.70–0.79 (केवल “सभी” स्तर में) · अलंकारों का कोई अंक नहीं",
    exTermsLink: "📘 प्रयुक्त शब्दावली",
    exExplorer: "🔎 व्याकरण संग्रह",
    exNoSave: "इस डिवाइस में संग्रहण-स्थान नहीं बचा; अभ्यास की प्रगति शायद सहेजी न जाए।",
    exNoBank: "परीक्षा अभ्यास का डेटा खोला नहीं जा सका। कृपया ऑनलाइन होने पर फिर से प्रयास करें।",
    exExamLabel: "परीक्षा में प्रश्न का रूप: {x}",
    exEnough: "अभी के लिए इतना काफ़ी",
    exNext: "आगे →",
    exFinish: "परिणाम देखें →",
    exCheck: "जाँचें",
    exI_mcq: "सही उत्तर चुनिए।",
    exI_rows: "हर पंक्ति में एक चुनिए, फिर जाँचिए।",
    exI_pr: "वह उत्तर चुनिए जो जुड़े हुए शब्दों को सही ढंग से अलग करता है।",
    exI_al: "हर सीर् के लिए वाय्पाडु (छंद-रूप) चुनिए।",
    exWrong: "✗ यह नहीं — CICT टिप्पणी के अनुसार उत्तर है: {x}",
    exRowsVerdict: "{a}/{b} सही",
    exRowsHint: "पहले हर पंक्ति में एक चुनिए, फिर जाँचिए।",
    exYourPick: "आपका चयन",
    exL_vm: "व्याकरणिक टिप्पणी दीजिए",
    exQ_find2: "इस कुरल में वे दो शब्द छुइए जो {x} हैं।",
    exTgNote: "कारक-समास: यहाँ कारक-चिह्न छिपा है। कौन-सा कारक है, यह इस प्रश्न में नहीं पूछा गया है।",
    exAlVerdict: "✗ 7 में से {k} सीर् सही — पूरा छंद-विश्लेषण नीचे है।",
    exRowsWrong: "✗ सब सही नहीं — उत्तर है: {x}",
    exFindWrong: "✗ पूरी तरह सही नहीं — सही शब्द चिह्नित हैं।",
    exWrongRule: "✗ यह नहीं — नियम के अनुसार उत्तर है: {x}",
    exAnchor: "पहला सीर्",
    exDraft: "प्रारूप",
    exFewK: "यहाँ बहुत कम प्रश्न हैं",
    gxOtherVet: "जाँच होनी है",
    exPart: "◐ किसी ओर नहीं गिना गया — CICT टिप्पणी के अनुसार उत्तर है: {x}",
    exPartSuper: "«{p}» सही है, पर पूर्ण व्याकरणिक टिप्पणी «{x}» है।",
    exPartAlt: "CICT टिप्पणी इसे «{x}» मानती है। डेटा «{p}» और «{x}» के बीच की सीमा हमेशा एक ही तरह नहीं खींचता, इसलिए यह उत्तर गलत नहीं गिना गया।",
    exFindHint: "पहले कम से कम एक शब्द छुइए, फिर जाँचिए।",
    exCict: "CICT टिप्पणी",
    exConfHi: "उच्च विश्वसनीयता",
    exConfGood: "अच्छी विश्वसनीयता",
    exConfMid: "मध्यम विश्वसनीयता · प्रारूप",
    exConfParts: "अंशों की विश्वसनीयता (समास का अपना कोई अंक नहीं)",
    exConfNone: "विश्वसनीयता का अंक नहीं — विद्वानों की समीक्षा के अधीन",
    exMetreConf: "नियम-आधारित छंद-विश्लेषण · छंद विश्वसनीयता {c} · वेण्डळै नियम से जाँचा गया",
    exRhymeConf: "अक्षर-मिलान नियम से पाया गया",
    exDef: "परिभाषा · प्रारूप",
    exMore: "स्पष्टीकरण",
    exWord: "📚 शब्द-विवरण",
    exKural: "📖 कुरल {n}",
    exListen: "🔊 सुनिए",
    exReport: "⚑ यह उत्तर गलत लगे तो सूचित करें",
    exVoided: "यह प्रश्न इस डिवाइस पर फिर नहीं आएगा, और यह उत्तर गिना नहीं गया।",
    exVoidItem: "⚑ गिना नहीं गया",
    exCorrNote: "इस शब्द की टिप्पणी जाँच के दौरान सुधारी गई; “शब्द-विवरण” देखें।",
    exSkip: "यह प्रश्न अभी उपलब्ध नहीं है; आइए अगले पर चलें।",
    exBuilding: "⏳ प्रश्न तैयार हो रहे हैं…",
    exNoItems: "इस चयन से कोई प्रश्न नहीं बन सका। कृपया कोई दूसरा चुनिए।",
    exNotCached: "ये अध्याय अभी इस डिवाइस पर नहीं हैं। ऑनलाइन होने पर इन्हें खोलिए, या “ऑफ़लाइन” पृष्ठ पर पूरा ग्रंथ सहेज लीजिए।",
    exFallback: "आपके पढ़े कुरलों में पर्याप्त प्रश्न नहीं थे, इसलिए प्रश्न पूरे ग्रंथ से लिए गए हैं।",
    exShort: "इस चयन से उपलब्ध प्रश्न: {n}",
    exReplaced: "पिछले दौर के आपके उत्तर सहेज लिए गए।",
    exNeutralLegend: "धुंधले शब्द गिने नहीं जाते: उनकी टिप्पणियाँ अभी निश्चित नहीं हैं।",
    exNeutralRhyme: "धुंधले सीर् सीमांत मामले हैं (सजातीय अक्षर, भिन्न स्वर या मात्रा); इस अभ्यास में वे गिने नहीं जाते।",
    exOffTile: "(गिना नहीं गया)",
    exFindCount: "ढूँढने हैं: {k}",
    exFound: "✓ मिल गया",
    exMissed: "छूट गया",
    exNotThis: "यह नहीं",
    exRowThinai: "वर्ग (तिणै)",
    exRowPaal: "लिंग (पाल्)",
    exRowEN: "वचन",
    exRowIdam: "पुरुष",
    exAsaiSeg: "असै {i}: {s}",
    exNer: "नेर्",
    exNirai: "निरै",
    exAlProg: "सीर् {i}/7",
    exAlCols: "सीर्|असै|वाय्पाडु",
    exAlDone: "यह कुरल «{x}» वाय्पाडु (छंद-रूप) पर समाप्त होता है।",
    exPaa: "छंद: कुऱळ् वेण्बा",
    exSplitNote: "परीक्षा में विच्छेदित रूप लिखिए; सस्वर पाठ करते समय छपा हुआ रूप ही बोलिए।",
    exTail: "अंत का {c} इसलिए जुड़ा क्योंकि अगला शब्द «{nx}» कठोर व्यंजन से शुरू होता है (वल्लिनम् मिकुतल्); विच्छेद करते समय इसे छोड़ दीजिए।",
    exUrupu: "कारक-चिह्न: {u}",
    exVtNote: "कारक अपने चिह्न से पहचाना जाता है।",
    exTgNoNum: "डेटा में कारक की संख्या दर्ज नहीं है",
    exTgCase: "{x} कारक का कारक-समास",
    exTgPanbu: "गुण-समास: -मै प्रत्यय और योजक “आकिय / आऩ” दोनों लुप्त रहते हैं।",
    exAnNote: "अलंकार पर CICT टिप्पणी · प्रारूप",
    exAnMore: "यह वह अलंकार है जो डेटा में दर्ज है; कुरल में अन्य अलंकार भी हो सकते हैं।",
    exAnEka: "जब एक अंश को रूपक बनाया जाए और उसका संगत अंश सीधे, बिना रूपक के कहा जाए, तो वह एकतेच उरुवकम् (एकदेश रूपक) है; यदि आपकी पाठ्यपुस्तक ऐसा कहे, तो उसी का पालन कीजिए।",
    exPvSix: "वस्तु, स्थान, काल, अंग, गुण, क्रिया — छह प्रकार",
    exTpAgree: "उयर्तिणै → आण्पाल् / पेण्पाल् / पलर्पाल्; अःऱिणै → ओऩ्ऱऩ्पाल् / पलविऩ्पाल्",
    exR_asai: "नेर् = अकेला ह्रस्व या दीर्घ अक्षर (बाद के किसी व्यंजन सहित); निरै = दो ह्रस्व, या पहले ह्रस्व फिर दीर्घ (बाद के किसी व्यंजन सहित)।",
    exR_final: "ह्रस्व उ पर समाप्त होने वाला अंतिम सीर् एक असै गिना जाता है: नेर्पु → काचु, निरैपु → पिऱप्पु; नेर् → नाळ्, निरै → मलर्।",
    exR_th: "{asai} से पहले {a} ({cls}) → {x}",
    exR_tp: "प्रत्यय -{v} → {x}",
    exR_tpDem: "संकेतवाचक सर्वनाम {w} → {x}",
    exR_monai: "मोनै (आद्यानुप्रास): सीर् जिनके पहले अक्षर मेल खाते हैं (स्वर-समूह: अ आ ऐ औ · इ ई ऎ ए · उ ऊ ऒ ओ)।",
    exR_etukai: "एतुकै (द्वितीयाक्षर-अनुप्रास): पहले अक्षर समान मात्रा के हों और दूसरे अक्षर मेल खाएँ।",
    exAdiEtukai: "पंक्ति-आरंभ का अनुप्रास (अडि एतुकै): «{a}» – «{b}»",
    exThB: "(पंक्ति 1 का अंतिम सीर् और पंक्ति 2 का पहला सीर्)",
    exAdi1: "1",
    exAdi2: "2",
    exRpNote: "परीक्षा अभ्यास · {d} · «{w}» · ऐप का उत्तर: {x} · मेरा चयन: {y}",
    exT_sv: "शब्द-भेद",
    exT_pv: "संज्ञा के प्रकार",
    exT_pr: "शब्द-विच्छेद",
    exT_td: "अनुप्रास: मोनै · एतुकै",
    exT_ec: "कृदंत",
    exT_tp: "वर्ग · लिंग · वचन · पुरुष",
    exT_vt: "कारक",
    exT_sr: "सीर्: असै और वाय्पाडु",
    exT_th: "तळै (संयोजन)",
    exT_vm: "समापिका क्रियाएँ, कृदंतीय और क्रियार्थक संज्ञाएँ",
    exT_tg: "समास (तोगै)",
    exT_an: "अलंकार",
    exT_al: "छंद-विश्लेषण कर वाय्पाडु बताइए",
    exT_sl: "शब्दार्थ",
    exL_sv: "शब्द-भेद पहचानिए",
    exL_pv: "संज्ञा का प्रकार पहचानिए",
    exL_pr: "विच्छेद करके लिखिए",
    exL_td_m: "मोनै वाले शब्द छाँटिए",
    exL_td_e: "एतुकै वाले शब्द छाँटिए",
    exL_ec: "व्याकरणिक टिप्पणी दीजिए",
    exL_find: "छाँटकर लिखिए",
    exL_tp: "वर्ग, लिंग, वचन और पुरुष बताइए",
    exL_vt: "कारक-चिह्न ढूँढकर कारक का नाम बताइए",
    exL_sr: "छंद-विश्लेषण कीजिए",
    exL_th: "तळै (संयोजन) पहचानिए",
    exL_tg: "व्याकरणिक टिप्पणी दीजिए",
    exL_an: "अलंकार बताइए",
    exL_al: "छंद-विश्लेषण कर वाय्पाडु बताइए",
    exQ_sv: "«{w}» — यह किस प्रकार का शब्द है?",
    exQ_pv: "«{w}» — यह किस प्रकार की संज्ञा है?",
    exQ_pr: "«{stem}» — इसका सही विच्छेद कौन-सा है?",
    exQ_td_m: "पंक्ति {adi} में, पहले सीर् «{w}» के साथ मोनै (आद्यानुप्रास) बनाने वाले सीर् छुइए।",
    exQ_td_e: "पंक्ति {adi} में, पहले सीर् «{w}» के साथ एतुकै (द्वितीयाक्षर-अनुप्रास) बनाने वाले सीर् छुइए।",
    exQ_ec: "«{w}» — इसकी व्याकरणिक टिप्पणी क्या है?",
    exQ_find: "इस कुरल में {x} कौन-सा शब्द है? उसे छुइए।",
    exQ_tp: "«{w}» — इसके वर्ग, लिंग, वचन और पुरुष क्या हैं?",
    exQ_vt: "«{w}» — इसमें कौन-सा कारक (वेट्रुमै) है?",
    exQ_srA: "«{s}» में हर असै नेर् है या निरै?",
    exQ_srN: "सीर् «{s}» का वाय्पाडु (छंद-रूप) क्या है?",
    exQ_srF: "अंतिम सीर् «{s}» — इसका वाय्पाडु क्या है?",
    exQ_th: "«{a}» और «{b}» को कौन-सा तळै (संयोजन) जोड़ता है?",
    exQ_tg: "«{w}» — यह किस प्रकार का समास (तोगै) है?",
    exQ_an: "उपमा, दृष्टांत-उपमा या रूपक — इनमें से कौन-सा इस कुरल में प्रयुक्त है?",
    exQ_sl: "इस कुरल में «{w}» का क्या अर्थ है?",
    exResT: "दौर का परिणाम",
    exScore: "{a}/{b} सही · {p}%",
    exVoidN: "गिना नहीं गया: {n}",
    exMoved: "आगे बढ़े: {up} · फिर से अभ्यास: {dn}",
    exAgain: "एक और दौर",
    exHub: "परीक्षा अभ्यास मुखपृष्ठ",
    exTermsT: "परीक्षा अभ्यास की शब्दावली",
    exTermsNote: "ये परिभाषाएँ प्रारूप हैं; CICT शिक्षक समिति इनकी समीक्षा कर रही है।",
    exOnKural: "📝 इस कुरल पर परीक्षा अभ्यास",
    gxT_ilakkanam: "व्याकरणिक टिप्पणी",
    gxT_category: "शब्द-भेद",
    gxT_vetrumai: "कारक",
    gxT_togai: "समास",
    gxT_ani: "अलंकार",
    gxT_todar: "विशेषक और पुनरुक्ति",
    gxOther: "अन्य टिप्पणियाँ (अलंकार नहीं / जाँच बाकी)",
    gxPractise: "📝 इसका अभ्यास करें",
    lnTitle: "पाठ",
    lnName: "मार्गदर्शित पाठ",
    lnTag: "रोज़ 10 मिनट",
    lnIntro: "सुनिए, समझिए, बोलिए, फिर से जोड़िए",
    lnStartShort: "शुरू करें",
    lnBegin: "शुरू करें",
    lnFrGoal: "आप किसलिए सीख रहे हैं?",
    lnGoalM: "कंठस्थ करना और समझना",
    lnGoalC: "प्रतियोगिता की तैयारी",
    lnGoalU: "समझ लेना ही काफ़ी है",
    lnFrMl: "अर्थ किस भाषा में चाहिए?",
    lnFrTa: "क्या आप तमिल लिपि पढ़ सकते हैं?",
    lnTaYes: "हाँ",
    lnTaNo: "अभी सीखना जारी है",
    lnFrLater: "ये तीनों उत्तर आप बाद में \"मेरा तरीका\" में बदल सकते हैं।",
    lnMlTa: "तमिल · मु. व. व्याख्या (தமிழ்)",
    lnLabTa: "मु. वरदराजन की तमिल व्याख्या",
    lnLabEnProse: "अंग्रेज़ी में गद्य अर्थ",
    lnLabTac: "CICT तमिल व्याख्या",
    lnToday: "आज का पाठ",
    lnTodayStart: "पाठ शुरू करें",
    lnResume: "जारी रखें",
    lnDoneToday: "✓ आज का पाठ पूरा हुआ",
    lnAnother: "एक और पाठ करें",
    lnBuilding: "आज का पाठ तैयार हो रहा है…",
    lnRevShort: "पुनरावृत्ति पाठ",
    lnCapShort: "आज के लिए इतने नए कुरल काफ़ी; और कल",
    lnRevNow: "अभी पुनरावृत्ति करें",
    lnNothing: "अभी पुनरावृत्ति के लिए कुछ नहीं है।",
    lnStepOf: "चरण {i}/{n}",
    lnChShort: "अ.",
    lnNext: "जारी रखें",
    lnEnough: "आज के लिए इतना काफ़ी",
    lnSkipStep: "यह चरण छोड़ें",
    lnMore: "और",
    lnLess: "कम",
    lnRecapTitle: "फिर से स्वागत है!",
    lnRecapSub: "ये पिछली बार के कुरल हैं। जहाँ रुके थे, वहीं से आगे बढ़िए।",
    lnRevHead: "पुनरावृत्ति · पहले पढ़ा हुआ कुरल",
    lnLearnHead: "कुरल और उसका अर्थ",
    lnLearnHint: "पहले कुरल को एक बार पढ़िए या सुनिए।",
    lnShowMeaning: "अर्थ दिखाएँ",
    lnHear: "सुनें",
    lnNoAudio: "आवाज़ न आए तो पंक्तियाँ ज़ोर से पढ़िए।",
    lnMoreUrai: "विस्तृत व्याख्या",
    lnWordsOpen: "शब्द देखें",
    lnSplitNote: "विभाजित रूप केवल समझने के लिए है; पाठ छपे हुए रूप में ही कीजिए।",
    lnGlossEn: "शब्दार्थ केवल अंग्रेज़ी में हैं",
    lnWordsNone: "शब्दार्थ अभी उपलब्ध नहीं हैं।",
    lnWordsWhole: "इस कुरल में किसी शब्द को विभाजित करने की ज़रूरत नहीं है।",
    lnKnowIt: "यह कुरल मुझे पहले से आता है (इसका अभ्यास छोड़ें; पाठ में बाद में इसे जोड़कर देखें)",
    lnSayHead: "बोलकर देखिए",
    lnSay1: "सुनिए और साथ-साथ बोलिए",
    lnSay2: "दूसरी पंक्ति छिपाकर बोलिए",
    lnSay3: "बिना देखे बोलिए",
    lnSaidIt: "बोल लिया",
    lnHide: "छिपाएँ",
    lnShowLine: "दिखाएँ",
    lnWithBeat: "ताल के साथ सुनें",
    lnVoiceCheck: "आवाज़ से जाँचें",
    lnMeanQ: "इस कुरल का अर्थ क्या है?",
    lnWhichKural: "इस अर्थ वाला कुरल कौन-सा है?",
    lnRight: "✓ सही!",
    lnWrongMeaning: "✗ सही अर्थ ऊपर ✓ से चिह्नित है।",
    lnWrongKural: "✗ सही कुरल ऊपर ✓ से चिह्नित है।",
    lnWrongWord: "✗ सही उत्तर: {w}",
    lnFillSeer: "छूटे हुए सीर् क्रम से चुनिए",
    lnFillWord: "छूटे हुए शब्द क्रम से चुनिए",
    lnBuildHead: "कुरल को फिर से जोड़िए",
    lnBuildSeer: "सीर् सही क्रम में छुइए",
    lnBuildWord: "शब्द सही क्रम में छुइए",
    lnTileNo: "यह नहीं — फिर से कोशिश कीजिए।",
    lnTileHelp: "मदद",
    lnTileHelped: "आपने मदद से जोड़ा; कल फिर कोशिश कीजिए।",
    lnPrevOk: "{x} {i}: ✓ सही",
    lnPrevMiss: "{x} {i}: सही उत्तर — {w}",
    lnTileHelpedMsg: "मदद: सही {x} \"{w}\" रखा गया।",
    lnTileCount: "{a}/{b}",
    lnBuilt: "✓ कुरल जुड़ गया",
    lnStartsWith: "कुरल {n}, जो \"{w}…\" से शुरू होता है",
    lnIntroduced: "कुरल {n} का परिचय ✓ — यह कल की पुनरावृत्ति में आएगा।",
    lnIntroducedU: "कुरल {n} का परिचय ✓",
    lnNoted: "✓ दर्ज कर लिया",
    lnRecallHead: "याद से बोलिए",
    lnRecallHint: "कुरल ज़ोर से बोलिए, फिर जाँचिए।",
    lnShowKural: "कुरल दिखाएँ",
    lnRecallYes: "✓ बोल लिया",
    lnRecallMore: "और अभ्यास",
    lnChainHead: "शुरू से, क्रम में",
    lnChainHint: "इस अध्याय में पढ़े गए कुरल पहले से शुरू करके क्रम से ज़ोर से बोलिए। समय हो तो उन्हें कॉपी में लिखकर भी देखिए।",
    lnChainShow: "कुरल दिखाएँ",
    lnChainShown: "कुरल दिखाए गए हैं।",
    lnChainDone: "बोलकर देखा ✓",
    lnDoneSub: "आज परिचय: {n} · पुनरावृत्ति: {r}।",
    lnDoneTomorrow: "नए कुरल कल की पुनरावृत्ति में आएँगे।",
    lnWeakLink: "और अभ्यास: कुरल {n}",
    lnChDone: "अध्याय {c} · {name} — हर कुरल का परिचय हो गया।",
    lnChTest: "अध्याय परीक्षा देकर देखें",
    lnChTestNote: "दो दिन बाद देने से याद और पक्की होती है।",
    lnBackToLesson: "पाठ पर लौटें",
    lnChAllMet: "अध्याय {c} के सभी कुरलों का परिचय पहले ही हो चुका है; वे पुनरावृत्ति में आएँगे।",
    lnChDonePart: "अध्याय {c} · {name} — आपकी सूची के सभी {y} कुरलों का परिचय हो गया।",
    lnListFull: "सूची भरी हुई है; यह अध्याय जोड़ने के लिए \"मेरा तरीका\" में एक जगह खाली करें।",
    lnAfterCurrent: "अध्याय {c} मौजूदा पाठ पूरा होने के बाद शुरू होगा।",
    lnPathAlso: "सूची में ये भी हैं",
    lnNumDays: "पाठ के दिन",
    lnNumRun: "लगातार दिन",
    lnNumSeen: "पढ़े गए",
    lnNumFirm: "याद हुए",
    lnComeback: "फिर से स्वागत है! जहाँ रुके थे, वहीं से आगे बढ़िए।",
    lnMyWay: "मेरा तरीका",
    lnWayGoal: "लक्ष्य",
    lnWayPath: "क्या सीखें",
    lnWayPace: "हर पाठ में नए कुरल",
    lnWayLater: "बदलाव अगले पाठ से लागू होंगे।",
    lnPathBook: "ग्रंथ क्रम",
    lnPathMine: "मेरी सूची",
    lnPathSyl: "पाठ्यक्रम",
    lnInCh: "अध्याय संख्याएँ (जैसे 4, 8, 11, 40)",
    lnInNum: "कुरल संख्याएँ (जैसे 391-400, 43)",
    lnApplyList: "यह सूची अपनाएँ",
    lnBadTokens: "समझ नहीं आया: {x}",
    lnListEmpty: "अध्याय संख्याएँ या कुरल संख्याएँ लिखिए।",
    lnShareList: "यह सूची साझा करें",
    lnUseList: "क्या यह सूची इस्तेमाल करें?",
    lnUseYes: "इस्तेमाल करें",
    lnUseNo: "नहीं",
    lnContestDay: "प्रतियोगिता का दिन (वैकल्पिक)",
    lnContestToday: "प्रतियोगिता आज है। शुभकामनाएँ!",
    lnGoalLine: "प्रतियोगिता में शेष दिन: {N} · बाकी कुरल: {M}",
    lnGoalPace: "हर पाठ में {p} पढ़ने से समय पर पूरा हो जाएगा।",
    lnGoalMany: "आप एक दिन में एक से अधिक पाठ कर सकते हैं।",
    lnMapTitle: "पाठ्यक्रम मानचित्र",
    lnMapRow: "पढ़े {x}/{y} · याद {z}/{y}",
    lnMapRowU: "पढ़े {x}/{y}",
    lnMapNow: "अभी",
    lnMapStar: "★ परीक्षा",
    lnFromHere: "यहाँ से सीखें",
    lnMapRead: "पढ़ें",
    lnMapTest: "परीक्षा",
    lnRestart: "नए सिरे से शुरू करें",
    lnRestartArm: "पुष्टि के लिए फिर से टैप करें (आपकी कंठस्थ सूची और परीक्षा परिणाम बने रहेंगे)",
    lnNotCached: "यह अध्याय अभी इस डिवाइस पर नहीं है। ऑनलाइन होने पर इसे खोलिए।",
    lnCantOpen: "यह कुरल अभी नहीं खुल सकता।",
    lnPathDone: "यह पथ पूरा हुआ। शाबाश! अगला पथ चुनिए।",
    lnPathEmpty: "\"मेरा तरीका\" में चुनिए कि क्या सीखना है।",
    lnChLink: "पाठ के रूप में सीखें",
    lnNoSave: "प्रगति सहेजने की जगह नहीं है; पाठ जारी रहेगा।",
    test: "कंठस्थ परीक्षा",
    testShort: "परीक्षा",
    testRun: "परीक्षा",
    drillShort: "अभ्यास",
    boardShort: "अध्याय",
    testPage: "परीक्षा पृष्ठ",
    testSub: "विद्यालय की सस्वर पाठ प्रतियोगिता की तैयारी करें: छूटा सीर् भरें, अगली पंक्ति, अध्याय, कुरल संख्या, याद से लिखें; अंक, समय और प्रमाणपत्र के साथ",
    testRange: "दायरा",
    testLevel: "स्तर",
    lv1: "आसान",
    lv2: "सामान्य",
    lv3: "कठिन",
    lv1a: "आसान",
    lv2a: "सामान्य",
    lv3a: "कठिन",
    lv1h: "एक छूटा सीर् · अगली पंक्ति · अध्याय / कुरल संख्या — 10 प्रश्न",
    lv2h: "दो छूटे सीर् · अगली पंक्ति · अध्याय / कुरल संख्या — 10 प्रश्न",
    lv3h: "संख्या देखकर कुरल लिखें · दो सीर् · अध्याय / कुरल संख्या — 10 प्रश्न",
    testName: "नाम (प्रमाणपत्र के लिए)",
    testStart: "परीक्षा शुरू करें",
    testDrill: "सस्वर पाठ अभ्यास",
    testBoard: "अध्यायवार",
    testBoardSub: "सभी 133 अध्यायों में आपके सर्वश्रेष्ठ अंक; किसी अध्याय पर टैप करें तो वह परीक्षा पृष्ठ पर चुन लिया जाएगा",
    testWorksheet: "प्रश्नपत्र",
    testChapter: "अध्याय",
    testCustom: "कुरल संख्याएँ",
    rangeFrom: "पहला कुरल",
    rangeTo: "अंतिम कुरल",
    applyRange: "ये संख्याएँ लागू करें",
    testToday: "आज का अध्याय",
    testFirst100: "पहले 100 कुरल",
    testPassedN: "उत्तीर्ण",
    testAttempts: "प्रयास",
    testKurals: "कुरल",
    testSeed: "दौर संख्या",
    testSeedHelp: "पूरी कक्षा एक ही संख्या इस्तेमाल करे तो हर फ़ोन पर एक जैसा प्रश्नपत्र आएगा; खाली छोड़ें तो हर बार नए प्रश्न",
    seedRound: "दौर",
    qFill: "छूटा हुआ सीर् भरिए (சீர்)",
    qFill2: "दोनों छूटे सीर् भरिए",
    qFillW: "छूटा हुआ शब्द भरिए",
    qFill2W: "दोनों छूटे शब्द भरिए",
    wordOne: "शब्द",
    qNext: "अगली पंक्ति कौन-सी है?",
    qNum: "यह कौन-सा कुरल है?",
    qCh: "यह कुरल किस अध्याय में है?",
    qType: "यह कुरल याद से लिखिए",
    qTypePh: "दोनों पंक्तियाँ यहाँ लिखिए…",
    check: "जाँचें",
    nextQ: "आगे",
    finish: "समाप्त",
    skip: "पता नहीं",
    correct: "सही",
    wrong: "गलत",
    answerWas: "सही उत्तर",
    typedCanon: "मूल पाठ",
    typedYours: "आपने जो लिखा",
    wordsMatched: "शब्द मेल खाए",
    testResult: "परिणाम",
    testTime: "समय",
    testBest: "सर्वश्रेष्ठ",
    passedWord: "उत्तीर्ण",
    testPassed: "उत्तीर्ण 🎉 — प्रमाणपत्र उपलब्ध",
    testFailed: "प्रमाणपत्र के लिए 80% अंक चाहिए — आप फिर से कोशिश कर सकते हैं",
    retry: "फिर से",
    certMin: "प्रमाणपत्र के लिए कम से कम 10 कुरल का दायरा चाहिए",
    certificate: "प्रमाणपत्र",
    certs: "प्रमाणपत्र",
    certTitle: "कंठस्थ प्रमाणपत्र",
    certTitleMcq: "तिरुक्कुरल उपलब्धि प्रमाणपत्र",
    certNeedName: "प्रमाणपत्र के लिए नाम लिखिए",
    certGiven: "यह प्रमाणपत्र प्रदान किया जाता है",
    certBody: "तिरुक्कुरल कंठस्थ परीक्षा — {range} ({n} कुरल) — {level} स्तर पर {score}/{total} अंकों के साथ पूरी करने के लिए",
    certRef: "संदर्भ",
    certShare: "साझा करें / सहेजें",
    certZoom: "बड़ा करें",
    confirmName: "नाम की पुष्टि करें",
    certSign1: "परीक्षक / शिक्षक",
    certSign2: "संस्था प्रमुख",
    certFoot: "ऐप के स्वचालित मूल्यांकन द्वारा जारी · cictdl.github.io/index.html/kural-app",
    drillShow: "दिखाएँ",
    drillKnow: "मुझे आता है",
    drillForgot: "भूल गए",
    drillHint: "संकेत",
    drillDone: "अभ्यास पूरा हुआ",
    drillAgainNo: "भूले हुए फिर से",
    drillSub: "संख्या देखकर सुनाइए, फिर उत्तर देखिए; \"मुझे आता है\" चिह्नित कुरल आपकी कंठस्थ सूची में जुड़ जाते हैं",
    shareResult: "परिणाम साझा करें",
    selfCheckNote: "परीक्षा का मूल्यांकन अपने-आप होता है; अभ्यास में आप स्वयं आकलन करते हैं",
    testEmpty: "इस दायरे में कोई कुरल नहीं — अभ्यास में \"यह मुझे याद है\" या सस्वर पाठ अभ्यास में \"मुझे आता है\" चिह्नित कुरल यहाँ दिखते हैं",
    wsKey: "उत्तर कुंजी",
    wsName: "नाम",
    wsScore: "अंक",
    wsRegen: "नया प्रश्नपत्र",
    boardLegend: "हरा = उत्तीर्ण (80%+) · पीला = 50–79% · लाल = 50% से कम · ★ = कंठस्थ · — = अभी नहीं · किसी अध्याय पर टैप करें तो वह परीक्षा पृष्ठ पर चुन लिया जाएगा",
    'tab.home': "होम",
    'tab.read': "पढ़ें",
    'tab.search': "खोजें",
    'tab.practice': "अभ्यास",
    'tab.more': "और",
    'offline.banner': "ऑफ़लाइन — केवल सहेजे गए पृष्ठ",
    daily: "आज का कुरल",
    continue: "पढ़ना जारी रखें",
    random: "कोई भी कुरल",
    translations: "अनुवाद",
    prose: "सरल शब्दों में",
    grammar: "शब्दशः व्याकरण",
    metre: "छंद (யாப்பு)",
    recite: "सुनाएँ",
    stop: "रोकें",
    commentary: "व्याख्या सुनें",
    bookmark: "बुकमार्क",
    bookmarked: "बुकमार्क किया गया",
    share: "साझा करें",
    copy: "कॉपी",
    practice: "अभ्यास",
    tapword: "व्याकरणिक टिप्पणी के लिए किसी भी शब्द पर टैप करें",
    prev: "‹ पिछला",
    next: "अगला ›",
    kural: "कुरल",
    adhigaram: "अध्याय",
    pal: "भाग",
    iyal: "प्रकरण",
    search: "खोजें",
    searchPh: "किसी भी भाषा में खोजें — शब्द, संख्या, लिप्यंतरण…",
    noresults: "कोई परिणाम नहीं",
    results: "परिणाम",
    loadingIdx: "खोज अनुक्रमणिका लोड हो रही है…",
    allLangs: "सभी भाषाएँ",
    langs: "अनुवाद की भाषाएँ",
    chooseLangs: "दिखाई जाने वाली भाषाएँ चुनिए",
    scheduled: "आठवीं अनुसूची की भाषाएँ (22)",
    others: "अन्य",
    translit: "लिप्यंतरण (लैटिन)",
    showProse: "सरल व्याख्या दिखाएँ",
    fontSize: "अक्षर का आकार",
    theme: "थीम",
    auto: "स्वतः",
    light: "लाइट",
    dark: "डार्क",
    voice: "आवाज़",
    rate: "बोलने की गति",
    notify: "रोज़ एक कुरल की सूचना",
    notifyTime: "समय",
    notifyHelp: "ऐप इंस्टॉल होने पर (Add to Home Screen) यह बैकग्राउंड में आती है; वरना अगली बार ऐप खोलने पर दिखाई जाती है।",
    offline: "ऑफ़लाइन",
    dlText: "पूरी पुस्तक सहेजें (≈ 32 MB)",
    dlTts: "तमिल सस्वर पाठ ऑडियो पैक (≈ 30 MB)",
    dlBook: "ऑडियोबुक — 133 अध्याय (≈ 200 MB)",
    clear: "सहेजा डेटा मिटाएँ",
    storage: "संग्रहण",
    settings: "सेटिंग्स",
    about: "परिचय · आभार",
    bookmarks: "बुकमार्क",
    memorised: "कंठस्थ किए गए",
    grammarX: "व्याकरण अन्वेषक",
    noBookmarks: "अभी कोई बुकमार्क नहीं",
    words: "शब्द",
    tags: "टैग",
    listen: "सुनें",
    tap: "टैप",
    reciteCheck: "पाठ करें और जाँचें",
    memorise: "कंठस्थ करें",
    tempo: "गति (एक मात्रा)",
    withWords: "शब्दों के साथ",
    start: "शुरू करें",
    tapHint: "हर असै पर एक बार टैप कीजिए — नेर् (நேர்) एक मात्रा लंबा है, निरै (நிரை) उसका दुगुना।",
    tapBtn: "टैप (Space)",
    score: "अंक",
    again: "फिर से",
    reveal: "दिखाएँ",
    iKnow: "यह मुझे याद है",
    hideMore: "और छिपाएँ",
    srNo: "इस ब्राउज़र में वाक्-पहचान उपलब्ध नहीं है। Chrome/Edge (Android/Desktop) आज़माइए।",
    srStart: "पाठ शुरू करें",
    srListening: "सुन रहा है…",
    matched: "मेल खाते सीर्",
    noVoice: "इस डिवाइस पर इस भाषा की कोई आवाज़ इंस्टॉल नहीं है — सेटिंग्स में दूसरी आवाज़ चुनिए",
    playingClip: "चल रहा है…",
    proseNA: "इस भाषा में सरल व्याख्या अभी उपलब्ध नहीं है — अनुवाद देखिए।",
    aiNote: "सरल व्याख्या: AI की सहायता से बना प्रारूप, CICT की विद्वत् समीक्षा बाकी।",
    grNote: "व्याकरणिक टिप्पणियाँ AI की सहायता से बना, दो बार जाँचा गया प्रारूप हैं; विश्वसनीयता < 0.7 वाली प्रविष्टियाँ विद्वत् समीक्षा की प्रतीक्षा में हैं।",
    report: "त्रुटि की सूचना दें",
    reportHelp: "आपका मेल ऐप पहले से भरे संदेश के साथ खुलेगा; जब तक आप स्वयं न भेजें, कुछ नहीं भेजा जाएगा।",
    rpStream: "कौन-सा भाग",
    rpType: "त्रुटि का प्रकार",
    rpNote: "क्या गलत है?",
    rpFix: "सुझाया गया सुधार (वैकल्पिक)",
    rpEmail: "ईमेल से भेजें",
    rpShare: "शेयर करें",
    rpCopy: "रिपोर्ट कॉपी करें",
    rpOpened: "आपका मेल ऐप खुल रहा है…",
    rpReviewed: "पाठ सुधारने से पहले संस्थान में रिपोर्टों की जाँच होती है; सुधार परिचय पृष्ठ पर दर्ज होते हैं।",
    rpTa: "तमिल मूल",
    rpEnProse: "अंग्रेज़ी व्याख्या",
    rpOther: "अन्य",
    rpT_spelling: "वर्तनी या टाइपिंग त्रुटि",
    rpT_text: "गलत पंक्ति या शब्द",
    rpT_meaning: "अर्थ या अनुवाद",
    rpT_grammar: "व्याकरणिक टिप्पणी",
    rpT_metre: "छंद (याप्पु)",
    rpT_ms: "पांडुलिपि पाठ",
    rpT_credit: "श्रेय या संस्करण विवरण",
    rpT_other: "अन्य",
    corrections: "सुधार",
    reportIntro: "कोई त्रुटि मिली? उस कुरल के पृष्ठ पर ⚑ टैप कीजिए; रिपोर्ट ईमेल से संस्थान तक पहुँचेगी।",
    kattam: "कुरल वर्ग पहेली",
    kattamSub: "रोज़ एक तमिल वर्ग पहेली; हर उत्तर कुरल का एक शब्द है",
    kattamGo: "खेलें",
    occasions: "अवसर के लिए एक कुरल",
    occasionsSub: "विवाह, उद्घाटन, विदाई, श्रद्धांजलि, स्कूल सभा: मौके के अनुरूप कुरल, भाषण या निमंत्रण के लिए",
    occAll: "सभी अवसर",
    occSee: "और अवसर",
    occCurated: "केंद्रीय शास्त्रीय तमिल संस्थान द्वारा चयनित · यदि कोई दूसरा कुरल बेहतर लगे, तो उसके पृष्ठ पर ⚑ से बताइए",
    occShare: "टेक्स्ट के रूप में शेयर करें",
    occCard: "कार्ड",
    occOpen: "खोलें",
    verify: "उद्धरण जाँचें",
    malai: "तिरुवल्लुवमालै",
    malaiSub: "कुरल और उसके कवि की स्तुति में 55 पद — अव्वैयार, कपिलर, परणर, नक्कीरर, इडैक्काडर सहित 53 कवियों के नाम से",
    malaiToday: "आज का स्तुति-पद",
    malaiPoet: "कवि",
    malaiGloss: "अर्थ",
    malaiAll: "सभी पद",
    malaiFrom: "तिरुवल्लुवमालै से",
    malaiVerse: "पद",
    malaiNote: "परंपरा इसे संगम कवियों की रचना मानती है; रचयिता और काल पर विद्वानों में मतभेद है। 53 वेण्बा और 2 कुरल-छंद।",
    malaiDraft: "अंग्रेज़ी अर्थ: AI-सहायता से तैयार प्रारूप, CICT विद्वानों की समीक्षा प्रतीक्षित; त्रुटि हो तो ⚑ से सूचित करें। तमिल पॊऴिप्पुरै हर पद्य के नीचे दिए गए प्रकाशित संस्करण से है।",
    malaiSource: "पाठ: सार्वजनिक-डोमेन संस्करण (Project Madurai · तमिल विकिस्रोत), एक-दूसरे से मिलाए गए; पद 1–20 मूल की संधि-युक्त वर्तनी में और 21–55 शब्द-विभक्त वर्तनी में।",
    verifySub: "भाषण, अख़बार या पोस्टर से कुरल का उद्धरण पेस्ट कीजिए: ऐप मूल कुरल खोजकर हर भिन्न शब्द चिह्नित करता है",
    verifyPh: "कुरल पेस्ट कीजिए, तमिल में या किसी अनुवाद में…",
    verifyBtn: "जाँचें",
    verifyPaste: "पेस्ट",
    verifyQuoted: "उद्धृत रूप",
    verifyCanon: "मूल पाठ",
    verifyScore: "मेल",
    verifyExact: "उद्धरण बिल्कुल सही है ✓",
    verifyDiff: "शब्द भिन्न हैं",
    verifyNone: "कोई कुरल मेल नहीं खाया; केवल एक पंक्ति पेस्ट करके देखिए",
    verifyOthers: "अन्य संभावनाएँ",
    verifyCopy: "मूल पाठ कॉपी करें",
    verifyLegend: "लाल = उद्धरण में बदला हुआ या अतिरिक्त · हरा = उसमें छूटा हुआ",
    widgetTitle: "आपकी होम स्क्रीन पर आज का कुरल",
    widgetSub: "ऐप खोले बिना हर दिन एक नया कुरल, आपकी सूची के पहले अनुवाद के साथ",
    widgetAdd: "विजेट जोड़ें",
    widgetAsked: "होम स्क्रीन पर जोड़ने की पुष्टि कीजिए",
    widgetOn: "विजेट आपकी होम स्क्रीन पर है ✓",
    widgetHow: "होम स्क्रीन के खाली हिस्से को दबाकर रखें → विजेट → Tirukkural Multilingual",
    widgetOem: "कुछ फ़ोनों (Xiaomi, Oppo, Vivo, realme) पर विजेट रोज़ तभी बदलता है जब इस ऐप को ऑटोस्टार्ट की अनुमति हो और उस पर बैटरी-प्रतिबंध न हो",
    confidence: "विश्वसनीयता",
    audiobook: "ऑडियोबुक (पूरा अध्याय)",
    saveOffline: "सहेजें",
    saved: "सहेजा गया",
    installed: "इंस्टॉल हो गया ✓",
    install: "ऐप के रूप में इंस्टॉल करें",
    calendar: "कैलेंडर में जोड़ें (.ics)",
    kotd: "आज का कुरल",
    more: "और",
    stats: "आँकड़े",
    otherKurals: "इसी टैग वाले अन्य कुरल",
    seer: "सीर् (சீர்)",
    asai: "असै",
    thalai: "தளை",
    paa: "छंद",
    eetru: "अंतिम सीर्",
    etukai: "எதுகை",
    monai: "மோனை",
    reseg: "छंद-विश्लेषण के लिए सीर् फिर से विभाजित किए गए",
    legend: "நேர் = लाल · நிரை = नीला · हर सीर् के नीचे वाय्पाडु (छंद-रूप) का नाम",
    proseIs: "इस भाषा में CICT का अनुवाद स्वयं गद्य में है — वही सरल व्याख्या है",
    dlPack: "ऑडियो पैक",
    palmleaf: "ताड़पत्र साक्ष्य",
    scribal: "पांडुलिपि पाठ",
    viewArchive: "डिजिटल अभिलेखागार में खोलें",
    msNone: "इस कुरल के लिए अभी कोई ताड़पत्र छवि जुड़ी नहीं है (अध्याय 1–100 डिजिटाइज़ किए गए हैं)।",
    msOffline: "पत्र की छवि के लिए इंटरनेट चाहिए — पांडुलिपि पाठ नीचे है।",
    leafShow: "ताड़पत्र दिखाएँ",
    leafLoading: "🌿 ताड़पत्र लोड हो रहा है…",
    leafSlow: "अभिलेखागार ने समय पर उत्तर नहीं दिया।",
    leafFail: "ताड़पत्र की छवि लोड नहीं हो सकी।",
    parallel: "समानांतर पाठ",
    parallelHelp: "तमिल और एक अन्य भाषा, साथ-साथ",
    study: "अभ्यास",
    srsAdd: "अभ्यास में जोड़ें",
    srsIn: "आपके अभ्यास में",
    srsDue: "आज पुनरावृत्ति",
    srsEmpty: "आपकी अभ्यास सूची खाली है — किसी भी कुरल पर “अभ्यास में जोड़ें” टैप कीजिए।",
    srsDone: "आज के लिए कुछ बाकी नहीं 🎉",
    srsShow: "उत्तर दिखाएँ",
    hard: "कठिन",
    good: "ठीक",
    easy: "आसान",
    srsStats: "सीखे गए",
    shareCard: "छवि के रूप में शेयर करें",
    cardMaking: "कार्ड बन रहा है…",
    installIos: "iPhone/iPad: Safari में Share ⤴ टैप करें → “Add to Home Screen”",
    androidNote: "यह Android ऐप है — पूरी पुस्तक इसके भीतर है, इसलिए इंटरनेट की ज़रूरत नहीं। सस्वर पाठ डिवाइस के TextToSpeech इंजन से होता है (सबसे अच्छे परिणाम के लिए Android सेटिंग्स में तमिल आवाज़ इंस्टॉल करें)।",
    singleFileNote: "यह सिंगल-फ़ाइल संस्करण है — पूरी पुस्तक इसी एक HTML फ़ाइल में है, इसलिए कुछ डाउनलोड नहीं करना और इंटरनेट की ज़रूरत नहीं। ऑडियो आपके डिवाइस में इंस्टॉल आवाज़ों का उपयोग करता है।",
    autoScript: "मेरी लिपि से मिलाएँ",
    autoScriptHelp: "केवल उन भाषाओं में खोजता है जो आपकी टाइप की जा रही लिपि में लिखी जाती हैं",
    scanned: "सूचकांक",
    scannedHelp: "इस खोज में कितने भाषा-सूचकांक पढ़ने पड़े",
    searchAll: "सभी 30 भाषाओं में खोजें",
    compare: "सभी भाषाओं में",
    compareSub: "22 भाषाएँ · 30 अनुवाद",
    selected: "चयनित",
    playAll: "सब चलाएँ",
    lineErr: "इस पंक्ति का छंद-विश्लेषण नहीं हो सका",
    update: "नया संस्करण उपलब्ध है — रीफ़्रेश करें",
    ttsUnsupported: "इस ब्राउज़र में वाक्-ध्वनि उपलब्ध नहीं है",
    uiLang: "इंटरफ़ेस की भाषा"
  },
};
const t = k => (STR[S.ui] && STR[S.ui][k]) || STR.en[k] || k;
// Hindi for the tables that carry only Tamil and English (grammar option glosses, case names and meanings,
// the glossary, occasions). Looked up only when S.ui === 'hi'; anything missing falls back to English.
const HI = {"exn":{"cat:பெயர்":"संज्ञा","cat:வினை":"क्रिया","cat:இடை":"निपात","cat:உரி":"विशेषक शब्द","pv:பொருட்பெயர்":"वस्तुवाचक संज्ञा","pv:இடப்பெயர்":"स्थानवाचक संज्ञा","pv:காலப்பெயர்":"कालवाचक संज्ञा","pv:சினைப்பெயர்":"अंगवाचक संज्ञा","pv:பண்புப்பெயர்":"गुणवाचक संज्ञा","pv:தொழிற்பெயர்":"क्रियावाचक संज्ञा","ec:பெயரெச்சம்":"विशेषणात्मक कृदंत","ec:வினையெச்சம்":"क्रियाविशेषणात्मक कृदंत","ec:எதிர்மறைபெயரெச்சம்":"निषेधात्मक विशेषण कृदंत","ec:எதிர்மறைவினையெச்சம்":"निषेधात्मक क्रियाविशेषण कृदंत","vm:தெரிநிலைவினைமுற்று":"समापिका क्रिया (काल प्रकट)","vm:குறிப்புவினைமுற்று":"समापिका क्रिया (काल निहित)","vm:எதிர்மறைவினைமுற்று":"निषेधात्मक समापिका क्रिया","vm:வியங்கோள்வினைமுற்று":"आशीर्वादार्थक क्रिया","vm:வினையாலணையும்பெயர்":"कृदंतीय संज्ञा","vm:தொழிற்பெயர்":"क्रियार्थक संज्ञा","ti:உயர்திணை":"मानव वर्ग","ti:அஃறிணை":"मानवेतर वर्ग","pa:ஆண்பால்":"पुल्लिंग","pa:பெண்பால்":"स्त्रीलिंग","pa:பலர்பால்":"मानव बहुवचन","pa:ஒன்றன்பால்":"मानवेतर एकवचन","pa:பலவின்பால்":"मानवेतर बहुवचन","en:ஒருமை":"एकवचन","en:பன்மை":"बहुवचन","id:தன்மை":"उत्तम पुरुष","id:முன்னிலை":"मध्यम पुरुष","id:படர்க்கை":"अन्य पुरुष","vt:2":"कर्म कारक","vt:3":"करण कारक","vt:4":"सम्प्रदान कारक","vt:5":"अपादान कारक","vt:6":"सम्बन्ध कारक","vt:7":"अधिकरण कारक","tg:வேற்றுமைத்தொகை":"कारक समास","tg:வினைத்தொகை":"क्रिया समास","tg:பண்புத்தொகை":"गुण समास","tg:உவமைத்தொகை":"उपमा समास","tg:உம்மைத்தொகை":"द्वंद्व समास","tg:அன்மொழித்தொகை":"बहुव्रीहि समास","an:உவமை":"उपमा","an:எடுத்துக்காட்டுவமை":"दृष्टांत अलंकार","an:உருவகம்":"रूपक","vp:தேமா":"तेमा","vp:புளிமா":"पुळिमा","vp:கூவிளம்":"कूविळम्","vp:கருவிளம்":"करुविळम्","vp:தேமாங்காய்":"तेमांकाय्","vp:புளிமாங்காய்":"पुळिमांकाय्","vp:கூவிளங்காய்":"कूविळंकाय्","vp:கருவிளங்காய்":"करुविळंकाय्","fn:நாள்":"नाळ्","fn:மலர்":"मलर्","fn:காசு":"कासु","fn:பிறப்பு":"पिऱप्पु","th:இயற்சீர் வெண்டளை":"इयऱ्सीर् वेण्डळै","th:வெண்சீர் வெண்டளை":"वेण्सीर् वेण्डळै","th:நேரொன்றிய ஆசிரியத்தளை":"नेरोन्ऱिय आसिरियत्तळै","th:நிரையொன்றிய ஆசிரியத்தளை":"निरैयोन्ऱिय आसिरियत्तळै","th:கலித்தளை":"कलित्तळै"},"ord":{"1":"कर्ता कारक","2":"कर्म कारक","3":"करण कारक","4":"सम्प्रदान कारक","5":"अपादान कारक","6":"सम्बन्ध कारक","7":"अधिकरण कारक","8":"सम्बोधन कारक"},"vet":{"2":"कर्म","3":"साधन, कर्ता, साहचर्य","4":"दान, प्रयोजन","5":"अलगाव, तुलना, सीमा, कारण","6":"स्वामित्व","7":"स्थान"},"exdef":{"வேற்றுமைத்தொகை":"कारक समास: ऐसा समास जिसमें कारक-चिह्न लुप्त रहता है (उदा. தமிழ்கற்றான் (तमिऴ्कऱ्ऱान्) = தமிழைக் கற்றான் (तमिऴैक् कऱ्ऱान्), “उसने तमिल सीखी” — कर्म कारक)।","உவமை":"उपमा: जब किसी वस्तु की तुलना दूसरी वस्तु से போல (पोल), அன்ன (अन्न), அனைய (अनैय) या ஒப்ப (ओप्प) जैसे स्पष्ट तुलनावाचक शब्द के द्वारा की जाती है।","எடுத்துக்காட்டுவமை":"दृष्टांत अलंकार: उपमान और उपमेय दो अलग-अलग वाक्यों में कहे जाते हैं, और उनके बीच कोई तुलनावाचक शब्द नहीं होता।","உருவகம்":"रूपक: उपमेय और उपमान को एक कर दिया जाता है, जिससे उपमेय को ही उपमान के रूप में कहा जाता है।","பண்புத்தொகை":"गुण समास: गुणवाचक शब्द और उससे विशेषित संज्ञा के बीच का -மை (-मै) प्रत्यय और ஆகிய/ஆன (आगिय/आन) योजक लुप्त रहते हैं (उदा. செந்தாமரை (सेंदामरै) = செம்மையான தாமரை (सेम्मैयान तामरै), “लाल कमल”)।","வினையாலணையும்பெயர்":"कृदंतीय संज्ञा: समापिका क्रिया का वह रूप जो कर्ता के लिए संज्ञा बनकर आता है और कारक-चिह्न ग्रहण कर सकता है (उदा. “சென்றானைக் கண்டேன்” (सेन्ऱानैक् कण्डेन्) में சென்றானை (सेन्ऱानै), “मैंने जाने वाले को देखा”)।"},"gloss":{"பெயர்":"संज्ञा — वह शब्द जो किसी वस्तु, स्थान, काल, अंग, गुण या क्रिया का नाम बताए।","வினை":"क्रिया — वह शब्द जो काल सहित किसी कार्य को व्यक्त करे।","இடை":"निपात (इडैच्चोल्) — स्वतंत्र अर्थ से रहित शब्द; यह संज्ञा या क्रिया से जुड़ता है।","உரி":"विशेषक शब्द (उरिच्चोल्) — संज्ञा या क्रिया को विशेषित करता है, गुण या तीव्रता दर्शाता है।","பொருட்பெயர்":"वस्तुवाचक संज्ञा — किसी वस्तु या पदार्थ का नाम (उदा. पेड़, सोना)।","இடப்பெயர்":"स्थानवाचक संज्ञा — किसी स्थान का नाम (उदा. संसार, देश)।","காலப்பெயர்":"कालवाचक संज्ञा — किसी समय या अवधि का नाम (उदा. दिन, ऋतु)।","சினைப்பெயர்":"अंगवाचक संज्ञा — किसी पूर्ण वस्तु के अंग या अवयव का नाम (उदा. हाथ, पत्ता)।","பண்புப்பெயர்":"गुणवाचक संज्ञा — किसी गुण या विशेषता का नाम (उदा. सफ़ेदी, मिठास)।","தொழிற்பெயர்":"क्रियार्थक संज्ञा — क्रिया से बनी संज्ञा जो कार्य का नाम बताए (उदा. चलना, सीखना)।","எண்ணுப்பெயர்":"संख्यावाचक संज्ञा — किसी संख्या का नाम (उदा. एक, दस)।","சுட்டுப்பெயர்":"संकेतवाचक सर्वनाम — संकेत-मूल के द्वारा किसी की ओर इशारा करता है (उदा. वह, यह, वो)।","வினாப்பெயர்":"प्रश्नवाचक सर्वनाम — प्रश्न पूछने वाला संज्ञा-शब्द (उदा. कौन, कौन-सा, क्या)।","சிறப்புப்பெயர்":"व्यक्तिवाचक संज्ञा — किसी एक विशेष व्यक्ति या वस्तु का नाम (उदा. वळ्ळुवन्)।","காரணப்பெயர்":"कारणवाचक संज्ञा — ऐसा नाम जो नामित वस्तु के किसी कारण या गुण पर आधारित हो।","வினையாலணையும்பெயர்":"कृदंतीय संज्ञा — समापिका क्रिया का रूप जो कर्ता/वस्तु के लिए संज्ञा बनकर आए (उदा. ‘जो गया’, ‘जो जीते हैं’)।","தெரிநிலைவினைமுற்று":"समापिका क्रिया (प्रकट) — पूर्ण क्रिया जिसका काल स्पष्ट व्यक्त हो (उदा. वह गया, वह करेगा)।","குறிப்புவினைமுற்று":"निहित समापिका क्रिया — पूर्ण क्रिया जिसका काल अव्यक्त हो और गुण के माध्यम से प्रकट हो (उदा. ‘वह अच्छा है’)।","ஏவல்வினைமுற்று":"आज्ञार्थक क्रिया — आदेश या अनुरोध व्यक्त करती है (उदा. करो!, सुनो!)।","வியங்கோள்வினைமுற்று":"आशीर्वादार्थक क्रिया — इच्छा, आशीर्वाद या विधान व्यक्त करती है, सभी कालों में समान (उदा. चिरंजीवी हो!, ऐसा किया जाए!)।","எதிர்மறைவினைமுற்று":"निषेधात्मक समापिका क्रिया — बताती है कि कार्य नहीं होता या नहीं हुआ (उदा. वह नहीं करता)।","வினையெச்சம்":"क्रियाविशेषणात्मक कृदंत — अपूर्ण क्रिया-रूप जो मुख्य क्रिया की अपेक्षा रखता है (उदा. जाकर, करते हुए)।","பெயரெச்சம்":"विशेषणात्मक कृदंत — क्रिया-रूप जो आगे आने वाली संज्ञा को विशेषित करता है (उदा. जो गया, जो करेगा)।","எதிர்மறைவினையெச்சம்":"निषेधात्मक क्रियाविशेषण कृदंत — निषेध अर्थ में क्रियाविशेषणात्मक कृदंत (उदा. किए बिना)।","எதிர்மறைபெயரெச்சம்":"निषेधात्मक विशेषण कृदंत — निषेध अर्थ में विशेषणात्मक कृदंत (उदा. जो नहीं करता)।","வேற்றுமைஉருபு":"कारक-चिह्न — संज्ञा से जुड़कर उसका कारक दर्शाने वाला प्रत्यय (ऐ, आल्, कु, इन्, अदु, कण्)।","சாரியை":"आगम/योजक निपात — संधि में शब्दों के बीच जोड़ा गया अर्थहीन योजक (अत्तु, इन्, अन्)।","அசைநிலை":"पूरक निपात — छंद-पूर्ति के लिए आने वाला अर्थहीन निपात (उदा. मन्, तिल्)।","உம்மை":"‘उम्’ निपात — समावेश (‘भी’), समग्रता या बल व्यक्त करता है।","ஏகாரம்":"‘ए’ निपात — निश्चय, अपवर्जन (‘ही’) या प्रश्न सूचित करता है।","ஓகாரம்":"‘ओ’ निपात — प्रश्न, संदेह या विलाप सूचित करता है।","வினாஇடை":"प्रश्नवाचक निपात — प्रश्न का संकेत देता है (आ, ए, ओ, कोल्)।","எதிர்மறைஇடை":"निषेधवाचक निपात — निषेध व्यक्त करता है (अन्ऱु, इल्, अल्)।","பிரிநிலைஇடை":"पृथक्करण निपात — किसी एक को अन्य से अलग करके बताता है (ए, मन्)।","உவமைஉருபு":"उपमा-वाचक शब्द — तुलना का संकेत देने वाला निपात (जैसे, समान — पोल्, अन्न)।","உரிச்சொல்":"विशेषक शब्द (उरिच्चोल्) — अविकारी शब्द जो संज्ञा/क्रिया को विशेषित करता है, प्रायः तीव्रता दर्शाता है (उदा. बहुत, अत्यधिक)।","உவமை":"उपमा — एक वस्तु की दूसरी से स्पष्ट तुलना।","உருவகம்":"रूपक — तुलनावाचक शब्द के बिना एक वस्तु को सीधे दूसरी वस्तु कह देना।","எடுத்துக்காட்டுவமை":"दृष्टांत अलंकार — किसी समानांतर प्रसंग या उदाहरण द्वारा विचार को स्पष्ट करना।","பிறிதுமொழிதல்":"अन्योक्ति — किसी और वस्तु की बात करके अभीष्ट अर्थ व्यंजित करना।","முரண்":"विरोध अलंकार — विपरीत अर्थ वाले शब्दों या विचारों को साथ-साथ रखना।","சொற்பொருட்பின்வருநிலை":"शब्दार्थ-आवृत्ति — भाव को दृढ़ करने के लिए शब्द या अर्थ की पुनरावृत्ति।","மடக்கு":"यमक / श्लेष — एक ही शब्द भिन्न-भिन्न अर्थों में बार-बार आता है।","உயர்வுநவிற்சி":"अतिशयोक्ति — यथार्थ से परे जानबूझकर बढ़ा-चढ़ाकर कहना।","வஞ்சப்புகழ்ச்சி":"व्याजस्तुति — प्रशंसा के रूप में निंदा, या इसका उलटा।","இயைபு":"इयैपु — अंत्यानुप्रास, जिसमें क्रमागत पंक्तियाँ एक ही ध्वनि या शब्द पर समाप्त होती हैं।","ஒலிநயம்":"ध्वनि-माधुर्य — शब्द-चयन से उत्पन्न मधुर ध्वनि-प्रभाव।","இயைபு/ஒலிநயம்":"अंत्यानुप्रास और ध्वनि-माधुर्य साथ-साथ — अंतिम ध्वनि-सामंजस्य के साथ समग्र ध्वनि-सौंदर्य।","தீவகம்":"दीपक अलंकार — एक ही शब्द अनेक वाक्यांशों में समान रूप से अन्वित होता है।","வினா":"काकु-प्रश्न — उत्तर के लिए नहीं, प्रभाव के लिए पूछा गया प्रश्न।","வினாஅணி":"प्रश्न अलंकार — अलंकार के रूप में प्रयुक्त काकु-प्रश्न।","வினா-விடை":"प्रश्नोत्तर अलंकार — प्रश्न और उसका उत्तर साथ-साथ रखे जाते हैं।","ஐயவணி":"संदेह अलंकार — दो समानताओं के बीच अनिश्चितता व्यक्त करता है।","தற்குறிப்பேற்றம்":"हेतूत्प्रेक्षा (मानवीकरण) — किसी प्राकृतिक घटना पर मानवीय प्रयोजन का आरोप।","வேற்றுமைத்தொகை":"कारक समास — ऐसा समास जिसमें कारक-चिह्न लुप्त हो (उदा. ‘फूल-पर’ = ‘फूल के ऊपर’)।","வினைத்தொகை":"क्रिया समास — ऐसा समास जिसकी क्रिया अपना काल छिपाए रखती है (भूत, वर्तमान, भविष्य में समान)।","பண்புத்தொகை":"गुण समास — विशेषण और संज्ञा का मेल (उदा. ‘लाल-सोना’ = ‘लाल सोना’)।","உவமைத்தொகை":"उपमा समास — तुलनावाचक शब्द लुप्त हो (उदा. ‘फूल-आँख’ = ‘फूल जैसी आँखें’)।","உம்மைத்தொகை":"‘उम्’ समास — द्वंद्व समास जिसमें ‘उम्’ (और) लुप्त हो (उदा. ‘रात-दिन’ = ‘रात और दिन’)।","அன்மொழித்தொகை":"बहुव्रीहि समास — समास अपने घटकों से परे किसी अन्य का बोध कराता है (उदा. ‘स्वर्ण-कंगन’ = ‘उसे पहनने वाली स्त्री’)।","அடுக்குத்தொடர்":"पुनरुक्ति — आतुरता, तीव्रता या भावावेग दर्शाने के लिए शब्द की आवृत्ति।","எழுவாய்":"कर्ता कारक (पहला कारक) — कार्य का कर्ता; कोई चिह्न नहीं लगता।","செயப்படுபொருள்":"कर्म कारक (दूसरा कारक) — जिस पर क्रिया का प्रभाव पड़े (चिह्न: ऐ)।","கருவி/உடன்":"करण/साहचर्य (तीसरा कारक) — साधन या साथ (चिह्न: आल्, ओडु)।","கொடை/நோக்கம்":"सम्प्रदान कारक (चौथा कारक) — पाने वाला या प्रयोजन (चिह्न: कु)।","நீங்கல்/ஒப்பு":"अपादान कारक (पाँचवाँ कारक) — किसी से अलगाव या तुलना (चिह्न: इन्, इल्)।","உடைமை":"सम्बन्ध कारक (छठा कारक) — स्वामित्व या सम्बन्ध (चिह्न: अदु, अ)।","இடம்":"अधिकरण कारक (सातवाँ कारक) — स्थान या समय (चिह्न: कण्, इल्, मिसै)।","விளி":"सम्बोधन कारक (आठवाँ कारक) — पुकारने या संबोधित करने का कारक।","கருவி":"करण — तीसरे कारक का ‘साधन’ अर्थ (चिह्न: आल्, आन्)।","உடன்":"साहचर्य — तीसरे कारक का ‘साथ’ अर्थ (चिह्न: ओडु)।","ஒப்பு":"तुलनात्मक — पाँचवें कारक का ‘तुलना’ अर्थ (चिह्न: इन्)।"},"occ":{"valluvar":{"name":"तिरुवल्लुवर दिवस, कुरल की स्तुति","note":"विद्या और ज्ञान पर कुरल, और कुरल की स्तुति करने वाले प्राचीन पद"},"wedding":{"name":"विवाह","note":"दाम्पत्य जीवन की मधुरता और जीवनसाथी का महत्व"},"housewarming":{"name":"गृहप्रवेश","note":"घर-गृहस्थी, अतिथि-सत्कार, गृहस्थ के पाँच कर्तव्य"},"child":{"name":"शिशु जन्म, नामकरण","note":"संतान का सौभाग्य"},"birthday":{"name":"जन्मदिन की शुभकामनाएँ","note":"यश और विनम्रता के साथ दीर्घायु हों"},"parents":{"name":"माता-पिता","note":"पिता, माता, संतान, प्रेम"},"condolence":{"name":"शोक-संवेदना","note":"नश्वरता, और स्थायी रहने वाला यश"},"consolation":{"name":"संकट में सांत्वना","note":"विपत्ति में अडिग रहना"},"inauguration":{"name":"उद्घाटन, नया उपक्रम","note":"सोचकर साहस करें; प्रयत्न ही सौभाग्य बनाता है"},"booklaunch":{"name":"पुस्तक विमोचन","note":"विद्या, श्रवण, सुचिंतित वाणी"},"farewell":{"name":"विदाई, सेवानिवृत्ति","note":"मित्रता, और स्थायी यश"},"welcome":{"name":"स्वागत, अतिथि","note":"अतिथि-सत्कार और मधुर वचन"},"thanks":{"name":"धन्यवाद ज्ञापन","note":"कृतज्ञता"},"national":{"name":"राष्ट्रीय दिवस","note":"देश, और अपने लोगों की सेवा"},"harvest":{"name":"पोंगल, किसान","note":"खेती, और वर्षा का वरदान"},"environment":{"name":"पर्यावरण, वर्षा, जल","note":"वर्षा की महिमा"},"school":{"name":"विद्यालय सभा, विद्यार्थी","note":"विद्या"},"teachers":{"name":"शिक्षक दिवस","note":"श्रवण, ज्ञान, विद्वज्जन"},"research":{"name":"सम्मेलन, शोध","note":"वस्तुओं का सत्य देखना"},"sports":{"name":"खेल, प्रतियोगिताएँ","note":"प्रयत्न, दृढ़ता, मन की अटलता"},"leadership":{"name":"पदभार ग्रहण, नेतृत्व","note":"श्रेष्ठ शासक, न्यायपूर्ण शासन"},"speaking":{"name":"सार्वजनिक भाषण","note":"वाक्पटुता, और सार्थक वचन"},"health":{"name":"स्वास्थ्य, अस्पताल","note":"औषधि"},"charity":{"name":"दान, सेवा, अनुदान","note":"दान"},"business":{"name":"व्यापार, धन, बचत","note":"धर्मपूर्वक धन अर्जन, सामर्थ्य के भीतर व्यय"},"friendship":{"name":"मित्रता","note":"मित्रता"}},"occGroup":{"life":"जीवन के अवसर","events":"समारोह और सभाएँ","public":"विद्यालय, कार्य और सार्वजनिक जीवन"}};
HI.nm = {"அங்கவியல்":"राज्य के अंग","அடக்கம் உடைமை":"संयम","அன்புடைமை":"प्रेम","அமைச்சியல்":"मंत्री-धर्म","அமைச்சு":"मंत्री","அரசியல்":"राजनीति","அரண்":"दुर्ग","அருளுடைமை":"करुणा","அறத்துப்பால்":"धर्म-भाग","அறன் வலியுறுத்தல்":"धर्म की प्रबलता","அறிவுடைமை":"बुद्धिमत्ता","அலர் அறிவுறுத்தல்":"लोकनिंदा की चर्चा","அழுக்காறாமை":"ईर्ष्या-त्याग","அவர்வயின் விதும்பல்":"प्रिय-मिलन की उत्कंठा","அவா அறுத்தல்":"तृष्णा-नाश","அவை அஞ்சாமை":"सभा में निर्भयता","அவை அறிதல்":"सभा-ज्ञान","ஆள்வினை உடைமை":"पुरुषार्थ","இகல்":"वैर-भाव","இடனறிதல்":"स्थान-ज्ञान","இடுக்கண் அழியாமை":"संकट में धैर्य","இனியவை கூறல்":"मधुर वचन","இன்னா செய்யாமை":"अपकार न करना","இரவச்சம்":"याचना का भय","இரவு":"याचना","இறைமாட்சி":"राजा की महिमा","இல்லறவியல்":"गृहस्थ धर्म","இல்வாழ்க்கை":"गृहस्थ जीवन","ஈகை":"दान","உட்பகை":"भीतरी शत्रु","உறுப்புநலன் அழிதல்":"अंगों का क्षीण होना","உழவு":"कृषि","ஊக்கம் உடைமை":"उत्साह","ஊடலுவகை":"रूठने का आनंद","ஊழியல்":"नियति","ஊழ்":"भाग्य","ஒப்புரவறிதல்":"लोकोपकार","ஒற்றாடல்":"गुप्तचर","ஒழிபியல்":"विविध","ஒழுக்கம் உடைமை":"सदाचार","கடவுள் வாழ்த்து":"ईश्वर-स्तुति","கண் விதுப்பழிதல்":"आँखों की व्याकुलता","கண்ணோட்டம்":"दया-दृष्टि","கனவுநிலை உரைத்தல்":"स्वप्न-वर्णन","கயமை":"नीचता","கற்பியல்":"दांपत्य प्रेम","கல்லாமை":"अविद्या","கல்வி":"विद्या","களவியல்":"पूर्वराग","கள்ளாமை":"अचौर्य","கள்ளுண்ணாமை":"मद्य-त्याग","காதற் சிறப்புரைத்தல்":"प्रेम की महिमा","காமத்துப்பால்":"काम-भाग","காலமறிதல்":"समय-ज्ञान","குடிசெயல் வகை":"कुल-उन्नति","குடிமை":"कुलीनता","குறிப்பறிதல்":"संकेत पहचानना","குறிப்பறிவுறுத்தல்":"संकेत जताना","குற்றங்கடிதல்":"दोष-निवारण","கூடா ஒழுக்கம்":"पाखंड","கூடா நட்பு":"कपट-मित्रता","கேள்வி":"श्रवण","கொடுங்கோன்மை":"अत्याचारी शासन","கொல்லாமை":"अहिंसा","சான்றாண்மை":"सज्जनता","சிற்றினம் சேராமை":"कुसंग-त्याग","சுற்றந் தழால்":"बंधु-पोषण","சூது":"जुआ","செங்கோன்மை":"न्यायपूर्ण शासन","செய்ந்நன்றியறிதல்":"कृतज्ञता","சொல்வன்மை":"वाक्-पटुता","தகை அணங்குறுத்தல்":"सौंदर्य का आघात","தனிப்படர் மிகுதி":"एकाकी वेदना","தவம்":"तप","தீ நட்பு":"बुरी मित्रता","தீவினையச்சம்":"पाप-भय","துறவறவியல்":"संन्यास धर्म","துறவு":"त्याग","தூது":"दूत","தெரிந்து செயல்வகை":"विचारपूर्वक कर्म","தெரிந்து தெளிதல்":"परखकर विश्वास","தெரிந்து வினையாடல்":"परखकर नियुक्ति","நடுவு நிலைமை":"निष्पक्षता","நட்பாராய்தல்":"मित्र की परख","நட்பு":"मित्रता","நன்றியில் செல்வம்":"निष्फल धन","நலம் புனைந்து உரைத்தல்":"सौंदर्य-वर्णन","நல்குரவு":"दरिद्रता","நாடு":"देश","நாணுடைமை":"लज्जाशीलता","நாணுத் துறவுரைத்தல்":"लज्जा-त्याग","நினைந்தவர் புலம்பல்":"स्मृति-विलाप","நிறையழிதல்":"संयम का टूटना","நிலையாமை":"अनित्यता","நீத்தார் பெருமை":"संन्यासियों की महिमा","நெஞ்சொடு கிளத்தல்":"मन से संवाद","நெஞ்சொடு புலத்தல்":"मन से रूठना","பகை மாட்சி":"शत्रुता की महिमा","பகைத்திறம் தெரிதல்":"शत्रु की परख","பசப்புறு பருவரல்":"विरह का पीलापन","படர்மெலிந் திரங்கல்":"विरह-विलाप","படை மாட்சி":"सेना की महिमा","படைச் செருக்கு":"सैनिक शौर्य","பண்புடைமை":"शिष्टता","பயனில சொல்லாமை":"व्यर्थ वचन-त्याग","பழைமை":"पुरानी मित्रता","பாயிரவியல்":"भूमिका","பிரிவு ஆற்றாமை":"असह्य वियोग","பிறனில் விழையாமை":"परस्त्री-विमुखता","புகழ்":"यश","புணர்ச்சி மகிழ்தல்":"मिलन का आनंद","புணர்ச்சி விதும்பல்":"मिलन की आतुरता","புறங்கூறாமை":"चुगली न करना","புலவி":"रूठना","புலவி நுணுக்கம்":"रूठने की सूक्ष्मता","புலால் மறுத்தல்":"मांस-त्याग","புல்லறிவாண்மை":"अल्पबुद्धि","பெண்வழிச் சேறல்":"स्त्री-वशता","பெரியாரைத் துணைக்கோடல்":"महापुरुषों का साथ","பெரியாரைப் பிழையாமை":"महापुरुषों का अनादर न करना","பெருமை":"बड़प्पन","பேதைமை":"मूर्खता","பொச்சாவாமை":"अप्रमाद","பொருட்பால்":"अर्थ-भाग","பொருள் செயல்வகை":"धनार्जन-विधि","பொறையுடைமை":"क्षमाशीलता","பொழுதுகண்டு இரங்கல்":"संध्या-विलाप","மக்கட்பேறு":"संतान-लाभ","மடி இன்மை":"आलस्य-त्याग","மன்னரைச் சேர்ந்து ஒழுகல்":"राजा के साथ आचरण","மருந்து":"औषधि","மானம்":"मान","மெய்யுணர்தல்":"तत्त्व-ज्ञान","வரைவின் மகளிர்":"वेश्याएँ","வலியறிதல்":"शक्ति-ज्ञान","வான்சிறப்பு":"वर्षा की महिमा","வாய்மை":"सत्य","வாழ்க்கைத் துணைநலம்":"जीवनसंगिनी का गुण","வினை செயல்வகை":"कर्म-विधि","வினைத் தூய்மை":"कर्म की शुद्धता","வினைத்திட்பம்":"कर्म में दृढ़ता","விருந்தோம்பல்":"अतिथि-सत्कार","வெஃகாமை":"लोभ-त्याग","வெகுளாமை":"क्रोध-त्याग","வெருவந்த செய்யாமை":"भय न फैलाना"};   // பால் / இயல் / அதிகாரம் names, keyed by the Tamil name
const enN = (ta, en) => (S.ui === 'hi' && HI.nm[ta]) || en;   // the second name shown after a Tamil title: Hindi in the Hindi interface, else English
const hiGloss = x => HI.gloss[x] || HI.gloss[String(x).replace(/^\d · /, '')] || '';

// ───────────────────────────── settings ─────────────────────────────
const DEFAULTS = {
  ui: 'ta', langs: ['en', 'hi'], showTranslit: true, showProse: true, fontScale: 1, theme: 'auto', notify: false,
  notifyTime: '07:00', voices: {}, rate: 1, bookmarks: [], memorised: [], lastKural: 1, proseTab: 'ta_mv',
  tempo: 320, lastNotified: '', srs: {}, parallelLang: '', srsNew: 5, test: {}, testName: '', testLevel: 2, testSpec: '', testSeed: '', learn: null, ex: null,
};
let S = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem('kural.settings') || '{}'));
if (S.learn) S.learn = Object.assign(learnDef(), S.learn);
if (S.ex) S.ex = exNorm(S.ex);
// சாலமன் பாப்பையா / மு. கருணாநிதி are no longer carried; move those readers to மு. வரதராசனார்.
if (['ta_sp', 'ta_mk'].includes(S.proseTab)) S.proseTab = 'ta_mv';
function saveS() { localStorage.setItem('kural.settings', JSON.stringify(S)); applyPrefs(); pushPrefsToSW(); pushWidgetPrefs(); }
function applyPrefs() {
  document.documentElement.style.setProperty('--fs', (S.fontScale || 1) + 'rem');
  if (S.theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', S.theme);
  document.documentElement.lang = S.ui;
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $('#btn-uilang').textContent = ({ ta: 'த', en: 'EN', hi: 'हि' })[S.ui] || 'EN';   // the current interface language; the button opens the chooser
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
      search: () => viewSearch(q.get('q') || '', q.get('m') || ''), practice: () => p[1] ? viewPractice(+p[1], p[2] || 'listen') : viewPracticeIndex(),
      more: viewMore, settings: viewSettings, about: viewAbout, daily: viewDaily, bookmarks: viewBookmarks,
      grammar: () => viewGrammar(q.get('type') || 'ilakkanam', q.get('tag') || ''), offline: viewOffline,
      occasions: () => viewOccasions(p[1] || ''),
      cards: () => viewCards(q),
      verify: () => viewVerify(q.get('q') || ''),
      malai: () => viewMalai(+p[1] || 0),
      exam: () => viewExam(p[1] || '', q),
    };
    await (map[r] || viewHome)();
    setTab({ home: 'home', daily: 'home', browse: 'browse', ch: 'browse', k: 'browse', compare: 'browse',
             parallel: 'browse', search: 'search', practice: 'practice', study: 'practice', occasions: 'home', verify: 'search', test: 'practice', learn: 'practice', exam: 'practice', malai: 'browse' }[r] || 'more');
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
// the reader's translations in display order: in the Hindi interface the Hindi translation leads
const uiLangs = () => S.ui === 'hi' && S.langs.includes('hi') ? ['hi', ...S.langs.filter(c => c !== 'hi')] : S.langs;
function firstLang() { return uiLangs().find(c => c !== 'ta') || 'en'; }
function setUi(c) { S.ui = c; if (c === 'hi' && !S.langs.includes('hi')) S.langs.push('hi'); saveS(); }   // choosing Hindi turns the Hindi translation on

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
  const tvm = await malai().catch(() => null); const mv = tvm ? tvm.verses[(n - 1) % tvm.verses.length] : null;
  const occChips = oc ? oc.occasions.slice(0, 8).map(x => `<a class="chip" href="#/occasions/${esc(x.id)}">${x.icon} ${esc(occName(x))}</a>`).join('') + `<a class="chip sel" href="#/occasions">${t('occSee')} ›</a>` : '';
  render(`
  ${learnCardHTML('top')}
  <section class="hero">
    <div class="label">${t('daily')} · ${todayKey()}</div>
    <div class="kural-head"><span class="n">${t('kural')} ${n}</span><a class="ch" href="#/ch/${cm.adhigaram}">${esc(cm.name)} · ${esc(enN(cm.name, cm.nameEn))}</a></div>
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
  ${mv ? `<div class="card malai-card" data-n="${mv.n}"><h2>🌺 ${t('malaiToday')} <span class="muted" style="font-size:.85rem;font-weight:400">· ${t('malai')} ${mv.n}</span></h2><div class="muted" style="font-size:.85rem">${esc(mv.poet)}</div><a href="#/malai/${mv.n}" class="malai-lines" style="text-decoration:none;color:inherit">${malaiVerse(mv)}</a><div class="actions"><button class="btn ml-say" type="button">🔊 ${t('recite')}</button><a class="btn" href="#/malai/${mv.n}">📖 ${t('more')}</a><a class="btn" href="#/malai">🌺 ${t('malaiAll')}</a></div></div>` : ''}
  <div class="two">
    <a class="card" href="#/k/${last}" style="text-decoration:none;color:inherit"><h2>${t('continue')}</h2><div class="muted">${t('kural')} ${last} · ${esc(chMeta(chOf(last)).name)}</div><div style="font-family:var(--ta-serif)">${esc(lk.l1)}<br>${esc(lk.l2)}</div></a>
    <div class="card"><h2>${t('stats')}</h2><div class="stat">
      <div><b>1330</b><span>குறள்</span></div><div><b>133</b><span>அதிகாரம்</span></div>
      <div><b>${m.counts.scheduled}</b><span>மொழிகள் · languages</span></div><div><b>${Object.keys(m.languages).length}</b><span>translations</span></div>
      <div><b>${m.counts.wordTokens.toLocaleString()}</b><span>இலக்கணக் குறிப்புகள்</span></div></div></div>
  </div>
  <div class="card"><h2>${t('pal')}</h2><div class="grid">${m.pals.map(p => `<a class="tile" href="#/browse"><div class="n">${t('pal')} ${p.num}</div><b>${esc(p.name)}</b><div class="muted">${esc(enN(p.name, p.nameEn))} · ${p.iyals.reduce((s, i) => s + i.chapters.length, 0)} ${t('adhigaram')}</div></a>`).join('')}</div></div>
  <div class="row"><a class="btn" href="#/k/${1 + Math.floor(Math.random() * 1330)}">🎲 ${t('random')}</a><a class="btn" href="#/test">🏆 ${t('test')}</a><a class="btn" href="#/search">🔍 ${t('search')}</a><a class="btn" href="#/daily">🔔 ${t('notify')}</a><button class="btn" id="btn-install" hidden>📲 ${t('install')}</button></div>`);
  $('#home-recite').onclick = e => reciteKural(k, e.currentTarget);
  wireInstall();
}

async function viewBrowse() {
  setTitle(t('tab.read'), 'பால் › இயல் › அதிகாரம்');
  const m = D.meta; const f = firstLang();
  render(m.pals.map(p => `<div class="card"><h2>${esc(p.name)} <span class="muted">· ${esc(enN(p.name, p.nameEn))}</span></h2>
    ${p.iyals.map(iy => `<h3 style="margin-top:10px">${esc(iy.name)} <span class="muted">· ${esc(enN(iy.name, iy.nameEn))}</span></h3>
      <div class="grid">${iy.chapters.map(c => { const cm = chMeta(c); return `<a class="tile" href="#/ch/${c}"><div class="n">${t('adhigaram')} ${c} · ${cm.start}–${cm.end}</div><b>${esc(cm.name)}</b><div class="muted" style="font-size:.8rem">${esc(enN(cm.name, cm.nameEn))}</div></a>`; }).join('')}</div>`).join('')}
  </div>`).join('') + `<div class="card"><h2>🌺 ${t('malai')}</h2><div class="muted">${t('malaiSub')}</div><div class="row" style="margin-top:8px"><a class="btn primary" href="#/malai">📖 ${t('malaiAll')}</a></div></div>`);
}

async function viewChapter(n) {
  if (!(n >= 1 && n <= 133)) return viewBrowse();
  const ch = await chapter(n); const ai = await audioInfo(); const f = firstLang();
  setTitle(`${t('adhigaram')} ${n} · ${ch.name}`, `${enN(ch.name, ch.nameEn)} · ${ch.pal} › ${ch.iyal}`);
  const hasBook = ai.chapters.includes(n);
  render(`<div class="nav-pn pn-top">${n > 1 ? `<a class="btn" href="#/ch/${n - 1}">${t('prev')}</a>` : '<span></span>'}${n < 133 ? `<a class="btn" href="#/ch/${n + 1}">${t('next')}</a>` : ''}</div>
  <div class="card">
    <div class="row"><div class="grow"><h2 style="font-size:1.2rem">${esc(ch.name)} <span class="muted">· ${esc(enN(ch.name, ch.nameEn))}</span></h2><div class="muted">${esc(ch.pal)} › ${esc(ch.iyal)} · ${t('kural')} ${ch.start}–${ch.end} · <i>${esc(ch.transliteration)}</i></div></div></div>
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
  setTitle(`${t('kural')} ${n}`, `${cm.name} · ${enN(cm.name, cm.nameEn)}`);
  const bm = S.bookmarks.includes(n);
  const trCards = uiLangs().filter(c => c !== 'ta' && k.tr[c]).map(c => {
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
      <button class="btn" id="k-card">🖼️ ${t('shareCard')}</button>
      <button class="btn" id="k-copy">⧉ ${t('copy')}</button>
      <button class="btn" id="k-report">⚑ ${t('report')}</button>
    </div>
  </div>
  <h3 class="muted" style="margin:4px 4px">${t('translations')} <button class="btn small" id="k-langs">🌐 ${t('langs')}</button> <a class="btn small" href="#/compare/${n}">⇔ ${t('compare')}</a></h3>
  ${trCards || `<div class="card muted">${t('chooseLangs')}</div>`}
  ${S.showProse ? `<div class="card"><h2>${t('prose')}</h2><div class="tabs-inline" id="prose-tabs">${proseTabs.map(p => `<button data-p="${p[0]}" class="${p[0] === S.proseTab ? 'on' : ''} ${scriptClass(p[0].startsWith('ta') ? 'ta' : p[0])}">${esc(p[1])}</button>`).join('')}</div><div id="prose-body"></div></div>` : ''}
  <div class="card"><h2>${t('metre')}</h2>${scanHTML(k.yappu)}<div class="row" style="margin-top:8px"><a class="btn small" href="#/practice/${n}">🎵 ${t('practice')}</a></div></div>
  <div class="card"><h2>${t('grammar')}</h2><div id="wordtable" class="wordtable"><span class="muted">…</span></div><div class="ai-note">${t('grNote')}</div><div id="ex-k"></div></div>
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
    exKuralBtn(n);
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
function buildReport(k, cm, code, type, note, fix, extra) {
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
    ...(extra ? ['', extra] : []),
    '', `App: ${edition} · build ${m.built} · v${m.version} · ui ${S.ui}`,
    `Link: ${appUrl()}#/k/${k.n}`].join('\n');
}
function openReportSheet(k, cm, code, pre) {
  const streams = reportStreams(k); if (!streams.some(s => s[0] === code)) code = 'ta';
  openSheet(`<h2>⚑ ${t('report')}</h2><div class="muted" style="font-size:.85rem">${t('reportHelp')}</div>
    <div class="field"><label class="muted" for="rp-stream">${t('rpStream')}</label><select id="rp-stream">${streams.map(s => `<option value="${esc(s[0])}"${s[0] === code ? ' selected' : ''}>${esc(s[1])}</option>`).join('')}</select></div>
    <div class="field"><label class="muted" for="rp-type">${t('rpType')}</label><select id="rp-type">${REPORT_TYPES.map(x => `<option value="${x}">${esc(t('rpT_' + x))}</option>`).join('')}</select></div>
    <div class="field"><label class="muted" for="rp-note">${t('rpNote')}</label><textarea id="rp-note" rows="3"></textarea></div>
    <div class="field"><label class="muted" for="rp-fix">${t('rpFix')}</label><textarea id="rp-fix" rows="2"></textarea></div>
    <div class="row" style="margin-top:10px"><button class="btn primary" id="rp-email">✉ ${t('rpEmail')}</button>${(NATIVE_SHARE || navigator.share) ? `<button class="btn" id="rp-share">⤴ ${t('rpShare')}</button>` : ''}<button class="btn" id="rp-copy">⧉ ${t('rpCopy')}</button><span class="grow"></span><button class="btn small" onclick="closeSheet()">✕</button></div>
    <div class="muted" style="font-size:.78rem;margin-top:8px">${t('rpReviewed')}</div>`);
  if (pre) { if (pre.type) $('#rp-type').value = pre.type; if (pre.note) $('#rp-note').value = pre.note; }
  const sent = () => { if (pre && pre.onSent) pre.onSent(); };
  const text = () => buildReport(k, cm, $('#rp-stream').value, $('#rp-type').value, $('#rp-note').value.trim(), $('#rp-fix').value.trim(), pre && pre.extra);
  const subject = () => `[Tirukkural ${k.n}] ${$('#rp-stream').selectedOptions[0].textContent} — ${$('#rp-type').selectedOptions[0].textContent}`;
  const to = () => (D.meta.credits && D.meta.credits.contact) || 'kannan.k@cict.in';
  $('#rp-email').onclick = () => { location.href = `mailto:${to()}?subject=${encodeURIComponent(subject())}&body=${encodeURIComponent(text())}`; toast(t('rpOpened')); sent(); };
  const sh = $('#rp-share'); if (sh) sh.onclick = () => { const body = text(); if (NATIVE_SHARE) { try { NATIVE_SHARE.text(subject(), body); sent(); return; } catch (e) { } } navigator.share({ title: subject(), text: body }).then(sent).catch(() => { }); };
  $('#rp-copy').onclick = () => navigator.clipboard.writeText(text()).then(() => { toast('✓ ' + t('rpCopy')); sent(); });
  (pre ? $('#rp-type') : $('#rp-note')).focus();
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
  const term = x => { const d = g.terms && g.terms[x]; return d ? `<div class="gloss-tip">${esc(S.ui === 'ta' ? d.ta : (S.ui === 'hi' && hiGloss(x)) || d.en)}</div>` : ''; };
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

function openUiSheet() {   // three interface languages: a chooser, not a toggle
  const L3 = [['ta', 'தமிழ்'], ['en', 'English'], ['hi', 'हिन्दी']];
  openSheet(`<h2>${t('uiLang')}</h2><div class="row ui-langs" role="group" aria-label="${esc(t('uiLang'))}">${L3.map(([c, name]) => `<button class="btn ${S.ui === c ? 'primary' : ''}" data-ui="${c}" lang="${c}" aria-pressed="${S.ui === c}">${S.ui === c ? '✓ ' : ''}${name}</button>`).join('')}</div>`);
  $$('#sheet-root [data-ui]').forEach(b => b.onclick = () => { setUi(b.dataset.ui); closeSheet(); route(); });
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
    <div class="kural-head"><span class="n">${t('kural')} ${n}</span><a class="ch" href="#/k/${n}">${esc(cm.name)} · ${esc(enN(cm.name, cm.nameEn))}</a></div>
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
  setTitle(`${t('parallel')} · ${ch.name}`, `${t('adhigaram')} ${n} · ${enN(ch.name, ch.nameEn)}`);
  const opts = m.langOrder.filter(c => c !== 'ta')
    .map(c => `<option value="${c}" ${c === pick ? 'selected' : ''}>${esc(L(c).native)}${L(c).name === L(c).native ? '' : ' — ' + esc(L(c).name)}</option>`).join('');
  render(`<div class="nav-pn pn-top">${n > 1 ? `<a class="btn" href="#/parallel/${n - 1}">${t('prev')}</a>` : '<span></span>'}${n < 133 ? `<a class="btn" href="#/parallel/${n + 1}">${t('next')}</a>` : ''}</div>
  <div class="card">
      <div class="row"><div class="grow"><h2 style="font-size:1.1rem">${esc(ch.name)} <span class="muted">· ${esc(enN(ch.name, ch.nameEn))}</span></h2>
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
// One tap from a kural or an occasion: the card studio's renderer with whatever the reader last chose there.
async function shareCard(k, cm, btn, occ) {
  const old = btn.textContent; btn.textContent = '⏳'; btn.disabled = true;
  try {
    const C = Object.assign({ theme: occ ? 'vizha' : 'olai', size: 'sq', translit: true, chapter: true, qr: true, langs: null }, JSON.parse(localStorage.getItem('kural.card') || '{}'));
    const o = { k, occ: occ || null, theme: occ && C.theme === 'olai' ? 'vizha' : C.theme, size: C.size, translit: C.translit, chapter: C.chapter, qr: C.qr, langs: (C.langs && C.langs.length ? C.langs : uiLangs().filter(c => c !== 'ta').slice(0, 1)) };
    const cv = document.createElement('canvas');
    await cardDraw(cv, o);
    await cardShare(cv, o, btn);
  } catch (e) { toast('✕ ' + e.message); }
  btn.textContent = old; btn.disabled = false;
  void cm;
}
// Short label for a search stream: 'ta' → த, 'translit' → Aa, 'prose-ta' → த·உரை
function streamTag(c) {
  if (c === 'translit') return 'Aa';
  const base = c.replace('prose-', '');
  const l = L(base);
  return (l ? l.short : base) + (c.startsWith('prose-') ? '·' + (S.ui === 'ta' ? 'உரை' : S.ui === 'hi' ? 'व्याख्या' : 'prose') : '');
}

// ───────────────────────────── search ─────────────────────────────
let searchTimer;
async function viewSearch(q0, mode0) {
  if (mode0 === 'meaning') return viewMeaning(q0);
  setTitle(t('search'), 'தேடல் · 22 மொழிகள்');
  render(`${searchModes('w', q0)}<div class="search-box"><input type="search" id="q" placeholder="${esc(t('searchPh'))}" value="${esc(q0)}" autocomplete="off" enterkeyhint="search"></div>
    <div class="row" id="lang-filter"></div><div class="row" style="margin:2px 4px"><a class="chip" id="verify-link" href="#/verify">✔ ${t('verify')}</a></div><div id="results"></div>`);
  const input = $('#q'); input.focus();
  const m = D.meta;
  let filter = 'auto';
  $('#lang-filter').innerHTML = `<button class="chip sel" data-f="auto" title="${esc(t('autoScriptHelp'))}">${t('autoScript')}</button><button class="chip" data-f="all">${t('allLangs')}</button>`
    + ['ta', ...S.langs.filter(c => c !== 'ta')].map(c => `<button class="chip ${scriptClass(c)}" data-f="${c}">${esc(L(c).native)}</button>`).join('');
  $$('#lang-filter .chip').forEach(b => b.onclick = () => { filter = b.dataset.f; $$('#lang-filter .chip').forEach(x => x.classList.toggle('sel', x === b)); run(); });
  const run = async () => {
    const q = input.value.trim(); location.replace('#/search?q=' + encodeURIComponent(q)); const mw = $('#sm-m'); if (mw) mw.href = '#/search?q=' + encodeURIComponent(q) + '&m=meaning';
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
    if (!ns.length) { res.innerHTML = `<div class="card muted">${t('noresults')}${meanOK() ? `<div style="margin-top:8px"><a class="btn" href="#/search?q=${encodeURIComponent(q)}&m=meaning">${t('meanWordsNone')}</a></div>` : ''}</div>`; return; }
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

// ───────────────────────────── பொருள் தேடல் · search by meaning ─────────────────────────────
// The reader's question is encoded on the device by a vocabulary-pruned multilingual-e5-small (ONNX int8, run
// by onnxruntime-web); ~42,500 passage vectors (verse, மு.வ., தமிழ் உரை, English prose and every translation) were
// computed by build/build_meaning.py with the same model and tokenizer. The pack (~105 MB) is downloaded once
// on request into its own Cache Storage bucket — read directly, so it works in the Android WebView too, which
// has no service worker. Nothing the reader types leaves the device.
const MEAN_CACHE = 'kural-meaning-v1';
const MEAN_BASE = IS_ANDROID_APP ? 'https://cictdl.github.io/index.html/kural-app/meaning/' : new URL('meaning/', location.href).href;
const MEAN = { eng: null, loading: null };
const meanOK = () => !SINGLE && hasCaches() && typeof WebAssembly === 'object' && !!(window.crypto && crypto.subtle);
const meanKey = (f, man) => MEAN_BASE + f + '?v=' + man.files[f].sha;
const meanMB = b => (b / 1e6).toFixed(0);
async function meanLocal() {   // the installed manifest, if every file it names is in the cache
  if (!meanOK()) return null;
  try {
    const c = await caches.open(MEAN_CACHE); const r = await c.match(MEAN_BASE + 'meaning.json'); if (!r) return null;
    const man = await r.json();
    for (const f of Object.keys(man.files)) if (!(await c.match(meanKey(f, man)))) return null;
    return man;
  } catch { return null; }
}
async function meanRemote() { try { const r = await fetch(MEAN_BASE + 'meaning.json', { cache: 'no-cache' }); return r.ok ? await r.json() : null; } catch { return null; } }
const meanSize = man => Object.values(man.files).reduce((s, f) => s + f.bytes, 0);
async function meanMissing(man) { const c = await caches.open(MEAN_CACHE); const out = []; for (const f of Object.keys(man.files)) if (!(await c.match(meanKey(f, man)))) out.push(f); return out; }
async function sha16(buf) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join(''); }
async function meanDownload(man, onProgress) {
  const c = await caches.open(MEAN_CACHE); const need = await meanMissing(man);
  const total = need.reduce((s, f) => s + man.files[f].bytes, 0); let got = 0;
  for (const f of need) {
    const r = await fetch(MEAN_BASE + f + '?v=' + man.files[f].sha, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`${f}: HTTP ${r.status}`);
    const rd = r.body.getReader(); const parts = [];
    for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; onProgress(got, total); }
    const buf = await new Blob(parts).arrayBuffer();
    if ((await sha16(buf)) !== man.files[f].sha) throw new Error(`${f}: checksum`);
    await c.put(meanKey(f, man), new Response(buf, { headers: { 'Content-Type': 'application/octet-stream' } }));
  }
  await c.put(MEAN_BASE + 'meaning.json', new Response(JSON.stringify(man), { headers: { 'Content-Type': 'application/json' } }));
  const keep = new Set(Object.keys(man.files).map(f => meanKey(f, man)).concat(MEAN_BASE + 'meaning.json'));
  for (const req of await c.keys()) if (!keep.has(req.url)) await c.delete(req);   // older versions of changed files
  MEAN.eng = null; MEAN.loading = null;
}
async function meanRemove() { MEAN.eng = null; MEAN.loading = null; try { await caches.delete(MEAN_CACHE); } catch { } }
function meanEngine() {
  return MEAN.loading || (MEAN.loading = (async () => {
    const man = await meanLocal(); if (!man) throw new Error('not downloaded');
    const c = await caches.open(MEAN_CACHE);
    const get = async f => { const r = await c.match(meanKey(f, man)); if (!r) throw new Error('missing ' + f); return r; };
    const ort = await import('./vendor/ort.wasm.bundle.min.js');
    ort.env.wasm.numThreads = 1; ort.env.wasm.proxy = false;
    ort.env.wasm.wasmBinary = await (await get('ort-wasm-simd-threaded.wasm')).arrayBuffer();
    const { Tokenizer } = await import('./vendor/tokenizers.min.js');
    const tok = new Tokenizer(await (await get('tokenizer.json')).json(), await (await get('tokenizer_config.json')).json());
    const sess = await ort.InferenceSession.create(new Uint8Array(await (await get('model.onnx')).arrayBuffer()), { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
    const N = man.count, Dm = man.dim;
    const M = new Int8Array(await (await get('vectors.bin')).arrayBuffer());
    const ub = await (await get('units.bin')).arrayBuffer();
    const U = new Uint8Array(ub, 0, N * 3), SC = new Float32Array(ub.slice(N * 3));
    if (M.length !== N * Dm || SC.length !== N) throw new Error('pack size');
    return (MEAN.eng = { man, ort, tok, sess, M, U, SC, N, Dm });
  })().catch(e => { MEAN.loading = null; throw e; }));
}
async function meanEncode(E, q) {
  const ids = E.tok.encode(E.man.prefix.query + q).ids.slice(0, 512); const L = ids.length;
  const T = a => new E.ort.Tensor('int64', BigInt64Array.from(a, x => BigInt(x)), [1, L]);
  const out = await E.sess.run({ input_ids: T(ids), attention_mask: T(ids.map(() => 1)), token_type_ids: T(ids.map(() => 0)) });
  const h = out.last_hidden_state.data, v = new Float32Array(E.Dm);
  for (let i = 0; i < L; i++) for (let d = 0; d < E.Dm; d++) v[d] += h[i * E.Dm + d];
  let nn = 0; for (let d = 0; d < E.Dm; d++) { v[d] /= L; nn += v[d] * v[d]; } nn = Math.sqrt(nn) || 1;
  for (let d = 0; d < E.Dm; d++) v[d] /= nn;
  return v;
}
// each kural is scored by the mean of its five best passages (of ~32: verse, commentaries, translations): a kural that
// really says the idea matches in many of its versions, a stray phrase in one translation does not carry it.
// On build/meaning_eval.json this lifts hit@10 from 78% (best passage alone) to 83%, MRR 0.56 → 0.67.
const MEAN_K = 5;
function meanRank(E, v, k = 20) {
  const { M, SC, U, N, Dm } = E; const K = MEAN_K;
  const top = new Float32Array(1331 * K).fill(-9), at = new Int32Array(1331 * K).fill(-1);
  for (let i = 0, o = 0; i < N; i++, o += Dm) {
    let d = 0; for (let j = 0; j < Dm; j++) d += v[j] * M[o + j]; d *= SC[i];
    const b = (U[i * 3] | (U[i * 3 + 1] << 8)) * K;
    if (d <= top[b + K - 1]) continue;
    let p = K - 1; while (p > 0 && top[b + p - 1] < d) { top[b + p] = top[b + p - 1]; at[b + p] = at[b + p - 1]; p--; }
    top[b + p] = d; at[b + p] = i;
  }
  const out = [];
  for (let n = 1; n <= 1330; n++) {
    let s = 0, c = 0; for (let p = 0; p < K; p++) if (at[n * K + p] >= 0) { s += top[n * K + p]; c++; }
    if (c) out.push({ n, score: s / K, ev: Array.from({ length: Math.min(3, c) }, (_, p) => ({ st: E.man.streams[U[at[n * K + p] * 3 + 2]], score: top[n * K + p] })) });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, k);
}
const meanStreamName = st => st === 'ta' ? t('meanVerse') : st === 'ta_mv' ? t('meanMv') : st === 'tac' ? t('meanTac') : st === 'en_p' ? t('meanEnP') : (L(st) ? L(st).native : st);
const meanText = (k, st) => st === 'ta' ? `${k.l1} ${k.l2}` : st === 'ta_mv' ? (k.prose || {}).ta_mv || '' : st === 'tac' ? ((k.prose || {}).tac || (k.tr.tac || []).join(' ')) : st === 'en_p' ? (k.prose || {}).en || '' : (k.tr[st] || []).filter(Boolean).join(' ');
const meanStreamLang = st => st === 'ta' || st === 'ta_mv' || st === 'tac' ? 'ta' : st === 'en_p' ? 'en' : st;
// No per-result strength label: on build/meaning_eval.json neither the absolute score (real questions 0.80–0.90,
// off-topic ones such as cricket scores or phone prices 0.76–0.83) nor how far the top kural stands out from the
// rest separates a real answer from a nearest-but-unrelated one. So results are ranked, each shows the line that
// matched, and the note says plainly that the nearest kurals are shown even when the Kural does not address the
// question. Only a score under MEAN_FLOOR (gibberish) returns "nothing found".
const MEAN_FLOOR = 0.78;
// languages whose own translation finds its kural through the others less than 45% of the time (build_meaning.py xlingual)
const meanWeak = man => Object.entries((man && man.xlingual) || {}).filter(([c, v]) => v < 0.45 && L(c) && c !== 'ta').map(([c]) => c);
const meanWeakHTML = man => { const w = meanWeak(man); return w.length ? `<div class="muted" style="font-size:.8rem;margin-top:6px">${fmt(t('meanWeakLangs'), { l: w.map(c => esc(L(c).native)).join(', ') })}</div>` : ''; };
const meanWeakScript = q => /[ꯀ-꯿᱐-᱿؀-ۿ]/.test(q);   // Meetei Mayek, Ol Chiki, Perso-Arabic

function searchModes(on, q) {
  const qs = q ? '?q=' + encodeURIComponent(q) : '';
  return `<div class="tabs-inline s-modes" role="tablist"><a href="#/search${qs}" id="sm-w" role="tab" aria-selected="${on === 'w'}"><button class="${on === 'w' ? 'on' : ''}">${t('wordTab')}</button></a><a href="#/search${qs ? qs + '&' : '?'}m=meaning" id="sm-m" role="tab" aria-selected="${on === 'm'}"><button class="${on === 'm' ? 'on' : ''}">${t('meanTab')}</button></a></div>`;
}
async function viewMeaning(q0) {
  setTitle(t('search'), 'பொருள் தேடல் · 22 மொழிகள்');
  const exHTML = () => `<div class="muted" style="margin-top:8px">${t('meanTry')} ${t('meanEx').split('|').map(x => `<a class="chip mean-ex" href="#" data-q="${esc(x)}">${esc(x)}</a>`).join(' ')}</div>`;
  render(`${searchModes('m', q0)}<div class="search-box"><input type="search" id="q" placeholder="${esc(t('meanPh'))}" value="${esc(q0)}" autocomplete="off" enterkeyhint="search"></div>
    <div id="mean-pack"></div><div id="results"></div>`);
  const input = $('#q'), res = $('#results'), pack = $('#mean-pack');
  const mw = () => { const w = $('#sm-w'); if (w) w.href = '#/search?q=' + encodeURIComponent(input.value.trim()); };
  if (!meanOK()) { pack.innerHTML = `<div class="card muted">${t('meanUnavail')}</div>`; return; }
  let man = await meanLocal();
  const showPack = async () => {
    if (man) {
      pack.innerHTML = `<div class="card"><div class="mean-intro" ${input.value.trim() ? 'hidden' : ''}><div class="muted">${t('meanIntro')}</div>${exHTML()}${meanWeakHTML(man)}</div>
        <div class="row" style="align-items:center"><span class="muted" style="font-size:.8rem">${fmt(t('meanReady'), { mb: meanMB(meanSize(man)) })}</span><span id="mean-upd"></span><button class="btn" id="mean-rm" style="margin-left:auto">${t('meanRemove')}</button></div></div>`;
      $('#mean-rm').onclick = async () => { await meanRemove(); man = null; res.innerHTML = ''; showPack(); };
      if (navigator.onLine) meanRemote().then(async rm => {
        if (!rm || rm.rev === man.rev && rm.revision === man.revision) return;
        const need = (await meanMissing(rm)).reduce((s, f) => s + rm.files[f].bytes, 0); const u = $('#mean-upd'); if (!u || !need) return;
        u.innerHTML = `<button class="btn" id="mean-up">${fmt(t('meanUpdate'), { mb: Math.max(1, Math.round(need / 1e6)) })}</button>`;
        $('#mean-up').onclick = () => startDl(rm);
      });
      return;
    }
    pack.innerHTML = `<div class="card"><h2>${t('meanTab')}</h2><p>${t('meanIntro')}</p><div id="mean-dl-row" class="muted">${t('meanCheck')}</div></div>`;
    const rm = navigator.onLine ? await meanRemote() : null; const row = $('#mean-dl-row'); if (!row) return;
    if (!rm) { row.textContent = t('meanOffline'); return; }
    row.innerHTML = `<button class="btn primary" id="mean-dl">${fmt(t('meanDl'), { mb: meanMB(meanSize(rm)) })}</button><div class="muted" style="font-size:.8rem;margin-top:6px">${t('meanDlNote')}</div>${meanWeakHTML(rm)}`;
    $('#mean-dl').onclick = () => startDl(rm);
  };
  const startDl = async rm => {
    pack.innerHTML = `<div class="card"><div id="mean-p-t" class="muted">${fmt(t('meanDling'), { p: 0, a: 0, b: meanMB(meanSize(rm)) })}</div><progress id="mean-p" max="1" value="0" style="width:100%"></progress></div>`;
    try {
      await meanDownload(rm, (a, b) => { const p = $('#mean-p'); if (p) { p.value = a / b; $('#mean-p-t').textContent = fmt(t('meanDling'), { p: Math.floor(100 * a / b), a: meanMB(a), b: meanMB(b) }); } });
      man = await meanLocal(); await showPack(); if (input.value.trim()) run();
    } catch (e) { pack.innerHTML = `<div class="card"><div class="mean-warn">${esc(fmt(t('meanFail'), { e: e.message }))}</div></div>`; man = null; setTimeout(showPack, 4000); }
  };
  let seq = 0;
  const run = async () => {
    const q = input.value.trim(); location.replace('#/search?q=' + encodeURIComponent(q) + '&m=meaning'); mw();
    const intro = $('#mean-pack .mean-intro'); if (intro) intro.hidden = !!q;   // the explanation only while the box is empty
    if (!q) { res.innerHTML = ''; return; }
    if (/^\d+$/.test(q) && +q >= 1 && +q <= 1330) { location.hash = '#/k/' + (+q); return; }
    if (!man) return;
    const my = ++seq;
    if (!MEAN.eng) res.innerHTML = `<div class="card muted">${t('meanPrep')}</div>`;
    let E; try { E = await meanEngine(); } catch (e) { res.innerHTML = `<div class="card mean-warn">${esc(fmt(t('meanErr'), { e: e.message }))}</div>`; return; }
    const t0 = performance.now(); const v = await meanEncode(E, q); const hits = meanRank(E, v, 20); const ms = Math.round(performance.now() - t0);
    if (my !== seq) return;
    const shown = hits.filter(h => h.score >= MEAN_FLOOR);
    if (!shown.length) { res.innerHTML = `<div class="card muted">${t('meanNone')}</div>`; return; }
    const ks = await Promise.all(shown.map(h => kural(h.n)));
    if (my !== seq) return;
    const mine = firstLang();
    res.innerHTML = `<div class="muted" style="margin:4px">${fmt(t('meanTime'), { n: shown.length, ms })}</div>${meanWeakScript(q) ? `<div class="card mean-warn">${t('meanWeakScript')}</div>` : ''}<div class="card list">` + shown.map((h, i) => {
      const k = ks[i]; const top = h.ev[0];   // evidence: the best passage, plus a second one when it is nearly as close
      const ev = h.ev.filter((e, j) => j === 0 || e.score >= top.score - 0.02).slice(0, 2);
      const mineLine = !ev.some(e => e.st === mine) && k.tr[mine] ? `<span class="tr ${scriptClass(mine)}"${dirAttr(mine)}><span class="lang-tag">${esc(L(mine).short)}</span>${esc(k.tr[mine].filter(Boolean).join(' '))}</span>` : '';
      return `<a href="#/k/${h.n}" class="result mean-r"><span class="num">${h.n}</span><span class="tx"><span class="l">${esc(k.l1)} ${esc(k.l2)}</span>
        ${ev.map(e => { const lg = meanStreamLang(e.st); return `<span class="tr mean-ev ${scriptClass(lg)}"${dirAttr(lg)}><span class="lang-tag">${esc(meanStreamName(e.st))}</span>${esc(meanText(k, e.st))}</span>`; }).join('')}${mineLine}</span></a>`;
    }).join('') + `</div><div class="muted" style="font-size:.78rem;margin:8px 4px">${t('meanHonest')}</div>`;
  };
  view().addEventListener('click', e => { const a = e.target.closest && e.target.closest('.mean-ex'); if (a) { e.preventDefault(); input.value = a.dataset.q; run(); } });
  input.onkeydown = e => { if (e.key === 'Enter') { clearTimeout(searchTimer); run(); } };
  input.oninput = () => { clearTimeout(searchTimer); searchTimer = setTimeout(run, 700); mw(); };
  await showPack();
  input.focus();
  if (q0 && man) run();
}

// ───────────────────────────── படக் கூடம் · card studio ─────────────────────────────
// One kural as a picture, for WhatsApp and the notice board: the verse, an optional transliteration and up to
// two translations in their own scripts, on three grounds and in two sizes, with the app's QR. Everything is
// drawn on a canvas from the same self-hosted fonts the app reads with, so a card made offline looks the same.
const CARD_SIZES = { sq: [1080, 1080], st: [1080, 1920] };
const CARD_THEMES = {
  olai: { bg: ['#faf7f2', '#efe4d0'], ink: '#332a1e', sub: '#6f6459', accent: '#8f2f1c', gold: '#c8961e', rule: '#d9cdb8', qrbg: '#ffffff' },
  iravu: { bg: ['#261e17', '#14100c'], ink: '#f4ece0', sub: '#b3a693', accent: '#e28a6c', gold: '#e2b65a', rule: '#4b3f33', qrbg: '#f4ece0' },
  vizha: { bg: ['#fff7e6', '#ffe6bd'], ink: '#3a2a12', sub: '#7a6340', accent: '#b8442a', gold: '#c07f12', rule: '#e6cfa3', qrbg: '#ffffff' },
};
const cardFam = (() => {   // the font stack the app itself uses for that script, read from the stylesheet
  const cache = {};
  return code => {
    const cls = scriptClass(code);
    if (cache[cls]) return cache[cls];
    const el = document.createElement('span'); el.className = cls;
    el.style.cssText = 'position:absolute;left:-9999px;visibility:hidden'; document.body.appendChild(el);
    const f = getComputedStyle(el).fontFamily || 'sans-serif'; el.remove();
    return (cache[cls] = f);
  };
})();
const CARD_SERIF = '"Noto Serif Tamil","Noto Sans Tamil",serif';
let cardQrImg = null;
function cardQr() {
  if (cardQrImg) return cardQrImg;
  const im = new Image(); im.src = 'assets/qr-app.png'; return (cardQrImg = im);
}
// every face this card needs, at the sizes it needs them, before the first measureText
async function cardFonts(blocks) {
  if (!document.fonts || !document.fonts.load) return;
  const jobs = [];
  for (const b of blocks) if (b.s) jobs.push(document.fonts.load(`${b.bold ? 700 : 400} ${Math.round(b.size)}px ${b.fam}`, b.s.slice(0, 120)).catch(() => { }));
  await Promise.all(jobs);
  if (document.fonts.ready) await document.fonts.ready;
}
function cardBlocks(o) {
  const T = CARD_THEMES[o.theme] || CARD_THEMES.olai;
  const k = o.k, cm = chMeta(chOf(k.n)); const B = [];
  if (o.occ) B.push({ s: `${o.occ.icon} ${occName(o.occ)}`, fam: cardFam(S.ui === 'ta' ? 'ta' : S.ui), size: 44, bold: true, col: T.accent, gap: 0 });
  B.push({ s: `${t('kural')} ${k.n}${o.chapter ? ' · ' + cm.name : ''}`, fam: cardFam('ta'), size: 34, col: T.sub, gap: o.occ ? 16 : 0 });
  B.push({ s: k.l1, fam: CARD_SERIF, size: 60, col: T.ink, gap: 44, lh: 1.42, verse: true });
  B.push({ s: k.l2, fam: CARD_SERIF, size: 60, col: T.ink, gap: 8, lh: 1.42, verse: true });
  if (o.translit && k.tl) B.push({ s: k.tl.filter(Boolean).join(' '), fam: 'system-ui,sans-serif', size: 30, col: T.sub, italic: true, gap: 28, lh: 1.4 });
  for (const c of o.langs) {
    const tr = (k.tr[c] || []).filter(Boolean).join(' ');
    if (!tr) continue;
    B.push({ rule: true, gap: 34 });
    B.push({ s: tr, fam: cardFam(c), size: 38, col: T.ink, gap: 32, lh: 1.55, rtl: L(c).dir === 'rtl' });
    B.push({ s: L(c).native === L(c).name ? L(c).name : `${L(c).native} · ${L(c).name}`, fam: 'system-ui,sans-serif', size: 24, col: T.sub, gap: 12 });
  }
  return B;
}
function cardWrap(x, s, maxW) {
  const words = String(s).split(/\s+/); const lines = []; let cur = '';
  for (const w of words) {
    const tst = cur ? cur + ' ' + w : w;
    if (x.measureText(tst).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tst;
  }
  if (cur) lines.push(cur);
  return lines;
}
async function cardDraw(cv, o) {
  const [W, H] = CARD_SIZES[o.size] || CARD_SIZES.sq;
  const T = CARD_THEMES[o.theme] || CARD_THEMES.olai;
  cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const B = cardBlocks(o);
  await cardFonts(B);
  if (o.qr) await new Promise(r => { const q = cardQr(); if (q.complete) r(); else { q.onload = r; q.onerror = r; } });
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, T.bg[0]); g.addColorStop(1, T.bg[1]);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = T.accent; x.fillRect(0, 0, W, 18);
  x.fillStyle = T.gold; x.fillRect(0, 18, W, 6);
  if (o.theme === 'vizha') { x.fillStyle = T.gold; x.globalAlpha = 0.16; x.beginPath(); x.arc(W, H, 420, 0, 7); x.fill(); x.beginPath(); x.arc(0, 0, 300, 0, 7); x.fill(); x.globalAlpha = 1; }
  x.textAlign = 'center';
  const maxW = W - 150;
  const top = 120, bottom = H - (o.qr ? 368 : 196);
  // lay out at a scale that fits; long translations in two languages shrink rather than spill
  let scale = o.size === 'st' ? 1.28 : 1, lines = [], total = 0;   // the tall card starts bigger and the fit loop pulls it back
  for (let step = 0; step < 9; step++) {
    lines = []; total = 0;
    for (const b of B) {
      if (b.rule) { lines.push({ rule: true, gap: b.gap * scale }); total += b.gap * scale + 2; continue; }
      let size = b.size * scale;
      x.direction = b.rtl ? 'rtl' : 'ltr';
      const setFont = () => { x.font = `${b.italic ? 'italic ' : ''}${b.bold ? 700 : 400} ${size}px ${b.fam}`; };
      setFont();
      if (b.verse) { const floor = 46 * scale; while (size > floor && x.measureText(b.s).width > maxW) { size -= 2; setFont(); } }
      const lh = size * (b.lh || 1.3);
      const ls = cardWrap(x, b.s, maxW);
      lines.push({ ls, size, lh, col: b.col, fam: b.fam, italic: b.italic, bold: b.bold, gap: b.gap * scale, rtl: b.rtl });
      total += b.gap * scale + ls.length * lh;
    }
    if (total <= bottom - top || scale <= 0.62) break;
    scale = Math.max(0.62, scale * Math.sqrt((bottom - top) / total));
  }
  let y = top + Math.max(0, (bottom - top - total) / 2);
  for (const l of lines) {
    y += l.gap;
    if (l.rule) { x.strokeStyle = T.rule; x.lineWidth = 2; x.beginPath(); x.moveTo(W / 2 - 110, y); x.lineTo(W / 2 + 110, y); x.stroke(); y += 2; continue; }
    x.fillStyle = l.col; x.direction = l.rtl ? 'rtl' : 'ltr';
    x.font = `${l.italic ? 'italic ' : ''}${l.bold ? 700 : 400} ${l.size}px ${l.fam}`;
    for (const s of l.ls) { y += l.lh * 0.78; x.fillText(s, W / 2, y); y += l.lh * 0.22; }
  }
  x.direction = 'ltr';
  // footer: the mark, and the way back to the app
  const logo = $('.top .logo');
  const fy = H - (o.qr ? 318 : 136);
  if (logo && logo.complete && logo.naturalWidth) { try { x.drawImage(logo, W / 2 - 30, fy - 46, 60, 60); } catch (e) { } }
  x.fillStyle = T.accent; x.font = `700 28px ${cardFam('ta')}`;
  x.fillText('திருக்குறள் — 22 மொழிகள்', W / 2, fy + 42);
  x.fillStyle = T.sub; x.font = '400 21px system-ui,sans-serif';
  x.fillText('செம்மொழித் தமிழாய்வு மத்திய நிறுவனம் · Central Institute of Classical Tamil', W / 2, fy + 78);
  if (o.qr) {
    const q = cardQr(), S0 = 128, qx = W / 2 - S0 / 2, qy = fy + 108;
    if (q.complete && q.naturalWidth) { x.fillStyle = T.qrbg; x.fillRect(qx - 10, qy - 10, S0 + 20, S0 + 20); x.drawImage(q, qx, qy, S0, S0); }
    x.fillStyle = T.sub; x.font = '400 20px system-ui,sans-serif';
    x.fillText('cictdl.github.io/index.html/kural-app', W / 2, qy + S0 + 34);
  }
  return cv;
}
function cardCaption(o) {
  const k = o.k, cm = chMeta(chOf(k.n));
  const head = o.occ ? `${o.occ.icon} ${occName(o.occ)}\n` : '';
  return `${head}${kuralText(k, cm)}\nhttps://cictdl.github.io/index.html/kural-app/`;
}
async function cardShare(cv, o, btn) {
  const name = `kural-${o.k.n}${o.size === 'st' ? '-status' : ''}.png`;
  const cap = cardCaption(o);
  if (NATIVE_SHARE) {
    try { NATIVE_SHARE.png(name, cv.toDataURL('image/png').split(',')[1], cap); return; } catch (e) { }
  }
  const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text: cap }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  cardSave(cv, name);
  void btn;
}
function cardSave(cv, name) {
  const a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = name; a.click();
  toast('✓ ' + t('cardMade'));
}

async function viewCards(q) {
  const oc = await occasions().catch(() => null);
  const occId = q.get('occ') || '';
  const occ = occId && oc ? oc.occasions.find(o => o.id === occId) : null;
  let n = +q.get('n') || (occ ? occ.kurals[0] : dailyN());
  if (!(n >= 1 && n <= 1330)) n = dailyN();
  const C = Object.assign({ theme: 'olai', size: 'sq', translit: true, chapter: true, qr: true, langs: null }, JSON.parse(localStorage.getItem('kural.card') || '{}'));
  if (occ) C.theme = C.theme === 'olai' ? 'vizha' : C.theme;
  if (!C.langs) C.langs = uiLangs().filter(c => c !== 'ta').slice(0, 1);
  setTitle('🖼️ ' + t('cards'), t('cardsSub'));
  const chip = (on, attr, label) => `<button class="chip ${on ? 'sel' : ''}" ${attr}>${label}</button>`;
  const codes = ['ta', ...D.meta.langOrder.filter(c => c !== 'ta')];
  const dup = {}; codes.forEach(c => { dup[L(c).native] = (dup[L(c).native] || 0) + 1; });   // three streams are all called "English"
  const langChips = codes.map(c =>
    `<button class="chip ${C.langs.includes(c) ? 'sel' : ''} ${scriptClass(c)}" data-lang="${c}" title="${esc(L(c).name)}">${esc(dup[L(c).native] > 1 ? L(c).name : L(c).native)}</button>`).join('');
  render(`<div class="card">
    <div class="row" style="align-items:center;gap:8px"><b>${t('cardSource')}</b>
      ${occ ? `<span class="chip sel">${occ.icon} ${esc(occName(occ))}</span>` : ''}
      <input type="text" inputmode="numeric" id="c-n" value="${n}" style="max-width:96px" aria-label="${esc(t('cardPick'))}">
      <button class="btn" id="c-today">${t('cardToday')}</button>
      <button class="btn" id="c-next">${t('cardNext')}</button>
      ${oc ? `<a class="btn" href="#/occasions">${t('cardOcc')}</a>` : ''}</div>
    <div class="row" style="margin-top:8px"><b style="align-self:center">${t('cardTheme')}</b>
      ${chip(C.theme === 'olai', 'data-th="olai"', t('cardOlai'))}${chip(C.theme === 'iravu', 'data-th="iravu"', t('cardIravu'))}${chip(C.theme === 'vizha', 'data-th="vizha"', t('cardVizha'))}
      <b style="align-self:center;margin-left:8px">${t('cardSize')}</b>
      ${chip(C.size === 'sq', 'data-sz="sq"', t('cardSq'))}${chip(C.size === 'st', 'data-sz="st"', t('cardSt'))}</div>
    <div class="row" style="margin-top:8px"><b style="align-self:center">${t('cardShow')}</b>
      ${chip(C.translit, 'data-tg="translit"', t('cardTranslit'))}${chip(C.chapter, 'data-tg="chapter"', t('cardChapter'))}${chip(C.qr, 'data-tg="qr"', t('cardQr'))}</div>
    <div class="muted" style="margin-top:10px;font-size:.85rem">${t('cardLangs')}</div>
    <div class="row card-langs">${langChips}</div>
  </div>
  <div class="card card-preview"><canvas id="c-cv" role="img" aria-label="${esc(t('cards'))}"></canvas>
    <div class="row" style="margin-top:10px"><button class="btn primary" id="c-share">${t('shareCard')}</button><button class="btn" id="c-save">${t('cardSave')}</button></div>
  </div>`);
  const cv = $('#c-cv');
  const opts = async () => ({ k: await kural(n), occ, theme: C.theme, size: C.size, translit: C.translit, chapter: C.chapter, qr: C.qr, langs: C.langs });
  let busy = null;
  const draw = async () => {
    localStorage.setItem('kural.card', JSON.stringify(C));
    const o = await opts();
    busy = cardDraw(cv, o);
    await busy;
    cv.classList.toggle('st', C.size === 'st');
  };
  const rewire = () => {
    $$('[data-th]').forEach(b => b.onclick = () => { C.theme = b.dataset.th; $$('[data-th]').forEach(z => z.classList.toggle('sel', z === b)); draw(); });
    $$('[data-sz]').forEach(b => b.onclick = () => { C.size = b.dataset.sz; $$('[data-sz]').forEach(z => z.classList.toggle('sel', z === b)); draw(); });
    $$('[data-tg]').forEach(b => b.onclick = () => { C[b.dataset.tg] = !C[b.dataset.tg]; b.classList.toggle('sel', C[b.dataset.tg]); draw(); });
    $$('[data-lang]').forEach(b => b.onclick = () => {
      const c = b.dataset.lang; const i = C.langs.indexOf(c);
      if (i >= 0) C.langs.splice(i, 1); else { C.langs.push(c); if (C.langs.length > 2) C.langs.shift(); }
      $$('[data-lang]').forEach(z => z.classList.toggle('sel', C.langs.includes(z.dataset.lang)));
      draw();
    });
  };
  rewire();
  $('#c-n').onchange = () => { const v = +$('#c-n').value; if (v >= 1 && v <= 1330) { n = v; draw(); } };
  $('#c-today').onclick = () => { n = dailyN(); $('#c-n').value = n; draw(); };
  $('#c-next').onclick = () => { n = occ ? occ.kurals[(occ.kurals.indexOf(n) + 1) % occ.kurals.length] : 1 + Math.floor(Math.random() * 1330); $('#c-n').value = n; draw(); };
  $('#c-share').onclick = async e => { const b = e.currentTarget; b.disabled = true; await busy; await cardShare(cv, await opts(), b); b.disabled = false; };
  $('#c-save').onclick = async () => { await busy; cardSave(cv, `kural-${n}.png`); };
  await draw();
}

// ───────────────────────────── practice (யாப்பு) ─────────────────────────────
async function viewPracticeIndex() {
  setTitle(t('practice'), 'யாப்பு · ஓதல் · மனப்பாடம்');
  const n = dailyN(); const k = await kural(n);
  render(`${learnCardHTML('any')}<div class="card"><h2>${t('daily')}</h2>${coupletHTML(k)}<div class="actions"><a class="btn primary" href="#/practice/${n}">🎵 ${t('start')}</a></div></div>
  <div class="card"><h2>🏆 ${t('test')}</h2><div class="muted">${t('testSub')}</div><div class="row" style="margin-top:8px"><a class="btn primary" href="#/test">🏆 ${t('test')}</a><a class="btn" href="#/test/board">📊 ${t('testBoard')}</a></div></div>
  <div class="card"><h2>📝 ${t('exTitle')}</h2><div class="muted">${t('exCardSub')}</div>${S.ex ? `<div class="muted" style="margin-top:4px">${fmt(t('exStats'), { d: S.ex.hist.days, q: S.ex.hist.q, p: S.ex.hist.q ? Math.round(100 * S.ex.hist.r / S.ex.hist.q) : 0 })}</div>` : ''}<div class="row" style="margin-top:8px"><a class="btn primary" href="#/exam">📝 ${S.ex && S.ex.cur && exToday() - S.ex.cur.d <= 7 && (!EX.bank || S.ex.cur.rev === EX.bank.rev) ? fmt(t('exResume'), { i: Math.min(S.ex.cur.i + 1, S.ex.cur.ids.length), n: S.ex.cur.ids.length }) : t('exOpen')}</a></div></div>
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
const chName = cm => S.ui === 'ta' ? cm.name : `${cm.name} · ${enN(cm.name, cm.nameEn)}`;
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
  if (s === 'memo') r = { key: s, ns: S.memorised.slice().sort((a, b) => a - b), nameTa: 'மனப்பாடம் செய்த குறள்கள்', nameEn: 'Memorised couplets', nameHi: 'कंठस्थ किए कुरल' };
  else if (s === 'book') r = { key: s, ns: rangeN(1, 1330), nameTa: 'முழு நூல்', nameEn: 'The whole book', nameHi: 'संपूर्ण ग्रंथ' };
  else if ((x = s.match(/^ch-(\d+)$/)) && +x[1] >= 1 && +x[1] <= 133) { const c = +x[1], cm = chMeta(c); r = { key: `ch-${c}`, ns: chNs(c), ch: c, nameTa: `அதிகாரம் ${c} · ${cm.name}`, nameEn: `Chapter ${c} · ${cm.nameEn}`, nameHi: `अध्याय ${c} · ${enN(cm.name, cm.nameEn)}` }; }
  else if ((x = s.match(/^r-(\d+)-(\d+)$/))) { let a = clamp(+x[1], 1, 1330), b = clamp(+x[2], 1, 1330); if (a > b) [a, b] = [b, a]; r = { key: `r-${a}-${b}`, ns: rangeN(a, b), nameTa: `குறள் ${a}–${b}`, nameEn: `Kurals ${a}–${b}`, nameHi: `कुरल ${a}–${b}` }; }
  else if ((x = s.match(/^pal-([123])$/))) { const p = m.pals[+x[1] - 1]; r = { key: s, ns: p.iyals.flatMap(i => i.chapters).flatMap(chNs), nameTa: p.name, nameEn: p.nameEn, nameHi: HI.nm[p.name] }; }
  else if ((x = s.match(/^iyal-([123])-(\d+)$/))) { const p = m.pals[+x[1] - 1]; const iy = p.iyals.find(i => i.num === +x[2]); if (iy) r = { key: s, ns: iy.chapters.flatMap(chNs), nameTa: `${p.name} · ${iy.name}`, nameEn: `${p.nameEn} · ${iy.nameEn}`, nameHi: HI.nm[p.name] && HI.nm[iy.name] && `${HI.nm[p.name]} · ${HI.nm[iy.name]}` }; }
  if (r) r.name = S.ui === 'ta' ? r.nameTa : `${r.nameTa} · ${(S.ui === 'hi' && r.nameHi) || r.nameEn}`;
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
  const palName = p => S.ui === 'ta' ? p.name : `${p.name} · ${enN(p.name, p.nameEn)}`;
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
  $('#t-share').onclick = () => shareText(t('test'), `🏆 ${t('test')} · ${R.nameTa}${S.ui === 'ta' ? '' : ' · ' + ((S.ui === 'hi' && R.nameHi) || R.nameEn)}\n${d.score}/${d.total} (${pct}%) · ${t('lv' + TEST.lv)}${TEST.seed ? ` · ${t('seedRound')} ${TEST.seed}` : ''} · ⏱ ${fmtSecs(d.secs)}\n— ${D.meta.title} · CICT · ${appUrl()}#/test`);
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
  render(`<div class="card"><div class="muted" style="font-size:.85rem">${t('boardLegend')}</div></div>` + D.meta.pals.map(p => `<div class="card"><h2>${esc(p.name)} <span class="muted" style="font-weight:400">· ${esc(enN(p.name, p.nameEn))}</span></h2>
    ${p.iyals.map(iy => `<div class="muted" style="margin:8px 0 4px">${esc(iy.name)} · ${esc(enN(iy.name, iy.nameEn))}</div><div class="t-board">${iy.chapters.map(c => { const r = T['ch-' + c]; const m = memoIn(c); const cm = chMeta(c); return `<button class="t-tile ${band(c)}" data-ch="${c}" aria-label="${c} · ${esc(cm.name)} · ${esc(enN(cm.name, cm.nameEn))}${r ? ` · ${r.best}/${(r.last && r.last.total) || TEST_N}` : ''}${band(c) === 'b3' ? ' · ' + esc(t('passedWord')) : ''}"><b>${c}</b><span>${r ? `${r.best}/${(r.last && r.last.total) || TEST_N}` : m ? `${m}★` : '—'}</span></button>`; }).join('')}</div>`).join('')}</div>`).join(''));
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
    const liveE = exOnGo() ? S.ex : undefined;
    Object.assign(S, JSON.parse(e.newValue));
    if (live !== undefined) S.learn = live; else if (S.learn) S.learn = Object.assign(learnDef(), S.learn);
    if (liveE !== undefined) S.ex = liveE; else if (S.ex) S.ex = exNorm(S.ex);
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
function learnPreset() { const en = S.ui !== 'ta'; const f = firstLang(); return { goal: en ? 'u' : 'm', ml: en ? f : 'ta', ta: en ? 0 : 1 }; }
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
    ${group('ln-w3', t('lnWayPath'), chip(pathKind === 'book', 'data-wp="book"', t('lnPathBook')) + D.meta.pals.map((p, i) => chip(pathKind === 'pal-' + (i + 1), `data-wp="pal-${i + 1}"`, esc(S.ui === 'ta' ? p.name : p.name + ' · ' + enN(p.name, p.nameEn)))).join('') + chip(pathKind === 'mine', 'data-wp="mine"', t('lnPathMine')))}
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
    return `<details class="ln-pal" ${chs.includes(nowCh) || (!nowCh && p.num === 1) ? 'open' : ''}><summary><b>${esc(p.name)}</b> <span class="muted">· ${esc(enN(p.name, p.nameEn))} · ${chs.reduce((s, c) => s + popc((Ls.ch[c] || 0) & shares[c]), 0)}/${chs.reduce((s, c) => s + popc(shares[c]), 0)}</span></summary>
      ${p.iyals.map(iy => { const cs = iy.chapters.filter(c => shares[c]); return cs.length ? `<div class="muted ln-iyal">${esc(iy.name)} · ${esc(enN(iy.name, iy.nameEn))}</div>${cs.map(c => { const y = popc(shares[c]), x = popc((Ls.ch[c] || 0) & shares[c]); const z = chNs(c).filter(n => (shares[c] >> ((n - 1) % 10) & 1) && learnHas(n) && learnFirm(n)).length; const star = S.test && S.test['ch-' + c] && S.test['ch-' + c].passed;
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

// ───────────────────────────── தேர்வுப் பயிற்சி · exam practice ─────────────────────────────
// School-exam analysis drills (grammar, sandhi, metre, rhyme, அணி) over data/ex.json, which
// build/build_exam.py writes. Every eligibility decision is made at build time; this block only
// samples, renders and grades. Each item is re-resolved against the loaded ch/gr files before it
// is shown (exItem, the stale guard) and is skipped, never graded, on any mismatch. Mastery is a
// day-close Leitner per skill with false alarms (exMark). The module is read-only toward S.srs,
// S.memorised, S.learn and S.test: a grammar answer is not evidence of recall.
const EX = { tok: 0, busy: false, t: 0, warned: false, start: null, bank: null, bankP: null, day: 0, note: '', gloss: null };
const EX_N = 10, EX_FLOOR = 30, EX_SKILL_MIN = 20;
const EX_TOPICS = [{ t: 'sv', g: 'gram', lv: 1 }, { t: 'pv', g: 'gram', lv: 1 }, { t: 'pr', g: 'word', lv: 1 }, { t: 'td', g: 'metre', lv: 1 },
  { t: 'ec', g: 'gram', lv: 2 }, { t: 'tp', g: 'gram', lv: 2 }, { t: 'vt', g: 'gram', lv: 2 }, { t: 'sr', g: 'metre', lv: 2 }, { t: 'th', g: 'metre', lv: 2 },
  { t: 'vm', g: 'gram', lv: 3 }, { t: 'tg', g: 'gram', lv: 3 }, { t: 'an', g: 'ani', lv: 3 }, { t: 'al', g: 'metre', lv: 3 }, { t: 'sl', g: 'word', lv: 0 }];   // editable, pending CICT sign-off
const EX_GROUPS = [['exGrpGram', ['sv', 'pv', 'ec', 'vm', 'tp', 'vt', 'tg']], ['exGrpWord', ['pr']], ['exGrpMetre', ['td', 'sr', 'th', 'al']], ['exGrpAni', ['an']]];
const EX_ORD = { 1: ['முதல்', 'nominative'], 2: ['இரண்டாம்', 'accusative'], 3: ['மூன்றாம்', 'instrumental'], 4: ['நான்காம்', 'dative'], 5: ['ஐந்தாம்', 'ablative'], 6: ['ஆறாம்', 'genitive'], 7: ['ஏழாம்', 'locative'], 8: ['எட்டாம்', 'vocative'] };
const EXN = {
  cat: { 'பெயர்': ['பெயர்ச்சொல்', 'noun'], 'வினை': ['வினைச்சொல்', 'verb'], 'இடை': ['இடைச்சொல்', 'particle'], 'உரி': ['உரிச்சொல்', 'qualifier'] },
  pv: { 'பொருட்பெயர்': ['பொருட்பெயர்', 'noun of thing'], 'இடப்பெயர்': ['இடப்பெயர்', 'noun of place'], 'காலப்பெயர்': ['காலப்பெயர்', 'noun of time'], 'சினைப்பெயர்': ['சினைப்பெயர்', 'noun of part'], 'பண்புப்பெயர்': ['பண்புப்பெயர்', 'noun of quality'], 'தொழிற்பெயர்': ['தொழிற்பெயர்', 'noun of action'] },
  ec: { 'பெயரெச்சம்': ['பெயரெச்சம்', 'adjectival participle'], 'வினையெச்சம்': ['வினையெச்சம்', 'adverbial participle'], 'எதிர்மறைபெயரெச்சம்': ['எதிர்மறைப் பெயரெச்சம்', 'negative adjectival participle'], 'எதிர்மறைவினையெச்சம்': ['எதிர்மறை வினையெச்சம்', 'negative adverbial participle'] },
  vm: { 'தெரிநிலைவினைமுற்று': ['தெரிநிலை வினைமுற்று', 'finite verb (tense shown)'], 'குறிப்புவினைமுற்று': ['குறிப்பு வினைமுற்று', 'finite verb (tense implied)'], 'எதிர்மறைவினைமுற்று': ['எதிர்மறை வினைமுற்று', 'negative finite verb'], 'வியங்கோள்வினைமுற்று': ['வியங்கோள் வினைமுற்று', 'optative'], 'வினையாலணையும்பெயர்': ['வினையாலணையும் பெயர்', 'participial noun'], 'தொழிற்பெயர்': ['தொழிற்பெயர்', 'verbal noun'] },
  ti: { 'உயர்திணை': ['உயர்திணை', 'rational class'], 'அஃறிணை': ['அஃறிணை', 'non-rational class'] },
  pa: { 'ஆண்பால்': ['ஆண்பால்', 'masculine'], 'பெண்பால்': ['பெண்பால்', 'feminine'], 'பலர்பால்': ['பலர்பால்', 'rational plural'], 'ஒன்றன்பால்': ['ஒன்றன்பால்', 'neuter singular'], 'பலவின்பால்': ['பலவின்பால்', 'neuter plural'] },
  en: { 'ஒருமை': ['ஒருமை', 'singular'], 'பன்மை': ['பன்மை', 'plural'] },
  id: { 'தன்மை': ['தன்மை', 'first person'], 'முன்னிலை': ['முன்னிலை', 'second person'], 'படர்க்கை': ['படர்க்கை', 'third person'] },
  vt: Object.fromEntries([2, 3, 4, 5, 6, 7].map(n => [n, [EX_ORD[n][0] + ' வேற்றுமை', EX_ORD[n][1]]])),
  tg: { 'வேற்றுமைத்தொகை': ['வேற்றுமைத் தொகை', 'case compound'], 'வினைத்தொகை': ['வினைத் தொகை', 'verbal compound'], 'பண்புத்தொகை': ['பண்புத் தொகை', 'quality compound'], 'உவமைத்தொகை': ['உவமைத் தொகை', 'simile compound'], 'உம்மைத்தொகை': ['உம்மைத் தொகை', 'conjunctive compound'], 'அன்மொழித்தொகை': ['அன்மொழித் தொகை', 'exocentric compound'] },
  an: { 'உவமை': ['உவமை அணி', 'simile'], 'எடுத்துக்காட்டுவமை': ['எடுத்துக்காட்டு உவமை அணி', 'illustrative simile'], 'உருவகம்': ['உருவக அணி', 'metaphor'] },
  vp: { 'தேமா': ['தேமா', 'tēmā'], 'புளிமா': ['புளிமா', 'puḷimā'], 'கூவிளம்': ['கூவிளம்', 'kūviḷam'], 'கருவிளம்': ['கருவிளம்', 'karuviḷam'], 'தேமாங்காய்': ['தேமாங்காய்', 'tēmāṅkāy'], 'புளிமாங்காய்': ['புளிமாங்காய்', 'puḷimāṅkāy'], 'கூவிளங்காய்': ['கூவிளங்காய்', 'kūviḷaṅkāy'], 'கருவிளங்காய்': ['கருவிளங்காய்', 'karuviḷaṅkāy'] },
  fn: { 'நாள்': ['நாள்', 'nāḷ'], 'மலர்': ['மலர்', 'malar'], 'காசு': ['காசு', 'kācu'], 'பிறப்பு': ['பிறப்பு', 'piṟappu'] },
  th: { 'இயற்சீர் வெண்டளை': ['இயற்சீர் வெண்டளை', 'iyaṟcīr veṇṭaḷai'], 'வெண்சீர் வெண்டளை': ['வெண்சீர் வெண்டளை', 'veṇcīr veṇṭaḷai'], 'நேரொன்றிய ஆசிரியத்தளை': ['நேரொன்றிய ஆசிரியத்தளை', 'nēroṉṟiya āciriyattaḷai'], 'நிரையொன்றிய ஆசிரியத்தளை': ['நிரையொன்றிய ஆசிரியத்தளை', 'niraiyoṉṟiya āciriyattaḷai'], 'கலித்தளை': ['கலித்தளை', 'kalittaḷai'] },
};
const EX_DEF = {
  'வேற்றுமைத்தொகை': { ta: 'வேற்றுமை உருபு மறைந்து வரும் தொகைநிலைத் தொடர் வேற்றுமைத் தொகை (எ.கா. தமிழ்கற்றான் = தமிழைக் கற்றான் — இரண்டாம் வேற்றுமைத் தொகை).', en: 'Case compound: a compound in which the case ending is dropped (e.g. tamiḻkaṟṟāṉ = tamiḻaik kaṟṟāṉ, “he learnt Tamil” — accusative).' },   // EX-COPY-17
  'உவமை': { ta: 'போல, அன்ன, அனைய, ஒப்ப முதலிய உவம உருபு வெளிப்படையாக வந்து, ஒன்றை மற்றொன்றோடு ஒப்பிடுவது உவமை அணி.', en: 'Simile: one thing is compared with another through an explicit word of comparison such as pōla, aṉṉa, aṉaiya or oppa.' },
  'எடுத்துக்காட்டுவமை': { ta: 'உவமையும் பொருளும் தனித்தனி வாக்கியங்களாக வர, இடையே உவம உருபு மறைந்து வருவது எடுத்துக்காட்டு உவமை அணி.', en: 'Illustrative simile: the comparison and the point compared are stated as two separate sentences, with no word of comparison between them.' },
  'உருவகம்': { ta: 'உவமையையும் பொருளையும் வேறுபாடின்றி ஒன்றாக்கி, பொருளையே உவமையாகக் கூறுவது உருவக அணி.', en: 'Metaphor: the thing and what it is compared to are fused, so the thing is spoken of as the other.' },
  'பண்புத்தொகை': { ta: 'பண்புப் பெயருக்கும் அது தழுவும் பெயருக்கும் இடையே “மை” விகுதியும் “ஆகிய, ஆன” என்னும் உருபும் மறைந்து வருவது பண்புத் தொகை (எ.கா. செந்தாமரை = செம்மையான தாமரை).', en: 'Quality compound: the -mai suffix and the linking ākiya/āṉa between a quality and the noun it qualifies are dropped (e.g. centāmarai = cemmaiyāṉa tāmarai, “red lotus”).' },
  'வினையாலணையும்பெயர்': { ta: 'வினைமுற்று, வினையைச் செய்தவரைக் குறிக்கும் பெயராக நின்று வேற்றுமை ஏற்பது வினையாலணையும் பெயர் (எ.கா. “சென்றானைக் கண்டேன்” — சென்றானை).', en: 'Participial noun: a finite-verb form used as a noun for the doer, able to take case endings (e.g. ceṉṟāṉai in “ceṉṟāṉaik kaṇṭēṉ”, “I saw the one who went”).' },
};
const VET_MEAN = { 2: ['செயப்படுபொருள்', 'object'], 3: ['கருவி · கருத்தா · உடனிகழ்ச்சி', 'instrument, agent, association'], 4: ['கொடை · நோக்கம் (பொருட்டு)', 'giving, purpose'], 5: ['நீங்கல் · ஒப்பு · எல்லை · ஏது', 'separation, comparison, limit, cause'], 6: ['உடைமை', 'possession'], 7: ['இடம்', 'location'] };
const ANI_CANON = { 'உருவகம': 'உருவகம்', 'வினாஅணி': 'வினா', 'வினா-விடை': 'வினா', 'இயைபு/ஒலிநயம': 'இயைபு/ஒலிநயம்' };
const ANI_OTHER = new Set(['இயைபு/ஒலிநயம்', 'இயைபு', 'ஒலிநயம்', 'அன்மொழித்தொகை', 'உவமைத்தொகை', 'உம்மைத்தொகை', 'அடுக்குத்தொடர்', 'எண்ணு', 'குறிப்பு', 'வேற்றுமை அணி/முரண்', 'வஞ்சப்புகழ்ச்சி/முரண்']);
const VET_CANON = { '3 · கருவி': '3 · கருவி/உடன்', '3 · உடன்': '3 · கருவி/உடன்', '5 · ஒப்பு': '5 · நீங்கல்/ஒப்பு' };
const VET_OTHER = new Set(['4 · கருவி/உடன்']);
const EX_VP = { NN: 'தேமா', IN: 'புளிமா', NI: 'கூவிளம்', II: 'கருவிளம்', NNN: 'தேமாங்காய்', INN: 'புளிமாங்காய்', NIN: 'கூவிளங்காய்', IIN: 'கருவிளங்காய்' };
const EX_BOX = [0, 1, 2, 4, 7, 15];
const EX_SUPER = { 'எதிர்மறைவினையெச்சம்': 'வினையெச்சம்', 'எதிர்மறைபெயரெச்சம்': 'பெயரெச்சம்' };   // right, but not the complete note

function exDef() {   // hoisted declaration, literals only (no TDZ at boot)
  return { v: 1, lv: null, src: 'mine', sk: {}, w: {}, miss: [], rec: [], off: [], cur: null, last: null, hist: { n: 0, q: 0, r: 0, days: 0, last: 0 } };
}
const exToday = () => EX.day || learnDay();
const exOnGo = () => location.hash.startsWith('#/exam/go');
const exF = (key, obj) => fmt(t(key), obj || {});
const exE = (key, obj) => { const o = {}; for (const k in obj || {}) o[k] = esc(obj[k]); return exF(key, o); };   // escaped values, trusted template
const exTa = s => (String(s || '').normalize('NFC').match(/[஀-௿]+/g) || []).join('');
const exGra = s => exTa(s).match(/[ஃஅ-ஹ][ா-்ௗ]*/g) || [];
const exGlen = s => (String(s).match(/[஀-௿][ா-்ௗ]*|./gu) || []).length;
const exBits = m => { const o = []; for (let i = 0; m >> i; i++) if ((m >> i) & 1) o.push(i); return o; };
const exPop = m => exBits(m).length;
const exFp = s => fnv1a(tWord(s)) & 0xffff;
const exCf = x => Math.round((x || 0) * 100);
const exBase = c => String(c).replace(/^s[an]:/, 'sr:');
const exK = n => { const c = D.ch[chOf(n)]; return c ? c.kurals[(n - 1) % 10] : null; };
const exG = n => { const g = D.gr[chOf(n)]; return g && g.kurals ? g.kurals[String(n)] || null : null; };
const exToks = k => [...k.l1.split(/\s+/), ...k.l2.split(/\s+/)].filter(Boolean);
const exWordOf = (g, w) => stripPunct(g.words[w].w);
const exSl = gl => String(gl || '').replace(/\(.*?\)|\[.*?\]/g, '').replace(/\s+/g, ' ').replace(/^[\s,;]+|[\s,;]+$/g, '');
function exLabel(type, raw) {
  if (type === 'ilakkanam') type = ['pv', 'ec', 'vm'].find(s => EXN[s][raw]) || '';
  else if (type === 'category') type = 'cat';
  else if (type === 'togai') type = 'tg';
  else if (type === 'vetrumai') {
    const m = /^(\d) · (.+)$/.exec(String(raw)); const o = m && EX_ORD[m[1]];
    if (!o || VET_OTHER.has(raw)) return String(raw);
    return `${o[0]} வேற்றுமை · ${m[2]}${S.ui === 'en' ? ' · ' + o[1] : S.ui === 'hi' && HI.ord[m[1]] ? ' · ' + HI.ord[m[1]] : ''}`;
  }
  const e = EXN[type] && EXN[type][raw];
  if (!e) return String(raw);
  if (S.ui === 'hi') { const h = HI.exn[type + ':' + raw]; return h ? `${e[0]} · ${h}` : e[0]; }
  return S.ui === 'en' && e[1] ? `${e[0]} · ${e[1]}` : e[0];
}
function exDefn(raw) {
  const d = EX_DEF[raw] || (EX.gloss && EX.gloss.terms && EX.gloss.terms[raw]);
  return d ? (S.ui === 'ta' ? d.ta : S.ui === 'hi' ? ((EX_DEF[raw] ? HI.exdef[raw] : hiGloss(raw)) || d.en) : d.en) : '';
}
function exSave() { try { localStorage.setItem('kural.settings', JSON.stringify(S)); } catch (e) { if (!EX.warned) { EX.warned = true; toast(t('exNoSave'), 4000); } } }
function exSaveAll() { try { saveS(); } catch (e) { exSave(); } }
function exEnsure() { if (!S.ex) S.ex = exDef(); return S.ex; }
function exNorm(o) {   // ST-11: a stored ex with a missing or wrong-typed field must not break the Practice tab
  const x = Object.assign(exDef(), o && typeof o === 'object' ? o : {});
  const obj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  if (!obj(x.sk)) x.sk = {}; if (!obj(x.w)) x.w = {};
  for (const k of ['miss', 'rec', 'off']) if (!Array.isArray(x[k])) x[k] = [];
  if (!obj(x.hist)) x.hist = exDef().hist; else for (const k of ['n', 'q', 'r', 'days', 'last']) if (typeof x.hist[k] !== 'number') x.hist[k] = 0;
  if (x.cur && !(Array.isArray(x.cur.ids) && typeof x.cur.i === 'number' && Array.isArray(x.cur.a) && x.cur.b0 && typeof x.cur.b0 === 'object')) x.cur = null;
  if (x.last && !(Array.isArray(x.last.items) && Array.isArray(x.last.up) && Array.isArray(x.last.dn))) x.last = null;
  if (![null, 0, 1, 2, 3].includes(x.lv)) x.lv = null;
  if (typeof x.src !== 'string') x.src = 'mine';
  return x;
}

// ── mastery: day-close Leitner with false alarms ──
function exClose(tp, today) {
  if (tp[1] < today && tp[3] + tp[4] > 0) {
    const acc = tp[2] / (tp[3] + tp[4]);
    if (tp[3] > 0 && acc >= 0.8) tp[0] = Math.min(5, tp[0] + 1); else if (acc < 0.5) tp[0] = Math.max(0, tp[0] - 1);
    tp[2] = tp[3] = tp[4] = 0; tp[1] = today;
  }
  return tp;
}
function exEff(x, today) {   // x: a skill name or a tuple; today's provisional progress counts
  const tp = typeof x === 'string' ? (S.ex && S.ex.sk[x]) : x;
  if (!tp) return 0;
  return exClose(tp.slice(), (today || exToday()) + 1)[0];
}
function exMark(skill, kind) {
  const today = exToday(); const sk = exEnsure().sk;
  const tp = exClose(sk[skill] || [0, today, 0, 0, 0, 0, 0], today); tp[1] = today;
  if (kind === 'hit') { tp[3]++; tp[2]++; tp[5]++; tp[6]++; } else if (kind === 'miss') { tp[3]++; tp[5]++; } else tp[4]++;
  sk[skill] = tp;
}
function exDue(skill) { const tp = S.ex && S.ex.sk[skill]; if (!tp) return true; return exToday() - tp[1] >= EX_BOX[exEff(skill)]; }
const exWeak = skill => { const tp = S.ex && S.ex.sk[skill]; return !!tp && exEff(skill) < 2; };
function exWord(form, ok) {
  const today = exToday(); const w = exEnsure().w; const r = w[form] || [0, today, 0];
  if (r[1] < today) { if (r[2] === 1) r[0]++; else if (r[2] === -1) r[0] = 0; r[2] = 0; r[1] = today; }
  if (ok) { if (r[2] === 0) r[2] = 1; } else r[2] = -1;
  w[form] = r;
}
const exWordEff = form => { const r = S.ex && S.ex.w[form]; if (!r) return 0; return r[2] === -1 ? 0 : r[0] + (r[2] === 1 ? 1 : 0); };

// ── the bank ──
async function exBank() {
  if (EX.bank) return EX.bank;
  if (!EX.bankP) EX.bankP = getJSON('data/ex.json').then(j => (EX.bank = exIndex(j))).catch(e => { console.warn('ex.json', e); EX.bankP = null; return null; });
  return EX.bankP;
}
function exIndex(j) {
  const s = j.sets, I = j.items, doff = new Set(j.doff || []);
  const B = { rev: j.rev, sets: s, off: new Set((j.off || []).map(exBase)), doff, corr: new Set(j.corr || []), row: {}, mt: {}, E: [], fd: {}, byN: new Map(), cnt: { 70: {}, 80: {} }, skc: { 70: {}, 80: {} }, tsk: {} };
  const add = (c, tp, n, sk, cf, x) => {
    const e = { c, t: tp, n, sk, cf, x }; B.E.push(e);
    (B.byN.get(n) || B.byN.set(n, []).get(n)).push(e);
    (B.tsk[tp] ||= new Set()).add(sk);
    for (const th of [70, 80]) if (cf >= th) { B.cnt[th][tp] = (B.cnt[th][tp] || 0) + 1; B.skc[th][sk] = (B.skc[th][sk] || 0) + 1; }
  };
  const W = (d, f) => { if (doff.has(d)) return; (I[d] || []).forEach(f); };
  W('sv', r => { const c = `sv:${r[0]}.${r[1]}.${r[2]}`; B.row[c] = r; add(c, 'sv', r[0], 'cat:' + s.cat[r[3]], r[4]); });
  W('pv', r => { const c = `pv:${r[0]}.${r[1]}.${r[2]}`; B.row[c] = r; add(c, 'pv', r[0], 'ilk:' + s.pv[r[3]], r[4]); });
  W('ec', r => { const c = `ec:${r[0]}.${r[1]}.${r[2]}`; B.row[c] = r; add(c, 'ec', r[0], 'ilk:' + s.ec[r[3]], r[4], 'e' + r[3]); });
  W('vm', r => { const c = `vm:${r[0]}.${r[1]}.${r[2]}`; B.row[c] = r; add(c, 'vm', r[0], 'ilk:' + s.vm[r[3]], r[4], 'v' + r[3]); });
  W('fd', r => { const c = `fd:${r[0]}.${r[1]}${r[2]}`; B.row[c] = r; (B.fd[r[1] + r[2]] ||= []).push({ c, t: r[1] === 'e' ? 'ec' : 'vm', n: r[0], sk: 'ilk:' + (r[1] === 'e' ? s.ec : s.vm)[r[2]], cf: r[3] }); });
  W('tp', r => { const c = `tp:${r[0]}.${r[1]}.${r[2]}`; B.row[c] = r; add(c, 'tp', r[0], 'pa:' + s.pa[r[4]], r[7]); });
  W('vt', r => { const c = `vt:${r[0]}.${r[1]}`; B.row[c] = r; add(c, 'vt', r[0], 'vt:' + s.vt[r[2]], r[3]); });
  W('tg', r => { const c = `tg:${r[0]}.${r[1]}`; B.row[c] = r; add(c, 'tg', r[0], 'tg:' + s.tg[r[2]], r[3]); });
  W('pr', r => { const c = `pr:${r[0]}.${r[1]}`; B.row[c] = r; add(c, 'pr', r[0], 'pr', r[2]); });
  W('an', r => { const c = `an:${r[0]}`; B.row[c] = r; add(c, 'an', r[0], 'an:' + s.an[r[1]], 100); });
  W('sl', r => { const c = `sl:${r[0]}.${r[1]}.${r[2]}`; B.row[c] = r; add(c, 'sl', r[0], 'sl', r[3]); });
  W('td', r => { if (doff.has('td_' + r[2])) return; const c = `td:${r[0]}.${r[1]}.${r[2]}`; B.row[c] = r; add(c, 'td', r[0], 'td:' + r[2], 100); });
  (I.mt || []).forEach(r => {
    const n = r[0]; B.mt[n] = r; const ai = r[3];
    if (!(doff.has('sa') && doff.has('sn'))) for (let i = 0; i < 6; i++) if (!((ai >> i) & 1)) add(`sr:${n}.${i}`, 'sr', n, 'vp:' + s.vp[+r[1][i]], 100);
    if (!doff.has('sf') && !((ai >> 6) & 1)) add(`sf:${n}`, 'sr', n, 'fn:' + s.fn[+r[1][6]], 100);
    if (!doff.has('th')) for (let j = 0; j < 6; j++) add(`th:${n}.${j}`, 'th', n, 'th:' + s.th[+r[2][j]], 100);
    if (!doff.has('al') && ai === 0) add(`al:${n}`, 'al', n, 'fn:' + s.fn[+r[1][6]], 100);
  });
  return B;
}
const exThr = lv => lv === 0 ? 70 : 80;
function exTopicsAt(lv) { return EX_TOPICS.filter(x => x.t !== 'sl' && (lv === 0 || lv == null || x.lv <= lv)); }
function exTopicStats(topic, lv) {
  const B = EX.bank, thr = exThr(lv); const n = (B && B.cnt[thr][topic]) || 0;
  const sks = [...((B && B.tsk[topic]) || [])].filter(sk => (B.skc[thr][sk] || 0) >= EX_SKILL_MIN);
  const effs = sks.map(sk => exEff(sk));
  return { n, b: sks.length, a: effs.filter(e => e >= 4).length, bar: effs.length ? effs.reduce((p, e) => p + e / 5, 0) / effs.length : 0 };
}
function exMineSet() {
  const set = new Set([...(S.learn && S.learn.ch ? learnIntroduced() : []), ...Object.keys(S.srs).map(Number), ...S.memorised]);
  return [...set].filter(n => n >= 1 && n <= 1330).sort((a, b) => a - b);
}
const exTodayOk = () => !!(S.learn && S.learn.last && S.learn.last.d === learnDay() && S.learn.last.ns && S.learn.last.ns.length);
function exSources(src) {
  let ns = [], fallback = false; const s = String(src || 'mine'); let m;
  if (s === 'mine') ns = exMineSet();
  else if (s === 'today') ns = exTodayOk() ? S.learn.last.ns.slice() : [];
  else if ((m = /^k-(\d+)$/.exec(s))) ns = +m[1] >= 1 && +m[1] <= 1330 ? [+m[1]] : [];
  else if (s === 'miss') ns = [...new Set(S.ex.miss.map(c => +c.split(':')[1].split('.')[0]))];
  else { const R = testRange(s); ns = R ? R.ns.slice() : []; }
  if (!s.startsWith('k-')) ns = ns.filter(n => !(S.srs[n] && S.srs[n].due <= learnDueDay()));   // a pending recall review is never spoiled
  return { ns, name: s, fallback };
}
async function exLoad(chs, needGr, ms) {   // loaded keys 'c12' / 'g12', within ms
  const ok = new Set(); const jobs = [];
  for (const c of chs) {
    if (D.ch[c]) ok.add('c' + c); else jobs.push(chapter(c).then(() => ok.add('c' + c)));
    if (needGr.has(c)) { if (D.gr[c]) ok.add('g' + c); else jobs.push(grammar(c).then(() => ok.add('g' + c))); }
  }
  if (jobs.length) await Promise.race([Promise.allSettled(jobs), new Promise(r => setTimeout(r, ms))]);
  return ok;
}
const exNeedGr = code => !/^(sa|sn|sf|th|al|td):/.test(code);

// ── session composition ──
async function exBuild(start, tok) {
  const B = EX.bank; const X = S.ex; const lv = X.lv; const thr = exThr(lv); const today = exToday();
  const stale = () => tok !== EX.tok || !exOnGo();
  const t0 = start.t || ''; let src = start.src || X.src || 'mine';
  if (src === 'today' && !exTodayOk()) src = 'mine';
  let topics = t0 === 'sl' ? ['sl'] : exTopicsAt(lv).map(x => x.t);
  if (t0 && t0 !== 'sl') topics = topics.filter(x => x === t0);
  if (!t0 && (S.ui === 'en' || lv === 0)) topics.push('sl');
  topics = topics.filter(x => (B.cnt[thr][x] || 0) >= EX_FLOOR);
  if (!topics.length && src !== 'miss') return { err: 'none' };
  const offB = new Set(X.off.map(exBase));
  const recent = new Map(); X.rec.forEach(([c, d]) => { if (today - d < 7) recent.set(exBase(c), d); });
  const tset = new Set(src === 'miss' ? [...EX_TOPICS.map(x => x.t), 'sl'] : topics);
  const okE = (e, NS, useRec) => tset.has(e.t) && NS.has(e.n) && e.cf >= thr && !offB.has(exBase(e.c)) && !B.off.has(exBase(e.c)) && (!start.sk || e.sk === start.sk) && (!useRec || !recent.has(exBase(e.c)));
  let S0 = exSources(src); let NS = new Set(S0.ns); EX.note = '';
  const pool = useRec => B.E.filter(e => okE(e, NS, useRec));
  let cand = src === 'miss' ? [] : pool(true);
  if (src !== 'miss' && cand.length < 10) cand = pool(false);
  if (src === 'mine' && cand.length < 20) { NS = new Set(exSources('book').ns); cand = pool(true); if (cand.length < 10) cand = pool(false); EX.note = t('exFallback'); }
  if (src !== 'miss' && cand.length < 3) return { err: 'none' };
  const seed = fnv1a(`ex|${today}|${lv}|${t0}|${src}|${X.hist.n}`); const rnd = mulberry32(seed);
  const ids = [], used = new Set(), perK = new Map(), perT = new Map(), chs = new Set(), facts = new Set();
  const factsOf = c => { const d = c.split(':')[0]; const p = c.slice(d.length + 1).split('.'); const n = +p[0];   // ST-5
    if (['sa', 'sn', 'sf', 'th', 'al', 'sr'].includes(d)) return ['m' + n];
    if (d === 'fd') { const r = B.row[c]; return r ? exBits(r[4]).map(j => `w${n}.${j}`) : []; }
    if (d === 'td') return [`t${n}.${p[1]}`]; if (d === 'an') return ['a' + n];
    return [`w${n}.${p[1]}`]; };
  const isK = src.startsWith('k-'); const mixed = !t0;
  const caps = { al: 1, th: 2, an: 2, sl: 2 };
  const fits = (c, tp, n) => {
    if (used.has(exBase(c)) || factsOf(c).some(f => facts.has(f))) return false;
    if (!isK && (perK.get(n) || 0) >= 2) return false;
    if (mixed && (perT.get(tp) || 0) >= 3) return false;
    if (mixed && caps[tp] !== undefined && (perT.get(tp) || 0) >= caps[tp]) return false;
    if (chs.size >= 6 && !chs.has(chOf(n))) return false;
    return true;
  };
  const take = (c, tp, n) => { ids.push(c); used.add(exBase(c)); factsOf(c).forEach(f => facts.add(f)); perK.set(n, (perK.get(n) || 0) + 1); perT.set(tp, (perT.get(tp) || 0) + 1); chs.add(chOf(n)); };
  const form = e => {   // mode switches, frozen into the code here
    if (e.c.startsWith('sr:')) { const sa = exEff(e.sk) < 2; return (sa && !B.doff.has('sa')) || B.doff.has('sn') ? 'sa:' + e.c.slice(3) : 'sn:' + e.c.slice(3); }
    if (e.x && exEff(e.sk) >= 3) {
      const fds = (B.fd[e.x] || []).filter(f => NS.has(f.n) && f.cf >= thr && !offB.has(f.c) && !B.off.has(f.c) && !recent.has(f.c) && fits(f.c, e.t, f.n));
      if (fds.length) { const f = fds[Math.floor(rnd() * fds.length)]; return { c: f.c, n: f.n }; }
    }
    return e.c;
  };
  // 1. earlier mistakes
  const missV = X.miss.filter(c => { const e = exEntry(c); if (!e || !tset.has(e.t) || e.cf < thr || offB.has(exBase(c)) || B.off.has(exBase(c))) return false; if (S.srs[e.n] && S.srs[e.n].due <= learnDueDay() && !isK) return false; if (src === 'miss') return true; const d = recent.get(exBase(c)); return (d === undefined || d < today) && NS.has(e.n); });
  for (const c of (src === 'miss' ? missV : missV.slice(-3))) { const e = exEntry(c); if (ids.length < EX_N && fits(c, e.t, e.n)) take(c, e.t, e.n); }
  // 2. weighted topics → skills → items
  const bySk = {}; for (const e of cand) ((bySk[e.t] ||= {})[e.sk] ||= []).push(e);
  const wpick = (arr, wf) => { const ws = arr.map(wf); const tot = ws.reduce((a, b) => a + b, 0); if (tot <= 0) return null; let r = rnd() * tot; for (let i = 0; i < arr.length; i++) { r -= ws[i]; if (r <= 0) return arr[i]; } return arr[arr.length - 1]; };
  let guard = 0;
  while (src !== 'miss' && ids.length < EX_N && guard++ < 400) {
    const tl = Object.keys(bySk).filter(tp => Object.values(bySk[tp]).some(a => a.some(e => fits(e.c, e.t, e.n))));
    if (!tl.length) break;
    const skOf = tp => Object.keys(bySk[tp]).filter(sk => bySk[tp][sk].some(e => fits(e.c, e.t, e.n)));
    const tp = wpick(tl, x => { const sks = skOf(x); return 1 + sks.filter(exDue).length + 0.5 * sks.filter(exWeak).length; });
    const sk = wpick(skOf(tp), x => (6 - exEff(x)) * (exDue(x) ? 2 : 1));
    const e = wpick(bySk[tp][sk].filter(x => fits(x.c, x.t, x.n)), x => (D.ch[chOf(x.n)] && (!exNeedGr(x.c) || D.gr[chOf(x.n)])) ? 2 : 1);
    if (!e) continue;
    const f = form(e);
    if (typeof f === 'string') take(f, e.t, e.n); else take(f.c, e.t, f.n);
  }
  if (!ids.length) return { err: 'none' };
  // 3. order: no two neighbours share a topic where avoidable; al second to last
  const topicOf = c => (exEntry(c) || {}).t || c.split(':')[0];
  const rest = ids.filter(c => !c.startsWith('al:')); const al = ids.filter(c => c.startsWith('al:'));
  const ord = []; while (rest.length) { const last = ord.length ? topicOf(ord[ord.length - 1]) : ''; let i = rest.findIndex(c => topicOf(c) !== last); if (i < 0) i = 0; ord.push(rest.splice(i, 1)[0]); }
  if (al.length) ord.splice(Math.max(0, ord.length - 1), 0, ...al);
  // 4. load, then the stale guard on every item
  const nOf = c => exEntry(c).n;
  const chl = [...new Set(ord.map(c => chOf(nOf(c))))]; const needGr = new Set(ord.filter(exNeedGr).map(c => chOf(nOf(c))));
  const got = await exLoad(chl, needGr, 2500);
  if (stale()) return { err: 'stale' };
  const fin = ord.filter(c => { const ch = chOf(nOf(c)); return got.has('c' + ch) && (!exNeedGr(c) || got.has('g' + ch)) && exItem(c, 0, seed); });
  if (fin.length < (src === 'miss' ? 1 : 3)) return { err: got.size < chl.length + needGr.size ? 'nc' : 'none' };
  if (fin.length < EX_N && !EX.note && src !== 'miss') EX.note = fmt(t('exShort'), { n: fin.length });
  const b0 = {}; fin.forEach(c => { const e = exEntry(c); if (e && e.sk) b0[e.sk] = exEff(e.sk); });
  return { key: exKey(lv, t0, start.src || X.src || 'mine', start.sk), d: today, rev: B.rev, lv, t: t0, src, sk: start.sk || '', seed, ids: fin, i: 0, a: [], b0 };   // ST-3: exGo installs it
}
const exKey = (lv, tp, src, sk) => `${lv}|${tp || ''}|${src || ''}|${sk || ''}`;
function exEntry(code) {   // {t, n, sk, cf} for any code, including the frozen forms
  const B = EX.bank; if (!B) return null;
  const d = code.split(':')[0]; const rest = code.slice(d.length + 1); const n = +rest.split('.')[0];
  if (d === 'fd') { const r = B.row[code]; if (!r) return null; return { t: r[1] === 'e' ? 'ec' : 'vm', n, sk: 'ilk:' + (r[1] === 'e' ? B.sets.ec : B.sets.vm)[r[2]], cf: r[3] }; }
  if (d === 'sa' || d === 'sn') { const r = B.mt[n]; const s = +rest.split('.')[1]; if (!r || !(s >= 0 && s < 6)) return null; return { t: 'sr', n, sk: 'vp:' + B.sets.vp[+r[1][s]], cf: 100 }; }
  const e = (B.byN.get(n) || []).find(x => x.c === code);
  return e || null;
}

// ── the stale guard + option generation ──
function exItem(code, i = 0, seed) {
  const B = EX.bank; if (!B || !code) return null;
  const X = exEnsure(); const base = exBase(code);
  if (B.off.has(base) || X.off.some(c => exBase(c) === base)) return null;
  const d = code.split(':')[0]; const parts = code.slice(d.length + 1).split('.'); const n = +parts[0];
  if (B.doff.has(d)) return null;
  const k = exK(n); if (!k) return null;
  const rnd = mulberry32(fnv1a((seed !== undefined ? seed : (X.cur ? X.cur.seed : 0)) + '|' + i));
  const s = B.sets; const toks = exToks(k);
  const ent = exEntry(code); if (!ent) return null;
  const it = { code, d, n, k, i, eng: 'mcq', cf: null, conf: 'word', t: ent.t };
  const sub = (pool, cnt) => pick(pool, Math.min(cnt, pool.length), rnd);
  // pv, ec and vm show their whole closed set in textbook order, whatever the key: with only the safe distractors the
  // number and mix of options gave the answer away. An option that is not provably wrong for this form (a soft-boundary
  // twin, the positive of a negative key, a tag the form carries elsewhere) is marked part: picking it is neither right nor wrong.
  const full = (set, type, keyI, allow, skp) => { it.opts = set.map((v, j) => ({ v, lab: exLabel(type, v), sk: skp + v, part: j !== keyI && !allow.includes(j) ? 1 : 0 })); it.ans = keyI; };
  const mcq = (set, type, keyI, others, skp) => { const idx = [keyI, ...others].sort((a, b) => a - b); it.opts = idx.map(j => ({ v: set[j], lab: exLabel(type, set[j]), sk: skp ? skp + set[j] : null })); it.ans = idx.indexOf(keyI); };
  if (['sv', 'pv', 'ec', 'vm', 'tp', 'sl'].includes(d)) {
    const r = B.row[code]; const g = exG(n); if (!r || !g || !g.words || g.words.length !== toks.length) return null;
    const w = +parts[1], ci = +parts[2]; const wd = g.words[w]; const c = wd && wd.c[ci]; if (!c) return null;
    const cf = d === 'tp' ? r[7] : r[d === 'sl' ? 3 : 4], fp = d === 'tp' ? r[8] : r[d === 'sl' ? 4 : 5];
    if (exCf(c.conf) !== cf || exFp(c.s) !== fp || tWord(wd.w) !== tWord(toks[w])) return null;
    Object.assign(it, { g, w, c, cf, word: d === 'sl' && wd.c.length > 1 ? stripPunct(c.s) : stripPunct(wd.w), mark: w, rpType: 'grammar', skill: null });
    if (d === 'sv') { if (c.cat !== s.cat[r[3]]) return null; mcq(s.cat, 'cat', r[3], [0, 1, 2, 3].filter(j => j !== r[3]), 'cat:'); it.key = s.cat[r[3]]; }
    else if (d === 'pv' || d === 'ec') { const set = s[d]; if (c.ilk !== set[r[3]]) return null; full(set, d, r[3], exBits(r[6]), 'ilk:'); it.key = set[r[3]]; }
    else if (d === 'vm') { if (c.ilk !== s.vm[r[3]]) return null; full(s.vm, 'vm', r[3], exBits(r[6] | (r[4] >= 80 ? r[7] : 0)), 'ilk:'); it.key = s.vm[r[3]]; }
    else if (d === 'tp') {
      const f = c.feat || {}; if (f.thinai !== s.ti[r[3]] || f.paal !== s.pa[r[4]] || f.eN !== s.en[r[5]] || (f.idam && f.idam !== s.id[r[6]])) return null;
      it.eng = 'rows'; it.vik = r[9]; it.key = s.pa[r[4]];
      const row = (h, set, type, keyI, skp, skOk) => ({ h, ans: keyI, opts: set.map(v => ({ v, lab: exLabel(type, v), sk: skp && skOk(v) ? skp + v : null })) });
      it.rows = [row(t('exRowThinai'), s.ti, 'ti', r[3], 'ti:', () => true), row(t('exRowPaal'), s.pa, 'pa', r[4], 'pa:', v => v !== 'பலவின்பால்'), row(t('exRowEN'), s.en, 'en', r[5], 'en:', () => true), row(t('exRowIdam'), s.id, 'id', r[6], '', () => false)];
    } else {   // sl
      const gl = exSl(c.gloss); if (!gl) return null;
      const dis = r[5].map(p => { const pn = Math.floor(p / 100), pw = Math.floor(p / 10) % 10, pc = p % 10; if (chOf(pn) !== chOf(n)) return ''; const pg = exG(pn); const pcx = pg && pg.words[pw] && pg.words[pw].c[pc]; return pcx ? exSl(pcx.gloss) : ''; });
      if (dis.some(x => !x) || new Set([gl, ...dis]).size !== 4) return null;
      it.opts = shuffle([gl, ...dis], rnd).map(v => ({ v, lab: v, sk: null, en: 1 })); it.ans = it.opts.findIndex(o => o.v === gl);
      it.form = tWord(c.s).replace(/[கசடதபற]்$/, ''); it.key = gl; it.rpType = 'meaning';
    }
  } else if (['vt', 'tg', 'pr'].includes(d)) {
    const r = B.row[code]; const g = exG(n); if (!r || !g || !g.words || g.words.length !== toks.length) return null;
    const w = +parts[1]; const wd = g.words[w]; if (!wd || tWord(wd.w) !== tWord(toks[w])) return null;
    const cf = d === 'pr' ? r[2] : r[3], fp = d === 'pr' ? r[3] : r[4];
    if (exFp(wd.w) !== fp || exCf(Math.min(...wd.c.map(x => x.conf || 0))) !== cf) return null;
    Object.assign(it, { g, w, c: wd.c[0], cf, word: stripPunct(wd.w), mark: w, rpType: 'grammar' });
    if (d === 'vt') {
      const num = s.vt[r[2]], urw = s.urw[r[5]];
      if (!wd.c.some(x => x.vet && x.vet.number === num) || !tWord(wd.w).endsWith(urw)) return null;
      mcq(s.vt, 'vt', r[2], sub(exBits(r[6]), 3), 'vt:'); it.key = num; it.ur = s.ur[r[5]]; it.urw = urw; it.endHi = urw;
    } else if (d === 'tg') {
      if (wd.togai !== s.tg[r[2]] || wd.c.length !== 2) return null;
      mcq(s.tg, 'tg', r[2], sub([0, 1, 2, 3, 4].filter(j => j !== r[2]), 3), 'tg:'); it.key = s.tg[r[2]]; it.caseNo = r[5]; it.conf = 'parts';
    } else {
      if (wd.c.length !== 2 || tWord(wd.c[0].s) !== r[4] || tWord(wd.c[1].s) !== r[5]) return null;
      const ans = `${r[4]} + ${r[5]}`; const ds = r[7].slice(0, 2); if (ds.length < 2 || new Set([ans, ...ds]).size !== 3) return null;
      it.opts = shuffle([ans, ...ds], rnd).map((v, j) => ({ v, lab: v, sk: v === ans ? 'pr' : null })); it.ans = it.opts.findIndex(o => o.v === ans);
      Object.assign(it, { key: ans, A: r[4], B: r[5], stem: r[6], tail: r[8], nx: r[9], skill: 'pr' });
    }
  } else if (d === 'an') {
    const r = B.row[code]; const g = exG(n); if (!r || !g) return null;
    const nm = new Set((g.ani || []).map(a => ANI_CANON[a.name] || a.name)); if (nm.size !== 1 || !nm.has(s.an[r[1]])) return null;
    mcq(s.an, 'an', r[1], [0, 1, 2].filter(j => j !== r[1]), 'an:'); Object.assign(it, { g, key: s.an[r[1]], anMark: r[2], note: (g.ani[0] || {}).note || '', conf: 'none', rpType: 'grammar' });
  } else if (d === 'fd') {
    const r = B.row[code]; const g = exG(n); if (!r || !g || !g.words || g.words.length !== toks.length) return null;
    const X_ = (r[1] === 'e' ? s.ec : s.vm)[r[2]]; const tg = g.words.map((wd, j) => wd.c.some(x => x.ilk === X_) ? j : -1).filter(j => j >= 0);
    if (tg.reduce((m, j) => m | (1 << j), 0) !== r[4] || exCf(Math.min(...tg.map(j => Math.min(...g.words[j].c.map(x => x.conf || 0))))) !== r[3]) return null;
    Object.assign(it, { g, eng: 'find', cf: r[3], key: X_, set: r[1] === 'e' ? 'ec' : 'vm', tgt: new Set(tg), off: new Set(exBits(r[5])), skill: 'ilk:' + X_, rpType: 'grammar' });
    it.tiles = toks.map((w, j) => ({ w, li: j < k.l1.split(/\s+/).filter(Boolean).length ? 0 : 1, j }));
  } else if (d === 'td') {
    const r = B.row[code]; const li = +parts[1]; const line = li ? k.l2 : k.l1; const lt = line.split(/\s+/).filter(Boolean);
    if (!r || r[2] !== parts[2] || exFp(line) !== r[5] || (r[3] | r[4]) >> lt.length || (r[3] & 1) || (r[4] & 1)) return null;
    Object.assign(it, { eng: 'find', li, kind: r[2], tgt: new Set(exBits(r[3])), off: new Set(exBits(r[4])), skill: 'td:' + r[2], conf: 'rhyme', rpType: 'metre', key: '' });
    it.tiles = lt.map((w, j) => ({ w, li, j }));
  } else if (['sa', 'sn', 'sf', 'th', 'al'].includes(d)) {
    const M = exMetre(n); if (!M) return null;
    Object.assign(it, { M, conf: 'metre', cf: B.mt[n][4], rpType: 'metre' });
    const nameOpts = (s_, fin) => { if (fin) return { set: s.fn, type: 'fn', idx: [0, 1, 2, 3], keyI: s.fn.indexOf(M.fin), skp: 'fn:' }; const kv = s.vp.indexOf(M.names[s_]); const lo = kv < 4 ? [0, 1, 2, 3] : [4, 5, 6, 7], hi = kv < 4 ? [4, 5, 6, 7] : [0, 1, 2, 3]; return { set: s.vp, type: 'vp', idx: [kv, ...sub(lo.filter(j => j !== kv), 1), ...sub(hi, 2)].sort((a, b) => a - b), keyI: kv, skp: 'vp:' }; };
    const asOpts = o => ({ opts: o.idx.map(j => ({ v: o.set[j], lab: exLabel(o.type, o.set[j]), sk: o.skp + o.set[j] })), ans: o.idx.indexOf(o.keyI) });
    if (d === 'sa' || d === 'sn' || d === 'sf') {
      const f = d === 'sf' ? 6 : +parts[1]; if (!(f >= 0 && f <= 6) || ((B.mt[n][3] >> f) & 1)) return null;
      Object.assign(it, { foot: f, mark: f, word: stripPunct(M.S[f].w), key: d === 'sf' ? M.fin : M.names[f] });
      if (d === 'sa') {
        it.eng = 'rows'; it.skill = 'vp:' + M.names[f];
        it.rows = exSegs(M.S[f]).map((sg, j) => ({ h: exF('exAsaiSeg', { i: j + 1, s: sg }), ans: M.pats[f][j] === 'N' ? 0 : 1, opts: [{ v: 'N', lab: t('exNer'), sk: null }, { v: 'I', lab: t('exNirai'), sk: null }] }));
      } else Object.assign(it, asOpts(nameOpts(f, d === 'sf')));
    } else if (d === 'th') {
      const j = +parts[1]; if (!(j >= 0 && j < 6)) return null;
      const kt = s.th.indexOf(M.th[j]); const cls = exCls(M.pats[j]); const near = { 'மா': 2, 'விளம்': 3, 'காய்': 4 }[cls];
      if (kt < 0 || kt > 1 || !near) return null;
      const idx = [kt, 1 - kt, near, ...sub([2, 3, 4].filter(x => x !== near), 1)].sort((a, b) => a - b);
      it.opts = idx.map(x => ({ v: s.th[x], lab: exLabel('th', s.th[x]), sk: 'th:' + s.th[x] })); it.ans = idx.indexOf(kt);
      Object.assign(it, { j, key: M.th[j], mark: [j, j + 1], cls });
    } else {
      if (B.mt[n][3] !== 0) return null;
      it.eng = 'table'; it.key = M.fin;
      it.feet = M.S.map((sr, f) => { const o = asOpts(nameOpts(f, f === 6)); return { w: stripPunct(sr.w), opts: o.opts, ans: o.ans, name: f === 6 ? M.fin : M.names[f], sk: (f === 6 ? 'fn:' : 'vp:') + (f === 6 ? M.fin : M.names[f]) }; });
    }
  } else return null;
  exDecorate(it);
  return it;
}
function exSegs(seer) { return seer.asai.map(a => a.u.map(u => u[1]).join('')); }
function exSegHTML(seer) { return esc(exSegs(seer).join('/')); }   // neutral: letters only, no colour, no title
function exCls(pat) { if (pat.length === 2) return pat[1] === 'N' ? 'மா' : 'விளம்'; if (pat.length === 3 && pat[2] === 'N') return 'காய்'; return ''; }
function exThalai(prev, nextFirst) { const c = exCls(prev); if ((c === 'மா' && nextFirst === 'I') || (c === 'விளம்' && nextFirst === 'N')) return 'இயற்சீர் வெண்டளை'; if (c === 'காய்' && nextFirst === 'N') return 'வெண்சீர் வெண்டளை'; return ''; }
function exEetru(seer) {
  const a = seer.asai.map(x => x.k); const w = exTa(seer.w);
  if (a.length === 2 && /[கசடதபற]ு$/.test(w) && seer.asai[1].u.length === 1) return a[0] === 'N' ? 'காசு' : 'பிறப்பு';
  if (a.length === 1) return a[0] === 'N' ? 'நாள்' : 'மலர்';
  return '';
}
function exMetre(n) {   // recompute names, final and linkages from ch yappu; null on any disagreement with the bank
  const B = EX.bank, r = B && B.mt[n], k = exK(n); if (!r || !k || !k.yappu) return null;
  const y = k.yappu, L_ = y.lines || [];
  if (L_.length !== 2 || L_.some(l => l.err || !l.seers) || L_[0].seers.length !== 4 || L_[1].seers.length !== 3 || exCf(y.conf) !== r[4]) return null;
  const S_ = [...L_[0].seers, ...L_[1].seers]; const toks = exToks(k);
  if (toks.length !== 7 || S_.some((sr, i) => tWord(sr.w) !== tWord(toks[i]) || exSegs(sr).join('') !== exTa(sr.w))) return null;
  const pats = S_.map(sr => sr.asai.map(a => a.k).join(''));
  const names = pats.slice(0, 6).map(p => EX_VP[p] || '');
  if (names.some((nm, i) => !nm || nm !== B.sets.vp[+r[1][i]] || nm !== S_[i].name)) return null;
  const fin = B.sets.fn[+r[1][6]]; if (y.eetru !== fin || exEetru(S_[6]) !== fin) return null;
  const th = [L_[0].thalai[0], L_[0].thalai[1], L_[0].thalai[2], (y.boundary || [])[0], L_[1].thalai[0], L_[1].thalai[1]];
  if (th.some((x, j) => x !== B.sets.th[+r[2][j]] || exThalai(pats[j], pats[j + 1][0]) !== x)) return null;
  return { S: S_, pats, names, fin, th, y };
}
const exAsaiTxt = (M, f) => (f === 6 && (M.fin === 'காசு' || M.fin === 'பிறப்பு')) ? (M.pats[6][0] === 'N' ? 'நேர்பு' : 'நிரைபு') : M.pats[f].split('').map(x => x === 'N' ? 'நேர்' : 'நிரை').join(' ');
const exFootRow = (M, f) => `${f === 6 ? esc(stripPunct(M.S[6].w)) : exSegHTML(M.S[f])} — ${exAsaiTxt(M, f)} — ${esc(exLabel(f === 6 ? 'fn' : 'vp', f === 6 ? M.fin : M.names[f]))}`;
// the letters of the first / second grapheme, and the rhyme rules (same as build_exam.py)
const EX_SIGNV = { '': 'அ', 'ா': 'ஆ', 'ி': 'இ', 'ீ': 'ஈ', 'ு': 'உ', 'ூ': 'ஊ', 'ெ': 'எ', 'ே': 'ஏ', 'ை': 'ஐ', 'ொ': 'ஒ', 'ோ': 'ஓ', 'ௌ': 'ஔ', '்': '' };
const exCV = g => /^[அ-ஔ]/.test(g) ? ['', g[0]] : [g[0], EX_SIGNV[g.slice(1)] ?? '?'];
const EX_GRP = ['அஆஐஔ', 'இஈஎஏ', 'உஊஒஓ'];
const exSameGrp = (a, b) => a !== '?' && b !== '?' && (a === b || EX_GRP.some(s_ => s_.includes(a) && s_.includes(b)));
const exLong = v => 'ஆஈஊஏஐஓஔ'.includes(v) && v !== '';
function exRhyme(kind, a, b) {
  const ga = exGra(a), gb = exGra(b);
  if (kind === 'm') { if (!ga.length || !gb.length) return 'D'; const [c1, v1] = exCV(ga[0]), [c2, v2] = exCV(gb[0]); if (c1 === c2 && exSameGrp(v1, v2)) return 'T'; if (c1 !== c2 && ['மவ', 'தச', 'ஞந'].some(p => p.includes(c1) && p.includes(c2)) && exSameGrp(v1, v2)) return 'D'; return 'N'; }
  if (ga.length < 2 || gb.length < 2) return 'D';
  const c1 = exCV(ga[1])[0], c2 = exCV(gb[1])[0];
  if (ga[1] === gb[1]) return exLong(exCV(ga[0])[1]) === exLong(exCV(gb[0])[1]) ? 'T' : 'D';
  if (c1 === c2 || ['ணன', 'ரற', 'லளழ'].some(p => p.includes(c1) && p.includes(c2))) return 'D';
  return 'N';
}
// titles, stems, labels and the report fields of an item
function exDecorate(it) {
  const B = EX.bank, d = it.d;
  it.tt = t('exT_' + it.t);
  const labKey = d === 'td' ? 'exL_td_' + it.kind : d === 'fd' ? 'exL_find' : ['sa', 'sn', 'sf'].includes(d) ? 'exL_sr' : d === 'sl' ? 'exT_sl' : 'exL_' + d;
  it.lab = t(labKey); it.labTa = (STR.ta && STR.ta[labKey]) || '';
  it.ins = t(it.eng === 'rows' ? 'exI_rows' : d === 'pr' ? 'exI_pr' : d === 'al' ? 'exI_al' : 'exI_mcq');
  if (['sv', 'pv', 'ec', 'vm', 'tp', 'vt', 'tg', 'sl'].includes(d)) it.q = exE('exQ_' + (d === 'vm' ? 'ec' : d), { w: it.word });
  else if (d === 'pr') it.q = exE('exQ_pr', { stem: it.stem });
  else if (d === 'an') it.q = esc(t('exQ_an'));
  else if (d === 'fd') { it.q = exE(it.tgt.size > 1 ? 'exQ_find2' : 'exQ_find', { x: exLabel(it.set, it.key) }); it.ins = it.off.size ? t('exNeutralLegend') : ''; }
  else if (d === 'td') { it.word = stripPunct(it.tiles[0].w); it.q = exE('exQ_td_' + it.kind, { adi: t(it.li ? 'exAdi2' : 'exAdi1'), w: it.word }); it.ins = it.off.size ? t('exNeutralRhyme') : ''; }
  else if (d === 'sa') it.q = exE('exQ_srA', { s: it.word });
  else if (d === 'sn') it.q = exE('exQ_srN', { s: it.word });
  else if (d === 'sf') it.q = exE('exQ_srF', { s: it.word });
  else if (d === 'th') { const S_ = it.M.S; it.q = exE('exQ_th', { a: stripPunct(S_[it.j].w), b: stripPunct(S_[it.j + 1].w) }) + (it.j === 3 ? ' ' + esc(t('exThB')) : ''); it.word = `${stripPunct(S_[it.j].w)} — ${stripPunct(S_[it.j + 1].w)}`; }
  else if (d === 'al') it.q = esc(t('exT_al'));
  it.keyLab = d === 'tp' ? [it.rows[0], it.rows[1], it.rows[2], it.rows[3]].map(r => r.opts[r.ans].lab.split(' · ')[0]).join(' · ')
    : d === 'sa' ? it.rows.map(r => r.opts[r.ans].lab).join(' ') : d === 'td' || d === 'fd' ? [...it.tgt].map(j => `«${stripPunct(it.tiles[j].w)}»`).join(', ')
      : d === 'al' ? exLabel('fn', it.key) : it.opts ? it.opts[it.ans].lab : '';
  it.short = `${it.tt} · ${d === 'an' || d === 'al' || d === 'fd' ? t('kural') + ' ' + it.n : '«' + (it.word || '') + '»'}`;
  it.corr = it.w !== undefined && B.corr.has(`${it.n}.${it.w}`);
  if (!it.skill && it.opts && it.opts[it.ans]) it.skill = it.opts[it.ans].sk;
}

// ── rendering helpers ──
function exCoupletHTML(k, markIdx, endHi) {
  const marks = new Set([].concat(markIdx === undefined || markIdx === null ? [] : markIdx)); let j = 0;
  const lines = [k.l1, k.l2].map((ln, li) => `<div class="line l${li + 1}">${ln.split(/\s+/).filter(Boolean).map(w => {
    const my = j++; let h = esc(w);
    if (marks.has(my) && endHi) { const p = tPunct(w), core = p ? w.slice(0, -p.length) : w; if (core.endsWith(endHi)) { const cut = exEndCut(core, endHi); h = `${esc(core.slice(0, cut))}<b class="ex-end">${esc(core.slice(cut))}</b>${esc(p)}`; } }
    return `<span class="ex-tk" data-j="${my}">${marks.has(my) ? `<mark class="ex-mark">${h}</mark>` : h}</span>`;
  }).join(' ')}</div>`).join('');
  return `<div class="couplet ex-couplet">${lines}</div>${S.showTranslit ? learnTl(k) : ''}`;
}
function exConfHTML(it) {
  if (it.conf === 'none') return `<div class="ex-conf muted">${t('exConfNone')}</div>`;
  if (it.conf === 'metre') return `<div class="ex-conf muted">${exE('exMetreConf', { c: (it.cf / 100).toFixed(2) })}</div>`;
  if (it.conf === 'rhyme') return `<div class="ex-conf muted">${t('exRhymeConf')}</div>`;
  const c = it.cf; const band = it.conf === 'parts' ? t('exConfParts') + (c < 80 ? ' · ' + t('exConfMid') : '') : c >= 90 ? t('exConfHi') : c >= 80 ? t('exConfGood') : t('exConfMid');
  return `<div class="ex-conf"><span class="conf"><i style="width:${c}%"></i></span> ${(c / 100).toFixed(2)} · ${esc(band)}</div>`;
}
const exDefLine = (raw, ty) => { const x = exDefn(raw); return x ? `<div class="gloss-tip"><b>${esc(exLabel(ty || exTypeOf(raw), raw))}</b> — ${esc(x)} <span class="muted">(${t('exDef')})</span></div>` : ''; };
function exTypeOf(raw) { for (const ty of ['cat', 'pv', 'ec', 'vm', 'tg', 'an']) if (EXN[ty][raw]) return ty; return ''; }
function exSay(msg) { const el = $('#ex-fb'); if (!el) return; el.textContent = ''; requestAnimationFrame(() => { el.textContent = msg; }); }
function exArm() { EX.t = performance.now(); }
function exTooSoon() { return performance.now() - EX.t < 350; }

// ── views ──
async function viewExam(sub, q) {
  const h0 = location.hash;
  EX.gloss = EX.gloss || await glossary().catch(() => ({ terms: {} }));
  if (location.hash !== h0) return;   // the learner moved on while the glossary loaded
  if (sub === 'go') return exGo();
  if (sub === 'done') return exDone();
  if (sub === 'terms') return exTerms();
  return exHub();
}
function exLevelPicker(onPick) {
  const lvs = [1, 2, 3, 0];
  const km = EX.start && /^k-(\d+)$/.exec(EX.start.src || ''); const few = l => km && exCountK(+km[1], l) < 3;   // ST-2: a level with too few items for this couplet is not offered
  const html = `<div class="card ex"><h2 class="ex-h" tabindex="-1">📝 ${t('exPickLv')}</h2><div class="row ex-lvs" role="group" aria-label="${esc(t('exLevel'))}">${lvs.map(l => `<button class="btn ex-lvb" data-lv="${l}" ${few(l) ? 'disabled' : ''}>${t('exLv' + l)}${few(l) ? ` · ${t('exFewK')}` : ''}</button>`).join('')}</div><div class="muted" style="margin-top:8px">${t('exLvHint')}</div></div>`;
  render(html);
  $$('.ex-lvb').forEach(b => b.onclick = () => { exEnsure().lv = +b.dataset.lv; exSaveAll(); onPick(); });
  const h = $('.ex-h'); if (h) h.focus({ preventScroll: true });
}
async function exHub() {
  setTitle(t('exTitle'), t('exSub'));
  const B = await exBank();
  if (!B) { render(`<div class="card"><h2>📝 ${t('exTitle')}</h2><p>${t('exNoBank')}</p></div>`); return; }
  if (!location.hash.startsWith('#/exam') || exOnGo()) return;
  const X = exEnsure();
  if (X.lv == null) { exLevelPicker(() => exHub()); return; }
  exWarm();
  const lv = X.lv, thr = exThr(lv); const mine = exMineSet(); const todayOk = exTodayOk();
  let src = X.src || 'mine'; if ((src === 'mine' && !mine.length) || (src === 'today' && !todayOk) || (src === 'memo' && !S.memorised.length)) src = 'book';
  const chN = (/^ch-(\d+)$/.exec(src) || [])[1] || chOf(S.lastKural || 1);
  const chip = (on, attrs, label) => `<button class="chip ex-chip ${on ? 'sel' : ''}" aria-pressed="${on}" ${attrs}>${label}</button>`;
  const cur = X.cur && X.cur.rev === B.rev && exToday() - X.cur.d <= 7 ? X.cur : null;
  const h = X.hist; const pct = h.q ? Math.round(100 * h.r / h.q) : 0;
  const topicBtn = tp => {
    const T = EX_TOPICS.find(x => x.t === tp); if (lv !== 0 && T.lv > lv) return '';
    const st = exTopicStats(tp, lv); const few = st.n < EX_FLOOR;
    const lab = tp === 'td' ? `${t('exL_td_m')} · ${t('exL_td_e')}` : tp === 'sr' ? t('exL_sr') : t('exL_' + tp);
    return `<button class="ex-topic" data-t="${tp}" ${few ? 'disabled' : ''}><span class="ex-tt">${t('exT_' + tp)}</span><span class="muted">${esc(lab)}</span>${few ? `<span class="muted">${t('exFewData')}</span>` : `<span class="ex-tm">${exE('exMastered', { a: st.a, b: st.b })} <span class="ex-bar"><i style="width:${Math.round(st.bar * 100)}%"></i></span> ${exE('exItems', { n: st.n })}</span>`}</button>`;
  };
  const slN = B.cnt[thr].sl || 0; const slT = (EX.bank.E.filter(e => e.t === 'sl' && e.cf >= thr)).length; const known = Object.keys(X.w).filter(f => exWordEff(f) >= 3).length;
  render(`<div class="card ex">
    <h2>📝 ${t('exTitle')}</h2>
    <div class="ex-q" id="exh-lv">${t('exLevel')}</div><div class="row" role="group" aria-labelledby="exh-lv">${[1, 2, 3, 0].map(l => chip(l === lv, `data-lv="${l}"`, t('exLv' + l))).join('')}</div>
    <div class="muted ex-hint">${t('exLvHint')}</div>
    <div class="ex-q" id="exh-src">${t('exSrc')}</div><div class="row" role="group" aria-labelledby="exh-src">
      ${mine.length ? chip(src === 'mine', 'data-src="mine"', `${t('exSrcMine')} (${mine.length})`) : ''}${todayOk ? chip(src === 'today', 'data-src="today"', t('exSrcToday')) : ''}
      ${chip(src === 'book', 'data-src="book"', t('exSrcBook'))}${chip(src.startsWith('ch-'), 'data-src="ch"', t('exSrcCh'))}${S.memorised.length ? chip(src === 'memo', 'data-src="memo"', t('exSrcMemo')) : ''}</div>
    <div class="row ex-chrow" ${src.startsWith('ch-') ? '' : 'hidden'}><select id="exh-ch" aria-label="${esc(t('exSrcCh'))}">${D.meta.chapters.map((c, i) => `<option value="${i + 1}" ${+chN === i + 1 ? 'selected' : ''}>${i + 1} · ${esc(c.name)}</option>`).join('')}</select></div>
    <div class="actions"><button class="btn primary" id="exh-go">${cur ? exE('exResume', { i: Math.min(cur.i + 1, cur.ids.length), n: cur.ids.length }) : t('exStart')}</button>
      ${exMissN() ? `<button class="btn" id="exh-miss">${exE('exMissBtn', { n: exMissN() })}</button>` : ''}</div>
    <div class="muted">${exE('exStats', { d: h.days, q: h.q, p: pct })}</div></div>
  <div class="card ex"><h2>${t('exTopics')}</h2>${EX_GROUPS.map(([g, tps]) => { const body = tps.map(topicBtn).join(''); return body ? `<h3>${t(g)}</h3><div class="ex-topics">${body}</div>` : ''; }).join('')}</div>
  <div class="card ex"><h2>${t('exSl')} ${S.ui !== 'en' ? `<span class="chip">${t('exSlOpt')}</span>` : ''}</h2><div class="muted">${t('exSlSub')}</div>
    <div style="margin:6px 0">${exE('exKnown', { n: known, t: slT })}</div>
    <button class="btn" id="exh-sl" ${slN < EX_FLOOR ? 'disabled' : ''}>${t('exPractise')}</button></div>
  <div class="card ex"><h2>${t('exHonestT')}</h2><p class="muted">${t('exHonest1')}</p><p class="muted">${t('exHonest2')}</p><p class="muted">${t('exTextbook')}</p><div class="ai-note">${t('exConfLegend')}</div>
    <div class="row" style="margin-top:8px"><a class="btn" href="#/exam/terms">${t('exTermsLink')}</a><a class="btn" href="#/grammar">${t('exExplorer')}</a></div></div>`);
  const go = st => { EX.start = st; location.hash = '#/exam/go'; };
  const again = sel => { const y = window.scrollY; exHub().then(() => { window.scrollTo(0, y); const b = $(sel); if (b) b.focus({ preventScroll: true }); }); };   // UX-4
  $$('[data-lv]').forEach(b => b.onclick = () => { exEnsure().lv = +b.dataset.lv; exSaveAll(); again(`[data-lv="${b.dataset.lv}"]`); });   // ST-6: the live S.ex
  $$('[data-src]').forEach(b => b.onclick = () => { exEnsure().src = b.dataset.src === 'ch' ? 'ch-' + $('#exh-ch').value : b.dataset.src; exSaveAll(); again(b.dataset.src === 'ch' ? '#exh-ch' : `[data-src="${b.dataset.src}"]`); });
  $('#exh-ch').onchange = e => { exEnsure().src = 'ch-' + e.target.value; exSaveAll(); };
  $('#exh-go').onclick = () => { if (cur) { EX.start = null; location.hash = '#/exam/go'; } else go({ t: '', src }); };
  const mb = $('#exh-miss'); if (mb) mb.onclick = () => go({ t: '', src: 'miss' });
  $$('.ex-topic').forEach(b => b.onclick = () => go({ t: b.dataset.t, src }));
  $('#exh-sl').onclick = () => go({ t: 'sl', src });
}
function exMissN() {   // ST-8: the same test exBuild applies to a mistakes round
  const B = EX.bank, X = S.ex; if (!B || !X) return 0; const thr = exThr(X.lv); const offB = new Set(X.off.map(exBase));
  return X.miss.filter(c => { const e = exEntry(c); return e && e.cf >= thr && !offB.has(exBase(c)) && !B.off.has(exBase(c)) && !(S.srs[e.n] && S.srs[e.n].due <= learnDueDay()); }).length;
}
function exWarm() {
  if (SINGLE || IS_ANDROID_APP || !hasCaches() || EX.warming) return;
  const tag = EX.bank ? EX.bank.rev : '1';
  try { if (localStorage.getItem('kural.warmed.gr') === tag) return; } catch (e) { return; }
  EX.warming = true;   // INT-3: one warm-up per page load
  setTimeout(async () => {
    try { const u = []; for (let i = 1; i <= 133; i++) u.push(`data/gr/${pad(i, 3)}.json`); await cacheUrls(u);
      let all = true; for (const x of u) if (!(await caches.match(x, { ignoreSearch: true }))) { all = false; break; }
      if (all) localStorage.setItem('kural.warmed.gr', tag); } catch (e) { }   // INT-2: a partial or evicted cache warms again next time
    EX.warming = false; }, 3000);
}
async function exGo() {
  const my = ++EX.tok; setTitle(t('exTitle'), t('exSub'));
  const B = await exBank(); if (my !== EX.tok || !exOnGo()) return;
  if (!B) { render(`<div class="card"><h2>📝 ${t('exTitle')}</h2><p>${t('exNoBank')}</p></div>`); return; }
  const X = exEnsure(); let cur = X.cur; const st = EX.start;
  const valid = cur && cur.rev === B.rev && exToday() - cur.d <= 7 && cur.ids && cur.ids.length;
  const match = st && cur && exKey(X.lv, st.t, st.src || X.src || 'mine', st.sk) === cur.key;
  if (valid && (!st || match)) { EX.start = null; await exLoad([...new Set(cur.ids.map(c => chOf((exEntry(c) || { n: 1 }).n)))], new Set(cur.ids.filter(exNeedGr).map(c => chOf((exEntry(c) || { n: 1 }).n))), 4000); if (my !== EX.tok || !exOnGo()) return; return exPlayer(); }
  if (!st) { location.replace('#/exam'); return; }
  if (X.lv == null) { exLevelPicker(() => exGo()); return; }
  render(`<div class="card ex muted">${t('exBuilding')}</div>`);
  let r; try { r = await exBuild(st, my); } catch (e) { console.error(e); r = { err: 'none' }; }
  if (my !== EX.tok || !exOnGo()) return;   // ST-3: a stale or failed build leaves the old round resumable
  if (r && !r.err) {
    const X2 = exEnsure(), old = X2.cur;
    if (old && old.a && old.a.some(a => a && (a.ok !== undefined || a.void || (a.p && a.p.length)))) { exCommit(true); toast(t('exReplaced')); }   // a different unfinished round: keep what was answered
    X2.cur = r; exSave();
  }
  if (!r || r.err) {
    EX.start = null;
    render(`<div class="card ex"><h2 class="ex-h" tabindex="-1">📝 ${t('exTitle')}</h2><p>${r && r.err === 'nc' ? `${t('exNotCached')} <a href="#/offline">${t('offline')}</a>` : t('exNoItems')}</p><div class="row"><a class="btn" href="#/exam">${t('exHub')}</a></div></div>`);
    return;
  }
  EX.start = null; exPlayer();
}
function exPlayer() {
  render(`<div class="card ex" aria-live="off">
    <div class="ex-head"><span class="chip" id="ex-count"></span> <b id="ex-tt"></b> <span class="chip ex-lab" id="ex-lab"></span></div>
    <div class="t-prog"><i id="ex-bar"></i></div>
    <div id="ex-note" class="muted" ${EX.note ? '' : 'hidden'}>${esc(EX.note)}</div>
    <div id="ex-step"></div>
    <div id="ex-fb" class="ln-sr" role="status" aria-live="polite"></div>
    <div class="ln-foot"><button class="ln-link" id="ex-enough" hidden>${t('exEnough')}</button></div></div>`);
  EX.note = ''; EX.busy = false;
  $('#ex-enough').onclick = () => { if (EX.busy) return; EX.busy = true; exCommit(); };
  exStep();
}
function exStep() {
  const X = S.ex, cur = X && X.cur, host = $('#ex-step'); if (!cur || !host) return;
  TTS.stop(); closeSheet();
  if (cur.i >= cur.ids.length) { exCommit(); return; }
  const code = cur.ids[cur.i]; const it = exItem(code, cur.i);
  $('#ex-count').textContent = `${cur.i + 1}/${cur.ids.length}`;
  $('#ex-bar').style.width = Math.round(100 * cur.i / cur.ids.length) + '%';
  $('#ex-enough').hidden = cur.i < 1;
  if (!it) {
    if (!cur.a[cur.i]) cur.a[cur.i] = { skip: 1 };   // ST-1: an answered or voided record stays as it was
    $('#ex-tt').textContent = ''; $('#ex-lab').textContent = '';
    host.innerHTML = `<h2 class="ex-h" tabindex="-1">${t('exSkip')}</h2><div id="ex-res" tabindex="-1"><div class="actions"><button class="btn primary" id="ex-next">${t(cur.i + 1 >= cur.ids.length ? 'exFinish' : 'exNext')}</button></div></div>`;
    exWireNext(); exSettle(); EX.busy = false; return;   // UX-8: the focused heading already says it
  }
  $('#ex-tt').textContent = it.tt; $('#ex-lab').textContent = fmt(t('exExamLabel'), { x: S.ui !== 'ta' && it.labTa && it.labTa !== it.lab ? `${it.labTa} (${it.lab})` : it.lab });
  const a = cur.a[cur.i];
  ({ mcq: exMCQ, rows: exRows, find: exFind, table: exTable })[it.eng](it, host, a);
  exSettle(); EX.busy = false;
}
function exSettle() { const h = $('#ex-step .ex-h'); if (h) h.focus({ preventScroll: true }); window.scrollTo(0, 0); }
function exBody(it) {
  const mark = it.d === 'an' || it.d === 'fd' || it.d === 'td' || it.d === 'al' || it.d === 'sa' ? null : it.mark;
  const cp = it.eng === 'find' ? '' : exCoupletHTML(it.k, it.d === 'sa' ? it.mark : mark, null);
  const pre = it.d === 'sl' ? `<div class="chip ex-lab">${t('lnGlossEn')}</div>` : it.d === 'sn' || it.d === 'sf' ? `<div class="ex-foot">${esc(it.word)}</div>` : '';
  return `<h2 class="ex-h" tabindex="-1">${it.q}</h2>${pre}${cp}${it.ins ? `<div class="muted ex-ins">${esc(it.ins)}</div>` : ''}`;
}
function exWireNext() {
  const b = $('#ex-next'); if (!b) return;
  b.onclick = () => { if (EX.busy || exTooSoon()) return; EX.busy = true; const cur = S.ex.cur; if (!cur) { EX.busy = false; return; } cur.i++; exSave(); exStep(); };
}
function exFinished(it) {
  const res = $('#ex-res'); if (!res) return;
  res.focus({ preventScroll: true }); const nx = $('#ex-next');
  if (it.d === 'al') res.scrollIntoView({ block: 'start' }); else if (nx) nx.scrollIntoView({ block: 'nearest' });   // UX-7
}
// MCQ engine
function exMCQ(it, host, a) {
  const lines = ['pr', 'sl', 'an', 'vm'].includes(it.d) || it.opts.some(o => exGlen(o.lab) > 14);
  host.innerHTML = `${exBody(it)}<div class="t-opts ${lines ? 't-lines' : ''} ex-opts">${it.opts.map((o, i) => `<button class="btn t-opt ex-opt" data-o="${i}" ${o.en ? 'lang="en"' : ''}>${esc(o.lab)}</button>`).join('')}</div><div id="ex-res" tabindex="-1"></div>`;
  const show = (p, fresh) => {
    let ok = p === it.ans;
    if (fresh) ok = exAnswer(it, p);
    const neu = !ok && !!(it.opts[p] && it.opts[p].part);
    $$('.ex-opt', host).forEach(b => { const i = +b.dataset.o; b.disabled = true; const lab = it.opts[i].lab;
      if (i === it.ans) { b.classList.add('ok'); b.insertAdjacentHTML('afterbegin', '<b>✓ </b>'); b.setAttribute('aria-label', `${lab} — ✓ ${t('answerWas')}`); }
      else if (i === p && neu) { b.classList.add('part'); b.insertAdjacentHTML('afterbegin', '<b>◐ </b>'); b.setAttribute('aria-label', `${lab} — ◐ ${t('exYourPick')}`); }
      else if (i === p) { b.classList.add('bad'); b.insertAdjacentHTML('afterbegin', '<b>✗ </b>'); b.setAttribute('aria-label', `${lab} — ✗ ${t('exYourPick')}`); } });
    exShowRes(it, { ok, p, neu });
    if (fresh) exFinished(it);
  };
  if (a && a.ok !== undefined) show(a.p, false);
  else { exArm(); $$('.ex-opt', host).forEach(b => b.onclick = () => { if (exTooSoon() || (S.ex.cur.a[S.ex.cur.i] || {}).ok !== undefined) return; show(+b.dataset.o, true); }); }
}
// rows engine (tp, sa)
function exRows(it, host, a) {
  const pickd = it.rows.map(() => -1);
  host.innerHTML = `${exBody(it)}${it.d === 'sa' ? `<div class="ex-foot">${esc(it.word)}</div>` : ''}${it.rows.map((r, ri) => `<div class="ex-row"><div class="ex-q" id="exr-h${ri}">${esc(r.h)}</div><div class="row" role="group" aria-labelledby="exr-h${ri}">${r.opts.map((o, oi) => `<button class="chip ex-chip" aria-pressed="false" data-r="${ri}" data-o="${oi}">${esc(o.lab)}</button>`).join('')}<span class="ex-rv" id="exr-v${ri}"></span></div></div>`).join('')}
    <div class="actions"><button class="btn primary" id="ex-check" aria-disabled="true">${t('exCheck')}</button></div><div class="muted ex-hintv" id="ex-hintv" aria-hidden="true"></div><div id="ex-res" tabindex="-1"></div>`;
  const chk = $('#ex-check');
  const done = (p, fresh) => {
    let ok = p.every((x, ri) => x === it.rows[ri].ans);
    if (fresh) ok = exAnswer(it, p);
    $$('.ex-chip', host).forEach(b => { const ri = +b.dataset.r, oi = +b.dataset.o; b.disabled = true; b.setAttribute('aria-pressed', p[ri] === oi);
      if (oi === it.rows[ri].ans) { b.classList.add('ok'); b.setAttribute('aria-label', `${it.rows[ri].opts[oi].lab} — ✓`); } else if (p[ri] === oi) { b.classList.add('bad'); b.setAttribute('aria-label', `${it.rows[ri].opts[oi].lab} — ✗ ${t('exYourPick')}`); } });
    it.rows.forEach((r, ri) => { const el = $('#exr-v' + ri); if (el) el.textContent = p[ri] === r.ans ? '✓' : `→ ${r.opts[r.ans].lab}`; });
    chk.hidden = true;
    exShowRes(it, { ok, p, part: `${p.filter((x, ri) => x === it.rows[ri].ans).length}/${it.rows.length}` });
    if (fresh) exFinished(it);
  };
  if (a && a.ok !== undefined) { done(a.p, false); return; }
  exArm();
  $$('.ex-chip', host).forEach(b => b.onclick = () => {
    if (exTooSoon()) return; const ri = +b.dataset.r, oi = +b.dataset.o; pickd[ri] = oi;
    $$(`.ex-chip[data-r="${ri}"]`, host).forEach(x => { const on = +x.dataset.o === oi; x.classList.toggle('sel', on); x.setAttribute('aria-pressed', on); });
    chk.setAttribute('aria-disabled', pickd.includes(-1) ? 'true' : 'false');
  });
  chk.onclick = () => { if (pickd.includes(-1)) { exSay(t('exRowsHint')); $('#ex-hintv').textContent = t('exRowsHint'); return; } if ((S.ex.cur.a[S.ex.cur.i] || {}).ok !== undefined) return; done(pickd.slice(), true); };
}
// find engine (fd, td)
function exFind(it, host, a) {
  const pressed = new Set();
  const tile = x => { const anchor = it.d === 'td' && x.j === 0; const off = anchor || it.off.has(x.j);
    return `<button class="ex-w ${anchor ? 'ex-anchor' : it.off.has(x.j) ? 'ex-off' : ''}" data-j="${x.j}" ${anchor ? '' : 'aria-pressed="false"'} ${off ? 'disabled' : ''}>${esc(x.w)}${anchor ? `<span class="ex-tag">${t('exAnchor')}</span>` : off ? `<span class="ln-sr"> ${t('exOffTile')}</span>` : ''}</button>`; };   // UX-9
  const lines = [0, 1].map(li => it.tiles.filter(x => x.li === li)).filter(l => l.length);
  host.innerHTML = `${exBody(it)}<div class="chip ex-lab">${exE('exFindCount', { k: it.tgt.size })}</div>
    <div class="ex-find">${lines.map(l => `<div class="ex-line">${l.map(tile).join('')}</div>`).join('')}</div>
    ${S.showTranslit ? learnTl(it.k) : ''}
    <div class="actions"><button class="btn primary" id="ex-check" aria-disabled="true">${t('exCheck')}</button></div><div class="muted ex-hintv" id="ex-hintv" aria-hidden="true"></div><div id="ex-res" tabindex="-1"></div>`;
  const chk = $('#ex-check');
  const done = (p, fresh) => {
    const ps = new Set(p); let ok = ps.size === it.tgt.size && [...ps].every(j => it.tgt.has(j));
    if (fresh) ok = exAnswer(it, [...ps].sort((x, y) => x - y));
    $$('.ex-w', host).forEach(b => { const j = +b.dataset.j; b.disabled = true; if (!b.classList.contains('ex-anchor')) b.setAttribute('aria-pressed', ps.has(j));
      const tg = it.tgt.has(j), pr = ps.has(j);
      if (tg && pr) { b.classList.add('ok'); b.insertAdjacentHTML('beforeend', `<span class="ex-tag">${t('exFound')}</span>`); }
      else if (pr) { b.classList.add('bad'); b.insertAdjacentHTML('beforeend', `<span class="ex-tag">✗ ${t('exNotThis')}</span>`); }
      else if (tg) { b.classList.add('miss'); b.insertAdjacentHTML('beforeend', `<span class="ex-tag">${t('exMissed')}</span>`); } });
    chk.hidden = true;
    exShowRes(it, { ok, p: [...ps] });
    if (fresh) exFinished(it);
  };
  if (a && a.ok !== undefined) { done(a.p, false); return; }
  exArm();
  $$('.ex-w:not([disabled])', host).forEach(b => b.onclick = () => { if (exTooSoon()) return; const j = +b.dataset.j; if (pressed.has(j)) pressed.delete(j); else pressed.add(j); b.classList.toggle('sel', pressed.has(j)); b.setAttribute('aria-pressed', pressed.has(j)); chk.setAttribute('aria-disabled', pressed.size ? 'false' : 'true'); });
  chk.onclick = () => { if (!pressed.size) { exSay(t('exFindHint')); $('#ex-hintv').textContent = t('exFindHint'); return; } if ((S.ex.cur.a[S.ex.cur.i] || {}).ok !== undefined) return; done([...pressed], true); };
}
// table engine (al)
function exTable(it, host, a) {
  const cols = t('exAlCols').split('|');
  const p = (a && a.p) ? a.p.slice() : [];
  const row = f => { const ft = it.feet[f]; const got = p[f]; const ok = got === ft.ans;
    return `<tr class="${got === undefined ? '' : ok ? 'ok' : 'bad'}"><td data-h="${esc(cols[0])}">${f + 1}. ${esc(ft.w)}</td><td data-h="${esc(cols[2])}">${got === undefined ? '—' : `${ok ? '✓' : '✗'} ${esc(ft.opts[got].lab)}${ok ? '' : ` → ${esc(ft.opts[ft.ans].lab)}`}`}</td></tr>`; };
  const paint = () => {
    const f = p.length;
    host.innerHTML = `${exBody(it)}<table class="ex-al"><thead><tr><th>${esc(cols[0])}</th><th>${esc(cols[2])}</th></tr></thead><tbody>${it.feet.map((_, i) => row(i)).join('')}</tbody></table>
      ${f < 7 ? `<div class="ex-q" id="ex-alh">${esc(t('exAlProg').replace('{i}', f + 1))}: «${esc(it.feet[f].w)}»</div><div class="t-opts ex-opts" role="group" aria-labelledby="ex-alh">${it.feet[f].opts.map((o, i) => `<button class="btn t-opt ex-opt" data-o="${i}">${esc(o.lab)}</button>`).join('')}</div>` : ''}
      <div id="ex-res" tabindex="-1"></div>`;
    if (f >= 7) { const nOk = p.filter((x, i) => x === it.feet[i].ans).length; exShowRes(it, { ok: nOk === 7, p, part: `${nOk}/7` }); return; }
    exArm();
    $$('.ex-opt', host).forEach(b => b.onclick = () => {
      if (exTooSoon() || EX.busy) return; const pk = +b.dataset.o; const fi = p.length; p.push(pk);
      const ok = exFootAnswer(it, fi, pk); paint();
      const ft = it.feet[fi];
      if (fi < 6) { exSay(`${fmt(t('exAlProg'), { i: fi + 1 })}: ${ok ? '✓' : '✗ → ' + ft.opts[ft.ans].lab}`); const nb = $('.ex-opt', host); if (nb) nb.focus({ preventScroll: true }); }
      else exFinished(it);
    });
  };
  paint();
}
// grading: one exSave per graded answer, carrying a[i] with the previous tuples
function exPrevSnap(a, cur) {
  return sk => { if (!sk) return; if (!(sk in a.prev)) a.prev[sk] = S.ex.sk[sk] ? S.ex.sk[sk].slice() : null; if (!(sk in cur.b0)) cur.b0[sk] = exEff(sk); };
}
function exAnswer(it, pick) {
  const X = S.ex, cur = X.cur, i = cur.i;
  const a = { p: pick, ok: 0, part: '', prev: {}, void: 0, skip: 0, lb: it.short, t: it.t };
  const snap = exPrevSnap(a, cur); const mark = (sk, kind) => { if (!sk) return; snap(sk); exMark(sk, kind); };
  let ok = false;
  if (it.eng === 'mcq') {
    ok = pick === it.ans;
    if (it.d === 'sl') { const f = it.form; a.prev['w:' + f] = X.w[f] ? X.w[f].slice() : null; exWord(f, ok); }
    else if (!ok && it.opts[pick] && it.opts[pick].part) a.neu = 1;   // arguable: no credit, no penalty, nothing to redo
    else { mark(it.opts[it.ans].sk, ok ? 'hit' : 'miss'); if (!ok) mark(it.opts[pick].sk, 'fa'); }
  } else if (it.eng === 'rows') {
    let n = 0;
    it.rows.forEach((r, ri) => { const rok = pick[ri] === r.ans; n += rok; if (!it.skill) { mark(r.opts[r.ans].sk, rok ? 'hit' : 'miss'); if (!rok) mark(r.opts[pick[ri]].sk, 'fa'); } });
    ok = n === it.rows.length; a.part = `${n}/${it.rows.length}`;
    if (it.skill) mark(it.skill, ok ? 'hit' : 'miss');
  } else if (it.eng === 'find') {
    ok = pick.length === it.tgt.size && pick.every(j => it.tgt.has(j));
    mark(it.skill, ok ? 'hit' : 'miss');
  }
  a.ok = ok ? 1 : 0; cur.a[i] = a;
  exQueue(it.code, ok || !!a.neu); exSave();
  return ok;
}
function exFootAnswer(it, fi, pk) {
  const X = S.ex, cur = X.cur, i = cur.i;
  const a = cur.a[i] && cur.a[i].p ? cur.a[i] : (cur.a[i] = { p: [], prev: {}, void: 0, skip: 0, lb: it.short, t: it.t });
  const snap = exPrevSnap(a, cur); const ft = it.feet[fi]; const ok = pk === ft.ans;
  a.p[fi] = pk; snap(ft.sk); exMark(ft.sk, ok ? 'hit' : 'miss');
  if (!ok && ft.opts[pk].sk) { snap(ft.opts[pk].sk); exMark(ft.opts[pk].sk, 'fa'); }
  if (fi === 6) { const n = a.p.filter((x, j) => x === it.feet[j].ans).length; a.ok = n === 7 ? 1 : 0; a.part = `${n}/7`; exQueue(it.code, n === 7); }
  exSave();
  return ok;
}
function exQueue(code, ok) {
  const X = S.ex; const today = exToday();
  X.rec.push([code, today]); if (X.rec.length > 150) X.rec.splice(0, X.rec.length - 150);
  X.miss = X.miss.filter(c => c !== code);
  if (!ok) { X.miss.push(code); if (X.miss.length > 30) X.miss.splice(0, X.miss.length - 30); }
}
// the feedback card
function exShowRes(it, res) {
  const el = $('#ex-res'); if (!el) return;
  el.innerHTML = exFeedback(it, res);
  exArm(); exWireNext();   // UX-1
  const rp = $('#ex-rp'); if (rp) rp.onclick = () => exReport(it);
  const ws = $('#ex-ws'); if (ws) ws.onclick = () => openWordSheet(it.k, it.g.words[it.w], it.g, it.w);
  const ls = $('#ex-say'); if (ls) ls.onclick = e => reciteKural(it.k, e.currentTarget);
  if (it.d === 'an' && it.anMark >= 0) { const tk = $(`.ex-couplet .ex-tk[data-j="${it.anMark}"]`); if (tk && !tk.querySelector('mark')) tk.innerHTML = `<mark class="ex-mark">${tk.innerHTML}</mark>`; }
}
function exFeedback(it, res) {
  const cur = S.ex.cur; const a = cur && cur.a[cur.i]; const voided = a && a.void;
  const last = cur && cur.i + 1 >= cur.ids.length;
  if (res.neu === undefined && a && a.neu) res.neu = true;
  const nOk = res.part ? +res.part.split('/')[0] : 0;
  const verdict = voided ? t('exVoided') : res.ok ? t('lnRight') : res.neu ? exF('exPart', { x: it.keyLab })
    : it.d === 'al' ? exF('exAlVerdict', { k: nOk })                                  // EX-COPY-07: never 'not this one' beside a right last foot
      : it.eng === 'find' ? t('exFindWrong') : it.eng === 'rows' && nOk > 0 ? exF('exRowsWrong', { x: it.keyLab })
        : exF(EX_METRE_D.has(it.d) ? 'exWrongRule' : 'exWrong', { x: it.keyLab });   // EX-COPY-09: metre and rhyme answers come from the rule
  const part = res.part && !res.ok && it.d !== 'al' ? ` <span class="muted">${exE('exRowsVerdict', { a: res.part.split('/')[0], b: res.part.split('/')[1] })}</span>` : '';
  const d = it.d; const x = [];
  let ans = `«${esc(it.word || '')}» – ${esc(it.keyLab)}`;
  if (d === 'ec' && it.key === 'எதிர்மறைபெயரெச்சம்' && /ா$/.test(tWord(it.c.s))) ans = `«${esc(it.word)}» – ஈறுகெட்ட எதிர்மறைப் பெயரெச்சம்${S.ui === 'en' ? ' · negative adjectival participle, final vowel dropped' : ''}`;
  if (d === 'tp') ans = `«${esc(it.word)}» – ${esc(it.keyLab)}`;
  if (d === 'an') ans = `${t('kural')} ${it.n} – ${esc(it.keyLab)}`;
  if (d === 'pr') ans = `${esc(it.stem)} = ${esc(it.A)} + ${esc(it.B)}`;
  if (d === 'fd') ans = `${esc(it.keyLab)} – ${esc(exLabel(it.set, it.key))}`;
  if (d === 'td') ans = `«${esc(it.word)}» – ${esc(it.keyLab)}`;
  if (['sa', 'sn', 'sf'].includes(d)) ans = exFootRow(it.M, it.foot);
  if (d === 'th') ans = `«${esc(it.word)}» – ${esc(exLabel('th', it.key))}`;
  if (d === 'al') ans = `<table class="ex-al ex-model"><thead><tr>${t('exAlCols').split('|').map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${it.M.S.map((sr, f) => `<tr><td>${f === 6 ? esc(stripPunct(sr.w)) : exSegHTML(sr)}</td><td>${exAsaiTxt(it.M, f)}</td><td>${esc(exLabel(f === 6 ? 'fn' : 'vp', f === 6 ? it.M.fin : it.M.names[f]))}</td></tr>`).join('')}</tbody></table>`;
  // per-drill extras inside "விளக்கம்"
  if (['sv', 'pv', 'ec', 'vm', 'tg', 'fd'].includes(d)) x.push(exDefLine(it.key, { sv: 'cat', fd: it.set }[d] || d));
  if (d === 'vm' && !res.ok && it.opts[res.p]) x.push(exDefLine(it.opts[res.p].v, 'vm'));
  const whyPart = res.neu && it.opts[res.p] ? exE(EX_SUPER[it.key] === it.opts[res.p].v ? 'exPartSuper' : 'exPartAlt', { p: it.opts[res.p].lab, x: it.keyLab }) : '';
  if (d === 'pv') x.push(`<div>${t('exPvSix')}</div>`);
  if (d === 'tp') { const f = it.rows; const vals = `${f[0].opts[f[0].ans].lab.split(' · ')[0]} · ${f[1].opts[f[1].ans].lab.split(' · ')[0]} · ${f[2].opts[f[2].ans].lab.split(' · ')[0]} · ${f[3].opts[f[3].ans].lab.split(' · ')[0]}`; x.push(`<div>${it.vik ? exE('exR_tp', { v: it.vik === 'அது' ? 'து' : it.vik, x: vals }) : exE('exR_tpDem', { w: it.word, x: vals })}</div><div class="muted">${t('exTpAgree')}</div>`); }
  if (d === 'vt') x.push(`<div>${exE('exUrupu', { u: it.ur })} · ${exCoupletWordEnd(it)}</div><div>${esc(exLabel('vt', it.key))}: ${esc((S.ui === 'hi' && HI.vet[it.key]) || VET_MEAN[it.key][S.ui === 'ta' ? 0 : 1])}</div><div class="muted">${t('exVtNote')}</div>`);
  if (d === 'tg') { if (it.key === 'வேற்றுமைத்தொகை') x.push(`<div>${t('exTgNote')}</div>`); if (it.key === 'பண்புத்தொகை') x.push(`<div>${t('exTgPanbu')}</div>`); }
  if (d === 'pr') { if (it.tail) x.push(`<div>${exE('exTail', { c: it.tail, nx: it.nx })}</div>`); x.push(`<div class="muted">${t('exSplitNote')}</div>`); }
  if (d === 'td') {
    const toks = it.tiles.map(q => stripPunct(q.w)); const g = q => (exGra(q)[it.kind === 'm' ? 0 : 1] || '');
    x.push(`<div>${t(it.kind === 'm' ? 'exR_monai' : 'exR_etukai')}</div>`);
    x.push(`<div>${[...it.tgt].map(j => `«${esc(toks[0])}» – «${esc(toks[j])}» · ${esc(g(toks[0]))}/${esc(g(toks[j]))}`).join('<br>')}</div>`);
    const a0 = stripPunct(it.k.l1.split(/\s+/)[0]), b0 = stripPunct(it.k.l2.split(/\s+/)[0]);
    if (exRhyme('e', a0, b0) === 'T') x.push(`<div class="muted">${exE('exAdiEtukai', { a: a0, b: b0 })}</div>`);
  }
  if (['sa', 'sn', 'sf', 'al'].includes(d)) x.push(`<div>${t(d === 'sf' ? 'exR_final' : 'exR_asai')}</div>`);
  if (d === 'al') x.push(`<div>${t('exPaa')}</div><div>${exE('exAlDone', { x: exLabel('fn', it.M.fin) })}</div><div>${t('exR_final')}</div>`);
  if (d === 'th') { const j = it.j, M = it.M; const nx = exSegs(M.S[j + 1])[0]; x.push(`<div>${exE('exR_th', { a: exLabel('vp', M.names[j]), cls: it.cls, asai: `${M.pats[j + 1][0] === 'N' ? t('exNer') : t('exNirai')} (${nx})`, x: exLabel('th', it.key) })}</div><div class="muted">${esc(stripPunct(M.S[j].w))}: ${esc(exLabel('vp', M.names[j]))} · ${esc(stripPunct(M.S[j + 1].w))}: ${esc(j + 1 === 6 ? exLabel('fn', M.fin) : exLabel('vp', M.names[j + 1]))}</div>`); }
  if (d === 'an') { if (it.note) x.push(`<div class="gloss-tip"><b>${t('exAnNote')}</b>: ${esc(it.note)}</div>`); ['உவமை', 'எடுத்துக்காட்டுவமை', 'உருவகம்'].forEach(v => x.push(exDefLine(v))); if (it.key === 'உருவகம்') x.push(`<div class="muted">${t('exAnEka')}</div>`); x.push(`<div class="muted">${t('exAnMore')}</div>`); }
  if (d === 'sl') x.push(`<div class="muted">${t('exSlSub')}</div>`);
  if (it.corr) x.push(`<div class="ai-note">${t('exCorrNote')}</div>`);
  const links = `<div class="row ex-links">${it.g && it.w !== undefined && d !== 'fd' && d !== 'an' ? `<button class="btn small" id="ex-ws">${t('exWord')}</button>` : ''}<a class="btn small" href="#/k/${it.n}">${exE('exKural', { n: it.n })}</a><button class="btn small" id="ex-say">${t('exListen')}</button></div>`;
  return `<div class="t-fb ${voided || res.neu ? '' : res.ok ? 'ok' : 'bad'}"><b class="ex-verdict">${esc(verdict)}</b>${part}
    <div class="ex-ansl">${ans}</div>${whyPart ? `<div class="ex-part">${whyPart}</div>` : ''}${exConfHTML(it)}
    <div class="row ex-btns"><button class="btn primary" id="ex-next">${t(last ? 'exFinish' : 'exNext')}</button>${voided ? '' : `<button class="btn" id="ex-rp">${t('exReport')}</button>`}</div>
    <details class="ex-more" ${innerWidth >= 420 ? 'open' : ''}><summary>${t('exMore')}</summary>${x.join('')}${links}</details></div>`;
}
const exEndCut = (w, end) => { let cut = w.length - end.length; if (/^[\u0BBE-\u0BCD\u0BD7]/.test(end) && cut > 0) cut--; return cut; };   // EX-COPY-02: take the consonant that carries the sign
function exCoupletWordEnd(it) { const w = it.word || ''; if (!w.endsWith(it.urw)) return `«${esc(w)}»`; const cut = exEndCut(w, it.urw); return `«${esc(w.slice(0, cut))}<b>${esc(w.slice(cut))}</b>»`; }
// ⚑: void only when the report is actually sent
function exReport(it) {
  const cur = S.ex.cur; if (!cur) return; const i = cur.i; const a = cur.a[i]; if (!a || a.void) return;
  const cm = chMeta(chOf(it.n));
  const pickLab = it.opts && typeof a.p === 'number' && it.opts[a.p] ? it.opts[a.p].lab : Array.isArray(a.p) && it.rows ? a.p.map((x, ri) => it.rows[ri].opts[x] ? it.rows[ri].opts[x].lab : '').join(' · ') : Array.isArray(a.p) && it.tiles ? a.p.map(j => it.tiles[j] ? stripPunct(it.tiles[j].w) : '').join(', ') : Array.isArray(a.p) && it.feet ? a.p.map((x, f) => it.feet[f].opts[x].lab).join(' · ') : '';
  const stream = EX_METRE_D.has(it.d) ? 'metre' : 'grammar';
  openReportSheet(it.k, cm, stream, {
    type: it.rpType || stream, note: fmt(t('exRpNote'), { d: it.tt, w: it.word || `${t('kural')} ${it.n}`, x: it.keyLab, y: pickLab }),
    extra: `exam item ${it.code} · bank ${EX.bank.rev} · conf ${it.cf === null || it.conf === 'none' ? '-' : (it.cf / 100).toFixed(2)}`,
    onSent: () => exVoid(i, it.code),
  });
}
const EX_METRE_D = new Set(['sa', 'sn', 'sf', 'th', 'al', 'td']);
function exVoid(i, code) {
  const X = S.ex, cur = X && X.cur; if (!cur || cur.ids[i] !== code) return;
  const a = cur.a[i]; if (!a || a.void) return;
  for (const [k, v] of Object.entries(a.prev || {})) {
    if (k.startsWith('w:')) { if (v) X.w[k.slice(2)] = v; else delete X.w[k.slice(2)]; }
    else if (v) X.sk[k] = v; else delete X.sk[k];
  }
  a.void = 1; X.miss = X.miss.filter(c => c !== code);
  if (!X.off.includes(code)) { X.off.push(code); if (X.off.length > 300) X.off.splice(0, X.off.length - 300); }
  exSave();
  if (cur.i === i && exOnGo()) { const v = $('#ex-res .ex-verdict'); if (v) v.textContent = t('exVoided'); const rp = $('#ex-rp'); if (rp) { rp.disabled = true; rp.textContent = '⚑ ✓'; } const nx = $('#ex-next'); if (nx) sheetOpener = nx; const fb = $('#ex-res .t-fb'); if (fb) fb.classList.remove('ok', 'bad'); }
}
function exCommit(silent) {
  const X = S.ex, cur = X && X.cur; EX.busy = false; if (!cur) { if (!silent) location.replace('#/exam'); return; }
  const today = exToday(); const items = []; let q = 0, r = 0, vd = 0;
  cur.ids.forEach((c, i) => { const a = cur.a[i]; if (!a || a.skip || (a.ok === undefined && !a.void && !(a.p && a.p.length))) return;
    if (a.ok === undefined && !a.void) { a.ok = 0; a.part = `${a.p.filter((x, f) => x !== undefined).length}/7`; exQueue(c, false); }   // ST-10
    if (a.void) { vd++; items.push([c, -1, a.lb || c, a.t || '']); return; } q++; r += a.ok; items.push([c, a.neu ? 2 : a.ok, a.lb || c, a.t || '']); });
  const up = [], dn = []; for (const [sk, b] of Object.entries(cur.b0 || {})) { const e = exEff(sk); if (e > b) up.push(sk); else if (e < b) dn.push(sk); }
  X.last = { d: today, lv: cur.lv, t: cur.t, src: cur.src, sk: cur.sk || '', n: q, ok: r, vd, items, up, dn };
  X.hist.n++; X.hist.q += q; X.hist.r += r; if (X.hist.last !== today) { X.hist.days++; X.hist.last = today; }
  X.cur = null; exSaveAll();
  if (!silent) location.replace('#/exam/done');
}
function exSkillLabel(sk) {
  const [p, v] = [sk.slice(0, sk.indexOf(':')), sk.slice(sk.indexOf(':') + 1)];
  if (p === 'cat') return exLabel('cat', v); if (p === 'ilk') return exLabel('ilakkanam', v); if (p === 'vt') return exLabel('vt', +v);
  if (['ti', 'pa', 'en', 'tg', 'an', 'vp', 'fn', 'th'].includes(p)) return exLabel(p, v);
  if (p === 'td') return t('exL_td_' + v); return sk === 'pr' ? t('exT_pr') : sk;
}
async function exDone() {
  setTitle(t('exResT'), t('exTitle'));
  await exBank(); if (!location.hash.startsWith('#/exam/done')) return;
  const X = exEnsure(); const L_ = X.last;
  if (!L_) { location.replace('#/exam'); return; }
  const pct = L_.n ? Math.round(100 * L_.ok / L_.n) : 0; const tps = {};
  L_.items.forEach(([, ok, , tp]) => { if (!tp || ok === -1 || ok === 2) return; const o = tps[tp] || (tps[tp] = [0, 0]); o[ok ? 0 : 1]++; });
  render(`<div class="card ex"><h2 class="ex-h" tabindex="-1">${t('exResT')}</h2>
    <div class="ex-score">${exE('exScore', { a: L_.ok, b: L_.n, p: pct })}</div>${L_.vd ? `<div class="muted">${exE('exVoidN', { n: L_.vd })}</div>` : ''}
    <div class="muted">${fmt(t('exMoved'), { up: L_.up.map(exSkillLabel).map(esc).join(', ') || '—', dn: L_.dn.map(exSkillLabel).map(esc).join(', ') || '—' })}</div>
    <div class="row" style="margin-top:6px">${Object.entries(tps).map(([tp, [a, b]]) => `<span class="chip">${esc(t('exT_' + tp))} ✓${a} ✗${b}</span>`).join('')}</div>
    <ul class="ex-list">${L_.items.map(([c, ok, lb]) => { const n = +c.split(':')[1].split('.')[0]; return `<li><span class="ex-st">${ok === -1 ? t('exVoidItem') : ok === 2 ? '◐' : ok ? '✓' : '✗'}</span> <a href="#/k/${n}">${esc(lb)}</a></li>`; }).join('')}</ul>
    <div class="actions">${exMissN() ? `<button class="btn" id="exd-miss">${exE('exMissBtn', { n: exMissN() })}</button>` : ''}<button class="btn primary" id="exd-again">${t('exAgain')}</button><a class="btn" href="#/exam">${t('exHub')}</a></div></div>`);
  const mb = $('#exd-miss'); if (mb) mb.onclick = () => { EX.start = { t: '', src: 'miss' }; location.replace('#/exam/go'); };
  $('#exd-again').onclick = () => { EX.start = { t: L_.t || '', src: L_.src, sk: L_.sk || '' }; location.replace('#/exam/go'); };   // ST-7
  const h = $('.ex-h'); if (h) h.focus({ preventScroll: true });
}
async function exTerms() {
  setTitle(t('exTermsT'), t('exTitle'));
  const groups = [['sv', 'cat', ['பெயர்', 'வினை', 'இடை', 'உரி'], 'category'], ['pv', 'pv', null, 'ilakkanam'], ['ec', 'ec', null, 'ilakkanam'], ['vm', 'vm', null, 'ilakkanam'], ['tg', 'tg', ['வேற்றுமைத்தொகை', 'வினைத்தொகை', 'பண்புத்தொகை', 'உவமைத்தொகை', 'உம்மைத்தொகை'], 'togai'], ['an', 'an', null, 'ani']];
  const d = x => { const e = EX_DEF[x] || (EX.gloss.terms || {})[x]; return e ? `<div class="gloss-tip">${esc(e.ta)} <span class="muted">(${t('exDef')})</span><br><i lang="${S.ui === 'hi' ? 'hi' : 'en'}">${esc(S.ui === 'hi' ? ((EX_DEF[x] ? HI.exdef[x] : hiGloss(x)) || e.en) : e.en)}</i> <span class="muted">(${t('exDraft')})</span></div>` : ''; };
  render(`<div class="card ex"><h2 class="ex-h" tabindex="-1">${t('exTermsT')}</h2><div class="ai-note">${t('exTermsNote')}</div></div>${groups.map(([tp, ty, list, gx]) => `<div class="card ex"><h3>${t('exT_' + tp)}</h3>${(list || Object.keys(EXN[ty])).map(x => `<div class="ex-term"><a class="ex-tlink" href="#/grammar?type=${gx}&tag=${encodeURIComponent(x)}">${esc(exLabel(ty, x))}</a>${d(x)}</div>`).join('')}</div>`).join('')}
  <div class="card ex"><h3>${t('exT_vt')}</h3>${[2, 3, 4, 5, 7].map(n => `<div class="ex-term"><b>${esc(exLabel('vt', n))}</b> — ${esc(VET_MEAN[n][0])} <i lang="${S.ui === 'hi' ? 'hi' : 'en'}">(${esc((S.ui === 'hi' && HI.vet[n]) || VET_MEAN[n][1])})</i></div>`).join('')}</div>
  <div class="card ex"><h3>${t('exT_sr')}</h3><div>${t('exR_asai')}</div><div>${t('exR_final')}</div><h3>${t('exT_td')}</h3><div>${t('exR_monai')}</div><div>${t('exR_etukai')}</div></div>`);
}
// entry point on the kural page: shown only when there are at least 3 items there at this level
async function exKuralBtn(n) {
  const B = await exBank(); const box = $('#ex-k'); if (!B || !box || (location.hash.split('?')[0].split('/')[2] || '') !== String(n)) return;
  const lv = S.ex ? S.ex.lv : null;
  if ((lv == null ? Math.max(...[1, 2, 3, 0].map(l => exCountK(n, l))) : exCountK(n, lv)) < 3) return;   // ST-2
  box.innerHTML = `<button class="btn" id="ex-kgo">${t('exOnKural')}</button>`;
  $('#ex-kgo').onclick = () => { EX.start = { t: '', src: 'k-' + n }; location.hash = '#/exam/go'; };
}
function exCountK(n, lv) {   // items a k-N round can use at level lv
  const B = EX.bank; if (!B) return 0; const thr = exThr(lv); const tps = new Set(exTopicsAt(lv).map(x => x.t));
  return (B.byN.get(n) || []).filter(e => tps.has(e.t) && e.cf >= thr && (B.cnt[thr][e.t] || 0) >= EX_FLOOR).length;
}
// grammar explorer: the practise button on a tag page
function exTagTopic(type, tag) {
  const B = EX.bank; if (!B) return null;
  const lv = S.ex ? S.ex.lv : null; const thr = exThr(lv);
  let cands = [];
  if (type === 'ilakkanam') cands = ['pv', 'ec', 'vm'].map(tp => [tp, 'ilk:' + tag]);
  else if (type === 'category') cands = [['sv', 'cat:' + tag]];
  else if (type === 'togai') cands = [['tg', 'tg:' + tag]];
  else if (type === 'ani') cands = [['an', 'an:' + tag]];
  else if (type === 'vetrumai') { const m = /^(\d) ·/.exec(tag); if (m) cands = [['vt', 'vt:' + m[1]]]; }
  for (const [tp, sk] of cands) {
    const T = EX_TOPICS.find(x => x.t === tp); if (lv != null && lv !== 0 && T.lv > lv) continue;
    if ((B.cnt[thr][tp] || 0) < EX_FLOOR) continue;
    const n = B.E.filter(e => e.t === tp && e.sk === sk && e.cf >= thr).length;
    if (n >= 10) return { t: tp, sk };
  }
  return null;
}

// ── console self-test (spec §8 test 5) ──
async function exSelfTest(n = 2000) {
  const fails = []; const B = await exBank(); if (!B) return { fails: ['no bank'] };
  const saved = { ex: S.ex, ui: S.ui };
  S.ex = Object.assign(exDef(), { lv: 0, off: [] });
  try {
    await Promise.all(Array.from({ length: 133 }, (_, i) => Promise.all([chapter(i + 1), grammar(i + 1)])));
    const F = {}; const fa = (f, k, v) => { ((F[f] ||= {})[k] ||= new Set()).add(v); };
    for (let c = 1; c <= 133; c++) for (const [kn, g] of Object.entries(D.gr[c].kurals)) for (const w of g.words) {
      const tok = tWord(w.w);
      for (const x of w.c) { const f = tWord(x.s); fa(f, 'cat', x.cat); fa(f, 'ilk', x.ilk); for (const kk of ['thinai', 'paal', 'eN']) if (x.feat && x.feat[kk]) fa(f, kk, x.feat[kk]); if (x.vet && typeof x.vet.number === 'number') fa(tok, 'vet', x.vet.number); }
      if (w.togai && w.c.length >= 2) fa(tok, 'togai', w.togai);
      void kn;
    }
    const carries = (f, k, v) => !!(F[f] && F[f][k] && F[f][k].has(v));
    const SIB = { 'வினையெச்சம்': ['எதிர்மறைவினையெச்சம்'], 'எதிர்மறைவினையெச்சம்': ['வினையெச்சம்'], 'பெயரெச்சம்': ['எதிர்மறைபெயரெச்சம்'], 'எதிர்மறைபெயரெச்சம்': ['பெயரெச்சம்'], 'தெரிநிலைவினைமுற்று': ['குறிப்புவினைமுற்று', 'எதிர்மறைவினைமுற்று', 'வினையாலணையும்பெயர்'], 'குறிப்புவினைமுற்று': ['தெரிநிலைவினைமுற்று', 'எதிர்மறைவினைமுற்று', 'வினையாலணையும்பெயர்'], 'எதிர்மறைவினைமுற்று': ['தெரிநிலைவினைமுற்று', 'குறிப்புவினைமுற்று', 'வினையாலணையும்பெயர்'], 'வினையாலணையும்பெயர்': ['தெரிநிலைவினைமுற்று', 'குறிப்புவினைமுற்று', 'எதிர்மறைவினைமுற்று', 'தொழிற்பெயர்'], 'தொழிற்பெயர்': ['வினையாலணையும்பெயர்', 'வியங்கோள்வினைமுற்று'], 'வியங்கோள்வினைமுற்று': ['தொழிற்பெயர்'] };
    const all = [];
    for (const e of B.E) { if (e.c.startsWith('sr:')) { all.push('sa:' + e.c.slice(3), 'sn:' + e.c.slice(3)); } else all.push(e.c); }
    for (const arr of Object.values(B.fd)) arr.forEach(f => all.push(f.c));
    const rnd = mulberry32(12345); const codes = Array.from({ length: n }, () => all[Math.floor(rnd() * all.length)]);
    const rawKey = /\b(?:ex|gx)[A-Z][A-Za-z_]*\b/;
    let i = 0;
    for (const code of codes) {
      i++; const it = exItem(code, i, 777);
      if (!it) { fails.push(code + ': unresolved'); continue; }
      const d = it.d;
      if (it.opts) {
        const labs = it.opts.map(o => o.lab); if (new Set(labs).size !== labs.length) fails.push(code + ': duplicate options');
        if (it.opts.filter((o, j) => j === it.ans).length !== 1 || it.ans < 0) fails.push(code + ': key not once');
        const cnt = it.opts.length; const want = d === 'an' || d === 'pr' ? [3] : ['th', 'sn', 'sf', 'sv', 'vt', 'sl', 'ec'].includes(d) ? [4] : d === 'pv' || d === 'vm' ? [6] : [3, 4];
        if (it.opts[it.ans].part) fails.push(code + ': key marked part');
        if (['pv', 'ec', 'vm'].includes(d) && !it.opts.some((o, j) => j !== it.ans && !o.part)) fails.push(code + ': no scored distractor');
        if (!want.includes(cnt)) fails.push(`${code}: ${cnt} options`);
        const f = it.c ? tWord(it.c.s) : ''; const tok = it.g && it.w !== undefined ? tWord(it.g.words[it.w].w) : '';
        it.opts.forEach((o, j) => { if (j === it.ans || o.part) return;
          if (d === 'sv' && carries(f, 'cat', o.v)) fails.push(code + ': distractor carried ' + o.v);
          if (['pv', 'ec', 'vm'].includes(d) && carries(f, 'ilk', o.v)) fails.push(code + ': distractor carried ' + o.v);
          if (d === 'vt' && carries(tok, 'vet', o.v)) fails.push(code + ': distractor carried ' + o.v);
          if (d === 'tg' && carries(tok, 'togai', o.v)) fails.push(code + ': distractor carried ' + o.v); });
      }
      if (it.rows) { const f = it.c ? tWord(it.c.s) : ''; if (d === 'tp') [['thinai', 0], ['paal', 1], ['eN', 2]].forEach(([k, ri]) => it.rows[ri].opts.forEach((o, j) => { if (j !== it.rows[ri].ans && carries(f, k, o.v)) fails.push(code + ': row carried ' + o.v); })); if (d === 'tp' && (it.rows[0].opts.length !== 2 || it.rows[1].opts.length !== 5 || it.rows[2].opts.length !== 2 || it.rows[3].opts.length !== 3)) fails.push(code + ': tp rows'); }
      if (d === 'fd') { const X_ = it.key; for (const j of it.tgt) { const wd = it.g.words[j]; if (exCf(Math.min(...wd.c.map(x => x.conf))) < 70) fails.push(code + ': target conf'); }
        it.g.words.forEach((wd, j) => { if (it.tgt.has(j) || it.off.has(j)) return; if (wd.c.some(x => [X_, ...(SIB[X_] || [])].some(v => carries(tWord(x.s), 'ilk', v) || x.ilk === v))) fails.push(code + ': tappable carries ' + X_); }); }
      if (it.feet) it.feet.forEach((ft, f) => { if (ft.opts.length !== 4 || new Set(ft.opts.map(o => o.lab)).size !== 4 || !(ft.ans >= 0)) fails.push(`${code}: foot ${f} options`); });
      if (it.M) { it.M.S.slice(0, 6).forEach((sr, j) => { if (EX_VP[it.M.pats[j]] !== it.M.names[j]) fails.push(code + ': metre name'); }); }
      for (const ui of ['ta', 'en', 'hi']) {
        S.ui = ui; const it2 = exItem(code, i, 777); const div = document.createElement('div');
        div.innerHTML = exBody(it2) + (it2.opts || []).map(o => o.lab).join(' ') + exFeedback(it2, { ok: false, p: it2.ans !== undefined ? (it2.ans + 1) % Math.max(1, (it2.opts || [1]).length) : [], part: '1/2' }) + exFeedback(it2, { ok: true, p: it2.ans });
        const m = rawKey.exec(div.textContent); if (m) fails.push(`${code} [${ui}]: raw key ${m[0]}`);
      }
      S.ui = saved.ui;
    }
    return { fails: [...new Set(fails)].slice(0, 200), n: codes.length };
  } finally { S.ex = saved.ex; S.ui = saved.ui; }
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
    ${uiLangs().filter(c => k.tr[c]).map(c => `<div class="tr-text ${scriptClass(c)} ${L(c).dir === 'rtl' ? 'rtl' : ''}" style="font-size:1rem;margin-top:6px"${dirAttr(c)}>${esc(k.tr[c][0])}<span class="l2">${esc(k.tr[c][1] || '')}</span></div>`).join('')}
    <div class="actions"><button class="btn primary" id="d-recite">🔊 ${t('recite')}</button><a class="btn" href="#/k/${n}">📖</a><a class="btn" href="#/practice/${n}">🎵</a><a class="btn" href="#/cards?n=${n}">🖼️</a></div></div>
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
    <a href="#/cards"><span class="num">🖼️</span><span class="tx">${t('cards')} — ${t('cardsSub')}</span></a>
    <a href="#/verify"><span class="num">✔</span><span class="tx">${t('verify')}</span></a>
    <a href="#/malai"><span class="num">🌺</span><span class="tx">${t('malai')}</span></a>
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
function occName(o) { return S.ui === 'ta' ? o.ta : S.ui === 'hi' && HI.occ[o.id] ? HI.occ[o.id].name : o.en; }
function occNote(o) { return S.ui === 'ta' ? o.note_ta : S.ui === 'hi' && HI.occ[o.id] ? HI.occ[o.id].note : o.note_en; }
async function viewOccasions(id) {
  const oc = await occasions(); const f = firstLang();
  const o = oc.occasions.find(x => x.id === id);
  if (!o) {
    setTitle(t('occasions'), t('occasionsSub'));
    render(`<div class="card"><h2>🎯 ${t('occasions')}</h2><div class="muted">${t('occasionsSub')}</div></div>` +
      oc.groups.map(g => `<div class="card"><h2>${esc(S.ui === 'ta' ? g.ta : (S.ui === 'hi' && HI.occGroup[g.id]) || g.en)}</h2><div class="occ-grid">${oc.occasions.filter(x => x.group === g.id).map(x =>
        `<a class="occ" href="#/occasions/${esc(x.id)}"><span class="ic">${x.icon}</span><b>${esc(occName(x))}</b><span class="muted">${esc(occNote(x))}</span></a>`).join('')}</div></div>`).join('') +
      `<div class="card muted" style="font-size:.85rem">${t('occCurated')}</div>`);
    return;
  }
  const ks = await Promise.all(o.kurals.map(kural));
  const mvs = o.malai && o.malai.length ? (await malai()).verses.filter(v => o.malai.includes(v.n)).sort((a, b) => o.malai.indexOf(a.n) - o.malai.indexOf(b.n)) : [];   // curated order
  setTitle(`${o.icon} ${occName(o)}`, t('occasions'));
  render(`<div class="card"><div class="muted">${esc(occNote(o))}</div></div>` + ks.map(k => {
    const cm = chMeta(chOf(k.n)); const tr = k.tr[f];
    return `<div class="card occ-k" data-n="${k.n}">
      <div class="kural-head"><span class="n">${t('kural')} ${k.n}</span><a class="ch" href="#/ch/${cm.adhigaram}">${esc(cm.name)} · ${esc(enN(cm.name, cm.nameEn))}</a></div>
      <a href="#/k/${k.n}" style="text-decoration:none;color:inherit">${coupletHTML(k)}</a>
      ${tr ? `<div class="tr-text ${scriptClass(f)} ${L(f).dir === 'rtl' ? 'rtl' : ''}" style="font-size:1rem;margin-top:6px"${dirAttr(f)}>${esc(tr[0])}${tr[1] ? `<span class="l2">${esc(tr[1])}</span>` : ''}</div><div class="credit">${esc(L(f).credit)}</div>` : ''}
      <div class="actions"><button class="btn primary occ-share" type="button">⤴ ${t('occShare')}</button><button class="btn occ-card" type="button">🖼️ ${t('occCard')}</button><a class="btn" href="#/k/${k.n}">📖 ${t('occOpen')}</a></div></div>`;
  }).join('') + (mvs.length ? `<h3 class="muted" style="margin:10px 4px 4px">🌺 ${t('malaiFrom')}</h3>` + mvs.map(v => malaiCard(v, { open: true })).join('') : '') + `<div class="row" style="margin:8px 4px"><a class="btn" href="#/occasions">‹ ${t('occAll')}</a></div><div class="card muted" style="font-size:.85rem">${t('occCurated')}</div>`);
  if (mvs.length) wireMalai(mvs);
  $$('.occ-k').forEach(card => {
    const k = ks.find(x => x.n === +card.dataset.n); const cm = chMeta(chOf(k.n));
    card.querySelector('.occ-share').onclick = () => shareKural(k, cm);
    card.querySelector('.occ-card').onclick = e => shareCard(k, cm, e.currentTarget, o);
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
function vStreamLabel(code, r) {
  if (code === 'malai') return `${t('malai')}${r && r.poet ? ' · ' + r.poet : ''}`;
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
  if (queryScripts(q).includes('Tamil')) {
    const tvm = await malai().catch(() => null);
    if (tvm) { D.vtri.malai = D.vtri.malai || tvm.verses.map(v => vTri(vNorm(v.lines.join(' '))));
      tvm.verses.forEach((v, i) => { const sc = vSim(qt, D.vtri.malai[i]); if (sc > 0.45) out.push({ n: v.n, code: 'malai', lines: v.lines, score: sc, poet: v.poet }); }); }
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
    const best = res[0]; const isMalai = best.code === 'malai'; const cm = isMalai ? null : chMeta(chOf(best.n)); const k = isMalai ? null : await kural(best.n);
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
    const credit = isMalai ? '' : (L(best.code) ? L(best.code).credit : (best.code === 'prose-ta' ? 'மு. வரதராசனார் உரை' : ''));
    box.innerHTML = `<div class="card">
      <div class="kural-head"><span class="n">${isMalai ? t('malai') : t('kural')} ${best.n}</span>${isMalai ? `<a class="ch" href="#/malai/${best.n}">${esc(best.poet || '')}</a>` : `<a class="ch" href="#/ch/${cm.adhigaram}">${esc(cm.name)} · ${esc(enN(cm.name, cm.nameEn))}</a>`}<span class="pill">${Math.round(best.score * 100)}% ${t('verifyScore')}</span></div>
      <div class="muted" style="font-size:.85rem">${esc(vStreamLabel(best.code, best))}</div>
      <div class="${diffs ? 'v-diff' : 'v-exact'}">${diffs ? `${diffs} ${t('verifyDiff')}` : t('verifyExact')}</div>
      <div class="v-lbl">${t('verifyQuoted')}</div><div class="v-text ${sc}"${dir}>${quoted}</div>
      <div class="v-lbl">${t('verifyCanon')}</div><div class="v-text ${sc}"${dir}>${canon}</div>
      ${credit ? `<div class="credit">${esc(credit)}</div>` : ''}
      <div class="muted" style="font-size:.75rem;margin-top:6px">${t('verifyLegend')}</div>
      <div class="actions"><button class="btn primary" id="vcopy" type="button">⧉ ${t('verifyCopy')}</button><a class="btn" href="${isMalai ? '#/malai/' : '#/k/'}${best.n}">📖 ${t('occOpen')}</a><button class="btn" id="vshare" type="button">⤴ ${t('share')}</button></div></div>`
      + (res.length > 1 ? `<div class="card"><h3 class="muted" style="margin:0 0 6px">${t('verifyOthers')}</h3><div class="list">${res.slice(1).map(r => `<a href="#/verify?q=${encodeURIComponent(q)}" data-n="${r.n}" data-code="${esc(r.code)}"><span class="num">${r.n}</span><span class="tx"><span class="l">${esc(r.lines[0])}</span>${r.lines[1] ? `<span class="l">${esc(r.lines[1])}</span>` : ''}<span class="muted" style="font-size:.75rem">${esc(vStreamLabel(r.code, r))} · ${Math.round(r.score * 100)}%</span></span></a>`).join('')}</div></div>` : '');
    $('#vcopy').onclick = () => navigator.clipboard.writeText(best.lines.join('\n')).then(() => toast('✓ ' + t('copy'))).catch(() => toast('—'));
    $('#vshare').onclick = () => isMalai ? malaiShare(D.malai.verses[best.n - 1]) : shareKural(k, cm);
    $$('#vres .list a').forEach(a => a.onclick = e => { e.preventDefault(); location.hash = (a.dataset.code === 'malai' ? '#/malai/' : '#/k/') + a.dataset.n; });
  };
  $('#vgo').onclick = run;
  const vp = $('#vpaste'); if (vp) vp.onclick = async () => { try { $('#vq').value = await navigator.clipboard.readText(); run(); } catch (e) { toast('—'); } };
  $('#vq').onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); };
  if (q0) run(); else $('#vq').focus();
}

// ───────────────────────────── திருவள்ளுவமாலை · the garland of tribute verses ─────────────────────────────
async function malai() { return D.malai || (D.malai = await getJSON('data/valluvamalai.json')); }
function malaiVerse(v) { return v.lines.map(l => `<div class="ml">${esc(l)}</div>`).join(''); }
function malaiText(v) { return `திருவள்ளுவமாலை ${v.n} · ${v.poet}\n${v.lines.join('\n')}\n— CICT · ${location.href.split('#')[0]}#/malai/${v.n}`; }
function malaiShare(v) {
  const text = malaiText(v);
  if (NATIVE_SHARE) { try { NATIVE_SHARE.text(`திருவள்ளுவமாலை ${v.n}`, text); return; } catch (e) { } }
  if (navigator.share) navigator.share({ title: `திருவள்ளுவமாலை ${v.n}`, text }).catch(() => { });
  else navigator.clipboard.writeText(text).then(() => toast('✓ ' + t('copy'))).catch(() => toast('—'));
}
function malaiCard(v, opts = {}) {
  const gloss = S.ui === 'ta' ? v.ta : v.en;   // Hindi readers get the English gloss until a Hindi one is commissioned
  // the Tamil பொழிப்புரை is a third-party edition and is credited wherever it is shown
  const glossCredit = S.ui === 'ta' ? (D.malai || {}).gloss_ta_credit : '';
  return `<div class="card malai-card" data-n="${v.n}">
    <div class="kural-head"><span class="n">${t('malai')} ${v.n}</span><a class="ch" href="#/malai/${v.n}">${esc(v.poet)}</a>${v.kind === 'kural' ? `<span class="pill">குறள்</span>` : ''}</div>
    <a href="#/malai/${v.n}" class="malai-lines" style="text-decoration:none;color:inherit">${malaiVerse(v)}</a>
    ${gloss && !opts.brief ? `<div class="malai-gloss"><span class="malai-gloss-tag">${t('malaiGloss')}</span>${esc(gloss)}</div>${glossCredit ? `<div class="credit">${esc(glossCredit)}</div>` : ''}` : ''}
    <div class="actions"><button class="btn primary ml-say" type="button">🔊 ${t('recite')}</button><button class="btn ml-share" type="button">⤴ ${t('share')}</button>${opts.open ? `<a class="btn" href="#/malai/${v.n}">📖 ${t('occOpen')}</a>` : ''}</div></div>`;
}
function wireMalai(list) {
  $$('.malai-card').forEach(card => {
    const v = list.find(x => x.n === +card.dataset.n); if (!v) return;
    const say = card.querySelector('.ml-say'); if (say) say.onclick = e => TTS.speak(v.lines.join(' '), 'ta', e.currentTarget);
    const sh = card.querySelector('.ml-share'); if (sh) sh.onclick = () => malaiShare(v);
  });
}
async function viewMalai(n) {
  const m = await malai(); const vs = m.verses;
  if (!(n >= 1 && n <= vs.length)) {
    setTitle(t('malai'), t('malaiSub'));
    render(`<div class="card"><h2>🌺 ${t('malai')}</h2><div class="muted">${t('malaiSub')}</div><div class="muted" style="font-size:.85rem;margin-top:6px">${t('malaiNote')}</div></div>
      <div class="card list">${vs.map(v => `<a href="#/malai/${v.n}"><span class="num">${v.n}</span><span class="tx"><span class="muted" style="font-size:.8rem">${esc(v.poet)}</span><span class="l">${esc(v.lines[0])}</span></span></a>`).join('')}</div>
      <div class="card muted" style="font-size:.8rem">${t('malaiSource')}</div>`);
    return;
  }
  const v = vs[n - 1];
  setTitle(`${t('malai')} ${n}`, v.poet);
  render(`<div class="nav-pn pn-top">${n > 1 ? `<a class="btn" href="#/malai/${n - 1}">${t('prev')}</a>` : '<span></span>'}<a class="btn" href="#/malai">☰ ${t('malaiAll')}</a>${n < vs.length ? `<a class="btn" href="#/malai/${n + 1}">${t('next')}</a>` : ''}</div>` +
    malaiCard(v) +
    (v.yappu ? `<div class="card"><h2>${t('metre')}</h2>${scanHTML(v.yappu)}</div>` : '') +
    (v.padam && v.padam.length ? `<div class="card"><h2 class="muted" style="font-size:1rem">பதப்பிரிப்பு</h2><div class="malai-lines muted">${v.padam.map(l => `<div class="ml">${esc(l)}</div>`).join('')}</div></div>` : '') +
    (S.ui === 'ta' ? '' : `<div class="ai-note" style="margin:0 4px">${t('malaiDraft')}</div>`));
  wireMalai(vs);
}

async function viewBookmarks() {
  setTitle(t('bookmarks'), '');
  const f = firstLang();
  const ks = await Promise.all(S.bookmarks.map(kural));
  render(`<div class="card list">${ks.length ? ks.map(k => kuralLinkRow(k, f)).join('') : `<div class="muted">${t('noBookmarks')}</div>`}</div>`);
}
async function viewGrammar(type, tag) {
  const tg = await tags(); const g = await glossary().catch(() => ({ terms: {} })); EX.gloss = EX.gloss || g;
  setTitle(t('grammarX'), t('grammar'));
  const types = Object.keys(tg);
  const tabs = `<div class="tabs-inline gx-tabs">${types.map(ty => `<a class="chip ${ty === type ? 'sel' : ''}" href="#/grammar?type=${ty}" ${ty === type ? 'aria-current="page"' : ''}>${esc(t('gxT_' + ty))}</a>`).join('')}</div>`;
  const canon = x => type === 'ani' ? (ANI_CANON[x] || x) : type === 'vetrumai' ? (VET_CANON[x] || x) : x;
  const other = x => type === 'ani' ? ANI_OTHER.has(x) : type === 'vetrumai' ? VET_OTHER.has(x) : false;
  const merged = {}; for (const [k, arr] of Object.entries(tg[type] || {})) { const c = canon(k); const set = merged[c] || (merged[c] = new Set()); arr.forEach(n => set.add(n)); }
  const defOf = x => g.terms[x] || g.terms[String(x).replace(/^\d · /, '')];
  if (!tag) {
    const chip = ([k, set]) => `<a class="chip" href="#/grammar?type=${type}&tag=${encodeURIComponent(k)}" title="${esc(S.ui === 'hi' ? hiGloss(k) || (defOf(k) || {}).en || '' : (defOf(k) || {})[S.ui] || '')}">${esc(exLabel(type, k))} <small>${set.size}</small></a>`;
    const ent = Object.entries(merged).sort((a, b) => b[1].size - a[1].size);
    const main = ent.filter(([k]) => !other(k)), oth = ent.filter(([k]) => other(k));
    render(`<div class="card">${tabs}<div>${main.map(chip).join('')}</div>${oth.length ? `<div class="gx-other"><div class="muted">${t(type === 'vetrumai' ? 'gxOtherVet' : 'gxOther')}</div>${oth.map(chip).join('')}</div>` : ''}</div>`);
    return;
  }
  const ctag = canon(tag); const nums = [...(merged[ctag] || [])].sort((a, b) => a - b);
  const def = defOf(ctag);
  const pr = (await exBank()) ? exTagTopic(type, ctag) : null;
  render(`<div class="card">${tabs}<h2>${esc(exLabel(type, ctag))} <span class="muted">· ${nums.length} ${t('kural')}</span></h2>${def ? `<div class="gloss-tip">${esc(def.ta)}<br><i>${esc((S.ui === 'hi' && hiGloss(ctag)) || def.en)}</i></div>` : ''}${pr ? `<div class="row" style="margin-top:8px"><button class="btn" id="gx-pr">${t('gxPractise')}</button></div>` : ''}</div><div class="card list" id="gl"><div class="muted">…</div></div>`);
  if (pr) $('#gx-pr').onclick = () => { EX.start = { t: pr.t, sk: pr.sk, src: 'book' }; location.hash = '#/exam/go'; };
  const ta = await sindex('ta'); const gl = $('#gl'); if (!gl) return;
  gl.innerHTML = nums.slice(0, 400).map(n => `<a href="#/k/${n}"><span class="num">${n}</span><span class="tx"><span class="l">${esc(ta[n - 1][1])} ${esc(ta[n - 1][2])}</span></span></a>`).join('') + (nums.length > 400 ? `<div class="muted">… +${nums.length - 400}</div>` : '');
}
async function viewSettings() {
  setTitle(t('settings'), '');
  const voiceRows = ['ta', ...S.langs.filter(c => c !== 'ta')].map(c => {
    const cands = TTS.candidates(c);
    return `<div class="toggle"><label>${esc(L(c).native)} <span class="muted">${esc(L(c).name)}</span></label><select data-v="${c}" style="max-width:55%">${cands.length ? `<option value="">${t('auto')}</option>` + cands.map(v => `<option value="${esc(v.voiceURI)}" ${S.voices[c] === v.voiceURI ? 'selected' : ''}>${esc(v.name)} (${v.lang})</option>`).join('') : `<option value="">— ${t('noVoice')}</option>`}</select></div>`;
  }).join('');
  render(`<div class="card"><h2>${t('langs')}</h2><div class="row">${S.langs.map(c => `<span class="chip sel ${scriptClass(c)}">${esc(L(c).native)}</span>`).join('')}<button class="btn small" id="s-langs">🌐 ${t('chooseLangs')}</button></div></div>
  <div class="card">
    <div class="toggle"><label>UI</label><select id="s-ui" style="max-width:50%"><option value="ta" ${S.ui === 'ta' ? 'selected' : ''}>தமிழ்</option><option value="en" ${S.ui === 'en' ? 'selected' : ''}>English</option><option value="hi" ${S.ui === 'hi' ? 'selected' : ''}>हिन्दी</option></select></div>
    <div class="toggle"><label for="s-tl">${t('translit')}</label><input type="checkbox" class="switch" id="s-tl" ${S.showTranslit ? 'checked' : ''}></div>
    <div class="toggle"><label for="s-pr">${t('showProse')}</label><input type="checkbox" class="switch" id="s-pr" ${S.showProse ? 'checked' : ''}></div>
    <div class="toggle"><label>${t('fontSize')}</label><input type="range" id="s-fs" min="0.85" max="1.4" step="0.05" value="${S.fontScale}" style="max-width:50%"></div>
    <div class="toggle"><label>${t('theme')}</label><select id="s-th" style="max-width:50%"><option value="auto" ${S.theme === 'auto' ? 'selected' : ''}>${t('auto')}</option><option value="light" ${S.theme === 'light' ? 'selected' : ''}>${t('light')}</option><option value="dark" ${S.theme === 'dark' ? 'selected' : ''}>${t('dark')}</option></select></div>
  </div>
  <div class="card"><h2>🔊 ${t('voice')}</h2>${voiceRows}<div class="toggle"><label>${t('rate')} <b id="rv">${S.rate}</b>×</label><input type="range" id="s-rate" min="0.6" max="1.4" step="0.05" value="${S.rate}" style="max-width:50%"></div></div>
  <div class="card"><h2>🔔 ${t('notify')}</h2><div class="toggle"><label for="s-nt">${t('notify')}</label><input type="checkbox" class="switch" id="s-nt" ${S.notify ? 'checked' : ''}></div><div class="toggle"><label>${t('notifyTime')}</label><input type="time" id="s-ntime" value="${S.notifyTime}" style="max-width:140px"></div></div>
  <div class="row"><a class="btn" href="#/offline">📥 ${t('offline')}</a><a class="btn" href="#/about">ℹ ${t('about')}</a></div>`);
  $('#s-langs').onclick = openLangSheet;
  $('#s-ui').onchange = e => { setUi(e.target.value); viewSettings(); };
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
  const textUrls = ['assets/fonts.css', ...FONT_URLS, 'kattam/index.html', 'kattam/app.js', 'kattam/styles.css', 'kattam/assets/icon.svg', 'kattam/data/meta.json', 'kattam/data/mini.json', 'kattam/data/weekly.json', 'data/occasions.json', 'data/ex.json', 'data/valluvamalai.json']; for (let i = 1; i <= 133; i++) textUrls.push(`data/ch/${pad(i, 3)}.json`, `data/gr/${pad(i, 3)}.json`);
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
  $('#btn-uilang').onclick = openUiSheet;
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
