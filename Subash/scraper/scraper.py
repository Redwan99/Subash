"""
Subash Perfume Data Scraper
============================
Phase 1, Step 1.3 — Standalone Python script
Scrapes base perfume data (name, brand, notes, image) from Fragrantica
and saves to a .csv file or inserts directly into PostgreSQL.

Usage:
  pip install requests beautifulsoup4 psycopg2-binary python-dotenv
  python scraper.py --mode csv             # save to perfumes.csv
  python scraper.py --mode db              # insert into PostgreSQL
  python scraper.py --mode csv --limit 50  # only scrape 50 perfumes

NOTE: Scrape responsibly. Add delays between requests (already included).
      Check Fragrantica's robots.txt and Terms of Service before scraping.
"""

import argparse
import csv
import os
import re
import time
import logging
import unicodedata
from datetime import datetime
from typing import Optional

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load .env for the DATABASE_URL
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env.local"))

# ──────────────────────────────────────────────
# Logging Setup
# ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("scraper.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("subash-scraper")

# ──────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────
BASE_URL = "https://www.fragrantica.com"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}
DELAY_BETWEEN_REQUESTS = 3.0   # seconds — be respectful
MAX_RETRIES = 3
OUTPUT_CSV = os.path.join(os.path.dirname(__file__), "perfumes.csv")

# Brands prioritised for BD market (Designer + Middle Eastern Clone Houses)
PRIORITY_BRANDS = [
    # Designer Houses
    "Dior", "Chanel", "Yves Saint Laurent", "Versace", "Giorgio Armani",
    "Paco Rabanne", "Creed", "Tom Ford", "Burberry", "Gucci", "Hugo Boss",
    "Calvin Klein", "Dolce & Gabbana", "Givenchy", "Narciso Rodriguez",
    # Middle Eastern & Clone Houses (very popular in BD)
    "Lattafa", "Afnan", "Armaf", "Paris Corner", "Al Haramain",
    "Rasasi", "Ajmal", "Swiss Arabian", "Orientica",
    "Fragrance World", "Oud Elite", "Maison Asrar",
]

# ──────────────────────────────────────────────
# Utility Helpers
# ──────────────────────────────────────────────

