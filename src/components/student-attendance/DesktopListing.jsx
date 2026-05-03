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

export default function DesktopListing({ attendanceRecords }) {
  const { t } = useTranslation();

  const columns = useMemo(
    () => [
      {
        key: "date",
        label: t("studentAttendance.colDate"),
        render: (row) => (
          <div className="font-medium">{formatDate(new Date(row.date))}</div>
        ),
      },
      {
        key: "day",
        label: t("studentAttendance.colDay"),
        render: (row) => (
          <div className="text-gray-600">
            {new Date(row.date).toLocaleDateString("en-US", { weekday: "long" })}
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
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "markedBy",
        label: t("studentAttendance.colMarkedBy"),
        render: (row) => (
          <div className="text-gray-600">{row.markedBy || t("common.na")}</div>
        ),
      },
    ],
    [t]
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
