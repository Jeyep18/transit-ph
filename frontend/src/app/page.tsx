import RouteSuggestionCard from "@/components/results/RouteSuggestionCard";
import MapOverlayButtons from "@/components/map/PinButtonsBar/PinCircleBar";
import SearchRoutesButton from "@/components/route-panel/SearchRoutesButton";
import TransportSelector from "@/components/route-panel/TransportSelector";
import BottomSheet from "@/components/route-panel/BottomSheet"
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 bg-[#E5E5E5] p-10">
    <MapOverlayButtons />

    <TransportSelector />
    <SearchRoutesButton />
    <BottomSheet />
    </div>
  );
}
