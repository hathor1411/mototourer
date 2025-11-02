import MapView from "./components/MapView";

export default function App() {
  return (
    <div>
      <header style={{ textAlign: "center", padding: "1rem" }}>
        <h1>MotoTourer 🏍️</h1>
        <p>Deine Motorrad-Routenkarte</p>
      </header>
      <MapView />
    </div>
  );
}
