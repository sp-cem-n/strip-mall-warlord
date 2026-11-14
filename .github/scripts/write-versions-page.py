#!/usr/bin/env python3
"""Write dist/versions/index.html listing latest main and every v* tag."""
from __future__ import annotations

import argparse
import html
import subprocess
from pathlib import Path


def subject(ref: str) -> str:
    out = subprocess.check_output(
        ["git", "log", "-1", "--format=%s", ref], text=True
    ).strip()
    return html.escape(out)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--repo", required=True, help="Repository name (Pages path prefix)")
    p.add_argument("--out", default="dist/versions/index.html")
    p.add_argument("tags", nargs="*", help="Version tags to list, oldest first")
    args = p.parse_args()

    base = f"/{args.repo}"
    items = [
        f'        <li><a href="{base}/">Latest</a> <span class="muted">current main — {subject("HEAD")}</span></li>'
    ]
    for tag in reversed(args.tags):
        safe = html.escape(tag)
        items.append(
            f'        <li><a href="{base}/{safe}/">{safe}</a> <span class="muted">{subject(tag)}</span></li>'
        )

    page = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Strip Mall Warlord — Versions</title>
    <style>
      html, body {{
        margin: 0;
        background: #24222b;
        color: #cfc6b0;
        font-family: "Courier New", ui-monospace, monospace;
      }}
      main {{ max-width: 42rem; margin: 3rem auto; padding: 0 1.5rem; }}
      h1 {{
        font-size: 1.35rem;
        letter-spacing: 0.12em;
        color: #f6d27a;
        text-transform: uppercase;
      }}
      p {{ color: #8f8a86; }}
      ul {{ list-style: none; padding: 0; }}
      li {{
        margin: 0.55rem 0;
        padding: 0.75rem 0.9rem;
        background: #1a1420;
        border: 2px solid #3a3941;
      }}
      a {{ color: #6fb3a2; text-decoration: none; }}
      a:hover {{ color: #f6d27a; }}
      .muted {{ color: #8f8a86; font-size: 0.85rem; }}
    </style>
  </head>
  <body>
    <main>
      <h1>Strip Mall Warlord</h1>
      <p>Older versions. Each one keeps its own save, separate from the latest game.</p>
      <ul>
{chr(10).join(items)}
      </ul>
    </main>
  </body>
</html>
"""
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page, encoding="utf-8")
    print(f"wrote {out} with {len(args.tags)} archived version(s)")


if __name__ == "__main__":
    main()
