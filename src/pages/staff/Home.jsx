import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../ui-components";
import Loader from "../../ui-components/Loader";
import { useAuth } from "../../store/auth.store";
import {
  postTeacherSummary,
  unwrapTeacherSummaryResponse,
} from "../../api/teacher.api";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock,
  Layers,
  Megaphone,
  MessageCircle,
  School,
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

function homeworkCountFromPayload(payload) {
  const n =
    payload?.homework_count ?? payload?.homeworkCount ?? payload?.homework?.count;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function announcementsCountFromPayload(payload) {
  const n =
    payload?.announcements_count ??
    payload?.announcementsCount ??
    payload?.announcements?.count;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/**
 * @param {object} payload - Teacher summary API payload
 * @returns {Array<{ id: string, title: string, subject: string, dueDate: string }>}
 */
function normalizeHomeworkDueList(payload) {
  const raw =
    payload?.homework_due ??
    payload?.homeworkDue ??
    payload?.homework_due_in_window ??
    payload?.homeworkDueInWindow ??
    payload?.homework?.items;
  if (!Array.isArray(raw)) return [];

  return raw.map((h, i) => {
    const subjectRaw = h.subject?.name ?? h.subject_name ?? h.subject;
    return {
      id: String(h.id ?? h.homework_id ?? h.homeworkId ?? `hw-${i}`),
      title: (h.title ?? h.homework_title ?? "Homework").toString().trim() || "Homework",
      subject:
        (typeof subjectRaw === "string" ? subjectRaw : subjectRaw?.name ?? "—")
          .toString()
          .trim() || "—",
      dueDate: h.dueDate ?? h.due_date ?? h.dueAt ?? h.due_at ?? "",
    };
  });
}

function upcomingHomeworkFromPayload(payload) {
  const list = normalizeHomeworkDueList(payload);
  return filterActiveHomework(list).sort(
    (a, b) => new Date(a.dueDate || a.due_date) - new Date(b.dueDate || b.due_date)
  );
}

function mapAnnouncementsReceived(list) {
  if (!Array.isArray(list)) return [];
  return list.map((b, i) => ({
    id: String(b.id ?? b.broadcastId ?? b.announcement_id ?? `ann-${i}`),
    title: b.title?.trim?.() || "Announcement",
    body: (b.message || b.body || b.description || "").trim(),
    date:
      b.submittedAt ||
      b.submitted_at ||
      b.createdAt ||
      b.created_at ||
      b.received_at ||
      b.receivedAt ||
      "",
  }));
}

function announcementsFromPayload(payload) {
  const raw =
    payload?.announcements_received ??
    payload?.announcementsReceived ??
    payload?.announcements?.items;
  return mapAnnouncementsReceived(raw);
}

function dateRangeCaption(w) {
  if (!w || typeof w !== "object") return null;
  const from = w.from ?? w.start;
  const to = w.to ?? w.end;
  if (!from && !to) return null;
  const a = from ? formatShortDue(from) : "";
  const b = to ? formatShortDue(to) : "";
  if (a && b) return `${a} – ${b}`;
  return a || b;
}

/**
 * @param {object} timetable - API timetable { days, slots, entries }
 * @param {Date} [now]
 * @param {{ sectionName?: string, sectionId?: string }} [sectionMeta]
 */
function buildTodaysPeriods(timetable, now = new Date(), sectionMeta = null) {
  if (!timetable?.entries?.length || !timetable?.slots?.length) return [];

  const dayId = JS_DAY_TO_API_DAY_ID[now.getDay()];
  const slotById = new Map(timetable.slots.map((s) => [s.id, s]));

  const todayEntries = timetable.entries.filter((e) => e.dayId === dayId);
  todayEntries.sort((a, b) => {
    const sa = slotById.get(a.slotId);
    const sb = slotById.get(b.slotId);
    return (sa?.order ?? 0) - (sb?.order ?? 0);
  });

  const sectionName = sectionMeta?.sectionName?.trim?.() || "";
  const sectionId = sectionMeta?.sectionId != null ? String(sectionMeta.sectionId) : "";

  return todayEntries.map((entry) => {
    const slot = slotById.get(entry.slotId);
    const start = slot?.startTime ?? "";
    const end = slot?.endTime ?? "";
    let subject = "—";
    if (typeof entry.subject === "string") {
      subject = entry.subject.trim() || "—";
    } else if (entry.subject && typeof entry.subject.name === "string") {
      subject = entry.subject.name.trim() || "—";
    } else if (slot?.type === "lunch") {
      subject = "Lunch";
    } else if (slot?.label) {
      subject = slot.label.split(" - ")[0] || "—";
    }
    return {
      start,
      end,
      subject,
      room: entry.room?.trim?.() || "—",
      slotType: slot?.type,
      sectionName,
      sectionId,
    };
  });
}

/**
 * Today’s periods from either `timetables_by_section[]` or legacy single `timetable`.
 * @param {object} payload - Summary API payload
 * @param {Date} [now]
 */
function todaysPeriodsFromSummaryPayload(payload, now = new Date()) {
  const rows = payload?.timetables_by_section;
  if (Array.isArray(rows) && rows.length > 0) {
    const merged = [];
    for (const row of rows) {
      if (!row?.timetable) continue;
      const periods = buildTodaysPeriods(row.timetable, now, {
        sectionName: row.section_name,
        sectionId: row.section_id,
      });
      merged.push(...periods);
    }
    merged.sort((a, b) => {
      const ta = timeToMinutes(a.start);
      const tb = timeToMinutes(b.start);
      if (ta !== tb) return ta - tb;
      return (a.sectionName || "").localeCompare(b.sectionName || "");
    });
    return merged;
  }

  const tt = payload?.timetable;
  return tt ? buildTodaysPeriods(tt, now) : [];
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

/**
 * Unique subjects across the full weekly timetable (from all entries).
 * @param {object} timetable
 */
function subjectsFromTimetable(timetable) {
  const entries = timetable?.entries;
  if (!Array.isArray(entries) || entries.length === 0) return [];

  const subjectNameOf = (entry) => {
    const s = entry.subject;
    if (typeof s === "string") return s.trim();
    if (s && typeof s.name === "string") return s.name.trim();
    return "";
  };

  const byKey = new Map();

  for (const e of entries) {
    const name = subjectNameOf(e);
    if (!name) continue;

    const subjectId =
      e.subjectId ??
      e.subject_id ??
      (e.subject && typeof e.subject === "object" ? e.subject.id : null) ??
      null;
    const sectionId = e.sectionId ?? e.section_id ?? null;
    const sectionLabel =
      (typeof e.sectionName === "string" && e.sectionName.trim()) ||
      (e.section && typeof e.section.section_name === "string" && e.section.section_name.trim()) ||
      (e.section && typeof e.section.name === "string" && e.section.name.trim()) ||
      "";

    const key =
      subjectId != null && String(subjectId).length > 0
        ? `id:${subjectId}`
        : `name:${name.toLowerCase()}`;

    if (!byKey.has(key)) {
      byKey.set(key, {
        name,
        subjectId: subjectId != null && String(subjectId).length > 0 ? String(subjectId) : null,
        sectionIds: new Set(),
        sectionLabels: new Set(),
      });
    }
    const row = byKey.get(key);
    if (sectionId != null && String(sectionId).length > 0) {
      row.sectionIds.add(String(sectionId));
    }
    if (sectionLabel) {
      row.sectionLabels.add(sectionLabel);
    }
  }

  return Array.from(byKey.values())
    .map((row) => ({
      name: row.name,
      subjectId: row.subjectId,
      sectionIds: [...row.sectionIds],
      sectionLabels: [...row.sectionLabels].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Subjects across all section timetables; attaches each section’s `section_name` / `section_id`.
 * @param {Array<{ section_id?: string, section_name?: string, timetable?: object }>} timetablesBySection
 */
function subjectsFromTimetablesBySection(timetablesBySection) {
  if (!Array.isArray(timetablesBySection) || timetablesBySection.length === 0) return [];

  const byKey = new Map();

  for (const row of timetablesBySection) {
    const tt = row?.timetable;
    if (!tt?.entries?.length) continue;

    const rowSectionId = row.section_id != null ? String(row.section_id) : "";
    const rowSectionName = typeof row.section_name === "string" ? row.section_name.trim() : "";

    for (const s of subjectsFromTimetable(tt)) {
      const key =
        s.subjectId != null && String(s.subjectId).length > 0
          ? `id:${s.subjectId}`
          : `name:${s.name.toLowerCase()}`;

      if (!byKey.has(key)) {
        byKey.set(key, {
          name: s.name,
          subjectId: s.subjectId,
          sectionIds: new Set(),
          sectionLabels: new Set(),
        });
      }
      const agg = byKey.get(key);
      for (const id of s.sectionIds) {
        if (id) agg.sectionIds.add(id);
      }
      for (const l of s.sectionLabels) {
        if (l) agg.sectionLabels.add(l);
      }
      if (rowSectionId) agg.sectionIds.add(rowSectionId);
      if (rowSectionName) agg.sectionLabels.add(rowSectionName);
    }
  }

  return Array.from(byKey.values())
    .map((row) => ({
      name: row.name,
      subjectId: row.subjectId,
      sectionIds: [...row.sectionIds],
      sectionLabels: [...row.sectionLabels].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function subjectsFromSummaryPayload(payload) {
  const rows = payload?.timetables_by_section;
  if (Array.isArray(rows) && rows.length > 0) {
    return subjectsFromTimetablesBySection(rows);
  }
  const tt = payload?.timetable;
  return tt ? subjectsFromTimetable(tt) : [];
}

function normalizeSectionIds(sections) {
  return (sections || [])
    .map((s) => (typeof s === "string" ? s : s?.value))
    .filter((id) => typeof id === "string" && id.length > 0);
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

export default function StaffHome() {
  const { auth } = useAuth();
  const [summaryPayload, setSummaryPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const firstName = useMemo(() => {
    const d = auth?.details || {};
    const fromAuth =
      d.staff_first_name?.trim() ||
      d.teacher_first_name?.trim() ||
      auth?.username?.trim();
    if (fromAuth) return fromAuth.split(/\s+/)[0] || fromAuth;
    return "there";
  }, [auth?.details, auth?.username]);

  const campusId = auth.campus_id;
  const teacherId = auth.userId;
  const teacherSections = useMemo(() => normalizeSectionIds(auth.sections), [auth.sections]);

  const canFetch = Boolean(campusId && teacherId && teacherSections.length > 0);

  const loadSummary = useCallback(async () => {
    if (!campusId || !teacherId || teacherSections.length === 0) {
      setSummaryPayload(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await postTeacherSummary({
        campusId,
        teacherId,
        teacherSections,
      });
      const { payload, message } = unwrapTeacherSummaryResponse(res);
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
  }, [campusId, teacherId, teacherSections]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const { summary, periods, currentPeriodIndex, subjects } = useMemo(() => {
    const now = new Date();
    const greeting = `${greetingForHour(now.getHours())},`;
    const dayLine = formatDisplayDate(now);

    const periodsToday = todaysPeriodsFromSummaryPayload(summaryPayload, now);
    const idx = currentPeriodIndexFor(periodsToday);
    const subjectRows = subjectsFromSummaryPayload(summaryPayload);

    return {
      summary: { greeting, firstName, dayLine },
      periods: periodsToday,
      currentPeriodIndex: idx,
      subjects: subjectRows,
    };
  }, [summaryPayload, firstName]);

  const messagesUnreadTotal =
    summaryPayload?.messages?.total_unread ?? summaryPayload?.messages?.totalUnread ?? 0;

  const upcomingHomework = useMemo(
    () => upcomingHomeworkFromPayload(summaryPayload),
    [summaryPayload]
  );

  const announcements = useMemo(
    () => announcementsFromPayload(summaryPayload),
    [summaryPayload]
  );

  const homeworkWindowCaption = useMemo(
    () => dateRangeCaption(summaryPayload?.homework?.window),
    [summaryPayload]
  );

  const announcementsWindowCaption = useMemo(
    () => dateRangeCaption(summaryPayload?.announcements?.window),
    [summaryPayload]
  );

  const homeworkCount = homeworkCountFromPayload(summaryPayload);
  const announcementsCount = announcementsCountFromPayload(summaryPayload);

  if (!canFetch) {
    return (
      <div className="min-h-full bg-[var(--color-background)] p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          <Card className="border border-gray-100 shadow-sm">
            <p className="text-center font-semibold text-gray-900">
              Your dashboard needs a campus and at least one assigned section to load. If this
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
    <div className="min-h-full bg-[var(--color-background)] p-4 pb-30 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {loading ? (
          <div className="flex justify-center py-2">
            <Loader />
          </div>
        ) : null}

        <Card className="border border-gray-100 bg-white shadow-sm dark:border-gray-800">
          <div className="flex flex-col gap-4 border-l-4 border-blue-500 pl-4 sm:flex-row sm:items-start sm:justify-between sm:pl-5">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-800">
                {summary.greeting}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">
                {summary.firstName},
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-800">
                <CalendarDays
                  size={16}
                  className="shrink-0 text-primary-700 dark:text-primary-400"
                />
                {summary.dayLine}
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/60">
              <School className="mt-0.5 shrink-0 text-primary-600" size={22} aria-hidden />
              <p className="text-sm font-semibold leading-snug text-gray-950 dark:text-gray-50">
                {teacherSections.length === 1
                  ? "You have 1 section on your timetable."
                  : `You have ${teacherSections.length} sections on your timetable.`}
              </p>
            </div>
          </div>
        </Card>

        <Link to="/staff/chat" className="block">
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
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight text-gray-950 dark:text-gray-900">
                      Messages
                    </h2>
                    {messagesUnreadTotal > 0 ? (
                      <span className="inline-flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-primary-600 px-2 text-xs font-bold text-white">
                        {messagesUnreadTotal > 99 ? "99+" : messagesUnreadTotal}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-600">
                    Chat with students and colleagues. Unread counts update while you are in a
                    conversation.
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
          <Card className="border border-gray-100 bg-white shadow-sm dark:border-gray-800">
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
                      key={`${p.sectionId || ""}-${p.start}-${p.end}-${p.subject}-${i}`}
                      className={`flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between ${
                        isCurrent
                          ? "border-blue-500 bg-sky-50 shadow-sm dark:border-blue-400 dark:bg-sky-950/40"
                          : "border-gray-100 bg-white dark:border-gray-700"
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
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-600">
                          {[p.sectionName && `Section ${p.sectionName}`, p.room !== "—" ? p.room : null]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
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

          <Card className="border border-gray-100 bg-white shadow-sm dark:border-gray-800">
            <div className="mb-4 flex items-center justify-between gap-3">
              <SectionTitle
                icon={BookOpen}
                title="Your subjects"
                wrapperClassName="mb-0 flex min-w-0 items-center gap-3"
              />
              <Link
                to="/staff/lesson-plans"
                className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Lesson plans
                <ChevronRight size={14} />
              </Link>
            </div>
            {subjects.length === 0 ? (
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-800">
                No subjects were found on your timetable. If this looks wrong, ask your
                administrator to confirm your assignments.
              </p>
            ) : (
              <ul className="space-y-2">
                {subjects.map((s) => {
                  const lessonPlansHref =
                    s.subjectId && s.sectionIds.length === 1
                      ? `/staff/lesson-plans/section/${s.sectionIds[0]}/subject/${s.subjectId}`
                      : null;
                  const inner = (
                    <>
                      <div className="flex min-w-0 items-start gap-2">
                        <Layers
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary-600"
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-950 dark:text-gray-800">
                            {s.name}
                          </p>
                          {s.sectionLabels.length > 0 ? (
                            <p className="mt-0.5 text-xs font-semibold text-gray-800 dark:text-gray-600">
                              {s.sectionLabels.join(" · ")}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {lessonPlansHref ? (
                        <ChevronRight
                          className="shrink-0 text-primary-700 dark:text-primary-400"
                          size={18}
                          aria-hidden
                        />
                      ) : null}
                    </>
                  );

                  if (lessonPlansHref) {
                    return (
                      <li key={`${s.subjectId}-${s.name}`}>
                        <Link
                          to={lessonPlansHref}
                          className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2.5 transition-all hover:border-primary-400 hover:bg-primary-50/60 dark:border-gray-700 dark:hover:border-primary-500 dark:hover:bg-primary-950/30"
                        >
                          {inner}
                        </Link>
                      </li>
                    );
                  }

                  return (
                    <li
                      key={`${s.subjectId || s.name}-${s.sectionIds.join(",")}`}
                      className="rounded-lg border border-gray-100 bg-white px-3 py-2.5 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between gap-3">{inner}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-gray-100 bg-white shadow-sm dark:border-gray-800">
            <div className="mb-4 flex items-center justify-between gap-3">
              <SectionTitle
                icon={BookOpen}
                title="Homework due"
                wrapperClassName="mb-0 flex min-w-0 items-center gap-3"
              />
              <Link
                to="/staff/homework"
                className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
              >
                View all
                <ChevronRight size={14} />
              </Link>
            </div>
            {homeworkWindowCaption ? (
              <p className="mb-3 text-xs font-semibold text-gray-800 dark:text-gray-600">
                Window: {homeworkWindowCaption}
                {summaryPayload?.homework?.due_next_days != null ? (
                  <span className="text-gray-600 dark:text-gray-500">
                    {" "}
                    · Next {summaryPayload.homework.due_next_days}{" "}
                    {summaryPayload.homework.due_next_days === 1 ? "day" : "days"}
                  </span>
                ) : null}
              </p>
            ) : homeworkCount != null && homeworkCount > 0 && upcomingHomework.length === 0 ? (
              <p className="mb-3 text-xs font-semibold text-gray-800 dark:text-gray-600">
                {homeworkCount === 1 ? "1 assignment" : `${homeworkCount} assignments`} in summary
              </p>
            ) : null}
            {upcomingHomework.length === 0 ? (
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-800">
                {homeworkCount != null && homeworkCount > 0
                  ? "Nothing due right now, or due dates have passed."
                  : "No homework due."}
              </p>
            ) : (
              <ul className="space-y-2">
                {upcomingHomework.map((h) => (
                  <li key={h.id}>
                    <Link
                      to={`/staff/homework/${h.id}`}
                      className="block rounded-lg border border-gray-100 bg-white px-3 py-2.5 transition-all hover:border-primary-400 hover:bg-primary-50/60 dark:border-gray-700 dark:hover:border-primary-500 dark:hover:bg-primary-950/30"
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-950 dark:text-gray-800">
                        {h.subject}
                      </p>
                      <p className="mt-0.5 font-semibold text-gray-950 dark:text-gray-800">
                        {h.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-gray-800 dark:text-gray-600">
                        Due {formatShortDue(h.dueDate || h.due_date)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="border border-gray-100 bg-white shadow-sm dark:border-gray-800">
            <div className="mb-4 flex items-center justify-between gap-3">
              <SectionTitle
                icon={Megaphone}
                title="Announcements"
                wrapperClassName="mb-0 flex min-w-0 items-center gap-3"
              />
            </div>
            {announcementsWindowCaption ? (
              <p className="mb-3 text-xs font-semibold text-gray-800 dark:text-gray-600">
                Window: {announcementsWindowCaption}
              </p>
            ) : announcementsCount != null &&
              announcementsCount > 0 &&
              announcements.length === 0 ? (
              <p className="mb-3 text-xs font-semibold text-gray-800 dark:text-gray-600">
                {announcementsCount === 1
                  ? "1 announcement"
                  : `${announcementsCount} announcements`}{" "}
                in summary
              </p>
            ) : null}
            {announcements.length === 0 ? (
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-800">
                {announcementsCount != null && announcementsCount > 0
                  ? "Announcements could not be listed. Try refreshing."
                  : "No announcements received."}
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
                      <p className="font-semibold text-gray-950 dark:text-gray-800">{a.title}</p>
                      {a.body ? (
                        <p className="mt-1 text-sm font-semibold leading-relaxed text-gray-900 dark:text-gray-800">
                          {a.body}
                        </p>
                      ) : null}
                      {a.date ? (
                        <p className="mt-2 text-xs font-semibold text-gray-800 dark:text-gray-600">
                          {formatShortDue(a.date)}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
