"use client";
import { useState } from "react";
import { updateStation } from "@/services/stationService";
import type {
  StationListItem,
  StationFormData,
  StationType,
} from "@/types/station";
import { STATION_TYPES } from "@/constants/transport";

interface Props {
  station: StationListItem;
  selectMode: boolean;
  selected: boolean;
  onSelect: (id: number, checked: boolean) => void;
  onUpdated: (updated: StationListItem) => void;
}

export default function StationRowCard({
  station,
  selectMode,
  selected,
  onSelect,
  onUpdated,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<StationFormData>>({
    name: station.name,
    station_type: station.station_type,
    latitude: station.latitude,
    longitude: station.longitude,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStation(station.station_id, form);
      onUpdated({ ...station, ...form } as StationListItem);
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
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-[#CC553D] uppercase tracking-wide">
            Editing Station
          </span>
          <button
            onClick={() => setEditing(false)}
            className="text-gray-400 hover:text-gray-700 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Name */}
          <div>
            <label className="text-[10px] font-bold text-[#0D3B3B] uppercase tracking-wider mb-1 block">
              Name
            </label>
            <input
              value={form.name ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full border border-[#E0DDD8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B3B]/30"
            />
          </div>

          {/* Station Type */}
          <div>
            <label className="text-[10px] font-bold text-[#0D3B3B] uppercase tracking-wider mb-1 block">
              Type
            </label>
            <select
              value={form.station_type}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  station_type: e.target.value as StationType,
                }))
              }
              className="w-full border border-[#E0DDD8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B3B]/30 bg-white"
            >
              {Object.entries(STATION_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-2">
            {(["latitude", "longitude"] as const).map((key) => (
              <div key={key}>
                <label className="text-[10px] font-bold text-[#0D3B3B] uppercase tracking-wider mb-1 block capitalize">
                  {key}
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={form[key] ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      [key]: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full border border-[#E0DDD8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B3B]/30"
                />
              </div>
            ))}
          </div>

          {/* Address */}
          <div>
            <label className="text-[10px] font-bold text-[#0D3B3B] uppercase tracking-wider mb-1 block">
              Address (optional)
            </label>
            <input
              value={form.address ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, address: e.target.value }))
              }
              className="w-full border border-[#E0DDD8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B3B]/30"
            />
          </div>
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
            onChange={(e) => onSelect(station.station_id, e.target.checked)}
            className="mt-1 w-4 h-4 accent-[#CC553D] flex-shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          <InfoRow label="Station_ID" value={String(station.station_id)} />
          <InfoRow label="Name" value={station.name} />
          <InfoRow label="Type" value={STATION_TYPES[station.station_type]} />
          <InfoRow label="Latitude" value={station.latitude.toFixed(6)} />
          <InfoRow label="Longitude" value={station.longitude.toFixed(6)} />

          <div className="mt-3">
            <button
              onClick={() => setEditing(true)}
              className="bg-[#CC553D] text-white text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-[#B84A33] transition-colors"
            >
              ✏ Edit Station
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5 text-sm leading-snug mb-0.5">
      <span className="font-bold text-[#1A1A1A] flex-shrink-0">{label}:</span>
      <span className="text-gray-600 truncate">{value}</span>
    </div>
  );
}
