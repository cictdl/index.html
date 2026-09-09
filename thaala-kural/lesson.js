/* தாளக் குறள் — யாப்புப் பாடம் · the fifteen-step lesson.
   1–4 the two அசை · 5 சீர் · 6–9 the four classes of சீர் · 10 தளை · 11 அடி · 12 தொடை ·
   13 பா · 14 பாவினம் · 15 kural 1 again.
   Loaded after app.js and uses its helpers (render, setTop, esc, t, S, META, TTS, SFX, kural).
   Every example is split by hand with the three rules steps 1–4 teach:
     1. ஒற்று never counts and never starts an அசை;
     2. a நிரை must begin with an OPEN குறில் (a நெடில் never pairs);
     3. an ஒற்று closes the syllable before it, and a closed syllable is நேர்.
   Real Kural examples come from META.seerExamples / META.eetruExamples and from the chapter
   data (சீர் names, தளை labels), all produced by the reference scanner via build_data.py. */
'use strict';

// X('கற்க', 'N:கற் N:க', 'தேமா') -> { w, a: [{k, s}], name }.  k: N நேர் · I நிரை · P a soft final உ
function X(word, spec, name) { return { w: word, name: name || null, a: spec ? spec.split(' ').map(p => { const [k, s] = p.split(':'); return { k, s }; }) : [] }; }
const TAP = { N: 'தா', I: 'தக', P: '(தா)' };
const pattern = a => a.map(x => TAP[x.k] || '?').join(' · ');
const pick = (arr, n) => arr.slice().sort(() => Math.random() - 0.5).slice(0, n);
const LK = {};   // kurals loaded for the current step, by number

const TWO = [X('தேமா', 'N:தே N:மா', 'தேமா'), X('புளிமா', 'I:புளி N:மா', 'புளிமா'), X('கூவிளம்', 'N:கூ I:விளம்', 'கூவிளம்'), X('கருவிளம்', 'I:கரு I:விளம்', 'கருவிளம்')];
const THREE = [
  X('தேமாங்காய்', 'N:தே N:மாங் N:காய்', 'தேமாங்காய்'), X('புளிமாங்காய்', 'I:புளி N:மாங் N:காய்', 'புளிமாங்காய்'),
  X('கூவிளங்காய்', 'N:கூ I:விளங் N:காய்', 'கூவிளங்காய்'), X('கருவிளங்காய்', 'I:கரு I:விளங் N:காய்', 'கருவிளங்காய்'),
  X('தேமாங்கனி', 'N:தே N:மாங் I:கனி', 'தேமாங்கனி'), X('புளிமாங்கனி', 'I:புளி N:மாங் I:கனி', 'புளிமாங்கனி'),
  X('கூவிளங்கனி', 'N:கூ I:விளங் I:கனி', 'கூவிளங்கனி'), X('கருவிளங்கனி', 'I:கரு I:விளங் I:கனி', 'கருவிளங்கனி')];
const FOUR = [
  X('தேமாந்தண்பூ', 'N:தே N:மாந் N:தண் N:பூ', 'தேமாந்தண்பூ'), X('தேமாநறும்பூ', 'N:தே N:மா I:நறும் N:பூ', 'தேமாநறும்பூ'),
  X('தேமாந்தண்ணிழல்', 'N:தே N:மாந் N:தண் I:ணிழல்', 'தேமாந்தண்ணிழல்'), X('தேமாநறுநிழல்', 'N:தே N:மா I:நறு I:நிழல்', 'தேமாநறுநிழல்'),
  X('புளிமாந்தண்பூ', 'I:புளி N:மாந் N:தண் N:பூ', 'புளிமாந்தண்பூ'), X('புளிமாநறும்பூ', 'I:புளி N:மா I:நறும் N:பூ', 'புளிமாநறும்பூ'),
  X('புளிமாந்தண்ணிழல்', 'I:புளி N:மாந் N:தண் I:ணிழல்', 'புளிமாந்தண்ணிழல்'), X('புளிமாநறுநிழல்', 'I:புளி N:மா I:நறு I:நிழல்', 'புளிமாநறுநிழல்'),
  X('கூவிளந்தண்பூ', 'N:கூ I:விளந் N:தண் N:பூ', 'கூவிளந்தண்பூ'), X('கூவிளநறும்பூ', 'N:கூ I:விள I:நறும் N:பூ', 'கூவிளநறும்பூ'),
  X('கூவிளந்தண்ணிழல்', 'N:கூ I:விளந் N:தண் I:ணிழல்', 'கூவிளந்தண்ணிழல்'), X('கூவிளநறுநிழல்', 'N:கூ I:விள I:நறு I:நிழல்', 'கூவிளநறுநிழல்'),
  X('கருவிளந்தண்பூ', 'I:கரு I:விளந் N:தண் N:பூ', 'கருவிளந்தண்பூ'), X('கருவிளநறும்பூ', 'I:கரு I:விள I:நறும் N:பூ', 'கருவிளநறும்பூ'),
  X('கருவிளந்தண்ணிழல்', 'I:கரு I:விளந் N:தண் I:ணிழல்', 'கருவிளந்தண்ணிழல்'), X('கருவிளநறுநிழல்', 'I:கரு I:விள I:நறு I:நிழல்', 'கருவிளநறுநிழல்')];
const ADI = ['குறளடி', 'சிந்தடி', 'அளவடி', 'நெடிலடி', 'கழிநெடிலடி'];
const ADI_OF = n => n <= 2 ? 'குறளடி' : n === 3 ? 'சிந்தடி' : n === 4 ? 'அளவடி' : n === 5 ? 'நெடிலடி' : 'கழிநெடிலடி';
const VENBA = ['குறள் வெண்பா', 'சிந்தியல் வெண்பா', 'இன்னிசை வெண்பா', 'நேரிசை வெண்பா', 'பஃறொடை வெண்பா'];
const PAVINAM = ['ஆசிரியத் தாழிசை', 'ஆசிரியத் துறை', 'ஆசிரிய விருத்தம்', 'வெண்டாழிசை', 'வெண்டுறை', 'வெளிவிருத்தம்',
  'கலித்தாழிசை', 'கலித்துறை', 'கலிவிருத்தம்', 'வஞ்சித்தாழிசை', 'வஞ்சித்துறை', 'வஞ்சி விருத்தம்'];

