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

function SectionHeading({ title, description }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold text-gray-950">{title}</h2>
      {description ? (
        <p className="max-w-2xl text-sm text-gray-800">{description}</p>
      ) : null}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary-50 p-2 text-primary-700">
          <Icon size={20} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-800">{label}</p>
          <p className="mt-0.5 truncate text-xl font-semibold text-gray-950">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs font-medium text-gray-700">{hint}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function PassBadge({ passes }) {
  if (passes === null) {
    return <span className="text-xs font-semibold text-gray-700">—</span>;
  }
  return passes ? (
    <span className="inline-flex items-center rounded-md bg-success-100 px-2 py-0.5 text-xs font-semibold text-success-700 ring-1 ring-success-700/25">
      Pass
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md bg-error-100 px-2 py-0.5 text-xs font-semibold text-error-700 ring-1 ring-error-700/25">
      Below target
    </span>
  );
}

function ScorePill({ children, muted }) {
  if (muted) {
    return (
      <span className="text-sm font-semibold italic text-gray-700">{children}</span>
    );
  }
  return (
    <span className="inline-flex min-w-[3.25rem] justify-center rounded-lg bg-primary-50 px-2.5 py-1 text-sm font-semibold tabular-nums text-gray-950 ring-1 ring-primary-700/25">
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
      <div className="flex h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="max-w-md p-6 text-center">
          <h2 className="text-lg font-semibold text-error-600">Could not load report</h2>
          <p className="mt-2 text-sm text-gray-800">{error}</p>
          <Button variant="primary" className="mt-5 w-full" onClick={fetchReport}>
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  const student = payload?.student;

  return (
    <div className="flex h-screen flex-col gap-6 p-4  md:h-auto md:min-h-screen ">
      

      {/* {student ? (
        <Card>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <GraduationCap size={24} strokeWidth={2} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-800">
                  Student
                </p>
                <p className="text-base font-semibold text-gray-950">{student.name}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
              {student.roll_number ? (
                <span className="rounded-lg bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-900 ring-1 ring-border">
                  <span className="text-gray-800">Roll </span>
                  {student.roll_number}
                </span>
              ) : null}
              {student.admission_number ? (
                <span className="rounded-lg bg-[var(--color-accent-100)]/80 px-3 py-1.5 text-sm font-semibold text-gray-900 ring-1 ring-border">
                  <span className="text-gray-800">Adm. </span>
                  {student.admission_number}
                </span>
              ) : null}
            </div>
          </div>
        </Card>
      ) : null} */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BookMarked}
          label="Grade entries"
          value={overview.totalRows}
          hint={`${overview.graded} graded`}
        />
        <StatCard icon={BarChart3} label="Exams" value={overview.exams} />
        <StatCard icon={Layers} label="Subjects" value={overview.subjects} />
        <StatCard
          icon={CheckCircle2}
          label="Pass (graded)"
          value={overview.graded ? `${overview.passed} / ${overview.graded}` : "—"}
          hint="Against each item’s passing threshold"
        />
      </div>

      {items.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-800">
              <BookMarked size={26} strokeWidth={2} />
            </div>
            <h3 className="text-base font-semibold text-gray-950">No grades yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-800">
              When your teachers publish marks, they will appear here with summaries and breakdowns.
            </p>
          </div>
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
                <Card key={g.exam_id} className="overflow-hidden p-0">
                  <div className="border-b border-border bg-gray-50 px-4 py-4">
                    <h3 className="text-base font-semibold text-gray-950">{g.exam_name}</h3>
                    <p className="mt-1 text-xs font-semibold text-gray-800">
                      {g.rows.length} subject{g.rows.length === 1 ? "" : "s"} · {g.gradedCount} graded
                      {g.gradedCount > 0
                        ? ` · ${g.passCount} pass · ${g.belowCount} below target${
                            g.unknownCount ? ` · ${g.unknownCount} n/a` : ""
                          }`
                        : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {g.pctAvg != null ? (
                        <span className="rounded-md bg-primary-100 px-2.5 py-1 font-semibold text-primary-900">
                          Avg %: {g.pctAvg.toFixed(1)}
                        </span>
                      ) : null}
                      {g.gpaAvg != null ? (
                        <span className="rounded-md bg-[var(--color-accent-100)] px-2.5 py-1 font-semibold text-gray-950">
                          Avg GPA: {g.gpaAvg.toFixed(2)}
                        </span>
                      ) : null}
                      {g.mixedTypes ? (
                        <span className="rounded-md bg-gray-100 px-2.5 py-1 font-semibold text-gray-900">
                          Mixed grading types
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[320px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-gray-800">
                          <th className="px-4 py-2.5">Subject</th>
                          <th className="px-4 py-2.5">Score</th>
                          <th className="px-4 py-2.5">Result</th>
                          <th className="hidden px-4 py-2.5 sm:table-cell">Graded</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {g.rows.map((row) => (
                          <tr
                            key={row.grade_id}
                            className="transition-colors hover:bg-black/5"
                          >
                            <td className="px-4 py-3 font-semibold text-gray-950">
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
                            <td className="hidden px-4 py-3 text-sm font-medium text-gray-800 sm:table-cell">
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

          <section className="space-y-4 pb-20">
            <SectionHeading
              title="By subject"
              description="Every graded subject across exams, plus quick averages on the tiles below."
            />
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[360px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-gray-800">
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Exam</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Result</th>
                      <th className="hidden px-4 py-3 md:table-cell">Graded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {subjectGroups.flatMap((sg) => sg.rows).map((row) => (
                      <tr
                        key={row.grade_id}
                        className="transition-colors hover:bg-black/5"
                      >
                        <td className="px-4 py-3 font-semibold text-gray-950">
                          {row.subject_name}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{row.exam_name}</td>
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
                        <td className="hidden px-4 py-3 text-sm font-medium text-gray-800 md:table-cell">
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
                  className="transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-950">{sg.subject_name}</h3>
                    <span className="shrink-0 rounded-md bg-primary-600 px-2 py-0.5 text-xs font-semibold text-white">
                      {sg.rows.length}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-gray-800">
                    {sg.rows.length === 1 ? "1 entry" : `${sg.rows.length} entries`}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {sg.pctAvg != null ? (
                      <span className="rounded-md bg-primary-100 px-2.5 py-1 font-semibold text-primary-900">
                        Avg %: {sg.pctAvg.toFixed(1)}
                      </span>
                    ) : null}
                    {sg.gpaAvg != null ? (
                      <span className="rounded-md bg-[var(--color-accent-100)] px-2.5 py-1 font-semibold text-gray-950">
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
  );
}
