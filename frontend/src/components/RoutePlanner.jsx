import React, { useState } from "react";
import useAutocomplete from "../components/useAutocomplete.js";

export default function RoutePlanner({ onPlanRoute, onReverse }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [stops, setStops] = useState([""]);

  // Autocomplete-States
  const { results: startResults } = useAutocomplete(start);
  const { results: endResults } = useAutocomplete(end);

  // Nur ein aktiver Autocomplete-Hook für Zwischenstopps
  const [activeStopIndex, setActiveStopIndex] = useState(null);
  const [activeQuery, setActiveQuery] = useState("");
  const { results: stopResults } = useAutocomplete(activeQuery);

  // Absenden
  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedStops = stops.filter((s) => s.trim() !== "");
    if (!start || !end) {
      alert("Bitte Start- und Zielort angeben.");
      return;
    }
    onPlanRoute({ start, end, stops: cleanedStops });
  };

  // Stopps hinzufügen / entfernen
  const addStop = () => {
    if (stops.length >= 10) return alert("Maximal 10 Zwischenstopps erlaubt.");
    setStops([...stops, ""]);
  };
  const removeStop = (i) => setStops(stops.filter((_, idx) => idx !== i));

  return (
    <div className="w-full flex justify-center mb-6 relative z-20">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 items-center justify-center bg-white dark:bg-gray-900/90 
                   border border-gray-300 dark:border-gray-700 backdrop-blur-md px-6 py-5 
                   rounded-2xl shadow-lg max-w-5xl w-[95%] transition-all duration-300"
      >
        {/* 🏍️ Start */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="🏍️ Start (z. B. München)"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 w-full
                       bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 
                       focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          {Array.isArray(startResults) && startResults.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border 
                           border-gray-300 dark:border-gray-700 rounded-md shadow-md max-h-48 overflow-y-auto z-50">
              {startResults.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => setStart(item.name)}
                  className="px-3 py-2 hover:bg-blue-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 🧭 Zwischenstopps */}
        <div className="flex flex-col gap-2 w-full sm:w-80">
          {stops.map((stop, i) => (
            <div key={i} className="relative flex items-center gap-2">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder={`➕ Zwischenstopp ${i + 1}`}
                  value={stop}
                  onFocus={() => {
                    setActiveStopIndex(i);
                    setActiveQuery(stop);
                  }}
                  onChange={(e) => {
                    const newStops = [...stops];
                    newStops[i] = e.target.value;
                    setStops(newStops);
                    setActiveStopIndex(i);
                    setActiveQuery(e.target.value);
                  }}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2
                             w-full bg-white text-gray-900 
                             dark:bg-gray-800 dark:text-gray-100 
                             focus:ring-2 focus:ring-blue-500 outline-none transition"
                />

                {/* Dropdown nur für den aktiven Stopp */}
                {activeStopIndex === i &&
                  Array.isArray(stopResults) &&
                  stopResults.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 
                                   rounded-md shadow-md max-h-48 overflow-y-auto z-50">
                      {stopResults.map((item, idx) => (
                        <li
                          key={idx}
                          onClick={() => {
                            const newStops = [...stops];
                            newStops[i] = item.name;
                            setStops(newStops);
                            setActiveQuery("");
                            setActiveStopIndex(null);
                          }}
                          className="px-3 py-2 hover:bg-blue-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          {item.name}
                        </li>
                      ))}
                    </ul>
                  )}
              </div>

              {stops.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStop(i)}
                  className="px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  ✖
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addStop}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-1 w-fit self-center sm:self-start"
          >
            ➕ Stopp hinzufügen
          </button>
        </div>

        {/* 🏁 Ziel */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="🏁 Ziel (z. B. Hamburg)"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 w-full
                       bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 
                       focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          {Array.isArray(endResults) && endResults.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border 
                           border-gray-300 dark:border-gray-700 rounded-md shadow-md max-h-48 overflow-y-auto z-50">
              {endResults.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => setEnd(item.name)}
                  className="px-3 py-2 hover:bg-blue-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium 
                       text-white bg-green-600 hover:bg-green-700 active:bg-green-800 transition"
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
