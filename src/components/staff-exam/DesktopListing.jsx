import { Card, Table } from "../../ui-components";

export default function DesktopListing({ examList, onEdit, onPublish, onView }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            Draft
          </span>
        );
      case "PUBLISHED":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            Published
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const getExamTypeLabel = (type) => {
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
  };

  if (examList.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-gray-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Exams Found</h3>
        <p className="text-gray-600 text-center max-w-md">
          You haven't created any exams yet. Click the "Create Exam" button to get started.
        </p>
      </Card>
    );
  }

  const columns = [
    {
      key: "examDetails",
      label: "Exam Details",
      render: (exam) => (
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {getExamTypeLabel(exam.examType)}
          </p>
          {exam.customExamType && (
            <p className="text-xs text-gray-500">{exam.customExamType}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {exam.subjects?.length || 0} subject(s)
          </p>
        </div>
      ),
    },
    {
      key: "target",
      label: "Target",
      render: (exam) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">{exam.class}</p>
          {exam.section && <p className="text-xs text-gray-500">{exam.section}</p>}
        </div>
      ),
    },
    {
      key: "subjects",
      label: "Subjects",
      render: (exam) => (
        <div className="text-sm text-gray-700">
          {exam.subjects?.slice(0, 2).map((sub, idx) => (
            <span key={idx} className="block text-xs">
              {sub.subjectName}
            </span>
          ))}
          {exam.subjects?.length > 2 && (
            <span className="text-xs text-gray-500">
              +{exam.subjects.length - 2} more
            </span>
          )}
        </div>
      ),
    },
    {
      key: "dateRange",
      label: "Date Range",
      render: (exam) => (
        <div className="text-sm text-gray-700">
          {exam.startDate && exam.endDate ? (
            <>
              <p className="text-xs">
                {new Date(exam.startDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}
              </p>
              <p className="text-xs text-gray-500">
                to{" "}
                {new Date(exam.endDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-500">Not scheduled</p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (exam) => getStatusBadge(exam.status),
    },
    {
      key: "actions",
      label: "Actions",
      render: (exam) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onView(exam)}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            View
          </button>
          {exam.status === "DRAFT" && (
            <>
              <button
                onClick={() => onEdit(exam)}
                className="text-gray-600 hover:text-gray-800 font-medium text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => onPublish(exam)}
                className="text-green-600 hover:text-green-800 font-medium text-sm"
              >
                Publish
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return <Table columns={columns} data={examList} />;
}
