import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../ui-components";
import AttendanceSummary from "../../components/student-attendance/AttendanceSummary";
import FiltersModal from "../../components/student-attendance/FiltersModal";
import AttendanceCalendar from "../../components/student-attendance/AttendanceCalendar";
import { getStudentAttendance } from "../../api/attendance.api";
import { useAttendance } from "../../store/attendance.store";
import { useAuth } from "../../store/auth.store";
import { getFormattedDate, toLocalISOString } from "../../utils/common-functions";

export default function StudentAttendance() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState("ALL");
  const [dateRange, setDateRange] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, PRESENT, ABSENT
  const [customDateRange, setCustomDateRange] = useState({
    start: null,
    end: null,
  });

  // Get auth and attendance store
  const { auth } = useAuth();
  const { records, loading, error, setAttendanceData, setLoading, setError,summary } = useAttendance();

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    if (dateRange === "ALL") {
      return { startDate: null, endDate: null };
    }
    if (dateRange === "custom") {
      return { startDate: customDateRange.start, endDate: customDateRange.end };
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - parseInt(dateRange));
    return { startDate: start, endDate: end };
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

    const options = [{ label: t("studentAttendance.allPeriods"), value: "ALL" }];

    periods.forEach((period) => {
      let label = period;
      if (period === "OVERALL") {
        label = t("studentAttendance.periodOverall");
      } else if (period.startsWith("PERIOD_")) {
        const num = period.split("_")[1];
        label = t("studentAttendance.periodNumber", { number: num });
      } else {
        label = period.charAt(0) + period.slice(1).toLowerCase();
      }
      
      options.push({ label, value: period });
    });

    return options;
  }, [records, t]);

  // Fetch attendance data once on mount
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!auth.userId || !auth.sections?.section_id) {
        console.warn("Missing required data: student_id or section_id");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = {
          student_id: auth.userId,
          section_id: auth.sections?.section_id,
          start_date: auth.campus.term_start_date,
          end_date: auth.campus.term_end_date,
        };

        // Fetch all attendance records for the term
        let response = await getStudentAttendance(params);
        
        if (response && response.data) {
          // Transform records to match UI expectations
          const transformedRecords = response?.data?.records.map((record) => {
            const teacherName = record.attendanceSession?.teacher
              ? `${record.attendanceSession.teacher.teacher_first_name} ${record.attendanceSession.teacher.teacher_last_name}`
              : t("common.na");

            const date = record.attendanceSession?.date
              ? new Date(record.attendanceSession.date).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0];

            return {
              date: date,
              period: record.attendanceSession?.period || "OVERALL",
              status: record.status,
              markedBy: teacherName,
            };
          });
         
          setAttendanceData({
            summary: response?.data?.summary,
            records: transformedRecords,
          });
        }
      } catch (err) {
        console.error("Failed to fetch attendance:", err);
        setError(err.message || t("studentAttendance.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [auth.userId, auth.sections, auth.campus, setAttendanceData, setLoading, setError, t]);
  
  // Date + period only — summary counts stay stable when toggling present/absent filter
  const recordsForSummary = useMemo(() => {
    let filtered = [...records];

    if (startDate && endDate) {
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.date);
        return getFormattedDate(recordDate) >= getFormattedDate(startDate) && getFormattedDate(recordDate) <= toLocalISOString(endDate);
      });
    }

    if (period !== "ALL") {
      filtered = filtered.filter((record) => record.period === period);
    }

    return filtered;
  }, [records, period, startDate, endDate]);

  // Listing: same scope as summary, plus optional status filter
  const filteredRecords = useMemo(() => {
    let filtered = [...recordsForSummary];

    if (statusFilter === "PRESENT") {
      filtered = filtered.filter((record) => record.status === "PRESENT");
    } else if (statusFilter === "ABSENT") {
      filtered = filtered.filter((record) => record.status === "ABSENT");
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    return filtered;
  }, [recordsForSummary, statusFilter]);

 
  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 gap-3 md:gap-4">
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col gap-3 md:gap-4 animate-pulse">
          <Card className="!py-2 !px-3">
            <div className="h-8 w-64 bg-gray-200 rounded-lg" />
          </Card>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="!p-3 rounded-xl">
                <div className="h-3 w-12 bg-gray-200 rounded mb-2" />
                <div className="h-6 w-8 bg-gray-200 rounded" />
              </Card>
            ))}
          </div>
          <Card>
            <div className="h-64 bg-gray-100 rounded-lg" />
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border border-error-200 bg-error-50">
          <div className="text-center py-8">
            <div className="h-10 w-10 rounded-full bg-error-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-error-600 text-lg font-bold">!</span>
            </div>
            <p className="font-semibold text-error-700 mb-1">{t("studentAttendance.errorLoading")}</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </Card>
      )}

      {/* Content - only show when not loading */}
      {!loading && !error && (
        <>
          {/* Header — desktop filters */}
          <Card className="hidden md:block !py-2 !px-3">
            <div className="flex items-center justify-between">
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
          </Card>

          {/* Summary */}
          <AttendanceSummary
            total={summary.total}
            present={summary.present}
            absent={summary.absent}
            onLeave={summary.onLeave}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />

          {filteredRecords.length > 0 ? (
            <div className="flex-1 overflow-y-auto pb-24">
              <AttendanceCalendar attendanceRecords={filteredRecords} />
            </div>
          ) : (
            <Card className="border border-dashed border-gray-300">
              <div className="text-center py-12 text-gray-400">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📅</span>
                </div>
                <p className="text-base font-semibold text-gray-600 mb-1">
                  {t("studentAttendance.noRecordsFound")}
                </p>
                <p className="text-sm">
                  {t("studentAttendance.adjustFilters")}
                </p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
