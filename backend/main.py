from fastapi import FastAPI, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from geopy.distance import geodesic
import httpx
import os, json, hashlib, requests, time, logging
from datetime import datetime, timedelta
from openrouteservice import convert
from fastapi.middleware.cors import CORSMiddleware

# ------------------------------------------------------------
# 🚀 FastAPI-Setup
# ------------------------------------------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://hathor1411.github.io",
        "https://hathor1411.github.io/mototourer",
        "https://cuddly-space-succotash-64wg7jg9469cr79w-8000.app.github.dev",
        "http://localhost:5173",  # falls du lokal entwickelst
        "http://127.0.0.1:5173",
    ],
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
    datefmt="%Y-%m-%d %H:%M:%S",
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
# 💾 Cache-System mit Unterordnern
# ------------------------------------------------------------
CACHE_DIR = "cache"
CACHE_LIFETIME_DAYS = 90  # quartalsweise Bereinigung (~3 Monate)
os.makedirs(CACHE_DIR, exist_ok=True)

def _make_cache_key(url, body):
    raw = json.dumps({"url": url, "body": body}, sort_keys=True)
    return hashlib.sha1(raw.encode()).hexdigest()

def _get_cache_path(url: str, body_or_params, category: str):
    key = _make_cache_key(url, body_or_params)
    category_dir = os.path.join(CACHE_DIR, category)
    os.makedirs(category_dir, exist_ok=True)
    return os.path.join(category_dir, f"{key}.json")

def cached_post_request(url, body, headers=None, timeout=8, max_age_hours=24, category="misc"):
    path = _get_cache_path(url, body, category)
    if os.path.exists(path):
        age_hours = (time.time() - os.path.getmtime(path)) / 3600
        if age_hours < max_age_hours:
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    api_stats["cache_hits"] += 1
                    return data
            except Exception:
                pass

    try:
        resp = requests.post(url, json=body, headers=headers, timeout=timeout)
        api_stats["api_calls"] += 1
        if resp.status_code == 200:
            data = resp.json()
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f)
            log_info(f"✅ Cached POST → {category}: {url}")
            return data
        else:
            api_stats["api_errors"] += 1
            log_error(f"⚠️ Fehler {resp.status_code}: {resp.text[:120]}")
            return {"warning": f"Fehler {resp.status_code}"}
    except requests.exceptions.Timeout:
        api_stats["api_errors"] += 1
        log_error("⏳ Timeout bei POST")
        return {"warning": "Timeout"}
    except Exception as e:
        api_stats["api_errors"] += 1
        log_error(f"💥 Cache-POST-Fehler: {e}")
        return {"warning": str(e)}

def cached_get_request(url, params=None, headers=None, timeout=8, max_age_hours=24, category="misc"):
    path = _get_cache_path(url, params or {}, category)
    if os.path.exists(path):
        age_hours = (time.time() - os.path.getmtime(path)) / 3600
        if age_hours < max_age_hours:
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    api_stats["cache_hits"] += 1
                    return data
            except Exception:
                pass

    try:
        resp = requests.get(url, params=params, headers=headers, timeout=timeout)
        api_stats["api_calls"] += 1
        if resp.status_code == 200:
            data = resp.json()
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f)
            log_info(f"✅ Cached GET → {category}: {url}")
            return data
        else:
            api_stats["api_errors"] += 1
            log_error(f"⚠️ Fehler {resp.status_code}: {resp.text[:120]}")
            return {"warning": f"Fehler {resp.status_code}"}
    except Exception as e:
        api_stats["api_errors"] += 1
        log_error(f"💥 Cache-GET-Fehler: {e}")
        return {"warning": str(e)}

def clean_old_cache_files():
    now = time.time()
    removed, total = 0, 0
    for root, _, files in os.walk(CACHE_DIR):
        for f in files:
            if not f.endswith(".json"):
                continue
            total += 1
            path = os.path.join(root, f)
            age_days = (now - os.path.getmtime(path)) / 86400
            if age_days > CACHE_LIFETIME_DAYS:
                try:
                    os.remove(path)
                    removed += 1
                except Exception as e:
                    log_error(f"⚠️ Fehler beim Löschen {f}: {e}")
    log_info(f"🧹 Cache-Bereinigung abgeschlossen: {removed}/{total} alte Dateien gelöscht.")

