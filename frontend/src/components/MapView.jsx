import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ElevationChart from "./ElevationChart";

export default function MapView() {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState(0);
  const [totalStages, setTotalStages] = useState(0);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false); // ✅ gefehlt!

  useEffect(() => {
    async function loadStages() {
      try {
        console.log("🔄 Lade Etappen...");
        const res = await fetch("http://localhost:8000/stages");
        const data = await res.json();

        if (!data.stages || data.stages.length === 0) {
          throw new Error("Keine Etappen gefunden.");
        }

        setTotalStages(data.stages.length);
        const detailedStages = [];

        for (let i = 0; i < data.stages.length; i++) {
          const stage = data.stages[i];
          setCurrentStage(i + 1);

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

        setStages(detailedStages);
        console.log("✅ Alle Etappen erfolgreich geladen.");
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


      {/* --- Button-Leiste (zentriert + responsive) --- */}
      <div className="button-bar flex flex-wrap justify-center gap-4 mb-6 px-6 py-4 
                      bg-white dark:bg-gray-800 shadow-md rounded-xl 
                      w-full max-w-7xl mx-auto box-border transition-all">
        <button
          disabled={loading}
          onClick={() => window.location.reload()}
          className={`px-5 py-2.5 rounded-lg font-medium text-white transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          🗺️ Tour neu berechnen
        </button>

        <button
          disabled={loading || stages.length === 0}
          onClick={() =>
            localStorage.setItem("mototourer_tour", JSON.stringify(stages))
          }
          className={`px-5 py-2.5 rounded-lg font-medium text-white transition ${
            stages.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          💾 Tour speichern
        </button>

        <button
          disabled={loading}
          onClick={() => {
            localStorage.removeItem("mototourer_tour");
            setStages([]);
          }}
          className={`px-5 py-2.5 rounded-lg font-medium text-white transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          🗑️ Tour löschen
        </button>

        <button
          onClick={toggleDarkMode}
          className="px-5 py-2.5 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-800 transition"
        >
          {darkMode ? "☀️ Hellmodus" : "🌗 Dunkelmodus"}
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
          <MapContainer
            center={[48.1351, 11.5820]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {stages.map((stage, i) => (
              <Polyline
                key={i}
                positions={stage.points}
                color={["#0077ff", "#ff4444", "#22bb33", "#ff8800", "#9933ff"][i % 5]}
                weight={5}
              />
            ))}

            <Marker position={[48.1351, 11.5820]}>
              <Popup>Start: München</Popup>
            </Marker>
            <Marker position={[57.5886, 9.9592]}>
              <Popup>Ziel: Hirtshals</Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Etappenübersicht */}
        {!loading && !error && stages.length > 0 && (
          <div
            style={{
              background: darkMode ? "#1f2937" : "#f8f9fa",
              borderRadius: "12px",
              padding: "1rem",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                textAlign: "center",
                marginBottom: "1rem",
                color: darkMode ? "#fff" : "#222",
              }}
            >
              🗺️ Etappenübersicht
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {stages.map((s, i) => (
                <li
                  key={i}
                  style={{
                    color: ["#0077ff", "#ff4444", "#22bb33", "#ff8800", "#9933ff"][i % 5],
                    marginBottom: "1rem",
                    borderBottom: "1px solid #ccc",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <strong>Etappe {i + 1}</strong><br />
                  <span>{s.start_location || "Unbekannt"} → {s.end_location || "Unbekannt"}</span><br />
                  <span>Distanz: {s.distance_km?.toFixed(1)} km</span><br />
                  <span>Höhenmeter: +{s.elevation_gain_m || 0} m</span>
                </li>
              ))}
            </ul>
          </div>
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
