// EJ render — the NSIDC plate, drawn as a print.
// Owner: 04-VISUAL. Canvas 2D, one canvas, no text baked into the image,
// at most two image draws per frame. Never throws; degrades quietly.
//
// The magenta 1981-2010 median edge lives inside the supplied WebP and is
// never tinted, moved, scaled or covered: all overlays sit outside the plate.

(function () {
  'use strict';

  var EJ = window.EJ;
  if (!EJ) return;

  var PLATE_AR = 800 / 1159;   // shipped WebP aspect, reserved up front
  var TAU = Math.PI * 2;
  var INK = '#08090b';

  var canvas = null;
  var ctx = null;
  var wired = false;

  var cssW = 0;
  var cssH = 0;
  var dpr = 1;
  var box = { x: 0, y: 0, w: 1, h: 1 };
  var plate = { x: 0, y: 0, w: 1, h: 1 };
  var layout = { compact: false, short: false, noRail: false };

  var reduced = false;
  var quality = 2;            // 2 full · 1 no rail · 0 low res · -1 bare image
  var slowMs = 0;
  var shownAct = -1;
  var anomaly = null;

  var frames = [];
  var maxIce = 0.1801;
  var framesStamp = 0;

  var cache = {};
  var cacheNames = [];
  var imageVersion = 0;
  var probeState = 0;         // 0 unknown · 1 images work · -1 no images
  var probeName = null;
  var probeStarted = false;
  var probeTimer = 0;
  var startedAt = 0;
  var liteBuild = false;
  var drawnName = null;
  var drawnImage = null;

  var lastKey = '';
  var lastT = -1;
  var fastScroll = false;

  /* ------------------------------------------------------------------ */
  /* Small helpers                                                      */
  /* ------------------------------------------------------------------ */

  function now() {
    return (window.performance && window.performance.now) ? window.performance.now() : Date.now();
  }

  function clamp(v, lo, hi) {
    v = Number(v);
    if (!isFinite(v)) return lo;
    return v < lo ? lo : v > hi ? hi : v;
  }

  function smooth01(v) {
    v = clamp(v, 0, 1);
    return v * v * (3 - 2 * v);
  }

  function markDirty() {
    lastKey = '';
  }

  /* ------------------------------------------------------------------ */
  /* Layout: portrait plate in the right two-thirds, rail underneath.   */
  /* ------------------------------------------------------------------ */

  function computeLayout(w, h) {
    var compact = w < 900 && h > 520;
    var short = h <= 520;
    var gutter = clamp(w * 0.07, 20, 112);
    var plateH, plateW, px, py, railGap = 0;

    if (compact) {
      // Under the masthead, top-right. CSS starts the words at 60vh-ish.
      plateH = Math.min(h * 0.33, (w * 0.56) / PLATE_AR);
      plateW = plateH * PLATE_AR;
      px = w - gutter - plateW;
      py = 140;
    } else if (short) {
      // Landscape: keep the margin layout, just smaller and closer to the top.
      plateH = Math.min(h * 0.66, (w * 0.36) / PLATE_AR);
      plateW = plateH * PLATE_AR;
      px = w - gutter - 8 - plateW;
      py = Math.max(54, (h - plateH) * 0.5 - h * 0.01);
    } else {
      // Room at the bottom for the rail and the control strip.
      var top = Math.max(56, h * 0.09);
      var bottom = Math.max(84, h * 0.115) + 74;
      var avail = Math.max(h * 0.4, h - top - bottom);
      plateH = Math.min(avail, (w * 0.44) / PLATE_AR);
      plateW = plateH * PLATE_AR;
      px = w - gutter - 8 - plateW;
      py = top + Math.max(0, (avail - plateH) * 0.5);
      railGap = 76;
    }

    if (px < 0) px = 0;
    if (py < 0) py = 0;

    var pad = compact ? 14 : 26;
    var railBottom = py + plateH + railGap;
    var bx = Math.max(0, px - pad);
    var by = Math.max(0, py - pad);
    var bw = Math.min(w - bx, plateW + pad * 2);
    var bh = Math.min(h - by, railBottom - by + (railGap ? 8 : pad));

    return {
      compact: compact,
      short: short,
      noRail: compact || short,
      plate: { x: px, y: py, w: plateW, h: plateH },
      box: { x: bx, y: by, w: Math.max(1, bw), h: Math.max(1, bh) }
    };
  }

  function resize() {
    if (!canvas) return;
    cssW = Math.max(240, document.documentElement.clientWidth || window.innerWidth || 320);
    cssH = Math.max(240, document.documentElement.clientHeight || window.innerHeight || 480);

    var L = computeLayout(cssW, cssH);
    layout = L;
    plate = L.plate;
    box = L.box;

    dpr = quality <= 0 ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    canvas.style.left = Math.round(box.x) + 'px';
    canvas.style.top = Math.round(box.y) + 'px';
    canvas.style.width = Math.round(box.w) + 'px';
    canvas.style.height = Math.round(box.h) + 'px';

    var bw = Math.max(1, Math.round(box.w * dpr));
    var bh = Math.max(1, Math.round(box.h * dpr));
    if (canvas.width !== bw) canvas.width = bw;
    if (canvas.height !== bh) canvas.height = bh;

    var c = ctx || canvas.getContext('2d');
    if (c) {
      c.imageSmoothingEnabled = true;
      try { c.imageSmoothingQuality = 'medium'; } catch (e) {}
    }
    markDirty();
  }

  /* ------------------------------------------------------------------ */
  /* Frames + image window (6 decoded bitmaps at most)                  */
  /* ------------------------------------------------------------------ */

  function readFrames() {
    var list = EJ.frames || [];
    if (!list.length) return;
    if (list === frames) return;
    frames = list;
    var m = 0;
    for (var i = 0; i < frames.length; i++) {
      var v = Number(frames[i].iceFrac);
      if (isFinite(v) && v > m) m = v;
    }
    maxIce = m > 0 ? m : 0.1664;
  }

  function sourceFor(name) {
    if (!name) return null;
    if (window.EJ_IMAGES && window.EJ_IMAGES[name]) return window.EJ_IMAGES[name];
    if (probeState === -1 || liteBuild) return null;
    return 'data/frames/' + name;
  }

  function entryFor(name) {
    if (!name) return null;
    var e = cache[name];
    if (e) return e;
    var src = sourceFor(name);
    if (!src) return null;

    e = { name: name, img: new Image(), ready: false, failed: false };
    try { e.img.decoding = 'async'; } catch (err) {}
    e.img.onload = function () {
      if (e.failed) return;
      var done = function () {
        if (e.ready) return;
        e.ready = true;
        if (probeState === 0 && name === probeName) probeState = 1;
        imageVersion++;
        markDirty();
      };
      if (e.img.decode) {
        e.img.decode().then(done, done);
      } else {
        done();
      }
    };
    e.img.onerror = function () {
      e.failed = true;
      if (name === probeName) {
        probeState = -1;
        dropAll();
      } else {
        delete cache[name];
      }
      imageVersion++;
      markDirty();
    };

    cache[name] = e;
    cacheNames.push(name);
    try { e.img.src = src; } catch (err) { e.failed = true; }
    return e;
  }

  function dropAll() {
    for (var i = 0; i < cacheNames.length; i++) {
      var e = cache[cacheNames[i]];
      if (e && !e.ready && e.img) {
        try { e.img.onload = null; e.img.onerror = null; e.img.src = ''; } catch (err) {}
      }
    }
    cache = {};
    cacheNames = [];
    drawnImage = null;
    drawnName = null;
  }

  function nearestIndex(t) {
    if (!frames.length) return -1;
    var lo = 0;
    var hi = frames.length - 1;
    if (t <= frames[0].t) return 0;
    if (t >= frames[hi].t) return hi;
    while (hi - lo > 1) {
      var mid = (lo + hi) >> 1;
      if (frames[mid].t <= t) lo = mid;
      else hi = mid;
    }
    return (t - frames[lo].t) <= (frames[hi].t - t) ? lo : hi;
  }

  function locate(t) {
    var n = frames.length;
    if (!n) return null;
    if (t <= frames[0].t) return { a: 0, b: 0, k: 0 };
    if (t >= frames[n - 1].t) return { a: n - 1, b: n - 1, k: 0 };
    var lo = 0;
    var hi = n - 1;
    while (hi - lo > 1) {
      var mid = (lo + hi) >> 1;
      if (frames[mid].t <= t) lo = mid;
      else hi = mid;
    }
    var span = (frames[hi].t - frames[lo].t) || 1e-9;
    return { a: lo, b: hi, k: clamp((t - frames[lo].t) / span, 0, 1) };
  }

  function syncWindow(center) {
    if (probeState === -1 || !frames.length) return;

    if (probeState === 0) {
      // One image decides whether this build has maps at all. Only then
      // is it worth requesting the six around the playhead.
      if (!probeStarted && probeName) {
        probeStarted = true;
        entryFor(probeName);
        probeTimer = window.setTimeout(function () {
          probeTimer = 0;
          if (probeState !== 0) return;
          probeState = -1;
          dropAll();
          markDirty();
        }, 1600);
      }
      return;
    }
    if (probeTimer) {
      window.clearTimeout(probeTimer);
      probeTimer = 0;
    }

    var lo = Math.max(0, center - 2);
    var hi = Math.min(frames.length - 1, center + 3);
    var keep = {};
    for (var i = lo; i <= hi; i++) {
      var name = frames[i] && frames[i].img;
      if (!name) continue;
      keep[name] = 1;
      if (!cache[name]) entryFor(name);
    }
    if (drawnName) keep[drawnName] = 1;

    for (var n = 0; n < cacheNames.length; n++) {
      var key = cacheNames[n];
      if (keep[key]) continue;
      var e = cache[key];
      if (e && e.img) {
        try { e.img.onload = null; e.img.onerror = null; e.img.src = ''; } catch (err) {}
      }
      delete cache[key];
      cacheNames.splice(n, 1);
      n--;
    }
  }

  /* ------------------------------------------------------------------ */
  /* The drawn plate                                                    */
  /* ------------------------------------------------------------------ */

  function blobPath(cx, cy, r, wobble) {
    var n = 96;
    for (var i = 0; i <= n; i++) {
      var a = (i / n) * TAU;
      var rr = r * (1 + wobble * (
        0.10 * Math.sin(3 * a + 0.7) +
        0.06 * Math.sin(5 * a + 2.1) +
        0.03 * Math.sin(7 * a + 4.3)
      ));
      var x = cx + Math.cos(a) * rr;
      var y = cy + Math.sin(a) * rr * 0.94;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function fallbackPlate(iceFrac, t) {
    var x = plate.x;
    var y = plate.y;
    var w = plate.w;
    var h = plate.h;
    var cx = x + w * 0.5;
    var cy = y + h * 0.5;
    var R = w * 0.40;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    ctx.fillStyle = '#0f2b52';
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#7f8385';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#0f2b52';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.26, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = 'rgba(232,241,245,0.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.42, 0, TAU);
    ctx.arc(cx, cy, R * 0.82, 0, TAU);
    ctx.arc(cx, cy, R * 1.26, 0, TAU);
    ctx.stroke();
    for (var m = 0; m < 6; m++) {
      var a = (m / 6) * TAU + 0.26;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R * 0.42, cy + Math.sin(a) * R * 0.42);
      ctx.lineTo(cx + Math.cos(a) * R * 1.26, cy + Math.sin(a) * R * 1.26);
      ctx.stroke();
    }

    // Ice: scales with the measured fraction, never with the clock.
    var scale = Math.sqrt(clamp((Number(iceFrac) || 0.1) / 0.14, 0.18, 1.35));
    ctx.beginPath();
    blobPath(cx, cy, R * 0.82 * scale, 1);
    ctx.fillStyle = '#f2f8fa';
    ctx.fill();

    // The 1981-2010 median edge: fixed shape, fixed place, always magenta.
    ctx.beginPath();
    blobPath(cx, cy, R * 0.82, 1);
    ctx.strokeStyle = '#e6007e';
    ctx.lineWidth = Math.max(1.2, w * 0.005);
    ctx.stroke();

    ctx.restore();
  }

  function voiceCount(frame) {
    var f = clamp((Number(frame && frame.iceFrac) || 0) / maxIce, 0, 1);
    var n = Math.ceil(f * 6);
    return Math.max(1, Math.min(6, n));
  }

  function railAlpha(t, act) {
    if (act >= 5) return 1 - smooth01((t - 0.934) / 0.05);
    if (act === 3) return 0.42;
    return 1;
  }

  function drawRail(t, act, frame) {
    var a = railAlpha(t, act);
    if (a <= 0.02 || quality < 2 || layout.noRail) return;

    var x0 = plate.x;
    var x1 = plate.x + plate.w;
    var y = plate.y + plate.h + 56;

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(232,241,245,' + (0.14 * a).toFixed(3) + ')';
    ctx.beginPath();
    ctx.moveTo(x0, y + 0.5);
    ctx.lineTo(x1, y + 0.5);
    ctx.stroke();

    var tx = x0 + (x1 - x0) * clamp(t, 0, 1);
    ctx.strokeStyle = 'rgba(95,184,212,' + (0.6 * a).toFixed(3) + ')';
    ctx.beginPath();
    ctx.moveTo(x0, y + 0.5);
    ctx.lineTo(tx, y + 0.5);
    ctx.stroke();

    var amp = Number(frame && frame.sigma) < -1.9;
    ctx.fillStyle = amp
      ? 'rgba(217,154,58,' + (0.95 * a).toFixed(3) + ')'
      : 'rgba(232,241,245,' + (0.92 * a).toFixed(3) + ')';
    ctx.fillRect(Math.round(tx) - 1, y - 3, 2, 7);

    // Six voices as a small staff. It encodes the chord, not decoration.
    var n = voiceCount(frame);
    var by = y - 26;
    var step = plate.w < 260 ? 8 : 10;

    ctx.beginPath();
    for (var i = 0; i < n; i++) ctx.rect(x0 + i * step, by, 2, 11);
    ctx.fillStyle = 'rgba(232,241,245,' + (0.85 * a).toFixed(3) + ')';
    ctx.fill();

    if (n < 6) {
      ctx.beginPath();
      for (var j = n; j < 6; j++) ctx.rect(x0 + j * step, by + 4, 2, 7);
      ctx.fillStyle = 'rgba(232,241,245,' + (0.17 * a).toFixed(3) + ')';
      ctx.fill();
    }
  }

  function setAnomaly(on) {
    if (anomaly === on) return;
    anomaly = on;
    if (document.body) {
      if (on) document.body.setAttribute('data-anomaly', '1');
      else document.body.removeAttribute('data-anomaly');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Draw                                                               */
  /* ------------------------------------------------------------------ */

  function paint(frame, t, act) {
    var started = now();

    readFrames();
    if (frames.length) syncWindow(nearestIndex(t));

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, -box.x * dpr, -box.y * dpr);

    var loc = frames.length ? locate(t) : null;
    var aName = loc && frames[loc.a] ? frames[loc.a].img : null;
    var bName = loc && frames[loc.b] ? frames[loc.b].img : null;
    var ea = aName ? cache[aName] : null;
    var eb = bName ? cache[bName] : null;

    var drewImage = false;

    if (loc && quality >= 2 && !fastScroll && loc.a !== loc.b && (loc.k > 0.62)) {
      // Two draws maximum: the outgoing map, then the incoming one.
      var fade = smooth01((loc.k - 0.62) / 0.38);
      if (ea && ea.ready) {
        ctx.globalAlpha = 1;
        ctx.drawImage(ea.img, plate.x, plate.y, plate.w, plate.h);
        drewImage = true;
        drawnImage = ea.img;
        drawnName = aName;
      }
      if (eb && eb.ready) {
        ctx.globalAlpha = fade;
        ctx.drawImage(eb.img, plate.x, plate.y, plate.w, plate.h);
        ctx.globalAlpha = 1;
        drewImage = true;
        drawnImage = eb.img;
        drawnName = bName;
      }
    } else {
      var chosen = null;
      var chosenName = null;
      if (eb && eb.ready) { chosen = eb; chosenName = bName; }
      else if (ea && ea.ready) { chosen = ea; chosenName = aName; }
      else if (drawnImage) { chosen = { img: drawnImage }; chosenName = drawnName; }

      if (chosen) {
        ctx.globalAlpha = 1;
        ctx.drawImage(chosen.img, plate.x, plate.y, plate.w, plate.h);
        drewImage = true;
        drawnImage = chosen.img;
        drawnName = chosenName || drawnName;
      }
    }

    if (!drewImage) {
      // A lite build has no maps by design; a build that is merely still
      // loading waits for the probe instead of flashing a fake plate.
      if (probeState === -1 || (startedAt && now() - startedAt > 1200)) {
        fallbackPlate(frame.iceFrac, t);
      }
    }

    // Hairline mount, outside the image so the median edge is untouched.
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(232,241,245,0.16)';
    ctx.strokeRect(plate.x + 0.5, plate.y + 0.5, plate.w - 1, plate.h - 1);

    setAnomaly(Number(frame.sigma) < -1.9 && Math.round(Number(frame.year)) === 2012);
    drawRail(t, act, frame);

    var cost = now() - started;
    monitor(cost);
  }

  function monitor(cost) {
    if (quality <= -1) return;
    if (cost > 22) slowMs += Math.max(8, cost);
    else slowMs = Math.max(0, slowMs - 7);

    if (slowMs > 2000) {
      slowMs = 0;
      quality -= 1;
      if (quality < -1) quality = -1;
      resize();
      markDirty();
    }
  }

  function draw(frame, t, act) {
    if (reduced) return;
    if (!canvas) init(document.getElementById('canvas'));
    if (!ctx || !canvas) return;
    if (document.hidden) return;

    t = clamp(t, 0, 1);
    act = Math.round(clamp(act, 0, 5));
    if (!frame) frame = EJ.frameAt ? EJ.frameAt(t) : { iceFrac: 0.14, sigma: 0, year: 1979 };

    showAct(act);

    var speed = lastT < 0 ? 1 : Math.abs(t - lastT);
    lastT = t;
    fastScroll = speed > 0.004;

    var k = 'w' + cssW + 'h' + cssH + 'd' + dpr + 'q' + quality +
      't' + t.toFixed(4) + 'a' + act + 'v' + imageVersion +
      'i' + (frame.img || '') + 's' + (speed > 0.004 ? 1 : 0);

    if (k === lastKey) return;
    lastKey = k;

    try {
      paint(frame, t, act);
    } catch (err) {
      if (!EJ.degraded || !EJ.degraded['render']) EJ.fail('render', err);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Contract surface                                                   */
  /* ------------------------------------------------------------------ */

  function showAct(n) {
    n = Math.round(Number(n));
    if (!isFinite(n)) n = 0;
    n = Math.max(0, Math.min(5, n));
    if (n === shownAct) return;
    shownAct = n;

    if (document.body) document.body.setAttribute('data-act', String(n));
    for (var i = 0; i < 6; i++) {
      var s = document.getElementById('act-' + i);
      if (s && s.classList) s.classList.toggle('is-active', i === n);
    }
  }

  function setReducedMotion(on) {
    reduced = !!on;
    if (reduced) {
      if (canvas && ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      resize();
      markDirty();
    }
  }

  function init(el) {
    var node = el || document.getElementById('canvas');
    if (!node) return;
    if (canvas !== node) {
      canvas = node;
      canvas.style.position = 'absolute';
      canvas.style.display = 'block';
      ctx = null;
      try {
        ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
      } catch (e) {
        ctx = null;
      }
      shownAct = -1;
    }
    try { liteBuild = /-lite(\.html)?$/i.test(location.pathname || ''); } catch (e) {}
    if (!startedAt) startedAt = now();
    if (window.EJ_IMAGES) probeState = 1;
    else if (liteBuild) probeState = -1;

    readFrames();
    if (frames.length) probeName = frames[0].img || null;
    resize();
    if (!ctx) return;

    if (!wired) {
      wired = true;
      window.addEventListener('resize', function () { resize(); }, { passive: true });
      window.addEventListener('orientationchange', function () { resize(); }, { passive: true });
      EJ.on('ready', function () {
        var had = frames.length;
        frames = [];
        readFrames();
        if (!had && frames.length && !probeName) probeName = frames[0].img || null;
        markDirty();
      });
    }

    markDirty();
  }

  function fillCredits() {
    // Provisional: nobody else owns #credits text and 03's copy has no slot
    // for it. Only fills when empty, so a later injector always wins.
    try {
      var el = document.getElementById('credits');
      if (!el || (el.textContent && el.textContent.trim())) return;
      el.textContent = 'Maps: NSIDC Sea Ice Index v4 (G02135), National Snow and Ice Data Center, University of Colorado Boulder. Visual reference: NASA SVS 5677, NASA Scientific Visualization Studio.';
    } catch (e) {}
  }

  EJ.render = {
    init: init,
    draw: draw,
    setReducedMotion: setReducedMotion,
    showAct: showAct
  };

  /* Self-init covers the http path, where loader init may lag the first rAF. */
  function boot() {
    init(document.getElementById('canvas'));
    fillCredits();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
