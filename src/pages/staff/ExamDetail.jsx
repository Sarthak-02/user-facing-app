import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Badge, Button } from "../../ui-components";
import { getExamDetail, getExamStudents, getExamGradesAll } from "../../api/exam.api";
import { usePermissions } from "../../store/permissions.store";
import { useExamDetail } from "../../store/examDetail.store";
import Loader from "../../ui-components/Loader";

function formatDate(date, locale) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(locale || undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time) {
  if (!time) return "";
  return time;
}

function StatusBadge({ status }) {
  const { t } = useTranslation();
  if (status === "DRAFT") {
    return <Badge variant="warning">{t("exams.status.draft")}</Badge>;
  }
  if (status === "COMPLETED") {
    return <Badge variant="success">{t("exams.status.completed")}</Badge>;
  }
  if (status === "PUBLISHED") {
    return <Badge variant="info">{t("exams.status.published")}</Badge>;
  }
  return <Badge variant="default">{t("exams.status.unknown", { status: status || "" })}</Badge>;
}

function getExamTypeLabel(type, t) {
  const key = `exams.examTypes.${type}`;
  const translated = t(key);
  return translated === key ? type : translated;
}

function getGradingTypeLabel(type, t) {
  const key = `exams.gradingTypeLabels.${type}`;
  const translated = t(key);
  return translated === key ? type : translated;
}

export default function ExamDetail() {
  const { t, i18n } = useTranslation();
  const { examId } = useParams();
  const navigate = useNavigate();
  const { permissions } = usePermissions();
  const { setExamDetail, setExamStudents, setGradesData } = useExamDetail();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [enterMarksError, setEnterMarksError] = useState(null);

  useEffect(() => {
    const fetchExamDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getExamDetail(examId, permissions);
        setExam(data);
        setExamDetail(data);
      } catch (err) {
        console.error("Error fetching exam detail:", err);
        setError(err.message || t("staffExamDetail.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchExamDetail();
    }
  }, [examId, permissions, setExamDetail, t]);

  const allSubjectsGraded =
    exam?.subjects?.length > 0 && exam.subjects.every((s) => s.hasGradesMarked);

  const handleGoBack = () => {
    navigate("/staff/exams");
  };

  const handleEnterMarks = async () => {
    setEnterMarksError(null);
    try {
      setFetchingStudents(true);

      if (allSubjectsGraded) {
        const gradesResponse = await getExamGradesAll(examId);
        if (gradesResponse.success && gradesResponse.data) {
          setGradesData(gradesResponse.data);
          const subjectWithGrades = gradesResponse.data.subjects?.find(s => s.grades?.length > 0);
          if (subjectWithGrades) {
            const students = subjectWithGrades.grades.map(grade => ({
              student_id: grade.student_id,
              student_name: grade.student_name,
              student_roll_no: grade.student_roll_no,
              student_photo_url: grade.student_photo_url,
              student_admission_no: grade.student_admission_no,
            }));
            setExamStudents(students, students.length);
            navigate(`/staff/exams/${examId}/enter-marks`);
            return;
          }
        }
      }

      const response = await getExamStudents(examId);
      setExamStudents(response.data || [], response.count || 0);
      navigate(`/staff/exams/${examId}/enter-marks`);
    } catch (err) {
      console.error("Error fetching students for exam:", err);
      setEnterMarksError(t("staffExamDetail.fetchStudentsFailed"));
    } finally {
      setFetchingStudents(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-4 gap-6">
        <Card>
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">{t("exams.error")}</h3>
            </div>
            <p className="text-gray-600 mb-4">{error || t("staffExamDetail.examNotFound")}</p>
            <Button onClick={handleGoBack}>{t("common.back")}</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <button
          onClick={handleGoBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{t("staffExamDetail.pageTitle")}</h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pb-4">
        {/* Exam Overview Card */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {getExamTypeLabel(exam.examType, t)}
                </h2>
                {exam.customExamType && (
                  <p className="text-sm text-gray-600 mt-1">{exam.customExamType}</p>
                )}
              </div>
              <StatusBadge status={exam.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">{t("exams.columns.target")}</p>
                <p className="text-base font-semibold text-gray-900">
                  {exam.class}
                  {exam.section && ` - ${exam.section}`}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">{t("exams.columns.subjects")}</p>
                <p className="text-base font-semibold text-gray-900">
                  {t("exams.subjectsCount", { count: exam.subjects?.length || 0 })}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">{t("exams.columns.dateRange")}</p>
                <p className="text-base font-semibold text-gray-900">
                  {exam.startDate && exam.endDate
                    ? `${formatDate(exam.startDate, i18n.language)} - ${formatDate(exam.endDate, i18n.language)}`
                    : t("exams.notScheduled")}
                </p>
              </div>
            </div>
          </div>
        </Card>

      {/* Subjects Schedule Card */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("staffExamDetail.examSchedule")}</h3>
        <div className="space-y-3">
          {exam.subjects && exam.subjects.length > 0 ? (
            exam.subjects.map((subject, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{t("exams.subjectLabel")}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {subject.subjectName}
                      </p>
                      {subject.hasGradesMarked && (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Graded
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{t("exams.examDate")}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(subject.examDate, i18n.language)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{t("studentExams.time")}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatTime(subject.startTime)} - {formatTime(subject.endTime)}
                    </p>
                  </div>
                  {subject.totalMarks && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">{t("studentExamDetail.totalMarks")}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {subject.totalMarks}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-center py-4">{t("studentExamDetail.noSubjectsScheduled")}</p>
          )}
        </div>
      </Card>

      {/* Grading Configuration Card */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("exams.gradingConfiguration")}
        </h3>
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600 mb-1">{t("exams.gradingType")}</p>
              <p className="text-base font-semibold text-gray-900">
                {getGradingTypeLabel(exam.gradingType, t)}
              </p>
            </div>

            {exam.gradingType !== "PASS_FAIL" && (
              <>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">{t("exams.maximumMarks")}</p>
                  <p className="text-base font-semibold text-gray-900">
                    {exam.maxValue || t("common.na")}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">{t("exams.passingMarks")}</p>
                  <p className="text-base font-semibold text-gray-900">
                    {exam.passingValue || t("common.na")}
                  </p>
                </div>
              </>
            )}
          </div>

          {exam.includeGrades && exam.gradeRanges && exam.gradeRanges.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">{t("staffExamDetail.gradeRanges")}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {exam.gradeRanges.map((range, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 rounded-lg bg-white text-center"
                  >
                    <p className="text-lg font-bold text-gray-900 mb-1">
                      {range.grade}
                    </p>
                    <p className="text-xs text-gray-600">
                      {range.minMarks} - {range.maxMarks}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Actions Card */}
      {(exam.status === "PUBLISHED" || exam.status === "COMPLETED") && (
        <Card>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3">
            <Button onClick={handleEnterMarks} className="flex-1" disabled={fetchingStudents}>
              {fetchingStudents ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("staffExamDetail.loadingStudents")}
                </>
              ) : allSubjectsGraded ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  {t("staffExamDetail.viewResults")}
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  {t("staffExamDetail.enterMarks")}
                </>
              )}
            </Button>
            {/* <Button onClick={handleViewResults} variant="secondary" className="flex-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              View Results
            </Button> */}
            </div>
            {enterMarksError && (
              <p className="text-sm text-red-600">{enterMarksError}</p>
            )}
          </div>
        </Card>
      )}
      </div>
    </div>
  );
}
