#!/usr/bin/env python3
"""Fetch an RSS/Atom/JSON feed and merge its posts into js/news-auto.json (used by the site's News section).
Post images are downloaded into assets/news/ so they never expire; YouTube / Facebook videos are detected."""
import hashlib, html, json, os, re, sys
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from urllib.parse import parse_qs, urlsplit
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

FEED_URL = os.environ.get("NEWS_FEED_URL", "").strip()
OUT = os.environ.get("NEWS_OUT", "js/news-auto.json")
IMG_DIR = os.environ.get("NEWS_IMG_DIR", "assets/news")
IMG_HOSTS = tuple(h.strip() for h in os.environ.get("NEWS_IMAGE_HOSTS", "fbcdn.net,fbsbx.com,fetchrss.com,rss.app").split(",") if h.strip())
ALLOW_HTTP = os.environ.get("NEWS_ALLOW_HTTP") == "1"      # tests only
MAX_ITEMS, MAX_BODY, SUMMARY_LEN, MAX_IMG_BYTES = 30, 3000, 160, 3_000_000
ATOM = "{http://www.w3.org/2005/Atom}"
CONTENT = "{http://purl.org/rss/1.0/modules/content/}encoded"
MEDIA = "{http://search.yahoo.com/mrss/}"
UA = {"User-Agent": "Mozilla/5.0 (news-updater)"}
IMG_EXT = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}
YT = re.compile(r"(?:youtube(?:-nocookie)?\.com/(?:watch\?(?:[^\s\"'<>]*&)?v=|shorts/|embed/)|youtu\.be/)([\w-]{11})")
FB_PREFIX = ("https://www.facebook.com/", "https://m.facebook.com/", "https://web.facebook.com/", "https://fb.watch/")


