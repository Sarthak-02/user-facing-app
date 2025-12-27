import clsx from "clsx";

export default function Input({
  label,
  error,
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

      <input
        {...props}
        className={clsx(
          "w-full rounded-lg px-3 py-2 text-sm transition",
          "bg-surface border border-border text-gray-900 dark:text-gray-100",
          "focus:outline-none focus:ring-2 focus:ring-primary-600",
          "placeholder:text-gray-400",
          {
            "border-error-600 focus:ring-error-600": error,
          },
          className
        )}
      />

      {error && (
        <p className="text-xs text-error-600">{error}</p>
      )}
    </div>
  );
}
