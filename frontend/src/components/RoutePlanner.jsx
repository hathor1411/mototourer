import React, { useState } from "react";
import useAutocomplete from "../components/useAutocomplete.js";


export default function RoutePlanner({ onPlanRoute, onReverse }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [stops, setStops] = useState([""]); // Start mit einem optionalen Stoppfeld

  // 🚦 Route absenden
  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedStops = stops.filter((s) => s.trim() !== "");
    if (!start || !end) {
      alert("Bitte Start- und Zielort angeben.");
      return;
    }
    onPlanRoute({ start, end, stops: cleanedStops });
  };

  // ➕ neuen Zwischenstopp hinzufügen
  const addStop = () => {
    if (stops.length >= 10) {
      alert("Maximal 10 Zwischenstopps erlaubt.");
      return;
    }
    setStops([...stops, ""]);
  };

  // ❌ Zwischenstopp entfernen
  const removeStop = (index) => {
    const updated = [...stops];
    updated.splice(index, 1);
    setStops(updated);
  };

  // 📝 Textänderung in Stoppfeldern
  const updateStop = (index, value) => {
    const updated = [...stops];
    updated[index] = value;
    setStops(updated);
  };

  return (
    <div className="w-full flex justify-center mb-6 relative z-20">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 
                   bg-white dark:bg-gray-900/90 border border-gray-300 dark:border-gray-700 
                   backdrop-blur-md px-5 py-4 rounded-2xl shadow-lg max-w-5xl w-[95%] 
                   transition-all duration-300"
      >
        {/* 🏍️ Start */}
        <div className="relative w-full sm:w-56">
          <input
            type="text"
            placeholder="🏍️ Start (z. B. München)"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 w-full
                      bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 
                      focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          {useAutocomplete(start).results.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-md max-h-48 overflow-y-auto z-50">
              {useAutocomplete(start).results.map((item, idx) => (
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

        {/* 🧭 Dynamische Zwischenstopps mit Autocomplete */}
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          {stops.map((stop, i) => {
            const [showList, setShowList] = useState(false);
            const { results, loading } = useAutocomplete(stop);

            return (
              <div key={i} className="flex flex-col sm:flex-row items-center gap-2 relative">
                <div className="relative w-full sm:w-56">
                  <input
                    type="text"
                    placeholder={`➕ Zwischenstopp ${i + 1}`}
                    value={stop}
                    onChange={(e) => {
                      updateStop(i, e.target.value);
                      setShowList(true);
                    }}
                    onBlur={() => setTimeout(() => setShowList(false), 200)} // schließt nach Klick
                    className="border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2
                              w-full bg-white text-gray-900 
                              dark:bg-gray-800 dark:text-gray-100 
                              focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />

                  {/* Dropdown mit Vorschlägen */}
                  {showList && results.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border 
                                  border-gray-300 dark:border-gray-700 rounded-md shadow-md 
                                  max-h-48 overflow-y-auto z-50">
                      {results.map((item, idx) => (
                        <li
                          key={idx}
                          onClick={() => {
                            updateStop(i, item.name);
                            setShowList(false);
                          }}
                          className="px-3 py-2 hover:bg-blue-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          {item.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* ❌ Entfernen-Button */}
                {stops.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStop(i)}
                    className="px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 mt-1 sm:mt-0"
                  >
                    ✖
                  </button>
                )}
              </div>
            );
          })}

          {/* ➕ Stopp hinzufügen */}
          <button
            type="button"
            onClick={addStop}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-1 w-fit"
          >
            ➕ Stopp hinzufügen
          </button>
        </div>

        {/* 🏁 Ziel */}
        <div className="relative w-full sm:w-56">
          <input
            type="text"
            placeholder="🏁 Ziel (z. B. Hamburg)"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 w-full
                      bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 
                      focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          {useAutocomplete(end).results.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-md max-h-48 overflow-y-auto z-50">
              {useAutocomplete(end).results.map((item, idx) => (
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
        <div className="flex flex-wrap gap-2 justify-center">
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
