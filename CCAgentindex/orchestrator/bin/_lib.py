"""
_lib.py — shared building blocks for the CIA orchestrator runtime.

Used by every renderer / automation script in `bin/` and by
`render_lead.py` at the project root. No external dependencies.

Public surface:
- Path constants: ROOT, AUTO, STATE
- Data adapter: read_lead_file(), lead_paths(), CLIENT_BOXES_DIR
- Markdown helpers: md_inline, parse_md_table, all_md_tables, split_by_heading
- HTML helpers: page_html(), nav_html(), CSS
- Lead enumeration: enumerate_client_boxes(), HUGO_LEAD_ID, LEADS
"""

from __future__ import annotations

import json
import re
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

# bin/_lib.py → orchestrator/ → Auto/
ROOT = Path(__file__).resolve().parent.parent     # orchestrator/
AUTO = ROOT.parent                                # Auto/
STATE = ROOT / "state"

CLIENT_BOXES_DIR = AUTO / "Client Boxes"
STAFF_BOXES_DIR = AUTO / "Staff Boxes"
HUGODEMO = AUTO / "Hugodemo"
HUGODEMO_NEWER = AUTO / "Hugodemo" / "Newer"

# ---------------------------------------------------------------------------
# Lead alias table
# ---------------------------------------------------------------------------

HUGO_LEAD_ID = "lead_g4AZCOW7Kpc3tithNBrr9aXPbDHsZ72KJUR55Qjzd6f"
BRENDA_STEVE_LEAD_ID = "lead_Kl4wMKxr025rCsIoaJewk0E4KJZ9wZHU9VdiTRZnEh3"

# Active leads with full enrichment substrate.
# `paths` is a precedence list: Newer/ shadows older for files of the same name.
LEAD_SOURCES = {
    "hugo": {
        "lead_id": HUGO_LEAD_ID,
        "name": "Hugo Casillas",
        "altitude": "whale",
        "stage": "active",
        "current_plan_day": 1,
        "voice": "andre-at-ceiling",
        "paths": [HUGODEMO_NEWER, HUGODEMO],
    },
    "brenda-steve": {
        "lead_id": BRENDA_STEVE_LEAD_ID,
        "name": "Brenda & Steve Catalano",
        "altitude": "whale",
        "stage": "active",
        "current_plan_day": 1,
        "voice": "andre-at-ceiling",
        "paths": [CLIENT_BOXES_DIR / "Brenda & Steve"],
    },
}

# Map directory name in Client Boxes/ → alias for the active LEAD_SOURCES entry.
ACTIVE_BOX_NAMES = {
    "Hugo Casillas": "hugo",
    "Brenda & Steve": "brenda-steve",
}


def lead_paths(alias: str) -> list[Path]:
    if alias not in LEAD_SOURCES:
        raise KeyError(f"unknown lead alias: {alias!r}")
    return LEAD_SOURCES[alias]["paths"]


def read_lead_file(alias: str, name: str) -> str | None:
    """Return contents of <name> for <alias>; Newer/ shadows older."""
    for base in lead_paths(alias):
        p = base / name
        if p.is_file():
            return p.read_text(encoding="utf-8")
    return None


def lead_meta(alias: str) -> dict:
    """Return the parsed 00_meta.json plus the LEAD_SOURCES hints."""
    raw = read_lead_file(alias, "00_meta.json") or "{}"
    meta = json.loads(raw)
    src = LEAD_SOURCES[alias]
    meta.setdefault("lead_id", src["lead_id"])
    meta.setdefault("name", src["name"])
    meta.setdefault("altitude", src["altitude"])
    return meta


def enumerate_client_boxes() -> list[dict]:
    """Walk Auto/Client Boxes/ and return every lead folder name as a
    minimal record. Hugo's active record gets enriched from LEAD_SOURCES.
    Used by the dashboard rollup."""
    out = []
    if not CLIENT_BOXES_DIR.is_dir():
        return out
    for entry in sorted(CLIENT_BOXES_DIR.iterdir()):
        if not entry.is_dir():
            continue
        name = entry.name
        # Detect enrichment level from the contents
        files = [p.name for p in entry.iterdir() if p.is_file()]
        has_enrichment = any(f.endswith("_enrichment.md") for f in files)
        has_close_export = any(f.endswith(".md") and "_enrichment" not in f for f in files)
        alias = ACTIVE_BOX_NAMES.get(name)
        is_active = alias is not None

        if is_active:
            src = LEAD_SOURCES[alias]
            altitude = src["altitude"]
            lead_id = src["lead_id"]
            stage = "active"
        else:
            altitude = "—"
            lead_id = ""
            stage = "intake-enriched" if has_enrichment else "intake"

        record = {
            "slug": name,
            "name": name,
            "lead_id": lead_id,
            "altitude": altitude,
            "stage": stage,
            "files_present": len(files),
            "has_enrichment": has_enrichment,
            "has_close_export": has_close_export,
            "alias": alias,
        }
        out.append(record)
    return out


