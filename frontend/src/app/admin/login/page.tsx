"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/adminService";
import type { LoginCredentials } from "@/types/admin";

export default function LoginPage() {
  const [form, setForm] = useState<LoginCredentials>({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(form);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: "linear-gradient(160deg, #F5E8D0 0%, #EDD9B5 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl px-8 py-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-[#CC553D] tracking-tight leading-none">
              TRANSIT PH
            </h1>
            <p className="text-xs font-bold text-gray-400 tracking-[0.25em] uppercase mt-2">
              Admin Login
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          {/* Username */}
          <div className="mb-3">
            <div className="flex items-center gap-3 bg-[#F0EDE8] rounded-xl px-4 py-3">
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <input
                type="text"
                value={form.username}
                onChange={(e) =>
                  setForm((p) => ({ ...p, username: e.target.value }))
                }
                onKeyDown={handleKey}
                placeholder="Username"
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6">
            <div className="flex items-center gap-3 bg-[#F0EDE8] rounded-xl px-4 py-3">
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                onKeyDown={handleKey}
                placeholder="Password"
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#0D3B3B] text-white font-bold py-3.5 rounded-xl tracking-widest text-sm hover:bg-[#0A2F2F] active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? "Logging in..." : "LOGIN"}
          </button>
        </div>
      </div>
    </div>
  );
}
