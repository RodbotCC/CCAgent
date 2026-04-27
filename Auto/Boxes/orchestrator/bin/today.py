#!/usr/bin/env python3
"""
today.py — Today's Briefing (AUTO.06 surface).

The page Andre opens every morning. For every active lead:
- which plan-day is today
- the pre-written draft for that day's move (if active)
- any timed alerts that fire today (Day-N, quote-expiry, pre-tasting)

This script doesn't push anywhere yet; it surfaces. AUTO.06 push delivery
(Slack / macOS notification) plugs into the same data without changing
this page.
"""

from __future__ import annotations

import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _lib import (                          # noqa: E402
    LEAD_SOURCES, STATE,
    md_inline, split_by_heading, page_html, read_lead_file,
)


# Today is hardcoded to system date for the demo; switch to datetime.now()
# when wiring this to a real cron.
TODAY = datetime(2026, 4, 25)
TODAY_HUMAN = "Friday · April 25, 2026"


TODAY_CSS = r"""
.hero {
  background: var(--bg-3); border: 1px solid var(--line);
  padding: 48px 48px 40px; margin-bottom: 28px;
  border-left: 4px solid var(--sage-ink);
}
.hero .eyebrow {
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
  letter-spacing: 0.16em; color: var(--ink-3); text-transform: uppercase;
  margin-bottom: 14px;
}
.hero h1 {
  font-family: 'Fraunces', serif; font-size: 48px; line-height: 1.05;
  letter-spacing: -0.02em; font-weight: 500; margin-bottom: 14px;
}
.hero .stand {
  font-family: 'Fraunces', serif; font-style: italic; font-size: 18px;
  color: var(--ink-2); max-width: 60ch; line-height: 1.45;
}

.lead-card {
  background: var(--bg-2); border: 1px solid var(--line); margin-bottom: 28px;
}
.lead-card .lead-head {
  padding: 20px 28px; border-bottom: 1px solid var(--line-2);
  display: flex; align-items: baseline; justify-content: space-between;
}
.lead-card .lead-head .name {
  font-family: 'Fraunces', serif; font-size: 26px; font-weight: 500;
}
.lead-card .lead-head .name .alt { color: var(--ink-2); font-style: italic; font-size: 0.7em; margin-left: 10px; }
.lead-card .lead-head .meta { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--ink-3); }
.lead-card .lede-band {
  background: var(--bg-3); padding: 14px 28px; border-bottom: 1px solid var(--line-2);
  font-size: 13.5px; color: var(--ink-2);
}
.lead-card .draft-block {
  padding: 24px 28px;
}
.lead-card .draft {
  background: #fff; border: 1px solid var(--line-2);
  padding: 26px 30px; border-radius: 2px;
}
.lead-card .draft .channel-line {
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
  letter-spacing: 0.10em; color: var(--ink-3); text-transform: uppercase; margin-bottom: 14px;
}
.lead-card .draft .subj {
  font-family: 'Fraunces', serif; font-size: 18px; font-weight: 500;
  border-bottom: 1px solid var(--line-2); padding-bottom: 12px; margin-bottom: 16px;
}
.lead-card .draft p { font-size: 14.5px; color: var(--ink); margin-bottom: 12px; max-width: 60ch; }
.lead-card .draft .signoff { color: var(--ink-2); margin-top: 14px; }
.lead-card .actions {
  display: flex; gap: 10px; margin-top: 18px;
}
.lead-card .actions button {
  font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.10em;
  text-transform: uppercase; padding: 10px 18px; cursor: not-allowed;
  border: 1px solid var(--line); background: var(--bg-3); color: var(--ink-3);
}
.lead-card .actions button.primary { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.lead-card .actions button.primary:hover { background: var(--ink-2); }
.lead-card .actions .hint { font-size: 11px; color: var(--ink-3); margin-left: auto; align-self: center; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em; text-transform: uppercase; }

.alerts-band {
  padding: 18px 28px; background: var(--bg-3); border-top: 1px solid var(--line-2);
}
.alerts-band .sec-eyebrow { margin-bottom: 8px; }
.alerts-band ul { list-style: none; padding: 0; }
.alerts-band li { display: grid; grid-template-columns: 110px 1fr 90px; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--line-2); font-size: 13px; align-items: baseline; }
.alerts-band li:last-child { border-bottom: 0; }
.alerts-band .when { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.06em; }

.passive-card {
  padding: 36px 48px; text-align: center;
  background: var(--bg-3); border: 1px dashed var(--line);
  margin-bottom: 28px;
}
.passive-card .label {
  font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.16em; color: var(--ink-3); text-transform: uppercase; margin-bottom: 12px;
}
.passive-card .msg {
  font-family: 'Fraunces', serif; font-style: italic; font-size: 22px; color: var(--ink-2);
}
"""


