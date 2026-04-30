"use client";
import { useState } from "react";
import { MapProvider, useMapContext } from "@/context/MapContext";
import { useRouting } from "@/hooks/useRouting";
import {
  computeJeepneyFare,
  computeTricycleFare,
  formatFare,
} from "@/lib/fareComputation";
import { Route } from "@/components/route-panel/BottomSheet";
import MapContainer from "@/components/map/MapContainer";
import Header from "@/components/Header";
import SearchBarContainer from "@/components/search/SearchBarContainer";
import MapOverlayButtons from "@/components/map/PinButtonsBar/PinCircleBar";
import RouteInformationForm from "@/components/route-panel/RouteInformationForm";
import TransportSelector from "@/components/route-panel/TransportSelector";
import SearchRoutesButton from "@/components/route-panel/SearchRoutesButton";
import BottomSheet from "@/components/route-panel/BottomSheet";
import StationsRouteToggle from "@/components/map/StationsRouteToggle";

function HomeContent() {
  const [activeInputTarget, setActiveInputTarget] = useState<string | null>(
    null,
  );
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [selectedTransports, setSelectedTransports] = useState(["Jeepney"]);
  const [slideCardOpen, setSlideCardOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestedRoutes, setSuggestedRoutes] = useState<Route[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    "stations" | "routes" | null
  >(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const {
    originPin,
    destinationPin,
    setOriginPin,
    setDestinationPin,
    setRouteGeometry,
    fitRouteToView,
    flyTo,
  } = useMapContext();

  const { loading: routeLoading, getRoute } = useRouting();

  const handleLocationSelect = (label: string, lat: number, lng: number) => {
    if (activeInputTarget === "from") {
      setFromValue(label);
      setOriginPin({ lat, lng, label });
      flyTo(lat, lng);
    } else {
      setToValue(label);
      setDestinationPin({ lat, lng, label });
      flyTo(lat, lng);
    }
    setActiveInputTarget(null);
  };

  const searchRoutes = async () => {
    // Guard: both text labels must be set
    if (!fromValue || !toValue) {
      alert("Please select both a starting point and a destination.");
      return;
    }
    // Guard: both pins must have coordinates
    if (!originPin || !destinationPin) {
      alert(
        "Could not find coordinates for your locations. Please re-select them.",
      );
      return;
    }
    if (selectedTransports.length === 0) {
      alert("Please select at least one transport type.");
      return;
    }

    setRouteError(null);

    const routeData = await getRoute(
      { lat: originPin.lat, lng: originPin.lng },
      { lat: destinationPin.lat, lng: destinationPin.lng },
    );

    if (!routeData) {
      setRouteError("No road route found between these locations.");
      return;
    }

    const { distanceKm, durationMin, geometry } = routeData;

    // Draw the route
    setRouteGeometry(geometry);
    fitRouteToView(geometry);

    const allRoutes: Route[] = [
      {
        type: "Jeepney",
        route: `${fromValue} → ${toValue}`,
        distanceKm,
        durationMin,
        fare: formatFare(computeJeepneyFare(distanceKm)),
        isEstimated: false,
      },
      {
        type: "Tricycle",
        route: `${toValue}`,
        distanceKm: Math.min(distanceKm, 5), // tricycles are short-distance
        durationMin: Math.ceil(durationMin * 0.8),
        fare: formatFare(computeTricycleFare(Math.min(distanceKm, 5))),
        isEstimated: true,
      },
    ];

    const filtered = allRoutes.filter((r) =>
      selectedTransports.some((t) => r.type.includes(t)),
    );

    setSuggestedRoutes(filtered);
    setHasSearched(true);
    setSlideCardOpen(true);
  };

  return (
    <div className="h-dvh w-screen overflow-hidden relative bg-[#d4e8c2]">
      <MapContainer />

      <div className="absolute inset-0 z-10 flex flex-col max-w-md mx-auto pointer-events-none">
        {/* TOP */}
        <Header />
        <div className="flex-none px-4 pt-3 pb-2 pointer-events-auto">
          <div className="flex flex-col mt-1">
            <SearchBarContainer
              activeInputTarget={activeInputTarget}
              setActiveInputTarget={setActiveInputTarget}
              onLocationSelect={handleLocationSelect}
              currentValue={activeInputTarget === "from" ? fromValue : toValue}
            />

            <div className="flex justify-end mt-3">
              <StationsRouteToggle
                activeFilter={activeFilter}
                onToggle={setActiveFilter}
              />
            </div>
          </div>
        </div>

        {/* MIDDLE — map pannable */}
        <div className="flex-1 relative pointer-events-none">
          <div className="absolute bottom-3 right-4 pointer-events-auto">
            <MapOverlayButtons />
          </div>

          {/* Route error toast */}
          {routeError && (
            <div className="absolute top-3 left-4 right-4 pointer-events-auto">
              <div className="bg-red-500 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg">
                ⚠️ {routeError}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM */}
        <div className="flex-none px-4 pb-3 flex flex-col gap-3 pointer-events-auto">
          <RouteInformationForm
            fromValue={fromValue}
            toValue={toValue}
            activateLocationInput={(t) => setActiveInputTarget(t)}
          />
          <TransportSelector
            selectedTransports={selectedTransports}
            toggleTransport={(t) =>
              setSelectedTransports((prev) =>
                prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
              )
            }
          />

          {/* Loading state on the button */}
          <SearchRoutesButton onClick={searchRoutes} loading={routeLoading} />

          {hasSearched && (
            <button
              onClick={() => setSlideCardOpen((p) => !p)}
              className="w-full py-2 rounded-xl text-sm font-semibold bg-[#1B3A6B] text-white flex items-center justify-center gap-2"
            >
              <span>{slideCardOpen ? "▼" : "▲"}</span>
              {slideCardOpen ? "Hide Routes" : "Show Suggested Routes"}
            </button>
          )}
        </div>
      </div>

      <BottomSheet
        slideCardOpen={slideCardOpen}
        setSlideCardOpen={setSlideCardOpen}
        suggestedRoutes={suggestedRoutes}
      />
    </div>
  );
}

export default function Home() {
  return (
    <MapProvider>
      <HomeContent />
    </MapProvider>
  );
}