def initialize_cache_structure():
    subdirs = ["route", "elevation", "geocode"]
    for sub in subdirs:
        os.makedirs(os.path.join(CACHE_DIR, sub), exist_ok=True)
    log_info(f"📁 Cache-Verzeichnisse überprüft: {', '.join(subdirs)}")

    marker_file = os.path.join(CACHE_DIR, ".last_cleanup")
    if os.path.exists(marker_file):
        last_cleanup = datetime.fromtimestamp(os.path.getmtime(marker_file))
        if datetime.now() - last_cleanup > timedelta(days=CACHE_LIFETIME_DAYS):
            log_info("🧹 Quartalsbereinigung wird durchgeführt …")
            clean_old_cache_files()
            open(marker_file, "w").close()
        else:
            log_info("✅ Cache aktuell – keine Bereinigung nötig.")
    else:
        log_info("🧹 Erste Bereinigung – Marker wird erstellt.")
        clean_old_cache_files()
        open(marker_file, "w").close()

# Initialisierung beim Start
initialize_cache_structure()

# ------------------------------------------------------------
# 💬 Erweiterter Geocode-/Autocomplete-Cache
# ------------------------------------------------------------
def cached_autocomplete(query: str, max_age_hours: int = 168):  # 7 Tage
    """Cached Autocomplete-Vorschläge (bis zu 7 Tage gültig)."""
    url = "https://api.openrouteservice.org/geocode/autocomplete"
    params = {
        "api_key": ORS_API_KEY,
        "text": query,
        "lang": "de",
        "size": 5,
        "boundary.country": "DE,AT,CH,DK,NO,SE,NL,BE,FR,IT"
    }
    data = cached_get_request(url, params=params, category="autocomplete")
    results = []
    if isinstance(data, dict) and "features" in data:
        for f in data["features"]:
            props = f.get("properties", {})
            coords = f.get("geometry", {}).get("coordinates", [])
            if len(coords) >= 2:
                results.append({
                    "name": props.get("label") or props.get("name"),
                    "lat": coords[1],
                    "lon": coords[0]
                })
    return results


def cached_geocode(place: str, max_age_hours: int = 720):  # 30 Tage
    """Cached Geocoding (Ort → Koordinaten)."""
    url = "https://api.openrouteservice.org/geocode/search"
    params = {"api_key": ORS_API_KEY, "text": place, "size": 1, "lang": "de"}
    data = cached_get_request(url, params=params, category="geocode")

    if isinstance(data, dict) and "features" in data and data["features"]:
        coords = data["features"][0]["geometry"]["coordinates"]
        log_info(f"📍 {place} → {coords[1]}, {coords[0]} (cached)")
        return coords[1], coords[0]
    else:
        log_error(f"❌ Ort nicht gefunden: {place}")
        raise ValueError(f"Ort nicht gefunden: {place}")


def decode_ors_polyline(encoded):
    """Decodiert ORS-Polyline mit optionaler Höhe (lon, lat, ele)."""
    import struct

    coords = []
    index, lat, lon, ele = 0, 0, 0, 0
    changes = [0, 0, 0]
    length = len(encoded)

    while index < length:
        for i in range(3):  # bis zu lon/lat/ele
            shift, result = 0, 0
            while True:
                if index >= length:
                    break
                b = ord(encoded[index]) - 63
                index += 1
                result |= (b & 0x1F) << shift
                shift += 5
                if b < 0x20:
                    break
            if result & 1:
                result = ~result
            result >>= 1
            changes[i] += result
        lon_f = changes[0] * 1e-5
        lat_f = changes[1] * 1e-5
        ele_f = changes[2] * 0.01  # ORS liefert Höhe in 1 cm-Einheiten
        coords.append([lat_f, lon_f, ele_f])
    return coords

