"use client";
import { useState, useRef, useEffect } from "react";
import { useGeocoding } from "@/hooks/useGeocoding";
import { useMapContext } from "@/context/MapContext";

interface Props {
  activeInputTarget: string | null;
  setActiveInputTarget: (val: string | null) => void;
  onLocationSelect: (label: string, lat: number, lng: number) => void;
  currentValue?: string;
}

export default function SearchBarContainer({
  activeInputTarget,
  setActiveInputTarget,
  onLocationSelect,
  currentValue = "",
}: Props) {
  const [inputValue, setInputValue] = useState("");
  const { results, loading, search, clear } = useGeocoding();
  const { flyTo } = useMapContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // When a field is activated, pre-fill with its current value
  useEffect(() => {
    if (activeInputTarget) {
      setInputValue(currentValue);
      search(currentValue);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [activeInputTarget]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClose = () => {
    setActiveInputTarget(null);
    setInputValue("");
    clear();
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    search(val);
  };

  const handleSelect = (result: {
    displayName: string;
    shortName: string;
    lat: number;
    lng: number;
  }) => {
    onLocationSelect(result.shortName, result.lat, result.lng);
    flyTo(result.lat, result.lng);
    handleClose();
  };

  const isVisible = !!activeInputTarget;

  return (
    <div ref={wrapRef} className="relative">
      {/* Search input — always rendered, visibility toggled */}
      <div
        className={`
          flex items-center bg-white rounded-full px-4 py-2.5 gap-2
          shadow-md transition-all duration-200
          ${isVisible ? "ring-2 ring-[#CC553D]/40" : ""}
        `}
      >
        {/* Search icon */}
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
          value={inputValue}
          onChange={handleInput}
          onFocus={() => {
            if (!activeInputTarget) setActiveInputTarget("to");
          }}
          placeholder={
            activeInputTarget === "from"
              ? "Search current location..."
              : "Search destination..."
          }
          className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent"
        />

        {/* Loading spinner */}
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

        {/* Clear / close button */}
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

      {/* Results dropdown */}
      {isVisible && results.length > 0 && (
        <div
          className="
          absolute top-full left-0 right-0 mt-1.5 z-50
          bg-white rounded-2xl shadow-xl border border-gray-100
          overflow-hidden
        "
        >
          {results.map((result, i) => (
            <button
              key={i}
              onClick={() => handleSelect(result)}
              className="
                w-full text-left px-4 py-3 flex items-start gap-3
                hover:bg-gray-50 active:bg-gray-100
                border-b border-gray-50 last:border-b-0
                transition-colors duration-100
              "
            >
              {/* Location pin icon */}
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
                  {result.shortName}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {result.displayName}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results state */}
      {isVisible &&
        !loading &&
        inputValue.length >= 3 &&
        results.length === 0 && (
          <div
            className="
          absolute top-full left-0 right-0 mt-1.5 z-50
          bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-5
          text-center
        "
          >
            <p className="text-sm text-gray-400">
              No locations found for "{inputValue}"
            </p>
          </div>
        )}
    </div>
  );
}
