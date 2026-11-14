# The Last Note — full transcript

Every word 03-NARRATIVE wrote for the piece, in reading order: the six acts, the
screen-reader transcript of what the audio is doing, the listen-only narration,
and the alt text for the eight reference years.

Piece: **The Last Note** · NASA Space Apps Challenge 2026, *The Earth Information Jukebox* · content freeze 15 Nov 2026, 13:00 RO.
Language: English. Second person only where the story addresses the listener. No named people, no quotes, no composite characters.

The app loads these strings from `app/js/content.js`.
Act III alone, formatted for reading aloud, is in `copy/act-iii-read-aloud.md`.

---

## Numbers this copy uses

Extents come from the NSIDC Sea Ice Index v4 (G02135) daily file `N_seaice_extent_daily_v4.0.csv` (August–October minimum). Voice counts come from the September maps, `N_{YEAR}09_extn_hires_v4.0.png`. One source, one version.

| Year | Daily minimum | Date | Voices |
|---|---|---|---|
| 1979 | 6.90 million km² | 21 Sep | 6 |
| 2007 | 4.15 million km² | 16 Sep | 4 |
| 2012 | **3.34 million km²** | 16 Sep | **3** |
| 2026 | 4.57 million km² | 12 Sep | 4 |

- 2026 is **66%** of 1979 — about two-thirds, not one-sixth.
- **2012 is the record low.** 2026 is not a record: it is within 0.05 million km² of 2008, 2010 and 2025, roughly tenth-lowest.
- Voice sequence from the map pixels: **6 through 1998 → 5–6 in 1999–2006 → 4 from 2007 → 3 in 2012 → 5 in 2013–14 → 4–5 from 2015 to 2025 → 4 in 2026.**
- 1979 is the instrument's ceiling, not the record maximum. Nine of the years from 1979 to 1998 held slightly more ice than 1979, so the chord is pinned at six rather than rising.
- The pixel extraction behind the sonification correlates with the published daily minima at **r = 0.9935, n = 48** (reported by 01-DATA; not spoken in the acts).

Alt text for 1988, 1995, 2016 and 2020 gives the chord's own value — a voice count, or in 1995 a range — rather than a km² figure, because the frozen number block above does not verify those four minima. No number was guessed. If `app/data/frames.json` later supplies a validated extent for those years, add it then.

---

## Act 0 — Cold open

**On screen — 14 words**

> In 1979, the Arctic was loud.

> Six notes, held together.

> Begin with sound on.

**Transcript — what the audio is doing**

The 1979 chord: six sustained voices, close together, with no rhythm and no melody. Nothing else sounds. This is the fullest the instrument gets.

**Audio hint:** Six voices, one held chord, no rhythm.

---

## Act I — Why

**On screen — 88 words**

> This is the Arctic, one September at a time: 1979 to 2026.

> Each year is a chord. The ice decides how many notes are in it.

> 1979 is full: six voices. 2026 is four. 2012 was three.

> Every map carries one line that never moves, the 1981–2010 median edge. In 1979 almost all of the ice sits outside it. By 2026 most of it is pulled inside.

> The chord does not fade. It steps down, partly returns, then steps down again. That stagger is what the ice did.

**Transcript — what the audio is doing**

Six voices hold at 1979. As the years run, the highest voice leaves, then another; by 2007 four remain. Two come back in 2013, and from 2015 the chord moves between four and five, landing on four for 2026. The pitch drifts slowly, and the top voice sags out of tune in the years that lost the most ice.

**Audio hint:** A six-voice chord thins to four over the record.

---

## Act II — How

**On screen — 153 words**

> Every September from 1979 to 2026 has a map. Each one is cut to the same rectangle, so the only thing that can change is the ice.

> Seven numbers shape the chord. Six are measured from the maps: how much of the sea is white ice, where it sits, and how widely it is spread. Then how broken its edge is, how bright the frame is, and how much ice was lost since the year before.

> The first six are audible: ice decides how many notes survive, position moves the pitch, spread sets the chord's width. A broken edge adds noise; brightness opens or closes the sound; yearly loss pulls the top voice out of tune. The seventh is the deviation from the series mean: it flips the chord between major and minor.

> Nothing about a year is entered by hand. The same year gives the same chord, every time you play it.

**Transcript — what the audio is doing**

The chord is built from seven measurements. Voice count follows the amount of ice. Pitch follows where the ice sits. The chord widens and narrows with the spread of the ice. A noise layer rises as the edge breaks up. Brightness opens or closes the tone. Yearly loss detunes the top voice. The seventh is the deviation from the series mean: it flips the chord between major and minor. When it drops far enough, a low pulse sounds beneath.

**Audio hint:** The chord rebuilt from seven measurements.

---

## Act III — The listener

**On screen — 103 words**

> You have never seen a satellite image. You have never seen the ice.

> You have heard a chord, though. Six notes, held together. That was 1979.

> The top note goes first, then the next. Nothing dramatic happens. That is the point.

> Two of the six are gone now. One year, 2013, two came back. The chord has not been six since 2007.

> What is left is four notes, a line on a map that never moves, and an edge that has crossed it.

> The ice is about two-thirds of what it was in 1979. You just heard something most people only ever saw.

**Transcript — what the audio is doing**

The chord thins as the years run. The top voices go first. At 2012 there are three; by 2026 there are four. The sound stays calm, with no percussion, no melody, and no rise at the end.

**Audio hint:** The chord thins; the top voices are missing.

---

## Act IV — Handover

**On screen — 22 words**

> Now play it yourself. Use the slider, or the arrow keys.

> Try 1995, then 2012, then 2026.

> 2012 is the three-note year.

**Transcript — what the audio is doing**

