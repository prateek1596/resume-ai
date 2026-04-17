"""Unit tests for HTML post-processing utilities."""
from app.utils.html import sanitise, wrap_for_print


def test_sanitise_removes_script():
    dirty = '<div><p>Hello</p><script>alert("xss")</script></div>'
    clean = sanitise(dirty)
    assert "<script>" not in clean
    assert "Hello" in clean


def test_sanitise_removes_style_tag():
    dirty = "<div><style>body{color:red}</style><p>text</p></div>"
    clean = sanitise(dirty)
    assert "<style>" not in clean
    assert "text" in clean


def test_sanitise_strips_doctype_and_wrappers():
    wrapped = "<!DOCTYPE html><html><head></head><body><div>resume</div></body></html>"
    clean = sanitise(wrapped)
    assert "<!DOCTYPE" not in clean
    assert "<html" not in clean
    assert "<body" not in clean
    assert "resume" in clean


def test_sanitise_passthrough_clean_html():
    clean_input = '<div style="font-family:Arial"><h1>Jane Smith</h1><p>Engineer</p></div>'
    result = sanitise(clean_input)
    assert "Jane Smith" in result
    assert "Engineer" in result


def test_wrap_for_print_contains_title():
    html = "<div>resume content</div>"
    wrapped = wrap_for_print(html, title="John Doe")
    assert "<title>John Doe</title>" in wrapped
    assert "resume content" in wrapped
    assert "<!DOCTYPE html>" in wrapped
    assert "@media print" in wrapped


def test_sanitise_collapses_blank_lines():
    messy = "<div>line1\n\n\n\n\nline2</div>"
    clean = sanitise(messy)
    assert "\n\n\n" not in clean
