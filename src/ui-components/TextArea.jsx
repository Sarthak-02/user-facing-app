export default function Textarea({
    label,
    error,
    className = "",
    ...props
  }) {
    return (
      <div className="space-y-1">
        {label && (
          <label className="text-sm text-gray-600">
            {label}
          </label>
        )}
  
        <textarea
          {...props}
          className={`
            w-full rounded-lg border px-3 py-2 text-sm
            bg-[rgb(var(--color-surface))]
            border-[rgb(var(--color-border))]
            focus:ring-2 focus:ring-[rgb(var(--color-primary-600))]
            ${error ? "border-red-500" : ""}
            ${className}
          `}
        />
  
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
  