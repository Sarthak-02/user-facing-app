import clsx from "clsx";
import { ChevronRight, Clock, MoreHorizontal, UserCheck, UserX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, Badge, Card } from "../../ui-components";

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

function HalfDayMenu({ status, onFirstHalf, onSecondHalf }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const isHalfDay = status === "FIRST_HALF" || status === "SECOND_HALF";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className={clsx(
          "flex items-center justify-center rounded-lg border p-1.5 transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-warning-500",
          isHalfDay
            ? "border-warning-400 bg-warning-100 text-warning-700"
            : "border-border bg-surface text-gray-400 hover:bg-gray-50 hover:text-gray-600"
        )}
        aria-label="Half day options"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[172px] rounded-lg border border-border bg-surface shadow-lg">
          <button
            onClick={(e) => { e.stopPropagation(); onFirstHalf(); setOpen(false); }}
            className={clsx(
              "flex w-full items-center gap-2 rounded-t-lg px-3 py-2.5 text-sm font-medium transition hover:bg-warning-50 hover:text-warning-700",
              status === "FIRST_HALF" ? "bg-warning-50 text-warning-700" : "text-gray-700"
            )}
          >
            <Clock className="h-4 w-4 shrink-0" />
            {t("attendance.firstHalf")}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSecondHalf(); setOpen(false); }}
            className={clsx(
              "flex w-full items-center gap-2 rounded-b-lg px-3 py-2.5 text-sm font-medium transition hover:bg-warning-50 hover:text-warning-700",
              status === "SECOND_HALF" ? "bg-warning-50 text-warning-700" : "text-gray-700"
            )}
          >
            <Clock className="h-4 w-4 shrink-0" />
            {t("attendance.secondHalf")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function MobileListing({ STUDENTS, attendance, markAttendance, editMode, onStudentClick, className }) {
  const { t } = useTranslation();
  return (
    <div className={clsx("h-full space-y-3 overflow-y-auto", className)}>
      {STUDENTS.map((student) => {
        const status = attendance[student.student_id];
        const clickable = Boolean(onStudentClick);

        return (
          <Card
            key={student.student_id}
            className={clickable ? "cursor-pointer hover:shadow-md active:scale-[0.99] transition-all duration-150" : ""}
            onClick={clickable ? () => onStudentClick(student) : undefined}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar src={student.photoUrl} name={student.name} />
                <div>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-gray-500">{t("attendance.rollNo", { rollNo: student.roll_number })}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {status ? (
                  <Badge variant={badgeVariant(status)}>{displayAttendanceMark(status, t)}</Badge>
                ) : (
                  <Badge variant="info">{t("attendance.notMarked")}</Badge>
                )}
                {editMode && (
                  <HalfDayMenu
                    status={status}
                    onFirstHalf={() => markAttendance(student.student_id, "FIRST_HALF")}
                    onSecondHalf={() => markAttendance(student.student_id, "SECOND_HALF")}
                  />
                )}
                {clickable && <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
              </div>
            </div>

            {editMode && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => markAttendance(student.student_id, "ABSENT")}
                  className={clsx(
                    "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1",
                    status === "ABSENT"
                      ? "bg-error-600 text-white focus:ring-error-600"
                      : "border border-border bg-surface text-gray-700 hover:border-error-300 hover:bg-error-50 hover:text-error-700 focus:ring-error-600"
                  )}
                >
                  <UserX className="h-4 w-4" />
                  {t("attendance.absent")}
                </button>
                <button
                  onClick={() => markAttendance(student.student_id, "PRESENT")}
                  className={clsx(
                    "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1",
                    status === "PRESENT"
                      ? "bg-success-600 text-white focus:ring-success-600"
                      : "border border-border bg-surface text-gray-700 hover:border-success-300 hover:bg-success-50 hover:text-success-700 focus:ring-success-600"
                  )}
                >
                  <UserCheck className="h-4 w-4" />
                  {t("attendance.present")}
                </button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
