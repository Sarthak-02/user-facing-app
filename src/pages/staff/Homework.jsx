import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, Button, DateRange } from "../../ui-components";
import DesktopListing from "../../components/staff-homework/DesktopListing";
import MobileListing from "../../components/staff-homework/MobileListing";
import HomeworkFormModal from "../../components/staff-homework/HomeworkFormModal";
import Dropdown from "../../ui-components/Dropdown";
import { createHomework, getHomeworkDetail, getTeacherHomeworkAll } from "../../api/homework.api";
import { useAuth } from "../../store/auth.store";
import { usePermissions } from "../../store/permissions.store";
import { ArrowLeft } from "lucide-react";

function homeworkAppliesToSection(homework, sectionId, sectionRecord, permissions) {
  if (!sectionId || !sectionRecord) return false;
  const targets = homework.targets || [];
  if (targets.length === 0) {
    const cls = (permissions.classes || []).find((c) => c.class_id === sectionRecord.class_id);
    const className = homework.className || homework.class_name;
    const sectionName = homework.section || homework.section_name;
    if (sectionName && sectionName === sectionRecord.section_name) {
      if (!className || !cls || className === cls.class_name) return true;
    }
    return false;
  }
  for (const t of targets) {
    const type = String(t.target_type || t.targetType || "").toUpperCase();
    const tid = t.target_id || t.targetId || "";
    if (type === "SECTION" && tid === sectionId) return true;
    if (type === "CLASS" && tid === sectionRecord.class_id) return true;
    if (type === "STUDENT") {
      const st = (permissions.students || []).find((s) => s.student_id === tid);
      if (st?.section_id === sectionId) return true;
    }
  }
  return false;
}

function homeworkMatchesSubject(homework, subjectIdKey, subjectDisplayName) {
  const subj = homework.subject || "";
  const hid = homework.subject_id || homework.subjectId;
  if (subjectIdKey && (subj === subjectIdKey || hid === subjectIdKey)) return true;
  if (subjectDisplayName && subj === subjectDisplayName) return true;
  return false;
}

function homeworkAppliesToStudent(homework, studentId, sectionId, sectionRecord) {
  if (!studentId) return true;
  const targets = homework.targets || [];
  if (targets.length === 0) return true;
  let hasStudentTarget = false;
  let matchedStudent = false;
  let appliesSectionOrClass = false;
  for (const t of targets) {
    const type = String(t.target_type || t.targetType || "").toUpperCase();
    const tid = t.target_id || t.targetId || "";
    if (type === "STUDENT") {
      hasStudentTarget = true;
      if (tid === studentId) matchedStudent = true;
    } else if (type === "SECTION" && tid === sectionId) {
      appliesSectionOrClass = true;
    } else if (type === "CLASS" && sectionRecord && tid === sectionRecord.class_id) {
      appliesSectionOrClass = true;
    }
  }
  if (hasStudentTarget) return matchedStudent || appliesSectionOrClass;
  return appliesSectionOrClass;
}

