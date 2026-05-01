import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Card, Loader, Button } from "../../ui-components";
import { getStudentGradesReport, getReportDashboardConfig } from "../../api/student.api";
import { useAuth } from "../../store/auth.store";
import {
  BarChart3,
  BookMarked,
  CheckCircle2,
  Layers,
  RefreshCw,
  Star,
  TrendingUp,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

function parseScore(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function gradePasses(item) {
  if (!item.is_graded) return null;
  const score = parseScore(item.grades_obtained);
  const pass = item.grading_extras?.passing_value;
  if (score == null || pass == null) return null;
  return score >= pass;
}

function formatGrade(item) {
  if (item.grades_obtained == null || item.grades_obtained === "") return "—";
  const v = String(item.grades_obtained);
  if (item.grading_type === "PERCENTAGE") return `${v}%`;
  if (item.grading_type === "GPA") return `${v} GPA`;
  return v;
}

function formatShortDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function averageForType(rows, type) {
  const nums = rows
    .filter((r) => r.grading_type === type && r.is_graded)
    .map((r) => parseScore(r.grades_obtained))
    .filter((n) => n != null);
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function averageGrade(rows) {
  const nums = rows
    .filter((r) => r.is_graded)
    .map((r) => parseScore(r.grades_obtained))
    .filter((n) => n != null);
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function getRatingLabel(value, labels) {
  if (!labels) return null;
  return labels.find((l) => l.value === Math.round(value)) ?? null;
}

function formatAvgWithConfig(avg, ratingScale) {
  if (avg == null) return "—";
  if (!ratingScale) return `${avg.toFixed(1)}%`;
  if (ratingScale.type === "stars") return `${avg.toFixed(1)} / ${ratingScale.points}★`;
  if (ratingScale.type === "emoji") {
    const idx = Math.round(avg) - 1;
    return ratingScale.emoji_set?.[idx] ?? avg.toFixed(1);
  }
  return `${avg.toFixed(1)}`;
}

function getSubjectInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const SUBJECT_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
];

const CHART_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
];

function subjectColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
}

// ─── UI primitives ───────────────────────────────────────────────────────────

function PassBadge({ passes }) {
  if (passes === null) return <span className="text-xs font-semibold text-gray-400">—</span>;
  return passes ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Pass
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-600/20">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Below target
    </span>
  );
}

function ScorePill({ children, muted }) {
  if (muted) return <span className="text-sm font-medium italic text-gray-400">{children}</span>;
  return (
    <span className="inline-flex min-w-[3.25rem] justify-center rounded-lg bg-primary-50 px-2.5 py-1 text-sm font-semibold tabular-nums text-gray-950 ring-1 ring-primary-700/25">
      {children}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, hint, accent, children }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start gap-3">
        <div className={`shrink-0 rounded-xl p-2.5 ${accent ?? "bg-primary-50 text-primary-700"}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="mt-0.5 truncate text-2xl font-bold text-gray-900">{value}</p>
          {hint ? <p className="mt-0.5 text-xs text-gray-500">{hint}</p> : null}
          {children}
        </div>
      </div>
    </Card>
  );
}

function PassRateBar({ passed, total }) {
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  return (
    <div className="mt-3">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs font-semibold text-emerald-700">{pct}% pass rate</p>
    </div>
  );
}

function ExamPassBar({ passCount, belowCount, total }) {
  const passW = total > 0 ? (passCount / total) * 100 : 0;
  const belowW = total > 0 ? (belowCount / total) * 100 : 0;
  return (
    <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${passW}%` }} />
      <div className="h-full bg-red-400 transition-all" style={{ width: `${belowW}%` }} />
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold transition-colors ${
        active ? "border-b-2 border-primary-600 text-primary-700" : "text-gray-500 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Rating display ───────────────────────────────────────────────────────────

function StarRating({ value, max = 5, labels }) {
  const rounded = Math.round(value);
  const label = getRatingLabel(value, labels);
  const color = label?.color ?? "#f59e0b";
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            size={14}
            fill={i < rounded ? color : "none"}
            stroke={i < rounded ? color : "#d1d5db"}
            strokeWidth={1.5}
          />
        ))}
      </div>
      {label && (
        <span className="text-xs font-semibold" style={{ color }}>
          {label.label}
        </span>
      )}
    </div>
  );
}

