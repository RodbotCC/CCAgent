#!/usr/bin/env python3
"""
index.py — landing page that links every surface in the runtime.

Reads `state/dashboard.json` (must exist; produced by refresh.py) for the
rollup numbers, then emits `state/index.html`.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _lib import (                          # noqa: E402
    STATE, LEAD_SOURCES,
    md_inline, page_html,
)


INDEX_CSS = r"""
.hero {
  padding: 60px 48px 50px; margin-bottom: 32px;
  background: var(--bg-2); border: 1px solid var(--line);
}
.hero .eyebrow {
  font-family: 'JetBrains Mono', monospace; font-size: 12px;
  letter-spacing: 0.18em; color: var(--ink-3); text-transform: uppercase; margin-bottom: 16px;
}
.hero h1 {
  font-family: 'Fraunces', serif; font-size: 56px; line-height: 1.02;
  letter-spacing: -0.025em; font-weight: 500; margin-bottom: 16px;
}
.hero h1 .italic { font-style: italic; color: var(--ink-2); font-weight: 400; }
.hero .stand {
  font-family: 'Fraunces', serif; font-size: 19px; color: var(--ink-2);
  max-width: 60ch; line-height: 1.5; margin-bottom: 22px;
}
.hero .stat-row {
  display: flex; gap: 28px; flex-wrap: wrap;
  font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--ink-3);
  letter-spacing: 0.04em; padding-top: 18px; border-top: 1px solid var(--line);
}
.hero .stat-row .stat strong { color: var(--ink); font-weight: 500; }

.tile-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px;
}
.tile {
  background: var(--bg-2); border: 1px solid var(--line);
  padding: 26px 28px 24px; display: flex; flex-direction: column; min-height: 180px;
  text-decoration: none; color: var(--ink);
  transition: background 0.15s, border-color 0.15s;
}
.tile:hover { background: var(--bg-3); border-color: var(--ink-3); }
.tile .eyebrow {
  font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.16em;
  color: var(--ink-3); text-transform: uppercase; margin-bottom: 10px;
}
.tile h3 {
  font-family: 'Fraunces', serif; font-size: 24px; font-weight: 500; margin-bottom: 10px;
  letter-spacing: -0.01em;
}
.tile p { font-size: 13.5px; color: var(--ink-2); margin-bottom: 14px; line-height: 1.5; }
.tile .arrow { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.10em; color: var(--ink-3); text-transform: uppercase; margin-top: auto; }
.tile.primary { border-left: 4px solid var(--sage-ink); }
.tile.primary .arrow { color: var(--sage-ink); }

.section-block { background: var(--bg-2); border: 1px solid var(--line); margin-bottom: 28px; }
.section-block .head { padding: 16px 28px 12px; border-bottom: 1px solid var(--line-2); }
.section-block .head .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.16em; color: var(--ink-3); text-transform: uppercase; }
.section-block .head h3 { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 500; }
.section-block .body { padding: 18px 28px 22px; }

.lead-link {
  display: flex; padding: 10px 0; border-bottom: 1px solid var(--line-2); align-items: baseline; gap: 18px;
  text-decoration: none; color: var(--ink);
}
.lead-link:last-child { border-bottom: 0; }
.lead-link:hover { background: var(--bg-3); }
.lead-link .name { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 500; flex: 1; }
.lead-link .meta { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--ink-3); }
.lead-link .arrow { color: var(--ink-3); font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.10em; text-transform: uppercase; }
"""


def render() -> str:
    payload_path = STATE / "dashboard.json"
    payload = json.loads(payload_path.read_text(encoding="utf-8")) if payload_path.is_file() else {}
    r = payload.get("rollup", {})

    hero = f"""
<section class="hero">
  <div class="eyebrow">CIA Runtime · file-tree orchestrator</div>
  <h1>The system that runs <span class="italic">with</span> Andre, not for him.</h1>
  <div class="stand">Per-lead intelligence becomes a daily prompt with a pre-written draft. The plan stays specialized; the automation stays cheap. Open Today every morning. Open the Lead Box when you need depth.</div>
  <div class="stat-row">
    <div class="stat"><strong>{r.get("total", 0)}</strong> total leads</div>
    <div class="stat"><strong>{r.get("active", 0)}</strong> active</div>
    <div class="stat"><strong>{r.get("intake_enriched", 0)}</strong> intake enriched</div>
    <div class="stat"><strong>{r.get("intake_raw", 0)}</strong> intake raw</div>
    <div class="stat">refreshed <strong>{md_inline(payload.get("generated_at", "—"))}</strong></div>
  </div>
</section>
"""

    tiles = """
