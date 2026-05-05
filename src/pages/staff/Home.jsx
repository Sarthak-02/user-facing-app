import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "../../ui-components";
import Modal from "../../ui-components/Modal";
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
  ClipboardList,
  Clock,
  Layers,
  Megaphone,
  MessageCircle,
  School,
  UserCheck,
} from "lucide-react";

const JS_DAY_TO_API_DAY_ID = {
  0: "day-7",
  1: "day-1",
  2: "day-2",
  3: "day-3",
  4: "day-4",
  5: "day-5",
  6: "day-6",
};

const STAFF_NON_CLASS_SLOT_TYPES = new Set(["assembly", "lunch", "break"]);

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

function greetingKeyForHour(hour) {
  if (hour < 12) return "home.greeting.morning";
  if (hour < 17) return "home.greeting.afternoon";
  return "home.greeting.evening";
}

function formatDisplayDate(d, locale) {
  return d.toLocaleDateString(locale || undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortDue(iso, locale) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale || undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

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
      title: (h.title ?? h.homework_title ?? "").toString().trim(),
      subject: (typeof subjectRaw === "string" ? subjectRaw : subjectRaw?.name ?? "")
        .toString()
        .trim(),
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
    title: b.title?.trim?.() || "",
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

function buildTodaysPeriods(timetable, now = new Date(), sectionMeta = null, slotLabel = null) {
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
    } else if (slot?.type && STAFF_NON_CLASS_SLOT_TYPES.has(slot.type)) {
      subject = slotLabel ? slotLabel(slot.type) : slot.type;
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

function todaysPeriodsFromSummaryPayload(payload, now = new Date(), slotLabel = null) {
  const rows = payload?.timetables_by_section;
  if (Array.isArray(rows) && rows.length > 0) {
    const merged = [];
    for (const row of rows) {
      if (!row?.timetable) continue;
      const periods = buildTodaysPeriods(row.timetable, now, {
        sectionName: row.section_name,
        sectionId: row.section_id,
      }, slotLabel);
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
  return tt ? buildTodaysPeriods(tt, now, null, slotLabel) : [];
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

function homeworkUrgency(dueDate) {
  if (!dueDate) return "normal";
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return "normal";
  const diffDays = (due - new Date()) / (1000 * 60 * 60 * 24);
  if (diffDays < 1) return "urgent";
  if (diffDays < 3) return "soon";
  return "normal";
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

function periodSubjectLabel(period, t) {
  if (!period) return "";
  if (period.slotType === "lunch") return t("home.slots.lunch");
  if (period.slotType === "assembly") return t("home.slots.assembly");
  if (period.slotType === "break") return t("home.slots.break");
  return period.subject ?? "";
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

export default function StaffHome() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [summaryPayload, setSummaryPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false);

  const firstName = useMemo(() => {
    const d = auth?.details || {};
    const fromAuth =
      d.staff_first_name?.trim() ||
      d.teacher_first_name?.trim() ||
      auth?.username?.trim();
    if (fromAuth) return fromAuth.split(/\s+/)[0] || fromAuth;
    return t("home.greeting.nameFallback");
  }, [auth?.details, auth?.username, t]);

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
        setError(message || t("home.staff.errorCouldNotLoadSummary"));
      }
    } catch (e) {
      setSummaryPayload(null);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        t("home.staff.errorFailedToLoadSummary");
      setError(typeof msg === "string" ? msg : t("home.staff.errorFailedToLoadSummary"));
    } finally {
      setLoading(false);
    }
  }, [campusId, teacherId, teacherSections, t]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const { summary, periods, currentPeriodIndex, subjects } = useMemo(() => {
    const now = new Date();
    const greeting = `${t(greetingKeyForHour(now.getHours()))},`;
    const dayLine = formatDisplayDate(now, i18n.language);

    const periodsToday = todaysPeriodsFromSummaryPayload(summaryPayload, now, (type) =>
      t(`home.slots.${type}`)
    );
    const idx = currentPeriodIndexFor(periodsToday);
    const subjectRows = subjectsFromSummaryPayload(summaryPayload);

    return {
      summary: { greeting, firstName, dayLine },
      periods: periodsToday,
      currentPeriodIndex: idx,
      subjects: subjectRows,
    };
  }, [summaryPayload, firstName, t, i18n.language]);

  const messagesUnreadTotal =
    summaryPayload?.messages?.total_unread ?? summaryPayload?.messages?.totalUnread ?? 0;

  const activeClassInfo = useMemo(() => {
    if (periods.length === 0) return null;
    const mins = nowMinutes();
    // Current period
    if (currentPeriodIndex !== -1) {
      return { kind: "now", period: periods[currentPeriodIndex] };
    }
    // Next upcoming period
    const next = periods.find((p) => timeToMinutes(p.start) > mins);
    if (next) return { kind: "next", period: next };
    return null;
  }, [periods, currentPeriodIndex]);

  const upcomingHomework = useMemo(
    () => upcomingHomeworkFromPayload(summaryPayload),
    [summaryPayload]
  );

  const announcements = useMemo(
    () => announcementsFromPayload(summaryPayload),
    [summaryPayload]
  );

  if (!canFetch) {
    return (
      <div className="min-h-full bg-[var(--color-background)] p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          <Card className="border border-gray-100 shadow-sm">
            <p className="text-center font-semibold text-gray-900">
              {t("home.staff.needsSetup")}
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
                {t("common.tryAgain")}
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const currentNowMinutes = nowMinutes();

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
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl font-bold text-white">
                {summary.firstName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-indigo-200">{summary.greeting}</p>
                <h1 className="text-2xl font-bold tracking-tight text-white">{summary.firstName}</h1>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-indigo-100">
                  <CalendarDays size={12} className="shrink-0" />
                  {summary.dayLine}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 backdrop-blur-sm">
                  <School size={14} className="shrink-0 text-indigo-100" aria-hidden />
                  <p className="text-xs font-semibold text-white">
                    {t("home.staff.sectionCount", { count: teacherSections.length })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Current / next class strip */}
          {activeClassInfo ? (
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 shadow-sm transition-all hover:shadow-md active:scale-[0.99] ${
                activeClassInfo.kind === "now"
                  ? "border-sky-300 bg-sky-50"
                  : "border-gray-100 bg-white"
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                activeClassInfo.kind === "now" ? "bg-sky-500 text-white" : "bg-sky-100 text-sky-600"
              }`}>
                <Clock size={15} />
              </span>
              <div className="min-w-0 flex-1 text-left">
                <p className={`text-xs font-bold uppercase tracking-wide ${
                  activeClassInfo.kind === "now" ? "text-sky-600" : "text-gray-500"
                }`}>
                  {activeClassInfo.kind === "now" ? t("home.staff.period.now") : t("home.staff.period.upNext")}
                </p>
                <p className="truncate font-semibold text-gray-900">
                  {periodSubjectLabel(activeClassInfo.period, t)}
                  {activeClassInfo.period.sectionName ? (
                    <span className="ml-1.5 font-normal text-gray-600">· {activeClassInfo.period.sectionName}</span>
                  ) : null}
                </p>
              </div>
              <p className="shrink-0 font-mono text-xs font-semibold text-gray-900">
                {activeClassInfo.period.start}–{activeClassInfo.period.end}
              </p>
              <ChevronRight size={14} className="shrink-0 text-gray-400" />
            </button>
          ) : null}

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <QuickStat
              icon={Clock}
              label={t("home.staff.stats.todaysClasses")}
              value={periods.length}
              colorClass="bg-sky-100 text-sky-600"
              onClick={() => setIsScheduleModalOpen(true)}
              hint={t("home.staff.tapToView")}
            />
            <QuickStat
              icon={BookOpen}
              label={t("home.staff.stats.subjects")}
              value={subjects.length}
              colorClass="bg-emerald-100 text-emerald-600"
              onClick={() => setIsSubjectsModalOpen(true)}
              hint={t("home.staff.tapToView")}
            />
            <QuickStat
              icon={Bell}
              label={t("home.staff.stats.homeworkDue")}
              value={upcomingHomework.length}
              colorClass="bg-amber-100 text-amber-600"
              onClick={() => setIsHomeworkModalOpen(true)}
              hint={t("home.staff.tapToView")}
            />
            <QuickStat
              icon={Megaphone}
              label={t("home.staff.stats.announcements")}
              value={announcements.length}
              colorClass="bg-purple-100 text-purple-600"
              onClick={() => setIsAnnouncementsModalOpen(true)}
              hint={t("home.staff.tapToView")}
            />
          </div>

          {/* Messages quick link */}
          <button
            type="button"
            onClick={() => navigate("/staff/chat")}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-all hover:border-primary-300 hover:shadow-md active:scale-[0.99]"
          >
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <MessageCircle size={16} />
              {messagesUnreadTotal > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[9px] font-bold text-white">
                  {messagesUnreadTotal > 9 ? t("common.unreadOverflow") : messagesUnreadTotal}
                </span>
              ) : null}
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-semibold text-gray-900">{t("home.staff.messages.title")}</p>
              <p className="text-xs text-gray-400">
                {messagesUnreadTotal > 0 ? t("home.staff.messages.unread", { count: messagesUnreadTotal }) : t("home.staff.messages.noNew")}
              </p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-gray-400" />
          </button>

          {/* Quick nav links */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { to: "/staff/attendance", icon: UserCheck, labelKey: "home.staff.quickNav.attendance", color: "text-sky-600 bg-sky-50" },
              { to: "/staff/homework", icon: ClipboardList, labelKey: "home.staff.quickNav.homework", color: "text-amber-600 bg-amber-50" },
              { to: "/staff/lesson-plans", icon: Layers, labelKey: "home.staff.quickNav.lessonPlans", color: "text-emerald-600 bg-emerald-50" },
              { to: "/staff/exams", icon: BookOpen, labelKey: "home.staff.quickNav.exams", color: "text-violet-600 bg-violet-50" },
            ].map(({ to, icon, labelKey, color }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-3 shadow-sm transition-all hover:border-primary-300 hover:shadow-md active:scale-[0.99]"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                  {createElement(icon, { size: 16 })}
                </span>
                <p className="text-sm font-semibold text-gray-800">{t(labelKey)}</p>
                <ChevronRight size={14} className="ml-auto shrink-0 text-gray-300" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule modal */}
      <Modal
        open={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        className="max-w-sm"
      >
        <h2 className="mb-4 pr-6 text-base font-bold text-gray-900">{t("home.staff.todaysSchedule")}</h2>
        {periods.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">{t("home.staff.noClassesScheduled")}</p>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {periods.map((p, i) => {
              const isCurrent = i === currentPeriodIndex;
              const isPast = !isCurrent && timeToMinutes(p.end) < currentNowMinutes;
              return (
                <li
                  key={`${p.sectionId || ""}-${p.start}-${p.end}-${p.subject}-${i}`}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isCurrent
                      ? "border-l-[3px] border-sky-500 bg-sky-50 pl-[9px]"
                      : isPast
                        ? "border border-gray-100 bg-gray-50 opacity-60"
                        : "border border-gray-100 bg-white"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      isCurrent
                        ? "bg-sky-500 text-white"
                        : isPast
                          ? "bg-gray-200 text-gray-400"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-semibold ${isCurrent ? "text-sky-900" : "text-gray-900"}`}>
                      {periodSubjectLabel(p, t)}
                      {isCurrent ? (
                        <span className="ml-2 inline-flex items-center gap-1 rounded bg-sky-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                          {t("home.staff.period.now")}
                        </span>
                      ) : null}
                    </p>
                    {p.sectionName ? (
                      <p className="text-xs text-gray-900">{t("home.staff.period.section", { name: p.sectionName })}{p.room !== "—" ? ` · ${p.room}` : ""}</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 font-mono text-xs font-semibold tabular-nums text-gray-900">
                    {p.start}–{p.end}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>

      {/* Subjects modal */}
      <Modal
        open={isSubjectsModalOpen}
        onClose={() => setIsSubjectsModalOpen(false)}
        className="max-w-sm"
      >
        <h2 className="mb-4 pr-6 text-base font-bold text-gray-900">{t("home.staff.yourSubjects")}</h2>
        {subjects.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">{t("home.staff.noSubjectsFound")}</p>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {subjects.map((s) => {
              const lessonPlansHref =
                s.subjectId && s.sectionIds.length === 1
                  ? `/staff/lesson-plans/section/${s.sectionIds[0]}/subject/${s.subjectId}`
                  : null;
              const inner = (
                <>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Layers size={14} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    {s.sectionLabels.length > 0 ? (
                      <p className="text-xs text-gray-400">{s.sectionLabels.join(" · ")}</p>
                    ) : null}
                  </div>
                  {lessonPlansHref ? (
                    <ChevronRight size={14} className="shrink-0 text-gray-300" aria-hidden />
                  ) : null}
                </>
              );

              if (lessonPlansHref) {
                return (
                  <li key={`${s.subjectId}-${s.name}`}>
                    <Link
                      to={lessonPlansHref}
                      onClick={() => setIsSubjectsModalOpen(false)}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 transition-all hover:border-emerald-300 hover:bg-emerald-50/50"
                    >
                      {inner}
                    </Link>
                  </li>
                );
              }
              return (
                <li
                  key={`${s.subjectId || s.name}-${s.sectionIds.join(",")}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-3"
                >
                  {inner}
                </li>
              );
            })}
          </ul>
        )}
        <Link
          to="/staff/lesson-plans"
          onClick={() => setIsSubjectsModalOpen(false)}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
        >
          {t("home.staff.allLessonPlans")}
          <ChevronRight size={14} />
        </Link>
      </Modal>

      {/* Homework modal */}
      <Modal
        open={isHomeworkModalOpen}
        onClose={() => setIsHomeworkModalOpen(false)}
        className="max-w-sm"
      >
        <h2 className="mb-4 pr-6 text-base font-bold text-gray-900">{t("home.staff.homeworkDue")}</h2>
        {upcomingHomework.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">{t("home.staff.noHomeworkDue")}</p>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {upcomingHomework.map((h) => {
              const urgency = homeworkUrgency(h.dueDate || h.due_date);
              const days = daysUntil(h.dueDate || h.due_date);
              return (
                <li key={h.id}>
                  <Link
                    to={`/staff/homework/${h.id}`}
                    onClick={() => setIsHomeworkModalOpen(false)}
                    className={`block rounded-lg border p-3 transition-all ${
                      urgency === "urgent"
                        ? "border-red-200 bg-red-50/60 hover:border-red-300"
                        : urgency === "soon"
                          ? "border-amber-200 bg-amber-50/60 hover:border-amber-300"
                          : "border-gray-100 hover:border-primary-300 hover:bg-primary-50/50"
                    }`}
                  >
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        urgency === "urgent"
                          ? "bg-red-100 text-red-700"
                          : urgency === "soon"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-primary-50 text-primary-700"
                      }`}
                    >
                      {h.subject?.trim() ? h.subject : t("common.na")}
                    </span>
                    <p className="mt-1.5 font-semibold text-gray-900">
                      {h.title?.trim() ? h.title : t("home.staff.fallbackHomeworkTitle")}
                    </p>
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
                          {days === 0
                            ? t("common.dueToday")
                            : days === 1
                              ? t("common.tomorrow")
                              : t("common.daysLeft", { days })}
                        </span>
                      ) : null}
                      <p className="text-xs text-gray-400">
                        {formatShortDue(h.dueDate || h.due_date, i18n.language)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          to="/staff/homework"
          onClick={() => setIsHomeworkModalOpen(false)}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100"
        >
          {t("home.staff.viewAllHomework")}
          <ChevronRight size={14} />
        </Link>
      </Modal>

      {/* Announcements modal */}
      <Modal
        open={isAnnouncementsModalOpen}
        onClose={() => setIsAnnouncementsModalOpen(false)}
        className="max-w-sm"
      >
        <h2 className="mb-4 pr-6 text-base font-bold text-gray-900">{t("home.staff.announcements")}</h2>
        {announcements.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">{t("home.staff.noAnnouncements")}</p>
        ) : (
          <ul className="max-h-[60vh] divide-y divide-gray-100 overflow-y-auto">
            {announcements.map((a) => (
              <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex gap-3">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600"
                    aria-hidden
                  >
                    <Megaphone size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">
                      {a.title?.trim()
                        ? a.title
                        : t("home.staff.announcementFallback")}
                    </p>
                    {a.body ? (
                      <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{a.body}</p>
                    ) : null}
                    {a.date ? (
                      <p className="mt-1 text-xs text-gray-400">{formatShortDue(a.date, i18n.language)}</p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}
