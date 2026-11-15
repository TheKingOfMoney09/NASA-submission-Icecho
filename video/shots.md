# The Last Note — 90-second demo shot list

**Status: SHOT LIST READY — NOT RECORDED.** `video/demo.mp4` does not exist yet.

> **Record the freeze build.** Tag **`freeze-build`**, code commit **`62c6f72`**. `dist/TheLastNote.html` is **3,512,760 B (3.51 MB)**, SHA-256 `F98DBA252372048BC648E8F32A57D280FFCA7F17DDB558AD461721DD1A402CB2`. If the hash differs, stop and re-download the repo; do not film a rebuilt dist.

**Spec:** 90.0 s hard cap · 1920×1080 · 30 fps · H.264 + AAC · ≤ 40 MB · captions burned in · unlisted YouTube.

## What the video must prove

1. This is the real app, not a mockup.
2. The audio is generated from the data and changes when the year changes.
3. The chord thins: 1979 six voices, 2012 three, 2026 four.
4. It is built for the ear first: every line is captioned, so it works muted.
5. It is honest: no EIC claim, no "one note" claim about the data — the one-voice ending is the labelled coda — and no invented user story.

## Hard rules

- **Record the real app's audio.** Never dub a separate track. If the audio and the picture disagree, the whole claim collapses.
- **No background music, no whooshes, no stock footage.** The app is the soundtrack.
- **Burn in every line.** Assume the judge watches muted.
- **Do not speed-ramp the scroll.** If a shot is too long, cut it; don't accelerate it.
- **Do not show** a placeholder, the console, a cursor parked over text, the Windows taskbar, or a loading state.
- 90 seconds means 90.0, not 92.

## Before the camera rolls

- [ ] `dist/TheLastNote.html` is the freeze build (`freeze-build` / `62c6f72`), SHA-256 starts `F98DBA25`. No TODO or placeholder text.
- [ ] All 48 years load; the year readout moves from 1979 to 2026.
- [ ] Audio starts on **Begin** in Edge and Chrome.
- [ ] 1979 is six voices, 2012 three, 2026 four.
- [ ] At the end, the 2026 chord holds, then **one voice** alone decays; the label **CODA · COMPOSITION, NOT DATA** is visible. Rehearse the coda so the take catches it.
- [ ] Display set to 1920×1080 if possible; 100% zoom; F11 fullscreen; bookmarks bar hidden.
- [ ] Focus assist / Do Not Disturb on; Discord, Steam, Slack and notifications off.
- [ ] Clean desktop; no personal files visible.
- [ ] ffmpeg on PATH; `ffmpeg -version`; libass present (`ffmpeg -filters | findstr subtitles`).
- [ ] Audio loopback works. See `video/README.md` — this laptop has no Stereo Mix by default, so use OBS Desktop Audio.
- [ ] `video/raw/` exists.
- [ ] `video/captions.srt` matches the take.

---

## 0:00–0:10 · Cold open

**Picture:** black, then Act 0 as built. If the app opens on the Begin gate, show the gate for about 2 s; the click happens at 0:02; the gate disappears and the 1979 chord starts. The gate is part of the real app — show it, don't hide it.

**Action:** start capture. Click **Begin** at 0:02. Do not move the mouse after the click.

**Captions:**
- 0:02–0:07 — "In 1979, the Arctic was loud."
- 0:07–0:10 — "48 years of sea ice. 48 maps. One chord per year."

**Audio:** the app's opening 1979 chord, live. No added reverb, no sting.

**If Act 0 is longer than 8 s:** hold to 0:10 and cut on a frame boundary; don't trim the audio mid-note.

---

## 0:10–0:45 · Act I — the loss (35 s)

**Picture:** the scroll story from 1979 to 2026. The map fills the frame; the magenta 1981–2010 median line stays fixed; the white ice pulls inside it. The year readout moves. Act I carries the year but no extent figures.

**Action:** hold at 1979 through 0:25 — the first two captions play over the full six-voice chord. Then scroll so **2012 lands at 0:31** and **2026 at 0:37**. Hold 2026 to 0:45. Rehearse twice; the hold is what makes the later captions true.

**Captions:**
- 0:12–0:17 — "Every September since 1979, the National Snow and Ice Data Center has mapped the Arctic."
- 0:18–0:24 — "Each map becomes a chord. How much ice is left decides how many notes survive."
- 0:26–0:30 — "1979: six voices."
- 0:31–0:36 — "2012: three. The record low."
- 0:37–0:40 — "2026: four."
- 0:40–0:44 — "Not a fade. A stagger."

**Audio:** live app audio. No music bed.

**Why this shot:** this is the whole argument. The visual and the audio must be the same take.

**Guided mode does not auto-advance.** The scroll is the clock; the hold at 1979 is a real hold, not a pause.

**Do not:** scroll past the end, scroll backward, or park the cursor over the text.

---

## 0:45–1:00 · Act III — the listener (15 s)

**Picture:** Act III typography, slow. The screen is mostly words, not the map. This is the accessibility beat.

**Action:** scroll to Act III before 0:45 and hold. No scrolling during the shot.

