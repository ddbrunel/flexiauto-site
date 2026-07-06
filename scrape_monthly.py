import requests, time, os

SUPABASE_URL = "https://nlzplxhetonxvcdckmcq.supabase.co"
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
GOOGLE_KEY = os.environ["GOOGLE_KEY"]

def get_total():
    r = requests.get(f"{SUPABASE_URL}/rest/v1/schools",
        params={"select": "id", "limit": 1},
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
                 "Prefer": "count=exact", "Range": "0-0"})
    total = r.headers.get("Content-Range", "").split("/")[-1]
    return int(total) if total.isdigit() else None

def get_schools(limit=100, offset=0):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/schools",
        params={"select": "id,name,city", "limit": limit, "offset": offset, "order": "created_at"},
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"})
    return r.json()

def find_place(name, city):
    r = requests.get("https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
        params={"input": f"{name} {city} France", "inputtype": "textquery",
                "fields": "place_id,geometry,formatted_address", "key": GOOGLE_KEY})
    data = r.json()
    if data.get("candidates"):
        return data["candidates"][0]
    return None

def get_details(place_id):
    r = requests.get("https://maps.googleapis.com/maps/api/place/details/json",
        params={"place_id": place_id,
                "fields": "website,rating,user_ratings_total,geometry",
                "key": GOOGLE_KEY})
    return r.json().get("result", {})

def update_school(sid, data):
    r = requests.patch(f"{SUPABASE_URL}/rest/v1/schools?id=eq.{sid}",
        json=data,
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
                 "Content-Type": "application/json", "Prefer": "return=minimal"})
    return r.status_code

offset = 0
done = 0
not_found = 0
errors = 0
TOTAL = get_total()
print(f"Debut du scraping ({TOTAL or '?'} ecoles en base)\n")

try:
    while TOTAL is None or offset < TOTAL:
        schools = get_schools(100, offset)
        if not schools:
            break
        for s in schools:
            c = find_place(s['name'], s['city'])
            if not c:
                not_found += 1
            else:
                d = get_details(c["place_id"])
                ud = {"google_place_id": c["place_id"],
                      "website": d.get("website", ""),
                      "google_rating": d.get("rating"),
                      "google_reviews": d.get("user_ratings_total")}
                loc = d.get("geometry", {}).get("location", {})
                if loc.get("lat"):
                    ud["lat"] = loc["lat"]
                    ud["lng"] = loc["lng"]
                ud = {k: v for k, v in ud.items() if v is not None}
                st = update_school(s["id"], ud)
                if st not in [200, 204]:
                    errors += 1
            done += 1
            time.sleep(0.05)
        offset += 100
        pct = round(done/TOTAL*100, 1) if TOTAL else "?"
        print(f"{done}/{TOTAL or '?'} ({pct}%) | Non trouvees: {not_found} | Erreurs: {errors}")
except KeyboardInterrupt:
    print(f"\nInterrompu a {done} ecoles traitees")

print(f"\nTermine! {done} traitees, {not_found} non trouvees, {errors} erreurs")
