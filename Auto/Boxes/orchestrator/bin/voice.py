#!/usr/bin/env python3
"""
voice.py — render a Tier 3 voice profile as a reference page.

Reads `Auto/Staff Boxes/<voice>/<voice> - Voice Profile.md` and emits
`state/voice/<slug>.html`. Used by Lead Boxes that link to a voice
profile for calibration.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _lib import (                              # noqa: E402
    AUTO, STAFF_BOXES_DIR, STATE,
    md_inline, split_by_heading, page_html,
)


VOICES = {
    "andre-at-ceiling": {
        "label": "Andre at ceiling",
        "person": "Andre Raw",
        "subtitle": "Senior Sales Rep · Comeketo Catering",
        "file": "Andre Raw/Andre Raw - Voice Profile.md",
        "kind": "deliberate, peer-to-peer ceiling version of Andre's natural voice",
    },
}


VOICE_CSS = r"""
.voice-hero {
  background: var(--bg-2); border: 1px solid var(--line);
  padding: 40px 44px 36px; margin-bottom: 28px;
}
.voice-hero .eyebrow {
  font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.16em;
  color: var(--ink-3); text-transform: uppercase; margin-bottom: 12px;
}
.voice-hero h1 {
  font-family: 'Fraunces', serif; font-size: 44px; line-height: 1.05;
  letter-spacing: -0.02em; font-weight: 500; margin-bottom: 8px;
}
.voice-hero h1 .italic { font-style: italic; color: var(--ink-2); font-weight: 400; }
.voice-hero .sub {
  font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--ink-3);
  letter-spacing: 0.04em; margin-bottom: 18px;
}
.voice-hero .stand {
  font-family: 'Fraunces', serif; font-style: italic; font-size: 17px;
  color: var(--ink-2); max-width: 60ch; line-height: 1.45;
}

.voice-card {
  background: var(--bg-2); border: 1px solid var(--line); margin-bottom: 28px;
}
.voice-card .head {
  padding: 16px 28px 12px; border-bottom: 1px solid var(--line-2);
}
.voice-card .head .eyebrow {
  font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.16em;
  color: var(--ink-3); text-transform: uppercase;
}
.voice-card .head .title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 500; }
.voice-card .body { padding: 18px 28px 24px; }
.voice-card .body p { font-size: 14px; color: var(--ink); margin-bottom: 10px; max-width: 60ch; }
.voice-card .body ul { padding-left: 22px; }
.voice-card .body li { font-size: 13.5px; color: var(--ink); margin-bottom: 6px; line-height: 1.5; }
.voice-card .body li code { background: var(--bg-3); padding: 1px 5px; border-radius: 2px; }

.samples {
  margin-top: 14px;
}
.sample {
  font-family: 'Fraunces', serif; font-style: italic; font-size: 16px;
  color: var(--ink-2); padding: 10px 18px; margin: 8px 0;
  border-left: 3px solid var(--ink-3); background: var(--bg-3);
  max-width: 60ch;
}

.do-dont {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0;
  border: 1px solid var(--line); margin-top: 8px;
}
.do-dont .col { padding: 18px 22px; background: var(--bg-3); }
.do-dont .col.dont { border-left: 1px solid var(--line); background: color-mix(in srgb, var(--coral) 10%, var(--bg-3)); }
.do-dont .col h4 {
  font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.12em;
  color: var(--ink-3); text-transform: uppercase; margin-bottom: 10px;
}
.do-dont ul { padding-left: 18px; }
.do-dont li { font-size: 13px; color: var(--ink); margin-bottom: 6px; line-height: 1.45; }
"""


def render_voice(slug: str) -> str:
    info = VOICES[slug]
    src = STAFF_BOXES_DIR / info["file"]
    if not src.is_file():
        body = f'<p class="muted">Source not found: <code>{md_inline(str(src))}</code></p>'
        return page_html(title=f"Voice · {info['label']}", body=body, active_nav="voices", depth=1)

    md = src.read_text(encoding="utf-8")

    # Lede paragraph: first paragraph after the H1
    lede = ""
    h1m = re.search(r"^# .+$", md, re.MULTILINE)
    if h1m:
        rest = md[h1m.end():].lstrip("\n")
        # take everything until the first --- or first H2/H3
        cut = re.search(r"^(?:---|## |### )", rest, re.MULTILINE)
        if cut:
            rest = rest[:cut.start()]
        lede = rest.strip()

    hero = f"""
