import { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Dropdown } from "../../ui-components";
import Textarea from "../../ui-components/TextArea";
import {
  addClassPlanTopics,
  updateClassPlanTopic,
  createTopicProgress,
  updateTopicProgress,
  classPlanTopicRowId,
} from "../../api/lessonPlans.api";
import { useTranslation } from "react-i18next";

const TOPIC_STATUS_ORDER = ["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"];

function topicStatusLabelKey(value) {
  if (value === "IN_PROGRESS") return "inProgress";
  return value.toLowerCase();
}

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
  /** Required when creating topic progress (staff section route). */
  sectionId = "",
  prefillChapterTitle = "",
  prefillChapterNumber = null,
  lockChapter = false,
  existingTopicsCount = 0,
}) {
  const { t } = useTranslation();
  const isEdit = !!topic;

  const topicStatusOptions = useMemo(
    () =>
      TOPIC_STATUS_ORDER.map((value) => ({
        value,
        label: t(`lessonPlans.topicForm.status_${topicStatusLabelKey(value)}`),
      })),
    [t],
  );

  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [title, setTitle] = useState("");
  const [topicStatus, setTopicStatus] = useState("PENDING");
  const [scheduledDate, setScheduledDate] = useState("");
  const [teacherNotes, setTeacherNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedTopicStatus = useMemo(() => {
    return (
      topicStatusOptions.find((o) => o.value === topicStatus) ?? topicStatusOptions[0]
    );
  }, [topicStatusOptions, topicStatus]);

  useEffect(() => {
    if (!open) return;
    setError("");
    if (topic) {
      setChapterTitle(topic.chapter_title ?? "");
      setChapterNumber(topic.chapter_number != null ? String(topic.chapter_number) : "");
      setTitle(topic.title ?? "");
      const st = topic.status ?? "PENDING";
      setTopicStatus(TOPIC_STATUS_ORDER.includes(st) ? st : "PENDING");
      setScheduledDate(toDateInputValue(topic.scheduled_date));
      setTeacherNotes(topic.teacher_notes ?? "");
    } else {
      setChapterTitle(prefillChapterTitle);
      setChapterNumber(prefillChapterNumber != null ? String(prefillChapterNumber) : "");
      setTitle("");
      setTopicStatus("PENDING");
      setScheduledDate("");
      setTeacherNotes("");
    }
  }, [open, topic, prefillChapterTitle, prefillChapterNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!chapterTitle.trim()) {
      setError(t("lessonPlans.topicForm.errorChapterRequired"));
      return;
    }
    if (!title.trim()) {
      setError(t("lessonPlans.topicForm.errorTopicRequired"));
      return;
    }
    if (!isEdit && !classPlanId) {
      setError(t("lessonPlans.topicForm.errorNoClassPlan"));
      return;
    }
    setSubmitting(true);
    try {
      const progressBodyForPatch = {
        status: topicStatus,
        scheduled_date: scheduledDate || null,
        teacher_notes: teacherNotes.trim() || null,
        is_added_by_teacher: true,
      };
      const sid = String(sectionId || "").trim();
      if ((isEdit && !topic.progress_id) || !isEdit) {
        if (!sid) {
          setError(t("lessonPlans.topicForm.errorFailed"));
          setSubmitting(false);
          return;
        }
      }
      const progressBodyForCreate = {
        section_id: sid,
        status: topicStatus,
        scheduled_date: scheduledDate || null,
        teacher_notes: teacherNotes.trim() || null,
        is_added_by_teacher: true,
      };

      if (isEdit) {
        const rowId = classPlanTopicRowId(topic);
        if (!rowId) {
          setError(t("lessonPlans.topicForm.errorFailed"));
          return;
        }
        const topicBody = {
          chapter_title: chapterTitle.trim(),
          title: title.trim(),
          chapter_number: chapterNumber !== "" ? (parseInt(chapterNumber, 10) || null) : null,
        };
        await updateClassPlanTopic(rowId, topicBody);
        if (topic.progress_id) {
          await updateTopicProgress(topic.progress_id, progressBodyForPatch);
        } else {
          await createTopicProgress(rowId, progressBodyForCreate);
        }
      } else {
        const topicPayload = {
          chapter_title: chapterTitle.trim(),
          title: title.trim(),
          display_order: (existingTopicsCount + 1) * 10,
        };
        if (chapterNumber !== "") topicPayload.chapter_number = parseInt(chapterNumber, 10) || undefined;
        const result = await addClassPlanTopics(classPlanId, [topicPayload]);
        const resultTopics = result?.topics ?? [];
        const payloadTitle = title.trim();
        const payloadChapter = chapterTitle.trim();
        const matched =
          resultTopics.find((trow) => {
            const ti = (trow.title ?? "").trim();
            const ch = (trow.chapter_title ?? trow.chapterTitle ?? "").trim();
            return ti === payloadTitle && ch === payloadChapter;
          }) ??
          [...resultTopics].sort(
            (a, b) =>
              (b.display_order ?? b.displayOrder ?? 0) - (a.display_order ?? a.displayOrder ?? 0),
          )[0];
        const newTopicId = classPlanTopicRowId(matched);
        if (!newTopicId || String(newTopicId) === String(classPlanId)) {
          setError(t("lessonPlans.topicForm.errorFailed"));
          return;
        }
        await createTopicProgress(newTopicId, progressBodyForCreate);
      }
      onSaved();
    } catch (err) {
      console.error(err);
      setError(err?.message || err?.error || t("lessonPlans.topicForm.errorFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-lg">
      <h2 className="pr-10 text-lg font-semibold text-gray-900">
        {isEdit ? t("lessonPlans.topicForm.editTopic") : lockChapter ? t("lessonPlans.topicForm.addTopic") : t("lessonPlans.topicForm.newChapter")}
      </h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Chapter info */}
        {lockChapter ? (
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-border px-3 py-2">
            <span className="text-xs font-medium text-gray-500 shrink-0">
              {t("lessonPlans.topicForm.chapter")}
            </span>
            <span className="font-medium text-gray-900 text-sm truncate">{chapterTitle}</span>
            {chapterNumber && (
              <span className="ml-auto shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">#{chapterNumber}</span>
            )}
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-900">
                {t("lessonPlans.topicForm.chapterTitle")} <span className="text-error-500">*</span>
              </label>
              <Input
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder={t("lessonPlans.topicForm.chapterTitlePlaceholder")}
                required
              />
            </div>
            <div className="w-24">
              <label className="mb-1 block text-sm font-medium text-gray-900">{t("lessonPlans.topicForm.chapterNumber")}</label>
              <Input
                type="number"
                min={1}
                value={chapterNumber}
                onChange={(e) => setChapterNumber(e.target.value)}
                placeholder={t("lessonPlans.topicForm.chapterNumberPlaceholder")}
              />
            </div>
          </div>
        )}

        {/* Topic title */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            {t("lessonPlans.topicForm.topicTitle")} <span className="text-error-500">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("lessonPlans.topicForm.topicTitlePlaceholder")}
            required
          />
        </div>

        {/* Status + scheduled date row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-900">{t("lessonPlans.topicForm.status")}</label>
            <Dropdown
              options={topicStatusOptions}
              selected={selectedTopicStatus}
              onChange={(opt) => setTopicStatus(opt.value)}
              placeholder={t("lessonPlans.topicForm.status")}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-900">{t("lessonPlans.topicForm.scheduledDate")}</label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
        </div>

        {/* Teacher notes */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">{t("lessonPlans.topicForm.teacherNotes")}</label>
          <Textarea
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            rows={2}
            placeholder={t("lessonPlans.topicForm.teacherNotesPlaceholder")}
          />
        </div>

        {error && <p className="text-sm text-error-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="submit" loading={submitting}>{isEdit ? t("common.saveChanges") : t("lessonPlans.topicForm.addTopicButton")}</Button>
        </div>
      </form>
    </Modal>
  );
}
