export const meta = {
  name: 'thirukkural-ilakkanam-verify',
  description: 'Verify-only pass over draft அதிகாரம் (reads draft, corrects, writes final)',
  phases: [{ title: 'Verify', detail: 'independent reviewer corrects each draft → final file' }],
}

// args = list of அதிகாரம் numbers to verify; default = the 104 draft chapters
const DEFAULT_DRAFTS = [29].concat(Array.from({ length: 103 }, (_, i) => i + 31))
const chapters = (Array.isArray(args) && args.length) ? args : DEFAULT_DRAFTS
const pad = (n) => String(n).padStart(3, '0')
const DIR = 'D:\\\\DL file\\\\ground-truth\\\\grammar'

const STATUS_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['adhigaram', 'kuralsWritten', 'wordTokens', 'avgConfidence', 'reviewFlagCount', 'fixesApplied', 'wrotePath'],
  properties: {
    adhigaram: { type: 'integer' }, kuralsWritten: { type: 'integer' }, wordTokens: { type: 'integer' },
    avgConfidence: { type: 'number' }, reviewFlagCount: { type: 'integer' }, fixesApplied: { type: 'integer' },
    wrotePath: { type: 'string' }, notes: { type: 'string' },
  },
}

const verify = (adh) => {
  const p = pad(adh)
  return agent(
`You are a SENIOR Tamil-grammar reviewer. Independently verify and correct the draft இலக்கணக் குறிப்பு for அதிகாரம் ${adh}.

READ:
1. ${DIR}\\\\chapters\\\\_draft\\\\adhigaram-${p}.json — the draft to check (may have a UTF-8 BOM; ignore it).
2. ${DIR}\\\\_src\\\\ch-${p}.json — source text + உரை (ground truth for meaning).
3. ${DIR}\\\\TAGSET.md — closed vocabulary.

CHECK every kural & every சொல்:
- morphological split correct? ilakkanam the best closed-vocab tag (வியங்கோள்வினைமுற்று vs ஏவல்வினைமுற்று; வினையெச்சம் vs பெயரெச்சம்; வினையாலணையும்பெயர் identified)?
- CATEGORY↔TAG consistency: …பெயர்/வினையாலணையும்பெயர்/சுட்டுப்பெயர்⇒பெயர்; *வினைமுற்று/வினையெச்சம்/பெயரெச்சம்/எதிர்மறை*⇒வினை; வேற்றுமைஉருபு/சாரியை/அசைநிலை/உம்மை/ஏகாரம்/ஓகாரம்/வினாஇடை/எதிர்மறைஇடை/பிரிநிலைஇடை⇒இடை; உரிச்சொல்⇒உரி.
- தொகை belongs at the சீர் level (togai field), NOT in a word's ilakkanam slot. வேற்றுமை consistent with the உரை.
- yappu: recompute monai/edugai from graphemes; sirCount matches tokens. ani justified.
- Every category/ilakkanam/togai/todar token MUST exist in TAGSET.md (note உவமைஉருபு and எதிர்மறைவினைமுற்று are now valid). Replace invalid tokens.
- Adjust confidence to true certainty; add doubtful items to reviewFlags. Do NOT inflate confidence.

WRITE the corrected full JSON (same schema as the draft: adhigaram,name,pal,iyal,schemaVersion,method,kurals[...] with yappu/ani/sirs[components]/reviewFlags) to ${DIR}\\\\chapters\\\\adhigaram-${p}.json (FINAL file, plain UTF-8, no BOM). Count component-level corrections made.

Return ONLY the structured status object.`,
    { label: `verify:${adh}`, phase: 'Verify', agentType: 'general-purpose', schema: STATUS_SCHEMA }
  )
}

log(`Verify-only pass over ${chapters.length} draft அதிகாரம்`)
const results = await pipeline(chapters, verify)
const ok = results.filter(Boolean)
const failed = chapters.filter((c, i) => !results[i])
return {
  verified: ok.length, failed: failed,
  kuralsWritten: ok.reduce((s, r) => s + (r.kuralsWritten || 0), 0),
  fixesApplied: ok.reduce((s, r) => s + (r.fixesApplied || 0), 0),
  reviewFlags: ok.reduce((s, r) => s + (r.reviewFlagCount || 0), 0),
}
