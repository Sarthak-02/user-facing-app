import { Avatar, Badge, Card, Button } from "../../ui-components";

export default function MobileListing({
  STUDENTS,
  attendance,
  markAttendance,
  editMode,
}) {
  return (
    <div className="h-full overflow-y-auto space-y-3 pb-32">
      {STUDENTS.map((student) => {
        const status = attendance[student.student_id];

        return (
          <Card key={student.student_id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar src={student.photoUrl} name={student.name} />

                <div>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-gray-500">
                    Roll No: {student.roll_number}
                  </div>
                </div>
              </div>

              {status ? (
                <Badge variant={status === "PRESENT" ? "success" : "error"}>
                  {status}
                </Badge>
              ) : (
                <Badge variant="info">Not Marked</Badge>
              )}
            </div>
            {editMode && (
              <div className="mt-3 flex gap-2">
                <Button
                  variant={status === "PRESENT" ? "success" : "secondary"}
                  className="flex-1"
                  onClick={() => markAttendance(student.student_id, "PRESENT")}
                >
                  {status === "PRESENT" && "✓ "}Present
                </Button>

                <Button
                  variant={status === "ABSENT" ? "danger" : "secondary"}
                  className="flex-1"
                  onClick={() => markAttendance(student.student_id, "ABSENT")}
                >
                  {status === "ABSENT" && "✓ "}Absent
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
