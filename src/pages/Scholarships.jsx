import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, GraduationCap, Calendar, Search, SlidersHorizontal, X, ChevronRight, Building2, Award } from "lucide-react";
import { getScholarships } from "../api/scholarships.api";
import { Badge, Loader, Dropdown, Modal } from "../ui-components";
import Button from "../ui-components/Button";

function statusBadgeVariant(status) {
  const s = (status || "").toUpperCase();
  if (s === "OPEN") return "success";
  if (s === "CLOSED" || s === "EXPIRED") return "error";
  return "info";
}

function statusBorderColor(status) {
  const s = (status || "").toUpperCase();
  if (s === "OPEN") return "border-l-green-400";
  if (s === "CLOSED" || s === "EXPIRED") return "border-l-red-300";
  return "border-l-blue-300";
}

function statusAccentBg(status) {
  const s = (status || "").toUpperCase();
  if (s === "OPEN") return "bg-green-50";
  if (s === "CLOSED" || s === "EXPIRED") return "bg-red-50";
  return "bg-blue-50";
}

function statusIconColor(status) {
  const s = (status || "").toUpperCase();
  if (s === "OPEN") return "text-green-500";
  if (s === "CLOSED" || s === "EXPIRED") return "text-red-400";
  return "text-blue-400";
}

