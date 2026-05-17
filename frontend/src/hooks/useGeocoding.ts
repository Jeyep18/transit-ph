"use client";
import { useState, useCallback, useRef } from "react";
import { nominatimSearch } from "@/lib/nominatimSearch";

export interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;
  shortName: string;
}

export function useGeocoding() {
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim() || query.length < 3) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await nominatimSearch(query);

        setResults(
          data.map((item) => ({
            lat: item.lat,
            lng: item.lon,
            displayName: item.display_name,
            shortName: item.display_name.split(",")[0].trim(),
          })),
        );
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setLoading(false);
  }, []);

  return { results, loading, search, clear };
}
