import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Loader, Button } from "../../ui-components";
import {
  getTeacherSectionSummary,
  getTeacherSectionGrades,
} from "../../api/teacher.api";
import { useAuth } from "../../store/auth.store";
import {
  BarChart3,
  BookMarked,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  Users,
  X,
  User,
  SlidersHorizontal,
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

function averageForType(rows, type) {
  const nums = rows
    .filter((r) => r.grading_type === type && r.is_graded)
    .map((r) => parseScore(r.grades_obtained))
    .filter((n) => n != null);
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
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

function hashColor(name = "", palette) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const subjectColor = (name) => hashColor(name, SUBJECT_COLORS);

// ─── small UI primitives ─────────────────────────────────────────────────────

function PassBadge({ passes }) {
  if (passes === null)
    return <span className="text-xs font-semibold text-gray-400">—</span>;
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
  if (muted)
    return <span className="text-sm font-medium italic text-gray-400">{children}</span>;
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

// ─── Charts ──────────────────────────────────────────────────────────────────

function HorizBarChart({ title, description, bars }) {
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
        {gridLines.map((v) => (
          <g key={v}>
            <line x1={PAD.left} y1={yPos(v)} x2={W - PAD.right} y2={yPos(v)} stroke="#f3f4f6" strokeWidth="1" />
            <text x={PAD.left - 8} y={yPos(v)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#9ca3af">{v}</text>
          </g>
        ))}
        {points.length > 1 && <path d={fillPath} fill="#3b82f6" fillOpacity="0.08" />}
        {points.length > 1 && (
          <polyline points={linePoints} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        )}
        {points.map((p, i) => (
          <g key={p.label}>
            <text x={xPos(i)} y={yPos(p.value) - 14} textAnchor="middle" fontSize="12" fontWeight="600" fill="#1f2937">
              {p.value.toFixed(1)}%
            </text>
            <circle cx={xPos(i)} cy={yPos(p.value)} r="7" fill="white" stroke="#3b82f6" strokeWidth="2.5" />
            <circle cx={xPos(i)} cy={yPos(p.value)} r="3.5" fill="#3b82f6" />
            <text x={xPos(i)} y={PAD.top + plotH + 22} textAnchor="middle" fontSize="11" fill="#6b7280">
              {p.label.length > 14 ? p.label.slice(0, 14) + "…" : p.label}
            </text>
          </g>
        ))}
      </svg>
    </Card>
  );
}

// ─── Student Detail Panel ─────────────────────────────────────────────────────

function StudentDetailPanel({ student, onClose }) {
  const { name, rows } = student;

  const examGroups = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.exam_id)) map.set(r.exam_id, { exam_id: r.exam_id, exam_name: r.exam_name, rows: [] });
      map.get(r.exam_id).rows.push(r);
    }
    return Array.from(map.values()).map((g) => {
      const graded = g.rows.filter((r) => r.is_graded);
      const passCount = graded.filter((r) => gradePasses(r) === true).length;
      const belowCount = graded.filter((r) => gradePasses(r) === false).length;
      const pctAvg = averageForType(g.rows, "PERCENTAGE");
      return { ...g, gradedCount: graded.length, passCount, belowCount, pctAvg };
    });
  }, [rows]);

  const totalGraded = rows.filter((r) => r.is_graded).length;
  const totalPassed = rows.filter((r) => gradePasses(r) === true).length;
  const pctAvgAll = averageForType(rows, "PERCENTAGE");

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl">
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <User size={18} strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{name}</h2>
              <p className="text-xs text-gray-500">Student report</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 border-b border-border p-4">
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{examGroups.length}</p>
            <p className="text-xs text-gray-500">Exams</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-center">
            <p className="text-lg font-bold text-emerald-700">
              {totalGraded > 0 ? `${Math.round((totalPassed / totalGraded) * 100)}%` : "—"}
            </p>
            <p className="text-xs text-gray-500">Pass rate</p>
          </div>
          <div className="rounded-xl bg-primary-50 p-3 text-center">
            <p className="text-lg font-bold text-primary-700">
              {pctAvgAll != null ? `${pctAvgAll.toFixed(1)}%` : "—"}
            </p>
            <p className="text-xs text-gray-500">Avg score</p>
          </div>
        </div>

        {/* Exam breakdown */}
        <div className="flex-1 overflow-y-auto p-4 pb-8">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Grade breakdown</h3>
          {examGroups.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">No grades recorded</div>
          ) : (
            <div className="space-y-4">
              {examGroups.map((g) => (
                <div key={g.exam_id} className="overflow-hidden rounded-xl border border-border">
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                    <span className="text-sm font-semibold text-gray-900">{g.exam_name}</span>
                    {g.pctAvg != null && (
                      <span className="rounded-lg bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-800 ring-1 ring-primary-200">
                        Avg {g.pctAvg.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  {g.gradedCount > 0 && (
                    <div className="border-b border-border px-4 py-2">
                      <ExamPassBar passCount={g.passCount} belowCount={g.belowCount} total={g.gradedCount} />
                      <div className="mt-1.5 flex gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />{g.passCount} passed
                        </span>
                        {g.belowCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-red-400" />{g.belowCount} below
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <th className="px-4 py-2 text-left">Subject</th>
                        <th className="px-4 py-2 text-left">Score</th>
                        <th className="px-4 py-2 text-left">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((row, idx) => (
                        <tr key={row.grade_id ?? idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold ${subjectColor(row.subject_name ?? "")}`}>
                                {getSubjectInitials(row.subject_name)}
                              </div>
                              <span className="text-gray-900">{row.subject_name ?? "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            {row.is_graded ? <ScorePill>{formatGrade(row)}</ScorePill> : <ScorePill muted>Pending</ScorePill>}
                          </td>
                          <td className="px-4 py-2.5">
                            <PassBadge passes={row.is_graded ? gradePasses(row) : null} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Exam Detail Panel ────────────────────────────────────────────────────────

function ExamDetailPanel({ exam, studentGroups, onViewStudent, onClose }) {
  const { exam_name, rows, gradedCount, passCount, belowCount, pctAvg, gpaAvg, studentCount } = exam;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">{exam_name}</h2>
            <p className="text-xs text-gray-500">
              {studentCount} student{studentCount !== 1 ? "s" : ""} · {gradedCount} graded
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 border-b border-border p-4">
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{passCount}</p>
            <p className="text-xs text-gray-500">Passed</p>
          </div>
          <div className="rounded-xl bg-red-50 p-3 text-center">
            <p className="text-lg font-bold text-red-600">{belowCount}</p>
            <p className="text-xs text-gray-500">Below target</p>
          </div>
          <div className="rounded-xl bg-primary-50 p-3 text-center">
            <p className="text-lg font-bold text-primary-700">
              {pctAvg != null ? `${pctAvg.toFixed(1)}%` : gpaAvg != null ? `${gpaAvg.toFixed(2)}` : "—"}
            </p>
            <p className="text-xs text-gray-500">{pctAvg != null ? "Class avg" : "Avg GPA"}</p>
          </div>
        </div>

        {/* Grade table */}
        <div className="flex-1 overflow-y-auto pb-8">
          <table className="w-full text-sm">
            <thead className="sticky top-0">
              <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 text-left">Student</th>
                <th className="px-5 py-3 text-left">Subject</th>
                <th className="px-5 py-3 text-left">Score</th>
                <th className="px-5 py-3 text-left">Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={row.grade_id ?? idx}
                  className={`cursor-pointer transition-colors hover:bg-primary-50/50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  onClick={() => {
                    const st = studentGroups.find((s) => s.id === (row.student?.student_id ?? row.student?.name));
                    if (st) { onClose(); onViewStudent(st); }
                  }}
                >
                  <td className="px-5 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-1.5">
                      {row.student?.name ?? "—"}
                      <ChevronRight size={12} className="text-gray-400" />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{row.subject_name ?? "—"}</td>
                  <td className="px-5 py-3">
                    {row.is_graded ? <ScorePill>{formatGrade(row)}</ScorePill> : <ScorePill muted>Pending</ScorePill>}
                  </td>
                  <td className="px-5 py-3">
                    <PassBadge passes={row.is_graded ? gradePasses(row) : null} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function TeacherReporting() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const teacherId = auth?.userId;

  const [summary, setSummary] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("exam");
  const [studentDetail, setStudentDetail] = useState(null);
  const [examDetail, setExamDetail] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", status: "all" });
  const [pendingFilters, setPendingFilters] = useState({ startDate: "", endDate: "", status: "all" });

  const fetchData = useCallback(async () => {
    if (!teacherId || !sectionId) return;
    setLoading(true);
    setError(null);
    const query = {};
    if (filters.startDate) query.start_date = filters.startDate;
    if (filters.endDate) query.end_date = filters.endDate;
    if (filters.status && filters.status !== "all") query.status = filters.status;
    try {
      const [summaryRes, gradesRes] = await Promise.all([
        getTeacherSectionSummary(teacherId, sectionId, {
          start_date: query.start_date,
          end_date: query.end_date,
        }),
        getTeacherSectionGrades(teacherId, sectionId, query),
      ]);
      setSummary(summaryRes?.data ?? summaryRes ?? null);
      const raw = gradesRes?.data?.items ?? gradesRes?.items ?? [];
      setGrades(Array.isArray(raw) ? raw : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Could not load section data.");
      setGrades([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [teacherId, sectionId, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── derived data ──

  const examGroups = useMemo(() => {
    const map = new Map();
    for (const row of grades) {
      if (!map.has(row.exam_id)) {
        map.set(row.exam_id, { exam_id: row.exam_id, exam_name: row.exam_name, rows: [] });
      }
      map.get(row.exam_id).rows.push(row);
    }
    return Array.from(map.values()).map((g) => {
      const graded = g.rows.filter((r) => r.is_graded);
      const studentIds = new Set(g.rows.map((r) => r.student?.student_id));
      const passCount = graded.filter((r) => gradePasses(r) === true).length;
      const belowCount = graded.filter((r) => gradePasses(r) === false).length;
      const pctAvg = averageForType(g.rows, "PERCENTAGE");
      const gpaAvg = averageForType(g.rows, "GPA");
      return { ...g, gradedCount: graded.length, studentCount: studentIds.size, passCount, belowCount, pctAvg, gpaAvg };
    });
  }, [grades]);

  const studentGroups = useMemo(() => {
    const map = new Map();
    for (const row of grades) {
      const key = row.student?.student_id ?? row.student?.name ?? "unknown";
      if (!map.has(key)) {
        map.set(key, { id: key, name: row.student?.name ?? row.student?.student_id ?? "Unknown", rows: [] });
      }
      map.get(key).rows.push(row);
    }
    return Array.from(map.values())
      .map((s) => {
        const graded = s.rows.filter((r) => r.is_graded);
        const passed = graded.filter((r) => gradePasses(r) === true).length;
        const pctAvg = averageForType(s.rows, "PERCENTAGE");
        const gpaAvg = averageForType(s.rows, "GPA");
        return { ...s, gradedCount: graded.length, passed, pctAvg, gpaAvg };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [grades]);

  const overview = useMemo(() => {
    if (summary) {
      return {
        totalStudents: summary.total_students ?? summary.student_count ?? studentGroups.length,
        totalExams: summary.total_exams ?? summary.exam_count ?? examGroups.length,
        passRate: summary.pass_rate != null ? Math.round(summary.pass_rate * 100) : null,
        gradedCount: summary.graded_count ?? grades.filter((g) => g.is_graded).length,
        pendingCount: summary.pending_count ?? grades.filter((g) => !g.is_graded).length,
        avgScore: summary.avg_score ?? summary.average_score ?? null,
      };
    }
    const graded = grades.filter((g) => g.is_graded);
    const passed = graded.filter((r) => gradePasses(r) === true).length;
    const pctAvg = averageForType(grades, "PERCENTAGE");
    return {
      totalStudents: studentGroups.length,
      totalExams: examGroups.length,
      passRate: graded.length > 0 ? Math.round((passed / graded.length) * 100) : null,
      gradedCount: graded.length,
      pendingCount: grades.filter((g) => !g.is_graded).length,
      avgScore: pctAvg,
    };
  }, [summary, grades, studentGroups.length, examGroups.length]);

  const examLineData = useMemo(
    () => examGroups.filter((g) => g.pctAvg != null).map((g) => ({ label: g.exam_name, value: g.pctAvg })),
    [examGroups]
  );

  const studentBarData = useMemo(
    () =>
      studentGroups
        .filter((s) => s.pctAvg != null)
        .map((s) => ({
          label: s.name,
          value: s.pctAvg,
          displayValue: `${s.pctAvg.toFixed(1)}%`,
          barColor: "bg-primary-500",
        })),
    [studentGroups]
  );

  const hasActiveFilters = filters.startDate || filters.endDate || filters.status !== "all";

  function applyFilters() {
    setFilters(pendingFilters);
    setShowFilters(false);
  }

  function clearFilters() {
    const reset = { startDate: "", endDate: "", status: "all" };
    setPendingFilters(reset);
    setFilters(reset);
    setShowFilters(false);
  }

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
          <h2 className="text-lg font-semibold text-red-600">Could not load data</h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <Button variant="primary" className="mt-5 w-full" onClick={fetchData}>
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 pb-24 md:p-6">
        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/staff/reporting")}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Section Report</h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Grade performance for this section
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
          >
            <RefreshCw size={14} strokeWidth={2} />
            Refresh
          </button>
        </div>

        {/* ── Filter bar ── */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              hasActiveFilters
                ? "border-primary-300 bg-primary-50 text-primary-700"
                : "border-border bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal size={14} strokeWidth={2} />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-primary-600 px-1.5 py-0.5 text-xs text-white">
                {[filters.startDate, filters.endDate, filters.status !== "all"].filter(Boolean).length}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <Card className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-600">From date</label>
              <input
                type="date"
                value={pendingFilters.startDate}
                onChange={(e) => setPendingFilters((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-600">To date</label>
              <input
                type="date"
                value={pendingFilters.endDate}
                onChange={(e) => setPendingFilters((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Status</label>
              <select
                value={pendingFilters.status}
                onChange={(e) => setPendingFilters((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="all">All</option>
                <option value="graded">Graded</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={applyFilters}>Apply</Button>
              <Button variant="secondary" onClick={() => setShowFilters(false)}>Cancel</Button>
            </div>
          </Card>
        )}

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Users} label="Students" value={overview.totalStudents} accent="bg-blue-50 text-blue-600" />
          <StatCard icon={BookMarked} label="Exams" value={overview.totalExams} accent="bg-purple-50 text-purple-600" />
          <StatCard
            icon={BarChart3}
            label="Avg score"
            value={overview.avgScore != null ? `${overview.avgScore.toFixed(1)}%` : "—"}
            hint={`${overview.gradedCount} graded`}
            accent="bg-amber-50 text-amber-600"
          />
          <StatCard
            icon={CheckCircle2}
            label="Pass rate"
            value={overview.passRate != null ? `${overview.passRate}%` : "—"}
            hint={`${overview.pendingCount} pending`}
            accent="bg-emerald-50 text-emerald-600"
          >
            {overview.passRate != null && (
              <PassRateBar
                passed={Math.round((overview.passRate / 100) * overview.gradedCount)}
                total={overview.gradedCount}
              />
            )}
          </StatCard>
        </div>

        {grades.length === 0 ? (
          <Card>
            <div className="py-14 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <TrendingUp size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-gray-900">No grade data</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                No grades have been recorded for this section yet.
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* ── Tab nav ── */}
            <div className="border-b border-border">
              <div className="flex gap-1">
                <TabButton active={activeTab === "exam"} onClick={() => setActiveTab("exam")}>
                  By Exam
                </TabButton>
                <TabButton active={activeTab === "student"} onClick={() => setActiveTab("student")}>
                  By Student
                </TabButton>
              </div>
            </div>

            {/* ── By Exam tab ── */}
            {activeTab === "exam" && (
              <section className="space-y-4">
                {examLineData.length > 1 && (
                  <ExamLineChart
                    title="Exam comparison"
                    description="Class average percentage score per exam"
                    points={examLineData}
                  />
                )}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {examGroups.map((g) => (
                    <button
                      key={g.exam_id}
                      onClick={() => setExamDetail(g)}
                      className="flex w-full flex-col gap-3 rounded-xl border border-border bg-white p-4 text-left transition-shadow hover:shadow-md active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900">{g.exam_name}</h3>
                        <ChevronRight size={16} className="mt-0.5 shrink-0 text-gray-400" />
                      </div>

                      {g.gradedCount > 0 && (
                        <ExamPassBar passCount={g.passCount} belowCount={g.belowCount} total={g.gradedCount} />
                      )}

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                          {g.studentCount} student{g.studentCount !== 1 ? "s" : ""}
                        </span>
                        {g.pctAvg != null && (
                          <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 ring-1 ring-primary-200">
                            avg {g.pctAvg.toFixed(1)}%
                          </span>
                        )}
                        {g.gpaAvg != null && (
                          <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 ring-1 ring-purple-200">
                            avg {g.gpaAvg.toFixed(2)} GPA
                          </span>
                        )}
                      </div>

                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {g.passCount} passed
                        </span>
                        {g.belowCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-red-400" />
                            {g.belowCount} below
                          </span>
                        )}
                        {g.gradedCount < g.rows.length && (
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-gray-300" />
                            {g.rows.length - g.gradedCount} pending
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ── By Student tab ── */}
            {activeTab === "student" && (
              <section className="space-y-4">
                {studentBarData.length > 0 && (
                  <HorizBarChart
                    title="Student performance"
                    description="Average percentage score per student"
                    bars={studentBarData}
                  />
                )}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {studentGroups.map((s) => {
                    const passRate = s.gradedCount > 0 ? Math.round((s.passed / s.gradedCount) * 100) : null;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setStudentDetail(s)}
                        className="flex w-full items-center gap-3 rounded-xl border border-border bg-white p-4 text-left transition-shadow hover:shadow-md active:scale-[0.99]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                          <User size={18} strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-500">
                            {s.rows.length} grade {s.rows.length === 1 ? "entry" : "entries"}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {s.pctAvg != null && (
                              <span className="rounded-lg bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-800 ring-1 ring-primary-200">
                                {s.pctAvg.toFixed(1)}% avg
                              </span>
                            )}
                            {passRate != null && (
                              <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ring-1 ${passRate >= 60 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-red-50 text-red-700 ring-red-200"}`}>
                                {passRate}% pass rate
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={16} className="shrink-0 text-gray-400" />
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {examDetail && (
        <ExamDetailPanel
          exam={examDetail}
          studentGroups={studentGroups}
          onViewStudent={setStudentDetail}
          onClose={() => setExamDetail(null)}
        />
      )}

      {studentDetail && (
        <StudentDetailPanel student={studentDetail} onClose={() => setStudentDetail(null)} />
      )}
    </>
  );
}
