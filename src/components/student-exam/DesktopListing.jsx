import { Badge, Card } from "../../ui-components";
import { useNavigate } from "react-router-dom";

function formatDate(date) {
  if (!date) return "";
  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return formattedDate;
}

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

function StatusBadge({ status }) {
  const variants = {
    DRAFT: "default",
    PUBLISHED: "info",
    COMPLETED: "success",
  };
  
  const labels = {
    DRAFT: "Draft",
    PUBLISHED: "Upcoming",
    COMPLETED: "Completed",
  };
  
  return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
}

export default function DesktopListing({ examList }) {
  const navigate = useNavigate();

  const handleCardClick = (examId) => {
    navigate(`/student/exams/${examId}`);
  };

  return (
    <div className="hidden md:block h-full overflow-y-auto">
      {examList.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium mb-2">No exams found</p>
            <p className="text-sm">There are no exams scheduled at the moment.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {examList.map((exam) => (
            <Card
              key={exam.id}
              className="cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => handleCardClick(exam.id)}
            >
              <div className="space-y-3">
                {/* Header with Exam Type and Status */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {getExamTypeLabel(exam.examType)}
                    </div>
                    {exam.customExamType && (
                      <h3 className="text-lg font-semibold text-gray-900 mt-1">
                        {exam.customExamType}
                      </h3>
                    )}
                  </div>
                  <StatusBadge status={exam.status} />
                </div>

                {/* Class/Section */}
                {(exam.class || exam.section) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span>
                      {exam.class}
                      {exam.section && ` - ${exam.section}`}
                    </span>
                  </div>
                )}

                {/* Subjects Count */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <span>{exam.subjects?.length || 0} Subject(s)</span>
                </div>

                {/* Footer with Date Range */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      {formatDate(exam.startDate)}
                      {exam.endDate && exam.startDate !== exam.endDate && 
                        ` - ${formatDate(exam.endDate)}`}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
