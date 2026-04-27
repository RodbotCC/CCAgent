#!/usr/bin/env python3
"""
render_lead.py — Lead Box renderer for the CIA orchestrator.

Reads a lead's canonical file substrate and produces one self-contained
HTML page in the editorial visual language. Output:

    state/leads/<alias>.html

Usage:
    python3 render_lead.py hugo
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# Make `bin/` importable when run from project root.
sys.path.insert(0, str(Path(__file__).resolve().parent / "bin"))

import _lib  # noqa: E402
from _lib import (                           # noqa: E402
    LEAD_SOURCES, STATE,
    md_inline, parse_md_table, all_md_tables, split_by_heading,
    page_html, lead_meta, read_lead_file, CHANNEL_MAP,
)


# ---------------------------------------------------------------------------
# Lead Box specific styles (extension of the shared CSS)
# ---------------------------------------------------------------------------

LEAD_CSS = r"""
/* ----------------------------------------------------------- Snapshot */
.snapshot .name {
  font-family: 'Fraunces', serif; font-size: 44px; line-height: 1.05;
  letter-spacing: -0.02em; margin-bottom: 6px;
}
.snapshot .name .altitude { font-style: italic; color: var(--ink-2); font-size: 0.7em; margin-left: 12px; }
.snapshot .sub {
  font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--ink-3);
  letter-spacing: 0.04em; margin-bottom: 22px;
}
.snapshot-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 0;
  border-top: 1px solid var(--line-2);
}
.snapshot-grid .k, .snapshot-grid .v {
  padding: 10px 14px; border-bottom: 1px solid var(--line-2); font-size: 13px;
}
.snapshot-grid .k { color: var(--ink-3); font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; background: var(--bg-3); }
.snapshot-grid .v { color: var(--ink); }

/* ----------------------------------------------------------- Today's Move */
.today {
  background: var(--bg-3); border: 1px solid var(--line);
  border-left: 4px solid var(--sage-ink);
}
.today .draft {
  background: #fff; border: 1px solid var(--line-2);
  padding: 26px 30px; margin: 18px 0; border-radius: 2px;
}
.today .draft .channel-line {
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
  letter-spacing: 0.10em; color: var(--ink-3); text-transform: uppercase; margin-bottom: 14px;
}
.today .draft .subj {
  font-family: 'Fraunces', serif; font-size: 18px; font-weight: 500;
  border-bottom: 1px solid var(--line-2); padding-bottom: 12px; margin-bottom: 16px;
}
.today .draft p { font-size: 14.5px; color: var(--ink); margin-bottom: 12px; max-width: 60ch; }
.today .draft p:last-child { margin-bottom: 0; }
.today .draft .signoff { color: var(--ink-2); margin-top: 16px; }

.today .meta {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
  border-top: 1px solid var(--line-2); margin-top: 18px;
}
.today .meta .cell { padding: 12px 16px; border-right: 1px solid var(--line-2); }
.today .meta .cell:last-child { border-right: 0; }
.today .meta .cell .k { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.10em; color: var(--ink-3); text-transform: uppercase; margin-bottom: 4px; }
.today .meta .cell .v { font-size: 13px; }

/* ----------------------------------------------------------- 7-day strip */
.strip {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; padding: 16px 28px 24px;
}
.strip .day {
  background: var(--bg-3); border: 1px solid var(--line-2); padding: 12px 10px;
  text-align: center; min-height: 110px; display: flex; flex-direction: column; justify-content: space-between;
}
.strip .day.active { background: var(--sage); border-color: var(--sage-ink); }
.strip .day.passive { background: var(--bg-3); border-style: dashed; }
.strip .day.today { outline: 2px solid var(--ink); outline-offset: -2px; }
.strip .day .num { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.12em; color: var(--ink-3); text-transform: uppercase; }
.strip .day .wd { font-family: 'Fraunces', serif; font-size: 16px; margin: 4px 0; }
.strip .day .move { font-size: 11px; color: var(--ink-2); line-height: 1.3; }
.strip .day .chip { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.10em; color: var(--ink-3); text-transform: uppercase; margin-top: 6px; }
.strip .day.active .chip { color: var(--sage-ink); }

