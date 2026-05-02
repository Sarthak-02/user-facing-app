import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card } from "../../ui-components";
import { usePermissions } from "../../store/permissions.store";
import { useAuth } from "../../store/auth.store";
import { getLessonPlanById } from "../../api/lessonPlans.api";
import LessonPlanFormModal from "../../components/lesson-plans/LessonPlanFormModal";
import { ArrowLeft } from "lucide-react";
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

function lessonPlanStatusDisplay(status, t) {
  if (!status) return "";
  const keys = {
    PLANNED: "lessonPlans.lessonPlanForm.status_planned",
    PARTIALLY_COMPLETED: "lessonPlans.lessonPlanForm.status_partiallyCompleted",
    COMPLETED: "lessonPlans.lessonPlanForm.status_completed",
    SKIPPED: "lessonPlans.lessonPlanForm.status_skipped",
  };
  if (keys[status]) return t(keys[status]);
  return String(status).replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function teacherDisplayName(teacher) {
  if (!teacher || typeof teacher !== "object") return "";
  const parts = [
    teacher.teacher_first_name,
    teacher.teacher_middle_name,
    teacher.teacher_last_name,
  ].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return teacher.teacher_employee_code || teacher.teacher_id || "";
}

function classSectionLabel(p) {
  const c = p.class_name ?? p.class?.class_name;
  const s = p.section_name ?? p.section?.section_name;
  if (c && s) return `${c} · ${s}`;
  return s || c || "";
}

export default function StaffLessonPlanDetail() {
  const { t } = useTranslation();
  const { sectionId, subjectId, planId } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { permissions } = usePermissions();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const section = (permissions.sections || []).find((s) => s.section_id === sectionId);
  const classId = section?.class_id || "";

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

  const load = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLessonPlanById(planId);
      setPlan(data);
    } catch (err) {
      console.error(err);
      setError(err?.message || err?.error || t("staffLessonPlanDetail.loadFailed"));
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [planId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const goBack = () => {
    navigate(`/staff/lesson-plans/section/${sectionId}/subject/${subjectId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
        <Button variant="ghost" className="mb-4 w-fit gap-2 px-0" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Button>
        <p className="text-sm text-error-600">{error || t("staffLessonPlanDetail.notFound")}</p>
      </div>
    );
  }

  const objectives = plan.learning_objectives || [];
  const activities = plan.activities || [];
  const attachments = plan.attachments || plan.lesson_plan_attachments || [];
  const classSection = classSectionLabel(plan);
  const teacherName = teacherDisplayName(plan.teacher);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6 ">
      <Button variant="ghost" className="mb-4 w-fit gap-2 px-0" onClick={goBack}>
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {plan.chapter_topic ?? plan.chapterTopic ?? t("staffLessonPlanDetail.lessonPlanFallback")}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {formatDate(plan.lesson_date ?? plan.lessonDate)}
          </p>
          {(plan.subject_name || classSection || teacherName) ? (
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
              {plan.subject_name ? <span>{plan.subject_name}</span> : null}
              {classSection ? <span>{classSection}</span> : null}
              {teacherName ? <span>{t("staffLessonPlanDetail.teacherPrefix", { name: teacherName })}</span> : null}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={statusVariant(plan.status)}>
            {lessonPlanStatusDisplay(plan.status, t)}
          </Badge>
          <Button onClick={() => setFormOpen(true)}>{t("common.edit")}</Button>
        </div>
      </div>

      {plan.description ? (
        <Card className="mt-6" title={t("staffLessonPlanDetail.description")}>
          <p className="whitespace-pre-wrap text-sm text-gray-800">{plan.description}</p>
        </Card>
      ) : null}

      <Card className={plan.description ? "mt-4" : "mt-6"} title={t("staffLessonPlanDetail.learningObjectives")}>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-800">
          {objectives.length ? (
            objectives.map((o, i) => <li key={i}>{o}</li>)
          ) : (
            <li className="list-none pl-0 text-gray-500">{t("staffLessonPlanDetail.noneListed")}</li>
          )}
        </ol>
      </Card>

      <Card className="mt-4" title={t("staffLessonPlanDetail.activities")}>
        <ul className="space-y-3 text-sm text-gray-800">
          {activities.length ? (
            activities.map((a, i) => (
              <li key={i} className="rounded-lg border border-border bg-surface/40 p-3">
                <p className="font-medium capitalize">{a.type || t("staffLessonPlanDetail.activityFallback")}</p>
                {(a.duration_minutes != null || a.durationMinutes != null) && (
                  <p className="mt-1 text-xs text-gray-600">
                    {t("staffLessonPlanDetail.minutes", { count: a.duration_minutes ?? a.durationMinutes })}
                  </p>
                )}
                {a.description && <p className="mt-2 text-gray-700">{a.description}</p>}
              </li>
            ))
          ) : (
            <li className="text-gray-500">{t("staffLessonPlanDetail.noneListed")}</li>
          )}
        </ul>
      </Card>

      {plan.homework ? (
        <Card className="mt-4" title={t("staffLessonPlanDetail.homework")}>
          <p className="whitespace-pre-wrap text-sm text-gray-800">{plan.homework}</p>
        </Card>
      ) : null}

      {attachments.length > 0 ? (
        <Card className="mt-4" title={t("staffLessonPlanDetail.attachments")}>
          <ul className="space-y-2 text-sm">
            {attachments.map((a, i) => {
              const url = a.fileUrl || a.file_url;
              const name = a.fileName || a.file_name || t("staffLessonPlanDetail.attachmentFallback", { index: i + 1 });
              return (
                <li key={a.attachment_id || a.id || i}>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      {name}
                    </a>
                  ) : (
                    <span>{name}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      <LessonPlanFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          load();
        }}
        onSaved={load}
        plan={plan}
        context={context}
      />
    </div>
  );
}
