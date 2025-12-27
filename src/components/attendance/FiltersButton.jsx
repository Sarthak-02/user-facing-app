import { SlidersHorizontal } from "lucide-react";

export default function FiltersButton({ filters, onClick }) {
  const activeCount = 2;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex items-center justify-center rounded-lg border border-border bg-surface p-1 hover:bg-black/5"
    >
      <SlidersHorizontal size={20} />
      
      {activeCount > 0 && (
        <span
          className="
            absolute -top-1 -right-2
            flex h-4 min-w-[16px] items-center justify-center
            rounded-full bg-primary-600 px-1
            text-[10px] font-medium text-white
          "
        >
          {activeCount}
        </span>
      )}
    </button>
  );
}