# ------------------------------------------------------------
# 🧭 Hilfsfunktionen
# ------------------------------------------------------------
def reverse_geocode(lat, lon):
    url = "https://api.openrouteservice.org/geocode/reverse"
    params = {"point.lat": lat, "point.lon": lon, "lang": "de"}
    headers = {"Authorization": ORS_API_KEY}
    data = cached_get_request(url, params=params, headers=headers, category="geocode")

    features = data.get("features", [])
    if not features:
        api_stats["api_errors"] += 1
        return "Unbekannt"
    props = features[0].get("properties", {})
    return props.get("locality") or props.get("name") or props.get("region") or "Unbekannt"

def get_elevations(points):
    """Höhenprofil mit robustem ORS-Parsing, Logging und Fallback."""
    log_info(f"📡 get_elevations() aufgerufen mit {len(points)} Punkten")

    # Reduziere die Anzahl der Punkte für schnelleren Abruf
    sampled = points[::10] if len(points) > 10 else points
    headers = {"Authorization": ORS_API_KEY, "Content-Type": "application/json"}

    # --- 1️⃣ Versuch: /elevation/line ---
    line_url = "https://api.openrouteservice.org/elevation/line"
    line_body = {
        "format_in": "geojson",
        "format_out": "geojson",
        "geometry": {
            "type": "LineString",
            "coordinates": [[lon, lat] for lat, lon in sampled],
        },
    }

    log_info(f"🌐 Anfrage an ORS /elevation/line mit {len(sampled)} Punkten …")
    data = cached_post_request(line_url, line_body, headers=headers, category="elevation")

    coords = []
    if isinstance(data, dict):
        # Standardstruktur: geometry -> coordinates
        if "geometry" in data and isinstance(data["geometry"], dict):
            coords = data["geometry"].get("coordinates", [])
        # Alternative Struktur (Fallback)
        elif "coordinates" in data:
            coords = data["coordinates"]

    if coords and all(len(c) > 2 for c in coords):
        heights = [c[2] for c in coords]
        log_info(f"✅ Höhen über /line erhalten ({len(heights)} Punkte, min={min(heights)}, max={max(heights)})")
        return heights

    log_error(f"⚠️ Keine gültigen Höhen über /line erhalten ({len(coords)} Punkte). Fallback auf /point …")

    # --- 2️⃣ Fallback: /elevation/point ---
    point_url = "https://api.openrouteservice.org/elevation/point"
    point_body = {
        "format_in": "geojson",
        "geometry": {
            "type": "MultiPoint",
            "coordinates": [[lon, lat] for lat, lon in sampled],
        },
    }

    log_info("🌐 Fallback auf /elevation/point …")
    data = cached_post_request(point_url, point_body, headers=headers, category="elevation")

    coords = []
    if isinstance(data, dict):
        if "geometry" in data and isinstance(data["geometry"], dict):
            coords = data["geometry"].get("coordinates", [])
        elif "coordinates" in data:
            coords = data["coordinates"]

    if coords and all(len(c) > 2 for c in coords):
        heights = [c[2] for c in coords]
        log_info(f"✅ Höhen über /point erhalten ({len(heights)} Punkte, min={min(heights)}, max={max(heights)})")
        return heights

    # --- 3️⃣ Kein Ergebnis ---
    api_stats["api_errors"] += 1
    log_error("❌ Keine Höheninformationen verfügbar – Fallbackwert genutzt.")
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
def get_route(start_lat: float = 48.1351, start_lon: float = 11.5820, end_lat: float = 47.3769, end_lon: float = 8.5417):
    try:
        url = "https://api.openrouteservice.org/v2/directions/driving-hgv"
        params = {"api_key": ORS_API_KEY, "start": f"{start_lon},{start_lat}", "end": f"{end_lon},{end_lat}"}
        data = cached_get_request(url, params=params, category="route")
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
def get_stages(start_lat: float = 48.1351, start_lon: float = 11.5820, end_lat: float = 57.5886, end_lon: float = 9.9592, stage_length_km: float = 300.0):
    url = "https://api.openrouteservice.org/v2/directions/driving-hgv"
    params = {"api_key": ORS_API_KEY, "start": f"{start_lon},{start_lat}", "end": f"{end_lon},{end_lat}"}
    data = cached_get_request(url, params=params, category="route")

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
            elevation_gain = int(sum(max(heights[j] - heights[j - 1], 0) for j in range(1, len(heights)))) if heights else int(round(dist * 3))
            stages.append({"points": stage, "distance_km": round(dist, 1), "elevation_gain_m": elevation_gain})
            stage = [route[i]]
            dist = 0.0

    log_stage_summary(len(stages))
    return {"stages": stages, "total_distance_km": round(total, 1)}

