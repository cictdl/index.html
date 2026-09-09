/* தாளக் குறள் — the rhythm engine.
   A kural's chart is its அசை sequence from the CICT metrical scanner: every அசை is one
   beat; நேர் is the "தா" pad, நிரை the "தக" pad. A four-beat count-in precedes the first
   அடி and one rest beat separates the two அடி, so the chant keeps the shape of recitation.
   The canvas scrolls notes towards a hit ring; taps are judged against the note times with
   windows that get tighter by level. Everything is driven from performance.now(). */
'use strict';
const Game = (() => {
  const COUNT_IN = 4, REST = 1, TAIL = 2;
  const WINDOWS = { 1: { perfect: 170, good: 330 }, 2: { perfect: 130, good: 270 }, 3: { perfect: 110, good: 230 } };
  const COL = { N: '#ff8c1a', I: '#22c1c3', Nd: '#b85a00', Id: '#0f7d7f', miss: '#7d819b', wrong: '#ff5b6e', gold: '#f2b632' };
  const FONT = '"Noto Sans Tamil","Nirmala UI","Latha",system-ui,sans-serif';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function buildChart(k, bpm) {
    const beatSec = 60 / bpm;
    const notes = [], lines = [];
    let beat = COUNT_IN;
    k.lines.forEach((line, li) => {
      const start = beat;
      line.seers.forEach((s, si) => {
        s.a.forEach((a, ai) => {
          notes.push({ i: notes.length, t: beat, k: a.k, s: a.s, li, si, ai, first: ai === 0, last: ai === s.a.length - 1,
            seer: s, judged: null, dt: 0, at: 0 });
          beat += 1;
        });
      });
      lines.push({ start, end: beat, seers: line.seers });
      if (li < k.lines.length - 1) beat += REST;
    });
    return { notes, lines, beatSec, bpm, countIn: COUNT_IN, endBeat: beat + TAIL, total: notes.length };
  }

  class Renderer {
    constructor(canvas, chart) {
      this.c = canvas; this.g = canvas.getContext('2d'); this.chart = chart;
      this.effects = []; this.resize();
    }
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const rect = this.c.getBoundingClientRect();
      this.w = Math.max(200, rect.width); this.h = Math.max(120, rect.height);
      this.c.width = Math.round(this.w * dpr); this.c.height = Math.round(this.h * dpr);
      this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.hitX = clamp(this.w * 0.2, 70, 150);
      this.pxBeat = clamp((this.w - this.hitX) / 3.2, 70, 170);
      this.r = clamp(this.h * 0.15, 20, 40);
      this.laneY = this.h * 0.58;
    }
    burst(kind, judged) { this.effects.push({ t0: performance.now(), kind, judged }); }
    draw(t, state, count, notes, cursor) {
      const g = this.g, w = this.w, h = this.h, r = this.r, y = this.laneY, hx = this.hitX;
      const bs = this.chart.beatSec, pxSec = this.pxBeat / bs;
      g.clearRect(0, 0, w, h);
      const bg = g.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#1b1f3b'); bg.addColorStop(1, '#2a2f5c');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      // lane band
      g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(0, y - r * 1.5, w, r * 3);
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
      // beat grid ahead of the ring
      const beatNow = t / bs;
      g.strokeStyle = 'rgba(255,255,255,.08)';
      for (let b = Math.ceil(beatNow); b < beatNow + 8; b++) {
        const x = hx + (b * bs - t) * pxSec; if (x > w) break;
        g.beginPath(); g.moveTo(x, y - r * 1.5); g.lineTo(x, y + r * 1.5); g.stroke();
      }
      // hit ring, pulsing on the beat
      const phase = ((t / bs) % 1 + 1) % 1;
      g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,.75)';
      g.beginPath(); g.arc(hx, y, r * 1.18 + (1 - phase) * 3, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.25)';
      g.beginPath(); g.arc(hx, y, r * 1.18 + 8, 0, Math.PI * 2); g.stroke();
      // line separator (rest beat between the two அடி)
      const L = this.chart.lines;
      if (L.length > 1) {
        const xr = hx + ((L[0].end + REST / 2) * bs - t) * pxSec;
        if (xr > -20 && xr < w + 20) {
          g.setLineDash([6, 6]); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(xr, y - r * 1.9); g.lineTo(xr, y + r * 1.9); g.stroke(); g.setLineDash([]);
        }
      }
      // notes, right to left in time order; start a few before the cursor for the miss trail
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const from = Math.max(0, cursor - 4);
      for (let i = from; i < notes.length; i++) {
        const n = notes[i];
        const x = hx + (n.t * bs - t) * pxSec;
        if (x > w + r * 3) break;
        if (x < -r * 3) continue;
        if (n.judged === 'perfect' || n.judged === 'good') continue;   // consumed by the burst
        const pill = n.k === 'I';
        const wdt = pill ? r * 2.7 : r * 2;
        let fill = n.k === 'N' ? COL.N : COL.I, alpha = 1, stroke = null;
        if (n.judged === 'miss') { fill = COL.miss; alpha = .55; }
        if (n.judged === 'wrong') { stroke = COL.wrong; }
        g.globalAlpha = alpha;
        // சீர் start marker + name
        if (n.first && !n.judged) {
          g.fillStyle = 'rgba(255,255,255,.85)';
          g.beginPath(); g.moveTo(x - 6, y - r * 1.75); g.lineTo(x + 6, y - r * 1.75); g.lineTo(x, y - r * 1.45); g.closePath(); g.fill();
          g.font = `600 ${Math.max(11, r * 0.5)}px ${FONT}`;
          g.fillStyle = 'rgba(255,255,255,.8)'; g.fillText(n.seer.name, x + wdt / 2 + 4, y - r * 2.05);
        }
        g.fillStyle = fill;
        roundRect(g, x - wdt / 2, y - r, wdt, r * 2, r);
        g.fill();
        if (stroke) { g.strokeStyle = stroke; g.lineWidth = 4; g.stroke(); }
        g.fillStyle = '#fff';
        g.font = `800 ${Math.round(r * 1.0)}px ${FONT}`;
        g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 3;
        g.fillText(n.s, x, y + 1);
        g.shadowBlur = 0;
        g.globalAlpha = 1;
      }
      // hit bursts
      const now = performance.now();
      this.effects = this.effects.filter(e => now - e.t0 < 380);
      for (const e of this.effects) {
        const p = (now - e.t0) / 380;
        g.globalAlpha = 1 - p;
        g.lineWidth = 6 * (1 - p) + 1;
        g.strokeStyle = e.judged === 'perfect' ? COL.gold : (e.kind === 'N' ? COL.N : COL.I);
        g.beginPath(); g.arc(hx, y, r * (1.1 + p * 1.6), 0, Math.PI * 2); g.stroke();
        g.globalAlpha = 1;
      }
      // pad labels under the ring: which pad the next note wants (level ≥2 hint is the colour)
      if (state === 'countin') {
        g.fillStyle = 'rgba(255,255,255,.9)';
        g.font = `900 ${Math.round(h * 0.42)}px ${FONT}`;
        g.fillText(String(count), w / 2, h * 0.5);
      }
    }
  }

  function roundRect(g, x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.arcTo(x + w, y, x + w, y + r, r);
    g.lineTo(x + w, y + h - r); g.arcTo(x + w, y + h, x + w - r, y + h, r);
    g.lineTo(x + r, y + h); g.arcTo(x, y + h, x, y + h - r, r);
    g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r); g.closePath();
  }

  /**
   * opts: { kural, level (1..3), bpm, guide (bool: drums play on time), offsetMs, canvas,
   *         auto (bool: the game plays itself), hud: { onCount, onJudge, onCombo, onProgress,
   *         onSeer, onSeerDone, onNote, onEnd, onPad } }
   */
  function start(opts) {
    const chart = buildChart(opts.kural, opts.bpm);
    const notes = chart.notes, bs = chart.beatSec;
    const win = WINDOWS[opts.level] || WINDOWS[1];
    const hud = Object.assign({ onCount() { }, onJudge() { }, onCombo() { }, onProgress() { }, onSeer() { }, onSeerDone() { }, onNote() { }, onEnd() { }, onPad() { } }, opts.hud || {});
    const R = new Renderer(opts.canvas, chart);
    const stats = { perfect: 0, good: 0, wrong: 0, miss: 0, combo: 0, maxCombo: 0, score: 0, judged: 0 };
    const autoJit = notes.map(() => (Math.random() * 2 - 1) * (opts.autoJitterMs == null ? 55 : opts.autoJitterMs) / 1000);
    let startMs = 0, pausedAt = 0, state = 'countin', raf = 0, cursor = 0, nextGuide = 0, nextCount = 0, nextAuto = 0, count = COUNT_IN, curSeer = null, curNote = -1;
    const noteT = n => n.t * bs;
    const songT = ms => (ms - startMs) / 1000;

    function judge(n, j, dtMs) {
      n.judged = j; n.dt = dtMs; n.at = performance.now();
      stats[j]++; stats.judged++;
      if (j === 'perfect' || j === 'good') {
        stats.combo++; stats.maxCombo = Math.max(stats.maxCombo, stats.combo);
        stats.score += (j === 'perfect' ? 100 : 60) + Math.min(stats.combo, 10) * 5;
        R.burst(n.k, j);
      } else {
        stats.combo = 0;
        if (j === 'miss' && !opts.auto) SFX.play('miss', 0.5);
      }
      hud.onJudge(j, n, dtMs);
      hud.onCombo(stats.combo);
      if (n.last) {
        const seerNotes = notes.filter(m => m.li === n.li && m.si === n.si);
        if (seerNotes.every(m => m.judged === 'perfect' || m.judged === 'good')) { SFX.play('good', 0.45); hud.onSeerDone(n.seer); }
      }
      hud.onProgress(stats.judged, chart.total);
      while (cursor < notes.length && notes[cursor].judged) cursor++;
    }

    function tap(kind, tsMs) {
      if (state !== 'play' && state !== 'countin') return;
      const t = songT(tsMs) - (opts.offsetMs || 0) / 1000;
      let best = null, bestD = Infinity;
      for (let i = cursor; i < notes.length; i++) {
        const n = notes[i]; if (n.judged) continue;
        const d = t - noteT(n);
        if (d < -win.good / 1000) break;
        const ad = Math.abs(d);
        if (ad <= win.good / 1000 && ad < bestD) { best = n; bestD = ad; }
      }
      const soundKind = kind || (best ? best.k : 'N');
      SFX.play(soundKind === 'N' ? 'ta' : 'taka');
      SFX.haptic(soundKind === 'N' ? 30 : 18);
      hud.onPad(soundKind);
      if (!best) return;
      const dtMs = (t - noteT(best)) * 1000;
      let j;
      if (kind && opts.level >= 2 && kind !== best.k) j = 'wrong';
      else if (Math.abs(dtMs) <= win.perfect) j = 'perfect';
      else j = 'good';
      judge(best, j, dtMs);
    }

    function finish() {
      state = 'done';
      cancel(raf);
      window.removeEventListener('resize', onResize);
      const total = chart.total;
      const accuracy = total ? (stats.perfect + 0.6 * stats.good + 0.2 * stats.wrong) / total : 0;
      const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : accuracy >= 0.45 ? 1 : 0;
      const seerStats = {};
      for (const l of chart.lines) for (const s of l.seers) seerStats[s.name] = (seerStats[s.name] || 0) + 1;
      hud.onEnd({ perfect: stats.perfect, good: stats.good, wrong: stats.wrong, miss: stats.miss, total, maxCombo: stats.maxCombo,
        score: stats.score, accuracy, stars, level: opts.level, bpm: opts.bpm, seerStats, auto: !!opts.auto });
    }

    function frame(now) {
      if (state === 'paused' || state === 'done') return;
      const t = songT(now);
      while (nextCount < COUNT_IN && t >= nextCount * bs) {
        SFX.play(nextCount === 0 ? 'tick1' : 'tick', 0.7);
        count = COUNT_IN - nextCount; hud.onCount(count); nextCount++;
      }
      if (state === 'countin' && t >= COUNT_IN * bs) { state = 'play'; hud.onCount(0); }
      // guide drums / autoplay, fired as their time passes
      while (nextGuide < notes.length && t >= noteT(notes[nextGuide])) {
        const n = notes[nextGuide++];
        if (opts.guide && !opts.auto) SFX.play(n.k === 'N' ? 'ta' : 'taka', 0.85);
        hud.onNote(n);
      }
      if (opts.auto) {
        // The demo player is judged directly, so a stalled frame can never turn into a miss.
        while (nextAuto < notes.length && t >= noteT(notes[nextAuto]) + autoJit[nextAuto]) {
          const n = notes[nextAuto++];
          if (n.judged) continue;
          SFX.play(n.k === 'N' ? 'ta' : 'taka'); hud.onPad(n.k);
          const dtMs = autoJit[n.i] * 1000;
          judge(n, Math.abs(dtMs) <= win.perfect ? 'perfect' : 'good', dtMs);
        }
      }
      // current அசை / சீர் for the karaoke line
      let ci = curNote;
      while (ci + 1 < notes.length && t >= noteT(notes[ci + 1]) - 0.02) ci++;
      if (ci !== curNote) { curNote = ci; const n = notes[ci]; if (n && n.seer !== curSeer) { curSeer = n.seer; hud.onSeer(curSeer); } }
      // misses
      for (let i = cursor; i < notes.length; i++) {
        const n = notes[i]; if (n.judged) continue;
        if (t - noteT(n) > win.good / 1000) judge(n, 'miss', null); else break;
      }
      R.draw(t, state, count, notes, cursor);
      if (t >= chart.endBeat * bs) { finish(); return; }
      raf = schedule(frame);
    }

    // requestAnimationFrame stops in a hidden tab (the game pauses itself then anyway);
    // opts.timer drives the loop from setTimeout instead, for headless self-tests.
    const schedule = opts.timer ? (f => setTimeout(() => f(performance.now()), 16)) : (f => requestAnimationFrame(f));
    const cancel = opts.timer ? clearTimeout : cancelAnimationFrame;
    const onResize = () => R.resize();
    window.addEventListener('resize', onResize);
    startMs = performance.now() + 350;
    raf = schedule(frame);

    return {
      chart, stats,
      state: () => state,
      current: () => curNote,
      tap(kind, ts) { tap(kind, ts == null ? performance.now() : ts); },
      pause() { if (state === 'countin' || state === 'play') { pausedAt = performance.now(); cancel(raf); state = state === 'countin' ? 'paused-countin' : 'paused'; } },
      resume() {
        if (state !== 'paused' && state !== 'paused-countin') return;
        startMs += performance.now() - pausedAt;
        state = state === 'paused-countin' ? 'countin' : 'play';
        raf = schedule(frame);
      },
      stop() { state = 'done'; cancel(raf); window.removeEventListener('resize', onResize); },
      resize: onResize,
    };
  }

  return { buildChart, start, WINDOWS, COUNT_IN };
})();