<section class="voice-hero">
  <div class="eyebrow">Voice profile · Tier 3</div>
  <h1>{md_inline(info["person"])} — <span class="italic">{md_inline(info["label"])}</span></h1>
  <div class="sub">{md_inline(info["subtitle"])} · pulled from {md_inline(info["file"])}</div>
  <div class="stand">{md_inline(info["kind"])}</div>
</section>
"""

    # Render each H3 sub-section as its own card.
    h3_blocks = split_by_heading(md, 3)
    cards = []
    for head, body in h3_blocks:
        # Skip if body is empty
        if not body.strip():
            continue
        # If this is the "Sample verbatim" section, render samples specially.
        if "sample" in head.lower():
            samples = re.findall(r"^>\s*(.+)$", body, re.MULTILINE)
            sample_html = "<div class=\"samples\">" + "".join(f'<div class="sample">{md_inline(s)}</div>' for s in samples) + "</div>"
            cards.append(f'<div class="voice-card"><div class="head"><div class="eyebrow">Tier 3</div><div class="title">{md_inline(head)}</div></div><div class="body">{sample_html}</div></div>')
            continue
        # If this is the "When mimicking Andre" section, render do/don't grid.
        if "mimicking" in head.lower() or "when " in head.lower():
            do_items = re.findall(r"^-\s+\*\*DO\*\*\s+(.+)$", body, re.MULTILINE)
            dont_items = re.findall(r"^-\s+\*\*DON'?T\*\*\s+(.+)$", body, re.MULTILINE)
            if do_items or dont_items:
                do_ul = "<ul>" + "".join(f"<li>{md_inline(x)}</li>" for x in do_items) + "</ul>"
                dont_ul = "<ul>" + "".join(f"<li>{md_inline(x)}</li>" for x in dont_items) + "</ul>"
                grid = f"""
<div class="do-dont">
  <div class="col"><h4>Do</h4>{do_ul}</div>
  <div class="col dont"><h4>Don't</h4>{dont_ul}</div>
</div>
"""
                cards.append(f'<div class="voice-card"><div class="head"><div class="eyebrow">Tier 3</div><div class="title">{md_inline(head)}</div></div><div class="body">{grid}</div></div>')
                continue

        # Default: render the body as paragraphs + bullets
        body_html = []
        for chunk in re.split(r"\n\n+", body.strip()):
            chunk = chunk.strip()
            if not chunk:
                continue
            if chunk.startswith("- "):
                items = re.findall(r"^-\s+(.+)$", chunk, re.MULTILINE)
                body_html.append("<ul>" + "".join(f"<li>{md_inline(x)}</li>" for x in items) + "</ul>")
            else:
                body_html.append(f"<p>{md_inline(chunk)}</p>")
        cards.append(f'<div class="voice-card"><div class="head"><div class="eyebrow">Tier 3</div><div class="title">{md_inline(head)}</div></div><div class="body">{"".join(body_html)}</div></div>')

    body = f"<style>{VOICE_CSS}</style>\n{hero}\n{''.join(cards)}\n<footer class='colophon'>CIA Runtime · Voice Profile · Tier 3</footer>"

    return page_html(
        title=f"Voice · {info['label']} · CIA Runtime",
        body=body,
        active_nav="voices",
        depth=1,
    )


def main():
    if len(sys.argv) < 2:
        print(f"usage: {sys.argv[0]} <voice_slug>", file=sys.stderr)
        print(f"known: {', '.join(VOICES)}", file=sys.stderr)
        sys.exit(2)
    slug = sys.argv[1]
    if slug not in VOICES:
        print(f"unknown voice: {slug}", file=sys.stderr); sys.exit(2)
    out = STATE / "voice" / f"{slug}.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(render_voice(slug), encoding="utf-8")
    print(f"  voice  → {out.relative_to(STATE.parent)}")


if __name__ == "__main__":
    main()