# ------------------------------------------------------------
# 🏞️ Etappen-Details (mit Höhenanalyse, Steigungen & Fahrzeit)
# ------------------------------------------------------------
@app.post("/stage_details")
def stage_details(stage: dict):
    try:
        coords = stage.get("points", [])
        if len(coords) < 2:
            api_stats["api_errors"] += 1
            return {"error": "Etappe hat zu wenige Punkte"}

        # 📏 Distanzberechnung
        distance = sum(geodesic(coords[i], coords[i + 1]).km for i in range(len(coords) - 1))

        # ⛰️ Höhenanalyse
        heights = get_elevations(coords)
        if heights and len(heights) > 1:
            diffs = [heights[i + 1] - heights[i] for i in range(len(heights) - 1)]
            total_up = sum(d for d in diffs if d > 0)
            total_down = abs(sum(d for d in diffs if d < 0))
            min_h, max_h = min(heights), max(heights)
        else:
            total_up = int(distance * 3)
            total_down = 0
            min_h = max_h = 0

        # 🧮 Steigungsabschnitte (vereinfacht: 0.3% mild, 3% steil, >7% sehr steil)
        mild = len([d for d in diffs if 3 < d < 10])
        steep = len([d for d in diffs if 10 <= d < 25])
        very_steep = len([d for d in diffs if d >= 25])

        # ⏱️ Geschätzte Zeit (80 km/h Schnitt)
        hours = round(distance / 55, 2)

        # 📍 Start/Ziel
        start_lat, start_lon = coords[0]
        end_lat, end_lon = coords[-1]
        start_name = reverse_geocode(start_lat, start_lon)
        end_name = reverse_geocode(end_lat, end_lon)

        # 🪵 Log für Debug
        log_info(
            f"📊 Etappe analysiert: {distance:.1f} km, Δ+{int(total_up)} m / Δ-{int(total_down)} m, {hours:.2f} h geschätzt"
        )

        return {
            "distance_km": round(distance, 1),
            "elevation_gain_m": int(total_up),
            "elevation_loss_m": int(total_down),
            "min_elevation_m": int(min_h),
            "max_elevation_m": int(max_h),
            "gradient_sections": {
                "mild": mild,
                "steep": steep,
                "very_steep": very_steep
            },
            "estimated_time_h": hours,
            "start_location": start_name,
            "end_location": end_name,
        }

    except Exception as e:
        api_stats["api_errors"] += 1
        log_error(f"❌ Fehler bei Etappen-Analyse: {e}")
        return {"error": str(e)}
# ------------------------------------------------------------
# Status der API
# ------------------------------------------------------------
@app.get("/ors_status")
def ors_status():
    try:
        resp = requests.get("https://api.openrouteservice.org/health", timeout=5)
        return {"status": resp.json()}
    except Exception as e:
        return {"status": "unreachable", "error": str(e)}

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

