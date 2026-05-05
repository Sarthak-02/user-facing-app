import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
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

function formatGrade(item, t) {
  if (item.grades_obtained == null || item.grades_obtained === "") return "—";
  const v = String(item.grades_obtained);
  if (item.grading_type === "PERCENTAGE") return t ? t("reporting.percentValue", { value: v }) : `${v}%`;
  if (item.grading_type === "GPA") return t ? t("reporting.gpaValue", { value: v }) : `${v} GPA`;
  return v;
}

function formatShortDate(iso, locale) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale || undefined, {
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
  const { t } = useTranslation();
  if (passes === null) return <span className="text-xs font-semibold text-gray-400">—</span>;
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
  const { t } = useTranslation();
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  return (
    <div className="mt-3">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
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
  const { t } = useTranslation();
  if (!item.is_graded) return <ScorePill muted>{t("reporting.pending")}</ScorePill>;
  const value = parseScore(item.grades_obtained);
  if (value == null) return <ScorePill muted>—</ScorePill>;
  if (ratingScale?.type === "stars") {
    return <StarRating value={value} max={ratingScale.points} labels={ratingScale.labels} />;
  }
  if (ratingScale?.type === "emoji") {
    return <EmojiRating value={value} emojiSet={ratingScale.emoji_set} labels={ratingScale.labels} />;
  }
  return <ScorePill>{formatGrade(item, t)}</ScorePill>;
}

// ─── GroupBy toggle ───────────────────────────────────────────────────────────

function translateChartGroupOption(opt, t) {
  if (opt === "exams") return t("reporting.byExam");
  if (opt === "subjects") return t("reporting.bySubject");
  return opt;
}

function GroupByToggle({ options, value, onChange }) {
  const { t } = useTranslation();
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
          {translateChartGroupOption(opt, t)}
        </button>
      ))}
    </div>
  );
}

// ─── Vertical Bar Chart ───────────────────────────────────────────────────────

