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
} from "lucide-react";
import TopicFormModal from "../../components/lesson-plans/TopicFormModal";

const ASSIGNMENT_STATUS_OPTIONS = ["DRAFT", "PUBLISHED", "CLOSED"];

function formatDate(d) {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return String(d);
  return x.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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

function AssignmentForm({ topicId, assignment, onSaved, onCancel }) {
  const { t } = useTranslation();
  const isEdit = !!assignment;
  const [title, setTitle] = useState(assignment?.title ?? "");
  const [dueDate, setDueDate] = useState(assignment?.due_date ? assignment.due_date.slice(0, 10) : "");
  const [status, setStatus] = useState(assignment?.status ?? "DRAFT");
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
      const body = { title: title.trim(), due_date: dueDate || undefined, file_url: fileUrl || undefined, status };
      if (isEdit) await updateTopicAssignment(assignment.id, body);
      else await addTopicAssignment(topicId, body);
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

function QuizForm({ topicId, quiz, onSaved, onCancel }) {
  const { t } = useTranslation();
  const isEdit = !!quiz;
  const [title, setTitle] = useState(quiz?.title ?? "");
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
      const body = { title: title.trim(), file_url: fileUrl || undefined, generated_by_ai: false };
      if (isEdit) await updateTopicQuiz(quiz.id, body);
      else await addTopicQuiz(topicId, body);
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

function MaterialForm({ topicId, onSaved, onCancel }) {
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
      await addTopicMaterial(topicId, { file_name: fileName, file_url: fileUrl });
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

function ResourceSection({ title, icon: Icon, iconBg, count, children, onAdd, addLabel }) {
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
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 rounded-lg bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </button>
      </div>
      <div className="p-3 space-y-2">{children}</div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StaffTopicDetail() {
  const { t } = useTranslation();
  const { sectionId, subjectId, classPlanId, topicId } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
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

  const load = useCallback(async () => {
    if (!classPlanId || !topicId) return;
    setLoading(true);
    setError(null);
    try {
      const plan = await getClassPlanById(classPlanId);
      const topics = plan?.topics ?? [];
      setExistingTopicsCount(topics.length);
      const found = topics.find((tp) => String(tp.id) === String(topicId));
      if (!found) throw new Error(t("staffTopicDetail.topicNotInPlan"));
      setTopic(found);
    } catch (err) {
      setError(err?.message || t("staffTopicDetail.failedLoadTopic"));
    } finally {
      setLoading(false);
    }
  }, [classPlanId, topicId, t]);

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
                  <p className="text-sm font-semibold">{formatDate(topic.scheduled_date)}</p>
                </div>
              )}
              {topic.completed_on && (
                <div className="bg-white/15 rounded-xl p-2.5">
                  <p className="text-xs opacity-70 mb-0.5">{t("staffTopicDetail.completedLabel")}</p>
                  <p className="text-sm font-semibold">{formatDate(topic.completed_on)}</p>
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
          >
            {assignmentForm === "add" && (
              <AssignmentForm
                topicId={topicId}
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
                    topicId={topicId}
                    assignment={a}
                    onSaved={handleSaved(setAssignmentForm)}
                    onCancel={() => setAssignmentForm(null)}
                  />
                ) : (
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
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
                          <Calendar className="h-3 w-3" />{t("staffTopicDetail.duePrefix")} {formatDate(a.due_date)}
                        </p>
                      )}
                      {a.file_url && (
                        <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                          <Paperclip className="h-3 w-3" />{t("staffTopicDetail.attachmentLink")} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <button type="button" onClick={() => setAssignmentForm(a)} className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => setDeleteTarget({ type: "assignment", id: a.id })} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
          >
            {quizForm === "add" && (
              <QuizForm
                topicId={topicId}
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
                    topicId={topicId}
                    quiz={q}
                    onSaved={handleSaved(setQuizForm)}
                    onCancel={() => setQuizForm(null)}
                  />
                ) : (
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
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
                      <button type="button" onClick={() => setQuizForm(q)} className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => setDeleteTarget({ type: "quiz", id: q.id })} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
                topicId={topicId}
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
        prefillChapterTitle={topic.chapter_title ?? ""}
        prefillChapterNumber={topic.chapter_number ?? null}
        existingTopicsCount={existingTopicsCount}
      />

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
