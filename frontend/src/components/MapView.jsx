import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";

export default function MapView() {
  const [route, setRoute] = useState([]);       // für die Koordinaten
  const [loading, setLoading] = useState(true); // Ladeanzeige

  useEffect(() => {
    async function loadRoute() {
      try {
        const res = await fetch("http://localhost:8000/route");
        const data = await res.json();

        if (data.route) {
          setRoute(data.route);
        } else {
          console.error("Keine Route im Response:", data);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Route:", err);
      } finally {
        setLoading(false);
      }
    }

    loadRoute();
  }, []);

  const start = [48.1351, 11.5820]; // München
  const end = [47.3769, 8.5417];    // Zürich

  return (
    <div style={{ height: "80vh", width: "100%" }}>
      <MapContainer center={start} zoom={6} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marker für Start/Ziel */}
        <Marker position={start}><Popup>Start: München 🏙️</Popup></Marker>
        <Marker position={end}><Popup>Ziel: Zürich 🇨🇭</Popup></Marker>

        {/* Polyline nur zeichnen, wenn Daten da sind */}
        {route.length > 0 && (
          <Polyline positions={route} color="blue" weight={4} />
        )}
      </MapContainer>

      {loading && (
        <p style={{ textAlign: "center", marginTop: "1rem" }}>Route wird geladen...</p>
      )}
    </div>
  );
}