def extract_all_day_n_sections(plan_md: str, n: int) -> list[tuple[str, str]]:
    headers = list(re.finditer(rf"^Day {n} — .+$", plan_md, re.MULTILINE))
    out = []
    for m in headers:
        header = m.group(0)
        start = m.end()
        nxt = re.search(r"^Day \d+ — .+$", plan_md[start:], re.MULTILINE)
        end = start + nxt.start() if nxt else len(plan_md)
        out.append((header, plan_md[start:end].strip()))
    return out


def parse_move(header: str, body: str) -> dict:
    if not body:
        return {"present": False}
    is_passive = "No outbound" in body or "No outbound" in header or "Internal prep day" in header
    if is_passive:
        m = re.search(r"(?:No outbound|Internal prep day)\.?\s*\n?(.+?)(?:\n\n|\Z)", body, re.DOTALL)
        rationale = m.group(1).strip().replace("\n", " ") if m else body[:200]
        return {"present": True, "header": header, "passive": True, "rationale": rationale, "channel": "hold"}

    is_email = "Email" in header
    is_sms = "SMS" in header
    subj_m = re.search(r"^Subject:\s*(.+)$", body, re.MULTILINE)
    subject = subj_m.group(1).strip() if subj_m else ""
    after_subj = body[subj_m.end():].lstrip("\n") if subj_m else body
    cut = re.search(r"^Why this move:", after_subj, re.MULTILINE)
    move_body = after_subj[: cut.start()].strip() if cut else after_subj
    lines = [ln.strip() for ln in move_body.splitlines() if ln.strip()]
    signoff = ""
    if lines and len(lines[-1].split()) <= 2 and is_email:
        signoff = lines[-1]
        lines = lines[:-1]
    return {
        "present": True, "header": header, "passive": False,
        "channel": "email" if is_email else ("sms" if is_sms else "?"),
        "subject": subject, "paragraphs": lines, "signoff": signoff,
    }


def parse_day_n_moves(plan_md: str, n: int) -> list[dict]:
    return [parse_move(h, b) for h, b in extract_all_day_n_sections(plan_md, n)]


def todays_alerts_for(alerts_md: str, day_n: int) -> list[dict]:
    """Pick alerts that fire today from 09_andre_alerts.md."""
    blocks = split_by_heading(alerts_md, 2)
    today_block_keys = [f"Day {day_n} ", "Day 0 "]
    out = []
    for head, body in blocks:
        if not any(head.startswith(k) for k in today_block_keys):
            continue
        bullets = re.findall(r"^-\s+(.+?)(?=\n-|\n\n|\Z)", body, re.DOTALL | re.MULTILINE)
        for b in bullets:
            text = re.sub(r"\s+", " ", b.strip())
            tag_m = re.match(r"^([🚨🟢🔵🟡🔴]?\s*)?([A-Z][A-Za-z\- ]+(?:alert)?):\s*(.+)$", text)
            tag, body_text = "", text
            if tag_m and tag_m.group(2):
                tag = tag_m.group(2).strip()
                body_text = tag_m.group(3).strip()
            badge_cls = "amber"
            if "Critical" in tag or "🚨" in b:
                badge_cls = "coral"
            elif "Same-day" in tag:
                badge_cls = "amber"
            elif tag:
                badge_cls = "slate"
            out.append({"when": head, "tag": tag, "body": body_text, "badge": badge_cls})
    return out


