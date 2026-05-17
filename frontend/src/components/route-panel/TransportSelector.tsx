"use client";

import { useState } from "react";

interface TransportSelectorProps {
  selectedTransports?: string[];
  toggleTransport?: (t: string) => void;
}

export default function TransportSelector({
  selectedTransports: propSelected,
  toggleTransport: propToggle,
}: TransportSelectorProps) {
  const [internalSelected, setInternalSelected] = useState(["Jeepney", "Tricycle", "E-Jeep"]);
  const options = [
    { label: "Jeepney", enabled: true },
    { label: "Tricycle", enabled: true },
    { label: "E-Jeep", enabled: true },
  ];

  const selected = propSelected || internalSelected;
  const toggle =
    propToggle ||
    ((t: string) =>
      setInternalSelected((prev) =>
        prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
      ));

  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/70">Filter by mode</p>
      <div className="flex gap-2">
        {options.map(({ label, enabled }) => (
          <button
            key={label}
            onClick={() => enabled && toggle(label)}
            disabled={!enabled}
            title={!enabled ? "Advisory only in this version" : undefined}
            className={`flex-1 py-2 rounded-xl border text-[12px] font-bold transition-all duration-200 ${
              selected.includes(label)
                ? "border-[#CC553D] bg-[#CC553D] text-white shadow-lg shadow-black/10"
                : "border-white/20 bg-white/10 text-white/70"
            } ${!enabled ? "opacity-45 cursor-not-allowed" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
