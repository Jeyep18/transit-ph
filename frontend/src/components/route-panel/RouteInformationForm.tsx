"use client";

interface RouteInformationFormProps {
  fromValue?: string;
  toValue?: string;
  activeTarget?: "from" | "to" | null;
  activateLocationInput?: (target: "from" | "to") => void;
}

export default function RouteInformationForm({
  fromValue: propFrom,
  toValue: propTo,
  activeTarget,
  activateLocationInput: propActivate,
}: RouteInformationFormProps) {
  const internalFrom = "";
  const internalTo = "";

  const from = propFrom !== undefined ? propFrom : internalFrom;
  const to = propTo !== undefined ? propTo : internalTo;
  const activate = propActivate || (() => undefined);

  return (
    <div className="animate-slideUpFade rounded-[22px] border border-white/70 bg-white/95 p-3 shadow-2xl backdrop-blur-sm">
      <p className="route-section-title mb-2 text-[#003F48]">Route Information</p>

      <div className="space-y-1.5">
        {/* From / Current Location */}
        <div className="flex items-center gap-3">
          <div className="w-5 flex justify-center">
            <svg className="w-4 h-4 text-brand-red" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <button
            onClick={() => activate("from")}
            title={from || "Origin"}
            className={`flex-1 min-w-0 overflow-hidden rounded-xl px-4 py-2 text-[12px] text-left transition-all duration-200 font-bold ${
              activeTarget === "from"
                ? "bg-[#CC553D]/10 text-[#CC553D] ring-2 ring-[#CC553D]/45 shadow-sm"
                : from
                  ? "text-stone-800 bg-stone-100"
                  : "text-stone-400 bg-stone-50"
            }`}
          >
            <span className="block truncate">{from || "Origin"}</span>
          </button>
        </div>

        {/* To / Destination */}
        <div className="flex items-center gap-3">
          <div className="w-5 flex justify-center">
            <svg className="w-4 h-4 text-brand-red" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <button
            onClick={() => activate("to")}
            title={to || "Destination"}
            className={`flex-1 min-w-0 overflow-hidden rounded-xl px-4 py-2 text-[12px] text-left transition-all duration-200 font-bold ${
              activeTarget === "to"
                ? "bg-[#CC553D]/10 text-[#CC553D] ring-2 ring-[#CC553D]/45 shadow-sm"
                : to
                  ? "text-stone-800 bg-stone-100"
                  : "text-stone-400 bg-stone-50"
            }`}
          >
            <span className="block truncate">{to || "Destination"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
