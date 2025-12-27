import clsx from "clsx";

export default function Table({
  columns = [],
  data = [],
  className = "",
  maxHeight = "70vh", // 👈 configurable
}) {
  return (
    <div
      className={clsx(
        "relative overflow-auto rounded-lg border border-border bg-surface",
        className
      )}
      style={{ maxHeight }}
    >
      <table className="min-w-full text-sm border-collapse">
        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-border"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-6 text-center text-sm text-gray-500"
              >
                No data available
              </td>
            </tr>
          )}

          {data.map((row, index) => (
            <tr
              key={index}
              className="border-b border-border hover:bg-black/5"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-3 py-2 text-gray-800"
                >
                  {col.render
                    ? col.render(row)
                    : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
