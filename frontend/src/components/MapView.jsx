import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import ElevationChart from "./ElevationChart";

export default function MapView() {
  const [stages, setStages] = useState([]);
  const [activeStage, setActiveStage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStages() {
      try {
        const res = await fetch("http://localhost:8000/stages");
        const data = await res.json();
        setStages(data.stages || []);
      } catch (err) {
        console.error("Fehler beim Laden der Etappen:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStages();
  }, []);

  const colors = ["#0077ff", "#ff4444", "#22bb33", "#ff8800", "#9933ff"];
  const start = [48.1351, 11.5820];
  const end = [57.5886, 9.9592];

  // --- Gesamtdaten berechnen ---
  const totalDistance = stages.reduce((sum, s) => sum + (s.distance_km || 0), 0);
  const totalElevation = stages.reduce((sum, s) => sum + (s.elevation_gain_m || 0), 0);

  return (
    <div style={{ height: "80vh", width: "100%" }}>
      <MapContainer center={start} zoom={6} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {stages.map((stage, i) => (
          <Polyline
            key={i}
            positions={stage.points}
            color={colors[i % colors.length]}
            weight={activeStage === i ? 8 : 4}
            opacity={activeStage === i ? 1 : 0.6}
            eventHandlers={{
              click: () => setActiveStage(i),
            }}
          />
        ))}

        <Marker position={start}><Popup>Start: München</Popup></Marker>
        <Marker position={end}><Popup>Ziel: Hirtshals</Popup></Marker>
      </MapContainer>

      {loading && <p style={{ textAlign: "center", marginTop: "1rem" }}>⏳ Etappen werden geladen...</p>}

      {!loading && stages.length > 0 && (
        <div style={{ padding: "1rem", textAlign: "center" }}>
          <h3>Etappenübersicht</h3>

          {/* Gesamtwerte der Tour */}
          <div
            style={{
              background: "#f7f7f7",
              padding: "1rem",
              borderRadius: "10px",
              marginBottom: "1rem",
              boxShadow: "0 0 4px rgba(0,0,0,0.1)",
            }}
          >
            <strong>Gesamtdistanz:</strong> {totalDistance.toFixed(1)} km &nbsp;|&nbsp;
            <strong>Gesamte Höhenmeter:</strong> +{totalElevation.toFixed(0)} m
          </div>

          <ul style={{ listStyle: "none", padding: 0 }}>
            {stages.map((s, i) => (
              <li
                key={i}
                onClick={() => setActiveStage(i)}
                style={{
                  cursor: "pointer",
                  color: activeStage === i ? "#000" : colors[i % colors.length],
                  background: activeStage === i ? "#f0f0f0" : "transparent",
                  borderRadius: "8px",
                  padding: "0.5rem",
                  marginBottom: "0.5rem",
                  transition: "0.2s",
                }}
              >
                <strong>Etappe {i + 1}</strong> – {s.distance_km} km
              </li>
            ))}
          </ul>

          {activeStage !== null && (
            <div style={{ marginTop: "2rem" }}>
              <h4>Details zu Etappe {activeStage + 1}</h4>
              <p>
                Distanz: {stages[activeStage].distance_km} km | Höhenmeter: +
                {stages[activeStage].elevation_gain_m || 0} m
              </p>
              {stages[activeStage].elevation?.length > 0 ? (
                <ElevationChart data={stages[activeStage].elevation} />
              ) : (
                <p style={{ color: "#888" }}>Kein Höhenprofil verfügbar</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
