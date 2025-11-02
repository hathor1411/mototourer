from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

app = FastAPI()

# ✅ CORS aktivieren
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # später kannst du das auf deine Domain beschränken
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
def ping():
    return {"message": "pong"}


import requests
from fastapi import Query

ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImU0YTM0ZmM4NzhmODQwMDBhZjg1NmRmNjg5NDJjMGJjIiwiaCI6Im11cm11cjY0In0="  # 🔒 Trage hier deinen Schlüssel ein

@app.get("/route")
def get_route(
    start_lat: float = Query(48.1351),
    start_lon: float = Query(11.5820),
    end_lat: float = Query(47.3769),
    end_lon: float = Query(8.5417)
):
    url = "https://api.openrouteservice.org/v2/directions/driving-hgv"
    params = {
        "api_key": ORS_API_KEY,
        "start": f"{start_lon},{start_lat}",
        "end": f"{end_lon},{end_lat}",
    }

    response = requests.get(url, params=params)
    data = response.json()
    print("🔍 ORS-Response:", data)  # Debug-Ausgabe
    coords = data["features"][0]["geometry"]["coordinates"]

    # Leaflet erwartet [lat, lon], nicht [lon, lat]
    route = [[lat, lon] for lon, lat in coords]

    return {"route": route}
