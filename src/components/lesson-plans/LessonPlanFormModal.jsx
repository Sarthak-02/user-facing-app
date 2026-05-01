import { useEffect, useState } from "react";
import { Button, Input, Textarea, Modal, Dropdown } from "../../ui-components";
import {
  createLessonPlan,
  updateLessonPlan,
  uploadLessonPlanFile,
  addLessonPlanAttachments,
  removeLessonPlanAttachment,
} from "../../api/lessonPlans.api";
import { Plus, Trash2, Paperclip } from "lucide-react";
import { useTranslation } from "react-i18next";

function toDateInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onSaved: () => void,
 *   plan: object | null,
 *   context: { teacherId: string, campusId: string, classId: string, sectionId: string, subjectId: string },
 * }} props
 */
export default function LessonPlanFormModal({ open, onClose, onSaved, plan, context }) {
  const { t } = useTranslation();
  const isEdit = !!plan;
  const planId = plan?.lesson_plan_id || plan?.id;

  const [lessonDate, setLessonDate] = useState("");
  const [chapterTopic, setChapterTopic] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState([""]);
  const [activities, setActivities] = useState([
    { type: "lecture", description: "", duration_minutes: "" },
  ]);
  const [homework, setHomework] = useState("");
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (plan) {
      setLessonDate(toDateInputValue(plan.lesson_date ?? plan.lessonDate));
      setChapterTopic(plan.chapter_topic ?? plan.chapterTopic ?? "");
      setDescription(plan.description ?? "");
      const objs = plan.learning_objectives ?? plan.learningObjectives;
      setObjectives(Array.isArray(objs) && objs.length ? [...objs] : [""]);
      const acts = plan.activities;
      setActivities(
        Array.isArray(acts) && acts.length
          ? acts.map((a) => ({
              type: a.type || "lecture",
              description: a.description || "",
              duration_minutes:
                a.duration_minutes !== undefined && a.duration_minutes !== null
                  ? String(a.duration_minutes)
                  : a.durationMinutes !== undefined && a.durationMinutes !== null
                    ? String(a.durationMinutes)
                    : "",
            }))
          : [{ type: "lecture", description: "", duration_minutes: "" }]
      );
      setHomework(plan.homework ?? "");
      const st = plan.status || "PLANNED";
      setStatus(STATUS_OPTIONS.find((o) => o.value === st) || STATUS_OPTIONS[0]);
      const att = plan.attachments || plan.lesson_plan_attachments;
      setExistingAttachments(Array.isArray(att) ? [...att] : []);
      setPendingFiles([]);
    } else {
      setLessonDate(toDateInputValue(new Date().toISOString()));
      setChapterTopic("");
      setDescription("");
      setObjectives([""]);
      setActivities([{ type: "lecture", description: "", duration_minutes: "" }]);
      setHomework("");
      setStatus(STATUS_OPTIONS[0]);
      setExistingAttachments([]);
      setPendingFiles([]);
    }
    setError("");
  }, [open, plan]);

  const addObjective = () => setObjectives((prev) => [...prev, ""]);
  const removeObjective = (i) =>
    setObjectives((prev) => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== i)));
  const setObjective = (i, v) =>
    setObjectives((prev) => prev.map((x, j) => (j === i ? v : x)));

  const addActivity = () =>
    setActivities((prev) => [...prev, { type: "discussion", description: "", duration_minutes: "" }]);
  const removeActivity = (i) =>
    setActivities((prev) => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== i)));
  const patchActivity = (i, patch) =>
    setActivities((prev) => prev.map((a, j) => (j === i ? { ...a, ...patch } : a)));

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setError("");
    const newEntries = files.map((file) => ({ _file: file, name: file.name, type: file.type, size: file.size }));
    setPendingFiles((prev) => [...prev, ...newEntries]);
  };

  const removePending = (i) =>
    setPendingFiles((prev) => prev.filter((_, j) => j !== i));

  const removeExisting = async (attachment) => {
    const aid = attachment.attachment_id || attachment.id;
    if (!aid) {
      setExistingAttachments((prev) => prev.filter((x) => x !== attachment));
      return;
    }
    try {
      await removeLessonPlanAttachment(aid);
      setExistingAttachments((prev) => prev.filter((x) => (x.attachment_id || x.id) !== aid));
    } catch (err) {
      console.error(err);
      setError(err?.message || t("lessonPlans.lessonPlanForm.errorRemoveAttachment"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const learning_objectives = objectives.map((s) => s.trim()).filter(Boolean);
    if (!learning_objectives.length) {
      setError(t("lessonPlans.lessonPlanForm.errorObjectiveRequired"));
      return;
    }
    if (!chapterTopic.trim()) {
      setError(t("lessonPlans.lessonPlanForm.errorChapterRequired"));
      return;
    }
    if (!lessonDate) {
      setError(t("lessonPlans.lessonPlanForm.errorDateRequired"));
      return;
    }

    const activitiesPayload = activities
      .filter((a) => a.type?.trim())
      .map((a) => ({
        type: a.type.trim(),
        ...(a.description?.trim() ? { description: a.description.trim() } : {}),
        ...(a.duration_minutes !== "" && a.duration_minutes != null
          ? { duration_minutes: Math.max(0, parseInt(String(a.duration_minutes), 10) || 0) }
          : {}),
      }));

    if (!activitiesPayload.length) {
      setError(t("lessonPlans.lessonPlanForm.errorActivityRequired"));
      return;
    }

    setSubmitting(true);
    try {
      // Upload pending files now and collect their metadata
      const uploadedAttachments = pendingFiles.length
        ? await Promise.all(pendingFiles.map((f) => uploadLessonPlanFile(f._file)))
        : [];

      if (isEdit && planId) {
        await updateLessonPlan(planId, {
          lesson_date: lessonDate,
          chapter_topic: chapterTopic.trim(),
          ...(description.trim() ? { description: description.trim() } : { description: null }),
          learning_objectives,
          activities: activitiesPayload,
          homework: homework.trim() || null,
          status: status.value,
          subject_id: context.subjectId,
          class_id: context.classId,
          section_id: context.sectionId || null,
        });
        if (uploadedAttachments.length) {
          await addLessonPlanAttachments(planId, { attachments: uploadedAttachments });
        }
      } else {
        await createLessonPlan({
          lesson_date: lessonDate,
          chapter_topic: chapterTopic.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
          learning_objectives,
          activities: activitiesPayload,
          homework: homework.trim() || undefined,
          status: status.value,
          subject: context.subjectId,
          class_id: context.classId,
          section_id: context.sectionId || undefined,
          teacher_id: context.teacherId,
          ...(uploadedAttachments.length ? { attachments: uploadedAttachments } : {}),
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err?.message || err?.error || t("lessonPlans.lessonPlanForm.errorFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-h-[90vh] w-full max-w-[min(42rem,calc(100vw-1.5rem))] overflow-y-auto sm:max-w-2xl"
    >
      <h2 className="pr-11 text-lg font-semibold leading-snug text-gray-900">
        {isEdit ? t("lessonPlans.lessonPlanForm.editTitle") : t("lessonPlans.lessonPlanForm.newTitle")}
      </h2>
      <form onSubmit={handleSubmit} className="mt-4 w-full min-w-0 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t("lessonPlans.lessonPlanForm.lessonDate")}</label>
          <Input
            type="date"
            value={lessonDate}
            onChange={(e) => setLessonDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t("lessonPlans.lessonPlanForm.chapterTopic")}</label>
          <Input
            value={chapterTopic}
            onChange={(e) => setChapterTopic(e.target.value)}
            placeholder={t("lessonPlans.lessonPlanForm.chapterTopicPlaceholder")}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t("lessonPlans.lessonPlanForm.description")}</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={t("lessonPlans.lessonPlanForm.descriptionPlaceholder")}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t("lessonPlans.lessonPlanForm.status")}</label>
          <Dropdown
            options={STATUS_OPTIONS}
            selected={status}
            onChange={setStatus}
            placeholder="Status"
          />
        </div>

        <div className="w-full min-w-0">
          <div className="mb-2 flex w-full items-center justify-between gap-2">
            <span className="text-sm font-medium text-gray-700">{t("lessonPlans.lessonPlanForm.learningObjectives")}</span>
            <Button type="button" variant="ghost" className="py-1 text-sm" onClick={addObjective}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <div className="w-full space-y-2">
            {objectives.map((obj, i) => (
              <div key={i} className="flex w-full min-w-0 items-stretch gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    value={obj}
                    onChange={(e) => setObjective(i, e.target.value)}
                    placeholder={t("lessonPlans.lessonPlanForm.objectivePlaceholder", { index: i + 1 })}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 self-center px-2"
                  onClick={() => removeObjective(i)}
                  disabled={objectives.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{t("lessonPlans.lessonPlanForm.activities")}</span>
            <Button type="button" variant="ghost" className="py-1 text-sm" onClick={addActivity}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <div className="space-y-3">
            {activities.map((act, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-surface/50 p-3 space-y-2"
              >
                <div className="flex gap-2">
                  <Input
                    value={act.type}
                    onChange={(e) => patchActivity(i, { type: e.target.value })}
                    placeholder={t("lessonPlans.lessonPlanForm.activityTypePlaceholder")}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={act.duration_minutes}
                    onChange={(e) => patchActivity(i, { duration_minutes: e.target.value })}
                    placeholder={t("lessonPlans.lessonPlanForm.activityMinutesPlaceholder")}
                    className="w-28"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0 px-2"
                    onClick={() => removeActivity(i)}
                    disabled={activities.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={act.description}
                  onChange={(e) => patchActivity(i, { description: e.target.value })}
                  placeholder={t("lessonPlans.lessonPlanForm.activityDescriptionPlaceholder")}
                  rows={2}
                />
              </div>
            ))}
          </div>
        </div>

        {/* <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Homework (optional)</label>
          <Textarea
            value={homework}
            onChange={(e) => setHomework(e.target.value)}
            rows={3}
            placeholder="Instructions for students"
          />
        </div> */}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t("lessonPlans.lessonPlanForm.attachments")}</label>
          <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-gray-600 hover:bg-black/5">
            <Paperclip className="h-4 w-4" />
            <span>{t("lessonPlans.lessonPlanForm.addFiles")}</span>
            <input type="file" multiple className="hidden" onChange={handleFiles} />
          </label>
          <ul className="mt-2 space-y-1 text-sm">
            {existingAttachments.map((a, i) => {
              const name = a.fileName || a.file_name || "File";
              const key = a.attachment_id || a.id || `ex-${i}`;
              return (
                <li key={key} className="flex items-center justify-between gap-2">
                  <span className="truncate text-gray-800">{name}</span>
                  <Button type="button" variant="ghost" className="py-0.5 text-xs" onClick={() => removeExisting(a)}>
                    {t("common.remove")}
                  </Button>
                </li>
              );
            })}
            {pendingFiles.map((a, i) => (
              <li key={`p-${i}`} className="flex items-center justify-between gap-2">
                <span className="truncate text-gray-800">{a.name}</span>
                <Button type="button" variant="ghost" className="py-0.5 text-xs" onClick={() => removePending(i)}>
                  {t("common.remove")}
                </Button>
              </li>
            ))}
          </ul>
        </div>

        {error && <p className="text-sm text-error-600">{error}</p>}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={submitting}>
            {isEdit ? t("common.saveChanges") : t("lessonPlans.lessonPlanForm.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
