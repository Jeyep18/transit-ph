"use client";

export default function SearchButton({ onClick: propOnClick }) {
  const handleClick = propOnClick || (() => console.log("Searching routes..."));

  return (
    <button 
      onClick={handleClick}
      className="w-full bg-brand-teal hover:bg-brand-teal/90 active:scale-[0.97] text-white font-extrabold text-[14px] rounded-2xl py-4 transition-all shadow-xl shadow-brand-teal/30 pointer-events-auto"
    >
      Search Available Routes
    </button>
  );
}
