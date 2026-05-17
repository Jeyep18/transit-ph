"use client";
import { useState, useCallback } from "react";

interface LocationData {
  label: string;
  lat: number;
  lng: number;
}

/**
 * Hook for managing origin/destination location inputs.
 *
 * Handles:
 * - Manual text input with geocoding
 * - GPS current location detection
 * - Map pin coordinate selection
 */
export function useLocationInput() {
  const [origin, setOrigin] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [activeField, setActiveField] = useState<"from" | "to" | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  /** Set origin location from search or pin */
  const setOriginLocation = useCallback((label: string, lat: number, lng: number) => {
    setOrigin({ label, lat, lng });
  }, []);

  /** Set destination location from search or pin */
  const setDestinationLocation = useCallback((label: string, lat: number, lng: number) => {
    setDestination({ label, lat, lng });
  }, []);

  /** Set whichever field is currently active */
  const setActiveLocation = useCallback(
    (label: string, lat: number, lng: number) => {
      if (activeField === "from") {
        setOrigin({ label, lat, lng });
      } else if (activeField === "to") {
        setDestination({ label, lat, lng });
      }
      setActiveField(null);
    },
    [activeField],
  );

  /** Swap origin and destination */
  const swapLocations = useCallback(() => {
    setOrigin((prev) => {
      const old = destination;
      setDestination(prev);
      return old;
    });
  }, [destination]);

  /** Detect current GPS position and set as origin */
  const detectCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const label = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        setOrigin({ label, lat: latitude, lng: longitude });
        setGpsLoading(false);
      },
      (error) => {
        setGpsError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied."
            : "Could not determine your location.",
        );
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  /** Clear both locations */
  const clearLocations = useCallback(() => {
    setOrigin(null);
    setDestination(null);
    setActiveField(null);
  }, []);

  const hasOrigin = origin !== null;
  const hasDestination = destination !== null;
  const hasBoth = hasOrigin && hasDestination;

  return {
    origin,
    destination,
    activeField,
    setActiveField,
    setOriginLocation,
    setDestinationLocation,
    setActiveLocation,
    swapLocations,
    detectCurrentLocation,
    clearLocations,
    gpsLoading,
    gpsError,
    hasOrigin,
    hasDestination,
    hasBoth,
  };
}
