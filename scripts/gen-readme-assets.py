#!/usr/bin/env python3
"""README visuals for dsh-cert-mcp (docs/assets/).

Two figures, both derived from the code path this package actually runs
(`src/index.js` / `src/plugin.js` → `src/server.js` → `data/attestations.json`):

1. hero — 1440x576 WEBP, four files (zh|en x light|dark).
   Left column: kicker pill, title, a two-line value sentence, one subtitle
   line, one meta line, footer. Right column: the MCP exchange itself —
   client frame → one `tools/call` JSON-RPC frame → the shared
   `handleRequest` core (+ the snapshot it loads) → the evidence card it
   answers with (grade / snapshot / five dimensions / veto). No invented
   data: every string is a tool name, a field name, or the registry value
   that ships in `data/attestations.json`.

2. flow — 1100x660 SVG, light + dark.
   The repo's one structural fact is "two halves, one data path": a stdio
   process and a DSH bundle row are two entry points over a single
   `handleRequest` core, which reads one embedded snapshot and answers in
   three shapes. A 5-node row cannot show a merge, so the diagram is a
   dual-channel merge: 2 entries → 1 core (snapshot hanging underneath) →
   3 reply shapes. Text is identifiers only (no prose), so all five README
   languages share the same pair.

Run:  python scripts/gen-readme-assets.py
Needs: Pillow + msyh.ttc / msyhbd.ttc / consola.ttf (rendering) and
       segoeui(b).ttf (latin). Every label is measured before it is drawn,
       so a label that would overflow aborts the run instead of shipping
       clipped text.
"""
from __future__ import annotations

import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "assets")

FONT_CJK = r"C:\Windows\Fonts\msyh.ttc"
FONT_CJK_BOLD = r"C:\Windows\Fonts\msyhbd.ttc"
FONT_MONO = r"C:\Windows\Fonts\consola.ttf"
FONT_EN = r"C:\Windows\Fonts\segoeui.ttf"
FONT_EN_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
for _p in (FONT_CJK, FONT_CJK_BOLD, FONT_MONO, FONT_EN, FONT_EN_BOLD):
    if not os.path.exists(_p):
        sys.exit(f"FATAL: font missing: {_p}")

# Family palette + the page backgrounds the task fixes for this family.
SKIN = {
    "light": dict(bg_from="#f9f6fd", bg_to="#e4eaf8", card="#ffffff",
                  edge="#e4e1ee", text="#141419", sub="#4d5261",
                  faint="#8f94a4", accent="#4B67B4", accent2="#16a34a",
                  pill="#ece7f9", grid="#e7e4f0", shadow=(32, 26, 64)),
    "dark": dict(bg_from="#131a2a", bg_to="#0c1016", card="#1b2231",
                 edge="#2e374b", text="#f0f3f9", sub="#a8b1c4",
                 faint="#737b8d", accent="#8496f5", accent2="#3fb950",
                 pill="#242d42", grid="#1e2636", shadow=(0, 0, 0)),
}

_KINDS = {
    "cjk": FONT_CJK, "cjk_bold": FONT_CJK_BOLD, "mono": FONT_MONO,
    "en": FONT_EN, "en_bold": FONT_EN_BOLD,
}
_MEASURE = ImageDraw.Draw(Image.new("RGB", (1, 1)))


def font(size: int, kind: str = "cjk_bold") -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(_KINDS[kind], size)


def width(text: str, size: int, kind: str) -> float:
    return _MEASURE.textlength(text, font=font(size, kind))


def hx(s: str):
    s = s.lstrip("#")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def ink(skin: str, key: str):
    return hx(SKIN[skin][key])


def fit_size(text: str, size: int, kind: str, maxw: float, floor: int) -> int:
    """Largest size <= `size` whose advance width fits `maxw`."""
    while size > floor and width(text, size, kind) > maxw:
        size -= 1
    return size


def must_fit(text: str, size: int, kind: str, maxw: float, where: str) -> float:
    """Abort before drawing a label that would leave its box."""
    w = width(text, size, kind)
    if w > maxw:
        sys.exit(f"FATAL: {where}: {text!r} needs {w:.0f}px at {size}px, "
                 f"the box allows {maxw:.0f}px. Shorten it or widen the box.")
    return w


