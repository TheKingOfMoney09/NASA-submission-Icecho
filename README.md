# Icecho — *The Last Note*

**48 Septembers of Arctic sea ice, played as music.** One map per year, 1979–2026. Each map becomes a chord; how much ice is left decides how many notes survive. 1979 is six voices. 2026 is four. 2012 was three.

**Open it:** download `dist/TheLastNote.html` and double-click it. No install, no build step to run it, no server, no network. Click **Begin**.

**90-second demo:** **TBD** — the unlisted video link is added here before submission.

| | |
|---|---|
| **Project** | Icecho |
| **Piece** | *The Last Note* |
| **Challenge** | The Earth Information Jukebox — NASA Space Apps Challenge 2026, Boston (virtual) |
| **Data** | NSIDC Sea Ice Index v4 (G02135): 48 September maps, 1979–2026 |
| **Sound** | Six voices, synthesised live in the browser with the Web Audio API |
| **Format** | One HTML file, offline, zero runtime dependencies |
| **Modes** | Guided scroll · Listen-only (`?mode=listen`) · Reduced motion |

## 1. Summary

Icecho is an audio-first sonification of the Arctic sea ice record: 48 NSIDC September maps, 1979 to 2026, each played as a chord whose note count comes from how much ice is in the frame. It is built for blind and low-vision listeners first, then for classrooms, museums and anyone who cannot read a dashboard — the same 48-year record, through the ear. The chord does not fade to one note: 1979 is a six-voice chord, 2026 is four, and 2012 — the record low — is three; the single voice at the end is a coda, labelled on screen as composition, not data.

> **Not a dashboard with a sound toggle.** The music is the primary format. The visuals are the optional layer.

## 2. Project Demonstration

**TBD — record and link before submission.**

The 90-second demo will show the real app: 1979 → 2026, the chord thinning, the 2012 dip, the handover, the coda. The audio will be the app's own, captured live from the running page; no music bed, no dubbing. Captions are burned in, so the video works muted.

## 3. Project

**Repository:** https://github.com/TheKingOfMoney09/NASA-submission-Icecho

Run it in three steps:

1. Download the repo as a ZIP, or clone it.
2. Open `dist/TheLastNote.html`.
3. Click **Begin**.

```bash
git clone https://github.com/TheKingOfMoney09/NASA-submission-Icecho.git
cd NASA-submission-Icecho
```

Then open `dist/TheLastNote.html` in your browser.

No install, no server, no network, no build step. If the page is silent, click once anywhere in it: browsers require a user gesture before audio can start.

For hands-free playback, add `?mode=listen` to the address. For the reduced-motion branch, add `?mode=reduced` or turn on your system's "reduce motion" setting.

## 4. Project Details

### What it is

Icecho is a scroll-driven story that plays the Arctic sea ice record as music. The dataset is 48 September maps from the NSIDC Sea Ice Index v4 (G02135), one per year, 1979–2026. Each map is reduced to six measured features — ice fraction, centroid, spread, edge raggedness, luminance and year-over-year loss — plus a seventh, deviation from the series mean; those drive a six-voice Web Audio instrument in real time. The ice fraction decides how many voices sound. Nothing is pre-rendered: every chord is synthesised in the browser from the frame data, so scrubbing to any year produces that year's chord.

### Why a chord, not a beep

A single number mapped to a single beep fails because the ear cannot hold a sliding tone in memory. A chord is a multivariate container: six notes carry several values at once, and the ear parses and remembers it. You cannot look at a 1979 graph and a 2026 graph and feel the difference; you can hear two chords and feel that one is emptier. Music compresses 48 years without destroying the shape of the change. A graph describes the change; the piece performs it.

### The acts

| Act | What happens | ~Time |
|---|---|---|
| **0 — Cold open** | Black. The 1979 chord, six voices, held. *"In 1979, the Arctic was loud."* Click to begin (unlocks audio). | 10 s |
| **I — Why** | Scroll drives 1979 → 2026. The chord loses voices; the ice pulls inside the 1981–2010 median line that never moves. No UI, no numbers. | 25 s |
| **II — How** | Rewind. One map → seven extracted values → six voices. The mapping is revealed as a mechanism, not a mood. | 25 s |
| **III — Human** | Second person: the listener who has never seen a satellite image. | 30 s |
| **IV — Handover** | *"Now play it yourself."* The story hands over to the instrument: scrub any year, or jump to 1995, 2012 and 2026. | 10 s |
| **V — Last note** | Four voices hold, then stop; one voice continues alone and decays — labelled on screen as composition, not data. Credits and sources. | 8 s |

