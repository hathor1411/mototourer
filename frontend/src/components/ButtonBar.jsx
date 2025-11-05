import React from "react";

export default function ButtonBar({
  loading,
  stages,
  activeStage,
  darkMode,
  toggleDarkMode,
  handleRecalculate,
  setStages,
  setActiveStage,
}) {
  return (
    <div
      className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-5 px-3 py-3 
                 bg-white dark:bg-gray-800 shadow-md rounded-lg w-full 
                 max-w-6xl mx-auto transition-all"
    >
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
  );
}
