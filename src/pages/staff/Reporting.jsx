import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button } from "../../ui-components";
import { StaffReportingShimmer } from "../../ui-components/Shimmer";
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
  FileDown,
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

function formatGrade(item, t) {
  if (item.grades_obtained == null || item.grades_obtained === "") return "—";
  const v = String(item.grades_obtained);
  if (item.grading_type === "PERCENTAGE") return t ? t("reporting.percentValue", { value: v }) : `${v}%`;
  if (item.grading_type === "GPA") return t ? t("reporting.gpaValue", { value: v }) : `${v} GPA`;
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
  const { t } = useTranslation();
  if (passes === null)
    return <span className="text-xs font-semibold text-gray-400">—</span>;
  return passes ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {t("studentExams.pass")}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-600/20">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      {t("reporting.belowTarget")}
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
  const { t } = useTranslation();
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  return (
    <div className="mt-3">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs font-semibold text-emerald-700">{t("reporting.passRatePercent", { pct })}</p>
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

function HorizBarChart({ title, description, bars, onBarClick }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <Card>
      <div className="mb-5">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      <div className="space-y-4">
        {bars.map((bar) => (
          <div
            key={bar.label}
            onClick={() => onBarClick?.(bar)}
            className={onBarClick ? "-mx-2 cursor-pointer rounded-lg px-2 py-1 transition-colors hover:bg-gray-50" : ""}
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="max-w-[65%] truncate text-sm font-medium text-gray-700">
                {bar.label}
              </span>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-sm font-semibold tabular-nums text-gray-900">
                  {bar.displayValue}
                </span>
                {onBarClick && <ChevronRight size={14} className="text-gray-400" />}
              </div>
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

// ─── PDF generation ──────────────────────────────────────────────────────────

async function generateStudentPDF(student, examGroups, totalGraded, totalPassed, pctAvgAll) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PW = 210;
  const ML = 15;
  const MR = 15;
  const CW = PW - ML - MR;
  let y = 20;

  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, PW, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("STUDENT PERFORMANCE REPORT", ML, 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), PW - MR, 9, { align: "right" });

  y = 26;
  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(student.name, ML, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text("Academic Report", ML, y);
  y += 8;

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.line(ML, y, PW - MR, y);
  y += 8;

  // Summary stat boxes
  const boxW = (CW - 8) / 3;
  const boxH = 18;
  const stats = [
    { label: "EXAMS", value: String(examGroups.length) },
    {
      label: "PASS RATE",
      value: totalGraded > 0 ? `${Math.round((totalPassed / totalGraded) * 100)}%` : "—",
    },
    {
      label: "AVG SCORE",
      value: pctAvgAll != null ? `${pctAvgAll.toFixed(1)}%` : "—",
    },
  ];
  stats.forEach((s, i) => {
    const bx = ML + i * (boxW + 4);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(bx, y, boxW, boxH, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(17, 24, 39);
    doc.text(s.value, bx + boxW / 2, y + 9, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text(s.label, bx + boxW / 2, y + 15, { align: "center" });
  });
  y += boxH + 10;

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.line(ML, y, PW - MR, y);
  y += 8;

  // Grade breakdown
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);
  doc.text("GRADE BREAKDOWN", ML, y);
  y += 7;

  for (const g of examGroups) {
    // Page overflow guard
    if (y > 265) { doc.addPage(); y = 20; }

    // Exam header band
    doc.setFillColor(243, 244, 246);
    doc.rect(ML, y, CW, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text(g.exam_name, ML + 3, y + 5.5);
    if (g.pctAvg != null) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(59, 130, 246);
      doc.text(`Avg: ${g.pctAvg.toFixed(1)}%`, PW - MR - 3, y + 5.5, { align: "right" });
    }
    y += 8;

    // Pass / below line
    if (g.gradedCount > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(16, 185, 129);
      doc.text(`✓ Passed: ${g.passCount}`, ML + 3, y + 4);
      if (g.belowCount > 0) {
        doc.setTextColor(239, 68, 68);
        doc.text(`✗ Below target: ${g.belowCount}`, ML + 40, y + 4);
      }
      y += 7;
    }

    // Table header
    const cols = { subject: ML, score: ML + 110, result: ML + 140 };
    doc.setFillColor(249, 250, 251);
    doc.rect(ML, y, CW, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text("SUBJECT", cols.subject + 2, y + 4.2);
    doc.text("SCORE", cols.score, y + 4.2);
    doc.text("RESULT", cols.result, y + 4.2);
    y += 6;

    // Table rows
    g.rows.forEach((row, idx) => {
      if (y > 272) { doc.addPage(); y = 20; }
      if (idx % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(252, 252, 253);
      }
      doc.rect(ML, y, CW, 7, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(17, 24, 39);
      const subj = row.subject_name ?? "—";
      doc.text(subj.length > 38 ? subj.slice(0, 38) + "…" : subj, cols.subject + 2, y + 5);

      doc.setFont("helvetica", "bold");
      if (!row.is_graded) {
        doc.setTextColor(156, 163, 175);
        doc.setFont("helvetica", "italic");
        doc.text("Pending", cols.score, y + 5);
      } else {
        doc.setTextColor(17, 24, 39);
        const scoreStr = formatGrade(row, null);
        doc.text(scoreStr, cols.score, y + 5);
      }

      const passes = row.is_graded ? gradePasses(row) : null;
      if (passes === true) {
        doc.setTextColor(16, 185, 129);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text("Pass", cols.result, y + 5);
      } else if (passes === false) {
        doc.setTextColor(239, 68, 68);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text("Below", cols.result, y + 5);
      } else {
        doc.setTextColor(156, 163, 175);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text("—", cols.result, y + 5);
      }
      y += 7;
    });

    // Row border
    doc.setDrawColor(229, 231, 235);
    doc.line(ML, y, PW - MR, y);
    y += 6;
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(`Page ${p} of ${totalPages}`, PW / 2, 290, { align: "center" });
  }

  doc.save(`${student.name.replace(/\s+/g, "_")}_report.pdf`);
}

// ─── Student Detail Panel ─────────────────────────────────────────────────────

function StudentDetailPanel({ student, onClose }) {
  const { t } = useTranslation();
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
              <p className="text-xs text-gray-500">{t("reporting.studentReport")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => generateStudentPDF(student, examGroups, totalGraded, totalPassed, pctAvgAll)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
              title="Download PDF report"
            >
              <FileDown size={14} strokeWidth={2} />
              PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 border-b border-border p-4">
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{examGroups.length}</p>
            <p className="text-xs text-gray-500">{t("reporting.exams")}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-center">
            <p className="text-lg font-bold text-emerald-700">
              {totalGraded > 0 ? `${Math.round((totalPassed / totalGraded) * 100)}%` : "—"}
            </p>
            <p className="text-xs text-gray-500">{t("reporting.passRate")}</p>
          </div>
          <div className="rounded-xl bg-primary-50 p-3 text-center">
            <p className="text-lg font-bold text-primary-700">
              {pctAvgAll != null ? `${pctAvgAll.toFixed(1)}%` : "—"}
            </p>
            <p className="text-xs text-gray-500">{t("reporting.avgScoreShort")}</p>
          </div>
        </div>

        {/* Exam breakdown */}
        <div className="flex-1 overflow-y-auto p-4 pb-nav md:pb-8">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">{t("reporting.gradeBreakdown")}</h3>
          {examGroups.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">{t("reporting.noGradesRecorded")}</div>
          ) : (
            <div className="space-y-4">
              {examGroups.map((g) => (
                <div key={g.exam_id} className="overflow-hidden rounded-xl border border-border">
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                    <span className="text-sm font-semibold text-gray-900">{g.exam_name}</span>
                    {g.pctAvg != null && (
                      <span className="rounded-lg bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-800 ring-1 ring-primary-200">
                        {t("reporting.avgGradePercent", { value: g.pctAvg.toFixed(1) })}
                      </span>
                    )}
                  </div>
                  {g.gradedCount > 0 && (
                    <div className="border-b border-border px-4 py-2">
                      <ExamPassBar passCount={g.passCount} belowCount={g.belowCount} total={g.gradedCount} />
                      <div className="mt-1.5 flex gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />{t("reporting.passedCount", { count: g.passCount })}
                        </span>
                        {g.belowCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-red-400" />{t("reporting.belowCount", { count: g.belowCount })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <th className="px-4 py-2 text-left">{t("reporting.subject")}</th>
                        <th className="px-4 py-2 text-left">{t("reporting.score")}</th>
                        <th className="px-4 py-2 text-left">{t("reporting.result")}</th>
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
                            {row.is_graded ? <ScorePill>{formatGrade(row, t)}</ScorePill> : <ScorePill muted>{t("reporting.pending")}</ScorePill>}
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
  const { t } = useTranslation();
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
              {t("reporting.studentCount", { count: studentCount })} · {t("reporting.gradedHintCount", { count: gradedCount })}
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
            <p className="text-xs text-gray-500">{t("reporting.passed")}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-3 text-center">
            <p className="text-lg font-bold text-red-600">{belowCount}</p>
            <p className="text-xs text-gray-500">{t("reporting.belowTarget")}</p>
          </div>
          <div className="rounded-xl bg-primary-50 p-3 text-center">
            <p className="text-lg font-bold text-primary-700">
              {pctAvg != null ? `${pctAvg.toFixed(1)}%` : gpaAvg != null ? `${gpaAvg.toFixed(2)}` : "—"}
            </p>
            <p className="text-xs text-gray-500">{pctAvg != null ? t("reporting.classAvg") : t("reporting.avgGpaLabel")}</p>
          </div>
        </div>

        {/* Grade table */}
        <div className="flex-1 overflow-y-auto pb-nav md:pb-8">
          <table className="w-full text-sm">
            <thead className="sticky top-0">
              <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 text-left">{t("reporting.student")}</th>
                <th className="px-5 py-3 text-left">{t("reporting.subject")}</th>
                <th className="px-5 py-3 text-left">{t("reporting.score")}</th>
                <th className="px-5 py-3 text-left">{t("reporting.result")}</th>
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
                    {row.is_graded ? <ScorePill>{formatGrade(row, t)}</ScorePill> : <ScorePill muted>{t("reporting.pending")}</ScorePill>}
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
  const { t } = useTranslation();
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
      setError(err?.response?.data?.message || err?.message || t("reporting.loadSectionError"));
      setGrades([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [teacherId, sectionId, filters, t]);

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
      studentGroups.map((s) => ({
        id: s.id,
        label: s.name,
        value: s.pctAvg ?? 0,
        displayValue: s.pctAvg != null ? `${s.pctAvg.toFixed(1)}%` : "—",
        barColor: "bg-primary-600",
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
    return <StaffReportingShimmer />;
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="max-w-md p-6 text-center">
          <h2 className="text-lg font-semibold text-red-600">{t("reporting.couldNotLoadData")}</h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <Button variant="primary" className="mt-5 w-full" onClick={fetchData}>
            {t("reporting.tryAgain")}
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
              <h1 className="text-xl font-bold text-gray-900">{t("reporting.sectionReport")}</h1>
              <p className="mt-0.5 text-sm text-gray-500">
                {t("reporting.sectionReportSubtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
          >
            <RefreshCw size={14} strokeWidth={2} />
            {t("reporting.refresh")}
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
            {t("reporting.filters")}
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
              {t("reporting.clear")}
            </button>
          )}
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <Card className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-600">{t("reporting.fromDate")}</label>
              <input
                type="date"
                value={pendingFilters.startDate}
                onChange={(e) => setPendingFilters((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-600">{t("reporting.toDate")}</label>
              <input
                type="date"
                value={pendingFilters.endDate}
                onChange={(e) => setPendingFilters((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-600">{t("reporting.statusFilter")}</label>
              <select
                value={pendingFilters.status}
                onChange={(e) => setPendingFilters((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="all">{t("reporting.statusAll")}</option>
                <option value="graded">{t("reporting.statusGraded")}</option>
                <option value="pending">{t("reporting.statusPendingFilter")}</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={applyFilters}>{t("studentAttendance.apply")}</Button>
              <Button variant="secondary" onClick={() => setShowFilters(false)}>{t("common.cancel")}</Button>
            </div>
          </Card>
        )}

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Users} label={t("reporting.students")} value={overview.totalStudents} accent="bg-blue-50 text-blue-600" />
          <StatCard icon={BookMarked} label={t("reporting.exams")} value={overview.totalExams} accent="bg-purple-50 text-purple-600" />
          <StatCard
            icon={BarChart3}
            label={t("reporting.avgScoreShort")}
            value={overview.avgScore != null ? `${overview.avgScore.toFixed(1)}%` : "—"}
            hint={t("reporting.gradedHintCount", { count: overview.gradedCount })}
            accent="bg-amber-50 text-amber-600"
          />
          <StatCard
            icon={CheckCircle2}
            label={t("reporting.passRate")}
            value={overview.passRate != null ? `${overview.passRate}%` : "—"}
            hint={t("reporting.pendingHintCount", { count: overview.pendingCount })}
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
              <h3 className="text-base font-semibold text-gray-900">{t("reporting.noGradeData")}</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                {t("reporting.noGradeDataSection")}
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* ── Tab nav ── */}
            <div className="border-b border-border">
              <div className="flex gap-1">
                <TabButton active={activeTab === "exam"} onClick={() => setActiveTab("exam")}>
                  {t("reporting.byExam")}
                </TabButton>
                <TabButton active={activeTab === "student"} onClick={() => setActiveTab("student")}>
                  {t("reporting.byStudent")}
                </TabButton>
              </div>
            </div>

            {/* ── By Exam tab ── */}
            {activeTab === "exam" && (
              <section className="space-y-4">
                {examLineData.length > 1 && (
                  <ExamLineChart
                    title={t("reporting.examComparison")}
                    description={t("reporting.examComparisonDescription")}
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
                          {t("reporting.studentCount", { count: g.studentCount })}
                        </span>
                        {g.pctAvg != null && (
                          <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 ring-1 ring-primary-200">
                            {t("reporting.avgPercentChip", { value: g.pctAvg.toFixed(1) })}
                          </span>
                        )}
                        {g.gpaAvg != null && (
                          <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 ring-1 ring-purple-200">
                            {t("reporting.avgGpaChip", { value: g.gpaAvg.toFixed(2) })}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {t("reporting.passedCount", { count: g.passCount })}
                        </span>
                        {g.belowCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-red-400" />
                            {t("reporting.belowCount", { count: g.belowCount })}
                          </span>
                        )}
                        {g.gradedCount < g.rows.length && (
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-gray-300" />
                            {t("reporting.pendingCountLabel", { count: g.rows.length - g.gradedCount })}
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
                    title={t("reporting.studentPerformance")}
                    description={t("reporting.studentPerformanceDescription")}
                    bars={studentBarData}
                    onBarClick={(bar) => {
                      const student = studentGroups.find((s) => s.id === bar.id);
                      if (student) setStudentDetail(student);
                    }}
                  />
                )}
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
