import { Badge, Card } from "../../ui-components";

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

export default function MobileListing({ attendanceRecords }) {
  return (
    <div className="md:hidden h-full overflow-y-auto space-y-3 pb-26">
      {attendanceRecords.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            No attendance records found for the selected period.
          </div>
        </Card>
      ) : (
        attendanceRecords.map((record, index) => (
          <Card key={index}>
            <div className="space-y-3">
              {/* Date and Status row */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    {formatDate(new Date(record.date))}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {new Date(record.date).toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                  </div>
                </div>
                <StatusBadge status={record.status} />
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-500">Period</div>
                  <div className="text-sm font-medium text-gray-900 mt-0.5">
                    {record.period === "OVERALL"
                      ? "Overall"
                      : record.period.replace("PERIOD_", "Period ")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Marked By</div>
                  <div className="text-sm font-medium text-gray-900 mt-0.5">
                    {record.markedBy || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
