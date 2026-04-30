"use client";

interface SearchRoutesButtonProps {
  onClick?: () => void;
  loading?: boolean;
}

export default function SearchRoutesButton({
  onClick: propOnClick,
  loading = false,
}: SearchRoutesButtonProps) {
  const handleClick = propOnClick || (() => console.log("Searching routes..."));

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full bg-brand-teal text-white font-extrabold text-[14px] rounded-2xl py-4 transition-all shadow-xl shadow-brand-teal/30 pointer-events-auto ${
        loading
          ? "opacity-70 cursor-not-allowed"
          : "hover:bg-brand-teal/90 active:scale-[0.97]"
      }`}
    >
      {loading ? "Searching routes..." : "Search Available Routes"}
    </button>
  );
}
