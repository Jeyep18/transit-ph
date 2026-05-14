"use client";

export default function AdminSidebar({ menuOpen, setMenuOpen, SECTIONS, activeSection, selectSection, handleLogout }) {
  if (!menuOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
      <div className="relative w-64 bg-[#0F3D35] h-full flex flex-col p-6 shadow-2xl z-10">
        <p className="transit-title text-[28px] leading-none text-white mb-0.5">TRANSIT PH</p>
        <p className="text-[10px] text-white/50 font-bold tracking-widest mb-8">ADMIN PANEL</p>
        {Object.keys(SECTIONS).map(key => (
          <button key={key} onClick={() => selectSection(key)}
            className={`w-full text-left py-3 px-4 rounded-xl mb-2 text-sm font-semibold transition-all ${activeSection === key ? "bg-[#CC553D]" : "text-white hover:bg-white/10"}`}>
            {SECTIONS[key].label}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={handleLogout}
          className="w-full text-left py-3 px-4 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/10 transition-colors border border-white/20">
          Log Out Account
        </button>
      </div>
    </div>
  );
}