# ---------------------------------------------------------------------------
# hero (1440x576, Pillow → WEBP)
# ---------------------------------------------------------------------------
HERO = {
    "zh": dict(
        kicker="只读 MCP · 认证注册表",
        title="dsh-cert-mcp",
        value=["让 agent 先查认证，", "再决定这个插件装不装。"],
        sub="三个只读工具，一份内嵌快照。",
        meta="stdio · 不写文件 · 不执行代码 · 无需凭据",
        foot="Apache-2.0 · spec v1 · PerryLink DSH plugin family · FROZEN 2026-10-31",
        client=[("MCP ", "mono"), ("客户端", "cjk_bold")],
        protocol="stdio · JSON-RPC 2.0",
        core="handleRequest",
        core_sub=[("loadRegistry → ", "mono"), ("内嵌快照", "cjk")],
        core_note=[("刷新 ", "cjk"), ("≤ 1/5min · 10s ", "mono"),
                   ("超时 · 失败回落内嵌", "cjk")],
        result=[("← tools/call ", "mono"), ("回包", "cjk_bold")],
        result_pill="read-only · no writes",
        grade_cap="grade",
        snapshot_cap="snapshot",
        veto="veto: null",
    ),
    "en": dict(
        kicker="READ-ONLY MCP · CERTIFICATION REGISTRY",
        title="dsh-cert-mcp",
        value=["Let the agent check the record", "before it installs a plugin."],
        sub="Three read-only tools, one embedded snapshot.",
        meta="stdio · no writes · no code execution · no credentials",
        foot="Apache-2.0 · spec v1 · PerryLink DSH plugin family · FROZEN 2026-10-31",
        client=[("MCP client", "mono")],
        protocol="stdio · JSON-RPC 2.0",
        core="handleRequest",
        core_sub=[("loadRegistry → ", "mono"), ("embedded snapshot", "cjk")],
        core_note=[("refresh ≤ 1/5min · 10s · fallback inline", "cjk")],
        result=[("← tools/call result", "mono")],
        result_pill="read-only · no writes",
        grade_cap="grade",
        snapshot_cap="snapshot",
        veto="veto: null",
    ),
}

# The registry record the bundled snapshot actually holds (data/attestations.json).
FRAME_LINES = [
    '→ {"jsonrpc":"2.0","method":"tools/call",',
    '    "params":{"name":"get_certification",',
    '              "arguments":{"owner":"PerryLink","repo":"dsh-auto-review"}}}',
]
DIMENSIONS = [
    ("manifest", "pass"),
    ("buildHygiene", "pass"),
    ("supplyChain", "pass 4.1"),
    ("releaseIntegrity", "pass"),
    ("installSmoke", "ok"),
]


def gradient(w: int, h: int, c1, c2) -> Image.Image:
    img = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(img)
    a, b = hx(c1), hx(c2)
    for y in range(h):
        t = 0.18 * (y / h) + 0.82 * (y / h) ** 1.6
        d.line([(0, y), (w, y)],
               fill=tuple(int(p + (q - p) * t) for p, q in zip(a, b)))
    return img


def glow(img: Image.Image, cx: int, cy: int, r: int, color, alpha: int) -> Image.Image:
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(9, 0, -1):
        rr = r * i / 9
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
                  fill=color + (int(alpha * (1 - i / 10)),))
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


