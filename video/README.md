# Video — recording and delivery

**Status: NOT RECORDED.** `video/demo.mp4` does not exist yet.

> **Record against the freeze build.** The app is frozen at tag **`freeze-build`**, code commit **`3634d8d`**. `dist/TheLastNote.html` is **3,521,755 B (3.51 MB)**, SHA-256 `1B7136D9D34D952C6467F9262AFBEF6DEBA0B49E18CAC2A194ECF10B99396EC9`. Record that file — not `app/index.html`, not a rebuilt dist. If the hash differs, stop and re-download the repo.

**What is in this folder**

| File | What it is |
|---|---|
| `shots.md` | the 90-second shot list, capture order, 60-second fallback |
| `script.md` | the caption script, plus a 90-word voiceover cut if one is ever needed |
| `captions.srt` | draft caption timings — adjust to picture before burning in |
| `README.md` | this file: capture, captions, compression, upload |

**The deliverable:** `video/demo.mp4` — 90.0 s max, 1920×1080, H.264/AAC, ≤ 40 MB, captions burned in, real app audio, uploaded unlisted.

---

## 0. Before you record

- [ ] Use the **freeze-build** `dist/TheLastNote.html`. Do not record `app/index.html` from source; the dist is the artifact.
- [ ] **Hash check** — `(Get-FileHash dist/TheLastNote.html -Algorithm SHA256).Hash` must print `1B7136D9D34D952C6467F9262AFBEF6DEBA0B49E18CAC2A194ECF10B99396EC9`.
- [ ] **Artifact gate:** the dist draws the map and plays a chord. `[regex]::Matches((Get-Content dist/TheLastNote.html -Raw),'drawImage').Count` — and the same for `createOscillator` and `createBiquadFilter` — gives **3 / 6 / 4**, and there are **48** base64 WebP maps. The build is strict, so a missing module cannot produce this file. Details in `submission/fields.md` §3.
- [ ] All 48 years load (1979–2026). No TODO, placeholder or fallback curve on screen.
- [ ] Audio starts on **Play the last note** in Edge and Chrome.
- [ ] **Voice check before the take:** 1979 shows/hears **six** voices, 2012 **three**, 2026 **four**.
- [ ] **Coda check:** at the end, the four-voice 2026 chord holds, then **one voice** alone decays to silence, and the closing screen shows **CODA · COMPOSITION, NOT DATA**. If the label is missing or all four voices stop together, stop — the shot list depends on it.
- [ ] Human check no grep replaces: you can **see** the September map (white ice, magenta median line) and **hear** six, three and four sustained voices — not one tone sliding upward.
- [ ] Network off. The video should prove the file runs offline.
- [ ] F11 fullscreen, 100% zoom, bookmarks bar hidden (`Ctrl+Shift+B`).
- [ ] Focus assist / Do Not Disturb on. Discord, Steam, Slack closed.
- [ ] Clean desktop. No personal files, no taskbar if you can avoid it.
- [ ] Display at 1920×1080 if possible. If not, record native and scale in the caption pass.
- [ ] Rehearse the Act I scroll twice. It is the hard part.
- [ ] `video/raw/` exists:

```powershell
New-Item -ItemType Directory -Force video/raw | Out-Null
```

---

## 1. Check ffmpeg

This machine has ffmpeg 9.0 (full build) from winget:

```
C:\Users\david\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin\ffmpeg.exe
```

If `ffmpeg -version` does not work in a new PowerShell window:

```powershell
winget install Gyan.FFmpeg
```

Close and reopen PowerShell. Then check the two things the recipe needs:

```powershell
ffmpeg -version
ffmpeg -filters | findstr subtitles
```

You need the `subtitles` filter (libass) for burned-in captions. The installed full build has it.

---

## 2. Audio — the part that usually fails

`gdigrab` captures video only. To capture system audio, ffmpeg needs a DirectShow loopback device. List what this machine has:

```powershell
ffmpeg -hide_banner -list_devices true -f dshow -i dummy
```

> The command exits with an error after listing the devices. That is normal.

Look for an audio device named `Stereo Mix (...)`, `virtual-audio-capturer`, or similar. **A microphone is not acceptable** — the video must contain the app's audio, not the room.

