"use client";

export default function Header() {
  return (
    <div className="w-full bg-[#0F3D35] backdrop-blur-sm py-4 text-center pointer-events-auto z-10">
      <h1 className="transit-title text-[32px] leading-none mb-1">
        TRANSIT PH
      </h1>
      <p className="text-[11px] font-bold text-white tracking-tight">
        Search or pin your trip
      </p>
    </div>
  );
}