/* ----------------------------------------------------------- Profile */
.profile-row {
  display: grid; grid-template-columns: 200px 1fr 80px;
  border-bottom: 1px solid var(--line-2); align-items: baseline;
}
.profile-row:last-child { border-bottom: 0; }
.profile-row .field {
  padding: 10px 14px; font-family: 'JetBrains Mono', monospace; font-size: 11px;
  letter-spacing: 0.04em; color: var(--ink-3); text-transform: uppercase;
  background: var(--bg-3); border-right: 1px solid var(--line-2);
}
.profile-row .read { padding: 10px 14px; font-size: 13.5px; }
.profile-row .conf { padding: 10px 14px; text-align: center; border-left: 1px solid var(--line-2); }

/* ----------------------------------------------------------- Logic */
.logic-row {
  display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--line-2);
  font-size: 13.5px; align-items: baseline;
}
.logic-row:last-child { border-bottom: 0; }
.logic-row .marker { flex: 0 0 28px; font-size: 16px; line-height: 1; }
.logic-row .body { flex: 1; }
.logic-row .body strong { font-weight: 500; color: var(--ink); }
.logic-row.green { background: linear-gradient(to right, color-mix(in srgb, var(--sage) 25%, transparent), transparent 60%); padding-left: 12px; }
.logic-row.blue { background: linear-gradient(to right, color-mix(in srgb, var(--slate) 25%, transparent), transparent 60%); padding-left: 12px; }
.logic-row.amber { background: linear-gradient(to right, color-mix(in srgb, var(--amber) 35%, transparent), transparent 60%); padding-left: 12px; }
.logic-row.red { background: linear-gradient(to right, color-mix(in srgb, var(--coral) 35%, transparent), transparent 60%); padding-left: 12px; }

/* ----------------------------------------------------------- Comms timeline */
.day-block { margin-bottom: 22px; }
.day-block .day-head {
  font-family: 'Fraunces', serif; font-style: italic; font-size: 16px; color: var(--ink-2);
  border-bottom: 1px dashed var(--line); padding-bottom: 6px; margin-bottom: 12px;
}
.event {
  display: grid; grid-template-columns: 90px 1fr; gap: 14px; padding: 8px 0;
  align-items: baseline; border-bottom: 1px solid var(--line-2);
}
.event:last-child { border-bottom: 0; }
.event .channel-cell {
  font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.06em;
  color: var(--ink-3); text-transform: uppercase;
}
.event .body { font-size: 13.5px; color: var(--ink); }
.event .body .quote { display: block; margin-top: 4px; padding-left: 10px; border-left: 2px solid var(--line); color: var(--ink-2); font-style: italic; }

/* ----------------------------------------------------------- Alerts */
.alerts ul { list-style: none; padding: 0; margin: 0; }
.alerts li {
  padding: 12px 0; border-bottom: 1px solid var(--line-2); font-size: 13.5px;
  display: grid; grid-template-columns: 24px 130px 1fr 90px; gap: 12px; align-items: baseline;
}
.alerts li:last-child { border-bottom: 0; }
.alerts .when { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.04em; }
.alerts .body { color: var(--ink); }

/* ----------------------------------------------------------- Skills footer */
.skills-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
.skills-table th, .skills-table td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line-2); font-size: 12.5px; vertical-align: top; }
.skills-table th { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.10em; color: var(--ink-3); text-transform: uppercase; background: var(--bg-3); }
.skills-table tr:last-child td { border-bottom: 0; }
.skills-table .day-on { background: color-mix(in srgb, var(--sage) 25%, transparent); }
.skills-table code { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; background: var(--bg-3); padding: 1px 4px; border-radius: 2px; }

