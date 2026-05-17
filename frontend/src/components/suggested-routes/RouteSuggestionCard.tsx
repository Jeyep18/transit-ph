"use client";

interface RouteSuggestionCardProps {
  type: string;
  route: string;
  distance: string;
  fare: string;
  animationDelay?: number;
}

export default function RouteSuggestionCard({
  type,
  route,
  distance,
  fare,
  animationDelay = 0,
}: RouteSuggestionCardProps) {
  return (
    <div
      className="flex gap-3 bg-stone-50 rounded-2xl p-3 shadow-sm border border-stone-100"
      style={{
        animation: `slideUpFade 0.5s ease forwards ${animationDelay}s`,
        opacity: 0,
      }}
    >
      {/* Vehicle icon */}
      <div className="w-12 h-12 bg-white rounded-xl shrink-0 flex items-center justify-center text-brand-teal shadow-sm">
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
        </svg>
      </div>

      {/* Route details */}
      <div className="flex flex-col justify-between w-full">
        <p className="font-extrabold text-[13px] text-brand-red leading-tight mb-1">
          {type}: <span className="text-stone-700">{route}</span>
        </p>
        <div className="flex justify-between items-center">
          <p className="text-[11px] text-brand-teal font-bold uppercase tracking-wide">
            {distance} • <span className="text-stone-800">{fare}</span>
          </p>
          <button className="bg-brand-red hover:bg-brand-red/90 text-white font-black text-[9px] px-3 py-1.5 rounded-lg transition-all shadow-md uppercase tracking-wider active:scale-95">
            Show Route
          </button>
        </div>
      </div>
    </div>
  );
}