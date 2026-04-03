import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../ui-components";
import Loader from "../../ui-components/Loader";
import { useAuth } from "../../store/auth.store";
import { getReceiverSummary } from "../../api/receiver.api";
import {
  AlertCircle,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Megaphone,
  MessageCircle,
  Moon,
  XCircle,
} from "lucide-react";

/** JS getDay(): 0 Sun … 6 Sat → API timetable day ids (day-1 = Monday … day-7 = Sunday). */
const JS_DAY_TO_API_DAY_ID = {
  0: "day-7",
  1: "day-1",
  2: "day-2",
  3: "day-3",
  4: "day-4",
  5: "day-5",
  6: "day-6",
};

function timeToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== "string") return 0;
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h)) return 0;
  return h * 60 + (Number.isFinite(m) ? m : 0);
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function greetingForHour(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDisplayDate(d) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortDue(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/**
 * @param {object} timetable - API timetable { days, slots, entries }
 * @param {Date} [now]
 */
function buildTodaysPeriods(timetable, now = new Date()) {
  if (!timetable?.entries?.length || !timetable?.slots?.length) return [];

  const dayId = JS_DAY_TO_API_DAY_ID[now.getDay()];
  const slotById = new Map(timetable.slots.map((s) => [s.id, s]));

  const todayEntries = timetable.entries.filter((e) => e.dayId === dayId);
  todayEntries.sort((a, b) => {
    const sa = slotById.get(a.slotId);
    const sb = slotById.get(b.slotId);
    return (sa?.order ?? 0) - (sb?.order ?? 0);
  });

  return todayEntries.map((entry) => {
    const slot = slotById.get(entry.slotId);
    const start = slot?.startTime ?? "";
    const end = slot?.endTime ?? "";
    const subject =
      entry.subject?.trim() ||
      (slot?.type === "lunch" ? "Lunch" : slot?.label?.split(" - ")[0] || "—");
    return {
      start,
      end,
      subject,
      room: entry.room?.trim() || "—",
      slotType: slot?.type,
    };
  });
}

function currentPeriodIndexFor(periods) {
  const mins = nowMinutes();
  let idx = -1;
  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    const a = timeToMinutes(p.start);
    const b = timeToMinutes(p.end);
    if (b > a && mins >= a && mins < b) {
      idx = i;
      break;
    }
  }
  return idx;
}

/** Homework due still actionable (not past end of due day). */
function filterActiveHomework(list) {
  const now = new Date();
  return (list || []).filter((h) => {
    const raw = h.dueDate || h.due_date;
    if (!raw) return false;
    const due = new Date(raw);
    if (Number.isNaN(due.getTime())) return false;
    const endOfDueDay = new Date(due);
    endOfDueDay.setHours(23, 59, 59, 999);
    return endOfDueDay >= now;
  });
}

function mapBroadcastsToAnnouncements(list) {
  if (!Array.isArray(list)) return [];
  return list.map((b, i) => ({
    id: b.id ?? b.broadcastId ?? `b-${i}`,
    title: b.title?.trim() || "Announcement",
    body: (b.message || b.body || b.description || "").trim(),
    date: b.submittedAt || b.submitted_at || b.createdAt || b.created_at || "",
  }));
}

function SectionTitle({ icon, title, wrapperClassName = "mb-4 flex items-center gap-3" }) {
  return (
    <div className={wrapperClassName}>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-800 dark:bg-primary-950/50 dark:text-primary-900"
        aria-hidden
      >
        {createElement(icon, { size: 18, strokeWidth: 2 })}
      </span>
      <h2 className="text-lg font-semibold tracking-tight text-gray-950 dark:text-gray-900">
        {title}
      </h2>
    </div>
  );
}

export default function StudentHome() {
  const { auth } = useAuth();
  const [summaryPayload, setSummaryPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const firstName = useMemo(() => {
    const fromAuth = auth?.details?.student_first_name?.trim();
    if (fromAuth) return fromAuth;
    return "Student";
  }, [auth?.details?.student_first_name]);

  const receiverId = auth.userId;
  const sectionId = auth.sections?.[0]?.value;
  const campusId = auth.campus_id;

  const canFetch = Boolean(receiverId && sectionId && campusId);

  const loadSummary = useCallback(async () => {
    if (!receiverId || !sectionId || !campusId) {
      setSummaryPayload(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await getReceiverSummary({
        receiverId,
        sectionId,
        campusId,
      });
      if (res?.success && res.data) {
        setSummaryPayload(res.data);
      } else {
        setSummaryPayload(null);
        setError(
          typeof res?.message === "string" ? res.message : "Could not load summary."
        );
      }
    } catch (e) {
      setSummaryPayload(null);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load summary.";
      setError(typeof msg === "string" ? msg : "Failed to load summary.");
    } finally {
      setLoading(false);
    }
  }, [receiverId, sectionId, campusId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const { summary, periods, currentPeriodIndex, upcomingHomework, announcements } =
    useMemo(() => {
      const now = new Date();
      const weekday = now.getDay();
      const isWeekend = weekday === 0 || weekday === 6;

      const greeting = `${greetingForHour(now.getHours())},`;
      const dayLine = formatDisplayDate(now);

      let attendanceLine;
      let attendanceVariant;
      if (isWeekend) {
        attendanceLine =
          weekday === 0
            ? "No school today — Sunday is a weekly off."
            : "No school today — Saturday is a weekly off.";
        attendanceVariant = "weekend";
      } else {
        const at = summaryPayload?.attendanceToday;
        const status = at?.status?.toUpperCase?.();
        if (status === "PRESENT" || at?.marked === true) {
          attendanceLine = "You are marked present today.";
          attendanceVariant = "present";
        } else if (status === "ABSENT") {
          attendanceLine = "You are marked absent today.";
          attendanceVariant = "absent";
        } else {
          attendanceLine = "Your attendance hasn't been recorded yet today.";
          attendanceVariant = "pending";
        }
      }

      const tt = summaryPayload?.timetable;
      const periodsToday = tt ? buildTodaysPeriods(tt, now) : [];
      const idx = currentPeriodIndexFor(periodsToday);

      const hwRaw = summaryPayload?.homeworkDueNext7Days;
      const upcomingHomework = filterActiveHomework(hwRaw).sort(
        (a, b) =>
          new Date(a.dueDate || a.due_date) - new Date(b.dueDate || b.due_date)
      );

      const announcements = mapBroadcastsToAnnouncements(
        summaryPayload?.broadcastsReceivedYesterdayAndToday
      );

      return {
        summary: { greeting, firstName, dayLine, attendanceLine, attendanceVariant },
        periods: periodsToday,
        currentPeriodIndex: idx,
        upcomingHomework,
        announcements,
      };
    }, [summaryPayload, firstName]);

  const attendanceIcon =
    summary.attendanceVariant === "present" ? (
      <CheckCircle2 className="text-success-600 shrink-0" size={22} />
    ) : summary.attendanceVariant === "absent" ? (
      <XCircle className="text-error-600 shrink-0" size={22} />
    ) : summary.attendanceVariant === "weekend" ? (
      <Moon className="text-primary-600 shrink-0" size={22} />
    ) : (
      <AlertCircle className="shrink-0 text-amber-600" size={22} />
    );

  if (!canFetch) {
    return (
      <div className="min-h-full bg-[var(--color-background)] p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          <Card className="border border-gray-100 shadow-sm">
            <p className="text-center font-semibold text-gray-900">
              Your dashboard needs a section and campus on your profile to load. If this
              persists, contact your school administrator.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (loading && !summaryPayload) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[var(--color-background)] p-4">
        <Loader />
      </div>
    );
  }

  if (error && !summaryPayload) {
    return (
      <div className="min-h-full bg-[var(--color-background)] p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          <Card className="border border-gray-100 shadow-sm">
            <p className="mb-4 text-center font-semibold text-error-600">{error}</p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => loadSummary()}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Try again
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[var(--color-background)] p-4 pb-30 md:p-6 ">
      <div className="mx-auto max-w-5xl space-y-6">
        {loading ? (
          <div className="flex justify-center py-2">
            <Loader />
          </div>
        ) : null}

        <Card className="border border-gray-100 bg-white shadow-sm dark:border-gray-800 ">
          <div className="flex flex-col gap-4 border-l-4 border-blue-500 pl-4 sm:flex-row sm:items-start sm:justify-between sm:pl-5">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-800">
                {summary.greeting}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950  md:text-3xl">
                {summary.firstName},
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-800">
                <CalendarDays size={16} className="shrink-0 text-primary-700 dark:text-primary-400" />
                {summary.dayLine}
              </p>
              {summaryPayload?.section?.section_name || summaryPayload?.class?.class_name ? (
                <p className="mt-1 text-xs font-semibold text-gray-700">
                  {[
                    summaryPayload.class?.class_name,
                    summaryPayload.section?.section_name,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/60">
              {attendanceIcon}
              <p className="text-sm font-semibold leading-snug text-gray-950 dark:text-gray-50">
                {summary.attendanceLine}
              </p>
            </div>
          </div>
        </Card>

        <Link to="/student/chat" className="block">
          <Card className="border border-gray-100 bg-white shadow-sm transition-all hover:border-primary-400 hover:shadow-md dark:border-gray-800 dark:hover:border-primary-500">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-800 dark:bg-primary-950/50 dark:text-primary-900"
                  aria-hidden
                >
                  <MessageCircle size={20} strokeWidth={2} />
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-gray-950 dark:text-gray-900">
                    Messages
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-600">
                    Chat with your teachers. New messages refresh while you are in a conversation.
                  </p>
                </div>
              </div>
              <ChevronRight
                className="shrink-0 text-primary-700 dark:text-primary-400"
                size={22}
                aria-hidden
              />
            </div>
          </Card>
        </Link>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-gray-100 bg-white shadow-sm dark:border-gray-800 ">
            <SectionTitle icon={Clock} title="Today's schedule" />
            {periods.length === 0 ? (
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-800">
                No classes scheduled for today.
              </p>
            ) : (
              <ul className="space-y-2">
                {periods.map((p, i) => {
                  const isCurrent = i === currentPeriodIndex;
                  return (
                    <li
                      key={`${p.start}-${p.end}-${p.subject}-${i}`}
                      className={`flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between ${
                        isCurrent
                          ? "border-blue-500 bg-sky-50 shadow-sm dark:border-blue-400 dark:bg-sky-950/40"
                          : "border-gray-100 bg-white dark:border-gray-700 "
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-950 dark:text-gray-800">
                          {p.subject}
                          {isCurrent ? (
                            <span className="ml-2 inline-flex items-center rounded-md bg-primary-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              Now
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-600">{p.room}</p>
                      </div>
                      <p className="shrink-0 font-mono text-xs font-bold tabular-nums text-gray-950 dark:text-gray-800">
                        {p.start} – {p.end}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="border border-gray-100 bg-white shadow-sm dark:border-gray-800 ">
            <div className="mb-4 flex items-center justify-between gap-3">
              <SectionTitle
                icon={BookOpen}
                title="Homework"
                wrapperClassName="mb-0 flex min-w-0 items-center gap-3"
              />
              <Link
                to="/student/homework"
                className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
              >
                View all
                <ChevronRight size={14} />
              </Link>
            </div>
            {upcomingHomework.length === 0 ? (
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-800">
                No upcoming homework due.
              </p>
            ) : (
              <ul className="space-y-2">
                {upcomingHomework.map((h) => (
                  <li key={h.id}>
                    <Link
                      to={`/student/homework/${h.id}`}
                      className="block rounded-lg border border-gray-100 bg-white px-3 py-2.5 transition-all hover:border-primary-400 hover:bg-primary-50/60 dark:border-gray-700 dark:hover:border-primary-500 dark:hover:bg-primary-950/30"
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-950 dark:text-gray-800">
                        {h.subject}
                      </p>
                      <p className="mt-0.5 font-semibold text-gray-950 dark:text-gray-800">{h.title}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-800 dark:text-gray-600">
                        Due {formatShortDue(h.dueDate || h.due_date)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="border border-gray-100 bg-white shadow-sm dark:border-gray-800 ">
          <div className="mb-4 flex items-center justify-between gap-3">
            <SectionTitle
              icon={Megaphone}
              title="Announcements"
              wrapperClassName="mb-0 flex min-w-0 items-center gap-3"
            />
            <Link
              to="/student/announcements"
              className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
            >
              View all
              <ChevronRight size={14} />
            </Link>
          </div>
          {announcements.length === 0 ? (
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-800">
              No announcements from the last two days.
            </p>
          ) : (
            <ul className="space-y-4">
              {announcements.map((a) => (
                <li
                  key={a.id}
                  className="flex gap-3 border-b border-gray-100 pb-4 last:border-0 last:pb-0 dark:border-gray-700"
                >
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-800 dark:bg-primary-950/50 dark:text-primary-900"
                    aria-hidden
                  >
                    <Bell size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/student/announcements/${a.id}`}
                      className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <p className="font-semibold text-gray-950 dark:text-gray-800">{a.title}</p>
                      {a.body ? (
                        <p className="mt-1 text-sm font-semibold leading-relaxed text-gray-900 dark:text-gray-800">
                          {a.body}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs font-semibold text-gray-800 dark:text-gray-600">
                        {a.date ? formatShortDue(a.date) : null}
                      </p>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
