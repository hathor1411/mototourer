import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ElevationChart from "./ElevationChart";
import ButtonBar from "./ButtonBar";
import RoutePlanner from "./RoutePlanner";

export default function MapView() {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeStage, setActiveStage] = useState(null);
  const [popupPos, setPopupPos] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // 🔁 Zentrale Ladefunktion (lokal oder API)
  async function loadTour(forceReload = false) {
    try {
      setLoading(true);
      setError(null);
      setStages([]);

      // 📦 Versuche zuerst aus LocalStorage zu laden (wenn kein forceReload)
      if (!forceReload) {
        const saved = localStorage.getItem("mototourer_tour");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log("✅ Tour aus LocalStorage geladen.");
            setStages(parsed);
            setLoading(false);
            return;
          }
        }
      }

      console.log("🔄 Lade neue Etappen von API...");
      const res = await fetch("http://localhost:8000/stages");
      const data = await res.json();

      if (!data.stages || data.stages.length === 0) throw new Error("Keine Etappen gefunden.");

      // 🔁 Lade Details für jede Etappe
      const detailedStages = [];
      setProgress({ current: 0, total: data.stages.length });

      for (let i = 0; i < data.stages.length; i++) {
        setProgress({ current: i + 1, total: data.stages.length });
        try {
          const resp = await fetch("http://localhost:8000/stage_details", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data.stages[i]),
          });
          const details = await resp.json();
          detailedStages.push({ ...data.stages[i], ...details });
        } catch (err) {
          console.warn("⚠️ Fehler bei Etappendetails:", err);
          detailedStages.push({ ...data.stages[i], start_location: "Unbekannt", end_location: "Unbekannt" });
        }
      }

      setStages(detailedStages);
      localStorage.setItem("mototourer_tour", JSON.stringify(detailedStages));
      console.log("💾 Tour erfolgreich geladen & gespeichert.");
    } catch (err) {
      console.error("💥 Fehler beim Laden:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 🔁 Beim ersten Start
  useEffect(() => {
    loadTour();
  }, []);

  // 🌗 Dark Mode umschalten
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    setDarkMode(prev => !prev);
  };

  // 🗺️ Kartenfokus auf aktive Etappe
  function MapFocus({ stage }) {
    const map = useMap();
    useEffect(() => {
      if (!stage?.points?.length) return;
      const bounds = stage.points.map(p => [p[0], p[1]]);
      map.fitBounds(bounds, { padding: [50, 50] });
      map.setZoom(7);
    }, [stage, map]);
    return null;
  }

  // 🔁 Neu berechnen
  const handleRecalculate = () => loadTour(true);

  const colors = ["#0077ff", "#ff4444", "#22bb33", "#ff8800", "#9933ff"];
  const start = [48.1351, 11.5820];

  return (
    <div
      className={`flex justify-center items-start w-full min-h-screen transition-colors duration-500 ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="flex flex-col items-center w-full relative">

        {/* 🏍️ Ladeoverlay */}
        {loading && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: darkMode ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.95)",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <h2 style={{ color: darkMode ? "#fff" : "#333", marginBottom: "1rem", fontSize: "1.5rem" }}>
              🏍️ MotoTourer lädt Etappen...
            </h2>
            {progress.total > 0 && (
              <>
                <p>
                  Etappe {progress.current} von {progress.total}
                </p>
                <div style={{
                  width: "60%", height: "14px", background: darkMode ? "#333" : "#eee",
                  borderRadius: "7px", overflow: "hidden"
                }}>
                  <div
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                      height: "100%",
                      background: "linear-gradient(90deg,#0077ff,#22bb33)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* 🧭 Route Planner */}
        <RoutePlanner
          onPlanRoute={async ({ start, end, stops }) => {
            setLoading(true);
            try {
              const res = await fetch("http://127.0.0.1:8000/route_to_stages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ start, end, stops, stage_length_km: 300 }),
              });

              // 🔧 hier wird data deklariert!
              const data = await res.json();

              if (data.error) {
                setError(data.error);
                return;
              }

              if (data.stages && data.stages.length > 0) {
                setStages(data.stages);
                localStorage.setItem("mototourer_tour", JSON.stringify(data.stages));
                setError(null);
              } else {
                setError("Keine Etappen erhalten.");
              }

              console.log("✅ Etappen empfangen:", data.stages?.length);
            } catch (err) {
              console.error("💥 Fehler bei der Etappenberechnung:", err);
              setError(err.message);
            } finally {
              setLoading(false);
            }
          }}
        />

        <ButtonBar
          loading={loading}
          stages={stages}
          activeStage={activeStage}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          handleRecalculate={handleRecalculate}
          setStages={setStages}
          setActiveStage={setActiveStage}
        />

        {/* 🗺️ Karte */}
        {/* --- Responsive Layout: Karte & Etappen nebeneinander --- */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 w-full px-4 mb-4 max-w-[1600px]">

          {/* 🗺️ Karte */}
          <div className="h-[75vh] min-h-[400px] bg-gray-200 rounded-xl overflow-hidden shadow">
            <MapContainer center={[48.1351, 11.582]} zoom={6} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {activeStage !== null && <MapFocus stage={stages[activeStage]} />}

              {stages.map((stage, i) => (
                <Polyline
                  key={i}
                  positions={stage.points}
                  color={i === activeStage ? "#ffcc00" : ["#0077ff", "#ff4444", "#22bb33", "#ff8800", "#9933ff"][i % 5]}
                  weight={i === activeStage ? 8 : 5}
                  opacity={i === activeStage ? 1 : 0.7}
                  eventHandlers={{ click: (e) => { setActiveStage(i); setPopupPos(e.latlng); } }}
                />
              ))}

              {popupPos && activeStage !== null && (
                <Popup position={popupPos}>
                  <div style={{ minWidth: "180px" }}>
                    <strong>Etappe {activeStage + 1}</strong><br />
                    🏁 {stages[activeStage].start_location} → {stages[activeStage].end_location}<br />
                    📏 {stages[activeStage].distance_km?.toFixed(1)} km<br />
                    ⛰️ +{stages[activeStage].elevation_gain_m || 0} m
                  </div>
                </Popup>
              )}

              {stages.map((s, i) => (
                <div key={`markers-${i}`}>
                  <Marker position={s.points[0]}>
                    <Popup>🏁 Start Etappe {i + 1}<br />{s.start_location}</Popup>
                  </Marker>
                  <Marker position={s.points[s.points.length - 1]}>
                    <Popup>🎯 Ziel Etappe {i + 1}<br />{s.end_location}</Popup>
                  </Marker>
                </div>
              ))}
            </MapContainer>
          </div>

          {/* 🧭 Etappenübersicht */}
          {!loading && !error && stages.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 shadow-md overflow-y-auto max-h-[75vh]">
              <h3 className="text-center mb-4 text-lg font-semibold">
                🏍️ Etappenübersicht & Analyse
              </h3>

              <ul className="list-none p-0 m-0">
                {stages.map((s, i) => (
                  <li
                    key={i}
                    onClick={() => setActiveStage(i)}
                    className={`cursor-pointer mb-3 p-3 rounded-md transition 
                      ${activeStage === i
                        ? "bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500"
                        : "bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                  >
                    <strong>Etappe {i + 1}</strong><br />
                    {s.start_location} → {s.end_location}<br />
                    📏 {s.distance_km?.toFixed(1)} km<br />
                    ⛰️ +{s.elevation_gain_m?.toFixed(0)} / -{s.elevation_loss_m?.toFixed(0)} m<br />
                    📉 min {s.min_elevation_m} | 📈 max {s.max_elevation_m} m<br />
                    ⏱️ Zeit: {s.estimated_time_h ? `${s.estimated_time_h.toFixed(2)} h` : "–"}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