/* ----------------------------------------------------------- Audit */
.audit { padding: 14px 28px; border-top: 1px solid var(--line-2); display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--ink-3); }
.audit .k { color: var(--ink-3); letter-spacing: 0.06em; text-transform: uppercase; font-size: 9.5px; margin-bottom: 4px; }
.audit .v { color: var(--ink-2); }
"""


# ---------------------------------------------------------------------------
# Widget renderers
# ---------------------------------------------------------------------------

def render_masthead(meta: dict) -> str:
    return f"""
<header class="masthead">
  <div>
    <div class="eyebrow">Lead Box · CIA Runtime</div>
  </div>
  <div class="ts">as of 2026-04-25 · plan day 1 (Friday)</div>
</header>
"""


def render_snapshot(meta: dict, comms_md: str) -> str:
    snap_rows = parse_md_table(comms_md)
    altitude_label = {"whale": "🐋 whale"}.get(meta.get("altitude", ""), meta.get("altitude", ""))
    keep_keys = [
        "Status", "Owner", "Phone", "Email", "City / Zip", "Event",
        "Event Date", "Guest Count", "Venue", "Source",
        "Opportunity Value", "Opportunity Status", "Quote Sent",
        "Tasting Offered", "Open Task", "Last Activity",
    ]
    snap_dict = {r.get("Field", ""): r.get("Value", "") for r in snap_rows}
    cells = [
        f'<div class="k">{md_inline(k)}</div><div class="v">{md_inline(snap_dict[k])}</div>'
        for k in keep_keys if k in snap_dict
    ]
    smart_view = meta.get("smart_view_label", "—")
    return f"""
<section class="snapshot bare">
  <div class="name">{md_inline(meta.get("name", "—"))} <span class="altitude">{md_inline(altitude_label)}</span></div>
  <div class="sub">{md_inline(meta.get("lead_id", "—"))} &nbsp;·&nbsp; harvested from {md_inline(smart_view)} &nbsp;·&nbsp; voice <a href="../voice/andre-at-ceiling.html">Andre at ceiling</a></div>
  <div class="snapshot-grid">{"".join(cells)}</div>
</section>
"""


def extract_all_day_n_sections(plan_md: str, n: int) -> list[tuple[str, str]]:
    """Return ALL `Day {n} — ...` sections (some plans have multiple moves on
    the same day). Returns [(header, body), ...] in document order."""
    headers = list(re.finditer(rf"^Day {n} — .+$", plan_md, re.MULTILINE))
    out = []
    for i, m in enumerate(headers):
        header = m.group(0)
        start = m.end()
        # End at the next Day-N header (any N) or EOF
        nxt = re.search(r"^Day \d+ — .+$", plan_md[start:], re.MULTILINE)
        end = start + nxt.start() if nxt else len(plan_md)
        out.append((header, plan_md[start:end].strip()))
    return out


def extract_day_section(plan_md: str, n: int) -> tuple[str, str]:
    """First Day-N section only (for the 7-day strip summary)."""
    sections = extract_all_day_n_sections(plan_md, n)
    return sections[0] if sections else ("", "")


def parse_move(header: str, body: str) -> dict:
    """Parse one move. Detect channel from header, parse subject/body/signoff."""
    if not body:
        return {"present": False}
    is_passive = "No outbound" in body or "No outbound" in header or "Internal prep day" in header or "internal prep" in body[:80].lower()
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
    """All moves scheduled for plan day N (most days have 1; B&S Day 1 has 2)."""
    return [parse_move(h, b) for h, b in extract_all_day_n_sections(plan_md, n)]


def render_one_move(meta: dict, move: dict, idx: int, total: int) -> str:
    """Render one move card. `idx` = 0-based, `total` = # of moves today."""
    name = meta.get("name", "—")
    if move.get("passive"):
        return f"""
<div class="draft" style="background:var(--bg-3);border-style:dashed;text-align:center;padding:36px 30px">
  <div class="channel-line">{md_inline(move["header"])}</div>
  <div style="font-family:'Fraunces',serif;font-style:italic;font-size:18px;color:var(--ink-2);max-width:50ch;margin:0 auto">{md_inline(move["rationale"])}</div>
</div>
"""
    channel = move["channel"]
    if channel == "email":
        recipients = (
            f"{name} · {meta.get('primary_email', '')}"
            if meta.get("primary_email") else name
        )
        # Heuristic for couple/pair leads: if header says "to both" or "to Brenda AND Steve", render both names
        if "to both" in move["header"].lower() or "and " in move["header"].lower():
            recipients = name + (
                f" · {meta.get('primary_email', '')}" if meta.get("primary_email") else ""
            )
        channel_line = f"📧 Email · Andre → {recipients}"
    elif channel == "sms":
        # SMS to primary contact unless header indicates otherwise
        primary = meta.get("primary_contact") or name.split("&")[0].strip()
        sms_to = f"{primary}"
        if meta.get("primary_phone"):
            sms_to += f" · {meta['primary_phone']}"
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
  <div class="channel-line">{md_inline(channel_line)}</div>
  {subj_block}
  {paras}
  {signoff}
