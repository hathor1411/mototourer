from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import requests
from geopy.distance import geodesic
import httpx
import json
import os
import time

# ------------------------------------------------------------
# 🚀 FastAPI-Setup
# ------------------------------------------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------
# 🔑 API Key (OpenRouteService)
# ------------------------------------------------------------
ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImU0YTM0ZmM4NzhmODQwMDBhZjg1NmRmNjg5NDJjMGJjIiwiaCI6Im11cm11cjY0In0="

# ------------------------------------------------------------
# 💾 Persistenter Ortsnamen-Cache
# ------------------------------------------------------------
CACHE_FILE = "geocode_cache.json"

if os.path.exists(CACHE_FILE):
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            geocode_cache = json.load(f)
        print(f"✅ Geocode-Cache geladen ({len(geocode_cache)} Einträge).")
    except Exception:
        geocode_cache = {}
else:
    geocode_cache = {}

def save_cache():
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(geocode_cache, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print("⚠️ Fehler beim Speichern des Caches:", e)

# ------------------------------------------------------------
# 🧭 Hilfsfunktionen
# ------------------------------------------------------------

def reverse_geocode(lat, lon):
    """Reverse-Geocoding über ORS API (statt Nominatim)."""
    key = f"{round(lat, 4)},{round(lon, 4)}"
    if key in geocode_cache:
        return geocode_cache[key]

    try:
        resp = requests.get(
            "https://api.openrouteservice.org/geocode/reverse",
            headers={"Authorization": ORS_API_KEY},
            params={"point.lat": lat, "point.lon": lon, "lang": "de"},
            timeout=5
        )
        data = resp.json()
        features = data.get("features", [])
        if features:
            props = features[0].get("properties", {})
            name = props.get("locality") or props.get("name") or props.get("region") or "Unbekannt"
        else:
            name = "Unbekannt"

        geocode_cache[key] = name
        save_cache()
        return name
    except Exception as e:
        print("⚠️ Fehler bei Reverse-Geocoding:", e)
        return "Unbekannt"


def get_elevations(points):
    """Höhenprofil von OpenRouteService abrufen."""
    try:
        resp = requests.post(
            "https://api.openrouteservice.org/elevation/line",
            headers={
                "Authorization": ORS_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "format_in": "polyline",
                "format_out": "geojson",
                "geometry": [[lon, lat] for lat, lon in points],
            },
            timeout=10,
        )
        data = resp.json()
        coords = data.get("geometry", {}).get("coordinates", [])
        return [c[2] for c in coords if len(c) > 2]
    except Exception as e:
        print("⚠️ Fehler beim Höhenabruf:", e)
        return []

# ------------------------------------------------------------
# 🧩 Basis-Route: Test
# ------------------------------------------------------------
@app.get("/ping")
def ping():
    return {"message": "pong"}

# ------------------------------------------------------------
# 🛣️ Route berechnen (Start → Ziel)
# ------------------------------------------------------------
@app.get("/route")
def get_route(
    start_lat: float = 48.1351,
    start_lon: float = 11.5820,
    end_lat: float = 47.3769,
    end_lon: float = 8.5417,
):
    try:
        url = "https://api.openrouteservice.org/v2/directions/driving-hgv"
        params = {
            "api_key": ORS_API_KEY,
            "start": f"{start_lon},{start_lat}",
            "end": f"{end_lon},{end_lat}",
        }
        response = requests.get(url, params=params)
        data = response.json()

        if "features" not in data:
            return {"error": data.get("error", "Unbekannter Fehler")}

        coords = data["features"][0]["geometry"]["coordinates"]
        route = [[lat, lon] for lon, lat in coords]
        return {"route": route}
    except Exception as e:
        print("❌ Fehler in /route:", e)
        return {"error": str(e)}

# ------------------------------------------------------------
# 🏍️ Etappen berechnen
# ------------------------------------------------------------
@app.get("/stages")
def get_stages(
    start_lat: float = 48.1351,
    start_lon: float = 11.5820,
    end_lat: float = 57.5886,
    end_lon: float = 9.9592,
    stage_length_km: float = 300.0,
):
    url = "https://api.openrouteservice.org/v2/directions/driving-hgv"
    params = {
        "api_key": ORS_API_KEY,
        "start": f"{start_lon},{start_lat}",
        "end": f"{end_lon},{end_lat}",
    }

    response = requests.get(url, params=params)
    data = response.json()

    if "features" not in data:
        return {"error": data.get("error", "Fehler bei ORS")}

    coords = data["features"][0]["geometry"]["coordinates"]
    route = [[lat, lon] for lon, lat in coords]

    stages = []
    stage = [route[0]]
    dist = total = 0.0

    for i in range(1, len(route)):
        d = geodesic(route[i - 1], route[i]).km
        dist += d
        total += d
        stage.append(route[i])

        if dist >= stage_length_km or i == len(route) - 1:
            heights = get_elevations(stage)
            if heights:
                elevation_gain = int(sum(max(heights[j] - heights[j - 1], 0)
                                         for j in range(1, len(heights))))
            else:
                elevation_gain = int(round(dist * 3))  # Fallback

            stages.append({
                "points": stage,
                "distance_km": round(dist, 1),
                "elevation_gain_m": elevation_gain
            })
            stage = [route[i]]
            dist = 0.0

    return {"stages": stages, "total_distance_km": round(total, 1)}

# ------------------------------------------------------------
# 🏞️ Etappen-Details (Distanz, Höhen, Orte)
# ------------------------------------------------------------
@app.post("/stage_details")
def stage_details(stage: dict):
    try:
        coords = stage.get("points", [])
        if len(coords) < 2:
            return {"error": "Etappe hat zu wenige Punkte"}

        distance = sum(geodesic(coords[i], coords[i + 1]).km for i in range(len(coords) - 1))
        heights = get_elevations(coords)
        total_up = sum(max(0, heights[i + 1] - heights[i]) for i in range(len(heights) - 1)) if heights else int(distance * 3)

        start_lat, start_lon = coords[0]
        end_lat, end_lon = coords[-1]
        start_name = reverse_geocode(start_lat, start_lon)
        end_name = reverse_geocode(end_lat, end_lon)

        return {
            "distance_km": round(distance, 1),
            "elevation_gain_m": int(total_up),
            "start_location": start_name,
            "end_location": end_name,
        }

    except Exception as e:
        print("❌ Fehler bei Etappen-Details:", e)
        return {"error": str(e)}

# ------------------------------------------------------------
# 📈 Höhenprofil (direkter ORS-Proxy)
# ------------------------------------------------------------
@app.post("/elevation")
async def elevation_proxy(request: Request):
    try:
        data = await request.json()
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.openrouteservice.org/elevation/line",
                headers={
                    "Authorization": ORS_API_KEY,
                    "Content-Type": "application/json",
                },
                json=data,
                timeout=15.0,
            )
            return resp.json()
    except Exception as e:
        print("❌ Fehler im Elevation-Endpunkt:", e)
        return {"geometry": {"coordinates": []}}
