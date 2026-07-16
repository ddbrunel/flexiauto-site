import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from decimal import ROUND_HALF_UP, Decimal

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

SUPABASE_URL = "https://nlzplxhetonxvcdckmcq.supabase.co"
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}

SESSION = requests.Session()
_retry = Retry(total=5, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
SESSION.mount("https://", HTTPAdapter(max_retries=_retry, pool_maxsize=20))


def get_total():
    r = SESSION.get(
        f"{SUPABASE_URL}/rest/v1/schools",
        params={"select": "id", "limit": 1},
        headers={**HEADERS, "Prefer": "count=exact", "Range": "0-0"},
    )
    total = r.headers.get("Content-Range", "").split("/")[-1]
    return int(total) if total.isdigit() else None


def get_schools_batch(offset, limit=1000):
    r = SESSION.get(
        f"{SUPABASE_URL}/rest/v1/schools",
        params={
            "select": "id,success_rate,google_rating,is_partner",
            "limit": limit,
            "offset": offset,
            "order": "id",
        },
        headers=HEADERS,
    )
    r.raise_for_status()
    return r.json()


def compute_flexi_score(success_rate, google_rating, is_partner):
    if google_rating is None:
        base = (success_rate / 100 * 10) if success_rate is not None else 0
    else:
        success_contrib = (success_rate / 100 * 5) if success_rate is not None else 0
        google_contrib = google_rating * 2 * 0.5
        base = success_contrib + google_contrib
    if is_partner:
        base += 0.5
    base = max(0, min(10, base))
    return float(Decimal(str(base)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))


def update_school(sid, score):
    r = SESSION.patch(
        f"{SUPABASE_URL}/rest/v1/schools?id=eq.{sid}",
        json={"flexi_score": score},
        headers={**HEADERS, "Content-Type": "application/json", "Prefer": "return=minimal"},
    )
    return r.status_code in (200, 204)


def main():
    total = get_total()
    print(f"Debut du recalcul flexi_score ({total or '?'} ecoles en base)\n")

    done = 0
    errors = 0
    offset = 0

    while total is None or offset < total:
        batch = get_schools_batch(offset)
        if not batch:
            break

        with ThreadPoolExecutor(max_workers=20) as pool:
            futures = {
                pool.submit(
                    update_school,
                    s["id"],
                    compute_flexi_score(s.get("success_rate"), s.get("google_rating"), s.get("is_partner")),
                ): s["id"]
                for s in batch
            }
            for fut in as_completed(futures):
                done += 1
                if not fut.result():
                    errors += 1

        offset += 1000
        pct = round(done / total * 100, 1) if total else "?"
        print(f"{done}/{total or '?'} ({pct}%) | Erreurs: {errors}")

    print(f"\nTermine! {done} ecoles mises a jour, {errors} erreurs")


if __name__ == "__main__":
    main()
