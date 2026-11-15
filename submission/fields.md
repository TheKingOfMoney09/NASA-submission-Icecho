# Submission — the seven fields

> **Working build pending refreeze:** The current `dist/TheLastNote.html` includes the chord-responsive background and is 3,523,341 B, SHA-256 `B75859E2DC70A8444FAA84065CC98413D2F9034BB5BECDE9B069A053FC131CB4`; its smoke suite passes 39 checks. The `freeze-build` references and artifact details below describe the earlier tagged build, not this working version. Update the freeze references before submission.

Working file for the NASA Space Apps 2026 submission form. **Compose here, paste into the browser. Never compose in the form.**

Project: **Icecho** · Piece: ***The Last Note*** · Challenge: **The Earth Information Jukebox**

## Status

| # | Field | Status | Blocker / note |
|---|---|---|---|
| 1 | Summary | **READY** | — |
| 2 | Project Demonstration | **BLOCKED** | Video not recorded. Replace the TBD with the unlisted YouTube URL. |
| 3 | Project | **READY** | Repo is public (checked logged out, 14 Nov 2026). |
| 4 | Project Details | **READY — verified against freeze-build** | Checked against code commit `ea4ff85`, tag `freeze-build`. |
| 5 | Use of Artificial Intelligence (AI) | **READY** | — |
| 6 | NASA Data | **READY** | All links checked 14 Nov 2026. |
| 7 | Space Agency Partner & Other Data | **READY** | "None beyond the NASA Data sources" is the answer. |

All links in this file were checked on **14 November 2026** with `Invoke-WebRequest -Method Head`. Re-check in an incognito window before submitting.

> **Artifact gate — PASSED, 15 Nov 2026.** Freeze artifact built from code commit **`ea4ff85`**, tag **`freeze-build`**. `dist/TheLastNote.html` is **3,521,742 B** with all eight modules inlined, **6** `createOscillator`, **4** `createBiquadFilter`, **3** `drawImage`, 48 base64 WebP maps, SHA-256 `248F2CF30114E584B7AB813333B8AF9A96317EC2166684551EFBD103A980C969`. The build is strict: `build/build.py` refuses to emit `dist/` if a module is missing. Headless suite: **37 checks, 37 passed, 0 failed, 0 skipped** — including the coda (four data voices hold, thin to one sounding voice, decay to silence, and restore when the timeline is moved back). The earlier stub is gone. Pressing **Play the last note** swells the chord from silence over **1.4 s** on a smoothstep master curve instead of a 150 ms step; resume after pause keeps the short 150 ms fade.

> **Coda — resolved 15 Nov 2026.** `audio.js` now implements the gesture the copy promises: at the end of the measured timeline the 2026 chord holds for 2.2 s, thins to one voice, and decays over 6 s. The data count stays at four; the sounding count drops to one. The screen labels it **CODA · COMPOSITION, NOT DATA**, and scrolling back cancels it and restores the measured chord. Verified in the app and in the built file by the smoke suite.
>
> **SVS credit — resolved 15 Nov 2026.** Footer, Act V and the canvas fallback now say **"Visual reference: NASA SVS 5677"**, not "Hero still". No SVS bitmap is embedded: the 48 images are NSIDC G02135 maps, and the Act 0 plate is the 1979 map.

---

## FIELD 1 — Summary

*Paste this paragraph exactly.*

Icecho is an audio-first sonification of the Arctic sea ice record: 48 NSIDC September maps, 1979 to 2026, each played as a chord whose note count comes from how much ice is in the frame. It is built for blind and low-vision listeners first, then for classrooms, museums and anyone who cannot read a dashboard — the same 48-year record, through the ear. The measured chord never fades to one note: 1979 is six voices, 2026 is four, and 2012 — the record low — is three. Then a closing coda, labelled on screen as composition, not data, leaves one voice alone to decay.

---

## FIELD 2 — Project Demonstration

