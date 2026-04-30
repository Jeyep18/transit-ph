"use client";
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMapContext } from "@/context/MapContext";

const DEFAULT_CENTER: [number, number] = [13.6218, 123.1948];
const DEFAULT_ZOOM = 14;

function MapRefSetter() {
  const map = useMap();
  const { mapRef } = useMapContext();
  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);
  return null;
}

function MapClickHandler() {
  const { pinningMode, setOriginPin, setDestinationPin, setPinningMode } =
    useMapContext();
  useMapEvents({
    click(e) {
      if (!pinningMode) return;
      const { lat, lng } = e.latlng;
      const label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      if (pinningMode === "origin") setOriginPin({ lat, lng, label });
      else setDestinationPin({ lat, lng, label });
      setPinningMode(null);
    },
  });
  return null;
}

function CursorController() {
  const map = useMap();
  const { pinningMode } = useMapContext();
  useEffect(() => {
    map.getContainer().style.cursor = pinningMode ? "crosshair" : "";
  }, [map, pinningMode]);
  return null;
}

export default function MapView() {
  const { originPin, destinationPin, routeGeometry } = useMapContext();

  const originIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;background:#CC553D;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(0,0,0,0.4)"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
        popupAnchor: [0, -24],
      }),
    [],
  );

  const destIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;background:#1B3A6B;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(0,0,0,0.4)"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
        popupAnchor: [0, -24],
      }),
    [],
  );

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      <MapRefSetter />
      <MapClickHandler />
      <CursorController />

      {/* Route polyline — white border underneath, colored line on top */}
      {routeGeometry && routeGeometry.length > 0 && (
        <>
          {/* White border stroke — drawn first, slightly thicker */}
          <Polyline
            positions={routeGeometry}
            color="white"
            weight={9}
            opacity={0.9}
          />
          {/* Colored route line on top */}
          <Polyline
            positions={routeGeometry}
            color="#CC553D"
            weight={5}
            opacity={0.95}
          />
        </>
      )}

      {originPin && (
        <Marker position={[originPin.lat, originPin.lng]} icon={originIcon}>
          <Popup>
            <span className="text-xs font-semibold text-[#CC553D]">From</span>
            <br />
            <span className="text-xs">{originPin.label}</span>
          </Popup>
        </Marker>
      )}

      {destinationPin && (
        <Marker
          position={[destinationPin.lat, destinationPin.lng]}
          icon={destIcon}
        >
          <Popup>
            <span className="text-xs font-semibold text-[#1B3A6B]">To</span>
            <br />
            <span className="text-xs">{destinationPin.label}</span>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
