"use client";

import { useState, useEffect, useRef } from "react";
import MapBackground from "@/components/MapBackground";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import MapToggle from "@/components/MapToggle";
import RouteInfo from "@/components/RouteInfo";
import TransportSelect from "@/components/TransportSelect";
import SearchButton from "@/components/SearchButton";
import SuggestedRoutesCard from "@/components/SuggestedRoutesCard";

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

export default function Home() {
  const [activeInputTarget, setActiveInputTarget] = useState(null);
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [filteredDestinations, setFilteredDestinations] = useState(destinations);
  const [selectedTransports, setSelectedTransports] = useState(["Tricycle"]);
  const [slideCardOpen, setSlideCardOpen] = useState(false);
  const [suggestedRoutes, setSuggestedRoutes] = useState([]);
  const [layers, setLayers] = useState({ stations: true, route: true });

  const searchWrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLayer = (type) => {
    setLayers(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const toggleTransport = (t) => {
    setSelectedTransports(prev => 
      prev.includes(t) 
        ? prev.filter(item => item !== t) 
        : [...prev, t]
    );
  };

  const activateLocationInput = (target) => {
    setActiveInputTarget(target);
    setSearchInputValue(target === 'from' ? fromValue : toValue);
    setDropdownVisible(true);
    setFilteredDestinations(destinations);
  };

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchInputValue(val);
    const filtered = destinations.filter(d =>
      d.toLowerCase().includes(val.toLowerCase())
    );
    setFilteredDestinations(filtered);
  };

  const selectDestination = (item) => {
    if (activeInputTarget === 'from') {
      setFromValue(item);
    } else {
      setToValue(item);
    }
    setSearchInputValue(item);
    setDropdownVisible(false);

    setTimeout(() => {
      setActiveInputTarget(null);
      setSearchInputValue("");
    }, 300);
  };

  const searchRoutes = () => {
    if (!fromValue || !toValue) {
      alert("Please select both Current Location and Destination");
      return;
    }

    if (selectedTransports.length === 0) {
      alert("Please select at least one transportation mode");
      return;
    }

    const allRoutes = [
      {
        type: "Jeepney",
        route: `${fromValue} - Francia - ${toValue}`,
        distance: "3 KM",
        fare: "Php 14.00"
      },
      {
        type: "Tricycle",
        route: `${toValue}`,
        distance: "3 KM",
        fare: "Php 15.00"
      },
      {
        type: "E-Jeep",
        route: `${fromValue} - Panganiban - ${toValue}`,
        distance: "3 KM",
        fare: "Php 16.00"
      }
    ];

    const filtered = allRoutes.filter(r => 
      selectedTransports.some(t => r.type.includes(t))
    );

    setSuggestedRoutes(filtered);
    setSlideCardOpen(true);
  };

  return (
    <div className="bg-[#d4e8c2] font-jost overflow-hidden h-screen w-screen m-0 relative">
      <MapBackground />

      <div className="relative z-10 max-w-md mx-auto h-full flex flex-col p-6 pointer-events-none">
        <div className="pointer-events-auto mt-2">
          <Header />
          <SearchBar 
            searchWrapRef={searchWrapRef}
            dropdownVisible={dropdownVisible}
            searchInputValue={searchInputValue}
            handleSearchInput={handleSearchInput}
            setDropdownVisible={setDropdownVisible}
            activeInputTarget={activeInputTarget}
            setActiveInputTarget={setActiveInputTarget}
            filteredDestinations={filteredDestinations}
            selectDestination={selectDestination}
          />
          <MapToggle layers={layers} toggleLayer={toggleLayer} />
        </div>

        <div className="flex-1"></div>

        <div className="pointer-events-auto w-full flex flex-col gap-4 pb-4">
          <RouteInfo 
            fromValue={fromValue} 
            toValue={toValue} 
            activateLocationInput={activateLocationInput} 
          />
          <TransportSelect 
            selectedTransports={selectedTransports} 
            toggleTransport={toggleTransport} 
          />
          <SearchButton onClick={searchRoutes} />
        </div>
      </div>

      <SuggestedRoutesCard 
        slideCardOpen={slideCardOpen} 
        setSlideCardOpen={setSlideCardOpen} 
        suggestedRoutes={suggestedRoutes} 
      />
    </div>
  );
}
