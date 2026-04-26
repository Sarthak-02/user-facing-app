import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Modal } from "../../ui-components";
import { usePermissions } from "../../store/permissions.store";
import { useAuth } from "../../store/auth.store";
import {
  listClassPlans,
  deleteClassPlanTopic,
  createClassPlan,
  updateClassPlan,
} from "../../api/lessonPlans.api";
import TopicFormModal from "../../components/lesson-plans/TopicFormModal";
import MasterPlanModal from "../../components/lesson-plans/MasterPlanModal";
import Loader from "../../ui-components/Loader";
import {
  ArrowLeft,
  Plus,
  ChevronDown,
  ChevronRight,
  BookOpen,
  ClipboardList,
  Brain,
  Pencil,
  Trash2,
  Download,
} from "lucide-react";

/** Derive academic year from today's date: April onward starts new year */
function getCurrentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 4) return `${year}-${String(year + 1).slice(-2)}`;
  return `${year - 1}-${String(year).slice(-2)}`;
}

/** Group flat topic list into chapters, sorted by chapter_number then display_order */
function groupTopicsByChapter(topics) {
  const map = new Map();
  for (const t of topics) {
    const key = t.chapter_title || "General";
    if (!map.has(key)) {
      map.set(key, { title: key, number: t.chapter_number ?? null, topics: [] });
    }
    map.get(key).topics.push(t);
  }
  const chapters = Array.from(map.values());
  chapters.sort((a, b) => {
    if (a.number != null && b.number != null) return a.number - b.number;
    if (a.number != null) return -1;
    if (b.number != null) return 1;
    return a.title.localeCompare(b.title);
  });
  for (const ch of chapters) {
    ch.topics.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }
  return chapters;
}

function statusColor(status) {
  switch (status) {
    case "COMPLETED": return "bg-green-100 text-green-700";
    case "IN_PROGRESS": return "bg-blue-100 text-blue-700";
    case "SKIPPED": return "bg-orange-100 text-orange-700";
    default: return "bg-gray-100 text-gray-500";
  }
}

function statusLabel(status) {
  if (!status) return "Pending";
  return String(status).replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function ResourcePill({ icon: Icon, count, color, label }) {
  if (!count) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {count} {label}
    </span>
  );
}