**Captions:**
- 0:46–0:50 — "You have never seen a satellite image."
- 0:51–0:55 — "You just heard forty-eight years of looking at the ice."
- 0:56–0:59 — "The ice is still two-thirds of what it was in 1979."

**Audio:** the app's Act III audio, live.

**Act III is built:** the screen is the listener's typography and its transcript describes the chord honestly (four to six voices, never a single tone). Do not substitute Act II, and do not fake the blind-listener line.

**Careful:** if the chord under Act III is not the thinnest, do not caption it as "the thinnest". The captions above don't claim that.

---

## 1:00–1:08 · Act IV — handover (8 s)

**Picture:** the instrument. The scrubber, the year readout, the map. The user drags from 1995 to 2012 to 2026.

**Action:** drag the scrubber; hold each year about 2 s. Keep the year readable. Then scroll to the very end at 1:08 so the coda starts on time.

**Captions:**
- 1:00–1:02 — "Now play it yourself."
- 1:02–1:04 — "1995 — still six voices."
- 1:04–1:06 — "2012 — three."
- 1:06–1:08 — "2026 — four."

**Audio:** live. The chord changes as the year changes. This is the proof that it is real-time.

**Do not** spend more than 8 s here; the coda needs the last 12 s.

---

## 1:08–1:20 · Act V — the coda (12 s)

**Picture:** Act V on screen, with **CODA · COMPOSITION, NOT DATA** legible. Scroll to the bottom at 1:08 and hold.

**Action:** after the 2026 scrub, scroll to the end and do not move the mouse. The app holds the four-voice 2026 chord for about 2 s, then leaves one voice alone to decay over 6 s. Do not cut the audio.

**Captions:**
- 1:09–1:12 — "Four notes, held."
- 1:12–1:15 — "Then one voice continues alone."
- 1:15–1:18 — "CODA — composition, not data."
- 1:18–1:20 — "The last measured chord is four."

**Audio:** the app's coda, live. Four voices hold, then one decays. If all four stop together, the take missed the coda. If you add a solo voice in the edit, you break the point of the label — the one-voice ending must be the app's own.

**Why:** the coda is the only composed sound in the piece, and the screen says so. The data ends at four.

---

## 1:20–1:30 · Title and credits (10 s)

**Picture:** black, or the app's own credits/Act V end card. A title card made in the edit is allowed here; it is clearly a title card, not app footage. If you use the Act V end card, hold it so **CODA · COMPOSITION, NOT DATA** is legible — that is the coda label the 90-second description refers to. The one-voice decay has already played at 1:12–1:18; do not add another solo voice in the edit.

**Text:**
- 1:21–1:24 — "Icecho — The Last Note"
- 1:24–1:28 — "Data: NSIDC Sea Ice Index v4 (G02135), 1979–2026. NASA SVS 5677 credited."
- 1:28–1:30 — "Built for the ear first."

**Audio:** silence. No sting.

**Why:** end on the claim, not on a logo.

---

## Capture order (to save time)

1. **One continuous take for 0:00–0:45:** Begin → Act I → hold 2026. This is the hardest; do it first, twice if needed.
2. **A second take for 0:45–1:00:** scroll to Act III, hold.
3. **A third take for 1:00–1:20:** Act IV scrub.
4. **Title card** in the edit.

Splice at the act boundaries; keep the audio from each take. Do not crossfade the audio between takes — cut on the frame.

**Preferred:** one 90-second take if you can scroll smoothly to each act on cue, because the audio is continuous. Rehearse twice; if take 3 is clean, keep it.

## 60-second fallback

Use this only if you cannot get 90 seconds.

| Time | Shot | Caption |
|---|---|---|
| 0:00–0:08 | Cold open | "In 1979, the Arctic was loud." |
| 0:08–0:38 | Act I, 1979 → 2026 | "Each map becomes a chord. Less ice, fewer notes." / "1979 six. 2012 three. 2026 four." |
| 0:38–0:50 | Act III or Act V | "You have never seen a satellite image." / "This is what forty-eight years of looking sounds like." |
| 0:50–0:58 | Handover or coda | "Now play it yourself." / "The closing coda is labelled as composition." |
| 0:58–1:00 | Title | "Icecho — The Last Note." |

Still real audio, still captions burned in. Change `video/captions.srt` timings to match; do not leave the 90-second SRT on a 60-second video.

## After the take

- Watch it once at 100%. Does the chord drop to three at 2012 and return to four at 2026? If not, the audio isn't the app's — stop and fix it.
- Confirm the **CODA · COMPOSITION, NOT DATA** label is legible in the final frames.
- Check the year readout is legible at 1080p.
- Check no cursor is parked over a caption.
- Trim to exactly 90.0 s; no speed ramps.
- Burn captions with the command in `video/README.md`.
- Watch muted: every line readable?
- Watch with sound: does the audio match the picture?
- Upload unlisted; paste the link into `README.md` field 2 and `submission/fields.md` field 2.

## What not to film

- The console, DevTools, the desktop, the taskbar, a file manager.
- A loading state, a blank canvas, or the fallback curve.
- Any text that says TODO, placeholder, or "mock".
- A different take's audio over this take's visuals.
