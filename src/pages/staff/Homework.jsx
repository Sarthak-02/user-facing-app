import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, Button } from "../../ui-components";
import DesktopListing from "../../components/staff-homework/DesktopListing";
import MobileListing from "../../components/staff-homework/MobileListing";
import HomeworkFormModal from "../../components/staff-homework/HomeworkFormModal";
import { createHomework, getHomeworkDetail, getTeacherHomeworkAll, generateHomeworkAttachmentSignedUrl } from "../../api/homework.api";
import { useAuth } from "../../store/auth.store";
import { usePermissions } from "../../store/permissions.store";
import { ArrowLeft } from "lucide-react";
import { StaffHomeworkListingShimmer } from "../../ui-components/Shimmer";

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
  const { t, i18n } = useTranslation();
  const statusFilterOptions = useMemo(
    () => [
      { value: "", label: t("staffHomework.filterAll") },
      { value: "DRAFT", label: t("staffHomework.filterDraft") },
      { value: "PUBLISHED", label: t("staffHomework.filterPublished") },
    ],
    [t]
  );
  const { auth } = useAuth();
  const { sectionId, subjectId: subjectIdParam, studentId: studentIdParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const subjectIdKey = subjectIdParam || "";
  const studentIdKey = studentIdParam || "";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);

  // Publish confirmation modal
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [homeworkToPublish, setHomeworkToPublish] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");


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

  const filteredHomework = useMemo(() => {
    let filtered = [...scopedHomework];

    if (statusFilter) {
      filtered = filtered.filter((hw) => hw.status === statusFilter);
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return filtered;
  }, [scopedHomework, statusFilter]);

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

        // Upload new files (those with _file), keep already-uploaded ones as-is
        const attachments = await Promise.all(
          homeworkData.attachments.map(async (file) => {
            if (file._file) {
              const publicUrl = await generateHomeworkAttachmentSignedUrl({
                file: file._file,
                file_name: file.name,
                mime_type: file.type,
              });
              return { fileName: file.name, fileType: file.type, fileSize: file.size, fileUrl: publicUrl };
            }
            return { fileName: file.name, fileType: file.type, fileSize: file.size, fileUrl: file.fileUrl ?? "" };
          })
        );

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

        // Upload new files (those with _file), keep already-uploaded ones as-is
        const attachments = await Promise.all(
          homeworkData.attachments.map(async (file) => {
            if (file._file) {
              const publicUrl = await generateHomeworkAttachmentSignedUrl({
                file: file._file,
                file_name: file.name,
                mime_type: file.type,
              });
              return { fileName: file.name, fileType: file.type, fileSize: file.size, fileUrl: publicUrl };
            }
            return { fileName: file.name, fileType: file.type, fileSize: file.size, fileUrl: file.fileUrl ?? "" };
          })
        );

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
      setSubmitError(
        error.message ||
          (editingHomework ? t("staffHomework.saveFailedUpdate") : t("staffHomework.saveFailedCreate")),
      );
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
      alert(
        t("staffHomework.publishFailed", {
          reason: error.message || t("common.tryAgain"),
        }),
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const cancelPublish = () => {
    setIsPublishModalOpen(false);
    setHomeworkToPublish(null);
  };

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

      const data = await getTeacherHomeworkAll(params);
      // Ensure data is an array - API might return { data: [] } or just []
      const homeworkArray = Array.isArray(data) ? data : (data?.data || []);
      setHomeworkList(homeworkArray);
    } catch (error) {
      console.error("Error fetching homework:", error);
      setLoadError(error.message || t("staffHomework.loadListFailed"));
      // Set empty array on error to prevent iteration errors
      setHomeworkList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHomework();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.userId]);


  const listFromPath = location.pathname;

  const routeInvalid =
    !sectionId ||
    !subjectIdKey ||
    !section ||
    (subjectsInSection.length > 0 && !subjectMeta) ||
    (!!studentIdKey && !studentRecord);

  if (routeInvalid) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pb-nav md:p-6">
        <p className="text-sm text-gray-600">{t("staffHomework.invalidRoute")}</p>
        <Button variant="secondary" className="mt-4 w-fit" onClick={() => navigate("/staff/homework")}>
          {t("common.back")}
        </Button>
      </div>
    );
  }

  const headerSubtitle = subjectMeta?.subject_name || subjectIdKey || t("staffHomework.subjectFallback");
  const studentLine = studentIdKey
    ? (studentRecord?.student_name || studentIdKey)
    : sectionTitle;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-2 md:pt-3">
      <div className="relative flex shrink-0 flex-col items-center justify-center py-0.5">
        <Button
          variant="ghost"
          className="absolute left-0 top-1/2 h-8 min-h-0 -translate-y-1/2 gap-1.5 px-0 py-0"
          onClick={goBack}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Button>
        <div className="mx-10 max-w-[min(100%,calc(100%-5.5rem))] text-center md:mx-14">
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
            <span className="block truncate">{headerSubtitle}</span>
          </h1>
          <p className="mt-0.5 truncate text-sm text-gray-600">{studentLine}</p>
        </div>
      </div>

      {/* Desktop Header with Filters */}
      <Card className="hidden md:block !py-3 !px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            {statusFilterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  statusFilter === opt.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-400 whitespace-nowrap">
              {t("staffHomework.items", { count: filteredHomework.length })}
            </span>
            <Button onClick={handleCreateHomework}>{t("staffHomework.createShort")}</Button>
          </div>
        </div>
      </Card>

      {/* Mobile Header */}
      <div className="md:hidden">
        <Card className="!p-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg flex-1">
              {statusFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === opt.value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
              {filteredHomework.length}
            </span>
          </div>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && <StaffHomeworkListingShimmer />}

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
                <h3 className="text-lg font-semibold text-gray-900">{t("staffHomework.errorLoadingTitle")}</h3>
                <p className="text-gray-600 mt-2">{loadError}</p>
              </div>
              <Button onClick={fetchHomework}>
                {t("common.tryAgain")}
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
            className="pb-28"
          />
        </div>
      )}

      {/* Floating Action Button (Mobile Only) */}
      <button
        type="button"
        onClick={handleCreateHomework}
        className="md:hidden fixed bottom-20 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-blue-600 active:scale-95 active:bg-blue-700"
        aria-label={t("ui.createNewHomework")}
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


      {/* Publish Confirmation Modal */}
      {isPublishModalOpen && homeworkToPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">{t("staffHomework.publishModalTitle")}</h3>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700">{t("staffHomework.publishModalBody")}</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900">{homeworkToPublish.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{homeworkToPublish.subject}</p>
                <p className="text-sm text-gray-600">
                  {homeworkToPublish.class} - {homeworkToPublish.section}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {t("common.due", {
                    date: new Date(homeworkToPublish.dueDate).toLocaleDateString(i18n.language || undefined, {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }),
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
                {t("common.cancel")}
              </Button>
              <Button
                onClick={confirmPublish}
                disabled={isPublishing}
              >
                {isPublishing ? t("staffHomework.publishing") : t("common.publish")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