function TopicRow({ topic, classPlanId, sectionId, subjectId, onEdit, onDelete }) {
  const navigate = useNavigate();
  const assignments = topic.assignments ?? [];
  const quizzes = topic.quizzes ?? [];
  const materials = topic.materials ?? topic.study_materials ?? [];

  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-white px-3 py-3 transition-colors hover:bg-gray-50/70">
      <button
        type="button"
        className="flex min-w-0 flex-1 flex-col text-left"
        onClick={() =>
          navigate(
            `/staff/lesson-plans/section/${sectionId}/subject/${subjectId}/plan/${classPlanId}/topic/${topic.id}`
          )
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-gray-900 leading-snug">{topic.title}</p>
          {topic.status && topic.status !== "PENDING" && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(topic.status)}`}>
              {statusLabel(topic.status)}
            </span>
          )}
        </div>
        {topic.scheduled_date && (
          <p className="mt-0.5 text-xs text-gray-400">
            {new Date(topic.scheduled_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        )}
        {(assignments.length > 0 || quizzes.length > 0 || materials.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ResourcePill icon={ClipboardList} count={assignments.length} label={assignments.length === 1 ? "Assignment" : "Assignments"} color="bg-blue-50 text-blue-700" />
            <ResourcePill icon={Brain} count={quizzes.length} label={quizzes.length === 1 ? "Quiz" : "Quizzes"} color="bg-purple-50 text-purple-700" />
            <ResourcePill icon={BookOpen} count={materials.length} label={materials.length === 1 ? "Material" : "Materials"} color="bg-green-50 text-green-700" />
          </div>
        )}
      </button>
      <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(topic); }}
          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Edit topic"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(topic); }}
          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Delete topic"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function ChapterSection({
  chapter,
  expanded,
  onToggle,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  classPlanId,
  sectionId,
  subjectId,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          )}
          <div className="min-w-0 flex-1">
            {chapter.number != null && (
              <p className="text-xs font-medium text-gray-400">Chapter {chapter.number}</p>
            )}
            <p className="font-semibold text-gray-900 leading-snug">{chapter.title}</p>
          </div>
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {chapter.topics.length} {chapter.topics.length === 1 ? "topic" : "topics"}
          </span>
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border bg-gray-50/60 px-4 py-3 space-y-2">
          {chapter.topics.length === 0 ? (
            <p className="py-2 text-center text-sm text-gray-400">No topics in this chapter.</p>
          ) : (
            chapter.topics.map((topic) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                classPlanId={classPlanId}
                sectionId={sectionId}
                subjectId={subjectId}
                onEdit={onEditTopic}
                onDelete={onDeleteTopic}
              />
            ))
          )}
          <button
            type="button"
            onClick={() => onAddTopic(chapter.title, chapter.number)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 transition-colors hover:border-primary-400 hover:text-primary-600"
          >
            <Plus className="h-4 w-4" />
            Add topic to this chapter
          </button>
        </div>
      )}
    </div>
  );
}

export default function StaffLessonPlansBrowse() {
  const { sectionId, subjectId } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { permissions, getSubjectsBySection } = usePermissions();

  const [classPlan, setClassPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [creatingPlan, setCreatingPlan] = useState(false);

  // Topic form
  const [topicFormOpen, setTopicFormOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [prefillChapterTitle, setPrefillChapterTitle] = useState("");
  const [prefillChapterNumber, setPrefillChapterNumber] = useState(null);
  const [lockChapter, setLockChapter] = useState(false);

  // Master plan seed modal
  const [masterPlanOpen, setMasterPlanOpen] = useState(false);

  // Publish
  const [publishing, setPublishing] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const section = (permissions.sections || []).find((s) => s.section_id === sectionId);
  const classId = section?.class_id || "";
  const classObj = (permissions.classes || []).find((c) => c.class_id === classId);
  const className = classObj?.class_name || "";

  const subjectsInSection = useMemo(
    () => (sectionId ? getSubjectsBySection(sectionId) : []),
    [sectionId, getSubjectsBySection, permissions.sections, permissions.teacher_subjects]
  );
  const subjectMeta = subjectsInSection.find((s) => s.subject_id === subjectId);
  const subjectName = subjectMeta?.subject_name || "";
  const headerSubtitle = subjectName || subjectId || "Subject";
  const academicYear = getCurrentAcademicYear();

  const context = useMemo(
    () => ({
      teacherId: permissions.teacher_id,
      campusId: auth.campus_id || "",
      classId,
      className,
      sectionId: sectionId || "",
      subjectId: subjectId || "",
      subjectName,
      academicYear,
    }),
    [permissions.teacher_id, auth.campus_id, classId, className, sectionId, subjectId, subjectName, academicYear]
  );

  const chapters = useMemo(
    () => groupTopicsByChapter(classPlan?.topics ?? []),
    [classPlan]
  );

  const fetchClassPlan = useCallback(async () => {
    if (!permissions.teacher_id || !subjectName) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const plans = await listClassPlans({
        teacher_id: permissions.teacher_id,
        campus_id: auth.campus_id || undefined,
        subject: subjectName,
        class_name: className || undefined,
        academic_year: academicYear,
        limit: 1,
      });
      const plan = plans[0] ?? null;
      setClassPlan(plan);
      if (plan?.topics?.length > 0) {
        const firstChapter = groupTopicsByChapter(plan.topics)[0];
        if (firstChapter) {
          setExpandedChapters((prev) =>
            prev.size === 0 ? new Set([firstChapter.title]) : prev
          );
        }
      }
    } catch (err) {
      console.error(err);
      setLoadError(err?.message || "Failed to load class plan");
    } finally {
      setLoading(false);
    }
  }, [permissions.teacher_id, auth.campus_id, subjectName, className, academicYear]);

  useEffect(() => { fetchClassPlan(); }, [fetchClassPlan]);

  const goBack = () => {
    if (subjectsInSection.length > 1) navigate(`/staff/lesson-plans/section/${sectionId}`);
    else if ((permissions.sections || []).length > 1) navigate("/staff/lesson-plans");
    else navigate("/home");
  };

  const toggleChapter = (title) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const handleAddTopic = (chapterTitle = "", chapterNumber = null) => {
    setEditingTopic(null);
    setPrefillChapterTitle(chapterTitle);
    setPrefillChapterNumber(chapterNumber);
    setLockChapter(!!chapterTitle);
    setTopicFormOpen(true);
    if (chapterTitle) {
      setExpandedChapters((prev) => new Set([...prev, chapterTitle]));
    }
  };

  const handleEditTopic = (topic) => {
    setEditingTopic(topic);
    setPrefillChapterTitle(topic.chapter_title || "");
    setPrefillChapterNumber(topic.chapter_number ?? null);
    setLockChapter(false);
    setTopicFormOpen(true);
  };

  const handleCreateBlankPlan = async () => {
    setCreatingPlan(true);
    try {
      const plan = await createClassPlan({
        campus_id: context.campusId,
        teacher_id: context.teacherId,
        class_name: context.className,
        subject: context.subjectName,
        academic_year: context.academicYear,
        is_published: false,
      });
      setClassPlan(plan);
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingPlan(false);
    }
  };

  const handlePublish = async () => {
    if (!classPlan?.id) return;
    setPublishing(true);
    try {
      await updateClassPlan(classPlan.id, { is_published: true });
      setClassPlan((prev) => ({ ...prev, is_published: true }));
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  const handleTopicSaved = () => {
    setTopicFormOpen(false);
    setEditingTopic(null);
    setPrefillChapterTitle("");
    setPrefillChapterNumber(null);
    setLockChapter(false);
    fetchClassPlan();
  };

  const handleDeleteTopic = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteClassPlanTopic(deleteTarget.id);
      setDeleteTarget(null);
      fetchClassPlan();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  if (!sectionId || !subjectId || !section) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
        <p className="text-sm text-gray-600">Invalid lesson plan route.</p>
        <Button variant="secondary" className="mt-4 w-fit" onClick={() => navigate("/staff/lesson-plans")}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-6">
      <Button variant="ghost" className="mb-4 w-fit gap-2 px-0" onClick={goBack}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{headerSubtitle}</h1>
          <p className="text-sm text-gray-500">
            {className ? `${className} · ` : ""}{academicYear}
          </p>
        </div>
        {classPlan && (
          <div className="flex flex-wrap items-center gap-2">
            {!classPlan.is_published && (
              <Button variant="secondary" loading={publishing} onClick={handlePublish}>
                Publish
              </Button>
            )}
            <Button className="gap-2" onClick={() => handleAddTopic()}>
              <Plus className="h-4 w-4" />
              Add Chapter
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Loader />
        </div>
      ) : loadError ? (
        <p className="mt-6 text-sm text-error-600">{loadError}</p>
      ) : !classPlan ? (
        /* No plan exists yet */
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-700">No class plan yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Start from a master syllabus or create a blank plan.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" className="gap-2" onClick={() => setMasterPlanOpen(true)}>
              <Download className="h-4 w-4" />
              Pull from Master Plan
            </Button>
            <Button className="gap-2" loading={creatingPlan} onClick={handleCreateBlankPlan}>
              <Plus className="h-4 w-4" />
              Create blank plan
            </Button>
          </div>
        </div>
      ) : chapters.length === 0 ? (
        /* Plan exists but no topics */
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-700">No topics added yet</p>
            <p className="mt-1 text-sm text-gray-500">Add your first topic to get started.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button className="gap-2" onClick={() => handleAddTopic()}>
              <Plus className="h-4 w-4" />
              Add Chapter
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto space-y-3 pb-24">
          {chapters.map((chapter) => (
            <ChapterSection
              key={chapter.title}
              chapter={chapter}
              expanded={expandedChapters.has(chapter.title)}
              onToggle={() => toggleChapter(chapter.title)}
              onAddTopic={handleAddTopic}
              onEditTopic={handleEditTopic}
              onDeleteTopic={(t) => setDeleteTarget(t)}
              classPlanId={classPlan.id}
              sectionId={sectionId}
              subjectId={subjectId}
            />
          ))}
        </div>
      )}

      {/* Topic form */}
      <TopicFormModal
        open={topicFormOpen}
        onClose={() => {
          setTopicFormOpen(false);
          setEditingTopic(null);
          setPrefillChapterTitle("");
          setPrefillChapterNumber(null);
          setLockChapter(false);
        }}
        onSaved={handleTopicSaved}
        topic={editingTopic}
        classPlanId={classPlan?.id ?? null}
        prefillChapterTitle={prefillChapterTitle}
        prefillChapterNumber={prefillChapterNumber}
        lockChapter={lockChapter}
        existingTopicsCount={classPlan?.topics?.length ?? 0}
      />

      {/* Master plan seed modal */}
      <MasterPlanModal
        open={masterPlanOpen}
        onClose={() => setMasterPlanOpen(false)}
        onSeeded={(plan) => {
          setClassPlan(plan);
          setMasterPlanOpen(false);
          fetchClassPlan();
        }}
        context={context}
      />

      {/* Delete topic confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="max-w-md">
        <h3 className="text-lg font-semibold text-gray-900">Delete topic?</h3>
        <p className="mt-2 text-sm text-gray-600">
          This will remove the topic and all its attached resources. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDeleteTopic}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
