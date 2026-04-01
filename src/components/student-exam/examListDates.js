/**
 * Calendar dates from the API (YYYY-MM-DD) must not be parsed as UTC midnight,
 * or they can show the previous day in some timezones.
 */
export function parseExamDateInput(value) {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const dt = new Date(y, mo, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function formatExamListDate(value) {
  const d =
    value instanceof Date && !Number.isNaN(value.getTime())
      ? value
      : parseExamDateInput(value);
  if (!d) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function subjectExamDate(sub) {
  return sub?.examDate || sub?.exam_date;
}

/** Resolve listing start/end from camelCase, snake_case, or subject rows. */
export function getExamListDateRange(exam) {
  let start = exam?.startDate ?? exam?.start_date;
  let end = exam?.endDate ?? exam?.end_date;
  const subjects = exam?.subjects;
  if ((!start || !end) && Array.isArray(subjects) && subjects.length > 0) {
    const dates = subjects
      .map(subjectExamDate)
      .filter(Boolean)
      .map((x) => String(x).trim())
      .sort();
    if (dates.length) {
      if (!start) start = dates[0];
      if (!end) end = dates[dates.length - 1];
    }
  }
  if (start && !end) end = start;
  if (!start && end) start = end;
  return { start, end };
}

function dateKey(value) {
  const d = parseExamDateInput(value);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function examListDateRangeLabel(exam) {
  const { start, end } = getExamListDateRange(exam);
  if (!start) return "";
  const startLabel = formatExamListDate(start);
  if (!end || dateKey(start) === dateKey(end)) return startLabel;
  return `${startLabel} - ${formatExamListDate(end)}`;
}