// Real Kural examples of a சீர் name, from the metre data (label carries the kural number).
function fromKural(name, max) {
  const exs = ((META && META.seerExamples) || {})[name] || [];
  return exs.slice(0, max == null ? 2 : max).map(e => ({ w: e.w, a: e.a, name, label: `${name} · ${pattern(e.a)} · குறள் ${e.n}` }));
}
function eetru(form, max) {
  const exs = ((META && META.eetruExamples) || {})[form] || [];
  const soft = form === 'காசு' || form === 'பிறப்பு';
  return exs.slice(0, max == null ? 2 : max).map(e => {
    // the scanner lists the final குற்றியலுகரம் as its own நேர்; the lesson shows it as the soft உ
    const a = e.a.map((x, i) => (soft && i === e.a.length - 1 && /[குசுடுதுபுறு]$/.test(x.s)) ? { k: 'P', s: x.s } : x);
    return { w: e.w, a, name: form, label: `${form} · ${pattern(a)} · குறள் ${e.n}` };
  });
}
// Tamil letters (அக்ஷரம்): a vowel sign or புள்ளி attaches to the consonant before it
function letters(s) {
  const out = [];
  for (const ch of s) {
    const c = ch.codePointAt(0);
    const sign = (c >= 0x0BBE && c <= 0x0BCD) || c === 0x0BD7;
    if (sign && out.length) out[out.length - 1] += ch; else out.push(ch);
  }
  return out;
}
const lineOf = (n, li) => LK[n] ? LK[n].lines[li].seers.map(s => s.w).join(' · ') : '';

