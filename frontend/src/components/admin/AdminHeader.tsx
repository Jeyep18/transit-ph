"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logout } from "@/services/adminService";
import type { AdminUser } from "@/types/admin";

interface Props {
  admin?: AdminUser | null;
}

const NAV_LINKS = [
  { label: "Dashboard", path: "/admin" },
  { label: "Stations", path: "/admin/stations" },
  { label: "Routes", path: "/admin/routes" },
  { label: "Fare Matrix", path: "/admin/fare-matrix" },
  { label: "Transport Types", path: "/admin/transport-types" },
];

export default function AdminHeader({ admin }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  return (
    <header className="bg-[#0D3B3B] px-5 py-3.5 flex items-center justify-end sticky top-0 z-50">
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen((p) => !p)}
          aria-label="Menu"
          className="flex flex-col gap-[5px] p-1"
        >
          <span className="block w-6 h-[2px] bg-white rounded-full" />
          <span className="block w-6 h-[2px] bg-white rounded-full" />
          <span className="block w-6 h-[2px] bg-white rounded-full" />
        </button>

        {open && (
          <div className="absolute right-0 top-10 w-52 bg-white rounded-2xl shadow-2xl overflow-hidden z-50">
            {admin && (
              <div className="px-4 py-3 bg-[#0D3B3B]/5 border-b border-[#E0DDD8]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Logged in as
                </p>
                <p className="text-sm font-semibold text-[#0D3B3B] mt-0.5">
                  {admin.username}
                </p>
              </div>
            )}
            <nav className="py-1">
              {NAV_LINKS.map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => {
                    router.push(path);
                    setOpen(false);
                  }}
                  className={`
                    w-full text-left px-4 py-2.5 text-sm transition-colors
                    ${
                      pathname === path
                        ? "bg-[#0D3B3B]/10 text-[#0D3B3B] font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="border-t border-[#E0DDD8] py-1">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-[#CC553D] hover:bg-red-50"
              >
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
