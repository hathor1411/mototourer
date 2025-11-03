# 🏍️ MotoTourer

[![Build & Test MotoTourer](https://github.com/hathor1411/mototourer/actions/workflows/build.yml/badge.svg)](https://github.com/hathor1411/mototourer/actions/workflows/build.yml)

> Eine OpenStreetMap-basierte Web-App zur **Planung mehrtägiger Motorradtouren**  
> mit automatischer Etappenaufteilung, Höhenprofilen und interaktiver Kartenanzeige.

---

# 🏍️ MotoTourer – Roadmap

> **Projektziel:**  
> Eine Web-App zur Planung von mehrtägigen Motorradtouren mit automatischer Etappenaufteilung, Kartenansicht und Höhenprofilen.

---

## ✅ Status
Aktuelle Phase: **Tag 8 – UX & Design-Feinschliff**  
Letztes Update: _{{heutiges Datum}}_

---

## 🗓️ **Tag 8–14: Ausbau & Verfeinerung**

### 🧩 Tag 8 – UX & Design-Feinschliff
- [x] Dynamische Ladeanzeige (Etappe 1/5)
- [x] UI-Tuning (Farben, Layout, Buttons)
- [x] Responsive Ansicht prüfen (Mobile/Tablet/Desktop)
- [x] Dark Mode (optional)

---

### 🗺️ Tag 9 – Etappen-Interaktion
- [x] Klick auf Etappe → visuelles Highlight
- [x] Popup mit Details (Start, Ziel, Distanz, Höhenmeter, Dauer)
- [x] Auswahlfeld „aktive Etappe“
- [x] Marker-Beschriftung (Start/Ziel)

---

### 💾 Tag 10 – Speicherung & Session
- [ ] Tour in LocalStorage speichern
- [ ] „Tour laden / löschen“ Buttons
- [ ] Export/Import als JSON-Datei
- [ ] (Optional) API-Endpunkt für gespeicherte Touren

---

### ☁️ Tag 11 – Backend-Optimierung
- [x] Fehlerbehandlung verbessert
- [ ] Cache-System für Geocoding-Ergebnisse
- [ ] Logging (z. B. `loguru`)
- [ ] Parallele Requests mit `aiohttp` (Performance)

---

### 📈 Tag 12 – Erweiterte Analyse
- [ ] Höhenprofil-Analyse (min/max)
- [ ] Steigungsabschnitte berechnen
- [ ] Geschätzte Fahrzeit anzeigen (80 km/h Schnitt)

---

### 🌍 Tag 13 – Routenplanung
- [ ] Eingabe Start/Ziel/Zwischenstopps im Frontend
- [ ] Backend berechnet dynamische ORS-Route
- [ ] Vorschau-Karte vor Generierung
- [ ] Tour-Umkehrung (Hin- & Rückweg)

---

### 🧪 Tag 14 – Testing & Feinschliff
- [ ] Unit-Tests (Backend: `pytest`)
- [ ] Frontend-Tests (`vitest`)
- [ ] GitHub Actions → Test Coverage
- [ ] Screenshots & Demo-Link im README

---

## 🚀 Bonus-Phase (nach Tag 14)

- [ ] Benutzeraccounts (Login / Registrierung)
- [ ] Persönliche Tourhistorie
- [ ] Teilen von Touren via Link
- [ ] Deployment auf Render / Railway / Vercel / Netlify

---

## 🧭 Nächste Schritte (Kurzüberblick)
1. [ ] UI-Politur: Farben & Dark Mode  
2. [ ] Klickbare Etappen & Popups  
3. [ ] Touren speichern / laden  
4. [ ] Cache-System & Logging  
5. [ ] Automatische Tests aktivieren  

---

_© 2025 MotoTourer – entwickelt mit Leidenschaft & Kaffee ☕_
