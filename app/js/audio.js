/* EJ audio — the public contract and the mapping (PLAN §6.3).
   Owner: 02-AUDIO.

   This file decides WHAT the engine plays. engine.js (loaded next) owns the
   Web Audio graph. The two talk through EJ's event bus, so the project keeps
   exactly one global (window.EJ) and exactly one public audio surface
   (EJ.audio), as the contract requires.

   ── The mapping, all constants measured from 01's 48-frame frames.json ──────

   extentMkm2 3.34..7.53 M km² → voice count.
              voices = clamp(ceil(6 * extentMkm2 / 6.90), 1, 6)
            This is the measured NSIDC annual daily minimum, carried on every
            frame. The highest active voice always releases first. A legacy
            iceFrac→extent proxy remains only as a fallback for a frame with
            no extent field; no shipped frame takes that path.

   centroidY 0.4982..0.5460 → root, inverted (north/smaller y = higher):
              A2 110 Hz at 0.5460 → D3 146.83 Hz at 0.4982 (a perfect fourth).
            The whole chord is transposed by the root, so it stays consonant
            through the drift. 1996 is the highest root; 2020 the lowest.

   spread 0.0862..0.0981 → octave-partner depth on the upper voices
              (0 → pure fundamentals, 1 → up to a 50 % octave doubling).
            Continuous crossfade into a second saw per voice, never a jump.

   dLoss -0.0389..0.0369 → detune of the top active voice,
              0 cents at dLoss ≤ 0, -70 cents at dLoss ≥ 0.04.

   edge 0.1033..0.1416 → pink-noise texture gain 0.004..0.050 (linear).

   lum 0.3566..0.3937 → lowpass cutoff 400 Hz..6 kHz (exponential).

   sigma (z-score) → mode flip at 0: sigma ≥ 0 is the bright voicing
              (major third, D13 colour), sigma < 0 the dark voicing
              (minor third, Dm11 colour). sigma < -2 gates the 55 Hz pulse
              (2012 only in this record) and the chord has already gone minor.
              A 4 s musical hold keeps that single crossing audible.

   dLoss spike > 0.016 → 40-80 ms bandpassed noise crack (1990, 1993, 1995,
              1997, 2002, 2007, 2012), with hysteresis + 0.9 s cooldown.

   The arc: 1979 opens on a six-note D13, thins to three notes at 2012 with
   the sub pulse, and ends on four notes in the dark Dm11 colour at 2026.
   The stagger of the ice is never smoothed away; the one-voice coda after
   the last frame is the only thing in the piece that is not data.

   ── The coda ──────────────────────────────────────────────────────────────
   At the very end the measured chord holds for 2.2 s, then thins to one
   voice and decays over 6 s. This is a compositional gesture, labelled on
   screen as CODA · COMPOSITION, NOT DATA; the data ends at four voices.
   Scrolling back above t = 0.977 cancels it and restores the measured chord.

   ── Legacy fallback ───────────────────────────────────────────────────────
   If a frame carries no extent field, the old linear iceFrac proxy is used:
   extent = 6.90 + 45.07 * (iceFrac - 0.1664). It reproduces the verified
   voice table for 44/48 years, differing at 1999, 2004, 2017 and 2018 because
   iceFrac is not monotonic in extent at that resolution. Every shipped frame
   carries extentMkm2, so no delivered year takes this path. */