> **This laptop, 14 Nov 2026:** the device list shows only `Microphone Array (Realtek(R) Audio)` and `Microphone (Steam Streaming Microphone)`. There is no Stereo Mix. Do not record with the microphone.
>
> Two options:
> 1. **Enable Stereo Mix.** Right-click the speaker icon → Sounds → Recording → right-click empty space → Show Disabled Devices → enable **Stereo Mix** (Realtek). Re-run the device list and use that exact name.
> 2. **Use OBS for picture + desktop audio** (installed here at `C:\Program Files\obs-studio\bin\64bit\obs64.exe`). OBS has Desktop Audio loopback built in. Record with OBS, then use ffmpeg for the captions and the final encode. Settings below.

### Option A — ffmpeg with a loopback device

Set the exact device name from the list:

```powershell
$AUDIO = 'Stereo Mix (Realtek(R) Audio)'   # replace with the exact name from the list
```

Test for five seconds:

```powershell
ffmpeg -y -f gdigrab -framerate 30 -draw_mouse 0 -offset_x 0 -offset_y 0 -video_size 1920x1080 -i desktop -f dshow -i audio="$AUDIO" -t 5 -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 video/raw/test.mp4
```

Play it:

```powershell
ffplay -hide_banner video/raw/test.mp4
```

If the audio is silent, fix it before the real take — see §2.1. If the picture is cropped, your `-video_size` does not match the display; detect the real size below.

Full take:

```powershell
ffmpeg -y -f gdigrab -framerate 30 -draw_mouse 0 -offset_x 0 -offset_y 0 -video_size 1920x1080 -i desktop -f dshow -i audio="$AUDIO" -t 150 -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart video/raw/take1.mp4
```

Start the capture, then do the take. Stop with `q` in the ffmpeg window (clean) or wait for `-t 150`. Avoid Ctrl+C unless you have to; it can truncate the file.

Detect the real screen size (use these numbers in `-video_size`):

```powershell
ffmpeg -y -f gdigrab -framerate 1 -i desktop -frames:v 1 video/raw/screen-test.png
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 video/raw/screen-test.png
```

If the display is not 1920×1080, record native and add `scale=1920:-2:flags=lanczos,` before `subtitles=` in §4.

### Option B — OBS for picture + desktop audio (works on this laptop)

1. Open OBS. Skip the Auto-Configuration Wizard if you have used OBS before; otherwise accept 1080p/30.
2. **Settings → Output → Recording:** Format `mkv`, Encoder `x264`, Rate Control `CRF`, CRF `16`, Preset `veryfast`.
3. **Settings → Video:** Base (Canvas) `1920x1080`, Output (Scaled) `1920x1080`, FPS `30`.
4. **Settings → Audio:** Sample Rate `48 kHz`, Desktop Audio `Default`, Mic/Aux `Disabled`.
5. **Sources:** `+` → **Display Capture** → primary monitor. Untick **Capture Cursor**.
6. **Settings → Output → Recording Path:** set it to the project's `video/raw/` folder.
7. Start Recording. Do the take. Stop Recording. The file is `video/raw/take1.mkv`.

OBS records the real desktop audio. Do not add a microphone, do not add music.

### 2.1 If the capture is silent

Check for an audio stream:

```powershell
ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,channels,sample_rate -of default=noprint_wrappers=1 video/raw/take1.mp4
```

Empty output = no audio track. Fix the device and re-record.

Measure the level:

```powershell
ffmpeg -hide_banner -i video/raw/take1.mp4 -af volumedetect -f null NUL 2>&1 | Select-String 'mean_volume|max_volume'
```

`mean_volume: -91.0 dB` means silence. Roughly `-20` to `-12 dB` is healthy for this piece. Never fix silence by adding music or a microphone; re-record.

---

## 3. Trim to the cut

If the take has lead-in or a tail, trim before captions. Example — start at 2.0 s, keep 90 s:

```powershell
ffmpeg -y -ss 00:00:02.000 -i video/raw/take1.mp4 -t 90 -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart video/raw/cut.mp4
```

If you edit in Premiere, export a 90.0 s master from Premiere and use that as the input to §4. Do not speed-ramp.

---

## 4. Burn in the captions

`video/captions.srt` is a draft. Adjust the timings to the actual cut, then:

```powershell
ffmpeg -y -i video/raw/cut.mp4 -vf "subtitles=video/captions.srt:force_style='FontName=Segoe UI,FontSize=28,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,MarginV=54,Alignment=2'" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart video/demo.mp4
```

