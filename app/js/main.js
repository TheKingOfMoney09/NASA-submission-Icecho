/* EJ main — the glue.
   Owner: 06-INTEGRATION. Runs last.
   Mode router, one writer of EJ.state.t per mode, lifecycle, keyboard,
   content injection and the HUD. Nothing else lives here. */

(function () {
  'use strict';

  var EJ = window.EJ;
  if (!EJ) return;

  var CONTRACT_IDS = [
    'stage', 'canvas', 'year', 'readout',
    'act-0', 'act-1', 'act-2', 'act-3', 'act-4', 'act-5',
    'transport', 'playpause', 'scrub', 'begin-gate', 'mapping', 'credits', 'live-region'
  ];

  // Cumulative act boundaries on t (act lengths 10/25/25/30/10/8 s of 108 s).
  var ACT_BOUNDARIES = [0, 0.0926, 0.3241, 0.5556, 0.8333, 0.9259, 1];
  var LISTEN_SECONDS = 120;   // whole story in listen mode
  var LIVE_REGION_MS = 1000;  // 1 Hz debounce
  var YEAR_STEP = 1 / 47;

  var mode = 'guided';
  var injected = false;
  var scrubbing = false;
  var lastNow = 0;
  var lastAnnounceAt = 0;
  var lastAnnounceText = '';
  var wasPlaying = false;
  var primed = false;
  var listenEndAt = 0;
  var reported = {};

  /* ------------------------------------------------------------------ */
  /* Content injection — 03 never touches the DOM, 04 never writes copy */
  /* ------------------------------------------------------------------ */

  function injectActs() {
    var content = EJ.content;
    if (injected || !content || !Array.isArray(content.acts)) return;
    injected = true;

    content.acts.forEach(function (act, i) {
      var section = document.getElementById('act-' + i);
      if (!section) return;

      var h2 = document.createElement('h2');
      h2.id = 'act-' + i + '-title';
      h2.textContent = act.title || ('Act ' + i);
      section.insertBefore(h2, section.firstChild);

      var lines = Array.isArray(act.lines) ? act.lines : [];
      lines.forEach(function (line) {
        var p = document.createElement('p');
        p.textContent = line;
        section.appendChild(p);
      });

      var transcript = content.transcript && content.transcript[String(i)];
      if (transcript) {
        var details = document.createElement('details');
        var summary = document.createElement('summary');
        summary.textContent = 'Transcript';
        var body = document.createElement('p');
        body.textContent = transcript;
        details.appendChild(summary);
        details.appendChild(body);
        section.appendChild(details);
      }
    });
  }

  function addReducedPlayButtons() {
    if (mode !== 'reduced') return;
    for (var i = 0; i < 6; i++) {
      (function (index) {
        var section = document.getElementById('act-' + index);
        if (!section) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'play-act';
        var acts = (EJ.content && EJ.content.acts) || [];
        var title = (acts[index] && acts[index].title) || ('Act ' + index);
        btn.textContent = 'Play — ' + title;
        btn.addEventListener('click', function () {
          // The gate is hidden in reduced mode, so this is the gesture that
          // creates the AudioContext. init() is idempotent.
          ensureAudio().then(function () {
            // Act V opens at its boundary; the last act is the coda, so it
            // starts at the end of the measured timeline and lets it play.
            seek(index === 5 ? 1 : ACT_BOUNDARIES[index] + 0.001);
            setPlaying(true);
          });
        });
        section.appendChild(btn);
      })(i);
    }
  }

  var audioStarted = false;

  function ensureAudio() {
    if (audioStarted) return Promise.resolve();
    audioStarted = true;

    var started;
    try {
      started = (EJ.audio && EJ.audio.init) ? Promise.resolve(EJ.audio.init()) : Promise.resolve();
    } catch (e) {
      EJ.fail('audio', e);
      started = Promise.resolve();
    }

    return started.then(function () {
      try { if (EJ.audio && EJ.audio.setMode) EJ.audio.setMode(mode); } catch (e) { EJ.fail('audio', e); }
    }).catch(function (e) {
      EJ.fail('audio', e);
    });
  }

  /* ------------------------------------------------------------------ */
  /* State.t writers: listen timer here; scroll is 04's (fallback in     */
  /* loader); reduced is click. main never writes t in guided mode.      */
  /* ------------------------------------------------------------------ */

  function clamp01(t) {
    t = Number(t);
    if (!isFinite(t)) return 0;
    return Math.min(1, Math.max(0, t));
  }

  function actAt(t) {
    for (var i = 1; i < ACT_BOUNDARIES.length; i++) {
      if (t < ACT_BOUNDARIES[i]) return i - 1;
    }
    return 5;
  }

  function safeAudioTimeline(t) {
    try {
      if (EJ.audio && EJ.audio.setTimeline) EJ.audio.setTimeline(t);
    } catch (e) {
      if (!reported.audio) { reported.audio = true; EJ.fail('audio', e); }
    }
  }

  function safeDraw(frame, t, act) {
    try {
      if (EJ.render && EJ.render.draw) EJ.render.draw(frame, t, act);
    } catch (e) {
      if (!reported.render) { reported.render = true; EJ.fail('render', e); }
    }
  }

  function safeAudioFrame(frame) {
    try {
      if (EJ.audio && EJ.audio.setFrame) EJ.audio.setFrame(frame);
    } catch (e) {
      if (!reported.audio) { reported.audio = true; EJ.fail('audio', e); }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Transport                                                          */
  /* ------------------------------------------------------------------ */

  function syncPlayButton() {
    var btn = document.getElementById('playpause');
    if (!btn) return;
    btn.textContent = EJ.state.playing ? 'Pause' : 'Play';
    btn.setAttribute('aria-pressed', EJ.state.playing ? 'true' : 'false');
  }

  function setPlaying(on) {
    on = !!on;
    try {
      if (on) {
        if (EJ.audio && EJ.audio.play) EJ.audio.play();
      } else if (EJ.audio && EJ.audio.pause) {
        EJ.audio.pause();
      }
    } catch (e) {
      if (!reported.audio) { reported.audio = true; EJ.fail('audio', e); }
    }
    EJ.state.playing = on;
    syncPlayButton();
  }

  function seek(t) {
    t = clamp01(t);
    EJ.state.t = t;
    safeAudioTimeline(t);
    if (mode === 'guided') {
      var el = document.scrollingElement || document.documentElement;
      var max = el.scrollHeight - el.clientHeight;
      if (max > 0) el.scrollTop = Math.round(t * max);
    }
  }

  function wireTransport() {
    var btn = document.getElementById('playpause');
    if (btn) {
      btn.addEventListener('click', function () { setPlaying(!EJ.state.playing); });
    }

    var scrub = document.getElementById('scrub');
    if (scrub) {
      scrub.addEventListener('input', function () {
        scrubbing = true;
        seek(Number(scrub.value) / 1000);
      });
      scrub.addEventListener('change', function () {
        scrubbing = false;
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Keyboard: Space play/pause, arrows +/- 1 year, Home/End bounds      */
  /* ------------------------------------------------------------------ */

  function isFormTarget(el) {
    if (!el || !el.tagName) return false;
    var tag = el.tagName.toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
      tag === 'BUTTON' || el.isContentEditable === true;
  }

  function wireKeyboard() {
    document.addEventListener('keydown', function (e) {
      if (isFormTarget(e.target) || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying(!EJ.state.playing);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        seek(EJ.state.t + YEAR_STEP);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seek(EJ.state.t - YEAR_STEP);
      } else if (e.key === 'Home') {
        e.preventDefault();
        seek(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        seek(1);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Lifecycle — pause when hidden, resume without re-initialising       */
  /* ------------------------------------------------------------------ */

  function wireLifecycle() {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        wasPlaying = EJ.state.playing;
        if (EJ.state.playing) setPlaying(false);
      } else if (wasPlaying) {
        wasPlaying = false;
        setPlaying(true);
      }
    });

    window.addEventListener('pagehide', function () {
      try {
        if (EJ.audio && EJ.audio.dispose) EJ.audio.dispose();
      } catch (e) { EJ.fail('audio', e); }
    });
  }

  /* ------------------------------------------------------------------ */
  /* HUD + live region (1 Hz)                                           */
  /* ------------------------------------------------------------------ */

  function readoutText(act) {
    var content = EJ.content || {};
    var title = (content.acts && content.acts[act] && content.acts[act].title) || ('Act ' + act);

    if (mode === 'listen' && Array.isArray(content.narration) && content.narration.length) {
      var line = null;
      for (var i = 0; i < content.narration.length; i++) {
        var n = content.narration[i];
        if (n && typeof n.t === 'number' && n.t <= EJ.state.t) line = n.text || line;
      }
      if (!line) line = (content.narration[0] && content.narration[0].text) || null;
      if (line) return line;
    }
    return title;
  }

  function announce(frame, act) {
    // Listen mode: the narration is the audio channel. A 1 Hz live region
    // would talk over it for screen-reader users, so it stays quiet there.
    if (mode === 'listen') return;

    var now = Date.now();
    if (now - lastAnnounceAt < LIVE_REGION_MS) return;

    var content = EJ.content || {};
    var title = (content.acts && content.acts[act] && content.acts[act].title) || ('Act ' + act);
    var pct = Math.round((frame.iceFrac || 0) * 1000) / 10;
    var text = 'Year ' + Math.round(frame.year) + '. ' + title +
      '. Ice covers ' + pct + ' percent of the mapped area.';

    if (text === lastAnnounceText) return;
    lastAnnounceAt = now;
    lastAnnounceText = text;

    var live = document.getElementById('live-region');
    if (live) live.textContent = text;
  }

  function updateHud(frame, act) {
    var yearEl = document.getElementById('year');
    var year = String(Math.round(frame.year));
    if (yearEl && yearEl.textContent !== year) yearEl.textContent = year;

    var readout = document.getElementById('readout');
    var text = readoutText(act);
    if (readout && readout.textContent !== text) readout.textContent = text;

    announce(frame, act);
  }

  function syncScrub(t) {
    var scrub = document.getElementById('scrub');
    if (!scrub || scrubbing) return;
    var v = String(Math.round(t * 1000));
    if (scrub.value !== v) scrub.value = v;
  }

  /* ------------------------------------------------------------------ */
  /* The one rAF loop                                                   */
  /* ------------------------------------------------------------------ */

  function loop(now) {
    requestAnimationFrame(loop);

    if (!lastNow) lastNow = now;
    var dt = Math.min(0.1, (now - lastNow) / 1000);
    lastNow = now;

    var t = clamp01(EJ.state.t);

    if (mode === 'listen' && EJ.state.playing) {
      t = clamp01(t + dt / LISTEN_SECONDS);
      EJ.state.t = t;
      safeAudioTimeline(t);
      if (t >= 1) {
        t = 1;
        EJ.state.t = 1;
        // The measured story ends at 2026; the app then plays its labelled
        // coda (2.2 s hold + 6 s decay). Stop only once that is over.
        if (!listenEndAt) listenEndAt = now;
        if (now - listenEndAt > 9200) setPlaying(false);
      }
    } else {
      listenEndAt = 0;
    }

    var frame = EJ.frameAt(t);
    EJ.state.frame = frame;

    // Feed the engine once even if the first rendered year equals the boot
    // year, so init() always has real features to build the first chord from.
    if (!primed) {
      primed = true;
      safeAudioFrame(frame);
    }

    var year = Math.round(frame.year);
    if (year !== EJ.state.year) {
      EJ.state.year = year;
      EJ.emit('year', year);
      EJ.emit('frame', frame);
      safeAudioFrame(frame);
    }

    var act = actAt(t);
    EJ.state.act = act;

    safeDraw(frame, t, act);
    updateHud(frame, act);
    syncScrub(t);
  }

  /* ------------------------------------------------------------------ */
  /* DOM contract self-check (used by the smoke suite)                  */
  /* ------------------------------------------------------------------ */

  window.scanDOM = function () {
    var missing = [];
    var duplicates = {};
    var counts = {};

    CONTRACT_IDS.forEach(function (id) {
      var n = document.querySelectorAll('[id="' + id + '"]').length;
      counts[id] = n;
      if (n === 0) missing.push(id);
      if (n > 1) duplicates[id] = n;
    });

    return {
      ids: CONTRACT_IDS.slice(),
      counts: counts,
      missing: missing,
      duplicates: duplicates,
      ok: missing.length === 0 && Object.keys(duplicates).length === 0
    };
  };

  /* ------------------------------------------------------------------ */
  /* Init                                                               */
  /* ------------------------------------------------------------------ */

  function start() {
    mode = EJ.state.mode || mode;
    document.body.classList.add('mode-' + mode);
    if (mode === 'reduced') document.body.classList.add('reduced');
    if (mode === 'listen') document.body.classList.add('listen');

    syncPlayButton();
    requestAnimationFrame(loop);
  }

  function init() {
    mode = EJ.state.mode || 'guided';

    // Inject before the loader attaches scroll/render: the scroll controller
    // must see the full document height, not the empty shell.
    injectActs();
    addReducedPlayButtons();

    wireTransport();
    wireKeyboard();
    wireLifecycle();

    // Everything that touches the canvas or audio waits for the loader:
    // frames are normalised and the real modules are init()ed before 'ready'.
    if (EJ.ready) start();
    else EJ.on('ready', start);
  }

  EJ.on('begin', function () {
    EJ.state.playing = true;
    syncPlayButton();
    safeAudioFrame(EJ.frameAt(EJ.state.t));
  });

  if (document.readyState === 'complete') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