(function () {
  'use strict';

  var EJ = window.EJ;
  if (!EJ) return;                       // core.js owns the namespace; never create it
  if (EJ.audio && EJ.audio.__realAudio) return;   // double-load guard

  /* ---------------------------------------------------------------- */
  /* Constants — every one is a measured range, documented above       */
  /* ---------------------------------------------------------------- */

  var ICE_1979 = 0.1664;
  var EXTENT_1979 = 6.90;                // M km², NSIDC daily minimum 1979
  var EXTENT_SLOPE = 45.07;              // M km² per unit iceFrac
  var VOICE_EXTENT = 6.90;               // full-chord extent
  var MAX_VOICES = 6;

  var CENTROID_MIN = 0.4982;             // 1996, north → high root
  var CENTROID_MAX = 0.5460;             // 2020, south → low root
  var ROOT_LOW_HZ = 110.0;               // A2
  var ROOT_HIGH_HZ = 146.83238;          // D3, a perfect fourth above A2

  var SPREAD_MIN = 0.0862;
  var SPREAD_MAX = 0.0981;
  var OCT_WEIGHTS = [0.00, 0.10, 0.20, 0.30, 0.40, 0.50];

  var DLOSS_FULL_CENTS = 0.04;           // dLoss at which the top voice is -70 c
  var MAX_DETUNE_CENTS = -70;

  var EDGE_MIN = 0.1033;
  var EDGE_MAX = 0.1416;
  var NOISE_MIN = 0.004;
  var NOISE_MAX = 0.050;

  var LUM_MIN = 0.3566;
  var LUM_MAX = 0.3937;
  var CUTOFF_MIN = 400;
  var CUTOFF_MAX = 6000;

  var CRACK_ENTER = 0.016;
  var CRACK_REARM = 0.010;
  var CRACK_COOLDOWN = 0.9;
  var PULSE_HOLD = 4.0;                  // seconds after sigma leaves < -2

  var MASTER_LEVEL = 1.4;                // post-limiter trim; ≈ -14 LUFS with this voicing
  var FADE_IN = 0.15;                    // resume after a pause: stay quick
  var FADE_IN_COLD = 1.4;                // first Begin only: long enough to swell
  var FADE_OUT = 0.12;
  var TIMELINE_TAU = 0.14;               // internal setTimeline smoothing
  var TICK_MS = 35;                      // control rate, 28 Hz

  // Labelled coda (PLAN §5.3): the measured chord stops at four voices, then
  // a compositional gesture holds it briefly and lets one voice decay. This
  // is not in the data and is labelled as composition on screen.
  var CODA_ENTER = 0.997;                // t at which the coda may begin
  var CODA_HOLD_S = 2.2;                 // the 2026 chord holds before thinning
  var CODA_SOLO_S = 6.0;                 // the last voice fades to silence
  var CODA_VOICE = 0;                    // the root, left alone

  // Bright (sigma ≥ 0) and dark (sigma < 0) voicings. Both are consonant
  // subsets of D E F F# G A B C; the third and the 6th voice change colour.
  var MAJOR_DEGREES = [0, 4, 7, 10, 14, 21];  // D F# A C E B  = D13
  var MINOR_DEGREES = [0, 3, 5, 7, 10, 14];   // D F  G A C E  = Dm11
  var MICRO_CENTS = [0, 3, -4, 5, -6, 7];     // fixed, deterministic widening

  /* ---------------------------------------------------------------- */
  /* State                                                             */
  /* ---------------------------------------------------------------- */

  var ctx = null;
  var engine = null;
  var engineFactory = null;
  var initPromise = null;
  var disposed = false;
  var playing = false;
  var coldStart = true;                  // cleared by the first live play()
  var mode = 'guided';

  var lastFeatures = null;
  var timelineSeen = false;
  var tl = 0;
  var tlTarget = 0;
  var loopId = 0;
  var lastTickMs = 0;

  var voiceTarget = 0;
  var pulseHoldUntil = 0;
  var crackArmed = true;
  var crackCooldownUntil = 0;
  var codaPhase = 0;                     // 0 off · 1 hold · 2 solo · 3 silent
  var codaAt = 0;

  var lastApplied = {
    year: 1979,
    rootHz: ROOT_LOW_HZ,
    detuneCents: 0,
    cutoffHz: 1200,
    voices: 0,
    major: true,
    spread: 0,
    noise: NOISE_MIN
  };

  var failuresSeen = {};

  /* ---------------------------------------------------------------- */
  /* Helpers                                                           */
  /* ---------------------------------------------------------------- */

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function clamp01(v) {
    return clamp(v, 0, 1);
  }

  function num(v, fallback) {
    v = Number(v);
    return isFinite(v) ? v : fallback;
  }

  function norm(v, lo, hi) {
    if (hi === lo) return 0;
    return clamp01((v - lo) / (hi - lo));
  }

  function fail(err) {
    var msg = err && err.message ? err.message : String(err);
    if (failuresSeen[msg]) return;
    failuresSeen[msg] = true;
    try { if (EJ.fail) EJ.fail('audio', err); } catch (e) {}
  }

  /* ---------------------------------------------------------------- */
  /* Mapping — pure functions, no audio nodes, easy to audit            */
  /* ---------------------------------------------------------------- */

  // Prefer a real extent if 01 ever adds one; otherwise the frozen proxy.
  function extentFor(f) {
    var real = f && (f.extentMkm2 != null ? f.extentMkm2 : f.extent);
    var e = Number(real);
    if (isFinite(e) && e > 0) return e;
    var ice = num(f && f.iceFrac, ICE_1979);
    return EXTENT_1979 + EXTENT_SLOPE * (ice - ICE_1979);
  }

  function voiceCountFor(f) {
    var fractional = MAX_VOICES * extentFor(f) / VOICE_EXTENT;
    // The 1e-7 only protects an exact integer (1979 = 6.0000000) from a
    // floating-point hair above it. It does not move real thresholds.
    return clamp(Math.ceil(fractional - 1e-7), 1, MAX_VOICES);
  }

  function rootHzFor(f) {
    var cy = num(f && f.centroidY, (CENTROID_MIN + CENTROID_MAX) / 2);
    // Inverted: smaller y (north) gives 1, larger y (south) gives 0.
    var north = norm(cy, CENTROID_MAX, CENTROID_MIN);
    return ROOT_LOW_HZ * Math.pow(2, (north * 5) / 12);
  }

  function spreadFor(f) {
    return norm(num(f && f.spread, SPREAD_MIN), SPREAD_MIN, SPREAD_MAX);
  }

  function detuneFor(f) {
    var loss = Math.max(0, num(f && f.dLoss, 0));
    return MAX_DETUNE_CENTS * clamp(loss / DLOSS_FULL_CENTS, 0, 1);
  }

  function cutoffFor(f) {
    var bright = norm(num(f && f.lum, LUM_MIN), LUM_MIN, LUM_MAX);
    return CUTOFF_MIN * Math.pow(CUTOFF_MAX / CUTOFF_MIN, bright);
  }

  function noiseFor(f) {
    var ragged = norm(num(f && f.edge, EDGE_MIN), EDGE_MIN, EDGE_MAX);
    return NOISE_MIN + (NOISE_MAX - NOISE_MIN) * ragged;
  }

  function isMajor(f) {
    return num(f && f.sigma, 0) >= 0;
  }

  /* ---------------------------------------------------------------- */
  /* Applying a feature vector to the engine                           */
  /* ---------------------------------------------------------------- */

  function currentFeatures() {
    if (timelineSeen && EJ.frames && EJ.frames.length && typeof EJ.frameAt === 'function') {
      return EJ.frameAt(tl);
    }
    return lastFeatures;
  }

  // Cancel the coda and let the measured chord speak again. voiceTarget = -1
  // forces the next applyWith() to re-assert every active voice.
  function resetCoda(restoreMaster) {
    if (!codaPhase) return;
    codaPhase = 0;
    codaAt = 0;
    voiceTarget = -1;
    if (restoreMaster && engine && ctx && playing) {
      engine.setMaster(MASTER_LEVEL, 0.25);
    }
  }

  function applyWith(f, now) {
    if (!engine || !ctx || !f) return;

    // The coda is driven here, not by a timer, so pause freezes it and a
    // scroll back up cancels it. Four voices hold, then one decays.
    if (codaPhase && tl < CODA_ENTER - 0.02) {
      resetCoda(true);
    } else if (!codaPhase && playing && tl >= CODA_ENTER) {
      codaPhase = 1;
      codaAt = now;
    }
    if (codaPhase === 1 && now - codaAt >= CODA_HOLD_S) {
      codaPhase = 2;
      codaAt = now;
      for (var s = 0; s < MAX_VOICES; s++) engine.setVoiceActive(s, s === CODA_VOICE);
      engine.setNoise(0.0001);
      engine.setMaster(0.0001, CODA_SOLO_S);
    } else if (codaPhase === 2 && now - codaAt >= CODA_SOLO_S) {
      codaPhase = 3;
      engine.setVoiceActive(CODA_VOICE, false);
      engine.setMaster(0.0001, 0.05);
    }
    var codaSolo = codaPhase >= 2;

    var count = voiceCountFor(f);
    if (count !== voiceTarget) {
      voiceTarget = count;
      for (var v = 0; v < MAX_VOICES; v++) {
        engine.setVoiceActive(v, v < count);
      }
    }

    var root = rootHzFor(f);
    var major = isMajor(f);
    var degrees = major ? MAJOR_DEGREES : MINOR_DEGREES;
    var spread = spreadFor(f);
    var topCents = detuneFor(f);

    for (var i = 0; i < MAX_VOICES; i++) {
      var hz = root * Math.pow(2, degrees[i] / 12);
      // The top voice carries the dLoss instability; every voice carries a
      // fixed few cents so a returning voice never lands exactly where it was.
      var cents = MICRO_CENTS[i] + (i === count - 1 ? topCents : 0);
      engine.setVoicePitch(i, hz, cents, spread * OCT_WEIGHTS[i]);
    }

    engine.setCutoff(cutoffFor(f));
    if (codaSolo) {
      engine.setNoise(0.0001);           // the texture belongs to the chord
    } else {
      engine.setNoise(noiseFor(f));
      engine.setSubRoot(root / 2);
    }

    var sigma = num(f.sigma, 0);
    if (sigma < -2) pulseHoldUntil = now + PULSE_HOLD;
    engine.setPulse(playing && !codaSolo && now < pulseHoldUntil);

    // Crack layer: a real transient event, gated by dLoss with hysteresis.
    var dLoss = num(f.dLoss, 0);
    if (dLoss < CRACK_REARM) {
      crackArmed = true;
    } else if (playing && crackArmed && dLoss > CRACK_ENTER && now >= crackCooldownUntil) {
      engine.crack(clamp((dLoss - CRACK_ENTER) / 0.02 + 0.4, 0.4, 1));
      crackArmed = false;
      crackCooldownUntil = now + CRACK_COOLDOWN;
    }

    lastApplied.year = num(f.year, lastApplied.year);
    lastApplied.rootHz = root;
    lastApplied.detuneCents = topCents;
    lastApplied.cutoffHz = cutoffFor(f);
    lastApplied.voices = count;
    lastApplied.major = major;
    lastApplied.spread = spread;
    lastApplied.noise = noiseFor(f);
  }

  /* ---------------------------------------------------------------- */
  /* Control loop — timeline smoothing + pulse scheduling              */
  /* ---------------------------------------------------------------- */

  function raf(fn) {
    if (typeof window.requestAnimationFrame === 'function') {
      return window.requestAnimationFrame(fn);
    }
    return window.setTimeout(function () { fn(Date.now()); }, 40);
  }

  function cancelRaf(id) {
    try {
      if (typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(id);
      else window.clearTimeout(id);
    } catch (e) {}
  }

  function startLoop() {
    if (loopId || disposed) return;
    lastTickMs = 0;

    function step(ts) {
      if (disposed) { loopId = 0; return; }
      loopId = raf(step);
      var ms = (typeof ts === 'number') ? ts : Date.now();
      if (!lastTickMs) lastTickMs = ms;
      var deltaMs = ms - lastTickMs;
      if (deltaMs < TICK_MS) return;
      lastTickMs = ms;

      try {
        var dt = Math.min(0.25, deltaMs / 1000);
        if (dt > 0) tl += (tlTarget - tl) * (1 - Math.exp(-dt / TIMELINE_TAU));
        if (Math.abs(tlTarget - tl) < 0.0002) tl = tlTarget;

        if (ctx && engine) {
          var now = ctx.currentTime;
          var f = currentFeatures();
          if (f) applyWith(f, now);
          engine.tick();
        }
      } catch (err) {
        fail(err);
      }
    }

    loopId = raf(step);
  }

  /* ---------------------------------------------------------------- */
  /* Engine attachment (engine.js emits on EJ's bus)                   */
  /* ---------------------------------------------------------------- */

  function attachFactory(factory) {
    if (typeof factory !== 'function') return;
    engineFactory = factory;
    if (ctx && !engine) {
      try {
        engine = engineFactory();
        engine.build(ctx);
        engine.setMaster(0.0001, 0);
        applyWith(currentFeatures(), ctx.currentTime);
      } catch (err) {
        fail(err);
      }
    }
  }

  try { EJ.on('audio:attach', attachFactory); } catch (e) {}

  /* ---------------------------------------------------------------- */
  /* The frozen contract                                                */
  /* ---------------------------------------------------------------- */

  function init() {
    if (initPromise) return initPromise;

    initPromise = new Promise(function (resolve) {
      if (disposed) { resolve(); return; }

      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) {
        fail(new Error('Web Audio unavailable — audio disabled'));
        resolve();
        return;
      }
      if (!engineFactory) {
        fail(new Error('engine.js did not load — audio disabled'));
        resolve();
        return;
      }

      try {
        ctx = new AC();                 // only ever created inside init()
        engine = engineFactory();
        engine.build(ctx);
        engine.setMaster(0.0001, 0);    // silent until play()

        if (lastFeatures) applyWith(lastFeatures, ctx.currentTime);
        startLoop();

        var resumed = null;
        if (ctx.state !== 'running' && typeof ctx.resume === 'function') {
          resumed = ctx.resume();
        }
        if (resumed && typeof resumed.then === 'function') {
          resumed.then(function () { resolve(); }, function (err) {
            // Autoplay policy can still refuse; the next play() retries.
            fail(err);
            resolve();
          });
        } else {
          resolve();
        }
      } catch (err) {
        try { if (ctx && ctx.close) ctx.close(); } catch (e) {}
        ctx = null;
        engine = null;
        fail(err);
        resolve();
      }
    });

    return initPromise;
  }

  function setFrame(features) {
    try {
      if (!features || typeof features !== 'object' || disposed) return;
      lastFeatures = features;

      var t = Number(features.t);
      if (isFinite(t)) {
        tlTarget = clamp01(t);
        if (!timelineSeen) tl = tlTarget;   // first frame: no swoop from zero
      }
      if (ctx && engine) applyWith(features, ctx.currentTime);
    } catch (err) {
      fail(err);
    }
  }

  function setTimeline(t) {
    try {
      t = Number(t);
      if (!isFinite(t) || disposed) return;
      timelineSeen = true;
      tlTarget = clamp01(t);
    } catch (err) {
      fail(err);
    }
  }

  function setMode(next) {
    try {
      if (next === 'guided' || next === 'listen' || next === 'reduced') mode = next;
      // The sonification is identical in every mode on purpose: the same data
      // must sound the same to every listener. Mode changes the page, not the truth.
    } catch (err) {
      fail(err);
    }
  }

  function play() {
    try {
      playing = true;
      resetCoda(false);                  // Play at the end replays the coda
      if (!ctx || !engine || disposed) return;   // init() will pick it up after the gate
      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        var p = ctx.resume();
        if (p && typeof p.catch === 'function') p.catch(function () {});
      }
      if (coldStart) {
        // Only reached with a live engine: the guard above returns first.
        engine.setMasterSmooth(MASTER_LEVEL, FADE_IN_COLD);
        coldStart = false;
      } else {
        engine.setMaster(MASTER_LEVEL, FADE_IN);
      }
    } catch (err) {
      fail(err);
    }
  }

  function pause() {
    try {
      playing = false;
      if (!ctx || !engine || disposed) return;
      engine.setMaster(0.0001, FADE_OUT);
      engine.setPulse(false);
    } catch (err) {
      fail(err);
    }
  }

  function isPlaying() {
    return !!playing;
  }

  function dispose() {
    try {
      if (disposed) return;
      disposed = true;
      playing = false;
      if (loopId) cancelRaf(loopId);
      loopId = 0;
      if (engine) engine.dispose();
      engine = null;
      ctx = null;
    } catch (err) {
      fail(err);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Diagnostics for app/tests/audio-test.html (not part of the API)   */
  /* ---------------------------------------------------------------- */

  function diagnostics() {
    var base = {
      ctxState: ctx ? ctx.state : 'none',
      engineBuilt: false,
      voices: voiceTarget,
      voicesSounding: 0,
      rootHz: lastApplied.rootHz,
      detuneCents: lastApplied.detuneCents,
      cutoffHz: lastApplied.cutoffHz,
      year: lastApplied.year,
      major: lastApplied.major,
      spread: lastApplied.spread,
      noise: lastApplied.noise,
      pulse: false,
      t: tl,
      tTarget: tlTarget,
      playing: playing,
      coda: codaPhase,
      mode: mode
    };
    if (engine) {
      try {
        var e = engine.diagnostics();
        base.ctxState = e.ctxState;
        base.engineBuilt = e.built;
        base.voicesSounding = e.activeVoices;
        base.active = e.active;
        base.pulse = e.pulseOn;
        base.master = e.master;
        base.sampleRate = e.sampleRate;
        base.oscillators = e.oscillators;
        base.irSeconds = e.irSeconds;
        base.rms = e.rms;
        base.peak = e.peak;
      } catch (err) {
        fail(err);
      }
    }
    return base;
  }

  /* ---------------------------------------------------------------- */
  /* Install — exactly one member: EJ.audio                             */
  /* ---------------------------------------------------------------- */

  var api = {
    init: init,
    setFrame: setFrame,
    setTimeline: setTimeline,
    setMode: setMode,
    play: play,
    pause: pause,
    isPlaying: isPlaying,
    dispose: dispose
  };

  try {
    Object.defineProperty(api, '__realAudio', { value: true, enumerable: false });
    Object.defineProperty(api, '_diag', { value: diagnostics, enumerable: false });
  } catch (e) {
    api.__realAudio = true;
    api._diag = diagnostics;
  }

  EJ.audio = api;
})();
