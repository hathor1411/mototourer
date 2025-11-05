import React, { useState } from "react";

export default function RoutePlanner({ onPlanRoute, onReverse }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [stops, setStops] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!start || !end) {
      alert("Bitte Start- und Zielort angeben.");
      return;
    }
    onPlanRoute({ start, end, stops: stops.split(",").map(s => s.trim()).filter(Boolean) });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 bg-white dark:bg-gray-800 
                 shadow-md rounded-lg p-4 mb-4 max-w-5xl mx-auto transition-all"
    >
      <input
        type="text"
        placeholder="🏁 Start (z. B. München)"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        className="border rounded-md px-3 py-2 w-full sm:w-56 dark:bg-gray-700 dark:text-white"
      />

      <input
        type="text"
        placeholder="🏁 Ziel (z. B. Hamburg)"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
        className="border rounded-md px-3 py-2 w-full sm:w-56 dark:bg-gray-700 dark:text-white"
      />

      <input
        type="text"
        placeholder="➕ Zwischenstopps (optional, durch Komma trennen)"
        value={stops}
        onChange={(e) => setStops(e.target.value)}
        className="border rounded-md px-3 py-2 w-full sm:w-72 dark:bg-gray-700 dark:text-white"
      />

      <button
        type="submit"
        className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
      >
        🚀 Route berechnen
      </button>

      <button
        type="button"
        onClick={() => onReverse({ start, end })}
        className="px-4 py-2 rounded-md text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 transition"
      >
        🔄 Umkehren
      </button>
    </form>
  );
}
