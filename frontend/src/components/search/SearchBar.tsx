"use client";

interface SearchBarProps {
  value: string;
  isFocused: boolean;
  onInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
}

export default function SearchBar({ value, isFocused, onInput, onFocus }: SearchBarProps) {
  return (
    <div
      className={`flex items-center bg-white border border-stone-200 rounded-full px-4 shadow-md transition-all ${
        isFocused ? "ring-2 ring-brand-red/20 border-brand-red" : ""
      }`}
    >
      <svg
        className="w-4 h-4 text-brand-red mr-2 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        placeholder="Search destination..."
        value={value}
        onChange={onInput}
        onFocus={onFocus}
        className="flex-1 py-3 text-[14px] text-stone-800 bg-transparent outline-none placeholder-stone-400 font-medium"
      />
    </div>
  );
}
