import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../ui-components";
import Loader from "../../ui-components/Loader";
import { useAuth } from "../../store/auth.store";
import {
  getReceiverSummary,
  unwrapReceiverSummaryResponse,
} from "../../api/receiver.api";
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

function daysUntil(iso) {
  if (!iso) return null;
  try {
    const due = new Date(iso);
    if (isNaN(due.getTime())) return null;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const dueStart = new Date(due);
    dueStart.setHours(0, 0, 0, 0);
    return Math.round((dueStart - todayStart) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function SectionTitle({ icon, title, wrapperClassName = "mb-4 flex items-center gap-2.5" }) {
  return (
    <div className={wrapperClassName}>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600"
        aria-hidden
      >
        {createElement(icon, { size: 16, strokeWidth: 2 })}
      </span>
      <h2 className="text-base font-bold tracking-tight text-gray-900">{title}</h2>
    </div>
  );
}

function QuickStat({ icon: Icon, label, value, colorClass }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${colorClass}`}>
        <Icon size={16} strokeWidth={2} />
      </span>
      <p className="text-xl font-bold tabular-nums text-gray-900">{value}</p>
      <p className="text-center text-[10px] font-semibold leading-tight text-gray-500">{label}</p>
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
      const { payload, message } = unwrapReceiverSummaryResponse(res);
      if (payload) {
        setSummaryPayload(payload);
      } else {
        setSummaryPayload(null);
        setError(message || "Could not load summary.");
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
          attendanceLine = "Attendance not recorded yet.";
          attendanceVariant = "pending";
        }
      }

      const tt = summaryPayload?.timetable;
      const periodsToday = tt ? buildTodaysPeriods(tt, now) : [];
      const idx = currentPeriodIndexFor(periodsToday);

      const hwRaw =
        Array.isArray(summaryPayload?.homeworkDueNext7Days) &&
        summaryPayload.homeworkDueNext7Days.length > 0
          ? summaryPayload.homeworkDueNext7Days
          : summaryPayload?.homework?.dueNextSevenDays;
      const upcomingHomework = filterActiveHomework(hwRaw).sort(
        (a, b) =>
          new Date(a.dueDate || a.due_date) - new Date(b.dueDate || b.due_date)
      );

      const broadcastList = summaryPayload?.broadcastsReceivedYesterdayAndToday;
      const announcementSource = Array.isArray(broadcastList)
        ? broadcastList
        : summaryPayload?.announcements?.recent;
      const announcements = mapBroadcastsToAnnouncements(announcementSource);

      return {
        summary: { greeting, firstName, dayLine, attendanceLine, attendanceVariant },
        periods: periodsToday,
        currentPeriodIndex: idx,
        upcomingHomework,
        announcements,
      };
    }, [summaryPayload, firstName]);

  const messagesUnreadTotal = summaryPayload?.messages?.totalUnread ?? 0;

  const heroAttendanceIcon =
    summary.attendanceVariant === "present" ? (
      <CheckCircle2 className="shrink-0 text-green-300" size={18} />
    ) : summary.attendanceVariant === "absent" ? (
      <XCircle className="shrink-0 text-red-300" size={18} />
    ) : summary.attendanceVariant === "weekend" ? (
      <Moon className="shrink-0 text-blue-200" size={18} />
    ) : (
      <AlertCircle className="shrink-0 text-amber-300" size={18} />
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

  const currentNowMinutes = nowMinutes();

  return (
    <div className="min-h-full bg-[var(--color-background)] p-4 pb-30 md:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        {loading ? (
          <div className="flex justify-center py-2">
            <Loader />
          </div>
        ) : null}

        {/* Hero card */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 shadow-lg md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-200">{summary.greeting}</p>
              <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-white md:text-4xl">
                {summary.firstName}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-indigo-100">
                <CalendarDays size={14} className="shrink-0" />
                {summary.dayLine}
              </p>
              {(summaryPayload?.section?.section_name || summaryPayload?.class?.class_name) ? (
                <p className="mt-1 text-xs font-semibold text-indigo-200">
                  {[
                    summaryPayload.class?.class_name,
                    summaryPayload.section?.section_name,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm sm:self-start">
              {heroAttendanceIcon}
              <p className="text-sm font-semibold leading-snug text-white">
                {summary.attendanceLine}
              </p>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-3">
          <QuickStat
            icon={Clock}
            label="Classes today"
            value={periods.length}
            colorClass="bg-indigo-100 text-indigo-600"
          />
          <QuickStat
            icon={BookOpen}
            label="Due soon"
            value={upcomingHomework.length}
            colorClass="bg-amber-100 text-amber-600"
          />
          <QuickStat
            icon={MessageCircle}
            label="Unread"
            value={messagesUnreadTotal}
            colorClass="bg-emerald-100 text-emerald-600"
          />
        </div>

        {/* Messages nav card */}
        <Link to="/student/chat" className="block">
          <Card className="border border-gray-100 bg-white shadow-sm transition-all hover:border-primary-300 hover:shadow-md">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <MessageCircle size={20} strokeWidth={2} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-900">Messages</h2>
                    {messagesUnreadTotal > 0 ? (
                      <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs font-bold text-white">
                        {messagesUnreadTotal > 99 ? "99+" : messagesUnreadTotal}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">Chat with your teachers</p>
                </div>
              </div>
              <ChevronRight className="shrink-0 text-gray-400" size={20} aria-hidden />
            </div>
          </Card>
        </Link>

        {/* Schedule + Homework grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Today's schedule */}
          <Card className="border border-gray-100 bg-white shadow-sm">
            <SectionTitle icon={Clock} title="Today's schedule" />
            {periods.length === 0 ? (
              <p className="text-sm text-gray-500">No classes scheduled for today.</p>
            ) : (
              <ul className="space-y-2">
                {periods.map((p, i) => {
                  const isCurrent = i === currentPeriodIndex;
                  const isPast = !isCurrent && timeToMinutes(p.end) < currentNowMinutes;
                  return (
                    <li
                      key={`${p.start}-${p.end}-${p.subject}-${i}`}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isCurrent
                          ? "border-l-[3px] border-primary-600 bg-primary-50 pl-[9px]"
                          : isPast
                            ? "bg-gray-50 opacity-60"
                            : "border border-gray-100 bg-white"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          isCurrent
                            ? "bg-primary-600 text-white"
                            : isPast
                              ? "bg-gray-200 text-gray-400"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate font-semibold ${isCurrent ? "text-primary-900" : "text-gray-900"}`}>
                          {p.subject}
                          {isCurrent ? (
                            <span className="ml-2 rounded bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              Now
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-gray-500">{p.room}</p>
                      </div>
                      <p className="shrink-0 font-mono text-xs font-semibold tabular-nums text-gray-400">
                        {p.start}–{p.end}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Homework */}
          <Card className="border border-gray-100 bg-white shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <SectionTitle
                icon={BookOpen}
                title="Homework"
                wrapperClassName="mb-0 flex items-center gap-2.5"
              />
              <Link
                to="/student/homework"
                className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold text-primary-600 hover:text-primary-700"
              >
                View all
                <ChevronRight size={13} />
              </Link>
            </div>
            {upcomingHomework.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming homework due.</p>
            ) : (
              <ul className="space-y-2">
                {upcomingHomework.map((h) => {
                  const days = daysUntil(h.dueDate || h.due_date);
                  return (
                    <li key={h.id}>
                      <Link
                        to={`/student/homework/${h.id}`}
                        className="block rounded-lg border border-gray-100 p-3 transition-all hover:border-primary-300 hover:bg-primary-50/50"
                      >
                        {h.subject ? (
                          <span className="inline-block rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-700">
                            {h.subject}
                          </span>
                        ) : null}
                        <p className="mt-1.5 font-semibold text-gray-900">{h.title}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          {days !== null ? (
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                days === 0
                                  ? "bg-red-100 text-red-700"
                                  : days === 1
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {days === 0 ? "Due today" : days === 1 ? "Tomorrow" : `${days}d left`}
                            </span>
                          ) : null}
                          <p className="text-xs text-gray-500">
                            {formatShortDue(h.dueDate || h.due_date)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Announcements */}
        <Card className="border border-gray-100 bg-white shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <SectionTitle
              icon={Megaphone}
              title="Announcements"
              wrapperClassName="mb-0 flex items-center gap-2.5"
            />
            <Link
              to="/student/announcements"
              className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold text-primary-600 hover:text-primary-700"
            >
              View all
              <ChevronRight size={13} />
            </Link>
          </div>
          {announcements.length === 0 ? (
            <p className="text-sm text-gray-500">No announcements from the last two days.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {announcements.map((a) => (
                <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    to={`/student/announcements/${a.id}`}
                    className="-mx-1.5 flex gap-3 rounded-lg p-1.5 outline-none transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600"
                      aria-hidden
                    >
                      <Bell size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">{a.title}</p>
                      {a.body ? (
                        <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{a.body}</p>
                      ) : null}
                      {a.date ? (
                        <p className="mt-1 text-xs text-gray-400">{formatShortDue(a.date)}</p>
                      ) : null}
                    </div>
                    <ChevronRight size={16} className="mt-0.5 shrink-0 text-gray-300" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