const LESSON = [
  {
    title: 'நீண்ட ஒலி: ஒரு தட்டு', en: 'A long sound is one beat: தா',
    text: 'ஆ, கா, தே போன்ற நீண்ட ஒலி தனியாக ஒரு தட்டு. பின்னால் புள்ளி எழுத்து (ர், ல், ள்) வந்தாலும் அதே ஒரு தட்டுதான். இதுதான் <b>நேர்</b>: ஆரஞ்சுப் பலகை, <b>தா</b>.',
    enText: 'A long sound is a full beat by itself, even with a dotted letter after it. This is நேர், the orange pad.',
    ex: [X('ஆ', 'N:ஆ'), X('கா', 'N:கா'), X('தே', 'N:தே'), X('நீர்', 'N:நீர்'), X('நாள்', 'N:நாள்'), X('பால்', 'N:பால்')],
  },
  {
    title: 'இரு குறு ஒலிகள் கைகோர்க்கும்', en: 'Two short sounds hold hands: தக',
    text: 'கி போன்ற குறு ஒலி தனியாக நடக்காது; அடுத்த ஒலியுடன் கைகோர்த்து ஒரே தட்டாகும்: கி+ளி, பு+றா, ம+லை. இரண்டுக்கும் பின்னால் புள்ளி வந்தாலும் அதே ஒரு தட்டு: ம+யில். இதுதான் <b>நிரை</b>: நீலப் பலகை, <b>தக</b>.',
    enText: 'A short sound cannot walk alone; it holds hands with the next sound and the two make one beat, even with a dot after the pair. This is நிரை, the teal pad.',
    ex: [X('கிளி', 'I:கிளி'), X('புறா', 'I:புறா'), X('மலை', 'I:மலை'), X('மயில்', 'I:மயில்'), X('இறால்', 'I:இறால்'), X('மரம்', 'I:மரம்')],
    quiz: { mode: 'tap', items: [X('கா', 'N:கா'), X('கிளி', 'I:கிளி'), X('நீர்', 'N:நீர்'), X('புறா', 'I:புறா'), X('மலை', 'I:மலை'), X('நாள்', 'N:நாள்')] },
  },
  {
    title: 'புள்ளி கதவை மூடும்', en: 'The dot closes the door',
    text: 'குறு ஒலிக்குப் பின் உடனே புள்ளி வந்தால் (கல், கற், தன்) கதவு மூடிவிட்டது: அது தனியாக ஒரு தட்டு, <b>நேர்</b>. கற்க = கற் + க: <b>தா தா</b>. ஆனால் கசடறக் = கச + டறக்: <b>தக தக</b>, ஏனெனில் புள்ளி ஒவ்வொரு ஜோடிக்கும் பிறகே வருகிறது.',
    enText: 'A dot right after a short sound closes it, and a closed sound is always one beat: கற்க is தா தா, but கசடறக் is தக தக because each dot comes after a pair.',
    ex: [X('கல்', 'N:கல்'), X('கற்க', 'N:கற் N:க'), X('தன்', 'N:தன்'), X('அன்பு', 'N:அன் N:பு'), X('நன்றி', 'N:நன் N:றி'), X('கசடறக்', 'I:கச I:டறக்')],
    quiz: { mode: 'tap', items: [X('கல்', 'N:கல்'), X('கற்க', 'N:கற் N:க'), X('மயில்', 'I:மயில்'), X('அன்பு', 'N:அன் N:பு'), X('கசடறக்', 'I:கச I:டறக்'), X('மரம்', 'I:மரம்')] },
  },
  {
    title: 'நெடில் யாருடனும் சேராது', en: 'A long sound never pairs',
    text: 'நீண்ட ஒலி ஏற்கெனவே முழுத் தட்டு; அது ஜோடி சேராது. காடு = கா + டு: <b>தா தா</b>. ஆசை = ஆ + சை: <b>தா தா</b>. ஆனால் மலை = ம + லை: ஒரே <b>தக</b>, ஏனெனில் முதல் ஒலி குறு. குழந்தைகள் அதிகம் தவறும் இடம் இதுவே.',
    enText: 'A long sound is already a full beat and never pairs. காடு is தா தா; மலை is one தக because its first sound is short. This is the trap children fall into most.',
    ex: [X('காடு', 'N:கா N:டு'), X('ஆசை', 'N:ஆ N:சை'), X('வீடு', 'N:வீ N:டு'), X('மலை', 'I:மலை'), X('கடல்', 'I:கடல்'), X('பாலை', 'N:பா N:லை')],
    quiz: { mode: 'tap', items: [X('காடு', 'N:கா N:டு'), X('மலை', 'I:மலை'), X('வீடு', 'N:வீ N:டு'), X('கடல்', 'I:கடல்'), X('ஆசை', 'N:ஆ N:சை'), X('புறா', 'I:புறா')] },
  },
  {
    title: 'அசைகள் சேர்ந்தால் சீர்', en: 'அசை join to make a சீர்',
    text: 'ஒன்று முதல் நான்கு அசைகள் சேர்ந்தது ஒரு <b>சீர்</b>. பெரும்பாலும் ஒரு சொல் ஒரு சீர்; ஆனால் சீர் ஒலியைப் பின்பற்றும், எழுத்தை அல்ல: <b>கசடறக்</b> என்ற சீரின் கடைசி க் அடுத்த சொல்லிலிருந்து வந்தது. சீர்கள் சேர்ந்தால் <b>அடி</b>: நான்கு சீர் = அளவடி (குறளின் முதல் அடி), மூன்று சீர் = சிந்தடி (இரண்டாம் அடி). ஒவ்வொரு சீரின் முதல் தட்டு சற்று அழுத்தமாக ஒலிக்கும்: கேள்.',
    enText: 'One to four அசை make a சீர். Usually a word is a சீர், but a சீர் follows sound, not spelling: the final க் of கசடறக் belongs to the next word. சீர் join to make a line: four make an அளவடி, the kural\'s first line; three a சிந்தடி, its second. The first beat of each சீர் is a little stronger: listen.',
    ex: [], kural: 391, lineOnly: 0,
    quiz: { mode: 'count', items: [X('கற்க', 'N:கற் N:க'), X('நாள்', 'N:நாள்'), X('எழுத்தெல்லாம்', 'I:எழுத் N:தெல் N:லாம்'), X('கசடறக்', 'I:கச I:டறக்'), X('மலர்', 'I:மலர்'), X('தேமாந்தண்பூ', 'N:தே N:மாந் N:தண் N:பூ'), X('புளிமாங்காய்', 'I:புளி N:மாங் N:காய்'), X('கருவிளம்', 'I:கரு I:விளம்')] },
  },
  {
    title: 'ஓரசைச் சீர்', en: 'One-அசை சீர்: நாள், மலர்',
    text: 'ஓர் அசையே சீராக நிற்பது <b>ஓரசைச் சீர்</b>. நேர் என்றால் <b>நாள்</b>; நிரை என்றால் <b>மலர்</b>. இது வெண்பாவின் கடைசிச் சீர்: நாள், மலர் — அல்லது கடைசியில் மென்மையான உகரம் சேர்ந்த <b>காசு</b> (நேர்பு), <b>பிறப்பு</b> (நிரைபு). குறளின் ஒவ்வொரு இரண்டாம் அடியும் இந்த நான்கில் ஒன்றால் முடியும்.',
    enText: 'A single அசை standing as a சீர் is an ஓரசைச் சீர்: நாள் for நேர், மலர் for நிரை. It is the last சீர் of a வெண்பா, with the soft-உ forms காசு and பிறப்பு. Every kural\'s second line ends in one of these four.',
    groups: () => [
      ['நாள் (நேர்)', [X('க', 'N:க', 'நாள்'), X('கல்', 'N:கல்', 'நாள்'), X('கா', 'N:கா', 'நாள்'), X('கால்', 'N:கால்', 'நாள்'), ...eetru('நாள்', 2)]],
      ['மலர் (நிரை)', [X('கடு', 'I:கடு', 'மலர்'), X('கடல்', 'I:கடல்', 'மலர்'), X('பலா', 'I:பலா', 'மலர்'), X('வரால்', 'I:வரால்', 'மலர்'), ...eetru('மலர்', 2)]],
      ['காசு (நேர்பு) · பிறப்பு (நிரைபு)', [X('காசு', 'N:கா P:சு', 'காசு'), X('பிறப்பு', 'I:பிறப் P:பு', 'பிறப்பு'), ...eetru('காசு', 2), ...eetru('பிறப்பு', 2)]],
    ],
    quiz: { mode: 'name', options: ['நாள்', 'மலர்'], items: [X('கல்', 'N:கல்', 'நாள்'), X('கடல்', 'I:கடல்', 'மலர்'), X('கா', 'N:கா', 'நாள்'), X('பலா', 'I:பலா', 'மலர்'), X('வரால்', 'I:வரால்', 'மலர்'), X('கால்', 'N:கால்', 'நாள்')] },
  },
  {
    title: 'ஈரசைச் சீர்', en: 'Two-அசை சீர்: the four இயற்சீர்',
    text: 'இரண்டு அசை = <b>ஈரசைச் சீர்</b>; நான்கே வகை. பெயர்களே தங்கள் தாளத்தைச் சொல்லும்: தே-மா = <b>தா தா</b>, பு-ளி-மா = <b>தக தா</b>, கூ-வி-ளம் = <b>தா தக</b>, க-ரு-வி-ளம் = <b>தக தக</b>. நேரில் முடிவது <b>மாச்சீர்</b>, நிரையில் முடிவது <b>விளச்சீர்</b>. இவை <b>இயற்சீர்</b>; வெண்பாவின் பெரும்பகுதி இவையே.',
    enText: 'Two அசை make an ஈரசைச் சீர், of which there are exactly four, and the names scan themselves. Those ending in நேர் are மாச்சீர், those ending in நிரை are விளச்சீர். Together they are the இயற்சீர், and most of a வெண்பா is made of them.',
    groups: () => TWO.map(nm => [nm.name, [nm, ...fromKural(nm.name, 2)]]),
    quiz: { mode: 'name', options: TWO.map(x => x.name), items: [X('வானம்', 'N:வா N:னம்', 'தேமா'), X('மரங்கள்', 'I:மரங் N:கள்', 'புளிமா'), X('கற்பவை', 'N:கற் I:பவை', 'கூவிளம்'), X('கசடறக்', 'I:கச I:டறக்', 'கருவிளம்'), X('காலை', 'N:கா N:லை', 'தேமா'), X('தமிழர்', 'I:தமி N:ழர்', 'புளிமா'), X('நீருள', 'N:நீ I:ருள', 'கூவிளம்'), X('கடலலை', 'I:கட I:லலை', 'கருவிளம்')] },
  },
  {
    title: 'மூவசைச் சீர்', en: 'Three-அசை சீர்: காய் and கனி',
    text: 'மூன்று அசை = <b>மூவசைச் சீர்</b>. ஈரசைப் பெயருடன் மூன்றாவது அசைக்கு <b>காய்</b> (நேர்) அல்லது <b>கனி</b> (நிரை) சேர்க்க: எட்டு வகை. காய்ச்சீர் நான்கும் <b>வெண்சீர்</b>; வெண்பாவில் வருவன இவையே. கனிச்சீர் நான்கும் <b>வஞ்சிச்சீர்</b>; வஞ்சிப்பாவுக்கு உரியவை.',
    enText: 'Three அசை make a மூவசைச் சீர். Add காய் for a third நேர் or கனி for a third நிரை to the two-அசை name: eight kinds. The four காய் forms are the வெண்சீர் of வெண்பா; the four கனி forms belong to வஞ்சிப்பா.',
    groups: () => [['காய்ச்சீர் · வெண்சீர்', THREE.slice(0, 4).flatMap(nm => [nm, ...fromKural(nm.name, 1)])],
                   ['கனிச்சீர் · வஞ்சிச்சீர்', THREE.slice(4).flatMap(nm => [nm, ...fromKural(nm.name, 1)])]],
    quiz: { mode: 'name', pool: THREE.map(x => x.name), items: () => THREE.map(nm => { const k = fromKural(nm.name, 1)[0]; return k ? { w: k.w, a: k.a, name: nm.name } : { w: nm.w, a: nm.a, name: nm.name, hideWord: true }; }) },
  },
  {
    title: 'நாலசைச் சீர்', en: 'Four-அசை சீர்: sixteen compound names',
    text: 'நான்கு அசை = <b>நாலசைச் சீர்</b>: பதினாறு வகை. பெயர் கூட்டுப் பெயர்: ஈரசைப் பெயர் + மூன்றாவது அசைக்கு <b>தண்</b> (நேர்) / <b>நறு</b> (நிரை) + நான்காவது அசைக்கு <b>பூ</b> (நேர்) / <b>நிழல்</b> (நிரை). இவை <b>பொதுச்சீர்</b>: கலிப்பா, வஞ்சிப்பாவில் வரும்; குறளில் அரிது.',
    enText: 'Four அசை make a நாலசைச் சீர், sixteen kinds with compositional names: the two-அசை name, then தண் (நேர்) or நறு (நிரை) for the third beat, then பூ (நேர்) or நிழல் (நிரை) for the fourth. These பொதுச்சீர் belong to கலிப்பா and வஞ்சிப்பா and are rare in the Kural.',
    groups: () => [['தண்பூ · நறும்பூ · தண்ணிழல் · நறுநிழல்', FOUR], ['குறளில்', FOUR.flatMap(nm => fromKural(nm.name, 1))]],
    quiz: { mode: 'name', pool: FOUR.map(x => x.name), items: () => pick(FOUR, 6).map(nm => ({ w: nm.w, a: nm.a, name: nm.name, hideWord: true })) },
  },
  {
    title: 'தளை: சீர்கள் இணையும் கட்டு', en: 'தளை: how two சீர் join',
    text: 'இரண்டு சீர்கள் இணையும் விதம் <b>தளை</b>; தளை என்றால் கட்டு. வெண்பாவின் விதி <b>முரண்</b>: நேரில் முடியும் மாச்சீருக்குப் பின் நிரையும், நிரையில் முடியும் விளச்சீருக்குப் பின் நேரும் வரும்: <b>இயற்சீர் வெண்டளை</b>. காய்ச்சீருக்குப் பின் நேர்: <b>வெண்சீர் வெண்டளை</b>. மொத்தம் ஏழு தளைகள்: மற்ற ஐந்து (நேரொன்று · நிரையொன்று ஆசிரியத்தளை, கலித்தளை, ஒன்றிய · ஒன்றாத வஞ்சித்தளை) பிற பாக்களுக்கு உரியவை. குறளின் ஒவ்வொரு இணைப்பும் வெண்டளையே: கீழே ஒவ்வொரு இணைப்பையும் பார்.',
    enText: 'How two சீர் join is the தளை, literally a binding. The வெண்பா rule is contrast: after a மாச்சீர் ending in நேர் comes நிரை, after a விளச்சீர் ending in நிரை comes நேர் (இயற்சீர் வெண்டளை); after a காய்ச்சீர் comes நேர் (வெண்சீர் வெண்டளை). There are seven தளை in all; the other five belong to the other பா. Every junction in the Kural is a வெண்டளை: look at each one below.',
    ex: [], kural: 391, lineOnly: 0, junctions: true,
    quiz: { mode: 'next', items: [X('தேமா', 'N:தே N:மா', 'இயற்சீர் வெண்டளை'), X('புளிமா', 'I:புளி N:மா', 'இயற்சீர் வெண்டளை'), X('கூவிளம்', 'N:கூ I:விளம்', 'இயற்சீர் வெண்டளை'), X('கருவிளம்', 'I:கரு I:விளம்', 'இயற்சீர் வெண்டளை'), X('தேமாங்காய்', 'N:தே N:மாங் N:காய்', 'வெண்சீர் வெண்டளை'), X('புளிமாங்காய்', 'I:புளி N:மாங் N:காய்', 'வெண்சீர் வெண்டளை')].map(it => ({ ...it, next: it.a.length === 3 ? 'N' : (it.a[it.a.length - 1].k === 'N' ? 'I' : 'N') })) },
  },
  {
    title: 'அடி: சீர்கள் சேர்ந்த வரி', en: 'அடி: the line',
    text: 'சீர்கள் சேர்ந்த ஒரு வரி <b>அடி</b>. சீர் எண்ணிக்கையால் ஐந்து வகை: இரண்டு சீர் <b>குறளடி</b>, மூன்று <b>சிந்தடி</b>, நான்கு <b>அளவடி</b>, ஐந்து <b>நெடிலடி</b>, ஆறும் அதற்கு மேலும் <b>கழிநெடிலடி</b>. குறள் வெண்பாவின் முதல் அடி அளவடி, இரண்டாம் அடி சிந்தடி; பல அடிகள் சேர்ந்ததே செய்யுள், அடிகளே செய்யுளை வகைப்படுத்தும்.',
    enText: 'A line of சீர் is an அடி. By its count of சீர்: two make a குறளடி, three a சிந்தடி, four an அளவடி, five a நெடிலடி, six or more a கழிநெடிலடி. A குறள் வெண்பா is an அளவடி followed by a சிந்தடி. Lines make the verse, and lines are what classify it.',
    ex: [], kural: 1, needs: [1, 2],
    table: { head: ['சீர்', 'அடி'], rows: [['2', 'குறளடி'], ['3', 'சிந்தடி'], ['4', 'அளவடி'], ['5', 'நெடிலடி'], ['6+', 'கழிநெடிலடி']] },
    quiz: { mode: 'name', options: ADI, items: () => [
      { w: lineOf(1, 0), a: [], name: 'அளவடி' }, { w: lineOf(1, 1), a: [], name: 'சிந்தடி' },
      { w: lineOf(2, 0), a: [], name: 'அளவடி' }, { w: lineOf(2, 1), a: [], name: 'சிந்தடி' },
      { w: 'தேமா · புளிமா', a: [], name: 'குறளடி' }, { w: 'தேமா · புளிமா · கூவிளம் · கருவிளம் · தேமாங்காய்', a: [], name: 'நெடிலடி' },
      { w: 'தேமா · புளிமா · கூவிளம் · கருவிளம் · தேமாங்காய் · புளிமாங்காய்', a: [], name: 'கழிநெடிலடி' }] },
  },
  {
    title: 'தொடை: மோனை, எதுகை, இயைபு', en: 'தொடை: how lines rhyme',
    text: 'அடிகள் தொடுக்கப்படுவது <b>தொடை</b>. இரு அடிகளின் <b>முதல் எழுத்து</b> ஒன்றி வந்தால் <b>மோனை</b>; <b>இரண்டாம் எழுத்து</b> ஒன்றினால் <b>எதுகை</b>; <b>கடைசி எழுத்து</b> ஒன்றினால் <b>இயைபு</b>. குறள் 411-ன் இரு அடிகளும் <b>செ</b>-யில் தொடங்கும்: மோனை. குறள் 391-ல் இரண்டாம் எழுத்து <b>ற்</b> இரண்டிலும்: எதுகை. ஒரே அடிக்குள் சீர்களுக்கு இடையேயும் தொடை வரும்.',
    enText: 'Lines are threaded together by தொடை. When two lines share their first letter it is மோனை; their second letter, எதுகை; their last letter, இயைபு. Both lines of kural 411 begin with செ: மோனை. Both lines of kural 391 have ற் as second letter: எதுகை. The same threading also runs between the சீர் inside one line.',
    pairs: [
      { lines: ['செல்வத்துள் செல்வம் செவிச்செல்வம் அச்செல்வம்', 'செல்வத்துள் எல்லாம் தலை'], kind: 'மோனை', idx: 0, note: 'முதல் எழுத்து ஒன்று · குறள் 411' },
      { lines: ['கற்க கசடறக் கற்பவை', 'கற்றபின் நிற்க அதற்குத் தக'], kind: 'எதுகை', idx: 1, note: 'இரண்டாம் எழுத்து ஒன்று · குறள் 391' },
      { lines: ['மயில்', 'மரம்'], kind: 'மோனை', idx: 0, note: 'முதல் எழுத்து ம' },
      { lines: ['அன்பு', 'இன்பம்'], kind: 'எதுகை', idx: 1, note: 'இரண்டாம் எழுத்து ன்' },
      { lines: ['கடல்', 'மயில்'], kind: 'இயைபு', idx: -1, note: 'கடைசி எழுத்து ல்' },
    ],
    quiz: { mode: 'name', options: ['மோனை', 'எதுகை', 'இயைபு'], items: [
      { w: 'மயில் · மரம்', a: [], name: 'மோனை' }, { w: 'அன்பு · இன்பம்', a: [], name: 'எதுகை' }, { w: 'கடல் · மயில்', a: [], name: 'இயைபு' },
      { w: 'கடல் · கனி', a: [], name: 'மோனை' }, { w: 'கல்வி · செல்வம்', a: [], name: 'எதுகை' }, { w: 'பாடல் · மயில்', a: [], name: 'இயைபு' },
      { w: 'தமிழ் · தலை', a: [], name: 'மோனை' }, { w: 'பறவை · உறவு', a: [], name: 'எதுகை' }, { w: 'பழம் · நிலம்', a: [], name: 'இயைபு' }] },
  },
  {
    title: 'பா: செய்யுளின் வகை', en: 'பா: the four verse forms',
    text: '<b>பா</b> என்பது செய்யுளின் வகை; நான்கு: <b>ஆசிரியப்பா</b> (அகவல் ஓசை), <b>வெண்பா</b> (செப்பல் ஓசை), <b>கலிப்பா</b> (துள்ளல் ஓசை), <b>வஞ்சிப்பா</b> (தூங்கல் ஓசை). ஓசையே பாவைப் பிரிக்கும்; ஒவ்வொன்றுக்கும் உரிய சீர், தளை, அடி உண்டு. வெண்பாவின் வகைகள் அடி எண்ணிக்கையால்: <b>குறள்</b> (2), <b>சிந்தியல்</b> (3), <b>இன்னிசை</b> (4, தனிச்சொல் இல்லை), <b>நேரிசை</b> (4, தனிச்சொல் உண்டு), <b>பஃறொடை</b> (5+). திருக்குறளின் 1,330-ம் குறள் வெண்பா.',
    enText: 'A பா is a verse form; there are four, each with its own sound: ஆசிரியப்பா (அகவல்), வெண்பா (செப்பல்), கலிப்பா (துள்ளல்), வஞ்சிப்பா (தூங்கல்). The sound is what separates them, and each has its own சீர், தளை and அடி. The kinds of வெண்பா go by line count: குறள் (2), சிந்தியல் (3), இன்னிசை (4, no தனிச்சொல்), நேரிசை (4, with a தனிச்சொல்), பஃறொடை (5 or more). All 1,330 kurals are குறள் வெண்பா.',
    table: { head: ['பா', 'ஓசை'], rows: [['ஆசிரியப்பா', 'அகவல்'], ['வெண்பா', 'செப்பல்'], ['கலிப்பா', 'துள்ளல்'], ['வஞ்சிப்பா', 'தூங்கல்']] },
    table2: { head: ['வெண்பா', 'அடி'], rows: [['குறள் வெண்பா', '2'], ['சிந்தியல் வெண்பா', '3'], ['இன்னிசை வெண்பா', '4 · தனிச்சொல் இல்லை'], ['நேரிசை வெண்பா', '4 · தனிச்சொல் உண்டு'], ['பஃறொடை வெண்பா', '5 அல்லது மேல்']] },
    quiz: { mode: 'name', options: VENBA, items: [
      { w: '2 அடி', a: [], name: 'குறள் வெண்பா' }, { w: '3 அடி', a: [], name: 'சிந்தியல் வெண்பா' },
      { w: '4 அடி · தனிச்சொல் இல்லை', a: [], name: 'இன்னிசை வெண்பா' }, { w: '4 அடி · தனிச்சொல் உண்டு', a: [], name: 'நேரிசை வெண்பா' },
      { w: '5 அடிக்கு மேல்', a: [], name: 'பஃறொடை வெண்பா' }, { w: 'திருக்குறள்', a: [], name: 'குறள் வெண்பா' }] },
  },
  {
    title: 'பாவினம்: தாழிசை, துறை, விருத்தம்', en: 'பாவினம்: the kindred forms',
    text: 'பாக்களின் ஓசையை ஒட்டி வருவன <b>பாவினம்</b>: <b>தாழிசை, துறை, விருத்தம்</b> — ஒவ்வொரு பாவுக்கும் மூன்று. ஆசிரியத் தாழிசை, ஆசிரியத் துறை, ஆசிரிய விருத்தம்; வெண்டாழிசை, வெண்டுறை, வெளிவிருத்தம்; கலித்தாழிசை, கலித்துறை, கலிவிருத்தம்; வஞ்சித்தாழிசை, வஞ்சித்துறை, வஞ்சி விருத்தம். பெயரே சொல்லும்: பா + இனம். ஒவ்வொன்றுக்கும் தனி இலக்கணம் உண்டு.',
    enText: 'Forms that follow the sound of a பா are its பாவினம்: தாழிசை, துறை and விருத்தம், three for each பா. The name is simply பா + kind: ஆசிரிய விருத்தம், கலித்துறை, வெண்டாழிசை. Each has its own rules.',
    table: { head: ['பா', 'தாழிசை', 'துறை', 'விருத்தம்'], rows: [['ஆசிரியப்பா', 'ஆசிரியத் தாழிசை', 'ஆசிரியத் துறை', 'ஆசிரிய விருத்தம்'], ['வெண்பா', 'வெண்டாழிசை', 'வெண்டுறை', 'வெளிவிருத்தம்'], ['கலிப்பா', 'கலித்தாழிசை', 'கலித்துறை', 'கலிவிருத்தம்'], ['வஞ்சிப்பா', 'வஞ்சித்தாழிசை', 'வஞ்சித்துறை', 'வஞ்சி விருத்தம்']] },
    quiz: { mode: 'name', pool: PAVINAM, items: [
      { w: 'ஆசிரியப்பா + தாழிசை', a: [], name: 'ஆசிரியத் தாழிசை' }, { w: 'வெண்பா + துறை', a: [], name: 'வெண்டுறை' },
      { w: 'கலிப்பா + விருத்தம்', a: [], name: 'கலிவிருத்தம்' }, { w: 'வஞ்சிப்பா + தாழிசை', a: [], name: 'வஞ்சித்தாழிசை' },
      { w: 'ஆசிரியப்பா + விருத்தம்', a: [], name: 'ஆசிரிய விருத்தம்' }, { w: 'வெண்பா + விருத்தம்', a: [], name: 'வெளிவிருத்தம்' }] },
  },
  {
    title: 'இப்போது குறள்', en: 'Now the kural',
    text: 'குறள் 1: முதல் அடியில் நான்கு சீர் (அளவடி), இரண்டாம் அடியில் மூன்று (சிந்தடி); ஒவ்வொரு இணைப்பும் வெண்டளை; கடைசிச் சீர் <b>உலகு</b> = உல + கு = <b>பிறப்பு</b>: தக பின் ஒரு மென்மையான தா. சீர்களைப் பார், பெயர்களைப் படி, தட்டுகளைக் கேள் — பிறகு விளையாடு.',
    enText: 'Kural 1: four சீர் in the first line, three in the second; every junction a வெண்டளை; the last சீர், உலகு, is உல + கு, a பிறப்பு. See the சீர், read their names, hear the taps, then play.',
    ex: [], kural: 1, junctions: true,
  },
];

