import { Card, Table } from "../../ui-components";
import { useTranslation } from "react-i18next";

export default function DesktopListing({ examList, onEdit, onPublish, onView }) {
  const { t } = useTranslation();

  const getDateBadge = (startDate, endDate) => {
    const now = new Date();
    if (endDate && new Date(endDate) < now) {
      return <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{t("exams.dateBadge.closed")}</span>;
    }
    if (startDate && new Date(startDate) <= now) {
      return <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">{t("exams.dateBadge.active")}</span>;
    }
    return <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">{t("exams.dateBadge.upcoming")}</span>;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            {t("exams.status.draft")}
          </span>
        );
      case "PUBLISHED":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            {t("exams.status.published")}
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            {t("exams.status.completed")}
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
      UNIT_TEST: t("exams.types.unitTest"),
      MID_TERM: t("exams.types.midTerm"),
      FINAL: t("exams.types.final"),
      QUARTERLY: t("exams.types.quarterly"),
      HALF_YEARLY: t("exams.types.halfYearly"),
      ANNUAL: t("exams.types.annual"),
      OTHER: t("exams.types.other"),
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("exams.noExams")}</h3>
        <p className="text-gray-600 text-center max-w-md">
          {t("exams.noExamsDesc")}
        </p>
      </Card>
    );
  }

  const columns = [
    {
      key: "examDetails",
      label: t("exams.columns.examDetails"),
      render: (exam) => (
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {getExamTypeLabel(exam.examType)}
          </p>
          {exam.customExamType && (
            <p className="text-xs text-gray-500">{exam.customExamType}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {t("exams.subjectsCount", { count: exam.subjects?.length || 0 })}
          </p>
        </div>
      ),
    },
    {
      key: "target",
      label: t("exams.columns.target"),
      render: (exam) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">{exam.class}</p>
          {exam.section && <p className="text-xs text-gray-500">{exam.section}</p>}
        </div>
      ),
    },
    {
      key: "subjects",
      label: t("exams.columns.subjects"),
      render: (exam) => (
        <div className="text-sm text-gray-700">
          {exam.subjects?.slice(0, 2).map((sub, idx) => (
            <span key={idx} className="block text-xs">
              {sub.subjectName}
            </span>
          ))}
          {exam.subjects?.length > 2 && (
            <span className="text-xs text-gray-500">
              +{exam.subjects.length - 2} {t("exams.more")}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "dateRange",
      label: t("exams.columns.dateRange"),
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
            <p className="text-xs text-gray-500">{t("exams.notScheduled")}</p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: t("exams.columns.status"),
      render: (exam) => (
        <div className="flex items-center gap-1.5">
          {getStatusBadge(exam.status)}
          {getDateBadge(exam.startDate, exam.endDate)}
        </div>
      ),
    },
    {
      key: "actions",
      label: t("exams.columns.actions"),
      render: (exam) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onView(exam)}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            {t("exams.actions.view")}
          </button>
          {exam.status === "DRAFT" && (
            <>
              <button
                onClick={() => onEdit(exam)}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {t("exams.actions.edit")}
              </button>
              <button
                onClick={() => onPublish(exam)}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                {t("exams.actions.publish")}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return <Table columns={columns} data={examList} />;
}
