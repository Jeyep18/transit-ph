"use client";
import { useState, useCallback, useRef } from "react";
import { searchStations } from "@/services/stationService";
import type { StationListItem } from "@/types/station";

/**
 * Debounced station search against GET /api/stations/?search=
 * Primary source for SearchBarContainer — uses project's own DB,
 * not Nominatim (Phase 4 will wire this in fully).
 */
export function useStationSuggestions() {
  const [suggestions, setSuggestions] = useState<StationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchStations(query);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const clear = useCallback(() => {
    setSuggestions([]);
  }, []);

  return { suggestions, loading, search, clear };
}
