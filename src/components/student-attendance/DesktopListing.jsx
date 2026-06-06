import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Table } from "../../ui-components";

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

function StatusCell({ status, halfDayType }) {
  const { t } = useTranslation();

  let badge;
  if (status === "PRESENT") {
    badge = <Badge variant="success">{t("studentAttendance.present")}</Badge>;
  } else if (status === "ABSENT") {
    badge = <Badge variant="error">{t("studentAttendance.absent")}</Badge>;
  } else if (status === "LATE") {
    badge = <Badge variant="warning">{t("studentAttendance.late")}</Badge>;
  } else if (status === "ON_LEAVE") {
    badge = <Badge variant="info">{t("studentAttendance.onLeave")}</Badge>;
  } else if (status === "HALF_DAY") {
    badge = <Badge variant="warning">{t("studentAttendance.halfDay")}</Badge>;
  } else {
    badge = <Badge variant="default">{t("common.statusUnknown", { status: String(status ?? "") })}</Badge>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {badge}
      {status === "HALF_DAY" && halfDayType && (
        <span className="text-xs text-warning-600 font-medium">
          {halfDayType === "FIRST"
            ? t("studentAttendance.presentFirstHalf")
            : t("studentAttendance.presentSecondHalf")}
        </span>
      )}
    </div>
  );
}

export default function DesktopListing({ attendanceRecords }) {
  const { t, i18n } = useTranslation();

  const columns = useMemo(
    () => [
      {
        key: "date",
        label: t("studentAttendance.colDate"),
        render: (row) => (
          <div className="font-medium">{formatDate(new Date(row.date), i18n.language)}</div>
        ),
      },
      {
        key: "day",
        label: t("studentAttendance.colDay"),
        render: (row) => (
          <div className="text-gray-600">
            {new Date(row.date).toLocaleDateString(i18n.language || undefined, { weekday: "long" })}
          </div>
        ),
      },
      {
        key: "period",
        label: t("studentAttendance.colPeriod"),
        render: (row) => (
          <div className="text-gray-600">{formatPeriodLabel(row.period, t)}</div>
        ),
      },
      {
        key: "status",
        label: t("studentAttendance.colStatus"),
        render: (row) => <StatusCell status={row.status} halfDayType={row.half_day_type} />,
      },
      {
        key: "markedBy",
        label: t("studentAttendance.colMarkedBy"),
        render: (row) => (
          <div className="text-gray-600">{row.markedBy || t("common.na")}</div>
        ),
      },
    ],
    [t, i18n.language]
  );

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
