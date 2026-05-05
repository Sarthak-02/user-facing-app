import { Badge, Card } from "../../ui-components";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { examListDateRangeLabel } from "./examListDates";

function getExamTypeLabel(type, t) {
  if (!type) return "";
  const key = `studentExams.examTypes.${type}`;
  return t(key, { defaultValue: type });
}

const STATUS_CONFIG = {
  PUBLISHED: {
    badge: "info",
    labelKey: "studentExams.upcoming",
    borderColor: "border-l-blue-400",
    bgAccent: "bg-blue-50",
    iconColor: "text-blue-500",
    dotColor: "bg-blue-400",
    typeColor: "text-blue-600 bg-blue-50",
  },
  COMPLETED: {
    badge: "success",
    labelKey: "studentExams.completed",
    borderColor: "border-l-emerald-400",
    bgAccent: "bg-emerald-50",
    iconColor: "text-emerald-500",
    dotColor: "bg-emerald-400",
    typeColor: "text-emerald-600 bg-emerald-50",
  },
  DRAFT: {
    badge: "default",
    labelKey: "studentExams.draft",
    borderColor: "border-l-gray-300",
    bgAccent: "bg-gray-50",
    iconColor: "text-gray-400",
    dotColor: "bg-gray-300",
    typeColor: "text-gray-500 bg-gray-50",
  },
};

function ExamCard({ exam, onClick }) {
  const { t, i18n } = useTranslation();
  const config = STATUS_CONFIG[exam.status] || STATUS_CONFIG.DRAFT;
  const dateLabel = examListDateRangeLabel(exam, i18n.language);
  const subjectCount = exam.subjects?.length || 0;
  const examName = exam.customExamType || getExamTypeLabel(exam.examType, t);

  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-2xl border border-gray-100 border-l-4 ${config.borderColor} cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col`}
    >
      {/* Card Header */}
      <div className="p-5 pb-4 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${config.typeColor}`}>
            {getExamTypeLabel(exam.examType, t)}
          </span>
          <Badge variant={config.badge}>{t(config.labelKey)}</Badge>
        </div>

        <h3 className="text-base font-bold text-gray-900 leading-snug mb-4 group-hover:text-primary-700 transition-colors">
          {examName}
        </h3>

        <div className="space-y-2">
          {(exam.class || exam.section) && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-300 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span className="font-medium text-gray-700">
                {t("studentExams.classPrefix")} {exam.class}
                {exam.section && ` · ${exam.section}`}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-300 flex-shrink-0"
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
            <span>
              {t("studentExams.subjectCount", { count: subjectCount })}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className={`px-5 py-3 ${config.bgAccent} border-t border-gray-100 flex items-center justify-between`}>
        <div className="flex items-center gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-3.5 w-3.5 ${config.iconColor}`}
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
          <span className="text-xs font-semibold text-gray-600">
            {dateLabel || t("studentExams.dateTbd")}
          </span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

export default function DesktopListing({ examList }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCardClick = (examId) => {
    navigate(`/student/exams/${examId}`);
  };

  if (examList.length === 0) {
    return (
      <Card>
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-700 mb-1">{t("studentExams.noExamsFound")}</p>
          <p className="text-sm text-gray-400">{t("studentExams.listEmptyHint")}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="hidden md:block h-full overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {examList.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            onClick={() => handleCardClick(exam.id)}
          />
        ))}
      </div>
    </div>
  );
}
