import { Button } from "../../ui-components";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

const mobileActionBtn =
  "flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-center transition active:scale-[0.98] motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2";

export default function BulkActionsMenu({
  markAllPresent,
  markAllAbsent,
  clearAll,
  showFilterCount = false,
  filteredCount = 0,
  totalCount = 0,
}) {
  const { t } = useTranslation();

  return (
    <>
      {/* Desktop: inline text buttons */}
      <div className="hidden shrink-0 flex-wrap items-center gap-2 md:flex">
        <Button variant="secondary" onClick={markAllPresent} className="text-xs sm:text-sm">
          <CheckCircle size={16} className="mr-1 shrink-0" />
          {t("attendance.bulkActions.markAllPresent")}
        </Button>
        <Button variant="secondary" onClick={markAllAbsent} className="text-xs sm:text-sm">
          <XCircle size={16} className="mr-1 shrink-0" />
          {t("attendance.bulkActions.markAllAbsent")}
        </Button>
        <Button variant="secondary" onClick={clearAll} className="text-xs sm:text-sm">
          <RotateCcw size={16} className="mr-1 shrink-0" />
          {t("attendance.bulkActions.clearAll")}
        </Button>
        {showFilterCount && (
          <span className="flex items-center rounded-lg bg-gray-100 px-3 py-1 text-xs text-gray-500 sm:text-sm">
            {t("attendance.bulkActions.showing", { filtered: filteredCount, total: totalCount })}
          </span>
        )}
      </div>

      {/* Mobile: always-visible quick toolbar (no FAB / hidden menu) */}
      <div
        className="md:hidden w-full space-y-2"
        role="toolbar"
        aria-label={t("ui.bulkActions")}
      >
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={markAllPresent}
            className={clsx(
              mobileActionBtn,
              "border-success-200 bg-success-50/90 text-success-900 hover:bg-success-100/90",
            )}
          >
            <CheckCircle className="h-5 w-5 shrink-0 text-success-600" aria-hidden />
            <span className="text-[11px] font-semibold leading-tight sm:text-xs">
              {t("attendance.bulkActions.markAllPresentShort")}
            </span>
          </button>
          <button
            type="button"
            onClick={markAllAbsent}
            className={clsx(
              mobileActionBtn,
              "border-error-200 bg-error-100/80 text-error-900 hover:bg-error-100",
            )}
          >
            <XCircle className="h-5 w-5 shrink-0 text-error-600" aria-hidden />
            <span className="text-[11px] font-semibold leading-tight sm:text-xs">
              {t("attendance.bulkActions.markAllAbsentShort")}
            </span>
          </button>
          <button
            type="button"
            onClick={clearAll}
            className={clsx(
              mobileActionBtn,
              "border-border bg-surface text-gray-800 hover:bg-gray-50",
            )}
          >
            <RotateCcw className="h-5 w-5 shrink-0 text-gray-600" aria-hidden />
            <span className="text-[11px] font-semibold leading-tight sm:text-xs">
              {t("attendance.bulkActions.clearAllShort")}
            </span>
          </button>
        </div>
        {showFilterCount ? (
          <p className="text-center text-xs leading-snug text-gray-500">
            {t("attendance.bulkActions.showing", { filtered: filteredCount, total: totalCount })}
          </p>
        ) : null}
      </div>
    </>
  );
}
