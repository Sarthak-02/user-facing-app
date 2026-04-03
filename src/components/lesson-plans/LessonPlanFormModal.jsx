import { useEffect, useState } from "react";
import { Button, Input, Textarea, Modal, Dropdown } from "../../ui-components";
import {
  createLessonPlan,
  updateLessonPlan,
  uploadLessonPlanFile,
  addLessonPlanAttachments,
  removeLessonPlanAttachment,
  getLessonPlanById,
} from "../../api/lessonPlans.api";
import { Plus, Trash2, Paperclip } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "PLANNED", label: "Planned" },
  { value: "COMPLETED", label: "Completed" },
  { value: "SKIPPED", label: "Skipped" },
  { value: "PARTIALLY_COMPLETED", label: "Partially completed" },
];

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
  const isEdit = !!plan;
  const planId = plan?.lesson_plan_id || plan?.id;

  const [lessonDate, setLessonDate] = useState("");
  const [chapterTopic, setChapterTopic] = useState("");
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
      setLessonDate(toDateInputValue(plan.lesson_date));
      setChapterTopic(plan.chapter_topic || "");
      const objs = plan.learning_objectives;
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

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setError("");
    try {
      const uploaded = [];
      for (const file of files) {
        const item = await uploadLessonPlanFile(file, isEdit ? planId : undefined);
        uploaded.push(item);
      }
      if (isEdit && planId) {
        await addLessonPlanAttachments(planId, { attachments: uploaded });
        const fresh = await getLessonPlanById(planId);
        const att = fresh?.attachments || fresh?.lesson_plan_attachments;
        setExistingAttachments(Array.isArray(att) ? [...att] : []);
      } else {
        setPendingFiles((prev) => [...prev, ...uploaded]);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to upload file(s)");
    }
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
      setError(err?.message || "Failed to remove attachment");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const learning_objectives = objectives.map((s) => s.trim()).filter(Boolean);
    if (!learning_objectives.length) {
      setError("Add at least one learning objective.");
      return;
    }
    if (!chapterTopic.trim()) {
      setError("Chapter / topic is required.");
      return;
    }
    if (!lessonDate) {
      setError("Lesson date is required.");
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
      setError("Add at least one activity with a type.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && planId) {
        await updateLessonPlan(planId, {
          lesson_date: lessonDate,
          chapter_topic: chapterTopic.trim(),
          learning_objectives,
          activities: activitiesPayload,
          homework: homework.trim() || null,
          status: status.value,
          subject_id: context.subjectId,
          class_id: context.classId,
          section_id: context.sectionId || null,
        });
      } else {
        await createLessonPlan({
          lesson_date: lessonDate,
          chapter_topic: chapterTopic.trim(),
          learning_objectives,
          activities: activitiesPayload,
          homework: homework.trim() || undefined,
          status: status.value,
          subject_id: context.subjectId,
          class_id: context.classId,
          section_id: context.sectionId || undefined,
          teacher_id: context.teacherId,
          ...(pendingFiles.length ? { attachments: pendingFiles } : {}),
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err?.message || err?.error || "Failed to save lesson plan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-900">
        {isEdit ? "Edit lesson plan" : "New lesson plan"}
      </h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Lesson date</label>
          <Input
            type="date"
            value={lessonDate}
            onChange={(e) => setLessonDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Chapter / topic</label>
          <Input
            value={chapterTopic}
            onChange={(e) => setChapterTopic(e.target.value)}
            placeholder="e.g. Quadratic equations"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
          <Dropdown
            options={STATUS_OPTIONS}
            selected={status}
            onChange={setStatus}
            placeholder="Status"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Learning objectives</span>
            <Button type="button" variant="ghost" className="py-1 text-sm" onClick={addObjective}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {objectives.map((obj, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={obj}
                  onChange={(e) => setObjective(i, e.target.value)}
                  placeholder={`Objective ${i + 1}`}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 px-2"
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
            <span className="text-sm font-medium text-gray-700">Activities</span>
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
                    placeholder="Type (e.g. lecture, group_work)"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={act.duration_minutes}
                    onChange={(e) => patchActivity(i, { duration_minutes: e.target.value })}
                    placeholder="Minutes"
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
                  placeholder="Description (optional)"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Homework (optional)</label>
          <Textarea
            value={homework}
            onChange={(e) => setHomework(e.target.value)}
            rows={3}
            placeholder="Instructions for students"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Attachments</label>
          <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-gray-600 hover:bg-black/5">
            <Paperclip className="h-4 w-4" />
            <span>Add files</span>
            <input type="file" multiple className="hidden" onChange={handleFiles} />
          </label>
          {isEdit && (
            <p className="mt-1 text-xs text-gray-500">
              New files upload immediately and attach to this plan.
            </p>
          )}
          <ul className="mt-2 space-y-1 text-sm">
            {existingAttachments.map((a, i) => {
              const name = a.fileName || a.file_name || "File";
              const key = a.attachment_id || a.id || `ex-${i}`;
              return (
                <li key={key} className="flex items-center justify-between gap-2">
                  <span className="truncate text-gray-800">{name}</span>
                  <Button type="button" variant="ghost" className="py-0.5 text-xs" onClick={() => removeExisting(a)}>
                    Remove
                  </Button>
                </li>
              );
            })}
            {!isEdit &&
              pendingFiles.map((a, i) => (
                <li key={`p-${i}`} className="flex items-center justify-between gap-2">
                  <span className="truncate text-gray-800">{a.fileName}</span>
                  <Button type="button" variant="ghost" className="py-0.5 text-xs" onClick={() => removePending(i)}>
                    Remove
                  </Button>
                </li>
              ))}
          </ul>
        </div>

        {error && <p className="text-sm text-error-600">{error}</p>}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEdit ? "Save changes" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
