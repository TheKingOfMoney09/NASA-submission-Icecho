// EJ scroll — native scroll becomes the master timeline.
// Owner: 04-VISUAL. Runs in guided mode only; loader calls attach() once.
// Never hijacks the wheel, never preventDefault on scroll, never writes
// #year, #readout or #live-region. EJ.state.t is the only thing written here.

(function () {
  'use strict';

  var EJ = window.EJ;
  if (!EJ) return;

  // A reload must start the piece, not resume the browser's scroll offset.
  // Restored to the end, the plate is already black and the coda has already
  // decayed: it reads as a broken page. Opt out before the restore happens.
  try {
    if (window.history && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  } catch (e) {}

  var SMOOTH = 0.08;        // per frame, as specified in PLAN 6.4
  var MAX_STEP = 0.035;     // hard cap: ~1.6 years per frame, never a snap
  var SEND_EPS = 0.0004;    // don't spam the audio engine for nothing
  var ACTS = 6;

  var attached = false;
  var running = false;
  var raf = 0;
  var target = 0;
  var lastSent = -1;
  var currentAct = -1;
  var io = null;
  var ratios = [];
  var sections = [];
  var reduced = false;
  var armed = false;        // reduced mode: arm audio on the first gesture
  var scroller = null;

  function clamp01(v) {
    v = Number(v);
    if (!isFinite(v)) return 0;
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function el() {
    return document.scrollingElement || document.documentElement;
  }

  function progress() {
    var s = el();
    var max = s.scrollHeight - s.clientHeight;
    if (!(max > 0)) return 0;
    return clamp01(s.scrollTop / max);
  }

  function measure() {
    scroller = el();
    var s = scroller;
    var max = s.scrollHeight - s.clientHeight;
    target = max > 0 ? clamp01(s.scrollTop / max) : 0;
  }

  function visibleSections() {
    sections = [];
    for (var i = 0; i < ACTS; i++) {
      var node = document.getElementById('act-' + i);
      if (node) sections.push({ i: i, node: node });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Act detection: IntersectionObserver on #act-N, never pixel maths.  */
  /* ------------------------------------------------------------------ */

  function applyAct(n) {
    n = Math.round(Number(n));
    if (!isFinite(n) || n < 0) n = 0;
    if (n > ACTS - 1) n = ACTS - 1;
    if (n === currentAct) return;
    currentAct = n;
    if (document.body) document.body.setAttribute('data-act', String(n));
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      if (s.node && s.node.classList) s.node.classList.toggle('is-active', s.i === n);
    }
    try {
      if (EJ.render && EJ.render.showAct) EJ.render.showAct(n);
    } catch (e) {
      if (!EJ.degraded || !EJ.degraded['scroll:showAct']) EJ.fail('scroll:showAct', e);
    }
  }

  function pickAct() {
    var best = -1;
    var bestRatio = 0;
    for (var i = 0; i < sections.length; i++) {
      var r = ratios[sections[i].i] || 0;
      if (r > bestRatio) { bestRatio = r; best = sections[i].i; }
    }
    if (best >= 0) applyAct(best);
  }

  function wireObserver() {
    visibleSections();
    if (!sections.length) return;
    ratios = [];

    if (typeof window.IntersectionObserver === 'function') {
      try {
        io = new IntersectionObserver(function (entries) {
          for (var i = 0; i < entries.length; i++) {
            var e = entries[i];
            var idx = Number(e.target.getAttribute('data-act-index'));
            if (!isFinite(idx)) continue;
            ratios[idx] = e.isIntersecting ? Math.max(0.001, e.intersectionRatio) : 0;
          }
          pickAct();
        }, { root: null, rootMargin: '-44% 0px -44% 0px', threshold: [0, 0.02, 0.25, 0.5, 0.75, 1] });
        for (var i = 0; i < sections.length; i++) {
          sections[i].node.setAttribute('data-act-index', String(sections[i].i));
          io.observe(sections[i].node);
        }
      } catch (e) {
        io = null;
      }
    }

    if (!io) {
      // No IntersectionObserver: derive the act from the section boxes.
      fallbackAct();
    }
  }

  function fallbackAct() {
    var mid = (window.innerHeight || 0) / 2;
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].node.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) { applyAct(sections[i].i); return; }
    }
  }

  /* ------------------------------------------------------------------ */
  /* The smoothing loop                                                 */
  /* ------------------------------------------------------------------ */

  function tick() {
    raf = 0;
    if (reduced || !running) return;
    raf = window.requestAnimationFrame(tick);

    var t = clamp01(EJ.state.t);
    var diff = target - t;
    var step = diff * SMOOTH;
    if (step > MAX_STEP) step = MAX_STEP;
    if (step < -MAX_STEP) step = -MAX_STEP;
    t += step;

    if (Math.abs(target - t) < 0.0002) t = target;
    EJ.state.t = t;

    if (Math.abs(t - lastSent) > SEND_EPS) {
      lastSent = t;
      try {
        if (EJ.audio && EJ.audio.setTimeline) EJ.audio.setTimeline(t);
      } catch (e) {
        if (!EJ.degraded || !EJ.degraded['scroll:audio']) EJ.fail('scroll:audio', e);
      }
    }

    if (!io) fallbackAct();
  }

  function start() {
    if (running || reduced) return;
    running = true;
    lastSent = -1;
    if (!raf) raf = window.requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (raf) {
      window.cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                             */
  /* ------------------------------------------------------------------ */

  function onScroll() {
    measure();
    if (!raf && running) raf = window.requestAnimationFrame(tick);
  }

  function onResize() {
    measure();
  }

  function onVisibility() {
    if (document.hidden) {
      stop();
    } else if (!reduced) {
      measure();
      start();
    }
  }

  /* Reduced mode can still play audio: the gate is visually hidden there,
     so the first real gesture is the only chance to unlock the context. */
  function armReducedAudio() {
    if (armed || !document.body || !document.body.classList.contains('reduced')) return;
    armed = true;
    var go = function () {
      document.removeEventListener('pointerdown', go);
      document.removeEventListener('keydown', go);
      try {
        if (EJ.audio && EJ.audio.init) {
          var p = EJ.audio.init();
          if (p && p.catch) p.catch(function () {});
        }
      } catch (e) {
        EJ.fail('scroll:audio-init', e);
      }
    };
    document.addEventListener('pointerdown', go, { once: true, passive: true });
    document.addEventListener('keydown', go, { once: true });
  }

  function enterReduced() {
    reduced = true;
    stop();
    armed = false;
    if (io) { try { io.disconnect(); } catch (e) {} io = null; }
    if (document.body) document.body.classList.add('reduced');
    if (!sections.length) visibleSections();
    applyAct(0);
    try { if (EJ.render && EJ.render.setReducedMotion) EJ.render.setReducedMotion(true); } catch (e) {}
    armReducedAudio();
  }

  function leaveReduced() {
    if (!document.body) return;
    reduced = false;
    document.body.classList.remove('reduced');
    try { if (EJ.render && EJ.render.setReducedMotion) EJ.render.setReducedMotion(false); } catch (e) {}
    wireObserver();
    measure();
    start();
  }

  function onMediaChange() {
    var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var nowReduced = !!(mq && mq.matches);
    if (nowReduced === reduced) return;
    if (nowReduced) enterReduced();
    else if (EJ.state.mode === 'guided') leaveReduced();
  }

  /* ------------------------------------------------------------------ */
  /* Public                                                             */
  /* ------------------------------------------------------------------ */

  function attach() {
    if (attached) return;
    attached = true;
    scroller = el();

    // The cover wordmark is decorative CSS content, so give the full-screen
    // button an explicit name instead of letting it absorb generated text.
    var gate = document.getElementById('begin-gate');
    if (gate && !gate.getAttribute('aria-label')) {
      gate.setAttribute('aria-label', 'Begin');
    }

    // The loader calls attach() before it stamps the body class, so the
    // mode is the reliable signal here; the class catches a late switch.
    reduced = EJ.state.mode === 'reduced' ||
      (document.body ? document.body.classList.contains('reduced') : false);

    // Belt and braces for a browser that restored before this module ran.
    try { window.scrollTo(0, 0); } catch (e) {}

    measure();

    if (reduced) {
      enterReduced();
    } else {
      wireObserver();
      if (!io) fallbackAct();
      start();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    if (window.matchMedia) {
      try {
        var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mq.addEventListener) mq.addEventListener('change', onMediaChange);
        else if (mq.addListener) mq.addListener(onMediaChange);
      } catch (e) {}
    }
  }

  EJ.scroll = { attach: attach };

  // Loader attaches in guided mode. This only covers a real race: if the
  // module loads after boot (http fetch path), the ready hook attaches once.
  EJ.on('ready', function () {
    if (!document.body) return;
    if (document.body.classList.contains('reduced')) {
      if (!reduced) enterReduced();
      else armReducedAudio();
      return;
    }
    if (EJ.state.mode === 'guided') attach();
  });
})();
