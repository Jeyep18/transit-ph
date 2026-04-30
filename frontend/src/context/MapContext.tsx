"use client";
import { createContext, useContext, useRef, useState, ReactNode } from "react";
import type { Map as LeafletMap } from "leaflet";

export interface PinCoords {
  lat: number;
  lng: number;
  label: string;
}

interface MapContextType {
  mapRef: React.MutableRefObject<LeafletMap | null>;
  originPin: PinCoords | null;
  destinationPin: PinCoords | null;
  setOriginPin: (pin: PinCoords | null) => void;
  setDestinationPin: (pin: PinCoords | null) => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  pinningMode: "origin" | "destination" | null;
  setPinningMode: (mode: "origin" | "destination" | null) => void;
  // Route display
  routeGeometry: [number, number][] | null;
  setRouteGeometry: (geom: [number, number][] | null) => void;
  fitRouteToView: (geometry: [number, number][]) => void;
}

const MapContext = createContext<MapContextType | null>(null);

export function MapProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef<LeafletMap | null>(null);
  const [originPin, setOriginPin] = useState<PinCoords | null>(null);
  const [destinationPin, setDestinationPin] = useState<PinCoords | null>(null);
  const [pinningMode, setPinningMode] = useState<
    "origin" | "destination" | null
  >(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(
    null,
  );

  const flyTo = (lat: number, lng: number, zoom = 16) => {
    mapRef.current?.flyTo([lat, lng], zoom, { animate: true, duration: 1.2 });
  };

  const fitRouteToView = (geometry: [number, number][]) => {
    if (!mapRef.current || !geometry.length) return;

    // Compute bounding box from geometry points
    let minLat = Infinity,
      minLng = Infinity;
    let maxLat = -Infinity,
      maxLng = -Infinity;
    for (const [lat, lng] of geometry) {
      if (lat < minLat) minLat = lat;
      if (lng < minLng) minLng = lng;
      if (lat > maxLat) maxLat = lat;
      if (lng > maxLng) maxLng = lng;
    }

    mapRef.current.fitBounds(
      [
        [minLat, minLng],
        [maxLat, maxLng],
      ],
      { padding: [80, 60], maxZoom: 16, animate: true, duration: 1.0 },
    );
  };

  return (
    <MapContext.Provider
      value={{
        mapRef,
        originPin,
        destinationPin,
        setOriginPin,
        setDestinationPin,
        flyTo,
        pinningMode,
        setPinningMode,
        routeGeometry,
        setRouteGeometry,
        fitRouteToView,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapContext must be used inside MapProvider");
  return ctx;
}
