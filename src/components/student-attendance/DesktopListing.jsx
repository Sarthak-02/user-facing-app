import { Badge, Table } from "../../ui-components";

function formatDate(date) {
  if (!date) return "";
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${formattedDate} (${dayOfWeek})`;
}

function StatusBadge({ status }) {
  if (status === "PRESENT") {
    return <Badge variant="success">Present</Badge>;
  } else if (status === "ABSENT") {
    return <Badge variant="error">Absent</Badge>;
  } else if (status === "LATE") {
    return <Badge variant="warning">Late</Badge>;
  } else if (status === "ON_LEAVE") {
    return <Badge variant="info">On Leave</Badge>;
  }
  return <Badge variant="default">{status}</Badge>;
}

export default function DesktopListing({ attendanceRecords }) {
  const columns = [
    {
      key: "date",
      label: "Date",
      render: (row) => (
        <div className="font-medium">{formatDate(new Date(row.date))}</div>
      ),
    },
    {
      key: "day",
      label: "Day",
      render: (row) => (
        <div className="text-gray-600">
          {new Date(row.date).toLocaleDateString("en-US", { weekday: "long" })}
        </div>
      ),
    },
    {
      key: "period",
      label: "Period",
      render: (row) => (
        <div className="text-gray-600">
          {row.period === "OVERALL" 
            ? "Overall" 
            : row.period.replace("PERIOD_", "Period ")}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "markedBy",
      label: "Marked By",
      render: (row) => (
        <div className="text-gray-600">{row.markedBy || "N/A"}</div>
      ),
    },
  ];

  return (
    <div className="hidden md:block h-full">
      <Table
        columns={columns}
        data={attendanceRecords}
        maxHeight="calc(100vh - 320px)"
      />
    </div>
  );
}
