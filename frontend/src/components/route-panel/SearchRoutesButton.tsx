"use client";

interface SearchRoutesButtonProps {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  disabledLabel?: string;
}

export default function SearchRoutesButton({
  onClick: propOnClick,
  loading = false,
  disabled = false,
  disabledLabel = "Select locations first",
}: SearchRoutesButtonProps) {
  const handleClick = propOnClick || (() => undefined);
  const isDisabled = loading || disabled;

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`w-full bg-brand-teal text-white font-extrabold text-[14px] rounded-2xl py-4 transition-all duration-200 shadow-xl shadow-brand-teal/30 pointer-events-auto ${
        isDisabled
          ? "opacity-70 cursor-not-allowed"
          : "hover:-translate-y-0.5 hover:bg-brand-teal/90 active:scale-[0.97] animate-softPulse"
      }`}
    >
      {loading
        ? "Searching routes..."
        : disabled
          ? disabledLabel
          : "Search Available Routes"}
    </button>
  );
}
