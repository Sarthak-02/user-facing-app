import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Badge } from "../../ui-components";
import { getStudentExamDetail } from "../../api/exam.api";
import { useAuth } from "../../store/auth.store";
import Loader from "../../ui-components/Loader";

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time) {
  if (!time) return "";
  return time;
}

function getExamDisplayStatus(exam, statistics, root) {
  const raw =
    exam?.status ??
    exam?.exam_status ??
    exam?.examStatus ??
    root?.status ??
    root?.exam_status;
  let normalized =
    raw != null && String(raw).trim() !== ""
      ? String(raw).trim().toUpperCase().replace(/\s+/g, "_")
      : "";

  if (normalized === "COMPLETE") normalized = "COMPLETED";

  const canInferCompleted =
    normalized === "PUBLISHED" || normalized === "";
  if (canInferCompleted && statistics) {
    const total = Number(statistics.total_subjects);
    const graded = Number(statistics.graded_subjects);
    if (total > 0 && graded >= total) return "COMPLETED";
    const pct = Number(statistics.completion_percentage);
    if (total > 0 && !Number.isNaN(pct) && pct >= 100) return "COMPLETED";
  }

  return normalized || "PUBLISHED";
}

function StatusBadge({ status, t }) {
  if (status === "COMPLETED") return <Badge variant="success">{t("studentExams.completed")}</Badge>;
  if (status === "PUBLISHED") return <Badge variant="info">{t("studentExams.upcoming")}</Badge>;
  if (status === "DRAFT") return <Badge variant="default">{t("studentExams.draft")}</Badge>;
  if (!status) return <Badge variant="default">—</Badge>;
  return <Badge variant="default">{t("studentExams.statusUnknown", { status: status || "" })}</Badge>;
}

function getExamTypeLabel(type, t) {
  const keyMap = {
    UNIT_TEST: "exams.examTypes.UNIT_TEST",
    MID_TERM: "exams.examTypes.MID_TERM",
    FINAL: "exams.examTypes.FINAL",
    QUARTERLY: "exams.examTypes.QUARTERLY",
    HALF_YEARLY: "exams.examTypes.HALF_YEARLY",
    ANNUAL: "exams.examTypes.ANNUAL",
    OTHER: "exams.examTypes.OTHER",
  };
  return keyMap[type] ? t(keyMap[type]) : (type || "");
}

function getGradingTypeLabel(type, t) {
  const keyMap = {
    PERCENTAGE: "studentExamDetail.gradingPercentage",
    GPA: "studentExamDetail.gradingGpa",
    LETTER_GRADE: "studentExamDetail.gradingLetterGrade",
    PASS_FAIL: "studentExamDetail.gradingPassFail",
  };
  return keyMap[type] ? t(keyMap[type]) : (type || "");
}

function ScoreRing({ obtained, max, size = 72 }) {
  const pct = max > 0 ? Math.min((obtained / max) * 100, 100) : 0;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 60 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
}

