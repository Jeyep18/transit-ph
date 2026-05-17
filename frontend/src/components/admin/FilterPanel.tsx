"use client";
import { useState } from "react";
import { STATION_TYPES } from "@/constants/transport";

type FilterType = "ALL" | "JEEPNEY_STOP" | "TRICYCLE_TERMINAL";

interface Props {
  visible: boolean;
  searchValue: string;
  onSearchChange: (val: string) => void;
  selectedType: FilterType;
  onTypeChange: (type: FilterType) => void;
}

export default function FilterPanel({
  visible,
  searchValue,
  onSearchChange,
  selectedType,
  onTypeChange,
}: Props) {
  const [typeOpen, setTypeOpen] = useState(false);

  if (!visible) return null;

  return (
    <div className="bg-[#0D3B3B]/5 border border-[#E0DDD8] px-4 py-3 rounded-b-none rounded-t-none border-t-0 border-b-0">
      {/* Search input */}
      <div className="flex items-center gap-2 bg-white border border-[#E0DDD8] rounded-xl px-3 py-2 mb-2">
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
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder:text-gray-400"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange("")}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Type filter */}
      <div className="relative">
        <button
          onClick={() => setTypeOpen((p) => !p)}
          className={`
            flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors
            ${
              selectedType !== "ALL"
                ? "bg-[#0D3B3B] text-white border-[#0D3B3B]"
                : "bg-white text-[#0D3B3B] border-[#0D3B3B]/40 hover:bg-[#0D3B3B]/5"
            }
          `}
        >
          ⊟ Type{" "}
          {selectedType !== "ALL" &&
            `(${STATION_TYPES[selectedType as keyof typeof STATION_TYPES] ?? selectedType})`}
        </button>

        {typeOpen && (
          <div className="absolute top-9 left-0 bg-white border border-[#E0DDD8] rounded-xl shadow-lg py-1.5 min-w-[160px] z-10">
            <TypeOption
              label="All Types"
              checked={selectedType === "ALL"}
              onChange={() => {
                onTypeChange("ALL");
                setTypeOpen(false);
              }}
            />
            <TypeOption
              label="Jeepney Stop"
              checked={selectedType === "JEEPNEY_STOP"}
              onChange={() => {
                onTypeChange("JEEPNEY_STOP");
                setTypeOpen(false);
              }}
            />
            <TypeOption
              label="Tricycle Terminal"
              checked={selectedType === "TRICYCLE_TERMINAL"}
              onChange={() => {
                onTypeChange("TRICYCLE_TERMINAL");
                setTypeOpen(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TypeOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="accent-[#CC553D] w-3.5 h-3.5"
      />
      {label}
    </label>
  );
}
