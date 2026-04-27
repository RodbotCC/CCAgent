#!/usr/bin/env python3
"""
Comeketo Catering — Ballpark Email Renderer
============================================

Merges a ballpark calculation (from price_ballpark.py) plus lead context
into the bundled HTML template, producing a ready-to-send email file.

Usage:

    python render_email.py \\
        --ballpark quote.json \\
        --client-first-name "Tatiana" \\
        --event-type "birthday party" \\
        --rep-name "Andre Raw" \\
        --rep-cell "(978) 235-3791" \\
        --tasting-date "Sunday, May 3, 2026" \\
        --tasting-time "5:30 PM" \\
        --tasting-code "TATIANA" \\
        --output tatiana-ballpark.html

Or as a module:

    from render_email import render_email
    html = render_email(ballpark, context)

All fields not provided fall back to sensible defaults or the literal
{{merge_field}} placeholder so an operator can spot what's missing.
"""

import argparse
import json
import sys
from pathlib import Path
from price_ballpark import to_template_fields


# Sensible defaults — these match Andre's standard email setup
DEFAULTS = {
    "rep_name": "Andre Raw",
    "rep_title": "Catering Event Coordinator",
    "rep_cell": "(978) 235-3791",
    "rep_office": "(978) 381-1212",
    "rep_facebook_url": "https://www.facebook.com/comeketocatering",
    "rep_instagram_url": "https://www.instagram.com/comeketocatering",
    "rep_website_url": "https://comeketocatering.com",
    "menu_calculator_url": "https://comeketocatering.com/calculator",
    "tasting_preview_url": "https://comeketocatering.com/tasting",
    "tasting_register_url": "https://comeketocatering.com/tasting/register",
    "follow_up_window": "10:00 AM, 11:00 AM, or 1:00 PM",
    "default_steak": "Top Sirloin",
    "default_chicken": "Chicken Wrapped in Bacon",
    "tasting_location": "199 Main St, Fitchburg, MA 01420",
}


def render_email(ballpark: dict, context: dict, template_path: Path = None) -> str:
    """
    Render the ballpark email by merging ballpark calc + context into the template.

    `ballpark` is the output of price_ballpark.build_ballpark() — must contain
    at least 2 options for the standard two-option email.

    `context` is a dict of lead/event fields — see DEFAULTS for available keys.
    Any key not present falls back to DEFAULTS or the literal placeholder.
    """
    if template_path is None:
        template_path = Path(__file__).resolve().parent.parent / "assets" / "ballpark-email.html"

    template = template_path.read_text()

    # Strip the dev-doc HTML comment block at the top — it contains example
    # merge-field values that would otherwise get substituted and confuse output.
    import re
    template = re.sub(r"<!--.*?-->", "", template, flags=re.DOTALL)

    # Build the full merge map
    merge = {}
    merge.update(DEFAULTS)
    merge.update(context)
    merge["guest_count"] = str(ballpark.get("guests", 50))

    # Inject option 1 + option 2 fields
    if len(ballpark.get("options", [])) >= 1:
        merge.update(to_template_fields(ballpark, "option_1", 0))
    if len(ballpark.get("options", [])) >= 2:
        merge.update(to_template_fields(ballpark, "option_2", 1))

    # Substitute every {{key}} in the template
    rendered = template
    for key, value in merge.items():
        rendered = rendered.replace("{{" + key + "}}", str(value))

    return rendered


def main():
    parser = argparse.ArgumentParser(
        description="Render a ballpark email by merging quote JSON + context into the template",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--ballpark", required=True, type=Path,
                        help="Path to ballpark JSON (output of price_ballpark.py)")
    parser.add_argument("--output", required=True, type=Path,
                        help="Path to write the rendered HTML")

    # Lead/event context
    parser.add_argument("--client-first-name", required=True)
    parser.add_argument("--event-type", default="event",
                        help="e.g. 'wedding', 'birthday party', 'corporate dinner'")

    # Tasting context
    parser.add_argument("--tasting-date", default="{{tasting_date}}")
    parser.add_argument("--tasting-time", default="{{tasting_time}}")
    parser.add_argument("--tasting-code", default="{{tasting_code}}")
    parser.add_argument("--tasting-location", default=DEFAULTS["tasting_location"])

    # Rep / signature overrides (rare — Andre is the default)
    parser.add_argument("--rep-name", default=DEFAULTS["rep_name"])
    parser.add_argument("--rep-title", default=DEFAULTS["rep_title"])
    parser.add_argument("--rep-cell", default=DEFAULTS["rep_cell"])
    parser.add_argument("--rep-office", default=DEFAULTS["rep_office"])

    # Optional URL overrides
    parser.add_argument("--menu-calculator-url", default=DEFAULTS["menu_calculator_url"])
    parser.add_argument("--tasting-preview-url", default=DEFAULTS["tasting_preview_url"])
    parser.add_argument("--tasting-register-url", default=DEFAULTS["tasting_register_url"])

    # Body text
    parser.add_argument("--follow-up-window", default=DEFAULTS["follow_up_window"])
    parser.add_argument("--default-steak", default=DEFAULTS["default_steak"])
    parser.add_argument("--default-chicken", default=DEFAULTS["default_chicken"])

    args = parser.parse_args()

    ballpark = json.loads(args.ballpark.read_text())

    context = {
        "client_first_name": args.client_first_name,
        "event_type": args.event_type,
        "tasting_date": args.tasting_date,
        "tasting_time": args.tasting_time,
        "tasting_code": args.tasting_code,
        "tasting_location": args.tasting_location,
        "rep_name": args.rep_name,
        "rep_title": args.rep_title,
        "rep_cell": args.rep_cell,
        "rep_office": args.rep_office,
        "menu_calculator_url": args.menu_calculator_url,
        "tasting_preview_url": args.tasting_preview_url,
        "tasting_register_url": args.tasting_register_url,
        "follow_up_window": args.follow_up_window,
        "default_steak": args.default_steak,
        "default_chicken": args.default_chicken,
    }

    html = render_email(ballpark, context)
    args.output.write_text(html)
    print(f"Rendered {args.output} ({len(html):,} chars)", file=sys.stderr)

    # Surface any unmerged fields so the operator can fix them
    import re
    leftover = set(re.findall(r"\{\{(\w+)\}\}", html))
    if leftover:
        print(f"⚠  Unmerged placeholders: {sorted(leftover)}", file=sys.stderr)
    else:
        print("✓  All placeholders merged.", file=sys.stderr)


if __name__ == "__main__":
    main()