> **TBD — DO NOT PASTE THE WORD TBD.**
> Record the 90-second demo, upload it to YouTube as **Unlisted** (not Private), check it plays in an incognito window, then paste the URL here.

**URL:** `TBD`

Ninety seconds, captions burned in. The audio is the app's own, captured live from the running page — no music bed, no dubbing. It shows 1979 → 2026, the chord thinning, the 2012 dip, the handover, and the closing coda: one voice decaying under the label **CODA · COMPOSITION, NOT DATA**.

---

## FIELD 3 — Project

*Paste the URL and the run line.*

**https://github.com/TheKingOfMoney09/NASA-submission-Icecho**

Open `dist/TheLastNote.html` in a browser. No install, no server, no network, no build step. Click **Play the last note**.

---

## FIELD 4 — Project Details

*Paste the whole section below. If the form strips Markdown tables, the bullet list under "What you are hearing" carries the same information.*

**What it is**

Icecho is a scroll-driven story that plays the Arctic sea ice record as music. It uses 48 September maps from the NSIDC Sea Ice Index v4 (G02135), one per year, 1979–2026. Each map is reduced to six measured features — ice fraction, centroid, spread, edge raggedness, luminance and year-over-year loss — plus a seventh, deviation from the series mean. The measured NSIDC daily minimum carried on each frame (`extentMkm2`) decides how many voices sound; the map features drive pitch, width, detune, noise, brightness and mode. Nothing is pre-rendered: every chord is synthesised in the browser from the frame data, so scrubbing to any year produces that year's chord. The piece is called *The Last Note*. It is not a dashboard with a sound toggle; the music is the primary format.

**Why a chord, not a beep**

A single number mapped to a single beep fails because the ear cannot hold a sliding tone in memory. A chord is a multivariate container: six notes carry several values at once, and the ear parses and remembers it. You cannot look at a 1979 graph and a 2026 graph and feel the difference; you can hear two chords and feel that one is emptier. Music compresses 48 years without destroying the shape of the change. A graph describes the change; the piece performs it.

**The acts**

- **0 — Cold open (~10 s).** A full-screen cover: the title, 47 Septembers and 1979–2026 in the corners, and one CTA ring — blue around a fixed pink median circle. Click **Play the last note** (unlocks audio); the cover dissolves into the 1979 chord, six voices, held. "In 1979, the Arctic was loud."
- **I — Why (~25 s).** Scroll drives 1979 → 2026. The chord loses voices; the ice pulls inside the 1981–2010 median line that never moves. No charts, no extent figures — just the year and the map.
- **II — How (~25 s).** Rewind. One map → seven extracted values → six voices. The mapping is revealed as a mechanism, not a mood.
- **III — Human (~30 s).** Second person: the listener who has never seen a satellite image.
- **IV — Handover (~10 s).** "Now play it yourself." The story hands over to the instrument: scrub any year, or use the arrow keys; the copy suggests 1995, 2012 and 2026.
- **V — Last note (~8 s + 8 s coda).** Four voices hold at 2026; a labelled coda then leaves one voice to decay. Credits and sources.

Scroll sets the pace in guided mode; listen-only plays the whole piece in about two minutes.

**What you are hearing**

