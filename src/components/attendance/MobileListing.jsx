import clsx from "clsx";
import { UserCheck, UserX } from "lucide-react";
import { Avatar, Badge, Card } from "../../ui-components";

export default function MobileListing({ STUDENTS, attendance, markAttendance, editMode }) {
  return (
    <div
      className={clsx(
        "h-full space-y-3 overflow-y-auto",
        editMode ? "pb-[9.5rem]" : "pb-20"
      )}
    >
      {STUDENTS.map((student) => {
        const status = attendance[student.student_id];

        return (
          <Card key={student.student_id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar src={student.photoUrl} name={student.name} />
                <div>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-gray-500">Roll No: {student.roll_number}</div>
                </div>
              </div>
              {status ? (
                <Badge variant={status === "PRESENT" ? "success" : "error"}>{status}</Badge>
              ) : (
                <Badge variant="info">Not Marked</Badge>
              )}
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
                  Absent
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
                  Present
                </button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
