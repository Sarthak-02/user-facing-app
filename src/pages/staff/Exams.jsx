import { useState, useMemo, useEffect } from "react";
import { Card, Button } from "../../ui-components";
import DesktopListing from "../../components/staff-exam/DesktopListing";
import MobileListing from "../../components/staff-exam/MobileListing";
import ExamFormModal from "../../components/staff-exam/ExamFormModal";
import Dropdown from "../../ui-components/Dropdown";
import { createExam, getTeacherExamsAll, publishExam, getExamDetail, updateExam } from "../../api/exam.api";
import { useAuth } from "../../store/auth.store";
import { usePermissions } from "../../store/permissions.store";
import { useNavigate } from "react-router-dom";

// Mock data - Replace with actual API call
const MOCK_EXAMS = [
  {
    id: "exam-001",
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
  },
  {
    id: "exam-002",
    examType: "QUARTERLY",
    customExamType: "",
    class: "Class 9",
    section: "Section A",
    status: "PUBLISHED",
    subjects: [
      {
        subjectId: "sub1",
        subjectName: "Mathematics",
        examDate: "2026-01-28",
        startTime: "10:00",
        endTime: "12:00",
      },
      {
        subjectId: "sub2",
        subjectName: "Science",
        examDate: "2026-01-30",
        startTime: "10:00",
        endTime: "12:00",
      },
    ],
    startDate: "2026-01-28",
    endDate: "2026-02-02",
    gradingType: "GPA",
    passingValue: "2.0",
    maxValue: "4.0",
  },
  {
    id: "exam-003",
    examType: "UNIT_TEST",
    customExamType: "",
    class: "Class 11",
    section: "Section A",
    status: "DRAFT",
    subjects: [
      {
        subjectId: "sub1",
        subjectName: "Mathematics",
        examDate: "2026-02-20",
        startTime: "09:00",
        endTime: "10:30",
      },
    ],
    startDate: "2026-02-20",
    endDate: "2026-02-20",
    gradingType: "LETTER_GRADE",
    passingValue: "D",
    maxValue: "A+",
  },
];

