import { useState, useMemo, useRef } from "react";
import { Button } from "../../ui-components";
import Dropdown from "../../ui-components/Dropdown";
import {
  ANNOUNCEMENT_CATEGORY_OPTIONS,
  DEFAULT_ANNOUNCEMENT_CATEGORY,
  announcementCategoryOptionFromValue,
} from "../../constants/announcementCategories";
import { usePermissions } from "../../store/permissions.store";
import { SECTION_TARGET_SCHEMA, STUDENT_TARGET_SCHEMA, CLASS_TARGET_SCHEMA } from "../../utils/target.schema";
import { updateSchema } from "../../utils/update.schema";

const TARGET_OPTIONS = [
  { value: "CAMPUS", label: "Entire Campus" },
  { value: "CLASS", label: "Class" },
  { value: "SECTION", label: "Section" },
  { value: "STUDENT", label: "Student" },
];

const EMPTY_BROADCAST_FORM = {
  title: "",
  message: "",
  category: DEFAULT_ANNOUNCEMENT_CATEGORY,
  targetType: { value: "CAMPUS", label: "Entire Campus" },
  sectionId: null,
  studentId: [],
  classId: null,
  attachments: [],
  status: "NOTIFYING",
};

function buildFormFromBroadcast(broadcast, permissions) {
  const targets = broadcast.broadcastTargets || broadcast.targets || [];
  const base = {
    title: broadcast.title || "",
    message: broadcast.message || "",
    category: announcementCategoryOptionFromValue(
      broadcast.category ?? broadcast.announcementCategory
    ),
    targetType: TARGET_OPTIONS[0],
    sectionId: null,
    studentId: [],
    classId: null,
    attachments: Array.isArray(broadcast.broadcastAttachments)
      ? broadcast.broadcastAttachments
      : Array.isArray(broadcast.attachmentUrls)
      ? broadcast.attachmentUrls
      : [],
    status: broadcast.status || "DRAFT",
  };
  if (!targets.length) return base;

  const first = targets[0];
  const tt = first.targetType || first.target_type;

  if (tt === "CAMPUS") return { ...base, targetType: TARGET_OPTIONS[0] };

  if (tt === "CLASS") {
    const firstId = first.targetId || first.target_id;
    const classOption = permissions.classes.find((c) => c.class_id === firstId);
    return {
      ...base,
      targetType: TARGET_OPTIONS[1],
      classId: classOption
        ? { value: classOption.class_id, label: classOption.class_name }
        : { value: firstId, label: String(firstId) },
    };
  }
  if (tt === "SECTION") {
    const firstId = first.targetId || first.target_id;
    const sec = permissions.sections.find((s) => s.section_id === firstId);
    const classOption = sec?.class_id
      ? permissions.classes.find((c) => c.class_id === sec.class_id)
      : null;
    return {
      ...base,
      targetType: TARGET_OPTIONS[2],
      classId: classOption
        ? { value: classOption.class_id, label: classOption.class_name }
        : null,
      sectionId: sec
        ? { value: sec.section_id, label: sec.section_name }
        : { value: firstId, label: String(firstId) },
    };
  }
  if (tt === "STUDENT") {
    const studentOptions = targets.map((t) => {
      const id = t.targetId || t.target_id;
      const st = permissions.students.find((s) => s.student_id === id);
      return st
        ? { value: st.student_id, label: st.student_name, section_id: st.section_id }
        : { value: id, label: String(id), section_id: null };
    });
    const firstSt = permissions.students.find(
      (s) => s.student_id === (first.targetId || first.target_id)
    );
    const sectionMeta = firstSt
      ? permissions.sections.find((s) => s.section_id === firstSt.section_id)
      : null;
    const classFromSection = sectionMeta?.class_id
      ? permissions.classes.find((c) => c.class_id === sectionMeta.class_id)
      : null;
    return {
      ...base,
      targetType: TARGET_OPTIONS[3],
      classId: classFromSection
        ? { value: classFromSection.class_id, label: classFromSection.class_name }
        : null,
      sectionId: sectionMeta
        ? { value: sectionMeta.section_id, label: sectionMeta.section_name }
        : null,
      studentId: studentOptions,
    };
  }
  return base;
}

const CATEGORY_ICONS = {
  general: "📢",
  sports: "⚽",
  fun: "🎉",
  urgent: "🚨",
  academic: "📚",
  events: "📅",
};

