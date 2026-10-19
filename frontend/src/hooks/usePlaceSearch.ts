import { useEffect, useState } from "react";
import { searchPlaces } from "../lib/api";
import type { Place } from "../types";

export function usePlaceSearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<Place[]>([]);

  useEffect(() => {
    if (!enabled || query.trim().length < 3) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      searchPlaces(query, ctrl.signal).then(setResults).catch(() => setResults([]));
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, enabled]);

  return results;
}
