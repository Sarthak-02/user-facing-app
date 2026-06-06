import { Card } from "../../ui-components";
import { CheckCircle2, XCircle, LayoutGrid, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AttendanceSummary({
  total,
  present,
  absent,
  halfDay = 0,
  attendancePercentage = "0",
  statusFilter,
  onStatusFilterChange
}) {
  const { t } = useTranslation();
  const pct = parseFloat(attendancePercentage) || 0;

  const rateColor = pct >= 75
    ? "text-success-600"
    : pct >= 50
    ? "text-amber-600"
    : "text-error-600";

  const rateBarColor = pct >= 75
    ? "bg-success-500"
    : pct >= 50
    ? "bg-amber-500"
    : "bg-error-500";

  const selectedRing = "border border-primary-500 ring-1 ring-primary-500";
  const unselectedBorder = "border border-transparent";

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {/* Total */}
      <Card
        className={`!p-2 sm:!p-3 !shadow-sm rounded-xl cursor-pointer transition-all hover:shadow-md bg-gray-50 ${
          statusFilter === "ALL" ? selectedRing : unselectedBorder
        }`}
        onClick={() => onStatusFilterChange("ALL")}
      >
        <div className="flex items-center gap-1 mb-1">
          <LayoutGrid className="h-3 w-3 text-gray-400 shrink-0" />
          <span className="text-[10px] font-medium text-gray-500 sm:text-[11px]">
            {t("studentAttendance.summaryTotal")}
          </span>
        </div>
        <div className="text-base font-bold tabular-nums text-gray-800 sm:text-xl">{total}</div>
      </Card>

      {/* Present */}
      <Card
        className={`!p-2 sm:!p-3 !shadow-sm rounded-xl cursor-pointer transition-all hover:shadow-md bg-success-50 ${
          statusFilter === "PRESENT" ? selectedRing : unselectedBorder
        }`}
        onClick={() => onStatusFilterChange("PRESENT")}
      >
        <div className="flex items-center gap-1 mb-1">
          <CheckCircle2 className="h-3 w-3 text-success-500 shrink-0" />
          <span className="text-[10px] font-medium text-gray-500 sm:text-[11px]">
            {t("studentAttendance.present")}
          </span>
        </div>
        <div className="text-base font-bold tabular-nums text-success-600 sm:text-xl">
          {present + halfDay * 0.5}
        </div>
      </Card>

      {/* Absent */}
      <Card
        className={`!p-2 sm:!p-3 !shadow-sm rounded-xl cursor-pointer transition-all hover:shadow-md bg-error-50 ${
          statusFilter === "ABSENT" ? selectedRing : unselectedBorder
        }`}
        onClick={() => onStatusFilterChange("ABSENT")}
      >
        <div className="flex items-center gap-1 mb-1">
          <XCircle className="h-3 w-3 text-error-500 shrink-0" />
          <span className="text-[10px] font-medium text-gray-500 sm:text-[11px]">
            {t("studentAttendance.absent")}
          </span>
        </div>
        <div className="text-base font-bold tabular-nums text-error-600 sm:text-xl">
          {absent + halfDay * 0.5}
        </div>
      </Card>

      {/* Rate */}
      <Card className="!p-2 sm:!p-3 !shadow-sm rounded-xl border border-border">
        <div className="flex items-center gap-1 mb-1">
          <TrendingUp className="h-3 w-3 text-primary-400 shrink-0" />
          <span className="text-[10px] font-medium text-gray-500 sm:text-[11px]">
            {t("studentAttendance.summaryRate")}
          </span>
        </div>
        <div className={`text-base font-bold tabular-nums sm:text-xl ${rateColor}`}>
          {pct}%
        </div>
        <div className="mt-1.5 h-1 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${rateBarColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </Card>
    </div>
  );
}
