import { useEffect, useState } from "react";
import { Button, Input, Modal, Dropdown } from "../../ui-components";
import Textarea from "../../ui-components/TextArea";
import { addClassPlanTopics, updateClassPlanTopic } from "../../api/lessonPlans.api";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "SKIPPED", label: "Skipped" },
];

function toDateInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export default function TopicFormModal({
  open,
  onClose,
  onSaved,
  topic,
  classPlanId,
  prefillChapterTitle = "",
  prefillChapterNumber = null,
  lockChapter = false,
  existingTopicsCount = 0,
}) {
  const isEdit = !!topic;

  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [teacherNotes, setTeacherNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (topic) {
      setChapterTitle(topic.chapter_title ?? "");
      setChapterNumber(topic.chapter_number != null ? String(topic.chapter_number) : "");
      setTitle(topic.title ?? "");
      setStatus(STATUS_OPTIONS.find((o) => o.value === (topic.status ?? "PENDING")) ?? STATUS_OPTIONS[0]);
      setScheduledDate(toDateInputValue(topic.scheduled_date));
      setTeacherNotes(topic.teacher_notes ?? "");
    } else {
      setChapterTitle(prefillChapterTitle);
      setChapterNumber(prefillChapterNumber != null ? String(prefillChapterNumber) : "");
      setTitle("");
      setStatus(STATUS_OPTIONS[0]);
      setScheduledDate("");
      setTeacherNotes("");
    }
  }, [open, topic, prefillChapterTitle, prefillChapterNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!chapterTitle.trim()) {
      setError("Chapter title is required.");
      return;
    }
    if (!title.trim()) {
      setError("Topic title is required.");
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit) {
        const body = {
          chapter_title: chapterTitle.trim(),
          title: title.trim(),
          status: status.value,
          scheduled_date: scheduledDate || null,
          teacher_notes: teacherNotes.trim() || null,
        };
        if (chapterNumber !== "") {
          body.chapter_number = parseInt(chapterNumber, 10) || null;
        } else {
          body.chapter_number = null;
        }
        await updateClassPlanTopic(topic.id, body);
      } else {
        if (!classPlanId) throw new Error("No class plan ID");
        const topicPayload = {
          chapter_title: chapterTitle.trim(),
          title: title.trim(),
          display_order: (existingTopicsCount + 1) * 10,
          status: status.value,
        };
        if (chapterNumber !== "") topicPayload.chapter_number = parseInt(chapterNumber, 10) || undefined;
        if (scheduledDate) topicPayload.scheduled_date = scheduledDate;
        if (teacherNotes.trim()) topicPayload.teacher_notes = teacherNotes.trim();
        topicPayload.is_added_by_teacher = true;
        await addClassPlanTopics(classPlanId, [topicPayload]);
      }
      onSaved();
    } catch (err) {
      console.error(err);
      setError(err?.message || err?.error || "Failed to save topic");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-lg">
      <h2 className="pr-10 text-lg font-semibold text-gray-900">
        {isEdit ? "Edit topic" : lockChapter ? "Add topic" : "New chapter"}
      </h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Chapter info */}
        {lockChapter ? (
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-border px-3 py-2">
            <span className="text-xs font-medium text-gray-500 shrink-0">Chapter</span>
            <span className="font-medium text-gray-900 text-sm truncate">{chapterTitle}</span>
            {chapterNumber && (
              <span className="ml-auto shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">#{chapterNumber}</span>
            )}
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-900">
                Chapter title <span className="text-error-500">*</span>
              </label>
              <Input
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="e.g. Number Systems"
                required
              />
            </div>
            <div className="w-24">
              <label className="mb-1 block text-sm font-medium text-gray-900">Chapter #</label>
              <Input
                type="number"
                min={1}
                value={chapterNumber}
                onChange={(e) => setChapterNumber(e.target.value)}
                placeholder="e.g. 1"
              />
            </div>
          </div>
        )}

        {/* Topic title */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            Topic title <span className="text-error-500">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Integers and their properties"
            required
          />
        </div>

        {/* Status + scheduled date row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-900">Status</label>
            <Dropdown options={STATUS_OPTIONS} selected={status} onChange={setStatus} placeholder="Status" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-900">Scheduled date</label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
        </div>

        {/* Teacher notes */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">Teacher notes (optional)</label>
          <Textarea
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            rows={2}
            placeholder="Any notes or reminders for this topic"
          />
        </div>

        {error && <p className="text-sm text-error-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>{isEdit ? "Save changes" : "Add topic"}</Button>
        </div>
      </form>
    </Modal>
  );
}
