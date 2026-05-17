"use client";
import Image from "next/image";
import { useMapContext } from "@/context/MapContext";

function PinDestination() {
  const { pinningMode, setPinningMode, destinationPin } = useMapContext();

  const isActive = pinningMode === "destination" || !!destinationPin;
  const isWaiting = pinningMode === "destination";

  const handleClick = () => {
    if (pinningMode === "destination") {
      // Cancel pinning mode
      setPinningMode(null);
    } else {
      // Activate — next map click will place the destination pin
      setPinningMode("destination");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center text-white text-[0.625rem] gap-0.5"
      aria-label={
        isWaiting ? "Tap map to place destination" : "Pin destination"
      }
    >
      <div
        className={`p-2 rounded-full flex items-center justify-center transition-colors
          ${isActive ? "bg-[#003f48]" : "bg-transparent"}
        `}
      >
        <Image
          src="/Icons/WhiteDestination.svg"
          className="w-5 h-5 object-contain"
          alt="Destination"
          width={20}
          height={20}
        />
      </div>
      {isWaiting ? "Tap map..." : "Destination"}
    </button>
  );
}

export default PinDestination;
