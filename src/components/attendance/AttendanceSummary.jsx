import { Card } from "../../ui-components";


export default function AttendanceSummary({
  total,
  present,
  absent,
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card>
        <div className="text-xs text-gray-500">
          Total
        </div>
        <div className="text-xl font-semibold">
          {total}
        </div>
      </Card>

      <Card>
        <div className="text-xs text-gray-500">
          Present
        </div>
        <div className="text-xl font-semibold text-success-600">
          {present}
        </div>
      </Card>

      <Card>
        <div className="text-xs text-gray-500">
          Absent
        </div>
        <div className="text-xl font-semibold text-error-600">
          {absent}
        </div>
      </Card>
    </div>
  );
}