def slugify(text: str) -> str:
    """Convert 'Dior Sauvage' → 'dior-sauvage'."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    text = re.sub(r"[\s_]+", "-", text).strip("-")
    return text


def safe_get(url: str, session: requests.Session, retries: int = MAX_RETRIES) -> Optional[BeautifulSoup]:
    """GET a URL with retry logic. Returns a BeautifulSoup object or None."""
    for attempt in range(retries):
        try:
            resp = session.get(url, headers=HEADERS, timeout=15)
            if resp.status_code == 429:
                wait = 30 * (attempt + 1)
                log.warning(f"Rate-limited (429). Waiting {wait}s...")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return BeautifulSoup(resp.text, "html.parser")
        except requests.exceptions.RequestException as e:
            log.error(f"Request failed (attempt {attempt + 1}/{retries}): {e}")
            time.sleep(DELAY_BETWEEN_REQUESTS * (attempt + 1))
    return None


# ──────────────────────────────────────────────
# Scraping Logic
# ──────────────────────────────────────────────

def get_perfume_urls_by_brand(brand: str, session: requests.Session) -> list[str]:
    """
    Search Fragrantica for all perfumes by a given brand and collect their URLs.
    Returns a list of absolute perfume URLs.
    """
    search_url = f"{BASE_URL}/search/?query={requests.utils.quote(brand)}"
    soup = safe_get(search_url, session)
    if not soup:
        log.warning(f"Could not fetch search results for brand: {brand}")
        return []

    urls = []
    # Fragrantica search results are in div.cell.card.fr-news-box
    cards = soup.select("div.cell.card.fr-news-box a[href*='/perfume/']")
    for card in cards:
        href = card.get("href", "")
        if href and "/perfume/" in href:
            full_url = href if href.startswith("http") else BASE_URL + href
            if full_url not in urls:
                urls.append(full_url)

    log.info(f"Found {len(urls)} perfumes for brand '{brand}'")
    return urls


def scrape_perfume_detail(url: str, session: requests.Session) -> Optional[dict]:
    """
    Scrape all required fields from a single Fragrantica perfume detail page.
    Returns a dict or None if the page could not be parsed.
    """
    soup = safe_get(url, session)
    if not soup:
        return None

    try:
        # --- Name & Brand ---
        name_el = soup.select_one("h1[itemprop='name']") or soup.select_one("h1.fn")
        if not name_el:
            # Fallback: try page title
            title = soup.select_one("title")
            name = title.get_text(strip=True).split("|")[0].strip() if title else "Unknown"
        else:
            name = name_el.get_text(strip=True)

        brand_el = soup.select_one("p[itemprop='brand'] span[itemprop='name']") or \
                   soup.select_one("span[itemprop='brand']") or \
                   soup.select_one("a.brand")
        brand = brand_el.get_text(strip=True) if brand_el else "Unknown"

        # --- Image ---
        img_el = soup.select_one("img[itemprop='image']") or \
                 soup.select_one(".bottle-image img") or \
                 soup.select_one("img.perfume-image")
        image_url = ""
        if img_el:
            image_url = img_el.get("src") or img_el.get("data-src") or ""
            if image_url and not image_url.startswith("http"):
                image_url = BASE_URL + image_url

        # --- Release Year ---
        year = None
        year_el = soup.find(string=re.compile(r"\b(19|20)\d{2}\b"))
        if year_el:
            match = re.search(r"\b(19|20)\d{2}\b", str(year_el))
            if match:
                year = int(match.group())

        # --- Perfumer ---
        perfumer = ""
        perfumer_el = soup.select_one("a[href*='/noses/']") or \
                      soup.find("span", string=re.compile("Perfumer"))
        if perfumer_el:
            perfumer = perfumer_el.get_text(strip=True)

        # --- Olfactory Notes ---
        top_notes: list[str] = []
        heart_notes: list[str] = []
        base_notes: list[str] = []

        note_sections = soup.select("div.notes-list")
        if note_sections:
            # Fragrantica groups notes by accordion heading
            for section in note_sections:
                heading_el = section.find_previous(["h4", "h3", "div"], class_=re.compile(r"notes-heading|pyramid"))
                heading = heading_el.get_text(strip=True).lower() if heading_el else ""
                notes = [n.get_text(strip=True) for n in section.select("span.note-name") if n.get_text(strip=True)]

                if not notes:
                    # Alternative markup
                    notes = [a.get_text(strip=True) for a in section.select("a") if a.get_text(strip=True)]

                if "top" in heading:
                    top_notes = notes
                elif "heart" in heading or "middle" in heading:
                    heart_notes = notes
                elif "base" in heading:
                    base_notes = notes

        # If no structured sections, try the flat note pyramid
        if not any([top_notes, heart_notes, base_notes]):
            all_notes = [n.get_text(strip=True) for n in soup.select("div.pyramid-notes span.note-name")]
            one_third = max(1, len(all_notes) // 3)
            top_notes = all_notes[:one_third]
            heart_notes = all_notes[one_third: one_third * 2]
            base_notes = all_notes[one_third * 2:]

        slug = slugify(f"{brand}-{name}")

        return {
            "slug": slug,
            "name": name,
            "brand": brand,
            "image_url": image_url,
            "top_notes": "|".join(top_notes),
            "heart_notes": "|".join(heart_notes),
            "base_notes": "|".join(base_notes),
            "release_year": year or "",
            "perfumer": perfumer,
            "source_url": url,
            "scraped_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        log.error(f"Failed to parse {url}: {e}")
        return None


# ──────────────────────────────────────────────
# Output: CSV
# ──────────────────────────────────────────────

CSV_COLUMNS = [
    "slug", "name", "brand", "image_url",
    "top_notes", "heart_notes", "base_notes",
    "release_year", "perfumer", "source_url", "scraped_at",
]


def save_to_csv(perfumes: list[dict], filepath: str = OUTPUT_CSV) -> None:
    """Append scraped perfumes to a CSV file."""
    file_exists = os.path.isfile(filepath)
    with open(filepath, mode="a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, extrasaction="ignore")
        if not file_exists:
            writer.writeheader()
        writer.writerows(perfumes)
    log.info(f"Saved {len(perfumes)} records to {filepath}")


# ──────────────────────────────────────────────
# Output: PostgreSQL (direct insert via psycopg2)
# ──────────────────────────────────────────────

def save_to_db(perfumes: list[dict]) -> None:
    """Insert scraped perfumes directly into the PostgreSQL database."""
    try:
        import psycopg2
    except ImportError:
        log.error("psycopg2-binary not installed. Run: pip install psycopg2-binary")
        return

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        log.error("DATABASE_URL not set in .env.local")
        return

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    insert_sql = """
        INSERT INTO perfumes (id, slug, name, brand, image_url,
                              top_notes, heart_notes, base_notes,
                              release_year, perfumer, scraped, created_at, updated_at)
        VALUES (gen_random_uuid(), %s, %s, %s, %s,
                %s::text[], %s::text[], %s::text[],
                %s, %s, TRUE, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET
            image_url    = EXCLUDED.image_url,
            top_notes    = EXCLUDED.top_notes,
            heart_notes  = EXCLUDED.heart_notes,
            base_notes   = EXCLUDED.base_notes,
            release_year = EXCLUDED.release_year,
            perfumer     = EXCLUDED.perfumer,
            updated_at   = NOW();
    """

    inserted = 0
    for p in perfumes:
        try:
            notes_to_pg_array = lambda notes_str: "{" + ",".join(
                f'"{n}"' for n in notes_str.split("|") if n
            ) + "}"

            cur.execute(insert_sql, (
                p["slug"], p["name"], p["brand"], p["image_url"],
                notes_to_pg_array(p["top_notes"]),
                notes_to_pg_array(p["heart_notes"]),
                notes_to_pg_array(p["base_notes"]),
                int(p["release_year"]) if str(p["release_year"]).isdigit() else None,
                p["perfumer"] or None,
            ))
            inserted += 1
        except Exception as e:
            log.error(f"DB insert failed for '{p.get('name')}': {e}")
            conn.rollback()

    conn.commit()
    cur.close()
    conn.close()
    log.info(f"Inserted/updated {inserted} records in PostgreSQL.")


# ──────────────────────────────────────────────
# Main Orchestrator
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Subash Perfume Data Scraper")
    parser.add_argument("--mode",  choices=["csv", "db"], default="csv",
                        help="Output mode: 'csv' (default) or 'db' (PostgreSQL)")
    parser.add_argument("--limit", type=int, default=0,
                        help="Max perfumes to scrape (0 = unlimited)")
    parser.add_argument("--brands", nargs="+", default=None,
                        help="Override brand list (space-separated). Default = priority BD brands.")
    args = parser.parse_args()

    brands = args.brands or PRIORITY_BRANDS
    session = requests.Session()
    all_perfumes: list[dict] = []
    total_scraped = 0

    log.info(f"Starting scrape | Mode: {args.mode} | Brands: {len(brands)} | Limit: {args.limit or 'none'}")

    for brand in brands:
        if args.limit and total_scraped >= args.limit:
            break

        urls = get_perfume_urls_by_brand(brand, session)
        time.sleep(DELAY_BETWEEN_REQUESTS)

        for url in urls:
            if args.limit and total_scraped >= args.limit:
                break

            log.info(f"Scraping [{total_scraped + 1}]: {url}")
            data = scrape_perfume_detail(url, session)

            if data:
                all_perfumes.append(data)
                total_scraped += 1

                # Flush to CSV every 25 records
                if args.mode == "csv" and len(all_perfumes) % 25 == 0:
                    save_to_csv(all_perfumes)
                    all_perfumes.clear()

            time.sleep(DELAY_BETWEEN_REQUESTS)

    # Final flush
    if all_perfumes:
        if args.mode == "csv":
            save_to_csv(all_perfumes)
        elif args.mode == "db":
            save_to_db(all_perfumes)

    log.info(f"Scraping complete. Total records: {total_scraped}")


if __name__ == "__main__":
    main()
