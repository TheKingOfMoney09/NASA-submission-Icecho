/* EJ core — the contract, made real.
   Owner: 06-INTEGRATION. Created before every other module loads.
   Nobody else may redefine window.EJ. */

(function () {
  'use strict';

  // One shared namespace, created exactly once.
  if (window.EJ) return;

  var listeners = {};
  var degraded = {};

  var EJ = {
    state: {
      t: 0,              // 0..1 master timeline across 1979 -> 2026
      year: 1979,        // float
      frame: {},         // current feature vector
      act: 0,            // 0..5
      mode: 'guided',    // 'guided' | 'listen' | 'reduced'
      playing: false
    },
    audio: null,         // 02 assigns
    content: null,       // 03 assigns
    render: null,        // 04 assigns
    frames: [],          // 01's frames.json, normalised by loader.js
    ready: false,
    degraded: degraded,

    /* ---- tiny event bus: modules never import each other ---- */

    on: function (evt, fn) {
      if (typeof fn !== 'function') return function () {};
      (listeners[evt] || (listeners[evt] = [])).push(fn);
      return function off() {
        var arr = listeners[evt] || [];
        var i = arr.indexOf(fn);
        if (i !== -1) arr.splice(i, 1);
      };
    },

    emit: function (evt, payload) {
      var arr = listeners[evt];
      if (!arr || !arr.length) return;
      for (var i = 0; i < arr.length; i++) {
        try {
          arr[i](payload);
        } catch (err) {
          // A bad listener must never break the story.
          EJ.fail('listener:' + evt, err);
        }
      }
    },

    /* ---- failure isolation: degrade, never throw ---- */

    fail: function (module, err) {
      degraded[module] = (degraded[module] || 0) + 1;
      try {
        var msg = err && err.message ? err.message : String(err);
        console.error('[EJ] ' + module + ' degraded: ' + msg);
      } catch (e) { /* console itself may be unavailable */ }
      try { EJ.emit('fail', { module: module, error: err }); } catch (e) {}
    },

    /* ---- timeline -> feature vector, interpolated, never null ---- */

    frameAt: function (t) {
      t = Number(t);
      if (!isFinite(t)) t = 0;
      t = Math.min(1, Math.max(0, t));

      var frames = EJ.frames || [];
      if (!frames.length) return syntheticFrame(t);
      if (frames.length === 1) return copyFrame(frames[0], t);

      if (t <= frames[0].t) return copyFrame(frames[0], t);
      var last = frames.length - 1;
      if (t >= frames[last].t) return copyFrame(frames[last], t);

      var lo = 0;
      var hi = last;
      while (hi - lo > 1) {
        var mid = (lo + hi) >> 1;
        if (frames[mid].t <= t) lo = mid;
        else hi = mid;
      }

      var a = frames[lo];
      var b = frames[hi];
      var span = (b.t - a.t) || 1e-9;
      var k = Math.min(1, Math.max(0, (t - a.t) / span));
      return lerpFrame(a, b, k);
    },

    lerpFeatures: function (t) { return EJ.frameAt(t); },

    /* ---- contract validation: one readable console line, never a crash ---- */

    checkContract: function () {
      var issues = [];

      function needMethods(name, mod, methods) {
        if (!mod) { issues.push(name + ' missing'); return; }
        for (var i = 0; i < methods.length; i++) {
          if (typeof mod[methods[i]] !== 'function') {
            issues.push(name + '.' + methods[i] + ' missing');
          }
        }
      }

      needMethods('audio', EJ.audio,
        ['init', 'setFrame', 'setTimeline', 'setMode', 'play', 'pause', 'isPlaying', 'dispose']);
      needMethods('render', EJ.render, ['init', 'draw', 'setReducedMotion', 'showAct']);

      var c = EJ.content;
      if (!c) {
        issues.push('content missing');
      } else {
        if (!Array.isArray(c.acts) || c.acts.length !== 6) {
          issues.push('content.acts must hold 6 acts');
        } else {
          for (var i = 0; i < c.acts.length; i++) {
            var act = c.acts[i] || {};
            if (!act.title) issues.push('content.acts[' + i + '].title missing');
            if (!Array.isArray(act.lines)) issues.push('content.acts[' + i + '].lines missing');
          }
        }
        if (!c.transcript || typeof c.transcript !== 'object') issues.push('content.transcript missing');
        if (!c.altText || typeof c.altText !== 'object') issues.push('content.altText missing');
        if (!Array.isArray(c.narration)) issues.push('content.narration missing');
      }

      if (issues.length) {
        try { console.warn('[EJ] contract: ' + issues.join(', ')); } catch (e) {}
      }
      return issues;
    }
  };

  /* ---- interpolation helpers ---- */

  function numericKeys(a, b) {
    var keys = {};
    var k;
    for (k in a) {
      if (typeof a[k] === 'number' && typeof b[k] === 'number') keys[k] = 1;
    }
    return keys;
  }

  function lerpFrame(a, b, k) {
    var out = {};
    var keys = numericKeys(a, b);
    for (var key in a) {
      if (key === 'img') continue;
      out[key] = keys[key] ? a[key] + (b[key] - a[key]) * k : a[key];
    }
    for (var key2 in b) {
      if (!(key2 in out) && key2 !== 'img') out[key2] = b[key2];
    }
    out.img = k < 0.5 ? (a.img || null) : (b.img || null);
    out.t = a.t + (b.t - a.t) * k;
    return out;
  }

  function copyFrame(f, t) {
    var out = {};
    for (var key in f) out[key] = f[key];
    out.t = t;
    return out;
  }

  function syntheticFrame(t) {
    // Last-resort curve so the instrument always has something to play.
    return {
      year: 1979 + 47 * t,
      t: t,
      iceFrac: 0.1664 + (0.1147 - 0.1664) * t,
      centroidY: 0.61,
      spread: 0.14,
      edge: 0.083,
      lum: 0.47,
      dLoss: 0,
      sigma: 0,
      img: null
    };
  }

  window.EJ = EJ;
})();