let lessonTimers = [];
function drumDemo(asais, chips, accents) {
  lessonTimers.forEach(clearTimeout); lessonTimers = [];
  document.querySelectorAll('.lesson .asai.now').forEach(c => c.classList.remove('now'));
  SFX.unlock();
  const beat = 780;
  asais.forEach((a, i) => {
    lessonTimers.push(setTimeout(() => {
      const gain = a.k === 'P' ? 0.35 : (accents && accents[i]) ? 1 : 0.75;
      SFX.play(a.k === 'I' ? 'taka' : 'ta', gain); SFX.haptic(a.k === 'I' ? 18 : 30);
      chips.forEach(c => c.classList.remove('now'));
      if (chips[i]) chips[i].classList.add('now');
    }, i * beat));
  });
  lessonTimers.push(setTimeout(() => chips.forEach(c => c.classList.remove('now')), asais.length * beat));
}

function exampleCard(ex, i) {
  const label = ex.label || (ex.name ? `${ex.name} · ${pattern(ex.a)}` : pattern(ex.a));
  return `<div class="ex" data-i="${i}">
    <span class="seer"><span class="asais">${ex.a.map(a => `<span class="asai ${a.k}">${esc(a.s)}</span>`).join('')}</span>
      <span class="seer-name">${esc(label)}</span></span>
    <span class="ex-btns"><button class="icon-btn" data-act="say" aria-label="கேள்">🔈</button><button class="icon-btn" data-act="drum" aria-label="தாளம்">🥁</button></span>
  </div>`;
}
// the junction between consecutive சீர்: last அசை of one, first of the next, the scanner's தளை label
function junctionsBlock(seers, thalai) {
  const rows = [];
  for (let i = 0; i + 1 < seers.length; i++) {
    const a = seers[i].a[seers[i].a.length - 1], b = seers[i + 1].a[0];
    const cls = seers[i].a.length === 3 ? 'காய்' : (a.k === 'N' ? 'மா' : 'விளம்');
    rows.push(`<div class="junc"><span class="junc-w">${esc(seers[i].w)}</span><span class="asai ${a.k}">${esc(a.s)}</span><span class="arrow">→</span><span class="asai ${b.k}">${esc(b.s)}</span><span class="junc-w">${esc(seers[i + 1].w)}</span>
      <span class="junc-name">${esc(thalai[i] || '')} <small class="en">${esc(cls)} முன் ${b.k === 'N' ? 'நேர்' : 'நிரை'}</small></span></div>`);
  }
  return `<div class="juncs">${rows.join('')}</div>`;
}
function pairBlock(p, i) {
  const hl = line => {
    const words = line.split(' ');
    const wi = p.idx < 0 ? words.length - 1 : 0;
    const ls = letters(words[wi]);
    const li = p.idx < 0 ? ls.length - 1 : Math.min(p.idx, ls.length - 1);
    words[wi] = ls.map((l, j) => j === li ? `<mark>${esc(l)}</mark>` : esc(l)).join('');
    return words.map((w, j) => j === wi ? w : esc(w)).join(' ');
  };
  return `<div class="pair" data-p="${i}"><div class="pl">${hl(p.lines[0])}</div><div class="pl">${hl(p.lines[1])}</div>
    <div class="pair-name"><b>${esc(p.kind)}</b> · ${esc(p.note)} <button class="icon-btn" data-act="saypair" aria-label="கேள்">🔈</button></div></div>`;
}
function tableBlock(tb) {
  return `<table class="ltable"><thead><tr>${tb.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${tb.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function mountQuiz(el, q) {
  const items = (typeof q.items === 'function' ? q.items() : q.items).slice().sort(() => Math.random() - 0.5);
  const mode = q.mode || 'tap';
  let i = 0, pos = 0, right = 0, slipped = false, busy = false;
  const question = {
    tap: it => it.a.length > 1 ? `${it.a.length} தட்டு: வரிசையாகத் தட்டு` : 'தா-வா, தக-வா? தட்டு',
    next: () => 'வெண்பாவில் அடுத்த சீர் எந்த ஒலியில் தொடங்கும்? தட்டு',
    count: () => 'எத்தனை அசை?',
    name: () => q.question || 'இந்தச் சீரின் பெயர் என்ன?',
  };
  const show = () => {
    const it = items[i];
    const chipsHidden = mode === 'tap' || mode === 'count';
    const opts = mode === 'count' ? ['1', '2', '3', '4'] : mode === 'name' ? (q.options || pick([it.name, ...pick(q.pool.filter(n => n !== it.name), 3)], 4)) : null;
    el.innerHTML = `<div class="q-head">சோதனை · ${i + 1} / ${items.length} <small class="en">quiz</small></div>
      <div class="q-word ${it.w.length > 14 ? 'long' : ''}">${it.hideWord ? '&nbsp;' : esc(it.w)}</div>
      <div class="q-chips">${it.a.map(a => `<span class="asai ${a.k} ${chipsHidden ? 'hid' : ''}">${esc(a.s)}</span>`).join('')}</div>
      <div class="q-msg">${question[mode](it)}</div>
      ${mode === 'tap' || mode === 'next'
        ? `<div class="q-pads"><button class="pad ner small" data-k="N"><b>தா</b><small>நேர்</small></button><button class="pad nirai small" data-k="I"><b>தக</b><small>நிரை</small></button></div>`
        : `<div class="q-opts">${opts.map(o => `<button class="btn" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>`}
      <div class="q-score">சரி ${right} / ${i}</div>`;
    pos = 0; slipped = false; busy = false;
    el.querySelectorAll('.pad').forEach(p => p.addEventListener('pointerdown', e => { e.preventDefault(); tap(p.dataset.k); }));
    el.querySelectorAll('.q-opts .btn').forEach(b => b.addEventListener('click', () => choose(b)));
  };
  const finishItem = msgOk => {
    busy = true;
    if (!slipped) right++;
    el.querySelector('.q-msg').textContent = slipped ? 'சரி, இப்போது புரிந்தது ✓' : msgOk;
    el.querySelector('.q-score').textContent = `சரி ${right} / ${i + 1}`;
    el.querySelectorAll('.q-chips .asai').forEach(c => c.classList.remove('hid'));
    setTimeout(() => SFX.play('good', 0.5), 150);
    setTimeout(() => { i++; if (i >= items.length) done(); else show(); }, 1200);
  };
  const tap = k => {
    if (busy) return;
    SFX.unlock();
    const it = items[i], chips = el.querySelectorAll('.q-chips .asai'), msg = el.querySelector('.q-msg');
    SFX.play(k === 'N' ? 'ta' : 'taka'); SFX.haptic(k === 'N' ? 30 : 18);
    if (mode === 'next') {
      if (k === it.next) finishItem(`சரி! ${it.name}: அடுத்து ${k === 'N' ? 'நேர் (தா)' : 'நிரை (தக)'} ✓`);
      else { slipped = true; msg.textContent = `இல்லை: ${it.name} — அடுத்து ${it.next === 'N' ? 'நேர் (தா)' : 'நிரை (தக)'}. அதைத் தட்டு`; SFX.play('miss', 0.5); }
      return;
    }
    const exp = it.a[pos];
    if (k === exp.k) {
      chips[pos].classList.remove('hid'); pos++;
      if (pos === it.a.length) finishItem('சரி! ✓'); else msg.textContent = 'சரி, அடுத்த தட்டு…';
    } else {
      slipped = true;
      chips[pos].classList.remove('hid');
      msg.textContent = `இல்லை: இது ${exp.k === 'N' ? 'தா (நேர்)' : 'தக (நிரை)'}. அதைத் தட்டு`;
      SFX.play('miss', 0.5);
    }
  };
  const choose = btn => {
    if (busy) return;
    SFX.unlock();
    const it = items[i], v = btn.dataset.v, msg = el.querySelector('.q-msg');
    const answer = mode === 'count' ? String(it.a.length) : it.name;
    if (v === answer) {
      btn.classList.add('good');
      finishItem(mode === 'count' ? `சரி! ${answer} அசை: ${pattern(it.a)} ✓` : (it.a.length ? `சரி! ${answer} = ${pattern(it.a)} ✓` : `சரி! ${answer} ✓`));
      if (mode === 'count') drumDemo(it.a, Array.from(el.querySelectorAll('.q-chips .asai')));
    } else {
      slipped = true; btn.classList.add('bad');
      msg.textContent = mode === 'count' ? 'இல்லை: மீண்டும் எண்ணு' : (it.a.length ? 'இல்லை: ஒவ்வோர் அசையின் நிறத்தைப் பார்' : 'இல்லை: மீண்டும் முயல்');
      SFX.play('miss', 0.5);
    }
  };
  const done = () => {
    el.innerHTML = `<div class="q-done">${right === items.length ? 'அருமை!' : right >= items.length / 2 ? 'நன்று!' : 'மீண்டும் முயல்வோம்'} · சரி ${right} / ${items.length}
      <button class="btn" id="q-again">↻ மீண்டும்</button></div>`;
    if (right >= items.length / 2) SFX.play('star', 0.6);
    el.querySelector('#q-again').addEventListener('click', () => mountQuiz(el, q));
  };
  show();
}

