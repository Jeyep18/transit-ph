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
import JeepneyLoopLayer from "@/components/map/JeepneyLoopLayer";
import StationLayer from "@/components/map/StationLayer";

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

function midpoint(points: [number, number][]) {
  return points[Math.floor(points.length / 2)];
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function legBadgeIcon(label: string, durationMin?: number | null) {
  const duration = durationMin ? `${Math.round(durationMin)} min` : "";
  const safeLabel = escapeHtml(label);
  const html = `
    <div style="
      transform: translate(-50%, -115%);
      background: rgba(255,255,255,0.96);
      border: 1px solid rgba(0,63,72,0.16);
      border-radius: 999px;
      box-shadow: 0 8px 18px rgba(0,0,0,0.18);
      color: #003F48;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 800;
      line-height: 1;
      padding: 7px 10px;
      white-space: nowrap;
    ">
      <span>${safeLabel}</span>
      ${duration ? `<span style="color:#CC553D">${duration}</span>` : ""}
    </div>
  `;

  return L.divIcon({
    className: "",
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

interface MapViewProps {
  showLoops: boolean;
  showStations: boolean;
}

export default function MapView({ showLoops, showStations }: MapViewProps) {
  const {
    originPin,
    destinationPin,
    routeGeometry,
    routeLegGeometries,
  } = useMapContext();

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

      {routeLegGeometries.length > 0 ? (
        <>
          {routeLegGeometries.map((leg) => (
            <Polyline
              key={`${leg.id}-border`}
              positions={leg.points}
              color="white"
              weight={9}
              opacity={0.9}
            />
          ))}
          {routeLegGeometries.map((leg) => (
            <Polyline
              key={leg.id}
              positions={leg.points}
              color={leg.color}
              weight={5}
              opacity={0.95}
            />
          ))}
          {routeLegGeometries
            .filter((leg) => leg.points.length > 1 && leg.label)
            .map((leg) => (
              <Marker
                key={`${leg.id}-label`}
                position={midpoint(leg.points)}
                icon={legBadgeIcon(leg.label || "Route", leg.durationMin)}
                interactive={false}
              />
            ))}
        </>
      ) : routeGeometry && routeGeometry.length > 0 ? (
        <>
          <Polyline
            positions={routeGeometry}
            color="white"
            weight={9}
            opacity={0.9}
          />
          <Polyline
            positions={routeGeometry}
            color="#CC553D"
            weight={5}
            opacity={0.95}
          />
        </>
      ) : null}

      {originPin && (
        <Marker position={[originPin.lat, originPin.lng]} icon={originIcon}>
          <Popup>
            <span className="text-xs font-semibold text-[#CC553D]">From</span>
            <br />
            <span className="text-xs">{originPin.label}</span>
          </Popup>
        </Marker>
      )}

      <StationLayer visible={showStations} />
      <JeepneyLoopLayer visible={showLoops} />

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