</div>
"""


def render_today(meta: dict, plan_md: str, alerts_md: str, current_day: int) -> str:
    moves = parse_day_n_moves(plan_md, current_day)
    moves = [m for m in moves if m.get("present")]
    if not moves:
        return ""

    name = meta.get("name", "the lead")
    lede = (
        f"Andre's hand needed. The draft{'s are' if len(moves) > 1 else ' is'} ready — "
        f"the system has paused all auto-cadence on {name.split(' &')[0]}. "
        f"Read the comms, ship {'the moves in order' if len(moves) > 1 else 'the email'}, "
        "log the response."
    )

    move_html = "".join(render_one_move(meta, m, i, len(moves)) for i, m in enumerate(moves))

    # Header summary
    if len(moves) == 1 and not moves[0].get("passive"):
        ch = moves[0]["channel"]
        title = f"Send the Day {current_day} {ch.upper() if ch == 'sms' else ch}"
    elif len(moves) > 1:
        title = f"Send the Day {current_day} sequence ({len(moves)} moves)"
    else:
        title = f"Day {current_day} — passive"

    return f"""
<section class="today">
  <div class="sec-head">
    <div>
      <div class="sec-eyebrow">Today · Day {current_day}</div>
      <div class="sec-title">{md_inline(title)}</div>
    </div>
    <div><span class="badge">review-required</span></div>
  </div>
  <div class="sec-body">
    <div class="lede">{md_inline(lede)}</div>
    {move_html}
    <div class="meta">
      <div class="cell"><div class="k">Voice</div><div class="v"><code>voice-andre-at-ceiling</code></div></div>
      <div class="cell"><div class="k">Profile</div><div class="v"><code>profile-whale-{'professional-buyer' if 'Hugo' in name else 'operator'}</code></div></div>
      <div class="cell"><div class="k">Moves today</div><div class="v">{len(moves)}</div></div>
      <div class="cell"><div class="k">Gating</div><div class="v">review-required</div></div>
    </div>
  </div>
</section>
"""


def parse_seven_day_strip(plan_md: str) -> list[dict]:
    out = []
    weekdays = ["Friday", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]
    for n in range(1, 8):
        header, body = extract_day_section(plan_md, n)
        active = True
        chip = ""
        move_line = ""
        if "No outbound" in body or "No outbound" in header:
            active = False
            move_line = "rest day"
        elif "Email" in header:
            chip = "email"
            subj_m = re.search(r"^Subject:\s*(.+)$", body, re.MULTILINE)
            move_line = (subj_m.group(1).strip() if subj_m else body.split(".")[0])[:60]
        elif "SMS" in header:
            chip = "sms"
            for ln in body.splitlines():
                if ln.strip() and not ln.lstrip().startswith("Subject"):
                    move_line = ln.strip()[:60]
                    break
        else:
            move_line = (body.split(".")[0] if body else "—")[:60]
        out.append({
            "n": n,
            "wd": weekdays[n - 1] if n - 1 < len(weekdays) else f"Day {n}",
            "active": active, "chip": chip, "move": move_line,
        })
    return out


def render_seven_day_strip(plan_md: str, current_day: int = 1) -> str:
    days = parse_seven_day_strip(plan_md)
    cards = []
    for d in days:
        cls = "day"
        cls += " active" if d["active"] else " passive"
        if d["n"] == current_day:
            cls += " today"
        chip = f'<div class="chip">{d["chip"]}</div>' if d["chip"] else '<div class="chip">hold</div>'
        cards.append(
            f'<div class="{cls}"><div class="num">Day {d["n"]}</div>'
            f'<div class="wd">{d["wd"]}</div>'
            f'<div class="move">{md_inline(d["move"])}</div>{chip}</div>'
        )
    active_count = sum(1 for d in days if d["active"])
    n_email = sum(1 for d in days if d["chip"] == "email")
    n_sms = sum(1 for d in days if d["chip"] == "sms")
    n_hold = 7 - active_count
    return f"""
