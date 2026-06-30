export const meta = {
  name: 'thirukkural-ilakkanam',
  description: 'Word-by-word இலக்கணக் குறிப்பு for all 133 அதிகாரம் (analyze → verify → write)',
  phases: [
    { title: 'Analyze', detail: 'scholar agent tags each அதிகாரம் (10 kurals) → draft file' },
    { title: 'Verify',  detail: 'independent agent checks vs tagset+grammar → final file' },
  ],
}

// args: optional array of chapter numbers to run; default = all 133
const chapters = (Array.isArray(args) && args.length) ? args : Array.from({length: 133}, (_, i) => i + 1)
const pad = (n) => String(n).padStart(3, '0')
const DIR = 'D:\\\\DL file\\\\ground-truth\\\\grammar'

const STATUS_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['adhigaram', 'kuralsWritten', 'wordTokens', 'avgConfidence', 'reviewFlagCount', 'fixesApplied', 'wrotePath'],
  properties: {
    adhigaram: { type: 'integer' },
    kuralsWritten: { type: 'integer' },
    wordTokens: { type: 'integer' },
    avgConfidence: { type: 'number' },
    reviewFlagCount: { type: 'integer' },
    fixesApplied: { type: 'integer' },
    wrotePath: { type: 'string' },
    notes: { type: 'string' },
  },
}

const SCHEMA_DOC = `OUTPUT JSON shape (write valid UTF-8 JSON):
{
 "adhigaram":N,"name":"...","pal":"...","iyal":"...","schemaVersion":"1.0","method":"AI-draft-requires-review",
 "kurals":[
  {"number":N,"line1":"...","line2":"...",
   "yappu":{"paa":"குறள் வெண்பா","sirCount":[4,3],
            "monai":[{"adi":1,"sirs":["..."],"key":"...","present":true}],
            "edugai":{"present":true,"letter":"...","note":"..."},"thalai":"வெண்டளை","eetruseer":"..."},
   "ani":[{"name":"...","note":"..."}],
   "sirs":[
     {"sira":"...","adi":1,"pos":1,"togai":null,
      "components":[{"sol":"...","split":"...","category":"பெயர்|வினை|இடை|உரி","ilakkanam":"<closed-vocab tag>",
                     "features":{},"vetrumai":null,"todar":null,"gloss":"...","confidence":0.0}]}
   ],
   "reviewFlags":[]}
 ]
}`

const analyze = (adh) => {
  const p = pad(adh)
  return agent(
`You are a Tamil classical-grammar scholar (தொல்காப்பியம் + நன்னூல் tradition) producing word-by-word இலக்கணக் குறிப்பு annotation for Thirukkural அதிகாரம் ${adh}, for a digital ground-truth corpus.

READ FIRST (both):
1. ${DIR}\\\\_src\\\\ch-${p}.json — input packet: the 10 kurals with canonical lines, சீர் tokens (sirs_line1/sirs_line2), grapheme split (words[].letters), and three உரை (urai_mv=மு.வரதராசனார், urai_sp=சாலமன் பாப்பையா, urai_mk=மு.கருணாநிதி) + English meaning. USE the உரை to understand each verse — do not guess meaning.
2. ${DIR}\\\\TAGSET.md — the CLOSED controlled vocabulary. Every category/ilakkanam/togai/todar value MUST be an exact token from it.

RULES:
- Preserve சீர் (yappu unit) structure; a சீர் may hold several சொல் (e.g. "கசடறக்"=கசடு+அற) → decompose into components, each independently tagged.
- Per சொல்: split (morphology), category (பெயர்/வினை/இடை/உரி), ilakkanam (closed-vocab primary tag), features (kaalam/idam=தன்மை|முன்னிலை|படர்க்கை/paal/eN/thinai — only those that apply), vetrumai (null or {number,urupu,name}), togai at சீர் level (null or one of 6), todar (null or 4 types), gloss (short EN), confidence 0–1 (be honest; classical morphology is ambiguous).
- CATEGORY↔TAG CONSISTENCY (mandatory): பெயர்-family tags (…பெயர், வினையாலணையும்பெயர், சுட்டுப்பெயர் etc.) ⇒ category "பெயர்"; வினைமுற்று/எச்சம் tags (தெரிநிலை/குறிப்பு/ஏவல்/வியங்கோள்வினைமுற்று, வினையெச்சம், பெயரெச்சம், எதிர்மறை*) ⇒ category "வினை"; வேற்றுமைஉருபு/சாரியை/அசைநிலை/உம்மை/ஏகாரம்/ஓகாரம்/வினாஇடை/எதிர்மறைஇடை/பிரிநிலைஇடை ⇒ category "இடை"; உரிச்சொல் ⇒ category "உரி". Never mismatch (e.g. குறிப்புவினைமுற்று is category வினை, NOT பெயர்).
- yappu: paa="குறள் வெண்பா"; sirCount=[len1,len2]; monai per அடி honouring இனமோனை (க/ங ச/ஞ ட/ண த/ந ப/ம ற/ன); edugai = 2nd-letter agreement of அடி-opening சீர்; thalai="வெண்டளை"; eetruseer. Base மோனை/எதுகை on the actual graphemes.
- ani: figures actually present (TAGSET §G), one-line note each; [] if none.
- reviewFlags: list anything you are genuinely unsure of (honest GT — flag liberally).

${SCHEMA_DOC}

WRITE the JSON to ${DIR}\\\\chapters\\\\_draft\\\\adhigaram-${p}.json (overwrite). Then return ONLY: "draft ${adh} written: <kuralCount> kurals, <wordCount> words".`,
    { label: `analyze:${adh}`, phase: 'Analyze', agentType: 'general-purpose' }
  )
}

