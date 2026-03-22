import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { getScholarships } from "../api/scholarships.api";
import { Card, Badge, Loader, Dropdown, Modal } from "../ui-components";
import Button from "../ui-components/Button";

function statusBadgeVariant(status) {
  const s = (status || "").toUpperCase();
  if (s === "OPEN") return "success";
  if (s === "CLOSED" || s === "EXPIRED") return "error";
  return "info";
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

function formatList(value) {
  if (value == null) return "—";
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "—";
  }
  return String(value);
}

/** Map one API `classes` entry to a grade 1–12, or null if not recognized. */
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

const CLASS_FILTER_OPTIONS = [
  { value: "", label: "All classes" },
  ...Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    return { value: String(n), label: `Class ${n}` };
  }),
];

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
  if (!scholarship) return null;
  const s = scholarship;

  return (
    <Modal
      open
      onClose={onClose}
      className="max-h-[min(90vh,720px)] max-w-2xl flex flex-col overflow-hidden p-0"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-border px-4 py-3 pr-10">
          <h2
            id="scholarship-detail-title"
            className="text-lg font-semibold text-gray-900 leading-snug"
          >
            {s.scholarshipName || "Scholarship"}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {s.category && <Badge variant="info">{s.category}</Badge>}
            {s.status && (
              <Badge variant={statusBadgeVariant(s.status)}>{s.status}</Badge>
            )}
            {s.academicYear && (
              <Badge variant="info">{s.academicYear}</Badge>
            )}
          </div>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-4"
          aria-labelledby="scholarship-detail-title"
        >
          <dl className="space-y-4">
            <DetailRow label="Source">{s.sourceName || "—"}</DetailRow>
            <DetailRow label="Source type">{s.sourceType || "—"}</DetailRow>
            <DetailRow label="Classes">{formatList(s.classes)}</DetailRow>
            <DetailRow label="Target group">{formatList(s.targetGroup)}</DetailRow>
            <DetailRow label="Opens">{formatDateTime(s.openDate)}</DetailRow>
            <DetailRow label="Closes">{formatDateTime(s.closeDate)}</DetailRow>
            {s.rawTitle && s.rawTitle !== s.scholarshipName && (
              <DetailRow label="Original title">{s.rawTitle}</DetailRow>
            )}
            {s.benefitSummary && (
              <DetailRow label="Benefits">{s.benefitSummary}</DetailRow>
            )}
            {s.eligibilitySummary && (
              <DetailRow label="Eligibility">{s.eligibilitySummary}</DetailRow>
            )}
            <DetailRow label="Last checked">
              {formatDateTime(s.lastCheckedAt)}
            </DetailRow>
            <DetailRow label="Updated">{formatDateTime(s.updatedAt)}</DetailRow>
            <DetailRow label="Record ID">
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
                  Official details
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
                  Announcement
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

export default function Scholarships() {
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
              : err?.message || err?.error || "Failed to load scholarships";
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
    const opts = [{ value: "", label: "All categories" }];
    [...set].sort().forEach((c) => opts.push({ value: c, label: c }));
    return opts;
  }, [items]);

  const statusOptions = useMemo(() => {
    const set = new Set();
    items.forEach((s) => {
      if (s.status) set.add(s.status);
    });
    const opts = [{ value: "", label: "All statuses" }];
    [...set].sort().forEach((st) => opts.push({ value: st, label: st }));
    return opts;
  }, [items]);

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

  const hasFilters =
    searchQuery.trim() ||
    categoryFilter?.value ||
    statusFilter?.value ||
    classFilter?.value;

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
        <Card className="max-w-md w-full text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Could not load scholarships
          </h2>
          <p className="text-gray-600 text-sm mb-4">{String(error)}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 gap-4 pb-24 md:pb-6">
      <Card>
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scholarships</h1>
            <p className="text-sm text-gray-600 mt-1">
              Government and other scholarship listings. Open the official site
              for full details and applications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4 relative">
              <input
                type="search"
                placeholder="Search by name, source, or keywords…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Search scholarships"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div className="md:col-span-2">
              <Dropdown
                selected={categoryFilter}
                onChange={setCategoryFilter}
                options={categoryOptions}
                placeholder="Category"
              />
            </div>
            <div className="md:col-span-2">
              <Dropdown
                selected={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                placeholder="Status"
              />
            </div>
            <div className="md:col-span-2">
              <Dropdown
                selected={classFilter}
                onChange={setClassFilter}
                options={CLASS_FILTER_OPTIONS}
                placeholder="Class"
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter(null);
                    setStatusFilter(null);
                    setClassFilter(null);
                  }}
                  className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <p className="text-sm text-gray-500 px-1">
        Showing {filtered.length} of {items.length}
      </p>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <Card className="text-center text-gray-600 py-10">
            No scholarships match your filters.
          </Card>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              aria-label={`View details: ${s.scholarshipName || "Scholarship"}`}
              className="cursor-pointer rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
              onClick={() => setDetailScholarship(s)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setDetailScholarship(s);
                }
              }}
            >
              <Card className="flex flex-col gap-3 pointer-events-none hover:border-primary-400">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 leading-snug">
                    {s.scholarshipName || "Untitled"}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {s.sourceName}
                    {s.academicYear ? ` · ${s.academicYear}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {s.category && (
                    <Badge variant="info">{s.category}</Badge>
                  )}
                  {s.status && (
                    <Badge variant={statusBadgeVariant(s.status)}>
                      {s.status}
                    </Badge>
                  )}
                </div>
              </div>

              {(s.benefitSummary || s.eligibilitySummary) && (
                <div className="space-y-2 text-sm text-gray-700">
                  {s.benefitSummary && (
                    <p className="line-clamp-3">{truncate(s.benefitSummary, 320)}</p>
                  )}
                  {s.eligibilitySummary && (
                    <p className="line-clamp-3 text-gray-600">
                      {s.benefitSummary && (
                        <span className="font-medium text-gray-800">Eligibility · </span>
                      )}
                      {truncate(s.eligibilitySummary, s.benefitSummary ? 240 : 320)}
                    </p>
                  )}
                </div>
              )}

              <div className="pointer-events-auto flex flex-wrap gap-2 pt-1">
                {s.detailsUrl && (
                  <Button
                    type="button"
                    variant="primary"
                    className="inline-flex items-center gap-2"
                    onClick={() => {
                      const w = window.open(s.detailsUrl, "_blank");
                      if (w) w.opener = null;
                    }}
                  >
                    Official details
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </Button>
                )}
                {s.announcementUrl && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="inline-flex items-center gap-2"
                    onClick={() => {
                      const w = window.open(s.announcementUrl, "_blank");
                      if (w) w.opener = null;
                    }}
                  >
                    Announcement
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </Button>
                )}
              </div>
              </Card>
            </div>
          ))
        )}
      </div>

      <ScholarshipDetailModal
        scholarship={detailScholarship}
        onClose={() => setDetailScholarship(null)}
      />
    </div>
  );
}