async function lessonScreen(step) {
  step = Math.min(Math.max(1, step || 1), LESSON.length);
  const st = LESSON[step - 1];
  setTop('யாப்புப் பாடம்', `படி ${step} / ${LESSON.length} · ${st.en}`, true);
  for (const n of (st.needs || [])) LK[n] = await kural(n);
  // groups: [[heading, examples], …]; a plain step has one unnamed group
  let groups = st.groups ? st.groups() : [['', st.ex || []]];
  let lines = [], lineThalai = [];
  if (st.kural) {
    const k = LK[st.kural] = await kural(st.kural);
    const want = st.lineOnly != null ? [k.lines[st.lineOnly]] : k.lines;
    lines = want.map(l => l.seers.map(s => ({ w: s.w, a: s.a, name: s.name, label: `${s.name} · ${pattern(s.a)}` })));
    lineThalai = want.map(l => l.thalai || []);
    groups = want.map((l, li) => [`${esc(l.t)} <small class="en">${ADI_OF(l.seers.length)} · ${l.seers.length} சீர்</small>`, lines[li]]);
  }
  const all = groups.flatMap(g => g[1]);
  let idx = 0;
  render(`
  <section class="lesson">
    <nav class="steps" aria-label="படிகள்">${LESSON.map((s, i) => `<a href="#/lesson/${i + 1}" class="${i + 1 === step ? 'on' : ''} ${i + 1 < step ? 'done' : ''}" aria-label="படி ${i + 1}">${i + 1}</a>`).join('')}</nav>
    <div class="card">
      <h2>${esc(st.title)} ${S.sub ? `<small class="en">${esc(st.en)}</small>` : ''}</h2>
      <p class="l-text">${st.text}</p>
      ${S.sub ? `<p class="en">${esc(st.enText)}</p>` : ''}
      ${st.table ? tableBlock(st.table) : ''}${st.table2 ? tableBlock(st.table2) : ''}
      ${groups.map(([head, exs], gi) => `
        ${head ? `<div class="ex-group">${st.kural ? head : esc(head)}${st.kural ? ` <button class="btn mini" data-line="${gi}">🥁 முழு அடி</button>` : ''}</div>` : ''}
        <div class="ex-grid">${exs.map(ex => exampleCard(ex, idx++)).join('')}</div>
        ${st.junctions && st.kural ? `<div class="ex-group">இணைப்புகள் · தளை <small class="en">junctions</small></div>${junctionsBlock(lines[gi], lineThalai[gi])}` : ''}`).join('')}
      ${st.pairs ? `<div class="pairs">${st.pairs.map(pairBlock).join('')}</div>` : ''}
    </div>
    ${st.quiz ? `<div class="card quiz" id="quiz"></div>` : ''}
    <div class="row spread l-nav">
      <a class="btn" href="#/lesson/${step - 1}" ${step === 1 ? 'style="visibility:hidden"' : ''}>‹ முன்</a>
      ${step < LESSON.length ? `<a class="btn primary" href="#/lesson/${step + 1}">அடுத்து ›</a>` : `<a class="btn primary" href="#/learn/1">▶ ${esc(t('play'))}</a>`}
    </div>
  </section>`);
  $$('.ex').forEach(card => {
    const ex = all[+card.dataset.i];
    const chips = Array.from(card.querySelectorAll('.asai'));
    card.querySelector('[data-act=say]').addEventListener('click', e => TTS.speak(ex.w, e.currentTarget));
    card.querySelector('[data-act=drum]').addEventListener('click', () => drumDemo(ex.a, chips));
  });
  $$('[data-line]').forEach(b => b.addEventListener('click', () => {
    const seers = lines[+b.dataset.line];
    const grid = b.closest('.ex-group').nextElementSibling;
    const asais = seers.flatMap(s => s.a), accents = seers.flatMap(s => s.a.map((x, j) => j === 0));
    drumDemo(asais, Array.from(grid.querySelectorAll('.asai')), accents);
  }));
  $$('.pair [data-act=saypair]').forEach(b => b.addEventListener('click', e => { const p = st.pairs[+b.closest('.pair').dataset.p]; TTS.speak(p.lines.join('. '), e.currentTarget); }));
  if (st.quiz) mountQuiz($('#quiz'), st.quiz);
  window.addEventListener('hashchange', () => { lessonTimers.forEach(clearTimeout); lessonTimers = []; }, { once: true });
}
