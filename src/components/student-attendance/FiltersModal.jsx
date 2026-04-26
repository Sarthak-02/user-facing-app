import { useState, useRef, useEffect } from "react";
import { Button, Select } from "../../ui-components";
import { Calendar } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

const DATE_RANGE_OPTIONS = [
  { label: "Full Term", value: "ALL" },
  { label: "Last 7 Days", value: "7" },
  { label: "Last 15 Days", value: "15" },
  { label: "Last 30 Days", value: "30" },
  { label: "Last 60 Days", value: "60" },
  { label: "Last 90 Days", value: "90" },
  { label: "Custom Range", value: "custom" },
];

function formatDate(date) {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", {
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
  periodOptions = [{ label: "All Periods", value: "ALL" }],
}) {
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
          Period:
        </label>
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          options={periodOptions}
          className="min-w-[140px]"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Date Range:
        </label>
        <Select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          options={DATE_RANGE_OPTIONS}
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
              {customDateRange.start ? formatDate(customDateRange.start) : "Start Date"}
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

          <span className="text-gray-500">to</span>

          <Button
            onClick={() => setShowEndCalendar((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-primary-600"
          >
            <Calendar size={16} />
            <span className="text-gray-500">
              {customDateRange.end ? formatDate(customDateRange.end) : "End Date"}
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
