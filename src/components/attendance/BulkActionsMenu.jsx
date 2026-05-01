import { useState, useRef, useEffect } from "react";
import { Button } from "../../ui-components";
import { MoreVertical, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function BulkActionsMenu({
  markAllPresent,
  markAllAbsent,
  clearAll,
  showFilterCount = false,
  filteredCount = 0,
  totalCount = 0,
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleAction = (action) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Mobile: FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-36 right-0 z-30 bg-primary-600 text-white rounded-full p-3 shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 transition-all"
        aria-label="Bulk actions"
      >
        <MoreVertical size={24} />
      </button>

      {/* Desktop: Inline buttons */}
      <div className="hidden md:flex flex-wrap gap-2 items-center">
        <Button
          size="sm"
          variant="secondary"
          onClick={markAllPresent}
          className="text-xs sm:text-sm"
        >
          <CheckCircle size={16} className="mr-1" />
          {t("attendance.bulkActions.markAllPresent")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={markAllAbsent}
          className="text-xs sm:text-sm"
        >
          <XCircle size={16} className="mr-1" />
          {t("attendance.bulkActions.markAllAbsent")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={clearAll}
          className="text-xs sm:text-sm"
        >
          <RotateCcw size={16} className="mr-1" />
          {t("attendance.bulkActions.clearAll")}
        </Button>
        {showFilterCount && (
          <span className="px-3 py-1 text-xs sm:text-sm text-gray-500 bg-gray-100 rounded-lg flex items-center">
            {t("attendance.bulkActions.showing", { filtered: filteredCount, total: totalCount })}
          </span>
        )}
      </div>

      {/* Mobile: Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden fixed bottom-40 right-4 z-30 bg-surface rounded-lg shadow-xl border border-border overflow-hidden min-w-[200px]">
          <div className="py-2">
            <button
              onClick={() => handleAction(markAllPresent)}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 flex items-center gap-3 transition-colors"
            >
              <CheckCircle size={18} className="text-success-600" />
              <span>{t("attendance.bulkActions.markAllPresent")}</span>
            </button>
            <button
              onClick={() => handleAction(markAllAbsent)}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 flex items-center gap-3 transition-colors"
            >
              <XCircle size={18} className="text-error-600" />
              <span>{t("attendance.bulkActions.markAllAbsent")}</span>
            </button>
            <button
              onClick={() => handleAction(clearAll)}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 flex items-center gap-3 transition-colors"
            >
              <RotateCcw size={18} className="text-gray-600" />
              <span>{t("attendance.bulkActions.clearAll")}</span>
            </button>
            {showFilterCount && (
              <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t border-border">
                {t("attendance.bulkActions.showing", { filtered: filteredCount, total: totalCount })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
