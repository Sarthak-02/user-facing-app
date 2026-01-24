import { useState, useEffect, useMemo } from "react";
import { Button } from "../../ui-components";
import TargetSelector from "../TargetSelector";

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
  { value: "STUDENT", label: "Student", multiple: true },
];

const EXAM_TYPES = [
  { value: "UNIT_TEST", label: "Unit Test" },
  { value: "MID_TERM", label: "Mid Term" },
  { value: "FINAL", label: "Final Exam" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "HALF_YEARLY", label: "Half Yearly" },
  { value: "ANNUAL", label: "Annual" },
  { value: "OTHER", label: "Other" },
];

const GRADING_TYPES = [
  { value: "PERCENTAGE", label: "Percentage (0-100)" },
  { value: "GPA", label: "GPA (0-4.0)" },
  { value: "LETTER_GRADE", label: "Letter Grade (A-F)" },
  { value: "PASS_FAIL", label: "Pass/Fail" },
];

const LETTER_GRADES = [
  { value: "A+", label: "A+" },
  { value: "A", label: "A" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B", label: "B" },
  { value: "B-", label: "B-" },
  { value: "C+", label: "C+" },
  { value: "C", label: "C" },
  { value: "C-", label: "C-" },
  { value: "D+", label: "D+" },
  { value: "D", label: "D" },
  { value: "D-", label: "D-" },
  { value: "F", label: "F" },
];

export default function ExamFormModal({ isOpen, onClose, onSubmit, exam, isSubmitting, submitError }) {
  const isEditing = !!exam;
  
  // Current step in the form (1-4)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [formData, setFormData] = useState({
    examType: "",
    customExamType: "",
    targetType: "SECTION",
    classId: "",
    sectionId: "",
    studentId: "",
    subjects: [{ subjectId: "", subjectName: "", examDate: "", startTime: "", endTime: "" }],
    gradingType: "PERCENTAGE",
    passingValue: "",
    maxValue: "",
    gradeRanges: [
      { grade: "A", minMarks: 90, maxMarks: 100 },
      { grade: "B", minMarks: 80, maxMarks: 89 },
      { grade: "C", minMarks: 70, maxMarks: 79 },
      { grade: "D", minMarks: 60, maxMarks: 69 },
      { grade: "F", minMarks: 0, maxMarks: 59 },
    ],
    status: "DRAFT",
  });

  const sections = useMemo(
    () => SECTIONS_BY_CLASS_ID[formData.classId] || [],
    [formData.classId]
  );

  const students = useMemo(
    () => STUDENTS_BY_SECTION_ID[formData.sectionId] || [],
    [formData.sectionId]
  );

  const subjects = useMemo(() => {
    if (formData.targetType === "CLASS" && formData.classId) {
      return SUBJECTS_BY_CLASS_ID[formData.classId] || [];
    }
    if (formData.sectionId) {
      return SUBJECTS_BY_SECTION_ID[formData.sectionId] || [];
    }
    return [];
  }, [formData.targetType, formData.classId, formData.sectionId]);

  // Initialize form when exam changes
  useEffect(() => {
    if (exam) {
      // Load existing exam data
      setFormData({
        examType: exam.examType || "",
        customExamType: exam.customExamType || "",
        targetType: "SECTION",
        classId: "",
        sectionId: "",
        studentId: "",
        subjects: exam.subjects || [{ subjectId: "", subjectName: "", examDate: "", startTime: "", endTime: "" }],
        gradingType: exam.gradingType || "PERCENTAGE",
        passingValue: exam.passingValue || "",
        maxValue: exam.maxValue || "",
        gradeRanges: exam.gradeRanges || [
          { grade: "A", minMarks: 90, maxMarks: 100 },
          { grade: "B", minMarks: 80, maxMarks: 89 },
          { grade: "C", minMarks: 70, maxMarks: 79 },
          { grade: "D", minMarks: 60, maxMarks: 69 },
          { grade: "F", minMarks: 0, maxMarks: 59 },
        ],
        status: exam.status || "DRAFT",
      });
    } else {
      // Reset form for new exam
      setFormData({
        examType: "",
        customExamType: "",
        targetType: "SECTION",
        classId: "",
        sectionId: "",
        studentId: "",
        subjects: [{ subjectId: "", subjectName: "", examDate: "", startTime: "", endTime: "" }],
        gradingType: "PERCENTAGE",
        passingValue: "",
        maxValue: "",
        gradeRanges: [
          { grade: "A", minMarks: 90, maxMarks: 100 },
          { grade: "B", minMarks: 80, maxMarks: 89 },
          { grade: "C", minMarks: 70, maxMarks: 79 },
          { grade: "D", minMarks: 60, maxMarks: 69 },
          { grade: "F", minMarks: 0, maxMarks: 59 },
        ],
        status: "DRAFT",
      });
    }
    setCurrentStep(1);
  }, [exam, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === "checkbox" ? checked : value 
    }));
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
      subjects: [{ subjectId: "", subjectName: "", examDate: "", startTime: "", endTime: "" }],
    }));
  };

  const setSectionId = (sectionId) => {
    setFormData((prev) => ({
      ...prev,
      sectionId,
      studentId: "",
      subjects: [{ subjectId: "", subjectName: "", examDate: "", startTime: "", endTime: "" }],
    }));
  };

  const setStudentId = (studentId) => {
    setFormData((prev) => ({
      ...prev,
      studentId,
    }));
  };

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...formData.subjects];
    updatedSubjects[index][field] = value;
    
    // If subject is selected, update subject name
    if (field === "subjectId") {
      const subject = subjects.find(s => s.id === value);
      updatedSubjects[index].subjectName = subject?.name || "";
    }
    
    setFormData(prev => ({ ...prev, subjects: updatedSubjects }));
  };

  const addSubject = () => {
    setFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, { subjectId: "", subjectName: "", examDate: "", startTime: "", endTime: "" }]
    }));
  };

  const removeSubject = (index) => {
    if (formData.subjects.length > 1) {
      setFormData(prev => ({
        ...prev,
        subjects: prev.subjects.filter((_, i) => i !== index)
      }));
    }
  };

  const handleGradeRangeChange = (index, field, value) => {
    const updatedRanges = [...formData.gradeRanges];
    updatedRanges[index][field] = field === "grade" ? value : Number(value);
    setFormData(prev => ({ ...prev, gradeRanges: updatedRanges }));
  };

  const addGradeRange = () => {
    setFormData(prev => ({
      ...prev,
      gradeRanges: [...prev.gradeRanges, { grade: "", minMarks: 0, maxMarks: 0 }]
    }));
  };

  const removeGradeRange = (index) => {
    if (formData.gradeRanges.length > 1) {
      setFormData(prev => ({
        ...prev,
        gradeRanges: prev.gradeRanges.filter((_, i) => i !== index)
      }));
    }
  };

  const formatTargetLabel = () => {
    const targetTypeLabel = TARGET_OPTIONS.find(opt => opt.value === formData.targetType)?.label || "";
    const c = CLASSES.find((x) => x.id === formData.classId)?.name;
    const s = sections.find((x) => x.id === formData.sectionId)?.name;
    const st = students.find((x) => x.id === formData.studentId)?.name;
    
    const parts = [targetTypeLabel, c, s, st].filter(Boolean);
    return parts.length > 0 ? parts.join(" • ") : "Select Target";
  };

  const handleSubmit = (status) => {
    onSubmit({ ...formData, status });
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Validation for each step
  const canProceedStep1 = formData.examType && (formData.examType !== "OTHER" || formData.customExamType);
  const canProceedStep2 = 
    (formData.targetType === "CLASS" && formData.classId) ||
    (formData.targetType === "SECTION" && formData.sectionId) ||
    (formData.targetType === "STUDENT" && formData.studentId);
  const canProceedStep3 = formData.subjects.every(
    sub => sub.subjectId && sub.examDate && sub.startTime && sub.endTime
  );
  const canProceedStep4 = formData.gradingType && (
    formData.gradingType === "PASS_FAIL" || 
    (formData.passingValue && formData.maxValue)
  );

  const canSubmit = canProceedStep1 && canProceedStep2 && canProceedStep3 && canProceedStep4;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with Progress */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? "Edit Exam" : "Create New Exam"}
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

          {/* Progress Indicator */}
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      step === currentStep
                        ? "bg-blue-500 text-white"
                        : step < currentStep
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step < currentStep ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      step
                    )}
                  </div>
                  <p className="text-xs mt-2 text-center font-medium">
                    {step === 1 && "Exam Type"}
                    {step === 2 && "Target"}
                    {step === 3 && "Subjects & Dates"}
                    {step === 4 && "Grading"}
                  </p>
                </div>
                {step < 4 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-colors ${
                      step < currentStep ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Exam Type */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Exam Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {EXAM_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, examType: type.value }))}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        formData.examType === type.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            formData.examType === type.value
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {formData.examType === type.value && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="font-medium text-gray-900">{type.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Exam Type Input */}
              {formData.examType === "OTHER" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Exam Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customExamType"
                    value={formData.customExamType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter custom exam type"
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Target Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Target Audience</h3>
                <div className="mb-4">
                  <div className="p-4 rounded-lg border border-gray-300 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-1">Selected Target:</p>
                    <p className="text-base font-semibold text-gray-900">{formatTargetLabel()}</p>
                  </div>
                </div>
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
          )}

          {/* Step 3: Subjects and Dates */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Subjects & Exam Schedule</h3>
                <Button type="button" onClick={addSubject} size="sm" variant="secondary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Subject
                </Button>
              </div>

              <div className="space-y-4">
                {formData.subjects.map((subject, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Subject {index + 1}</h4>
                      {formData.subjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubject(index)}
                          className="text-red-500 hover:text-red-700"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subject <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={subject.subjectId}
                          onChange={(e) => handleSubjectChange(index, "subjectId", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={subjects.length === 0}
                          required
                        >
                          <option value="">
                            {subjects.length > 0
                              ? "Select a subject"
                              : formData.targetType === "CLASS"
                              ? "Please select a class first"
                              : "Please select a section first"}
                          </option>
                          {subjects.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Exam Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={subject.examDate}
                          onChange={(e) => handleSubjectChange(index, "examDate", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Time <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            value={subject.startTime}
                            onChange={(e) => handleSubjectChange(index, "startTime", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Time <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            value={subject.endTime}
                            onChange={(e) => handleSubjectChange(index, "endTime", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Grading Configuration */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Grading Configuration</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grading Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="gradingType"
                  value={formData.gradingType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {GRADING_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Percentage: Max Marks and Passing Marks */}
              {formData.gradingType === "PERCENTAGE" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Marks <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="maxValue"
                      value={formData.maxValue}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="100"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passing Marks <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="passingValue"
                      value={formData.passingValue}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="40"
                      min="0"
                      max={formData.maxValue}
                      required
                    />
                  </div>
                </div>
              )}

              {/* GPA: Max GPA and Passing GPA */}
              {formData.gradingType === "GPA" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum GPA <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="maxValue"
                      value={formData.maxValue}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="4.0"
                      min="0"
                      max="10"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passing GPA <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="passingValue"
                      value={formData.passingValue}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="2.0"
                      min="0"
                      max={formData.maxValue}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Letter Grade: Dropdown for Maximum and Passing Grade */}
              {formData.gradingType === "LETTER_GRADE" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Grade <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="maxValue"
                      value={formData.maxValue}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select maximum grade</option>
                      {LETTER_GRADES.map((grade) => (
                        <option key={grade.value} value={grade.value}>
                          {grade.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passing Grade <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="passingValue"
                      value={formData.passingValue}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select passing grade</option>
                      {LETTER_GRADES.map((grade) => (
                        <option key={grade.value} value={grade.value}>
                          {grade.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Pass/Fail: No additional fields needed */}
              {formData.gradingType === "PASS_FAIL" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">Pass/Fail Grading:</span> Students will receive either "Pass" or "Fail" based on their performance. No additional configuration required.
                  </p>
                </div>
              )}
            </div>
          )}

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
        </div>

        {/* Footer with Navigation */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {currentStep > 1 && (
                <Button type="button" variant="secondary" onClick={handlePrevious} disabled={isSubmitting}>
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    isSubmitting ||
                    (currentStep === 1 && !canProceedStep1) ||
                    (currentStep === 2 && !canProceedStep2) ||
                    (currentStep === 3 && !canProceedStep3)
                  }
                >
                  Next
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!canSubmit || isSubmitting}
                    onClick={() => handleSubmit("DRAFT")}
                  >
                    {isSubmitting ? "Saving..." : "Save as Draft"}
                  </Button>
                  <Button
                    type="button"
                    disabled={!canSubmit || isSubmitting}
                    onClick={() => handleSubmit("PUBLISHED")}
                  >
                    {isSubmitting ? "Publishing..." : "Publish Exam"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