def render_one_move_block(meta: dict, move: dict, idx: int, total: int) -> str:
    """Render one move's draft block inside a lead card."""
    if move.get("passive"):
        return f"""
<div class="draft" style="border-style:dashed;text-align:center;padding:32px 30px">
  <div class="channel-line">{md_inline(move["header"])}</div>
  <div style="font-family:'Fraunces',serif;font-style:italic;font-size:18px;color:var(--ink-2);margin:0 auto;max-width:50ch">{md_inline(move["rationale"])}</div>
</div>
"""
    name = meta.get("name", "—")
    primary_email = meta.get("primary_email") or ""
    primary_phone = meta.get("primary_phone") or ""
    primary_contact = meta.get("primary_contact") or name.split("&")[0].strip()

    if move["channel"] == "email":
        if "to both" in move["header"].lower() or " and " in move["header"].lower():
            recipients = f"{name} · {primary_email}".strip(" ·")
        else:
            recipients = f"{primary_contact} · {primary_email}".strip(" ·")
        channel_line = f"📧 Email · Andre → {recipients}"
    elif move["channel"] == "sms":
        sms_to = f"{primary_contact}"
        if primary_phone:
            sms_to += f" · {primary_phone}"
        channel_line = f"📱 SMS · Andre → {sms_to}"
    else:
        channel_line = move["header"]

    paras = "\n".join(f"<p>{md_inline(p)}</p>" for p in move["paragraphs"])
    signoff = f'<p class="signoff">{md_inline(move["signoff"])}</p>' if move.get("signoff") else ""
    subj_block = f'<div class="subj">{md_inline(move["subject"])}</div>' if move.get("subject") else ""

    move_label = ""
    if total > 1:
        ord_word = ["First", "Second", "Third", "Fourth"][idx] if idx < 4 else f"#{idx+1}"
        move_label = f'<div class="channel-line" style="margin-bottom:6px">{ord_word} send · {md_inline(move["header"])}</div>'

    return f"""
<div class="draft">
  {move_label}
  <div class="channel-line">{channel_line}</div>
  {subj_block}
  {paras}
  {signoff}
</div>
"""


