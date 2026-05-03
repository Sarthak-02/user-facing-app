import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, Modal, Shimmer } from "../../ui-components";
import AttendanceSummary from "../student-attendance/AttendanceSummary";
import AttendanceCalendar from "../student-attendance/AttendanceCalendar";
import { getStudentAttendance } from "../../api/attendance.api";

export default function StudentHistoryModal({ student, sectionId, termStart, termEnd, onClose }) {
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    if (!student) return;
    setLoading(true);
    setError(null);
    setRecords([]);
    setSummary({ total: 0, present: 0, absent: 0 });
    setStatusFilter("ALL");

    getStudentAttendance({
      student_id: student.student_id,
      section_id: sectionId,
      start_date: termStart,
      end_date: termEnd,
    })
      .then((response) => {
        if (response?.data) {
          const transformed = (response.data.records ?? []).map((record) => {
            const teacherName = record.attendanceSession?.teacher
              ? `${record.attendanceSession.teacher.teacher_first_name} ${record.attendanceSession.teacher.teacher_last_name}`
              : t("common.na");
            const date = record.attendanceSession?.submittedAt
              ? new Date(record.attendanceSession.submittedAt).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0];
            return {
              date,
              period: record.attendanceSession?.period || "OVERALL",
              status: record.status,
              markedBy: teacherName,
            };
          });
          setRecords(transformed);
          setSummary(response.data.summary ?? { total: 0, present: 0, absent: 0 });
        }
      })
      .catch((err) => {
        setError(err.message || t("studentAttendance.loadFailed"));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [student, sectionId, termStart, termEnd, t]);

  const filteredRecords = useMemo(() => {
    if (statusFilter === "ALL") return records;
    return records.filter((r) => r.status === statusFilter);
  }, [records, statusFilter]);

  return (
    <Modal
      open={Boolean(student)}
      onClose={onClose}
      className="max-h-[90vh] max-w-2xl overflow-y-auto"
    >
      {student && (
        <div className="flex flex-col gap-4 pr-6 pt-1">
          <div className="flex items-center gap-3">
            <Avatar src={student.photoUrl} name={student.name} size={40} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
              <p className="text-sm text-gray-500">
                {t("attendance.rollNo", { rollNo: student.roll_number })}
              </p>
            </div>
          </div>

          {loading && <Shimmer variant="card-list" count={4} />}

          {!loading && error && (
            <p className="py-8 text-center text-sm text-error-600">{error}</p>
          )}

          {!loading && !error && (
            <>
              <AttendanceSummary
                total={summary.total}
                present={summary.present}
                absent={summary.absent}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
              />
              {filteredRecords.length > 0 ? (
                <AttendanceCalendar attendanceRecords={filteredRecords} />
              ) : (
                <p className="py-8 text-center text-sm text-gray-500">
                  {t("studentAttendance.noRecordsFound")}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
