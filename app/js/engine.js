/* EJ engine — the Web Audio graph, and nothing else.
   Owner: 02-AUDIO. Loaded after audio.js. Hands its factory to the public
   module through EJ's event bus, so the only global in the project is EJ.

   Graph (PLAN §6.2), one voice shown with its octave-width partner:

     6 x (saw osc ─────────────┐
          saw osc (+12 st) ────┴─> voice gain envelope) ┐
     pink noise texture ──────────────> noise gain ─────┼─> voiceBus
                                                        │      │
                                                        │      ├─> highpass 90 Hz
     sub sine (root/2) ┐                                │      ├─> lowpass (cutoff <- lum)
     pulse 55 Hz sine  ├─> subBus ───────────────────────┘      │
     110 Hz body       ┘                                        ├─> convolver (3.2 s IR)
                                                                ├─> compressor (limiter)
     crack noise ─> bandpass 2 kHz ─> crack gain ───────────────┘       │
                                                                        └─> master -> destination

   The convolver's IR carries a direct spike at sample 0 (0.85) plus a
   generated noise tail (-10 dB re: direct). That keeps the graph serial as
   specified while preserving enough attack to hear a voice leave.

   Nothing here touches EJ.state, DOM, frames or content. audio.js decides
   what the parameters are; this file only moves nodes without clicks. */