| Data feature | Becomes | Why it reads |
|---|---|---|
| `extentMkm2` — measured NSIDC daily minimum carried on the frame (annual minimum, Aug–Oct; the map's ice fraction tracks it) | how many voices sound (6 in 1979 → 4 in 2026, 3 in 2012) | Direct: less ice, fewer notes |
| `centroidY` — where the ice sits vertically | root pitch — north maps higher | Intuitive spatial metaphor |
| `spread` — vertical spread of the ice | octave spread of the chord | Wider ice = wider chord |
| `dLoss` — ice lost since the previous year | detune on the top voice, 0 → −70 cents | Instability you can hear |
| `edge` — how ragged the ice edge is | noise layer amplitude | Crumbling coastline texture |
| `lum` — mean brightness of the crop | lowpass cutoff, 400 Hz → 6 kHz | Bright ice vs dark water |
| `sigma` — deviation from the series mean | mode flip major ↔ minor + a 55 Hz pulse | "Something is wrong" |

The extracted `iceFrac` is the validation variable: it correlates with `extentMkm2` at r = 0.9934 and supplies the year-over-year loss and the deviation-from-mean terms. The voice count uses the measured extent directly.

If the form strips the table, use these lines:

- `extentMkm2` (measured NSIDC daily minimum carried on the frame) → how many voices sound (6 in 1979 → 4 in 2026, 3 in 2012)
- `centroidY` (where the ice sits vertically) → root pitch, north maps higher
- `spread` (vertical spread of the ice) → octave spread of the chord
- `dLoss` (ice lost since the previous year) → detune on the top voice, 0 → −70 cents
- `edge` (how ragged the ice edge is) → noise layer amplitude
- `lum` (mean brightness of the crop) → lowpass cutoff, 400 Hz → 6 kHz
- `sigma` (deviation from the series mean) → mode flip major ↔ minor + a 55 Hz pulse

The measured chord does not fade to one note. 2026 has four. The coda that follows is a labelled composition: one voice, decaying to silence. The voice count is computed from the frame, not typed in per year: `min(6, ceil(6 × extentMkm2 / 6.90))`. The anchor years are 1979 six, 1999 five, 2007 four, 2012 three, 2026 four. It is a stagger, not a fade.

**The honest part**

2026 is about 66% of 1979 — two-thirds, not one-sixth. The measured chord loses a voice, gets one back, loses two. The early chord is pinned at the six-voice ceiling: nine years between 1979 and 1998 actually held more ice than 1979, so the opening is full, not declining. The closing coda, one voice decaying, is labelled as composition, not data; the data stays true.

**Accessibility, built in**

Accessibility is structural, not a mode added at the end.

- Native scroll only. No scroll-jacking, no wheel capture. The page scrolls the way the browser scrolls; Page Down, Page Up and the scrollbar work.
- `prefers-reduced-motion: reduce` collapses the story to a linear document: no parallax, no pinned sections, no auto-advance; each act gets a play button, and Act V plays the labelled coda.
- `?mode=listen` plays the whole story as audio with on-screen narration; the story advances on a timer, so no scrolling is needed. One tap starts it.
- Keyboard: Space play/pause, ←/→ one year, Home/End first/last; visible focus; a skip link to the story.
- Screen readers: a real heading per act, a written transcript of what the audio is doing, an `aria-live="polite"` readout of the current year and ice value, and alt text on the canvas.
- Text sits on scrims, never directly on busy imagery.
- The begin gate is a real button: Enter and Space work natively, and the first gesture unlocks audio.

**One file, offline**

`dist/TheLastNote.html` is the submission: **3.51 MB** (3,521,742 B), with CSS, JavaScript, `frames.json` and all 48 map crops inlined. There are no libraries, no web fonts and no external requests. Opened from disk — the intended use — the file makes no network request at all. `dist/TheLastNote-lite.html` is the same story without the inlined maps (**133 KB**) as a fallback.

It boots on `DOMContentLoaded`; the copy is injected before the scroll controller attaches, so the timeline measures the finished document. The audio context is created only from a user gesture — **Play the last note**, or a Play button in reduced mode — which is what browser autoplay rules require.

The build is strict: `build/build.py` refuses to write `dist/` if any module in `JS_ORDER` is missing. This is code commit `ea4ff85`, tag `freeze-build`; two rebuilds are byte-identical (SHA-256 `248F2CF30114E584B7AB813333B8AF9A96317EC2166684551EFBD103A980C969`).

**How to run**

Download the repository, open `dist/TheLastNote.html`, click **Play the last note**. That is the whole procedure. For hands-free, add `?mode=listen` to the address.

**What is next**

More Earth records in the same instrument — other datasets with real visualisations (air quality, sea level, wildfires), a curated album of NASA records, a classroom kit, and an audio export for podcasts. The mapping is not tied to this one record; the hard part is choosing the next record honestly.

**Limits**

48 annual snapshots, not a daily series. The voice count is a sonification mapping, not a physical measurement. 2026 is not a record low; 2012 is. Accessibility is architectural and checked with keyboard and screen-reader structure; it has not been the subject of a formal user study. It is a complement to the charts, not a replacement.

**Proof**

Extracted ice fraction vs NSIDC daily minima: Pearson **r = 0.9935**, **n = 48**, **RMSE = 0.13 M km²**, max residual **0.36 M km²** (the 14 Nov re-run gives 0.9934; the 0.0001 gap is float rounding, not a different mask). Full table in `app/data/validation.md`.

---

## FIELD 5 — Use of Artificial Intelligence (AI)

*Paste the paragraph and the table.*

This project was developed with AI-assisted tooling (OpenCode) for code scaffolding, debugging, research and the drafting of documentation. The concept, the sonification mapping and the act structure were authored and decided by the entrant; the data source and validation criteria were chosen by the entrant, and the extraction and correlation were run with AI-assisted tooling and checked against the published NSIDC files. No AI model runs inside the delivered application: all audio is synthesised procedurally in the browser with the Web Audio API from NASA-derived feature data, and the delivered file makes no external network calls. The submission text was drafted with AI assistance and reviewed by the entrant before submission. AI assistance is disclosed here in full.

| Work | Who |
|---|---|
| Concept, title, act structure | Entrant |
| Sonification mapping and voice-count rule | Entrant |
| Data source choice and validation criteria | Entrant |
| Feature extraction, app code, debugging | AI-assisted (OpenCode) |
| Validation run and numbers | AI-assisted, checked against NSIDC files by the entrant |
| Documentation and submission text | AI-assisted draft, reviewed by the entrant |
| Runtime AI | None — no model, no API call, no network |

---

## FIELD 6 — NASA Data

*Paste the whole section. Every URL below was checked on 14 November 2026.*

**Primary source — NSIDC Sea Ice Index v4 (G02135), September extent, 1979–2026.** The maps are the visual frames and the source pixels for the sonification features; the numbers are the annual daily minimum from the same product. Accessed 13 November 2026.

- The 48 maps — one per year, 1461×1740 PNG, September:
  `https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/images/09_Sep/N_{YEAR}09_extn_hires_v4.0.png`
  Examples: https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/images/09_Sep/N_197909_extn_hires_v4.0.png and https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/images/09_Sep/N_202609_extn_hires_v4.0.png
- Monthly September extent CSV (September average extent and area):
  https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/data/N_09_extent_v4.0.csv
- Daily extent CSV (annual minimum):
  https://noaadata.apps.nsidc.org/NOAA/G02135/north/daily/data/N_seaice_extent_daily_v4.0.csv
- Dataset landing page:
  https://nsidc.org/data/g02135/versions/4

Citation: Fetterer, F., Knowles, K., Meier, W. N., Savoie, M., Windnagel, A. K. & Stafford, T. (2025). *Sea Ice Index*. (G02135, Version 4). [Data Set]. Boulder, Colorado USA. National Snow and Ice Data Center. https://doi.org/10.7265/a98x-0f50. [September 1979–2026 extent maps; daily extent 1978–2026]. Accessed 13 November 2026.

**Visual reference — NASA SVS 5677, "Arctic Sea Ice Minimum 2026"** (Trent L. Schindler, NASA's Scientific Visualization Studio), 3840×2160. The app's closing credits name this visualisation. No SVS bitmap is embedded in the delivered file: all 48 images it carries are NSIDC G02135 September maps, and the Act 0 plate is the 1979 map.

- https://svs.gsfc.nasa.gov/5677/
- https://svs.gsfc.nasa.gov/vis/a000000/a005600/a005677/arctic_sea_ice_min_2026.still.png

**Numbers used (daily minimum, v4 daily file):** 1979 — 6.90 M km² (21 Sep); 1999 — 5.68 M km² (12 Sep); 2012 — 3.34 M km² (16 Sep, the record low in this file); 2026 — 4.57 M km² (12 Sep).

2026 is about 66% of 1979 — two-thirds, not one-sixth. It is not a record: 2012 remains the lowest in the file, and 2026 sits within 0.05 M km² of 2008, 2010 and 2025.

**Validation.** The extracted ice fraction was correlated against the NSIDC daily minima: Pearson **r = 0.9935**, **n = 48**, **RMSE = 0.13 M km²**, max residual **0.36 M km²** (the 14 Nov re-run gives 0.9934; the 0.0001 gap is float rounding, not a different mask). The residual pattern follows the polar stereographic projection, which stretches lower latitudes, so ice fraction is not perfectly linear in extent. The full year-by-year table and residuals are in `app/data/validation.md`.

**Two files, two kinds of number.** The maps are September monthly composites; the figures on screen are the annual daily minimum from the daily file. Both come from the same NSIDC v4 product, and validation compares them rather than assuming they are identical.

**No EIC visualisation is used or claimed.** NASA's Earth Information Center (EIC) publishes visualisations across nine themes — Agriculture, Air Quality, Biodiversity, Disasters, Energy, Greenhouse Gases, Sea Level Change, Water Resources, Wildfires — and none is sea ice or cryosphere. The frames in this project are NSIDC G02135 v4 maps; the app also credits NASA SVS 5677 as a visual reference, and no SVS image is embedded. Nothing here is an earth.gov or EIC product.

---

## FIELD 7 — Space Agency Partner & Other Data

*Paste this paragraph.*

**None beyond the sources in the NASA Data field.** No separate space agency partner data; no other third-party data. The application has no runtime dependencies and, opened from disk, makes no network requests.

---

# Pre-submit checklist

Do this on **Sunday 15 November**, starting at **17:00 RO** — not at 18:50. Submit at **18:00 RO**. Deadline is 19:00.

## 1. The form itself

- [ ] All seven fields pasted from this file. No `TODO`, no `TBD`, no placeholder left.
- [ ] Field 2 has the real unlisted YouTube URL, not the word TBD.
- [ ] Field 3 has `https://github.com/TheKingOfMoney09/NASA-submission-Icecho`.
- [ ] Field 6 has the NSIDC map pattern, the 1979 and 2026 examples, both CSVs and the SVS 5677 link.
- [ ] Field 5 contains the AI disclosure and the who-did-what table.
- [ ] Field 7 says **None beyond the sources in the NASA Data field** (not blank, not "NASA").
- [ ] Team page shows **Icecho** / Romascu David-Stefan and the challenge **The Earth Information Jukebox**.
- [ ] Nothing in any field claims an EIC or earth.gov sea-ice visualisation.

## 2. Links — incognito, logged out

Open a private/incognito window. Do not rely on your logged-in session.

| Link | Expected |
|---|---|
| https://github.com/TheKingOfMoney09/NASA-submission-Icecho | Repo page loads, public, no login |
| YouTube demo URL | Player loads, **Unlisted**, captions visible with sound off |
| https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/images/09_Sep/N_197909_extn_hires_v4.0.png | PNG opens |
| https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/images/09_Sep/N_202609_extn_hires_v4.0.png | PNG opens |
| https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/data/N_09_extent_v4.0.csv | CSV downloads/opens |
| https://noaadata.apps.nsidc.org/NOAA/G02135/north/daily/data/N_seaice_extent_daily_v4.0.csv | CSV downloads/opens |
| https://svs.gsfc.nasa.gov/5677/ | SVS page loads |
| https://svs.gsfc.nasa.gov/vis/a000000/a005600/a005677/arctic_sea_ice_min_2026.still.png | 3840×2160 PNG opens |
| https://nsidc.org/data/g02135/versions/4 | Dataset page loads |
| https://doi.org/10.7265/a98x-0f50 | Resolves to the NSIDC dataset |

Quick availability check (does not test public visibility — do the incognito pass by hand):

```powershell
$urls = @(
  'https://github.com/TheKingOfMoney09/NASA-submission-Icecho',
  'https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/images/09_Sep/N_197909_extn_hires_v4.0.png',
  'https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/images/09_Sep/N_202609_extn_hires_v4.0.png',
  'https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/data/N_09_extent_v4.0.csv',
  'https://noaadata.apps.nsidc.org/NOAA/G02135/north/daily/data/N_seaice_extent_daily_v4.0.csv',
  'https://svs.gsfc.nasa.gov/5677/',
  'https://svs.gsfc.nasa.gov/vis/a000000/a005600/a005677/arctic_sea_ice_min_2026.still.png',
  'https://nsidc.org/data/g02135/versions/4',
  'https://doi.org/10.7265/a98x-0f50'
)
foreach ($u in $urls) {
  try {
    $r = Invoke-WebRequest -Uri $u -Method Head -TimeoutSec 30 -UseBasicParsing
    '{0}  {1}' -f $r.StatusCode, $u
  } catch {
    'ERR  {0}  {1}' -f $_.Exception.Message, $u
  }
}
```

## 3. The app — clean-machine test

> **Artifact gate — PASSED, 15 Nov 2026.** Code commit **`ea4ff85`**, tag **`freeze-build`**. `dist/TheLastNote.html` is **3,521,742 B** with all eight modules inlined, **3** `drawImage`, **6** `createOscillator`, **4** `createBiquadFilter` and **48** base64 WebP maps; SHA-256 `248F2CF30114E584B7AB813333B8AF9A96317EC2166684551EFBD103A980C969`.
>
> ```powershell
> $h = Get-Content dist/TheLastNote.html -Raw
> [regex]::Matches($h,'drawImage').Count
> [regex]::Matches($h,'createOscillator').Count
> [regex]::Matches($h,'createBiquadFilter').Count
> ```
>
> Expected: **3 / 6 / 4**. The build is strict now: `build/build.py` exits instead of shipping a stub, so a missing module cannot reach `dist/`. `node app/tests/smoke.mjs` runs **37** headless checks: **37 passed, 0 failed, 0 skipped** — including 6/3/4 voices at 1979/2012/2026, the coda thinning to one sounding voice and decaying to silence, the measured chord restoring when the timeline moves back, and a reload that starts at 1979 instead of resuming the browser's restored scroll position. The old `--allow-missing` stub is gone; do not rebuild over the freeze file with it.
>
> Human check, which no grep replaces: you must **see** the September map (white ice, magenta median line) and **hear** six, three and four sustained voices at 1979, 2012 and 2026 — not one tone sliding upward.

- [ ] Download the repo as a **ZIP** (not a folder you already have).
- [ ] Extract it to an empty folder.
- [ ] Confirm the freeze build: `freeze-build` / `ea4ff85`; `dist/TheLastNote.html` is **3,521,742 B** and its SHA-256 starts `248F2CF3`.
- [ ] Turn off Wi-Fi.
- [ ] Open `dist/TheLastNote.html` in Edge. Click **Play the last note**. Audio starts.
- [ ] Open it in Chrome. Same result.
- [ ] The map plate shows the September map (white ice, magenta median line), not a flat colour.
- [ ] 1979 is **six** voices; 2012 is **three**; 2026 is **four**.
- [ ] At the end, the four-voice chord holds, then **one voice** decays to silence; the label **CODA · COMPOSITION, NOT DATA** is visible. Scrolling back brings the chord back.
- [ ] Scroll 1979 → 2026: the chord steps down, partly returns, then steps down again. 48 years, no placeholder text, no fallback curve.
- [ ] The coda is labelled on screen: **CODA · COMPOSITION, NOT DATA**.
- [ ] The page shows no console errors (F12 → Console).
- [ ] DevTools → Network: no external requests. The page is the file.
- [ ] Keyboard-only pass: Tab to **Play the last note**, Enter, Space play/pause, ←/→ one year, Home/End first/last.
- [ ] `?mode=listen`: one tap starts it, it runs hands-free, narration is visible.
- [ ] Reduced motion: enable the OS "reduce motion" setting (or `?mode=reduced`); the story becomes a linear document with a play button per act.
- [ ] Screen reader spot-check: headings per act, a transcript for each act, the live region announces year and ice value.
- [ ] `dist/TheLastNote-lite.html` also opens and plays; it is **135,979 B (133 KB)**.
- [ ] `dist/TheLastNote.html` is **3.51 MB** — well under 6 MB.

## 4. Claims and numbers — the honesty pass

- [ ] 1979 = **6.90 M km²**, 2012 = **3.34 M km²**, 2026 = **4.57 M km²**.
- [ ] 2026 is **not** described as a record low. 2012 is.
- [ ] The headline values **3.39** (2012) and **4.60** (2026) do not appear. They are announcement-time values, not the v4 file.
- [ ] `r = 0.9935` is described as a **correlation**, never as "99.35% accurate".
- [ ] The 0.9934 in `validation.md` is covered by the parenthetical, not hidden or edited out.
- [ ] `n = 48`, `RMSE = 0.13 M km²`, max residual `0.36 M km²` — unchanged.
- [ ] The measured chord is described as thinning to **four**, with a 2012 dip to **three**. No "one note" data claim.
- [ ] The closing coda is labelled **composition, not data**; the data chord stays at four, and the one-voice decay is described only as the labelled coda.
- [ ] No EIC / earth.gov visualisation claim anywhere.
- [ ] No invented person, quote, community testimonial or user study.
- [ ] No claim that blind participants tested the app.
- [ ] AI use is disclosed in field 5, in the README, and in the video's YouTube description.

## 5. The video

- [ ] Duration ≤ **90.0 s** (`ffprobe`).
- [ ] File ≤ **40 MB**.
- [ ] 1920×1080, H.264, AAC.
- [ ] Recorded from the freeze build (`freeze-build` / `62c6f72`), not from a stale dist.
- [ ] On screen: **six** voices at 1979, **three** at 2012, **four** at 2026, then one voice decaying in the labelled coda; the **CODA · COMPOSITION, NOT DATA** label is legible.
- [ ] Audio is the **real app**, captured live; no music bed, no whooshes, no dubbing.
- [ ] Captions are burned in; play it muted and read every line.
- [ ] Visibility is **Unlisted**, not Private.
- [ ] It plays in an incognito window, logged out.
- [ ] Title and description include the repo link and the NSIDC / NASA SVS credit.

## 6. Submit

- [ ] Submit at **18:00 RO**. Deadline is 19:00; do not use the last hour.
- [ ] Screenshot the confirmation page.
- [ ] Open the public project page in incognito and confirm all seven fields are visible.
- [ ] Keep the app open and audio unlocked for the 20:00 judging session.

---

# Wording guard

| Do not write | Write instead | Why |
|---|---|---|
| "2026 was a record low" | "2012 was the record low; 2026 is 4.57 M km²" | False |
| "The chord fades to one note" | "The measured chord ends at four; the labelled coda then leaves one voice to decay" | Data vs composition |
| "EIC sea-ice visualisation" / "earth.gov sea ice" | "NSIDC G02135 v4 maps; no EIC sea-ice visualisation exists" | No such product |
| "99.35% accurate" | "correlates r = 0.9935 with the NSIDC daily minima" | Correlation is not accuracy |
| "Blind users tested it" | "Built audio-first for blind and low-vision listeners; keyboard and screen-reader structure verified" | No study was run |
| "NASA partner" | "Uses NASA SVS 5677 and the NSIDC G02135 v4 product" | No partner agreement |
| "3.39" / "4.60" | "3.34" / "4.57" (v4 daily file) | One source, one version |
| "The map's printed total is the number you hear" | "The maps are September monthly composites; the figures are annual daily minima from the daily file" | Two different published numbers |

If a sentence in this file cannot be verified against the freeze-build, delete the sentence. A smaller true thing beats a bigger broken one.
