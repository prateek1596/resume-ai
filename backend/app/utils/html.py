"""Utilities for cleaning and validating generated resume HTML."""
from __future__ import annotations
import re


# Tags that should never appear in a resume fragment
_BANNED_TAGS = re.compile(
    r"<(script|style|link|meta|iframe|object|embed|base|form|input|button)[^>]*>.*?</\1>|"
    r"<(script|style|link|meta|iframe|object|embed|base|form|input|button)[^>]*/?>",
    re.IGNORECASE | re.DOTALL,
)

# Strip any stray DOCTYPE / html / head / body wrappers Claude might emit
_WRAPPER_TAGS = re.compile(
    r"<!DOCTYPE[^>]*>|</?html[^>]*>|</?head[^>]*>|</?body[^>]*>",
    re.IGNORECASE,
)

# Collapse excessive blank lines
_BLANK_LINES = re.compile(r"\n{3,}")


def sanitise(html: str) -> str:
    """Remove unsafe tags and structural wrappers from generated HTML."""
    html = _WRAPPER_TAGS.sub("", html)
    html = _BANNED_TAGS.sub("", html)
    html = _BLANK_LINES.sub("\n\n", html)
    return html.strip()


def inject_base_font(html: str) -> str:
    """Ensure the outermost div has a base font-family for consistency."""
    if not html.startswith("<div"):
        return html
    if "font-family" not in html[:200]:
        html = html.replace("<div", '<div style="font-family:\'Segoe UI\',Arial,sans-serif;" ', 1)
    return html


def wrap_for_print(html: str, title: str = "Resume") -> str:
    """Wrap a resume fragment in a print-ready full HTML document."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; padding: 0; background: white; }}
    @media print {{
      @page {{ margin: 0; size: A4 portrait; }}
      body {{ margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
    }}
  </style>
</head>
<body>
{html}
</body>
</html>"""
