"use client";
import { useMapContext } from "@/context/MapContext";

interface Props {
  onPinPlaced?: (label: string, lat: number, lng: number) => void;
}

function PinDestination({ onPinPlaced }: Props) {
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
        <img
          src="/Icons/WhiteDestination.svg"
          className="w-5 h-5 object-contain"
          alt="Destination"
        />
      </div>
      {isWaiting ? "Tap map..." : "Destination"}
    </button>
  );
}

export default PinDestination;
