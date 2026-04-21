import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Modal } from "../../ui-components";
import { Input } from "../../ui-components";
import Textarea from "../../ui-components/TextArea";
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
  Brain,
  BookOpen,
  Paperclip,
  ExternalLink,
  Pencil,
} from "lucide-react";
import TopicFormModal from "../../components/lesson-plans/TopicFormModal";

const TABS = [
  { key: "assignments", label: "Assignments", Icon: ClipboardList },
  { key: "quizzes", label: "Quizzes", Icon: Brain },
  { key: "materials", label: "Study Materials", Icon: BookOpen },
];

const ASSIGNMENT_STATUS_OPTIONS = ["DRAFT", "PUBLISHED", "CLOSED"];

function formatDate(d) {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return String(d);
  return x.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function assignmentStatusColor(s) {
  if (s === "PUBLISHED") return "bg-green-100 text-green-700";
  if (s === "CLOSED") return "bg-gray-100 text-gray-500";
  return "bg-yellow-50 text-yellow-700";
}

// ─── Assignment form ────────────────────────────────────────────────────────

function AssignmentForm({ topicId, assignment, onSaved, onCancel }) {
  const isEdit = !!assignment;
  const [title, setTitle] = useState(assignment?.title ?? "");
  const [dueDate, setDueDate] = useState(assignment?.due_date ? assignment.due_date.slice(0, 10) : "");
  const [status, setStatus] = useState(assignment?.status ?? "DRAFT");
  const [fileUrl, setFileUrl] = useState(assignment?.file_url ?? "");
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
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch (err) {
      setError(err?.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }
    setSubmitting(true);
    try {
      const body = {
        title: title.trim(),
        due_date: dueDate || undefined,
        file_url: fileUrl || undefined,
        status,
      };
      if (isEdit) {
        await updateTopicAssignment(assignment.id, body);
      } else {
        await addTopicAssignment(topicId, body);
      }
      onSaved();
    } catch (err) {
      setError(err?.message || "Failed to save assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-white p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-800">{isEdit ? "Edit Assignment" : "New Assignment"}</p>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment title" required />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-600">Due date</label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {ASSIGNMENT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Attachment</label>
        {fileUrl ? (
          <div className="flex items-center gap-2 text-sm">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate">
              View file
            </a>
            <button type="button" onClick={() => setFileUrl("")} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-gray-500 hover:bg-black/5">
            <Paperclip className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload file"}
            <input type="file" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        )}
      </div>
      {error && <p className="text-xs text-error-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting || uploading}>{isEdit ? "Save" : "Add"}</Button>
      </div>
    </form>
  );
}

// ─── Quiz form ──────────────────────────────────────────────────────────────

function QuizForm({ topicId, quiz, onSaved, onCancel }) {
  const isEdit = !!quiz;
  const [title, setTitle] = useState(quiz?.title ?? "");
  const [fileUrl, setFileUrl] = useState(quiz?.file_url ?? "");
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
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch (err) {
      setError(err?.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }
    setSubmitting(true);
    try {
      const body = { title: title.trim(), file_url: fileUrl || undefined, generated_by_ai: false };
      if (isEdit) {
        await updateTopicQuiz(quiz.id, body);
      } else {
        await addTopicQuiz(topicId, body);
      }
      onSaved();
    } catch (err) {
      setError(err?.message || "Failed to save quiz");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-white p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-800">{isEdit ? "Edit Quiz" : "New Quiz"}</p>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz title" required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Attachment</label>
        {fileUrl ? (
          <div className="flex items-center gap-2 text-sm">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate">View file</a>
            <button type="button" onClick={() => setFileUrl("")} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-gray-500 hover:bg-black/5">
            <Paperclip className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload file"}
            <input type="file" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        )}
      </div>
      {error && <p className="text-xs text-error-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting || uploading}>{isEdit ? "Save" : "Add"}</Button>
      </div>
    </form>
  );
}

// ─── Study material form ────────────────────────────────────────────────────

function MaterialForm({ topicId, onSaved, onCancel }) {
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
      setError(err?.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileName.trim() || !fileUrl.trim()) { setError("Please upload a file."); return; }
    setSubmitting(true);
    try {
      await addTopicMaterial(topicId, { file_name: fileName.trim(), file_url: fileUrl.trim() });
      onSaved();
    } catch (err) {
      setError(err?.message || "Failed to add material");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-white p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-800">New Study Material</p>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">File</label>
        {fileUrl ? (
          <div className="flex items-center gap-2 text-sm">
            <Paperclip className="h-4 w-4 text-gray-400" />
            <span className="flex-1 truncate text-gray-800">{fileName}</span>
            <button type="button" onClick={() => { setFileUrl(""); setFileName(""); }} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-gray-500 hover:bg-black/5">
            <Paperclip className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload file"}
            <input type="file" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        )}
      </div>
      {error && <p className="text-xs text-error-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting || uploading} disabled={!fileUrl}>Add</Button>
      </div>
    </form>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function StaffTopicDetail() {
  const { sectionId, subjectId, classPlanId, topicId } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingTopicsCount, setExistingTopicsCount] = useState(0);

  const [activeTab, setActiveTab] = useState("assignments");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  const [editTopicOpen, setEditTopicOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id }
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!classPlanId || !topicId) return;
    setLoading(true);
    setError(null);
    try {
      const plan = await getClassPlanById(classPlanId);
      const topics = plan?.topics ?? [];
      setExistingTopicsCount(topics.length);
      const found = topics.find((t) => String(t.id) === String(topicId));
      if (!found) throw new Error("Topic not found in this class plan.");
      setTopic(found);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to load topic");
    } finally {
      setLoading(false);
    }
  }, [classPlanId, topicId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setShowAddForm(false); setEditingResource(null); }, [activeTab]);

  const goBack = () =>
    navigate(`/staff/lesson-plans/section/${sectionId}/subject/${subjectId}`);

  const handleResourceSaved = () => {
    setShowAddForm(false);
    setEditingResource(null);
    load();
  };

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
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
        <Button variant="ghost" className="mb-4 w-fit gap-2 px-0" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />Back
        </Button>
        <p className="text-sm text-error-600">{error || "Topic not found."}</p>
      </div>
    );
  }

  const assignments = topic.assignments ?? [];
  const quizzes = topic.quizzes ?? [];
  const materials = topic.materials ?? topic.study_materials ?? [];

  const resourcesByTab = { assignments, quizzes, materials };
  const countsByTab = { assignments: assignments.length, quizzes: quizzes.length, materials: materials.length };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
      <Button variant="ghost" className="mb-4 w-fit gap-2 px-0" onClick={goBack}>
        <ArrowLeft className="h-4 w-4" />Back
      </Button>

      {/* Topic header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {topic.chapter_number != null ? `Chapter ${topic.chapter_number} · ` : ""}
            {topic.chapter_title ?? "Chapter"}
          </p>
          <h1 className="mt-1 text-xl font-bold text-gray-900">{topic.title}</h1>
          {topic.scheduled_date && (
            <p className="mt-1 text-sm text-gray-500">
              Scheduled: {formatDate(topic.scheduled_date)}
            </p>
          )}
          {topic.teacher_notes && (
            <p className="mt-1 text-sm text-gray-600 italic">{topic.teacher_notes}</p>
          )}
        </div>
        <Button variant="secondary" className="w-fit gap-2" onClick={() => setEditTopicOpen(true)}>
          <Pencil className="h-4 w-4" />
          Edit topic
        </Button>
      </div>

      {/* Resource tabs */}
      <div className="mt-6">
        <div className="flex overflow-x-auto rounded-xl border border-border bg-gray-100 p-1">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={[
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all whitespace-nowrap",
                activeTab === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              {label}
              {countsByTab[key] > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${activeTab === key ? "bg-gray-100 text-gray-700" : "bg-gray-200 text-gray-600"}`}>
                  {countsByTab[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {/* Inline add/edit form */}
          {showAddForm && !editingResource && (
            <>
              {activeTab === "assignments" && (
                <AssignmentForm topicId={topicId} onSaved={handleResourceSaved} onCancel={() => setShowAddForm(false)} />
              )}
              {activeTab === "quizzes" && (
                <QuizForm topicId={topicId} onSaved={handleResourceSaved} onCancel={() => setShowAddForm(false)} />
              )}
              {activeTab === "materials" && (
                <MaterialForm topicId={topicId} onSaved={handleResourceSaved} onCancel={() => setShowAddForm(false)} />
              )}
            </>
          )}

          {/* Resource list */}
          {resourcesByTab[activeTab].length === 0 && !showAddForm ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
              <p className="text-sm text-gray-500">
                No {TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} added yet.
              </p>
              <Button className="gap-2" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4" />
                Add {TABS.find((t) => t.key === activeTab)?.label.replace(/s$/, "")}
              </Button>
            </div>
          ) : (
            <>
              {/* Assignments */}
              {activeTab === "assignments" && assignments.map((a) => (
                <div key={a.id}>
                  {editingResource?.id === a.id ? (
                    <AssignmentForm
                      topicId={topicId}
                      assignment={a}
                      onSaved={handleResourceSaved}
                      onCancel={() => setEditingResource(null)}
                    />
                  ) : (
                    <Card className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-gray-900">{a.title}</p>
                          {a.status && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${assignmentStatusColor(a.status)}`}>
                              {a.status.charAt(0) + a.status.slice(1).toLowerCase()}
                            </span>
                          )}
                        </div>
                        {a.due_date && (
                          <p className="mt-0.5 text-xs text-gray-500">Due: {formatDate(a.due_date)}</p>
                        )}
                        {a.file_url && (
                          <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                            <Paperclip className="h-3 w-3" />View attachment<ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => setEditingResource(a)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget({ type: "assignment", id: a.id })} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Card>
                  )}
                </div>
              ))}

              {/* Quizzes */}
              {activeTab === "quizzes" && quizzes.map((q) => (
                <div key={q.id}>
                  {editingResource?.id === q.id ? (
                    <QuizForm
                      topicId={topicId}
                      quiz={q}
                      onSaved={handleResourceSaved}
                      onCancel={() => setEditingResource(null)}
                    />
                  ) : (
                    <Card className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-gray-900">{q.title}</p>
                          {q.generated_by_ai && (
                            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">AI generated</span>
                          )}
                        </div>
                        {q.file_url && (
                          <a href={q.file_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                            <Paperclip className="h-3 w-3" />View attachment<ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => setEditingResource(q)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget({ type: "quiz", id: q.id })} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Card>
                  )}
                </div>
              ))}

              {/* Materials */}
              {activeTab === "materials" && materials.map((m) => (
                <Card key={m.id} className="flex items-center gap-3">
                  <Paperclip className="h-4 w-4 shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary-600 hover:underline"
                    >
                      {m.file_name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <button type="button" onClick={() => setDeleteTarget({ type: "material", id: m.id })} className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Card>
              ))}

              {/* Add more */}
              {!showAddForm && !editingResource && resourcesByTab[activeTab].length > 0 && activeTab !== "materials" && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 transition-colors hover:border-primary-400 hover:text-primary-600"
                >
                  <Plus className="h-4 w-4" />
                  Add {TABS.find((t) => t.key === activeTab)?.label.replace(/s$/, "")}
                </button>
              )}
              {activeTab === "materials" && !showAddForm && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 transition-colors hover:border-primary-400 hover:text-primary-600"
                >
                  <Plus className="h-4 w-4" />
                  Add material
                </button>
              )}
            </>
          )}
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
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="max-w-md">
        <h3 className="text-lg font-semibold text-gray-900">Remove resource?</h3>
        <p className="mt-2 text-sm text-gray-600">This cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDeleteResource}>Remove</Button>
        </div>
      </Modal>
    </div>
  );
}
