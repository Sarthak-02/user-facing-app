import { useMemo, useState, useEffect } from "react";
import AttendanceSummary from "../../components/attendance/AttendanceSummary";
import BulkActionsMenu from "../../components/attendance/BulkActionsMenu";
import ConfirmationModal from "../../components/attendance/ConfirmationModal";
import DesktopListing from "../../components/attendance/DesktopListing";
import Header from "../../components/attendance/Header";
import MobileListing from "../../components/attendance/MobileListing";
import {
  Button
} from "../../ui-components";
import { getFormattedDate, isToday, toLocalISOString } from "../../utils/common-functions";
import { submitAttendance, getAttendanceDetails } from "../../api/attendance.api";
import { useAuth } from "../../store/auth.store";




export default function AttendancePage() {

  const { auth: { sections = [], userId } } = useAuth();


  const [attendance, setAttendance] = useState({});
  const [selectedClass, setSelectedClass] = useState(sections[0]?.value || "");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [campusSession, setCampusSession] = useState("FULL_DAY");
  const [period, setPeriod] = useState("OVERALL");
  const [students, setStudents] = useState([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [noAttendanceFound, setNoAttendanceFound] = useState(false);
  const [submittedAttendanceData, setSubmittedAttendanceData] = useState({});

  // Fetch attendance details for any date (including today)
  useEffect(() => {
    if (!selectedClass || !selectedDate) return;

    const fetchAttendanceDetails = async () => {
      setIsLoadingAttendance(true);
      setNoAttendanceFound(false);
      try {


        const params = {
          section_id: selectedClass,
          date: getFormattedDate(selectedDate),
          campus_session: campusSession,
          period: period
        };

        const response = await getAttendanceDetails(params);

        // Check if success is true or false
        if (response.success === false) {
          // No attendance found - get students list from response if available
          setNoAttendanceFound(true);
          setAttendance({});
          setStudents([]);

        } else if (response.success === true) {
          // Attendance found - extract students and attendance data
          if (response.data && response.data.students && Array.isArray(response.data.students)) {
            // Set students list
            setStudents(response.data.students);

            // Build attendance map
            const attendanceMap = {};
            response?.data?.students?.forEach(record => {
              if (record?.attendance_status) {
                attendanceMap[record.student_id] = record.attendance_status;
              }
            });
            setAttendance(attendanceMap);
            setNoAttendanceFound(false);

            const { teacher_id = "", teacher_name = "", submitStatus = "", submittedAt = "", attendanceSessionId = "", section_id = "", section_name = "",is_attendance_taken=false } = response.data || {};
              setSubmittedAttendanceData({ teacher_id, teacher_name, submitStatus, submittedAt, attendanceSessionId, section_id, section_name,is_attendance_taken });
          } else {
            setAttendance({});
            setStudents([]);
            setNoAttendanceFound(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch attendance details:", error);
        setAttendance({});
        setStudents([]);
        setNoAttendanceFound(true);
      } finally {
        setIsLoadingAttendance(false);
      }
    };

    fetchAttendanceDetails();
  }, [selectedClass, selectedDate, campusSession, period]);

  const editMode = useMemo(() => {
    console.log(submittedAttendanceData);
    return isToday(selectedDate) && submittedAttendanceData?.is_attendance_taken === false;
  }, [submittedAttendanceData]);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;

    const query = searchQuery.toLowerCase();
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.roll_number.toLowerCase().includes(query)
    );
  }, [searchQuery, students]);

  async function handleSubmit() {
    const payload = {
      section_id: selectedClass,
      teacher_id: userId, //this will be fetched from the logged in details
      date: toLocalISOString(selectedDate), //today's date
      campus_session: campusSession,
      period: period,
      records: Object.entries(attendance).map(([key, value]) => ({
        student_id: key,
        status: value,
      })),
    };

    console.log(payload);
    const response = await submitAttendance(payload);
    console.log(response);
    setShowConfirmation(false);
  }

  const markAttendance = (id, status) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: status,
    }));
  };

  // Bulk actions
  const markAllPresent = () => {
    const allPresent = {};
    filteredStudents.forEach((student) => {
      allPresent[student.student_id] = "PRESENT";
    });
    setAttendance((prev) => ({ ...prev, ...allPresent }));
  };

  const markAllAbsent = () => {
    const allAbsent = {};
    filteredStudents.forEach((student) => {
      allAbsent[student.student_id] = "ABSENT";
    });
    setAttendance((prev) => ({ ...prev, ...allAbsent }));
  };

  const clearAll = () => {
    const clearedAttendance = { ...attendance };
    filteredStudents.forEach((student) => {
      delete clearedAttendance[student.student_id];
    });
    setAttendance(clearedAttendance);
  };

  const presentCount = Object.values(attendance).filter(
    (s) => s === "PRESENT"
  ).length;

  const absentCount = Object.values(attendance).filter(
    (s) => s === "ABSENT"
  ).length;

  return (
    <div className="h-screen md:min-h-screen flex flex-col p-4 gap-6 md:pb-6">
      <ConfirmationModal
        showConfirmation={showConfirmation}
        setShowConfirmation={setShowConfirmation}
        handleSubmit={handleSubmit}
        presentCount={presentCount}
        absentCount={absentCount}
        totalCount={students.length}
      />
      {/* Header */}
      <Header
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        campusSession={campusSession}
        setCampusSession={setCampusSession}
        period={period}
        setPeriod={setPeriod}
      />

      {/* Loading State */}
      {isLoadingAttendance && (
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500">Loading attendance...</div>
        </div>
      )}

      {/* No Students State */}
      {!isLoadingAttendance && students.length === 0 && (
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500">No students found for this section.</div>
        </div>
      )}

      {/* No Attendance Found State - For backdated dates */}
      {!isLoadingAttendance && !editMode && noAttendanceFound && students.length > 0 && (
        <div className="flex justify-center items-center py-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 max-w-md text-center">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Attendance Recorded
            </h3>
            <p className="text-gray-600">
              Attendance has not been marked for the selected date, session, and period.
            </p>
          </div>
        </div>
      )}

      {/* Content - Only show when not loading and students exist */}
      {!isLoadingAttendance && students.length > 0 && (editMode || !noAttendanceFound) && (
        <>
          {/* Summary */}
          <div className={`${editMode ? "hidden" : ""}`}>
            <AttendanceSummary
              total={students.length}
              absent={absentCount}
              present={presentCount}
            />
          </div>

          {/* Search Bar & Bulk Actions - Only in edit mode */}
          {editMode && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-shrink-0">
              <input
                type="text"
                placeholder="Search by name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 w-full px-4 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <BulkActionsMenu
                markAllPresent={markAllPresent}
                markAllAbsent={markAllAbsent}
                clearAll={clearAll}
                showFilterCount={!!searchQuery}
                filteredCount={filteredStudents.length}
                totalCount={students.length}
              />
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden md:block flex-1 overflow-hidden">
            <DesktopListing
              attendance={attendance}
              markAttendance={markAttendance}
              STUDENTS={filteredStudents}
              editMode={editMode}
            />
          </div>

          {/* Mobile List - Wrapped in container with proper height constraint */}
          <div className="md:hidden flex-1 overflow-hidden">
            <MobileListing
              STUDENTS={filteredStudents}
              attendance={attendance}
              markAttendance={markAttendance}
              editMode={editMode}
            />
          </div>

          {/* Desktop: Inline progress & submit - Only in edit mode */}
          {editMode && (
            <div className="hidden md:block pb-12">
              {/* Progress Indicator */}
              <div className="mb-4 max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Progress</span>
                  <span className="text-sm font-medium text-gray-700">
                    {Object.keys(attendance).length} / {students.length} students
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${(Object.keys(attendance).length / students.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button
                  variant="primary"
                  className="w-full max-w-md"
                  disabled={Object.keys(attendance).length === 0}
                  onClick={() => setShowConfirmation(true)}
                >
                  Submit Attendance
                </Button>
              </div>
            </div>
          )}

          {/* Mobile: Fixed bottom bar with progress - Only in edit mode */}
          {editMode && (
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-surface border-t border-border p-3 sm:p-4 text-center shadow-lg">
              {/* Progress Indicator */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-gray-500">
                    Progress
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    {Object.keys(attendance).length} / {students.length} students
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${(Object.keys(attendance).length / students.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                variant="primary"
                className="w-full max-w-md"
                disabled={Object.keys(attendance).length === 0}
                onClick={() => setShowConfirmation(true)}
              >
                Submit Attendance
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
