from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_route_extended_basic():
    response = client.post("/route_extended", json={
        "start": "Eilenburg",
        "end": "Hamburg",
        "stops": []
    })
    data = response.json()
    assert response.status_code == 200
    assert "distance_km" in data
    assert data["distance_km"] > 0

def test_route_to_stages_has_stages():
    response = client.post("/route_to_stages", json={
        "start": "München",
        "end": "Hamburg",
        "stops": [],
        "stage_length_km": 300
    })
    data = response.json()
    assert "stages" in data
    assert len(data["stages"]) > 0
