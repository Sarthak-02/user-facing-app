import { Card } from "../../ui-components";
import { useTranslation } from "react-i18next";


export default function AttendanceSummary({
  total,
  present,
  absent,
}) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-3 gap-3">
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
    </div>
  );
}
