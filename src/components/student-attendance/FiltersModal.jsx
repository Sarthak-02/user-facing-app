import { useState, useRef, useEffect } from "react";
import { Button, Modal, Select } from "../../ui-components";
import { SlidersHorizontal, Calendar } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

const PERIOD_OPTIONS = [
  { label: "All Periods", value: "ALL" },
  { label: "Overall", value: "OVERALL" },
  { label: "Period 1", value: "PERIOD_1" },
  { label: "Period 2", value: "PERIOD_2" },
  { label: "Period 3", value: "PERIOD_3" },
  { label: "Period 4", value: "PERIOD_4" },
  { label: "Period 5", value: "PERIOD_5" },
  { label: "Period 6", value: "PERIOD_6" },
  { label: "Period 7", value: "PERIOD_7" },
  { label: "Period 8", value: "PERIOD_8" },
];

const DATE_RANGE_OPTIONS = [
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
}) {
  const [showModal, setShowModal] = useState(false);
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

  const handleApply = () => {
    setShowModal(false);
  };

  const handleReset = () => {
    setPeriod("ALL");
    setDateRange("30");
    setCustomDateRange({ start: null, end: null });
  };

  return (
    <>
      {/* Mobile: Floating Action Button */}
      <button
        onClick={() => setShowModal(true)}
        className="md:hidden fixed bottom-14 right-4 z-30 bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 transition-all"
        aria-label="Filters"
      >
        <SlidersHorizontal size={24} />
      </button>

      {/* Desktop: Inline filters */}
      <div className="hidden md:flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Period:
          </label>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={PERIOD_OPTIONS}
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
                {customDateRange.start
                  ? formatDate(customDateRange.start)
                  : "Start Date"}
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
                {customDateRange.end
                  ? formatDate(customDateRange.end)
                  : "End Date"}
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

      {/* Mobile: Modal */}
      <Modal open={showModal}>
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button
              onClick={handleReset}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Reset All
            </button>
          </div>

          {/* Period Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Period
            </label>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              options={PERIOD_OPTIONS}
            />
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Date Range
            </label>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              options={DATE_RANGE_OPTIONS}
            />
          </div>

          {/* Custom Date Range */}
          {dateRange === "custom" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <div className="relative">
                  <Button
                    onClick={() => setShowStartCalendar((v) => !v)}
                    className="w-full inline-flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-gray-700 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  >
                    <span>
                      {customDateRange.start
                        ? formatDate(customDateRange.start)
                        : "Select start date"}
                    </span>
                    <Calendar size={16} />
                  </Button>

                  {showStartCalendar && (
                    <div
                      ref={startCalendarRef}
                      className="absolute top-full mt-2 z-50 rounded-lg border border-border bg-surface p-2 shadow-lg left-0"
                    >
                      <DayPicker
                        mode="single"
                        selected={customDateRange.start}
                        onSelect={(date) => {
                          if (!date) return;
                          setCustomDateRange((prev) => ({
                            ...prev,
                            start: date,
                          }));
                          setShowStartCalendar(false);
                        }}
                        disabled={{ after: new Date() }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <div className="relative">
                  <Button
                    onClick={() => setShowEndCalendar((v) => !v)}
                    className="w-full inline-flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-gray-700 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  >
                    <span>
                      {customDateRange.end
                        ? formatDate(customDateRange.end)
                        : "Select end date"}
                    </span>
                    <Calendar size={16} />
                  </Button>

                  {showEndCalendar && (
                    <div
                      ref={endCalendarRef}
                      className="absolute top-full mt-2 z-50 rounded-lg border border-border bg-surface p-2 shadow-lg left-0"
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
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
