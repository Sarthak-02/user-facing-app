import { useState, useEffect, useMemo, useRef } from "react";
import { Button, Dropdown } from "../../ui-components";
import { usePermissions } from "../../store/permissions.store";
import { SECTION_TARGET_SCHEMA, STUDENT_TARGET_SCHEMA } from "../../utils/target.schema";
import { updateSchema } from "../../utils/update.schema";

const TARGET_OPTIONS = [
  { value: "SECTION", label: "Section" },
  { value: "STUDENT", label: "Student" },
];

export default function HomeworkFormModal({
  isOpen,
  onClose,
  onSubmit,
  homework,
  isSubmitting,
  submitError,
  defaultSectionId,
  defaultSubjectKey,
  defaultStudentId,
}) {
  const { permissions } = usePermissions();
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isEditing = !!homework;
  const prevHomeworkIdRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
    dueDate: "",
    targetType: { value: "SECTION", label: "Section" },
    sectionId: null,
    studentId: [],
    classId: null,
    attachments: [],
    status: "DRAFT",
  });

  const [attachmentError, setAttachmentError] = useState("");

  const subjects = useMemo(() => {
    if (!formData.sectionId?.value) return [];
    return permissions?.teacher_subjects.map((subject) => ({
      label: subject,
      value: subject,
    }));
  }, [permissions, formData.sectionId]);

  const targetSchema = useMemo(() => {
    const data = {
      class: {
        selected: formData.classId,
        options: permissions.classes.map(({ class_id, class_name }) => ({
          value: class_id,
          label: class_name,
        })),
        onChange: (option) =>
          setFormData((prev) => ({ ...prev, classId: option, sectionId: null, studentId: [] })),
      },
      section: {
        selected: formData.sectionId,
        options: (formData.classId?.value
          ? permissions.sections.filter((s) => s.class_id === formData.classId.value)
          : []
        ).map(({ section_id, section_name }) => ({ value: section_id, label: section_name })),
        onChange: (option) =>
          setFormData((prev) => ({ ...prev, sectionId: option })),
      },
    };

    if (formData.targetType?.value === "SECTION") return updateSchema(SECTION_TARGET_SCHEMA, data);
    if (formData.targetType?.value === "STUDENT") {
      data.student = {
        selected: formData.studentId,
        options: permissions.students
          .map(({ student_id, student_name, section_id }) => ({
            value: student_id,
            label: student_name,
            section_id,
          }))
          .filter(({ section_id }) => section_id === formData.sectionId?.value),
        onChange: (options) =>
          setFormData((prev) => ({ ...prev, studentId: options })),
      };
      return updateSchema(STUDENT_TARGET_SCHEMA, data);
    }
    return [];
  }, [formData.targetType, formData.sectionId, formData.classId, formData.studentId, permissions.classes, permissions.sections, permissions.students]);

  useEffect(() => {
    if (!isOpen) return;

    const currentHomeworkId = homework?.id || homework?.homework_id || null;
    const hasHomeworkChanged = prevHomeworkIdRef.current !== currentHomeworkId;
    if (!hasHomeworkChanged && prevHomeworkIdRef.current !== null) return;
    prevHomeworkIdRef.current = currentHomeworkId;

    if (homework) {
      let targetType = { value: "SECTION", label: "Section" };
      let sectionId = null;
      let studentId = [];
      let classId = null;

      if (homework.targets && homework.targets.length > 0) {
        const firstTarget = homework.targets[0];
        const tt = firstTarget.target_type || firstTarget.targetType;

        if (tt === "SECTION") {
          targetType = { value: "SECTION", label: "Section" };
          const targetId = firstTarget.target_id || firstTarget.targetId || firstTarget.section_id || "";
          const section = permissions.sections.find((s) => s.section_id === targetId);
          if (section) {
            sectionId = { value: section.section_id, label: section.section_name };
            const classObj = permissions.classes.find((c) => c.class_id === section.class_id);
            if (classObj) classId = { value: classObj.class_id, label: classObj.class_name };
          }
        } else if (tt === "STUDENT") {
          targetType = { value: "STUDENT", label: "Student" };
          const studentIds = homework.targets.map((t) => t.target_id || t.targetId || t.student_id).filter(Boolean);
          studentId = studentIds.map((sid) => {
            const student = permissions.students.find((s) => s.student_id === sid);
            return student ? { value: student.student_id, label: student.student_name } : null;
          }).filter(Boolean);
          const sectionIdValue = firstTarget.section_id || "";
          const section = permissions.sections.find((s) => s.section_id === sectionIdValue);
          if (section) {
            sectionId = { value: section.section_id, label: section.section_name };
            const classObj = permissions.classes.find((c) => c.class_id === section.class_id);
            if (classObj) classId = { value: classObj.class_id, label: classObj.class_name };
          }
        } else if (tt === "CLASS") {
          targetType = { value: "CLASS", label: "Class" };
          const targetId = firstTarget.target_id || firstTarget.targetId || firstTarget.class_id || "";
          const classObj = permissions.classes.find((c) => c.class_id === targetId);
          if (classObj) classId = { value: classObj.class_id, label: classObj.class_name };
        }
      }

      let formattedDueDate = "";
      if (homework.dueDate || homework.due_date) {
        formattedDueDate = new Date(homework.dueDate || homework.due_date).toISOString().split("T")[0];
      }

      const subjectOption = homework.subject
        ? { value: homework.subject, label: homework.subject }
        : null;

      const attachments = homework?.attachments?.length > 0
        ? homework.attachments.map((a) => ({
            ...a,
            name: a.name || a.fileName || a.filename || "Unnamed file",
            type: a.type || a.fileType || a.mimeType || a.mime_type || "",
            size: a.size || a.fileSize || a.file_size || 0,
            fileUrl: a.fileUrl || a.url || a.file_url || "",
          }))
        : [];

      // eslint-disable-next-line
      setFormData({
        title: homework.title || "",
        subject: subjectOption,
        description: homework.description || "",
        dueDate: formattedDueDate,
        targetType,
        sectionId,
        studentId,
        classId,
        attachments,
        status: homework.status || "DRAFT",
      });
    } else {
      const sec = defaultSectionId && (permissions.sections || []).find((s) => s.section_id === defaultSectionId);
      const cls = sec && (permissions.classes || []).find((c) => c.class_id === sec.class_id);
      const subjectOption = defaultSubjectKey != null && String(defaultSubjectKey).length > 0
        ? { value: defaultSubjectKey, label: defaultSubjectKey }
        : null;
      const studentRow = defaultStudentId && (permissions.students || []).find((s) => s.student_id === defaultStudentId);
      const studentInSection = studentRow && defaultSectionId && studentRow.section_id === defaultSectionId;

      if (studentInSection && sec) {
        setFormData({
          title: "",
          subject: subjectOption,
          description: "",
          dueDate: "",
          targetType: { value: "STUDENT", label: "Student" },
          sectionId: { value: sec.section_id, label: sec.section_name },
          studentId: [{ value: studentRow.student_id, label: studentRow.student_name || studentRow.student_id }],
          classId: cls ? { value: cls.class_id, label: cls.class_name } : null,
          attachments: [],
          status: "DRAFT",
        });
      } else {
        setFormData({
          title: "",
          subject: subjectOption,
          description: "",
          dueDate: "",
          targetType: { value: "SECTION", label: "Section" },
          sectionId: sec ? { value: sec.section_id, label: sec.section_name } : null,
          studentId: [],
          classId: cls ? { value: cls.class_id, label: cls.class_name } : null,
          attachments: [],
          status: "DRAFT",
        });
      }
    }
  }, [homework, isOpen, permissions, defaultSectionId, defaultSubjectKey, defaultStudentId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setTargetType = (type) =>
    setFormData((prev) => ({
      ...prev,
      targetType: type,
      sectionId: null,
      studentId: [],
      classId: null,
      subject: null,
    }));

  const processFiles = (files) => {
    setAttachmentError("");
    if (formData.attachments.length + files.length > 3) {
      setAttachmentError("Maximum 3 attachments allowed");
      return;
    }
    const oversized = files.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      setAttachmentError("Each file must be less than 10MB");
      return;
    }
    const newEntries = files.map((file) => ({ _file: file, name: file.name, type: file.type, size: file.size }));
    setFormData((prev) => ({ ...prev, attachments: [...prev.attachments, ...newEntries] }));
  };

  const handleFileChange = (e) => {
    processFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (formData.attachments.length >= 3) return;
    processFiles(Array.from(e.dataTransfer.files));
  };

  const handleRemoveAttachment = (index) => {
    setAttachmentError("");
    setFormData((prev) => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));
  };

  const handleDownloadAttachment = (file) => {
    if (!file.fileUrl) return;
    const link = document.createElement("a");
    link.href = file.fileUrl;
    link.download = file.name || "download";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + " " + sizes[i];
  };

  const handleSubmit = (e, status) => {
    e.preventDefault();
    onSubmit({ ...formData, status });
  };

  const canSubmit =
    formData.title.trim() &&
    formData.subject?.value &&
    formData.description.trim() &&
    formData.dueDate &&
    ((formData.targetType?.value === "SECTION" && formData.classId?.value && formData.sectionId?.value) ||
      (formData.targetType?.value === "STUDENT" &&
        formData.classId?.value &&
        formData.sectionId?.value &&
        Array.isArray(formData.studentId) &&
        formData.studentId.length > 0));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-16">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? "Edit Homework" : "New Homework"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEditing ? "Update the homework details below" : "Assign homework to a section or student"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Assign To */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Assign To <span className="text-red-500">*</span>
            </p>
            <div className="space-y-3">
              {/* Target type pills */}
              <div className="flex gap-2">
                {TARGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTargetType(opt)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      formData.targetType?.value === opt.value
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {/* Conditional dropdowns */}
              {targetSchema?.length > 0 && (
                <div className="space-y-3 pl-1">
                  {targetSchema.map((item) => (
                    <Dropdown key={item?.type} {...item} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Subject <span className="text-red-500">*</span>
            </label>
            <Dropdown
              selected={formData.subject}
              onChange={(option) => setFormData((prev) => ({ ...prev, subject: option }))}
              options={subjects}
              placeholder={formData.sectionId ? "Select subject" : "Select a section first"}
            />
          </div>

          {/* Title + Due Date side by side on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-400">{formData.title.length}/100</span>
              </div>
              <input
                type="text"
                id="title"
                name="title"
                maxLength={100}
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g. Chapter 5 exercises"
                required
              />
            </div>
            <div>
              <label htmlFor="dueDate" className="text-sm font-medium text-gray-700 mb-2 block">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-400">{formData.description.length} chars</span>
            </div>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
              placeholder="Write the homework instructions and details here..."
              required
            />
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Attachments</p>
              <span className="text-xs text-gray-400">{formData.attachments.length}/3</span>
            </div>

            {formData.attachments.length < 3 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                  isDragOver
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-blue-500">Click to upload</span> or drag & drop
                </p>
                <p className="text-xs text-gray-400">Max 3 files · 10MB each</p>
                <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
              </div>
            )}

            {attachmentError && (
              <p className="mt-2 text-xs text-red-600">{attachmentError}</p>
            )}

            {formData.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.attachments.map((file, index) => (
                  <div key={file.id || index} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadAttachment(file)}
                      disabled={!file.fileUrl}
                      className="flex-1 min-w-0 text-left disabled:cursor-default"
                    >
                      <p className="text-sm text-gray-700 truncate font-medium">{file.name || "Unnamed file"}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                    </button>
                    {file.fileUrl && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {submitError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!canSubmit || isSubmitting}
            onClick={(e) => handleSubmit(e, "DRAFT")}
          >
            {isSubmitting ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            type="button"
            disabled={!canSubmit || isSubmitting}
            onClick={(e) => handleSubmit(e, "PUBLISHED")}
          >
            {isSubmitting ? "Publishing..." : isEditing ? "Update" : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