Scroll sets the pace in guided mode; listen-only plays the whole piece in about two minutes.

### What you are hearing

| Data feature | Becomes | Why it reads |
|---|---|---|
| `iceFrac` — fraction of the map that is ice | **how many voices sound** (6 in 1979 → 4 in 2026, 3 in 2012) | Direct: less ice, fewer notes |
| `centroidY` — where the ice sits vertically | **root pitch** — north maps higher | Intuitive spatial metaphor |
| `spread` — vertical spread of the ice | **octave spread** of the chord | Wider ice = wider chord |
| `dLoss` — ice lost since the previous year | **detune** on the top voice, 0 → −70 cents | Instability you can hear |
| `edge` — how ragged the ice edge is | **noise layer amplitude** | Crumbling coastline texture |
| `lum` — mean brightness of the crop | **lowpass cutoff**, 400 Hz → 6 kHz | Bright ice vs dark water |
| `sigma` — deviation from the series mean | **mode flip** major ↔ minor + a 55 Hz pulse | "Something is wrong" |

> The chord does not fade to one note. 2026 has four. The single voice at the end is a coda, and the screen says so.

The voice count is computed from the frame, not typed in per year. The anchor years are: 1979 six, 1999 five, 2007 four, 2012 three, 2026 four. It does not fall in a straight line: it drops, recovers to five in 2013–14, then oscillates between four and five before ending at four.

### The honest part

The ice did not fall to one-sixth. 2026 is about 66% of 1979 — two-thirds. The chord is a stagger, not a fade: it loses a voice, gets one back, loses two. The early chord is pinned at the six-voice ceiling: nine years between 1979 and 1998 actually held more ice than 1979, so the opening is full, not declining. The loss becomes audible when the count drops. The single voice at the end is a compositional coda, and the screen labels it as such; the data stays true.

### What is different

- Most sonifications map one variable to one tone. This maps seven features to seven audible dimensions, and lets the voice count carry the headline.
- The record is not smoothed. The 2012 dip and the recovery after it are audible.
- Accessibility is not a mode bolted on at the end. The primary output is audio; the visual layer is the optional one.
- It is one offline HTML file with no libraries, no web fonts and no network calls.

### Accessibility, built in

Accessibility is structural, not a mode added at the end.

- **Native scroll only.** No scroll-jacking, no wheel capture. The page scrolls the way the browser scrolls; Page Down, Page Up and the scrollbar work.
- **Reduced motion.** `prefers-reduced-motion: reduce` collapses the story to a linear document: no parallax, no pinned sections, no auto-advance. Each act gets a play button.
- **Listen-only.** `?mode=listen` plays the whole story as audio with on-screen narration; the story advances on a timer, so no scrolling is needed. One tap starts it.
- **Keyboard.** Space play/pause, ←/→ one year, Home/End first/last year. Visible focus, and a skip link to the story.
- **Screen readers.** A real heading per act, a written transcript of what the audio is doing, an `aria-live="polite"` readout of the current year and ice value, and alt text on the canvas.
- **Contrast.** Text sits on scrims, never directly on busy imagery.
- **The begin gate is a real button.** Enter and Space work natively, and the first gesture unlocks audio.

### One file, offline

`dist/TheLastNote.html` is the submission. CSS, JavaScript, `frames.json` and all 48 map crops are inlined; there are no libraries, no web fonts and no network calls at runtime. Open it from disk — no server, no install, no build step. `dist/TheLastNote-lite.html` is the same story without the inlined maps (about 45 KB) as a fallback. The source lives in `app/`; rebuild with `python build/build.py`.

### How to run

Download the repo, open `dist/TheLastNote.html`, click **Begin**. That is the whole procedure. For hands-free, add `?mode=listen` to the address.

### What is next

More Earth records in the same instrument — other datasets with real visualisations (air quality, sea level, wildfires), a curated "album" of NASA records, a classroom kit, and an audio export for podcasts. The mapping is not tied to this one record; the hard part is choosing the next record honestly.

