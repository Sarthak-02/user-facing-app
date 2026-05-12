import clsx from "clsx";
import "./Shimmer.css";

/**
 * Shimmer component for skeleton loading states
 * @param {string} variant - Type of shimmer: 'card-list' | 'detail' | 'table' | 'custom'
 * @param {number} count - Number of shimmer items to show (for card-list)
 * @param {string} className - Additional CSS classes
 */
export default function Shimmer({ 
  variant = "card-list", 
  count = 3,
  className = ""
}) {
  if (variant === "card-list") {
    return (
      <div className={clsx("space-y-4", className)}>
        {Array.from({ length: count }).map((_, index) => (
          <ShimmerCard key={index} />
        ))}
      </div>
    );
  }

  if (variant === "detail") {
    return <ShimmerDetail className={className} />;
  }

  if (variant === "table") {
    return <ShimmerTable count={count} className={className} />;
  }

  return null;
}

/**
 * Shimmer Card - For list views
 */
function ShimmerCard() {
  return (
    <div className="rounded-xl border border-border p-4 shadow-sm bg-white dark:bg-gray-100">
      {/* Header with avatar and title */}
      <div className="flex items-start gap-3 mb-3">
        <div className="shimmer h-10 w-10 rounded-full" />
        <div className="flex-1">
          <div className="shimmer h-5 w-3/4 rounded mb-2" />
          <div className="shimmer h-4 w-1/2 rounded" />
        </div>
        <div className="shimmer h-6 w-16 rounded-full" />
      </div>

      {/* Content lines */}
      <div className="space-y-2 mb-3">
        <div className="shimmer h-4 w-full rounded" />
        <div className="shimmer h-4 w-5/6 rounded" />
        <div className="shimmer h-4 w-4/6 rounded" />
      </div>

      {/* Footer with buttons/badges */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
        <div className="shimmer h-8 w-20 rounded" />
        <div className="shimmer h-8 w-20 rounded" />
        <div className="shimmer h-6 w-6 rounded-full ml-auto" />
      </div>
    </div>
  );
}

/**
 * Shimmer Detail - For detail pages
 */
function ShimmerDetail({ className }) {
  return (
    <div className={clsx("space-y-6", className)}>
      {/* Header section */}
      <div className="rounded-xl border border-border p-6 shadow-sm bg-white dark:bg-gray-800">
        <div className="flex items-start gap-4 mb-4">
          <div className="shimmer h-16 w-16 rounded-full" />
          <div className="flex-1">
            <div className="shimmer h-7 w-2/3 rounded mb-3" />
            <div className="shimmer h-5 w-1/2 rounded" />
          </div>
          <div className="shimmer h-9 w-24 rounded-lg" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <div className="shimmer h-8 w-16 rounded mx-auto mb-2" />
              <div className="shimmer h-4 w-20 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Content sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1 */}
        <div className="rounded-xl border border-border p-6 shadow-sm bg-white dark:bg-gray-800">
          <div className="shimmer h-6 w-32 rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="shimmer h-4 w-24 rounded" />
                <div className="shimmer h-4 w-32 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Section 2 */}
        <div className="rounded-xl border border-border p-6 shadow-sm bg-white dark:bg-gray-800">
          <div className="shimmer h-6 w-32 rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="shimmer h-4 w-24 rounded" />
                <div className="shimmer h-4 w-32 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description/Content section */}
      <div className="rounded-xl border border-border p-6 shadow-sm bg-white dark:bg-gray-800">
        <div className="shimmer h-6 w-40 rounded mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-4 w-full rounded" style={{ width: `${100 - i * 5}%` }} />
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-end">
        <div className="shimmer h-10 w-28 rounded-lg" />
        <div className="shimmer h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Shimmer Table - For table views
 */
function ShimmerTable({ count = 5, className }) {
  return (
    <div className={clsx("rounded-xl border border-border shadow-sm bg-white dark:bg-gray-800", className)}>
      {/* Table header */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shimmer h-5 w-24 rounded" />
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: count }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-4 gap-4 p-4 border-b border-border last:border-b-0">
          {Array.from({ length: 4 }).map((_, colIndex) => (
            <div key={colIndex} className="shimmer h-4 w-full rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmer skeleton for the Student Home page initial load
 */
export function StudentHomeShimmer() {
  return (
    <div className="min-h-full bg-[var(--color-background)] p-4 pb-30 md:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Hero card */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 shadow-lg md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="shimmer h-4 w-24 rounded mb-2 opacity-60" />
              <div className="shimmer h-9 w-40 rounded mb-3 opacity-60" />
              <div className="shimmer h-4 w-48 rounded opacity-60" />
              <div className="shimmer h-3 w-28 rounded mt-2 opacity-60" />
            </div>
            <div className="shimmer h-12 w-48 rounded-xl opacity-40 sm:self-start" />
          </div>
        </div>

        {/* Event strip */}
        <div className="shimmer h-11 w-full rounded-xl" />

        {/* Quick stats 2×2 */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-3.5 shadow-sm">
              <div className="shimmer h-9 w-9 rounded-full" />
              <div className="shimmer h-7 w-10 rounded" />
              <div className="shimmer h-3 w-20 rounded" />
              <div className="shimmer h-3 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Shimmer skeleton for the Staff Home page initial load
 */
export function StaffHomeShimmer() {
  return (
    <div className="min-h-full bg-[var(--color-background)] p-4 pb-30 md:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Hero card */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="shimmer h-12 w-12 rounded-2xl opacity-50 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="shimmer h-4 w-24 rounded mb-2 opacity-60" />
              <div className="shimmer h-7 w-36 rounded mb-2 opacity-60" />
              <div className="shimmer h-3 w-44 rounded opacity-60" />
            </div>
            <div className="shimmer h-8 w-20 rounded-lg opacity-40 shrink-0" />
          </div>
        </div>

        {/* Current class strip */}
        <div className="shimmer h-14 w-full rounded-xl" />

        {/* Quick stats 2×2 */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-3.5 shadow-sm">
              <div className="shimmer h-9 w-9 rounded-full" />
              <div className="shimmer h-7 w-10 rounded" />
              <div className="shimmer h-3 w-20 rounded" />
              <div className="shimmer h-3 w-16 rounded" />
            </div>
          ))}
        </div>

        {/* Messages row */}
        <div className="shimmer h-14 w-full rounded-xl" />

        {/* Quick nav 2×2 */}
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Shimmer skeleton for the Scholarships page initial load
 */
export function ScholarshipsShimmer() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pb-24 md:pb-6">
      {/* Hero strip */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl px-5 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="shimmer w-11 h-11 rounded-xl opacity-40 shrink-0" />
          <div className="flex-1">
            <div className="shimmer h-6 w-36 rounded mb-2 opacity-60" />
            <div className="shimmer h-3 w-52 rounded opacity-50" />
          </div>
          <div className="shimmer h-7 w-20 rounded-full opacity-40 shrink-0" />
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 space-y-3">
        <div className="shimmer h-10 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="shimmer h-10 w-full rounded-xl" />
          <div className="shimmer h-10 w-full rounded-xl" />
          <div className="shimmer h-10 w-full rounded-xl" />
        </div>
      </div>

      {/* Results count */}
      <div className="shimmer h-4 w-32 rounded px-1" />

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-gray-200 overflow-hidden flex flex-col">
            <div className="p-5 pb-3 flex-1 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="shimmer w-10 h-10 rounded-xl shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="shimmer h-3 w-16 rounded mb-2" />
                  <div className="shimmer h-4 w-full rounded mb-1" />
                  <div className="shimmer h-4 w-3/4 rounded" />
                </div>
                <div className="shimmer h-5 w-14 rounded-full shrink-0" />
              </div>
              <div className="shimmer h-3 w-40 rounded" />
              <div className="shimmer h-3 w-full rounded" />
              <div className="shimmer h-3 w-5/6 rounded" />
              <div className="flex gap-1.5">
                <div className="shimmer h-5 w-14 rounded-md" />
                <div className="shimmer h-5 w-14 rounded-md" />
                <div className="shimmer h-5 w-14 rounded-md" />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="shimmer h-3 w-28 rounded" />
              <div className="shimmer h-4 w-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Shimmer skeleton for homework listing pages (student browse / staff listing)
 */
export function HomeworkListingShimmer() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-2 md:pt-3">
      {/* Header — desktop */}
      <div className="hidden md:flex items-center gap-3 shrink-0">
        <div className="shimmer h-8 w-8 rounded-lg shrink-0" />
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="shimmer h-6 w-40 rounded mb-2" />
              <div className="shimmer h-3.5 w-28 rounded" />
            </div>
          </div>
          <div className="shimmer h-9 w-64 rounded-lg" />
        </div>
      </div>

      {/* Header — mobile */}
      <div className="md:hidden shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="shimmer h-8 w-8 rounded-lg shrink-0" />
            <div className="shimmer h-5 w-40 rounded flex-1" />
            <div className="shimmer h-6 w-8 rounded-full shrink-0" />
          </div>
          <div className="shimmer h-10 w-full rounded-lg" />
        </div>
      </div>

      {/* Desktop grid (matches grid-cols-1 lg:grid-cols-2 xl:grid-cols-3) */}
      <div className="hidden md:block flex-1 overflow-hidden">
        <div className="grid grid-cols-1 gap-4 pb-4 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-blue-200 overflow-hidden flex flex-col">
              {/* Card body */}
              <div className="p-5 pb-4 flex-1">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="shimmer h-3 w-20 rounded mb-2" />
                    <div className="shimmer h-4 w-full rounded mb-1" />
                    <div className="shimmer h-4 w-3/4 rounded" />
                  </div>
                  <div className="shimmer h-5 w-16 rounded-full shrink-0" />
                </div>
                <div className="space-y-2 mt-3">
                  <div className="shimmer h-3.5 w-32 rounded" />
                  <div className="shimmer h-3.5 w-24 rounded" />
                </div>
              </div>
              {/* Card footer */}
              <div className="px-5 py-3 bg-blue-50 border-t border-gray-100 flex items-center justify-between">
                <div className="shimmer h-3.5 w-28 rounded" />
                <div className="shimmer h-4 w-4 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile list (matches MobileListing stacked cards) */}
      <div className="md:hidden flex-1 space-y-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-blue-200 overflow-hidden">
            {/* Card body */}
            <div className="p-4 pb-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="shimmer h-4 w-full rounded mb-1.5" />
                  <div className="shimmer h-3 w-20 rounded" />
                </div>
                <div className="shimmer h-5 w-16 rounded-full shrink-0" />
              </div>
              <div className="shimmer h-3.5 w-28 rounded mt-2" />
            </div>
            {/* Card footer */}
            <div className="px-4 py-2 bg-blue-50 border-t border-gray-100 flex items-center justify-between">
              <div className="shimmer h-3.5 w-28 rounded" />
              <div className="shimmer h-4 w-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Shimmer for StudentTopicDetail — triggered by class-plans/{id}?section_id=… fetch.
 * Matches: sticky header, gradient hero with meta pills, resource cards.
 */
export function TopicDetailShimmer() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50 overflow-hidden">
      {/* Sticky header */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="shimmer h-8 w-8 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="shimmer h-4 w-48 rounded mb-1.5" />
          <div className="shimmer h-3 w-32 rounded" />
        </div>
        <div className="shimmer h-6 w-20 rounded-full shrink-0" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto p-4 pb-24 space-y-4">

          {/* Hero banner */}
          <div className="bg-gradient-to-br from-indigo-400 to-violet-500 rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="shimmer w-10 h-10 rounded-xl shrink-0 opacity-50" />
              <div className="flex-1 min-w-0">
                <div className="shimmer h-3 w-24 rounded mb-2 opacity-50" />
                <div className="shimmer h-5 w-3/4 rounded opacity-60" />
                <div className="shimmer h-4 w-1/2 rounded mt-1.5 opacity-50" />
              </div>
            </div>
            {/* Meta pills */}
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white/15 rounded-xl p-2.5">
                  <div className="shimmer h-3 w-16 rounded mb-1.5 opacity-50" />
                  <div className="shimmer h-4 w-20 rounded opacity-60" />
                </div>
              ))}
            </div>
            {/* Resource count pills */}
            <div className="flex gap-2 mt-4">
              <div className="shimmer h-6 w-24 rounded-full opacity-40" />
              <div className="shimmer h-6 w-20 rounded-full opacity-40" />
            </div>
          </div>

          {/* Teacher notes card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="shimmer w-7 h-7 rounded-lg shrink-0" />
              <div className="shimmer h-3 w-28 rounded" />
            </div>
            <div className="space-y-2">
              <div className="shimmer h-3.5 w-full rounded" />
              <div className="shimmer h-3.5 w-5/6 rounded" />
              <div className="shimmer h-3.5 w-4/6 rounded" />
            </div>
          </div>

          {/* Resource card (assignments / materials) */}
          {Array.from({ length: 2 }).map((_, ci) => (
            <div key={ci} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="shimmer w-7 h-7 rounded-lg shrink-0" />
                <div className="shimmer h-3 w-24 rounded" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, ri) => (
                  <div key={ri} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="shimmer w-8 h-8 rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="shimmer h-4 w-3/4 rounded mb-1" />
                      <div className="shimmer h-3 w-24 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}

/**
 * Shimmer for lesson plan section / subject picker pages.
 * Matches the border-l-4 row list used in StaffLessonPlansHome,
 * StaffLessonPlansSubjectPick, and StudentLessonPlansHome.
 */
export function LessonPlanPickerShimmer({ count = 5 }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pb-nav md:p-6">
      <div className="shimmer h-7 w-36 rounded mb-2" />
      <div className="shimmer h-4 w-48 rounded mb-5" />
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="w-full flex items-center gap-4 bg-white rounded-xl border border-gray-200 border-l-4 border-l-gray-200 px-4 py-3.5">
            <div className="shimmer w-9 h-9 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="shimmer h-4 w-32 rounded mb-1.5" />
              <div className="shimmer h-3 w-20 rounded" />
            </div>
            <div className="shimmer h-4 w-4 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Shimmer for the StaffLessonPlanDetail full-page load.
 * Matches: back button, title + date + meta, badge + edit,
 * then Card sections for description / objectives / activities.
 */
export function LessonPlanDetailShimmer() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pb-nav md:p-6">
      {/* Back button */}
      <div className="shimmer h-8 w-20 rounded mb-4" />

      {/* Title row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="flex-1">
          <div className="shimmer h-7 w-2/3 rounded mb-2" />
          <div className="shimmer h-4 w-32 rounded mb-2" />
          <div className="shimmer h-3.5 w-48 rounded" />
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="shimmer h-6 w-20 rounded-full" />
          <div className="shimmer h-8 w-16 rounded-lg" />
        </div>
      </div>

      {/* Description card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 mb-4">
        <div className="shimmer h-4 w-28 rounded mb-3" />
        <div className="space-y-2">
          <div className="shimmer h-3.5 w-full rounded" />
          <div className="shimmer h-3.5 w-5/6 rounded" />
          <div className="shimmer h-3.5 w-4/6 rounded" />
        </div>
      </div>

      {/* Objectives card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 mb-4">
        <div className="shimmer h-4 w-40 rounded mb-3" />
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="shimmer h-5 w-5 rounded-full shrink-0" />
              <div className="shimmer h-3.5 flex-1 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Activities card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="shimmer h-4 w-24 rounded mb-3" />
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="shimmer h-5 w-5 rounded-full shrink-0" />
              <div className="shimmer h-3.5 flex-1 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Shimmer for the chapter/topic content area inside lesson plan browse pages
 * (StaffLessonPlansBrowse and StudentLessonPlansBrowse).
 * Replaces only the content body — the sticky header stays rendered above.
 */
export function LessonPlanBrowseContentShimmer() {
  return (
    <div className="mt-6 space-y-3 pb-24">
      {Array.from({ length: 4 }).map((_, ci) => (
        <div key={ci} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {/* Chapter header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
            <div className="shimmer h-5 w-5 rounded shrink-0" />
            <div className="shimmer h-4 w-40 rounded flex-1" />
            <div className="shimmer h-5 w-12 rounded-full shrink-0" />
            <div className="shimmer h-4 w-4 rounded shrink-0" />
          </div>
          {/* Topic rows */}
          <div className="divide-y divide-gray-100">
            {Array.from({ length: ci === 0 ? 3 : 2 }).map((_, ti) => (
              <div key={ti} className="flex items-center gap-3 px-4 py-3">
                <div className="shimmer h-8 w-8 rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="shimmer h-4 w-3/4 rounded mb-1.5" />
                  <div className="shimmer h-3 w-24 rounded" />
                </div>
                <div className="shimmer h-5 w-16 rounded-full shrink-0" />
                <div className="shimmer h-7 w-7 rounded shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmer for the staff homework listing (getTeacherHomeworkAll)
 * Replaces only the card grid area — the header/filter bar stays rendered above it.
 */
export function StaffHomeworkListingShimmer() {
  return (
    <>
      {/* Desktop grid (matches grid-cols-1 lg:grid-cols-2 xl:grid-cols-3) */}
      <div className="hidden md:block flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
              {/* Title + badges row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="shimmer h-5 w-3/4 rounded mb-2" />
                  <div className="shimmer h-4 w-1/2 rounded" />
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <div className="shimmer h-5 w-14 rounded-full" />
                  <div className="shimmer h-5 w-14 rounded-full" />
                </div>
              </div>
              {/* Meta rows */}
              <div className="space-y-2">
                <div className="shimmer h-4 w-32 rounded" />
                <div className="shimmer h-4 w-40 rounded" />
                <div className="shimmer h-4 w-36 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile stack */}
      <div className="md:hidden flex-1 overflow-y-auto space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0 pr-3">
                <div className="shimmer h-5 w-3/4 rounded mb-2" />
                <div className="shimmer h-4 w-1/2 rounded" />
              </div>
              <div className="flex gap-1.5 shrink-0">
                <div className="shimmer h-5 w-14 rounded-full" />
                <div className="shimmer h-5 w-14 rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="shimmer h-4 w-32 rounded" />
              <div className="shimmer h-4 w-40 rounded" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * Shimmer skeleton for homework detail pages (student & staff)
 */
export function HomeworkDetailShimmer() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50 overflow-hidden">
      {/* Sticky header */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="shimmer h-8 w-8 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="shimmer h-4 w-40 rounded mb-1.5" />
          <div className="shimmer h-3 w-24 rounded" />
        </div>
        <div className="shimmer h-6 w-20 rounded-full shrink-0" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto p-4 space-y-4 pb-8">
          {/* Hero banner */}
          <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl p-5">
            <div className="shimmer h-3 w-20 rounded mb-2 opacity-50" />
            <div className="shimmer h-7 w-2/3 rounded mb-1 opacity-60" />
            <div className="shimmer h-5 w-1/2 rounded mb-4 opacity-50" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white/15 rounded-lg p-2.5">
                  <div className="shimmer h-3 w-16 rounded mb-1.5 opacity-50" />
                  <div className="shimmer h-4 w-20 rounded opacity-60" />
                </div>
              ))}
            </div>
          </div>

          {/* Description card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="shimmer h-3 w-24 rounded mb-3" />
            <div className="space-y-2">
              <div className="shimmer h-4 w-full rounded" />
              <div className="shimmer h-4 w-5/6 rounded" />
              <div className="shimmer h-4 w-4/6 rounded" />
            </div>
          </div>

          {/* Instructions card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="shimmer h-3 w-24 rounded mb-3" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="shimmer h-6 w-6 rounded-full shrink-0" />
                  <div className="shimmer h-4 flex-1 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pickup shimmers ────────────────────────────────────────────────────────────

export function PickupPersonsShimmer({ count = 3 }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="shimmer w-12 h-12 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <div className="shimmer h-4 w-28 rounded-lg" />
              <div className="shimmer h-4 w-14 rounded-full" />
            </div>
            <div className="shimmer h-3 w-20 rounded" />
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="shimmer w-8 h-8 rounded-lg" />
            <div className="shimmer w-8 h-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PickupRequestsShimmer({ count = 3 }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3">
          <div className="shimmer w-12 h-12 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <div className="shimmer h-4 w-28 rounded-lg" />
              <div className="shimmer h-4 w-16 rounded-full" />
            </div>
            <div className="shimmer h-3 w-20 rounded" />
            <div className="shimmer h-3 w-32 rounded" />
          </div>
          <div className="shimmer w-4 h-4 rounded flex-shrink-0 mt-0.5" />
        </div>
      ))}
    </div>
  );
}

export function StaffPendingPickupShimmer({ count = 3 }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="shimmer w-11 h-11 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="shimmer h-4 w-32 rounded-lg" />
              <div className="shimmer h-3 w-20 rounded" />
              <div className="shimmer h-3 w-36 rounded" />
            </div>
            <div className="shimmer h-3 w-20 rounded flex-shrink-0" />
          </div>
          <div className="flex gap-2">
            <div className="shimmer flex-1 h-9 rounded-xl" />
            <div className="shimmer flex-1 h-9 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StudentPickupPanelShimmer() {
  return (
    <div className="space-y-4 py-2">
      <div className="shimmer h-3 w-32 rounded mb-1" />
      {[0, 1].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3">
          <div className="shimmer w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="shimmer h-4 w-28 rounded-lg" />
            <div className="shimmer h-3 w-16 rounded" />
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="shimmer w-12 h-7 rounded-lg" />
            <div className="shimmer w-16 h-7 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StaffPickupLogShimmer({ count = 3 }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-start gap-3">
            <div className="shimmer w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <div className="shimmer h-4 w-28 rounded-lg" />
                <div className="shimmer h-4 w-20 rounded-full" />
              </div>
              <div className="shimmer h-3 w-16 rounded" />
              <div className="shimmer h-3 w-36 rounded" />
              <div className="shimmer h-3 w-24 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ExamDetailShimmer() {
  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="shimmer w-10 h-10 rounded-lg" />
        <div className="shimmer h-7 w-40 rounded-lg" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pb-4">
        {/* Exam Overview Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="shimmer h-6 w-48 rounded-lg" />
              <div className="shimmer h-4 w-32 rounded-lg" />
            </div>
            <div className="shimmer h-6 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="shimmer h-3.5 w-16 rounded" />
                <div className="shimmer h-5 w-28 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Subjects Schedule Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="shimmer h-5 w-36 rounded-lg" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <div className="shimmer h-3 w-14 rounded" />
                    <div className="shimmer h-4 w-28 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <div className="shimmer h-3 w-16 rounded" />
                    <div className="shimmer h-4 w-24 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <div className="shimmer h-3 w-12 rounded" />
                    <div className="shimmer h-4 w-28 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grading Configuration Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="shimmer h-5 w-44 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="shimmer h-3.5 w-20 rounded" />
                <div className="shimmer h-5 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BroadcastListShimmer({ count = 4 }) {
  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="shimmer h-5 flex-1 rounded-lg" />
              <div className="shimmer h-5 w-16 rounded-full flex-shrink-0" />
            </div>
            <div className="space-y-1.5">
              <div className="shimmer h-3.5 w-full rounded" />
              <div className="shimmer h-3.5 w-4/5 rounded" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="shimmer w-4 h-4 rounded flex-shrink-0" />
                <div className="shimmer h-3.5 w-32 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="shimmer w-4 h-4 rounded flex-shrink-0" />
                <div className="shimmer h-3.5 w-40 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 flex">
          <div className="flex-1 px-6 py-3"><div className="shimmer h-3 w-12 rounded" /></div>
          <div className="w-40 px-6 py-3"><div className="shimmer h-3 w-12 rounded" /></div>
          <div className="w-28 px-6 py-3"><div className="shimmer h-3 w-10 rounded" /></div>
          <div className="w-36 px-6 py-3"><div className="shimmer h-3 w-14 rounded" /></div>
          <div className="w-36 px-6 py-3"><div className="shimmer h-3 w-10 rounded" /></div>
        </div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="flex-1 px-6 py-4 space-y-2">
                <div className="shimmer h-4 w-40 rounded-lg" />
                <div className="shimmer h-3 w-52 rounded" />
              </div>
              <div className="w-40 px-6 py-4">
                <div className="shimmer h-4 w-28 rounded" />
              </div>
              <div className="w-28 px-6 py-4">
                <div className="shimmer h-5 w-16 rounded-full" />
              </div>
              <div className="w-36 px-6 py-4 space-y-1.5">
                <div className="shimmer h-4 w-20 rounded" />
                <div className="shimmer h-3 w-14 rounded" />
              </div>
              <div className="w-36 px-6 py-4 space-y-1.5">
                <div className="shimmer h-4 w-20 rounded" />
                <div className="shimmer h-3 w-14 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function StudentAnnouncementsShimmer({ count = 4 }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 gap-4">
      {/* Desktop Header */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="shimmer h-7 w-44 rounded-lg" />
            <div className="shimmer h-4 w-24 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>
      {/* Mobile Header */}
      <div className="md:hidden bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="shimmer h-6 w-36 rounded-lg" />
          <div className="shimmer h-5 w-8 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="shimmer h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>
      {/* Desktop card list */}
      <div className="hidden md:block space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="shimmer h-5 flex-1 rounded-lg" />
              <div className="shimmer h-5 w-16 rounded-full flex-shrink-0" />
            </div>
            <div className="shimmer h-3.5 w-full rounded" />
            <div className="shimmer h-3.5 w-3/4 rounded" />
            <div className="flex items-center gap-3">
              <div className="shimmer h-3.5 w-24 rounded" />
              <div className="shimmer h-3.5 w-28 rounded" />
            </div>
          </div>
        ))}
      </div>
      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-violet-200 overflow-hidden">
            <div className="p-4 pb-3 space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="shimmer w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="shimmer h-3 w-20 rounded" />
                  <div className="shimmer h-4 w-48 rounded-lg" />
                </div>
              </div>
              <div className="shimmer h-3.5 w-full rounded" />
              <div className="shimmer h-3.5 w-4/5 rounded" />
            </div>
            <div className="px-4 py-2 bg-violet-50 border-t border-gray-100 flex items-center justify-between">
              <div className="shimmer h-3.5 w-24 rounded" />
              <div className="shimmer w-4 h-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnnouncementDetailShimmer() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50 overflow-hidden">
      {/* Sticky Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="shimmer w-8 h-8 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="shimmer h-5 w-48 rounded-lg" />
          <div className="shimmer h-3 w-24 rounded" />
        </div>
      </div>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto p-4 space-y-4 pb-8">
          {/* Hero banner */}
          <div className="bg-violet-100 rounded-xl p-5 space-y-3">
            <div className="flex items-start gap-4">
              <div className="shimmer w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="shimmer h-3 w-28 rounded" />
                <div className="shimmer h-6 w-56 rounded-lg" />
                <div className="shimmer h-3 w-32 rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="shimmer h-5 w-20 rounded-full" />
              <div className="shimmer h-5 w-24 rounded-full" />
            </div>
          </div>
          {/* Message card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div className="shimmer h-3 w-16 rounded" />
            <div className="space-y-2">
              <div className="shimmer h-4 w-full rounded" />
              <div className="shimmer h-4 w-full rounded" />
              <div className="shimmer h-4 w-4/5 rounded" />
              <div className="shimmer h-4 w-3/4 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudentReportingShimmer() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 pb-24 md:p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="shimmer h-7 w-36 rounded-lg" />
          <div className="shimmer h-4 w-48 rounded" />
        </div>
        <div className="shimmer h-9 w-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <div className="shimmer w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="shimmer h-3 w-16 rounded" />
                <div className="shimmer h-7 w-12 rounded-lg" />
                <div className="shimmer h-3 w-20 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="shimmer h-5 w-32 rounded-lg" />
                <div className="shimmer h-3 w-48 rounded" />
              </div>
              <div className="shimmer h-7 w-28 rounded-lg" />
            </div>
            <div className="shimmer h-44 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="border-b border-gray-200 flex gap-1 pb-0.5">
        <div className="shimmer h-9 w-20 rounded-t-lg" />
        <div className="shimmer h-9 w-24 rounded-t-lg" />
      </div>
    </div>
  );
}

export function StaffReportingShimmer() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 pb-24 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="shimmer w-8 h-8 rounded-lg flex-shrink-0" />
          <div className="space-y-2">
            <div className="shimmer h-7 w-40 rounded-lg" />
            <div className="shimmer h-4 w-52 rounded" />
          </div>
        </div>
        <div className="shimmer h-9 w-24 rounded-lg" />
      </div>
      <div className="shimmer h-9 w-24 rounded-lg" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <div className="shimmer w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="shimmer h-3 w-16 rounded" />
                <div className="shimmer h-7 w-12 rounded-lg" />
                <div className="shimmer h-3 w-20 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-b border-gray-200 flex gap-1 pb-0.5">
        <div className="shimmer h-9 w-20 rounded-t-lg" />
        <div className="shimmer h-9 w-24 rounded-t-lg" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="shimmer h-5 w-36 rounded-lg" />
              <div className="shimmer w-4 h-4 rounded flex-shrink-0" />
            </div>
            <div className="shimmer h-2 w-full rounded-full" />
            <div className="flex flex-wrap gap-2">
              <div className="shimmer h-5 w-20 rounded-full" />
              <div className="shimmer h-5 w-24 rounded-full" />
            </div>
            <div className="flex gap-3">
              <div className="shimmer h-3 w-16 rounded" />
              <div className="shimmer h-3 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SectionPickerShimmer() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <div className="space-y-2 text-center">
        <div className="shimmer h-5 w-40 rounded-lg mx-auto" />
        <div className="shimmer h-4 w-28 rounded mx-auto" />
      </div>
    </div>
  );
}

/**
 * Basic shimmer elements for custom compositions
 */
export function ShimmerLine({ width = "100%", height = "1rem", className = "" }) {
  return (
    <div 
      className={clsx("shimmer rounded", className)}
      style={{ width, height }}
    />
  );
}

export function ShimmerCircle({ size = "2.5rem", className = "" }) {
  return (
    <div 
      className={clsx("shimmer rounded-full", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function ShimmerBlock({ width = "100%", height = "4rem", className = "" }) {
  return (
    <div 
      className={clsx("shimmer rounded-lg", className)}
      style={{ width, height }}
    />
  );
}
