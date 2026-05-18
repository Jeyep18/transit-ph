"use client";
import { useState } from "react";
import { MapProvider, useMapContext } from "@/context/MapContext";
import { useRouteSearch } from "@/hooks/useRouteSearch";
import type { RouteResult } from "@/types/search";
import MapContainer from "@/components/map/MapContainer";
import SearchBarContainer from "@/components/search/SearchBarContainer";
import MapOverlayButtons from "@/components/map/PinButtonsBar/PinCircleBar";
import RouteInformationForm from "@/components/route-panel/RouteInformationForm";
import SearchRoutesButton from "@/components/route-panel/SearchRoutesButton";
import BottomSheet from "@/components/route-panel/BottomSheet";
import StationsRouteToggle from "@/components/map/StationsRouteToggle";

function HomeContent() {
  const legColors = ["#CC553D", "#1B3A6B", "#2E8B57", "#8B5CF6"];
  const [activeInputTarget, setActiveInputTarget] = useState<string | null>(
    null,
  );
  const [hasStarted, setHasStarted] = useState(false);
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [selectedTransports, setSelectedTransports] = useState([
    "Jeepney",
    "Tricycle",
    "E-Jeep",
  ]);
  const [slideCardOpen, setSlideCardOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(
    null,
  );
  const {
    results: routeResults,
    loading: routeLoading,
    error: routeError,
    search,
    reset: resetRoutes,
  } = useRouteSearch();
  const [activeFilter, setActiveFilter] = useState<"stations" | "routes" | null>(null);

  const {
    originPin,
    destinationPin,
    setOriginPin,
    setDestinationPin,
    setRouteGeometry,
    setRouteLegGeometries,
    fitRouteToView,
    flyTo,
    pinningMode,
  } = useMapContext();

  const displayRouteOnMap = (route: RouteResult, index: number) => {
    const legGeometries = route.legs
      .map((leg, index) => ({
        id: `${leg.route_id}-${index}`,
        color:
          leg.mode === "TRICYCLE" || leg.mode === "WALKING"
            ? "#2E8B57"
            : legColors[index % legColors.length],
        mode: leg.mode,
        label: getLegMapLabel(leg),
        durationMin: leg.estimated_duration_min,
        points: (leg.geometry ?? leg.stops ?? []).map((point) => [
          point.latitude,
          point.longitude,
        ] as [number, number]),
      }))
      .filter((leg) => leg.points.length > 1);

    const allPoints = legGeometries.flatMap((leg) => leg.points);
    setRouteLegGeometries(legGeometries);
    setRouteGeometry(allPoints.length > 1 ? allPoints : null);
    if (allPoints.length > 1) {
      fitRouteToView(allPoints);
    }
    setSelectedRouteIndex(index);
  };

  const handleLocationSelect = (
    selection: {
      source: "station" | "nominatim";
      label: string;
      displayName: string;
      lat: number;
      lng: number;
      stationId?: number;
    },
  ) => {
    if (activeInputTarget === "from") {
      setFromValue(selection.label);
      setOriginPin({
        lat: selection.lat,
        lng: selection.lng,
        label: selection.label,
        stationId: selection.stationId,
      });
      flyTo(selection.lat, selection.lng);
    } else {
      setToValue(selection.label);
      setDestinationPin({
        lat: selection.lat,
        lng: selection.lng,
        label: selection.label,
        stationId: selection.stationId,
      });
      flyTo(selection.lat, selection.lng);
    }
    setActiveInputTarget(null);
  };

  const showStations = activeFilter === "stations";
  const showLoops = activeFilter === "routes";
  const canSearch =
    !!originPin &&
    !!destinationPin &&
    selectedTransports.length > 0;
  const displayedFromValue = originPin?.label ?? fromValue;
  const displayedToValue = destinationPin?.label ?? toValue;

  const handleSearch = async () => {
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

    setRouteGeometry(null);
    setRouteLegGeometries([]);
    setSelectedRouteIndex(null);
    setHasSearched(true);
    setSlideCardOpen(true);

    const results =
      originPin.stationId && destinationPin.stationId
        ? await search({
            origin_station_id: originPin.stationId,
            destination_station_id: destinationPin.stationId,
            sort_by: "fare",
          })
        : await search({
            origin_lat: originPin.lat,
            origin_lng: originPin.lng,
            dest_lat: destinationPin.lat,
            dest_lng: destinationPin.lng,
            sort_by: "fare",
          });

    if (results[0]) {
      displayRouteOnMap(results[0], 0);
    } else {
      setSelectedRouteIndex(null);
    }

  };

  const clearTrip = () => {
    setOriginPin(null);
    setDestinationPin(null);
    setFromValue("");
    setToValue("");
    setRouteGeometry(null);
    setRouteLegGeometries([]);
    setSelectedRouteIndex(null);
    setHasSearched(false);
    setSlideCardOpen(false);
    resetRoutes();
  };

  const toggleTransport = (transport: string) => {
    setSelectedTransports((prev) =>
      prev.includes(transport)
        ? prev.filter((item) => item !== transport)
        : [...prev, transport],
    );
  };

  if (!hasStarted) {
    return (
      <main className="flex h-dvh w-screen items-center justify-center bg-[#0F3D35] px-6 text-center">
        <div className="animate-slideUpFade w-full max-w-sm">
          <h1 className="transit-title text-[44px] leading-none">
            TRANSIT PH
          </h1>
          <p className="mt-2 text-sm font-bold text-white/85">
            Search or pin your trip across Naga jeepney routes.
          </p>
          <button
            type="button"
            onClick={() => setHasStarted(true)}
            onPointerUp={() => setHasStarted(true)}
            className="animate-softPulse mt-8 w-full rounded-2xl bg-[#CC553D] px-5 py-4 text-sm font-extrabold text-white shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#D75F47] active:scale-[0.98]"
          >
            Start Commuting
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="h-dvh w-screen overflow-hidden relative bg-[#d4e8c2]">
      <MapContainer showLoops={showLoops} showStations={showStations} />

      <div className="absolute inset-0 z-10 flex flex-col max-w-md mx-auto pointer-events-none">
        {/* TOP */}
        <div className="flex-none px-4 pt-5 pb-2 pointer-events-auto">
          <div className="flex flex-col mt-1">
            <SearchBarContainer
              activeInputTarget={activeInputTarget}
              setActiveInputTarget={setActiveInputTarget}
              onLocationSelect={handleLocationSelect}
              currentValue={
                activeInputTarget === "from"
                  ? displayedFromValue
                  : displayedToValue
              }
            />

            <div className="flex justify-end mt-3">
              <StationsRouteToggle
                activeFilter={activeFilter}
                onToggle={(filter) =>
                  setActiveFilter((prev) => (prev === filter ? null : filter))
                }
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
                {routeError}
              </div>
            </div>
          )}

          {pinningMode && (
            <div className="absolute top-3 left-4 right-4 pointer-events-none">
              <div className="mx-auto w-fit max-w-full rounded-full bg-[#003F48] px-4 py-2 text-center text-xs font-bold text-white shadow-lg">
                Tap the map to set your{" "}
                {pinningMode === "origin" ? "origin" : "destination"} pin
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM */}
        <div className="flex-none px-4 pb-3 flex flex-col gap-3 pointer-events-auto">
          <RouteInformationForm
            fromValue={displayedFromValue}
            toValue={displayedToValue}
            activeTarget={
              activeInputTarget === "from" || activeInputTarget === "to"
                ? activeInputTarget
                : null
            }
            activateLocationInput={(t) => setActiveInputTarget(t)}
          />

          {/* Loading state on the button */}
          <SearchRoutesButton
            onClick={handleSearch}
            loading={routeLoading}
            disabled={!canSearch}
            disabledLabel="Select origin and destination"
          />

          {hasSearched && (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button
                onClick={() => setSlideCardOpen((p) => !p)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B3A6B] py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1B3A6B]/20 transition hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <span>{slideCardOpen ? "v" : "^"}</span>
                {slideCardOpen ? "Hide Routes" : "Show Suggested Routes"}
              </button>
              <button
                onClick={clearTrip}
                className="rounded-xl bg-white/95 px-4 py-2.5 text-sm font-extrabold text-[#003F48] shadow-lg transition hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomSheet
        slideCardOpen={slideCardOpen}
        setSlideCardOpen={setSlideCardOpen}
        suggestedRoutes={routeResults}
        loading={routeLoading}
        selectedTransports={selectedTransports}
        toggleTransport={toggleTransport}
        selectedRouteIndex={selectedRouteIndex}
        onShowRoute={displayRouteOnMap}
      />
    </div>
  );
}

function getLegMapLabel(leg: RouteResult["legs"][number]) {
  if (leg.mode === "JEEPNEY") {
    return leg.loop_name || leg.route_name || "Jeepney";
  }
  if (leg.mode === "WALKING") {
    return "Walk";
  }
  if (leg.mode === "TRICYCLE") {
    return "Tricycle";
  }
  return leg.transport_mode_name || "Route";
}

export default function Home() {
  return (
    <MapProvider>
      <HomeContent />
    </MapProvider>
  );
}
