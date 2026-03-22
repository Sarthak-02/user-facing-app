import clsx from "clsx";

export default function Modal({
  open,
  onClose = null,
  children,
  className = "",
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose ?? undefined}
      role="presentation"
    >
      <div
        className={clsx(
          "w-full max-w-md rounded-xl bg-surface p-4 shadow-2xl",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
        {onClose && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-primary-600 hover:opacity-80"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