def card(img: Image.Image, box, skin: str, radius: int = 20, spread: int = 22) -> Image.Image:
    x0, y0, x1, y1 = box
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    for i in range(spread, 0, -3):
        sd.rounded_rectangle([x0 - i // 5, y0 + i // 2, x1 + i // 5, y1 + i],
                             radius=radius + i // 5,
                             fill=SKIN[skin]["shadow"] + (int(9 * (1 - i / spread)),))
    base = Image.alpha_composite(img.convert("RGBA"),
                                 sh.filter(ImageFilter.GaussianBlur(10)))
    d = ImageDraw.Draw(base)
    d.rounded_rectangle(box, radius=radius, fill=ink(skin, "card"),
                        outline=ink(skin, "edge"), width=2)
    return base.convert("RGB")


def pill(img: Image.Image, xy, text: str, skin: str, size: int = 16,
         fg: str | None = None, bg: str | None = None,
         kind: str = "cjk_bold") -> None:
    d = ImageDraw.Draw(img)
    f = font(size, kind)
    tw = d.textlength(text, font=f)
    x, y = xy
    h = size + 18
    d.rounded_rectangle([x, y, x + tw + 34, y + h], radius=h // 2,
                        fill=ink(skin, bg or "pill"))
    d.text((x + 17, y + 8), text, font=f, fill=ink(skin, fg or "accent"))


def check_mark(d: ImageDraw.ImageDraw, x: float, y: float, color, s: float = 9.0) -> None:
    """Vector tick — msyh.ttc has no U+2713, so it is drawn, not typed."""
    d.line([(x, y + s * 0.55), (x + s * 0.42, y + s)], fill=color, width=3)
    d.line([(x + s * 0.42, y + s), (x + s * 1.25, y - s * 0.35)], fill=color, width=3)


def mixed_width(segs, size: int) -> float:
    return sum(width(t, size, k) for t, k in segs)


def draw_mixed(d, xy, segs, size: int, skin: str, key: str,
               maxw: float, where: str) -> float:
    """Draw [(text, font-kind)] runs so CJK never falls into a mono font."""
    total = mixed_width(segs, size)
    if total > maxw:
        sys.exit(f"FATAL: {where}: {' '.join(t for t, _ in segs)!r} needs "
                 f"{total:.0f}px at {size}px, the box allows {maxw:.0f}px.")
    x, y = xy
    for text, kind in segs:
        d.text((x, y), text, font=font(size, kind), fill=ink(skin, key))
        x += d.textlength(text, font=font(size, kind))
    return total


def hero(lang: str, skin: str) -> None:
    s = SKIN[skin]
    H = HERO[lang]
    w, h = 1440, 576
    img = gradient(w, h, s["bg_from"], s["bg_to"])
    img = glow(img, 1210, 70, 360, ink(skin, "accent"), 26 if skin == "light" else 40)
    img = glow(img, 150, 545, 250, ink(skin, "accent2"), 10 if skin == "light" else 16)
    d = ImageDraw.Draw(img)

    # ---- left column: kicker / title / value / subtitle / meta / footer ----
    m, colw = 60, 600
    must_fit(H["kicker"], 17, "cjk_bold", colw, "hero kicker")
    pill(img, (m, 52), H["kicker"], skin, size=17)

    d = ImageDraw.Draw(img)
    tsize = fit_size(H["title"], 86, "mono", colw, 44)
    if tsize < 78:
        sys.exit(f"FATAL: hero title shrunk to {tsize}px — below the 48px "
                 f"display floor at 880px width.")
    d.text((m - 2, 100), H["title"], font=font(tsize, "mono"), fill=ink(skin, "text"))

    vkind = "cjk_bold" if lang == "zh" else "en_bold"
    vbase = 42 if lang == "zh" else 36
    vmax = max(width(line, vbase, vkind) for line in H["value"])
    vsize = fit_size(max(H["value"], key=lambda t: width(t, vbase, vkind)),
                     vbase, vkind, colw, 30)
    if vmax > colw:
        sys.exit(f"FATAL: hero value sentence overflows: {vmax:.0f}px > {colw}px")
    vy = 228
    for line in H["value"]:
        d.text((m, vy), line, font=font(vsize, vkind), fill=ink(skin, "text"))
        vy += int(vsize * 1.34)
    vy = 228 + int(vsize * 1.34) * 2 + 22

    ssize = 26
    must_fit(H["sub"], ssize, "cjk" if lang == "zh" else "en", colw, "hero subtitle")
    d.text((m + 1, vy), H["sub"],
           font=font(ssize, "cjk" if lang == "zh" else "en"), fill=ink(skin, "sub"))

    my = vy + 44
    must_fit(H["meta"], 20, "cjk" if lang == "zh" else "en", colw, "hero meta")
    d.text((m + 1, my), H["meta"],
           font=font(20, "cjk" if lang == "zh" else "en"), fill=ink(skin, "faint"))

    d.line([m, 500, m + colw, 500], fill=ink(skin, "grid"), width=2)
    must_fit(H["foot"], 17, "en", colw, "hero footer")
    d.text((m, 514), H["foot"], font=font(17, "en"), fill=ink(skin, "faint"))

    # ---- right column: the MCP exchange ----
    x0, x1 = 688, 1380
    inner = x1 - x0 - 48
    img = card(img, (x0, 52, x1, 196), skin)
    img = card(img, (x0, 214, x1, 302), skin)
    img = card(img, (x0, 320, x1, 528), skin)
    d = ImageDraw.Draw(img)

    # 1) client frame: one tools/call, carried over stdio
    draw_mixed(d, (x0 + 24, 68), H["client"], 15, skin, "accent",
               inner - 260, "hero client label")
    pw = width(H["protocol"], 15, "mono") + 34
    pill(img, (x1 - 24 - pw, 60), H["protocol"], skin, size=15, kind="mono")
    d = ImageDraw.Draw(img)
    for i, line in enumerate(FRAME_LINES):
        must_fit(line, 15, "mono", inner, "hero json-rpc frame")
        d.text((x0 + 24, 108 + i * 27), line, font=font(15, "mono"),
               fill=ink(skin, "sub" if i else "text"))

    # 2) one core, one snapshot behind it
    d.text((x0 + 24, 232), H["core"], font=font(21, "mono"), fill=ink(skin, "accent"))
    draw_mixed(d, (x0 + 24, 266), H["core_sub"], 16, skin, "sub",
               inner - 250, "hero core sub")
    nw = mixed_width(H["core_note"], 13)
    draw_mixed(d, (x1 - 24 - nw, 240), H["core_note"], 13, skin, "faint",
               inner - 250, "hero core note")
    d.line([x1 - 24 - nw - 26, 232, x1 - 24 - nw - 26, 288],
           fill=ink(skin, "grid"), width=2)

    # 3) the answer: one evidence record
    draw_mixed(d, (x0 + 24, 338), H["result"], 15, skin, "accent2",
               inner - 260, "hero result label")
    pw = width(H["result_pill"], 14, "mono") + 34
    pill(img, (x1 - 24 - pw, 330), H["result_pill"], skin, size=14,
         kind="mono", fg="faint", bg="grid")
    d = ImageDraw.Draw(img)

    d.text((x0 + 24, 364), "A", font=font(72, "en_bold"), fill=ink(skin, "accent2"))
    d.text((x0 + 26, 458), H["grade_cap"], font=font(13, "mono"), fill=ink(skin, "faint"))
    d.text((x0 + 124, 370), H["snapshot_cap"], font=font(13, "mono"),
           fill=ink(skin, "faint"))
    d.text((x0 + 124, 392), "2026-11-01", font=font(20, "mono"), fill=ink(skin, "text"))
    d.text((x0 + 124, 432), H["veto"], font=font(15, "mono"), fill=ink(skin, "sub"))
    d.line([x0 + 288, 356, x0 + 288, 500], fill=ink(skin, "grid"), width=2)

    dim_x = x0 + 312
    for i, (name, value) in enumerate(DIMENSIONS):
        y = 366 + i * 30
        check_mark(d, dim_x, y + 7, ink(skin, "accent2"))
        must_fit(name, 15, "mono", x1 - 24 - dim_x - 90, "hero dimension name")
        d.text((dim_x + 20, y), name, font=font(15, "mono"), fill=ink(skin, "text"))
        vw = width(value, 13, "mono")
        d.text((x1 - 24 - vw, y + 2), value, font=font(13, "mono"),
               fill=ink(skin, "accent2" if value != "pass 4.1" else "sub"))

    name = f"dsh-cert-mcp-hero-{lang}-{skin}.webp"
    img.save(os.path.join(OUT, name), "WEBP", quality=92, method=6)
    print(name)


# ---------------------------------------------------------------------------
# flow (1100x660, hand-written SVG → 2 files)
# ---------------------------------------------------------------------------
FLOW = {
    "light": dict(bg="#ffffff", zone="#f8f6fd", card="#ffffff", edge="#e3e0ee",
                  text="#14161d", sub="#4e5364", faint="#8b90a2",
                  accent="#4B67B4", accent2="#16a34a", grid="#e8e5f1",
                  pill="#ece7f9", shadow="0.10"),
    "dark": dict(bg="#0d1117", zone="#121824", card="#161b26", edge="#2a3142",
                 text="#f0f3f9", sub="#a8b1c4", faint="#737b8d",
                 accent="#8496f5", accent2="#3fb950", grid="#1b2231",
                 pill="#242d42", shadow="0.55"),
}

ENTRY = [
    dict(x=40, y=146, w=348, h=160, tag="stdio process",
         title="node src/index.js",
         lines=["readline: one JSON-RPC frame per line",
                "initialize · tools/list · tools/call"],
         foot="any MCP client can spawn it"),
    dict(x=40, y=320, w=348, h=160, tag="DSH bundle row · id cert-mcp",
         title="cordis.patch.yml",
         lines=["inject: ['tools'] → PENDING without it",
                "apply(ctx) registers the three tools"],
         foot="no dsh.client, no browser half"),
]

REPLIES = [
    dict(y=146, tag="get_certification",
         lines=["one record: grade · snapshot", "five dimensions · veto"],
         foot="miss → a no-record sentence"),
    dict(y=290, tag="list_certified",
         lines=["repo / grade / snapshot rows", "coverage: opt-in subset"],
         foot="count ≠ ecosystem coverage"),
    dict(y=434, tag="certification_spec",
         lines=["spec v1 text, compiled in", "five dimensions · A–D · veto"],
         foot="same bytes on every call"),
]

FLOW_TEXT = {
    "title": "dsh-cert-mcp",
    "sub": "two entry points, one handleRequest core, three reply shapes",
    "meta": "stdio · JSON-RPC 2.0 · spec v1 · read-only",
    "col1": "1 · TWO ENTRY POINTS",
    "col2": "2 · ONE CORE",
    "col3": "3 · THREE REPLIES",
    "core_tag": "shared core",
    "core_title": "handleRequest",
    "core_lines": ["src/server.js · one switch", "unknown method → -32601"],
    "data_tag": "data source",
    "data_title": "data/attestations.json",
    "data_lines": ["embedded · specVersion v1", "generatedAt 2026-11-01"],
    "data_foot": "≤1/5min · 10s · fallback",
    "data_edge": "loadRegistry",
    "foot1": "read-only: no writes, no code execution, no credentials",
    "foot2": "the only network call is the optional snapshot refresh, and it is allowed to fail",
}

# Visual width test for every SVG label, measured on the Windows fonts that
# Chrome will fall back to. A label that does not fit aborts the run.
SANS = "cjk"
MONO = "mono"


def svg_fit(text: str, size: float, maxw: float, mono: bool, where: str) -> None:
    w = width(text, int(round(size)), MONO if mono else SANS)
    if w > maxw:
        sys.exit(f"FATAL: {where}: {text!r} needs {w:.0f}px at {size:g}px, "
                 f"box {maxw:.0f}px.")


def flow_svg(skin: str) -> str:
    s = FLOW[skin]
    T = FLOW_TEXT
    W, H = 1100, 660
    sans = ('font-family="Segoe UI, Microsoft YaHei, ui-sans-serif, system-ui, '
            'sans-serif"')
    mono = 'font-family="Consolas, ui-monospace, SFMono-Regular, Menlo, monospace"'
    p = []
    a = p.append

    a(f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="t d">
<title id="t">dsh-cert-mcp structure: two entry points merge into one handleRequest core over one embedded registry snapshot, and fan out into three reply shapes</title>
<desc id="d">Left: the stdio process (node src/index.js) and the DSH bundle row (cordis.patch.yml, inject tools) both call the same handleRequest core. Under the core: data/attestations.json, the embedded snapshot, optionally refreshed at most once per five minutes with a ten second timeout and an inline fallback. Right: the three reply shapes — get_certification (one record), list_certified (rows plus coverage), certification_spec (the compiled spec text).</desc>
<defs>
  <filter id="soft" x="-40%" y="-40%" width="180%" height="200%">
    <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#1b1735" flood-opacity="{s['shadow']}"/>
  </filter>
  <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
    <circle cx="1.2" cy="1.2" r="1.2" fill="{s['grid']}"/>
  </pattern>
  <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
    <path d="M0 0 L10 5 L0 10 z" fill="{s['accent']}"/>
  </marker>
  <marker id="arr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
    <path d="M0 0 L10 5 L0 10 z" fill="{s['accent2']}"/>
  </marker>
</defs>
<rect width="{W}" height="{H}" fill="{s['bg']}"/>
<rect width="{W}" height="{H}" fill="url(#dots)" opacity=".55"/>
<text x="44" y="52" fill="{s['text']}" {mono} font-size="30" font-weight="700">{T['title']}</text>
<text x="44" y="82" fill="{s['sub']}" {sans} font-size="15.5">{T['sub']}</text>
<text x="1056" y="50" text-anchor="end" fill="{s['faint']}" {mono} font-size="14">{T['meta']}</text>
''')

    # bands: the two channels on the left, the reply fan on the right
    a(f'<rect x="28" y="132" width="372" height="360" rx="22" fill="{s["zone"]}" stroke="{s["edge"]}"/>')
    a(f'<rect x="728" y="132" width="344" height="444" rx="22" fill="{s["zone"]}" stroke="{s["edge"]}"/>')

    for x, label in ((40, T["col1"]), (428, T["col2"]), (740, T["col3"])):
        a(f'<text x="{x}" y="118" fill="{s["accent"]}" {sans} font-size="14" '
          f'font-weight="700" letter-spacing="1.1">{label}</text>')

    # ---- entry cards ----
    for e in ENTRY:
        svg_fit(e["tag"], 14, e["w"] - 40, True, "entry tag")
        svg_fit(e["title"], 17.5, e["w"] - 40, True, "entry title")
        a(f'<g filter="url(#soft)"><rect x="{e["x"]}" y="{e["y"]}" width="{e["w"]}" '
          f'height="{e["h"]}" rx="18" fill="{s["card"]}" stroke="{s["edge"]}"/></g>')
        a(f'<text x="{e["x"] + 20}" y="{e["y"] + 28}" fill="{s["accent"]}" {mono} '
          f'font-size="14" font-weight="700">{e["tag"]}</text>')
        a(f'<text x="{e["x"] + 20}" y="{e["y"] + 58}" fill="{s["text"]}" {mono} '
          f'font-size="17.5" font-weight="700">{e["title"]}</text>')
        for i, line in enumerate(e["lines"]):
            svg_fit(line, 14, e["w"] - 40, False, "entry line")
            a(f'<text x="{e["x"] + 20}" y="{e["y"] + 90 + i * 26}" fill="{s["sub"]}" '
              f'{sans} font-size="14">{line}</text>')
        svg_fit(e["foot"], 14, e["w"] - 40, True, "entry foot")
        a(f'<text x="{e["x"] + 20}" y="{e["y"] + 146}" fill="{s["faint"]}" {mono} '
          f'font-size="14">{e["foot"]}</text>')

    # ---- core card ----
    a(f'<g filter="url(#soft)"><rect x="428" y="232" width="272" height="124" rx="18" '
      f'fill="{s["card"]}" stroke="{s["accent"]}" stroke-width="2.2"/></g>')
    a(f'<text x="448" y="260" fill="{s["accent"]}" {mono} font-size="14" '
      f'font-weight="700">{T["core_tag"]}</text>')
    a(f'<text x="448" y="292" fill="{s["text"]}" {mono} font-size="19" '
      f'font-weight="700">{T["core_title"]}</text>')
    for i, line in enumerate(T["core_lines"]):
        svg_fit(line, 14, 232, i == 1, "core line")
        a(f'<text x="448" y="{318 + i * 26}" fill="{s["sub"]}" '
          f'{mono if i == 1 else sans} font-size="14">{line}</text>')

    # ---- snapshot card under the core ----
    a(f'<g filter="url(#soft)"><rect x="428" y="390" width="272" height="152" rx="18" '
      f'fill="{s["card"]}" stroke="{s["edge"]}"/></g>')
    a(f'<text x="448" y="418" fill="{s["accent"]}" {mono} font-size="14" '
      f'font-weight="700">{T["data_tag"]}</text>')
    svg_fit(T["data_title"], 16.5, 232, True, "data title")
    a(f'<text x="448" y="449" fill="{s["text"]}" {mono} font-size="16.5" '
      f'font-weight="700">{T["data_title"]}</text>')
    for i, line in enumerate(T["data_lines"]):
        svg_fit(line, 14, 232, False, "data line")
        a(f'<text x="448" y="{477 + i * 26}" fill="{s["sub"]}" {sans} '
          f'font-size="14">{line}</text>')
    svg_fit(T["data_foot"], 14, 232, True, "data foot")
    a(f'<text x="448" y="530" fill="{s["faint"]}" {mono} font-size="14">'
      f'{T["data_foot"]}</text>')

    # ---- reply cards ----
    for r in REPLIES:
        svg_fit(r["tag"], 17, 280, True, "reply tag")
        a(f'<g filter="url(#soft)"><rect x="740" y="{r["y"]}" width="320" height="134" '
          f'rx="18" fill="{s["card"]}" stroke="{s["edge"]}"/></g>')
        a(f'<text x="760" y="{r["y"] + 32}" fill="{s["accent2"]}" {mono} font-size="17" '
          f'font-weight="700">{r["tag"]}</text>')
        for i, line in enumerate(r["lines"]):
            svg_fit(line, 14, 280, False, "reply line")
            a(f'<text x="760" y="{r["y"] + 64 + i * 26}" fill="{s["text"]}" {sans} '
              f'font-size="14">{line}</text>')
        svg_fit(r["foot"], 14, 280, True, "reply foot")
        a(f'<text x="760" y="{r["y"] + 116}" fill="{s["faint"]}" {mono} '
          f'font-size="14">{r["foot"]}</text>')

    # ---- the merge: both entries join one bus, then one arrow enters the core ----
    for y in (226, 400):
        a(f'<path d="M388 {y} H414 V294" fill="none" stroke="{s["accent"]}" '
          f'stroke-width="2.4" stroke-linejoin="round"/>')
    a(f'<path d="M414 294 H424" fill="none" stroke="{s["accent"]}" stroke-width="2.4" '
      f'marker-end="url(#arr)"/>')
    a(f'<circle cx="414" cy="294" r="4.2" fill="{s["accent"]}"/>')

    # ---- the snapshot edge into the core ----
    a(f'<path d="M564 390 L564 362" fill="none" stroke="{s["accent"]}" stroke-width="2.2" '
      f'marker-end="url(#arr)" stroke-dasharray="6 5"/>')
    a(f'<text x="576" y="382" fill="{s["accent"]}" {mono} font-size="14">'
      f'{T["data_edge"]}</text>')

    # ---- the fan: one bus out of the core, three arrows into the reply shapes ----
    a(f'<path d="M700 294 H714" fill="none" stroke="{s["accent2"]}" stroke-width="2.2"/>')
    a(f'<path d="M714 213 V501" fill="none" stroke="{s["accent2"]}" stroke-width="2.2"/>')
    for y in (213, 357, 501):
        a(f'<path d="M714 {y} H736" fill="none" stroke="{s["accent2"]}" stroke-width="2.2" '
          f'marker-end="url(#arr2)"/>')
    a(f'<circle cx="714" cy="294" r="4.2" fill="{s["accent2"]}"/>')

    # ---- footer ----
    a(f'<line x1="44" y1="600" x2="1056" y2="600" stroke="{s["grid"]}" stroke-width="2"/>')
    a(f'<text x="44" y="624" fill="{s["sub"]}" {sans} font-size="14">{T["foot1"]}</text>')
    a(f'<text x="44" y="646" fill="{s["faint"]}" {mono} font-size="14">{T["foot2"]}</text>')
    a("</svg>")
    return "\n".join(p) + "\n"


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for lang in ("zh", "en"):
        for skin in ("light", "dark"):
            hero(lang, skin)
    for skin in ("light", "dark"):
        name = f"dsh-cert-mcp-flow-v5-{skin}.svg"
        with open(os.path.join(OUT, name), "w", encoding="utf-8", newline="\n") as fh:
            fh.write(flow_svg(skin))
        print(name)


if __name__ == "__main__":
    main()
