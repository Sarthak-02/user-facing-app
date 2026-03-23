import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, Loader, Button } from "../../ui-components";
import { getStudentGradesReport } from "../../api/student.api";
import { useAuth } from "../../store/auth.store";
import {
  BarChart3,
  BookMarked,
  CheckCircle2,
  GraduationCap,
  Layers,
} from "lucide-react";

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

const STAT_TONES = [
  {
    card: "border-indigo-200/50 bg-gradient-to-br from-white to-indigo-50/95 shadow-md shadow-indigo-500/10 dark:border-indigo-500/25 dark:from-slate-900 dark:to-indigo-950/60",
    icon: "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25",
    label: "text-indigo-900/65 dark:text-indigo-200/75",
    value: "text-indigo-950 dark:text-white",
    hint: "text-indigo-800/55 dark:text-indigo-300/65",
  },
  {
    card: "border-violet-200/50 bg-gradient-to-br from-white to-violet-50/90 shadow-md shadow-violet-500/10 dark:border-violet-500/25 dark:from-slate-900 dark:to-violet-950/50",
    icon: "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20",
    label: "text-violet-900/65 dark:text-violet-200/75",
    value: "text-violet-950 dark:text-white",
    hint: "text-violet-800/55 dark:text-violet-300/65",
  },
  {
    card: "border-teal-200/50 bg-gradient-to-br from-white to-teal-50/90 shadow-md shadow-teal-500/10 dark:border-teal-500/25 dark:from-slate-900 dark:to-teal-950/45",
    icon: "bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/20",
    label: "text-teal-900/65 dark:text-teal-200/75",
    value: "text-teal-950 dark:text-white",
    hint: "text-teal-800/55 dark:text-teal-300/65",
  },
  {
    card: "border-amber-200/50 bg-gradient-to-br from-white to-amber-50/85 shadow-md shadow-amber-500/10 dark:border-amber-500/25 dark:from-slate-900 dark:to-amber-950/35",
    icon: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/20",
    label: "text-amber-900/65 dark:text-amber-200/75",
    value: "text-amber-950 dark:text-white",
    hint: "text-amber-900/55 dark:text-amber-200/65",
  },
];

