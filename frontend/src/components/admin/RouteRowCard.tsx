"use client";
import { useState } from "react";
import { updateRoute } from "@/services/routeService";
import type { RouteListItem, RouteFormData } from "@/types/route";

interface Props {
  route: RouteListItem;
  selectMode: boolean;
  selected: boolean;
  onSelect: (id: number, checked: boolean) => void;
  onUpdated: (updated: RouteListItem) => void;
}

export default function RouteRowCard({
  route,
  selectMode,
  selected,
  onSelect,
  onUpdated,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<RouteFormData>>({
    route_code: route.route_code,
    name: route.name,
    estimated_duration_min: route.estimated_duration_min ?? undefined,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRoute(route.route_id, form);
      onUpdated({ ...route, ...form } as RouteListItem);
      setEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-white rounded-2xl border-2 border-[#CC553D]/40 p-4 shadow-sm">
        {/* Close */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-[#CC553D] uppercase tracking-wide">
            Editing Route
          </span>
          <button
            onClick={() => setEditing(false)}
            className="text-gray-400 hover:text-gray-700 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {[
            { label: "Route ID", key: "route_code" as const, type: "text" },
            { label: "Name", key: "name" as const, type: "text" },
            {
              label: "Est. Duration (min)",
              key: "estimated_duration_min" as const,
              type: "number",
            },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="text-[10px] font-bold text-[#0D3B3B] uppercase tracking-wider mb-1 block">
                {label}
              </label>
              <input
                type={type}
                value={(form[key] as string | number | undefined) ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    [key]:
                      type === "number"
                        ? Number(e.target.value)
                        : e.target.value,
                  }))
                }
                className="w-full border border-[#E0DDD8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B3B]/30"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 w-full bg-[#0D3B3B] text-white text-sm font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? "Saving..." : "💾 SAVE"}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`
      bg-white rounded-2xl p-4 shadow-sm border transition-all
      ${selected ? "border-[#CC553D] bg-[#CC553D]/5" : "border-[#E0DDD8]"}
    `}
    >
      <div className="flex items-start gap-3">
        {selectMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(route.route_id, e.target.checked)}
            className="mt-1 w-4 h-4 accent-[#CC553D] flex-shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          <InfoRow label="Route_ID" value={route.route_code} />
          <InfoRow label="Name" value={route.name} />
          <InfoRow label="Type" value={route.transport_mode_name} />
          <InfoRow label="From" value={route.origin_station_name} />
          <InfoRow label="To" value={route.terminal_station_name} />

          <div className="mt-3">
            <button
              onClick={() => setEditing(true)}
              className="bg-[#CC553D] text-white text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-[#B84A33] transition-colors"
            >
              ✏ Edit Route
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="flex gap-1.5 text-sm leading-snug mb-0.5">
      <span className="font-bold text-[#1A1A1A] flex-shrink-0">{label}:</span>
      <span className="text-gray-600 truncate">{value ?? "—"}</span>
    </div>
  );
}
