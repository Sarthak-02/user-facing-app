
/**
 * Responsive Input Component
 * Props:
 * - label?: string
 * - icon?: ReactNode
 * - placeholder?: string
 * - value?: string
 * - onChange?: (e) => void
 * - variant?: "default" | "error" | "success" | "disabled"
 * - type?: "text" | "password"
 * - suffix?: ReactNode — rendered inside the field on the right (e.g. password toggle)
 * - autoComplete?: string
 */
export default function TextField({
    label,
    icon,
    suffix,
    placeholder,
    value,
    onChange,
    variant = "default",
    type = "text",
    autoComplete,
  }) {
    
  
    const variantStyles = {
      default: "border-gray-300 focus-within:ring-blue-500",
      error: "border-red-500 focus-within:ring-red-500",
      success: "border-green-500 focus-within:ring-green-500",
      disabled: "border-gray-200 bg-gray-100 cursor-not-allowed text-gray-500",
    };
  
    return (
      <div className="flex flex-col w-full gap-2">
        {label && (
          <label className="text-base font-medium text-gray-700">
            {label}
          </label>
        )}
  
        <div
          className={`relative flex items-center w-full min-h-[44px] px-3 py-2 rounded-md
          sm:px-4 sm:py-2.5
          border focus-within:ring-2 ${variantStyles[variant]}`}
        >
          {icon && (
            <span className="absolute left-3 text-gray-500 flex items-center">
              {icon}
            </span>
          )}
  
          <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={variant === "disabled"}
            autoComplete={autoComplete}
            className={`w-full bg-transparent text-base focus:outline-none
              ${icon ? "pl-10" : ""}
              ${suffix ? "pr-10" : ""}
              ${variant === "disabled" ? "cursor-not-allowed" : ""}`}
          />
          {suffix ? (
            <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center text-gray-500">
              {suffix}
            </span>
          ) : null}
        </div>
  
        {/* {variant === "error" && (
          <p className="text-sm text-red-500">There is an error</p>
        )}
        {variant === "success" && (
          <p className="text-sm text-green-600">Looks good!</p>
        )} */}
      </div>
    );
  }
  