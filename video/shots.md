# The Last Note — 90-second demo shot list

**Status: DRAFT — NOT RECORDED.** `video/demo.mp4` does not exist yet.

> **Do not record before the app is frozen.** A half-built app makes a dishonest video, and you only get one capture window. Record against the freeze build (or the latest green build after 13:00 Sunday); if the build changes materially after capture, re-record only the shots that show the change.

**Spec:** 90.0 s hard cap · 1920×1080 · 30 fps · H.264 + AAC · ≤ 40 MB · captions burned in · unlisted YouTube.

## What the video must prove

1. This is the real app, not a mockup.
2. The audio is generated from the data and changes when the year changes.
3. The chord thins: 1979 six voices, 2012 three, 2026 four.
4. It is built for the ear first: every line is captioned, so it works muted.
5. It is honest: no EIC claim, no "one note" claim, no invented user story.

## Hard rules

- **Record the real app's audio.** Never dub a separate track. If the audio and the picture disagree, the whole claim collapses.
- **No background music, no whooshes, no stock footage.** The app is the soundtrack.
- **Burn in every line.** Assume the judge watches muted.
- **Do not speed-ramp the scroll.** If a shot is too long, cut it; don't accelerate it.
- **Do not show** a placeholder, the console, a cursor parked over text, the Windows taskbar, or a loading state.
- 90 seconds means 90.0, not 92.

## Before the camera rolls

- [ ] `dist/TheLastNote.html` is the freeze build / latest green build. No TODO or placeholder text.
- [ ] All 48 years load; the year readout moves from 1979 to 2026.
- [ ] Audio starts on **Begin** in Edge and Chrome.
- [ ] 2012 shows three voices; 1979 six; 2026 four.
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

**Picture:** the scroll story from 1979 to 2026. The map fills the frame; the magenta 1981–2010 median line stays fixed; the white ice pulls inside it. The year readout moves. If the build follows the plan, Act I carries no numbers.

**Action:** scroll at a steady rate. Rehearse twice. Target: 1979 at 0:10, 2012 around 0:31, 2026 at 0:43. Hold 2026 for the last 2 s.

**Captions:**
- 0:12–0:17 — "Every September since 1979, the National Snow and Ice Data Center has mapped the Arctic."
- 0:18–0:24 — "Each map becomes a chord. How much ice is left decides how many notes survive."
- 0:26–0:30 — "1979: six voices."
- 0:31–0:36 — "2012: three. The record low."
- 0:37–0:40 — "2026: four."
- 0:40–0:44 — "Not a fade. A stagger."

**Audio:** live app audio. No music bed.

**Why this shot:** this is the whole argument. The visual and the audio must be the same take.

**If Act I auto-advances:** use that instead of manual scrolling; still one take.

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

**If Act III is not built:** use Act II (the mechanism) and change the captions to the mapping. Do not fake the blind-listener line.

**Careful:** if the chord under Act III is not the thinnest, do not caption it as "the thinnest". The captions above don't claim that.

---

## 1:00–1:20 · Act IV — handover (20 s)

**Picture:** the instrument. The scrubber, the year readout, the map. The user drags from 1995 to 2012 to 2026.

**Action:** drag the scrubber; hold each year about 3 s. Keep the year readable.

**Captions:**
- 1:02–1:05 — "Now play it yourself."
- 1:06–1:10 — "1995 — still six voices."
- 1:11–1:15 — "2012 — three."
- 1:16–1:19 — "2026 — four."

**Audio:** live. The chord changes as the year changes. This is the proof that it is real-time.

**If Act IV is cut:** use Act V instead:
- **Picture:** the coda. Hold.
- **Captions:** 1:02 "Four notes, held." / 1:08 "Then one voice, alone." / 1:13 "The last voice is a coda, labelled as composition." / 1:18 "Not a data point."
- **Audio:** the app's coda.

Do not claim a free-play instrument if it isn't there.

---

## 1:20–1:30 · Title and credits (10 s)

**Picture:** black, or the app's own credits/Act V end card. A title card made in the edit is allowed here; it is clearly a title card, not app footage.

**Text:**
- 1:21–1:24 — "Icecho — The Last Note"
- 1:24–1:28 — "Data: NSIDC Sea Ice Index v4 (G02135), 1979–2026. Hero still: NASA SVS 5677."
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

## 60-second fallback (if the build slips)

Use this only if you cannot get 90 seconds.

| Time | Shot | Caption |
|---|---|---|
| 0:00–0:08 | Cold open | "In 1979, the Arctic was loud." |
| 0:08–0:38 | Act I, 1979 → 2026 | "Each map becomes a chord. Less ice, fewer notes." / "1979 six. 2012 three. 2026 four." |
| 0:38–0:50 | Act III or Act V | "You have never seen a satellite image." / "This is what forty-eight years of looking sounds like." |
| 0:50–0:58 | Handover or coda | "Now play it yourself." / "The last voice is a coda, labelled as composition." |
| 0:58–1:00 | Title | "Icecho — The Last Note." |

Still real audio, still captions burned in. Change `video/captions.srt` timings to match; do not leave the 90-second SRT on a 60-second video.

## After the take

- Watch it once at 100%. Does the chord actually thin at 2012? If not, the audio isn't the app's — stop and fix it.
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
