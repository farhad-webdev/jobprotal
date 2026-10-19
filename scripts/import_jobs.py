#!/usr/bin/env python3
"""
Daily job importer for JobPulse CMS.
Pulls fresh jobs from official free sources and posts them via the agent API.
By default jobs are auto-published (AUTO_PUBLISH=true); set AUTO_PUBLISH=false
to leave them as drafts for admin review.

Sources:
  - RemoteOK  (official public API, https://remoteok.com/api)
  - Remotive   (official public API, https://remotive.com/api/remote-jobs)
  - Prothom Alo stories.rss filtered for job circulars (official RSS feed)
  - Jugantor /job-seek listing (static HTML, article pages parsed for pub date)
  - Dainik Shiksha job-news category (JS-rendered; requires playwright)
  - Arbeitnow (official public API, https://www.arbeitnow.com/api/job-board-api)

Env vars:
  AGENT_API_KEY  (required) - x-api-key for POST /api/jobs
  API_BASE_URL   (required) - e.g. https://jobprotal-production.up.railway.app
  MAX_JOBS       (default 8) - max jobs to post per run
  FRESH_DAYS     (default 3) - only jobs posted within last N days
"""
import json
import os
import re
import sys
import html as htmlmod
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

API_BASE = os.environ.get("API_BASE_URL", "").rstrip("/")
KEY = os.environ.get("AGENT_API_KEY", "")
MAX_JOBS = int(os.environ.get("MAX_JOBS", "8"))
FRESH_DAYS = int(os.environ.get("FRESH_DAYS", "3"))
# Focus mode: comma-separated keywords; matching jobs are picked first.
# e.g. FOCUS_KEYWORDS="wordpress,elementor,woocommerce,web design,frontend,php"
FOCUS = [k.strip().lower() for k in os.environ.get("FOCUS_KEYWORDS", "").split(",") if k.strip()]


def focus_hits(c):
    if not FOCUS:
        return 0
    t = (c["title"] + " " + (c.get("summary") or "")).lower()
    return sum(1 for k in FOCUS if k in t)
# Auto-publish instead of leaving drafts (owner's choice: no manual approval wait)
AUTO_PUBLISH = os.environ.get("AUTO_PUBLISH", "true").lower() == "true"

if not API_BASE or not KEY:
    print("ERROR: API_BASE_URL and AGENT_API_KEY env vars are required")
    sys.exit(1)


def fetch(url, raw=False):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; JobPulse/1.0)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
    return data if raw else json.loads(data)


def parse_date(s):
    try:
        d = datetime.fromisoformat(str(s).replace("Z", "+00:00"))
        if d.tzinfo is None:
            d = d.replace(tzinfo=timezone.utc)
        return d
    except Exception:
        return None


def map_category(tags, raw_cat=""):
    t = (" ".join(tags) + " " + raw_cat).lower()
    if any(k in t for k in ["data", "analyst", "scientist", "machine learning"]):
        return "Data"
    if any(k in t for k in ["design", "ui", "ux", "figma"]):
        return "Design"
    if any(k in t for k in ["marketing", "seo", "content", "growth", "social"]):
        return "Marketing"
    if any(k in t for k in ["sales", "account executive"]):
        return "Sales"
    if any(k in t for k in ["product"]):
        return "Product"
    return "Engineering"


def map_category_bn(title):
    t = title.lower()
    if any(k in t for k in ["সফটওয়্যার", "প্রকৌশলী", "engineer", "developer", "ডেভেলপার", "আইটি", " তথ্য"]):
        return "Engineering"
    if any(k in t for k in ["ডিজাইন", "design"]):
        return "Design"
    if any(k in t for k in ["মার্কেটিং", "marketing"]):
        return "Marketing"
    if any(k in t for k in ["বিক্রয়", "sales"]):
        return "Sales"
    return "Product"