# ------------------------------------------------------------
# 🧭 Erweiterte Routenplanung mit Start/Ziel/Zwischenstopps
# ------------------------------------------------------------
@app.post("/route_extended")
def route_extended(data: dict):
    """
    Erwartet JSON:
    {
        "start": "München",
        "end": "Hamburg",
        "stops": ["Würzburg", "Kassel"]
    }
    """
    try:
        # 1️⃣ Orte geokodieren
        def geocode_place(place):
            """Ortsauflösung mit erweitertem Cache."""
            try:
                lat, lon = cached_geocode(place)
                return lat, lon
            except Exception as e:
                log_error(f"❌ Fehler beim Geocoding '{place}': {e}")
                raise

            features = result.get("features", [])
            if not features:
                log_error(f"❌ Ort nicht gefunden: {place}")
                raise ValueError(f"Ort nicht gefunden: {place}")

            coords = features[0]["geometry"]["coordinates"]  # [lon, lat]
            log_info(f"📍 {place} → {coords[1]}, {coords[0]}")
            return coords[1], coords[0]

        start = geocode_place(data["start"])
        end = geocode_place(data["end"])
        stops = [geocode_place(s) for s in data.get("stops", []) if s.strip()]

        # 2️⃣ Wegpunkte aufbauen
        all_points = [start] + stops + [end]
        coordinates = [[lon, lat] for lat, lon in all_points]

        log_info(f"➡️ Start: {start}, Ziel: {end}, Stops: {stops}")
        log_info(f"➡️ ORS-Koordinaten (lon,lat): {coordinates}")

        # 3️⃣ Route berechnen
        url = "https://api.openrouteservice.org/v2/directions/driving-hgv"
        headers = {"Authorization": ORS_API_KEY, "Content-Type": "application/json"}
        body = {
            "coordinates": coordinates,
            "preference": "recommended",
            "instructions": False,
            "units": "km",
            "language": "de",
            "elevation": True,
        }

        route_data = cached_post_request(url, body, headers=headers, category="route")
        coords = []
        distance_km = 0.0

        # 4️⃣ ORS-Antwort auswerten
        if "features" in route_data:
            try:
                coords = route_data["features"][0]["geometry"]["coordinates"]
                distance_km = route_data["features"][0]["properties"]["summary"]["distance"]
                log_info(f"🗺️ Route (GeoJSON): {len(coords)} Punkte, {distance_km:.1f} km")
            except Exception as e:
                log_error(f"❌ Fehler beim Auswerten der GeoJSON-Daten: {e}")
                return {"error": "Ungültige GeoJSON-Daten"}

        elif "routes" in route_data:
            try:
                route = route_data["routes"][0]
                geometry = route.get("geometry")
                if not geometry or not isinstance(geometry, str):
                    raise ValueError("Fehlende oder ungültige Geometrie")

                coords = decode_ors_polyline(geometry)
                if not coords:
                    raise ValueError("Keine Koordinaten nach Decode erhalten")

                distance_km = route["summary"]["distance"]  # ✅ bereits in km
                log_info(f"🗺️ Route (manuell decoded): {len(coords)} Punkte, {distance_km:.1f} km")
            except Exception as e:
                log_error(f"❌ Fehler beim Decodieren der Route: {e}")
                return {"error": f"Fehler beim Decodieren der Route: {e}"}

        else:
            log_error(f"❌ Unerwartetes Format: {route_data}")
            return {"error": "Unerwartete API-Antwort von ORS"}

        # 5️⃣ Höhen extrahieren + Summen berechnen
        if coords:
            route_coords = [[lat, lon] for lon, lat, *_ in coords]
            heights = [c[2] for c in coords if len(c) > 2]

            # 🔍 Plausibilitätsprüfung – Fallback bei zu flachen Höhen
            log_info("⚙️ Hole Höhenprofil für Route (analog zu /stages) …")
            heights = get_elevations([[lon, lat] for lat, lon in route_coords])


            if heights and len(heights) > 1:
                diffs = [round(heights[i + 1] - heights[i], 2) for i in range(len(heights) - 1)]
                total_up = sum(d for d in diffs if d > 0.5)
                total_down = abs(sum(d for d in diffs if d < -0.5))
                min_h, max_h = min(heights), max(heights)
            else:
                total_up = total_down = 0
                min_h = max_h = 0
        else:
            route_coords = []
            total_up = total_down = min_h = max_h = 0

        log_info(f"✅ Erweiterte Route erfolgreich verarbeitet: {len(route_coords)} Punkte")

        # 6️⃣ Ergebnis zurückgeben
        return {
            "route": route_coords,
            "distance_km": round(distance_km, 1),
            "min_elevation": int(min_h),
            "max_elevation": int(max_h),
            "elevation_gain_m": int(total_up),
            "elevation_loss_m": int(total_down),
            "estimated_time_h": round(distance_km / 55, 2),
        }

    except Exception as e:
        api_stats["api_errors"] += 1
        log_error(f"❌ Fehler bei /route_extended: {e}")
        return {"error": str(e)}

