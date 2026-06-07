import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "../../ui-components";
import Modal from "../../ui-components/Modal";
import { StaffHomeShimmer } from "../../ui-components/Shimmer";
import { useAuth } from "../../store/auth.store";
import { usePermissions } from "../../store/permissions.store";
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

const SUBJECT_COLOR_PALETTE = [
  { cardBg: "bg-blue-50", iconBg: "bg-blue-200", iconColor: "text-blue-800", borderLeft: "border-l-blue-500", pill: "bg-blue-200 text-blue-900", accent: "text-blue-800" },
  { cardBg: "bg-violet-50", iconBg: "bg-violet-200", iconColor: "text-violet-800", borderLeft: "border-l-violet-500", pill: "bg-violet-200 text-violet-900", accent: "text-violet-800" },
  { cardBg: "bg-emerald-50", iconBg: "bg-emerald-200", iconColor: "text-emerald-800", borderLeft: "border-l-emerald-500", pill: "bg-emerald-200 text-emerald-900", accent: "text-emerald-800" },
  { cardBg: "bg-amber-50", iconBg: "bg-amber-200", iconColor: "text-amber-800", borderLeft: "border-l-amber-500", pill: "bg-amber-200 text-amber-900", accent: "text-amber-800" },
  { cardBg: "bg-rose-50", iconBg: "bg-rose-200", iconColor: "text-rose-800", borderLeft: "border-l-rose-500", pill: "bg-rose-200 text-rose-900", accent: "text-rose-800" },
  { cardBg: "bg-cyan-50", iconBg: "bg-cyan-200", iconColor: "text-cyan-800", borderLeft: "border-l-cyan-500", pill: "bg-cyan-200 text-cyan-900", accent: "text-cyan-800" },
  { cardBg: "bg-orange-50", iconBg: "bg-orange-200", iconColor: "text-orange-800", borderLeft: "border-l-orange-500", pill: "bg-orange-200 text-orange-900", accent: "text-orange-800" },
  { cardBg: "bg-indigo-50", iconBg: "bg-indigo-200", iconColor: "text-indigo-800", borderLeft: "border-l-indigo-500", pill: "bg-indigo-200 text-indigo-900", accent: "text-indigo-800" },
];

function subjectColors(name) {
  const n = (name || "").toLowerCase();
  if (/math|maths|arithmetic|algebra|geometry|calculus|statistics/.test(n)) return SUBJECT_COLOR_PALETTE[0];
  if (/physics/.test(n)) return SUBJECT_COLOR_PALETTE[5];
  if (/chemistry|chemical/.test(n)) return SUBJECT_COLOR_PALETTE[1];
  if (/biology|bio/.test(n)) return SUBJECT_COLOR_PALETTE[2];
  if (/science|evs/.test(n)) return SUBJECT_COLOR_PALETTE[5];
  if (/english|literature|reading|writing/.test(n)) return SUBJECT_COLOR_PALETTE[1];
  if (/hindi|urdu|tamil|telugu|kannada|malayalam|bengali|marathi|sanskrit|language/.test(n)) return SUBJECT_COLOR_PALETTE[6];
  if (/history|social|civics|political/.test(n)) return SUBJECT_COLOR_PALETTE[3];
  if (/computer|ict|coding|programming|technology/.test(n)) return SUBJECT_COLOR_PALETTE[7];
  if (/art|craft|drawing|paint/.test(n)) return SUBJECT_COLOR_PALETTE[4];
  let h = 0;
  for (const c of n) h = (h * 31 + c.charCodeAt(0)) | 0;
  return SUBJECT_COLOR_PALETTE[Math.abs(h) % SUBJECT_COLOR_PALETTE.length];
}

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

    if (entry.isElective && Array.isArray(entry.electives)) {
      return {
        start,
        end,
        subject: slotLabel ? slotLabel("elective") : "Elective",
        subjectId: null,
        room: "",
        slotType: slot?.type ?? "elective",
        sectionName,
        sectionId,
        isElective: true,
        electives: entry.electives,
      };
    }

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
    const rawSubjectId =
      entry.subjectId ??
      entry.subject_id ??
      (entry.subject && typeof entry.subject === "object" ? entry.subject.id : null) ??
      null;
    return {
      start,
      end,
      subject,
      subjectId: rawSubjectId != null && String(rawSubjectId).length > 0 ? String(rawSubjectId) : null,
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
    .map((s) => s.section_id)
    
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
  if (period.isElective) return t("home.slots.elective");
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
      { className: `flex h-9 w-9 items-center justify-center rounded-full ${colorClass}` },
      createElement(icon, { size: 18, strokeWidth: 2 })
    ),
    createElement("p", { className: "text-2xl font-bold tabular-nums leading-none text-gray-900" }, value),
    createElement("p", { className: "w-full text-center text-xs font-semibold leading-snug text-gray-600" }, label),
    hint
      ? createElement("p", { className: "w-full text-center text-[11px] font-medium leading-snug text-primary-600 mt-0.5" }, hint)
      : null
  );
}

