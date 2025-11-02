import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import ElevationChart from "./ElevationChart";

export default function MapView() {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStages() {
      try {
        console.log("🔄 Lade Etappen...");
        const res = await fetch("http://localhost:8000/stages");
        const data = await res.json();

        if (!data.stages || data.stages.length === 0) {
          console.warn("⚠️ Keine Etappen gefunden:", data);
          setLoading(false);
          return;
        }

        console.log(`📦 ${data.stages.length} Etappen gefunden, lade Höhen...`);

        // Höhen für jede Etappe laden
        const elevationData = await Promise.all(
          data.stages.map(async (stage) => {
            try {
              const geometry = stage.points.map(([lat, lon]) => [lon, lat]);
              const resp = await fetch("http://localhost:8000/elevation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  format_in: "polyline",
                  format_out: "geojson", 
                  geometry: geometry,
                }),
              });

              const elevData = await resp.json();
              if (!resp.ok || !elevData.geometry) {
                console.warn("⚠️ Keine gültigen Höhenwerte:", elevData);
                return [];
              }

              const coords = elevData.geometry?.coordinates || [];
              const elevations = coords.map((c) => c[2]); // [lon, lat, elevation]
              return elevations;
            } catch (err) {
              console.error("❌ Fehler beim Laden der Höhen:", err);
              return [];
            }
          })
        );

        // Kombiniere Höhen mit Etappen
        const merged = data.stages.map((stage, i) => ({
          ...stage,
          elevation: elevationData[i] || [],
        }));

        setStages(merged);
        console.log("✅ Etappen und Höhen geladen.");
      } catch (err) {
        console.error("💥 Fehler beim Laden der Etappen:", err);
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
    <div style={{ height: "80vh", width: "100%" }}>
      <MapContainer center={start} zoom={6} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Etappen farbig */}
        {stages.map((stage, i) => (
          <Polyline
            key={i}
            positions={stage.points}
            color={colors[i % colors.length]}
            weight={6}
          />
        ))}

        <Marker position={start}>
          <Popup>Start: München</Popup>
        </Marker>
        <Marker position={end}>
          <Popup>Ziel: Hirtshals</Popup>
        </Marker>
      </MapContainer>

      {loading && (
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          ⏳ Etappen werden geladen...
        </p>
      )}

      {/* Etappenübersicht */}
      {!loading && stages.length > 0 && (
        <div style={{ padding: "1rem", textAlign: "center" }}>
          <h3>Etappenübersicht</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {stages.map((s, i) => (
              <li key={i} style={{ color: colors[i % colors.length], marginBottom: "1rem" }}>
                <strong>Etappe {i + 1}</strong>: {s.distance_km} km
                {s.elevation && s.elevation.length > 0 ? (
                  <ElevationChart data={s.elevation} />
                ) : (
                  <p style={{ color: "#888" }}>Keine Höhenwerte verfügbar</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