Three chords sound in turn: 1995, 2012, 2026. The 2012 chord has three voices. The 2026 chord has four.

**Audio hint:** Three years, three chords: 1995, 2012, 2026.

---

## Act V — The last note

**On screen — 39 words**

> Four notes are playing. That is the ice in 2026.

> What follows is a coda: one voice, left alone, fading. It is not data.

> CODA · COMPOSITION, NOT DATA. Maps: NSIDC Sea Ice Index v4 (G02135). Still: NASA SVS 5677.

**Transcript — what the audio is doing**

Four voices hold, then stop. One voice continues alone and decays to silence. That last voice is a composed coda, not a measurement: the data ends at four. The screen labels it CODA, COMPOSITION, NOT DATA, and credits NSIDC Sea Ice Index v4 (G02135) and NASA SVS 5677.

**Audio hint:** Four notes, then one voice decaying alone.

---

## Listen-only narration

The complete screenplay for `?mode=listen`, in playback order. Timestamps are `EJ.state.t`, 0 to 1, not seconds. The listen-only timeline runs 120 seconds.

**22 lines · 218 words · about 87 seconds at a normal speaking pace.**

| t | Narration |
|---|---|
| 0.00 | In 1979, the Arctic was loud. Six notes, held together. |
| 0.10 | One September, one chord. From 1979 to 2026, the ice decides how many notes survive. |
| 0.17 | The top note goes first. Then another. |
| 0.24 | Nothing dramatic happens. That is the point. |
| 0.29 | Two of the six are gone. In 2012 there were three. |
| 0.34 | Rewind. One map becomes seven numbers. Six are audible; the seventh flips the chord between major and minor. |
| 0.39 | The amount of white ice decides how many voices you hear. |
| 0.44 | Where the ice sits drifts the pitch. How widely it spreads sets the chord's width. |
| 0.49 | A ragged edge adds noise. Brightness opens or closes the sound. |
| 0.53 | Ice lost since the year before pulls the top voice out of tune. |
| 0.57 | You have never seen a satellite image. You have never seen the ice. |
| 0.62 | You have heard a chord, though. Six notes, held together. |
| 0.67 | Two of the six are gone now. One year, 2013, two came back. |
| 0.72 | The chord has not been six since 2007. |
| 0.77 | The ice is about two-thirds of what it was. |
| 0.81 | You just heard something most people only ever saw. |
| 0.84 | Now play it yourself. |
| 0.87 | Try 1995, then 2012, then 2026. |
| 0.90 | 2012 is the three-note year. |
| 0.93 | Four notes are playing. That is the ice in 2026. |
| 0.96 | What follows is a coda: composition, not data. |
| 0.99 | One voice, left alone, fading. |

---

## Alt text by year

One sentence each. Written for a sighted reader who needs the image described, with the ice value the app is playing.

**1979** — A polar map of the Arctic Ocean with white ice spreading beyond the fixed magenta 1981–2010 median edge almost everywhere, over navy water and surrounded by grey land; six of six voices; September minimum 6.90 million square kilometres (NSIDC G02135 v4).

**1988** — A polar map of the Arctic Ocean with white ice across most of the basin, the fixed magenta 1981–2010 median edge drawn over the water, and grey land around the coast; six of six voices.

**1995** — A polar map of the Arctic Ocean with white ice covering most of the basin, the fixed magenta 1981–2010 median edge drawn over the water, and grey land around the coast; the chord is at or near its full six voices.

**2007** — A polar map of the Arctic Ocean with white ice pulled inside the fixed magenta median edge, and open water along the Eurasian coast; four of six voices; September minimum 4.15 million square kilometres (NSIDC G02135 v4).

**2012** — A polar map of the Arctic Ocean with white ice far inside the fixed magenta median edge around most of the basin, the smallest white area in the record; three of six voices; September minimum 3.34 million square kilometres (NSIDC G02135 v4).

**2016** — A polar map of the Arctic Ocean with white ice inside the fixed magenta median edge across most of the basin, and grey land around the coast; four of six voices.

**2020** — A polar map of the Arctic Ocean with white ice well inside the fixed magenta median edge, and open water along the Eurasian coast; four of six voices.

**2026** — A polar map of the Arctic Ocean with white ice mostly inside the fixed magenta median edge, about two-thirds of the 1979 area; four of six voices; September minimum 4.57 million square kilometres (NSIDC G02135 v4).

---

## What this copy deliberately does not say

- It never claims the chord empties to one note, or that the ice is one-sixth of 1979.
- It never calls 2026 a record. 2012 is the record low.
- It never invents a person, a quote, or a community testimonial. The only "you" is the listener.
- It never calls the coda data. The label is on screen, in words: **CODA · COMPOSITION, NOT DATA.**
- It never claims an Earth Information Center sea-ice visualisation. None exists; the maps are NSIDC G02135 v4 and the hero still is NASA SVS 5677.

---

## Credits and sources

**Maps and numbers:** NSIDC Sea Ice Index v4 (G02135), Fetterer et al., National Snow and Ice Data Center, University of Colorado Boulder. September extent maps `N_{YEAR}09_extn_hires_v4.0.png`; daily minima `N_seaice_extent_daily_v4.0.csv`.

**Act 0 hero still:** NASA SVS 5677, *Arctic Sea Ice Minimum 2026*, NASA's Scientific Visualization Studio (Trent L. Schindler).

**Sonification and app:** generated live in Web Audio by *The Last Note*, NASA Space Apps Challenge 2026, Boston (virtual), *The Earth Information Jukebox*.

Built with AI-assisted development (OpenCode). The concept, the mapping decisions and the data validation are human decisions; every number on screen cites the file it came from.
