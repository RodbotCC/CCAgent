#!/usr/bin/env python3
"""
Comeketo Catering — Follow-up / Non-Ballpark Email Renderer
============================================================

For any email that ISN'T a precise two-option ballpark quote: resets,
soft follow-ups, tasting confirmations, mid-cadence nudges, post-call
wrap-ups. Same brand DNA as the ballpark template (Fraunces / Inter /
parchment) — minus the quote table.

Usage (as a module):

    from render_followup_email import render_followup_email
    html = render_followup_email(
        subject="Following up — and a different approach for your tasting",
        client_first_name="Hugo",
        body_text=\"\"\"Hugo,

I want to step back for a second...

Andre\"\"\",
        include_tasting_card=True,
    )

Usage (CLI):

    python render_followup_email.py \\
        --subject "Following up..." \\
        --client-first-name "Hugo" \\
        --body-file body.txt \\
        --output hugo-day1.html

The renderer:
  • Wraps each blank-line-separated paragraph in <p>...</p>
  • Auto-converts simple **bold** and *italic* markdown
  • Auto-shows the tasting card (with current cycle dates) unless explicitly disabled
  • Always shows the calculator-link band
  • Pulls signature defaults from the canonical Andre profile

Tasting dates are operator-fed (per guardrails §7). The renderer reads
the current cycle from this file's TASTING_DATES constant — keep it in
sync with `comeketo-inbox/references/guardrails.md` "Current Tasting Dates".
"""

import argparse
import html as html_lib
import json
import re
import sys
from pathlib import Path


# ─── Operator-fed tasting cycle (per guardrails §7) ────────────────
# Update these when the cycle rolls over. April 19 is hard-blocked
# (do not re-add). Always confirm against guardrails.md before changing.
TASTING_DATES = [
    {"date": "Sunday, May 3, 2026", "time": "5:30 PM", "location": "199 Main St, Fitchburg, MA"},
    {"date": "Sunday, May 17, 2026", "time": "2:00 PM", "location": "199 Main St, Fitchburg, MA"},
    {"date": "Sunday, May 31, 2026", "time": "2:00 PM", "location": "199 Main St, Fitchburg, MA"},
]

DEFAULTS = {
    "rep_name": "Andre Raw",
    "rep_title": "Catering Event Coordinator",
    "rep_cell": "(978) 235-3791",
    "rep_office": "(978) 381-1212",
    "rep_email": "team@comeketocatering.com",
    "rep_facebook_url": "https://www.facebook.com/comeketocatering",
    "rep_instagram_url": "https://www.instagram.com/comeketocatering",
    "rep_website_url": "https://comeketocatering.com",
    "menu_calculator_url": "https://comeketocatering.com/calculator",
    "tasting_register_url": "https://comeketocatering.com/tasting/register",
    "tasting_code": "ANDRE",
}


def _markdown_lite(text: str) -> str:
    """
    Light markdown → HTML conversion for body content. Handles:
      **bold**  →  <strong>bold</strong>
      *italic*  →  <em>italic</em>
      paragraph breaks (double newline) → separate <p> tags
    Does NOT handle headers, lists, links — those should be hand-coded
    in the body text using HTML if needed.
    """
    # Escape HTML first
    text = html_lib.escape(text)
    # Then re-introduce inline markdown
    text = re.sub(r"\*\*([^*]+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*([^*]+?)\*(?!\*)", r"<em>\1</em>", text)
    return text


def _paragraphize(body_text: str) -> str:
    """Turn body text into a series of <p>...</p> blocks."""
    paragraphs = [p.strip() for p in body_text.strip().split("\n\n") if p.strip()]
    out = []
    for p in paragraphs:
        # Preserve single-line breaks within a paragraph as <br>
        rendered = _markdown_lite(p).replace("\n", "<br>")
        out.append(f"<p>{rendered}</p>")
    return "\n      ".join(out)


def _tasting_card_html() -> str:
    dates_lines = "<br>".join(
        f"<strong>{d['date']}</strong> · {d['time']}" for d in TASTING_DATES
    )
    location = TASTING_DATES[0]["location"] if TASTING_DATES else "Fitchburg, MA"
    return f"""
    <div class="tasting-card">
      <div class="label">Tasting · current cycle</div>
      <h3>Three upcoming Sundays — pick what works for you</h3>
      <div class="dates">{dates_lines}</div>
      <div class="meta">{location} · code <strong>ANDRE</strong> · <a href="{DEFAULTS['tasting_register_url']}">RSVP / hold a seat →</a></div>
    </div>"""


def _cta_band_html(cta_block: str) -> str:
    if not cta_block:
        return ""
    rendered = _markdown_lite(cta_block).replace("\n", "<br>")
    return f"""
    <div class="cta-band">{rendered}</div>"""


def render_followup_email(
    subject: str,
    client_first_name: str,
    body_text: str,
    cta_block: str = "",
    include_tasting_card: bool = True,
    template_path: Path = None,
    overrides: dict = None,
) -> str:
    """
    Render a follow-up email. Returns full HTML string ready to send via Close.

    Args:
        subject: email subject line (also goes into <title>)
        client_first_name: "Hugo" or "Brenda and Steve"
        body_text: plain text body, paragraphs separated by blank lines.
                   Use **bold** and *italic* for inline emphasis.
        cta_block: optional sage-band CTA above the tasting card
        include_tasting_card: whether to show the amber tasting-dates card
        template_path: override the template location (defaults to
                       comeketo-inbox/assets/followup-email.html)
        overrides: dict of merge-field overrides (rep_*, urls, etc.)

    Returns:
        Rendered HTML string.
    """
    if template_path is None:
        template_path = Path(__file__).resolve().parent.parent / "assets" / "followup-email.html"

    template = template_path.read_text(encoding="utf-8")
    # Strip the dev-doc HTML comment block at the top
    template = re.sub(r"<!--.*?-->", "", template, count=1, flags=re.DOTALL)

    merge = dict(DEFAULTS)
    if overrides:
        merge.update(overrides)
    merge["subject"] = subject
    merge["client_first_name"] = client_first_name
    merge["body_paragraphs"] = _paragraphize(body_text)
    merge["cta_band_html"] = _cta_band_html(cta_block)
    merge["tasting_card_html"] = _tasting_card_html() if include_tasting_card else ""

    rendered = template
    for key, value in merge.items():
        rendered = rendered.replace("{{" + key + "}}", str(value))

    return rendered


def main():
    parser = argparse.ArgumentParser(description="Render a follow-up email")
    parser.add_argument("--subject", required=True)
    parser.add_argument("--client-first-name", required=True)
    parser.add_argument("--body-file", required=True, type=Path,
                        help="Plain text body — paragraphs separated by blank lines")
    parser.add_argument("--cta-block", default="",
                        help="Optional sage-band CTA above tasting card")
    parser.add_argument("--no-tasting-card", action="store_true",
                        help="Suppress the tasting-dates card")
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    body_text = args.body_file.read_text(encoding="utf-8")
    html = render_followup_email(
        subject=args.subject,
        client_first_name=args.client_first_name,
        body_text=body_text,
        cta_block=args.cta_block,
        include_tasting_card=not args.no_tasting_card,
    )
    args.output.write_text(html, encoding="utf-8")
    print(f"Wrote {args.output} ({len(html):,} bytes)")


if __name__ == "__main__":
    main()