# ------------------------------------------------------------
# 🏍️ Ganze Route in Etappen zerlegen
# ------------------------------------------------------------
@app.post("/route_to_stages")
async def route_to_stages(data: dict):
    """
    Erweiterte Routenberechnung mit mehreren Zwischenstopps.
    Start, mehrere Stops, Ziel → durchgehende Route + Etappenberechnung.
    """
    try:
        start = data.get("start")
        end = data.get("end")
        stops = data.get("stops", [])

        if not start or not end:
            return {"error": "Start- und Zielort müssen angegeben werden."}

        print(f"📍 Start: {start}")
        print(f"📍 Ziel: {end}")
        if stops:
            print(f"📍 Zwischenstopps ({len(stops)}): {stops}")

        # 🧭 Geokodierung aller Orte in richtiger Reihenfolge
        all_coords = []
        try:
            start_coords = geocode_location(start)
            all_coords.append(start_coords)

            for stop in stops:
                coords = geocode_location(stop)
                all_coords.append(coords)

            end_coords = geocode_location(end)
            all_coords.append(end_coords)
        except Exception as e:
            print(f"❌ Fehler bei der Geokodierung: {e}")
            return {"error": f"Fehler bei der Geokodierung: {e}"}

        print(f"➡️ ORS-Koordinaten (lon,lat): {all_coords}")

        # 🚗 Gesamtroute über ORS anfragen
        route_data = ors_directions_request(all_coords)

        if not route_data:
            return {"error": "Keine Route von ORS erhalten."}

        decoded_points, distance_km = decode_route(route_data)
        print(f"🗺️ Route (manuell decoded): {len(decoded_points)} Punkte, {distance_km:.1f} km")

        # ⛰️ Höhenprofil für gesamte Route
        elevation_data = get_elevations(decoded_points)
        if not elevation_data:
            print("⚠️ Keine Höheninformationen erhalten – Fallback auf Dummywerte")
            elevation_data = {"elevations": [], "min": 0, "max": 0}

        # 🧩 Etappen berechnen
        stages = split_route(decoded_points, stage_length_km=300)

        # 🧠 Höhen pro Etappe ermitteln
        stage_details = []
        for i, stage in enumerate(stages):
            elev = get_elevations(stage)
            if elev:
                gain, loss = calc_up_down(elev["elevations"])
                min_elev = elev["min"]
                max_elev = elev["max"]
            else:
                gain, loss, min_elev, max_elev = 0, 0, 0, 0

            stage_info = {
                "etappe": i + 1,
                "distance_km": calc_distance(stage),
                "min_elevation_m": min_elev,
                "max_elevation_m": max_elev,
                "elevation_gain_m": gain,
                "elevation_loss_m": loss,
                "points": stage,
                "start_location": start if i == 0 else stops[i - 1],
                "end_location": stops[i] if i < len(stops) else end,
            }

            stage_details.append(stage_info)

        print(f"✅ {len(stage_details)} Etappen generiert.")

        return {
            "distance_km": distance_km,
            "stages": stage_details,
            "min_elevation": elevation_data["min"],
            "max_elevation": elevation_data["max"],
        }

    except Exception as e:
        print(f"❌ ❌ Fehler bei /route_to_stages: {e}")
        return {"error": str(e)}

# ------------------------------------------------------------
# Autocomplete
# ------------------------------------------------------------
@app.get("/autocomplete")
def autocomplete(q: str = Query(..., description="Ort, nach dem gesucht wird")):
    """Bietet Autocomplete-Vorschläge mit Caching."""
    try:
        results = cached_autocomplete(q)
        if results:
            log_info(f"✅ Autocomplete: {q} ({len(results)} Treffer, ggf. cached)")
            return {"results": results, "cached": True}
        else:
            return {"results": [], "cached": False}
    except Exception as e:
        log_error(f"❌ Fehler bei /autocomplete: {e}")
        return {"error": str(e), "results": []}
