import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Badge } from "../../ui-components";
import { getExamDetail, getStudentExamMarks } from "../../api/exam.api";
import { useAuth } from "../../store/auth.store";
import Loader from "../../ui-components/Loader";

function formatDate(date) {
  if (!date) return "";
  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return formattedDate;
}

function formatTime(time) {
  if (!time) return "";
  return time;
}

function StatusBadge({ status }) {
  if (status === "COMPLETED") {
    return <Badge variant="success">Completed</Badge>;
  } else if (status === "PUBLISHED") {
    return <Badge variant="info">Upcoming</Badge>;
  }
  return <Badge variant="default">{status}</Badge>;
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

function getGradingTypeLabel(type) {
  const labels = {
    PERCENTAGE: "Percentage",
    GPA: "GPA",
    LETTER_GRADE: "Letter Grade",
    PASS_FAIL: "Pass/Fail",
  };
  return labels[type] || type;
}

function MarksCard({ subject, marks, gradingType, maxValue, passingValue }) {
  const hasMarks = marks && marks.value !== null && marks.value !== undefined && marks.value !== "";
  
  // Determine if passed (for percentage and GPA)
  let isPassing = null;
  if (hasMarks && passingValue) {
    if (gradingType === "PERCENTAGE" || gradingType === "GPA") {
      isPassing = Number(marks.value) >= Number(passingValue);
    } else if (gradingType === "PASS_FAIL") {
      isPassing = marks.value === "PASS";
    }
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-base font-semibold text-gray-900">{subject.subjectName}</h4>
          <div className="flex items-center gap-2 mt-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-500"
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
            <span className="text-sm text-gray-600">{formatDate(subject.examDate)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-gray-600">
              {formatTime(subject.startTime)} - {formatTime(subject.endTime)}
            </span>
          </div>
        </div>

        {hasMarks && (
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {marks.value}
              {(gradingType === "PERCENTAGE" || gradingType === "GPA") && maxValue && (
                <span className="text-base text-gray-500 ml-1">/ {maxValue}</span>
              )}
            </div>
            {isPassing !== null && (
              <Badge variant={isPassing ? "success" : "error"} className="mt-1">
                {isPassing ? "Pass" : "Fail"}
              </Badge>
            )}
          </div>
        )}
      </div>

      {!hasMarks && (
        <div className="text-center py-4 bg-white rounded border border-dashed border-gray-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 mx-auto text-gray-400 mb-2"
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
          <p className="text-sm text-gray-500">Marks not yet available</p>
        </div>
      )}

      {hasMarks && marks.remarks && (
        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-100">
          <p className="text-xs font-medium text-blue-900 mb-1">Teacher's Remarks</p>
          <p className="text-sm text-blue-800">{marks.remarks}</p>
        </div>
      )}
    </div>
  );
}

export default function StudentExamDetail() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [exam, setExam] = useState(null);
  const [studentMarks, setStudentMarks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExamDetail = async () => {
      if (!auth.userId) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch exam details
        const examData = await getExamDetail(examId);
        setExam(examData);

        // Fetch student's marks for this exam
        try {
          const marksData = await getStudentExamMarks(examId, auth.userId);
          setStudentMarks(marksData);
        } catch (marksErr) {
          console.log("Marks not available yet:", marksErr);
          // It's okay if marks aren't available yet
          setStudentMarks(null);
        }
      } catch (err) {
        console.error("Error fetching exam detail:", err);
        setError(err.message || "Failed to fetch exam details");
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchExamDetail();
    }
  }, [examId, auth.userId]);

  const handleGoBack = () => {
    navigate("/student/exams");
  };

  // Calculate overall statistics
  const calculateStats = () => {
    if (!exam || !studentMarks || !studentMarks.marks) {
      return null;
    }

    const marks = studentMarks.marks;
    const subjects = exam.subjects || [];
    
    let totalMarks = 0;
    let obtainedMarks = 0;
    let marksCount = 0;

    subjects.forEach((subject) => {
      const mark = marks[subject.subjectId];
      if (mark && mark.value !== null && mark.value !== undefined && mark.value !== "") {
        marksCount++;
        if (exam.gradingType === "PERCENTAGE" || exam.gradingType === "GPA") {
          obtainedMarks += Number(mark.value);
          totalMarks += Number(exam.maxValue || 100);
        }
      }
    });

    if (marksCount === 0) return null;

    const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(2) : 0;
    const isPassing = exam.passingValue ? obtainedMarks >= Number(exam.passingValue) * marksCount : null;

    return {
      totalMarks,
      obtainedMarks,
      percentage,
      isPassing,
      marksCount,
      totalSubjects: subjects.length,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="h-screen md:min-h-screen flex flex-col p-4 gap-6">
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
              <h3 className="text-lg font-semibold text-gray-900">Error</h3>
            </div>
            <p className="text-gray-600 mb-4">{error || "Exam not found"}</p>
            <button
              onClick={handleGoBack}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Go Back
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col p-4 gap-6 overflow-hidden">
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
        <h1 className="text-2xl font-bold text-gray-900">Exam Details & Marks</h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pb-4">
        {/* Exam Overview Card */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {getExamTypeLabel(exam.examType)}
                </h2>
                {exam.customExamType && (
                  <p className="text-sm text-gray-600 mt-1">{exam.customExamType}</p>
                )}
              </div>
              <StatusBadge status={exam.status} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Class</p>
                <p className="text-base font-semibold text-gray-900">
                  {exam.class}
                  {exam.section && ` - ${exam.section}`}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Grading</p>
                <p className="text-base font-semibold text-gray-900">
                  {getGradingTypeLabel(exam.gradingType)}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Date Range</p>
                <p className="text-base font-semibold text-gray-900">
                  {exam.startDate && exam.endDate
                    ? `${formatDate(exam.startDate)}`
                    : "Not scheduled"}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Subjects</p>
                <p className="text-base font-semibold text-gray-900">
                  {exam.subjects?.length || 0} subject(s)
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Overall Performance Card - Only show if marks are available */}
        {stats && exam.status === "COMPLETED" && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-600 mb-1">Total Marks</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.obtainedMarks} / {stats.totalMarks}
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-green-600 mb-1">Percentage</p>
                <p className="text-2xl font-bold text-green-900">{stats.percentage}%</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-sm text-purple-600 mb-1">Progress</p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.marksCount} / {stats.totalSubjects}
                </p>
              </div>

              {stats.isPassing !== null && (
                <div className={`p-4 rounded-lg border ${stats.isPassing ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                  <p className={`text-sm ${stats.isPassing ? 'text-green-600' : 'text-red-600'} mb-1`}>Result</p>
                  <p className={`text-2xl font-bold ${stats.isPassing ? 'text-green-900' : 'text-red-900'}`}>
                    {stats.isPassing ? "Pass" : "Fail"}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Subject-wise Marks Card */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject-wise Marks</h3>
          <div className="space-y-3">
            {exam.subjects && exam.subjects.length > 0 ? (
              exam.subjects.map((subject) => (
                <MarksCard
                  key={subject.subjectId}
                  subject={subject}
                  marks={studentMarks?.marks?.[subject.subjectId] || null}
                  gradingType={exam.gradingType}
                  maxValue={exam.maxValue}
                  passingValue={exam.passingValue}
                />
              ))
            ) : (
              <p className="text-gray-600 text-center py-4">No subjects scheduled</p>
            )}
          </div>
        </Card>

        {/* Info message if exam is not completed yet */}
        {exam.status === "PUBLISHED" && (
          <Card>
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Exam Scheduled</h4>
                <p className="text-sm text-blue-800">
                  This exam is upcoming. Marks will be available after the exam is completed and graded by your teacher.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
