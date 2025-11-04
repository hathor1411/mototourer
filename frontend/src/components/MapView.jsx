import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ElevationChart from "./ElevationChart";

export default function MapView() {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState(0);
  const [totalStages, setTotalStages] = useState(0);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false); // ✅ gefehlt!
  const [activeStage, setActiveStage] = useState(null);
  const [popupPos, setPopupPos] = useState(null);

  // 🔁 Tour beim Start laden (falls vorhanden)
  useEffect(() => {
    const saved = localStorage.getItem("mototourer_tour");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 🧩 Prüfen, ob Details fehlen
          const missingDetails = parsed.some(
            s => !s.start_location || !s.end_location
          );
          if (!missingDetails) {
            console.log("✅ Vollständige Tour aus LocalStorage geladen.");
            setStages(parsed);
            setLoading(false);
            return;
          } else {
            console.log("ℹ️ Gespeicherte Tour ist unvollständig – lade Details neu.");
          }
        }
      } catch (e) {
        console.warn("⚠️ Fehler beim Laden der gespeicherten Tour:", e);
      }
    }
  }, []);

  // 💾 Tour automatisch speichern, wenn sich Etappen ändern
  useEffect(() => {
    if (Array.isArray(stages) && stages.length > 0) {
      // 🧩 Nur speichern, wenn die Etappen wirklich vollständig sind
      const complete = stages.every(s => s.start_location && s.end_location);
      if (complete) {
        localStorage.setItem("mototourer_tour", JSON.stringify(stages));
        console.log("💾 Vollständige Tour gespeichert (mit Ortsnamen).");
      } else {
        console.log("⚠️ Noch unvollständige Etappen – wird nicht gespeichert.");
      }
    }
  }, [stages]);

  useEffect(() => {
    async function loadStages() {
      // 📦 Zuerst prüfen, ob eine gespeicherte Tour existiert
      const saved = localStorage.getItem("mototourer_tour");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            console.log("✅ Gespeicherte Tour aus LocalStorage geladen.");
            setStages(parsed);
            setLoading(false);
            return; // ❗ kein API-Aufruf mehr nötig
          }
        } catch (e) {
          console.warn("⚠️ Fehler beim Laden der gespeicherten Tour:", e);
        }
      }

      // 🔄 Wenn keine gespeicherte Tour → neue Tour generieren
      try {
        console.log("🔄 Lade neue Etappen von API...");
        const res = await fetch("http://localhost:8000/stages");
        const data = await res.json();

        if (!data.stages || data.stages.length === 0) {
          throw new Error("Keine Etappen gefunden.");
        }

        setStages(data.stages);
        setLoading(false);
        localStorage.setItem("mototourer_tour", JSON.stringify(data.stages)); // 💾 gleich speichern
        console.log("💾 Tour im LocalStorage gespeichert.");
      } catch (err) {
        console.error("💥 Fehler beim Laden der Etappen:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadStages();
  }, []);


  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    setDarkMode((prev) => !prev);
  };

  function MapFocus({ stage }) {
    const map = useMap();

    useEffect(() => {
      if (!stage || !stage.points || stage.points.length === 0) return;

      // Berechne die Bounding-Box der Etappe
      const bounds = stage.points.map(p => [p[0], p[1]]);
      map.fitBounds(bounds, { padding: [50, 50] }); // ✅ Zoom auf Etappe
    }, [stage, map]);

    return null;
  }

  const handleRecalculate = async () => {
    try {
      setLoading(true);
      setStages([]);
      setCurrentStage(0);       // ✅ Fortschritt zurücksetzen
      setTotalStages(0);        // ✅ Fortschritt zurücksetzen
      localStorage.removeItem("mototourer_tour");
      setError(null);
      console.log("🔄 Tour wird neu berechnet...");

      // 🗺️ Neue Etappen abrufen
      const res = await fetch("http://localhost:8000/stages");
      const data = await res.json();

      if (!data.stages || data.stages.length === 0) {
        throw new Error("Keine Etappen gefunden.");
      }

      setTotalStages(data.stages.length); // ✅ Gesamtzahl der Etappen festlegen

      const detailedStages = [];

      for (let i = 0; i < data.stages.length; i++) {
        const stage = data.stages[i];
        setCurrentStage(i + 1); // ✅ Fortschritt aktualisieren

        try {
          const resp = await fetch("http://localhost:8000/stage_details", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stage),
          });

          const details = await resp.json();
          detailedStages.push({ ...stage, ...details });
        } catch (err) {
          console.warn("⚠️ Fehler bei Etappendetails:", err);
          detailedStages.push({
            ...stage,
            start_location: "Unbekannt",
            end_location: "Unbekannt",
            elevation_gain_m: 0,
          });
        }
      }

      // ✅ Neue Etappen setzen + speichern
      setStages(detailedStages);
      localStorage.setItem("mototourer_tour", JSON.stringify(detailedStages));
      console.log("✅ Neue Tour erfolgreich geladen und gespeichert.");
    } catch (err) {
      console.error("💥 Fehler beim Neuberechnen:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  const colors = ["#0077ff", "#ff4444", "#22bb33", "#ff8800", "#9933ff"];
  const start = [48.1351, 11.5820];
  const end = [57.5886, 9.9592];

  return (
    <div
      className={`flex justify-center items-start w-full min-h-screen transition-colors duration-500 ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="flex flex-col items-center w-full relative">
      {/* Ladeoverlay (fixiert & sichtbar über Karte) */}
      {loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: darkMode
              ? "rgba(0, 0, 0, 0.85)"
              : "rgba(255, 255, 255, 0.95)",
            zIndex: 9999, // ✅ liegt über Leaflet
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transition: "opacity 0.6s ease",
          }}
        >
          <h2
            style={{
              color: darkMode ? "#fff" : "#333",
              marginBottom: "1rem",
              fontSize: "1.5rem",
            }}
          >
            🏍️ MotoTourer lädt Etappen...
          </h2>

          {totalStages > 0 ? (
            <>
              <p
                style={{
                  fontSize: "1.1rem",
                  color: darkMode ? "#ddd" : "#333",
                  marginBottom: "0.5rem",
                }}
              >
                Etappe {currentStage} von {totalStages}
              </p>

              <div
                style={{
                  width: "60%",
                  height: "14px",
                  background: darkMode ? "#333" : "#eee",
                  borderRadius: "7px",
                  overflow: "hidden",
                  boxShadow: "0 0 10px rgba(0,0,0,0.2)",
                }}
              >
                <div
                  style={{
                    width: `${(currentStage / totalStages) * 100}%`,
                    height: "100%",
                    background:
                      "linear-gradient(90deg, #0077ff, #22bb33)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </>
          ) : (
            <p style={{ color: "#555" }}>Etappen werden geladen...</p>
          )}
        </div>
      )}


      {/* --- Modernisierte Toolbar --- */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-5 px-3 py-3 
                      bg-white dark:bg-gray-800 shadow-md rounded-lg w-full 
                      max-w-6xl mx-auto transition-all">

        {/* 🗺️ Neu berechnen */}
        <button
          disabled={loading}
          onClick={handleRecalculate}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium text-white transition 
            ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          <span>🗺️</span> <span className="hidden sm:inline">Neu berechnen</span>
        </button>

        {/* 💾 Speichern */}
        <button
          disabled={loading || stages.length === 0}
          onClick={() => {
            localStorage.setItem("mototourer_tour", JSON.stringify(stages));
            alert("💾 Tour gespeichert!");
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium text-white transition 
            ${stages.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
        >
          <span>💾</span> <span className="hidden sm:inline">Speichern</span>
        </button>

        {/* 📂 Laden */}
        <button
          onClick={() => {
            const saved = localStorage.getItem("mototourer_tour");
            if (saved) {
              setStages(JSON.parse(saved));
              alert("📂 Tour geladen!");
            } else {
              alert("⚠️ Keine gespeicherte Tour gefunden!");
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition"
        >
          <span>📂</span> <span className="hidden sm:inline">Laden</span>
        </button>

        {/* 🗑️ Löschen */}
        <button
          disabled={loading}
          onClick={() => {
            localStorage.removeItem("mototourer_tour");
            setStages([]);
            setActiveStage(null);
            alert("🗑️ Tour gelöscht!");
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium text-white transition 
            ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
        >
          <span>🗑️</span> <span className="hidden sm:inline">Löschen</span>
        </button>

        {/* 🧭 GPX Export */}
        <button
          disabled={activeStage === null}
          onClick={() => {
            const stage = stages[activeStage];
            if (!stage) return alert("❌ Keine aktive Etappe!");
            const gpx = `<?xml version="1.0" encoding="UTF-8"?>
      <gpx version="1.1" creator="MotoTourer" xmlns="http://www.topografix.com/GPX/1/1">
      <trk><name>Etappe ${activeStage + 1}</name><trkseg>
      ${stage.points.map(([lat, lon]) => `<trkpt lat="${lat}" lon="${lon}"></trkpt>`).join("\n")}
      </trkseg></trk></gpx>`;
            const blob = new Blob([gpx], { type: "application/gpx+xml" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `mototourer_etappe_${activeStage + 1}.gpx`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium text-white transition 
            ${activeStage === null ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"}`}
        >
          <span>🧭</span> <span className="hidden sm:inline">GPX</span>
        </button>

        {/* 📤 JSON Export */}
        <button
          disabled={stages.length === 0}
          onClick={() => {
            const blob = new Blob([JSON.stringify({ stages }, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "mototourer_tour.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium text-white transition 
            ${stages.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"}`}
        >
          <span>📤</span> <span className="hidden sm:inline">JSON</span>
        </button>

        {/* 📥 JSON Import */}
        <label className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium text-white bg-teal-600 hover:bg-teal-700 cursor-pointer transition">
          <span>📥</span> <span className="hidden sm:inline">Import</span>
          <input
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              try {
                const text = await file.text();
                const data = JSON.parse(text);
                if (data.stages) {
                  setStages(data.stages);
                  alert("✅ Tour importiert!");
                } else alert("❌ Ungültige Datei.");
              } catch {
                alert("❌ Fehler beim Import.");
              }
            }}
          />
        </label>

        {/* 🌗 Dark Mode */}
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium bg-gray-700 hover:bg-gray-800 text-white transition"
        >
          <span>{darkMode ? "☀️" : "🌗"}</span>
          <span className="hidden sm:inline">{darkMode ? "Hell" : "Dunkel"}</span>
        </button>
      </div>

      {/* --- Responsive Layout (CSS Grid) --- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr", // bleibt 1 Spalte als Default
          gap: "1rem",
          width: "100%", // ✅ nimmt volle Breite ein
          margin: 0, // ✅ entfernt die Begrenzung
          padding: "1rem",
        }}
      >
        {/* Karte */}
        <div
          style={{
            height: "75vh",
            minHeight: "400px",
            background: "#e0e0e0",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          }}
        >
          <MapContainer center={start} zoom={6} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* 🔥 Karte fokussiert automatisch auf aktive Etappe */}
            {activeStage !== null && <MapFocus stage={stages[activeStage]} />}

            {stages.map((stage, i) => (
              <Polyline
                key={`${i}-${activeStage === i}`} // 🔥 erzwingt Neuzeichnung
                positions={stage.points}
                color={i === activeStage ? "#ffcc00" : colors[i % colors.length]} // ✅ aktiv = gold
                weight={i === activeStage ? 8 : 5}
                opacity={i === activeStage ? 1 : 0.7}
                eventHandlers={{
                  click: (e) => {
                    setActiveStage(i);
                    setPopupPos(e.latlng);
                  }
                }}
              />
            ))}
          {popupPos && activeStage !== null && (
          <Popup position={popupPos}>
            <div style={{ minWidth: "180px" }}>
              <strong>Etappe {activeStage + 1}</strong>
              <br />
              🏁 {stages[activeStage].start_location} → {stages[activeStage].end_location}
              <br />
              📏 {stages[activeStage].distance_km?.toFixed(1)} km
              <br />
              ⛰️ +{stages[activeStage].elevation_gain_m || 0} m
            </div>
          </Popup>
          )}
          {/* Start- & Ziel-Marker für jede Etappe */}
          {stages.map((s, i) => (
            <div key={`markers-${i}`}>
              <Marker position={s.points[0]}>
                <Popup>
                  🏁 <strong>Start Etappe {i + 1}</strong>
                  <br />
                  {s.start_location || "Unbekannt"}
                </Popup>
              </Marker>

              <Marker position={s.points[s.points.length - 1]}>
                <Popup>
                  🎯 <strong>Ziel Etappe {i + 1}</strong>
                  <br />
                  {s.end_location || "Unbekannt"}
                </Popup>
              </Marker>
            </div>
          ))}
          </MapContainer>
        </div>

        {/* 🗺️ Etappenübersicht – erweitert mit Analysewerten */}
        {!loading && !error && Array.isArray(stages) && stages.length > 0 ? (
          <div
            style={{
              background: darkMode ? "#1f2937" : "#f8f9fa",
              borderRadius: "12px",
              padding: "1rem",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              margin: "0 auto",
            }}
          >
            <h3
              style={{
                textAlign: "center",
                marginBottom: "1rem",
                color: darkMode ? "#fff" : "#222",
              }}
            >
              🏍️ Etappenübersicht & Analyse
            </h3>

            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {stages.map((s, i) => (
                <li
                  key={i}
                  onClick={() => setActiveStage(i)}
                  style={{
                    color: colors[i % colors.length],
                    marginBottom: "1.5rem",
                    cursor: "pointer",
                    borderBottom: activeStage === i ? "2px solid #0077ff" : "1px solid #ccc",
                    padding: "0.75rem",
                    backgroundColor: activeStage === i
                      ? "rgba(0, 119, 255, 0.1)"
                      : darkMode
                      ? "#374151"
                      : "#fff",
                    borderRadius: "8px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <strong>Etappe {i + 1}</strong>
                  <br />
                  <span>{s.start_location || "Unbekannt"} → {s.end_location || "Unbekannt"}</span>
                  <br />
                  <span>📏 Distanz: {s.distance_km?.toFixed(1)} km</span>
                  <br />
                  <span>⛰️ Höhenmeter: +{s.elevation_gain_m || 0} m / -{s.elevation_loss_m || 0} m</span>
                  {s.min_elevation_m && s.max_elevation_m && (
                    <><br />
                      <span>📉 min: {s.min_elevation_m} m | 📈 max: {s.max_elevation_m} m</span>
                    </>
                  )}
                  {s.steep_segments && (
                    <>
                      <br />
                      <span>
                        🚵 Steigungen: {s.steep_segments.mild || 0}× mild,{" "}
                        {s.steep_segments.steep || 0}× steil,{" "}
                        {s.steep_segments.very_steep || 0}× sehr steil
                      </span>
                    </>
                  )}
                  <br />
                  <span>⏱️ Zeit (Ø 55 km/h): {s.estimated_time_h ? `${(s.estimated_time_h).toFixed(2)} h` : "–"}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          !loading && (
            <p style={{ textAlign: "center", color: darkMode ? "#ccc" : "#333" }}>
              Keine Tour geladen.
            </p>
          )
        )}

      </div>

      {/* Fehleranzeige */}
      {error && (
        <p style={{ color: "red", textAlign: "center", marginTop: "1rem" }}>
          ❌ Fehler: {error}
        </p>
      )}
    </div>
  </div>
  );
}
