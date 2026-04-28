import { useState, useMemo, useEffect } from "react";
import { Card, Button } from "../../ui-components";
import Shimmer from "../../ui-components/Shimmer";
import DesktopListing from "../../components/staff-exam/DesktopListing";
import MobileListing from "../../components/staff-exam/MobileListing";
import ExamFormModal from "../../components/staff-exam/ExamFormModal";
import Dropdown from "../../ui-components/Dropdown";
import { createExam, getTeacherExamsAll, publishExam, getExamDetail, updateExam } from "../../api/exam.api";
import { useAuth } from "../../store/auth.store";
import { usePermissions } from "../../store/permissions.store";
import { useNavigate } from "react-router-dom";

function formatTime(timeString) {
  if (!timeString) return "";
  if (timeString.split(":").length === 3) return timeString;
  return timeString + ":00";
}

function buildTargets(examData) {
  const targets = [];
  if (examData.targetType?.value === "CLASS" && Array.isArray(examData.classId) && examData.classId.length > 0) {
    examData.classId.forEach((classItem) => {
      targets.push({ targetType: "CLASS", targetId: classItem.value });
    });
  } else if (examData.targetType?.value === "SECTION" && examData.sectionId?.value) {
    targets.push({ targetType: "SECTION", targetId: examData.sectionId.value });
  } else if (examData.targetType?.value === "STUDENT" && examData.studentId) {
    const studentIds = Array.isArray(examData.studentId) ? examData.studentId : [examData.studentId];
    studentIds.forEach((student) => {
      targets.push({ targetType: "STUDENT", targetId: student.value });
    });
  }
  return targets;
}

function buildGradingExtras(examData) {
  if (examData.gradingType === "PERCENTAGE" || examData.gradingType === "GPA") {
    return {
      passing_value: examData.passingValue ? Number(examData.passingValue) : null,
      max_value: examData.maxValue ? Number(examData.maxValue) : null,
    };
  } else if (examData.gradingType === "LETTER_GRADE") {
    return {
      passing_value: examData.passingValue || null,
      max_value: examData.maxValue || null,
      grade_ranges: examData.gradeRanges || [],
    };
  }
  return {};
}

export default function Exams() {
  const { auth } = useAuth();
  const { permissions } = usePermissions();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  // Publish confirmation modal
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [examToPublish, setExamToPublish] = useState(null);
  const [publishError, setPublishError] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const [examTypeFilter, setExamTypeFilter] = useState("");
  const [statusFilterDropdown, setStatusFilterDropdown] = useState("");

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Exam data states
  const [examList, setExamList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Get EXAM_TYPES from auth store and build examTypeOptions
  const examTypeOptions = useMemo(() => {
    const options = [{ value: "", label: "All Types" }];
    
    if (auth?.campus?.campus_exam_types && Array.isArray(auth.campus.campus_exam_types)) {
      auth.campus.campus_exam_types.forEach((examType) => {
        options.push({
          value: examType,
          label: examType
        });
      });
    }
    
    return options;
  }, [auth?.campus?.campus_exam_types]);

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "DRAFT", label: "Draft" },
    { value: "PUBLISHED", label: "Published" },
    { value: "COMPLETED", label: "Completed" },
  ];

  const filteredExams = useMemo(() => {
    let filtered = [...examList];

    if (examTypeFilter) {
      filtered = filtered.filter((exam) => exam.examType === examTypeFilter);
    }

    if (statusFilterDropdown) {
      filtered = filtered.filter((exam) => exam.status === statusFilterDropdown);
    }

    filtered.sort((a, b) => {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return new Date(a.startDate) - new Date(b.startDate);
    });

    return filtered;
  }, [examList, examTypeFilter, statusFilterDropdown]);

  const selectedExamTypeOption = examTypeOptions.find((o) => o.value === examTypeFilter) || null;
  const selectedStatusOption = statusOptions.find((o) => o.value === statusFilterDropdown) || null;

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
      const targets = buildTargets(examData);
      const grading_extras = buildGradingExtras(examData);
      const subjects = examData.subjects.map((sub) => ({
        subjectName: sub.subjectName,
        examDate: sub.examDate,
        examStartTime: formatTime(sub.startTime),
        examEndTime: formatTime(sub.endTime),
        extras: {},
      }));

      if (editingExam) {
        const payload = {
          exam_type: examData.customExamType || examData.examType,
          target: examData.targetType?.value || "CLASS",
          subjects,
          targets,
          grading_type: examData.gradingType,
          grading_extras,
          publish: examData.status === "PUBLISHED",
        };
        await updateExam(editingExam.id, payload);
      } else {
        const payload = {
          exam_type: examData.customExamType || examData.examType,
          target: examData.targetType?.value || "CLASS",
          teacher_id: auth.userId,
          campus_id: auth.campus_id,
          subjects,
          targets,
          grading_type: examData.gradingType,
          grading_extras,
          publish: examData.status === "PUBLISHED",
        };
        await createExam(payload);
      }

      await fetchExams();
      handleCloseModal();
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
    setIsPublishing(true);
    setPublishError(null);
    try {
      await publishExam(examToPublish.id, auth.userId);
      await fetchExams();
      setIsPublishModalOpen(false);
      setExamToPublish(null);
    } catch (error) {
      console.error("Error publishing exam:", error);
      setPublishError(error.message || "Failed to publish exam. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  const cancelPublish = () => {
    setIsPublishModalOpen(false);
    setExamToPublish(null);
    setPublishError(null);
  };


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

  useEffect(() => {
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.userId]);

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

          {/* Filters Row */}
          <div className="flex items-center gap-3">
            <div className="w-48">
              <Dropdown
                selected={selectedExamTypeOption}
                onChange={(opt) => setExamTypeFilter(opt?.value ?? "")}
                options={examTypeOptions}
                placeholder="Exam Type"
              />
            </div>
            <div className="w-40">
              <Dropdown
                selected={selectedStatusOption}
                onChange={(opt) => setStatusFilterDropdown(opt?.value ?? "")}
                options={statusOptions}
                placeholder="Status"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Mobile Header */}
      <div className="md:hidden flex-shrink-0">
        <Card className="p-4">
          <div className="grid grid-cols-2 gap-2">
            <Dropdown
              selected={selectedExamTypeOption}
              onChange={(opt) => setExamTypeFilter(opt?.value ?? "")}
              options={examTypeOptions}
              placeholder="Exam Type"
            />
            <Dropdown
              selected={selectedStatusOption}
              onChange={(opt) => setStatusFilterDropdown(opt?.value ?? "")}
              options={statusOptions}
              placeholder="Status"
            />
          </div>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <>
          <div className="hidden md:block flex-1 overflow-y-auto min-h-0">
            <Shimmer variant="table" count={6} />
          </div>
          <div className="md:hidden flex-1 overflow-y-auto min-h-0">
            <Shimmer variant="card-list" count={5} />
          </div>
        </>
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
            className="pb-32"
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

      {/* Publish Confirmation Modal */}
      {isPublishModalOpen && examToPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
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
                  {examToPublish.examType.replaceAll("_", " ")}
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
              {publishError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {publishError}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <Button variant="secondary" onClick={cancelPublish} disabled={isPublishing}>
                Cancel
              </Button>
              <Button onClick={confirmPublish} disabled={isPublishing}>
                {isPublishing ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