<section>
  <div class="sec-head">
    <div>
      <div class="sec-eyebrow">7-Day Plan</div>
      <div class="sec-title">Friday → Thursday</div>
    </div>
    <div class="sec-meta">{n_email} emails · {n_sms} SMS · {n_hold} holds</div>
  </div>
  <div class="strip">{"".join(cards)}</div>
</section>
"""


def render_profile(profile_md: str) -> str:
    lines = profile_md.split("\n")
    lede_lines = []
    in_body = False
    for ln in lines:
        if ln.startswith("# "):
            in_body = True; continue
        if in_body:
            if ln.strip().startswith("##"):
                break
            if ln.strip():
                lede_lines.append(ln.strip())
            elif lede_lines:
                break
    lede = " ".join(lede_lines)

    rows = parse_md_table(profile_md)
    profile_rows_html = [
        f'<div class="profile-row"><div class="field">{md_inline(r.get("Field",""))}</div>'
        f'<div class="read">{md_inline(r.get("Read",""))}</div>'
        f'<div class="conf">{md_inline(r.get("Confidence",""))}</div></div>'
        for r in rows
    ]
    alt_m = re.search(r"## Altitude\s*\n([^\n]+)", profile_md)
    altitude = alt_m.group(1).strip() if alt_m else ""

    return f"""
<section>
  <div class="sec-head">
    <div>
      <div class="sec-eyebrow">Profile · Buyer Read</div>
      <div class="sec-title">Who they actually are</div>
    </div>
    <div class="sec-meta">{md_inline(altitude)}</div>
  </div>
  <div class="sec-body">
    <div class="lede">{md_inline(lede)}</div>
    {"".join(profile_rows_html)}
  </div>
</section>
"""


def render_logic(logic_md: str) -> str:
    lede_m = re.search(r"^This file[\s\S]+?\n\n", logic_md, re.MULTILINE)
    lede = lede_m.group(0).strip() if lede_m else ""
    bullet_re = re.compile(r"^-\s*([🟢🔵🟡🔴])\s+(.+?)(?=\n-|\n\n|\Z)", re.DOTALL | re.MULTILINE)
    rows_html = []
    color_map = {"🟢": "green", "🔵": "blue", "🟡": "amber", "🔴": "red"}
    for m in bullet_re.finditer(logic_md):
        emoji, body = m.group(1), m.group(2).strip()
        clean = re.sub(r"\n\s+→\s*", " <strong>→</strong> ", body)
        clean = re.sub(r"\s+", " ", clean)
        rows_html.append(
            f'<div class="logic-row {color_map[emoji]}"><div class="marker">{emoji}</div><div class="body">{md_inline(clean)}</div></div>'
        )
    return f"""
<section>
  <div class="sec-head">
    <div>
      <div class="sec-eyebrow">Logic · Off-Ramp Shapes</div>
      <div class="sec-title">What to do when reality breaks the plan</div>
    </div>
  </div>
  <div class="sec-body">
    <div class="lede">{md_inline(lede)}</div>
    {"".join(rows_html)}
  </div>