def render_lead_card(alias: str) -> str:
    info = LEAD_SOURCES[alias]
    plan_md = read_lead_file(alias, "05_seven_day_plan.md") or ""
    alerts_md = read_lead_file(alias, "09_andre_alerts.md") or ""
    meta = {
        "name": info["name"],
        "altitude": info["altitude"],
        "primary_contact": info.get("primary_contact"),
        "primary_email": info.get("primary_email"),
        "primary_phone": info.get("primary_phone"),
    }
    # Try to enrich meta from 00_meta.json on disk
    import json
    raw = read_lead_file(alias, "00_meta.json") or "{}"
    try:
        on_disk = json.loads(raw)
        for k in ("primary_contact", "primary_email", "primary_phone"):
            if not meta.get(k) and on_disk.get(k):
                meta[k] = on_disk[k]
    except Exception:
        pass

    day_n = info.get("current_plan_day", 1)
    moves = [m for m in parse_day_n_moves(plan_md, day_n) if m.get("present")]
    alerts = todays_alerts_for(alerts_md, day_n)

    altitude_label = "🐋 whale" if info["altitude"] == "whale" else info["altitude"]
    name = info["name"]
    lede_band = (
        f"Plan paused all auto-cadence on this lead. {name.split(' &')[0]} is manual-only — "
        f"your hand on every send."
    )

    if not moves:
        body = '<div class="lede-band muted">No plan day matches today.</div>'
    elif all(m.get("passive") for m in moves):
        rationale = moves[0].get("rationale", "")
        body = f"""
<div class="passive-card">
  <div class="label">Passive day · hold</div>
  <div class="msg">{md_inline(rationale)}</div>
</div>
"""
        return f"""
<div class="lead-card">
  <div class="lead-head">
    <div class="name">{md_inline(name)} <span class="alt">{md_inline(altitude_label)}</span></div>
    <div class="meta">Day {day_n} · passive · <a href="leads/{alias}.html">open Lead Box →</a></div>
  </div>
  {body}
</div>
"""
    else:
        moves_html = "".join(render_one_move_block(meta, m, i, len(moves)) for i, m in enumerate(moves))
        body = f"""
<div class="lede-band">{md_inline(lede_band)}</div>
<div class="draft-block">
  {moves_html}
  <div class="actions">
    <button class="primary">Send via Close</button>
    <button>Edit & Send</button>
    <button>Skip today</button>
    <span class="hint">Buttons inert · AUTO.06 delivery is W3.2</span>
  </div>
</div>
"""

    alerts_html = ""
    if alerts:
        items = "".join(
            f'<li><div class="when">{md_inline(a["when"])}</div>'
            f'<div>{md_inline(a["body"])}</div>'
            f'<div><span class="badge {a["badge"]}">{md_inline(a["tag"])}</span></div></li>'
            for a in alerts
        )
        alerts_html = f"""
<div class="alerts-band">
  <div class="sec-eyebrow">Today's alerts</div>
  <ul>{items}</ul>
</div>
"""

    if moves:
        chans = " + ".join(m["channel"].upper() for m in moves if not m.get("passive"))
        meta_line = f"Day {day_n} · {chans or 'hold'}"
    else:
        meta_line = f"Day {day_n}"

    return f"""
<div class="lead-card">
  <div class="lead-head">
    <div class="name">{md_inline(name)} <span class="alt">{md_inline(altitude_label)}</span></div>
    <div class="meta">{meta_line} · <a href="leads/{alias}.html">open Lead Box →</a></div>
  </div>
  {body}
  {alerts_html}
</div>
"""


def render() -> str:
    active_aliases = [a for a, info in LEAD_SOURCES.items() if info.get("stage") == "active"]
    n = len(active_aliases)
    headline = "Today's first move" if n == 1 else f"Today's first {n} moves"
    stand = (
        "Two whale leads, two different shapes. Hugo: a single Day-1 email to a SaaS AE who reads templates for breakfast. "
        "Brenda & Steve: an SMS-then-email reframe that drops the tasting-fee chase and treats a 40-year franchise operator like the peer he is. "
        "Each draft is calibrated to who they actually are."
    ) if n == 2 else (
        "One whale lead, one hand-shipped Day-1 move. The system already paused auto-cadence — "
        "your job is to make this land like a peer wrote it."
    ) if n == 1 else "The system has staged the moves. You decide which ones leave today."

    hero = f"""
<section class="hero">
  <div class="eyebrow">Today · {TODAY_HUMAN}</div>
  <h1>{md_inline(headline)}</h1>
  <div class="stand">{md_inline(stand)}</div>
</section>
"""

    cards = "".join(render_lead_card(a) for a in active_aliases)

    body = f"<style>{TODAY_CSS}</style>\n{hero}\n{cards}\n<footer class='colophon'>CIA Runtime · Today · AUTO.06 surface</footer>"

    return page_html(
        title="Today · CIA Runtime",
        body=body,
        active_nav="today",
        depth=0,
    )


def main():
    out = STATE / "today.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(render(), encoding="utf-8")
    print(f"  AUTO.06 → {out.relative_to(STATE.parent)}")


if __name__ == "__main__":
    main()
