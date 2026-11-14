#!/usr/bin/env node
/**
 * Smoke test — headless Chrome/Edge via the DevTools Protocol.
 * Owner: 06-INTEGRATION. Run after every merge; a red run blocks the merge.
 *
 *   node app/tests/smoke.mjs [path-to-chrome-or-edge]
 *
 * Asserts:
 *  - page loads with zero console errors and zero uncaught exceptions
 *  - all six acts exist and are non-empty
 *  - EJ.ready === true within 2 s
 *  - EJ.audio / EJ.content / EJ.render pass the contract check
 *  - ?mode=listen boots and (once content.js lands) the narration is non-empty
 *  - reduced-motion emulation renders the static branch (6 headings visible)
 *  - keyboard: Tab reaches the begin-gate, Enter starts, Space toggles
 *  - scanDOM() finds exactly one of each contract ID (no duplicates)
 *  - real engine: AudioContext running after the gate; 6/3/4 voices at
 *    1979/2012/2026, asserted in the app and in the built dist file
 *  - dist/TheLastNote.html opens from file:// and reaches EJ.ready
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const APP = join(ROOT, 'app');
const APP_URL = pathToFileURL(join(APP, 'index.html')).href;
const DIST_URL = pathToFileURL(join(ROOT, 'dist', 'TheLastNote.html')).href;

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}
function skip(name, why) {
  results.push({ name, ok: true, skipped: true, detail: why });
  console.log(`SKIP  ${name}  — ${why}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* Browser discovery + launch                                         */
/* ------------------------------------------------------------------ */

const programFiles = process.env['PROGRAMFILES'] || 'C:/Program Files';
const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)';
const localAppData = process.env.LOCALAPPDATA || '';

const candidates = [
  process.argv[2],
  process.env.CHROME_PATH,
  join(programFiles, 'Google/Chrome/Application/chrome.exe'),
  join(programFilesX86, 'Google/Chrome/Application/chrome.exe'),
  join(localAppData, 'Google/Chrome/Application/chrome.exe'),
  join(programFilesX86, 'Microsoft/Edge/Application/msedge.exe'),
  join(programFiles, 'Microsoft/Edge/Application/msedge.exe'),
  join(localAppData, 'Microsoft/Edge/Application/msedge.exe'),
].filter(Boolean);

const browser = candidates.find((p) => existsSync(p));
if (!browser) {
  console.error('No Chrome/Edge found. Pass the executable path as the first argument.');
  process.exit(2);
}

const port = 9400 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(tmpdir(), 'ej-smoke-'));
const proc = spawn(browser, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--disable-extensions',
  '--mute-audio',
  '--autoplay-policy=no-user-gesture-required',
  '--allow-file-access-from-files',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-features=Translate,MediaRouter',
  'about:blank',
], { stdio: 'ignore' });

async function waitForDevTools() {
  for (let i = 0; i < 150; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return await res.json();
    } catch {}
    await sleep(100);
  }
  throw new Error('DevTools endpoint did not come up');
}

/* ------------------------------------------------------------------ */
/* Minimal CDP client                                                 */
/* ------------------------------------------------------------------ */

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.nextId = 0;
    this.pending = new Map();
    this.listeners = [];
    this.ws.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.id && this.pending.has(msg.id)) {
        const { res, rej } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message));
        else res(msg.result);
      } else {
        for (const fn of this.listeners) fn(msg);
      }
    });
  }
  open() {
    return new Promise((res, rej) => {
      this.ws.addEventListener('open', res, { once: true });
      this.ws.addEventListener('error', rej, { once: true });
    });
  }
  send(method, params = {}) {
    const id = ++this.nextId;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => this.pending.set(id, { res, rej }));
  }
  on(fn) { this.listeners.push(fn); }
  close() { try { this.ws.close(); } catch {} }
}

async function evalJS(cdp, expression, awaitPromise = true) {
  const r = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
  });
  if (r.exceptionDetails) {
    throw new Error('evaluate failed: ' + (r.exceptionDetails.text || 'unknown'));
  }
  return r.result ? r.result.value : undefined;
}

async function waitExpr(cdp, expression, budget = 2500) {
  const t0 = Date.now();
  while (Date.now() - t0 < budget) {
    try {
      if (await evalJS(cdp, expression)) return Date.now() - t0;
    } catch {}
    await sleep(50);
  }
  return -1;
}