def extract_org_bn(title):
    """Heuristic: org name usually precedes নিয়োগ/চাকরি/বিজ্ঞপ্তি in BD circular headlines."""
    parts = re.split(r"নিয়োগ|চাকরি|বিজ্ঞপ্তি", title, maxsplit=1)
    org = parts[0] if parts else ""
    org = re.sub(r"\d+\s*পদে?", "", org)
    org = org.strip(" েতের-–—:,।").strip()
    return org[:60]


# ---------- Bangla date helpers (for BD news circulars) ----------
BN_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
BN_MONTHS = {
    "জানুয়ারি": 1, "ফেব্রুয়ারি": 2, "মার্চ": 3, "এপ্রিল": 4,
    "মে": 5, "জুন": 6, "জুলাই": 7, "আগস্ট": 8,
    "সেপ্টেম্বর": 9, "অক্টোবর": 10, "নভেম্বর": 11, "ডিসেম্বর": 12,
}
BN_MONTH_PAT = "|".join(BN_MONTHS.keys())


def parse_bn_date(text):
    """'১৮ অক্টোবর ২০২৬' -> date. Returns None if not found."""
    m = re.search(r"([০-৯\d]{1,2})\s*(" + BN_MONTH_PAT + r")\s*,?\s*([০-৯\d]{4})", text or "")
    if not m:
        return None
    try:
        return date(
            year=int(m.group(3).translate(BN_DIGITS)),
            month=BN_MONTHS[m.group(2)],
            day=int(m.group(1).translate(BN_DIGITS)),
        )
    except ValueError:
        return None


def extract_deadline_bn(title, pub):
    """Real deadline from headlines like 'আবেদন শেষ ৩০ অক্টোবর'. Fallback: pub + 21 days."""
    m = re.search(r"আবেদন(?:ের)?\s*(?:শেষ|শেষ তারিখ)\s*:?\s*([০-৯\d]{1,2})\s*(" + BN_MONTH_PAT + r")", title or "")
    if m:
        try:
            dl = date(pub.year, BN_MONTHS[m.group(2)], int(m.group(1).translate(BN_DIGITS)))
            if dl < pub:  # year rollover (e.g. Dec circular, Jan deadline)
                dl = date(pub.year + 1, BN_MONTHS[m.group(2)], int(m.group(1).translate(BN_DIGITS)))
            return dl
        except ValueError:
            pass
    return pub + timedelta(days=21)


def bn_candidate(title, url, pub, source):
    """Shared candidate dict for BD news circulars."""
    org = extract_org_bn(title)
    return {
        "title": title, "companyName": org or "See circular",
        "location": "Bangladesh", "jobType": "Full-time",
        "category": map_category_bn(title),
        "salaryMin": None, "salaryMax": None,
        "salaryText": "As per circular", "salaryCurrency": "BDT",
        "summary": f"Job circular published in {source}: {title}",
        "applyUrl": url, "sourceName": source, "sourceUrl": url,
        "postedDate": pub.isoformat(),
        "deadline": extract_deadline_bn(title, pub).isoformat(),
    }


def fresh_bn(pub):
    return pub is not None and (now.date() - pub).days <= FRESH_DAYS


now = datetime.now(timezone.utc)
candidates = []

# --- RemoteOK ---
try:
    rok = fetch("https://remoteok.com/api?limit=50")
    for j in rok[1:]:
        d = parse_date(j.get("date", ""))
        if not d or (now - d).days > FRESH_DAYS:
            continue
        tags = j.get("tags", []) or []
        comp = (j.get("company") or "").strip()
        pos = (j.get("position") or "").strip()
        candidates.append({
            "title": pos, "companyName": comp, "location": "Remote", "jobType": "Remote",
            "category": map_category(tags),
            "salaryMin": j.get("salary_min") or None, "salaryMax": j.get("salary_max") or None,
            "salaryText": "Negotiable" if not j.get("salary_min") else f"${j.get('salary_min', 0):,} - ${j.get('salary_max', 0):,}",
            "salaryCurrency": "USD" if j.get("salary_min") else "BDT",
            "summary": f"{comp} is hiring a {pos}. This is a remote role." + (f" Focus areas: {', '.join(tags[:5])}." if tags else ""),
            "applyUrl": j.get("apply_url") or j.get("url"),
            "sourceName": "RemoteOK", "sourceUrl": j.get("url"),
            "postedDate": d.date().isoformat(),
            "deadline": (d + timedelta(days=30)).date().isoformat(),
        })
    print(f"RemoteOK: fresh candidates so far: {len(candidates)}")
