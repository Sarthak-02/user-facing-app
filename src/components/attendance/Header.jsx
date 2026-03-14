import { useState, useRef, useEffect, useMemo } from "react";
import { Button, Card, Select } from "../../ui-components";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { useAuth } from "../../store/auth.store";

const DEFAULT_PERIOD_OPTIONS = [
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

export default function Header({
  selectedClass,
  setSelectedClass,
  selectedDate,
  setSelectedDate,
  period,
  setPeriod,
  scheduleSlots,
  attendanceSlots,
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);
  const { auth : { sections=[] } } = useAuth();

  // Generate period options based on attendance_slots type
  const periodOptions = useMemo(() => {
    if (attendanceSlots === "period" && scheduleSlots.length > 0) {
      return scheduleSlots.map((slot) => ({
        label: `${slot.subject} (${slot.startTime} - ${slot.endTime})`,
        value: `${slot.subject} (${slot.startTime} - ${slot.endTime})`,
      }));
    } else if (attendanceSlots === "daily" && scheduleSlots.length > 0) {
      return scheduleSlots.map((slot) => ({
        label: slot.label,
        value: slot.value,
      }));
    } else if (attendanceSlots === "half_day" && scheduleSlots.length > 0) {
      return scheduleSlots.map((slot) => ({
        label: slot.label,
        value: slot.value,
      }));
    }
    return DEFAULT_PERIOD_OPTIONS;
  }, [scheduleSlots, attendanceSlots]);
  
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
      <div className="flex flex-col gap-3">
        {/* All elements in one row with responsive sizing */}
        <div className="flex items-center gap-2 w-full">
          {/* Class Selector - Flexible width */}
          <div className="flex-1 min-w-0">
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={sections}
              disabled={sections.length === 1}
              className="w-full"
            />
          </div>

          {/* Date Selector - Fixed compact width */}
          <div className="relative flex-shrink-0">
            <Button
              onClick={() => setShowCalendar((v) => !v)}
              className="
                inline-flex items-center gap-1.5
                rounded-lg border border-border bg-surface
                px-2 py-2 text-xs font-medium
                text-gray-700 hover:bg-black/5
                focus:outline-none focus:ring-2 focus:ring-primary-600
                whitespace-nowrap
              "
            >
              <span className="text-gray-500">📅</span>
            </Button>

            {/* Calendar popover */}
            {showCalendar && (
              <div
                ref={calendarRef}
                className="absolute top-full mt-2 z-50 rounded-lg border border-border bg-surface p-2 shadow-lg right-0"
              >
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) return;
                    setSelectedDate(date);
                    setShowCalendar(false);
                  }}
                  disabled={{ after: new Date() }}
                />
              </div>
            )}
          </div>

          {/* Period Selector - Flexible width */}
          <div className="flex-1 min-w-0">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              options={periodOptions}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
