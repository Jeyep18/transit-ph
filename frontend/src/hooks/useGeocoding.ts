"use client";
import { useState, useCallback, useRef } from "react";

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
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?format=json` +
          `&q=${encodeURIComponent(query)}` +
          `&limit=6` +
          `&addressdetails=1`;

        const res = await fetch(url, {
          headers: {
            "Accept-Language": "en",
          },
        });

        const data = await res.json();

        setResults(
          data.map((item: any) => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
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
