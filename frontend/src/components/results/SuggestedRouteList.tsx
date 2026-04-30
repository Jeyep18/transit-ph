"use client";

import RouteSuggestionCard from "./RouteSuggestionCard";

interface Route {
  type: string;
  route: string;
  distance: string;
  fare: string;
}

interface SuggestedRouteListProps {
  routes: Route[];
}

export default function SuggestedRouteList({ routes }: SuggestedRouteListProps) {
  if (routes.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-stone-400 font-bold italic text-sm">
          No routes available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[50vh] overflow-y-auto px-1 scrollbar-hide">
      {routes.map((r, idx) => (
        <RouteSuggestionCard
          key={idx}
          type={r.type}
          route={r.route}
          distance={r.distance}
          fare={r.fare}
          animationDelay={idx * 0.15}
        />
      ))}
    </div>
  );
}
