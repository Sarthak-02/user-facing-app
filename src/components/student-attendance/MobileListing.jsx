import { useTranslation } from "react-i18next";
import { Badge, Card } from "../../ui-components";

function formatPeriodLabel(period, t) {
  if (!period) return "";
  if (period === "OVERALL") return t("studentAttendance.periodOverall");
  const m = String(period).match(/^PERIOD_(\d+)$/);
  if (m) return t("studentAttendance.periodNumber", { number: m[1] });
  return String(period);
}

function formatDate(date, locale) {
  if (!date) return "";
  const dayOfWeek = date.toLocaleDateString(locale || undefined, { weekday: "short" });
  const formattedDate = date.toLocaleDateString(locale || undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${formattedDate} (${dayOfWeek})`;
}

function StatusBadge({ status }) {
  const { t } = useTranslation();
  if (status === "PRESENT") {
    return <Badge variant="success">{t("studentAttendance.present")}</Badge>;
  }
  if (status === "ABSENT") {
    return <Badge variant="error">{t("studentAttendance.absent")}</Badge>;
  }
  if (status === "LATE") {
    return <Badge variant="warning">{t("studentAttendance.late")}</Badge>;
  }
  if (status === "ON_LEAVE") {
    return <Badge variant="info">{t("studentAttendance.onLeave")}</Badge>;
  }
  return <Badge variant="default">{t("common.statusUnknown", { status: String(status ?? "") })}</Badge>;
}

export default function MobileListing({ attendanceRecords }) {
  const { t, i18n } = useTranslation();

  return (
    <div className="md:hidden h-full overflow-y-auto space-y-3 pb-26">
      {attendanceRecords.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            {t("studentAttendance.noRecordsForPeriod")}
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
                    {formatDate(new Date(record.date), i18n.language)}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {new Date(record.date).toLocaleDateString(i18n.language || undefined, {
                      weekday: "long",
                    })}
                  </div>
                </div>
                <StatusBadge status={record.status} />
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-500">{t("studentAttendance.colPeriod")}</div>
                  <div className="text-sm font-medium text-gray-900 mt-0.5">
                    {formatPeriodLabel(record.period, t)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t("studentAttendance.colMarkedBy")}</div>
                  <div className="text-sm font-medium text-gray-900 mt-0.5">
                    {record.markedBy || t("common.na")}
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
