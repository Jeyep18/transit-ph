"use client";

import { useState } from "react";

export default function SuggestedRoutesCard({ slideCardOpen: propOpen, setSlideCardOpen: propSetOpen, suggestedRoutes: propRoutes }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const mockRoutes = [
    {
      type: "Jeepney",
      route: "Naga City - Panganiban - Del Rosario",
      distance: "3 KM",
      fare: "Php 14.00"
    }
  ];

  const open = propOpen !== undefined ? propOpen : internalOpen;
  const setOpen = propSetOpen || setInternalOpen;
  const routes = propRoutes || mockRoutes;

  return (
    <div className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[32px] shadow-[0_-15px_50px_rgba(0,0,0,0.3)] transform transition-transform duration-600 cubic-bezier(0.16, 1, 0.3, 1) z-50 pointer-events-auto ${open ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'}`}>
      
      <div 
         onClick={() => setOpen(!open)}
         className="bg-brand-teal h-12 flex items-center justify-between px-6 cursor-pointer rounded-t-[32px]"
      >
        <div className="flex-1 text-center ml-6">
           <p className="font-extrabold text-white text-[13px] uppercase tracking-widest">Suggested Route</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); setOpen(false); }} className="text-white/50 hover:text-white transition-colors p-1">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div className="p-6 pb-10">
        <div className="space-y-4 max-h-[50vh] overflow-y-auto px-1 scrollbar-hide">
          {routes.length > 0 ? (
            routes.map((r, idx) => (
              <div 
                key={idx}
                className="flex gap-4 bg-stone-50 rounded-2xl p-4 shadow-sm border border-stone-100"
                style={{ 
                  animation: `slideUpFade 0.5s ease forwards ${idx * 0.15}s`,
                }}
              >
                <div className="w-16 h-16 bg-white rounded-xl shrink-0 flex items-center justify-center text-brand-teal shadow-sm">
                   <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                </div>
                <div className="flex flex-col justify-between w-full">
                  <p className="font-extrabold text-[14px] text-brand-red leading-tight mb-1">
                    {r.type}: <span className="text-stone-700">{r.route}</span>
                  </p>
                  <p className="text-[12px] text-brand-teal font-bold mb-2 uppercase tracking-wide">
                    Distance: {r.distance} &nbsp; Fare: <span className="text-stone-800">{r.fare}</span>
                  </p>
                  <div>
                      <button className="bg-brand-red hover:bg-brand-red/90 text-white font-black text-[10px] px-5 py-2 rounded-lg transition-all shadow-md uppercase tracking-wider active:scale-95">Show Route</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
             <div className="text-center py-10">
                <p className="text-stone-400 font-bold italic text-sm">No routes available yet.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
