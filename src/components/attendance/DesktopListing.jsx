import { Avatar, Badge, Button, Table } from "../../ui-components";

function StudentCell({ student }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar src={student.photoUrl} name={student.name} size={32} />

      <div className="leading-tight">
        <div className="font-medium">{student.name}</div>
        <div className="text-xs text-gray-500">Roll No: {student.roll}</div>
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
        const status = attendance[row.id];

        return status ? (
          <Badge variant={status === "PRESENT" ? "success" : "error"}>
            {status}
          </Badge>
        ) : (
          <Badge variant="info">Not Marked</Badge>
        );
      },
    },
    {
      key: "action",
      label: "Action",
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => markAttendance(row.id, "PRESENT")}>
            Present
          </Button>

          <Button
            size="sm"
            variant="danger"
            onClick={() => markAttendance(row.id, "ABSENT")}
          >
            Absent
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="hidden md:block">
      <Table columns={columns} data={STUDENTS} maxHeight="65vh" />
    </div>
  );
}