function VerticalBarChart({ title, description, bars, groupByOptions, groupBy, onGroupByChange }) {
  const { t } = useTranslation();
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
        <p className="py-8 text-center text-sm text-gray-400">{t("reporting.noDataAvailable")}</p>
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
  const { t } = useTranslation();
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
            <span className="text-xs text-gray-500">{t("reporting.graded")}</span>
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
            <p className="text-xs text-gray-400">{t("exams.moreSubjects", { count: segments.length - 6 })}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Radar Chart ─────────────────────────────────────────────────────────────

function RadarChart({ title, description, data, groupByOptions, groupBy, onGroupByChange }) {
  const { t } = useTranslation();
  const SIZE = 220;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 72;
  const n = data.length;

  const header = (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      <GroupByToggle options={groupByOptions} value={groupBy} onChange={onGroupByChange} />
    </div>
  );

  if (!n) return <Card>{header}<p className="py-8 text-center text-sm text-gray-400">{t("reporting.noDataAvailable")}</p></Card>;
  if (n < 3) return <Card>{header}<p className="py-8 text-center text-sm text-gray-400">{t("reporting.needAtLeast3Items")}</p></Card>;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const angles = data.map((_, i) => (2 * Math.PI * i) / n - Math.PI / 2);
  const getPoint = (angle, frac) => ({ x: cx + R * frac * Math.cos(angle), y: cy + R * frac * Math.sin(angle) });
  const dataPoints = data.map((d, i) => getPoint(angles[i], d.value / maxVal));

  return (
    <Card>
      {header}
      <div className="flex items-center justify-center overflow-x-auto">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {[0.25, 0.5, 0.75, 1].map((level) => {
            const pts = angles.map((a) => getPoint(a, level));
            return <polygon key={level} points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#e5e7eb" strokeWidth={1} />;
          })}
          {angles.map((angle, i) => {
            const outer = getPoint(angle, 1);
            return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#e5e7eb" strokeWidth={1} />;
          })}
          <polygon points={dataPoints.map((p) => `${p.x},${p.y}`).join(" ")} fill="#6366f1" fillOpacity={0.2} stroke="#6366f1" strokeWidth={2} />
          {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#6366f1" />)}
          {data.map((d, i) => {
            const lp = getPoint(angles[i], 1.32);
            return (
              <text key={d.id} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="#6b7280">
                {d.label.length > 10 ? d.label.slice(0, 10) + "…" : d.label}
              </text>
            );
          })}
        </svg>
      </div>
    </Card>
  );
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────

function Heatmap({ title, description, subjectList, examList, cellMap, groupByOptions, groupBy, onGroupByChange }) {
  const { t } = useTranslation();
  const byExam = groupBy === "exams";
  const rows = byExam ? examList : subjectList.map((s) => ({ id: s, name: s }));
  const cols = byExam ? subjectList.map((s) => ({ id: s, name: s })) : examList;

  const getValue = (row, col) => {
    const key = byExam ? `${col.name ?? col}__${row.id}` : `${row.name ?? row}__${col.id}`;
    return cellMap[key] ?? null;
  };

  const allVals = rows.flatMap((row) => cols.map((col) => getValue(row, col))).filter((v) => v != null);
  const maxVal = allVals.length ? Math.max(...allVals) : 1;

  const header = (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      <GroupByToggle options={groupByOptions} value={groupBy} onChange={onGroupByChange} />
    </div>
  );

  if (!rows.length || !cols.length) return <Card>{header}<p className="py-8 text-center text-sm text-gray-400">{t("reporting.noDataAvailable")}</p></Card>;

  return (
    <Card>
      {header}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="py-1 pr-2 text-left font-medium text-gray-400" />
              {cols.map((col) => (
                <th key={col.id ?? col} className="px-1 py-1 text-center font-medium text-gray-500" style={{ minWidth: 44 }}>
                  <span className="block truncate" style={{ maxWidth: 60 }} title={col.name ?? col}>
                    {(col.name ?? col).length > 6 ? (col.name ?? col).slice(0, 6) + "…" : (col.name ?? col)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id ?? row}>
                <td className="whitespace-nowrap py-1 pr-2 font-medium text-gray-700" style={{ maxWidth: 80 }}>
                  <span className="block truncate" title={row.name ?? row}>
                    {(row.name ?? row).length > 8 ? (row.name ?? row).slice(0, 8) + "…" : (row.name ?? row)}
                  </span>
                </td>
                {cols.map((col) => {
                  const val = getValue(row, col);
                  const opacity = val != null ? 0.15 + (val / maxVal) * 0.82 : 0;
                  return (
                    <td key={col.id ?? col} className="px-1 py-1 text-center">
                      <div
                        className="mx-auto flex h-8 w-10 items-center justify-center rounded text-xs font-semibold"
                        style={{ backgroundColor: `rgba(99,102,241,${opacity})`, color: opacity > 0.55 ? "#fff" : "#4338ca" }}
                        title={val != null ? val.toFixed(1) : "—"}
                      >
                        {val != null ? val.toFixed(1) : "—"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────

function LineChart({ title, description, points, groupByOptions, groupBy, onGroupByChange }) {
  const { t } = useTranslation();
  const W = 300;
  const H = 160;
  const PAD = { top: 12, right: 12, bottom: 32, left: 32 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const n = points.length;

  const header = (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      <GroupByToggle options={groupByOptions} value={groupBy} onChange={onGroupByChange} />
    </div>
  );

  if (n < 2) return <Card>{header}<p className="py-8 text-center text-sm text-gray-400">{t("reporting.needAtLeast2DataPoints")}</p></Card>;

  const maxVal = Math.max(...points.map((p) => p.value), 1);
  const minVal = Math.min(...points.map((p) => p.value), 0);
  const range = maxVal - minVal || 1;

  const svgPoints = points.map((p, i) => ({
    x: PAD.left + (i / (n - 1)) * chartW,
    y: PAD.top + chartH - ((p.value - minVal) / range) * chartH,
  }));
  const polyline = svgPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <Card>
      {header}
      <div className="overflow-x-auto">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = PAD.top + (1 - t) * chartH;
            const val = minVal + t * range;
            return (
              <g key={t}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#f3f4f6" strokeWidth={1} />
                <text x={PAD.left - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={8} fill="#9ca3af">{val.toFixed(1)}</text>
              </g>
            );
          })}
          <polygon
            points={`${PAD.left},${PAD.top + chartH} ${polyline} ${W - PAD.right},${PAD.top + chartH}`}
            fill="#6366f1"
            fillOpacity={0.08}
          />
          <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {svgPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#6366f1" stroke="#fff" strokeWidth={1.5} />)}
          {points.map((pt, i) => {
            const x = PAD.left + (i / (n - 1)) * chartW;
            return (
              <text key={pt.id} x={x} y={H - PAD.bottom + 12} textAnchor="middle" fontSize={8} fill="#9ca3af">
                {pt.label.length > 7 ? pt.label.slice(0, 7) + "…" : pt.label}
              </text>
            );
          })}
        </svg>
      </div>
    </Card>
  );
}

// ─── Progress Rings ───────────────────────────────────────────────────────────

function ProgressRings({ title, description, rings, maxValue, groupByOptions, groupBy, onGroupByChange }) {
  const { t } = useTranslation();
  const R = 22;
  const SW = 5;
  const circumference = 2 * Math.PI * R;
  const SIZE = 60;
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  const header = (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      <GroupByToggle options={groupByOptions} value={groupBy} onChange={onGroupByChange} />
    </div>
  );

  if (!rings.length) return <Card>{header}<p className="py-8 text-center text-sm text-gray-400">{t("reporting.noDataAvailable")}</p></Card>;

  return (
    <Card>
      {header}
      <div className="flex flex-wrap gap-4">
        {rings.slice(0, 8).map((ring) => {
          const fraction = maxValue > 0 ? Math.min(ring.value / maxValue, 1) : 0;
          const dashLen = fraction * circumference;
          return (
            <div key={ring.id} className="flex flex-col items-center gap-1">
              <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f3f4f6" strokeWidth={SW} />
                <circle cx={cx} cy={cy} r={R} fill="none" stroke={ring.color} strokeWidth={SW} strokeDasharray={`${dashLen} ${circumference}`} strokeLinecap="round" />
              </svg>
              <span className="text-xs font-semibold text-gray-700">{ring.displayValue}</span>
              <span className="max-w-[56px] truncate text-center text-xs text-gray-500" title={ring.label}>
                {ring.label.length > 8 ? ring.label.slice(0, 8) + "…" : ring.label}
              </span>
            </div>
          );
        })}
        {rings.length > 8 && <p className="self-end text-xs text-gray-400">{t("exams.moreSubjects", { count: rings.length - 8 })}</p>}
      </div>
    </Card>
  );
}

// ─── Table Chart ─────────────────────────────────────────────────────────────

function TableChart({ title, description, rows, groupByOptions, groupBy, onGroupByChange }) {
  const { t } = useTranslation();
  const byExam = groupBy === "exams";

  const header = (
    <div className="px-5 py-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      <GroupByToggle options={groupByOptions} value={groupBy} onChange={onGroupByChange} />
    </div>
  );

  if (!rows.length) return <Card>{header}<p className="py-8 text-center text-sm text-gray-400">{t("reporting.noDataAvailable")}</p></Card>;

  return (
    <Card className="overflow-hidden p-0">
      {header}
      <div className="overflow-x-auto border-t border-border">
        <table className="w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-2.5">{byExam ? t("reporting.exam") : t("reporting.subject")}</th>
              <th className="px-4 py-2.5">{t("reporting.avgScoreHeader")}</th>
              <th className="px-4 py-2.5">{t("reporting.gradedHeader")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className={`transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                <td className="px-4 py-2.5 font-medium text-gray-900">{row.label}</td>
                <td className="px-4 py-2.5 text-gray-700">{row.displayValue ?? "—"}</td>
                <td className="px-4 py-2.5 text-gray-500">{row.count ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Gauge ────────────────────────────────────────────────────────────────────

function Gauge({ title, description, value, maxValue, displayValue, groupByOptions, groupBy, onGroupByChange }) {
  const { t } = useTranslation();
  const W = 200;
  const H = 120;
  const cx = W / 2;
  const cy = H - 14;
  const R = 72;
  const SW = 16;
  const arc = Math.PI * R;
  const fraction = maxValue > 0 ? Math.min((value ?? 0) / maxValue, 1) : 0;
  const color = fraction < 0.4 ? "#ef4444" : fraction < 0.7 ? "#f59e0b" : "#22c55e";
  const rotate = `rotate(180deg)`;
  const origin = `${cx}px ${cy}px`;

  const header = (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      <GroupByToggle options={groupByOptions} value={groupBy} onChange={onGroupByChange} />
    </div>
  );

  if (value == null) return <Card>{header}<p className="py-8 text-center text-sm text-gray-400">{t("reporting.noDataAvailable")}</p></Card>;

  return (
    <Card>
      {header}
      <div className="flex flex-col items-center">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f3f4f6" strokeWidth={SW} strokeDasharray={`${arc} ${arc}`} style={{ transform: rotate, transformOrigin: origin }} />
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth={SW} strokeDasharray={`${fraction * arc} ${arc}`} strokeLinecap="round" style={{ transform: rotate, transformOrigin: origin }} />
          <text x={cx} y={cy - 10} textAnchor="middle" fontSize={22} fontWeight="bold" fill="#111827">{displayValue}</text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize={10} fill="#6b7280">{t("reporting.overallAvg")}</text>
        </svg>
      </div>
    </Card>
  );
}

// ─── Scatter Plot ─────────────────────────────────────────────────────────────

function ScatterPlot({ title, description, points, xLabels, groupByOptions, groupBy, onGroupByChange }) {
  const { t } = useTranslation();
  const W = 300;
  const H = 180;
  const PAD = { top: 12, right: 12, bottom: 36, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const header = (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      <GroupByToggle options={groupByOptions} value={groupBy} onChange={onGroupByChange} />
    </div>
  );

  if (!points.length) return <Card>{header}<p className="py-8 text-center text-sm text-gray-400">{t("reporting.noDataAvailable")}</p></Card>;

  const maxX = Math.max(...points.map((p) => p.x), 0);
  const maxY = Math.max(...points.map((p) => p.y), 1);
  const minY = Math.min(...points.map((p) => p.y), 0);
  const rangeY = maxY - minY || 1;

  const toSvg = (p) => ({
    x: PAD.left + (maxX > 0 ? (p.x / maxX) * chartW : chartW / 2),
    y: PAD.top + chartH - ((p.y - minY) / rangeY) * chartH,
  });

  return (
    <Card>
      {header}
      <div className="overflow-x-auto">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = PAD.top + chartH - t * chartH;
            const val = minY + t * rangeY;
            return (
              <g key={t}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#f3f4f6" strokeWidth={1} />
                <text x={PAD.left - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={8} fill="#9ca3af">{val.toFixed(1)}</text>
              </g>
            );
          })}
          {xLabels.map((label, i) => {
            const x = PAD.left + (maxX > 0 ? (i / maxX) * chartW : chartW / 2);
            return (
              <text key={i} x={x} y={H - PAD.bottom + 12} textAnchor="middle" fontSize={8} fill="#9ca3af">
                {label.length > 6 ? label.slice(0, 6) + "…" : label}
              </text>
            );
          })}
          {points.map((p) => {
            const sp = toSvg(p);
            return <circle key={p.id} cx={sp.x} cy={sp.y} r={4} fill={p.color} fillOpacity={0.75} />;
          })}
        </svg>
      </div>
    </Card>
  );
}

// ─── Histogram ────────────────────────────────────────────────────────────────

function Histogram({ title, description, buckets, groupByOptions, groupBy, onGroupByChange }) {
  const { t } = useTranslation();
  const header = (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      <GroupByToggle options={groupByOptions} value={groupBy} onChange={onGroupByChange} />
    </div>
  );

  if (!buckets.length) return <Card>{header}<p className="py-8 text-center text-sm text-gray-400">{t("reporting.noDataAvailable")}</p></Card>;

  const max = Math.max(...buckets.map((b) => b.value), 1);

  return (
    <Card>
      {header}
      <div className="flex items-end gap-1.5" style={{ height: 140 }}>
        {buckets.map((b) => (
          <div key={b.id} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="text-xs font-semibold text-gray-700">{b.value}</span>
            <div className="w-full rounded-t-md transition-all duration-700" style={{ height: `${Math.max((b.value / max) * 100, 4)}px`, backgroundColor: b.color }} />
            <span className="w-full truncate text-center text-xs text-gray-500" title={b.label}>
              {b.label.length > 9 ? b.label.slice(0, 9) + "…" : b.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function Reporting() {
  const { t, i18n } = useTranslation();
  const { auth } = useAuth();
  const campusId = auth.campus_id;
  const sectionId = auth.sections?.[0]?.value;
  const unknownSubject = t("reporting.unknownSubject");

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
        setError(t("reporting.unexpectedResponse"));
      }
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return;
      console.error("Grades report:", err);
      const msg = err?.response?.data?.message || err?.message || t("reporting.couldNotLoadGrades");
      setError(typeof msg === "string" ? msg : t("reporting.couldNotLoadGrades"));
      setPayload(null);
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false);
    }
  }, [auth.userId, campusId, sectionId, t]);

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
    const subjectNames = [...new Set(items.map((r) => r.subject_name || unknownSubject))];
    return subjectNames
      .sort((a, b) => a.localeCompare(b))
      .map((subject_name) => {
        const rows = items
          .filter((r) => (r.subject_name || unknownSubject) === subject_name)
          .sort((a, b) => new Date(b.graded_at || 0) - new Date(a.graded_at || 0));
        const pctAvg = averageForType(rows, "PERCENTAGE");
        const gpaAvg = averageForType(rows, "GPA");
        const avgGrade = averageGrade(rows);
        return { subject_name, rows, pctAvg, gpaAvg, avgGrade };
      });
  }, [items, unknownSubject]);

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

  const overallAvg = useMemo(() => averageGrade(items), [items]);

  const radarDataBySubject = useMemo(
    () => subjectGroups.filter((sg) => sg.avgGrade != null).map((sg, i) => ({
      id: sg.subject_name,
      label: sg.subject_name,
      value: sg.avgGrade,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })),
    [subjectGroups]
  );

  const radarDataByExam = useMemo(
    () => examGroups.filter((g) => g.avgGrade != null).map((g, i) => ({
      id: g.exam_id,
      label: g.exam_name,
      value: g.avgGrade,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })),
    [examGroups]
  );

  const heatmapBase = useMemo(() => {
    const subjectList = [...new Set(items.map((r) => r.subject_name || unknownSubject))].sort();
    const examList = [...new Set(items.map((r) => r.exam_id))].map((id) => {
      const row = items.find((r) => r.exam_id === id);
      return { id, name: row?.exam_name ?? id };
    });
    const cellMap = {};
    subjectList.forEach((subject) => {
      examList.forEach((exam) => {
        const rows = items.filter((r) => (r.subject_name || unknownSubject) === subject && r.exam_id === exam.id && r.is_graded);
        const vals = rows.map((r) => parseScore(r.grades_obtained)).filter((n) => n != null);
        cellMap[`${subject}__${exam.id}`] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      });
    });
    return { subjectList, examList, cellMap };
  }, [items, unknownSubject]);

  const lineDataByExam = useMemo(
    () => examGroups.filter((g) => g.avgGrade != null).map((g, i) => ({
      id: g.exam_id,
      label: g.exam_name,
      value: g.avgGrade,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })),
    [examGroups]
  );

  const lineDataBySubject = useMemo(
    () => subjectGroups.filter((sg) => sg.avgGrade != null).map((sg, i) => ({
      id: sg.subject_name,
      label: sg.subject_name,
      value: sg.avgGrade,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })),
    [subjectGroups]
  );

  const scatterData = useMemo(() => {
    const subjectList = [...new Set(items.map((r) => r.subject_name || unknownSubject))].sort();
    const examIds = [...new Set(items.map((r) => r.exam_id))];
    return items
      .filter((r) => r.is_graded)
      .map((r) => {
        const score = parseScore(r.grades_obtained);
        if (score == null) return null;
        const subjectIdx = subjectList.indexOf(r.subject_name || unknownSubject);
        const examIdx = examIds.indexOf(r.exam_id);
        return { id: r.grade_id, x: examIdx, y: score, color: CHART_COLORS[subjectIdx % CHART_COLORS.length] };
      })
      .filter(Boolean);
  }, [items, unknownSubject]);

  const scatterXLabels = useMemo(
    () => [...new Set(items.map((r) => r.exam_id))].map((id) => items.find((r) => r.exam_id === id)?.exam_name ?? id),
    [items]
  );

  const histogramData = useMemo(() => {
    const scores = items.filter((r) => r.is_graded).map((r) => parseScore(r.grades_obtained)).filter((n) => n != null);
    if (!scores.length) return [];
    const minV = Math.min(...scores);
    const maxV = Math.max(...scores);
    const bucketCount = 5;
    const size = (maxV - minV || 1) / bucketCount;
    return Array.from({ length: bucketCount }, (_, i) => {
      const lo = minV + i * size;
      const hi = minV + (i + 1) * size;
      return {
        id: `bucket-${i}`,
        label: `${lo.toFixed(1)}–${hi.toFixed(1)}`,
        value: scores.filter((s) => s >= lo && (i === bucketCount - 1 ? s <= hi : s < hi)).length,
        color: CHART_COLORS[i % CHART_COLORS.length],
      };
    });
  }, [items]);

  if (loading) {
    return <div className="flex flex-1 items-center justify-center"><Loader /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="max-w-md p-6 text-center">
          <h2 className="text-lg font-semibold text-red-600">{t("reporting.couldNotLoadReport")}</h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <Button variant="primary" className="mt-5 w-full" onClick={fetchReport}>{t("reporting.tryAgain")}</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 pb-24 md:p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t("reporting.gradeReport")}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{t("reporting.gradeReportSubtitle")}</p>
        </div>
        <button
          onClick={fetchReport}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
        >
          <RefreshCw size={14} strokeWidth={2} />
          {t("reporting.refresh")}
        </button>
      </div>

      {/* Stat cards */}
      {useGrades && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={BookMarked} label={t("reporting.gradeEntries")} value={overview.totalRows} hint={t("reporting.gradedHintCount", { count: overview.graded })} accent="bg-blue-50 text-blue-600" />
          <StatCard icon={BarChart3} label={t("reporting.exams")} value={overview.exams} accent="bg-purple-50 text-purple-600" />
          <StatCard icon={Layers} label={t("reporting.subjects")} value={overview.subjects} accent="bg-amber-50 text-amber-600" />
          <StatCard
            icon={CheckCircle2}
            label={t("reporting.passed")}
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
            <h3 className="text-base font-semibold text-gray-900">{t("reporting.noGradesYet")}</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
              {t("reporting.noGradesStudentHint")}
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
                const byExam = groupBy === "exams";
                const scopeWord = byExam ? t("reporting.scopeExam") : t("reporting.scopeSubject");
                const setGroupBy = (v) => setChartGroupBys((prev) => ({ ...prev, [i]: v }));
                const common = { key: i, groupByOptions: chart.group_by, groupBy, onGroupByChange: setGroupBy };

                switch (chart.type) {
                  case "bar_chart":
                    return (
                      <VerticalBarChart
                        {...common}
                        title={t("reporting.performance")}
                        description={t("reporting.descAvgScore", { scope: scopeWord })}
                        bars={byExam ? barDataByExam : barDataBySubject}
                      />
                    );
                  case "pie_chart":
                    return (
                      <ConfigPieChart
                        {...common}
                        title={t("reporting.gradeDistribution")}
                        description={t("reporting.descGradedEntries", { scope: scopeWord })}
                        slices={byExam ? pieDataByExam : pieDataBySubject}
                      />
                    );
                  case "radar_chart":
                    return (
                      <RadarChart
                        {...common}
                        title={t("reporting.skillRadar")}
                        description={t("reporting.descScores", { scope: scopeWord })}
                        data={byExam ? radarDataByExam : radarDataBySubject}
                      />
                    );
                  case "heatmap":
                    return (
                      <Heatmap
                        {...common}
                        title={t("reporting.scoreHeatmap")}
                        description={t("reporting.heatmapStudentDesc")}
                        subjectList={heatmapBase.subjectList}
                        examList={heatmapBase.examList}
                        cellMap={heatmapBase.cellMap}
                      />
                    );
                  case "line_chart":
                    return (
                      <LineChart
                        {...common}
                        title={t("reporting.trend")}
                        description={t("reporting.descTrend", { scope: scopeWord })}
                        points={byExam ? lineDataByExam : lineDataBySubject}
                      />
                    );
                  case "progress_rings": {
                    const ringData = byExam ? barDataByExam : barDataBySubject;
                    const maxVal = ratingScale?.points ?? (ringData.length ? Math.max(...ringData.map((r) => r.value)) : 1);
                    return (
                      <ProgressRings
                        {...common}
                        title={t("reporting.progress")}
                        description={t("reporting.descProgress", { scope: scopeWord })}
                        rings={ringData}
                        maxValue={maxVal}
                      />
                    );
                  }
                  case "table": {
                    const tableRows = byExam
                      ? examGroups.map((g) => ({ id: g.exam_id, label: g.exam_name, displayValue: formatAvgWithConfig(g.avgGrade, ratingScale), count: g.gradedCount }))
                      : subjectGroups.map((sg) => ({ id: sg.subject_name, label: sg.subject_name, displayValue: formatAvgWithConfig(sg.avgGrade, ratingScale), count: sg.rows.filter((r) => r.is_graded).length }));
                    return (
                      <TableChart
                        {...common}
                        title={t("reporting.summaryTable")}
                        description={t("reporting.descSummary", { scope: scopeWord })}
                        rows={tableRows}
                      />
                    );
                  }
                  case "gauge":
                    return (
                      <Gauge
                        {...common}
                        title={t("reporting.overallPerformance")}
                        description={t("reporting.gaugeStudentDesc")}
                        value={overallAvg}
                        maxValue={ratingScale?.points ?? 100}
                        displayValue={formatAvgWithConfig(overallAvg, ratingScale)}
                      />
                    );
                  case "scatter_plot":
                    return (
                      <ScatterPlot
                        {...common}
                        title={t("reporting.scoreDistribution")}
                        description={t("reporting.scatterStudentDesc")}
                        points={scatterData}
                        xLabels={scatterXLabels}
                      />
                    );
                  case "histogram":
                    return (
                      <Histogram
                        {...common}
                        title={t("reporting.scoreHistogram")}
                        description={t("reporting.histogramStudentDesc")}
                        buckets={histogramData}
                      />
                    );
                  default:
                    return null;
                }
              })}
            </div>
          )}

          {/* Grade detail tabs */}
          {useGrades && (
            <>
              <div className="border-b border-border">
                <div className="flex gap-1">
                  <TabButton active={activeTab === "exam"} onClick={() => setActiveTab("exam")}>{t("reporting.byExam")}</TabButton>
                  <TabButton active={activeTab === "subject"} onClick={() => setActiveTab("subject")}>{t("reporting.bySubject")}</TabButton>
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
                              {t("reporting.subjectCount", { count: g.rows.length })}
                            </span>
                          </div>

                          {g.gradedCount > 0 && !ratingScale && (
                            <>
                              <ExamPassBar passCount={g.passCount} belowCount={g.belowCount} total={g.gradedCount} />
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500" />{t("reporting.passedCount", { count: g.passCount })}
                                </span>
                                {g.belowCount > 0 && (
                                  <span className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-red-400" />{t("reporting.belowCount", { count: g.belowCount })}
                                  </span>
                                )}
                              </div>
                            </>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            {ratingScale?.type === "stars" && g.avgGrade != null && (
                              <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                                {t("reporting.avgStars", { value: g.avgGrade.toFixed(1), max: ratingScale.points })}
                              </span>
                            )}
                            {!ratingScale && g.pctAvg != null && (
                              <span className="rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-800 ring-1 ring-primary-200">
                                {t("reporting.avgPercentShort", { value: g.pctAvg.toFixed(1) })}
                              </span>
                            )}
                            {!ratingScale && g.gpaAvg != null && (
                              <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-800 ring-1 ring-purple-200">
                                {t("reporting.avgGpaShort", { value: g.gpaAvg.toFixed(2) })}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="overflow-x-auto border-t border-border">
                          <table className="w-full min-w-[300px] text-left text-sm">
                            <thead>
                              <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                <th className="px-5 py-2.5">{t("reporting.subject")}</th>
                                <th className="px-5 py-2.5">{t("reporting.score")}</th>
                                {!ratingScale && <th className="px-5 py-2.5">{t("reporting.result")}</th>}
                                <th className="hidden px-5 py-2.5 sm:table-cell">{t("reporting.gradedOn")}</th>
                                {showComments && <th className="hidden px-5 py-2.5 md:table-cell">{t("reporting.comments")}</th>}
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
                                    {formatShortDate(row.graded_at, i18n.language)}
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
                      <h3 className="font-semibold text-gray-900">{t("reporting.allEntries")}</h3>
                      <p className="mt-0.5 text-xs text-gray-500">{t("reporting.allEntriesSubtitle")}</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[360px] text-left text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <th className="px-5 py-3">{t("reporting.subject")}</th>
                            <th className="px-5 py-3">{t("reporting.exam")}</th>
                            <th className="px-5 py-3">{t("reporting.score")}</th>
                            {!ratingScale && <th className="px-5 py-3">{t("reporting.result")}</th>}
                            <th className="hidden px-5 py-3 md:table-cell">{t("reporting.gradedOn")}</th>
                            {showComments && <th className="hidden px-5 py-3 lg:table-cell">{t("reporting.comments")}</th>}
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
                                {formatShortDate(row.graded_at, i18n.language)}
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