(function () {
  'use strict';

  var EJ = window.EJ;
  if (!EJ || typeof EJ.emit !== 'function') return;

  var VOICES = 6;
  var C5 = 523.2511306;          // top-voice cap from the hazard table
  var IR_SECONDS = 3.2;          // PLAN §6.2
  var MICRO_CENTS = [0, 3, -4, 5, -6, 7];   // deterministic per-voice widening
  var LEVELS = [0.095, 0.078, 0.068, 0.061, 0.055, 0.050];
  var PULSE_RATE = 0.25;         // 8th notes at 120 BPM
  var PULSE_LEVEL = 0.15;
  var CRACK_LEVEL = 0.22;

  /* ---------------------------------------------------------------- */
  /* Small helpers                                                     */
  /* ---------------------------------------------------------------- */

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  // Deterministic PRNG: the reverb and texture are identical on every run.
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Ramp an AudioParam without a discontinuity, whatever the browser supports.
  function holdThenRamp(param, target, now, seconds) {
    if (!param) return;
    try {
      if (typeof param.cancelAndHoldAtTime === 'function') {
        param.cancelAndHoldAtTime(now);
      } else {
        param.cancelScheduledValues(now);
        param.setValueAtTime(param.value, now);
      }
      if (seconds <= 0) param.setValueAtTime(target, now);
      else param.linearRampToValueAtTime(target, now + seconds);
    } catch (e) { /* a closed context is not an emergency */ }
  }

  function glide(param, target, now, tau) {
    if (!param) return;
    try {
      param.setTargetAtTime(target, now, Math.max(0.001, tau));
    } catch (e) { /* ignore */ }
  }

  /* ---------------------------------------------------------------- */
  /* Generated buffers                                                 */
  /* ---------------------------------------------------------------- */

  // 3.2 s stereo IR. h[0] is the direct path; the rest is a seeded noise tail
  // with an exponential decay. Tail energy is scaled for roughly -10 dB wet.
  function makeIR(ctx, seconds) {
    var rate = ctx.sampleRate || 44100;
    var len = Math.max(1, Math.floor(rate * seconds));
    var buf = ctx.createBuffer(2, len, rate);
    var tailAmp = 0.0028;  // sqrt(sum h^2) ~= 0.32 => wet ~ -10 dB for broadband input
    var decay = 0.55;      // seconds to -60 dB is ~3.8 s; tail is gone by 3.2 s

    for (var ch = 0; ch < 2; ch++) {
      var data = buf.getChannelData(ch);
      var rnd = mulberry32(0x9E3779B9 ^ (ch * 0x85EBCA6B));
      data[0] = 0.85;
      for (var i = 1; i < len; i++) {
        var t = i / rate;
        data[i] = (rnd() * 2 - 1) * Math.exp(-t / decay) * tailAmp;
      }
    }
    return buf;
  }

  // 2 s looping pink-ish noise for the edge texture and the crack bursts.
  function makeNoise(ctx) {
    var rate = ctx.sampleRate || 44100;
    var len = Math.max(1, Math.floor(rate * 2));
    var buf = ctx.createBuffer(1, len, rate);
    var data = buf.getChannelData(0);
    var rnd = mulberry32(0xC0FFEE);
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (var i = 0; i < len; i++) {
      var white = rnd() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      var pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] = clamp(pink * 0.09, -0.8, 0.8);
    }
    return buf;
  }

  /* ---------------------------------------------------------------- */
  /* The engine                                                        */
  /* ---------------------------------------------------------------- */

  function createEngine() {
    var ctx = null;
    var built = false;
    var disposed = false;

    var voiceBus = null;
    var highpass = null;
    var lowpass = null;
    var convolver = null;
    var compressor = null;
    var master = null;
    var analyser = null;
    var meterBuf = null;

    var subBus = null;
    var subOsc = null;
    var subGain = null;
    var pulse55 = null;
    var pulse110 = null;
    var pulse110Gain = null;
    var pulseMix = null;
    var pulseGain = null;

    var noiseSource = null;
    var noiseFilter = null;
    var noiseGain = null;
    var crackFilter = null;
    var crackGain = null;

    var voices = [];
    var last = {
      master: 0,
      cutoff: 1200,
      noise: 0,
      sub: 0,
      third: 3
    };
    var pulseOn = false;
    var nextPulseAt = 0;

    /* ---- build ---- */

    function build(context, opts) {
      if (built) return true;
      if (!context) throw new Error('engine.build: no AudioContext');
      ctx = context;
      var now = ctx.currentTime;

      master = ctx.createGain();
      master.gain.value = 0.0001;          // silent until play()
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;
      master.connect(analyser);
      analyser.connect(ctx.destination);

      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -12;
      compressor.knee.value = 6;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressor.connect(master);

      convolver = ctx.createConvolver();
      convolver.normalize = false;
      convolver.buffer = makeIR(ctx, IR_SECONDS);
      convolver.connect(compressor);

      lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 1200;
      lowpass.Q.value = 0.7;
      lowpass.connect(convolver);

      highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 90;       // hazard: no mud on laptop speakers
      highpass.Q.value = 0.7;
      highpass.connect(lowpass);

      voiceBus = ctx.createGain();
      voiceBus.gain.value = 0.62;
      voiceBus.connect(highpass);

      // ---- six voices: fundamental + octave-width partner ----
      for (var i = 0; i < VOICES; i++) {
        var fund = ctx.createOscillator();
        fund.type = 'sawtooth';
        fund.frequency.value = 130;
        fund.detune.value = MICRO_CENTS[i];

        var oct = ctx.createOscillator();
        oct.type = 'sawtooth';
        oct.frequency.value = 260;
        oct.detune.value = MICRO_CENTS[i] + 2;

        var fundGain = ctx.createGain();
        fundGain.gain.value = 1;
        var octGain = ctx.createGain();
        octGain.gain.value = 0;

        var env = ctx.createGain();
        env.gain.value = 0.0001;

        fund.connect(fundGain);
        oct.connect(octGain);
        fundGain.connect(env);
        octGain.connect(env);
        env.connect(voiceBus);

        fund.start(now);
        oct.start(now);

        voices.push({
          fund: fund,
          oct: oct,
          octGain: octGain,
          env: env,
          active: false,
          hz: 130,
          detune: MICRO_CENTS[i]
        });
      }

      // ---- sub layer ----
      subBus = ctx.createGain();
      subBus.gain.value = 1;
      subBus.connect(lowpass);             // bypasses the 90 Hz high-pass

      subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.value = 55;
      subGain = ctx.createGain();
      subGain.gain.value = 0.045;
      subOsc.connect(subGain);
      subGain.connect(subBus);
      subOsc.start(now);

      // 55 Hz per PLAN; a quiet 110 Hz body keeps the pulse audible on
      // laptop speakers that cannot reproduce 55 Hz.
      pulseMix = ctx.createGain();
      pulseMix.gain.value = 1;
      pulse55 = ctx.createOscillator();
      pulse55.type = 'sine';
      pulse55.frequency.value = 55;
      pulse110 = ctx.createOscillator();
      pulse110.type = 'sine';
      pulse110.frequency.value = 110;
      pulse110Gain = ctx.createGain();
      pulse110Gain.gain.value = 0.28;
      pulseGain = ctx.createGain();
      pulseGain.gain.value = 0.0001;

      pulse55.connect(pulseMix);
      pulse110.connect(pulse110Gain);
      pulse110Gain.connect(pulseMix);
      pulseMix.connect(pulseGain);
      pulseGain.connect(subBus);
      pulse55.start(now);
      pulse110.start(now);

      // ---- noise: texture into the chord bus, crack straight to the limiter ----
      var noiseBuf = makeNoise(ctx);
      noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuf;
      noiseSource.loop = true;

      noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 1600;
      noiseFilter.Q.value = 0.5;
      noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.0001;

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(voiceBus);

      crackFilter = ctx.createBiquadFilter();
      crackFilter.type = 'bandpass';
      crackFilter.frequency.value = 2000;  // 1.2-3 kHz band
      crackFilter.Q.value = 0.9;
      crackGain = ctx.createGain();
      crackGain.gain.value = 0.0001;

      noiseSource.connect(crackFilter);
      crackFilter.connect(crackGain);
      crackGain.connect(compressor);       // dry: the crack must survive a dark filter

      noiseSource.start(now);

      built = true;
      last.cutoff = lowpass.frequency.value;
      return true;
    }

    /* ---- voices ---- */

    function setVoiceActive(i, on) {
      var v = voices[i];
      if (!v || v.active === !!on) return;
      v.active = !!on;
      var now = ctx.currentTime;
      if (on) {
        holdThenRamp(v.env.gain, LEVELS[i], now, 0.030);   // attack 30 ms
      } else {
        holdThenRamp(v.env.gain, 0.0001, now, 0.250);      // release 250 ms
      }
    }

    function setVoicePitch(i, hz, detuneCents, octaveAmount) {
      var v = voices[i];
      if (!v) return;
      var now = ctx.currentTime;
      hz = clamp(hz, 20, C5);
      v.hz = hz;
      v.detune = detuneCents;
      glide(v.fund.frequency, hz, now, 0.055);
      glide(v.oct.frequency, hz * 2, now, 0.055);
      glide(v.fund.detune, detuneCents, now, 0.055);
      glide(v.oct.detune, detuneCents + 2, now, 0.055);
      // Cap the octave partner at C5: above that it adds only harshness.
      var amount = (hz * 2 <= C5) ? octaveAmount : 0;
      glide(v.octGain.gain, clamp(amount, 0, 0.8), now, 0.12);
    }

    /* ---- continuous layers ---- */

    function setCutoff(hz) {
      last.cutoff = clamp(hz, 120, 12000);
      glide(lowpass.frequency, last.cutoff, ctx.currentTime, 0.11);
    }

    function setNoise(amount) {
      last.noise = clamp(amount, 0, 0.12);
      glide(noiseGain.gain, Math.max(0.0001, last.noise), ctx.currentTime, 0.12);
    }

    function setSubRoot(hz) {
      last.sub = clamp(hz, 20, 120);
      glide(subOsc.frequency, last.sub, ctx.currentTime, 0.15);
    }

    function setPulse(on) {
      on = !!on;
      if (on === pulseOn) return;
      pulseOn = on;
      var now = ctx.currentTime;
      if (on) {
        nextPulseAt = now + 0.02;
      } else {
        holdThenRamp(pulseGain.gain, 0.0001, now, 0.06);
        nextPulseAt = 0;
      }
    }

    function schedulePulse(at) {
      var g = pulseGain.gain;
      try {
        g.setValueAtTime(0.0001, at);
        g.linearRampToValueAtTime(PULSE_LEVEL, at + 0.008);
        g.exponentialRampToValueAtTime(0.0001, at + 0.14);
      } catch (e) { /* ignore */ }
    }

    function setMaster(value, seconds) {
      last.master = value;
      holdThenRamp(master.gain, Math.max(0.0001, value), ctx.currentTime, seconds);
    }

    function crack(level) {
      var now = ctx.currentTime + 0.005;
      var g = crackGain.gain;
      try {
        if (typeof g.cancelAndHoldAtTime === 'function') g.cancelAndHoldAtTime(now);
        else { g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); }
        g.setValueAtTime(0.0001, now);
        g.linearRampToValueAtTime(CRACK_LEVEL * clamp(level, 0, 1), now + 0.006);
        g.exponentialRampToValueAtTime(0.0001, now + 0.075);   // 40-80 ms burst
      } catch (e) { /* ignore */ }
    }

    /* ---- scheduler tick (called from audio.js's rAF loop) ---- */

    function tick() {
      if (!built || disposed) return;
      var now = ctx.currentTime;
      if (!pulseOn) return;
      if (!nextPulseAt || nextPulseAt < now - 0.2) nextPulseAt = now + 0.02;
      while (nextPulseAt < now + 0.35) {
        schedulePulse(nextPulseAt);
        nextPulseAt += PULSE_RATE;
      }
    }

    /* ---- diagnostics for the manual harness (not part of the contract) ---- */

    function diagnostics() {
      var meter = { rms: 0, peak: 0 };
      if (analyser) {
        try {
          if (!meterBuf) meterBuf = new Float32Array(analyser.fftSize);
          analyser.getFloatTimeDomainData(meterBuf);
          var sum = 0, peak = 0;
          for (var i = 0; i < meterBuf.length; i++) {
            var v = meterBuf[i];
            sum += v * v;
            var a = v < 0 ? -v : v;
            if (a > peak) peak = a;
          }
          meter.rms = Math.sqrt(sum / meterBuf.length);
          meter.peak = peak;
        } catch (e) {}
      }
      return {
        built: built,
        ctxState: ctx ? ctx.state : 'none',
        sampleRate: ctx ? ctx.sampleRate : 0,
        activeVoices: voices.filter(function (v) { return v.active; }).length,
        active: voices.map(function (v) { return v.active; }),
        master: last.master,
        cutoff: last.cutoff,
        noise: last.noise,
        sub: last.sub,
        pulseOn: pulseOn,
        oscillators: built ? 12 + 1 + 2 + 1 : 0,
        irSeconds: IR_SECONDS,
        rms: meter.rms,
        peak: meter.peak
      };
    }

    /* ---- teardown ---- */

    function dispose() {
      if (disposed) return;
      disposed = true;
      var c = ctx;
      var m = master;
      var now = c ? c.currentTime : 0;

      try { if (master) holdThenRamp(master.gain, 0.0001, now, 0.06); } catch (e) {}
      try { if (pulseGain) holdThenRamp(pulseGain.gain, 0.0001, now, 0.03); } catch (e) {}

      function stopNode(node, when) {
        try { if (node && node.stop) node.stop(when); } catch (e) {}
      }
      for (var i = 0; i < voices.length; i++) {
        stopNode(voices[i].fund, now + 0.08);
        stopNode(voices[i].oct, now + 0.08);
      }
      stopNode(subOsc, now + 0.08);
      stopNode(pulse55, now + 0.08);
      stopNode(pulse110, now + 0.08);
      stopNode(noiseSource, now + 0.08);

      ctx = null;
      built = false;

      // Teardown is deferred so the 60 ms fade is actually heard instead of
      // being clipped by disconnect()/close(). 120 ms covers fade + stop times.
      setTimeout(function () {
        try { if (m) m.disconnect(); } catch (e) {}
        try { if (c && c.state !== 'closed') { var p = c.close(); if (p && p.catch) p.catch(function () {}); } } catch (e) {}
      }, 120);
    }

    return {
      build: build,
      setVoiceActive: setVoiceActive,
      setVoicePitch: setVoicePitch,
      setCutoff: setCutoff,
      setNoise: setNoise,
      setSubRoot: setSubRoot,
      setPulse: setPulse,
      setMaster: setMaster,
      crack: crack,
      tick: tick,
      diagnostics: diagnostics,
      dispose: dispose
    };
  }

  // audio.js listens for this. Loading order is core -> audio -> engine.
  try { EJ.emit('audio:attach', createEngine); } catch (e) {}
})();
