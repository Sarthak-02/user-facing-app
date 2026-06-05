import { Card } from "../../ui-components";
import { useTranslation } from "react-i18next";


export default function AttendanceSummary({
  total,
  present,
  absent,
  halfDay = 0,
}) {
  const { t } = useTranslation();
  return (
    <div className={`grid gap-3 ${halfDay > 0 ? "grid-cols-4" : "grid-cols-3"}`}>
      <Card>
        <div className="text-xs text-gray-500">
          {t("attendance.summary.total")}
        </div>
        <div className="text-xl font-semibold">
          {total}
        </div>
      </Card>

      <Card>
        <div className="text-xs text-gray-500">
          {t("attendance.summary.present")}
        </div>
        <div className="text-xl font-semibold text-success-600">
          {present}
        </div>
      </Card>

      <Card>
        <div className="text-xs text-gray-500">
          {t("attendance.summary.absent")}
        </div>
        <div className="text-xl font-semibold text-error-600">
          {absent}
        </div>
      </Card>

      {halfDay > 0 && (
        <Card>
          <div className="text-xs text-gray-500">
            {t("attendance.summary.halfDay")}
          </div>
          <div className="text-xl font-semibold text-warning-600">
            {halfDay}
          </div>
        </Card>
      )}
    </div>
  );
}