<div class="tile-grid">
  <a class="tile primary" href="today.html">
    <div class="eyebrow">Today</div>
    <h3>The morning open</h3>
    <p>Andre's first stop. Today's plan day, the pre-written draft, today's alerts. One page, one decision per active lead.</p>
    <div class="arrow">Open Today →</div>
  </a>
  <a class="tile" href="dashboard.html">
    <div class="eyebrow">Dashboard</div>
    <h3>Pipeline overview</h3>
    <p>Every lead, rolled up. Active, enriched intake, raw intake. Andre's queue. System queue. Pipeline health.</p>
    <div class="arrow">Open Dashboard →</div>
  </a>
  <a class="tile" href="leads/hugo.html">
    <div class="eyebrow">Lead Box · whale</div>
    <h3>Hugo Casillas</h3>
    <p>SaaS Account Executive at ZoomInfo. Reads templates for breakfast. Day 1 = the Highland-Orchard / walkthrough-video / weekday-call email. Quote expires May 1.</p>
    <div class="arrow">Open Lead Box →</div>
  </a>
  <a class="tile" href="leads/brenda-steve.html">
    <div class="eyebrow">Lead Box · whale</div>
    <h3>Brenda &amp; Steve Catalano</h3>
    <p>40-year franchise empire. Pair lead — Brenda the comms hub, Steve the validator. Day 1 = STOP the tasting-fee chase, waive the fee, frame operator-to-operator. Tasting May 3.</p>
    <div class="arrow">Open Lead Box →</div>
  </a>
  <a class="tile" href="voice/andre-at-ceiling.html">
    <div class="eyebrow">Voice · Tier 3</div>
    <h3>Andre at ceiling</h3>
    <p>Voice profile — the calibration the agent applies when it composes a move. Pulled from Slack signal, sample-grounded.</p>
    <div class="arrow">Open Voice →</div>
  </a>
</div>
"""

    # Active leads list — link via the box-name → alias mapping
    from _lib import ACTIVE_BOX_NAMES
    active_lis = []
    for a in payload.get("active_leads", []):
        alias = ACTIVE_BOX_NAMES.get(a["name"], "hugo")
        active_lis.append(
            f'<a class="lead-link" href="leads/{alias}.html"><div class="name">{md_inline(a["name"])}</div>'
            f'<div class="meta">🐋 {md_inline(a.get("altitude","whale"))} · Day {a.get("current_plan_day","")} · {md_inline(a.get("current_off_ramp",""))}</div>'
            f'<div class="arrow">Lead Box →</div></a>'
        )
    active_block = f"""
<section class="section-block">
  <div class="head">
    <div class="eyebrow">Active</div>
    <h3>Running 7-day plan</h3>
  </div>
  <div class="body">{"".join(active_lis) or '<div class="muted">no active leads.</div>'}</div>
</section>
"""

    # Wiring + automation list
    docs_block = """
<section class="section-block">
  <div class="head">
    <div class="eyebrow">Docs · the architecture</div>
    <h3>How this is wired</h3>
  </div>
  <div class="body">
    <a class="lead-link" href="../wiring/00_overview.md"><div class="name">00 · Overview</div><div class="meta">file tree → orchestrator → page</div><div class="arrow">Open ↗</div></a>
    <a class="lead-link" href="../wiring/lead_box.md"><div class="name">Lead Box wiring</div><div class="meta">every widget · file in → render → action out</div><div class="arrow">Open ↗</div></a>
    <a class="lead-link" href="../wiring/dashboard.md"><div class="name">Dashboard wiring</div><div class="meta">AUTO.10 + AUTO.11 pipeline</div><div class="arrow">Open ↗</div></a>
    <a class="lead-link" href="../wiring/today.md"><div class="name">Today wiring</div><div class="meta">AUTO.06 surface — the morning open</div><div class="arrow">Open ↗</div></a>
    <a class="lead-link" href="../wiring/automations.md"><div class="name">Automations index</div><div class="meta">AUTO.01–AUTO.11 status + plug-points</div><div class="arrow">Open ↗</div></a>
    <a class="lead-link" href="../README.md"><div class="name">README</div><div class="meta">what this is, how to run it</div><div class="arrow">Open ↗</div></a>
    <a class="lead-link" href="../PLAN.md"><div class="name">PLAN</div><div class="meta">build order across waves</div><div class="arrow">Open ↗</div></a>
  </div>
</section>
"""

    body = f"<style>{INDEX_CSS}</style>\n{hero}\n{tiles}\n{active_block}\n{docs_block}\n<footer class='colophon'>CIA Runtime · Index · Hugo lab build</footer>"

    return page_html(
        title="CIA Runtime",
        body=body,
        active_nav=None,
        depth=0,
    )


def main():
    out = STATE / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(render(), encoding="utf-8")
    print(f"  index  → {out.relative_to(STATE.parent)}")


if __name__ == "__main__":
    main()
