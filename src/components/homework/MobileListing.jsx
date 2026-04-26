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

function getStatusConfig(dueDate) {
  if (!dueDate) return { badge: "info", label: "Upcoming", border: "border-l-blue-400", bg: "bg-blue-50", icon: "text-blue-500" };
  const now = new Date();
  const due = new Date(dueDate);
  if (due < now) return { badge: "neutral", label: "Closed", border: "border-l-gray-300", bg: "bg-gray-50", icon: "text-gray-400" };
  if (due - now < 3 * 24 * 60 * 60 * 1000) return { badge: "warning", label: "Due Soon", border: "border-l-amber-400", bg: "bg-amber-50", icon: "text-amber-500" };
  return { badge: "info", label: "Upcoming", border: "border-l-blue-400", bg: "bg-blue-50", icon: "text-blue-500" };
}

export default function MobileListing({ homeworkList, listFromPath }) {
  const navigate = useNavigate();

  const handleCardClick = (homeworkId) => {
    navigate(`/student/homework/${homeworkId}`, {
      state: listFromPath ? { from: listFromPath } : undefined,
    });
  };

  if (homeworkList.length === 0) {
    return (
      <div className="md:hidden bg-white rounded-xl border border-gray-200">
        <div className="py-14 text-center px-4">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700">No homework found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-3 overflow-y-auto pb-20 md:hidden">
      {homeworkList.map((homework) => {
        const due = dueValue(homework);
        const metaLine = classSectionLine(homework);
        const attachCount = homework.attachmentCount || homework.attachments?.length || 0;
        const cfg = getStatusConfig(due);

        return (
          <div
            key={homework.id}
            onClick={() => handleCardClick(homework.id)}
            className={`bg-white rounded-xl border border-gray-200 border-l-4 ${cfg.border} cursor-pointer active:scale-[0.99] transition-transform duration-100 overflow-hidden`}
          >
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

              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {metaLine && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>{metaLine}</span>
                  </div>
                )}
                {homework.teacher?.teacher_name && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{homework.teacher.teacher_name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className={`px-4 py-2 ${cfg.bg} border-t border-gray-100 flex items-center justify-between`}>
              <div className="flex items-center gap-1.5 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${cfg.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className={`font-medium ${cfg.icon === "text-gray-400" ? "text-gray-400" : "text-gray-500"}`}>
                  Due: {formatDate(due) || "—"}
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
  );
}
