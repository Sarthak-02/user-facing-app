import { useState, useMemo } from "react";
import { Card } from "../../ui-components";
import AttendanceSummary from "../../components/student-attendance/AttendanceSummary";
import FiltersModal from "../../components/student-attendance/FiltersModal";
import DesktopListing from "../../components/student-attendance/DesktopListing";
import MobileListing from "../../components/student-attendance/MobileListing";

// Mock data - Replace with actual API call
const MOCK_ATTENDANCE_DATA = [
  {
    date: "2026-01-17",
    period: "OVERALL",
    status: "PRESENT",
    markedBy: "Prof. Sharma",
  },
  {
    date: "2026-01-16",
    period: "OVERALL",
    status: "PRESENT",
    markedBy: "Prof. Gupta",
  },
  {
    date: "2026-01-15",
    period: "PERIOD_1",
    status: "PRESENT",
    markedBy: "Prof. Kumar",
  },
  {
    date: "2026-01-15",
    period: "PERIOD_2",
    status: "ABSENT",
    markedBy: "Prof. Singh",
  },
  {
    date: "2026-01-14",
    period: "OVERALL",
    status: "PRESENT",
    markedBy: "Prof. Verma",
  },
  {
    date: "2026-01-13",
    period: "OVERALL",
    status: "PRESENT",
    markedBy: "Prof. Sharma",
  },
  {
    date: "2026-01-10",
    period: "OVERALL",
    status: "ABSENT",
    markedBy: "Prof. Patel",
  },
  {
    date: "2026-01-09",
    period: "PERIOD_1",
    status: "PRESENT",
    markedBy: "Prof. Mehta",
  },
  {
    date: "2026-01-09",
    period: "PERIOD_2",
    status: "LATE",
    markedBy: "Prof. Jain",
  },
  {
    date: "2026-01-08",
    period: "OVERALL",
    status: "PRESENT",
    markedBy: "Prof. Reddy",
  },
  {
    date: "2026-01-07",
    period: "OVERALL",
    status: "PRESENT",
    markedBy: "Prof. Iyer",
  },
  {
    date: "2026-01-06",
    period: "OVERALL",
    status: "ON_LEAVE",
    markedBy: "Prof. Nair",
  },
  {
    date: "2026-01-03",
    period: "OVERALL",
    status: "PRESENT",
    markedBy: "Prof. Khan",
  },
  {
    date: "2026-01-02",
    period: "PERIOD_1",
    status: "PRESENT",
    markedBy: "Prof. Desai",
  },
  {
    date: "2026-01-02",
    period: "PERIOD_2",
    status: "PRESENT",
    markedBy: "Prof. Rao",
  },
  {
    date: "2026-01-01",
    period: "OVERALL",
    status: "PRESENT",
    markedBy: "Prof. Kapoor",
  },
  {
    date: "2025-12-31",
    period: "OVERALL",
    status: "PRESENT",
    markedBy: "Prof. Sharma",
  },
  {
    date: "2025-12-30",
    period: "OVERALL",
    status: "ABSENT",
    markedBy: "Prof. Bansal",
  },
  {
    date: "2025-12-27",
    period: "OVERALL",
    status: "PRESENT",
    markedBy: "Prof. Malhotra",
  },
  {
    date: "2025-12-26",
    period: "OVERALL",
    status: "PRESENT",
    markedBy: "Prof. Arora",
  },
  {
    date: "2025-12-25",
    period: "OVERALL",
    status: "PRESENT",
    markedBy: "Prof. Khanna",
  },
  {
    date: "2025-12-24",
    period: "PERIOD_1",
    status: "PRESENT",
    markedBy: "Prof. Sinha",
  },
  {
    date: "2025-12-24",
    period: "PERIOD_2",
    status: "PRESENT",
    markedBy: "Prof. Chopra",
  },
  {
    date: "2025-12-23",
    period: "OVERALL",
    status: "PRESENT",
    markedBy: "Prof. Sharma",
  },
  {
    date: "2025-12-20",
    period: "OVERALL",
    status: "PRESENT",
    markedBy: "Prof. Tiwari",
  },
  {
    date: "2025-12-19",
    period: "OVERALL",
    status: "PRESENT",
    markedBy: "Prof. Yadav",
  },
  {
    date: "2025-12-18",
    period: "OVERALL",
    status: "ABSENT",
    markedBy: "Prof. Saxena",
  },
];

export default function StudentAttendance() {
  const [period, setPeriod] = useState("ALL");
  const [dateRange, setDateRange] = useState("30");
  const [customDateRange, setCustomDateRange] = useState({
    start: null,
    end: null,
  });

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    let start = new Date();

    if (dateRange === "custom") {
      return {
        startDate: customDateRange.start,
        endDate: customDateRange.end,
      };
    } else {
      const days = parseInt(dateRange);
      start.setDate(end.getDate() - days);
      return { startDate: start, endDate: end };
    }
  }, [dateRange, customDateRange]);

  // Filter attendance records based on filters
  const filteredRecords = useMemo(() => {
    let filtered = [...MOCK_ATTENDANCE_DATA];

    // Filter by date range
    if (startDate && endDate) {
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      });
    }

    // Filter by period
    if (period !== "ALL") {
      filtered = filtered.filter((record) => record.period === period);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    return filtered;
  }, [startDate, endDate, period]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === "PRESENT").length;
    const absent = filteredRecords.filter((r) => r.status === "ABSENT").length;
    const onLeave = filteredRecords.filter((r) => r.status === "ON_LEAVE").length;

    return { total, present, absent, onLeave };
  }, [filteredRecords]);

  return (
    <div className="h-screen md:min-h-screen flex flex-col  p-4 gap-6">
      {/* Header */}
      <Card className="hidden md:block">
        <div className="flex items-center justify-between ">
          
          {/* Desktop: Show filters inline in header */}
          <div >
            <FiltersModal
              period={period}
              setPeriod={setPeriod}
              dateRange={dateRange}
              setDateRange={setDateRange}
              customDateRange={customDateRange}
              setCustomDateRange={setCustomDateRange}
            />
          </div>
        </div>
      </Card>

      {/* Mobile: Floating Filter Button */}
      <div className="md:hidden">
        <FiltersModal
          period={period}
          setPeriod={setPeriod}
          dateRange={dateRange}
          setDateRange={setDateRange}
          customDateRange={customDateRange}
          setCustomDateRange={setCustomDateRange}
        />
      </div>

      {/* Summary */}
      <AttendanceSummary
        total={summary.total}
        present={summary.present}
        absent={summary.absent}
        onLeave={summary.onLeave}
      />

      {/* Desktop Table */}
      <div className="hidden md:block flex-1 overflow-hidden">
        <DesktopListing attendanceRecords={filteredRecords} />
      </div>

      {/* Mobile List */}
      <div className="md:hidden flex-1 overflow-hidden">
        <MobileListing attendanceRecords={filteredRecords} />
      </div>

      {/* Empty state for desktop when no records */}
      {filteredRecords.length === 0 && (
        <div className="hidden md:block">
          <Card>
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium mb-2">
                No attendance records found
              </p>
              <p className="text-sm">
                Try adjusting your filters or date range to see more results.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
