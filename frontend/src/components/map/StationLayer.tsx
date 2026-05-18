"use client";

import { useEffect, useState } from "react";
import { CircleMarker, Popup } from "react-leaflet";
import { getStations } from "@/services/stationService";
import type { StationListItem } from "@/types/station";
import { useMapContext } from "@/context/MapContext";

interface StationLayerProps {
  visible: boolean;
}

export default function StationLayer({ visible }: StationLayerProps) {
  const [stations, setStations] = useState<StationListItem[]>([]);
  const { routeLegGeometries } = useMapContext();
  const routePoints = routeLegGeometries.flatMap((leg) => leg.points);
  const hasRoute = routePoints.length > 1;

  useEffect(() => {
    let canceled = false;

    if (!visible && !hasRoute) {
      return;
    }

    async function loadStations() {
      try {
        const allStations = await getStations({ is_active: true });
        if (!canceled) {
          setStations(allStations);
        }
      } catch {
        if (!canceled) {
          setStations([]);
        }
      }
    }

    loadStations();

    return () => {
      canceled = true;
    };
  }, [visible, hasRoute]);

  if ((!visible && !hasRoute) || stations.length === 0) {
    return null;
  }

  return (
    <>
      {stations.map((station) => {
        const config = getStationConfig(station.station_type);
        const isNearRoute =
          hasRoute &&
          routePoints.some(([lat, lng]) =>
            distanceKm(lat, lng, station.latitude, station.longitude) <= 0.18,
          );

        if (!visible && !isNearRoute) {
          return null;
        }

        return (
          <CircleMarker
            key={station.station_id}
            center={[station.latitude, station.longitude]}
            radius={isNearRoute ? 8 : 5}
            pathOptions={{
              color: isNearRoute ? "#111827" : config.color,
              fillColor: config.color,
              fillOpacity: isNearRoute ? 1 : 0.82,
              weight: isNearRoute ? 3 : 2,
            }}
          >
            <Popup>
              <div className="text-sm font-semibold">{station.name}</div>
              <div className="text-xs text-slate-500">{config.label}</div>
              {isNearRoute && (
                <div className="mt-1 text-xs font-semibold text-[#CC553D]">
                  Near this route
                </div>
              )}
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

function getStationConfig(type: StationListItem["station_type"]) {
  switch (type) {
    case "JEEPNEY_STOP":
      return { color: "#f59e0b", label: "Jeepney Stop" };
    case "JEEPNEY_TERMINAL":
      return { color: "#CC553D", label: "Jeepney Terminal" };
    case "BUS_TERMINAL":
      return { color: "#7c3aed", label: "Bus Terminal" };
    case "MIXED_TERMINAL":
      return { color: "#0891b2", label: "Tricycle/Jeep Terminal" };
    case "TRICYCLE_TERMINAL":
    default:
      return { color: "#3b82f6", label: "Tricycle Terminal" };
  }
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(value: number) {
  return value * (Math.PI / 180);
}
