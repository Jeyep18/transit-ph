"use client";

interface Props {
  title: string;
  selectMode: boolean;
  selectedCount: number;
  deleting: boolean;
  onToggleFilter: () => void;
  onToggleSelectMode: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

export default function SectionBar({
  title,
  selectMode,
  selectedCount,
  deleting,
  onToggleFilter,
  onToggleSelectMode,
  onConfirmDelete,
  onCancelDelete,
}: Props) {
  return (
    <div className="bg-[#0D3B3B] rounded-t-2xl px-4 py-3">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-base">{title}</h2>

        {/* Normal mode */}
        {!selectMode && (
          <div className="flex gap-2">
            <button
              onClick={onToggleFilter}
              className="flex items-center gap-1.5 border border-white/40 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              ⊟ Filter
            </button>
            <button
              onClick={onToggleSelectMode}
              className="flex items-center gap-1.5 border border-white/40 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              🗑 Delete
            </button>
          </div>
        )}

        {/* Select mode — awaiting confirmation */}
        {selectMode && !deleting && (
          <div className="flex gap-2">
            <span className="text-white/60 text-xs self-center">
              {selectedCount} selected
            </span>
            <button
              onClick={onCancelDelete}
              className="text-white/70 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/30 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={onToggleSelectMode}
              className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              🗑 Delete
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation panel — slides in below header */}
      {deleting && (
        <div className="mt-3 bg-white/10 rounded-xl px-4 py-3 border border-white/20">
          <p className="text-white text-sm font-semibold text-center mb-3">
            Are you sure you want to Delete?
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancelDelete}
              className="flex-1 py-2 text-sm font-semibold text-white/80 border border-white/30 rounded-xl hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={onConfirmDelete}
              className="flex-1 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl flex items-center justify-center gap-1.5 hover:bg-red-600"
            >
              🗑 Yes, Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
