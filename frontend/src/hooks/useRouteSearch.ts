"use client";
import { useState, useCallback } from "react";
import { searchRoutes } from "@/services/searchService";
import { sortRoutes } from "@/lib/routeSorting";
import type { RouteResult, SearchQuery, SearchResponse } from "@/types/search";
import type { SortMode } from "@/lib/routeSorting";

interface UseRouteSearchReturn {
  results: RouteResult[];
  loading: boolean;
  error: string | null;
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  execute: (query: SearchQuery) => Promise<RouteResult[]>;
  search: (query: SearchQuery) => Promise<RouteResult[]>;
  reset: () => void;
}

export function useRouteSearch(): UseRouteSearchReturn {
  const [results, setResults] = useState<RouteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortModeState] = useState<SortMode>("fare");

  const execute = useCallback(
    async (query: SearchQuery): Promise<RouteResult[]> => {
      setLoading(true);
      setError(null);

      try {
        const response: SearchResponse = await searchRoutes(query);

        if (!response.results.length) {
          setError("No routes found between these locations.");
          setResults([]);
          return [];
        }

        const sorted = sortRoutes(response.results, sortMode);
        setResults(sorted);
        return sorted;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Search failed. Please try again.";
        setError(message);
        setResults([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [sortMode],
  );

  const setSortMode = useCallback((mode: SortMode) => {
    setSortModeState(mode);
    // Re-sort existing results immediately — no refetch needed
    setResults((prev) => sortRoutes(prev, mode));
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    sortMode,
    setSortMode,
    execute,
    search: execute,
    reset,
  };
}
