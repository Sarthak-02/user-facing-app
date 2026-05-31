import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Modal } from "../../ui-components";
import { Input } from "../../ui-components";
import {
  getClassPlanById,
  addTopicMaterial,
  deleteTopicMaterial,
  addTopicAssignment,
  updateTopicAssignment,
  deleteTopicAssignment,
  addTopicQuiz,
  updateTopicQuiz,
  deleteTopicQuiz,
  uploadLessonPlanFile,
  createTopicProgress,
  classPlanTopicRowId,
  generateAssignment,
  generateQuiz,
} from "../../api/lessonPlans.api";
import Loader from "../../ui-components/Loader";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ClipboardList,
  Zap,
  FileText,
  Paperclip,
  ExternalLink,
  Pencil,
  Calendar,
  CheckCircle2,
  Clock,
  MinusCircle,
  StickyNote,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import TopicFormModal from "../../components/lesson-plans/TopicFormModal";
import ContentViewer from "../../components/lesson-plans/ContentViewer";
import { usePermissions } from "../../store/permissions.store";

const ASSIGNMENT_STATUS_OPTIONS = ["DRAFT", "PUBLISHED", "CLOSED"];

function formatDate(d, locale) {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return String(d);
  return x.toLocaleDateString(locale || undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function topicStatusConfig(status, t) {
  switch (status) {
    case "COMPLETED":
      return { Icon: CheckCircle2, color: "text-green-500", badge: "bg-green-100 text-green-700", gradient: "from-green-500 to-emerald-600", label: t("staffTopicDetail.topicStatusCompleted") };
    case "IN_PROGRESS":
      return { Icon: Zap, color: "text-blue-500", badge: "bg-blue-100 text-blue-700", gradient: "from-blue-500 to-indigo-600", label: t("staffTopicDetail.topicStatusInProgress") };
    case "SKIPPED":
      return { Icon: MinusCircle, color: "text-gray-400", badge: "bg-gray-100 text-gray-500", gradient: "from-gray-400 to-gray-500", label: t("staffTopicDetail.topicStatusSkipped") };
    default:
      return { Icon: Clock, color: "text-amber-400", badge: "bg-amber-100 text-amber-700", gradient: "from-primary-600 to-primary-800", label: t("staffTopicDetail.topicStatusUpcoming") };
  }
}

function assignmentStatusColor(s) {
  if (s === "PUBLISHED") return "bg-green-100 text-green-700";
  if (s === "CLOSED") return "bg-gray-100 text-gray-500";
  return "bg-amber-50 text-amber-700";
}

// ─── File upload button ──────────────────────────────────────────────────────

function FileUploadRow({ fileUrl, fileName, uploading, onFile, onRemove }) {
  const { t } = useTranslation();
  return fileUrl ? (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-gray-50 px-3 py-2 text-sm">
      <Paperclip className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-primary-600 hover:underline text-xs">
        {fileName || t("staffTopicDetail.viewFile")}
      </a>
      <button type="button" onClick={onRemove} className="text-xs text-gray-400 hover:text-red-500 flex-shrink-0">{t("common.remove")}</button>
    </div>
  ) : (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
      <Paperclip className="h-4 w-4" />
      {uploading ? t("staffTopicDetail.uploading") : t("staffTopicDetail.attachFileOptional")}
      <input type="file" className="hidden" onChange={onFile} disabled={uploading} />
    </label>
  );
}

// ─── Assignment form ─────────────────────────────────────────────────────────

function AssignmentForm({ topicId, progressId, sectionId, assignment, onSaved, onCancel }) {
  const { t } = useTranslation();
  const isEdit = !!assignment;
  const [title, setTitle] = useState(assignment?.title ?? "");
  const [dueDate, setDueDate] = useState(assignment?.due_date ? assignment.due_date.slice(0, 10) : "");
  const [status, setStatus] = useState(assignment?.status ?? "DRAFT");
  const [contentText, setContentText] = useState(assignment?.content?.text ?? "");
  const [fileUrl, setFileUrl] = useState(assignment?.file_url ?? "");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadLessonPlanFile(file);
      setFileUrl(result.fileUrl);
      setFileName(result.fileName);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch (err) {
      setError(err?.message || t("staffTopicDetail.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError(t("staffTopicDetail.titleRequired")); return; }
    setSubmitting(true);
    try {
      const content = contentText.trim()
        ? { text: contentText.trim() }
        : (isEdit && assignment?.content ? assignment.content : undefined);
      const body = {
        title: title.trim(),
        due_date: dueDate || undefined,
        file_url: fileUrl || undefined,
        status,
        content,
      };
      if (isEdit) {
        await updateTopicAssignment(assignment.id, body);
      } else {
        let pid = progressId;
        if (!pid) {
          const p = await createTopicProgress(topicId, {
            section_id: sectionId,
            is_added_by_teacher: true,
          });
          pid = p?.id ?? p?.progress_id;
        }
        await addTopicAssignment(pid, body);
      }
      onSaved();
    } catch (err) {
      setError(err?.message || t("staffTopicDetail.failedSave"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-900">{isEdit ? t("staffTopicDetail.editAssignment") : t("staffTopicDetail.newAssignment")}</p>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("staffTopicDetail.assignmentTitlePlaceholder")} required />
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-600">{t("staffTopicDetail.dueDate")}</label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-600">{t("staffTopicDetail.status")}</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-600"
          >
            {ASSIGNMENT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Assignment content</label>
        <textarea
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 resize-none"
          placeholder="Describe the assignment, questions, or instructions..."
        />
      </div>
      <FileUploadRow
        fileUrl={fileUrl}
        fileName={fileName}
        uploading={uploading}
        onFile={handleFile}
        onRemove={() => { setFileUrl(""); setFileName(""); }}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>{t("common.cancel")}</Button>
        <Button type="submit" loading={submitting || uploading}>{isEdit ? t("staffTopicDetail.saveChanges") : t("staffTopicDetail.addAssignment")}</Button>
      </div>
    </form>
  );
}

// ─── Quiz form ───────────────────────────────────────────────────────────────

function QuizForm({ topicId, progressId, sectionId, quiz, onSaved, onCancel }) {
  const { t } = useTranslation();
  const isEdit = !!quiz;
  const [title, setTitle] = useState(quiz?.title ?? "");
  const [contentText, setContentText] = useState(quiz?.content?.text ?? "");
  const [fileUrl, setFileUrl] = useState(quiz?.file_url ?? "");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadLessonPlanFile(file);
      setFileUrl(result.fileUrl);
      setFileName(result.fileName);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch (err) {
      setError(err?.message || t("staffTopicDetail.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError(t("staffTopicDetail.titleRequired")); return; }
    setSubmitting(true);
    try {
      const content = contentText.trim()
        ? { text: contentText.trim() }
        : (isEdit && quiz?.content ? quiz.content : undefined);
      const body = {
        title: title.trim(),
        file_url: fileUrl || undefined,
        generated_by_ai: quiz?.generated_by_ai ?? false,
        content,
      };
      if (isEdit) {
        await updateTopicQuiz(quiz.id, body);
      } else {
        let pid = progressId;
        if (!pid) {
          const p = await createTopicProgress(topicId, {
            section_id: sectionId,
            is_added_by_teacher: true,
          });
          pid = p?.id ?? p?.progress_id;
        }
        await addTopicQuiz(pid, body);
      }
      onSaved();
    } catch (err) {
      setError(err?.message || t("staffTopicDetail.failedSave"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-900">{isEdit ? t("staffTopicDetail.editQuiz") : t("staffTopicDetail.newQuiz")}</p>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("staffTopicDetail.quizTitlePlaceholder")} required />
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Quiz content</label>
        <textarea
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 resize-none"
          placeholder="List quiz questions, instructions, or topics covered..."
        />
      </div>
      <FileUploadRow
        fileUrl={fileUrl}
        fileName={fileName}
        uploading={uploading}
        onFile={handleFile}
        onRemove={() => { setFileUrl(""); setFileName(""); }}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>{t("common.cancel")}</Button>
        <Button type="submit" loading={submitting || uploading}>{isEdit ? t("staffTopicDetail.saveChanges") : t("staffTopicDetail.addQuiz")}</Button>
      </div>
    </form>
  );
}

// ─── Material form ────────────────────────────────────────────────────────────

function MaterialForm({ topicId, progressId, sectionId, onSaved, onCancel }) {
  const { t } = useTranslation();
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadLessonPlanFile(file);
      setFileUrl(result.fileUrl);
      setFileName(result.fileName);
    } catch (err) {
      setError(err?.message || t("staffTopicDetail.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileUrl) { setError(t("staffTopicDetail.pleaseUploadFile")); return; }
    setSubmitting(true);
    try {
      let pid = progressId;
      if (!pid) {
        const p = await createTopicProgress(topicId, {
          section_id: sectionId,
          is_added_by_teacher: true,
        });
        pid = p?.id ?? p?.progress_id;
      }
      await addTopicMaterial(pid, { file_name: fileName, file_url: fileUrl });
      onSaved();
    } catch (err) {
      setError(err?.message || t("staffTopicDetail.failedAddMaterial"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-900">{t("staffTopicDetail.uploadStudyMaterial")}</p>
      {fileUrl ? (
        <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2">
          <Paperclip className="h-3.5 w-3.5 text-teal-500 flex-shrink-0" />
          <span className="flex-1 truncate text-sm text-gray-800">{fileName}</span>
          <button type="button" onClick={() => { setFileUrl(""); setFileName(""); }} className="text-xs text-gray-400 hover:text-red-500">{t("common.remove")}</button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/50 px-4 py-6 text-sm text-gray-500 hover:bg-teal-50 transition-colors">
          <div className="text-center">
            <Paperclip className="h-6 w-6 text-teal-400 mx-auto mb-1" />
            <p className="font-medium text-gray-700">{uploading ? t("staffTopicDetail.uploading") : t("staffTopicDetail.clickToUploadFile")}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t("staffTopicDetail.materialFormatsHint")}</p>
          </div>
          <input type="file" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>{t("common.cancel")}</Button>
        <Button type="submit" loading={submitting || uploading} disabled={!fileUrl}>{t("staffTopicDetail.upload")}</Button>
      </div>
    </form>
  );
}

// ─── Resource section ─────────────────────────────────────────────────────────

function ResourceSection({ title, icon: Icon, iconBg, count, children, onAdd, addLabel, secondaryAction }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          {count > 0 && (
            <span className="text-xs font-medium bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{count}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {secondaryAction}
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 rounded-lg bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {addLabel}
          </button>
        </div>
      </div>
      <div className="p-3 space-y-2">{children}</div>
    </div>
  );
}

// ─── Question Edit Form ───────────────────────────────────────────────────────

function QuestionEditForm({ question, sectionType, onSave, onCancel }) {
  const isNew = !question;
  const [text, setText] = useState(question?.question ?? question?.statement ?? question?.sentence ?? "");
  const [marks, setMarks] = useState(String(question?.marks ?? 1));
  const [answer, setAnswer] = useState(question?.answer ?? question?.verdict ?? "");
  const [explanation, setExplanation] = useState(question?.explanation ?? question?.justification ?? "");
  const [options, setOptions] = useState(
    sectionType === "mcq"
      ? ["A", "B", "C", "D"].map((k) => ({ key: k, text: question?.options?.[k] ?? "" }))
      : []
  );

  const isMcq = sectionType === "mcq";
  const isTrueFalse = sectionType === "true_false";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const q = {
      ...(question || {}),
      question: text.trim(),
      marks: Math.max(1, parseInt(marks, 10) || 1),
      answer: answer.trim(),
      explanation: explanation.trim() || undefined,
    };
    if (isMcq) {
      q.options = Object.fromEntries(options.map((o) => [o.key, o.text]));
    }
    onSave(q);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 space-y-2.5">
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Question</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter question text..."
          required
        />
      </div>
      {isMcq && (
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt, idx) => (
            <div key={opt.key}>
              <label className="text-xs font-medium text-gray-500 mb-0.5 block">Option {opt.key}</label>
              <input
                value={opt.text}
                onChange={(e) =>
                  setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, text: e.target.value } : o)))
                }
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder={`Option ${opt.key}`}
              />
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Answer</label>
          {isMcq ? (
            <select
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select correct option</option>
              {["A", "B", "C", "D"].map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          ) : isTrueFalse ? (
            <select
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="True">True</option>
              <option value="False">False</option>
            </select>
          ) : (
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Answer..."
            />
          )}
        </div>
        <div className="w-20">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Marks</label>
          <input
            type="number"
            min="1"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">Explanation (optional)</label>
        <input
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          placeholder="Optional explanation..."
        />
      </div>
      <div className="flex justify-end gap-2 pt-0.5">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
        >
          {isNew ? "Add Question" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ─── AI Content Modal (Editable) ─────────────────────────────────────────────

// itemId + existingDueDate + existingStatus are set when editing an already-saved item (update mode)
function AIContentModal({ result, label, type, topicId, progressId, sectionId, itemId, existingDueDate, existingStatus, onSaved, onClose }) {
  const isUpdate = !!itemId;
  const [editedResult, setEditedResult] = useState(null);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingQ, setEditingQ] = useState(null);
  const [addingQ, setAddingQ] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!result) return;
    setEditedResult(JSON.parse(JSON.stringify(result)));
    setTitle(result.topic ?? "");
    setDueDate(existingDueDate ?? "");
    setEditingQ(null);
    setAddingQ(null);
    setSaveError("");
  }, [result, existingDueDate]);

  if (!result || !editedResult) return null;

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const recalc = (sections) => ({
    total_questions: sections.reduce((s, sec) => s + sec.questions.length, 0),
    total_marks: sections.reduce((s, sec) => sec.questions.reduce((sm, q) => sm + (q.marks || 0), 0) + s, 0),
  });

  const deleteQuestion = (si, qi) => {
    if (editingQ?.si === si && editingQ?.qi === qi) setEditingQ(null);
    setEditedResult((prev) => {
      const sections = prev.sections.map((sec, i) => {
        if (i !== si) return sec;
        const questions = sec.questions
          .filter((_, j) => j !== qi)
          .map((q, idx) => ({ ...q, number: idx + 1 }));
        return { ...sec, questions, section_marks: questions.reduce((s, q) => s + (q.marks || 0), 0) };
      });
      return { ...prev, sections, ...recalc(sections) };
    });
  };

  const saveQuestion = (si, qi, updated) => {
    setEditedResult((prev) => {
      const sections = prev.sections.map((sec, i) => {
        if (i !== si) return sec;
        const questions = sec.questions.map((q, j) => (j === qi ? { ...updated, number: j + 1 } : q));
        return { ...sec, questions, section_marks: questions.reduce((s, q) => s + (q.marks || 0), 0) };
      });
      return { ...prev, sections, ...recalc(sections) };
    });
    setEditingQ(null);
  };

  const addQuestion = (si, newQ) => {
    setEditedResult((prev) => {
      const sections = prev.sections.map((sec, i) => {
        if (i !== si) return sec;
        const questions = [...sec.questions, { ...newQ, number: sec.questions.length + 1 }];
        return { ...sec, questions, section_marks: questions.reduce((s, q) => s + (q.marks || 0), 0) };
      });
      return { ...prev, sections, ...recalc(sections) };
    });
    setAddingQ(null);
  };

  const handleSave = async (status) => {
    setSaving(true);
    setSaveError("");
    try {
      const saveTitle = title.trim() || editedResult.topic;
      if (isUpdate) {
        if (type === "assignment") {
          await updateTopicAssignment(itemId, {
            title: saveTitle,
            due_date: dueDate || undefined,
            status: status ?? existingStatus ?? "DRAFT",
            content: editedResult,
          });
        } else {
          await updateTopicQuiz(itemId, {
            title: saveTitle,
            generated_by_ai: true,
            content: editedResult,
          });
        }
      } else {
        let pid = progressId;
        if (!pid) {
          const p = await createTopicProgress(topicId, { section_id: sectionId, is_added_by_teacher: true });
          pid = p?.id ?? p?.progress_id;
        }
        if (type === "assignment") {
          await addTopicAssignment(pid, {
            title: saveTitle,
            due_date: dueDate || undefined,
            status,
            content: editedResult,
          });
        } else {
          await addTopicQuiz(pid, {
            title: saveTitle,
            generated_by_ai: true,
            content: editedResult,
          });
        }
      }
      onSaved();
    } catch (err) {
      setSaveError(err?.message || "Failed to save");
      setSaving(false);
    }
  };

  const sectionColors = {
    mcq: "border-blue-200 bg-blue-50/40",
    short: "border-green-200 bg-green-50/40",
    long: "border-purple-200 bg-purple-50/40",
    true_false: "border-amber-200 bg-amber-50/40",
    fill_blank: "border-teal-200 bg-teal-50/40",
  };
  const sectionHeaderColors = {
    mcq: "text-blue-700 bg-blue-100",
    short: "text-green-700 bg-green-100",
    long: "text-purple-700 bg-purple-100",
    true_false: "text-amber-700 bg-amber-100",
    fill_blank: "text-teal-700 bg-teal-100",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-2 pb-16 sm:p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex-1 min-w-0 mr-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <span className="text-sm font-bold text-gray-900">{label}</span>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              placeholder="Title..."
            />
            {type === "assignment" && (
              <div className="mt-2 flex items-center gap-2">
                <label className="text-xs text-gray-500 whitespace-nowrap">Due date:</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-4 px-5 py-3 bg-indigo-50 border-b border-indigo-100 flex-shrink-0">
          <div className="text-center">
            <p className="text-xs text-indigo-500 font-medium">Questions</p>
            <p className="text-lg font-bold text-indigo-700">{editedResult.total_questions}</p>
          </div>
          <div className="h-8 w-px bg-indigo-200" />
          <div className="text-center">
            <p className="text-xs text-indigo-500 font-medium">Total Marks</p>
            <p className="text-lg font-bold text-indigo-700">{editedResult.total_marks}</p>
          </div>
          <div className="h-8 w-px bg-indigo-200" />
          <div className="text-center">
            {editedResult.time_minutes != null ? (
              <>
                <p className="text-xs text-indigo-500 font-medium">Time</p>
                <p className="text-sm font-semibold text-indigo-700">{editedResult.time_minutes} min</p>
              </>
            ) : (
              <>
                <p className="text-xs text-indigo-500 font-medium">Difficulty</p>
                <p className="text-sm font-semibold text-indigo-700 capitalize">{editedResult.difficulty}</p>
              </>
            )}
          </div>
          <div className="h-8 w-px bg-indigo-200" />
          <div className="text-center">
            <p className="text-xs text-indigo-500 font-medium">Sections</p>
            <p className="text-lg font-bold text-indigo-700">{(editedResult.sections ?? []).length}</p>
          </div>
        </div>

        {/* Sections */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {(editedResult.sections ?? []).map((section, si) => {
            const colorClass = sectionColors[section.type] ?? "border-gray-200 bg-gray-50/40";
            const headerColor = sectionHeaderColors[section.type] ?? "text-gray-700 bg-gray-100";
            const key = `s${si}`;
            const isOpen = expanded[key] !== false;
            return (
              <div key={si} className={`rounded-xl border ${colorClass} overflow-hidden`}>
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${headerColor}`}>{section.label}</span>
                    <span className="text-xs text-gray-500">{section.questions.length} questions · {section.section_marks} marks</span>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>
                {isOpen && (
                  <div className="border-t border-white/60 px-4 pb-4 pt-2 space-y-3">
                    {section.questions.map((q, qi) => (
                      <div key={q.number}>
                        {editingQ?.si === si && editingQ?.qi === qi ? (
                          <QuestionEditForm
                            question={q}
                            sectionType={section.type}
                            onSave={(updated) => saveQuestion(si, qi, updated)}
                            onCancel={() => setEditingQ(null)}
                          />
                        ) : (
                          <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-600 flex items-center justify-center">{q.number}</span>
                              <p className="flex-1 text-sm text-gray-900 font-medium leading-snug">
                                {q.question ?? q.statement ?? q.sentence}
                              </p>
                              <div className="flex gap-0.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => { setEditingQ({ si, qi }); setAddingQ(null); }}
                                  className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteQuestion(si, qi)}
                                  className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            {q.options && (
                              <div className="ml-8 space-y-1 mb-2">
                                {Object.entries(q.options).map(([opt, text]) => (
                                  <div
                                    key={opt}
                                    className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs ${q.answer === opt ? "bg-green-50 border border-green-200 text-green-800 font-semibold" : "bg-gray-50 text-gray-700"}`}
                                  >
                                    <span className="font-bold flex-shrink-0">{opt}.</span>
                                    <span>{text}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {!q.options && (q.answer ?? q.verdict) && (
                              <div className="ml-8 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-800 mb-2">
                                <span className="font-semibold">Answer: </span>{q.answer ?? q.verdict}
                              </div>
                            )}
                            {(q.explanation ?? q.justification) && (
                              <p className="ml-8 text-xs text-gray-500 italic">{q.explanation ?? q.justification}</p>
                            )}
                            {q.marking_hints && (
                              <div className="ml-8 mt-2">
                                <p className="text-xs font-semibold text-gray-500 mb-1">Marking hints:</p>
                                <ul className="space-y-0.5">
                                  {q.marking_hints.map((hint, hi) => (
                                    <li key={hi} className="text-xs text-gray-500 flex items-start gap-1.5">
                                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                                      {hint}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="ml-8 mt-1.5">
                              <span className="text-xs text-gray-400">{q.marks} {q.marks === 1 ? "mark" : "marks"}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {addingQ?.si === si ? (
                      <QuestionEditForm
                        sectionType={section.type}
                        onSave={(newQ) => addQuestion(si, newQ)}
                        onCancel={() => setAddingQ(null)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setAddingQ({ si }); setEditingQ(null); }}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-xs font-medium text-gray-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add question
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {saveError && (
          <p className="px-5 py-2 text-xs text-red-600 border-t border-red-100 bg-red-50 flex-shrink-0">{saveError}</p>
        )}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          {type === "assignment" && !isUpdate && (
            <Button
              variant="secondary"
              disabled={saving || !title.trim()}
              onClick={() => handleSave("DRAFT")}
            >
              {saving ? "Saving..." : "Save as Draft"}
            </Button>
          )}
          <Button
            disabled={saving || !title.trim()}
            onClick={() => handleSave(type === "assignment" ? (isUpdate ? undefined : "PUBLISHED") : undefined)}
          >
            {saving ? "Saving..." : isUpdate ? "Update" : "Save & Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StaffTopicDetail() {
  const { t, i18n } = useTranslation();
  const { sectionId, subjectId, classPlanId, topicId } = useParams();
  const navigate = useNavigate();

  const { permissions } = usePermissions();

  const [topic, setTopic] = useState(null);
  const [planMeta, setPlanMeta] = useState({ class_id: "", subject: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingTopicsCount, setExistingTopicsCount] = useState(0);

  const [editTopicOpen, setEditTopicOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Per-section form state: null | "add" | item (for edit)
  const [assignmentForm, setAssignmentForm] = useState(null);
  const [quizForm, setQuizForm] = useState(null);
  const [materialForm, setMaterialForm] = useState(null);

  // AI assignment generation
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState("");

  // AI quiz generation
  const [quizAiGenerating, setQuizAiGenerating] = useState(false);
  const [quizAiResult, setQuizAiResult] = useState(null);
  const [quizAiError, setQuizAiError] = useState("");

  const [expandedItems, setExpandedItems] = useState(new Set());
  const toggleItemExpand = (id) =>
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // AI edit mode: editing an already-saved quiz/assignment that has structured content
  const [aiEditItem, setAiEditItem] = useState(null); // { item, type }
  const handleAiEdit = (item, type) => setAiEditItem({ item, type });
  const closeAiEdit = () => setAiEditItem(null);

  const load = useCallback(async () => {
    if (!classPlanId || !topicId) return;
    setLoading(true);
    setError(null);
    try {
      const plan = await getClassPlanById(classPlanId, sectionId ? { section_id: sectionId } : {});
      const topics = plan?.topics ?? [];
      setExistingTopicsCount(topics.length);
      setPlanMeta({ class_id: plan?.class_id ?? "", subject: plan?.subject ?? "" });
      const param = String(topicId);
      const found = topics.find((tp) => classPlanTopicRowId(tp) === param);
      if (!found) throw new Error(t("staffTopicDetail.topicNotInPlan"));
      setTopic(found);
    } catch (err) {
      setError(err?.message || t("staffTopicDetail.failedLoadTopic"));
    } finally {
      setLoading(false);
    }
  }, [classPlanId, topicId, sectionId, t]);

  useEffect(() => { load(); }, [load]);

  const goBack = () =>
    navigate(`/staff/lesson-plans/section/${sectionId}/subject/${subjectId}`);

  const handleSaved = (clearFn) => () => { clearFn(null); load(); };

  const handleDeleteResource = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "assignment") await deleteTopicAssignment(deleteTarget.id);
      else if (deleteTarget.type === "quiz") await deleteTopicQuiz(deleteTarget.id);
      else await deleteTopicMaterial(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateAssignment = async () => {
    if (!topic) return;
    setAiGenerating(true);
    setAiError("");
    try {
      const classItem = permissions.classes?.find((c) => c.class_id === planMeta.class_id);
      const payload = {
        topic: topic.title,
        class: classItem?.class_name ?? planMeta.class_id,
        subject: planMeta.subject,
        chapter: topic.chapter_title,
      };
      const result = await generateAssignment(payload);
      setAiResult(result);
    } catch (err) {
      setAiError(err?.response?.data?.message ?? err?.message ?? "Failed to generate assignment");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!topic) return;
    setQuizAiGenerating(true);
    setQuizAiError("");
    try {
      const classItem = permissions.classes?.find((c) => c.class_id === planMeta.class_id);
      const payload = {
        topic: topic.title,
        class: classItem?.class_name ?? planMeta.class_id,
        subject: planMeta.subject,
        difficulty: "medium",
      };
      const result = await generateQuiz(payload);
      setQuizAiResult(result);
    } catch (err) {
      setQuizAiError(err?.response?.data?.message ?? err?.message ?? "Failed to generate quiz");
    } finally {
      setQuizAiGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-0 flex-1 items-center justify-center"><Loader /></div>;
  }

  if (error || !topic) {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <button onClick={goBack} className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </button>
        <p className="text-sm text-red-600">{error || t("staffTopicDetail.topicNotFound")}</p>
      </div>
    );
  }

  const topicRowId = classPlanTopicRowId(topic) ?? topicId;
  const progressId = topic.progress_id ?? null;
  const assignments = topic.assignments ?? [];
  const quizzes = topic.quizzes ?? [];
  const materials = topic.materials ?? topic.study_materials ?? [];
  const sc = topicStatusConfig(topic.status, t);
  const { Icon: StatusIcon } = sc;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">{topic.title}</h1>
          {topic.chapter_title && (
            <p className="text-xs text-gray-500 truncate">
              {topic.chapter_number != null ? t("staffTopicDetail.chapterPrefix", { number: topic.chapter_number }) : ""}{topic.chapter_title}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditTopicOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t("common.edit")}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto p-4 pb-24 space-y-4">

          {/* Topic summary card */}
          <div className={`bg-gradient-to-br ${sc.gradient} rounded-2xl p-5 text-white`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <StatusIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                {topic.chapter_title && (
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-75 mb-1">
                    {topic.chapter_number != null ? t("staffTopicDetail.chapterDotTitle", { number: topic.chapter_number }) : ""}{topic.chapter_title}
                  </p>
                )}
                <h2 className="text-lg font-bold leading-snug">{topic.title}</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
              <div className="bg-white/15 rounded-xl p-2.5">
                <p className="text-xs opacity-70 mb-0.5">{t("staffTopicDetail.statusLabel")}</p>
                <p className="text-sm font-semibold">{sc.label}</p>
              </div>
              {topic.scheduled_date && (
                <div className="bg-white/15 rounded-xl p-2.5">
                  <p className="text-xs opacity-70 mb-0.5">{t("staffTopicDetail.scheduledLabel")}</p>
                  <p className="text-sm font-semibold">{formatDate(topic.scheduled_date, i18n.language)}</p>
                </div>
              )}
              {topic.completed_on && (
                <div className="bg-white/15 rounded-xl p-2.5">
                  <p className="text-xs opacity-70 mb-0.5">{t("staffTopicDetail.completedLabel")}</p>
                  <p className="text-sm font-semibold">{formatDate(topic.completed_on, i18n.language)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Teacher notes */}
          {topic.teacher_notes && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <StickyNote className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("staffTopicDetail.notesSection")}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{topic.teacher_notes}</p>
            </div>
          )}

          {/* ── Assignments ── */}
          <ResourceSection
            title={t("staffTopicDetail.assignments")}
            icon={ClipboardList}
            iconBg="bg-amber-100 text-amber-600"
            count={assignments.length}
            onAdd={() => { setAssignmentForm("add"); setQuizForm(null); setMaterialForm(null); }}
            addLabel={t("staffTopicDetail.add")}
            secondaryAction={
              <div className="flex flex-col items-end">
                <button
                  type="button"
                  onClick={handleGenerateAssignment}
                  disabled={aiGenerating}
                  className="flex items-center gap-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${aiGenerating ? "animate-pulse" : ""}`} />
                  {aiGenerating ? "Generating..." : "Generate with AI"}
                </button>
                {aiError && <p className="mt-1 text-xs text-red-500">{aiError}</p>}
              </div>
            }
          >
            {assignmentForm === "add" && (
              <AssignmentForm
                topicId={topicRowId}
                progressId={progressId}
                sectionId={sectionId}
                onSaved={handleSaved(setAssignmentForm)}
                onCancel={() => setAssignmentForm(null)}
              />
            )}
            {assignments.length === 0 && assignmentForm === null && (
              <p className="text-center text-sm text-gray-400 py-4">{t("staffTopicDetail.noAssignmentsYet")}</p>
            )}
            {assignments.map((a) => (
              <div key={a.id}>
                {assignmentForm?.id === a.id ? (
                  <AssignmentForm
                    topicId={topicRowId}
                    progressId={progressId}
                    sectionId={sectionId}
                    assignment={a}
                    onSaved={handleSaved(setAssignmentForm)}
                    onCancel={() => setAssignmentForm(null)}
                  />
                ) : (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
                    <div className="flex items-start gap-3 p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{a.title}</p>
                          {a.status && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${assignmentStatusColor(a.status)}`}>
                              {a.status.charAt(0) + a.status.slice(1).toLowerCase()}
                            </span>
                          )}
                        </div>
                        {a.due_date && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="h-3 w-3" />{t("staffTopicDetail.duePrefix")} {formatDate(a.due_date, i18n.language)}
                          </p>
                        )}
                        {a.file_url && (
                          <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                            <Paperclip className="h-3 w-3" />{t("staffTopicDetail.attachmentLink")} <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        {a.content && (
                          <button
                            type="button"
                            onClick={() => toggleItemExpand(a.id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700 transition-colors"
                            title={expandedItems.has(a.id) ? "Hide content" : "View content"}
                          >
                            {expandedItems.has(a.id) ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            Array.isArray(a.content?.sections) && a.content.sections.length > 0
                              ? handleAiEdit(a, "assignment")
                              : setAssignmentForm(a)
                          }
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget({ type: "assignment", id: a.id })} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {expandedItems.has(a.id) && a.content && (
                      <div className="px-3 pb-3 border-t border-gray-100">
                        <ContentViewer content={a.content} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </ResourceSection>

          {/* ── Quizzes ── */}
          <ResourceSection
            title={t("staffTopicDetail.quizzes")}
            icon={Zap}
            iconBg="bg-violet-100 text-violet-600"
            count={quizzes.length}
            onAdd={() => { setQuizForm("add"); setAssignmentForm(null); setMaterialForm(null); }}
            addLabel={t("staffTopicDetail.add")}
            secondaryAction={
              <div className="flex flex-col items-end">
                <button
                  type="button"
                  onClick={handleGenerateQuiz}
                  disabled={quizAiGenerating}
                  className="flex items-center gap-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${quizAiGenerating ? "animate-pulse" : ""}`} />
                  {quizAiGenerating ? "Generating..." : "Generate with AI"}
                </button>
                {quizAiError && <p className="mt-1 text-xs text-red-500">{quizAiError}</p>}
              </div>
            }
          >
            {quizForm === "add" && (
              <QuizForm
                topicId={topicRowId}
                progressId={progressId}
                sectionId={sectionId}
                onSaved={handleSaved(setQuizForm)}
                onCancel={() => setQuizForm(null)}
              />
            )}
            {quizzes.length === 0 && quizForm === null && (
              <p className="text-center text-sm text-gray-400 py-4">{t("staffTopicDetail.noQuizzesYet")}</p>
            )}
            {quizzes.map((q) => (
              <div key={q.id}>
                {quizForm?.id === q.id ? (
                  <QuizForm
                    topicId={topicRowId}
                    progressId={progressId}
                    sectionId={sectionId}
                    quiz={q}
                    onSaved={handleSaved(setQuizForm)}
                    onCancel={() => setQuizForm(null)}
                  />
                ) : (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
                    <div className="flex items-start gap-3 p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{q.title}</p>
                          {q.generated_by_ai && (
                            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">{t("staffTopicDetail.aiBadge")}</span>
                          )}
                        </div>
                        {q.file_url && (
                          <a href={q.file_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                            <Paperclip className="h-3 w-3" />{t("staffTopicDetail.attachmentLink")} <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        {q.content && (
                          <button
                            type="button"
                            onClick={() => toggleItemExpand(q.id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700 transition-colors"
                            title={expandedItems.has(q.id) ? "Hide content" : "View content"}
                          >
                            {expandedItems.has(q.id) ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            Array.isArray(q.content?.sections) && q.content.sections.length > 0
                              ? handleAiEdit(q, "quiz")
                              : setQuizForm(q)
                          }
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget({ type: "quiz", id: q.id })} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {expandedItems.has(q.id) && q.content && (
                      <div className="px-3 pb-3 border-t border-gray-100">
                        <ContentViewer content={q.content} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </ResourceSection>

          {/* ── Study Materials ── */}
          <ResourceSection
            title={t("staffTopicDetail.studyMaterials")}
            icon={FileText}
            iconBg="bg-teal-100 text-teal-600"
            count={materials.length}
            onAdd={() => { setMaterialForm("add"); setAssignmentForm(null); setQuizForm(null); }}
            addLabel={t("staffTopicDetail.uploadLabel")}
          >
            {materialForm === "add" && (
              <MaterialForm
                topicId={topicRowId}
                progressId={progressId}
                sectionId={sectionId}
                onSaved={handleSaved(setMaterialForm)}
                onCancel={() => setMaterialForm(null)}
              />
            )}
            {materials.length === 0 && materialForm === null && (
              <p className="text-center text-sm text-gray-400 py-4">{t("staffTopicDetail.noMaterialsYet")}</p>
            )}
            {materials.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-teal-600" />
                </div>
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 text-sm font-medium text-primary-600 hover:underline truncate"
                >
                  {m.file_name}
                </a>
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ type: "material", id: m.id })}
                  className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </ResourceSection>

        </div>
      </div>

      {/* Edit topic modal */}
      <TopicFormModal
        open={editTopicOpen}
        onClose={() => setEditTopicOpen(false)}
        onSaved={() => { setEditTopicOpen(false); load(); }}
        topic={topic}
        classPlanId={classPlanId}
        sectionId={sectionId || ""}
        prefillChapterTitle={topic.chapter_title ?? ""}
        prefillChapterNumber={topic.chapter_number ?? null}
        existingTopicsCount={existingTopicsCount}
      />

      {/* AI Assignment Result (new) */}
      {aiResult && (
        <AIContentModal
          label="AI Generated Assignment"
          type="assignment"
          result={aiResult}
          topicId={topicRowId}
          progressId={progressId}
          sectionId={sectionId}
          onSaved={() => { setAiResult(null); load(); }}
          onClose={() => setAiResult(null)}
        />
      )}

      {/* AI Quiz Result (new) */}
      {quizAiResult && (
        <AIContentModal
          label="AI Generated Quiz"
          type="quiz"
          result={quizAiResult}
          topicId={topicRowId}
          progressId={progressId}
          sectionId={sectionId}
          onSaved={() => { setQuizAiResult(null); load(); }}
          onClose={() => setQuizAiResult(null)}
        />
      )}

      {/* Edit existing AI-generated quiz or assignment */}
      {aiEditItem && (
        <AIContentModal
          label={aiEditItem.type === "quiz" ? "Edit Quiz" : "Edit Assignment"}
          type={aiEditItem.type}
          result={aiEditItem.item.content}
          itemId={aiEditItem.item.id}
          existingDueDate={aiEditItem.item.due_date ? aiEditItem.item.due_date.slice(0, 10) : ""}
          existingStatus={aiEditItem.item.status}
          topicId={topicRowId}
          progressId={progressId}
          sectionId={sectionId}
          onSaved={() => { closeAiEdit(); load(); }}
          onClose={closeAiEdit}
        />
      )}

      {/* Delete confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="max-w-sm">
        <h3 className="text-base font-semibold text-gray-900">{t("staffTopicDetail.deleteItemTitle")}</h3>
        <p className="mt-1.5 text-sm text-gray-500">{t("staffTopicDetail.deleteItemWarning")}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t("common.cancel")}</Button>
          <Button variant="danger" loading={deleting} onClick={handleDeleteResource}>{t("staffTopicDetail.removeButton")}</Button>
        </div>
      </Modal>
    </div>
  );
}
