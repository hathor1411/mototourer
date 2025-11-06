# 🏍️ **MotoTourer**

> **Planen. Fahren. Erleben.**  
> MotoTourer ist eine moderne Web-App für Motorradfahrer zur Planung mehrtägiger Touren — mit Etappenberechnung, Höhenprofil, Kartenansicht und zukünftig smarten Reisevorschlägen.

---

## 🚀 **Live Demo**

🔗 **Frontend (GitHub Pages):**  
👉 [https://hathor1411.github.io/mototourer/](https://hathor1411.github.io/mototourer/)

⚙️ **Backend (FastAPI – Codespaces):**  
👉 [https://cuddly-space-succotash-64wg7jg9469cr79w-8000.app.github.dev/docs](https://cuddly-space-succotash-64wg7jg9469cr79w-8000.app.github.dev/docs)

---

## 🧭 **Projektüberblick**

MotoTourer kombiniert **OpenStreetMap**, **OpenRouteService** und **React + FastAPI**,  
um Motorradfahrer:innen eine einfache, präzise und visuell ansprechende Möglichkeit zur **Tourenplanung mit Etappenberechnung** zu bieten.

### ✨ Aktuelle Hauptfunktionen

- 📍 Start–Ziel–Routenplanung (inkl. Zwischenstopps)
- ⛰️ Höhenprofil & Distanzanalyse
- 🏁 Etappenberechnung (automatisch)
- 🗺️ Leaflet-Karte mit nummerierten Etappenmarkern
- 💾 Lokale Speicherung & Wiederherstellung
- 🌗 Dark-/Lightmode
- 🚀 Live-Backend via FastAPI (OpenRouteService API)

---

## 🧱 **Technologien**

| Bereich | Technologien |
|----------|---------------|
| **Frontend** | React (Vite), Leaflet, Tailwind/UnoCSS |
| **Backend** | FastAPI, Python, geopy, openrouteservice |
| **Deployment** | GitHub Pages (Frontend), Codespaces (Backend) |
| **API** | OpenRouteService, OpenElevation (optional) |

---

## 🗺️ **Roadmap – MotoTourer v2+**

> Entwicklungsplan für die nächsten Versionen (Phasenweise)

---

### 🧩 **Phase 1 — Erweiterte Kernfunktionen & neues Layout**
**Ziel:** Mehr Kontrolle über Routen + professionelleres UI

- [ ] Bis zu 10 Zwischenziele  
- [ ] Modernes, minimalistisches Layout (2-Spalten-Ansicht)  
- [ ] Etappenberechnung: variabel nach Tageslänge oder Zeit  
- [ ] Einheitliches Karten-/Listendesign  
- [ ] Farblich abgestufte Etappenlinien  

---

### 🔐 **Phase 2 — Registrierung & Profile**
**Ziel:** Persönliche Tourverwaltung und Motorradprofile

- [ ] User-Login & Registrierung (FastAPI + JWT oder Supabase)  
- [ ] Nutzerprofil (Name, Avatar, Wohnort, Lieblingsregion)  
- [ ] Motorradprofile (Tankgröße, Reichweite, Komforttempo)  
- [ ] Speicherung & Laden von Touren pro Nutzer  

---

### 🏕️ **Phase 3 — Reise-Assistent mit externen APIs**
**Ziel:** „Smart Touring“ mit echten Reiseempfehlungen

- [ ] Übernachtungsvorschläge (Booking / OpenTripMap API)  
- [ ] POIs entlang der Etappen (Tankstellen, Sehenswürdigkeiten)  
- [ ] Anzeige in Karte & Liste mit Bewertungen/Links  
- [ ] Karten-Tabs: „Übernachtung | Essen | Tanken“  

---

### 💎 **Phase 4 — Premium-Option**
**Ziel:** Erweiterte Funktionen & Monetarisierung

- [ ] Premium-Accounts (Stripe/LemonSqueezy Integration)  
- [ ] Offline-Modus / Cloud-Sync / GPX-Export  
- [ ] Werbefreie Nutzung  
- [ ] Benutzerdefinierte Kartenlayer (Topo/Satellite)  

---

### 🌍 **Phase 5 — Community & Mobile**
**Ziel:** Ausbau zur Touring-Plattform

- [ ] Live-Tracking & Tour-Teilen  
- [ ] Wetterdaten-Integration (OpenWeather API)  
- [ ] Progressive Web App (PWA) / Mobile App  
- [ ] Community-Funktionen (Kommentare, Tour-Ranking)  

