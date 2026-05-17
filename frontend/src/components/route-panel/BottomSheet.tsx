"use client";

import { useRef, useState } from "react";
import {
  formatDistance,
  formatDuration,
  formatFare,
} from "@/lib/fareComputation";
import type { RouteResult } from "@/types/search";
import TransportSelector from "@/components/route-panel/TransportSelector";

interface Props {
  slideCardOpen: boolean;
  setSlideCardOpen: (val: boolean) => void;
  suggestedRoutes: RouteResult[];
  selectedTransports: string[];
  toggleTransport: (transport: string) => void;
  selectedRouteIndex: number | null;
  loading?: boolean;
  onShowRoute?: (route: RouteResult, index: number) => void;
}

export default function BottomSheet({
  slideCardOpen,
  setSlideCardOpen,
  suggestedRoutes,
  selectedTransports,
  toggleTransport,
  selectedRouteIndex,
  loading = false,
  onShowRoute,
}: Props) {
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches[0].clientY - touchStartY.current > 60) {
      setSlideCardOpen(false);
    }
  };

  const filteredRoutes = suggestedRoutes.filter((route) => {
    if (selectedTransports.length === 0) return false;
    return route.legs.some((leg) => {
      if (leg.mode === "JEEPNEY") return selectedTransports.includes("Jeepney");
      if (leg.mode === "TRICYCLE") return selectedTransports.includes("Tricycle");
      if (leg.transport_mode_name?.toLowerCase().includes("e-jeep")) {
        return selectedTransports.includes("E-Jeep");
      }
      return false;
    });
  });

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`
        fixed bottom-0 left-0 right-0 z-30
        max-w-md mx-auto
        bg-[#1B3A6B] rounded-t-[1.75rem] shadow-2xl
        flex flex-col
        transition-transform duration-500 ease-in-out
        ${slideCardOpen ? "translate-y-0" : "translate-y-full"}
      `}
      style={{ height: "60dvh" }}
    >
      <div className="flex justify-center pt-3 pb-1 flex-none">
        <div className="w-10 h-1 rounded-full bg-white/30" />
      </div>

      <div className="flex items-center justify-between px-5 py-3 flex-none border-b border-white/10">
        <div>
          <h2 className="text-white font-bold text-sm tracking-widest uppercase">
            Suggested Routes
          </h2>
          <p className="text-white/50 text-xs mt-0.5">
            {loading
              ? "Finding route options..."
              : `${filteredRoutes.length} of ${suggestedRoutes.length} option${
                  suggestedRoutes.length !== 1 ? "s" : ""
                } shown`}
          </p>
        </div>
        <button
          onClick={() => setSlideCardOpen(false)}
          className="text-white/50 hover:text-white text-lg font-bold leading-none p-1 transition-colors"
          aria-label="Close"
        >
          x
        </button>
      </div>

      <div className="flex-none border-b border-white/10 px-4 py-3">
        <TransportSelector
          selectedTransports={selectedTransports}
          toggleTransport={toggleTransport}
        />
        {selectedTransports.includes("E-Jeep") && (
          <p className="mt-2 text-[11px] font-medium text-white/55">
            E-Jeep routes are not active in the current dataset yet.
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {loading ? (
          <RouteSkeleton />
        ) : suggestedRoutes.length === 0 ? (
          <p className="text-white/50 text-sm text-center py-8">
            No routes found.
          </p>
        ) : filteredRoutes.length === 0 ? (
          <p className="text-white/50 text-sm text-center py-8">
            No routes match the selected transport filters.
          </p>
        ) : (
          filteredRoutes.map((route) => {
            const originalIndex = suggestedRoutes.indexOf(route);
            return (
              <RouteCard
                key={originalIndex}
                route={route}
                optionNumber={originalIndex + 1}
                selected={selectedRouteIndex === originalIndex}
                onShowRoute={onShowRoute}
                routeIndex={originalIndex}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function RouteSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-xl bg-stone-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-stone-200" />
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-stone-100" />
              <div className="h-3 w-3/4 animate-pulse rounded-full bg-stone-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RouteCard({
  route,
  optionNumber,
  selected,
  routeIndex,
  onShowRoute,
}: {
  route: RouteResult;
  optionNumber: number;
  selected: boolean;
  routeIndex: number;
  onShowRoute?: (route: RouteResult, index: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const firstLeg = route.legs[0];
  if (!firstLeg) return null;

  const firstLegMode = getLegTransportName(firstLeg);

  const firstOrigin =
    firstLeg.from_node?.name ||
    firstLeg.origin_station_name ||
    "Origin";
  const finalDestination =
    route.legs[route.legs.length - 1].to_node?.name ||
    route.legs[route.legs.length - 1].destination_station_name ||
    "Destination";

  const typeColor =
    firstLegMode === "Jeepney"
      ? "#CC553D"
      : firstLegMode === "Tricycle" || firstLegMode === "Walk"
        ? "#2E8B57"
        : "#2E6DB4";

  const routeTitle = getRouteTitle(route);
  const routeLabel = `${firstOrigin} to ${finalDestination}`;
  const badges = getRouteBadges(route, optionNumber);

  return (
    <div
      className={`animate-slideUpFade bg-white rounded-xl p-4 flex items-start gap-3 flex-shrink-0 shadow-sm transition-all ${
        selected ? "ring-2 ring-[#CC553D] shadow-lg scale-[1.01]" : ""
      }`}
    >
      <div
        className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black"
        style={{ backgroundColor: `${typeColor}18` }}
      >
        <span style={{ color: typeColor }}>{optionNumber}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className="font-bold text-sm truncate"
            style={{ color: typeColor }}
          >
            {routeTitle}
          </p>
          <span className="text-xs font-bold text-gray-800 flex-shrink-0">
            {route.total_fare !== null
              ? formatFare(route.total_fare)
              : "Fare N/A"}
          </span>
        </div>

        <p className="text-gray-500 text-xs mt-0.5 truncate">{routeLabel}</p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-stone-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-600"
            >
              {badge}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-1.5">
          <span className="text-xs text-gray-500">
            {formatDistance(route.total_distance_km)}
          </span>
          {route.total_duration_min !== null && (
            <span className="text-xs text-gray-500">
              {formatDuration(route.total_duration_min)}
            </span>
          )}
          <span className="text-xs text-gray-500">
            {route.transfer_count} transfer
            {route.transfer_count !== 1 ? "s" : ""}
          </span>
          {route.is_estimated && (
            <span className="text-xs text-amber-500 font-medium">
              estimated
            </span>
          )}
        </div>

        {expanded && (
          <div className="mt-3 space-y-2">
            {route.legs.map((leg, index) => (
              <div
                key={`${leg.route_id}-${index}`}
                className="rounded-lg bg-stone-50 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-stone-700 truncate">
                    {leg.mode === "JEEPNEY"
                      ? leg.loop_name || leg.route_name || "Jeepney Loop"
                      : leg.mode === "WALKING"
                        ? "Walking leg"
                        : "Tricycle leg"}
                  </p>
                  <span className="text-xs font-semibold text-stone-600">
                    {leg.mode === "WALKING"
                      ? "Free"
                      : leg.fare !== null
                        ? formatFare(leg.fare)
                        : "Advisory"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-stone-500">
                  {leg.instruction ||
                    `Travel from ${leg.origin_station_name} to ${leg.destination_station_name}`}
                </p>
                <p className="mt-1 text-[11px] text-stone-400">
                  {leg.stops?.length ? `${leg.stops.length} stops, ` : ""}
                  {formatDistance(leg.distance_km)}
                  {leg.estimated_duration_min !== null
                    ? `, ${formatDuration(leg.estimated_duration_min)}`
                    : ""}
                  {leg.is_estimated ? " estimated" : ""}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            onClick={() => onShowRoute?.(route, routeIndex)}
            className="text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-transform active:scale-95"
            style={{ backgroundColor: typeColor }}
          >
            {selected ? "Selected Route" : "Show Route"}
          </button>
          <button
            onClick={() => setExpanded((value) => !value)}
            className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-200"
          >
            {expanded ? "Hide Breakdown" : "Show Breakdown"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getLegTransportName(leg: RouteResult["legs"][number]) {
  if (leg.mode === "JEEPNEY") return "Jeepney";
  if (leg.mode === "TRICYCLE") return "Tricycle";
  if (leg.mode === "WALKING") return "Walk";
  return leg.transport_mode_name || "Route";
}

function getRouteTitle(route: RouteResult) {
  const names = route.legs.map((leg) => {
    if (leg.mode === "JEEPNEY") {
      return `Jeepney: ${leg.loop_name || leg.route_name || "Loop"}`;
    }
    return getLegTransportName(leg);
  });

  const compact = names.filter((name, index) => name !== names[index - 1]);
  return compact.join(" -> ");
}

function getRouteBadges(route: RouteResult, optionNumber: number) {
  const badges = [];
  if (optionNumber === 1) badges.push("Cheapest");
  const jeepneyLegs = route.legs.filter((leg) => leg.mode === "JEEPNEY");
  const tricycleDistance = route.legs
    .filter((leg) => leg.mode === "TRICYCLE")
    .reduce((sum, leg) => sum + leg.distance_km, 0);
  if (jeepneyLegs.length >= 2) badges.push("Most Jeepney");
  if (tricycleDistance <= 1) badges.push("Least Tricycle");
  if ((route.total_duration_min ?? Infinity) <= 30) badges.push("Fast");
  return badges.slice(0, 3);
}
