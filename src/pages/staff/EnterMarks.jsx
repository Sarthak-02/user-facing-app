import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Table } from "../../ui-components";
import {
  bulkSubmitExamMarks,
  downloadExamGradesTemplate,
  getExamGradesAll,
  uploadExamGradesTemplate,
} from "../../api/exam.api";
import { useExamDetail } from "../../store/examDetail.store";
import { usePermissions } from "../../store/permissions.store";
import Loader from "../../ui-components/Loader";

const LETTER_GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"];

function buildEmptyMarks(examData, studentList) {
  const initialMarks = {};
  studentList.forEach((student) => {
    initialMarks[student.id] = {};
    examData.subjects.forEach((subject) => {
      initialMarks[student.id][subject.subjectId] = { value: "", remarks: "" };
    });
  });
  return initialMarks;
}

function normalizeSubjectId(subjectId) {
  return subjectId != null ? String(subjectId) : "";
}

/** Merge GET /exam/grades/all — `has_grades_marked` means scores are in (same signal as Exam Detail “View results”). */
function mergeGradesApiIntoMarks(marksTemplate, apiData) {
  const next = structuredClone(marksTemplate);
  const submittedSubjectIds = new Set();

  if (!apiData?.subjects || !Array.isArray(apiData.subjects)) {
    return { marks: next, submittedSubjectIds };
  }
  apiData.subjects.forEach((subject) => {
    const sid = normalizeSubjectId(subject.subject_id);
    if (!sid) return;

    if (subject.has_grades_marked) {
      submittedSubjectIds.add(sid);
    }
    if (subject.grades && Array.isArray(subject.grades)) {
      subject.grades.forEach((grade) => {
        const studentKey =
          grade.student_id != null ? String(grade.student_id) : "";
        if (studentKey && next[studentKey]?.[sid]) {
          next[studentKey][sid] = {
            value: grade.grades_obtained || "",
            remarks: grade.remarks || "",
          };
        }
      });
    }
  });
  return { marks: next, submittedSubjectIds };
}

function getExamTypeLabel(type, t) {
  const key = `exams.examTypes.${type}`;
  const translated = t(key);
  return translated === key ? type : translated;
}