### Limits

- The piece is 48 annual snapshots, one September map per year. It is not a daily series.
- The number of voices is a sonification mapping, not a physical measurement. The mapping is documented so it can be argued with.
- 2026 is not a record low. 2012 is, at 3.34 M km² in the v4 file.
- Accessibility is architectural and checked with keyboard and screen-reader structure; it has not been the subject of a formal user study.
- It is a complement to the charts, not a replacement for them.

## 5. Use of Artificial Intelligence (AI)

This project was developed with AI-assisted tooling (OpenCode) for code scaffolding, debugging, research and the drafting of documentation. The concept, the sonification mapping and the act structure were authored and decided by the entrant; the data source and validation criteria were chosen by the entrant, and the extraction and correlation were run with AI-assisted tooling and checked against the published NSIDC files. No AI model runs inside the delivered application: all audio is synthesised procedurally in the browser with the Web Audio API from NASA-derived feature data, and the delivered file makes no network calls. The submission text was drafted with AI assistance and reviewed by the entrant before submission. AI assistance is disclosed here in full.

| Work | Who |
|---|---|
| Concept, title, act structure | Entrant |
| Sonification mapping and voice-count rule | Entrant |
| Data source choice and validation criteria | Entrant |
| Feature extraction, app code, debugging | AI-assisted (OpenCode) |
| Validation run and numbers | AI-assisted, checked against NSIDC files by the entrant |
| Documentation and submission text | AI-assisted draft, reviewed by the entrant |
| Runtime AI | None — no model, no API call, no network |

## 6. NASA Data

**Primary source — NSIDC Sea Ice Index v4 (G02135), September extent, 1979–2026.** The maps are the visual frames and the source pixels for the sonification features; the numbers are the annual daily minimum from the same product. Accessed 13 November 2026.

- **The 48 maps** — one per year, 1461×1740 PNG, 09_Sep:
  `https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/images/09_Sep/N_{YEAR}09_extn_hires_v4.0.png`
  Examples: [1979](https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/images/09_Sep/N_197909_extn_hires_v4.0.png) · [2026](https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/images/09_Sep/N_202609_extn_hires_v4.0.png)
- **Monthly September extent CSV** (September average extent and area):
  https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/data/N_09_extent_v4.0.csv
- **Daily extent CSV** (annual minimum):
  https://noaadata.apps.nsidc.org/NOAA/G02135/north/daily/data/N_seaice_extent_daily_v4.0.csv
- **Dataset landing page:** https://nsidc.org/data/g02135/versions/4

Citation:

> Fetterer, F., Knowles, K., Meier, W. N., Savoie, M., Windnagel, A. K. & Stafford, T. (2025). *Sea Ice Index*. (G02135, Version 4). [Data Set]. Boulder, Colorado USA. National Snow and Ice Data Center. https://doi.org/10.7265/a98x-0f50. [September 1979–2026 extent maps; daily extent 1978–2026]. Accessed 13 November 2026.

