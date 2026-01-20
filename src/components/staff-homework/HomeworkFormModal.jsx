import { useState, useEffect, useMemo } from "react";
import { Button } from "../../ui-components";
import TargetSelector from "../../components/TargetSelector";

// Mock data - Replace with actual API calls
const CLASSES = [
  { id: "c1", name: "Class 9" },
  { id: "c2", name: "Class 10" },
  { id: "c3", name: "Class 11" },
];

const SECTIONS_BY_CLASS_ID = {
    c1: [
      { id: "s1", name: "Section A" },
      { id: "s2", name: "Section B" },
    ],
    c2: [
      { id: "s3", name: "Section A" },
      { id: "s4", name: "Section B" },
    ],
    c3: [{ id: "s5", name: "Section A" }],
  };

const STUDENTS_BY_SECTION_ID = {
  s1: [
    { id: "st1", name: "Aarav Sharma" },
    { id: "st2", name: "Diya Singh" },
  ],
  s2: [
    { id: "st3", name: "Kabir Verma" },
    { id: "st4", name: "Ananya Patel" },
  ],
  s3: [
    { id: "st5", name: "Rohan Kumar" },
    { id: "st6", name: "Priya Gupta" },
  ],
  s4: [
    { id: "st7", name: "Arjun Mehta" },
    { id: "st8", name: "Ishita Reddy" },
  ],
  s5: [
    { id: "st9", name: "Vikram Singh" },
    { id: "st10", name: "Sneha Iyer" },
  ],
};

// Subjects mapped by class and section - Mock data, replace with API call
const SUBJECTS_BY_CLASS_ID = {
    c1: [
      { id: "sub1", name: "Mathematics" },
      { id: "sub2", name: "Science" },
      { id: "sub3", name: "English" },
      { id: "sub4", name: "Hindi" },
      { id: "sub5", name: "Social Studies" },
    ],
    c2: [
      { id: "sub1", name: "Mathematics" },
      { id: "sub7", name: "Physics" },
      { id: "sub8", name: "Chemistry" },
      { id: "sub9", name: "Biology" },
      { id: "sub3", name: "English" },
    ],
    c3: [
      { id: "sub1", name: "Mathematics" },
      { id: "sub7", name: "Physics" },
      { id: "sub8", name: "Chemistry" },
      { id: "sub10", name: "Computer Science" },
      { id: "sub3", name: "English" },
    ],
  };

const SUBJECTS_BY_SECTION_ID = {
  s1: [
    { id: "sub1", name: "Mathematics" },
    { id: "sub2", name: "Science" },
    { id: "sub3", name: "English" },
    { id: "sub4", name: "Hindi" },
    { id: "sub5", name: "Social Studies" },
  ],
  s2: [
    { id: "sub1", name: "Mathematics" },
    { id: "sub2", name: "Science" },
    { id: "sub3", name: "English" },
    { id: "sub6", name: "Computer Science" },
  ],
  s3: [
    { id: "sub1", name: "Mathematics" },
    { id: "sub7", name: "Physics" },
    { id: "sub8", name: "Chemistry" },
    { id: "sub9", name: "Biology" },
    { id: "sub3", name: "English" },
  ],
  s4: [
    { id: "sub1", name: "Mathematics" },
    { id: "sub7", name: "Physics" },
    { id: "sub8", name: "Chemistry" },
    { id: "sub9", name: "Biology" },
    { id: "sub3", name: "English" },
  ],
  s5: [
    { id: "sub1", name: "Mathematics" },
    { id: "sub7", name: "Physics" },
    { id: "sub8", name: "Chemistry" },
    { id: "sub10", name: "Computer Science" },
    { id: "sub3", name: "English" },
  ],
};

const TARGET_OPTIONS = [
  { value: "CLASS", label: "Class" },
  { value: "SECTION", label: "Section" },
  { value: "STUDENT", label: "Student",multiple: true },
];

