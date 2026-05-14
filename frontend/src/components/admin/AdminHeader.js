"use client";

export default function AdminHeader({ setMenuOpen }) {
  return (
    <header className="bg-[#0F3D35] px-4 py-[14px] flex items-center justify-between sticky top-0 z-50">
      <button id="admin-menu-btn" onClick={() => setMenuOpen(true)} className="p-1 rounded hover:bg-white/10 transition-colors">
        <svg width="22" height="16" fill="none" viewBox="0 0 22 16">
          <rect y="0" width="22" height="2.5" rx="1.25" fill="white"/>
          <rect y="6.75" width="22" height="2.5" rx="1.25" fill="white"/>
          <rect y="13.5" width="22" height="2.5" rx="1.25" fill="white"/>
        </svg>
      </button>
      <span />
    </header>
  );
}
