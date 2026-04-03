import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, Modal } from "../../ui-components";
import { usePermissions } from "../../store/permissions.store";
import { useAuth } from "../../store/auth.store";
import {
  deleteLessonPlan,
  listLessonPlans,
  normalizeLessonPlanList,
} from "../../api/lessonPlans.api";
import LessonPlanFormModal from "../../components/lesson-plans/LessonPlanFormModal";
import { ArrowLeft, Plus } from "lucide-react";
import Loader from "../../ui-components/Loader";

function formatDate(d) {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return String(d);
  return x.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function statusVariant(status) {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "SKIPPED":
      return "warning";
    case "PARTIALLY_COMPLETED":
      return "warning";
    default:
      return "info";
  }
}

function statusLabel(status) {
  if (!status) return "";
  return String(status).replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export default function StaffLessonPlansBrowse() {
  const { sectionId, subjectId } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { permissions, getSubjectsBySection } = usePermissions();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const section = (permissions.sections || []).find((s) => s.section_id === sectionId);

  const classId = section?.class_id || "";

  const subjectsInSection = useMemo(
    () => (sectionId ? getSubjectsBySection(sectionId) : []),
    [sectionId, getSubjectsBySection, permissions.sections, permissions.teacher_subjects]
  );

  const subjectMeta = subjectsInSection.find((s) => s.subject_id === subjectId);
  console.log("subjectMeta",subjectMeta);
  console.log("subjectsInSection",subjectsInSection);
  const fetchPlans = useCallback(async () => {
    if (!permissions.teacher_id || !subjectId || !classId) {
      setPlans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const raw = await listLessonPlans({
        teacher_id: permissions.teacher_id,
        campus_id: auth.campus_id || undefined,
        subject_id: subjectId,
        class_id: classId,
        section_id: sectionId,
        limit: 200,
      });
      const list = normalizeLessonPlanList(raw);
      list.sort((a, b) => {
        const da = new Date(a.lesson_date || 0).getTime();
        const db = new Date(b.lesson_date || 0).getTime();
        return db - da;
      });
      setPlans(list);
    } catch (err) {
      console.error(err);
      setLoadError(err?.message || err?.error || "Failed to load lesson plans");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [
    permissions.teacher_id,
    subjectId,
    classId,
    sectionId,
    auth.campus_id,
  ]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const goBack = () => {
    if (subjectsInSection.length > 1) {
      navigate(`/staff/lesson-plans/section/${sectionId}`);
    } else if ((permissions.sections || []).length > 1) {
      navigate("/staff/lesson-plans");
    } else {
      navigate("/home");
    }
  };

  const context = useMemo(
    () => ({
      teacherId: permissions.teacher_id,
      campusId: auth.campus_id || "",
      classId,
      sectionId: sectionId || "",
      subjectId: subjectId || "",
    }),
    [permissions.teacher_id, auth.campus_id, classId, sectionId, subjectId]
  );

  const headerSubtitle = subjectMeta?.subject_name || subjectId || "Subject";

  const handleDelete = async () => {
    const id = deleteTarget?.lesson_plan_id || deleteTarget?.id;
    if (!id) return;
    setDeleting(true);
    try {
      await deleteLessonPlan(id);
      setDeleteTarget(null);
      fetchPlans();
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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
      <Button variant="ghost" className="mb-4 w-fit gap-2 px-0" onClick={goBack}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{headerSubtitle}</h1>
          <p className="text-sm text-gray-600">Planned lessons for this subject</p>
        </div>
        <Button
          className="shrink-0 gap-2"
          onClick={() => {
            setEditingPlan(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New plan
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Loader />
        </div>
      ) : loadError ? (
        <p className="mt-6 text-sm text-error-600">{loadError}</p>
      ) : plans.length === 0 ? (
        <p className="mt-8 text-center text-sm text-gray-600">No lesson plans yet. Create one to get started.</p>
      ) : (
        <div className="mt-6 space-y-2">
          {plans.map((p) => {
            const id = p.lesson_plan_id || p.id;
            return (
              <Card key={id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() =>
                      navigate(`/staff/lesson-plans/section/${sectionId}/subject/${subjectId}/plan/${id}`)
                    }
                  >
                    <p className="font-medium text-gray-900">{p.chapter_topic || "Untitled"}</p>
                    <p className="mt-1 text-sm text-gray-600">{formatDate(p.lesson_date)}</p>
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
                    <Button
                      variant="secondary"
                      className="text-sm"
                      onClick={() => {
                        setEditingPlan(p);
                        setFormOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="danger" className="text-sm" onClick={() => setDeleteTarget(p)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <LessonPlanFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingPlan(null);
          fetchPlans();
        }}
        onSaved={fetchPlans}
        plan={editingPlan}
        context={context}
      />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="max-w-md">
        <h3 className="text-lg font-semibold text-gray-900">Delete lesson plan?</h3>
        <p className="mt-2 text-sm text-gray-600">This cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
