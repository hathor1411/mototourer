import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import ElevationChart from "./ElevationChart";

export default function MapView() {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState(0);
  const [totalStages, setTotalStages] = useState(0);
  const [error, setError] = useState(null);

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
          setCurrentStage(i + 1); // ✅ Anzeige aktualisieren

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

  const colors = ["#0077ff", "#ff4444", "#22bb33", "#ff8800", "#9933ff"];
  const start = [48.1351, 11.5820]; // München
  const end = [57.5886, 9.9592]; // Hirtshals

  return (
    <div style={{ height: "80vh", width: "100%", position: "relative" }}>
      {/* Ladeoverlay */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255, 255, 255, 0.9)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transition: "opacity 0.6s ease",
            opacity: loading ? 1 : 0,
            pointerEvents: loading ? "auto" : "none",
          }}
        >
          <h2 style={{ color: "#333", marginBottom: "1rem" }}>🏍️ MotoTourer lädt Etappen...</h2>
          {totalStages > 0 ? (
            <>
              <p style={{ fontSize: "1.1rem", color: "#333", fontWeight: "500" }}>
                Etappe {currentStage} von {totalStages}
              </p>
              <div
                style={{
                  width: "60%",
                  height: "12px",
                  background: "#eee",
                  borderRadius: "6px",
                  overflow: "hidden",
                  marginTop: "0.5rem",
                }}
              >
                <div
                  style={{
                    width: `${(currentStage / totalStages) * 100}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #0077ff, #22bb33)",
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

      {/* Karte */}
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
            weight={5}
          />
        ))}

        <Marker position={start}>
          <Popup>Start: München</Popup>
        </Marker>
        <Marker position={end}>
          <Popup>Ziel: Hirtshals</Popup>
        </Marker>
      </MapContainer>

      {/* Fehleranzeige */}
      {error && (
        <p style={{ color: "red", textAlign: "center", marginTop: "1rem" }}>
          ❌ Fehler: {error}
        </p>
      )}

      {/* Etappenübersicht */}
      {!loading && !error && stages.length > 0 && (
        <div style={{ padding: "1rem", textAlign: "center" }}>
          <h3>🗺️ Etappenübersicht</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {stages.map((s, i) => (
              <li key={i} style={{ color: colors[i % colors.length], marginBottom: "1.5rem" }}>
                <strong>Etappe {i + 1}</strong><br />
                <span>{s.start_location || "Unbekannt"} → {s.end_location || "Unbekannt"}</span><br />
                <span>Distanz: {s.distance_km?.toFixed(1)} km</span><br />
                <span>Höhenmeter: +{s.elevation_gain_m || 0} m</span>
                {s.elevation && s.elevation.length > 0 && (
                  <ElevationChart data={s.elevation} />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
