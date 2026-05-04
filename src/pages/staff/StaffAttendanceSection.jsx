import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Pencil, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import AttendanceSummary from "../../components/attendance/AttendanceSummary";
import BulkActionsMenu from "../../components/attendance/BulkActionsMenu";
import ConfirmationModal from "../../components/attendance/ConfirmationModal";
import DesktopListing from "../../components/attendance/DesktopListing";
import MobileListing from "../../components/attendance/MobileListing";
import StudentHistoryModal from "../../components/attendance/StudentHistoryModal";
import { Button, Shimmer } from "../../ui-components";
import Loader from "../../ui-components/Loader";
import { getFormattedDate, isToday, toLocalISOString } from "../../utils/common-functions";
import { submitAttendance, editAttendance, getAttendanceDetails } from "../../api/attendance.api";
import { useAuth } from "../../store/auth.store";
import { useLoader } from "../../store/loader.store";
import { useTeacherSectionRows } from "../../hooks/useTeacherSectionRows";

const PERIOD = "OVERALL";

function formatDateInputValue(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateInputValue(s) {
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

export default function StaffAttendanceSection({ readOnly = false }) {
  const { t } = useTranslation();
  const { sectionId: sectionIdParam } = useParams();
  const navigate = useNavigate();
  const sectionRows = useTeacherSectionRows();
  const selectedClass = sectionIdParam || "";

  const { auth: { userId, campus } } = useAuth();
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState(null);

  const [attendance, setAttendance] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [today] = useState(() => new Date());
  const [historyDateInput, setHistoryDateInput] = useState(() => formatDateInputValue(new Date()));
  // Must be memoized: a new Date() each render would retrigger fetch on every paint (Past records).
  const selectedDate = useMemo(() => {
    if (readOnly) return parseDateInputValue(historyDateInput);
    return today;
  }, [readOnly, historyDateInput, today]);

  const dateInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [noAttendanceFound, setNoAttendanceFound] = useState(false);
  const [submittedAttendanceData, setSubmittedAttendanceData] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  const sectionTitle = useMemo(() => {
    const row = sectionRows.find((r) => String(r.sectionId) === String(selectedClass));
    return row?.label || t("targetSelector.section");
  }, [sectionRows, selectedClass, t]);

  const allowedIds = useMemo(
    () => new Set(sectionRows.map((r) => String(r.sectionId))),
    [sectionRows]
  );

  useEffect(() => {
    if (!selectedClass || sectionRows.length === 0) return;
    if (!allowedIds.has(String(selectedClass))) {
      navigate("/staff/attendance", { replace: true });
    }
  }, [selectedClass, sectionRows.length, allowedIds, navigate]);

  const todayInputMax = formatDateInputValue(new Date());

  const goPrevDay = useCallback(() => {
    const d = parseDateInputValue(historyDateInput);
    d.setDate(d.getDate() - 1);
    setHistoryDateInput(formatDateInputValue(d));
  }, [historyDateInput]);

  const goNextDay = useCallback(() => {
    const d = parseDateInputValue(historyDateInput);
    d.setDate(d.getDate() + 1);
    const next = formatDateInputValue(d);
    if (next <= todayInputMax) setHistoryDateInput(next);
  }, [historyDateInput, todayInputMax]);

  const goBack = useCallback(() => {
    if (sectionRows.length > 1) {
      navigate("/staff/attendance");
    } else {
      navigate("/home");
    }
  }, [navigate, sectionRows.length]);

  const markPath = `/staff/attendance/section/${selectedClass}`;
  const historyPath = `/staff/attendance/section/${selectedClass}/history`;

  const fetchDateKey = useMemo(() => getFormattedDate(selectedDate), [selectedDate]);

  useEffect(() => {
    setIsEditing(false);
  }, [selectedClass, fetchDateKey]);

  useEffect(() => {
    if (!selectedClass || !fetchDateKey) return;

    const fetchAttendanceDetails = async () => {
      setIsLoadingAttendance(true);
      setNoAttendanceFound(false);
      try {
        const params = {
          section_id: selectedClass,
          date: fetchDateKey,
          period: PERIOD,
        };

        const response = await getAttendanceDetails(params);

        if (response.success === false) {
          setNoAttendanceFound(true);
          setAttendance({});
          setStudents([]);
        } else if (response.success === true) {
          if (response.data && response.data.students && Array.isArray(response.data.students)) {
            setStudents(response.data.students);

            const attendanceMap = {};
            response?.data?.students?.forEach((record) => {
              if (record?.attendance_status) {
                attendanceMap[record.student_id] = record.attendance_status;
              }
            });
            setAttendance(attendanceMap);
            setNoAttendanceFound(false);

            const {
              teacher_id = "",
              teacher_name = "",
              submitStatus = "",
              submittedAt = "",
              attendanceSessionId = "",
              section_id = "",
              section_name = "",
              is_attendance_taken = false,
            } = response.data || {};
            setSubmittedAttendanceData({
              teacher_id,
              teacher_name,
              submitStatus,
              submittedAt,
              attendanceSessionId,
              section_id,
              section_name,
              is_attendance_taken,
            });
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
  }, [selectedClass, fetchDateKey]);

  const editMode = useMemo(() => {
    if (readOnly) return false;
    return isToday(selectedDate) && (submittedAttendanceData?.is_attendance_taken === false || isEditing);
  }, [readOnly, submittedAttendanceData, selectedDate, isEditing]);

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
    try {
      const records = Object.entries(attendance).map(([key, value]) => ({
        student_id: key,
        status: value,
      }));

      const response = isEditing
        ? await editAttendance({
            session_id: submittedAttendanceData.attendanceSessionId,
            teacher_id: userId,
            records,
          })
        : await submitAttendance({
            section_id: selectedClass,
            teacher_id: userId,
            date: toLocalISOString(selectedDate),
            period: PERIOD,
            records,
          });

      if (response.success) {
        const params = {
          section_id: selectedClass,
          date: fetchDateKey,
          period: PERIOD,
        };

        const updatedData = await getAttendanceDetails(params);

        if (updatedData.success === true && updatedData.data?.students) {
          setStudents(updatedData.data.students);

          const attendanceMap = {};
          updatedData.data.students.forEach((record) => {
            if (record?.attendance_status) {
              attendanceMap[record.student_id] = record.attendance_status;
            }
          });
          setAttendance(attendanceMap);

          const {
            teacher_id = "",
            teacher_name = "",
            submitStatus = "",
            submittedAt = "",
            attendanceSessionId = "",
            section_id = "",
            section_name = "",
            is_attendance_taken = false,
          } = updatedData.data || {};
          setSubmittedAttendanceData({
            teacher_id,
            teacher_name,
            submitStatus,
            submittedAt,
            attendanceSessionId,
            section_id,
            section_name,
            is_attendance_taken,
          });

          setNoAttendanceFound(false);
        }
      }

      setShowConfirmation(false);
      setIsEditing(false);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setShowConfirmation(false);
    }
  }

  const markAttendance = (id, status) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: status,
    }));
  };

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

  const presentCount = Object.values(attendance).filter((s) => s === "PRESENT").length;

  const absentCount = Object.values(attendance).filter((s) => s === "ABSENT").length;

  const tabClass = ({ isActive }) =>
    [
      "flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition",
      isActive
        ? "bg-[var(--color-surface)] text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white dark:shadow-md"
        : "text-gray-800 hover:bg-black/[0.04] hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white",
    ].join(" ");

  if (!selectedClass) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <Loader />
      </div>
    );
  }

  if (sectionRows.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <Loader />
      </div>
    );
  }

  if (!allowedIds.has(String(selectedClass))) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-3 pb-3 pt-2 md:px-4 md:pb-4 md:pt-3">
      {!readOnly && (
        <ConfirmationModal
          showConfirmation={showConfirmation}
          setShowConfirmation={setShowConfirmation}
          handleSubmit={handleSubmit}
          presentCount={presentCount}
          absentCount={absentCount}
          totalCount={students.length}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto md:overflow-hidden">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <Button
            variant="ghost"
            type="button"
            className="-ml-1 h-9 w-fit shrink-0 gap-1.5 px-1 py-0"
            onClick={goBack}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Button>
          <h1 className="min-w-0 flex-1 truncate text-right text-lg font-bold leading-tight text-gray-900 md:text-xl">
            {sectionTitle}
          </h1>
        </div>

        <div className="flex gap-1 rounded-lg border border-gray-300/80 bg-gray-200/90 p-0.5 dark:border-gray-600 dark:bg-gray-900">
          <NavLink to={markPath} end className={tabClass}>
            {t("staffAttendance.takeAttendance")}
          </NavLink>
          <NavLink to={historyPath} className={tabClass}>
            {t("staffAttendance.pastRecords")}
          </NavLink>
        </div>

        {readOnly && (() => {
          const isViewingToday = historyDateInput === todayInputMax;
          const viewingDate = parseDateInputValue(historyDateInput);
          const dayName = viewingDate.toLocaleDateString(undefined, { weekday: "short" });
          const dayNum = viewingDate.getDate();
          const monthName = viewingDate.toLocaleDateString(undefined, { month: "short" });
          const year = viewingDate.getFullYear();
          const currentYear = new Date().getFullYear();
          return (
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                <button
                  type="button"
                  onClick={goPrevDay}
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                  aria-label={t("staffAttendance.previousDay")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => dateInputRef.current?.showPicker()}
                  className="flex flex-1 items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-primary-600" />
                  <span className="truncate">
                    {dayName}, {dayNum} {monthName}{year !== currentYear ? ` ${year}` : ""}
                  </span>
                  {isViewingToday && (
                    <span className="shrink-0 rounded-full bg-primary-100 px-1.5 py-0.5 text-xs font-semibold text-primary-700">
                      {t("staffAttendance.today")}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={goNextDay}
                  disabled={isViewingToday}
                  aria-label={t("staffAttendance.nextDay")}
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-gray-500 hover:bg-gray-100 active:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              {!isViewingToday && (
                <button
                  type="button"
                  onClick={() => setHistoryDateInput(todayInputMax)}
                  className="shrink-0 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100 active:bg-primary-200 transition-colors"
                >
                  {t("staffAttendance.today")}
                </button>
              )}
              <input
                ref={dateInputRef}
                type="date"
                max={todayInputMax}
                value={historyDateInput}
                onChange={(e) => setHistoryDateInput(e.target.value)}
                className="sr-only"
                aria-hidden="true"
              />
            </div>
          );
        })()}

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <input
            type="text"
            placeholder={t("staffAttendance.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-w-0 max-w-4xl flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
          {editMode && students.length > 0 && (
            <BulkActionsMenu
              markAllPresent={markAllPresent}
              markAllAbsent={markAllAbsent}
              clearAll={clearAll}
              showFilterCount={!!searchQuery}
              filteredCount={filteredStudents.length}
              totalCount={students.length}
            />
          )}
        </div>

        {useLoader.getState().isLoadingByKey("getAttendanceDetails") && (
          <Shimmer variant="card-list" count={10} />
        )}

        {!isLoadingAttendance && students.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">{t("staffAttendance.noStudentsFound")}</div>
          </div>
        )}

        {!isLoadingAttendance && !editMode && noAttendanceFound && students.length > 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-md">
              <div className="mb-4">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
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
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("staffAttendance.noAttendanceRecorded")}</h3>
              <p className="text-gray-600">
                {t("staffAttendance.notMarkedForDate")}
              </p>
            </div>
          </div>
        )}

        {!isLoadingAttendance && students.length > 0 && (editMode || !noAttendanceFound) && (
          <>
            <div className={editMode ? "hidden" : ""}>
              <AttendanceSummary total={students.length} absent={absentCount} present={presentCount} />
              {!readOnly && submittedAttendanceData?.is_attendance_taken && isToday(selectedDate) && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-success-200 bg-success-50 px-4 py-2.5 dark:border-success-800 dark:bg-success-950">
                  <div className="flex items-center gap-2 text-sm font-medium text-success-700 dark:text-success-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {t("staffAttendance.attendanceSubmitted")}
                  </div>
                  <Button variant="secondary" className="h-8 gap-1.5 px-3 text-xs" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                    {t("common.edit")}
                  </Button>
                </div>
              )}
            </div>

            <div className="hidden min-h-0 flex-1 overflow-hidden md:flex md:flex-col md:gap-2">
              <div className="min-h-0 flex-1 overflow-hidden">
                <DesktopListing
                  attendance={attendance}
                  markAttendance={markAttendance}
                  STUDENTS={filteredStudents}
                  editMode={editMode}
                  onStudentClick={readOnly ? setSelectedStudentForHistory : undefined}
                />
              </div>
              {editMode && (
                <div className="shrink-0">
                  <div className="mx-auto flex max-w-2xl flex-col gap-2">
                    <div>
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-gray-500">
                        <span>{t("staffAttendance.progress")}</span>
                        <span className="font-medium tabular-nums text-gray-700">
                          {Object.keys(attendance).length} / {students.length}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-primary-600 transition-all duration-300 ease-out"
                          style={{
                            width: `${(Object.keys(attendance).length / students.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full"
                      disabled={Object.keys(attendance).length === 0}
                      onClick={() => setShowConfirmation(true)}
                    >
                      {t("staffAttendance.submitAttendance")}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-hidden md:hidden">
              <MobileListing
                STUDENTS={filteredStudents}
                attendance={attendance}
                markAttendance={markAttendance}
                editMode={editMode}
                onStudentClick={readOnly ? setSelectedStudentForHistory : undefined}
                className={editMode ? "pb-[9.5rem]" : "pb-20"}
              />
            </div>

            {editMode && (
              <div className="fixed bottom-14 left-0 right-0 z-[45] flex flex-col gap-2 border-t border-border bg-[var(--color-surface)] px-3 py-2 pb-[max(2rem,env(safe-area-inset-bottom,0px))] shadow-[0_-2px_10px_rgba(0,0,0,0.06)] md:hidden">
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs text-gray-500">
                    <span>{t("staffAttendance.progress")}</span>
                    <span className="tabular-nums font-medium text-gray-800">
                      {Object.keys(attendance).length} / {students.length}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-primary-600 transition-all duration-200 ease-out"
                      style={{
                        width: `${(Object.keys(attendance).length / students.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <Button
                  variant="primary"
                  className="w-full text-sm"
                  disabled={Object.keys(attendance).length < students.length}
                  onClick={() => setShowConfirmation(true)}
                >
                  {t("staffAttendance.submitAttendance")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <StudentHistoryModal
        student={selectedStudentForHistory}
        sectionId={selectedClass}
        termStart={campus?.term_start_date}
        termEnd={campus?.term_end_date}
        onClose={() => setSelectedStudentForHistory(null)}
      />
    </div>
  );
}
