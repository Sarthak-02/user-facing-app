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
        "rounded-xl border border-border p-4 shadow-sm bg-white",
        className
      )}
      onClick={onClick}
    >
      {title && (
        <h3 className="mb-3 text-lg font-bold ">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
