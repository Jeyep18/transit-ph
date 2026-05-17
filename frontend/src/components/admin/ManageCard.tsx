"use client";
import { useRouter, usePathname } from "next/navigation";

const MANAGE_BUTTONS = [
  { label: "Stations", path: "/admin/stations" },
  { label: "Routes", path: "/admin/routes" },
  { label: "Fare Matrix", path: "/admin/fare-matrix" },
  { label: "Transport Types", path: "/admin/transport-types" },
];

export default function ManageCard() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="rounded-2xl overflow-hidden shadow-md mb-4">
      {/* Header */}
      <div className="bg-[#0D3B3B] px-4 py-3">
        <h2 className="text-white font-bold text-base">Manage</h2>
      </div>

      {/* 2×2 button grid */}
      <div className="bg-white p-4 grid grid-cols-2 gap-3">
        {MANAGE_BUTTONS.map(({ label, path }) => {
          const active = pathname === path;
          return (
            <button
              key={path}
              onClick={() => router.push(path)}
              className={`
                py-2.5 px-3 rounded-xl text-sm font-semibold text-white text-center
                transition-all duration-150 active:scale-95
                ${
                  active
                    ? "bg-[#A8432D] shadow-inner"
                    : "bg-[#CC553D] shadow-sm hover:bg-[#B84A33]"
                }
              `}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