except Exception as e:
    print(f"RemoteOK fetch failed: {e}")

# --- Remotive ---
try:
    rem = fetch("https://remotive.com/api/remote-jobs?limit=50")
    for j in rem.get("jobs", []):
        d = parse_date(j.get("publication_date", ""))
        if not d or (now - d).days > FRESH_DAYS:
            continue
        tags = j.get("tags", []) or []
        jt = (j.get("job_type") or "full_time").replace("_", " ")
        comp = (j.get("company_name") or "").strip()
        title = (j.get("title") or "").strip()
        candidates.append({
            "title": title, "companyName": comp,
            "location": j.get("candidate_required_location") or "Remote", "jobType": "Remote",
            "category": map_category(tags, j.get("category", "")),
            "salaryMin": None, "salaryMax": None,
            "salaryText": j.get("salary") or "Negotiable",
            "salaryCurrency": "USD" if j.get("salary") else "BDT",
            "summary": f"{comp} is hiring a {title}. Remote {jt} role." + (f" Focus areas: {', '.join(tags[:5])}." if tags else ""),
            "applyUrl": j.get("url"), "sourceName": "Remotive", "sourceUrl": j.get("url"),
            "postedDate": d.date().isoformat(),
            "deadline": (d + timedelta(days=30)).date().isoformat(),
        })
    print(f"After Remotive: {len(candidates)} candidates")
except Exception as e:
    print(f"Remotive fetch failed: {e}")

# --- Prothom Alo RSS: filter for job circulars (official feed) ---
JOB_KW = ["নিয়োগ বিজ্ঞপ্তি", "নিয়োগ", "চাকরি"]
try:
    raw = fetch("https://www.prothomalo.com/stories.rss", raw=True)
    root = ET.fromstring(raw)
    added = 0
    for item in root.iter("item"):
        if added >= 3:
            break
        title_el, link_el, date_el = item.find("title"), item.find("link"), item.find("pubDate")
        title = (title_el.text or "").strip() if title_el is not None else ""
        link = (link_el.text or "").strip() if link_el is not None else ""
        if not title or not link or not any(k in title for k in JOB_KW):
            continue
        try:
            d = parsedate_to_datetime(date_el.text) if date_el is not None and date_el.text else None
            if d and d.tzinfo is None:
                d = d.replace(tzinfo=timezone.utc)
        except Exception:
            d = None
        if not d or (now - d).days > FRESH_DAYS:
            continue
        candidates.append(bn_candidate(title, link, d.date(), "Prothom Alo"))
        added += 1
    print(f"Prothom Alo job circulars found: {added}")
except Exception as e:
    print(f"Prothom Alo RSS failed: {e}")

# --- Jugantor job section (static HTML listing) ---
try:
    jhtml = fetch("https://www.jugantor.com/job-seek", raw=True).decode("utf-8", "replace")
    jurls = []
    for m in re.finditer(r'href="(https://www\.jugantor\.com/job-seek/\d+)"', jhtml):
        if m.group(1) not in jurls:
            jurls.append(m.group(1))
    jadded = 0
    for url in jurls[:6]:
        try:
            art = fetch(url, raw=True).decode("utf-8", "replace")
        except Exception:
            continue
        tm = re.search(r'<meta property="og:title" content="([^"]+)"', art)
        title = htmlmod.unescape(tm.group(1)).strip() if tm else ""
        if not title:
            continue
        dm = re.search(r"প্রকাশ:\s*([^<]{5,60})", art)
        pub = parse_bn_date(dm.group(1)) if dm else None
        if not fresh_bn(pub):
            continue
        candidates.append(bn_candidate(title, url, pub, "Jugantor"))
        jadded += 1
    print(f"Jugantor job circulars found: {jadded}")
