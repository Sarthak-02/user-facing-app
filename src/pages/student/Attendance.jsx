import { useState, useMemo, useEffect } from "react";
import { Card } from "../../ui-components";
import AttendanceSummary from "../../components/student-attendance/AttendanceSummary";
import FiltersModal from "../../components/student-attendance/FiltersModal";
import DesktopListing from "../../components/student-attendance/DesktopListing";
import MobileListing from "../../components/student-attendance/MobileListing";
import { getStudentAttendance } from "../../api/attendance.api";
import { useAttendance } from "../../store/attendance.store";
import { useAuth } from "../../store/auth.store";
import { getFormattedDate, toLocalISOString } from "../../utils/common-functions";

export default function StudentAttendance() {
  const [period, setPeriod] = useState("ALL");
  const [dateRange, setDateRange] = useState("30");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, PRESENT, ABSENT
  const [customDateRange, setCustomDateRange] = useState({
    start: null,
    end: null,
  });

  // Get auth and attendance store
  const { auth } = useAuth();
  const { records, loading, error, setAttendanceData, setLoading, setError } = useAttendance();

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

  // Generate period options from records
  const periodOptions = useMemo(() => {
    const uniquePeriods = new Set();
    
    records.forEach((record) => {
      if (record.period) {
        uniquePeriods.add(record.period);
      }
    });

    // Convert to array and sort
    const periods = Array.from(uniquePeriods).sort();

    // Create options array with "All Periods" first
    const options = [{ label: "All Periods", value: "ALL" }];
    
    periods.forEach((period) => {
      // Format the label (e.g., "PERIOD_1" -> "Period 1", "OVERALL" -> "Overall")
      let label = period;
      if (period.startsWith("PERIOD_")) {
        const num = period.split("_")[1];
        label = `Period ${num}`;
      } else {
        label = period.charAt(0) + period.slice(1).toLowerCase();
      }
      
      options.push({ label, value: period });
    });

    return options;
  }, [records]);

  // Fetch attendance data once on mount
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!auth.userId || !auth.sections[0]?.value) {
        console.warn("Missing required data: student_id or section_id");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = {
          student_id: auth.userId,
          section_id: auth.sections[0]?.value,
          start_date: auth.campus.term_start_date,
          end_date: auth.campus.term_end_date,
        };

        // Fetch all attendance records for the term
        const response = await getStudentAttendance(params);
        
        if (response.success && response.data) {
          // Transform records to match UI expectations
          const transformedRecords = response.data.records.map((record) => {
            const teacherName = record.attendanceSession?.teacher
              ? `${record.attendanceSession.teacher.teacher_first_name} ${record.attendanceSession.teacher.teacher_last_name}`
              : "N/A";
            
            // Use submittedAt as date or default to current date
            const date = record.attendanceSession?.submittedAt 
              ? new Date(record.attendanceSession.submittedAt).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0];

            return {
              date: date,
              period: record.attendanceSession?.period || "OVERALL",
              status: record.status,
              markedBy: teacherName,
            };
          });

          setAttendanceData({
            summary: response.data.summary,
            records: transformedRecords,
          });
        }
      } catch (err) {
        console.error("Failed to fetch attendance:", err);
        setError(err.message || "Failed to load attendance data");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [auth.userId, auth.sections, auth.campus, setAttendanceData, setLoading, setError]);

  // Filter attendance records based on all filters (frontend only)
  const filteredRecords = useMemo(() => {
    let filtered = [...records];

    // Filter by date range
    if (startDate && endDate) {
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.date);
        return getFormattedDate(recordDate) >= getFormattedDate(startDate) && getFormattedDate(recordDate) <= toLocalISOString(endDate);
      });
    }

    // Filter by period
    if (period !== "ALL") {
      filtered = filtered.filter((record) => record.period === period);
    }

    // Filter by status
    if (statusFilter === "PRESENT") {
      filtered = filtered.filter((record) => record.status === "PRESENT");
    } else if (statusFilter === "ABSENT") {
      filtered = filtered.filter((record) => record.status === "ABSENT");
    }
    // If statusFilter is "ALL", show everything

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    return filtered;
  }, [records, period, statusFilter, startDate, endDate]);

  // Calculate summary statistics from filtered records (frontend calculation)
  const displaySummary = useMemo(() => {
    // Calculate all stats from filtered records
    const total = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === "PRESENT").length;
    const absent = filteredRecords.filter((r) => r.status === "ABSENT").length;
    const onLeave = filteredRecords.filter((r) => r.status === "ON_LEAVE" || r.status === "EXCUSED").length;
    
    return {
      total,
      present,
      absent,
      onLeave,
    };
  }, [filteredRecords]);

  return (
    <div className="h-screen md:min-h-screen flex flex-col  p-4 gap-6">
      {/* Loading State */}
      {loading && (
        <Card>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading attendance data...</p>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <div className="text-center py-8 text-error-600">
            <p className="font-medium mb-2">Error loading attendance</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </Card>
      )}

      {/* Content - only show when not loading */}
      {!loading && !error && (
        <>
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
                  periodOptions={periodOptions}
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
              periodOptions={periodOptions}
            />
          </div>

          {/* Summary */}
          <AttendanceSummary
            total={displaySummary.total}
            present={displaySummary.present}
            absent={displaySummary.absent}
            onLeave={displaySummary.onLeave}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
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
        </>
      )}
    </div>
  );
}
