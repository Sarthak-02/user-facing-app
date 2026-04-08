import { Badge } from "../../ui-components";
import { useNavigate } from "react-router-dom";

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function dueValue(hw) {
  return hw.dueDate || hw.due_date;
}

function classSectionLine(hw) {
  const cn = hw.className || hw.class_name;
  const sn = hw.section || hw.section_name;
  if (cn && sn) return `${cn} · ${sn}`;
  if (cn) return cn;
  if (sn) return sn;
  return null;
}

function getStatusConfig(status, dueDate) {
  const now = new Date();
  const due = new Date(dueDate);
  if (status === "SUBMITTED") return { badge: "success", label: "Submitted", border: "border-l-green-400", bg: "bg-green-50", icon: "text-green-500" };
  if (dueDate && due < now) return { badge: "error", label: "Overdue", border: "border-l-red-400", bg: "bg-red-50", icon: "text-red-500" };
  return { badge: "info", label: "Assigned", border: "border-l-blue-400", bg: "bg-blue-50", icon: "text-blue-500" };
}

function isDueSoon(dueDate) {
  if (!dueDate) return false;
  const diff = new Date(dueDate) - new Date();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // within 3 days
}

export default function DesktopListing({ homeworkList, listFromPath }) {
  const navigate = useNavigate();

  const handleCardClick = (homeworkId) => {
    navigate(`/student/homework/${homeworkId}`, {
      state: listFromPath ? { from: listFromPath } : undefined,
    });
  };

  if (homeworkList.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="py-16 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-700 mb-1">No homework found</p>
          <p className="text-sm text-gray-400">There are no assignments for this subject right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-1 gap-4 pb-4 lg:grid-cols-2 xl:grid-cols-3">
        {homeworkList.map((homework) => {
          const due = dueValue(homework);
          const metaLine = classSectionLine(homework);
          const attachCount = homework.attachmentCount || homework.attachments?.length || 0;
          const cfg = getStatusConfig(homework.status, due);
          const dueSoon = isDueSoon(due);

          return (
            <div
              key={homework.id}
              onClick={() => handleCardClick(homework.id)}
              className={`bg-white rounded-xl border border-gray-200 border-l-4 ${cfg.border} cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden`}
            >
              {/* Body */}
              <div className="p-4 pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-bold text-gray-900 leading-snug">
                      {homework.title}
                    </h3>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-0.5">
                      {homework.subject}
                    </p>
                  </div>
                  <Badge variant={cfg.badge}>{cfg.label}</Badge>
                </div>

                <div className="space-y-1.5 mt-3">
                  {metaLine && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="truncate">{metaLine}</span>
                    </div>
                  )}
                  {homework.teacher?.teacher_name && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="truncate">{homework.teacher.teacher_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className={`px-4 py-2.5 ${cfg.bg} border-t border-gray-100 flex items-center justify-between`}>
                <div className="flex items-center gap-1.5 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${cfg.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className={`font-medium ${dueSoon ? "text-amber-600" : "text-gray-500"}`}>
                    Due: {formatDate(due) || "—"}
                    {dueSoon && " · Soon"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {attachCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span>{attachCount}</span>
                    </div>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