# ---------------------------------------------------------------------------
# Markdown helpers (no deps)
# ---------------------------------------------------------------------------

def md_inline(s: str) -> str:
    """Convert inline markdown to HTML. **bold**, *italic*, `code`,
    bare URLs. Escapes & < > first."""
    if s is None:
        return ""
    out = (
        s.replace("&", "&amp;")
         .replace("<", "&lt;")
         .replace(">", "&gt;")
    )
    out = re.sub(r"`([^`]+)`", r"<code>\1</code>", out)
    out = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", out)
    out = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<em>\1</em>", out)
    return out


def parse_md_table(md: str) -> list[dict]:
    """Parse the FIRST GFM table in `md`; return list of dicts keyed by
    header. Returns [] if no table found."""
    lines = md.splitlines()
    rows = []
    headers: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if (line.startswith("|")
                and i + 1 < len(lines)
                and re.match(r"^\|[\s\-:|]+\|$", lines[i + 1].strip())):
            headers = [c.strip() for c in line.strip("|").split("|")]
            i += 2
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if len(cells) == len(headers):
                    rows.append(dict(zip(headers, cells)))
                i += 1
            return rows
        i += 1
    return rows


def all_md_tables(md: str) -> list[list[dict]]:
    """Return all GFM tables in document order. Naive but works on our files."""
    out = []
    rest = md
    while True:
        t = parse_md_table(rest)
        if not t:
            break
        out.append(t)
        end_match = re.search(r"\n\|[\s\-:|]+\|\n", rest)
        if not end_match:
            break
        after = rest[end_match.end():]
        non_tbl = re.search(r"\n(?!\|)", "\n" + after)
        if not non_tbl:
            break
        rest = after[non_tbl.end():]
    return out


def split_by_heading(md: str, level: int) -> list[tuple[str, str]]:
    """Return [(heading_text, body_text), ...] for headings at <level>."""
    pat = re.compile(r"^" + ("#" * level) + r" (.+)$", re.MULTILINE)
    out = []
    matches = list(pat.finditer(md))
    for i, m in enumerate(matches):
        head = m.group(1).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(md)
        out.append((head, md[start:end].strip()))
    return out


# ---------------------------------------------------------------------------
# Design system (CSS)
# ---------------------------------------------------------------------------