export default function TeacherHomework() {
  const { auth } = useAuth();
  const { sectionId, subjectId: subjectIdParam, studentId: studentIdParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const subjectIdKey = subjectIdParam || "";
  const studentIdKey = studentIdParam || "";
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
  
  // Temporary filter states (for user selection before apply)
  const [tempStatusFilterDropdown, setTempStatusFilterDropdown] = useState(null);
  const [tempDateRangeStart, setTempDateRangeStart] = useState("");
  const [tempDateRangeEnd, setTempDateRangeEnd] = useState("");
  
  // Active filter states (actually applied filters)
  const [statusFilterDropdown, setStatusFilterDropdown] = useState(null);
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");


  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Homework data states
  const [homeworkList, setHomeworkList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const { permissions, getSubjectsBySection, getStudentsBySection } = usePermissions();

  const section = useMemo(
    () => (permissions.sections || []).find((s) => s.section_id === sectionId),
    [permissions.sections, sectionId]
  );

  const subjectsInSection = useMemo(
    () => (sectionId ? getSubjectsBySection(sectionId) : null) || [],
    [sectionId, getSubjectsBySection, permissions.sections, permissions.teacher_subjects]
  );

  const subjectMeta = useMemo(
    () => subjectsInSection.find((s) => s.subject_id === subjectIdKey),
    [subjectsInSection, subjectIdKey]
  );

  const studentsInSection = useMemo(
    () => (sectionId ? getStudentsBySection(sectionId) : null) || [],
    [sectionId, getStudentsBySection, permissions.students]
  );

  const studentRecord = useMemo(
    () => studentsInSection.find((s) => s.student_id === studentIdKey),
    [studentsInSection, studentIdKey]
  );

  const sectionTitle = useMemo(() => {
    if (!section) return "";
    const cls = (permissions.classes || []).find((c) => c.class_id === section.class_id);
    return cls ? `${cls.class_name} · ${section.section_name}` : section.section_name;
  }, [section, permissions.classes]);

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "DRAFT", label: "Draft" },
    { value: "PUBLISHED", label: "Published" },
  ];

  const sectionSubjectHomework = useMemo(() => {
    if (!sectionId || !subjectIdKey || !section) return [];
    return homeworkList.filter(
      (hw) =>
        homeworkAppliesToSection(hw, sectionId, section, permissions) &&
        homeworkMatchesSubject(hw, subjectIdKey, subjectMeta?.subject_name)
    );
  }, [homeworkList, sectionId, subjectIdKey, section, permissions, subjectMeta]);

  const scopedHomework = useMemo(() => {
    if (!studentIdKey) return sectionSubjectHomework;
    return sectionSubjectHomework.filter((hw) =>
      homeworkAppliesToStudent(hw, studentIdKey, sectionId, section)
    );
  }, [sectionSubjectHomework, studentIdKey, sectionId, section]);

  // Filter homework based on status and mobile filters
  const filteredHomework = useMemo(() => {
    let filtered = [...scopedHomework];

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
        (hw.title || "").toLowerCase().includes(query) ||
        (hw.description || "").toLowerCase().includes(query) ||
        (hw.subject || "").toLowerCase().includes(query)
      );
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

    // Sort by due date (earliest first)
    filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return filtered;
  }, [scopedHomework, statusFilter, searchQuery, statusFilterDropdown, dateRangeStart, dateRangeEnd]);

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
        if (homeworkData.targetType?.value === "CLASS" && homeworkData.classId?.value) {
          targets.push({
            targetType: "CLASS",
            targetId: homeworkData.classId.value
          });
        } else if (homeworkData.targetType?.value === "SECTION" && homeworkData.sectionId?.value) {
          targets.push({
            targetType: "SECTION",
            targetId: homeworkData.sectionId.value
          });
        } else if (homeworkData.targetType?.value === "STUDENT" && Array.isArray(homeworkData.studentId) && homeworkData.studentId.length > 0) {
          // Handle multiple students - studentId is an array of objects
          homeworkData.studentId.forEach(student => {
            targets.push({
              targetType: "STUDENT",
              targetId: student.value
            });
          });
        }

        // Transform attachments (File objects to attachment metadata)
        const attachments = homeworkData.attachments.map(file => ({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: file?.fileUrl ?? ""
        }));

        // Prepare API payload for update
        const payload = {
          title: homeworkData.title,
          description: homeworkData.description,
          due_date: new Date(homeworkData.dueDate).toISOString(),
          subject: homeworkData.subject?.value,
          teacher_id: auth.userId,
          targets: targets,
          publish: homeworkData.status === "PUBLISHED",
          attachments: attachments
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
        if (homeworkData.targetType?.value === "CLASS" && homeworkData.classId?.value) {
          targets.push({
            targetType: "CLASS",
            targetId: homeworkData.classId.value
          });
        } else if (homeworkData.targetType?.value === "SECTION" && homeworkData.sectionId?.value) {
          targets.push({
            targetType: "SECTION",
            targetId: homeworkData.sectionId.value
          });
        } else if (homeworkData.targetType?.value === "STUDENT" && Array.isArray(homeworkData.studentId) && homeworkData.studentId.length > 0) {
          // Handle multiple students - studentId is an array of objects
          homeworkData.studentId.forEach(student => {
            targets.push({
              targetType: "STUDENT",
              targetId: student.value
            });
          });
        }

        // Transform attachments (File objects to attachment metadata)
        // Note: Files should be uploaded first to get URLs
        const attachments = homeworkData.attachments.map(file => ({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: file?.fileUrl 
        }));

        // Prepare API payload
        const payload = {
          title: homeworkData.title,
          description: homeworkData.description,
          due_date: new Date(homeworkData.dueDate).toISOString(),
          subject: homeworkData.subject?.value,
          teacher_id: auth.userId,
          targets: targets,
          publish: homeworkData.status === "PUBLISHED",
          attachments: attachments
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
    // Copy temporary filter states to active filter states
    setStatusFilterDropdown(tempStatusFilterDropdown);
    setDateRangeStart(tempDateRangeStart);
    setDateRangeEnd(tempDateRangeEnd);
    setIsFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    // Clear both temporary and active filters
    setSearchQuery("");
    setTempStatusFilterDropdown(null);
    setTempDateRangeStart("");
    setTempDateRangeEnd("");
    setStatusFilterDropdown(null);
    setDateRangeStart("");
    setDateRangeEnd("");
  };

  const hasActiveFilters = searchQuery || statusFilterDropdown || dateRangeStart || dateRangeEnd;

  const subjectPathEnc = encodeURIComponent(subjectIdKey);

  const goBack = () => {
    if (studentIdKey) {
      navigate(`/staff/homework/section/${sectionId}/subject/${subjectPathEnc}`);
    } else {
      navigate(`/staff/homework/section/${sectionId}`);
    }
  };

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

  // Sync temporary filters with active filters when modal opens
  useEffect(() => {
    if (isFilterModalOpen) {
      setTempStatusFilterDropdown(statusFilterDropdown);
      setTempDateRangeStart(dateRangeStart);
      setTempDateRangeEnd(dateRangeEnd);
    }
  }, [isFilterModalOpen, statusFilterDropdown, dateRangeStart, dateRangeEnd]);

  const listFromPath = location.pathname;

  const routeInvalid =
    !sectionId ||
    !subjectIdKey ||
    !section ||
    (subjectsInSection.length > 0 && !subjectMeta) ||
    (!!studentIdKey && !studentRecord);

  if (routeInvalid) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
        <p className="text-sm text-gray-600">Invalid homework route.</p>
        <Button variant="secondary" className="mt-4 w-fit" onClick={() => navigate("/staff/homework")}>
          Back
        </Button>
      </div>
    );
  }

  const headerSubtitle = subjectMeta?.subject_name || subjectIdKey || "Subject";
  const studentLine = studentIdKey
    ? (studentRecord?.student_name || studentIdKey)
    : sectionTitle;

  return (
    <div className="h-screen md:min-h-screen flex flex-col gap-3 px-4 pb-4 pt-2 md:pt-3">
      <div className="relative flex shrink-0 flex-col items-center justify-center py-0.5">
        <Button
          variant="ghost"
          className="absolute left-0 top-1/2 h-8 min-h-0 -translate-y-1/2 gap-1.5 px-0 py-0"
          onClick={goBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="mx-10 max-w-[min(100%,calc(100%-5.5rem))] text-center md:mx-14">
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
            <span className="block truncate">{headerSubtitle}</span>
          </h1>
          <p className="mt-0.5 truncate text-sm text-gray-600">{studentLine}</p>
        </div>
      </div>

      {/* Desktop Header with Filters */}
      <Card className="hidden md:block">
        <div className="space-y-4">
          {/* Search and Filters Row */}
          <div className="grid grid-cols-12 gap-4">
            {/* Search Bar */}
            <div className="col-span-4">
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

            {/* Status Filter */}
            <div className="col-span-2">
              <Dropdown
                selected={tempStatusFilterDropdown}
                onChange={setTempStatusFilterDropdown}
                options={statusOptions}
                placeholder="Status"
              />
            </div>

            {/* Date Range Start */}
            <div className="col-span-2">
              <input
                type="date"
                value={tempDateRangeStart}
                onChange={(e) => setTempDateRangeStart(e.target.value)}
                placeholder="From Date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Range End */}
            <div className="col-span-2">
              <input
                type="date"
                value={tempDateRangeEnd}
                onChange={(e) => setTempDateRangeEnd(e.target.value)}
                placeholder="To Date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Apply Filter */}
            <div className="col-span-1 flex gap-2">
              <button
                onClick={handleApplyFilters}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                title="Apply Filters"
              >
                Apply
              </button>
            </div>

            {/* Create Homework Button */}
            <div className="col-span-1 flex">
              <Button onClick={handleCreateHomework} className="w-full whitespace-nowrap">
                + Create
              </Button>
            </div>
          </div>

          {/* Clear Filters Row */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Clear All Filters
              </button>
            </div>
          )}

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
            listFromPath={listFromPath}
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
            listFromPath={listFromPath}
          />
        </div>
      )}

      {/* Floating Action Button (Mobile Only) */}
      <button
        type="button"
        onClick={handleCreateHomework}
        className="md:hidden fixed bottom-20 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-blue-600 active:scale-95 active:bg-blue-700"
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
        defaultSectionId={sectionId}
        defaultSubjectKey={subjectIdKey}
        defaultStudentId={studentIdKey}
      />

      {/* Filter Modal (Mobile Only) */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden">
          <div className="bg-white w-full rounded-t-2xl max-h-[90vh] flex flex-col animate-slide-up shadow-2xl">
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
              {/* Status Filter */}
              <div>
                <Dropdown
                  label="Status"
                  selected={tempStatusFilterDropdown}
                  onChange={setTempStatusFilterDropdown}
                  options={statusOptions}
                  placeholder="Select status"
                 
                />
              </div>

              <DateRange
                label="Due Date Range"
                startDate={tempDateRangeStart}
                endDate={tempDateRangeEnd}
                onStartDateChange={setTempDateRangeStart}
                onEndDateChange={setTempDateRangeEnd}
              />

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
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
