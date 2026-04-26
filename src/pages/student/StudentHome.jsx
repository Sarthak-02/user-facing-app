import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../../ui-components";
import Modal from "../../ui-components/Modal";
import Loader from "../../ui-components/Loader";
import { useAuth } from "../../store/auth.store";
import {
  getReceiverSummary,
  unwrapReceiverSummaryResponse,
} from "../../api/receiver.api";
import {
  AlertCircle,
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

const DAY_SHORT = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
  Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

const FALLBACK_DAY_TABS = [
  { id: "day-1", label: "Mon" },
  { id: "day-2", label: "Tue" },
  { id: "day-3", label: "Wed" },
  { id: "day-4", label: "Thu" },
  { id: "day-5", label: "Fri" },
];

function buildDayTabs(timetable) {
  const days = timetable?.days;
  if (!Array.isArray(days) || !days.length) return FALLBACK_DAY_TABS;
  return days
    .filter((d) => d.isActive)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((d) => ({ id: d.id, label: DAY_SHORT[d.label] ?? d.label }));
}

const EVENT_TYPE_STYLE = {
  exam:     { label: "Exam",     className: "bg-red-100 text-red-700"        },
  holiday:  { label: "Holiday",  className: "bg-green-100 text-green-700"    },
  sports:   { label: "Sports",   className: "bg-orange-100 text-orange-700"  },
  cultural: { label: "Cultural", className: "bg-purple-100 text-purple-700"  },
  meeting:  { label: "Meeting",  className: "bg-blue-100 text-blue-700"      },
  other:    { label: "Other",    className: "bg-gray-100 text-gray-600"      },
};

function getTodayDayId() {
  return JS_DAY_TO_API_DAY_ID[new Date().getDay()] ?? "day-1";
}

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

function formatEventDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

const NON_CLASS_SLOT_TYPES = new Set(["assembly", "lunch", "break"]);

const NON_CLASS_SLOT_LABEL = {
  assembly: "Assembly",
  lunch: "Lunch",
  break: "Break",
};

const NON_CLASS_SLOT_STYLE = {
  assembly: "bg-purple-50 border-purple-100 text-purple-800",
  lunch:    "bg-green-50 border-green-100 text-green-800",
  break:    "bg-amber-50 border-amber-100 text-amber-800",
};

function buildPeriodsForDay(timetable, dayId) {
  if (!timetable?.slots?.length) return [];

  // Map entries for this day by slotId
  const entryBySlot = new Map(
    (timetable.entries || [])
      .filter((e) => e.dayId === dayId)
      .map((e) => [e.slotId, e])
  );

  // Include class slots that have an entry + all non-class slots (assembly/lunch/break)
  const visibleSlots = timetable.slots.filter(
    (slot) => entryBySlot.has(slot.id) || NON_CLASS_SLOT_TYPES.has(slot.type)
  );

  visibleSlots.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return visibleSlots.map((slot) => {
    const entry = entryBySlot.get(slot.id);
    const subject =
      NON_CLASS_SLOT_LABEL[slot.type] ??
      entry?.subject?.trim() ??
      slot?.label?.split(" - ")[0] ??
      "—";
    return {
      start: slot.startTime ?? "",
      end: slot.endTime ?? "",
      subject,
      room: entry?.room?.trim() || "",
      slotType: slot.type,
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

function getUpcomingEvents(campus, limit = 5) {
  const events = campus?.academic_calendar?.events;
  if (!Array.isArray(events) || !events.length) return [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return events
    .filter((ev) => {
      const dateStr = ev.end_date || ev.start_date;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) && d >= todayStart;
    })
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, limit);
}


function QuickStatContent({ icon, label, value, colorClass, hint }) {
  return createElement(
    "span",
    { className: "contents" },
    createElement(
      "span",
      { className: `flex h-8 w-8 items-center justify-center rounded-full ${colorClass}` },
      createElement(icon, { size: 16, strokeWidth: 2 })
    ),
    createElement("p", { className: "text-xl font-bold tabular-nums text-gray-900" }, value),
    createElement("p", { className: "text-center text-[10px] font-semibold leading-tight text-gray-500" }, label),
    hint
      ? createElement("p", { className: "text-center text-[9px] font-medium text-primary-500 mt-0.5" }, hint)
      : null
  );
}

function QuickStat({ icon, label, value, colorClass, onClick, hint }) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:border-primary-300 hover:shadow-md active:scale-95"
      >
        <QuickStatContent icon={icon} label={label} value={value} colorClass={colorClass} hint={hint} />
      </button>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <QuickStatContent icon={icon} label={label} value={value} colorClass={colorClass} />
    </div>
  );
}

export default function StudentHome() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [summaryPayload, setSummaryPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const todayDayId = useMemo(() => getTodayDayId(), []);
  const [selectedDayId, setSelectedDayId] = useState(todayDayId);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

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

  // Periods for the selected day tab
  const periods = useMemo(() => {
    const tt = summaryPayload?.timetable;
    return tt ? buildPeriodsForDay(tt, selectedDayId) : [];
  }, [summaryPayload, selectedDayId]);

  // Today's period count for the quick stat (independent of selected tab)
  const todayPeriods = useMemo(() => {
    const tt = summaryPayload?.timetable;
    return tt ? buildPeriodsForDay(tt, todayDayId) : [];
  }, [summaryPayload, todayDayId]);

  const dayTabs = useMemo(
    () => buildDayTabs(summaryPayload?.timetable),
    [summaryPayload]
  );

  // Current period index only meaningful when viewing today
  const currentPeriodIndex = useMemo(() => {
    if (selectedDayId !== todayDayId) return -1;
    return currentPeriodIndexFor(periods);
  }, [periods, selectedDayId, todayDayId]);

  const upcomingEvents = useMemo(
    () => getUpcomingEvents(auth.campus),
    [auth.campus]
  );

  const { summary, upcomingHomework, announcements } =
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
  const isViewingToday = selectedDayId === todayDayId;

  return (
    <>
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

        {/* Next event strip */}
        {upcomingEvents.length > 0 && (() => {
          const ev = upcomingEvents[0];
          const days = daysUntil(ev.start_date);
          const style = EVENT_TYPE_STYLE[ev.type] ?? EVENT_TYPE_STYLE.other;
          const isRange = ev.end_date && ev.end_date !== ev.start_date;
          const dateLabel = isRange
            ? `${formatEventDate(ev.start_date)} – ${formatEventDate(ev.end_date)}`
            : formatEventDate(ev.start_date);
          return (
            <button
              type="button"
              onClick={() => setIsCalendarModalOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm transition-all hover:border-primary-300 hover:shadow-md active:scale-[0.99]"
            >
              <CalendarDays size={15} className="shrink-0 text-gray-400" aria-hidden />
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.className}`}>
                {style.label}
              </span>
              <p className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-gray-900">{ev.title}</p>
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                days === 0
                  ? "bg-red-100 text-red-700"
                  : days === 1
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-500"
              }`}>
                {days === 0 ? "Today" : days === 1 ? "Tomorrow" : dateLabel}
              </span>
              <ChevronRight size={14} className="shrink-0 text-gray-400" aria-hidden />
            </button>
          );
        })()}

        {/* Quick stats row */}
        <div className="grid grid-cols-2 gap-3">
          <QuickStat
            icon={Clock}
            label="Classes today"
            value={todayPeriods.filter((p) => !NON_CLASS_SLOT_TYPES.has(p.slotType)).length}
            colorClass="bg-indigo-100 text-indigo-600"
            onClick={() => setIsScheduleModalOpen(true)}
            hint="View schedule →"
          />
          <QuickStat
            icon={BookOpen}
            label="Due soon"
            value={upcomingHomework.length}
            colorClass="bg-amber-100 text-amber-600"
            onClick={() => setIsHomeworkModalOpen(true)}
            hint="View homework →"
          />
          <QuickStat
            icon={Megaphone}
            label="Announcements"
            value={announcements.length}
            colorClass="bg-purple-100 text-purple-600"
            onClick={() => setIsAnnouncementsModalOpen(true)}
            hint="View announcements →"
          />
          <QuickStat
            icon={MessageCircle}
            label="Unread"
            value={messagesUnreadTotal}
            colorClass="bg-emerald-100 text-emerald-600"
            onClick={() => navigate("/student/chat")}
            hint="View messages →"
          />
        </div>

      </div>
    </div>

    {/* Homework modal */}
    <Modal
      open={isHomeworkModalOpen}
      onClose={() => setIsHomeworkModalOpen(false)}
      className="max-w-sm"
    >
      <h2 className="mb-4 pr-6 text-base font-bold text-gray-900">Homework due</h2>
      {upcomingHomework.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">No upcoming homework due.</p>
      ) : (
        <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
          {upcomingHomework.map((h) => {
            const days = daysUntil(h.dueDate || h.due_date);
            return (
              <li key={h.id}>
                <Link
                  to={`/student/homework/${h.id}`}
                  onClick={() => setIsHomeworkModalOpen(false)}
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
      <Link
        to="/student/homework"
        onClick={() => setIsHomeworkModalOpen(false)}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-primary-200 bg-primary-50 py-2 text-sm font-bold text-primary-700 hover:bg-primary-100"
      >
        View all homework
        <ChevronRight size={14} />
      </Link>
    </Modal>

    {/* Schedule modal */}
    <Modal
      open={isScheduleModalOpen}
      onClose={() => setIsScheduleModalOpen(false)}
      className="max-w-sm"
    >
      <h2 className="mb-4 pr-6 text-base font-bold text-gray-900">Schedule</h2>

      {/* Day tabs */}
      <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1">
        {dayTabs.map((tab) => {
          const isToday = tab.id === todayDayId;
          const isSelected = tab.id === selectedDayId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedDayId(tab.id)}
              className={`relative flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {isToday ? (
                <span
                  className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                    isSelected ? "bg-primary-500" : "bg-gray-400"
                  }`}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {periods.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">No classes scheduled for this day.</p>
      ) : (
        <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
          {periods.map((p, i) => {
            const isCurrent = isViewingToday && i === currentPeriodIndex;
            const isPast =
              isViewingToday && !isCurrent && timeToMinutes(p.end) < currentNowMinutes;
            return (
              <li
                key={`${p.start}-${p.end}-${p.subject}-${i}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isCurrent
                    ? "border-l-[3px] border-primary-600 bg-primary-50 pl-[9px]"
                    : NON_CLASS_SLOT_TYPES.has(p.slotType)
                      ? `border ${isPast ? "opacity-50" : ""} ${NON_CLASS_SLOT_STYLE[p.slotType]}`
                      : isPast
                        ? "bg-gray-50 opacity-60"
                        : "border border-gray-100 bg-white"
                }`}
              >
                {!NON_CLASS_SLOT_TYPES.has(p.slotType) && (
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
                )}
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-semibold ${isCurrent ? "text-primary-900" : ""}`}>
                    {p.subject}
                    {isCurrent ? (
                      <span className="ml-2 rounded bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Now
                      </span>
                    ) : null}
                  </p>
                  {p.room ? <p className="text-xs opacity-60">{p.room}</p> : null}
                </div>
                <p className="shrink-0 font-mono text-xs font-semibold tabular-nums text-gray-400">
                  {p.start}–{p.end}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>

    {/* Announcements modal */}
    <Modal
      open={isAnnouncementsModalOpen}
      onClose={() => setIsAnnouncementsModalOpen(false)}
      className="max-w-sm"
    >
      <h2 className="mb-4 pr-6 text-base font-bold text-gray-900">Announcements</h2>
      {announcements.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">No announcements from the last two days.</p>
      ) : (
        <ul className="max-h-[60vh] divide-y divide-gray-100 overflow-y-auto">
          {announcements.map((a) => (
            <li key={a.id} className="py-3 first:pt-0 last:pb-0">
              <Link
                to={`/student/announcements/${a.id}`}
                onClick={() => setIsAnnouncementsModalOpen(false)}
                className="flex gap-3 rounded-lg outline-none transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600"
                  aria-hidden
                >
                  <Megaphone size={15} />
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
      <Link
        to="/student/announcements"
        onClick={() => setIsAnnouncementsModalOpen(false)}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-primary-200 bg-primary-50 py-2 text-sm font-bold text-primary-700 hover:bg-primary-100"
      >
        View all announcements
        <ChevronRight size={14} />
      </Link>
    </Modal>

    {/* Academic calendar modal */}
    <Modal
      open={isCalendarModalOpen}
      onClose={() => setIsCalendarModalOpen(false)}
      className="max-w-sm"
    >
      <h2 className="mb-4 pr-6 text-base font-bold text-gray-900">Academic Calendar</h2>
      {(() => {
        const allEvents = (auth.campus?.academic_calendar?.events || [])
          .filter((ev) => ev.start_date)
          .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        if (allEvents.length === 0) {
          return <p className="py-4 text-center text-sm text-gray-500">No events in the calendar.</p>;
        }
        return (
          <ul className="max-h-[65vh] space-y-2 overflow-y-auto">
            {allEvents.map((ev) => {
              const days = daysUntil(ev.start_date);
              const style = EVENT_TYPE_STYLE[ev.type] ?? EVENT_TYPE_STYLE.other;
              const isRange = ev.end_date && ev.end_date !== ev.start_date;
              const dateLabel = isRange
                ? `${formatEventDate(ev.start_date)} – ${formatEventDate(ev.end_date)}`
                : formatEventDate(ev.start_date);
              const isPast = days !== null && days < 0;
              return (
                <li
                  key={ev.id}
                  className={`rounded-lg border p-3 ${isPast ? "border-gray-100 bg-gray-50 opacity-60" : "border-gray-100 bg-white"}`}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.className}`}>
                      {style.label}
                    </span>
                    {days !== null && !isPast && (
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        days === 0
                          ? "bg-red-100 text-red-700"
                          : days === 1
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-500"
                      }`}>
                        {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}
                      </span>
                    )}
                    <span className="ml-auto text-xs font-medium text-gray-400">{dateLabel}</span>
                  </div>
                  <p className="mt-1.5 font-semibold text-gray-900">{ev.title}</p>
                  {ev.description ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{ev.description}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        );
      })()}
    </Modal>
    </>
  );
}
