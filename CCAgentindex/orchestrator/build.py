#!/usr/bin/env python3
"""
build.py — single-command runner for the CIA orchestrator.

Regenerates every page under `state/` from the canonical file substrate.
No flags, no arguments — re-run anytime, idempotent.

Pipeline order:
    1. bin/refresh.py          → state/master_ledger.csv + state/dashboard.json + state/dashboard.html
    2. bin/today.py            → state/today.html
    3. bin/voice.py andre-at-ceiling   → state/voice/andre-at-ceiling.html
    4. render_lead.py hugo     → state/leads/hugo.html
    5. bin/index.py            → state/index.html

After running:
    open state/index.html
"""

from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PY = sys.executable


STEPS = [
    ("refresh", [PY, str(ROOT / "bin" / "refresh.py")]),
    ("today", [PY, str(ROOT / "bin" / "today.py")]),
    ("voice", [PY, str(ROOT / "bin" / "voice.py"), "andre-at-ceiling"]),
    ("hugo", [PY, str(ROOT / "render_lead.py"), "hugo"]),
    ("brenda-steve", [PY, str(ROOT / "render_lead.py"), "brenda-steve"]),
    ("index", [PY, str(ROOT / "bin" / "index.py")]),
]


def main():
    t0 = time.time()
    print("CIA Runtime · build")
    print("───────────────────")
    failed = 0
    for name, cmd in STEPS:
        print(f"\n[{name}]")
        try:
            r = subprocess.run(cmd, check=False, capture_output=True, text=True)
            if r.stdout.strip():
                for line in r.stdout.strip().splitlines():
                    print(f"  {line}" if not line.startswith("  ") else line)
            if r.returncode != 0:
                failed += 1
                print(f"  FAIL · returncode={r.returncode}")
                if r.stderr.strip():
                    for line in r.stderr.strip().splitlines():
                        print(f"  ! {line}")
        except Exception as e:
            failed += 1
            print(f"  FAIL · {e}")

    elapsed = time.time() - t0
    print()
    print("───────────────────")
    if failed == 0:
        print(f"OK · {len(STEPS)} steps · {elapsed:.2f}s")
        print(f"\n   open {ROOT}/state/index.html")
    else:
        print(f"DONE WITH FAILURES · {failed}/{len(STEPS)} failed · {elapsed:.2f}s")
        sys.exit(1)


if __name__ == "__main__":
    main()