function SectionHeading({ title, description }) {
  return (
    <div className="space-y-2">
      <div
        className="h-1 w-14 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-500 shadow-sm shadow-indigo-400/30"
        aria-hidden
      />
      <h2 className="text-lg font-semibold tracking-tight text-indigo-950 dark:text-white">{title}</h2>
      {description ? (
        <p className="max-w-2xl text-sm leading-relaxed text-indigo-900/70 dark:text-slate-300">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, toneIndex = 0 }) {
  const t = STAT_TONES[toneIndex % STAT_TONES.length];
  return (
    <Card
      className={`border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${t.card}`}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-2.5 ${t.icon}`}>
          <Icon size={20} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${t.label}`}>{label}</p>
          <p className={`mt-0.5 text-2xl font-bold tracking-tight truncate ${t.value}`}>{value}</p>
          {hint ? <p className={`mt-1 text-xs ${t.hint}`}>{hint}</p> : null}
        </div>
      </div>
    </Card>
  );
}

function PassBadge({ passes }) {
  if (passes === null) {
    return (
      <span className="text-xs font-medium text-gray-400 dark:text-gray-500">—</span>
    );
  }
  return passes ? (
    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200/70 dark:bg-emerald-950/35 dark:text-emerald-300 dark:ring-emerald-800/40">
      Pass
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800 ring-1 ring-red-200/70 dark:bg-red-950/35 dark:text-red-300 dark:ring-red-800/40">
      Below target
    </span>
  );
}

function ScorePill({ children, muted }) {
  if (muted) {
    return (
      <span className="text-sm font-medium italic text-violet-400 dark:text-slate-500">{children}</span>
    );
  }
  return (
    <span className="inline-flex min-w-[3.25rem] justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 px-2.5 py-1 text-sm font-bold tabular-nums text-indigo-900 shadow-sm ring-1 ring-indigo-200/70 dark:from-indigo-950 dark:to-violet-950 dark:text-indigo-100 dark:ring-indigo-700/50">
      {children}
    </span>
  );
}

export default function Reporting() {
  const { auth } = useAuth();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        err?.response?.data?.message ||
        err?.message ||
        "Could not load grades.";
      setError(typeof msg === "string" ? msg : "Could not load grades.");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [auth.userId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const items = payload?.items ?? [];

  const examGroups = useMemo(() => {
    const map = new Map();
    for (const row of items) {
      if (!map.has(row.exam_id)) {
        map.set(row.exam_id, {
          exam_id: row.exam_id,
          exam_name: row.exam_name,
          rows: [],
        });
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
      return {
        ...g,
        gradedCount: graded.length,
        passCount,
        belowCount,
        unknownCount,
        pctAvg,
        gpaAvg,
        mixedTypes: types.size > 1,
      };
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
    return {
      totalRows: items.length,
      exams: examIds.size,
      subjects: subjects.size,
      graded: graded.length,
      passed,
    };
  }, [items]);

  if (loading) {
    return (
      <div className="relative flex min-h-[50vh] flex-col items-center justify-center gap-3 overflow-hidden p-6">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-200/50 via-violet-100/70 to-cyan-200/45 dark:from-indigo-950 dark:via-violet-950/90 dark:to-teal-950/50"
          aria-hidden
        />
        <div className="relative rounded-2xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-indigo-500/10 backdrop-blur-md dark:border-indigo-500/20 dark:bg-slate-900/70">
          <Loader />
        </div>
        <p className="relative text-sm font-medium text-indigo-900/80 dark:text-indigo-200">
          Loading your grades…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex min-h-[50vh] items-center justify-center overflow-hidden p-4">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-100/60 via-violet-100/50 to-indigo-100/50 dark:from-rose-950/40 dark:via-slate-900 dark:to-indigo-950/60"
          aria-hidden
        />
        <Card className="relative max-w-md border border-rose-200/60 bg-white/90 p-6 text-center shadow-xl shadow-rose-500/10 backdrop-blur-sm dark:border-rose-900/40 dark:bg-slate-900/85">
          <h2 className="text-lg font-semibold text-rose-950 dark:text-rose-100">Could not load report</h2>
          <p className="mt-2 text-sm text-rose-900/70 dark:text-rose-200/80">{error}</p>
          <Button variant="primary" className="mt-5 w-full" onClick={fetchReport}>
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  const student = payload?.student;

  return (
    <div className="relative min-h-full overflow-hidden pb-24 md:pb-6">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-indigo-200/55 via-fuchsia-100/65 to-cyan-200/50 dark:from-indigo-950 dark:via-violet-950/85 dark:to-teal-950/45"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-0 z-0 h-72 w-72 rounded-full bg-violet-400/25 blur-3xl dark:bg-violet-600/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-32 z-0 h-64 w-64 rounded-full bg-cyan-400/30 blur-3xl dark:bg-teal-600/10"
        aria-hidden
      />

      <div className="relative z-[1] mx-auto flex max-w-6xl flex-col gap-6 px-4 py-5 md:px-6 md:py-6">
        <Card className="overflow-hidden border-0 p-0 shadow-xl shadow-indigo-500/15 ring-1 ring-white/50 dark:ring-indigo-500/20">
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-600 px-5 py-6 text-white md:px-7 md:py-7">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/4 h-24 w-64 rounded-full bg-cyan-300/20 blur-2xl" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Reporting</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-[1.75rem]">Grades & performance</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90">
                Review marks by exam and by subject. Averages and pass indicators follow each exam&apos;s
                grading rules.
              </p>
            </div>
          </div>
        </Card>

        {student ? (
          <Card className="border border-indigo-200/40 bg-white/85 p-4 shadow-lg shadow-indigo-500/5 backdrop-blur-sm dark:border-indigo-500/25 dark:bg-slate-900/75 md:p-5">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
                  <GraduationCap size={24} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300/90">
                    Student
                  </p>
                  <p className="text-base font-bold text-indigo-950 dark:text-white">{student.name}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-indigo-100 pt-4 dark:border-indigo-900/50 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
                {student.roll_number ? (
                  <span className="rounded-xl bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-900 ring-1 ring-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-100 dark:ring-indigo-700/50">
                    <span className="text-indigo-600/80 dark:text-indigo-300">Roll </span>
                    {student.roll_number}
                  </span>
                ) : null}
                {student.admission_number ? (
                  <span className="rounded-xl bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-900 ring-1 ring-teal-200/80 dark:bg-teal-950/40 dark:text-teal-100 dark:ring-teal-700/50">
                    <span className="text-teal-700/80 dark:text-teal-300">Adm. </span>
                    {student.admission_number}
                  </span>
                ) : null}
              </div>
            </div>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={BookMarked}
            label="Grade entries"
            value={overview.totalRows}
            hint={`${overview.graded} graded`}
            toneIndex={0}
          />
          <StatCard icon={BarChart3} label="Exams" value={overview.exams} toneIndex={1} />
          <StatCard icon={Layers} label="Subjects" value={overview.subjects} toneIndex={2} />
          <StatCard
            icon={CheckCircle2}
            label="Pass (graded)"
            value={overview.graded ? `${overview.passed} / ${overview.graded}` : "—"}
            hint="Against each item’s passing threshold"
            toneIndex={3}
          />
        </div>

        {items.length === 0 ? (
          <Card className="border border-dashed border-indigo-300/50 bg-white/80 p-10 text-center shadow-lg shadow-indigo-500/10 backdrop-blur-sm dark:border-indigo-600/40 dark:bg-slate-900/70">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 text-white shadow-lg">
              <BookMarked size={26} strokeWidth={2} />
            </div>
            <h3 className="text-base font-bold text-indigo-950 dark:text-white">No grades yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-indigo-900/70 dark:text-slate-300">
              When your teachers publish marks, they will appear here with summaries and breakdowns.
            </p>
          </Card>
        ) : (
          <>
            <section className="space-y-4">
              <SectionHeading
                title="By exam"
                description="Each card is one exam. Summary metrics are shown above the subject table."
              />
              <div className="grid gap-4 lg:grid-cols-2">
                {examGroups.map((g) => (
                  <Card
                    key={g.exam_id}
                    className="overflow-hidden border border-indigo-200/40 border-l-4 border-l-indigo-500 bg-white/90 p-0 shadow-lg shadow-indigo-500/10 backdrop-blur-sm dark:border-indigo-500/30 dark:bg-slate-900/75"
                  >
                    <div className="border-b border-indigo-100/80 bg-gradient-to-r from-indigo-50/95 via-violet-50/80 to-teal-50/70 px-4 py-4 dark:border-indigo-900/50 dark:from-indigo-950/80 dark:via-violet-950/50 dark:to-teal-950/40">
                      <h3 className="text-base font-bold text-indigo-950 dark:text-white">{g.exam_name}</h3>
                      <p className="mt-1 text-xs font-medium text-indigo-900/65 dark:text-slate-300">
                        {g.rows.length} subject{g.rows.length === 1 ? "" : "s"} · {g.gradedCount} graded
                        {g.gradedCount > 0
                          ? ` · ${g.passCount} pass · ${g.belowCount} below target${
                              g.unknownCount ? ` · ${g.unknownCount} n/a` : ""
                            }`
                          : ""}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {g.pctAvg != null ? (
                          <span className="rounded-md bg-primary-100/90 px-2.5 py-1 font-medium text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">
                            Avg %: {g.pctAvg.toFixed(1)}
                          </span>
                        ) : null}
                        {g.gpaAvg != null ? (
                          <span className="rounded-md bg-[var(--color-accent-100)] px-2.5 py-1 font-medium text-teal-900 dark:bg-teal-950/50 dark:text-teal-200">
                            Avg GPA: {g.gpaAvg.toFixed(2)}
                          </span>
                        ) : null}
                        {g.mixedTypes ? (
                          <span className="rounded-md bg-violet-100/90 px-2.5 py-1 font-medium text-violet-900 dark:bg-violet-950/50 dark:text-violet-200">
                            Mixed grading types
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[320px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-indigo-100/80 bg-gradient-to-r from-indigo-100/70 to-teal-100/50 text-xs font-semibold uppercase tracking-wide text-indigo-800/80 dark:border-indigo-900/50 dark:from-indigo-950/60 dark:to-teal-950/40 dark:text-indigo-200/90">
                            <th className="px-4 py-2.5">Subject</th>
                            <th className="px-4 py-2.5">Score</th>
                            <th className="px-4 py-2.5">Result</th>
                            <th className="hidden px-4 py-2.5 sm:table-cell">Graded</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-100/60 dark:divide-indigo-900/40">
                          {g.rows.map((row) => (
                            <tr
                              key={row.grade_id}
                              className="bg-white/70 transition-colors hover:bg-indigo-50/80 dark:bg-slate-900/40 dark:hover:bg-indigo-950/40"
                            >
                              <td className="px-4 py-3 font-semibold text-indigo-950 dark:text-white">
                                {row.subject_name}
                              </td>
                              <td className="px-4 py-3">
                                {row.is_graded ? (
                                  <ScorePill>{formatGrade(row)}</ScorePill>
                                ) : (
                                  <ScorePill muted>Pending</ScorePill>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <PassBadge passes={row.is_graded ? gradePasses(row) : null} />
                              </td>
                              <td className="hidden px-4 py-3 text-sm text-indigo-800/55 dark:text-slate-400 sm:table-cell">
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

            <section className="space-y-4">
              <SectionHeading
                title="By subject"
                description="Every graded subject across exams, plus quick averages on the tiles below."
              />
              <Card className="overflow-hidden border border-teal-200/40 bg-white/90 p-0 shadow-lg shadow-teal-500/10 backdrop-blur-sm dark:border-teal-800/30 dark:bg-slate-900/75">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[360px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-teal-100/80 bg-gradient-to-r from-teal-100/80 to-cyan-100/60 text-xs font-semibold uppercase tracking-wide text-teal-900/80 dark:border-teal-900/50 dark:from-teal-950/60 dark:to-cyan-950/40 dark:text-teal-200/90">
                        <th className="px-4 py-3">Subject</th>
                        <th className="px-4 py-3">Exam</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">Result</th>
                        <th className="hidden px-4 py-3 md:table-cell">Graded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-100/60 dark:divide-teal-900/40">
                      {subjectGroups.flatMap((sg) => sg.rows).map((row) => (
                        <tr
                          key={row.grade_id}
                          className="bg-white/70 transition-colors hover:bg-teal-50/70 dark:bg-slate-900/40 dark:hover:bg-teal-950/35"
                        >
                          <td className="px-4 py-3 font-semibold text-indigo-950 dark:text-white">
                            {row.subject_name}
                          </td>
                          <td className="px-4 py-3 text-indigo-900/75 dark:text-slate-300">{row.exam_name}</td>
                          <td className="px-4 py-3">
                            {row.is_graded ? (
                              <ScorePill>{formatGrade(row)}</ScorePill>
                            ) : (
                              <ScorePill muted>Pending</ScorePill>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <PassBadge passes={row.is_graded ? gradePasses(row) : null} />
                          </td>
                          <td className="hidden px-4 py-3 text-sm text-teal-900/55 dark:text-slate-400 md:table-cell">
                            {formatShortDate(row.graded_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {subjectGroups.map((sg) => (
                  <Card
                    key={sg.subject_name}
                    className="border border-violet-200/45 bg-gradient-to-br from-white to-violet-50/90 p-4 shadow-md shadow-violet-500/10 transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-violet-700/35 dark:from-slate-900 dark:to-violet-950/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-indigo-950 dark:text-white">{sg.subject_name}</h3>
                      <span className="shrink-0 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                        {sg.rows.length}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-violet-800/70 dark:text-violet-200/70">
                      {sg.rows.length === 1 ? "1 entry" : `${sg.rows.length} entries`}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {sg.pctAvg != null ? (
                        <span className="rounded-md bg-primary-100/90 px-2.5 py-1 font-medium text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">
                          Avg %: {sg.pctAvg.toFixed(1)}
                        </span>
                      ) : null}
                      {sg.gpaAvg != null ? (
                        <span className="rounded-md bg-[var(--color-accent-100)] px-2.5 py-1 font-medium text-teal-900 dark:bg-teal-950/50 dark:text-teal-200">
                          Avg GPA: {sg.gpaAvg.toFixed(2)}
                        </span>
                      ) : null}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
