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

  const cardBase = "!p-2 sm:!p-2.5 !shadow-sm rounded-lg leading-tight";

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
      <Card
        className={`${cardBase} cursor-pointer transition-all hover:shadow ${
          statusFilter === "ALL"
            ? "border border-blue-500 ring-1 ring-blue-500"
            : "border border-transparent"
        }`}
        onClick={() => onStatusFilterChange("ALL")}
      >
        <div className="text-[10px] font-medium text-gray-500 sm:text-[11px]">
          Total
        </div>
        <div className="text-base font-semibold tabular-nums sm:text-lg">{total}</div>
      </Card>

      <Card
        className={`${cardBase} cursor-pointer transition-all hover:shadow ${
          statusFilter === "PRESENT"
            ? "border border-blue-500 ring-1 ring-blue-500"
            : "border border-transparent"
        }`}
        onClick={() => onStatusFilterChange("PRESENT")}
      >
        <div className="text-[10px] font-medium text-gray-500 sm:text-[11px]">
          Present
        </div>
        <div className="text-base font-semibold tabular-nums text-success-600 sm:text-lg">
          {present}
        </div>
      </Card>

      <Card
        className={`${cardBase} cursor-pointer transition-all hover:shadow ${
          statusFilter === "ABSENT"
            ? "border border-blue-500 ring-1 ring-blue-500"
            : "border border-transparent"
        }`}
        onClick={() => onStatusFilterChange("ABSENT")}
      >
        <div className="text-[10px] font-medium text-gray-500 sm:text-[11px]">
          Absent
        </div>
        <div className="text-base font-semibold tabular-nums text-error-600 sm:text-lg">
          {absent}
        </div>
      </Card>

      <Card className={`${cardBase} border border-border`}>
        <div className="text-[10px] font-medium text-gray-500 sm:text-[11px]">
          Rate
        </div>
        <div className="text-base font-semibold tabular-nums text-primary-600 sm:text-lg">
          {presentPercentage}%
        </div>
      </Card>
    </div>
  );
}