export default function HomeworkFormModal({ isOpen, onClose, onSubmit, homework }) {
  const isEditing = !!homework;
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
    dueDate: "",
    targetType: "SECTION", // CLASS, SECTION, STUDENT
    classId: "",
    sectionId: "",
    studentId: "",
    attachments: [],
  });

  // Error state for attachments
  const [attachmentError, setAttachmentError] = useState("");
  
  // Target selector modal state
  const [showTargetModal, setShowTargetModal] = useState(false);

  const sections = useMemo(
    () => SECTIONS_BY_CLASS_ID[formData.classId] || [],
    [formData.classId]
  );

  const students = useMemo(
    () => STUDENTS_BY_SECTION_ID[formData.sectionId] || [],
    [formData.sectionId]
  );

  // Get subjects based on target type: use section if available, otherwise use class
  const subjects = useMemo(() => {
    if (formData.targetType === "CLASS" && formData.classId) {
      return SUBJECTS_BY_CLASS_ID[formData.classId] || [];
    }
    if (formData.sectionId) {
      return SUBJECTS_BY_SECTION_ID[formData.sectionId] || [];
    }
    return [];
  }, [formData.targetType, formData.classId, formData.sectionId]);

  // Initialize form when homework changes
  useEffect(() => {
    if (homework) {
      // eslint-disable-next-line
      setFormData({
        title: homework.title || "",
        subject: homework.subject || "",
        description: homework.description || "",
        dueDate: homework.dueDate || "",
        targetType: "SECTION",
        classId: "",
        sectionId: "",
        studentId: "",
        attachments: [],
      });
    } else {
      // Reset form for new homework
      setFormData({
        title: "",
        subject: "",
        description: "",
        dueDate: "",
        targetType: "SECTION",
        classId: "",
        sectionId: "",
        studentId: "",
        attachments: [],
      });
    }
  }, [homework, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setTargetType = (type) => {
    setFormData((prev) => ({
      ...prev,
      targetType: type,
    }));
  };

  const setClassId = (classId) => {
    setFormData((prev) => ({
      ...prev,
      classId,
      sectionId: "",
      studentId: "",
      subject: "", // Reset subject when class changes
    }));
  };

  const setSectionId = (sectionId) => {
    setFormData((prev) => ({
      ...prev,
      sectionId,
      studentId: "",
      subject: "", // Reset subject when section changes
    }));
  };

  const setStudentId = (studentId) => {
    setFormData((prev) => ({
      ...prev,
      studentId,
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
    const targetTypeLabel = TARGET_OPTIONS.find(opt => opt.value === formData.targetType)?.label || "";
    const c = CLASSES.find((x) => x.id === formData.classId)?.name;
    const s = sections.find((x) => x.id === formData.sectionId)?.name;
    const st = students.find((x) => x.id === formData.studentId)?.name;
    
    const parts = [targetTypeLabel, c, s, st].filter(Boolean);
    return parts.length > 0 ? parts.join(" • ") : "Select Target";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const canSubmit =
    formData.title.trim() &&
    formData.subject.trim() &&
    formData.description.trim() &&
    formData.dueDate &&
    ((formData.targetType === "CLASS" && formData.classId) ||
      (formData.targetType === "SECTION" && formData.sectionId) ||
      (formData.targetType === "STUDENT" && formData.studentId));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? "Edit Homework" : "Create New Homework"}
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
              Assign To <span className="text-red-500">*</span>
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
                    setTargetType={setTargetType}
                    classId={formData.classId}
                    sectionId={formData.sectionId}
                    studentId={formData.studentId}
                    classes={CLASSES}
                    sections={sections}
                    students={students}
                    setClassId={setClassId}
                    setSectionId={setSectionId}
                    setStudentId={setStudentId}
                    TARGET_OPTIONS={TARGET_OPTIONS}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Subject - Now a dropdown based on class/section */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={
                (formData.targetType === "CLASS" && !formData.classId) ||
                ((formData.targetType === "SECTION" || formData.targetType === "STUDENT") && !formData.sectionId)
              }
              required
            >
              <option value="">
                {subjects.length > 0
                  ? "Select a subject" 
                  : formData.targetType === "CLASS"
                  ? "Please select a class first"
                  : "Please select a section first"}
              </option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.name}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

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
              placeholder="Enter homework title"
              required
            />
          </div>

          {/* Description - Increased size */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              placeholder="Enter homework instructions and details"
              required
            />
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isEditing ? "Update Homework" : "Create Homework"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
