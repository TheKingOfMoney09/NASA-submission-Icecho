/* EJ loader — boot sequence and fallback modules.
   Owner: 06-INTEGRATION. Runs after core.js, before the real modules.
   Real modules (content/audio/render/scroll) overwrite these fallbacks when they load. */

(function () {
  'use strict';

  var EJ = window.EJ;
  if (!EJ) return;

  /* ------------------------------------------------------------------ */
  /* Fallback modules — prove the whole contract before the real ones   */
  /* exist. They live here (06's file), never in another agent's file.  */
  /* ------------------------------------------------------------------ */

  function makeFallbackAudio() {
    var ctx = null;
    var osc = null;
    var gain = null;
    var inited = false;
    var playing = false;
    var freq = 220;
    var mode = 'guided';

    function setFreq(t) {
      t = Math.min(1, Math.max(0, t));
      freq = 110 * Math.pow(2, t * 2); // 110 Hz (1979) -> 440 Hz (2026)
      if (ctx && osc) {
        try { osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.05); } catch (e) {}
      }
    }

    return {
      init: function () {
        if (inited) return Promise.resolve();
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) throw new Error('Web Audio unavailable');
        ctx = new AC();
        gain = ctx.createGain();
        gain.gain.value = 0.0001;
        osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        gain.gain.setTargetAtTime(0.08, ctx.currentTime, 0.05);
        inited = true;
        return ctx.resume ? ctx.resume() : Promise.resolve();
      },
      setFrame: function (features) { /* mapping not implemented in the fallback */ },
      setTimeline: function (t) { setFreq(t); },
      setMode: function (m) { mode = m; },
      play: function () {
        playing = true;
        if (ctx) {
          if (ctx.resume) { try { ctx.resume(); } catch (e) {} }
          if (gain) gain.gain.setTargetAtTime(0.08, ctx.currentTime, 0.05);
        }
      },
      pause: function () {
        playing = false;
        if (ctx && gain) gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05);
      },
      isPlaying: function () { return playing; },
      dispose: function () {
        try { if (osc) osc.stop(); } catch (e) {}
        try { if (ctx) ctx.close(); } catch (e) {}
        ctx = null;
        osc = null;
        gain = null;
        inited = false;
        playing = false;
      }
    };
  }

  function makeFallbackContent() {
    var titles = [
      'Act 0 — Cold open',
      'Act I — Why',
      'Act II — How',
      'Act III — The listener',
      'Act IV — Handover',
      'Act V — The last note'
    ];
    var acts = titles.map(function (title, i) {
      return {
        id: i,
        title: title,
        lines: ['(placeholder — content.js lands in the narrative slot)'],
        audioHint: ''
      };
    });
    return { acts: acts, transcript: {}, altText: {}, narration: [] };
  }

  function makeFallbackRender() {
    var canvas = null;
    var ctx2d = null;
    var reduced = false;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.clientWidth || window.innerWidth;
      canvas.height = canvas.clientHeight || window.innerHeight;
    }

    return {
      init: function (el) {
        canvas = el;
        if (!canvas) return;
        ctx2d = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
      },
      draw: function (frame, t, act) {
        if (!ctx2d) return;
        var w = canvas.width;
        var h = canvas.height;
        var l = Math.round(4 + 8 * (1 - t));
        ctx2d.fillStyle = 'hsl(205, 30%, ' + l + '%)';
        ctx2d.fillRect(0, 0, w, h);
        ctx2d.fillStyle = 'rgba(232, 241, 245, 0.9)';
        ctx2d.font = Math.round(h * 0.16) + 'px Georgia, serif';
        ctx2d.textAlign = 'center';
        ctx2d.textBaseline = 'middle';
        ctx2d.fillText(String(Math.round(frame.year)), w / 2, h / 2);
      },
      setReducedMotion: function (b) { reduced = !!b; },
      showAct: function (n) {}
    };
  }

  function makeFallbackScroll() {
    var attached = false;

    function progress() {
      var el = document.scrollingElement || document.documentElement;
      var max = el.scrollHeight - el.clientHeight;
      return max > 0 ? el.scrollTop / max : 0;
    }

    function onScroll() {
      var t = Math.min(1, Math.max(0, progress()));
      EJ.state.t = t;
      try { EJ.audio.setTimeline(t); } catch (e) { EJ.fail('scroll', e); }
    }

    return {
      attach: function () {
        if (attached) return;
        attached = true;
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        onScroll();
      }
    };
  }

  // Install fallbacks only where a real module has not claimed the slot.
  if (!EJ.audio) EJ.audio = makeFallbackAudio();
  if (!EJ.content) EJ.content = makeFallbackContent();
  if (!EJ.render) EJ.render = makeFallbackRender();
  if (!EJ.scroll) EJ.scroll = makeFallbackScroll();

  /* ------------------------------------------------------------------ */
  /* Frames: fetch -> inline JSON -> generated curve. Three fallbacks.  */
  /* ------------------------------------------------------------------ */

  function fallbackCurve() {
    // Anchors from the verified NSIDC extraction (memory, 13 Nov 2026).
    var anchors = [
      [1979, 0.1664], [1995, 0.1415], [2007, 0.1006], [2012, 0.0856], [2026, 0.1147]
    ];
    var out = [];
    var n = 48; // 1979..2026 inclusive

    for (var i = 0; i < n; i++) {
      var year = 1979 + i;
      var p = i / (n - 1);
      var ice = 0.1664;
      for (var a = 0; a < anchors.length - 1; a++) {
        var y0 = anchors[a][0];
        var y1 = anchors[a + 1][0];
        if (year >= y0 && year <= y1) {
          var k = (year - y0) / (y1 - y0);
          ice = anchors[a][1] + (anchors[a + 1][1] - anchors[a][1]) * k;
          break;
        }
      }
      out.push({
        year: year,
        t: p,
        iceFrac: ice,
        centroidY: 0.61 - 0.02 * p,
        spread: 0.14 + 0.02 * Math.sin(p * Math.PI),
        edge: 0.083 + 0.02 * p,
        lum: 0.47 - 0.04 * p,
        dLoss: 0,
        sigma: 0,
        img: null
      });
    }

    // dLoss = previous iceFrac - current iceFrac; sigma = z-score of iceFrac.
    var mean = 0;
    var i2;
    for (i2 = 0; i2 < out.length; i2++) mean += out[i2].iceFrac;
    mean /= out.length;
    var variance = 0;
    for (i2 = 0; i2 < out.length; i2++) {
      variance += Math.pow(out[i2].iceFrac - mean, 2);
    }
    var sd = Math.sqrt(variance / out.length) || 1;
    for (i2 = 0; i2 < out.length; i2++) {
      out[i2].dLoss = i2 === 0 ? 0 : (out[i2 - 1].iceFrac - out[i2].iceFrac);
      out[i2].sigma = (out[i2].iceFrac - mean) / sd;
    }
    return out;
  }

  function normaliseFrames(raw) {
    var arr = raw && Array.isArray(raw.frames) ? raw.frames : (Array.isArray(raw) ? raw : []);
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var f = arr[i] || {};
      var frame = {
        year: Number(f.year),
        t: Number(f.t),
        iceFrac: numberOr(f.iceFrac, 0),
        centroidY: numberOr(f.centroidY, 0.5),
        spread: numberOr(f.spread, 0.1),
        edge: numberOr(f.edge, 0.05),
        lum: numberOr(f.lum, 0.5),
        dLoss: numberOr(f.dLoss, 0),
        sigma: numberOr(f.sigma, 0),
        img: f.img || null
      };
      out.push(frame);
    }
    out.sort(function (a, b) { return a.t - b.t; });
    if (out.length) {
      if (!isFinite(out[0].year)) out[0].year = 1979;
      for (var j = 0; j < out.length; j++) {
        if (!isFinite(out[j].year)) out[j].year = out[0].year + (out[0].year === 1979 ? j : j);
        if (!isFinite(out[j].t)) out[j].t = out.length > 1 ? j / (out.length - 1) : 0;
      }
    }
    return out;
  }

  function numberOr(v, d) {
    v = Number(v);
    return isFinite(v) ? v : d;
  }

  function loadFrames() {
    // fetch is only attempted where it can work; file:// goes straight to inline
    // data so the console never carries a CORS error.
    if (location.protocol === 'file:') return Promise.resolve(readInlineFrames());

    return fetch('data/frames.json').then(function (res) {
      if (!res.ok) throw new Error('frames.json ' + res.status);
      return res.json();
    }).then(function (json) {
      var frames = normaliseFrames(json);
      if (!frames.length) throw new Error('frames.json empty');
      return frames;
    }).catch(function () {
      return readInlineFrames();
    });
  }

  function readInlineFrames() {
    try {
      var el = document.getElementById('frames-data');
      var text = el && el.textContent ? el.textContent.trim() : '';
      if (text) {
        var json = JSON.parse(text);
        var frames = normaliseFrames(json);
        if (frames.length) return frames;
      }
    } catch (e) {
      try { EJ.fail('loader', e); } catch (e2) {}
    }
    return null;
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                               */
  /* ------------------------------------------------------------------ */

  var booted = false;

  function readMode() {
    var mode = null;
    try {
      var params = new URLSearchParams(window.location.search);
      mode = params.get('mode');
    } catch (e) {}
    if (mode !== 'listen' && mode !== 'guided' && mode !== 'reduced') {
      mode = null;
    }
    if (mode) return mode;
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return 'reduced';
      }
    } catch (e) {}
    return 'guided';
  }

  function initModules(mode) {
    try {
      if (EJ.render && EJ.render.init) EJ.render.init(document.getElementById('canvas'));
    } catch (e) { EJ.fail('render', e); }

    try {
      if (EJ.render && EJ.render.setReducedMotion) EJ.render.setReducedMotion(mode === 'reduced');
    } catch (e) { EJ.fail('render', e); }

    try {
      if (EJ.audio && EJ.audio.setMode) EJ.audio.setMode(mode);
    } catch (e) { EJ.fail('audio', e); }

    try {
      if (EJ.scroll && EJ.scroll.attach && mode === 'guided') EJ.scroll.attach();
    } catch (e) { EJ.fail('scroll', e); }

    var issues = [];
    try { issues = EJ.checkContract(); } catch (e) { EJ.fail('loader', e); }
    return issues;
  }

  function wireGate(mode) {
    var gate = document.getElementById('begin-gate');
    if (!gate) return;
    var armed = false;

    function begin(ev) {
      if (ev && ev.preventDefault) ev.preventDefault();
      if (armed) return;
      armed = true;

      var started = Promise.resolve();
      try {
        started = (EJ.audio && EJ.audio.init) ? Promise.resolve(EJ.audio.init()) : Promise.resolve();
      } catch (e) {
        EJ.fail('audio', e);
      }

      started.catch(function (e) { EJ.fail('audio', e); }).then(function () {
        try { if (EJ.audio && EJ.audio.setMode) EJ.audio.setMode(mode); } catch (e) { EJ.fail('audio', e); }
        try { if (EJ.audio && EJ.audio.play) EJ.audio.play(); } catch (e) { EJ.fail('audio', e); }
        EJ.state.playing = true;
        gate.hidden = true;
        gate.setAttribute('aria-hidden', 'true');
        document.body.classList.add('began');
        EJ.emit('begin', { mode: mode });
      });
    }

    // The gate is a real <button>: Enter and Space fire click natively.
    gate.addEventListener('click', begin);
  }

  function boot() {
    if (booted) return;
    booted = true;

    var mode = readMode();
    EJ.state.mode = mode;

    loadFrames().then(function (frames) {
      if (!frames || !frames.length) frames = fallbackCurve();
      EJ.frames = frames;
      EJ.state.frame = EJ.frameAt(0);
      EJ.state.year = EJ.state.frame.year;

      var issues = initModules(mode);
      wireGate(mode);

      document.body.classList.add('mode-' + mode);
      if (mode === 'reduced') document.body.classList.add('reduced');
      if (mode === 'listen') document.body.classList.add('listen');

      EJ.ready = true;
      EJ.emit('ready', { mode: mode, frames: frames.length, contractIssues: issues });
      EJ.emit('mode', mode);
    }).catch(function (err) {
      // Boot must never blank the page.
      EJ.fail('loader', err);
      var issues2 = initModules(mode);
      wireGate(mode);
      EJ.ready = true;
      EJ.emit('ready', { mode: mode, frames: 0, contractIssues: issues2 });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
