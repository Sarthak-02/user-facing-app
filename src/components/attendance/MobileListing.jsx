import { Avatar, Badge, Card, Button } from "../../ui-components";

export default function MobileListing({
  STUDENTS,
  attendance,
  markAttendance,
  editMode,
}) {
  return (
    <div className="md:hidden flex-1 overflow-y-auto space-y-3 pb-24 mb-20">
      {STUDENTS.map((student) => {
        const status = attendance[student.id];

        return (
          <Card key={student.id}>
            <div className="flex items-center justify-between">
              {/* <div>
                  <div className="font-medium">
                    {student.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    Roll No: {student.roll}
                  </div>
                </div> */}
              <div className="flex items-center gap-3">
                <Avatar src={student.photoUrl} name={student.name} />

                <div>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-gray-500">
                    Roll No: {student.roll}
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
                  variant="primary"
                  className="flex-1"
                  onClick={() => markAttendance(student.id, "PRESENT")}
                >
                  Present
                </Button>

                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => markAttendance(student.id, "ABSENT")}
                >
                  Absent
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