CSS = r"""
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --bg: #EBE8E0;
  --bg-2: #f5f3ec;
  --bg-3: #faf8f1;
  --bg-4: #ffffff;
  --ink: #1f1d1a;
  --ink-2: #4a4640;
  --ink-3: #8a8478;
  --line: #d8d3c6;
  --line-2: #e3ddd0;
  --sage: #d6e3cc;
  --sage-ink: #3d5a2c;
  --amber: #ead6b3;
  --amber-ink: #7a5a1e;
  --coral: #f0c9c2;
  --coral-ink: #8a3a2a;
  --slate: #cdd5db;
  --slate-ink: #2f4654;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html { background: var(--bg); }

body {
  font-family: 'Inter', system-ui, sans-serif;
  background: var(--bg);
  color: var(--ink);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  padding: 0 0 80px;
}

a { color: var(--ink); text-decoration: underline; text-underline-offset: 3px; text-decoration-color: var(--ink-3); text-decoration-thickness: 1px; }
a:hover { text-decoration-color: var(--ink); }

.tabular { font-family: 'JetBrains Mono', ui-monospace, monospace; font-feature-settings: "tnum"; }

.page { max-width: 760px; margin: 0 auto; padding: 0 20px; }
.page.wide { max-width: 1080px; }

/* ================================================================ NAV BAR */
nav.topnav {
  border-bottom: 1px solid var(--line);
  background: var(--bg-2);
  padding: 14px 28px;
  position: sticky; top: 0; z-index: 10;
}
nav.topnav .inner {
  max-width: 1080px; margin: 0 auto;
  display: flex; gap: 22px; align-items: center;
}
nav.topnav .brand {
  font-family: 'Fraunces', serif; font-style: italic;
  font-size: 16px; color: var(--ink); letter-spacing: -0.005em;
  margin-right: auto;
}
nav.topnav a {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.10em; text-transform: uppercase;
  color: var(--ink-2); text-decoration: none; padding-bottom: 2px; border-bottom: 1px solid transparent;
}
nav.topnav a:hover { color: var(--ink); border-bottom-color: var(--ink); }
nav.topnav a.active { color: var(--ink); border-bottom-color: var(--ink); }

/* ================================================================ MASTHEAD */
.masthead {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 28px 0 18px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 32px;
}
.masthead .eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.14em; color: var(--ink-3); text-transform: uppercase;
}
.masthead .ts { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--ink-3); }

/* ================================================================ SECTION */
section { background: var(--bg-2); border: 1px solid var(--line); margin-bottom: 28px; }
section.bare { background: transparent; border: 0; }
.sec-head {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 18px 28px 14px; border-bottom: 1px solid var(--line-2);
}
.sec-eyebrow {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.16em; color: var(--ink-3); text-transform: uppercase;
}
.sec-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 500; letter-spacing: -0.01em; }
.sec-meta { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--ink-3); }
.sec-body { padding: 22px 28px 26px; }

/* ================================================================ COMMON BITS */
.lede {
  font-family: 'Fraunces', serif; font-size: 17px; line-height: 1.5; color: var(--ink);
  max-width: 60ch; margin-bottom: 22px;
}
.muted { color: var(--ink-3); }
.divider { border-top: 1px dashed var(--line); margin: 18px 0; }

.badge {
  display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.10em; text-transform: uppercase; padding: 3px 8px;
  background: var(--amber); color: var(--amber-ink); border-radius: 2px;
}
.badge.sage { background: var(--sage); color: var(--sage-ink); }
.badge.coral { background: var(--coral); color: var(--coral-ink); }
.badge.slate { background: var(--slate); color: var(--slate-ink); }
.badge.outline { background: transparent; color: var(--ink-3); border: 1px solid var(--line); }

.stat-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
  border: 1px solid var(--line); border-bottom-color: var(--line-2);
}
.stat-grid .cell {
  padding: 14px 16px; border-right: 1px solid var(--line-2); border-bottom: 1px solid var(--line-2);
  background: var(--bg-3);
}
.stat-grid .cell:nth-child(4n) { border-right: 0; }
.stat-grid .cell .k { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.10em; color: var(--ink-3); text-transform: uppercase; margin-bottom: 4px; }
.stat-grid .cell .v { font-family: 'Fraunces', serif; font-size: 24px; line-height: 1.1; color: var(--ink); }
.stat-grid .cell .v.small { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; }

footer.colophon {
  text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 10px;
  color: var(--ink-3); letter-spacing: 0.10em; margin-top: 32px; text-transform: uppercase;
}
"""


# ---------------------------------------------------------------------------
# Page chrome
# ---------------------------------------------------------------------------

NAV_LINKS = [
    ("today", "Today"),
    ("dashboard", "Dashboard"),
    ("leads", "Leads"),
    ("voices", "Voices"),
    ("wiring", "Wiring"),
]

# Where each top-level nav slot points (relative to state/)
NAV_HREFS = {
    "today": "today.html",
    "dashboard": "dashboard.html",
    "leads": "leads/hugo.html",  # only Hugo for now
    "voices": "voice/andre-at-ceiling.html",
    "wiring": "../wiring/00_overview.md",  # markdown — opened externally
    "index": "index.html",
}


def nav_html(active: str | None = None, depth: int = 0) -> str:
    """Render the sticky top nav. `depth` = how many directories deep
    the rendered file is from `state/` (0 = state root, 1 = state/leads/).
    Used to prefix relative hrefs."""
    prefix = "../" * depth
    items = []
    for key, label in NAV_LINKS:
        href = prefix + NAV_HREFS[key]
        cls = " class=\"active\"" if key == active else ""
        items.append(f'<a href="{href}"{cls}>{label}</a>')
    home = prefix + NAV_HREFS["index"]
    return f"""
<nav class="topnav">
  <div class="inner">
    <a href="{home}" class="brand">CIA Runtime</a>
    {"".join(items)}
  </div>
</nav>
"""


def page_html(*, title: str, body: str, active_nav: str | None = None,
              depth: int = 0, wide: bool = False) -> str:
    """Wrap a body fragment in the standard HTML shell."""
    page_cls = "page wide" if wide else "page"
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<style>{CSS}</style>
</head>
<body>
{nav_html(active_nav, depth)}
<div class="{page_cls}">
{body}
</div>
</body>
</html>
"""


# ---------------------------------------------------------------------------
# Channel emoji map (used by Lead Box and Today briefing)
# ---------------------------------------------------------------------------

CHANNEL_MAP = {
    "📱": "sms", "📧": "email", "📞": "call", "📝": "note", "✅": "task",
    "💫": "logged", "🔒": "quote",
}
