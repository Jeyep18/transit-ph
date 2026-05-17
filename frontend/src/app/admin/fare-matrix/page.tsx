"use client";
import { useState, useEffect } from "react";
import ManageCard from "@/components/admin/ManageCard";
import {
  getFareMatrices,
  createFareMatrix,
  activateFareMatrix,
} from "@/services/adminService";
import { formatDate, formatFare } from "@/lib/formatters";
import type { FareMatrix, FareMatrixFormData } from "@/types/fareMatrix";

const EMPTY_FORM: FareMatrixFormData = {
  transport_mode: 1, // Jeepney — only one mode in scope
  base_fare: 13.0,
  base_km: 4,
  incremental_rate: 1.8,
  effective_date: new Date().toISOString().split("T")[0],
};

export default function FareMatrixPage() {
  const [matrices, setMatrices] = useState<FareMatrix[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<FareMatrixFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    getFareMatrices()
      .then(setMatrices)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createFareMatrix(form);
      setAdding(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create.");
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await activateFareMatrix(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to activate.");
    }
  };

  // Live fare preview
  const previewFare = (km: number) => {
    const extra = Math.max(0, km - form.base_km);
    return form.base_fare + extra * form.incremental_rate;
  };

  return (
    <div className="pt-2">
      <ManageCard />

      <div className="rounded-2xl overflow-hidden shadow-md">
        {/* Header */}
        <div className="bg-[#0D3B3B] px-4 py-3 flex items-center justify-between">
          <h2 className="text-white font-bold text-base">Fare Matrix</h2>
          <button
            onClick={() => setAdding((p) => !p)}
            className="text-xs font-semibold text-white border border-white/40 px-3 py-1.5 rounded-full hover:bg-white/10"
          >
            {adding ? "✕ Cancel" : "+ New Matrix"}
          </button>
        </div>

        {/* Add form */}
        {adding && (
          <div className="bg-white px-4 py-4 border-b border-[#E0DDD8]">
            <p className="text-xs font-bold text-[#0D3B3B] uppercase tracking-wider mb-3">
              New Fare Matrix
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              {(
                [
                  { label: "Base Fare (PHP)", key: "base_fare", step: 0.01 },
                  { label: "Base Distance (km)", key: "base_km", step: 0.5 },
                  {
                    label: "Rate per km (PHP)",
                    key: "incremental_rate",
                    step: 0.01,
                  },
                ] as const
              ).map(({ label, key, step }) => (
                <div key={key} className="col-span-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                    {label}
                  </label>
                  <input
                    type="number"
                    step={step}
                    value={form[key]}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        [key]: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full border border-[#E0DDD8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B3B]/30"
                  />
                </div>
              ))}

              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                  Effective Date
                </label>
                <input
                  type="date"
                  value={form.effective_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, effective_date: e.target.value }))
                  }
                  className="w-full border border-[#E0DDD8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B3B]/30"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="bg-[#0D3B3B]/5 rounded-xl p-3 mb-3">
              <p className="text-[10px] font-bold text-[#0D3B3B] uppercase tracking-wider mb-2">
                Fare Preview
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[4, 8, 15].map((km) => (
                  <div key={km} className="text-center">
                    <p className="text-xs text-gray-500">{km} km</p>
                    <p className="text-sm font-bold text-[#0D3B3B]">
                      {formatFare(previewFare(km))}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={saving}
              className="w-full bg-[#CC553D] text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-60"
            >
              {saving ? "Saving..." : "💾 Save Fare Matrix"}
            </button>
          </div>
        )}

        {/* Matrix list */}
        <div className="bg-[#EDEAE4] flex flex-col gap-3 p-3 rounded-b-2xl">
          {loading && (
            <div className="py-8 text-center text-sm text-gray-400">
              Loading...
            </div>
          )}
          {!loading && matrices.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400">
              No fare matrices yet. Add one above.
            </div>
          )}
          {matrices.map((m) => (
            <div
              key={m.fare_matrix_id}
              className={`bg-white rounded-2xl p-4 border shadow-sm ${m.is_active ? "border-[#0D3B3B] ring-1 ring-[#0D3B3B]/20" : "border-[#E0DDD8]"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {m.is_active && (
                    <span className="inline-block bg-[#0D3B3B] text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 uppercase tracking-wider">
                      Active
                    </span>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                        Base Fare
                      </p>
                      <p className="font-bold text-[#0D3B3B]">
                        {formatFare(m.base_fare)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                        Base KM
                      </p>
                      <p className="font-bold text-[#0D3B3B]">{m.base_km} km</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                        Per KM
                      </p>
                      <p className="font-bold text-[#0D3B3B]">
                        {formatFare(m.incremental_rate)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Effective: {formatDate(m.effective_date)}
                  </p>
                </div>
                {!m.is_active && (
                  <button
                    onClick={() => handleActivate(m.fare_matrix_id)}
                    className="text-xs font-semibold text-[#CC553D] border border-[#CC553D] px-3 py-1.5 rounded-full hover:bg-[#CC553D]/5 flex-shrink-0"
                  >
                    Activate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
