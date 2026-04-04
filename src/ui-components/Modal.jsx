import clsx from "clsx";
import { X } from "lucide-react";

export default function Modal({
  open,
  onClose = null,
  children,
  className = "",
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 pb-16"
      onClick={onClose ?? undefined}
      role="presentation"
    >
      <div
        className={clsx(
          "relative w-full max-w-md rounded-xl bg-surface p-4 shadow-2xl",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 z-10 rounded-lg border border-border bg-surface p-1.5 text-gray-600 shadow-sm transition hover:bg-black/[0.04] hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
