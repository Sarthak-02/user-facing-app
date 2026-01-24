import { Card } from "../../ui-components";

export default function AttendanceSummary({ 
  total, 
  present, 
  absent, 
  onLeave, 
  statusFilter, 
  onStatusFilterChange 
}) {
  const presentPercentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${
          statusFilter === "ALL" ? "border-2 border-blue-500 shadow-lg" : "border-2 border-transparent"
        }`}
        onClick={() => onStatusFilterChange("ALL")}
      >
        <div className="text-xs text-gray-500">Total Days</div>
        <div className="text-xl font-semibold">{total}</div>
      </Card>

      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${
          statusFilter === "PRESENT" ? "border-2 border-blue-500 shadow-lg" : "border-2 border-transparent"
        }`}
        onClick={() => onStatusFilterChange("PRESENT")}
      >
        <div className="text-xs text-gray-500">Present</div>
        <div className="text-xl font-semibold text-success-600">{present}</div>
      </Card>

      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${
          statusFilter === "ABSENT" ? "border-2 border-blue-500 shadow-lg" : "border-2 border-transparent"
        }`}
        onClick={() => onStatusFilterChange("ABSENT")}
      >
        <div className="text-xs text-gray-500">Absent</div>
        <div className="text-xl font-semibold text-error-600">{absent}</div>
      </Card>

      <Card>
        <div className="text-xs text-gray-500">Attendance %</div>
        <div className="text-xl font-semibold text-primary-600">
          {presentPercentage}%
        </div>
      </Card>
    </div>
  );
}
