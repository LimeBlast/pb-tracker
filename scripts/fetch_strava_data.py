#!/usr/bin/env python3
"""Fetch running best efforts from Strava and save to public/data/pbs.json."""

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except ImportError:
    pass

CLIENT_ID = os.environ["STRAVA_CLIENT_ID"]
CLIENT_SECRET = os.environ["STRAVA_CLIENT_SECRET"]
REFRESH_TOKEN = os.environ["STRAVA_REFRESH_TOKEN"]

DATA_FILE = Path(__file__).parent.parent / "public" / "data" / "pbs.json"

DISTANCE_CONFIG = [
    {"id": "1_mile",        "name": "1 Mile",       "strava_name": "1 mile",        "meters": 1609.34},
    {"id": "5k",            "name": "5K",            "strava_name": "5k",            "meters": 5000},
    {"id": "10k",           "name": "10K",           "strava_name": "10k",           "meters": 10000},
    {"id": "half_marathon", "name": "Half Marathon", "strava_name": "Half-Marathon", "meters": 21097.5},
    {"id": "marathon",      "name": "Marathon",      "strava_name": "Marathon",      "meters": 42195},
]

STRAVA_NAMES = {d["strava_name"]: d["id"] for d in DISTANCE_CONFIG}


def get_access_token():
    resp = requests.post(
        "https://www.strava.com/oauth/token",
        data={
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "refresh_token": REFRESH_TOKEN,
            "grant_type": "refresh_token",
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def api_get(url, headers, params=None):
    for attempt in range(4):
        resp = requests.get(url, headers=headers, params=params, timeout=30)
        if resp.status_code == 429:
            wait = int(resp.headers.get("X-RateLimit-Reset", 60))
            print(f"  Rate limited — waiting {wait}s")
            time.sleep(wait)
            continue
        resp.raise_for_status()
        return resp.json()
    raise RuntimeError(f"Failed after retries: {url}")


def load_data():
    if DATA_FILE.exists():
        with open(DATA_FILE) as f:
            return json.load(f)
    return {
        "last_updated": None,
        "processed_activity_ids": [],
        "distances": {d["id"]: {"efforts": []} for d in DISTANCE_CONFIG},
    }


def fetch_activities(headers):
    all_activities = []
    page = 1
    while True:
        batch = api_get(
            "https://www.strava.com/api/v3/athlete/activities",
            headers=headers,
            params={"per_page": 200, "page": page},
        )
        if not batch:
            break
        all_activities.extend(batch)
        print(f"  Fetched page {page}: {len(batch)} activities")
        if len(batch) < 200:
            break
        page += 1
        time.sleep(0.5)
    return all_activities


def main():
    print("=== Strava PB Fetcher ===")
    data = load_data()
    processed_ids = set(data.get("processed_activity_ids", []))

    print("Authenticating with Strava...")
    access_token = get_access_token()
    headers = {"Authorization": f"Bearer {access_token}"}

    print("Fetching activity list...")
    activities = fetch_activities(headers)

    run_types = {"Run", "TrailRun", "VirtualRun"}
    runs = [a for a in activities if a.get("type") in run_types or a.get("sport_type") in run_types]
    new_runs = [a for a in runs if a["id"] not in processed_ids]

    print(f"Total runs: {len(runs)}  |  New (unprocessed): {len(new_runs)}")

    for i, activity in enumerate(new_runs):
        print(f"[{i+1}/{len(new_runs)}] {activity['name']} ({activity['start_date'][:10]})")
        try:
            details = api_get(
                f"https://www.strava.com/api/v3/activities/{activity['id']}",
                headers=headers,
            )
        except Exception as exc:
            print(f"  Error: {exc}")
            processed_ids.add(activity["id"])
            continue

        for effort in details.get("best_efforts", []):
            dist_id = STRAVA_NAMES.get(effort.get("name", ""))
            if dist_id:
                data["distances"][dist_id]["efforts"].append({
                    "elapsed_time": effort["elapsed_time"],
                    "moving_time": effort.get("moving_time", effort["elapsed_time"]),
                    "date": effort["start_date"][:10],
                    "activity_id": activity["id"],
                    "activity_name": activity["name"],
                })

        processed_ids.add(activity["id"])

        # Respect Strava's 100-req/15-min limit for detailed fetches
        time.sleep(0.2)
        if (i + 1) % 90 == 0:
            print("  Pausing 15 minutes to respect rate limits...")
            time.sleep(900)

    # Sort each distance's efforts by date
    for dist in DISTANCE_CONFIG:
        data["distances"][dist["id"]]["efforts"].sort(key=lambda e: e["date"])

    data["processed_activity_ids"] = sorted(processed_ids)
    data["last_updated"] = datetime.now(timezone.utc).isoformat()

    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

    print(f"\nSaved to {DATA_FILE}")
    for dist in DISTANCE_CONFIG:
        efforts = data["distances"][dist["id"]]["efforts"]
        if efforts:
            best = min(efforts, key=lambda e: e["elapsed_time"])
            mins, secs = divmod(best["elapsed_time"], 60)
            print(f"  {dist['name']:15s}: {len(efforts):3d} efforts  best {int(mins)}:{int(secs):02d} on {best['date']}")
        else:
            print(f"  {dist['name']:15s}: no efforts recorded")


if __name__ == "__main__":
    main()
