"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    if (username === "admin" && password === "admin123") {
      localStorage.setItem("auth", JSON.stringify({ role: "admin", username }));
      router.push("/admin");
    } else {
      localStorage.setItem("auth", JSON.stringify({ role: "client", username }));
      router.push("/");
    }
  };

  return (
    <div className="bg-white rounded-[24px] shadow-2xl px-6 py-10">
      <h1 className="text-center font-bold text-3xl mb-1 tracking-tight text-[#CC553D]" style={{ fontFamily: "var(--font-jost), sans-serif", letterSpacing: "-1px" }}>
        TRANSIT PH
      </h1>
      <p className="text-center text-[12px] font-bold text-[#0F3D35] tracking-widest mb-10">
        ADMIN LOGIN
      </p>


      <div className="relative mb-4">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F3D35]">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <input
          id="login-username"
          type="text"
          placeholder=""
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-[#EAEAEA] rounded-[16px] py-3.5 pl-12 pr-4 text-sm font-semibold text-[#0F3D35] outline-none border-2 border-transparent focus:border-[#0F3D35] transition-colors"
        />
      </div>


      <div className="relative mb-8">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F3D35]">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
        </div>
        <input
          id="login-password"
          type="password"
          placeholder=""
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="w-full bg-[#EAEAEA] rounded-[16px] py-3.5 pl-12 pr-4 text-sm font-semibold text-[#0F3D35] outline-none border-2 border-transparent focus:border-[#0F3D35] transition-colors"
        />
      </div>

      {error && (
        <p className="text-red-500 text-xs mb-4 text-center font-medium">{error}</p>
      )}

      <button
        id="login-btn"
        onClick={handleLogin}
        disabled={loading}
        className="w-full bg-[#0F3D35] text-white rounded-[16px] py-3.5 font-bold tracking-widest text-sm hover:bg-[#1a4f46] active:scale-95 transition-all duration-200 disabled:opacity-60"
      >
        {loading ? "LOGGING IN..." : "LOGIN"}
      </button>
    </div>
  );
}
