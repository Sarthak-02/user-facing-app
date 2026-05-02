import clsx from "clsx";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Modal({
  open,
  onClose = null,
  children,
  className = "",
}) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 pb-16"
      onClick={onClose ?? undefined}
      role="presentation"
    >
      <div
        className={clsx(
          "relative w-full max-w-md rounded-xl bg-white text-gray-900 p-4 shadow-2xl",
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
            className="absolute right-2 top-2 z-10 rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
            aria-label={t("ui.close")}
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