class _Text(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag in ("br", "p", "div", "li"): self.parts.append("\n")
    def handle_endtag(self, tag):
        if tag in ("p", "div", "li"): self.parts.append("\n\n")
    def handle_data(self, data): self.parts.append(data)


def to_text(raw):
    p = _Text(); p.feed(html.unescape(raw or ""))
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


def summarize(body):
    flat = " ".join(body.split())
    return flat if len(flat) <= SUMMARY_LEN else flat[:SUMMARY_LEN].rsplit(" ", 1)[0] + "…"


# ---------- images ----------
def host_ok(url):
    p = urlsplit(url)
    if p.scheme != "https" and not (ALLOW_HTTP and p.scheme == "http"): return False
    h = p.hostname or ""
    return any(h == x or h.endswith("." + x) for x in IMG_HOSTS)


def find_image_url(el, raw):
    for tag in (MEDIA + "content", MEDIA + "thumbnail"):
        for m in el.iter(tag):
            u = m.get("url") or ""
            kind = (m.get("medium") or m.get("type") or "").lower()
            if u and (kind.startswith("image") or re.search(r"\.(jpe?g|png|webp|gif)(\?|$)", u, re.I) or not kind):
                return u
    m = re.search(r"<img[^>]+src=[\"']([^\"']+)", html.unescape(raw or ""), re.I)
    return html.unescape(m.group(1)) if m else ""


def download_image(url):
    """Save the picture under assets/news/ and return its site-relative path ('' if not possible)."""
    if not url or not host_ok(url): return ""
    stem = hashlib.sha1(urlsplit(url).path.encode()).hexdigest()[:16]
    for ext in IMG_EXT.values():
        if os.path.exists(os.path.join(IMG_DIR, stem + ext)): return f"{IMG_DIR}/{stem}{ext}"
    try:
        with urlopen(Request(url, headers=UA), timeout=30) as r:
            ext = IMG_EXT.get((r.headers.get("Content-Type") or "").split(";")[0].strip().lower())
            if not ext: return ""
            data = r.read(MAX_IMG_BYTES + 1)
        if len(data) > MAX_IMG_BYTES: return ""
    except Exception as e:
        print("image download failed:", e, file=sys.stderr); return ""
    os.makedirs(IMG_DIR, exist_ok=True)
    path = f"{IMG_DIR}/{stem}{ext}"
    with open(path, "wb") as f: f.write(data)
    return path


# ---------- video ----------
def fb_ok(u): return bool(u) and u.startswith(FB_PREFIX)
def norm_fb(u): return re.sub(r"^https://(?:m|web)\.facebook\.com/", "https://www.facebook.com/", u)


def find_video(raw, link):
    """YouTube link in the post (most reliable), else the Facebook video of the post."""
    text = html.unescape(raw or "")
    m = YT.search(text)
    if m: return {"type": "youtube", "id": m.group(1)}
    m = re.search(r"<iframe[^>]+src=[\"']([^\"']+)", text, re.I)
    if m:
        u = urlsplit(html.unescape(m.group(1)))
        if u.hostname in ("www.facebook.com", "facebook.com") and u.path.startswith("/plugins/video"):
            href = parse_qs(u.query).get("href", [""])[0]
            if fb_ok(href): return {"type": "facebook", "href": norm_fb(href)}
    if re.search(r"/(?:reels?|videos|watch)/", link or "") and fb_ok(link):
        return {"type": "facebook", "href": norm_fb(link)}
    return None


# ---------- feeds ----------
def make_item(date, title, body, link, img_url, video):
    return {"date": date, "title": title, "summary": summarize(body), "body": body,
            "link": link if link.startswith("https://") else "", "_img": img_url, "video": video}


def parse(xml_bytes):
    root = ET.fromstring(xml_bytes)
    out = []
    for el in list(root.iter("item")) + list(root.iter(ATOM + "entry")):
        raw = (el.findtext(CONTENT) or el.findtext("description") or el.findtext(ATOM + "content")
               or el.findtext(ATOM + "summary") or "")
        body = to_text(raw)[:MAX_BODY]
        title = to_text(el.findtext("title") or el.findtext(ATOM + "title") or "")
        if not title: title = (body.split("\n")[0] or "Update")[:80]
        title = clean_title(title, body)
        link = item_link(el)
        out.append(make_item(
            to_date(el.findtext("pubDate") or el.findtext(ATOM + "published") or el.findtext(ATOM + "updated")),
            title, body, link, find_image_url(el, raw), find_video(raw, link)))
    return out


def parse_json(raw):
    """JSON Feed (rss.app offers one at /feeds/v1.1/<id>.json)."""
    out = []
    for it in json.loads(raw).get("items", []):
        html_body = it.get("content_html") or it.get("content_text") or it.get("summary") or ""
        body = to_text(html_body)[:MAX_BODY]
        title = to_text(it.get("title") or "") or (body.split("\n")[0] or "Update")[:80]
        link = it.get("url") or ""
        out.append(make_item(to_date(it.get("date_published") or it.get("date_modified")),
                             title, body, link, it.get("image") or "", find_video(html_body, link)))
    return out


def post_key(n):
    """Same post => same key, even if two feed services format the link differently."""
    m = re.search(r"(pfbid\w+)|/(?:posts|reel|reels|videos|permalink)/(\d+)", n.get("link") or "")
    if m: return m.group(1) or m.group(2)
    return n.get("link") or (n["date"] + n["title"])


def prune_images(items):
    used = {os.path.basename(i["image"]) for i in items if i.get("image")}
    if not os.path.isdir(IMG_DIR): return
    for f in os.listdir(IMG_DIR):
        if re.fullmatch(r"[0-9a-f]{16}\.(?:jpg|png|webp|gif)", f) and f not in used:
            os.remove(os.path.join(IMG_DIR, f))


def main():
    if not FEED_URL:
        sys.exit("NEWS_FEED_URL secret is not set (repo Settings > Secrets and variables > Actions).")
    with urlopen(Request(FEED_URL, headers=UA), timeout=30) as r:
        data = r.read(5_000_000)
    head = data.lstrip()[:200].lower()
    if head.startswith((b"<!doctype html", b"<html")):
        sys.exit("The URL returned a web page, not a feed. Use the feed's XML link (ends in .xml / .rss) or JSON link.")
    new = parse_json(data) if head.startswith(b"{") else parse(data)
    if not new: sys.exit("Feed parsed but contains no items — leaving news-auto.json unchanged.")
    try: old = json.load(open(OUT, encoding="utf-8"))
    except Exception: old = []
    merged = {post_key(n): n for n in old}
    for n in new:
        n["image"] = download_image(n.pop("_img"))
        prev = merged.get(post_key(n), {})
        if not n["image"] and prev.get("image"): n["image"] = prev["image"]
        if not n.get("video"):
            n.pop("video", None)
            if prev.get("video"): n["video"] = prev["video"]
        merged[post_key(n)] = n
    items = sorted(merged.values(), key=lambda n: n["date"], reverse=True)[:MAX_ITEMS]
    prune_images(items)
    text = json.dumps(items, ensure_ascii=False, indent=2) + "\n"
    if not os.path.exists(OUT) or open(OUT, encoding="utf-8").read() != text:
        open(OUT, "w", encoding="utf-8").write(text)
    print(f"{len(new)} items fetched, {len(items)} stored, {sum(1 for i in items if i.get('image'))} with images.")


if __name__ == "__main__":
    main()
