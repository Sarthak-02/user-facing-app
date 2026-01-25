import { useState, useMemo, useEffect } from "react";
import { Card, Button, DateRange } from "../../ui-components";
import DesktopListing from "../../components/staff-homework/DesktopListing";
import MobileListing from "../../components/staff-homework/MobileListing";
import HomeworkFormModal from "../../components/staff-homework/HomeworkFormModal";
import TargetSelector from "../../components/TargetSelector";
import Dropdown from "../../ui-components/Dropdown";
import { createHomework, getTeacherHomeworkAll } from "../../api/homework.api";
import { useAuth } from "../../store/auth.store";
import { usePermissions } from "../../store/permissions.store";



export default function TeacherHomework() {
  const { auth } = useAuth();
  const { permissions, getSectionsByClass, getStudentsBySection } = usePermissions();
  const [statusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);

  // Publish confirmation modal
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [homeworkToPublish, setHomeworkToPublish] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Mobile filter states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState(null);
  const [statusFilterDropdown, setStatusFilterDropdown] = useState(null);
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [targetType, setTargetType] = useState(null);
  const [classId, setClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [studentId, setStudentId] = useState(null);

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Homework data states
  const [homeworkList, setHomeworkList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Get classes, sections, and students from permissions store
  // Map to format expected by dropdowns: { id, name }
  const classes = useMemo(() => {
    return (permissions.classes || []).map(cls => ({
      id: cls.class_id,
      name: cls.class_name
    }));
  }, [permissions.classes]);
  
  // Get sections based on selected class
  // Map to format expected by dropdowns: { value, label }
  const sections = useMemo(() => {
    if (classId?.value) {
      const filteredSections = getSectionsByClass(classId.value);
      return filteredSections.map(sec => ({
        value: sec.section_id,
        label: sec.section_name
      }));
    }
    return (permissions.sections || []).map(sec => ({
      value: sec.section_id,
      label: sec.section_name
    }));
  }, [classId, permissions.sections, getSectionsByClass]);

  // Get students based on selected section
  // Map to format expected by dropdowns: { id, name }
  const students = useMemo(() => {
    if (sectionId?.value) {
      const filteredStudents = getStudentsBySection(sectionId.value);
      return filteredStudents.map(student => ({
        id: student.student_id,
        name: student.student_name
      }));
    }
    return (permissions.students || []).map(student => ({
      id: student.student_id,
      name: student.student_name
    }));
  }, [sectionId, permissions.students, getStudentsBySection]);

  // Reset dependent selections when classId changes
  useEffect(() => {
    if (targetType?.value !== "SCHOOL") {
      setSectionId(null);
      setStudentId(null);
    }
  }, [classId, targetType]);

  const subjects = [
    { value: "", label: "All Subjects" },
    { value: "Mathematics", label: "Mathematics" },
    { value: "Physics", label: "Physics" },
    { value: "Chemistry", label: "Chemistry" },
    { value: "Biology", label: "Biology" },
  ];

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "DRAFT", label: "Draft" },
    { value: "PUBLISHED", label: "Published" },
  ];

  // Filter homework based on status and mobile filters
  const filteredHomework = useMemo(() => {
    let filtered = [...homeworkList];

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((hw) => {
        const now = new Date();
        const due = new Date(hw.dueDate);

        if (statusFilter === "COMPLETED") {
          return hw.status === "COMPLETED";
        } else if (statusFilter === "OVERDUE") {
          return due < now && hw.status !== "COMPLETED" && hw.status !== "DRAFT";
        } else if (statusFilter === "ACTIVE") {
          return (hw.status === "PUBLISHED" || hw.status === "ACTIVE") && due >= now;
        }
        return true;
      });
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((hw) =>
        hw.title.toLowerCase().includes(query) ||
        hw.description.toLowerCase().includes(query) ||
        hw.subject.toLowerCase().includes(query)
      );
    }

    // Subject filter
    if (subjectFilter?.value) {
      filtered = filtered.filter((hw) => hw.subject === subjectFilter.value);
    }

    // Status filter
    if (statusFilterDropdown?.value) {
      filtered = filtered.filter((hw) => hw.status === statusFilterDropdown.value);
    }

    // Date range filter
    if (dateRangeStart) {
      filtered = filtered.filter((hw) => new Date(hw.dueDate) >= new Date(dateRangeStart));
    }
    if (dateRangeEnd) {
      filtered = filtered.filter((hw) => new Date(hw.dueDate) <= new Date(dateRangeEnd));
    }

    // Class filter
    if (targetType?.value !== "SCHOOL" && classId?.value) {
      filtered = filtered.filter((hw) => hw.class.includes(classId.value));
    }

    // Section filter
    if ((targetType?.value === "SECTION" || targetType?.value === "STUDENT") && sectionId?.value) {
      filtered = filtered.filter((hw) => hw.section.includes(sectionId.value));
    }

    // Sort by due date (earliest first)
    filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return filtered;
  }, [homeworkList, statusFilter, searchQuery, subjectFilter, statusFilterDropdown, dateRangeStart, dateRangeEnd, targetType, classId, sectionId]);

  // Calculate summary statistics
  const _summary = useMemo(() => {
    const total = homeworkList.length;
    const now = new Date();

    const active = homeworkList.filter(
      (hw) => (hw.status === "PUBLISHED" || hw.status === "ACTIVE") && new Date(hw.dueDate) >= now
    ).length;

    const completed = homeworkList.filter(
      (hw) => hw.status === "COMPLETED"
    ).length;

    const overdue = homeworkList.filter(
      (hw) => new Date(hw.dueDate) < now && hw.status !== "COMPLETED" && hw.status !== "DRAFT"
    ).length;

    const draft = homeworkList.filter(
      (hw) => hw.status === "DRAFT"
    ).length;

    return { total, active, completed, overdue, draft };
  }, [homeworkList]);

  const handleCreateHomework = () => {
    setEditingHomework(null);
    setIsModalOpen(true);
  };

  const handleEditHomework = async (homework) => {
    try {
      // Fetch full homework details including targets
      const { getHomeworkDetail } = await import("../../api/homework.api");
      const homeworkId = homework.id || homework.homework_id;
      const fullHomeworkDetails = await getHomeworkDetail(homeworkId);
      setEditingHomework(fullHomeworkDetails);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching homework details for editing:", error);
      // Fallback to basic homework object if API call fails
      setEditingHomework(homework);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHomework(null);
    setSubmitError(null);
  };

  const handleSubmitHomework = async (homeworkData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (editingHomework) {
        // Update existing homework
        const homeworkId = editingHomework.id || editingHomework.homework_id;
        console.log("Updating homework:", homeworkId, homeworkData);
        
        // Transform form data to API schema for update
        const targets = [];

        // Build targets array based on targetType
        if (homeworkData.targetType === "CLASS" && homeworkData.classId) {
          targets.push({
            targetType: "CLASS",
            targetId: homeworkData.classId
          });
        } else if (homeworkData.targetType === "SECTION" && homeworkData.sectionId) {
          targets.push({
            targetType: "SECTION",
            targetId: homeworkData.sectionId
          });
        } else if (homeworkData.targetType === "STUDENT" && homeworkData.studentId) {
          // Handle multiple students if studentId is an array
          const studentIds = Array.isArray(homeworkData.studentId)
            ? homeworkData.studentId
            : [homeworkData.studentId];

          studentIds.forEach(id => {
            targets.push({
              targetType: "STUDENT",
              targetId: id
            });
          });
        }

        // Transform attachments (File objects to attachment metadata)
        const attachments = homeworkData.attachments.map(file => ({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: "" // TODO: Upload file first and get URL
        }));

        // Prepare API payload for update
        const payload = {
          title: homeworkData.title,
          description: homeworkData.description,
          due_date: new Date(homeworkData.dueDate).toISOString(),
          subject: homeworkData.subject,
          teacher_id: auth.userId,
          targets: targets,
          publish: homeworkData.status === "PUBLISHED",
          ...(attachments.length > 0 && { attachments })
        };

        // Call update API
        const { updateHomework } = await import("../../api/homework.api");
        const response = await updateHomework(homeworkId, payload);
        console.log("Homework updated successfully:", response);

        // Refresh homework list
        await fetchHomework();

        handleCloseModal();
      } else {
        // Transform form data to API schema
        const targets = [];

        // Build targets array based on targetType
        if (homeworkData.targetType === "CLASS" && homeworkData.classId) {
          targets.push({
            targetType: "CLASS",
            targetId: homeworkData.classId
          });
        } else if (homeworkData.targetType === "SECTION" && homeworkData.sectionId) {
          targets.push({
            targetType: "SECTION",
            targetId: homeworkData.sectionId
          });
        } else if (homeworkData.targetType === "STUDENT" && homeworkData.studentId) {
          // Handle multiple students if studentId is an array
          const studentIds = Array.isArray(homeworkData.studentId)
            ? homeworkData.studentId
            : [homeworkData.studentId];

          studentIds.forEach(id => {
            targets.push({
              targetType: "STUDENT",
              targetId: id
            });
          });
        }

        // Transform attachments (File objects to attachment metadata)
        // Note: Files should be uploaded first to get URLs
        const attachments = homeworkData.attachments.map(file => ({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: "" // TODO: Upload file first and get URL
        }));

        // Prepare API payload
        const payload = {
          title: homeworkData.title,
          description: homeworkData.description,
          due_date: new Date(homeworkData.dueDate).toISOString(),
          subject: homeworkData.subject,
          teacher_id: auth.userId,
          targets: targets,
          publish: homeworkData.status === "PUBLISHED",
          ...(attachments.length > 0 && { attachments })
        };

        // Call API
        const response = await createHomework(payload);
        console.log("Homework created successfully:", response);

        // Refresh homework list
        await fetchHomework();

        // TODO: Show success notification

        handleCloseModal();
      }
    } catch (error) {
      console.error("Error submitting homework:", error);
      setSubmitError(error.message || `Failed to ${editingHomework ? 'update' : 'create'} homework. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishHomework = (homework) => {
    setHomeworkToPublish(homework);
    setIsPublishModalOpen(true);
  };

  const confirmPublish = async () => {
    if (!homeworkToPublish) return;
    
    setIsPublishing(true);
    try {
      const homeworkId = homeworkToPublish.id || homeworkToPublish.homework_id;
      console.log("Publishing homework:", homeworkId);
      
      // Call publish API
      const { publishHomework } = await import("../../api/homework.api");
      await publishHomework(homeworkId, auth.userId);
      
      console.log("Homework published successfully");
      
      // Refresh homework list
      await fetchHomework();
      
      // Close modal
      setIsPublishModalOpen(false);
      setHomeworkToPublish(null);
      
      // TODO: Show success toast notification
    } catch (error) {
      console.error("Error publishing homework:", error);
      // TODO: Show error notification
      alert(`Failed to publish homework: ${error.message || 'Please try again'}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const cancelPublish = () => {
    setIsPublishModalOpen(false);
    setHomeworkToPublish(null);
  };

  const handleApplyFilters = () => {
    setIsFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSubjectFilter(null);
    setStatusFilterDropdown(null);
    setDateRangeStart("");
    setDateRangeEnd("");
    setTargetType(null);
    setClassId(null);
    setSectionId(null);
    setStudentId(null);
  };

  const hasActiveFilters = searchQuery || subjectFilter || statusFilterDropdown || dateRangeStart || dateRangeEnd || targetType?.value !== "SCHOOL";

  // Fetch homework list
  const fetchHomework = async () => {
    if (!auth.userId) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const params = {
        teacher_id: auth.userId,
      };

      // Add optional filters
      if (statusFilterDropdown?.value) {
        params.status = statusFilterDropdown.value;
      }
      if (dateRangeStart) {
        params.start_date = dateRangeStart;
      }
      if (dateRangeEnd) {
        params.end_date = dateRangeEnd;
      }

      const data = await getTeacherHomeworkAll(params);
      // Ensure data is an array - API might return { data: [] } or just []
      const homeworkArray = Array.isArray(data) ? data : (data?.data || []);
      setHomeworkList(homeworkArray);
    } catch (error) {
      console.error("Error fetching homework:", error);
      setLoadError(error.message || "Failed to load homework. Please try again.");
      // Set empty array on error to prevent iteration errors
      setHomeworkList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch homework on component mount and when filters change
  useEffect(() => {
    fetchHomework();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.userId, statusFilterDropdown, dateRangeStart, dateRangeEnd]);

  return (
    <div className="h-screen md:min-h-screen flex flex-col p-4 gap-6">
      {/* Desktop Header with Filters */}
      <Card className="hidden md:block">
        <div className="space-y-4">
          {/* Title and Create Button Row */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">My Homework</h1>

            <Button onClick={handleCreateHomework}>
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
              Create Homework
            </Button>
          </div>

          {/* Search and Filters Row */}
          <div className="grid grid-cols-12 gap-4">
            {/* Search Bar */}
            <div className="col-span-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search homework..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Subject Filter */}
            <div className="col-span-2">
              <Dropdown
                selected={subjectFilter}
                onChange={setSubjectFilter}
                options={subjects}
                placeholder="Subject"
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
            <div className="col-span-1">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Target Selector Row */}
          <div className="grid grid-cols-12 gap-4">
            {/* Target Type */}
            <div className="col-span-3">
              <Dropdown
                label="Target Type"
                selected={targetType}
                onChange={(option) => {
                  setTargetType(option);
                  const targetOption = [
                    { value: "SCHOOL", label: "Entire School" },
                    { value: "CLASS", label: "Class", multiple: false },
                    { value: "SECTION", label: "Section", multiple: false },
                    { value: "STUDENT", label: "Student", multiple: true },
                  ].find((opt) => opt.value === option?.value);
                  setClassId(targetOption?.multiple ? [] : null);
                  setSectionId(targetOption?.multiple ? [] : null);
                  setStudentId(targetOption?.multiple ? [] : null);
                }}
                options={[
                  { value: "SCHOOL", label: "Entire School" },
                  { value: "CLASS", label: "Class" },
                  { value: "SECTION", label: "Section" },
                  { value: "STUDENT", label: "Student" },
                ]}
                placeholder="Select target type"
              />
            </div>

            {/* Class Filter */}
            {targetType?.value !== "SCHOOL" && (
              <div className="col-span-3">
                <Dropdown
                  label="Class"
                  selected={classId}
                  onChange={setClassId}
                  options={classes.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Select class"
                />
              </div>
            )}

            {/* Section Filter */}
            {(targetType?.value === "SECTION" || targetType?.value === "STUDENT") && (
              <div className="col-span-3">
                <Dropdown
                  label="Section"
                  selected={sectionId}
                  onChange={setSectionId}
                  options={sections.map((s) => ({ value: s.value, label: s.label }))}
                  placeholder="Select section"
                />
              </div>
            )}

            {/* Student Filter */}
            {targetType?.value === "STUDENT" && (
              <div className="col-span-3">
                <Dropdown
                  label="Student"
                  selected={studentId}
                  onChange={setStudentId}
                  options={students.map((s) => ({ value: s.id, label: s.name }))}
                  placeholder="Select student"
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Mobile Header */}
      <div className="md:hidden">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search homework..."
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
              className={`relative p-2 rounded-lg border transition-colors ${hasActiveFilters
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
            <p className="mt-4 text-gray-600">Loading homework...</p>
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
                <h3 className="text-lg font-semibold text-gray-900">Error Loading Homework</h3>
                <p className="text-gray-600 mt-2">{loadError}</p>
              </div>
              <Button onClick={fetchHomework}>
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Desktop Listing */}
      {!isLoading && !loadError && (
        <div className="hidden md:block flex-1 overflow-y-auto">
          <DesktopListing
            homeworkList={filteredHomework}
            onEdit={handleEditHomework}
            onPublish={handlePublishHomework}
          />
        </div>
      )}

      {/* Mobile Listing */}
      {!isLoading && !loadError && (
        <div className="md:hidden flex-1 overflow-hidden">
          <MobileListing
            homeworkList={filteredHomework}
            onEdit={handleEditHomework}
            onPublish={handlePublishHomework}
          />
        </div>
      )}

      {/* Floating Action Button (Mobile Only) */}
      <button
        onClick={handleCreateHomework}
        className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 flex items-center justify-center z-40 hover:scale-110 active:scale-95"
        aria-label="Create new homework"
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

      {/* Homework Form Modal */}
      <HomeworkFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitHomework}
        homework={editingHomework}
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
              {/* Subject Filter */}
              <div>
                <Dropdown
                  label="Subject"
                  selected={subjectFilter}
                  onChange={setSubjectFilter}
                  options={subjects}
                  placeholder="Select subject"
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
              {/* <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date From
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
                    Due Date To
                  </label>
                  <input
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div> */}
              <DateRange
                label="Due Date Range"
                startDate={dateRangeStart}
                endDate={dateRangeEnd}
                onStartDateChange={setDateRangeStart}
                onEndDateChange={setDateRangeEnd}
              />
              {/* Target Selector */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Target</h3>
                <TargetSelector
                  targetType={targetType}
                  setTargetType={setTargetType}
                  classId={classId}
                  sectionId={sectionId}
                  studentId={studentId}
                  classes={classes}
                  sections={sections}
                  students={students}
                  setClassId={setClassId}
                  setSectionId={setSectionId}
                  setStudentId={setStudentId}
                  TARGET_OPTIONS={[
                    { value: "SECTION", label: "Section", multiple: true },
                    { value: "STUDENT", label: "Student", multiple: true },
                  ]}
                />
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
      {isPublishModalOpen && homeworkToPublish && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Publish Homework?</h3>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to publish this homework? Students will be able to see and submit it.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900">{homeworkToPublish.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{homeworkToPublish.subject}</p>
                <p className="text-sm text-gray-600">
                  {homeworkToPublish.class} - {homeworkToPublish.section}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Due: {new Date(homeworkToPublish.dueDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <Button 
                variant="secondary" 
                onClick={cancelPublish}
                disabled={isPublishing}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmPublish}
                disabled={isPublishing}
              >
                {isPublishing ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
