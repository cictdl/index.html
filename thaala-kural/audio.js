/* தாளக் குறள் — sound and haptics.
   Browser: Web Audio, playing the seven synthesised WAVs in assets/sfx.
   Android wrapper: the same WAVs through SoundPool via the AndroidDrum bridge, which is
   what keeps tap-to-sound latency low enough for a rhythm game inside a WebView; and the
   AndroidHaptic bridge for beat vibration. Both bridges are absent in a browser. */
'use strict';
const SFX = (() => {
  const NATIVE = typeof AndroidDrum !== 'undefined' ? AndroidDrum : null;
  const HAPTIC = typeof AndroidHaptic !== 'undefined' ? AndroidHaptic : null;
  const NAMES = ['ta', 'taka', 'tick', 'tick1', 'good', 'miss', 'star'];
  let ctx = null, master = null, loading = null;
  const buffers = {};
  let muted = false, hapticsOn = true;

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { ctx = new AC(); }
    master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
    return ctx;
  }

  // Called on the first user gesture: browsers refuse to start audio before one.
  function unlock() {
    if (NATIVE) return;
    const c = ensureCtx();
    if (c && c.state === 'suspended') c.resume().catch(() => { });
  }

  function load() {
    if (NATIVE) { try { NATIVE.preload(); } catch (e) { } return Promise.resolve(); }
    const c = ensureCtx();
    if (!c) return Promise.resolve();
    if (loading) return loading;
    loading = Promise.all(NAMES.map(async n => {
      try {
        const r = await fetch('assets/sfx/' + n + '.wav');
        const ab = await r.arrayBuffer();
        buffers[n] = await new Promise((res, rej) => c.decodeAudioData(ab, res, rej));
      } catch (e) { buffers[n] = null; }
    }));
    return loading;
  }

  // Oscillator stand-ins, only if a WAV failed to load (e.g. a server without the files).
  function beep(name, gain) {
    const c = ensureCtx(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    const t = c.currentTime;
    const spec = { ta: [150, 55, 0.25], taka: [320, 150, 0.12], tick: [1900, 1900, 0.04], tick1: [1400, 1400, 0.06],
      good: [660, 660, 0.2], miss: [110, 70, 0.15], star: [523, 1046, 0.4] }[name] || [440, 440, 0.1];
    o.frequency.setValueAtTime(spec[0], t); o.frequency.exponentialRampToValueAtTime(Math.max(20, spec[1]), t + spec[2]);
    g.gain.setValueAtTime(0.5 * gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + spec[2]);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + spec[2] + 0.02);
    if (name === 'taka') setTimeout(() => beep('tick', gain * 0.8), 105);
  }

  function play(name, gain) {
    if (muted) return;
    gain = gain == null ? 1 : gain;
    if (NATIVE) { try { NATIVE.play(name, gain); } catch (e) { } return; }
    const c = ensureCtx(); if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => { });
    const b = buffers[name];
    if (!b) { if (buffers[name] === null || !loading) beep(name, gain); return; }
    const s = c.createBufferSource(); s.buffer = b;
    const g = c.createGain(); g.gain.value = gain;
    s.connect(g); g.connect(master); s.start();
  }

  function haptic(ms) {
    if (!hapticsOn) return;
    if (HAPTIC) { try { HAPTIC.tap(ms); } catch (e) { } return; }
    if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { } }
  }

  // Output latency in ms, when the platform reports it; used only as a hint for the display.
  function latencyMs() {
    if (NATIVE || !ctx) return 0;
    return Math.round(((ctx.outputLatency || ctx.baseLatency || 0)) * 1000);
  }

  return {
    unlock, load, play, haptic, latencyMs,
    native: !!NATIVE, hasHaptic: !!HAPTIC || !!navigator.vibrate,
    get muted() { return muted; },
    setMuted(v) { muted = !!v; },
    setHaptics(v) { hapticsOn = !!v; },
  };
})();
