# 🏍️ MotoTourer – Entwicklungs-Roadmap

Diese Roadmap beschreibt die nächsten Ausbauschritte von **MotoTourer**, 
beginnend ab **Tag 9** (nach erfolgreicher Implementierung der Höhenprofile).

---

## 🚦 Aktueller Stand (Tag 8)
✅ Etappen-Berechnung über OpenRouteService  
✅ Höhenprofile für alle Etappen (mit ORS Elevation)  
✅ Frontend-Integration mit Karte und Diagrammen  
✅ Stabile Kommunikation Backend ↔ Frontend  

---

## 🗓️ Roadmap: Tag 9 – 14

### 🧭 **Tag 9 – Etappen-Statistiken & Höhenmeter**
**Ziel:** Jede Etappe zeigt Distanz & Höhenmeter im UI.  
**Aufgaben:**
- Backend: `/stage_info` um `elevation_gain_m` + `distance_km` erweitern  
- Frontend: Anzeige unter jeder Etappe (`+1234 m Höhengewinn`)  
- Optionale Tooltip-Info auf der Karte  

**Ergebnis:** Etappen enthalten Distanz und Höhenprofil – bessere Übersicht.

---

### 📊 **Tag 10 – Höhenprofil-Diagramm erweitern**
**Ziel:** Interaktives Diagramm mit D3 / Recharts.  
**Aufgaben:**
- `ElevationChart.jsx`: x = Distanz, y = Höhe  
- Hover zeigt Etappen-Infos (km + Höhenmeter)  
- Farbverlauf → grün = tief, rot = hoch  

**Ergebnis:** Präzise, visuell ansprechende Höhenkurven je Etappe.

---

### 🧱 **Tag 11 – Backend-Struktur & API-Cleanup**
**Ziel:** Klare API-Architektur für zukünftige Erweiterungen.  
**Aufgaben:**
- Routen `/route`, `/stages`, `/elevation` → in `routes/`-Ordner auslagern  
- `main.py` wird schlank  
- Neue Datei `config.py` für API-Keys & Einstellungen  

**Ergebnis:** Saubere Code-Basis – bereit für Skalierung.

---

### 🗂️ **Tag 12 – Projektspeicherung**
**Ziel:** Routen & Etappen lokal oder in DB speichern.  
**Aufgaben:**
- Backend: SQLite- oder JSON-Speicherung (Name, Datum, Punkte)  
- Frontend: Buttons **„Tour speichern“** / **„Tour laden“**  
- Optional: Speicherung im LocalStorage  

**Ergebnis:** Tourdaten bleiben dauerhaft erhalten.

---

### 📍 **Tag 13 – UI / UX-Verbesserung**
**Ziel:** Mehr Übersicht und besseres Benutzererlebnis.  
**Aufgaben:**
- Ladeanimation bei API-Requests  
- Farbige Marker (Start, Zwischenstopp, Ziel)  
- Hover-Highlight → Etappe auf Karte hervorheben  
- Responsives Layout für Desktop & Tablet  

**Ergebnis:** Professionelle, intuitive Oberfläche.

---

### ☁️ **Tag 14 – Deployment-Vorbereitung**
**Ziel:** App bereit für Online-Hosting.  
**Aufgaben:**
- Backend: Dockerfile + Gunicorn + Uvicorn  
- Frontend: `npm run build` (Vite)  
- GitHub Actions für automatischen Build & Test  

**Ergebnis:** MotoTourer kann auf Render, Railway oder Vercel deployt werden.

---

## 🚀 Bonus (Tag 15 +)
- Benutzer-Login / Cloud-Sync (z. B. Supabase)  
- Routenbearbeitung direkt auf Karte (Drag & Drop)  
- Export als GPX / KML  
- Dark Mode / Theme-Switcher  

---

## 🧩 Hinweise
- Jede Tagesetappe entspricht ca. 1 – 2 Arbeitsstunden.  
- Nach jedem Tag: `git commit` + `git tag` (`v0.9`, `v1.0`, …)  
- Code dokumentieren → `README.md` aktuell halten.  

---

**Letztes Update:** _Tag 8 – Höhenprofile erfolgreich integriert_  
**Nächster Schritt:** _Tag 9 – Etappen-Statistiken & Höhenmeter_

---
