from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
from geopy.distance import geodesic

app = FastAPI()

# ---- CORS aktivieren ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    url = "https://api.openrouteservice.org/v2/directions/driving-hgv"
    params = {
        "api_key": ORS_API_KEY,
        "start": f"{start_lon},{start_lat}",
        "end": f"{end_lon},{end_lat}",
    }
    response = requests.get(url, params=params)
    data = response.json()

    if "features" not in data:
        print("⚠️ Fehlerhafte API-Antwort:", data)
        return {"error": data.get("error", "Unbekannter Fehler")}

    coords = data["features"][0]["geometry"]["coordinates"]
    route = [[lat, lon] for lon, lat in coords]
    return {"route": route}

# ---- Etappen ----
@app.get("/stages")
def get_stages(
    start_lat: float = 48.1351,
    start_lon: float = 11.5820,
    end_lat: float = 57.5886,
    end_lon: float = 9.9592,
    stage_length_km: float = 300.0
):
    url = "https://api.openrouteservice.org/v2/directions/driving-car"
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
            stages.append({"points": stage, "distance_km": round(dist, 1)})
            stage = [route[i]]
            dist = 0.0

    return {"stages": stages, "total_distance_km": round(total, 1)}