function MarksCard({ subject, gradingType, maxValue, passingValue, t }) {
  const hasMarks =
    subject.is_graded &&
    subject.grades_obtained !== null &&
    subject.grades_obtained !== undefined;

  let isPassing = null;
  if (hasMarks && passingValue) {
    if (gradingType === "PERCENTAGE" || gradingType === "GPA") {
      isPassing = Number(subject.grades_obtained) >= Number(passingValue);
    } else if (gradingType === "PASS_FAIL") {
      isPassing = subject.grades_obtained === "PASS";
    }
  }

  const scoreNum = hasMarks ? Number(subject.grades_obtained) : 0;
  const maxNum = maxValue ? Number(maxValue) : 0;
  const pct = maxNum > 0 ? ((scoreNum / maxNum) * 100).toFixed(0) : null;

  return (
    <div className={`rounded-xl border overflow-hidden ${hasMarks ? "border-gray-200" : "border-dashed border-gray-200"}`}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Score ring (only if graded with numeric score) */}
          {hasMarks && (gradingType === "PERCENTAGE" || gradingType === "GPA") && maxNum > 0 && (
            <div className="relative flex-shrink-0">
              <ScoreRing obtained={scoreNum} max={maxNum} size={64} />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800">
                {pct}%
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-gray-900 leading-snug">
                {subject.subject_name}
              </h4>
              {hasMarks && (
                <div className="text-right flex-shrink-0">
                  {gradingType === "PASS_FAIL" ? (
                    <Badge variant={subject.grades_obtained === "PASS" ? "success" : "error"}>
                      {subject.grades_obtained}
                    </Badge>
                  ) : gradingType === "LETTER_GRADE" ? (
                    <span className="text-2xl font-black text-gray-900">{subject.grades_obtained}</span>
                  ) : (
                    <div>
                      <span className="text-xl font-bold text-gray-900">{subject.grades_obtained}</span>
                      {maxNum > 0 && (
                        <span className="text-sm text-gray-400 ml-0.5">/{maxNum}</span>
                      )}
                    </div>
                  )}
                  {isPassing !== null && (gradingType === "PERCENTAGE" || gradingType === "GPA") && (
                    <div className="mt-1">
                      <Badge variant={isPassing ? "success" : "error"}>
                        {isPassing ? t("studentExams.pass") : t("studentExams.fail")}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {subject.exam_date && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(subject.exam_date)}</span>
                </div>
              )}
              {(subject.exam_start_time || subject.exam_end_time) && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatTime(subject.exam_start_time)} – {formatTime(subject.exam_end_time)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {!hasMarks && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t("studentExamDetail.marksNotAvailable")}
          </div>
        )}

        {hasMarks && subject.remarks && (
          <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-xs font-semibold text-amber-800 mb-0.5">{t("studentExamDetail.teachersRemarks")}</p>
            <p className="text-xs text-amber-700">{subject.remarks}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentExamDetail() {
  const { t } = useTranslation();
  const { examId } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExamDetail = async () => {
      if (!auth.userId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await getStudentExamDetail(examId, auth.userId);
        if (response.success && response.data) {
          setExamData(response.data);
        } else {
          setError(t("studentExamDetail.loadFailedDetails"));
        }
      } catch (err) {
        console.error("Error fetching exam detail:", err);
        setError(err.message || t("studentExamDetail.fetchFailedDetails"));
      } finally {
        setLoading(false);
      }
    };

    if (examId) fetchExamDetail();
  }, [examId, auth.userId, t]);

  const handleGoBack = () => navigate("/student/exams");

  const calculateStats = () => {
    if (!examData?.subjects || !examData?.exam) return null;
    const { subjects, exam, statistics } = examData;
    if (!statistics) return null;

    let totalMarks = 0;
    let obtainedMarks = 0;

    subjects.forEach((subject) => {
      if (subject.is_graded && subject.grades_obtained) {
        if (exam.grading_type === "PERCENTAGE" || exam.grading_type === "GPA") {
          obtainedMarks += Number(subject.grades_obtained);
          totalMarks += Number(exam.grading_extras?.max_value || 100);
        }
      }
    });

    if (statistics.graded_subjects === 0) return null;

    const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(1) : 0;
    const passingValue = exam.grading_extras?.passing_value;
    const isPassing = passingValue
      ? obtainedMarks >= Number(passingValue) * statistics.graded_subjects
      : null;

    return {
      totalMarks,
      obtainedMarks,
      percentage,
      isPassing,
      gradedSubjects: statistics.graded_subjects,
      totalSubjects: statistics.total_subjects,
      completionPercentage: statistics.completion_percentage,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !examData || !examData.exam) {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-4 gap-6">
        <Card>
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{t("studentExamDetail.unableToLoad")}</h3>
            <p className="text-sm text-gray-500 mb-5">{error || t("studentExamDetail.examNotFound")}</p>
            <button
              onClick={handleGoBack}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {t("common.back")}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const { exam, subjects, statistics } = examData;
  const displayStatus = getExamDisplayStatus(exam, statistics, examData);
  const isCompleted = displayStatus === "COMPLETED";
  const progressPct = statistics
    ? Math.round((statistics.graded_subjects / Math.max(statistics.total_subjects, 1)) * 100)
    : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50 overflow-y-auto">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleGoBack}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">
            {exam.custom_exam_type || getExamTypeLabel(exam.exam_type, t)}
          </h1>
          <p className="text-xs text-gray-500">{t("studentExamDetail.detailsAndMarks")}</p>
        </div>
        <StatusBadge status={displayStatus} t={t} />
      </div>

      <div className="max-w-3xl mx-auto w-full p-4 space-y-4 pb-4">

          {/* Hero Banner */}
          <div className={`rounded-xl p-5 ${isCompleted ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-gradient-to-br from-blue-500 to-indigo-600"} text-white`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">
                  {getExamTypeLabel(exam.exam_type, t)}
                </p>
                <h2 className="text-xl font-bold leading-tight">
                  {exam.custom_exam_type || getExamTypeLabel(exam.exam_type, t)}
                </h2>
                <div className="flex flex-wrap gap-3 mt-3 text-sm opacity-90">
                  <span className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {t("studentExamDetail.subjectsCount", { count: subjects?.length || 0 })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {getGradingTypeLabel(exam.grading_type, t)}
                  </span>
                </div>
              </div>
              {stats && (
                <div className="text-right flex-shrink-0">
                  <div className="text-3xl font-black">{stats.percentage}%</div>
                  <div className="text-xs opacity-80 mt-0.5">{t("studentExamDetail.overallScore")}</div>
                </div>
              )}
            </div>

            {/* Grading info pills */}
            {(exam.grading_extras?.max_value || exam.grading_extras?.passing_value) && (
              <div className="flex gap-2 mt-4">
                {exam.grading_extras?.max_value && (
                  <span className="text-xs bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 font-medium">
                    {t("studentExamDetail.maxMarksChip", { value: exam.grading_extras.max_value })}
                  </span>
                )}
                {exam.grading_extras?.passing_value && (
                  <span className="text-xs bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 font-medium">
                    {t("studentExamDetail.passMarksChip", { value: exam.grading_extras.passing_value })}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Overall Performance */}
          {stats && statistics?.graded_subjects > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                {t("studentExamDetail.overallPerformance")}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-blue-700">
                    {stats.obtainedMarks}
                    <span className="text-base font-normal text-blue-400">/{stats.totalMarks}</span>
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5 font-medium">{t("studentExamDetail.totalMarks")}</p>
                </div>

                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-indigo-700">{stats.percentage}%</p>
                  <p className="text-xs text-indigo-600 mt-0.5 font-medium">{t("studentExamDetail.score")}</p>
                </div>

                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-purple-700">
                    {stats.gradedSubjects}
                    <span className="text-base font-normal text-purple-400">/{stats.totalSubjects}</span>
                  </p>
                  <p className="text-xs text-purple-600 mt-0.5 font-medium">{t("studentExamDetail.graded")}</p>
                </div>

                {stats.isPassing !== null && (
                  <div className={`rounded-xl p-3 text-center ${stats.isPassing ? "bg-green-50" : "bg-red-50"}`}>
                    <p className={`text-2xl font-black ${stats.isPassing ? "text-green-700" : "text-red-700"}`}>
                      {stats.isPassing ? t("studentExams.pass") : t("studentExams.fail")}
                    </p>
                    <p className={`text-xs mt-0.5 font-medium ${stats.isPassing ? "text-green-600" : "text-red-600"}`}>
                      {t("studentExamDetail.result")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress Bar (when partially graded) */}
          {statistics && statistics.total_subjects > 0 && statistics.graded_subjects < statistics.total_subjects && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{t("studentExamDetail.gradingProgress")}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {t("studentExamDetail.gradingProgressSubjects", {
                    graded: statistics.graded_subjects,
                    total: statistics.total_subjects,
                  })}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {t("studentExamDetail.pendingGrading", {
                  count: statistics.total_subjects - statistics.graded_subjects,
                })}
              </p>
            </div>
          )}

          {/* Subject-wise Marks */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              {t("studentExamDetail.subjectWiseMarks")}
            </h3>
            {subjects && subjects.length > 0 ? (
              <div className="space-y-3">
                {subjects.map((subject) => (
                  <MarksCard
                    key={subject.subject_id}
                    subject={subject}
                    gradingType={exam.grading_type}
                    maxValue={exam.grading_extras?.max_value}
                    passingValue={exam.grading_extras?.passing_value}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">{t("studentExamDetail.noSubjectsScheduled")}</p>
            )}
          </div>

          {/* Upcoming Notice */}
          {displayStatus === "PUBLISHED" && statistics?.graded_subjects === 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-0.5">{t("studentExamDetail.examScheduled")}</h4>
                <p className="text-xs text-blue-700">{t("studentExamDetail.examScheduledDescription")}</p>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
