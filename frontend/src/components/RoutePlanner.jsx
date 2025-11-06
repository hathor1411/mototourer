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
    <div className="w-full flex justify-center mb-6 relative z-20">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 
                   bg-white dark:bg-gray-900/90 border border-gray-300 dark:border-gray-700 
                   backdrop-blur-md px-5 py-4 rounded-2xl shadow-lg max-w-5xl w-[95%] 
                   transition-all duration-300"
        style={{ marginTop: "0.5rem" }}
      >
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
          <input
            type="text"
            placeholder="🏍️ Start (z. B. München)"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2
                       w-full sm:w-56 bg-white text-gray-900 
                       dark:bg-gray-800 dark:text-gray-100 
                       focus:ring-2 focus:ring-blue-500 outline-none transition"

          />

          <input
            type="text"
            placeholder="🏁 Ziel (z. B. Hamburg)"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2
                       w-full sm:w-56 bg-white text-gray-900 
                       dark:bg-gray-800 dark:text-gray-100 
                       focus:ring-2 focus:ring-blue-500 outline-none transition"
          />

          <input
            type="text"
            placeholder="➕ Zwischenstopps (optional, Komma getrennt)"
            value={stops}
            onChange={(e) => setStops(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2
                       w-full sm:w-56 bg-white text-gray-900 
                       dark:bg-gray-800 dark:text-gray-100 
                       focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium 
                       text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition"
          >
            🚀 <span className="hidden sm:inline">Route berechnen</span>
          </button>

          <button
            type="button"
            onClick={() => onReverse({ start, end })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium 
                       text-white bg-gray-700 hover:bg-gray-800 active:bg-gray-900 transition"
          >
            🔄 <span className="hidden sm:inline">Umkehren</span>
          </button>
        </div>
      </form>
    </div>
  );
}
