from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from geopy.distance import geodesic
import httpx
import os, json, hashlib, requests, time, logging
from datetime import datetime

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
# 🪵 Logging-System (Konsolen- & Datei-Logging)
# ------------------------------------------------------------
LOG_FILE = "mototourer.log"
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

def log_info(msg: str):
    print(msg)
    logging.info(msg)

def log_error(msg: str):
    print(f"❌ {msg}")
    logging.error(msg)


# ------------------------------------------------------------
# 📊 Statistik-System
# ------------------------------------------------------------
api_stats = {
    "total_stages": 0,
    "cache_hits": 0,
    "api_calls": 0,
    "api_errors": 0,
}

def log_stage_summary(stages_count: int):
    """Kleine Statistik nach jeder /stages-Anfrage"""
    summary = (
        f"\n📊 Anfrage-Statistik ({datetime.now().strftime('%H:%M:%S')})\n"
        f"  ├─ Etappen berechnet: {stages_count}\n"
        f"  ├─ API-Aufrufe: {api_stats['api_calls']}\n"
        f"  ├─ Cache-Treffer: {api_stats['cache_hits']}\n"
        f"  └─ Fehler: {api_stats['api_errors']}\n"
    )
    log_info(summary)
    for key in api_stats:
        api_stats[key] = 0


# ------------------------------------------------------------
# 🔑 API Key (OpenRouteService)
# ------------------------------------------------------------
ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImU0YTM0ZmM4NzhmODQwMDBhZjg1NmRmNjg5NDJjMGJjIiwiaCI6Im11cm11cjY0In0="

# ------------------------------------------------------------
# 💾 Cache-System
# ------------------------------------------------------------
CACHE_DIR = "cache"
os.makedirs(CACHE_DIR, exist_ok=True)

def _make_cache_key(url, body):
    raw = json.dumps({"url": url, "body": body}, sort_keys=True)
    return hashlib.sha1(raw.encode()).hexdigest()

def cached_post_request(url, body, headers=None, timeout=8, max_age_hours=24):
    key = _make_cache_key(url, body)
    path = os.path.join(CACHE_DIR, f"{key}.json")

    if os.path.exists(path):
        age_hours = (time.time() - os.path.getmtime(path)) / 3600
        if age_hours < max_age_hours:
            try:
                api_stats["cache_hits"] += 1
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass

    try:
        resp = requests.post(url, json=body, headers=headers, timeout=timeout)
        api_stats["api_calls"] += 1
        if resp.status_code == 200:
            data = resp.json()
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f)
            log_info(f"✅ Cached: {url}")
            return data
        else:
            api_stats["api_errors"] += 1
            log_error(f"⚠️ Fehler {resp.status_code}: {resp.text[:120]}")
            return {"warning": f"Fehler {resp.status_code}"}
    except requests.exceptions.Timeout:
        api_stats["api_errors"] += 1
        log_error("⏳ Timeout bei API")
        return {"warning": "Timeout"}
    except Exception as e:
        api_stats["api_errors"] += 1
        log_error(f"💥 Cache-Request-Fehler: {e}")
        return {"warning": str(e)}

def cached_get_request(url, params=None, headers=None, timeout=8, max_age_hours=24):
    key = _make_cache_key(url, params or {})
    path = os.path.join(CACHE_DIR, f"{key}.json")

    if os.path.exists(path):
        age_hours = (time.time() - os.path.getmtime(path)) / 3600
        if age_hours < max_age_hours:
            try:
                api_stats["cache_hits"] += 1
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass

    try:
        resp = requests.get(url, params=params, headers=headers, timeout=timeout)
        api_stats["api_calls"] += 1
        if resp.status_code == 200:
            data = resp.json()
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f)
            log_info(f"✅ Cached GET: {url}")
            return data
        else:
            api_stats["api_errors"] += 1
            log_error(f"⚠️ Fehler {resp.status_code}: {resp.text[:120]}")
            return {"warning": f"Fehler {resp.status_code}"}
    except Exception as e:
        api_stats["api_errors"] += 1
        log_error(f"💥 Cache-GET-Fehler: {e}")
        return {"warning": str(e)}

# ------------------------------------------------------------
# 🧭 Hilfsfunktionen
# ------------------------------------------------------------
def reverse_geocode(lat, lon):
    """Reverse-Geocoding mit Cache über ORS"""
    url = "https://api.openrouteservice.org/geocode/reverse"
    params = {"point.lat": lat, "point.lon": lon, "lang": "de"}
    headers = {"Authorization": ORS_API_KEY}
    data = cached_get_request(url, params=params, headers=headers)

    features = data.get("features", [])
    if not features:
        api_stats["api_errors"] += 1
        return "Unbekannt"
    props = features[0].get("properties", {})
    name = props.get("locality") or props.get("name") or props.get("region") or "Unbekannt"
    return name


