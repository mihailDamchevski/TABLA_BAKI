import json
from types import SimpleNamespace
from unittest.mock import patch

import scripts.fetch_variants as fv


def test_extract_links_parses_variant_html_links():
    html = """
    <html><body>
      <a href="VariantA.html">A</a>
      <a href="/variants/VariantB.html">B</a>
      <a href="http://example.com/not-variant.pdf">PDF</a>
    </body></html>
    """
    links = fv.extract_links(html)
    assert len(links) == 2
    assert links[0].endswith("/VariantA.html")
    assert "VariantB.html" in links[1]


def test_extract_text_strips_scripts_and_styles():
    html = """
    <html>
    <head>
      <style>.cls { color: red; }</style>
      <script>var x = 1;</script>
    </head>
    <body>
      <div> Hello </div>
      <p>World</p>
    </body>
    </html>
    """
    text = fv.extract_text(html)
    assert "Hello" in text
    assert "World" in text
    assert "color" not in text
    assert "var x" not in text


def test_infer_name_from_url_titles():
    assert fv.infer_name_from_url("https://www.bkgm.com/variants/portes.html") == "Portes"
    assert fv.infer_name_from_url("https://www.bkgm.com/variants/Plakoto-Express.html") == "Plakoto Express"
    assert fv.infer_name_from_url("https://www.bkgm.com/variants/Dir/Another_Game.HTML") == "Another Game"


def test_main_builds_json_with_schema(monkeypatch, tmp_path):
    index_html = """
    <html><body>
      <a href="VariantA.html">A</a>
      <a href="VariantB.html">B</a>
    </body></html>
    """
    page_html = """
    <html><head><title>Variant A</title></head>
    <body><p>Some rule text.</p></body></html>
    """

    def fake_urlopen(url):
        if url.endswith("VariantA.html") or url.endswith("VariantB.html"):
            data = page_html.encode("utf-8")
        else:
            data = index_html.encode("utf-8")

        return SimpleNamespace(
            read=lambda: data,
            headers=SimpleNamespace(get_content_charset=lambda: "utf-8"),
            __enter__=lambda self=None: self,
            __exit__=lambda *args: None,
        )

    out_file = tmp_path / "out.json"
    with patch("urllib.request.urlopen", side_effect=fake_urlopen):
        fv.main(str(out_file))

    saved = json.loads(out_file.read_text(encoding="utf-8"))
    assert len(saved) == 2
    for entry in saved:
        # Verify required keys present
        for key in [
            "name",
            "source_url",
            "setup",
            "movement",
            "dice",
            "hitting",
            "bar_enter",
            "forced_moves",
            "combined_moves",
            "bearing_off",
            "win_condition",
            "special_rules",
            "notes",
        ]:
            assert key in entry
