import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function MapView() {
  const position = [48.1351, 11.5820]; // München als Startpunkt

  return (
    <MapContainer center={position} zoom={6} style={{ height: "80vh", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>München 🏙️<br />Startpunkt deiner Tour</Popup>
      </Marker>
    </MapContainer>
  );
}
