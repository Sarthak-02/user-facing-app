import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Badge, Button } from "../../ui-components";
import { getExamDetail } from "../../api/exam.api";
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
  if (status === "DRAFT") {
    return <Badge variant="warning">Draft</Badge>;
  } else if (status === "COMPLETED") {
    return <Badge variant="success">Completed</Badge>;
  } else if (status === "PUBLISHED") {
    return <Badge variant="info">Published</Badge>;
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
    PERCENTAGE: "Percentage (0-100)",
    GPA: "GPA (0-4.0)",
    LETTER_GRADE: "Letter Grade (A-F)",
    PASS_FAIL: "Pass/Fail",
  };
  return labels[type] || type;
}

export default function ExamDetail() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExamDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getExamDetail(examId);
        setExam(data);
      } catch (err) {
        console.error("Error fetching exam detail:", err);
        // Use mock data if API fails
        console.log("Using mock exam data for detail view");
        const mockExam = {
          id: examId,
          examType: "MID_TERM",
          customExamType: "",
          class: "Class 10",
          section: "Section A",
          status: "COMPLETED",
          subjects: [
            {
              subjectId: "sub1",
              subjectName: "Mathematics",
              examDate: "2026-01-10",
              startTime: "09:00",
              endTime: "11:00",
            },
            {
              subjectId: "sub7",
              subjectName: "Physics",
              examDate: "2026-01-12",
              startTime: "09:00",
              endTime: "11:00",
            },
            {
              subjectId: "sub8",
              subjectName: "Chemistry",
              examDate: "2026-01-14",
              startTime: "09:00",
              endTime: "11:00",
            },
          ],
          startDate: "2026-01-10",
          endDate: "2026-01-14",
          gradingType: "PERCENTAGE",
          passingValue: "40",
          maxValue: "100",
        };
        setExam(mockExam);
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchExamDetail();
    }
  }, [examId]);

  const handleGoBack = () => {
    navigate("/staff/exams");
  };

  const handleViewResults = () => {
    // TODO: Implement view results functionality
    alert("View results functionality will be implemented");
  };

  const handleEnterMarks = () => {
    navigate(`/staff/exams/${examId}/enter-marks`);
  };

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
            <Button onClick={handleGoBack}>Go Back</Button>
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
        <h1 className="text-2xl font-bold text-gray-900">Exam Details</h1>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Target</p>
                <p className="text-base font-semibold text-gray-900">
                  {exam.class}
                  {exam.section && ` - ${exam.section}`}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Subjects</p>
                <p className="text-base font-semibold text-gray-900">
                  {exam.subjects?.length || 0} subject(s)
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Date Range</p>
                <p className="text-base font-semibold text-gray-900">
                  {exam.startDate && exam.endDate
                    ? `${formatDate(exam.startDate)} - ${formatDate(exam.endDate)}`
                    : "Not scheduled"}
                </p>
              </div>
            </div>
          </div>
        </Card>

      {/* Subjects Schedule Card */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Schedule</h3>
        <div className="space-y-3">
          {exam.subjects && exam.subjects.length > 0 ? (
            exam.subjects.map((subject, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Subject</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {subject.subjectName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(subject.examDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Time</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatTime(subject.startTime)} - {formatTime(subject.endTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Marks</p>
                    <p className="text-sm font-medium text-gray-900">
                      {subject.totalMarks}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-center py-4">No subjects scheduled</p>
          )}
        </div>
      </Card>

      {/* Grading Configuration Card */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Grading Configuration
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Grading Type</p>
              <p className="text-base font-semibold text-gray-900">
                {getGradingTypeLabel(exam.gradingType)}
              </p>
            </div>

            {exam.gradingType !== "PASS_FAIL" && (
              <>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Maximum Marks</p>
                  <p className="text-base font-semibold text-gray-900">
                    {exam.maxMarks || "N/A"}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Passing Marks</p>
                  <p className="text-base font-semibold text-gray-900">
                    {exam.passingMarks || "N/A"}
                  </p>
                </div>
              </>
            )}
          </div>

          {exam.includeGrades && exam.gradeRanges && exam.gradeRanges.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Grade Ranges</p>
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
          <div className="flex flex-col md:flex-row gap-3">
            <Button onClick={handleEnterMarks} className="flex-1">
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
              {exam.status === "COMPLETED" ? "View/Edit Marks" : "Enter Marks"}
            </Button>
            <Button onClick={handleViewResults} variant="secondary" className="flex-1">
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
            </Button>
          </div>
        </Card>
      )}
      </div>
    </div>
  );
}
