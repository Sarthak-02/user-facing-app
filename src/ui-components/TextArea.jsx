export default function Textarea({
    label,
    error,
    className = "",
    ...props
  }) {
    return (
      <div className="space-y-1">
        {label && (
          <label className="text-base font-medium text-gray-700">
            {label}
          </label>
        )}
  
        <textarea
          {...props}
          className={`
            w-full rounded-lg border px-3 py-2.5 text-base min-h-[6rem]
            bg-white text-gray-900
            border-gray-300
            placeholder:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-primary-600
            ${error ? "border-red-500" : ""}
            ${className}
          `}
        />
  
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
  