**Hero still — NASA SVS 5677, "Arctic Sea Ice Minimum 2026"** (Trent L. Schindler, NASA's Scientific Visualization Studio), 3840×2160. Act 0 only, one image.

- https://svs.gsfc.nasa.gov/5677/
- https://svs.gsfc.nasa.gov/vis/a000000/a005600/a005677/arctic_sea_ice_min_2026.still.png

**Numbers used** (daily minimum, v4 daily file):

| Year | Minimum extent | Date | Voices |
|---|---|---|---|
| 1979 | 6.90 M km² | 21 Sep | 6 |
| 1999 | 5.68 M km² | 12 Sep | 5 |
| 2012 | 3.34 M km² | 16 Sep | 3 — record low in this file |
| 2026 | 4.57 M km² | 12 Sep | 4 |

2026 is about 66% of 1979 — two-thirds, not one-sixth. It is not a record: 2012 remains the lowest in the file, and 2026 sits within 0.05 M km² of 2008, 2010 and 2025.

**Validation.** The extracted ice fraction was correlated against the NSIDC daily minima: **Pearson r = 0.9935, n = 48, RMSE = 0.13 M km², max residual 0.36 M km²** (the 14 Nov re-run gives 0.9934; the 0.0001 gap is float rounding, not a different mask). The residual pattern follows the polar stereographic projection, which stretches lower latitudes, so ice fraction is not perfectly linear in extent. The full year-by-year table and residuals are in [`app/data/validation.md`](app/data/validation.md).

**Two files, two kinds of number.** The maps are September monthly composites; the figures on screen are the annual daily minimum from the daily file. Both come from the same NSIDC v4 product, and validation compares them rather than assuming they are identical. This README says which file every number comes from.

**No EIC visualisation is used or claimed.** NASA's Earth Information Center (EIC) publishes visualisations across nine themes — Agriculture, Air Quality, Biodiversity, Disasters, Energy, Greenhouse Gases, Sea Level Change, Water Resources, Wildfires — and none is sea ice or cryosphere. The frames in this project are NSIDC G02135 v4 maps; the Act 0 hero still is NASA SVS 5677. Nothing here is an earth.gov or EIC product.

## 7. Space Agency Partner & Other Data

**None beyond the sources in the NASA Data field.** No separate space agency partner data; no other third-party data. The application has no runtime dependencies and makes no network requests.

## Credits

- **Icecho / *The Last Note*** — concept, sonification mapping, act structure and final text: Romascu David-Stefan, 2026. Solo entrant, NASA Space Apps Challenge 2026 — The Earth Information Jukebox (Boston, virtual).
- **Sea ice maps and numbers** — NSIDC Sea Ice Index v4 (G02135), Fetterer et al., National Snow and Ice Data Center, University of Colorado Boulder. Citation and DOI in field 6.
- **Hero still** — NASA SVS 5677, "Arctic Sea Ice Minimum 2026", Trent L. Schindler, NASA's Scientific Visualization Studio.
- **AI assistance** — OpenCode, disclosed in field 5. No AI runs in the delivered app.

## License

- **Code** — MIT. See [`LICENSE`](LICENSE).
- **Writing and narrative** — CC BY 4.0. Attribute as "Icecho — *The Last Note*, Romascu David-Stefan, 2026".
- **NASA and NSIDC media** — credited, not relicensed. NASA imagery is generally not copyrighted; NSIDC data remains subject to NSIDC's terms. The sources are cited above.

## Repository layout

| Path | What it is |
|---|---|
| `dist/TheLastNote.html` | the submission: one offline file |
| `dist/TheLastNote-lite.html` | same story, no inlined maps (~45 KB) |
| `app/index.html` | source shell |
| `app/js/core.js` | shared `EJ` namespace, state, event contract |
| `app/js/loader.js` | boot, data load, and the fallback instrument, renderer and scroll modules |
| `app/js/content.js` | all audience-facing copy, narration, transcripts, alt text |
| `app/js/main.js` | mode router, act machine, keyboard, HUD |
| `app/css/style.css` | all styling |
| `app/data/frames.json` | 48 feature vectors, 1979–2026 |
| `app/data/frames/*.webp` | 48 map crops, inlined into the build |
| `app/data/validation.md` | extraction vs NSIDC: r, RMSE, residuals |
| `app/prep.py` | fetch → extract → validate |
| `build/build.py` | inlines CSS, JS, JSON and images into `dist/` |
| `app/tests/smoke.mjs` | headless smoke test |
| `submission/fields.md` | the seven form answers and the pre-submit checklist |
| `video/` | shot list, caption script, ffmpeg recipe — the MP4 is uploaded, not committed |
| `LICENSE` | MIT |

## Offline and reproducibility

The delivered file is the artifact. There is no server, no package manager, no build step, and no network call at runtime. The only network step in the project is the data fetch:

```bash
python app/prep.py fetch      # 48 NSIDC maps + the two CSVs, into data/raw/ (gitignored)
python app/prep.py extract    # crop, mask, features, WebP
python app/prep.py validate   # daily minima, Pearson r, validation.md
python build/build.py         # dist/TheLastNote.html + -lite
```

`prep.py` needs Python 3 with `requests`, `numpy` and `Pillow`; `build.py` uses the standard library only. The build is deterministic: same inputs, same bytes. The raw 11 MB of PNGs are not committed; the 48 WebP crops are.

The acceptance test is the one a judge will run: download the repo as a ZIP, extract it to an empty folder, turn off Wi-Fi, open `dist/TheLastNote.html`, click **Begin**. If it plays, it works.
