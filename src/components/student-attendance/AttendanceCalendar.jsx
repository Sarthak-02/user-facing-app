import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, Button, Card, Modal } from "../../ui-components";
import { getFormattedDate } from "../../utils/common-functions";

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function normalizeStatus(status) {
  return String(status ?? "").toUpperCase();
}

/** Present count for the cell ratio. HALF_DAY counts as 0.5. */
function countPresentMarks(records) {
  return records.reduce((sum, r) => {
    const s = normalizeStatus(r.status);
    if (s === "PRESENT") return sum + 1;
    if (s === "HALF_DAY") return sum + 0.5;
    return sum;
  }, 0);
}

function countAbsentMarks(records) {
  return records.filter((r) => normalizeStatus(r.status) === "ABSENT").length;
}

/**
 * @returns {"allPresent" | "allAbsent" | "partial" | "other"}
 */
function dayAttendanceCategory(records) {
  if (!records.length) return "other";
  const total = records.length;
  const present = countPresentMarks(records);
  const absent = countAbsentMarks(records);
  if (present === total) return "allPresent";
  if (absent === total) return "allAbsent";
  if (present > 0 && present < total) return "partial";
  return "other";
}

/** Match student AttendanceSummary: Present uses text-success-600, Absent uses text-error-600. */
const RATIO_PILL_BY_CATEGORY = {
  allPresent:
    "border border-success-600/25 bg-success-100 text-success-600",
  allAbsent:
    "border border-error-600/25 bg-error-100 text-error-600",
  partial:
    "border border-amber-200/90 bg-amber-100 text-amber-950",
  other: "border border-gray-200/90 bg-gray-100 text-gray-800",
};

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
  if (status === "ON_LEAVE" || status === "EXCUSED") {
    return (
      <Badge variant="info">
        {status === "EXCUSED" ? t("attendanceCalendar.statusExcused") : t("attendanceCalendar.statusOnLeave")}
      </Badge>
    );
  }
  if (status === "HALF_DAY") {
    return <Badge variant="warning">{t("studentAttendance.halfDay")}</Badge>;
  }
  return <Badge variant="default">{t("common.statusUnknown", { status: String(status ?? "") })}</Badge>;
}

function formatPeriodLabel(period, t) {
  if (period === "OVERALL") return t("studentAttendance.periodOverall");
  if (period?.startsWith("PERIOD_")) {
    const num = period.split("_")[1];
    return t("studentAttendance.periodNumber", { number: num });
  }
  return period;
}

function formatHeaderDate(dateKey) {
  const d = dayjs(dateKey);
  if (!d.isValid()) return dateKey;
  return d.format("dddd, D MMMM YYYY");
}

