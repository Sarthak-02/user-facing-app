import clsx from "clsx";

export default function Card({
  title,
  children,
  className = "",
  onClick,
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-border p-4 shadow-sm",
        className
      )}
      onClick={onClick}
    >
      {title && (
        <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