const verify = (_prev, adh) => {
  const p = pad(adh)
  return agent(
`You are a SENIOR Tamil-grammar reviewer. Independently verify and correct the draft இலக்கணக் குறிப்பு for அதிகாரம் ${adh}.

READ:
1. ${DIR}\\\\chapters\\\\_draft\\\\adhigaram-${p}.json — the draft to check.
2. ${DIR}\\\\_src\\\\ch-${p}.json — source text + உரை (ground truth for meaning).
3. ${DIR}\\\\TAGSET.md — closed vocabulary.

CHECK every kural & every சொல்:
- Is the morphological split correct? Is the ilakkanam the best closed-vocab tag (e.g. வியங்கோள்வினைமுற்று vs ஏவல்வினைமுற்று; வினையெச்சம் vs பெயரெச்சம்; வினையாலணையும்பெயர் correctly identified)?
- category/togai/todar/vetrumai consistent with the tag and with the உரை meaning? Enforce CATEGORY↔TAG consistency: …பெயர்/வினையாலணையும்பெயர்/சுட்டுப்பெயர்⇒பெயர்; *வினைமுற்று/வினையெச்சம்/பெயரெச்சம்/எதிர்மறை*⇒வினை; வேற்றுமைஉருபு/சாரியை/அசைநிலை/உம்மை/ஏகாரம்/ஓகாரம்/வினாஇடை/எதிர்மறைஇடை/பிரிநிலைஇடை⇒இடை; உரிச்சொல்⇒உரி. Fix any mismatch (e.g. குறிப்புவினைமுற்று must be category வினை).
- yappu: recompute monai/edugai from the graphemes; fix if wrong. sirCount matches tokens.
- ani present/justified.
- Every category/ilakkanam/togai/todar token MUST exist in TAGSET.md — replace any invalid token.
- Adjust confidence to reflect true certainty; add to reviewFlags anything still doubtful. Do NOT inflate confidence.

WRITE the corrected full JSON (same schema as the draft) to ${DIR}\\\\chapters\\\\adhigaram-${p}.json (this is the FINAL file). Count how many component-level corrections you made.

Return ONLY the structured status object.`,
    { label: `verify:${adh}`, phase: 'Verify', agentType: 'general-purpose', schema: STATUS_SCHEMA }
  )
}

log(`Starting இலக்கணக் குறிப்பு for ${chapters.length} அதிகாரம் (analyze→verify→write)`)
const results = await pipeline(chapters, analyze, verify)
const ok = results.filter(Boolean)
const totKurals = ok.reduce((s, r) => s + (r.kuralsWritten || 0), 0)
const totWords = ok.reduce((s, r) => s + (r.wordTokens || 0), 0)
const totFlags = ok.reduce((s, r) => s + (r.reviewFlagCount || 0), 0)
const totFixes = ok.reduce((s, r) => s + (r.fixesApplied || 0), 0)
const failed = chapters.filter((c, i) => !results[i]).map((c) => c)
return {
  chaptersDone: ok.length, chaptersFailed: failed, failedList: failed,
  kuralsWritten: totKurals, wordTokens: totWords, reviewFlags: totFlags, fixesApplied: totFixes,
  perChapter: ok.map((r) => ({ a: r.adhigaram, k: r.kuralsWritten, w: r.wordTokens, c: r.avgConfidence, f: r.reviewFlagCount })),
}