export default function AttendanceCalendar({ attendanceRecords }) {
  const { t } = useTranslation();
  const [cursor, setCursor] = useState(() => dayjs().startOf("month"));
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  const recordsByDate = useMemo(() => {
    const map = new Map();
    for (const r of attendanceRecords) {
      const key = r.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    for (const [, list] of map) {
      list.sort((a, b) => {
        const pa = formatPeriodLabel(a.period, t);
        const pb = formatPeriodLabel(b.period, t);
        return pa.localeCompare(pb, undefined, { numeric: true });
      });
    }
    return map;
  }, [attendanceRecords, t]);

  const monthGrid = useMemo(() => {
    const start = cursor.startOf("month");
    const daysInMonth = start.daysInMonth();
    const leading = (start.day() + 6) % 7;
    const cells = [];

    for (let i = 0; i < leading; i++) {
      cells.push({ type: "padding" });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = start.date(d).toDate();
      const dateKey = getFormattedDate(date);
      cells.push({ type: "day", date, dateKey, dayNum: d });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ type: "padding" });
    }
    return cells;
  }, [cursor]);

  const selectedRecords = selectedDateKey
    ? recordsByDate.get(selectedDateKey) ?? []
    : [];
  const selectedPresent = countPresentMarks(selectedRecords);
  const selectedTotal = selectedRecords.length;
  const selectedCategory = dayAttendanceCategory(selectedRecords);

  const goPrev = () => setCursor((c) => c.subtract(1, "month"));
  const goNext = () => setCursor((c) => c.add(1, "month"));
  const goToday = () => setCursor(dayjs().startOf("month"));

  return (
    <>
      <Card className="flex flex-col gap-4 overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 px-2 py-2"
              onClick={goPrev}
              aria-label={t("attendanceCalendar.prevMonth")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="min-w-[10rem] text-center text-lg font-semibold text-gray-900">
              {cursor.format("MMMM YYYY")}
            </h2>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 px-2 py-2"
              onClick={goNext}
              aria-label={t("attendanceCalendar.nextMonth")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button type="button" variant="secondary" className="text-sm" onClick={goToday}>
            {t("attendanceCalendar.thisMonth")}
          </Button>
        </div>

        <div className="space-y-2 text-xs text-gray-600">
          {/* <p>
            Each day shows{" "}
            <span className="font-medium text-gray-800">present</span> /{" "}
            <span className="font-medium text-gray-800">total</span> marks (e.g.{" "}
            <span className="tabular-nums">3/4</span>). Tap a day for period details.
          </p> */}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-success-600" />
              {t("attendanceCalendar.legendAllPresent")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-error-600" />
              {t("attendanceCalendar.legendAllAbsent")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-amber-500" />
              {t("attendanceCalendar.legendPartial")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-gray-400" />
              {t("attendanceCalendar.legendOther")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px rounded-lg border border-border bg-border text-center text-xs font-medium text-gray-500">
          {WEEKDAY_KEYS.map((wd) => (
            <div key={wd} className="bg-surface py-2">
              {t(`home.weekdayShort.${wd}`)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px rounded-lg border border-border bg-border">
          {monthGrid.map((cell, idx) => {
            if (cell.type === "padding") {
              return (
                <div
                  key={`pad-${idx}`}
                  className="min-h-[4.5rem] bg-gray-50/80 sm:min-h-[5.5rem]"
                />
              );
            }

            const { dateKey, dayNum, date } = cell;
            const dayRecords = recordsByDate.get(dateKey) ?? [];
            const hasData = dayRecords.length > 0;
            const isTodayCell = dayjs(date).isSame(dayjs(), "day");
            const totalMarks = dayRecords.length;
            const presentMarks = countPresentMarks(dayRecords);
            const dayCategory = dayAttendanceCategory(dayRecords);
            const ratioPillClass = hasData
              ? RATIO_PILL_BY_CATEGORY[dayCategory]
              : "";

            return (
              <button
                key={dateKey}
                type="button"
                disabled={!hasData}
                onClick={() => hasData && setSelectedDateKey(dateKey)}
                className={[
                  "flex min-h-[4.5rem] flex-col items-stretch border border-transparent bg-surface p-1 text-left transition sm:min-h-[5.5rem] sm:p-1.5",
                  hasData
                    ? "cursor-pointer hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                    : "cursor-default opacity-60",
                  isTodayCell ? "ring-1 ring-inset ring-primary-400" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-xs font-semibold sm:text-sm",
                    isTodayCell ? "text-primary-700" : "text-gray-900",
                  ].join(" ")}
                >
                  {dayNum}
                </span>
                {hasData && (
                  <div className="mt-0.5 flex flex-1 flex-col justify-end gap-0.5 overflow-hidden">
                    <div
                      className={[
                        "rounded-md px-1 py-0.5 text-center tabular-nums text-xs font-semibold sm:text-sm",
                        ratioPillClass,
                      ].join(" ")}
                      title={t("attendanceCalendar.presentMarksTitle")}
                    >
                      {presentMarks}/{totalMarks}
                    </div>
                    {totalMarks > 1 && (
                      <div className="text-center text-[9px] leading-tight text-gray-500 sm:text-[10px]">
                        {t("attendanceCalendar.moreDetails")}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Modal
        open={Boolean(selectedDateKey)}
        onClose={() => setSelectedDateKey(null)}
        className="max-h-[85vh] max-w-lg overflow-y-auto"
      >
        {selectedDateKey && (
          <div className="pr-6 pt-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {formatHeaderDate(selectedDateKey)}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              <span
                className={[
                  "inline-block rounded-md border px-2 py-0.5 tabular-nums text-sm font-semibold",
                  RATIO_PILL_BY_CATEGORY[selectedCategory],
                ].join(" ")}
              >
                {selectedPresent}/{selectedTotal}
              </span>{" "}
              <span className="text-gray-500">{t("attendanceCalendar.presentMarksLabel")}</span>
            </p>
            <ul className="mt-4 space-y-3">
              {selectedRecords.map((rec, i) => (
                <li
                  key={`${rec.period}-${rec.status}-${i}`}
                  className="rounded-lg border border-border bg-gray-50/80 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatPeriodLabel(rec.period, t)}
                    </span>
                    <StatusBadge status={rec.status} />
                  </div>
                  {rec.status === "HALF_DAY" && rec.half_day_type && (
                    <div className="mt-1.5 text-xs font-medium text-warning-600">
                      {rec.half_day_type === "FIRST"
                        ? t("studentAttendance.presentFirstHalf")
                        : t("studentAttendance.presentSecondHalf")}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">{t("attendanceCalendar.markedBy")}</div>
                  <div className="text-sm text-gray-800">
                    {rec.markedBy?.trim() ? rec.markedBy : t("common.na")}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
}
