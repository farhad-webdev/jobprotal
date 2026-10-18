#!/usr/bin/env python3
"""
Daily job importer for JobPulse CMS.
Pulls fresh jobs from official free sources and posts them as drafts
via the agent API for admin review.

Sources:
  - RemoteOK  (official public API, https://remoteok.com/api)
  - Remotive   (official public API, https://remotive.com/api/remote-jobs)
  - Prothom Alo stories.rss filtered for job circulars (official RSS feed)

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
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

API_BASE = os.environ.get("API_BASE_URL", "").rstrip("/")
KEY = os.environ.get("AGENT_API_KEY", "")
MAX_JOBS = int(os.environ.get("MAX_JOBS", "8"))
FRESH_DAYS = int(os.environ.get("FRESH_DAYS", "3"))

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
        org = extract_org_bn(title)
        candidates.append({
            "title": title, "companyName": org or "See circular",
            "location": "Bangladesh", "jobType": "Full-time",
            "category": map_category_bn(title),
            "salaryMin": None, "salaryMax": None, "salaryText": "As per circular", "salaryCurrency": "BDT",
            "summary": f"Job circular published in Prothom Alo: {title}. Please verify the application deadline on the original circular before approving.",
            "applyUrl": link, "sourceName": "Prothom Alo", "sourceUrl": link,
            "postedDate": d.date().isoformat(),
            "deadline": (d + timedelta(days=21)).date().isoformat(),
        })
        added += 1
    print(f"Prothom Alo job circulars found: {added}")
except Exception as e:
    print(f"Prothom Alo RSS failed: {e}")

# pick up to MAX_JOBS, preferring category diversity
picked, seen_cats = [], set()
for c in sorted(candidates, key=lambda x: x["postedDate"], reverse=True):
    if not c["title"] or not c["companyName"] or not c["applyUrl"] or not c["sourceUrl"]:
        continue
    if c["category"] in seen_cats and len(picked) >= MAX_JOBS // 2:
        continue
    picked.append(c)
    seen_cats.add(c["category"])
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
        print(f"  OK   [{c['category']}] {c['title'][:50]} -> {res.get('status')}")
        posted += 1
    except urllib.error.HTTPError as e:
        print(f"  SKIP [{c['category']}] {c['title'][:50]} -> HTTP {e.code} {e.read().decode()[:100]}")
        skipped += 1

print(f"Done: {posted} posted, {skipped} skipped (duplicates/expired)")
