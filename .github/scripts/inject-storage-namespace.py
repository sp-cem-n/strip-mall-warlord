#!/usr/bin/env python3
"""Prefix localStorage keys in a built index.html so archived versions
don't share a save slot with the latest game (or each other).

Injects a classic script at the top of <head> that wraps the localStorage
instance methods (not Storage.prototype, so sessionStorage is untouched).
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path


def wrap_script(prefix: str) -> str:
    return f"""<script>
    (function () {{
      var prefix = {prefix!r};
      var storage = window.localStorage;
      var proto = Storage.prototype;
      var getItem = proto.getItem;
      var setItem = proto.setItem;
      var removeItem = proto.removeItem;
      var clear = proto.clear;
      var keyFn = proto.key;
      storage.getItem = function (key) {{
        return getItem.call(storage, prefix + String(key));
      }};
      storage.setItem = function (key, value) {{
        return setItem.call(storage, prefix + String(key), value);
      }};
      storage.removeItem = function (key) {{
        return removeItem.call(storage, prefix + String(key));
      }};
      storage.clear = function () {{
        var toRemove = [];
        for (var i = storage.length - 1; i >= 0; i--) {{
          var k = keyFn.call(storage, i);
          if (k && k.indexOf(prefix) === 0) toRemove.push(k);
        }}
        for (var j = 0; j < toRemove.length; j++) removeItem.call(storage, toRemove[j]);
      }};
    }})();
    </script>"""


def inject(path: Path, tag: str) -> None:
    prefix = f"smw-{tag}:"
    html = path.read_text(encoding="utf-8")
    needle = "<head>"
    idx = html.lower().find(needle)
    if idx == -1:
        raise SystemExit(f"no <head> in {path}")
    end = idx + len(needle)
    path.write_text(html[:end] + "\n    " + wrap_script(prefix) + html[end:], encoding="utf-8")
    print(f"injected localStorage namespace {prefix} into {path}", file=sys.stderr)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("index_html", type=Path)
    p.add_argument("tag", help="Version tag, e.g. v0.3")
    args = p.parse_args()
    if not args.index_html.is_file():
        raise SystemExit(f"missing file: {args.index_html}")
    inject(args.index_html, args.tag)


if __name__ == "__main__":
    main()
