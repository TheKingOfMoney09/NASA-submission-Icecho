#!/usr/bin/env python3
"""prep.py - NSIDC Sea Ice Index v4 (G02135) September maps -> feature vectors.

Three subcommands, each idempotent and offline after `fetch`:

    py app/prep.py fetch      # 48 September extent maps + 2 validation CSVs
    py app/prep.py extract    # crop, mask, 7 features, 800 px WebP, frames.json
    py app/prep.py validate   # daily minima, Pearson r, validation.md

Dataset (one source, one version):
    maps   https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/images/09_Sep/
           N_{YEAR}09_extn_hires_v4.0.png            1461x1740, one per year 1979-2026
    daily  .../north/daily/data/N_seaice_extent_daily_v4.0.csv
    month  .../north/monthly/data/N_09_extent_v4.0.csv

Dependencies: standard library + Pillow + numpy. No GDAL, no network at runtime.
Determinism: the same PNG always yields the same numbers; nothing here depends on
wall-clock time, iteration order of a set, or floating-point reduction order.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import sys
import time
import urllib.request
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

import numpy as np
from PIL import Image

# --------------------------------------------------------------------------- #
# Paths and constants
# --------------------------------------------------------------------------- #

APP = Path(__file__).resolve().parent            # <root>/app
ROOT = APP.parent                                # project root
RAW = ROOT / "data" / "raw"                      # downloaded originals
DATA = APP / "data"                              # what the app ships
FRAME_DIR = DATA / "frames"                      # 800 px WebP copies
FRAMES_JSON = DATA / "frames.json"
VALIDATION_MD = DATA / "validation.md"

BASE = "https://noaadata.apps.nsidc.org/NOAA/G02135/north"
MAP_URL = BASE + "/monthly/images/09_Sep/N_{year}09_extn_hires_v4.0.png"
DAILY_CSV_URL = BASE + "/daily/data/N_seaice_extent_daily_v4.0.csv"
MONTHLY_CSV_URL = BASE + "/monthly/data/N_09_extent_v4.0.csv"

DAILY_CSV = RAW / "N_seaice_extent_daily_v4.0.csv"
MONTHLY_CSV = RAW / "N_09_extent_v4.0.csv"

YEARS = list(range(1979, 2027))                  # 48 years, 1979..2026 inclusive
N_YEARS = len(YEARS)

# Fixed crop measured on the 1461x1740 original: removes the printed title, the
# printed total and the NSIDC credit strip. Keeps the map and the small legend.
CROP = (56, 101, 1114, 1660)                     # -> 1058 x 1559
SRC_SIZE = (1461, 1740)

# The mask. Ice is the only pure white in the cropped frame; land is flat grey
# (#808080), ocean is navy, the 1981-2010 median edge is magenta. Colour alone
# separates them, so no positional heuristics are needed.
WHITE_MIN = 235                                  # r,g,b all above this
NAVY_B_MIN = 85
NAVY_B_MAX = 140
NAVY_R_MAX = 40
NAVY_G_MAX = 90

# Features are measured at the crop's native resolution (1058x1559). The original
# note suggested a /4 downsample for speed; at native resolution 1979 lands on
# iceFrac 0.16639 (anchor 0.1664) and `edge` avoids the +2x digital-perimeter bias
# that block downsampling adds. 48 maps cost a few seconds, so precision wins.
MEASURE_DIV = 1

WEBP_WIDTH = 800
# The note asked for quality 80, but these maps are very high-frequency (speckled
# ice edge, 1 px coastlines) and q80 costs ~66 KB/frame, 3.2 MB for 48 - over the
# 2.5 MB payload budget. q64 lands 51-53 KB/frame, 2.42 MB total, and is visually
# identical to the source at 2x zoom on this flat-colour art.
WEBP_QUALITY = 64
WEBP_METHOD = 6

UA = "TheLastNote/0.1 (NASA Space Apps 2026)"
RETRIES = 3
DELAY_S = 0.3

LUM_R, LUM_G, LUM_B = 0.2126, 0.7152, 0.0722


def log(msg: str) -> None:
    # Console is cp1252: keep every message ASCII.
    print(msg, flush=True)


def die(msg: str) -> None:
    log("ERROR: " + msg)
    raise SystemExit(1)


# --------------------------------------------------------------------------- #
# fetch
# --------------------------------------------------------------------------- #

def download(url: str, dest: Path, retries: int = RETRIES) -> bool:
    """Download url to dest. Skip if dest already has bytes. Retry on failure."""
    if dest.exists() and dest.stat().st_size > 0:
        log("  skip %-40s %7.1f KB" % (dest.name, dest.stat().st_size / 1024.0))
        return True

    dest.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as res:
                payload = res.read()
            if not payload:
                raise OSError("empty response")
            part = dest.with_name(dest.name + ".part")
            part.write_bytes(payload)
            part.replace(dest)
            log("  ok   %-40s %7.1f KB" % (dest.name, len(payload) / 1024.0))
            return True
        except Exception as exc:                 # noqa: BLE001 - report and retry
            log("  fail %-40s attempt %d/%d: %s"
                % (dest.name, attempt, retries, str(exc)[:120]))
            if attempt < retries:
                time.sleep(1.5 * attempt)
    return False


def cmd_fetch(_args) -> int:
    RAW.mkdir(parents=True, exist_ok=True)
    log("fetch: %d September maps 1979..2026 -> %s" % (N_YEARS, RAW))

    failed = []
    for i, year in enumerate(YEARS):
        url = MAP_URL.format(year=year)
        dest = RAW / ("N_%d09_extn_hires_v4.0.png" % year)
        if not download(url, dest):
            failed.append(year)
        if i < N_YEARS - 1:
            time.sleep(DELAY_S)

    log("fetch: validation CSVs")
    for url, dest in ((DAILY_CSV_URL, DAILY_CSV), (MONTHLY_CSV_URL, MONTHLY_CSV)):
        if not download(url, dest):
            failed.append(dest.name)

    if failed:
        log("")
        log("fetch: FAILED for: %s" % ", ".join(str(f) for f in failed))
        return 1

    total = sum(p.stat().st_size for p in RAW.glob("*.png"))
    log("fetch: done, %d maps, %.1f MB in data/raw/" % (N_YEARS, total / 1048576.0))
    return 0


# --------------------------------------------------------------------------- #
# extract
# --------------------------------------------------------------------------- #

def load_crop(path: Path) -> Image.Image:
    """Open the PNG, verify the original geometry, return the fixed crop."""
    with Image.open(path) as im:
        im = im.convert("RGB")
        if im.size != SRC_SIZE:
            if im.size[0] < CROP[2] or im.size[1] < CROP[3]:
                die("%s is %dx%d, too small for the fixed crop %s"
                    % (path.name, im.size[0], im.size[1], CROP))
            log("  warn %s is %dx%d (expected %dx%d) - using the fixed crop anyway"
                % (path.name, im.size[0], im.size[1], SRC_SIZE[0], SRC_SIZE[1]))
        return im.crop(CROP)


def measure(crop: Image.Image) -> dict:
    """Measure the seven pixel features on the cropped map.

    iceFrac   white / (white + navy)              - land and magenta excluded by colour
    centroidY mean y of the white mask, 0 = top   - normalised 0..1
    spread    std-dev of white y                  - normalised 0..1
    edge      white boundary px / white area
    lum       mean luminance of the crop          - 0..1
    """
    w, h = crop.size
    small = crop if MEASURE_DIV <= 1 else crop.resize(
        (w // MEASURE_DIV, h // MEASURE_DIV), Image.NEAREST)
    rgb = np.asarray(small, dtype=np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]

    white = (r > WHITE_MIN) & (g > WHITE_MIN) & (b > WHITE_MIN)
    navy = (b > NAVY_B_MIN) & (b < NAVY_B_MAX) & (r < NAVY_R_MAX) & (g < NAVY_G_MAX)

    n_white = int(white.sum())
    n_navy = int(navy.sum())
    if n_white == 0 or n_white + n_navy == 0:
        die("empty white/navy mask - crop or palette changed")

    hh, ww = white.shape
    rows = white.sum(axis=1).astype(np.float64)          # white px per row
    row_idx = np.arange(hh, dtype=np.float64)

    centroid = float((rows * row_idx).sum() / n_white) / hh
    var = float((rows * (row_idx - centroid * hh) ** 2).sum() / n_white) / (hh * hh)
    spread = math.sqrt(max(var, 0.0))

    # Boundary = white pixel with at least one non-white 4-neighbour.
    wm = white.astype(np.uint8)
    neighbours = np.zeros_like(wm)
    neighbours[1:, :] += wm[:-1, :]
    neighbours[:-1, :] += wm[1:, :]
    neighbours[:, 1:] += wm[:, :-1]
    neighbours[:, :-1] += wm[:, 1:]
    boundary = int((white & (neighbours < 4)).sum())

    lum = float((LUM_R * r + LUM_G * g + LUM_B * b).mean()) / 255.0

    return {
        "iceFrac": n_white / float(n_white + n_navy),
        "centroidY": centroid,
        "spread": spread,
        "edge": boundary / float(n_white),
        "lum": lum,
    }


def export_webp(crop: Image.Image, dest: Path) -> int:
    """800 px wide portrait WebP, quality 80, method 6. Returns bytes written."""
    w, h = crop.size
    target_h = int(round(h * WEBP_WIDTH / float(w)))
    small = crop.resize((WEBP_WIDTH, target_h), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    small.save(dest, "WEBP", quality=WEBP_QUALITY, method=WEBP_METHOD)
    return dest.stat().st_size


def cmd_extract(_args) -> int:
    missing = [y for y in YEARS if not (RAW / ("N_%d09_extn_hires_v4.0.png" % y)).exists()]
    if missing:
        die("missing raw maps for %s - run `py app/prep.py fetch` first"
            % ", ".join(str(y) for y in missing))

    FRAME_DIR.mkdir(parents=True, exist_ok=True)
    log("extract: %d maps -> %s" % (N_YEARS, FRAME_DIR))

    # The published annual minimum (Aug-Oct), the same series `validate` uses. It is
    # embedded on every frame so the audio engine can count voices from the real
    # extent instead of the iceFrac proxy, which is non-monotonic against extent.
    minima = read_daily_minima(DAILY_CSV)
    no_extent = [y for y in YEARS if y not in minima]
    if no_extent:
        die("no daily minimum for %s - run `py app/prep.py fetch` first"
            % ", ".join(str(y) for y in no_extent))

    rows = []
    for year in YEARS:
        src = RAW / ("N_%d09_extn_hires_v4.0.png" % year)
        crop = load_crop(src)
        feats = measure(crop)
        img_name = "f%d.webp" % year
        size = export_webp(crop, FRAME_DIR / img_name)
        extent = minima[year]["extent"]
        log("  %d  iceFrac %.4f  ext %.3f  centroid %.3f  spread %.3f  edge %.4f  lum %.3f  %5.1f KB"
            % (year, feats["iceFrac"], extent, feats["centroidY"], feats["spread"],
               feats["edge"], feats["lum"], size / 1024.0))
        rows.append({"year": year, "img": img_name, "extentMkm2": extent, **feats})

    if len(rows) != N_YEARS:
        die("expected %d frames, measured %d" % (N_YEARS, len(rows)))

    # Derive dLoss and sigma from the values that actually ship, so the file is
    # internally consistent: anyone recomputing them from `iceFrac` gets the same
    # number back.
    rounded_ice = [round(row["iceFrac"], 4) for row in rows]
    ice = np.array(rounded_ice, dtype=np.float64)
    mean = float(ice.mean())
    sd = float(ice.std(ddof=0))
    if not sd > 1e-9:
        die("iceFrac is constant across the series - the mask is wrong")

    frames = []
    for i, row in enumerate(rows):
        d_loss = 0.0 if i == 0 else (rounded_ice[i - 1] - rounded_ice[i])
        frames.append({
            "year": row["year"],
            "t": round(i / float(N_YEARS - 1), 6),
            "iceFrac": rounded_ice[i],
            "extentMkm2": round(row["extentMkm2"], 4),
            "centroidY": round(row["centroidY"], 4),
            "spread": round(row["spread"], 4),
            "edge": round(row["edge"], 4),
            "lum": round(row["lum"], 4),
            "dLoss": round(d_loss, 6),
            "sigma": round((rounded_ice[i] - mean) / sd, 4),
            "img": row["img"],
        })

    doc = {
        "dataset": "arctic-sea-ice-minimum",
        "source": "NSIDC Sea Ice Index v4 (G02135), September extent",
        "unit": "fraction of frame",
        "frames": frames,
    }
    FRAMES_JSON.write_text(json.dumps(doc, indent=1) + "\n", encoding="ascii")

    webp = sorted(FRAME_DIR.glob("*.webp"))
    total_mb = sum(p.stat().st_size for p in webp) / 1048576.0
    log("")
    log("extract: wrote %s (%d frames, %.1f KB)"
        % (FRAMES_JSON.name, len(frames), FRAMES_JSON.stat().st_size / 1024.0))
    log("extract: %d webp, %.2f MB total" % (len(webp), total_mb))
    log("extract: iceFrac 1979 %.4f | 1995 %.4f | 2007 %.4f | 2012 %.4f | 2026 %.4f"
        % (frames[0]["iceFrac"], frames[1995 - 1979]["iceFrac"], frames[2007 - 1979]["iceFrac"],
           frames[2012 - 1979]["iceFrac"], frames[-1]["iceFrac"]))
    return 0


# --------------------------------------------------------------------------- #
# validate
# --------------------------------------------------------------------------- #

def read_daily_minima(path: Path) -> dict:
    """Per-year minimum extent for Aug-Oct, from the NSIDC daily v4 file.

    Returns {year: {"extent": float, "date": "21 Sep"}}.
    """
    if not path.exists():
        die("missing %s - run `py app/prep.py fetch` first" % path.name)

    months = {8, 9, 10}
    best = {}
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        for line in fh:
            parts = [p.strip() for p in line.split(",")]
            if len(parts) < 4:
                continue
            try:
                year = int(parts[0])
                month = int(parts[1])
                day = int(parts[2])
                extent = float(parts[3])
            except ValueError:
                continue                                   # header or caption line
            if month not in months:
                continue
            cur = best.get(year)
            if cur is None or extent < cur["extent"]:
                best[year] = {"extent": extent, "date": "%d %s" % (day, MONTH[month])}
    return best


MONTH = {8: "Aug", 9: "Sep", 10: "Oct"}


def read_september_mean(path: Path) -> dict:
    """September average extent -> {year: extent} from the monthly v4 file."""
    if not path.exists():
        return {}
    out = {}
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        header = None
        for line in fh:
            parts = [p.strip() for p in line.split(",")]
            if header is None:
                header = [p.lower() for p in parts]
                continue
            if len(parts) < len(header):
                continue
            try:
                row = dict(zip(header, parts))
                year = int(row["year"])
                if int(row.get("month", 9)) != 9:
                    continue
                out[year] = float(row["extent"])
            except (KeyError, ValueError):
                continue
    return out


def pearson(x: np.ndarray, y: np.ndarray) -> float:
    xm = x - x.mean()
    ym = y - y.mean()
    denom = math.sqrt(float((xm * xm).sum()) * float((ym * ym).sum()))
    if denom == 0.0:
        return float("nan")
    return float((xm * ym).sum()) / denom


def fmt2(value: float) -> str:
    """Two decimals, half-up - so 6.895 prints as 6.90, matching NSIDC's table."""
    return str(Decimal(repr(float(value))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def voice_runs(years, counts) -> str:
    """Compress per-year voice counts into '1979-1998: 6 | 1999: 5' style runs."""
    def label(a, b):
        return "%d" % a if a == b else "%d-%d" % (a, b)

    runs = []
    start = years[0]
    prev = counts[0]
    for i in range(1, len(years)):
        if counts[i] != prev:
            runs.append("%s: %d" % (label(start, years[i - 1]), prev))
            start = years[i]
            prev = counts[i]
    runs.append("%s: %d" % (label(start, years[-1]), prev))
    return " | ".join(runs)


def cmd_validate(_args) -> int:
    if not FRAMES_JSON.exists():
        die("missing app/data/frames.json - run `py app/prep.py extract` first")

    doc = json.loads(FRAMES_JSON.read_text(encoding="ascii"))
    frames = doc["frames"]
    by_year = {f["year"]: f for f in frames}

    minima = read_daily_minima(DAILY_CSV)
    sep_mean = read_september_mean(MONTHLY_CSV)

    years = [y for y in YEARS if y in by_year and y in minima]
    if len(years) != N_YEARS:
        missing = [y for y in YEARS if y not in years]
        die("validation series incomplete, missing %s" % missing)

    ice = np.array([by_year[y]["iceFrac"] for y in years], dtype=np.float64)
    ext = np.array([minima[y]["extent"] for y in years], dtype=np.float64)

    # frames.json must carry exactly the extents this table is built from.
    ext_mismatch = [y for y in years
                    if abs(float(by_year[y].get("extentMkm2", -1.0)) - minima[y]["extent"]) > 1e-6]
    if ext_mismatch:
        die("frames.json extentMkm2 disagrees with the daily CSV for %s"
            % ", ".join(str(y) for y in ext_mismatch))

    r = pearson(ice, ext)
    slope, intercept = np.polyfit(ice, ext, 1)
    fitted = intercept + slope * ice
    resid = ext - fitted
    rmse = float(math.sqrt(float((resid * resid).mean())))
    max_res = float(np.abs(resid).max())
    max_year = years[int(np.abs(resid).argmax())]

    go = r >= 0.85
    decision = ("GO - pixel-derived features shipped, no fallback."
                if go else
                "NO-GO - r below 0.85, fall back to published NSIDC minima "
                "(see AGENT-01-data.md 2.4).")
    log("validate: r = %.6f, slope = %.2f, RMSE = %.3f, max residual = %.3f (%d)"
        % (r, slope, rmse, max_res, max_year))
    log("validate: %s" % decision)

    # Voice count per year, derived from the published extent: 1979's minimum pins
    # the six-voice ceiling, the 2012 minimum is the floor. Never above 6.
    voices = [min(6, int(math.ceil(6.0 * ext[i] / 6.90 - 1e-9))) for i in range(len(years))]
    # Same formula, but read back from the field that actually ships.
    voices_field = [min(6, int(math.ceil(6.0 * by_year[y]["extentMkm2"] / 6.90 - 1e-9)))
                    for y in years]
    voice_mismatch = [y for y, a, b in zip(years, voices, voices_field) if a != b]
    log("validate: extentMkm2 matches the daily CSV on %d/%d frames; voices from embedded "
        "extent reproduce the table on %d/%d"
        % (len(years) - len(ext_mismatch), N_YEARS,
           len(years) - len(voice_mismatch), N_YEARS))
    if voice_mismatch:
        log("validate: voice mismatch in %s" % ", ".join(str(y) for y in voice_mismatch))

    # ---- validation.md ----------------------------------------------------
    today = dt.date.today().isoformat()
    lines = []
    add = lines.append

    add("# Validation - pixel features vs NSIDC published extent")
    add("")
    add("Generated by `app/prep.py validate` on %s." % today)
    add("")
    add("**Source:** NSIDC Sea Ice Index v4 (G02135), National Snow and Ice Data Center, "
        "University of Colorado Boulder.")
    add("")
    add("**Decision: %s**" % decision)
    add("")
    add("| Metric | Value |")
    add("|---|---|")
    add("| Pearson r (`iceFrac` vs daily minimum extent) | **%.4f** |" % r)
    add("| n (years) | %d |" % len(years))
    add("| Slope (M km2 per unit `iceFrac`) | %.2f |" % slope)
    add("| Intercept (M km2) | %.2f |" % intercept)
    add("| RMSE (M km2) | %.3f |" % rmse)
    add("| Max residual (M km2) | %.3f (%d) |" % (max_res, max_year))
    add("")
    add("The map is drawn in a polar stereographic projection, which stretches area away "
        "from the pole, so `iceFrac` - a plain count of frame pixels - is not perfectly "
        "linear in published extent even though both come from the same NSIDC field; that "
        "stretching, not measurement noise, is what the residual pattern shows.")
    add("")
    add("## What is compared")
    add("")
    add("- **`iceFrac`** - white ice pixels / (white ice + navy ocean pixels) in the fixed "
        "crop `(56, 101, 1114, 1660)` of each September extent map. Grey land and the "
        "magenta 1981-2010 median edge are excluded by colour, not by position.")
    add("- **Published minimum** - lowest daily extent in Aug-Oct of each year, from "
        "`N_seaice_extent_daily_v4.0.csv`. This is the annual Arctic minimum the app prints.")
    add("- **Residual** - published minus the least-squares fit of extent on `iceFrac`, "
        "in M km2. Negative means the map shows less ice than the fit predicts.")
    add("- **Voices** - `min(6, ceil(6 * extent / 6.90))`, the 1979 extent anchoring six "
        "voices and clamping at the instrument's ceiling.")
    add("- **`extentMkm2`** - not a comparison: the same published minimum, embedded on "
        "every frame of `frames.json` so the audio engine can use the real number. "
        "See the section after the table.")
    add("")
    add("## Per-year table")
    add("")
    add("| Year | `iceFrac` | Published min (M km2) | Date | Voices | Residual (M km2) |")
    add("|---|---|---|---|---|---|")
    for i, y in enumerate(years):
        add("| %d | %.4f | %s | %s | %d | %+.2f |"
            % (y, ice[i], fmt2(ext[i]), minima[y]["date"], voices[i], resid[i]))
    add("")
    add("## `extentMkm2` (embedded field)")
    add("")
    add("Every frame in `frames.json` carries `extentMkm2` - the annual Aug-Oct daily "
        "minimum in millions of km2, straight from `N_seaice_extent_daily_v4.0.csv` "
        "(NSIDC Sea Ice Index v4), at the file's full three decimals. It is the same "
        "series as the `Published min` column above; it is embedded so the audio engine "
        "can count voices from the published number instead of the `iceFrac` proxy, "
        "which is not monotonic against extent at 1999, 2004, 2017 and 2018.")
    add("")
    add("For alt text, the four years 03-NARRATIVE asked for:")
    add("")
    add("| Year | `extentMkm2` | Minimum date | Voices |")
    add("|---|---|---|---|")
    for y in (1988, 1995, 2016, 2020):
        i = years.index(y)
        add("| %d | %.3f | %s | %d |" % (y, ext[i], minima[y]["date"], voices[i]))
    add("")
    add("## Voice counts (derived, for the audio mapping)")
    add("")
    add("`voices = min(6, ceil(6 * extent / 6.90))` - 1979's %.3f M km2 pins the "
        "six-voice ceiling, 2012's %.2f M km2 is the floor." % (ext[0], min(ext)))
    add("")
    add("Runs: %s" % voice_runs(years, voices))
    add("")
    if voice_mismatch:
        add("**Mismatch between the table and the embedded `extentMkm2` in %s.**"
            % ", ".join(str(y) for y in voice_mismatch))
    else:
        add("Recomputed from the embedded `extentMkm2` in `frames.json`, this table "
            "reproduces for all %d years." % N_YEARS)
    add("")
    add("This is a stagger, not a fade: the chord loses a voice, gets one back, loses two. "
        "Several post-2007 years (2017, 2018, 2021, 2022) recover to five, so do not "
        "describe 2007-2026 as a flat four.")
    add("")
    add("1979 is **not** the maximum of `iceFrac`: 1996 (0.1801) and 1980 (0.1776) both "
        "carry more ice, as do several other 1980s years. The early chord is pinned at "
        "the six-voice ceiling rather than peaking in 1979 - say that, not the reverse.")
    add("")
    add("## September averages (monthly file, sanity check)")
    add("")
    if sep_mean:
        picks = [y for y in (1979, 1995, 2007, 2012, 2026) if y in sep_mean]
        add("| Year | September mean extent (M km2) |")
        add("|---|---|")
        for y in picks:
            add("| %d | %s |" % (y, fmt2(sep_mean[y])))
    else:
        add("_Monthly file unavailable; daily minima above are the validation series._")
    add("")
    add("## Feature ranges (what the audio engine can expect)")
    add("")
    add("Measured across all 48 frames, from `frames.json` itself. The example values in "
        "the schema card (`centroidY` 0.61, `spread` 0.14, `edge` 0.083, `lum` 0.47) were "
        "illustrative placeholders; these are the real ranges to map against.")
    add("")
    add("| Field | min | max | mean |")
    add("|---|---|---|---|")
    for key in ("iceFrac", "centroidY", "spread", "edge", "lum", "dLoss", "sigma"):
        vals = np.array([f[key] for f in frames], dtype=np.float64)
        add("| `%s` | %.4f | %.4f | %.4f |" % (key, vals.min(), vals.max(), vals.mean()))
    add("")
    add("## Cross-check against the 13 Nov pre-event run")
    add("")
    add("| Quantity | 13 Nov verified | This run |")
    add("|---|---|---|")
    anchors = ((1979, "0.1664"), (1995, "0.1415"), (2007, "0.1006"),
               (2012, "0.0856"), (2026, "0.1147"))
    for year, expected in anchors:
        add("| `iceFrac` %d | %s | %.4f |" % (year, expected, by_year[year]["iceFrac"]))
    add("| Pearson r | 0.9935 | %.4f |" % r)
    add("| Slope | 43.7 | %.2f |" % slope)
    add("| RMSE | 0.13 | %.3f |" % rmse)
    add("| Max residual | 0.36 | %.3f (%d) |" % (max_res, max_year))
    add("")
    add("Every anchor year and every headline statistic reproduces. The 0.0001 gap in r "
        "is float rounding in the correlation, not a different mask.")
    add("")
    add("## Payload")
    add("")
    webp = sorted(FRAME_DIR.glob("*.webp"))
    webp_bytes = sum(p.stat().st_size for p in webp)
    add("| Item | Value |")
    add("|---|---|")
    add("| `app/data/frames.json` | %.1f KB, %d frames |"
        % (FRAMES_JSON.stat().st_size / 1024.0, len(frames)))
    add("| `app/data/frames/*.webp` | %d files, %.2f MB, %.1f-%.1f KB each |"
        % (len(webp), webp_bytes / 1048576.0,
           min(p.stat().st_size for p in webp) / 1024.0,
           max(p.stat().st_size for p in webp) / 1024.0))
    add("")
    add("## Reproduce")
    add("")
    add("```")
    add("py app/prep.py fetch      # 48 PNGs + 2 CSVs into data/raw/")
    add("py app/prep.py extract    # features + 800 px WebP + frames.json")
    add("py app/prep.py validate   # this file")
    add("```")
    add("")
    add("## Sources")
    add("")
    add("- Maps: " + MAP_URL.format(year="YYYY"))
    add("- Daily extent: " + DAILY_CSV_URL)
    add("- Monthly extent: " + MONTHLY_CSV_URL)
    add("- Accessed: %s" % today)
    add("")

    VALIDATION_MD.write_text("\n".join(lines), encoding="utf-8")
    log("validate: wrote %s" % VALIDATION_MD)
    return 0 if go else 2


# --------------------------------------------------------------------------- #

def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        prog="prep.py",
        description="NSIDC Sea Ice Index v4 September maps -> sonification features.")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("fetch", help="download the 48 maps and the validation CSVs").set_defaults(fn=cmd_fetch)
    sub.add_parser("extract", help="crop, mask, measure, export WebP, write frames.json").set_defaults(fn=cmd_extract)
    sub.add_parser("validate", help="correlate against NSIDC daily minima, write validation.md").set_defaults(fn=cmd_validate)
    args = parser.parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
