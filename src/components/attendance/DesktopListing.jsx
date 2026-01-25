import { Avatar, Badge, Button, Table } from "../../ui-components";

function StudentCell({ student }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar src={student.photoUrl} name={student.name} size={32} />

      <div className="leading-tight">
        <div className="font-medium">{student.name}</div>
        <div className="text-xs text-gray-500">Roll No: {student.roll_number}</div>
      </div>
    </div>
  );
}

export default function DesktopListing({
  attendance,
  markAttendance,
  STUDENTS,
  editMode,
}) {
  const columns = [
    {
      key: "student",
      label: "Student",
      render: (row) => <StudentCell student={row} />,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const status = attendance[row.student_id];

        return status ? (
          <Badge variant={status === "PRESENT" ? "success" : "error"}>
            {status}
          </Badge>
        ) : (
          <Badge variant="info">Not Marked</Badge>
        );
      },
    },
    ...(editMode
      ? [
          {
            key: "action",
            label: "Action",
            render: (row) => {
              const status = attendance[row.student_id];
              
              return (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={status === "PRESENT" ? "success" : "secondary"}
                    onClick={() => markAttendance(row.student_id, "PRESENT")}
                  >
                    {status === "PRESENT" && "✓ "}Present
                  </Button>

                  <Button
                    size="sm"
                    variant={status === "ABSENT" ? "danger" : "secondary"}
                    onClick={() => markAttendance(row.id, "ABSENT")}
                  >
                    {status === "ABSENT" && "✓ "}Absent
                  </Button>
                </div>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <div className="hidden md:block h-full">
      <Table columns={columns} data={STUDENTS} maxHeight="calc(100vh - 360px)" />
    </div>
  );
}
