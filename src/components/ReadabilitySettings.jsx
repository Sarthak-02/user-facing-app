import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { Type } from "lucide-react";
import { useReadabilityStore } from "../store/readability.store";

/**
 * @param {{ className?: string, variant?: "card" | "menu" }} props
 * — `menu`: compact segmented control for header profile dropdown (matches language row).
 */
export default function ReadabilitySettings({ className = "", variant = "card" }) {
  const { t } = useTranslation();
  const textScale = useReadabilityStore((s) => s.textScale);
  const setTextScale = useReadabilityStore((s) => s.setTextScale);

  const segmentBtn = (active) =>
    clsx(
      "flex-1 rounded-md py-2 min-h-[40px] text-sm font-semibold transition-colors",
      active
        ? "bg-[var(--color-surface)] text-[var(--color-primary-600)] shadow-sm"
        : "text-gray-500 hover:text-gray-800",
    );

  if (variant === "menu") {
    return (
      <div
        className={clsx(className)}
        role="group"
        aria-label={t("readability.title")}
      >
        <p className="text-sm text-gray-600 mb-2">{t("readability.title")}</p>
        <div className="flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-0.5">
          <button
            type="button"
            onClick={() => setTextScale("default")}
            className={segmentBtn(textScale === "default")}
          >
            {t("readability.standard")}
          </button>
          <button
            type="button"
            onClick={() => setTextScale("comfortable")}
            className={segmentBtn(textScale === "comfortable")}
          >
            {t("readability.larger")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "rounded-xl border border-gray-100 bg-gray-50/90 p-4 shadow-sm",
        className,
      )}
      role="group"
      aria-label={t("readability.title")}
    >
      <div className="flex items-start gap-3">
        <Type className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{t("readability.title")}</p>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{t("readability.hint")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTextScale("default")}
              className={clsx(
                "rounded-lg px-4 py-2.5 text-sm font-medium min-h-[44px] border transition-colors",
                textScale === "default"
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-gray-800 border-gray-200 hover:border-gray-300",
              )}
            >
              {t("readability.standard")}
            </button>
            <button
              type="button"
              onClick={() => setTextScale("comfortable")}
              className={clsx(
                "rounded-lg px-4 py-2.5 text-sm font-medium min-h-[44px] border transition-colors",
                textScale === "comfortable"
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-gray-800 border-gray-200 hover:border-gray-300",
              )}
            >
              {t("readability.larger")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