</section>
"""


def render_comms_timeline(comms_md: str) -> str:
    m = re.search(r"## 📜 Full Correspondence History([\s\S]+)", comms_md)
    if not m:
        return ""
    body = m.group(1)
    blocks_html = []
    for head, sub in split_by_heading(body, 3):
        events = []
        lines = sub.split("\n")
        i = 0
        while i < len(lines):
            ln = lines[i]
            ch_match = re.match(r"^([📱📧📞📝✅💫🔒])\s+(.+)$", ln.strip())
            if ch_match:
                emoji, rest = ch_match.group(1), ch_match.group(2)
                channel_label = CHANNEL_MAP.get(emoji, "?")
                cont = []
                i += 1
                while i < len(lines):
                    nxt = lines[i]
                    if re.match(r"^([📱📧📞📝✅💫🔒])", nxt.strip()):
                        break
                    if nxt.strip() == "":
                        i += 1; continue
                    cont.append(nxt.strip())
                    i += 1
                cont_block = ""
                if cont:
                    cont_block = '<div class="quote">' + md_inline(" · ".join(cont)) + "</div>"
                events.append(
                    f'<div class="event"><div class="channel-cell">{emoji} {channel_label}</div>'
                    f'<div class="body">{md_inline(rest)}{cont_block}</div></div>'
                )
            else:
                i += 1
        if events:
            blocks_html.append(
                f'<div class="day-block"><div class="day-head">{md_inline(head)}</div>{"".join(events)}</div>'
            )
    return f"""
<section>
  <div class="sec-head">
    <div>
      <div class="sec-eyebrow">Comms Timeline</div>
      <div class="sec-title">Full correspondence history</div>
    </div>
    <div class="sec-meta">live · appended by AUTO.01</div>
  </div>
  <div class="sec-body">
    {"".join(blocks_html)}
  </div>
</section>
"""


def render_alerts(alerts_md: str) -> str:
    blocks = split_by_heading(alerts_md, 2)
    rows = []
    for head, body in blocks:
        bullets = re.findall(r"^-\s+(.+?)(?=\n-|\n\n|\Z)", body, re.DOTALL | re.MULTILINE)
        for b in bullets:
            text = re.sub(r"\s+", " ", b.strip())
            tag_m = re.match(r"^([🚨🟢🔵🟡🔴]?\s*)?([A-Z][A-Za-z\- ]+(?:alert)?):\s*(.+)$", text)
            tag = ""
            if tag_m and tag_m.group(2):
                tag = tag_m.group(2).strip()
                text = tag_m.group(3).strip()
            badge_cls = "amber"
            if "Critical" in tag or "🚨" in b:
                badge_cls = "coral"
            elif "Same-day" in tag:
                badge_cls = "amber"
            elif tag:
                badge_cls = "slate"
            badge = f'<span class="badge {badge_cls}">{md_inline(tag)}</span>' if tag else ""
            rows.append(
                f'<li><div></div><div class="when">{md_inline(head)}</div><div class="body">{md_inline(text)}</div><div>{badge}</div></li>'
            )
    return f"""
<section class="alerts">
  <div class="sec-head">
    <div>
      <div class="sec-eyebrow">Andre Alerts · Timed Prompts</div>
      <div class="sec-title">What needs his hand</div>
    </div>
    <div class="sec-meta">queued · escalates +30 min on whale tier</div>
  </div>
  <div class="sec-body">
    <ul>{"".join(rows)}</ul>
  </div>
</section>
"""


def render_skills(skills_md: str) -> str:
    tables = all_md_tables(skills_md)
    day_table = []
    for t in tables:
        if t and "day" in (list(t[0].keys())[0] or "").lower():
            day_table = t; break
    if not day_table:
        return ""
    headers = list(day_table[0].keys())
    head_html = "".join(f"<th>{md_inline(h)}</th>" for h in headers)
    body_html = []
    for r in day_table:
        cls = "day-on" if r.get("active?") == "✅" else ""
        cells = "".join(f"<td>{md_inline(r.get(h, ''))}</td>" for h in headers)
        body_html.append(f'<tr class="{cls}">{cells}</tr>')
    return f"""
