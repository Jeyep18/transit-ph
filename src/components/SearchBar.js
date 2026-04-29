"use client";

import { useState, useRef, useEffect } from "react";

const destinations = [
  "Centro (Naga City)",
  "SM City Naga",
  "Robinsons Place Naga",
  "Magsaysay Avenue",
  "Ateneo de Naga University",
  "University of Nueva Caceres",
  "Peñafrancia Basilica",
  "Plaza Quince Martires",
  "Panganiban Drive",
  "Concepcion Pequeña",
  "Concepcion Grande",
  "Del Rosario",
  "San Felipe",
  "Cararayan",
  "Naga City People's Mall"
];

export default function SearchBar({ 
  searchWrapRef: propRef, 
  dropdownVisible: propVisible, 
  searchInputValue: propValue, 
  handleSearchInput: propHandle, 
  setDropdownVisible: propSetVisible, 
  activeInputTarget: propTarget, 
  setActiveInputTarget: propSetTarget, 
  filteredDestinations: propFiltered, 
  selectDestination: propSelect 
}) {
  const internalRef = useRef(null);
  const [internalVisible, setInternalVisible] = useState(false);
  const [internalValue, setInternalValue] = useState("");
  const [internalTarget, setInternalTarget] = useState(null);
  const [internalFiltered, setInternalFiltered] = useState(destinations);

  const ref = propRef || internalRef;
  const visible = propVisible !== undefined ? propVisible : internalVisible;
  const value = propValue !== undefined ? propValue : internalValue;
  const target = propTarget !== undefined ? propTarget : internalTarget;
  const filtered = propFiltered || internalFiltered;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        if (propSetVisible) propSetVisible(false);
        else setInternalVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, propSetVisible]);

  const handleInput = (e) => {
    const val = e.target.value;
    if (propHandle) propHandle(e);
    else {
      setInternalValue(val);
      setInternalFiltered(destinations.filter(d => d.toLowerCase().includes(val.toLowerCase())));
    }
  };

  const setVisible = (val) => {
    if (propSetVisible) propSetVisible(val);
    else setInternalVisible(val);
  };

  const select = (item) => {
    if (propSelect) propSelect(item);
    else {
      setInternalValue(item);
      setInternalVisible(false);
    }
  };

  return (
    <div className="relative mb-6" id="searchWrap" ref={ref}>
      <div className={`flex items-center bg-white border border-stone-200 rounded-full px-4 shadow-md transition-all ${visible ? 'ring-2 ring-brand-red/20 border-brand-red' : ''}`}>
        <svg className="w-4 h-4 text-brand-red mr-2 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="Search destination..."
          value={value}
          onChange={handleInput}
          onFocus={() => {
            setVisible(true);
            if (!target) {
              if (propSetTarget) propSetTarget('to');
              else setInternalTarget('to');
            }
          }}
          className="flex-1 py-3 text-[14px] text-stone-800 bg-transparent outline-none placeholder-stone-400 font-medium"
        />
      </div>
      {visible && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-100 rounded-2xl shadow-xl z-20 overflow-hidden animate-fadeIn">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => select(item)}
                className="px-4 py-2.5 text-sm hover:bg-stone-50 cursor-pointer transition-colors font-medium text-stone-700 border-b border-stone-50 last:border-0"
              >
                {item}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-stone-400 text-center italic">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}
