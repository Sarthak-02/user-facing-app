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
