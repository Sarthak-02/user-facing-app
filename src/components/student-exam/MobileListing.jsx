import { Badge } from "../../ui-components";
import { useNavigate } from "react-router-dom";
import { examListDateRangeLabel } from "./examListDates";

function getExamTypeLabel(type) {
  const labels = {
    UNIT_TEST: "Unit Test",
    MID_TERM: "Mid Term",
    FINAL: "Final Exam",
    QUARTERLY: "Quarterly",
    HALF_YEARLY: "Half Yearly",
    ANNUAL: "Annual",
    OTHER: "Other",
  };
  return labels[type] || type;
}

const STATUS_CONFIG = {
  PUBLISHED: {
    badge: "info",
    label: "Upcoming",
    borderColor: "border-l-blue-400",
    bgAccent: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  COMPLETED: {
    badge: "success",
    label: "Completed",
    borderColor: "border-l-green-400",
    bgAccent: "bg-green-50",
    iconColor: "text-green-500",
  },
  DRAFT: {
    badge: "default",
    label: "Draft",
    borderColor: "border-l-gray-300",
    bgAccent: "bg-gray-50",
    iconColor: "text-gray-400",
  },
};

export default function MobileListing({ examList, className }) {
  const navigate = useNavigate();

  const handleCardClick = (examId) => {
    navigate(`/student/exams/${examId}`);
  };

  if (examList.length === 0) {
    return (
      <div className="md:hidden bg-white rounded-xl border border-gray-200">
        <div className="text-center py-16 px-4">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-700 mb-1">No exams found</p>
          <p className="text-sm text-gray-500">Try adjusting your filters or check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`md:hidden h-full overflow-y-auto space-y-3${className ? ` ${className}` : ""}`}>
      {examList.map((exam) => {
        const config = STATUS_CONFIG[exam.status] || STATUS_CONFIG.DRAFT;
        const dateLabel = examListDateRangeLabel(exam);
        const subjectCount = exam.subjects?.length || 0;

        return (
          <div
            key={exam.id}
            onClick={() => handleCardClick(exam.id)}
            className={`bg-white rounded-xl border border-gray-200 border-l-4 ${config.borderColor} cursor-pointer active:scale-[0.99] transition-transform duration-100 overflow-hidden`}
          >
            {/* Card Content */}
            <div className="p-4 pb-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {getExamTypeLabel(exam.examType)}
                  </span>
                  {exam.customExamType && (
                    <h3 className="text-sm font-bold text-gray-900 mt-0.5 truncate">
                      {exam.customExamType}
                    </h3>
                  )}
                </div>
                <Badge variant={config.badge}>{config.label}</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
                {(exam.class || exam.section) && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Class {exam.class}{exam.section && ` · ${exam.section}`}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>{subjectCount} {subjectCount === 1 ? "subject" : "subjects"}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`px-4 py-2 ${config.bgAccent} border-t border-gray-100 flex items-center justify-between`}>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${config.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">{dateLabel || "Date TBD"}</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
