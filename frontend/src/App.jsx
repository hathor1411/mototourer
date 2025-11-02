import { useEffect, useState } from "react";

export default function App() {
  const [message, setMessage] = useState("Lade...");

  useEffect(() => {
    fetch("http://localhost:8000/ping")
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage("Fehler bei der Verbindung 😢"));
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "3rem" }}>
      <h1>MotoTourer 🏍️</h1>
      <p>Backend-Verbindung: <strong>{message}</strong></p>
    </div>
  );
}
