import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, Loader, Button } from "../../ui-components";
import { getStudentGradesReport } from "../../api/student.api";
import { useAuth } from "../../store/auth.store";
import {
  BarChart3,
  BookMarked,
  CheckCircle2,
  Layers,
  RefreshCw,
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

function getSubjectInitials(name) {
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

const BAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-teal-500",
];

function subjectColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
}

function subjectBarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return BAR_COLORS[Math.abs(hash) % BAR_COLORS.length];
}

// ─── small UI primitives ─────────────────────────────────────────────────────

function PassBadge({ passes }) {
  if (passes === null) {
    return <span className="text-xs font-semibold text-gray-400">—</span>;
  }
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
  if (muted) {
    return <span className="text-sm font-medium italic text-gray-400">{children}</span>;
  }
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
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
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
        active
          ? "border-b-2 border-primary-600 text-primary-700"
          : "text-gray-500 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Chart 1: Pass / Fail / Pending donut ────────────────────────────────────

function DonutChart({ passed, below, pending }) {
  const total = passed + below + pending;
  if (total === 0) return null;

  const SIZE = 148;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 54;
  const SW = 20; // stroke width
  const circumference = 2 * Math.PI * R;

  const passedLen = (passed / total) * circumference;
  const belowLen = (below / total) * circumference;
  const pendingLen = (pending / total) * circumference;

  // segments start at 12 o'clock (SVG rotated -90deg)
  // dashoffset = -(accumulated prior segment length) so each segment
  // starts right where the previous one ended
  const segments = [
    { len: passedLen, offset: 0, stroke: "#10b981", label: "Passed", count: passed },
    { len: belowLen, offset: -passedLen, stroke: "#f87171", label: "Below target", count: below },
    { len: pendingLen, offset: -(passedLen + belowLen), stroke: "#d1d5db", label: "Pending", count: pending },
  ].filter((s) => s.count > 0);

  const legendDots = {
    Passed: "bg-emerald-500",
    "Below target": "bg-red-400",
    Pending: "bg-gray-300",
  };

  return (
    <Card>
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Overall breakdown</h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Pass / fail split across all graded items
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-8">
        {/* donut */}
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            style={{ transform: "rotate(-90deg)" }}
          >
            {/* track */}
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f3f4f6" strokeWidth={SW} />
            {/* segments */}
            {segments.map((s) => (
              <circle
                key={s.label}
                cx={cx}
                cy={cy}
                r={R}
                fill="none"
                stroke={s.stroke}
                strokeWidth={SW}
                strokeDasharray={`${s.len} ${circumference}`}
                strokeDashoffset={s.offset}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          {/* centre label — un-rotated */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{total}</span>
            <span className="text-xs text-gray-500">graded</span>
          </div>
        </div>

        {/* legend */}
        <div className="space-y-3">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className={`h-3 w-3 shrink-0 rounded-full ${legendDots[s.label]}`} />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {s.count}{" "}
                  <span className="font-normal text-gray-500">{s.label}</span>
                </p>
                <p className="text-xs text-gray-400">
                  {Math.round((s.count / total) * 100)}% of graded
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Chart 2 & 3: Horizontal bar chart ───────────────────────────────────────

function HorizBarChart({ title, description, bars }) {
  // bars: [{ label, value, displayValue, barColor }]
  const max = Math.max(...bars.map((b) => b.value), 1);

  return (
    <Card>
      <div className="mb-5">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      <div className="space-y-4">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="max-w-[65%] truncate text-sm font-medium text-gray-700">
                {bar.label}
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                {bar.displayValue}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ${bar.barColor}`}
                style={{ width: `${Math.min((bar.value / max) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Chart 2b: Exam line chart ───────────────────────────────────────────────

function ExamLineChart({ title, description, points }) {
  if (!points.length) return null;

  const W = 600;
  const H = 220;
  const PAD = { top: 36, right: 24, bottom: 52, left: 44 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const xPos = (i) =>
    points.length === 1
      ? PAD.left + plotW / 2
      : PAD.left + (i / (points.length - 1)) * plotW;

  const yPos = (v) => PAD.top + plotH - (v / 100) * plotH;

  const linePoints = points.map((p, i) => `${xPos(i)},${yPos(p.value)}`).join(" ");

  const fillPath = [
    `M ${xPos(0)},${yPos(points[0].value)}`,
    ...points.slice(1).map((p, i) => `L ${xPos(i + 1)},${yPos(p.value)}`),
    `L ${xPos(points.length - 1)},${PAD.top + plotH}`,
    `L ${xPos(0)},${PAD.top + plotH}`,
    "Z",
  ].join(" ");

  const gridLines = [0, 25, 50, 75, 100];

  return (
    <Card>
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible" }}>
        {/* grid lines + y-axis labels */}
        {gridLines.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left} y1={yPos(v)}
              x2={W - PAD.right} y2={yPos(v)}
              stroke="#f3f4f6" strokeWidth="1"
            />
            <text
              x={PAD.left - 8} y={yPos(v)}
              textAnchor="end" dominantBaseline="middle"
              fontSize="11" fill="#9ca3af"
            >
              {v}
            </text>
          </g>
        ))}

        {/* fill under line */}
        {points.length > 1 && (
          <path d={fillPath} fill="#3b82f6" fillOpacity="0.08" />
        )}

        {/* line */}
        {points.length > 1 && (
          <polyline
            points={linePoints}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* data points + labels */}
        {points.map((p, i) => (
          <g key={p.label}>
            {/* value above point */}
            <text
              x={xPos(i)} y={yPos(p.value) - 14}
              textAnchor="middle"
              fontSize="12" fontWeight="600" fill="#1f2937"
            >
              {p.value.toFixed(1)}%
            </text>
            {/* ring */}
            <circle cx={xPos(i)} cy={yPos(p.value)} r="7"
              fill="white" stroke="#3b82f6" strokeWidth="2.5" />
            {/* dot */}
            <circle cx={xPos(i)} cy={yPos(p.value)} r="3.5" fill="#3b82f6" />
            {/* x-axis label */}
            <text
              x={xPos(i)} y={PAD.top + plotH + 22}
              textAnchor="middle" fontSize="11" fill="#6b7280"
            >
              {p.label.length > 14 ? p.label.slice(0, 14) + "…" : p.label}
            </text>
          </g>
        ))}
      </svg>
    </Card>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function Reporting() {
  const { auth } = useAuth();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("exam");

  const fetchReport = useCallback(async () => {
    if (!auth.userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getStudentGradesReport(auth.userId);
      if (res?.success && res.data) {
        setPayload(res.data);
      } else {
        setPayload(null);
        setError("Unexpected response from server.");
      }
    } catch (err) {
      console.error("Grades report:", err);
      const msg =
        err?.response?.data?.message || err?.message || "Could not load grades.";
      setError(typeof msg === "string" ? msg : "Could not load grades.");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [auth.userId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const items = useMemo(() => payload?.items ?? [], [payload]);

  const examGroups = useMemo(() => {
    const map = new Map();
    for (const row of items) {
      if (!map.has(row.exam_id)) {
        map.set(row.exam_id, { exam_id: row.exam_id, exam_name: row.exam_name, rows: [] });
      }
      map.get(row.exam_id).rows.push(row);
    }
    return Array.from(map.values()).map((g) => {
      const { rows } = g;
      const graded = rows.filter((r) => r.is_graded);
      const passCount = graded.filter((r) => gradePasses(r) === true).length;
      const belowCount = graded.filter((r) => gradePasses(r) === false).length;
      const unknownCount = graded.filter((r) => gradePasses(r) === null).length;
      const pctAvg = averageForType(rows, "PERCENTAGE");
      const gpaAvg = averageForType(rows, "GPA");
      const types = new Set(rows.map((r) => r.grading_type));
      return { ...g, gradedCount: graded.length, passCount, belowCount, unknownCount, pctAvg, gpaAvg, mixedTypes: types.size > 1 };
    });
  }, [items]);

  const subjectGroups = useMemo(() => {
    const map = new Map();
    for (const row of items) {
      const key = row.subject_name || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    }
    return Array.from(map.entries())
      .map(([subject_name, rows]) => {
        const sorted = [...rows].sort(
          (a, b) => new Date(b.graded_at || 0) - new Date(a.graded_at || 0)
        );
        const pctAvg = averageForType(rows, "PERCENTAGE");
        const gpaAvg = averageForType(rows, "GPA");
        return { subject_name, rows: sorted, pctAvg, gpaAvg };
      })
      .sort((a, b) => a.subject_name.localeCompare(b.subject_name));
  }, [items]);

  const overview = useMemo(() => {
    const examIds = new Set(items.map((i) => i.exam_id));
    const subjects = new Set(items.map((i) => i.subject_name).filter(Boolean));
    const graded = items.filter((i) => i.is_graded);
    const passed = graded.filter((i) => gradePasses(i) === true).length;
    const below = graded.filter((i) => gradePasses(i) === false).length;
    const pending = items.filter((i) => !i.is_graded).length;
    return {
      totalRows: items.length,
      exams: examIds.size,
      subjects: subjects.size,
      graded: graded.length,
      passed,
      below,
      pending,
    };
  }, [items]);

  // bar data for charts
  const examBarData = useMemo(
    () =>
      examGroups
        .filter((g) => g.pctAvg != null)
        .map((g) => ({
          label: g.exam_name,
          value: g.pctAvg,
          displayValue: `${g.pctAvg.toFixed(1)}%`,
          barColor: "bg-primary-500",
        })),
    [examGroups]
  );

  const subjectBarData = useMemo(
    () =>
      subjectGroups
        .filter((sg) => sg.pctAvg != null)
        .map((sg) => ({
          label: sg.subject_name,
          value: sg.pctAvg,
          displayValue: `${sg.pctAvg.toFixed(1)}%`,
          barColor: subjectBarColor(sg.subject_name),
        })),
    [subjectGroups]
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="max-w-md p-6 text-center">
          <h2 className="text-lg font-semibold text-red-600">Could not load report</h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <Button variant="primary" className="mt-5 w-full" onClick={fetchReport}>
            Try again
          </Button>
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
          <p className="mt-0.5 text-sm text-gray-500">
            Your academic performance across all exams
          </p>
        </div>
        <button
          onClick={fetchReport}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
        >
          <RefreshCw size={14} strokeWidth={2} />
          Refresh
        </button>
      </div>

      {/* Overview stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={BookMarked}
          label="Grade entries"
          value={overview.totalRows}
          hint={`${overview.graded} graded`}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={BarChart3}
          label="Exams"
          value={overview.exams}
          accent="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={Layers}
          label="Subjects"
          value={overview.subjects}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Passed"
          value={overview.graded ? `${overview.passed} / ${overview.graded}` : "—"}
          accent="bg-emerald-50 text-emerald-600"
        >
          {overview.graded > 0 && (
            <PassRateBar passed={overview.passed} total={overview.graded} />
          )}
        </StatCard>
      </div>

      {items.length === 0 ? (
        <Card>
          <div className="py-14 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <TrendingUp size={28} strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No grades yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
              When your teachers publish marks, they will appear here with summaries and
              breakdowns.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* ── Chart 1: donut ── */}
          {/* {overview.graded > 0 && (
            <DonutChart
              passed={overview.passed}
              below={overview.below}
              pending={overview.pending}
            />
          )} */}

          {/* Tab navigation */}
          <div className="border-b border-border">
            <div className="flex gap-1">
              <TabButton active={activeTab === "exam"} onClick={() => setActiveTab("exam")}>
                By Exam
              </TabButton>
              <TabButton active={activeTab === "subject"} onClick={() => setActiveTab("subject")}>
                By Subject
              </TabButton>
            </div>
          </div>

          {/* ── By Exam tab ── */}
          {activeTab === "exam" && (
            <section className="space-y-4">
              {/* Chart 2: exam comparison */}
              {examBarData.length > 0 && (
                <ExamLineChart
                  title="Exam comparison"
                  description="Average percentage score across each exam"
                  points={examBarData}
                />
              )}

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

                      {g.gradedCount > 0 && (
                        <>
                          <ExamPassBar
                            passCount={g.passCount}
                            belowCount={g.belowCount}
                            total={g.gradedCount}
                          />
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              {g.passCount} passed
                            </span>
                            {g.belowCount > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-red-400" />
                                {g.belowCount} below target
                              </span>
                            )}
                            {g.unknownCount > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-gray-300" />
                                {g.unknownCount} n/a
                              </span>
                            )}
                          </div>
                        </>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {g.pctAvg != null && (
                          <span className="rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-800 ring-1 ring-primary-200">
                            Avg {g.pctAvg.toFixed(1)}%
                          </span>
                        )}
                        {g.gpaAvg != null && (
                          <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-800 ring-1 ring-purple-200">
                            Avg GPA {g.gpaAvg.toFixed(2)}
                          </span>
                        )}
                        {g.mixedTypes && (
                          <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                            Mixed types
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
                            <th className="px-5 py-2.5">Result</th>
                            <th className="hidden px-5 py-2.5 sm:table-cell">Graded on</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.rows.map((row, idx) => (
                            <tr
                              key={row.grade_id}
                              className={`transition-colors hover:bg-gray-50 ${
                                idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                              }`}
                            >
                              <td className="px-5 py-3 font-medium text-gray-900">
                                {row.subject_name}
                              </td>
                              <td className="px-5 py-3">
                                {row.is_graded ? (
                                  <ScorePill>{formatGrade(row)}</ScorePill>
                                ) : (
                                  <ScorePill muted>Pending</ScorePill>
                                )}
                              </td>
                              <td className="px-5 py-3">
                                <PassBadge passes={row.is_graded ? gradePasses(row) : null} />
                              </td>
                              <td className="hidden px-5 py-3 text-xs text-gray-500 sm:table-cell">
                                {formatShortDate(row.graded_at)}
                              </td>
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

          {/* ── By Subject tab ── */}
          {activeTab === "subject" && (
            <section className="space-y-5">
              {/* Chart 3: subject performance */}
              {subjectBarData.length > 0 && (
                <HorizBarChart
                  title="Subject performance"
                  description="Average percentage score per subject"
                  bars={subjectBarData}
                />
              )}

              {/* summary tiles
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {subjectGroups.map((sg) => {
                  const color = subjectColor(sg.subject_name);
                  return (
                    <Card key={sg.subject_name} className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${color}`}
                      >
                        {getSubjectInitials(sg.subject_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-gray-900">
                          {sg.subject_name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {sg.rows.length} {sg.rows.length === 1 ? "entry" : "entries"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {sg.pctAvg != null && (
                            <span className="rounded-lg bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-800 ring-1 ring-primary-200">
                              {sg.pctAvg.toFixed(1)}% avg
                            </span>
                          )}
                          {sg.gpaAvg != null && (
                            <span className="rounded-lg bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-800 ring-1 ring-purple-200">
                              {sg.gpaAvg.toFixed(2)} GPA avg
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div> */}

              {/* full table */}
              <Card className="overflow-hidden p-0">
                <div className="border-b border-border px-5 py-4">
                  <h3 className="font-semibold text-gray-900">All entries</h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Every graded subject across all exams
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[360px] text-left text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <th className="px-5 py-3">Subject</th>
                        <th className="px-5 py-3">Exam</th>
                        <th className="px-5 py-3">Score</th>
                        <th className="px-5 py-3">Result</th>
                        <th className="hidden px-5 py-3 md:table-cell">Graded on</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectGroups.flatMap((sg) => sg.rows).map((row, idx) => (
                        <tr
                          key={row.grade_id}
                          className={`transition-colors hover:bg-gray-50 ${
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }`}
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${subjectColor(
                                  row.subject_name
                                )}`}
                              >
                                {getSubjectInitials(row.subject_name)}
                              </div>
                              <span className="font-medium text-gray-900">
                                {row.subject_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-600">{row.exam_name}</td>
                          <td className="px-5 py-3">
                            {row.is_graded ? (
                              <ScorePill>{formatGrade(row)}</ScorePill>
                            ) : (
                              <ScorePill muted>Pending</ScorePill>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <PassBadge passes={row.is_graded ? gradePasses(row) : null} />
                          </td>
                          <td className="hidden px-5 py-3 text-xs text-gray-500 md:table-cell">
                            {formatShortDate(row.graded_at)}
                          </td>
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
    </div>
  );
}
