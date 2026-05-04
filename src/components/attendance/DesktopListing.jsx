import clsx from "clsx";
import { History, UserCheck, UserX } from "lucide-react";
import { Avatar, Badge, Table } from "../../ui-components";
import { useTranslation } from "react-i18next";

function displayAttendanceMark(status, t) {
  if (status === "PRESENT") return t("attendance.present");
  if (status === "ABSENT") return t("attendance.absent");
  return t("common.statusUnknown", { status: String(status) });
}

function StudentCell({ student }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3">
      <Avatar src={student.photoUrl} name={student.name} size={32} />
      <div className="leading-tight">
        <div className="font-medium">{student.name}</div>
        <div className="text-xs text-gray-500">{t("attendance.rollNo", { rollNo: student.roll_number })}</div>
      </div>
    </div>
  );
}

function AttendanceButtons({ status, onPresent, onAbsent }) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2">
      <button
        onClick={onPresent}
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1",
          status === "PRESENT"
            ? "bg-success-600 text-white focus:ring-success-600"
            : "border border-border bg-surface text-gray-700 hover:border-success-300 hover:bg-success-50 hover:text-success-700 focus:ring-success-600"
        )}
      >
        <UserCheck className="h-3.5 w-3.5" />
        {t("attendance.present")}
      </button>
      <button
        onClick={onAbsent}
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1",
          status === "ABSENT"
            ? "bg-error-600 text-white focus:ring-error-600"
            : "border border-border bg-surface text-gray-700 hover:border-error-300 hover:bg-error-50 hover:text-error-700 focus:ring-error-600"
        )}
      >
        <UserX className="h-3.5 w-3.5" />
        {t("attendance.absent")}
      </button>
    </div>
  );
}

export default function DesktopListing({ attendance, markAttendance, STUDENTS, editMode, onStudentClick }) {
  const { t } = useTranslation();
  const columns = [
    {
      key: "student",
      label: t("attendance.columns.student"),
      render: (row) => <StudentCell student={row} />,
    },
    {
      key: "status",
      label: t("attendance.columns.status"),
      render: (row) => {
        const status = attendance[row.student_id];
        return status ? (
          <Badge variant={status === "PRESENT" ? "success" : "error"}>{displayAttendanceMark(status, t)}</Badge>
        ) : (
          <Badge variant="info">{t("attendance.notMarked")}</Badge>
        );
      },
    },
    ...(editMode
      ? [
          {
            key: "action",
            label: t("attendance.columns.action"),
            render: (row) => (
              <AttendanceButtons
                status={attendance[row.student_id]}
                onPresent={() => markAttendance(row.student_id, "PRESENT")}
                onAbsent={() => markAttendance(row.student_id, "ABSENT")}
              />
            ),
          },
        ]
      : []),
    ...(onStudentClick
      ? [
          {
            key: "history",
            label: "",
            render: (row) => (
              <button
                type="button"
                onClick={() => onStudentClick(row)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <History className="h-3.5 w-3.5" />
                {t("staffAttendance.viewHistory")}
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="h-full">
      <Table columns={columns} data={STUDENTS} maxHeight="100%" />
    </div>
  );
}