except Exception as e:
    print(f"Jugantor fetch failed: {e}")

# --- Dainik Shiksha job section (JS-rendered; needs playwright) ---
try:
    from playwright.sync_api import sync_playwright
    ds_items = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        pg = browser.new_page(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
        pg.goto("https://www.dainikshiksha.com/bn/category/job-news-17", timeout=45000)
        pg.wait_for_selector('a[href*="/bn/news/"]', timeout=30000)
        links = pg.eval_on_selector_all(
            'a[href*="/bn/news/"]',
            "els => els.map(e => e.href)",
        )
        seen = set()
        for href in links:
            if href not in seen:
                seen.add(href)
                ds_items.append(href)
            if len(ds_items) >= 6:
                break
        ds_added = 0
        for url in ds_items:
            try:
                pg.goto(url, timeout=45000)
                title = pg.eval_on_selector("h1", "e => e.innerText") or ""
                body = pg.eval_on_selector("body", "e => e.innerText") or ""
            except Exception:
                continue
            title = title.strip()
            if not title:
                continue
            dm = re.search(r"প্রকাশিত:\s*([^\n]{5,60})", body)
            pub = parse_bn_date(dm.group(1)) if dm else None
            if not fresh_bn(pub):
                continue
            candidates.append(bn_candidate(title, url, pub, "Dainik Shiksha"))
            ds_added += 1
        browser.close()
    print(f"Dainik Shiksha job circulars found: {ds_added}")
except ImportError:
    print("Dainik Shiksha skipped: playwright not installed")
except Exception as e:
    print(f"Dainik Shiksha failed: {e}")

# --- Arbeitnow (official public API, no key needed) ---
try:
    arb = fetch("https://www.arbeitnow.com/api/job-board-api")
    ajobs = arb.get("data", []) if isinstance(arb, dict) else []
    for j in ajobs:
        ts = j.get("created_at") or 0
        d = datetime.fromtimestamp(ts, tz=timezone.utc) if ts else None
        if not d or (now - d).days > FRESH_DAYS:
            continue
        tags = j.get("tags", []) or []
        jt = " ".join(j.get("job_types", []) or [])
        comp = (j.get("company_name") or "").strip()
        title = (j.get("title") or "").strip()
        remote = j.get("remote")
        candidates.append({
            "title": title, "companyName": comp,
            "location": "Remote" if remote else (j.get("location") or "On-site"),
            "jobType": "Remote" if remote else "Full-time",
            "category": map_category(tags, jt),
            "salaryMin": None, "salaryMax": None,
            "salaryText": "Negotiable", "salaryCurrency": "USD" if remote else "BDT",
            "summary": f"{comp} is hiring a {title}." + (f" Focus areas: {', '.join(tags[:5])}." if tags else ""),
            "applyUrl": j.get("url"), "sourceName": "Arbeitnow", "sourceUrl": j.get("url"),
            "postedDate": d.date().isoformat(),
            "deadline": (d + timedelta(days=30)).date().isoformat(),
        })
    print(f"After Arbeitnow: {len(candidates)} candidates")
except Exception as e:
    print(f"Arbeitnow fetch failed: {e}")

# --- jobs.wordpress.net (official WordPress jobs board, RSS) ---
try:
    wp_added = 0
    for feed_url, wpcat in [
        ("https://jobs.wordpress.net/job_category/development/feed/", "Engineering"),
        ("https://jobs.wordpress.net/job_category/design/feed/", "Design"),
    ]:
        raw = fetch(feed_url, raw=True)
        root = ET.fromstring(raw)
        for item in root.iter("item"):
            title = (item.find("title").text or "").strip() if item.find("title") is not None else ""
            link = (item.find("link").text or "").strip() if item.find("link") is not None else ""
            if not title or not link:
                continue
            try:
                d = parsedate_to_datetime(item.find("pubDate").text)
                if d.tzinfo is None:
                    d = d.replace(tzinfo=timezone.utc)
            except Exception:
                d = None
            if not d or (now - d).days > FRESH_DAYS:
                continue
            candidates.append({
                "title": title, "companyName": "See job post",
                "location": "Remote", "jobType": "Remote",
                "category": wpcat,
                "salaryMin": None, "salaryMax": None,
                "salaryText": "As per job post", "salaryCurrency": "USD",
                "summary": f"WordPress job posted on the official WordPress jobs board: {title}",
                "applyUrl": link, "sourceName": "WordPress Jobs", "sourceUrl": link,
                "postedDate": d.date().isoformat(),
                "deadline": (d + timedelta(days=30)).date().isoformat(),
            })
            wp_added += 1
    print(f"WordPress Jobs board: {wp_added} candidates")
except Exception as e:
    print(f"WordPress Jobs failed: {e}")

# pick up to MAX_JOBS, capping each category for diversity
# focus keywords (FOCUS_KEYWORDS) get picked first
picked, cat_n = [], {}
per_cat = max(2, MAX_JOBS // 4)
for c in sorted(candidates, key=lambda x: (focus_hits(x), x["postedDate"]), reverse=True):
    if not c["title"] or not c["companyName"] or not c["applyUrl"] or not c["sourceUrl"]:
        continue
    if cat_n.get(c["category"], 0) >= per_cat:
        continue
    picked.append(c)
    cat_n[c["category"]] = cat_n.get(c["category"], 0) + 1
    if len(picked) >= MAX_JOBS:
        break

print(f"Posting {len(picked)} jobs as drafts...")
posted, skipped = 0, 0
for c in picked:
    payload = {
        "title": c["title"], "companyName": c["companyName"], "location": c["location"],
        "jobType": c["jobType"], "category": c["category"],
        "salaryMin": c["salaryMin"], "salaryMax": c["salaryMax"],
        "salaryCurrency": c["salaryCurrency"], "salaryText": c["salaryText"],
        "descriptionSummary": c["summary"],
        "responsibilities": [], "requirements": [], "benefits": [],
        "applyUrl": c["applyUrl"], "sourceName": c["sourceName"], "sourceUrl": c["sourceUrl"],
        "postedDate": c["postedDate"], "deadline": c["deadline"],
    }
    req = urllib.request.Request(
        API_BASE + "/api/jobs",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "x-api-key": KEY},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            res = json.load(r)
        job_id = res.get("id")
        final_status = res.get("status")
        # auto-publish so new jobs go public without waiting for manual approval
        if AUTO_PUBLISH and job_id and final_status != "published":
            pub_req = urllib.request.Request(
                f"{API_BASE}/api/jobs/{job_id}/status",
                data=json.dumps({"status": "published"}).encode(),
                headers={"Content-Type": "application/json"},
                method="PATCH",
            )
            try:
                with urllib.request.urlopen(pub_req, timeout=30) as pr:
                    final_status = json.load(pr).get("status", final_status)
            except Exception as e:
                print(f"  WARN publish failed for {job_id}: {e}")
        print(f"  OK   [{c['category']}] {c['title'][:50]} -> {final_status}")
        posted += 1
    except urllib.error.HTTPError as e:
        print(f"  SKIP [{c['category']}] {c['title'][:50]} -> HTTP {e.code} {e.read().decode()[:100]}")
        skipped += 1

print(f"Done: {posted} posted, {skipped} skipped (duplicates/expired)")