def get_elevations(points):
    """Höhenprofil: kombiniert /line und /point mit Fehlerbehandlung und Caching"""
    sampled = points[::10] if len(points) > 10 else points
    headers = {"Authorization": ORS_API_KEY, "Content-Type": "application/json"}

    # --- 1️⃣ Versuch: /elevation/line ---
    line_body = {
        "format_in": "polyline",
        "format_out": "geojson",
        "geometry": [[lon, lat] for lat, lon in sampled],
    }
    line_url = "https://api.openrouteservice.org/elevation/line"
    data = cached_post_request(line_url, line_body, headers=headers)

    if isinstance(data, dict) and "geometry" in data:
        coords = data["geometry"].get("coordinates", [])
        heights = [c[2] for c in coords if len(c) > 2]
        if heights:
            log_info(f"✅ Höhen über /line ({len(heights)} Punkte)")
            return heights
    else:
        log_error("⚠️ Fehler oder Limit bei /elevation/line – Fallback aktiv")

    # --- 2️⃣ Fallback: /elevation/point ---
    point_body = {
        "format_in": "geojson",
        "geometry": {"type": "MultiPoint", "coordinates": [[lon, lat] for lat, lon in sampled]},
    }
    point_url = "https://api.openrouteservice.org/elevation/point"
    data = cached_post_request(point_url, point_body, headers=headers)

    if isinstance(data, dict) and "geometry" in data:
        coords = data["geometry"].get("coordinates", [])
        heights = [c[2] for c in coords if len(c) > 2]
        if heights:
            log_info(f"✅ Höhen über /point ({len(heights)} Punkte)")
            return heights

    api_stats["api_errors"] += 1
    log_error("⚠️ Keine Höheninformationen verfügbar – Fallback-Wert genutzt")
    return []


# ------------------------------------------------------------
# 🔍 Test
# ------------------------------------------------------------
@app.get("/ping")
def ping():
    return {"message": "pong"}

# ------------------------------------------------------------
# 🛣️ Route berechnen
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
        params = {"api_key": ORS_API_KEY, "start": f"{start_lon},{start_lat}", "end": f"{end_lon},{end_lat}"}
        data = cached_get_request(url, params=params)
        if "features" not in data:
            api_stats["api_errors"] += 1
            return {"error": data.get("error", "Unbekannter Fehler")}

        coords = data["features"][0]["geometry"]["coordinates"]
        route = [[lat, lon] for lon, lat in coords]
        return {"route": route}
    except Exception as e:
        api_stats["api_errors"] += 1
        log_error(f"❌ Fehler in /route: {e}")
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
    params = {"api_key": ORS_API_KEY, "start": f"{start_lon},{start_lat}", "end": f"{end_lon},{end_lat}"}
    data = cached_get_request(url, params=params)

    if "features" not in data:
        api_stats["api_errors"] += 1
        return {"error": data.get("error", "Fehler bei ORS")}

    coords = data["features"][0]["geometry"]["coordinates"]
    route = [[lat, lon] for lon, lat in coords]
    stages, stage = [], [route[0]]
    dist = total = 0.0

    for i in range(1, len(route)):
        d = geodesic(route[i - 1], route[i]).km
        dist += d
        total += d
        stage.append(route[i])

        if dist >= stage_length_km or i == len(route) - 1:
            heights = get_elevations(stage)
            elevation_gain = int(sum(max(heights[j] - heights[j - 1], 0)
                                     for j in range(1, len(heights)))) if heights else int(round(dist * 3))

            stages.append({
                "points": stage,
                "distance_km": round(dist, 1),
                "elevation_gain_m": elevation_gain
            })
            stage = [route[i]]
            dist = 0.0

    log_stage_summary(len(stages))
    return {"stages": stages, "total_distance_km": round(total, 1)}

# ------------------------------------------------------------
# 🏞️ Etappen-Details
# ------------------------------------------------------------
@app.post("/stage_details")
def stage_details(stage: dict):
    try:
        coords = stage.get("points", [])
        if len(coords) < 2:
            api_stats["api_errors"] += 1
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
        api_stats["api_errors"] += 1
        log_error(f"❌ Fehler bei Etappen-Details: {e}")
        return {"error": str(e)}

# ------------------------------------------------------------
# 📈 Höhenprofil (Proxy)
# ------------------------------------------------------------
@app.post("/elevation")
async def elevation_proxy(request: Request):
    try:
        data = await request.json()
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.openrouteservice.org/elevation/line",
                headers={"Authorization": ORS_API_KEY, "Content-Type": "application/json"},
                json=data,
                timeout=15.0,
            )
            return resp.json()
    except Exception as e:
        api_stats["api_errors"] += 1
        log_error(f"❌ Fehler im Elevation-Endpunkt: {e}")
        return {"geometry": {"coordinates": []}}