function EmojiRating({ value, emojiSet, labels }) {
  const idx = Math.round(value) - 1;
  const emoji = emojiSet?.[idx];
  const label = labels?.[idx];
  if (!emoji) return <ScorePill>{value}</ScorePill>;
  return (
    <span className="flex items-center gap-1">
      <span className="text-base">{emoji}</span>
      {label && (
        <span className="text-xs font-semibold" style={{ color: label.color }}>
          {label.label}
        </span>
      )}
    </span>
  );
}

function GradeDisplay({ item, ratingScale }) {
  if (!item.is_graded) return <ScorePill muted>Pending</ScorePill>;
  const value = parseScore(item.grades_obtained);
  if (value == null) return <ScorePill muted>—</ScorePill>;
  if (ratingScale?.type === "stars") {
    return <StarRating value={value} max={ratingScale.points} labels={ratingScale.labels} />;
  }
  if (ratingScale?.type === "emoji") {
    return <EmojiRating value={value} emojiSet={ratingScale.emoji_set} labels={ratingScale.labels} />;
  }
  return <ScorePill>{formatGrade(item)}</ScorePill>;
}

// ─── GroupBy toggle ───────────────────────────────────────────────────────────

function GroupByToggle({ options, value, onChange }) {
  if (!options || options.length <= 1) return null;
  return (
    <div className="flex shrink-0 gap-0.5 rounded-lg bg-gray-100 p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
            value === opt ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Vertical Bar Chart ───────────────────────────────────────────────────────

function VerticalBarChart({ title, description, bars, groupByOptions, groupBy, onGroupByChange }) {
  if (!bars.length) {
    return (
      <Card>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
          </div>
          <GroupByToggle options={groupByOptions} value={groupBy} onChange={onGroupByChange} />
        </div>
        <p className="py-8 text-center text-sm text-gray-400">No data available</p>
      </Card>
    );
  }

  const max = Math.max(...bars.map((b) => b.value), 1);

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
        </div>
        <GroupByToggle options={groupByOptions} value={groupBy} onChange={onGroupByChange} />
      </div>
      <div className="flex items-end gap-2" style={{ height: "180px" }}>
        {bars.map((bar) => (
          <div key={bar.id ?? bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="text-xs font-semibold text-gray-700 tabular-nums">{bar.displayValue}</span>
            <div
              className="w-full rounded-t-lg transition-all duration-700"
              style={{ height: `${Math.max((bar.value / max) * 140, 4)}px`, backgroundColor: bar.color }}
            />
            <span className="w-full truncate text-center text-xs text-gray-500" title={bar.label}>
              {bar.label.length > 10 ? bar.label.slice(0, 10) + "…" : bar.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Config Pie Chart ─────────────────────────────────────────────────────────

function ConfigPieChart({ title, description, slices, groupByOptions, groupBy, onGroupByChange }) {
  const total = slices.reduce((sum, s) => sum + s.count, 0);
  if (!slices.length || total === 0) return null;

  const SIZE = 148;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 54;
  const SW = 20;
  const circumference = 2 * Math.PI * R;

  let accumulated = 0;
  const segments = slices.map((s) => {
    const len = (s.count / total) * circumference;
    const offset = -accumulated;
    accumulated += len;
    return { ...s, len, offset };
  });

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
        </div>
        <GroupByToggle options={groupByOptions} value={groupBy} onChange={onGroupByChange} />
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f3f4f6" strokeWidth={SW} />
            {segments.map((s) => (
              <circle
                key={s.id ?? s.label}
                cx={cx} cy={cy} r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={SW}
                strokeDasharray={`${s.len} ${circumference}`}
                strokeDashoffset={s.offset}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{total}</span>
            <span className="text-xs text-gray-500">graded</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {segments.slice(0, 6).map((s) => (
            <div key={s.id ?? s.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-700" title={s.label}>{s.label}</span>
              <span className="shrink-0 text-xs font-semibold text-gray-500">{s.count}</span>
            </div>
          ))}
          {segments.length > 6 && (
            <p className="text-xs text-gray-400">+{segments.length - 6} more</p>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function Reporting() {
  const { auth } = useAuth();
  const campusId = auth.campus_id;
  const sectionId = auth.sections?.[0]?.value;

  const [dashboardConfig, setDashboardConfig] = useState(null);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("exam");
  const [chartGroupBys, setChartGroupBys] = useState({});
  const fetchIdRef = useRef(0);

  const fetchReport = useCallback(async () => {
    if (!auth.userId) return;
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    try {
      // 1. fetch dashboard config first
      if (campusId && sectionId) {
        try {
          const configRes = await getReportDashboardConfig(campusId, sectionId);
          if (fetchId !== fetchIdRef.current) return;
          const config = configRes?.data ?? configRes ?? null;
          setDashboardConfig(config);
          if (config?.display?.charts) {
            const defaults = {};
            config.display.charts.forEach((chart, i) => {
              defaults[i] = chart.group_by?.[0] ?? null;
            });
            setChartGroupBys(defaults);
          }
        } catch {
          if (fetchId !== fetchIdRef.current) return;
          setDashboardConfig(null);
        }
      }

      // 2. fetch grades
      const res = await getStudentGradesReport(auth.userId);
      if (fetchId !== fetchIdRef.current) return;
      if (res?.success && res.data) {
        setPayload(res.data);
      } else {
        setPayload(null);
        setError("Unexpected response from server.");
      }
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return;
      console.error("Grades report:", err);
      const msg = err?.response?.data?.message || err?.message || "Could not load grades.";
      setError(typeof msg === "string" ? msg : "Could not load grades.");
      setPayload(null);
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false);
    }
  }, [auth.userId, campusId, sectionId]);

  useEffect(() => {
    fetchReport();
    const ref = fetchIdRef;
    return () => { ref.current++; };
  }, [fetchReport]);

  const items = useMemo(() => payload?.items ?? [], [payload]);

  const examGroups = useMemo(() => {
    const examIds = [...new Set(items.map((r) => r.exam_id))];
    return examIds.map((examId) => {
      const rows = items.filter((r) => r.exam_id === examId);
      const graded = rows.filter((r) => r.is_graded);
      const passCount = graded.filter((r) => gradePasses(r) === true).length;
      const belowCount = graded.filter((r) => gradePasses(r) === false).length;
      const unknownCount = graded.filter((r) => gradePasses(r) === null).length;
      const pctAvg = averageForType(rows, "PERCENTAGE");
      const gpaAvg = averageForType(rows, "GPA");
      const avgGrade = averageGrade(rows);
      const types = new Set(rows.map((r) => r.grading_type));
      return {
        exam_id: examId,
        exam_name: rows[0]?.exam_name ?? "",
        rows,
        gradedCount: graded.length,
        passCount,
        belowCount,
        unknownCount,
        pctAvg,
        gpaAvg,
        avgGrade,
        mixedTypes: types.size > 1,
      };
    });
  }, [items]);

  const subjectGroups = useMemo(() => {
    const subjectNames = [...new Set(items.map((r) => r.subject_name || "Unknown"))];
    return subjectNames
      .sort((a, b) => a.localeCompare(b))
      .map((subject_name) => {
        const rows = items
          .filter((r) => (r.subject_name || "Unknown") === subject_name)
          .sort((a, b) => new Date(b.graded_at || 0) - new Date(a.graded_at || 0));
        const pctAvg = averageForType(rows, "PERCENTAGE");
        const gpaAvg = averageForType(rows, "GPA");
        const avgGrade = averageGrade(rows);
        return { subject_name, rows, pctAvg, gpaAvg, avgGrade };
      });
  }, [items]);

  const overview = useMemo(() => {
    const examIds = new Set(items.map((i) => i.exam_id));
    const subjects = new Set(items.map((i) => i.subject_name).filter(Boolean));
    const graded = items.filter((i) => i.is_graded);
    const passed = graded.filter((i) => gradePasses(i) === true).length;
    const pending = items.filter((i) => !i.is_graded).length;
    return { totalRows: items.length, exams: examIds.size, subjects: subjects.size, graded: graded.length, passed, pending };
  }, [items]);

  const ratingScale = dashboardConfig?.useGrades ? (payload?.ratingScale ?? null) : null;
  const useGrades = dashboardConfig?.useGrades !== false;
  const showComments = dashboardConfig?.display?.show_teacher_comments ?? false;
  const displayCharts = dashboardConfig?.display?.charts ?? [];

  // chart data
  const barDataBySubject = useMemo(
    () => subjectGroups.filter((sg) => sg.avgGrade != null).map((sg, i) => ({
      id: sg.subject_name,
      label: sg.subject_name,
      value: sg.avgGrade,
      displayValue: formatAvgWithConfig(sg.avgGrade, ratingScale),
      color: CHART_COLORS[i % CHART_COLORS.length],
    })),
    [subjectGroups, ratingScale]
  );

  const barDataByExam = useMemo(
    () => examGroups.filter((g) => g.avgGrade != null).map((g, i) => ({
      id: g.exam_id,
      label: g.exam_name,
      value: g.avgGrade,
      displayValue: formatAvgWithConfig(g.avgGrade, ratingScale),
      color: CHART_COLORS[i % CHART_COLORS.length],
    })),
    [examGroups, ratingScale]
  );

  const pieDataByExam = useMemo(
    () => examGroups.map((g, i) => ({ id: g.exam_id, label: g.exam_name, count: g.gradedCount, color: CHART_COLORS[i % CHART_COLORS.length] })).filter((s) => s.count > 0),
    [examGroups]
  );

  const pieDataBySubject = useMemo(
    () => subjectGroups.map((sg, i) => ({
      id: sg.subject_name,
      label: sg.subject_name,
      count: sg.rows.filter((r) => r.is_graded).length,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })).filter((s) => s.count > 0),
    [subjectGroups]
  );

  function getBarData(chartIdx) {
    return chartGroupBys[chartIdx] === "exams" ? barDataByExam : barDataBySubject;
  }

  function getPieData(chartIdx) {
    return chartGroupBys[chartIdx] === "subjects" ? pieDataBySubject : pieDataByExam;
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader /></div>;
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="max-w-md p-6 text-center">
          <h2 className="text-lg font-semibold text-red-600">Could not load report</h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <Button variant="primary" className="mt-5 w-full" onClick={fetchReport}>Try again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 pb-24 md:p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Grade Report</h1>
          <p className="mt-0.5 text-sm text-gray-500">Your academic performance across all exams</p>
        </div>
        <button
          onClick={fetchReport}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
        >
          <RefreshCw size={14} strokeWidth={2} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      {useGrades && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={BookMarked} label="Grade entries" value={overview.totalRows} hint={`${overview.graded} graded`} accent="bg-blue-50 text-blue-600" />
          <StatCard icon={BarChart3} label="Exams" value={overview.exams} accent="bg-purple-50 text-purple-600" />
          <StatCard icon={Layers} label="Subjects" value={overview.subjects} accent="bg-amber-50 text-amber-600" />
          <StatCard
            icon={CheckCircle2}
            label="Passed"
            value={overview.graded ? `${overview.passed} / ${overview.graded}` : "—"}
            accent="bg-emerald-50 text-emerald-600"
          >
            {overview.graded > 0 && <PassRateBar passed={overview.passed} total={overview.graded} />}
          </StatCard>
        </div>
      )}

      {items.length === 0 ? (
        <Card>
          <div className="py-14 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <TrendingUp size={28} strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No grades yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
              When your teachers publish marks, they will appear here with summaries and breakdowns.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Config-driven charts */}
          {displayCharts.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {displayCharts.map((chart, i) => {
                const groupBy = chartGroupBys[i] ?? chart.group_by?.[0];
                const setGroupBy = (v) => setChartGroupBys((prev) => ({ ...prev, [i]: v }));

                if (chart.type === "bar_chart") {
                  return (
                    <VerticalBarChart
                      key={i}
                      title="Performance"
                      description={`Average score by ${groupBy}`}
                      bars={getBarData(i)}
                      groupByOptions={chart.group_by}
                      groupBy={groupBy}
                      onGroupByChange={setGroupBy}
                    />
                  );
                }
                if (chart.type === "pie_chart") {
                  return (
                    <ConfigPieChart
                      key={i}
                      title="Grade distribution"
                      description={`Graded entries by ${groupBy}`}
                      slices={getPieData(i)}
                      groupByOptions={chart.group_by}
                      groupBy={groupBy}
                      onGroupByChange={setGroupBy}
                    />
                  );
                }
                return null;
              })}
            </div>
          )}

          {/* Grade detail tabs */}
          {useGrades && (
            <>
              <div className="border-b border-border">
                <div className="flex gap-1">
                  <TabButton active={activeTab === "exam"} onClick={() => setActiveTab("exam")}>By Exam</TabButton>
                  <TabButton active={activeTab === "subject"} onClick={() => setActiveTab("subject")}>By Subject</TabButton>
                </div>
              </div>

              {/* By Exam */}
              {activeTab === "exam" && (
                <section className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {examGroups.map((g) => (
                      <Card key={g.exam_id} className="overflow-hidden p-0">
                        <div className="px-5 py-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-gray-900">{g.exam_name}</h3>
                            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                              {g.rows.length} subject{g.rows.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {g.gradedCount > 0 && !ratingScale && (
                            <>
                              <ExamPassBar passCount={g.passCount} belowCount={g.belowCount} total={g.gradedCount} />
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500" />{g.passCount} passed
                                </span>
                                {g.belowCount > 0 && (
                                  <span className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-red-400" />{g.belowCount} below target
                                  </span>
                                )}
                              </div>
                            </>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            {ratingScale?.type === "stars" && g.avgGrade != null && (
                              <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                                Avg {g.avgGrade.toFixed(1)} / {ratingScale.points}★
                              </span>
                            )}
                            {!ratingScale && g.pctAvg != null && (
                              <span className="rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-800 ring-1 ring-primary-200">
                                Avg {g.pctAvg.toFixed(1)}%
                              </span>
                            )}
                            {!ratingScale && g.gpaAvg != null && (
                              <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-800 ring-1 ring-purple-200">
                                Avg GPA {g.gpaAvg.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="overflow-x-auto border-t border-border">
                          <table className="w-full min-w-[300px] text-left text-sm">
                            <thead>
                              <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                <th className="px-5 py-2.5">Subject</th>
                                <th className="px-5 py-2.5">Score</th>
                                {!ratingScale && <th className="px-5 py-2.5">Result</th>}
                                <th className="hidden px-5 py-2.5 sm:table-cell">Graded on</th>
                                {showComments && <th className="hidden px-5 py-2.5 md:table-cell">Comments</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {g.rows.map((row, idx) => (
                                <tr
                                  key={row.grade_id}
                                  className={`transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                                >
                                  <td className="px-5 py-3 font-medium text-gray-900">{row.subject_name}</td>
                                  <td className="px-5 py-3"><GradeDisplay item={row} ratingScale={ratingScale} /></td>
                                  {!ratingScale && (
                                    <td className="px-5 py-3">
                                      <PassBadge passes={row.is_graded ? gradePasses(row) : null} />
                                    </td>
                                  )}
                                  <td className="hidden px-5 py-3 text-xs text-gray-500 sm:table-cell">
                                    {formatShortDate(row.graded_at)}
                                  </td>
                                  {showComments && (
                                    <td className="hidden px-5 py-3 text-xs text-gray-600 md:table-cell">
                                      {row.teacher_comments ?? <span className="text-gray-400">—</span>}
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* By Subject */}
              {activeTab === "subject" && (
                <section>
                  <Card className="overflow-hidden p-0">
                    <div className="border-b border-border px-5 py-4">
                      <h3 className="font-semibold text-gray-900">All entries</h3>
                      <p className="mt-0.5 text-xs text-gray-500">Every graded subject across all exams</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[360px] text-left text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <th className="px-5 py-3">Subject</th>
                            <th className="px-5 py-3">Exam</th>
                            <th className="px-5 py-3">Score</th>
                            {!ratingScale && <th className="px-5 py-3">Result</th>}
                            <th className="hidden px-5 py-3 md:table-cell">Graded on</th>
                            {showComments && <th className="hidden px-5 py-3 lg:table-cell">Comments</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {subjectGroups.flatMap((sg) => sg.rows).map((row, idx) => (
                            <tr
                              key={row.grade_id}
                              className={`transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                            >
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${subjectColor(row.subject_name)}`}>
                                    {getSubjectInitials(row.subject_name)}
                                  </div>
                                  <span className="font-medium text-gray-900">{row.subject_name}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-gray-600">{row.exam_name}</td>
                              <td className="px-5 py-3"><GradeDisplay item={row} ratingScale={ratingScale} /></td>
                              {!ratingScale && (
                                <td className="px-5 py-3">
                                  <PassBadge passes={row.is_graded ? gradePasses(row) : null} />
                                </td>
                              )}
                              <td className="hidden px-5 py-3 text-xs text-gray-500 md:table-cell">
                                {formatShortDate(row.graded_at)}
                              </td>
                              {showComments && (
                                <td className="hidden px-5 py-3 text-xs text-gray-600 lg:table-cell">
                                  {row.teacher_comments ?? <span className="text-gray-400">—</span>}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
