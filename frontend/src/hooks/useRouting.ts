"use client";
import { useState, useCallback } from "react";

export interface RouteData {
  distanceKm: number;
  durationMin: number;
  geometry: [number, number][];
}

export function useRouting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRoute = useCallback(
    async (
      origin: { lat: number; lng: number },
      destination: { lat: number; lng: number },
    ): Promise<RouteData | null> => {
      setLoading(true);
      setError(null);

      try {
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
          `?overview=full&geometries=geojson&steps=false`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.code !== "Ok" || !data.routes?.length) {
          setError("No road route found between these two locations.");
          return null;
        }

        const route = data.routes[0];
        const geometry: [number, number][] = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng],
        );

        return {
          distanceKm: Math.round((route.distance / 1000) * 10) / 10,
          durationMin: Math.ceil(route.duration / 60),
          geometry,
        };
      } catch {
        setError(
          "Could not connect to routing service. Check your connection.",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { loading, error, getRoute };
}
