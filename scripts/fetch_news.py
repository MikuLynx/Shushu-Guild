#!/usr/bin/env python3
"""Fetch an RSS/Atom feed and merge its posts into js/news-auto.json (used by the site's News section)."""
import json, os, re, sys, html
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

FEED_URL = os.environ.get("NEWS_FEED_URL", "").strip()
OUT = os.environ.get("NEWS_OUT", "js/news-auto.json")
MAX_ITEMS, MAX_BODY, SUMMARY_LEN = 30, 3000, 160
ATOM = "{http://www.w3.org/2005/Atom}"
CONTENT = "{http://purl.org/rss/1.0/modules/content/}encoded"


class _Text(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag in ("br", "p", "div", "li"): self.parts.append("\n")
    def handle_endtag(self, tag):
        if tag in ("p", "div", "li"): self.parts.append("\n\n")
    def handle_data(self, data): self.parts.append(data)


def to_text(raw):
    p = _Text(); p.feed(html.unescape(raw or "")); 
    t = html.unescape("".join(p.parts))
    t = re.sub(r"[ \t\r\f\v]+", " ", t)
    t = re.sub(r" ?\n ?", "\n", t)
    return re.sub(r"\n{3,}", "\n\n", t).strip()


def to_date(s):
    s = (s or "").strip()
    for f in (lambda x: parsedate_to_datetime(x), lambda x: datetime.fromisoformat(x.replace("Z", "+00:00"))):
        try:
            d = f(s)
            if d.tzinfo is None: d = d.replace(tzinfo=timezone.utc)
            return d.astimezone(timezone.utc).strftime("%Y-%m-%d")
        except Exception:
            pass
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def item_link(el):
    l = el.findtext("link")
    if l and l.strip(): return l.strip()
    for a in el.findall(ATOM + "link"):
        if a.get("rel", "alternate") == "alternate" and a.get("href"): return a.get("href")
    return (el.findtext("guid") or "").strip()


def clean_title(title, body):
    """Feed titles are cut off with '...'; use the first sentence of the post instead."""
    if not title.endswith(("...", "…")) or not body:
        return title
    first = re.split(r"(?<=[.!?])\s|\n", body.strip(), maxsplit=1)[0]
    if len(first) > 90:
        first = first[:90].rsplit(" ", 1)[0] + "…"
    return first or title


def parse(xml_bytes):
    root = ET.fromstring(xml_bytes)
    els = list(root.iter("item")) + list(root.iter(ATOM + "entry"))
    out = []
    for el in els:
        raw = (el.findtext(CONTENT) or el.findtext("description") or el.findtext(ATOM + "content")
               or el.findtext(ATOM + "summary") or "")
        body = to_text(raw)[:MAX_BODY]
        title = to_text(el.findtext("title") or el.findtext(ATOM + "title") or "")
        if not title: title = (body.split("\n")[0] or "Update")[:80]
        title = clean_title(title, body)
        flat = " ".join(body.split())
        summary = flat if len(flat) <= SUMMARY_LEN else flat[:SUMMARY_LEN].rsplit(" ", 1)[0] + "…"
        link = item_link(el)
        out.append({
            "date": to_date(el.findtext("pubDate") or el.findtext(ATOM + "published") or el.findtext(ATOM + "updated")),
            "title": title, "summary": summary, "body": body,
            "link": link if link.startswith("https://") else "",
        })
    return out


def parse_json(raw):
    """JSON Feed (rss.app offers one at /feeds/v1.1/<id>.json)."""
    out = []
    for it in json.loads(raw).get("items", []):
        body = to_text(it.get("content_html") or it.get("content_text") or it.get("summary") or "")[:MAX_BODY]
        title = to_text(it.get("title") or "") or (body.split("\n")[0] or "Update")[:80]
        flat = " ".join(body.split())
        link = it.get("url") or ""
        out.append({
            "date": to_date(it.get("date_published") or it.get("date_modified")),
            "title": title,
            "summary": flat if len(flat) <= SUMMARY_LEN else flat[:SUMMARY_LEN].rsplit(" ", 1)[0] + "…",
            "body": body, "link": link if link.startswith("https://") else "",
        })
    return out


def main():
    if not FEED_URL:
        sys.exit("NEWS_FEED_URL secret is not set (repo Settings > Secrets and variables > Actions).")
    req = Request(FEED_URL, headers={"User-Agent": "Mozilla/5.0 (news-updater)"})
    with urlopen(req, timeout=30) as r:
        data = r.read(5_000_000)
    head = data.lstrip()[:200].lower()
    if head.startswith((b"<!doctype html", b"<html")):
        sys.exit("The URL returned a web page, not a feed. Use the feed's XML link (ends in .xml) or JSON link from RSS.app.")
    new = parse_json(data) if head.startswith(b"{") else parse(data)
    if not new: sys.exit("Feed parsed but contains no items — leaving news-auto.json unchanged.")
    try: old = json.load(open(OUT, encoding="utf-8"))
    except Exception: old = []
    key = lambda n: n["link"] or (n["date"] + n["title"])
    merged = {key(n): n for n in old}
    merged.update({key(n): n for n in new})
    items = sorted(merged.values(), key=lambda n: n["date"], reverse=True)[:MAX_ITEMS]
    text = json.dumps(items, ensure_ascii=False, indent=2) + "\n"
    if not os.path.exists(OUT) or open(OUT, encoding="utf-8").read() != text:
        open(OUT, "w", encoding="utf-8").write(text)
    print(f"{len(new)} items fetched, {len(items)} stored.")


if __name__ == "__main__":
    main()