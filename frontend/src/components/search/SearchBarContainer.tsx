"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMapContext } from "@/context/MapContext";
import { nominatimSearch } from "@/lib/nominatimSearch";
import { searchStations } from "@/services/stationService";

interface Props {
  activeInputTarget: string | null;
  setActiveInputTarget: (val: string | null) => void;
  onLocationSelect: (selection: {
    source: "station" | "nominatim";
    label: string;
    displayName: string;
    lat: number;
    lng: number;
    stationId?: number;
  }) => void;
  currentValue?: string;
}

type SearchSuggestion = {
  source: "station" | "nominatim";
  display_name: string;
  lat: number;
  lon: number;
  station_id?: number;
};

export default function SearchBarContainer({
  activeInputTarget,
  setActiveInputTarget,
  onLocationSelect,
  currentValue = "",
}: Props) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const { flyTo } = useMapContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<number | null>(null);

  const handleClose = useCallback(() => {
    setActiveInputTarget(null);
    setInputValue("");
    setSuggestions([]);
  }, [setActiveInputTarget]);

  useEffect(() => {
    if (!activeInputTarget) return;
    window.setTimeout(() => setInputValue(currentValue), 0);
    inputRef.current?.focus({ preventScroll: false });
    window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: false }));
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: false }), 80);
  }, [activeInputTarget, currentValue]);

  useEffect(() => {
    const query = inputValue.trim();
    if (query.length < 3) {
      window.setTimeout(() => setSuggestions([]), 0);
      return;
    }

    let canceled = false;
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = window.setTimeout(() => {
      if (canceled) return;
      setLoading(true);
      searchStations(query)
        .then(async (stationResults) => {
          if (canceled) return;
          if (stationResults.length > 0) {
            return stationResults.map((station) => ({
              source: "station" as const,
              display_name: station.name,
              lat: station.latitude,
              lon: station.longitude,
              station_id: station.station_id,
            }));
          }

          const osmResults = await nominatimSearch(query);
          return osmResults.map((result) => ({
            source: "nominatim" as const,
            display_name: result.display_name,
            lat: result.lat,
            lon: result.lon,
          }));
        })
        .then((results) => {
          if (canceled || !results) return;
          setSuggestions(
            results.map((result) => ({
              source: result.source,
              display_name: result.display_name,
              lat: result.lat,
              lon: result.lon,
              station_id: "station_id" in result ? result.station_id : undefined,
            })),
          );
        })
        .catch(() => {
          if (!canceled) setSuggestions([]);
        })
        .finally(() => {
          if (!canceled) setLoading(false);
        });
    }, 350);

    return () => {
      canceled = true;
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, [activeInputTarget, inputValue]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [handleClose]);

  const handleSelect = (item: SearchSuggestion) => {
    onLocationSelect({
      source: item.source,
      label: item.display_name,
      displayName: item.display_name,
      lat: item.lat,
      lng: item.lon,
      stationId: item.station_id,
    });
    flyTo(item.lat, item.lon);
    handleClose();
  };

  const handleSearchTextChange = (value: string) => {
    if (!activeInputTarget) setActiveInputTarget("to");
    setInputValue(value);
  };

  const isVisible = !!activeInputTarget || inputValue.trim().length > 0;

  return (
    <div ref={wrapRef} className="relative">
      <div
        onPointerDown={() => inputRef.current?.focus({ preventScroll: false })}
        onClick={() => inputRef.current?.focus({ preventScroll: false })}
        className={`
          flex items-center bg-white/95 rounded-full px-4 py-3 gap-2
          shadow-lg transition-all duration-200 backdrop-blur-sm
          ${isVisible ? "ring-2 ring-[#CC553D]/45 scale-[1.01]" : ""}
        `}
      >
        <svg
          className="w-4 h-4 text-gray-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          value={inputValue}
          onChange={(event) => handleSearchTextChange(event.target.value)}
          onInput={(event) =>
            handleSearchTextChange(event.currentTarget.value)
          }
          onFocus={() => {
            if (!activeInputTarget) setActiveInputTarget("to");
          }}
          placeholder={
            activeInputTarget === "from"
              ? "Search origin on OpenStreetMap..."
              : "Search destination on OpenStreetMap..."
          }
          className="flex-1 text-sm font-medium text-gray-700 placeholder:text-gray-400 outline-none bg-transparent"
        />

        {loading && (
          <svg
            className="w-4 h-4 text-[#CC553D] animate-spin flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
        )}

        {isVisible && (
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            aria-label="Close search"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {isVisible && suggestions.length > 0 && (
        <div
          className="
          absolute top-full left-0 right-0 mt-1.5 z-50
          bg-white rounded-2xl shadow-xl border border-gray-100
          overflow-hidden
        "
        >
          {suggestions.map((item, index) => (
            <button
              key={`${item.lat}-${item.lon}-${index}`}
              onClick={() => handleSelect(item)}
              className="
                w-full text-left px-4 py-3 flex items-start gap-3
                hover:bg-gray-50 active:bg-gray-100
                border-b border-gray-50 last:border-b-0
                transition-colors duration-100
              "
            >
              <svg
                className="w-4 h-4 text-[#CC553D] flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {item.display_name}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {item.source === "station" ? "TransitPH station" : "OpenStreetMap"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isVisible &&
        !loading &&
        inputValue.length >= 3 &&
        suggestions.length === 0 && (
          <div
            className="
          absolute top-full left-0 right-0 mt-1.5 z-50
          bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-5
          text-center
        "
          >
            <p className="text-sm text-gray-400">
              No OSM locations found for &quot;{inputValue}&quot;
            </p>
          </div>
        )}
    </div>
  );
}
