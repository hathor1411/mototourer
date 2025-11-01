# 🏍️ MotoTourer – Roadmap (MVP, 8 Wochen)

Eine OpenStreetMap-basierte Web- und Mobile-App zur Planung von **mehrtägigen Motorradtouren** mit automatischer Etappenaufteilung und Kartenansicht.

---

## 🎯 Zielsetzung

- Entwicklung eines voll funktionsfähigen MVP innerhalb von 8 Wochen  
- Fokus auf Routenplanung, Etappenlogik und GPX-Export  
- Optional: Nutzerverwaltung und Hosting auf kostenlosen Plattformen  

---

## 🧭 Technologie-Stack

| Ebene     | Technologie                                          | Beschreibung              |
| ---------- | ---------------------------------------------------- | ------------------------- |
| Frontend   | React + Leaflet.js                                   | Kartenanzeige & UI        |
| Backend    | FastAPI (Python) oder Express (Node.js)              | Routing & Etappenlogik    |
| Datenbank  | PostgreSQL + PostGIS                                 | Geodaten & Touren         |
| APIs       | OpenRouteService, Overpass API, OpenElevation        | Routing, Orte, Höhen      |
| Hosting    | Vercel (Frontend) + Render (Backend) + Supabase (DB) | Kostenloser Betrieb       |
| Auth (opt.)| Firebase Auth oder Supabase Auth                     | Nutzer-Login              |

---

## 📅 8-Wochen-Roadmap (MVP)

### 🗓️ Phase 1 – Projektsetup & Grundlagen (Woche 1)

**Ziele:**
- Entwicklungsumgebung & Repository aufsetzen  
- Basisstruktur für Frontend & Backend erstellen  

**Aufgaben:**
- [ ] Node.js / Python + VSCode installieren  
- [ ] Git & GitHub Repository anlegen  
- [ ] React + Leaflet Grundgerüst (`create-react-app`) erstellen  
- [ ] FastAPI oder Express Grundgerüst erstellen  
- [ ] Docker-Setup für PostgreSQL + PostGIS einrichten  
- [ ] `.env`-Dateien & API-Keys (ORS, Firebase) vorbereiten  

**Ergebnis:**  
Lokales Projekt startet mit „Hello World“ im Frontend & Backend.  

---

### 🗓️ Phase 2 – Routing & API-Anbindung (Woche 2–3)

**Ziele:**
- Routing-Logik mit OpenRouteService  
- Backend-API für Routenplanung  
- Karte zeigt Strecke an  

**Aufgaben:**
- [ ] Backend-Endpoint `/api/tour/plan` implementieren  
- [ ] Request an ORS-API senden (z. B. `driving-curvature`)  
- [ ] Geodaten (Polyline) speichern & zurückgeben  
- [ ] Leaflet-Karte mit Routenanzeige im Frontend  
- [ ] Marker für Start/Zielpunkte  

**Ergebnis:**  
Karte zeigt Route von A → B mit Linienverlauf.  

---

### 🗓️ Phase 3 – Etappenlogik (Woche 4)

**Ziele:**
- Automatische Aufteilung der Route in Tagesetappen  
- Ermittlung von Städten als Etappenziele  

**Aufgaben:**
- [ ] Funktion `split_route_by_distance()` (z. B. alle 300 km)  
- [ ] Overpass API-Integration (Städte innerhalb 5–10 km)  
- [ ] Backend liefert Liste der Etappen zurück  
- [ ] Frontend zeigt farblich getrennte Etappen  

**Ergebnis:**  
App erstellt mehrtägige Tour mit Etappen-Markierungen.  

---

### 🗓️ Phase 4 – Etappenansicht & Detailseite (Woche 5–6)

**Ziele:**
- Etappenliste und Detailansicht mit Höhenprofil  
- Integration von Unterkünften & POIs  

**Aufgaben:**
- [ ] OpenElevation API für Höhenprofil  
- [ ] Overpass-Abfrage für Hotels, Campingplätze, Tankstellen  
- [ ] Frontend-Tabs „Etappenübersicht“ & „Details“  
- [ ] Höhenprofil-Diagramm (Chart.js oder Recharts)  
- [ ] POI-Marker auf Karte  

**Ergebnis:**  
Nutzer sieht Etappen, Höhenprofil und POIs je Tag.  

---

### 🗓️ Phase 5 – Speicherung & Export (Woche 7)

**Ziele:**
- Speicherung & GPX-Export von Touren  

**Aufgaben:**
- [ ] Tabellen für Tour, Etappe, POIs in PostgreSQL  
- [ ] Endpoints `/api/tour/save` & `/api/tour/:id/gpx`  
- [ ] Frontend-Buttons: „Tour speichern“ & „GPX exportieren“  
- [ ] GPX-Generator (XML aus Koordinaten)  

**Ergebnis:**  
Touren können gespeichert und als GPX exportiert werden.  

---

### 🗓️ Phase 6 – Hosting & Abschluss (Woche 8)

**Ziele:**
- App deployen und Dokumentation fertigstellen  

**Aufgaben:**
- [ ] Frontend → Vercel  
- [ ] Backend → Render  
- [ ] Datenbank → Supabase oder Neon  
- [ ] Domain + SSL einrichten  
- [ ] README, API-Doku, Setup-Guide finalisieren  

**Ergebnis:**  
MotoTourer läuft öffentlich mit dokumentiertem MVP.  

---

## 🧮 Milestones

| Milestone | Beschreibung                                  | Zielwoche |
| ---------- | --------------------------------------------- | ---------- |
| M1 | Projektstruktur steht, lokale Umgebung läuft         | 1 |
| M2 | Routing funktioniert, erste Karte mit Strecke        | 3 |
| M3 | Etappenlogik mit Städten funktioniert                | 4 |
| M4 | Etappen-Detailansicht mit Höhenprofil                | 6 |
| M5 | Speicherung & Export (GPX)                           | 7 |
| M6 | App online & dokumentiert                            | 8 |

---

## 📘 Empfohlene Dokumentation

| Datei | Inhalt |
| ------ | ------- |
| `architecture.md` | Systemarchitektur (Frontend-Backend-DB) |
| `api_spec.md` | Endpunkte, Parameter, Beispiel-Responses |
| `database_schema.md` | Tabellen, Relationen, SQL-Beispiele |
| `roadmap.md` | Diese Entwicklungs-Roadmap |
| `setup_guide.md` | Installationsanleitung & lokale Entwicklung |

---

## 🧩 Erweiterungsideen (nach MVP)

| Feature | Beschreibung |
| -------- | ------------- |
| 🔧 Benutzerkonten | Login, gespeicherte Touren pro User |
| 🌦️ Wetter-API | Wetterprognose pro Etappe |
| 🧭 Gruppentouren | Gemeinsame Tourplanung & Teilen |
| 📍 Community-Karten | Biker-Treffpunkte, Sehenswürdigkeiten |
| 🛰️ Offlinekarten | MapLibre-Integration (Premium-Modus) |

---

**Letztes Update:** `2025-11-01`  
Autor: *MotoTourer Projektplanung (ChatGPT-Assist)*  
Version: `v1.0-MVP`
