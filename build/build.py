#!/usr/bin/env python3
"""Build dist/TheLastNote.html â€” one offline file.

Owner: 06-INTEGRATION.

    python build/build.py

Produces:
    dist/TheLastNote.html        inline CSS + JS + frames.json + base64 WebP frames
    dist/TheLastNote-lite.html   inline CSS + JS + frames.json, no images (~150 KB)

Deterministic: same inputs -> same bytes. The report is printed, not embedded.
"""

import base64
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app"
DIST = ROOT / "dist"

JS_ORDER = [
    "core.js",
    "loader.js",
    "content.js",
    "audio.js",
    "engine.js",
    "render.js",
    "scroll.js",
    "main.js",
]

FRAMES_TAG = '<script id="frames-data" type="application/json"></script>'


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def strip_js_comments(src: str) -> str:
    """Remove full-line // comments, /* */ blocks and dev-only console noise.

    Conservative on purpose: never touches string contents.
    """
    out = []
    in_block = False
    for raw in src.splitlines():
        line = raw
        if in_block:
            end = line.find("*/")
            if end == -1:
                continue
            line = line[end + 2:]
            in_block = False
        while True:
            start = line.find("/*")
            if start == -1:
                break
            end = line.find("*/", start + 2)
            if end == -1:
                line = line[:start]
                in_block = True
                break
            line = line[:start] + line[end + 2:]
        stripped = line.strip()
        if stripped.startswith("//"):
            continue
        if re.match(r"^console\.(log|debug)\s*\(", stripped):
            continue
        out.append(line.rstrip())
    return "\n".join(out)


def strip_css_comments(src: str) -> str:
    return re.sub(r"/\*.*?\*/", "", src, flags=re.S)


def inline_script(code: str) -> str:
    # An inline <script> must not contain a literal closing tag.
    code = code.replace("</script", "<\\/script")
    return "<script>\n" + code + "\n</script>"


def load_frames(report: dict) -> dict:
    path = APP / "data" / "frames.json"
    if not path.exists():
        report["warnings"].append("app/data/frames.json missing â€” runtime fallback curve will be used")
        return {"frames": []}
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        report["warnings"].append(f"frames.json invalid ({exc}) â€” runtime fallback curve will be used")
        return {"frames": []}


def load_images() -> dict:
    folder = APP / "data" / "frames"
    images = {}
    if not folder.exists():
        return images
    for path in sorted(folder.glob("*.webp")):
        images[path.name] = "data:image/webp;base64," + base64.b64encode(path.read_bytes()).decode("ascii")
    return images


def build(lite: bool) -> dict:
    index_path = APP / "index.html"
    if not index_path.exists():
        raise SystemExit("app/index.html missing â€” nothing to build")

    report = {"warnings": [], "modules": [], "images": 0, "image_bytes": 0}
    html = read(index_path)

    # ---- CSS ----
    css_path = APP / "css" / "style.css"
    if css_path.exists():
        css = strip_css_comments(read(css_path))
        html = html.replace(
            '<link rel="stylesheet" href="css/style.css">',
            "<style>\n" + css + "\n</style>",
        )
    else:
        report["warnings"].append("css/style.css missing â€” shell ships unstyled")

    # ---- JS, in dependency order ----
    for name in JS_ORDER:
        tag = f'<script defer src="js/{name}"></script>'
        path = APP / "js" / name
        if path.exists():
            code = strip_js_comments(read(path))
            html = html.replace(tag, inline_script(code))
            report["modules"].append({
                "name": name,
                "bytes": len(code.encode("utf-8")),
                "mtime": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(path.stat().st_mtime)),
            })
        else:
            html = html.replace(tag, "")
            report["warnings"].append(f"js/{name} missing â€” build continues without it")

    # ---- frames.json ----
    frames = load_frames(report)
    frame_list = frames.get("frames") or []

    # ---- images (full build only) ----
    images = {} if lite else load_images()
    report["images"] = len(images)
    report["image_bytes"] = sum(len(v) for v in images.values())

    out_frames = {
        "dataset": frames.get("dataset"),
        "source": frames.get("source"),
        "unit": frames.get("unit"),
        "frames": [],
    }
    for f in frame_list:
        g = dict(f)
        # Keep the filename: the renderer resolves it through window.EJ_IMAGES
        # (inlined data URIs) first, then falls back to data/frames/<name>.
        out_frames["frames"].append(g)

    payload = json.dumps(out_frames, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = html.replace(
        FRAMES_TAG,
        '<script id="frames-data" type="application/json">' + payload + "</script>",
    )

    if images:
        img_js = "window.EJ_IMAGES=" + json.dumps(images, ensure_ascii=False, separators=(",", ":")) + ";"
        html = html.replace(
            '<script id="frames-data"',
            inline_script(img_js) + '\n<script id="frames-data"',
            1,
        )

    # ---- duplicate id sanity check ----
    ids = re.findall(r'\bid="([^"]+)"', html)
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    if dupes:
        report["warnings"].append("duplicate ids: " + ", ".join(dupes))

    DIST.mkdir(parents=True, exist_ok=True)
    out_name = "TheLastNote-lite.html" if lite else "TheLastNote.html"
    out_path = DIST / out_name
    out_path.write_text(html, encoding="utf-8", newline="\n")

    report["path"] = out_path
    report["bytes"] = out_path.stat().st_size
    report["frames"] = len(out_frames["frames"])
    return report


def print_report(report: dict) -> None:
    print("build report - " + time.strftime("%Y-%m-%d %H:%M:%S"))
    print("  output       : " + str(report["path"]))
    print("  bytes        : " + f'{report["bytes"]:,}')
    print("  frames       : " + str(report["frames"]))
    print("  images       : " + f'{report["images"]} ({report["image_bytes"]:,} bytes inlined)')
    print("  modules      :")
    for m in report["modules"]:
        print(f'    - {m["name"]:<11} {m["bytes"]:>8,} bytes   {m["mtime"]}')
    for warning in report["warnings"]:
        print("  warning      : " + warning)


def main() -> int:
    full = build(lite=False)
    lite = build(lite=True)
    print_report(full)
    print("")
    print_report(lite)
    print("")
    print("ok: dist/TheLastNote.html and dist/TheLastNote-lite.html written")
    return 0


if __name__ == "__main__":
    sys.exit(main())

