"use client";
import { useState } from "react";
import { useMapContext } from "@/context/MapContext";

interface Props {
  onLocationFound?: (label: string, lat: number, lng: number) => void;
}

function PinCurrentLocation({ onLocationFound }: Props) {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setOriginPin, flyTo } = useMapContext();

  const handleClick = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;

        // Reverse geocode to get a human-readable label
        let label = "Current Location";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse` +
              `?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await res.json();
          label =
            data.display_name?.split(",")[0]?.trim() ?? "Current Location";
        } catch {
          // fallback label is fine
        }

        setOriginPin({ lat, lng, label });
        flyTo(lat, lng, 16);
        onLocationFound?.(label, lat, lng);
        setActive(true);
        setLoading(false);
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        alert(
          "Could not get your location. Please check your browser permissions.",
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-white text-[0.625rem] flex flex-col items-center gap-0.5"
      aria-label="Pin current location"
    >
      <div
        className={`p-2 rounded-full flex items-center justify-center transition-colors
          ${active ? "bg-[#003f48]" : "bg-transparent"}
          ${loading ? "opacity-60" : ""}
        `}
      >
        {loading ? (
          // Spinner while fetching GPS
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="white"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="white"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
        ) : (
          <img
            src="/Icons/WhiteCurrentLocation.svg"
            className="w-5 h-5 object-contain"
            alt="Current location"
          />
        )}
      </div>
      {loading ? "Locating..." : "Current Location"}
    </button>
  );
}

export default PinCurrentLocation;
