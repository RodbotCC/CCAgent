#!/usr/bin/env python3
"""
Comeketo Catering — Ballpark Pricing Calculator
================================================

Computes ballpark quote totals matching Andre's existing email format:

    Food          ($X.XX × N guests)        $X,XXX.XX
    Appetizers                              $XXX.XX
    MA Tax        (7%)                      $XXX.XX
    Service, Fuel & Admin (24%)             $XXX.XX
    Service Charge (over 50 guests at $3pp) $XXX.XX
    -------------------------------------------------
    Ballpark Total                          ~$X,XXX.XX

Usage (CLI):

    # Quick: one option, just the per-person food price
    python price_ballpark.py --guests 100 --food-pp 17.99

    # Two-option ballpark (the standard Andre output)
    python price_ballpark.py --guests 100 \\
        --option1 "Brazilian BBQ (Churrasco)" 17.99 \\
        --option2 "Deluxe Churrasco" 20.99 \\
        --output quote.json

    # With appetizers add-on per option
    python price_ballpark.py --guests 100 \\
        --option1 "Buffet Mini" 17.99 --apps1 350 \\
        --option2 "Buffet Full" 20.99 --apps2 450

Usage (as a module):

    from price_ballpark import calculate_option, build_ballpark
    opt = calculate_option(food_pp=17.99, guests=100, appetizer_total=0)
    ballpark = build_ballpark(guests=100, options=[
        {"name": "Brazilian BBQ", "food_pp": 17.99, "pitch": "..."},
        {"name": "Deluxe", "food_pp": 20.99, "pitch": "..."},
    ])
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Optional

# ────────────────────────────────────────────────────────────────────────────
# Constants (Andre's standard rates — all editable per quote if needed)
# ────────────────────────────────────────────────────────────────────────────
DEFAULT_TAX_RATE = 0.07              # MA sales tax on food
DEFAULT_SERVICE_RATE = 0.24          # Service, Fuel & Admin
SERVICE_CHARGE_PP = 3.00             # $3 per guest
SERVICE_CHARGE_THRESHOLD = 50        # Only kicks in above 50 guests
DEFAULT_GUESTS_FALLBACK = 50         # Per the guardrails doc

# ────────────────────────────────────────────────────────────────────────────
# Core calculation
# ────────────────────────────────────────────────────────────────────────────

def calculate_option(
    food_pp: float,
    guests: int,
    appetizer_total: float = 0.0,
    extras_label: str = "Appetizers",
    tax_rate: float = DEFAULT_TAX_RATE,
    service_rate: float = DEFAULT_SERVICE_RATE,
    service_charge_pp: float = SERVICE_CHARGE_PP,
    service_charge_threshold: int = SERVICE_CHARGE_THRESHOLD,
) -> dict:
    """
    Compute one ballpark option's full breakdown.

    Returns a dict with all line items + grand total, ready to drop into
    the email template's merge fields.
    """
    food_total = round(food_pp * guests, 2)

    # MA tax & service apply to food + extras (the line items the customer is paying for)
    taxable_base = food_total + appetizer_total
    tax_total = round(taxable_base * tax_rate, 2)
    service_total = round(taxable_base * service_rate, 2)

    # Service charge: only if guest count exceeds threshold
    if guests > service_charge_threshold:
        service_charge_total = round(service_charge_pp * guests, 2)
        service_charge_label = f"Service Charge (over {service_charge_threshold} guests at ${service_charge_pp:.0f}/pp)"
    else:
        service_charge_total = 0.0
        service_charge_label = "Service Charge"

    grand_total = round(
        food_total + appetizer_total + tax_total + service_total + service_charge_total,
        2
    )

    return {
        "food_pp": food_pp,
        "guests": guests,
        "food_total": food_total,
        "extras_label": extras_label,
        "extras_total": round(appetizer_total, 2),
        "tax_rate": int(tax_rate * 100),
        "tax_total": tax_total,
        "service_rate": int(service_rate * 100),
        "service_total": service_total,
        "charge_label": service_charge_label,
        "charge_total": service_charge_total,
        "grand_total": grand_total,
    }


def build_ballpark(guests: int, options: list, **kwargs) -> dict:
    """
    Build the full multi-option ballpark structure.

    `options` is a list of dicts, each like:
        {"name": "...", "food_pp": 17.99, "pitch": "...", "appetizer_total": 0}
    """
    if guests is None or guests < 1:
        guests = DEFAULT_GUESTS_FALLBACK

    computed = []
    for opt in options:
        calc = calculate_option(
            food_pp=opt["food_pp"],
            guests=guests,
            appetizer_total=opt.get("appetizer_total", 0.0),
            extras_label=opt.get("extras_label", "Appetizers"),
            **kwargs,
        )
        calc["name"] = opt["name"]
        calc["pitch"] = opt.get("pitch", "")
        computed.append(calc)

    return {
        "guests": guests,
        "options": computed,
    }


# ────────────────────────────────────────────────────────────────────────────
# Menu lookup — derive food_pp from the menu database
# ────────────────────────────────────────────────────────────────────────────

def load_menu(menu_path: Optional[Path] = None) -> dict:
    """Load the bundled menu_data.json (defaults to skill's assets/ folder)."""
    if menu_path is None:
        menu_path = Path(__file__).resolve().parent.parent / "assets" / "menu_data.json"
    with open(menu_path) as f:
        return json.load(f)


def find_service_package(menu: dict, name_query: str) -> Optional[dict]:
    """
    Search the Services category for a matching package by partial name.
    Returns the full item dict (incl. price, mains, sides) or None.
    """
    services = menu.get("Services", [])
    q = name_query.lower().strip()
    # exact-ish first
    for item in services:
        if "name" not in item:
            continue
        if item["name"].lower() == q:
            return item
    # then partial
    for item in services:
        if "name" not in item:
            continue
        if q in item["name"].lower():
            return item
    return None


def list_service_packages(menu: dict) -> list:
    """Return all Services packages with their pricing and inclusions."""
    return [item for item in menu.get("Services", []) if "name" in item]


# ────────────────────────────────────────────────────────────────────────────
# Number formatting helpers (for template merge fields)
# ────────────────────────────────────────────────────────────────────────────

def fmt_money(n: float) -> str:
    """Format as 1,799.00 (no $ sign — template adds it)."""
    return f"{n:,.2f}"


def to_template_fields(ballpark: dict, prefix: str, option_index: int) -> dict:
    """
    Convert one option's calc result into {{merge_field}} key/value pairs
    matching the email template's variable names.

    e.g. for option_index=0, prefix="option_1", produces:
        option_1_name, option_1_food_pp, option_1_food_total, ...
    """
    opt = ballpark["options"][option_index]
    return {
        f"{prefix}_name": opt["name"],
        f"{prefix}_pitch": opt["pitch"],
        f"{prefix}_food_pp": fmt_money(opt["food_pp"]),
        f"{prefix}_food_total": fmt_money(opt["food_total"]),
        f"{prefix}_extras_label": opt["extras_label"],
        f"{prefix}_extras_total": fmt_money(opt["extras_total"]),
        f"{prefix}_tax_rate": str(opt["tax_rate"]),
        f"{prefix}_tax_total": fmt_money(opt["tax_total"]),
        f"{prefix}_service_rate": str(opt["service_rate"]),
        f"{prefix}_service_total": fmt_money(opt["service_total"]),
        f"{prefix}_charge_label": opt["charge_label"],
        f"{prefix}_charge_total": fmt_money(opt["charge_total"]),
        f"{prefix}_grand_total": fmt_money(opt["grand_total"]),
    }


# ────────────────────────────────────────────────────────────────────────────
# CLI
# ────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Comeketo ballpark pricing calculator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--guests", type=int,
                        help="Guest count (use 50 as fallback if unknown)")
    parser.add_argument("--food-pp", type=float,
                        help="Single-option mode: food per-person price")
    parser.add_argument("--option1", nargs=2, metavar=("NAME", "PRICE_PP"),
                        help="Two-option mode: option 1 name and per-person price")
    parser.add_argument("--option1-pitch", default="",
                        help="Option 1 pitch line (use ' | ' to separate clauses)")
    parser.add_argument("--apps1", type=float, default=0.0,
                        help="Option 1 appetizers/extras total (flat $)")
    parser.add_argument("--option2", nargs=2, metavar=("NAME", "PRICE_PP"),
                        help="Two-option mode: option 2 name and per-person price")
    parser.add_argument("--option2-pitch", default="",
                        help="Option 2 pitch line")
    parser.add_argument("--apps2", type=float, default=0.0,
                        help="Option 2 appetizers/extras total")
    parser.add_argument("--tax-rate", type=float, default=DEFAULT_TAX_RATE,
                        help=f"Tax rate as decimal (default: {DEFAULT_TAX_RATE})")
    parser.add_argument("--service-rate", type=float, default=DEFAULT_SERVICE_RATE,
                        help=f"Service rate as decimal (default: {DEFAULT_SERVICE_RATE})")
    parser.add_argument("--output", type=str, default=None,
                        help="Write JSON to this file (otherwise stdout)")
    parser.add_argument("--list-packages", action="store_true",
                        help="List all Services packages from the menu and exit")

    args = parser.parse_args()

    if args.list_packages:
        menu = load_menu()
        packages = list_service_packages(menu)
        for p in packages:
            mains = f" · {int(p.get('mains', 0))}m" if p.get('mains') else ""
            sides = f"/{int(p.get('sides', 0))}s" if p.get('sides') else ""
            print(f"  ${p.get('price', 0):>6.2f}/pp  {p['name']}{mains}{sides}")
        return

    if args.guests is None:
        parser.error("--guests is required (use 50 as fallback if unknown)")

    options = []
    if args.option1:
        options.append({
            "name": args.option1[0],
            "food_pp": float(args.option1[1]),
            "pitch": args.option1_pitch,
            "appetizer_total": args.apps1,
        })
    if args.option2:
        options.append({
            "name": args.option2[0],
            "food_pp": float(args.option2[1]),
            "pitch": args.option2_pitch,
            "appetizer_total": args.apps2,
        })

    if not options and args.food_pp:
        options.append({
            "name": "Ballpark",
            "food_pp": args.food_pp,
            "pitch": "",
            "appetizer_total": 0,
        })

    if not options:
        parser.error("Provide either --food-pp, --option1, or both --option1 and --option2")

    ballpark = build_ballpark(
        guests=args.guests,
        options=options,
        tax_rate=args.tax_rate,
        service_rate=args.service_rate,
    )

    output_json = json.dumps(ballpark, indent=2)
    if args.output:
        Path(args.output).write_text(output_json)
        print(f"Wrote {args.output}", file=sys.stderr)
    else:
        print(output_json)


if __name__ == "__main__":
    main()
