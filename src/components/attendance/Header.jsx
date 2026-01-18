import { useState, useRef, useEffect } from "react";
import { Button, Card, Select } from "../../ui-components";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import FiltersModal from "./FiltersModal";

function formatDate(date) {
  if (!date) return "";
  
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  
  return `${formattedDate} (${dayOfWeek})`;
}

export default function Header({
  selectedClass,
  setSelectedClass,
  selectedDate,
  setSelectedDate,
  campusSession,
  setCampusSession,
  period,
  setPeriod,
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

  // Close calendar on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCalendar]);

  return (
    <Card>
      <div className="flex flex-col gap-4">
        {/* Top row: Class, Date, Filters button (mobile) */}
        <div className="flex items-center gap-2 sm:gap-3 relative flex-wrap">
          {/* Class Selector */}
          <Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={[
              { label: "10-A", value: "10-A" },
              { label: "10-B", value: "10-B" },
            ]}
          />

          {/* Date trigger */}
          <Button
            onClick={() => setShowCalendar((v) => !v)}
            className="
              inline-flex items-center gap-2
              rounded-lg border border-border bg-surface
              px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium
              text-gray-700 hover:bg-black/5
              focus:outline-none focus:ring-2 focus:ring-primary-600
              min-w-0
            "
          >
            <span className="text-gray-500">📅</span>
            <span className="text-gray-500 truncate">{formatDate(selectedDate)}</span>
          </Button>

          {/* Calendar popover */}
          {showCalendar && (
            <div
              ref={calendarRef}
              className="absolute top-full mt-2 z-50 rounded-lg border border-border bg-surface p-2 shadow-lg left-0 sm:left-auto"
            >
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (!date) return;
                  setSelectedDate(date);
                  setShowCalendar(false);
                }}
                disabled={{ after: new Date() }} // 🚫 future dates
              />
            </div>
          )}

          {/* Filters - Mobile shows button, Desktop shows inline */}
          <FiltersModal
            campusSession={campusSession}
            setCampusSession={setCampusSession}
            period={period}
            setPeriod={setPeriod}
          />
        </div>
      </div>
    </Card>
  );
}
