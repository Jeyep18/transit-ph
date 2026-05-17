"use client";
import { useCallback } from "react";
import { useMapContext, type PinCoords } from "@/context/MapContext";

/**
 * Hook for managing map pin placement state.
 *
 * Wraps MapContext pin operations with additional
 * convenience logic for the route-finding workflow.
 */
export function useMapPins() {
  const {
    originPin,
    destinationPin,
    setOriginPin,
    setDestinationPin,
    pinningMode,
    setPinningMode,
    routeGeometry,
    setRouteGeometry,
    flyTo,
    fitRouteToView,
  } = useMapContext();

  /** Place origin pin and fly to it */
  const placeOrigin = useCallback(
    (lat: number, lng: number, label?: string) => {
      const pin: PinCoords = { lat, lng, label: label || `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
      setOriginPin(pin);
      flyTo(lat, lng);
    },
    [setOriginPin, flyTo],
  );

  /** Place destination pin and fly to it */
  const placeDestination = useCallback(
    (lat: number, lng: number, label?: string) => {
      const pin: PinCoords = { lat, lng, label: label || `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
      setDestinationPin(pin);
      flyTo(lat, lng);
    },
    [setDestinationPin, flyTo],
  );

  /** Clear both pins and any drawn route */
  const clearAll = useCallback(() => {
    setOriginPin(null);
    setDestinationPin(null);
    setRouteGeometry(null);
    setPinningMode(null);
  }, [setOriginPin, setDestinationPin, setRouteGeometry, setPinningMode]);

  /** Swap origin and destination pins */
  const swapPins = useCallback(() => {
    const tempOrigin = originPin;
    setOriginPin(destinationPin);
    setDestinationPin(tempOrigin);
  }, [originPin, destinationPin, setOriginPin, setDestinationPin]);

  const hasBothPins = originPin !== null && destinationPin !== null;

  return {
    originPin,
    destinationPin,
    pinningMode,
    routeGeometry,
    placeOrigin,
    placeDestination,
    setPinningMode,
    setRouteGeometry,
    fitRouteToView,
    clearAll,
    swapPins,
    hasBothPins,
  };
}
