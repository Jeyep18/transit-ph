"use client";

interface Props {
  activeFilter: "routes" | null;
  onToggle: (filter: "routes") => void;
}

export default function StationsRouteToggle({ activeFilter, onToggle }: Props) {
  const base =
    "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150";
  const active = "bg-[#1B3A6B] text-white";
  const inactive = "bg-[#1B3A6B]/80 text-white hover:bg-[#1B3A6B]";

  return (
    <div className="flex flex-row gap-2">
      <button
        className={`${base} ${activeFilter === "routes" ? active : inactive}`}
        onClick={() => onToggle("routes")}
      >
        Routes
      </button>
    </div>
  );
}
