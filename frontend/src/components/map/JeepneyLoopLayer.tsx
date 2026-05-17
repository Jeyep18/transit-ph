"use client";

import { Fragment, useEffect, useState } from "react";
import { CircleMarker, Polyline, Popup, Tooltip } from "react-leaflet";
import { getActiveJeepneyLoops } from "@/services/searchService";
import type { GraphPoint, JeepneyLoopPolyline } from "@/types/search";

interface JeepneyLoopLayerProps {
  visible: boolean;
}

export default function JeepneyLoopLayer({ visible }: JeepneyLoopLayerProps) {
  const [loops, setLoops] = useState<JeepneyLoopPolyline[]>([]);

  useEffect(() => {
    if (!visible) return;
    let canceled = false;
    getActiveJeepneyLoops()
      .then((data) => {
        if (!canceled) setLoops(data);
      })
      .catch(() => {
        if (!canceled) setLoops([]);
      });
    return () => {
      canceled = true;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      {loops.map((loop) => {
        const points = loop.geometry.map(
          (point) => [point.latitude, point.longitude] as [number, number],
        );
        const nodeMarkers = uniqueLoopNodes(loop.nodes ?? loop.geometry);
        if (points.length < 2) return null;
        return (
          <Fragment key={loop.loop_id}>
            <Polyline
              positions={points}
              color="#CC553D"
              weight={4}
              opacity={0.45}
              dashArray="6 8"
            >
              <Popup>
                <div className="text-sm font-semibold">{loop.name}</div>
                <div className="text-xs text-slate-500">{loop.code}</div>
              </Popup>
            </Polyline>

            {nodeMarkers.map((node, index) => (
              <CircleMarker
                key={`${loop.loop_id}-${node.node_id ?? `${node.latitude}-${node.longitude}`}-${index}`}
                center={[node.latitude, node.longitude]}
                radius={5}
                pathOptions={{
                  color: "#FFFFFF",
                  weight: 2,
                  fillColor: "#0EA5E9",
                  fillOpacity: 0.95,
                }}
              >
                <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                  <span>{node.name || `Loop node ${index + 1}`}</span>
                </Tooltip>
                <Popup>
                  <div className="text-sm font-semibold">
                    {node.name || `Loop node ${index + 1}`}
                  </div>
                  <div className="text-xs text-slate-500">{loop.name}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {node.latitude.toFixed(6)}, {node.longitude.toFixed(6)}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </Fragment>
        );
      })}
    </>
  );
}

function uniqueLoopNodes(points: GraphPoint[]) {
  const seen = new Set<string>();
  return points.filter((point) => {
    const key =
      point.node_id !== null
        ? `id-${point.node_id}`
        : `${point.latitude.toFixed(6)}-${point.longitude.toFixed(6)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
