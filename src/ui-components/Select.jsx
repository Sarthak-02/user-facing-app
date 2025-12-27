import clsx from "clsx";

export default function Select({
  label,
  error,
  options = [],
  className = "",
  ...props
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {label}
        </label>
      )}

      <select
        {...props}
        className={clsx(
          "w-full rounded-lg px-3 py-2 text-sm transition",
          "bg-surface border border-border ",
          "focus:outline-none focus:ring-2 focus:ring-primary-600",
          {
            "border-error-600 focus:ring-error-600": error,
          },
          className
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-xs text-error-600">{error}</p>
      )}
    </div>
  );
}
