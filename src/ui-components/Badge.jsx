export default function Badge({ variant = "info", children }) {
  const styles = {
    success: "bg-success-100 text-success-600",
    warning: "bg-warning-100 text-warning-600",
    error: "bg-error-100 text-error-600",
    info: "bg-info-100 text-info-600",
  };
  
    return (
      <span
        className={`rounded-full px-2 py-1 text-xs font-medium ${styles[variant]}`}
      >
        {children}
      </span>
    );
  }
  