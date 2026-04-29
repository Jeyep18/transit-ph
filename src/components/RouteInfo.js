"use client";

import { useState } from "react";

export default function RouteInfo({ fromValue: propFrom, toValue: propTo, activateLocationInput: propActivate }) {
  const [internalFrom, setInternalFrom] = useState("");
  const [internalTo, setInternalTo] = useState("");

  const from = propFrom !== undefined ? propFrom : internalFrom;
  const to = propTo !== undefined ? propTo : internalTo;
  const activate = propActivate || ((target) => console.log(`Activating ${target}`));

  return (
    <div className="bg-white rounded-[24px] p-5 shadow-2xl border border-white/50 backdrop-blur-sm">
      <p className="route-section-title mb-4 text-[#003F48]">Route Information</p>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-5 flex justify-center">
             <svg className="w-4 h-4 text-brand-red" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
          <button
            onClick={() => activate('from')}
            className={`flex-1 rounded-xl px-4 py-2 text-[12px] text-left transition-all font-bold ${from ? 'text-stone-800 bg-stone-100' : 'text-stone-400 bg-stone-50'}`}
          >
            {from || "Current Location"}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-5 flex justify-center">
             <svg className="w-4 h-4 text-brand-red" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <button
            onClick={() => activate('to')}
            className={`flex-1 rounded-xl px-4 py-2 text-[12px] text-left transition-all font-bold ${to ? 'text-stone-800 bg-stone-100' : 'text-stone-400 bg-stone-50'}`}
          >
            {to || "Destination"}
          </button>
        </div>
      </div>
    </div>
  );
}
