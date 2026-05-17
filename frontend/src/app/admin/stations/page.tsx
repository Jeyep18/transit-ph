"use client";
import { useState, useEffect, useMemo } from "react";
import ManageCard from "@/components/admin/ManageCard";
import SectionBar from "@/components/admin/SectionBar";
import FilterPanel from "@/components/admin/FilterPanel";
import StationRowCard from "@/components/admin/StationRowCard";
import { getStations, deactivateStation } from "@/services/stationService";
import type { StationListItem } from "@/types/station";

type FilterType = "ALL" | "JEEPNEY_STOP" | "TRICYCLE_TERMINAL";

export default function StationsPage() {
  const [stations, setStations] = useState<StationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedType, setSelectedType] = useState<FilterType>("ALL");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getStations({ is_active: true })
      .then(setStations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return stations.filter((s) => {
      const matchSearch =
        !searchValue ||
        s.name.toLowerCase().includes(searchValue.toLowerCase());
      const matchType =
        selectedType === "ALL" || s.station_type === selectedType;
      return matchSearch && matchType;
    });
  }, [stations, searchValue, selectedType]);

  const handleSelect = (id: number, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleCancelDelete = () => {
    setSelectMode(false);
    setDeleting(false);
    setSelected(new Set());
  };

  const handleConfirmDelete = async () => {
    try {
      await Promise.all([...selected].map((id) => deactivateStation(id)));
      setStations((prev) => prev.filter((s) => !selected.has(s.station_id)));
      handleCancelDelete();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  const handleUpdated = (updated: StationListItem) => {
    setStations((prev) =>
      prev.map((s) => (s.station_id === updated.station_id ? updated : s)),
    );
  };

  return (
    <div className="pt-2">
      <ManageCard />

      <div className="rounded-2xl overflow-hidden shadow-md">
        <SectionBar
          title="Stations"
          selectMode={selectMode}
          selectedCount={selected.size}
          deleting={deleting}
          onToggleFilter={() => setFilterVisible((p) => !p)}
          onToggleSelectMode={() => {
            setSelectMode(true);
            setDeleting(false);
            setSelected(new Set());
          }}
          onConfirmDelete={handleConfirmDelete}
          onCancelDelete={handleCancelDelete}
        />

        <FilterPanel
          visible={filterVisible}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
        />

        <div className="bg-[#EDEAE4] flex flex-col gap-3 p-3 rounded-b-2xl">
          {loading && (
            <div className="py-10 text-center text-sm text-gray-400">
              Loading stations...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-400">
              No stations found.
            </div>
          )}
          {filtered.map((station) => (
            <StationRowCard
              key={station.station_id}
              station={station}
              selectMode={selectMode}
              selected={selected.has(station.station_id)}
              onSelect={handleSelect}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
