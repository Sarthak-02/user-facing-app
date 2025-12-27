import clsx from "clsx";

export default function Button({
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  children,
  ...props
}) {
  
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        // base styles
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",

        // variants
        {
          "bg-primary-600 text-white hover:opacity-90 focus:ring-primary-600":
            variant === "primary",

          "bg-surface border border-border text-gray-800 hover:bg-black/5 focus:ring-primary-600":
            variant === "secondary",

          "bg-error-600 text-white hover:opacity-90 focus:ring-error-600":
            variant === "danger",

          "bg-transparent text-primary-600 hover:bg-black/5 focus:ring-primary-600":
            variant === "ghost",
        },

        className
      )}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
