import clsx from "clsx";
import { Clock, History, MoreHorizontal, UserCheck, UserX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, Badge, Table } from "../../ui-components";

function displayAttendanceMark(status, t) {
  if (status === "PRESENT") return t("attendance.present");
  if (status === "ABSENT") return t("attendance.absent");
  if (status === "FIRST_HALF") return t("attendance.firstHalf");
  if (status === "SECOND_HALF") return t("attendance.secondHalf");
  return t("common.statusUnknown", { status: String(status) });
}

function badgeVariant(status) {
  if (status === "PRESENT") return "success";
  if (status === "ABSENT") return "error";
  if (status === "FIRST_HALF" || status === "SECOND_HALF") return "warning";
  return "error";
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

function AttendanceButtons({ status, onPresent, onAbsent, onFirstHalf, onSecondHalf }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const isHalfDay = status === "FIRST_HALF" || status === "SECOND_HALF";

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
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className={clsx(
            "inline-flex items-center justify-center rounded-lg border px-2 py-1.5 transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-warning-500",
            isHalfDay
              ? "border-warning-400 bg-warning-100 text-warning-700"
              : "border-border bg-surface text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          )}
          aria-label="Half day options"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[172px] rounded-lg border border-border bg-surface shadow-lg">
            <button
              onClick={() => { onFirstHalf(); setMenuOpen(false); }}
              className={clsx(
                "flex w-full items-center gap-2 rounded-t-lg px-3 py-2 text-xs font-medium transition hover:bg-warning-50 hover:text-warning-700",
                status === "FIRST_HALF" ? "bg-warning-50 text-warning-700" : "text-gray-700"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              {t("attendance.firstHalf")}
            </button>
            <button
              onClick={() => { onSecondHalf(); setMenuOpen(false); }}
              className={clsx(
                "flex w-full items-center gap-2 rounded-b-lg px-3 py-2 text-xs font-medium transition hover:bg-warning-50 hover:text-warning-700",
                status === "SECOND_HALF" ? "bg-warning-50 text-warning-700" : "text-gray-700"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              {t("attendance.secondHalf")}
            </button>
          </div>
        )}
      </div>
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
          <Badge variant={badgeVariant(status)}>{displayAttendanceMark(status, t)}</Badge>
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
                onFirstHalf={() => markAttendance(row.student_id, "FIRST_HALF")}
                onSecondHalf={() => markAttendance(row.student_id, "SECOND_HALF")}
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
