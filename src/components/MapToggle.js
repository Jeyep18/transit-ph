"use client";

import { useState } from "react";

export default function MapToggle({ layers: propLayers, toggleLayer: propToggle }) {
  const [internalLayers, setInternalLayers] = useState({ stations: true, route: true });
  
  const layers = propLayers || internalLayers;
  const toggle = propToggle || ((type) => setInternalLayers(prev => ({ ...prev, [type]: !prev[type] })));

  return (
    <div className="flex flex-col items-end gap-2 pointer-events-auto">
      <button 
        onClick={() => toggle('stations')}
        className={`${layers.stations ? 'bg-brand-teal' : 'bg-brand-teal/80'} shadow-lg text-white text-[11px] font-bold w-20 py-2 rounded-lg transition-all active:scale-95`}
      >
        Stations
      </button>
      <button 
        onClick={() => toggle('route')}
        className={`${layers.route ? 'bg-brand-teal' : 'bg-brand-teal/80'} shadow-lg text-white text-[11px] font-bold w-20 py-2 rounded-lg transition-all active:scale-95`}
      >
        Route
      </button>
    </div>
  );
}