function QuickStat({ icon, label, value, colorClass, onClick, hint }) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-3.5 shadow-sm transition-all hover:border-primary-300 hover:shadow-md active:scale-95"
      >
        <QuickStatContent icon={icon} label={label} value={value} colorClass={colorClass} hint={hint} />
      </button>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-3.5 shadow-sm">
      <QuickStatContent icon={icon} label={label} value={value} colorClass={colorClass} />
    </div>
  );
}

export default function StaffHome() {
  const { auth } = useAuth();
  const { isFeatureEnabled, getSubjectsBySection } = usePermissions();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [summaryPayload, setSummaryPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
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

  const staffQuickNav = useMemo(
    () =>
      [
        {
          to: "/staff/attendance",
          icon: UserCheck,
          labelKey: "home.staff.quickNav.attendance",
          color: "text-sky-600 bg-sky-50",
          feature: "staff_attendance_mark",
        },
        {
          to: "/staff/homework",
          icon: ClipboardList,
          labelKey: "home.staff.quickNav.homework",
          color: "text-amber-600 bg-amber-50",
          feature: "staff_homework",
        },
        {
          to: "/staff/lesson-plans",
          icon: Layers,
          labelKey: "home.staff.quickNav.lessonPlans",
          color: "text-emerald-600 bg-emerald-50",
          feature: "staff_lesson_plans",
        },
        {
          to: "/staff/exams",
          icon: BookOpen,
          labelKey: "home.staff.quickNav.exams",
          color: "text-violet-600 bg-violet-50",
          feature: "staff_exams",
        },
      ].filter((item) => isFeatureEnabled(item.feature)),
    [isFeatureEnabled]
  );

  const lessonPlansEnabled = isFeatureEnabled("staff_lesson_plans");
  const homeworkEnabled = isFeatureEnabled("staff_homework");
  const messagesEnabled = isFeatureEnabled("staff_messages");

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

  const { summary, periods, currentPeriodIndex } = useMemo(() => {
    const now = new Date();
    const greeting = `${t(greetingKeyForHour(now.getHours()))},`;
    const dayLine = formatDisplayDate(now, i18n.language);

    const periodsToday = todaysPeriodsFromSummaryPayload(summaryPayload, now, (type) =>
      t(`home.slots.${type}`)
    );
    const idx = currentPeriodIndexFor(periodsToday);

    return {
      summary: { greeting, firstName, dayLine },
      periods: periodsToday,
      currentPeriodIndex: idx,
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

  const sectionSubjectLookup = useMemo(() => {
    const map = new Map();
    const uniqueSectionIds = [...new Set(periods.filter((p) => p.sectionId).map((p) => p.sectionId))];
    for (const sectionId of uniqueSectionIds) {
      const subs = getSubjectsBySection(sectionId);
      map.set(sectionId, new Map(subs.map((s) => [(s.subject_name || "").toLowerCase(), s.subject_id])));
    }
    return map;
  }, [periods, getSubjectsBySection]);

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
    return <StaffHomeShimmer />;
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
      <div className="min-h-full bg-[var(--color-background)] p-4 pb-8 md:p-6">
        <div className="mx-auto max-w-5xl space-y-4">
          {/* Hero card */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 shadow-lg md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4 min-w-0 flex-1">
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
              </div>
              <div className="flex shrink-0 sm:self-start">
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <QuickStat
              icon={Clock}
              label={t("home.staff.stats.todaysClasses")}
              value={periods.length}
              colorClass="bg-sky-100 text-sky-600"
              onClick={() => setIsScheduleModalOpen(true)}
              hint={t("home.staff.tapToView")}
            />
            {messagesEnabled ? (
              <QuickStat
                icon={MessageCircle}
                label={t("home.staff.messages.title")}
                value={messagesUnreadTotal}
                colorClass="bg-primary-100 text-primary-600"
                onClick={() => navigate("/staff/chat")}
                hint={t("home.staff.tapToView")}
              />
            ) : null}
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

          {/* Quick nav links */}
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {staffQuickNav.map(({ to, icon, labelKey, color }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-3 shadow-sm transition-all hover:border-primary-300 hover:shadow-md active:scale-[0.99]"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                  {createElement(icon, { size: 16 })}
                </span>
                <p className="flex-1 min-w-0 truncate text-sm font-semibold text-gray-800">{t(labelKey)}</p>
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
        className="max-w-sm sm:max-w-md"
      >
        <div className="mb-4 pr-6">
          <h2 className="text-base font-bold text-gray-900">{t("home.staff.todaysSchedule")}</h2>
          {lessonPlansEnabled && periods.some(
            (p) =>
              !STAFF_NON_CLASS_SLOT_TYPES.has(p.slotType) &&
              p.sectionId &&
              sectionSubjectLookup.get(p.sectionId)?.get((p.subject || "").toLowerCase())
          ) ? (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <Layers size={11} aria-hidden />
              Tap a class to open its lesson plan
            </p>
          ) : null}
        </div>
        {periods.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">{t("home.staff.noClassesScheduled")}</p>
        ) : (
          <ul className="max-h-[60vh] space-y-2.5 overflow-y-auto">
            {periods.map((p, i) => {
              const isCurrent = i === currentPeriodIndex;
              const isPast = !isCurrent && timeToMinutes(p.end) < currentNowMinutes;

              if (p.isElective) {
                return (
                  <li
                    key={`${p.sectionId || ""}-${p.start}-${p.end}-elective-${i}`}
                    className={[
                      "rounded-xl border border-l-4 px-3 py-2.5 transition-all",
                      isCurrent
                        ? "border-sky-300 border-l-sky-500 bg-sky-50"
                        : isPast
                          ? "border-violet-100 border-l-violet-300 bg-violet-50/40 opacity-60"
                          : "border-violet-200 border-l-violet-500 bg-violet-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        isCurrent ? "bg-sky-500" : "bg-violet-200"
                      }`}>
                        <BookOpen
                          size={16}
                          className={isCurrent ? "text-white" : "text-violet-800"}
                          aria-hidden
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <p className={`font-semibold text-sm ${isCurrent ? "text-sky-900" : "text-violet-900"}`}>
                            {t("home.slots.elective")}
                          </p>
                          <span className="rounded-full bg-violet-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800">
                            {t("home.slots.elective")}
                          </span>
                          {isCurrent ? (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                              {t("home.staff.period.now")}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          {p.sectionName ? (
                            <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                              isCurrent ? "bg-sky-100 text-sky-700" : "bg-violet-200 text-violet-900"
                            }`}>
                              {p.sectionName}
                            </span>
                          ) : null}
                          <span className="font-mono text-xs tabular-nums text-gray-800">{p.start}–{p.end}</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {p.electives.map((el, ei) => (
                            <span
                              key={ei}
                              className="inline-flex items-center gap-1 rounded-md border border-violet-100 bg-white px-2 py-0.5 text-xs font-semibold text-violet-700"
                            >
                              {el.subject}
                              {el.room ? (
                                <span className="font-normal text-violet-400">· {el.room}</span>
                              ) : null}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              }

              const isNonClass = STAFF_NON_CLASS_SLOT_TYPES.has(p.slotType);
              const matchedSubjectId =
                p.sectionId && p.subject
                  ? sectionSubjectLookup.get(p.sectionId)?.get(p.subject.toLowerCase())
                  : undefined;
              const lessonPlanHref =
                lessonPlansEnabled && matchedSubjectId && p.sectionId && !isNonClass
                  ? `/staff/lesson-plans/section/${p.sectionId}/subject/${matchedSubjectId}`
                  : null;
              const colors = isNonClass ? null : subjectColors(p.subject);

              const cardClass = [
                "flex items-center gap-3 rounded-xl border border-gray-200 border-l-4 px-3 py-2.5 transition-all",
                isCurrent
                  ? "border-l-sky-500 bg-sky-50"
                  : isNonClass
                    ? "border-l-gray-300 bg-gray-100"
                    : lessonPlanHref
                      ? `${colors.borderLeft} ${colors.cardBg} hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]`
                      : `${colors.borderLeft} ${colors.cardBg}`,
              ].filter(Boolean).join(" ");

              const itemContent = (
                <>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isCurrent ? "bg-sky-500" : isNonClass ? "bg-gray-200" : colors.iconBg
                  }`}>
                    <BookOpen
                      size={16}
                      className={isCurrent ? "text-white" : isNonClass ? "text-gray-500" : colors.iconColor}
                      aria-hidden
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className={`font-semibold text-sm ${isCurrent ? "text-sky-900" : "text-gray-900"}`}>
                        {periodSubjectLabel(p, t)}
                      </p>
                      {isCurrent ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                          {t("home.staff.period.now")}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {p.sectionName ? (
                        <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                          isCurrent ? "bg-sky-100 text-sky-700" : colors?.pill || "bg-gray-100 text-gray-600"
                        }`}>
                          {p.sectionName}
                        </span>
                      ) : null}
                      <span className="font-mono text-xs tabular-nums text-gray-800">{p.start}–{p.end}</span>
                      {p.room && p.room !== "—" ? (
                        <span className="text-xs text-gray-700">{p.room}</span>
                      ) : null}
                    </div>
                    {lessonPlanHref && !isPast ? (
                      <p className={`mt-1.5 flex items-center gap-1 text-[11px] font-semibold ${colors.accent}`}>
                        <Layers size={11} aria-hidden />
                        Lesson Plan
                      </p>
                    ) : null}
                  </div>
                  {lessonPlanHref ? (
                    <ChevronRight size={16} className={`shrink-0 ${colors.iconColor}`} aria-hidden />
                  ) : null}
                </>
              );

              return lessonPlanHref ? (
                <li key={`${p.sectionId || ""}-${p.start}-${p.end}-${p.subject}-${i}`}>
                  <Link
                    to={lessonPlanHref}
                    onClick={() => setIsScheduleModalOpen(false)}
                    className={cardClass}
                  >
                    {itemContent}
                  </Link>
                </li>
              ) : (
                <li
                  key={`${p.sectionId || ""}-${p.start}-${p.end}-${p.subject}-${i}`}
                  className={cardClass}
                >
                  {itemContent}
                </li>
              );
            })}
          </ul>
        )}
      </Modal>

      {/* Homework modal */}
      <Modal
        open={isHomeworkModalOpen}
        onClose={() => setIsHomeworkModalOpen(false)}
        className="max-w-sm sm:max-w-md"
      >
        <h2 className="mb-4 pr-6 text-base font-bold text-gray-900">{t("home.staff.homeworkDue")}</h2>
        {upcomingHomework.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">{t("home.staff.noHomeworkDue")}</p>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {upcomingHomework.map((h) => {
              const urgency = homeworkUrgency(h.dueDate || h.due_date);
              const days = daysUntil(h.dueDate || h.due_date);
              const cardClass = `block rounded-lg border p-3 transition-all ${
                urgency === "urgent"
                  ? "border-red-200 bg-red-50/60 hover:border-red-300"
                  : urgency === "soon"
                    ? "border-amber-200 bg-amber-50/60 hover:border-amber-300"
                    : "border-gray-100 hover:border-primary-300 hover:bg-primary-50/50"
              }`;
              const cardBody = (
                <>
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
                </>
              );
              return (
                <li key={h.id}>
                  {homeworkEnabled ? (
                    <Link
                      to={`/staff/homework/${h.id}`}
                      onClick={() => setIsHomeworkModalOpen(false)}
                      className={cardClass}
                    >
                      {cardBody}
                    </Link>
                  ) : (
                    <div className={cardClass}>{cardBody}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {homeworkEnabled ? (
          <Link
            to="/staff/homework"
            onClick={() => setIsHomeworkModalOpen(false)}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100"
          >
            {t("home.staff.viewAllHomework")}
            <ChevronRight size={14} />
          </Link>
        ) : null}
      </Modal>

      {/* Announcements modal */}
      <Modal
        open={isAnnouncementsModalOpen}
        onClose={() => setIsAnnouncementsModalOpen(false)}
        className="max-w-sm sm:max-w-md"
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
