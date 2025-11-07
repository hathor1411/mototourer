import { useState, useEffect } from "react";

export default function useAutocomplete(query) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/autocomplete?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        if (data?.results) setResults(data.results);
      } catch (err) {
        console.error("Autocomplete-Fehler:", err);
      } finally {
        setLoading(false);
      }
    }, 400); // ⏱️ debounce 400 ms

    return () => clearTimeout(timeout);
  }, [query]);

  return { results, loading };
}
