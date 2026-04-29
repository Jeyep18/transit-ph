"use client";

import { useState } from "react";

export default function TransportSelect({ selectedTransports: propSelected, toggleTransport: propToggle }) {
  const [internalSelected, setInternalSelected] = useState(["Tricycle"]);
  const options = ["Jeepney", "Tricycle", "E-Jeep"];
  
  const selected = propSelected || internalSelected;
  const toggle = propToggle || ((t) => setInternalSelected(prev => prev.includes(t) ? prev.filter(item => item !== t) : [...prev, t]));

  return (
    <div className="bg-white rounded-[24px] p-5 shadow-2xl border border-white/50 backdrop-blur-sm">
      <p className="route-section-title mb-4 text-[#003F48]">Select Transportation</p>
      <div className="flex gap-2">
        {options.map(t => (
          <button 
            key={t}
            onClick={() => toggle(t)} 
            className={`flex-1 py-2.5 rounded-xl border text-[12px] font-bold transition-all duration-200 ${selected.includes(t) ? 'pill-active shadow-lg shadow-brand-red/20' : 'pill-inactive'}`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
