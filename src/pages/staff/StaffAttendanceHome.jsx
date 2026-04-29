import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTeacherSectionRows } from "../../hooks/useTeacherSectionRows";
import { ChevronRight } from "lucide-react";
import Loader from "../../ui-components/Loader";

const CLASS_COLORS = [
  { badgeBg: "bg-teal-500", border: "border-l-teal-400" },
  { badgeBg: "bg-emerald-500", border: "border-l-emerald-400" },
  { badgeBg: "bg-blue-500", border: "border-l-blue-400" },
  { badgeBg: "bg-indigo-500", border: "border-l-indigo-400" },
  { badgeBg: "bg-violet-500", border: "border-l-violet-400" },
  { badgeBg: "bg-amber-500", border: "border-l-amber-400" },
  { badgeBg: "bg-rose-500", border: "border-l-rose-400" },
  { badgeBg: "bg-cyan-500", border: "border-l-cyan-400" },
];

function getClassColor(classNum, idx) {
  if (classNum) {
    const n = parseInt(classNum, 10);
    if (n >= 1 && n <= 3) return CLASS_COLORS[1];
    if (n >= 4 && n <= 6) return CLASS_COLORS[2];
    if (n >= 7 && n <= 9) return CLASS_COLORS[3];
    if (n >= 10) return CLASS_COLORS[4];
  }
  return CLASS_COLORS[idx % CLASS_COLORS.length];
}

function parseLabel(label) {
  const parts = label.split("·").map((p) => p.trim());
  return {
    className: parts[0] || label,
    sectionName: parts.slice(1).join("·").trim(),
  };
}

function getClassBadge(className, sectionName) {
  const num = className.match(/\d+/)?.[0];
  const sectionChar = sectionName
    ? (sectionName.match(/[A-Za-z]/)?.[0] || "").toUpperCase()
    : "";
  if (num) return `${num}${sectionChar}`;
  return className.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "?";
}

export default function StaffAttendanceHome() {
  const navigate = useNavigate();
  const rows = useTeacherSectionRows();

  useEffect(() => {
    if (rows.length === 1) {
      navigate(`/staff/attendance/section/${rows[0].sectionId}`, { replace: true });
    }
  }, [rows, navigate]);

  if (rows.length === 1) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
        <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
        <p className="mt-3 text-sm text-gray-600">
          No class or section assignments were found. If you just logged in, try refreshing after
          permissions load.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
      <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
      <p className="mt-1 text-sm text-gray-600">Choose a class and section to mark or view attendance.</p>
      <div className="mt-5 space-y-2">
        {rows.map((r, idx) => {
          const { className, sectionName } = parseLabel(r.label);
          const classNum = className.match(/\d+/)?.[0] || "";
          const badge = getClassBadge(className, sectionName);
          const color = getClassColor(classNum, idx);
          return (
            <button
              key={r.sectionId}
              type="button"
              onClick={() => navigate(`/staff/attendance/section/${r.sectionId}`)}
              className={`w-full flex items-center gap-4 bg-white rounded-xl border border-gray-200 border-l-4 ${color.border} px-4 py-3.5 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-150`}
            >
              <div className={`w-9 h-9 rounded-lg ${color.badgeBg} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold text-sm tracking-tight">{badge}</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold text-gray-900 truncate">{className}</p>
                {sectionName && (
                  <p className="text-xs text-gray-500 mt-0.5">{sectionName}</p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
