"use client";

interface SearchDropdownProps {
  items: string[];
  onSelect: (item: string) => void;
}

export default function SearchDropdown({ items, onSelect }: SearchDropdownProps) {
  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-100 rounded-2xl shadow-xl z-20 overflow-hidden animate-fadeIn">
      {items.length > 0 ? (
        items.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onSelect(item)}
            className="px-4 py-2.5 text-sm hover:bg-stone-50 cursor-pointer transition-colors font-medium text-stone-700 border-b border-stone-50 last:border-0"
          >
            {item}
          </div>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-stone-400 text-center italic">
          No results found
        </div>
      )}
    </div>
  );
}
