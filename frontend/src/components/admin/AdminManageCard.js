"use client";

export default function AdminManageCard({ SECTIONS, activeSection, selectSection }) {
  return (
    <div className="bg-[#0F3D35] rounded-2xl px-4 pt-3 pb-4 mb-4 shadow-md">
      <p className="text-white text-sm font-bold mb-3">Manage</p>
      <div className="grid grid-cols-2 gap-2">
        {Object.keys(SECTIONS).map(key => (
          <button key={key} id={`section-${key}`} onClick={() => selectSection(key)}
            className={`py-[10px] rounded-xl text-[13px] font-bold transition-all ${
              activeSection === key
                ? "bg-[#CC553D] text-white shadow-md ring-2 ring-white/30"
                : "bg-[#CC553D]/80 text-white hover:bg-[#CC553D]"
            }`}>
            {SECTIONS[key].label}
          </button>
        ))}
      </div>
    </div>
  );
}