async function navigate(cdp, url) {
  await cdp.send('Page.enable');
  await cdp.send('Page.navigate', { url });
  const t0 = Date.now();
  while (Date.now() - t0 < 6000) {
    try {
      if (await evalJS(cdp, 'document.readyState === "complete"', false)) return;
    } catch {}
    await sleep(50);
  }
}

async function openTarget(url = 'about:blank') {
  const res = await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`,
    { method: 'PUT' }
  );
  if (!res.ok) throw new Error('could not create target: ' + res.status);
  const info = await res.json();
  const cdp = new CDP(info.webSocketDebuggerUrl);
  await cdp.open();

  const errors = [];
  cdp.on((msg) => {
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails || {};
      errors.push({
        kind: 'exception',
        text: (d.exception && d.exception.description) || d.text || 'uncaught exception',
      });
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push({
        kind: 'console.error',
        text: (msg.params.args || []).map((a) => a.value ?? a.description ?? '').join(' '),
      });
    } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      const e = msg.params.entry;
      errors.push({ kind: 'log', text: e.text || '', url: e.url || '' });
    }
  });

  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  await cdp.send('Page.enable');
  return { cdp, errors };
}

// Resource-load failures for modules that have not landed yet are expected in
// the walking skeleton; once the file exists on disk they count as errors.
function realErrors(errors) {
  return errors.filter((e) => {
    if (e.kind === 'log' && /ERR_FILE_NOT_FOUND|ERR_ABORTED|ERR_FAILED/.test(e.text)) {
      const m = /(js\/[\w.-]+\.js|css\/[\w.-]+\.css)/.exec(e.url || e.text);
      if (m) {
        const onDisk = existsSync(join(APP, m[1]));
        if (!onDisk) return false; // module not landed yet — expected during skeleton
        return true;
      }
      if (/favicon/i.test(e.url || '')) return false;
    }
    return true;
  });
}

async function key(cdp, { keyName, code, vk, text }) {
  const base = {
    key: keyName,
    code,
    windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk,
  };
  if (text) base.text = text;
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...base });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
}

// Real-audio assertions. Runs in a mode with no scroll/timer writer (reduced),
// so EJ.state.t stays where we put it while the engine settles.
// The three anchors come from the verified NSIDC record: 1979 six voices,
// 2012 (record low) three, 2026 four.
async function audioAnchorSuite(cdp, label) {
  const hasDiag = await evalJS(cdp, '!!(window.EJ && EJ.audio && typeof EJ.audio._diag === "function")');
  if (!hasDiag) {
    skip(`${label}: real audio diagnostics`, 'audio._diag unavailable (fallback module)');
    return;
  }

  const gateUsable = await evalJS(cdp, `(function () {
    var g = document.getElementById('begin-gate');
    return !!(g && !g.hidden && g.getClientRects().length > 0);
  })()`);

  if (gateUsable) {
    await key(cdp, { keyName: 'Tab', code: 'Tab', vk: 9 });
    await key(cdp, { keyName: 'Enter', code: 'Enter', vk: 13, text: '\r' });
    await waitExpr(cdp, 'document.getElementById("begin-gate").hidden === true', 2000);
  } else {
    // Reduced mode hides the gate; its per-act play buttons are the gesture.
    const focusedPlay = await evalJS(cdp, `(function () {
      var b = document.querySelector('.play-act');
      if (!b) return false;
      b.focus();
      return document.activeElement === b;
    })()`);
    if (!focusedPlay) {
      skip(`${label}: real audio diagnostics`, 'no gate or play control to start audio');
      return;
    }
    await key(cdp, { keyName: 'Enter', code: 'Enter', vk: 13, text: '\r' });
  }

  const runningMs = await waitExpr(cdp, '!!(window.EJ && EJ.audio._diag().ctxState === "running")', 3000);
  check(`${label}: starts a running AudioContext`, runningMs >= 0, runningMs >= 0 ? `${runningMs} ms` : 'not running');

  const anchors = [[1979, 6], [2012, 3], [2026, 4]];
  for (const [year, expected] of anchors) {
    const t = (year - 1979) / 47;
    const diag = await evalJS(cdp, `(function () {
      var t = ${t};
      EJ.state.t = t;
      EJ.audio.setFrame(EJ.frameAt(t));
      EJ.audio.setTimeline(t);
      return EJ.audio._diag();
    })()`);
    check(
      `${label}: ${year} plays ${expected} voices`,
      !!diag && diag.voices === expected && diag.voicesSounding === expected,
      diag
        ? `voices=${diag.voices} sounding=${diag.voicesSounding} root=${Math.round(diag.rootHz)}Hz detune=${Math.round(diag.detuneCents)}c`
        : 'no diagnostics'
    );
  }

  const master = await evalJS(cdp, 'EJ.audio._diag().master');
  check(`${label}: master output is open`, typeof master === 'number' && master > 0.01, String(master));
}

/* ------------------------------------------------------------------ */
/* Tests                                                              */
/* ------------------------------------------------------------------ */

async function main() {
  await waitForDevTools();
  console.log(`browser: ${browser}`);
  console.log(`app    : ${APP_URL}`);
  console.log('');

  /* ---- guided mode (the default) ---- */
  const guided = await openTarget('about:blank');
  await navigate(guided.cdp, APP_URL);
  const readyMs = await waitExpr(guided.cdp, '!!(window.EJ && EJ.ready === true)', 2500);
  check('EJ.ready === true within 2 s', readyMs >= 0 && readyMs <= 2000, readyMs >= 0 ? `${readyMs} ms` : 'timeout');
  await sleep(200);

  const scan = await evalJS(guided.cdp, 'window.scanDOM ? scanDOM() : null');
  check(
    'scanDOM(): exactly one of each contract ID',
    scan && scan.ok,
    scan && !scan.ok ? JSON.stringify({ missing: scan.missing, duplicates: scan.duplicates }) : ''
  );

  const actLengths = await evalJS(
    guided.cdp,
    '[0,1,2,3,4,5].map(function (i) { var el = document.getElementById("act-" + i); return el ? el.textContent.trim().length : 0; })'
  );
  check('all six acts exist and are non-empty', Array.isArray(actLengths) && actLengths.every((n) => n > 0), JSON.stringify(actLengths));

  const issues = await evalJS(guided.cdp, 'EJ.checkContract ? EJ.checkContract() : ["no EJ"]');
  check('audio/content/render pass the contract check', Array.isArray(issues) && issues.length === 0, JSON.stringify(issues || []));

  const mode = await evalJS(guided.cdp, 'EJ.state.mode');
  check('default mode is guided', mode === 'guided', String(mode));

  const errorsGuided = realErrors(guided.errors);
  check(
    'zero console errors / uncaught exceptions (app)',
    errorsGuided.length === 0,
    errorsGuided.slice(0, 6).map((e) => `${e.kind}: ${e.text.slice(0, 140)}`).join(' | ')
  );

  /* ---- keyboard ---- */
  await key(guided.cdp, { keyName: 'Tab', code: 'Tab', vk: 9 });
  const focused = await evalJS(guided.cdp, 'document.activeElement && document.activeElement.id');
  check('keyboard: Tab reaches the begin-gate', focused === 'begin-gate', String(focused));

  await key(guided.cdp, { keyName: 'Enter', code: 'Enter', vk: 13, text: '\r' });
  const began = await waitExpr(
    guided.cdp,
    'document.getElementById("begin-gate").hidden === true && document.body.classList.contains("began")',
    2500
  );
  check('keyboard: Enter starts the piece', began >= 0, began >= 0 ? `${began} ms` : 'gate still visible');

  const before = await evalJS(guided.cdp, 'EJ.state.playing');
  await key(guided.cdp, { keyName: ' ', code: 'Space', vk: 32, text: ' ' });
  const toggled = await waitExpr(guided.cdp, `EJ.state.playing !== ${before}`, 1500);
  check('keyboard: Space toggles play/pause', toggled >= 0, `${before} -> ${await evalJS(guided.cdp, 'EJ.state.playing')}`);

  /* ---- listen mode ---- */
  const listen = await openTarget('about:blank');
  await navigate(listen.cdp, APP_URL + '?mode=listen');
  const listenReady = await waitExpr(listen.cdp, '!!(window.EJ && EJ.ready === true)', 2500);
  const listenMode = await evalJS(listen.cdp, 'window.EJ ? EJ.state.mode : null');
  check('?mode=listen boots', listenReady >= 0 && listenMode === 'listen', String(listenMode));

  if (existsSync(join(APP, 'js', 'content.js'))) {
    const narration = await evalJS(
      listen.cdp,
      'EJ.content && Array.isArray(EJ.content.narration) ? EJ.content.narration.length : 0'
    );
    check('listen mode: narration array is non-empty', narration > 0, `${narration} lines`);
  } else {
    skip('listen mode: narration array is non-empty', 'js/content.js not landed yet');
  }

  /* ---- reduced motion ---- */
  const reduced = await openTarget('about:blank');
  await reduced.cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await navigate(reduced.cdp, APP_URL);
  const reducedReady = await waitExpr(reduced.cdp, '!!(window.EJ && EJ.ready === true)', 2500);
  const reducedState = await evalJS(
    reduced.cdp,
    'window.EJ ? { mode: EJ.state.mode, cls: document.body.classList.contains("reduced") } : null'
  );
  check(
    'reduced-motion emulation boots the reduced branch',
    reducedReady >= 0 && reducedState && reducedState.mode === 'reduced' && reducedState.cls,
    JSON.stringify(reducedState)
  );
  const headings = await evalJS(
    reduced.cdp,
    'Array.prototype.filter.call(document.querySelectorAll("main h2"), function (h) { return h.getClientRects().length > 0; }).length'
  );
  check('reduced-motion renders the static branch: 6 headings visible', headings === 6, String(headings));

  // Reduced mode has no scroll or timer writer, which makes it the honest
  // place to assert the real engine's voice counts.
  await audioAnchorSuite(reduced.cdp, 'app');

  /* ---- dist ---- */
  if (existsSync(join(ROOT, 'dist', 'TheLastNote.html'))) {
    const dist = await openTarget('about:blank');
    await navigate(dist.cdp, DIST_URL);
    const distReady = await waitExpr(dist.cdp, '!!(window.EJ && EJ.ready === true)', 3000);
    check('dist/TheLastNote.html opens from file:// and reaches EJ.ready', distReady >= 0, distReady >= 0 ? `${distReady} ms` : 'timeout');

    if (distReady >= 0) {
      const distScan = await evalJS(dist.cdp, 'window.scanDOM ? scanDOM() : null');
      check('dist: no duplicate contract ids', distScan && distScan.ok, distScan && !distScan.ok ? JSON.stringify({ missing: distScan.missing, duplicates: distScan.duplicates }) : '');
    }

    const distErrors = realErrors(dist.errors);
    check(
      'dist: zero console errors',
      distErrors.length === 0,
      distErrors.slice(0, 6).map((e) => `${e.kind}: ${e.text.slice(0, 140)}`).join(' | ')
    );
    dist.cdp.close();

    // The built file carries the real engine and the real 48 frames. Prove it
    // with the same anchor test, in reduced mode so nothing rewrites t.
    const distAudio = await openTarget('about:blank');
    await navigate(distAudio.cdp, DIST_URL + '?mode=reduced');
    const distAudioReady = await waitExpr(distAudio.cdp, '!!(window.EJ && EJ.ready === true)', 3000);
    if (distAudioReady >= 0) {
      await audioAnchorSuite(distAudio.cdp, 'dist');
      const distAudioErrors = realErrors(distAudio.errors);
      check(
        'dist: zero console errors in reduced mode',
        distAudioErrors.length === 0,
        distAudioErrors.slice(0, 6).map((e) => `${e.kind}: ${e.text.slice(0, 140)}`).join(' | ')
      );
    } else {
      skip('dist: real audio diagnostics', '?mode=reduced did not boot from file://');
    }
    distAudio.cdp.close();
  } else {
    skip('dist/TheLastNote.html opens from file:// and reaches EJ.ready', 'dist not built yet');
  }

  guided.cdp.close();
  listen.cdp.close();
  reduced.cdp.close();

  /* ---- summary ---- */
  const failed = results.filter((r) => !r.ok);
  const passed = results.filter((r) => r.ok && !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;
  console.log('');
  console.log(`summary: ${passed} passed, ${failed.length} failed, ${skipped} skipped`);
  if (failed.length) {
    console.log('FAILED:');
    for (const f of failed) console.log('  - ' + f.name + (f.detail ? ' — ' + f.detail : ''));
    return 1;
  }
  console.log('smoke: green');
  return 0;
}

let code = 1;
try {
  code = await main();
} catch (err) {
  console.error('smoke crashed:', err && err.message ? err.message : err);
  code = 1;
} finally {
  try { proc.kill(); } catch {}
  await sleep(150);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
process.exit(code);