export default function BroadcastFormModal({ isOpen, onClose, onSubmit, isSubmitting, submitError, existingBroadcast = null }) {
  const { permissions } = usePermissions();
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [formData, setFormData] = useState(() =>
    existingBroadcast
      ? buildFormFromBroadcast(existingBroadcast, permissions)
      : { ...EMPTY_BROADCAST_FORM }
  );

  const isViewingExisting = Boolean(existingBroadcast);
  const [attachmentError, setAttachmentError] = useState("");

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
          setFormData((prev) => ({ ...prev, sectionId: option, studentId: [] })),
      },
    };

    if (formData.targetType?.value === "CAMPUS") return [];
    if (formData.targetType?.value === "CLASS") return updateSchema(CLASS_TARGET_SCHEMA, data);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setTargetType = (type) =>
    setFormData((prev) => ({ ...prev, targetType: type, sectionId: null, studentId: [], classId: null }));

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
    setFormData((prev) => ({ ...prev, attachments: [...prev.attachments, ...files] }));
  };

  const handleFileChange = (e) => processFiles(Array.from(e.target.files));

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isViewingExisting || formData.attachments.length >= 3) return;
    processFiles(Array.from(e.dataTransfer.files));
  };

  const handleRemoveAttachment = (index) => {
    setAttachmentError("");
    setFormData((prev) => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + " " + sizes[i];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, status: "NOTIFYING" });
  };

  const canSubmit =
    formData.title.trim() &&
    formData.message.trim() &&
    (formData.targetType?.value === "CAMPUS" ||
      (formData.targetType?.value === "CLASS" && formData.classId?.value) ||
      (formData.targetType?.value === "SECTION" && formData.classId?.value && formData.sectionId?.value) ||
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
              {isViewingExisting ? "Broadcast Details" : "New Broadcast"}
            </h2>
            {!isViewingExisting && (
              <p className="text-xs text-gray-500 mt-0.5">Send an announcement to your audience</p>
            )}
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

          {/* Category */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Category</p>
            {isViewingExisting ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                {CATEGORY_ICONS[formData.category?.value]} {formData.category?.label ?? "—"}
              </span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ANNOUNCEMENT_CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, category: opt }))}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      formData.category?.value === opt.value
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {CATEGORY_ICONS[opt.value]} {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send To */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Send To <span className="text-red-500">*</span>
            </p>
            {isViewingExisting ? (
              <div className="px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900">
                {formData.targetType?.label}
                {formData.classId && ` • ${formData.classId.label}`}
                {formData.sectionId && ` • ${formData.sectionId.label}`}
                {Array.isArray(formData.studentId) && formData.studentId.length > 0 &&
                  ` • ${formData.studentId.length === 1 ? formData.studentId[0].label : `${formData.studentId.length} students`}`}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Target type pills */}
                <div className="flex flex-wrap gap-2">
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
                {targetSchema.length > 0 && (
                  <div className="space-y-3 pl-1">
                    {targetSchema.map((item) => (
                      <Dropdown key={item?.type} {...item} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="title" className="text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              {!isViewingExisting && (
                <span className="text-xs text-gray-400">{formData.title.length}/100</span>
              )}
            </div>
            <input
              type="text"
              id="title"
              name="title"
              maxLength={100}
              value={formData.title}
              onChange={handleChange}
              readOnly={isViewingExisting}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 read-only:bg-gray-50 read-only:cursor-default transition-colors"
              placeholder="Give your broadcast a clear title"
              required
            />
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="message" className="text-sm font-medium text-gray-700">
                Message <span className="text-red-500">*</span>
              </label>
              {!isViewingExisting && (
                <span className="text-xs text-gray-400">{formData.message.length} chars</span>
              )}
            </div>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              readOnly={isViewingExisting}
              rows={5}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none read-only:bg-gray-50 read-only:cursor-default transition-colors"
              placeholder="Write your message here..."
              required
            />
          </div>

          {/* Attachments */}
          {isViewingExisting ? (
            formData.attachments.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Attachments ({formData.attachments.length})
                </p>
                <div className="space-y-2">
                  {formData.attachments.map((att, index) => {
                    const href = att?.fileUrl || att?.url || att?.href || att?.link;
                    const label = att?.fileName || att?.name || att?.title || `Attachment ${index + 1}`;
                    const row = (
                      <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-700 truncate font-medium flex-1">{label}</p>
                      </div>
                    );
                    return href ? (
                      <a key={att.id || index} href={href} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
                        {row}
                      </a>
                    ) : (
                      <div key={att.id || index}>{row}</div>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
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
                  className={`flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {attachmentError && (
                <p className="mt-2 text-xs text-red-600">{attachmentError}</p>
              )}

              {formData.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate font-medium">{file.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
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
          )}

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
            {isViewingExisting ? "Close" : "Cancel"}
          </Button>
          {!isViewingExisting && (
            <Button
              type="button"
              disabled={!canSubmit || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Sending..." : "Send Broadcast"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
