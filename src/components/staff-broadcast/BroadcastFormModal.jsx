import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "../../ui-components";
import TargetSelector from "../../components/TargetSelector";
import { usePermissions } from "../../store/permissions.store";
import { SECTION_TARGET_SCHEMA, STUDENT_TARGET_SCHEMA, CLASS_TARGET_SCHEMA } from "../../utils/target.schema";
import { updateSchema } from "../../utils/update.schema";

const TARGET_OPTIONS = [
  { value: "CAMPUS", label: "Entire Campus" },
  { value: "CLASS", label: "Class" },
  { value: "SECTION", label: "Section" },
  { value: "STUDENT", label: "Student" },
];

export default function BroadcastFormModal({ isOpen, onClose, onSubmit, isSubmitting, submitError }) {
  // Get permissions data from store
  const { permissions } = usePermissions();

  // Track previous modal state
  const prevIsOpenRef = useRef(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    targetType: { value: "CAMPUS", label: "Entire Campus" },
    sectionId: null,
    studentId: [],
    classId: null,
    attachments: [],
    status: "DRAFT", // DRAFT or PUBLISHED
  });

  console.log("formData", formData);

  // Error state for attachments
  const [attachmentError, setAttachmentError] = useState("");

  // Target selector modal state
  const [showTargetModal, setShowTargetModal] = useState(false);

  const targetSchema = useMemo(() => {
    let data = {
      "class": {
        selected: formData.classId,
        options: permissions.classes.map(({ class_id, class_name }) => ({
          value: class_id,
          label: class_name
        })),
        onChange: (option) => {
          setFormData((prev) => ({
            ...prev,
            classId: option,
            sectionId: null,
            studentId: [],
          }));
        },
      },
      "section": {
        selected: formData.sectionId,
        options: permissions.sections.map(({ section_id, section_name }) => ({
          value: section_id,
          label: section_name
        })),
        onChange: (option) => {
          setFormData((prev) => ({
            ...prev,
            sectionId: option,
            studentId: [],
          }));
        },
      }
    };
    
    if (formData.targetType?.value === "CAMPUS") {
      return [];
    } else if (formData.targetType?.value === "CLASS") {
      return updateSchema(CLASS_TARGET_SCHEMA, data);
    } else if (formData.targetType?.value === "SECTION") {
      return updateSchema(SECTION_TARGET_SCHEMA, data);
    } else if (formData.targetType?.value === "STUDENT") {
      data['student'] = {
        selected: formData.studentId,
        options: permissions.students.map(({ student_id, student_name, section_id }) => ({
          value: student_id,
          label: student_name,
          section_id: section_id,
        })).filter(({ section_id }) => section_id === formData.sectionId?.value),
        onChange: (options) => {
          setFormData((prev) => ({
            ...prev,
            studentId: options,
          }));
        },
      };
      return updateSchema(STUDENT_TARGET_SCHEMA, data);
    }
    return [];
  }, [formData.targetType, formData.sectionId, formData.classId, formData.studentId, permissions.classes, permissions.sections, permissions.students]);

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Modal just opened, reset form
      setFormData({
        title: "",
        message: "",
        targetType: { value: "CAMPUS", label: "Entire Campus" },
        sectionId: null,
        studentId: [],
        classId: null,
        attachments: [],
        status: "NOTIFYING",
      });
      setAttachmentError("");
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setTargetType = (type) => {
    console.log("type", type);
    setFormData((prev) => ({
      ...prev,
      targetType: type,
      sectionId: null,
      studentId: [],
      classId: null,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachmentError("");

    // Validation: Max 3 attachments
    if (formData.attachments.length + files.length > 3) {
      setAttachmentError("Maximum 3 attachments allowed");
      return;
    }

    // Validation: Each file max 10MB
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    const invalidFiles = files.filter((file) => file.size > maxSize);

    if (invalidFiles.length > 0) {
      setAttachmentError("Each file must be less than 10MB");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const handleRemoveAttachment = (index) => {
    setAttachmentError("");
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // Format target label for display
  const formatTargetLabel = () => {
    if (formData.targetType?.value === "CAMPUS") {
      return "Entire Campus";
    }

    const targetTypeLabel = TARGET_OPTIONS.find(opt => opt.value === formData.targetType?.value)?.label || "";
    const c = formData.classId?.label;
    const s = formData.sectionId?.label;

    // Handle student selection (can be array for multiple students)
    let st = "";
    if (formData.targetType?.value === "STUDENT" && Array.isArray(formData.studentId) && formData.studentId.length > 0) {
      if (formData.studentId.length === 1) {
        st = formData.studentId[0].label;
      } else {
        st = `${formData.studentId.length} students`;
      }
    }

    const parts = [targetTypeLabel, c, s, st].filter(Boolean);
    return parts.length > 0 ? parts.join(" • ") : "Select Target";
  };

  const handleSubmit = (e, status) => {
    e.preventDefault();
    onSubmit({ ...formData, status });
  };

  const canSubmit =
    formData.title.trim() &&
    formData.message.trim() &&
    (formData.targetType?.value === "CAMPUS" ||
      (formData.targetType?.value === "CLASS" && formData.classId?.value) ||
      (formData.targetType?.value === "SECTION" && formData.sectionId?.value) ||
      (formData.targetType?.value === "STUDENT" && Array.isArray(formData.studentId) && formData.studentId.length > 0));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Create New Broadcast
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Target Selection Button - Opens Modal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send To <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowTargetModal(true)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors flex justify-between items-center text-left"
            >
              <div>
                <p className="text-xs text-gray-500">Target audience</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatTargetLabel()}
                </p>
              </div>
              <span className="text-xs px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">
                Change
              </span>
            </button>
          </div>

          {/* Target Selector Modal */}
          {showTargetModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowTargetModal(false)}
              />

              <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Select Target</h3>
                  <button
                    type="button"
                    onClick={() => setShowTargetModal(false)}
                    className="text-sm px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Done
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                  <TargetSelector
                    targetType={formData.targetType}
                    handleTargetTypeChange={setTargetType}
                    TARGET_OPTIONS={TARGET_OPTIONS}
                    schema={targetSchema}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter broadcast title"
              required
            />
          </div>

          {/* Message - Increased size */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              placeholder="Enter your message"
              required
            />
          </div>

          {/* File Attachments - With validation */}
          <div>
            <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
              <span className="text-gray-500 text-xs ml-2">(Max 3 files, 10MB each)</span>
            </label>
            <input
              type="file"
              id="attachments"
              multiple
              onChange={handleFileChange}
              disabled={formData.attachments.length >= 3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />

            {/* Error message */}
            {attachmentError && (
              <p className="mt-2 text-sm text-red-600">{attachmentError}</p>
            )}

            {/* Info text */}
            {formData.attachments.length >= 3 && (
              <p className="mt-2 text-sm text-blue-600">
                Maximum attachment limit reached (3/3)
              </p>
            )}

            {/* Attachment list */}
            {formData.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="ml-3 text-red-500 hover:text-red-700 flex-shrink-0"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-800">Error</h4>
                  <p className="text-sm text-red-700 mt-1">{submitError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canSubmit || isSubmitting}
              onClick={(e) => handleSubmit(e, "NOTIFYING")}
            >
              {isSubmitting ? "Sending..." : "Send"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
