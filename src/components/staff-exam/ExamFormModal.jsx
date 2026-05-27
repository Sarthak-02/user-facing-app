import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui-components";
import TargetSelector from "../TargetSelector";
import { usePermissions } from "../../store/permissions.store";
import { useAuth } from "../../store/auth.store";
import { SECTION_TARGET_SCHEMA, STUDENT_TARGET_SCHEMA, CLASS_TARGET_SCHEMA } from "../../utils/target.schema";
import { updateSchema } from "../../utils/update.schema";

const GRADING_TYPE_BADGE = {
  PERCENTAGE: "bg-blue-100 text-blue-700",
  GPA: "bg-purple-100 text-purple-700",
  PASS_FAIL: "bg-green-100 text-green-700",
  LETTER_GRADE: "bg-orange-100 text-orange-700",
};

const GRADING_TYPE_SHORT = {
  PERCENTAGE: "Percentage",
  GPA: "GPA",
  PASS_FAIL: "Pass / Fail",
  LETTER_GRADE: "Letter Grade",
};

export default function ExamFormModal({ isOpen, onClose, onSubmit, exam, isSubmitting, submitError }) {
  const { t } = useTranslation();
  const isEditing = !!exam;

  const { permissions } = usePermissions();

  const {
    auth: {
      campus: { campus_exam_types, class_grading_config },
    },
  } = useAuth();

  const targetOpts = useMemo(
    () => [
      { value: "CLASS", label: t("broadcast.targetOptions.class") },
      { value: "SECTION", label: t("broadcast.targetOptions.section") },
      { value: "STUDENT", label: t("broadcast.targetOptions.student") },
    ],
    [t]
  );

  const pickExamTarget = useCallback(
    (value) => targetOpts.find((o) => o.value === value) ?? targetOpts[0],
    [targetOpts]
  );

  const EXAM_TYPE_OPTIONS = useMemo(
    () =>
      (campus_exam_types || []).map((examType) => {
        const key = `exams.examTypes.${examType}`;
        const translated = t(key);
        return { value: examType, label: translated === key ? examType : translated };
      }),
    [campus_exam_types, t]
  );

  const gradingConfigs = useMemo(
    () => class_grading_config?.GRADING_CONFIGS || [],
    [class_grading_config]
  );

  // Current step in the form (1-4)
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    examType: "",
    customExamType: "",
    targetType: pickExamTarget("CLASS"),
    classId: null,
    sectionId: [],
    studentId: [],
    subjects: [{ subjectId: "", subjectName: "", examDate: "", startTime: "", endTime: "" }],
    gradingConfigId: "",
    gradingType: "",
    passingValue: "",
    maxValue: "",
    status: "DRAFT",
  });

  const subjects = useMemo(() => {
    return permissions.teacher_subjects.map((subject) => ({
      value: subject,
      label: subject
    }));
  }, [permissions.teacher_subjects]);

  const canAddAnotherSubject = useMemo(() => {
    const current = formData.subjects?.[0];
    if (!current) return true;
    const hasSubject = !!(current.subjectId && (current.subjectId.value || current.subjectId.label));
    const hasDate = !!current.examDate;
    const hasStart = !!current.startTime;
    const hasEnd = !!current.endTime;
    return hasSubject && hasDate && hasStart && hasEnd;
  }, [formData.subjects]);

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
            sectionId: [],
            studentId: [],
            subjects: [{ subjectId: "", subjectName: "", examDate: "", startTime: "", endTime: "" }],
          }));
        },
      },
      "section": {
        selected: formData.sectionId,
        options: (formData.classId?.value
          ? permissions.sections.filter((s) => s.class_id === formData.classId.value)
          : []
        ).map(({ section_id, section_name }) => ({
          value: section_id,
          label: section_name
        })),
        onChange: (optionOrOptions) => {
          setFormData((prev) => ({
            ...prev,
            sectionId: optionOrOptions,
            studentId: [],
            subjects: [{ subjectId: "", subjectName: "", examDate: "", startTime: "", endTime: "" }],
          }));
        },
      }
    }
    if (formData.targetType?.value === "CLASS") {
      return updateSchema(CLASS_TARGET_SCHEMA, data);
    } else if (formData.targetType?.value === "SECTION") {
      return updateSchema(SECTION_TARGET_SCHEMA, data);
    } else if (formData.targetType?.value === "STUDENT") {
      data['student'] = {
        selected: formData.studentId,
        options: permissions.students
          .map(({ student_id, student_name, section_id }) => ({
            value: student_id,
            label: student_name,
            section_id: section_id,
          }))
          .filter(({ section_id }) => {
            const selectedSections = Array.isArray(formData.sectionId)
              ? formData.sectionId
              : formData.sectionId
                ? [formData.sectionId]
                : [];
            if (selectedSections.length === 0) return false;
            return selectedSections.some((s) => s?.value === section_id);
          }),
        onChange: (options) => {
          setFormData((prev) => ({
            ...prev,
            studentId: options,
          }));
        },
      }
      return updateSchema(STUDENT_TARGET_SCHEMA, data);
    }
  }, [formData.targetType, formData.sectionId, formData.classId, formData.studentId, permissions.classes, permissions.sections, permissions.students]);

  // Initialize form when exam changes
  useEffect(() => {
    let timeoutId;
    if (exam) {
      // Determine target type and extract target IDs from the targets array
      let targetType = pickExamTarget("CLASS");
      let classId = null;
      let sectionId = [];
      let studentId = [];

      if (exam.targets && exam.targets.length > 0) {
        const firstTarget = exam.targets[0];
        
        if (firstTarget.targetType === "CLASS") {
          targetType = pickExamTarget("CLASS");
          // Find the class in permissions to get the label
          const classItem = permissions.classes?.find(c => c.class_id === firstTarget.targetId);
          classId = classItem ? { value: classItem.class_id, label: classItem.class_name } : null;
        } else if (firstTarget.targetType === "SECTION") {
          targetType = pickExamTarget("SECTION");
          const sectionTargets = exam.targets
            .map((t) => permissions.sections?.find((s) => s.section_id === t.targetId))
            .filter(Boolean);
          sectionId = sectionTargets.map((s) => ({ value: s.section_id, label: s.section_name }));
          const firstSection = sectionTargets[0];
          if (firstSection) {
            const classItem = permissions.classes?.find((c) => c.class_id === firstSection.class_id);
            classId = classItem ? { value: classItem.class_id, label: classItem.class_name } : null;
          }
        } else if (firstTarget.targetType === "STUDENT") {
          targetType = pickExamTarget("STUDENT");
          studentId = exam.targets.map(target => {
            const studentItem = permissions.students?.find(s => s.student_id === target.targetId);
            return studentItem ? { value: studentItem.student_id, label: studentItem.student_name } : null;
          }).filter(Boolean);
          const sectionIds = Array.from(
            new Set(
              exam.targets
                .map((t) => permissions.students?.find((s) => s.student_id === t.targetId)?.section_id)
                .filter(Boolean)
            )
          );
          const sectionTargets = sectionIds
            .map((sid) => permissions.sections?.find((s) => s.section_id === sid))
            .filter(Boolean);
          sectionId = sectionTargets.map((s) => ({ value: s.section_id, label: s.section_name }));
          const firstSection = sectionTargets[0];
          if (firstSection) {
            const classItem = permissions.classes?.find((c) => c.class_id === firstSection.class_id);
            classId = classItem ? { value: classItem.class_id, label: classItem.class_name } : null;
          }
        }
      }

      // Transform subjects to match dropdown format
      const transformedSubjects = exam.subjects && exam.subjects.length > 0
        ? exam.subjects.map(sub => ({
            subjectId: { value: sub.subjectName, label: sub.subjectName }, // Transform to dropdown format
            subjectName: sub.subjectName,
            examDate: sub.examDate || "",
            startTime: sub.startTime || "",
            endTime: sub.endTime || "",
          }))
        : [{ subjectId: "", subjectName: "", examDate: "", startTime: "", endTime: "" }];

      // Match the saved grading values back to a config preset
      const matchedConfig = (class_grading_config?.GRADING_CONFIGS || []).find(
        (cfg) =>
          cfg.gradingType === (exam.gradingType || "") &&
          String(cfg.maxValue ?? "") === String(exam.maxValue ?? "") &&
          String(cfg.passingValue ?? "") === String(exam.passingValue ?? "")
      );

      const nextFormData = {
        examType: exam.examType || "",
        customExamType: exam.customExamType || "",
        targetType: targetType,
        classId: classId,
        sectionId: sectionId,
        studentId: studentId,
        subjects: transformedSubjects,
        gradingConfigId: matchedConfig?.id || "",
        gradingType: exam.gradingType || "",
        passingValue: exam.passingValue || "",
        maxValue: exam.maxValue || "",
        status: exam.status || "DRAFT",
      };

      timeoutId = setTimeout(() => {
        setFormData(nextFormData);
        setCurrentStep(1);
      }, 0);
    } else {
      const nextFormData = {
        examType: "",
        customExamType: "",
        targetType: pickExamTarget("CLASS"),
        classId: null,
        sectionId: [],
        studentId: [],
        subjects: [{ subjectId: "", subjectName: "", examDate: "", startTime: "", endTime: "" }],
        gradingConfigId: "",
        gradingType: "",
        passingValue: "",
        maxValue: "",
        status: "DRAFT",
      };

      timeoutId = setTimeout(() => {
        setFormData(nextFormData);
        setCurrentStep(1);
      }, 0);
    }
    return () => clearTimeout(timeoutId);
  }, [exam, isOpen, permissions.classes, permissions.sections, permissions.students, targetOpts, pickExamTarget]);

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
      classId: null,
      sectionId: [],
      studentId: [],
      subjects: [{ subjectId: "", subjectName: "", examDate: "", startTime: "", endTime: "" }],
    }));
  };

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...formData.subjects];
    
    // If subject dropdown is changed, store the entire option object and update subjectName
    if (field === "subjectId") {
      updatedSubjects[index].subjectId = value; // Store the entire option object {value, label}
      updatedSubjects[index].subjectName = value?.label || value?.value || "";
    } else {
      updatedSubjects[index][field] = value;
    }

    setFormData(prev => ({ ...prev, subjects: updatedSubjects }));
  };

  const addSubject = () => {
    if (!canAddAnotherSubject) return;
    setFormData(prev => ({
      ...prev,
      subjects: [{ subjectId: "", subjectName: "", examDate: "", startTime: "", endTime: "" }, ...prev.subjects]
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


  const formatTargetLabel = () => {
    const targetTypeLabel = targetOpts.find((opt) => opt.value === formData.targetType?.value)?.label || "";

    let c = "";
    if (formData.classId?.label) {
      c = formData.classId.label;
    } else if (formData.classId?.value) {
      c = permissions.classes.find((x) => x.class_id === formData.classId?.value)?.class_name;
    }

    const selectedSections = Array.isArray(formData.sectionId)
      ? formData.sectionId
      : formData.sectionId
        ? [formData.sectionId]
        : [];
    const s =
      selectedSections.length === 0
        ? ""
        : selectedSections.length === 1
          ? selectedSections[0]?.label || ""
          : t("exams.multiSectionSummary", { count: selectedSections.length });

    let st = "";
    if (formData.targetType?.value === "STUDENT" && Array.isArray(formData.studentId) && formData.studentId.length > 0) {
      if (formData.studentId.length === 1) {
        st = formData.studentId[0].label;
      } else {
        st = t("exams.multiStudentSummary", { count: formData.studentId.length });
      }
    }

    const parts = [targetTypeLabel, c, s, st].filter(Boolean);
    return parts.length > 0 ? parts.join(" • ") : t("exams.selectTargetFallback");
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
    (formData.targetType?.value === "CLASS" && !!formData.classId?.value) ||
    (formData.targetType?.value === "SECTION" &&
      formData.classId?.value &&
      Array.isArray(formData.sectionId) &&
      formData.sectionId.length > 0) ||
    (formData.targetType?.value === "STUDENT" &&
      formData.classId?.value &&
      !!formData.sectionId?.value &&
      Array.isArray(formData.studentId) &&
      formData.studentId.length > 0);
  const canProceedStep3 = formData.subjects.every(
    sub => sub.subjectId?.value && sub.examDate && sub.startTime && sub.endTime
  );
  const canProceedStep4 = !!formData.gradingConfigId;

  const canSubmit = canProceedStep1 && canProceedStep2 && canProceedStep3 && canProceedStep4;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-16 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header with Progress */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? t("exams.editExam") : t("exams.createNewExam")}
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${step === currentStep
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
                    {step === 1 && t("exams.steps.examType")}
                    {step === 2 && t("exams.steps.target")}
                    {step === 3 && t("exams.steps.subjectsAndDates")}
                    {step === 4 && t("exams.steps.grading")}
                  </p>
                </div>
                {step < 4 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-colors ${step < currentStep ? "bg-green-500" : "bg-gray-200"
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("exams.selectExamType")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {EXAM_TYPE_OPTIONS.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, examType: type.value }))}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${formData.examType === type.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.examType === type.value
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
                    {t("exams.customExamType")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customExamType"
                    value={formData.customExamType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t("exams.customExamTypePlaceholder")}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("exams.selectTargetAudience")}</h3>
                <div className="mb-4">
                  <div className="p-4 rounded-lg border border-gray-300 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-1">{t("exams.selectedTarget")}</p>
                    <p className="text-base font-semibold text-gray-900">{formatTargetLabel()}</p>
                  </div>
                </div>
                <TargetSelector
                  targetType={formData.targetType}
                  handleTargetTypeChange={setTargetType}
                  TARGET_OPTIONS={targetOpts}
                  schema={targetSchema}
                />
              </div>
            </div>
          )}

          {/* Step 3: Subjects and Dates */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{t("exams.subjectsAndSchedule")}</h3>
                <Button
                  type="button"
                  onClick={addSubject}
                  size="sm"
                  variant="secondary"
                  disabled={!canAddAnotherSubject}
                >
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
                  {t("exams.addSubject")}
                </Button>
              </div>

              <div className="space-y-4">
                {formData.subjects.map((subject, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{t("exams.subject", { index: index + 1 })}</h4>
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
                          {t("exams.subjectLabel")} <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={subject.subjectId?.value || ""}
                          onChange={(e) => {
                            const selectedValue = e.target.value;
                            const option =
                              subjects.find((o) => o.value === selectedValue) || {
                                value: selectedValue,
                                label: selectedValue,
                              };
                            handleSubjectChange(index, "subjectId", option);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={subjects.length === 0}
                          required
                        >
                          <option value="" disabled>
                            {t("common.select")}
                          </option>
                          {subjects.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t("exams.examDate")} <span className="text-red-500">*</span>
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
                            {t("exams.startTime")} <span className="text-red-500">*</span>
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
                            {t("exams.endTime")} <span className="text-red-500">*</span>
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
              <h3 className="text-lg font-semibold text-gray-900">{t("exams.gradingConfiguration")}</h3>

              {gradingConfigs.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">{t("exams.noGradingConfigs")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {gradingConfigs.map((config) => {
                    const isSelected = formData.gradingConfigId === config.id;
                    return (
                      <button
                        key={config.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            gradingConfigId: config.id,
                            gradingType: config.gradingType,
                            maxValue: config.maxValue?.toString() ?? "",
                            passingValue: config.passingValue?.toString() ?? "",
                          }))
                        }
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                              isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900">{config.label}</span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  GRADING_TYPE_BADGE[config.gradingType] ?? "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {GRADING_TYPE_SHORT[config.gradingType] ?? config.gradingType}
                              </span>
                            </div>
                            {config.description && (
                              <p className="text-sm text-gray-500 mt-0.5">{config.description}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected config summary */}
              {formData.gradingConfigId && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">{t("exams.selectedGradingConfig")}</p>
                  <div className="flex items-center gap-3 flex-wrap text-sm font-medium text-gray-800">
                    <span>{GRADING_TYPE_SHORT[formData.gradingType] ?? formData.gradingType}</span>
                    {formData.maxValue && (
                      <span className="text-gray-400">·</span>
                    )}
                    {formData.maxValue && (
                      <span>
                        {formData.gradingType === "PERCENTAGE"
                          ? `${t("exams.maximumMarks")}: ${formData.maxValue}`
                          : formData.gradingType === "GPA"
                          ? `${t("exams.maximumGpa")}: ${formData.maxValue}`
                          : formData.gradingType === "LETTER_GRADE"
                          ? `${t("exams.maximumGrade")}: ${formData.maxValue}`
                          : null}
                      </span>
                    )}
                    {formData.passingValue && (
                      <>
                        <span className="text-gray-400">·</span>
                        <span>
                          {formData.gradingType === "PERCENTAGE"
                            ? `${t("exams.passingMarks")}: ${formData.passingValue}`
                            : formData.gradingType === "GPA"
                            ? `${t("exams.passingGpa")}: ${formData.passingValue}`
                            : formData.gradingType === "LETTER_GRADE"
                            ? `${t("exams.passingGrade")}: ${formData.passingValue}`
                            : null}
                        </span>
                      </>
                    )}
                  </div>
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
                  <h4 className="text-sm font-semibold text-red-800">{t("exams.error")}</h4>
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
                  {t("common.previous")}
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
                  {t("common.next")}
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!canSubmit || isSubmitting}
                    onClick={() => handleSubmit("DRAFT")}
                  >
                    {isSubmitting ? t("exams.savingDraft") : t("exams.saveAsDraft")}
                  </Button>
                  <Button
                    type="button"
                    disabled={!canSubmit || isSubmitting}
                    onClick={() => handleSubmit("PUBLISHED")}
                  >
                    {isSubmitting ? t("exams.publishing") : t("exams.publishExam")}
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
