# 🏍️ MotoTourer

[![Build & Test MotoTourer](https://github.com/hathor1411/mototourer/actions/workflows/build.yml/badge.svg)](https://github.com/hathor1411/mototourer/actions/workflows/build.yml)

> Eine OpenStreetMap-basierte Web-App zur **Planung mehrtägiger Motorradtouren**  
> mit automatischer Etappenaufteilung, Höhenprofilen und interaktiver Kartenanzeige.

---

## ⚙️ Technologien

| Bereich | Stack |
|----------|--------|
| 🌐 Frontend | React 18, Vite, Leaflet, Chart.js |
| 🧠 Backend | FastAPI (Python 3.11), Uvicorn, geopy |
| 🗺️ Karten & Routing | OpenRouteService API, OpenStreetMap |
| 📦 CI/CD | GitHub Actions, Auto-Build & Test |
| 🧩 Tools | pip, npm, virtualenv, Node 20 |

---

## 🚀 Features

- ✅ **Automatische Etappenaufteilung** anhand Distanz (z. B. 300 km pro Tag)  
- 📈 **Höhenprofile** für jede Etappe  
- 🗺️ **Interaktive Karte** mit farbigen Etappenlinien  
- 🏁 **Start- und Zielpunkte** mit Markern  
- 🧱 **Backend-API** für Routing, Höhenprofil und Distanzberechnung  
- 🧩 **CI/CD-Pipeline** (GitHub Actions) zur automatischen Funktionsprüfung  

---

## 🧠 Lokale Entwicklung

```bash
# Backend starten
cd backend
python -m venv .venv
.venv\Scripts\activate       # (Windows)
source .venv/bin/activate    # (Linux/Mac)
pip install -r requirements.txt
uvicorn main:app --reload
