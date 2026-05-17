"use client";

import { useEffect, useState } from "react";
import { CircleMarker, Popup } from "react-leaflet";
import { getStations } from "@/services/stationService";
import type { StationListItem } from "@/types/station";

interface StationLayerProps {
  visible: boolean;
}

export default function StationLayer({ visible }: StationLayerProps) {
  const [stations, setStations] = useState<StationListItem[]>([]);

  useEffect(() => {
    let canceled = false;

    if (!visible) {
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
  }, [visible]);

  if (!visible || stations.length === 0) {
    return null;
  }

  return (
    <>
      {stations.map((station) => {
        const color =
          station.station_type === "JEEPNEY_STOP" ? "#f59e0b" : "#3b82f6";
        const label =
          station.station_type === "JEEPNEY_STOP"
            ? "Jeepney Stop"
            : "Tricycle Terminal";

        return (
          <CircleMarker
            key={station.station_id}
            center={[station.latitude, station.longitude]}
            radius={5}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.8 }}
          >
            <Popup>
              <div className="text-sm font-semibold">{station.name}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
