"use client";
import { useState } from "react";
import PinCurrentLocation from "./PinCurrentLocation";
import PinDestination from "./PinDestination";

function MapOverlayButtons() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`
        relative
        flex flex-col items-center
        bg-[#CC553D]
        shadow-[inset_0_-4px_4px_0_rgba(0,0,0,0.25),_inset_4px_4px_4px_0_rgba(255,255,255,0.35)]
        drop-shadow-[4px_4px_4px_rgba(0,0,0,0.25)]
        rounded-full
        overflow-hidden
        transition-all duration-300 ease-in-out
        w-[3.75rem]
        ${isExpanded ? "h-[12.25rem] py-3" : "h-[3.75rem]"}
      `}
    >
      {/* COLLAPSED PIN BUTTON - mounted but hidden */}
      <button
        onClick={() => setIsExpanded(true)}
        className={`
          flex items-center justify-center
          w-full h-[3.75rem]
          shrink-0
          cursor-pointer
          ${isExpanded ? "hidden" : "flex"}
        `}
        aria-label="Open location options"
      >
        <div className="flex items-center justify-center w-12 h-12">
          <img
            src="/Icons/PinIconWhite.svg"
            alt="Pin Icon"
            className="w-8 h-8 object-contain"
          />
        </div>
      </button>

      {/* EXPANDED CONTENT - mounted always, hidden with display */}
      <div
        className={`
          flex-col items-center justify-between
          w-full h-full
          ${isExpanded ? "flex" : "hidden"}
        `}
      >
        <PinCurrentLocation />
        <PinDestination />

        <button
          onClick={() => setIsExpanded(false)}
          className="
            flex items-center justify-center
            w-12 h-12
            shrink-0
            cursor-pointer
          "
          aria-label="Collapse location options"
        >
          <img
            src="/Icons/Check.svg"
            alt="Check Icon"
            className="w-8 h-8 object-contain"
          />
        </button>
      </div>
    </div>
  );
}

export default MapOverlayButtons;