<section>
  <div class="sec-head">
    <div>
      <div class="sec-eyebrow">Composition · Tier 1 + 2 + 3</div>
      <div class="sec-title">Skills selected for this lead</div>
    </div>
    <div class="sec-meta"><code>profile-whale-professional-buyer</code> · <code><a href="../voice/andre-at-ceiling.html">voice-andre-at-ceiling</a></code></div>
  </div>
  <div class="sec-body">
    <table class="skills-table">
      <thead><tr>{head_html}</tr></thead>
      <tbody>{"".join(body_html)}</tbody>
    </table>
  </div>
</section>
"""


def render_audit(source_md: str, asset_md: str, run_log_md: str, ledger_md: str) -> str:
    sources_n = len(re.findall(r"^\|\s*S\d{3}\s*\|", source_md, re.MULTILINE))
    assets_n = len(re.findall(r"^\|\s*A\d{3}\s*\|", asset_md, re.MULTILINE))
    runs_n = len(re.findall(r"^\[\d{4}-", run_log_md, re.MULTILINE))
    files_present = len(re.findall(r"\|\s*✅\s*\|", ledger_md))
    return f"""
<section class="bare">
  <div class="audit">
    <div><div class="k">Sources tracked</div><div class="v">{sources_n} entries</div></div>
    <div><div class="k">Assets indexed</div><div class="v">{assets_n} entries</div></div>
    <div><div class="k">Run log entries</div><div class="v">{runs_n}</div></div>
    <div><div class="k">§17 columns ✅</div><div class="v">{files_present}</div></div>
  </div>
</section>
"""


# ---------------------------------------------------------------------------
# Render + main
# ---------------------------------------------------------------------------

def render(alias: str) -> str:
    meta = lead_meta(alias)
    comms_md = read_lead_file(alias, "01_comms.md") or ""
    profile_md = read_lead_file(alias, "04_profile.md") or ""
    plan_md = read_lead_file(alias, "05_seven_day_plan.md") or ""
    logic_md = read_lead_file(alias, "06_logic.md") or ""
    skills_md = read_lead_file(alias, "07_skills_used.md") or ""
    alerts_md = read_lead_file(alias, "09_andre_alerts.md") or ""
    source_md = read_lead_file(alias, "source_index.md") or ""
    asset_md = read_lead_file(alias, "asset_index.md") or ""
    run_log_md = read_lead_file(alias, "run_log.md") or ""
    ledger_md = read_lead_file(alias, "client_ledger.md") or ""

    current_day = meta.get("current_plan_day", 1) or LEAD_SOURCES[alias].get("current_plan_day", 1)
    body = "".join([
        render_masthead(meta),
        render_snapshot(meta, comms_md),
        render_today(meta, plan_md, alerts_md, current_day),
        render_seven_day_strip(plan_md, current_day=current_day),
        render_profile(profile_md),
        render_logic(logic_md),
        render_comms_timeline(comms_md),
        render_alerts(alerts_md),
        render_skills(skills_md),
        render_audit(source_md, asset_md, run_log_md, ledger_md),
        '<footer class="colophon">CIA Runtime · Lead Box · file-tree orchestrator</footer>',
    ])
    full_body = f'<style>{LEAD_CSS}</style>\n{body}'
    return page_html(
        title=f"Lead Box · {meta.get('name', '—')}",
        body=full_body,
        active_nav="leads",
        depth=1,  # state/leads/<alias>.html
    )


def main():
    if len(sys.argv) < 2:
        print(f"usage: {sys.argv[0]} <lead_alias>", file=sys.stderr)
        print(f"known aliases: {', '.join(LEAD_SOURCES)}", file=sys.stderr)
        sys.exit(2)
    alias = sys.argv[1]
    html = render(alias)
    out = STATE / "leads" / f"{alias}.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