export default function EnterMarks() {
  const { t } = useTranslation();
  const { examId } = useParams();
  const navigate = useNavigate();
  const { examDetail } = useExamDetail();
  const { permissions } = usePermissions();

  const [exam, setExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Store marks for each student and subject
  const [marksData, setMarksData] = useState({});

  // Track which subjects have been submitted (has_grades_marked from API)
  const [submittedSubjects, setSubmittedSubjects] = useState(new Set());
  /** Submitted subjects the user has tapped "Edit marks" on. */
  const [subjectsInEditMode, setSubjectsInEditMode] = useState(() => new Set());

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const excelInputRef = useRef(null);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [excelUploading, setExcelUploading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get exam and students from the store
        const examData = examDetail.exam;
        const studentsData = examDetail.students;

        // Check if we have exam data in store
        if (!examData) {
          setError(t("enterMarks.examMissing"));
          setLoading(false);
          return;
        }

        setExam(examData);

        // Transform students data
        const transformedStudents = studentsData.map(student => ({
          id: student.student_id,
          name: student.student_name,
          rollNumber: student.student_roll_no,
          photoUrl: student.student_photo_url,
          admissionNo: student.student_admission_no,
        }));

        setStudents(transformedStudents);

        // Set first subject as default selected
        if (examData.subjects && examData.subjects.length > 0) {
          setSelectedSubject(examData.subjects[0].subjectId);
        }

        const initialMarks = buildEmptyMarks(examData, transformedStudents);

        // Fetch existing grades from API
        try {
          const gradesResponse = await getExamGradesAll(examId);

          if (gradesResponse.success && gradesResponse.data) {
            const { marks, submittedSubjectIds } = mergeGradesApiIntoMarks(
              initialMarks,
              gradesResponse.data
            );
            setSubmittedSubjects(submittedSubjectIds);
            setMarksData(marks);
            setLoading(false);
            return;
          }
        } catch (gradesError) {
          console.error("Error fetching existing grades:", gradesError);
        }

        setSubmittedSubjects(new Set());
        setMarksData(initialMarks);
        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(t("enterMarks.loadFailed"));
        setLoading(false);
      }
    };

    loadData();
  }, [examDetail, examId, t]);

  const handleMarkChange = useCallback((studentId, subjectId, value) => {
    // For numeric grading types, prevent negative numbers
    if (exam?.gradingType === "PERCENTAGE" || exam?.gradingType === "GPA") {
      if (value !== "" && Number(value) < 0) {
        return; // Don't update if negative
      }
    }
    
    setMarksData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectId]: {
          ...prev[studentId][subjectId],
          value: value,
        },
      },
    }));
  }, [exam?.gradingType]);

  const validateSubjectMarks = useCallback((subjectId) => {
    const errors = [];
    
    students.forEach((student) => {
      const mark = marksData[student.id]?.[subjectId]?.value;
      
      if (mark === "" || mark === null || mark === undefined) {
        errors.push(t("enterMarks.validationMarkRequired", { name: student.name }));
        return;
      }

      // Validate based on grading type
      if (exam.gradingType === "PERCENTAGE") {
        const numMark = Number(mark);
        if (isNaN(numMark) || numMark < 0 || numMark > Number(exam.maxValue)) {
          errors.push(
            t("enterMarks.validationPercentRange", { name: student.name, max: exam.maxValue })
          );
        }
      } else if (exam.gradingType === "GPA") {
        const numMark = Number(mark);
        if (isNaN(numMark) || numMark < 0 || numMark > Number(exam.maxValue)) {
          errors.push(
            t("enterMarks.validationGpaRange", { name: student.name, max: exam.maxValue })
          );
        }
      } else if (exam.gradingType === "LETTER_GRADE") {
        if (!LETTER_GRADES.includes(mark)) {
          errors.push(
            t("enterMarks.validationLetterGrade", { name: student.name })
          );
        }
      } else if (exam.gradingType === "PASS_FAIL") {
        if (!["PASS", "FAIL"].includes(mark)) {
          errors.push(
            t("enterMarks.validationPassFail", { name: student.name })
          );
        }
      }
    });

    return errors;
  }, [students, marksData, exam, t]);

  const handleSubmitSubject = useCallback(async (subjectId) => {
    setSubmitError(null);
    setSuccessMessage("");

    const subject = exam.subjects.find(s => s.subjectId === subjectId);

    // Validate marks for this subject
    const validationErrors = validateSubjectMarks(subjectId);
    if (validationErrors.length > 0) {
      setSubmitError(`${subject.subjectName}:\n${validationErrors.join("\n")}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data in the correct format for the API
      const grades = students.map((student) => ({
        exam_id: examId,
        exam_subject_id: subjectId,
        student_id: student.id,
        grades_obtained: marksData[student.id][subjectId].value.toString(),
        remarks: marksData[student.id][subjectId].remarks || "",
        graded_by: permissions.teacher_id || "",
      }));

      // Submit marks for this subject
      await bulkSubmitExamMarks(grades);

      const gradesResponse = await getExamGradesAll(examId);
      if (gradesResponse.success && gradesResponse.data) {
        const merged = mergeGradesApiIntoMarks(
          buildEmptyMarks(exam, students),
          gradesResponse.data
        );
        setMarksData(merged.marks);
        setSubmittedSubjects(merged.submittedSubjectIds);
      } else {
        const sid = normalizeSubjectId(subjectId);
        setSubmittedSubjects((prev) => new Set([...prev, sid]));
      }

      setSubjectsInEditMode((prev) => {
        const next = new Set(prev);
        next.delete(normalizeSubjectId(subjectId));
        return next;
      });

      setSuccessMessage(t("enterMarks.successSubject", { subject: subject.subjectName }));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error submitting marks:", err);
      setSubmitError(t("enterMarks.submitFailedSubject", { subject: subject.subjectName }));
    } finally {
      setIsSubmitting(false);
    }
  }, [exam, students, marksData, examId, permissions.teacher_id, validateSubjectMarks, t]);

  const handleGoBack = () => {
    navigate(`/staff/exams/${examId}`);
  };

  const handleDownloadGradesTemplate = useCallback(async () => {
    if (!examId) return;
    setSubmitError(null);
    setTemplateDownloading(true);
    try {
      const { blob, filename } = await downloadExamGradesTemplate(examId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSuccessMessage(t("enterMarks.templateDownloaded"));
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      const msg =
        err?.message ||
        err?.error?.message ||
        (typeof err === "string" ? err : null);
      setSubmitError(msg || t("enterMarks.templateDownloadFailed"));
    } finally {
      setTemplateDownloading(false);
    }
  }, [examId, t]);

  const refreshMarksFromServer = useCallback(async () => {
    if (!examId || !exam || !students.length) return;
    const gradesResponse = await getExamGradesAll(examId);
    if (!gradesResponse.success || !gradesResponse.data) return;
    const empty = buildEmptyMarks(exam, students);
    const { marks, submittedSubjectIds } = mergeGradesApiIntoMarks(
      empty,
      gradesResponse.data
    );
    setMarksData(marks);
    setSubmittedSubjects(submittedSubjectIds);
    setSubjectsInEditMode(new Set());
  }, [examId, exam, students]);

  const handleExcelUpload = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || !examId) return;

      setSubmitError(null);
      setSuccessMessage("");
      setExcelUploading(true);

      try {
        const result = await uploadExamGradesTemplate(examId, file);

        const triggerBlobDownload = (blob, filename) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          link.rel = "noopener";
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
        };

        if (result.kind === "row_errors") {
          triggerBlobDownload(result.blob, result.filename);
          const msg =
            result.errorRowCount != null && result.errorRowCount > 0
              ? t("enterMarks.excelUploadRowErrorsWithCount", {
                  count: result.errorRowCount,
                })
              : t("enterMarks.excelUploadRowErrors");
          setSubmitError(msg);
          return;
        }

        await refreshMarksFromServer();

        if (result.kind === "file") {
          triggerBlobDownload(result.blob, result.filename);
          setSuccessMessage(t("enterMarks.excelUploadResultDownloaded"));
        } else {
          const msg =
            result.data?.message ||
            result.data?.data?.message ||
            t("enterMarks.excelUploadSuccess");
          setSuccessMessage(msg);
        }
        setTimeout(() => setSuccessMessage(""), 6000);
      } catch (err) {
        const msg =
          err?.message ||
          err?.error?.message ||
          (typeof err === "string" ? err : null);
        setSubmitError(msg || t("enterMarks.excelUploadFailed"));
      } finally {
        setExcelUploading(false);
      }
    },
    [examId, refreshMarksFromServer, t]
  );

  // Filter students
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate completion percentage for a specific subject
  const getSubjectCompletionPercentage = useCallback((subjectId) => {
    if (!exam || students.length === 0) return 0;
    
    let filledCount = 0;

    students.forEach((student) => {
      if (marksData[student.id]?.[subjectId]?.value) {
        filledCount++;
      }
    });

    return Math.round((filledCount / students.length) * 100);
  }, [exam, students, marksData]);

  // Check if subject is fully filled
  const isSubjectComplete = useCallback((subjectId) => {
    return getSubjectCompletionPercentage(subjectId) === 100;
  }, [getSubjectCompletionPercentage]);

  /** Submitted scores stay read-only until the user taps Edit marks. */
  const isMarksReadOnly = useCallback(
    (subjectId) => {
      const id = normalizeSubjectId(subjectId);
      if (!submittedSubjects.has(id)) return false;
      return !subjectsInEditMode.has(id);
    },
    [submittedSubjects, subjectsInEditMode]
  );

  const isSubmittedAwaitingEditTap = useCallback(
    (subjectId) => {
      const id = normalizeSubjectId(subjectId);
      return submittedSubjects.has(id) && !subjectsInEditMode.has(id);
    },
    [submittedSubjects, subjectsInEditMode]
  );

  const beginEditingSubmittedSubject = useCallback((subjectId) => {
    const id = normalizeSubjectId(subjectId);
    if (!id) return;
    setSubjectsInEditMode((prev) => new Set(prev).add(id));
  }, []);

  // Define table columns using useMemo to avoid recreating on every render
  const tableColumns = useMemo(() => {
    if (!exam || !selectedSubject) return [];

    const subject = exam.subjects?.find((s) => s.subjectId === selectedSubject);
    if (!subject) return [];

    return [
      {
        key: "rollNumber",
        label: t("enterMarks.rollNo"),
        render: (student) => (
          <span className="font-medium text-gray-900">{student.rollNumber}</span>
        ),
      },
      {
        key: "name",
        label: t("enterMarks.studentName"),
        render: (student) => (
          <span className="text-gray-900">{student.name}</span>
        ),
      },
      {
        key: "marks",
        label: (
          <div className="flex flex-col gap-2 items-center">
            <div>
              <div className="flex items-center justify-center gap-2">
                <span>{t("enterMarks.marks")}</span>
                {submittedSubjects.has(normalizeSubjectId(subject.subjectId)) && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              <div className="text-xs text-gray-400 normal-case mt-1">
                {t("enterMarks.percentComplete", { pct: getSubjectCompletionPercentage(subject.subjectId) })}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                isSubmittedAwaitingEditTap(subject.subjectId)
                  ? beginEditingSubmittedSubject(subject.subjectId)
                  : handleSubmitSubject(subject.subjectId)
              }
              disabled={
                !isSubmittedAwaitingEditTap(subject.subjectId) &&
                (!isSubjectComplete(subject.subjectId) || isSubmitting)
              }
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                isSubmittedAwaitingEditTap(subject.subjectId)
                  ? "bg-white border border-gray-300 text-gray-800 hover:bg-gray-50"
                  : submittedSubjects.has(normalizeSubjectId(subject.subjectId))
                  ? isSubjectComplete(subject.subjectId)
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : isSubjectComplete(subject.subjectId)
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmittedAwaitingEditTap(subject.subjectId) ? (
                t("enterMarks.editMarksShort")
              ) : isSubmitting ? (
                <span className="inline-flex items-center justify-center gap-1.5">
                  <span
                    className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
                    aria-hidden
                  />
                  {t("enterMarks.submittingShort")}
                </span>
              ) : submittedSubjects.has(normalizeSubjectId(subject.subjectId)) ? (
                t("enterMarks.saveMarksShort")
              ) : (
                t("enterMarks.submit")
              )}
            </button>
          </div>
        ),
        render: (student) => (
          <div className="space-y-2 flex justify-center">
            {exam.gradingType === "PERCENTAGE" && (
              <input
                type="number"
                value={marksData[student.id]?.[subject.subjectId]?.value || ""}
                onChange={(e) =>
                  handleMarkChange(student.id, subject.subjectId, e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                disabled={isMarksReadOnly(subject.subjectId)}
                className={`w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center ${
                  isMarksReadOnly(subject.subjectId) ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder={`/${exam.maxValue}`}
                min="0"
                max={exam.maxValue}
              />
            )}

            {exam.gradingType === "GPA" && (
              <input
                type="number"
                step="0.1"
                value={marksData[student.id]?.[subject.subjectId]?.value || ""}
                onChange={(e) =>
                  handleMarkChange(student.id, subject.subjectId, e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                disabled={isMarksReadOnly(subject.subjectId)}
                className={`w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center ${
                  isMarksReadOnly(subject.subjectId) ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder={`/${exam.maxValue}`}
                min="0"
                max={exam.maxValue}
              />
            )}

            {exam.gradingType === "LETTER_GRADE" && (
              <select
                value={marksData[student.id]?.[subject.subjectId]?.value || ""}
                onChange={(e) =>
                  handleMarkChange(student.id, subject.subjectId, e.target.value)
                }
                disabled={isMarksReadOnly(subject.subjectId)}
                className={`w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center ${
                  isMarksReadOnly(subject.subjectId) ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="">--</option>
                {LETTER_GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            )}

            {exam.gradingType === "PASS_FAIL" && (
              <select
                value={marksData[student.id]?.[subject.subjectId]?.value || ""}
                onChange={(e) =>
                  handleMarkChange(student.id, subject.subjectId, e.target.value)
                }
                disabled={isMarksReadOnly(subject.subjectId)}
                className={`w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center ${
                  isMarksReadOnly(subject.subjectId) ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="">--</option>
                <option value="PASS">{t("studentExams.pass")}</option>
                <option value="FAIL">{t("studentExams.fail")}</option>
              </select>
            )}
          </div>
        ),
      },
    ];
  }, [
    exam,
    selectedSubject,
    marksData,
    submittedSubjects,
    isSubmitting,
    getSubjectCompletionPercentage,
    isSubjectComplete,
    handleSubmitSubject,
    handleMarkChange,
    isMarksReadOnly,
    isSubmittedAwaitingEditTap,
    beginEditingSubmittedSubject,
    t,
  ]);


  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-4 gap-6">
        <Card>
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto mb-2"
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
              <h3 className="text-lg font-semibold text-gray-900">{t("exams.error")}</h3>
            </div>
            <p className="text-gray-600 mb-4">{error || t("staffExamDetail.examNotFound")}</p>
            <Button onClick={handleGoBack}>{t("common.back")}</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 gap-4">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{t("enterMarks.title")}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {getExamTypeLabel(exam.examType, t)} - {exam.class}
              {exam.section && ` - ${exam.section}`}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mt-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t("enterMarks.searchStudents")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="md:w-64">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {exam.subjects?.map((subject) => (
                  <option key={subject.subjectId} value={subject.subjectId}>
                    {subject.subjectName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hide Excel bulk actions for submitted subjects until user taps Edit marks */}
          {!isMarksReadOnly(selectedSubject) && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
              <p className="text-sm text-gray-600 flex-1 min-w-[200px]">
                {t("enterMarks.excelBulkHint")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  loading={templateDownloading}
                  onClick={handleDownloadGradesTemplate}
                >
                  {t("enterMarks.downloadTemplate")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  loading={excelUploading}
                  onClick={() => excelInputRef.current?.click()}
                >
                  {t("enterMarks.uploadExcel")}
                </Button>
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={handleExcelUpload}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        )}

        {submitError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
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
                <p className="text-sm text-red-700 mt-1 whitespace-pre-line">{submitError}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Table View — page scrolls; no nested max-height scroll */}
      <div className="hidden md:block pb-8">
        <Table columns={tableColumns} data={filteredStudents} maxHeight={null} />
      </div>

      {/* Mobile: Card View */}
      <div className="md:hidden pb-32">
        <div className="space-y-4">
          {filteredStudents.map((student) => (
            <Card key={student.id}>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div>
                    <p className="font-semibold text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">{t("enterMarks.mobileRollNo", { roll: student.rollNumber })}</p>
                  </div>
                </div>

                  {exam.subjects
                    ?.filter((subject) => subject.subjectId === selectedSubject)
                    .map((subject) => (
                    <div key={subject.subjectId} className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {submittedSubjects.has(normalizeSubjectId(subject.subjectId)) && (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-5 w-5 ${isSubmittedAwaitingEditTap(subject.subjectId) ? "text-green-500" : "text-blue-500"}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span
                                className={`text-sm font-medium ${isSubmittedAwaitingEditTap(subject.subjectId) ? "text-green-700" : "text-blue-700"}`}
                              >
                                {isSubmittedAwaitingEditTap(subject.subjectId)
                                  ? t("enterMarks.marksEditableAfterSubmit")
                                  : t("enterMarks.editingMarksHint")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Marks/Grade Input */}
                      {exam.gradingType === "PERCENTAGE" && (
                        <input
                          type="number"
                          value={marksData[student.id]?.[subject.subjectId]?.value || ""}
                          onChange={(e) =>
                            handleMarkChange(student.id, subject.subjectId, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                              e.preventDefault();
                            }
                          }}
                          disabled={isMarksReadOnly(subject.subjectId)}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            isMarksReadOnly(subject.subjectId) ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          placeholder={t("enterMarks.placeholderMarksOutOf", { max: exam.maxValue })}
                          min="0"
                          max={exam.maxValue}
                        />
                      )}

                      {exam.gradingType === "GPA" && (
                        <input
                          type="number"
                          step="0.1"
                          value={marksData[student.id]?.[subject.subjectId]?.value || ""}
                          onChange={(e) =>
                            handleMarkChange(student.id, subject.subjectId, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                              e.preventDefault();
                            }
                          }}
                          disabled={isMarksReadOnly(subject.subjectId)}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            isMarksReadOnly(subject.subjectId) ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          placeholder={t("enterMarks.placeholderGpaOutOf", { max: exam.maxValue })}
                          min="0"
                          max={exam.maxValue}
                        />
                      )}

                      {exam.gradingType === "LETTER_GRADE" && (
                        <select
                          value={marksData[student.id]?.[subject.subjectId]?.value || ""}
                          onChange={(e) =>
                            handleMarkChange(student.id, subject.subjectId, e.target.value)
                          }
                          disabled={isMarksReadOnly(subject.subjectId)}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            isMarksReadOnly(subject.subjectId) ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="">{t("enterMarks.selectGrade")}</option>
                          {LETTER_GRADES.map((grade) => (
                            <option key={grade} value={grade}>
                              {grade}
                            </option>
                          ))}
                        </select>
                      )}

                      {exam.gradingType === "PASS_FAIL" && (
                        <select
                          value={marksData[student.id]?.[subject.subjectId]?.value || ""}
                          onChange={(e) =>
                            handleMarkChange(student.id, subject.subjectId, e.target.value)
                          }
                          disabled={isMarksReadOnly(subject.subjectId)}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            isMarksReadOnly(subject.subjectId) ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="">{t("enterMarks.selectResult")}</option>
                          <option value="PASS">{t("studentExams.pass")}</option>
                          <option value="FAIL">{t("studentExams.fail")}</option>
                        </select>
                      )}
                    </div>
                  ))}
                
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Desktop: Inline progress & submit */}
      <div className="hidden md:block pb-12">
        {/* Progress Indicator */}
        <div className="mb-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              {t("enterMarks.progressFor", { subject: exam.subjects.find(s => s.subjectId === selectedSubject)?.subjectName || t("reporting.subject") })}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {t("enterMarks.studentsProgress", {
                pct: getSubjectCompletionPercentage(selectedSubject),
                filled: students.filter(s => marksData[s.id]?.[selectedSubject]?.value).length,
                total: students.length,
              })}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${getSubjectCompletionPercentage(selectedSubject)}%`,
              }}
            />
          </div>
        </div>

        {/* Submit / Edit marks / Save */}
        <div className="flex justify-center">
          <Button
            variant="primary"
            loading={isSubmitting}
            onClick={() =>
              isSubmittedAwaitingEditTap(selectedSubject)
                ? beginEditingSubmittedSubject(selectedSubject)
                : handleSubmitSubject(selectedSubject)
            }
            disabled={
              !isSubmittedAwaitingEditTap(selectedSubject) &&
              (!isSubjectComplete(selectedSubject) || isSubmitting)
            }
            className="w-full max-w-md"
          >
            {isSubmitting
              ? t("enterMarks.submitting")
              : isSubmittedAwaitingEditTap(selectedSubject)
              ? t("enterMarks.editMarksFor", {
                  subject:
                    exam.subjects.find((s) => s.subjectId === selectedSubject)?.subjectName ||
                    t("enterMarks.marksFallback"),
                })
              : submittedSubjects.has(normalizeSubjectId(selectedSubject))
              ? t("enterMarks.saveMarksFor", {
                  subject:
                    exam.subjects.find((s) => s.subjectId === selectedSubject)?.subjectName ||
                    t("enterMarks.marksFallback"),
                })
              : t("enterMarks.submitMarksFor", {
                  subject:
                    exam.subjects.find((s) => s.subjectId === selectedSubject)?.subjectName ||
                    t("enterMarks.marksFallback"),
                })}
          </Button>
        </div>
      </div>

      {/* Mobile: Fixed bar above app BottomNav (h-14 + safe area); avoids sitting under z-50 BottomNav */}
      <div className="md:hidden fixed left-0 right-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-40 bg-white border-t border-gray-200 p-3 sm:p-4 shadow-lg">
        {/* Progress Indicator */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-500">
              {exam.subjects.find(s => s.subjectId === selectedSubject)?.subjectName || t("reporting.subject")}
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              {t("enterMarks.studentsProgressShort", {
                pct: getSubjectCompletionPercentage(selectedSubject),
                filled: students.filter(s => marksData[s.id]?.[selectedSubject]?.value).length,
                total: students.length,
              })}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${getSubjectCompletionPercentage(selectedSubject)}%`,
              }}
            />
          </div>
        </div>

        {/* Submit / Edit marks / Save */}
        <Button
          variant="primary"
          loading={isSubmitting}
          onClick={() =>
            isSubmittedAwaitingEditTap(selectedSubject)
              ? beginEditingSubmittedSubject(selectedSubject)
              : handleSubmitSubject(selectedSubject)
          }
          disabled={
            !isSubmittedAwaitingEditTap(selectedSubject) &&
            (!isSubjectComplete(selectedSubject) || isSubmitting)
          }
          className="w-full max-w-md"
        >
          {isSubmitting
            ? t("enterMarks.submitting")
            : isSubmittedAwaitingEditTap(selectedSubject)
            ? t("enterMarks.editMarksFor", {
                subject:
                  exam.subjects.find((s) => s.subjectId === selectedSubject)?.subjectName ||
                  t("enterMarks.marksFallback"),
              })
            : submittedSubjects.has(normalizeSubjectId(selectedSubject))
            ? t("enterMarks.saveMarksFor", {
                subject:
                  exam.subjects.find((s) => s.subjectId === selectedSubject)?.subjectName ||
                  t("enterMarks.marksFallback"),
              })
            : t("enterMarks.submitMarksFor", {
                subject:
                  exam.subjects.find((s) => s.subjectId === selectedSubject)?.subjectName ||
                  t("enterMarks.marksFallback"),
              })}
        </Button>
      </div>
    </div>
  );
}
