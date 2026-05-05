import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button, Select } from "../../ui-components";
import { Calendar } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

function formatDate(date, locale) {
  if (!date) return "";
  return date.toLocaleDateString(locale || undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function FiltersModal({
  period,
  setPeriod,
  dateRange,
  setDateRange,
  customDateRange,
  setCustomDateRange,
  periodOptions,
}) {
  const { t, i18n } = useTranslation();
  const resolvedPeriodOptions = useMemo(
    () =>
      periodOptions ?? [{ label: t("studentAttendance.allPeriods"), value: "ALL" }],
    [periodOptions, t],
  );

  const dateRangeOptions = useMemo(
    () => [
      { label: t("studentAttendance.dateRangeFullTerm"), value: "ALL" },
      { label: t("studentAttendance.dateRangeLast7"), value: "7" },
      { label: t("studentAttendance.dateRangeLast15"), value: "15" },
      { label: t("studentAttendance.dateRangeLast30"), value: "30" },
      { label: t("studentAttendance.dateRangeLast60"), value: "60" },
      { label: t("studentAttendance.dateRangeLast90"), value: "90" },
      { label: t("studentAttendance.dateRangeCustom"), value: "custom" },
    ],
    [t],
  );

  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const startCalendarRef = useRef(null);
  const endCalendarRef = useRef(null);

  // Close calendar on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        startCalendarRef.current &&
        !startCalendarRef.current.contains(e.target)
      ) {
        setShowStartCalendar(false);
      }
      if (
        endCalendarRef.current &&
        !endCalendarRef.current.contains(e.target)
      ) {
        setShowEndCalendar(false);
      }
    };

    if (showStartCalendar || showEndCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showStartCalendar, showEndCalendar]);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          {t("studentAttendance.filterPeriodLabel")}
        </label>
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          options={resolvedPeriodOptions}
          className="min-w-[140px]"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          {t("studentAttendance.filterDateRangeLabel")}
        </label>
        <Select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          options={dateRangeOptions}
          className="min-w-[140px]"
        />
      </div>

      {/* Custom Date Range */}
      {dateRange === "custom" && (
        <div className="flex items-center gap-2 relative">
          <Button
            onClick={() => setShowStartCalendar((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-primary-600"
          >
            <Calendar size={16} />
            <span className="text-gray-500">
              {customDateRange.start
                ? formatDate(customDateRange.start, i18n.language)
                : t("studentAttendance.pickStartDate")}
            </span>
          </Button>

          {showStartCalendar && (
            <div
              ref={startCalendarRef}
              className="absolute top-full mt-2 z-50 rounded-lg border border-border bg-surface p-2 shadow-lg"
            >
              <DayPicker
                mode="single"
                selected={customDateRange.start}
                onSelect={(date) => {
                  if (!date) return;
                  setCustomDateRange((prev) => ({ ...prev, start: date }));
                  setShowStartCalendar(false);
                }}
                disabled={{ after: new Date() }}
              />
            </div>
          )}

          <span className="text-gray-500">{t("studentAttendance.dateRangeTo")}</span>

          <Button
            onClick={() => setShowEndCalendar((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-primary-600"
          >
            <Calendar size={16} />
            <span className="text-gray-500">
              {customDateRange.end
                ? formatDate(customDateRange.end, i18n.language)
                : t("studentAttendance.pickEndDate")}
            </span>
          </Button>

          {showEndCalendar && (
            <div
              ref={endCalendarRef}
              className="absolute top-full mt-2 z-50 rounded-lg border border-border bg-surface p-2 shadow-lg right-0"
            >
              <DayPicker
                mode="single"
                selected={customDateRange.end}
                onSelect={(date) => {
                  if (!date) return;
                  setCustomDateRange((prev) => ({ ...prev, end: date }));
                  setShowEndCalendar(false);
                }}
                disabled={{
                  before: customDateRange.start || undefined,
                  after: new Date(),
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