function truncate(text, max = 220) {
  if (!text || typeof text !== "string") return null;
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

function formatDateTime(value) {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

function formatDateShort(value) {
  if (value == null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysUntil(value) {
  if (value == null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Math.ceil((d - Date.now()) / 86_400_000);
  return diff;
}

function formatList(value) {
  if (value == null) return "—";
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "—";
  }
  return String(value);
}

function parseGradeFromClassEntry(entry) {
  if (entry == null || entry === "") return null;
  if (typeof entry === "number") {
    const n = Math.round(entry);
    return n >= 1 && n <= 12 ? n : null;
  }
  const s = String(entry).trim();
  const asInt = parseInt(s, 10);
  if (!Number.isNaN(asInt) && String(asInt) === s && asInt >= 1 && asInt <= 12) {
    return asInt;
  }
  const match = s.match(/(?:^|\D)(1[0-2]|[1-9])(?:\D|$)/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n >= 1 && n <= 12) return n;
  }
  return null;
}

function scholarshipIncludesClassGrade(scholarship, grade) {
  const cls = scholarship.classes;
  if (!Array.isArray(cls) || cls.length === 0) return false;
  return cls.some((c) => parseGradeFromClassEntry(c) === grade);
}

function DetailRow({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words">
        {children}
      </dd>
    </div>
  );
}

function ScholarshipDetailModal({ scholarship, onClose }) {
  const { t } = useTranslation();
  if (!scholarship) return null;
  const s = scholarship;
  const closeDate = formatDateShort(s.closeDate);
  const days = daysUntil(s.closeDate);

  return (
    <Modal
      open
      onClose={onClose}
      className="max-h-[min(90vh,720px)] max-w-2xl flex flex-col overflow-hidden p-0"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Modal header */}
        <div className={`shrink-0 border-b border-border px-5 py-4 pr-12 ${statusAccentBg(s.status)}`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <Award className={`h-5 w-5 ${statusIconColor(s.status)}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                id="scholarship-detail-title"
                className="text-base font-bold text-gray-900 leading-snug"
              >
                {s.scholarshipName || t("scholarships.fallbackTitle")}
              </h2>
              {s.sourceName && (
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {s.sourceName}
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {s.category && <Badge variant="info">{s.category}</Badge>}
            {s.status && (
              <Badge variant={statusBadgeVariant(s.status)}>{s.status}</Badge>
            )}
            {s.academicYear && (
              <Badge variant="info">{s.academicYear}</Badge>
            )}
            {closeDate && days != null && days > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 px-2 py-1 text-xs font-medium">
                <Calendar className="h-3 w-3" />
                {t("scholarships.daysLeft", { count: days })}
              </span>
            )}
          </div>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4"
          aria-labelledby="scholarship-detail-title"
        >
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow label={t("scholarships.source")}>{s.sourceName || "—"}</DetailRow>
            <DetailRow label={t("scholarships.sourceType")}>{s.sourceType || "—"}</DetailRow>
            <DetailRow label={t("scholarships.classes")}>{formatList(s.classes)}</DetailRow>
            <DetailRow label={t("scholarships.targetGroup")}>{formatList(s.targetGroup)}</DetailRow>
            <DetailRow label={t("scholarships.opens")}>{formatDateTime(s.openDate)}</DetailRow>
            <DetailRow label={t("scholarships.closes")}>{formatDateTime(s.closeDate)}</DetailRow>
            {s.rawTitle && s.rawTitle !== s.scholarshipName && (
              <DetailRow label={t("scholarships.originalTitle")}>{s.rawTitle}</DetailRow>
            )}
          </dl>

          {(s.benefitSummary || s.eligibilitySummary) && (
            <div className="space-y-3 pt-2 border-t border-border">
              {s.benefitSummary && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{t("scholarships.benefits")}</p>
                  <p className="text-sm text-gray-800 leading-relaxed">{s.benefitSummary}</p>
                </div>
              )}
              {s.eligibilitySummary && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{t("scholarships.eligibility")}</p>
                  <p className="text-sm text-gray-800 leading-relaxed">{s.eligibilitySummary}</p>
                </div>
              )}
            </div>
          )}

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            <DetailRow label={t("scholarships.lastChecked")}>
              {formatDateTime(s.lastCheckedAt)}
            </DetailRow>
            <DetailRow label={t("scholarships.updated")}>{formatDateTime(s.updatedAt)}</DetailRow>
            <DetailRow label={t("scholarships.recordId")}>
              <span className="font-mono text-xs">{s.id}</span>
            </DetailRow>
          </dl>

          {(s.detailsUrl || s.announcementUrl) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {s.detailsUrl && (
                <Button
                  type="button"
                  variant="primary"
                  className="inline-flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    const w = window.open(s.detailsUrl, "_blank");
                    if (w) w.opener = null;
                  }}
                >
                  {t("scholarships.officialDetails")}
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </Button>
              )}
              {s.announcementUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  className="inline-flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    const w = window.open(s.announcementUrl, "_blank");
                    if (w) w.opener = null;
                  }}
                >
                  {t("scholarships.announcement")}
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ScholarshipCard({ s, onOpen }) {
  const { t } = useTranslation();
  const closeDate = formatDateShort(s.closeDate);
  const days = daysUntil(s.closeDate);
  const status = (s.status || "").toUpperCase();
  const isOpen = status === "OPEN";
  const classes = Array.isArray(s.classes) ? s.classes.slice(0, 4) : [];
  const extraClasses = Array.isArray(s.classes) ? Math.max(0, s.classes.length - 4) : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t("scholarships.viewDetailsAria", {
        name: s.scholarshipName || t("scholarships.fallbackTitle"),
      })}
      className="group bg-white rounded-2xl border border-gray-100 border-l-4 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
      style={{ borderLeftColor: isOpen ? "#4ade80" : status === "CLOSED" || status === "EXPIRED" ? "#fca5a5" : "#93c5fd" }}
      onClick={() => onOpen(s)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(s);
        }
      }}
    >
      {/* Card body */}
      <div className="p-5 pb-3 flex-1 flex flex-col gap-3">
        {/* Top row: icon + title + badge */}
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${isOpen ? "bg-green-50" : "bg-gray-100"}`}>
            <GraduationCap className={`h-5 w-5 ${isOpen ? "text-green-500" : "text-gray-400"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {s.category && (
                  <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">
                    {s.category}
                  </span>
                )}
                <h2 className="text-sm font-bold text-gray-900 mt-0.5 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors">
                  {s.scholarshipName || t("scholarships.untitled")}
                </h2>
              </div>
              {s.status && (
                <Badge variant={statusBadgeVariant(s.status)}>
                  {s.status}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Source */}
        {s.sourceName && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{s.sourceName}</span>
            {s.academicYear && <span className="ml-1 text-gray-400">· {s.academicYear}</span>}
          </div>
        )}

        {/* Benefit/Eligibility summary */}
        {(s.benefitSummary || s.eligibilitySummary) && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {truncate(s.benefitSummary || s.eligibilitySummary, 180)}
          </p>
        )}

        {/* Classes chips */}
        {classes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {classes.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600"
              >
                {t("scholarships.classChip", {
                  label: parseGradeFromClassEntry(c) ?? c,
                })}
              </span>
            ))}
            {extraClasses > 0 && (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                {t("scholarships.moreClasses", { count: extraClasses })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className={`px-5 py-3 border-t border-gray-100 flex items-center justify-between ${isOpen ? "bg-green-50" : "bg-gray-50"}`}>
        <div className="flex items-center gap-3">
          {closeDate && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>{t("scholarships.closesOnShort", { date: closeDate })}</span>
            </div>
          )}
          {days != null && days > 0 && days <= 30 && (
            <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-xs font-semibold">
              {t("scholarships.daysLeftShort", { days })}
            </span>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </div>
    </div>
  );
}

export default function Scholarships() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [classFilter, setClassFilter] = useState(null);
  const [detailScholarship, setDetailScholarship] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getScholarships();
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) {
          const msg =
            typeof err === "string"
              ? err
              : err?.message || err?.error || t("scholarships.failedToLoadShort");
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryOptions = useMemo(() => {
    const set = new Set();
    items.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    const opts = [{ value: "", label: t("scholarships.allCategories") }];
    [...set].sort().forEach((c) => opts.push({ value: c, label: c }));
    return opts;
  }, [items, t]);

  const statusOptions = useMemo(() => {
    const set = new Set();
    items.forEach((s) => {
      if (s.status) set.add(s.status);
    });
    const opts = [{ value: "", label: t("scholarships.allStatuses") }];
    [...set].sort().forEach((st) => opts.push({ value: st, label: st }));
    return opts;
  }, [items, t]);

  const classFilterOptions = useMemo(
    () => [
      { value: "", label: t("scholarships.allClasses") },
      ...Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        return { value: String(n), label: t("studyChat.classNumber", { n: String(n) }) };
      }),
    ],
    [t]
  );

  const filtered = useMemo(() => {
    let list = [...items];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const hay = [
          s.scholarshipName,
          s.sourceName,
          s.category,
          s.benefitSummary,
          s.eligibilitySummary,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    if (categoryFilter?.value) {
      list = list.filter((s) => s.category === categoryFilter.value);
    }
    if (statusFilter?.value) {
      list = list.filter((s) => s.status === statusFilter.value);
    }
    if (classFilter?.value) {
      const grade = parseInt(classFilter.value, 10);
      if (grade >= 1 && grade <= 12) {
        list = list.filter((s) => scholarshipIncludesClassGrade(s, grade));
      }
    }
    return list;
  }, [items, searchQuery, categoryFilter, statusFilter, classFilter]);

  const openCount = useMemo(
    () => items.filter((s) => (s.status || "").toUpperCase() === "OPEN").length,
    [items]
  );

  const hasFilters =
    searchQuery.trim() ||
    categoryFilter?.value ||
    statusFilter?.value ||
    classFilter?.value;

  function clearFilters() {
    setSearchQuery("");
    setCategoryFilter(null);
    setStatusFilter(null);
    setClassFilter(null);
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center pb-16 md:pb-0">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4 pb-20 md:pb-4">
        <div className="max-w-md w-full text-center bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-7 w-7 text-red-300" />
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-2">
            {t("scholarships.couldNotLoadTitle")}
          </h2>
          <p className="text-gray-500 text-sm mb-5">{String(error)}</p>
          <Button onClick={() => window.location.reload()}>{t("scholarships.retry")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pb-24 md:pb-6">
      {/* Hero strip */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl px-5 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t("scholarships.title")}</h1>
            <p className="text-indigo-200 text-xs mt-0.5">
              {t("scholarships.heroSubtitle")}
            </p>
          </div>
          {openCount > 0 && (
            <div className="ml-auto flex-shrink-0 bg-green-400 text-white text-xs font-bold rounded-full px-3 py-1">
              {t("scholarships.openCountBadge", { count: openCount })}
            </div>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder={t("scholarships.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition bg-gray-50"
            aria-label={t("scholarships.searchAria")}
          />
        </div>

        {/* Filter dropdowns row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* <SlidersHorizontal className="h-4 w-4 text-gray-400 flex-shrink-0" /> */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 min-w-0">
            <Dropdown
              selected={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryOptions}
              placeholder={t("scholarships.categoryPlaceholder")}
            />
            <Dropdown
              selected={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              placeholder={t("scholarships.statusPlaceholder")}
            />
            <Dropdown
              selected={classFilter}
              onChange={setClassFilter}
              options={classFilterOptions}
              placeholder={t("scholarships.classPlaceholder")}
            />
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              {t("scholarships.clearFilters")}
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 px-1">
        <p className="text-sm text-gray-500">
          {t("scholarships.showingOf", { filtered: filtered.length, total: items.length })}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium underline underline-offset-2"
          >
            {t("scholarships.clearFilters")}
          </button>
        )}
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16 px-4">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-indigo-200" />
          </div>
          <p className="text-base font-semibold text-gray-700 mb-1">{t("scholarships.noScholarshipsFound")}</p>
          <p className="text-sm text-gray-400 mb-4">{t("scholarships.tryAdjustingFilters")}</p>
          {hasFilters && (
            <Button variant="secondary" onClick={clearFilters}>
              {t("scholarships.clearFilters")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <ScholarshipCard key={s.id} s={s} onOpen={setDetailScholarship} />
          ))}
        </div>
      )}

      <ScholarshipDetailModal
        scholarship={detailScholarship}
        onClose={() => setDetailScholarship(null)}
      />
    </div>
  );
}
