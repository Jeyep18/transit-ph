"use client";
import { useRef } from "react";
import { formatDistance, formatDuration } from "@/lib/fareComputation";

export interface Route {
  type: string;
  route: string;
  distanceKm: number;
  durationMin: number;
  fare: string;
  isEstimated: boolean;
}

interface Props {
  slideCardOpen: boolean;
  setSlideCardOpen: (val: boolean) => void;
  suggestedRoutes: Route[];
}

export default function BottomSheet({
  slideCardOpen,
  setSlideCardOpen,
  suggestedRoutes,
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

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`
        fixed bottom-0 left-0 right-0 z-30
        max-w-md mx-auto
        bg-[#1B3A6B] rounded-t-2xl shadow-2xl
        flex flex-col
        transition-transform duration-500 ease-in-out
        ${slideCardOpen ? "translate-y-0" : "translate-y-full"}
      `}
      style={{ height: "50dvh" }}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1 flex-none">
        <div className="w-10 h-1 rounded-full bg-white/30" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 flex-none border-b border-white/10">
        <div>
          <h2 className="text-white font-bold text-sm tracking-widest uppercase">
            Suggested Routes
          </h2>
          <p className="text-white/50 text-xs mt-0.5">
            {suggestedRoutes.length} option
            {suggestedRoutes.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <button
          onClick={() => setSlideCardOpen(false)}
          className="text-white/50 hover:text-white text-lg font-bold leading-none p-1"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Route list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {suggestedRoutes.length === 0 ? (
          <p className="text-white/50 text-sm text-center py-8">
            No routes found.
          </p>
        ) : (
          suggestedRoutes.map((route, i) => <RouteCard key={i} route={route} />)
        )}
      </div>
    </div>
  );
}

function RouteCard({ route }: { route: Route }) {
  const typeColor =
    route.type === "Jeepney"
      ? "#CC553D"
      : route.type === "Tricycle"
        ? "#2E8B57"
        : "#2E6DB4";

  return (
    <div className="bg-white rounded-xl p-4 flex items-start gap-3 flex-shrink-0 shadow-sm">
      {/* Type badge column */}
      <div
        className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: `${typeColor}18` }}
      >
        <span className="text-lg">
          {route.type === "Jeepney"
            ? "🚌"
            : route.type === "Tricycle"
              ? "🛺"
              : "⚡"}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className="font-bold text-sm truncate"
            style={{ color: typeColor }}
          >
            {route.type}
          </p>
          <span className="text-xs font-bold text-gray-800 flex-shrink-0">
            {route.fare}
          </span>
        </div>

        <p className="text-gray-500 text-xs mt-0.5 truncate">{route.route}</p>

        {/* Distance + duration row */}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            📍 {formatDistance(route.distanceKm)}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            🕐 {formatDuration(route.durationMin)}
          </span>
          {route.isEstimated && (
            <span className="text-xs text-amber-500 font-medium">~est.</span>
          )}
        </div>

        <button
          className="mt-2.5 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1"
          style={{ backgroundColor: typeColor }}
        >
          🗺 Show Route
        </button>
      </div>
    </div>
  );
}