export default function Exams() {
  const { auth } = useAuth();
  const { permissions } = usePermissions();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  // Publish confirmation modal
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [examToPublish, setExamToPublish] = useState(null);

  // Mobile filter states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState("");
  const [statusFilterDropdown, setStatusFilterDropdown] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Exam data states
  const [examList, setExamList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const examTypeOptions = [
    { value: "", label: "All Types" },
    { value: "UNIT_TEST", label: "Unit Test" },
    { value: "MID_TERM", label: "Mid Term" },
    { value: "FINAL", label: "Final Exam" },
    { value: "QUARTERLY", label: "Quarterly" },
    { value: "HALF_YEARLY", label: "Half Yearly" },
    { value: "ANNUAL", label: "Annual" },
    { value: "OTHER", label: "Other" },
  ];

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "DRAFT", label: "Draft" },
    { value: "PUBLISHED", label: "Published" },
    { value: "COMPLETED", label: "Completed" },
  ];

  // Filter exams based on filters (frontend-only filters)
  const filteredExams = useMemo(() => {
    let filtered = [...examList];

    // Search query filter (frontend only)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (exam) =>
          exam.examType.toLowerCase().includes(query) ||
          exam.customExamType?.toLowerCase().includes(query) ||
          exam.class?.toLowerCase().includes(query) ||
          exam.section?.toLowerCase().includes(query)
      );
    }

    // Exam type filter (frontend only)
    if (examTypeFilter) {
      filtered = filtered.filter((exam) => exam.examType === examTypeFilter);
    }

    // Note: Status and date range filters are handled by the API

    // Sort by start date (earliest first)
    filtered.sort((a, b) => {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return new Date(a.startDate) - new Date(b.startDate);
    });

    return filtered;
  }, [examList, searchQuery, examTypeFilter]);

  const handleCreateExam = () => {
    setEditingExam(null);
    setIsModalOpen(true);
  };

  const handleEditExam = async (exam) => {
    try {
      // Fetch full exam details including all data
      const examId = exam.id;
      const fullExamDetails = await getExamDetail(examId, permissions);
      
      // Transform the exam details to the format expected by ExamFormModal
      const formattedExam = {
        id: fullExamDetails.id,
        examType: fullExamDetails.examType,
        customExamType: fullExamDetails.customExamType || '',
        status: fullExamDetails.status,
        subjects: fullExamDetails.subjects || [],
        gradingType: fullExamDetails.gradingType,
        passingValue: fullExamDetails.passingValue,
        maxValue: fullExamDetails.maxValue,
        gradeRanges: fullExamDetails.gradeRanges || [],
        targets: fullExamDetails.targets || [],
        // Keep the original raw data for reference
        _rawData: fullExamDetails
      };
      
      setEditingExam(formattedExam);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching exam details for editing:", error);
      // Fallback to basic exam object if API call fails
      setEditingExam(exam);
      setIsModalOpen(true);
    }
  };

  const handleViewExam = (exam) => {
    navigate(`/staff/exams/${exam.id}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExam(null);
    setSubmitError(null);
  };

  const handleSubmitExam = async (examData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (editingExam) {
        // Transform form data to API schema for update
        const targets = [];

        // Build targets array based on targetType
        if (examData.targetType?.value === "CLASS" && examData.classId?.value) {
          targets.push({
            targetType: "CLASS",
            targetId: examData.classId.value,
          });
        } else if (examData.targetType?.value === "SECTION" && examData.sectionId?.value) {
          targets.push({
            targetType: "SECTION",
            targetId: examData.sectionId.value,
          });
        } else if (examData.targetType?.value === "STUDENT" && examData.studentId) {
          const studentIds = Array.isArray(examData.studentId)
            ? examData.studentId
            : [examData.studentId];

          studentIds.forEach((student) => {
            targets.push({
              targetType: "STUDENT",
              targetId: student.value,
            });
          });
        }

        // Prepare grading_extras based on grading type
        let grading_extras = {};
        if (examData.gradingType === "PERCENTAGE" || examData.gradingType === "GPA") {
          grading_extras = {
            passing_value: examData.passingValue ? Number(examData.passingValue) : null,
            max_value: examData.maxValue ? Number(examData.maxValue) : null,
          };
        } else if (examData.gradingType === "LETTER_GRADE") {
          grading_extras = {
            passing_value: examData.passingValue || null,
            max_value: examData.maxValue || null,
            grade_ranges: examData.gradeRanges || [],
          };
        }

        // Helper function to format time to HH:MM:SS
        const formatTime = (timeString) => {
          if (!timeString) return "";
          // If already has seconds (HH:MM:SS), return as is
          if (timeString.split(':').length === 3) {
            return timeString;
          }
          // Otherwise add :00 for seconds (HH:MM -> HH:MM:00)
          return timeString + ":00";
        };

        // Prepare API payload for update
        const payload = {
          exam_type: examData.customExamType || examData.examType,
          target: examData.targetType?.value || "CLASS",
          subjects: examData.subjects.map((sub) => ({
            subjectName: sub.subjectName,
            examDate: sub.examDate,
            examStartTime: formatTime(sub.startTime),
            examEndTime: formatTime(sub.endTime),
            extras: {},
          })),
          targets: targets,
          grading_type: examData.gradingType,
          grading_extras: grading_extras,
          publish: examData.status === "PUBLISHED",
        };

        console.log("Updating exam:", editingExam.id, "with payload:", JSON.stringify(payload, null, 2));

        // Call API to update exam
        const response = await updateExam(editingExam.id, payload);
        console.log("Exam updated successfully:", response);

        // Refresh exam list
        await fetchExams();

        handleCloseModal();
      } else {
        // Transform form data to API schema
        const targets = [];

        // Build targets array based on targetType
        if (examData.targetType?.value === "CLASS" && examData.classId?.value) {
          targets.push({
            targetType: "CLASS",
            targetId: examData.classId.value,
          });
        } else if (examData.targetType?.value === "SECTION" && examData.sectionId?.value) {
          targets.push({
            targetType: "SECTION",
            targetId: examData.sectionId.value,
          });
        } else if (examData.targetType?.value === "STUDENT" && examData.studentId) {
          const studentIds = Array.isArray(examData.studentId)
            ? examData.studentId
            : [examData.studentId];

          studentIds.forEach((student) => {
            targets.push({
              targetType: "STUDENT",
              targetId: student.value,
            });
          });
        }

        // Prepare grading_extras based on grading type
        let grading_extras = {};
        if (examData.gradingType === "PERCENTAGE" || examData.gradingType === "GPA") {
          grading_extras = {
            passing_value: examData.passingValue ? Number(examData.passingValue) : null,
            max_value: examData.maxValue ? Number(examData.maxValue) : null,
          };
        } else if (examData.gradingType === "LETTER_GRADE") {
          grading_extras = {
            passing_value: examData.passingValue || null,
            max_value: examData.maxValue || null,
            grade_ranges: examData.gradeRanges || [],
          };
        }

        // Helper function to format time to HH:MM:SS
        const formatTime = (timeString) => {
          if (!timeString) return "";
          // If already has seconds (HH:MM:SS), return as is
          if (timeString.split(':').length === 3) {
            return timeString;
          }
          // Otherwise add :00 for seconds (HH:MM -> HH:MM:00)
          return timeString + ":00";
        };

        // Prepare API payload
        const payload = {
          exam_type: examData.customExamType || examData.examType,
          target: examData.targetType?.value || "CLASS",
          teacher_id: auth.userId,
          campus_id: auth.campus_id,
          subjects: examData.subjects.map((sub) => ({
            subjectName: sub.subjectName,
            examDate: sub.examDate,
            examStartTime: formatTime(sub.startTime),
            examEndTime: formatTime(sub.endTime),
            extras: {},
          })),
          targets: targets,
          grading_type: examData.gradingType,
          grading_extras: grading_extras,
          publish: examData.status === "PUBLISHED",
        };

        console.log("Creating exam with payload:", JSON.stringify(payload, null, 2));

        // Call API
        const response = await createExam(payload);
        console.log("Exam created successfully:", response);

        // Refresh exam list
        await fetchExams();

        handleCloseModal();
      }
    } catch (error) {
      console.error("Error submitting exam:", error);
      setSubmitError(error.message || `Failed to ${editingExam ? 'update' : 'create'} exam. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishExam = (exam) => {
    setExamToPublish(exam);
    setIsPublishModalOpen(true);
  };

  const confirmPublish = async () => {
    try {
      console.log("Publishing exam:", examToPublish.id);
      await publishExam(examToPublish.id, auth.userId);
      
      // Refresh exam list after publishing
      await fetchExams();
      
      setIsPublishModalOpen(false);
      setExamToPublish(null);
    } catch (error) {
      console.error("Error publishing exam:", error);
      // You might want to show an error message to the user here
      alert(error.message || "Failed to publish exam. Please try again.");
    }
  };

  const cancelPublish = () => {
    setIsPublishModalOpen(false);
    setExamToPublish(null);
  };

  const handleApplyFilters = () => {
    setIsFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setExamTypeFilter("");
    setStatusFilterDropdown("");
    setDateRangeStart("");
    setDateRangeEnd("");
  };

  const hasActiveFilters =
    searchQuery || examTypeFilter || statusFilterDropdown || dateRangeStart || dateRangeEnd;

  // Fetch exams list
  const fetchExams = async () => {
    if (!auth.userId) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const params = {
        teacher_id: auth.userId,
        limit: 100, // Fetch up to 100 records
        offset: 0,  // Start from beginning
      };

      // Add optional filters
      if (statusFilterDropdown) {
        params.status = statusFilterDropdown;
      }
      if (dateRangeStart) {
        params.start_date = dateRangeStart;
      }
      if (dateRangeEnd) {
        params.end_date = dateRangeEnd;
      }

      const data = await getTeacherExamsAll(params, permissions);
      setExamList(data);
    } catch (error) {
      console.error("Error fetching exams:", error);
      setLoadError(error.message || "Failed to load exams. Please try again.");
      setExamList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch exams on component mount and when filters change
  useEffect(() => {
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.userId, statusFilterDropdown, dateRangeStart, dateRangeEnd]);

  return (
    <div className="h-screen flex flex-col p-4 gap-6 overflow-hidden">
      {/* Desktop Header with Filters */}
      <Card className="hidden md:block flex-shrink-0">
        <div className="space-y-4">
          {/* Title and Create Button Row */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Exams</h1>

            <Button onClick={handleCreateExam}>
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Exam
            </Button>
          </div>

          {/* Search and Filters Row */}
          <div className="grid grid-cols-12 gap-4">
            {/* Search Bar */}
            <div className="col-span-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search exams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Exam Type Filter */}
            <div className="col-span-2">
              <Dropdown
                selected={examTypeFilter}
                onChange={setExamTypeFilter}
                options={examTypeOptions}
                placeholder="Exam Type"
              />
            </div>

            {/* Status Filter */}
            <div className="col-span-2">
              <Dropdown
                selected={statusFilterDropdown}
                onChange={setStatusFilterDropdown}
                options={statusOptions}
                placeholder="Status"
              />
            </div>

            {/* Date Range Start */}
            <div className="col-span-2">
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                placeholder="From Date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Range End */}
            <div className="col-span-2">
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                placeholder="To Date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="col-span-12">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Mobile Header */}
      <div className="md:hidden flex-shrink-0">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className={`relative p-2 rounded-lg border transition-colors ${
                hasActiveFilters
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
              aria-label="Open filters"
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Loading exams...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {loadError && !isLoading && (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-red-500"
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
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Error Loading Exams</h3>
                <p className="text-gray-600 mt-2">{loadError}</p>
              </div>
              <Button onClick={fetchExams}>Try Again</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Desktop Listing */}
      {!isLoading && !loadError && (
        <div className="hidden md:block flex-1 overflow-y-auto min-h-0">
          <DesktopListing
            examList={filteredExams}
            onEdit={handleEditExam}
            onPublish={handlePublishExam}
            onView={handleViewExam}
          />
        </div>
      )}

      {/* Mobile Listing */}
      {!isLoading && !loadError && (
        <div className="md:hidden flex-1 overflow-y-auto min-h-0">
          <MobileListing
            examList={filteredExams}
            onEdit={handleEditExam}
            onPublish={handlePublishExam}
            onView={handleViewExam}
          />
        </div>
      )}

      {/* Floating Action Button (Mobile Only) */}
      <button
        onClick={handleCreateExam}
        className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 flex items-center justify-center z-40 hover:scale-110 active:scale-95"
        aria-label="Create new exam"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Exam Form Modal */}
      <ExamFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitExam}
        exam={editingExam}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />

      {/* Filter Modal (Mobile Only) */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:hidden">
          <div className="bg-white w-full rounded-t-2xl max-h-[90vh] flex flex-col animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close filters"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Exam Type Filter */}
              <div>
                <Dropdown
                  label="Exam Type"
                  selected={examTypeFilter}
                  onChange={setExamTypeFilter}
                  options={examTypeOptions}
                  placeholder="Select exam type"
                />
              </div>

              {/* Status Filter */}
              <div>
                <Dropdown
                  label="Status"
                  selected={statusFilterDropdown}
                  onChange={setStatusFilterDropdown}
                  options={statusOptions}
                  placeholder="Select status"
                />
              </div>

              {/* Date Range Filters */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Date From
                  </label>
                  <input
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Date To
                  </label>
                  <input
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={handleClearFilters}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {isPublishModalOpen && examToPublish && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Publish Exam?</h3>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to publish this exam? Students will be able to see it.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900">
                  {examToPublish.examType.replace("_", " ")}
                </h4>
                {examToPublish.customExamType && (
                  <p className="text-sm text-gray-600">{examToPublish.customExamType}</p>
                )}
                <p className="text-sm text-gray-600">
                  {examToPublish.class}
                  {examToPublish.section && ` - ${examToPublish.section}`}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {examToPublish.subjects?.length || 0} subject(s)
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <Button variant="secondary" onClick={cancelPublish}>
                Cancel
              </Button>
              <Button onClick={confirmPublish}>Publish</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
