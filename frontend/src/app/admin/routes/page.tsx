"use client";
import { useState, useEffect, useMemo } from "react";
import ManageCard from "@/components/admin/ManageCard";
import SectionBar from "@/components/admin/SectionBar";
import FilterPanel from "@/components/admin/FilterPanel";
import RouteRowCard from "@/components/admin/RouteRowCard";
import { getRoutes, deactivateRoute } from "@/services/routeService";
import type { RouteListItem } from "@/types/route";

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedType, setSelectedType] = useState<
    "ALL" | "JEEPNEY_STOP" | "TRICYCLE_TERMINAL"
  >("ALL");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getRoutes({ is_active: true })
      .then(setRoutes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Filter by search text (client-side)
  const filtered = useMemo(() => {
    return routes.filter((r) => {
      const matchSearch =
        !searchValue ||
        r.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        r.route_code.toLowerCase().includes(searchValue.toLowerCase());
      return matchSearch;
    });
  }, [routes, searchValue]);

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

  const handleDeleteModeOn = () => {
    setSelectMode(true);
    setDeleting(false);
    setSelected(new Set());
  };

  const handleCancelDelete = () => {
    setSelectMode(false);
    setDeleting(false);
    setSelected(new Set());
  };

  const handleConfirmDelete = async () => {
    try {
      await Promise.all([...selected].map((id) => deactivateRoute(id)));
      setRoutes((prev) => prev.filter((r) => !selected.has(r.route_id)));
      handleCancelDelete();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  const handleUpdated = (updated: RouteListItem) => {
    setRoutes((prev) =>
      prev.map((r) => (r.route_id === updated.route_id ? updated : r)),
    );
  };

  return (
    <div className="pt-2">
      <ManageCard />

      {/* Routes section */}
      <div className="rounded-2xl overflow-hidden shadow-md">
        <SectionBar
          title="Routes"
          selectMode={selectMode}
          selectedCount={selected.size}
          deleting={deleting}
          onToggleFilter={() => setFilterVisible((p) => !p)}
          onToggleSelectMode={handleDeleteModeOn}
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

        {/* List */}
        <div className="bg-[#EDEAE4] flex flex-col gap-3 p-3 rounded-b-2xl">
          {loading && (
            <div className="py-10 text-center text-sm text-gray-400">
              Loading routes...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-400">
              No routes found.
            </div>
          )}
          {filtered.map((route) => (
            <RouteRowCard
              key={route.route_id}
              route={route}
              selectMode={selectMode}
              selected={selected.has(route.route_id)}
              onSelect={handleSelect}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