- If the source is not 1920×1080, add `scale=1920:-2:flags=lanczos,` before `subtitles=`.
- If the source is 60 fps, add `-r 30`.
- The `subtitles` filter needs libass. The installed full build has it.
- Run from the project root and use forward slashes. A Windows path like `C:\...` needs the colon escaped (`C\:/...`), so relative paths are easier.
- If `force_style` errors, drop the style first to confirm the captions render, then add it back.

---

## 5. Verify the file

Duration and streams:

```powershell
ffprobe -v error -show_entries format=duration,size:stream=index,codec_type,codec_name,width,height,r_frame_rate -of default=noprint_wrappers=1 video/demo.mp4
```

- Duration ≤ 90.0 s. If it reads 90.1 or more, trim a frame or two and re-check. File size < 40 MB (41,943,040 bytes).
- One video stream: h264, 1920×1080.
- One audio stream: aac, 2 ch, 48000 Hz.

Audio level:

```powershell
ffmpeg -hide_banner -i video/demo.mp4 -af volumedetect -f null NUL 2>&1 | Select-String 'mean_volume|max_volume'
```

Not `-91 dB`.

Watch it muted:

```powershell
ffplay -hide_banner -an video/demo.mp4
```

Every caption readable? No line cut off? If not, raise `FontSize` or `MarginV`, re-burn.

Watch it with sound:

```powershell
ffplay -hide_banner video/demo.mp4
```

Does the chord drop to **three** voices at 2012, return to **four** at 2026, then leave **one voice** decaying in the labelled coda? Does **CODA · COMPOSITION, NOT DATA** appear? If not, the audio or the picture is from the wrong take.

---

## 6. Compress under 40 MB

CRF 20 at 1080p30 for 90 s is usually 15–30 MB. If it is over 40 MB:

```powershell
ffmpeg -y -i video/demo.mp4 -c:v libx264 -preset slow -b:v 2800k -maxrate 3200k -bufsize 6400k -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart video/demo-small.mp4
```

Re-check duration and size. Rename `demo-small.mp4` to `demo.mp4` only after it passes. Keep the master.

---

## 7. Upload unlisted

1. YouTube Studio → **Create → Upload video**.
2. **Title:** `Icecho — The Last Note | 90-second demo (NASA Space Apps 2026)`
3. **Description:**

```
48 Septembers of Arctic sea ice, played as music. 1979: six voices. 2026: four. 2012: three.

Code and app: https://github.com/TheKingOfMoney09/NASA-submission-Icecho
Data: NSIDC Sea Ice Index v4 (G02135), 1979–2026. Visual reference: NASA SVS 5677 (credited; no SVS image is embedded).
Captions are burned in. The audio is the app, recorded live.
AI: concept, mapping and validation criteria by the entrant; code, extraction and documentation AI-assisted (OpenCode). No AI runs in the delivered app.
```

4. **Visibility: Unlisted** — not Private.
5. **Audience:** Not made for kids.
6. **Language:** English.
7. Optional: upload `video/captions.srt` as an English subtitle track too. The burn-in is the guarantee; the track helps search.
8. Publish. Copy the `https://youtu.be/...` link.
9. Open an incognito window, logged out, paste the link. It must play. Captions must be visible with sound off.

---

## 8. Paste the link

- `README.md` → section 2, replace `TBD`.
- `submission/fields.md` → field 2, replace `TBD`.
- Re-run the pre-submit checklist in `submission/fields.md`.

---

## Failure modes

| Symptom | Fix |
|---|---|
| No audio track | Loopback device missing; use OBS Desktop Audio or enable Stereo Mix |
| Silent audio (`-91 dB`) | Same; never use a microphone as a substitute |
| Audio and picture drift | Record in one pass; do not stretch or dub |
| Video is cropped | `-video_size` doesn't match the display; detect it or use OBS display capture |
| Captions don't render | libass missing or path wrong; test `subtitles=` with no style first |
| Captions cut off | FontSize 26–28, MarginV 54, max two lines |
| File > 40 MB | Re-encode at 2.8 Mbps |
| Link 404s incognito | It is Private; set Unlisted |
| App shows placeholder | Wrong build; use `freeze-build` |
| Cursor in shot | `-draw_mouse 0`, or OBS "Capture Cursor" off |
| Notification popup | Focus assist / Do Not Disturb |
| YouTube still processing | Wait; check again in incognito before pasting |

## Do not

- Do not record the final video before the app is frozen.
- Do not add music, whooshes, stock footage or a fake interface.
- Do not use a microphone recording of the speakers.
- Do not upload as Private.
- Do not leave `TBD` in the submission.
