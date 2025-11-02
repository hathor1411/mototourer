from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import requests
from geopy.distance import geodesic
import httpx

app = FastAPI()

# ---- CORS aktivieren ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- API-Key ----
ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImU0YTM0ZmM4NzhmODQwMDBhZjg1NmRmNjg5NDJjMGJjIiwiaCI6Im11cm11cjY0In0="

# ---- Testroute ----
@app.get("/ping")
def ping():
    return {"message": "pong"}

# ---- Route ----
@app.get("/route")
def get_route(
    start_lat: float = 48.1351,
    start_lon: float = 11.5820,
    end_lat: float = 47.3769,
    end_lon: float = 8.5417
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

# ---- Etappen ----
@app.get("/stages")
def get_stages(
    start_lat: float = 48.1351,
    start_lon: float = 11.5820,
    end_lat: float = 57.5886,
    end_lon: float = 9.9592,
    stage_length_km: float = 300.0
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
    dist = 0.0
    total = 0.0

    for i in range(1, len(route)):
        d = geodesic(route[i - 1], route[i]).km
        dist += d
        total += d
        stage.append(route[i])

        if dist >= stage_length_km or i == len(route) - 1:
            elevation_gain = 0
            try:
                # Reduziere die Abfragepunkte (jede 5.)
                reduced_points = stage[::5]
                query = {"locations": reduced_points}

                elev_response = requests.post(
                    "https://api.openrouteservice.org/elevation/line",
                    headers={"Authorization": ORS_API_KEY, "Content-Type": "application/json"},
                    json={
                        "format_in": "polyline",
                        "format_out": "geojson",
                        "geometry": [[lon, lat] for lat, lon in reduced_points],
                    },
                    timeout=10
                )


                heights = []
                if elev_response.status_code == 200:
                    elev_data = elev_response.json()
                    heights = [p["elevation"] for p in elev_data.get("results", [])]

                # Berechne Höhenmeter
                if heights:
                    total_up = sum(
                        max(heights[j] - heights[j - 1], 0)
                        for j in range(1, len(heights))
                    )
                    elevation_gain = int(total_up)
                else:
                    # Fallback: kleine simulierte Steigung (z. B. 3 m/km)
                    elevation_gain = int(round(dist * 3))

            except Exception as e:
                print("⚠️ Höhenberechnung fehlgeschlagen:", e)
                # Backup – simulierte Höhenmeter
                elevation_gain = int(round(dist * 3))

            stages.append({
                "points": stage,
                "distance_km": round(dist, 1),
                "elevation_gain_m": elevation_gain
            })
            stage = [route[i]]
            dist = 0.0

    return {"stages": stages, "total_distance_km": round(total, 1)}


# ---- Etappen-Info ----
@app.post("/stage_info")
def stage_info(stage: dict):
    coords = stage["points"]

    # Höhen abrufen
    query = {"locations": coords}
    resp = requests.post("https://api.open-elevation.com/api/v1/lookup", json=query)
    elev = resp.json()

    if "results" not in elev:
        return {"error": "keine Höhenwerte erhalten"}

    heights = [p["elevation"] for p in elev["results"]]

    # Gesamte Distanz
    total_distance = sum(geodesic(coords[i], coords[i + 1]).km for i in range(len(coords) - 1))

    # Summierte positive Höhenmeter
    total_up = sum(max(0, heights[i + 1] - heights[i]) for i in range(len(heights) - 1))

    return {
        "distance_km": round(total_distance, 1),
        "elevation_gain_m": int(total_up)
    }


# ---- Höhenwerte (ORS) ----
@app.post("/elevation")
async def elevation_proxy(request: Request):
    try:
        data = await request.json()

        # Falls kein format_out übergeben wurde, setzen wir es standardmäßig
        if "format_out" not in data:
            data["format_out"] = "geojson"

        # Falls Etappe zu viele Punkte enthält → splitten
        geometry = data.get("geometry", [])
        if len(geometry) > 250:
            geometry = geometry[::len(geometry)//250]  # Sample max 250 Punkte
            data["geometry"] = geometry

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
            result = resp.json()
        return result

    except Exception as e:
        print("❌ Fehler im Elevation-Endpunkt:", e)
        return {"geometry": {"coordinates": []}}

