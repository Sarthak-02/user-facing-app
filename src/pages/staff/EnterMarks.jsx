import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Table } from "../../ui-components";
import {
  bulkSubmitExamMarks,
  downloadExamGradesTemplate,
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

  // null = choice screen, 'manual' = table entry, 'excel' = upload steps
  const [entryMode, setEntryMode] = useState(null);

  const handleSubjectChange = useCallback((subjectId) => {
    setSelectedSubject(subjectId);
    setEntryMode(null);
  }, []);

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

        if (examDetail.gradesData) {
          const { marks, submittedSubjectIds } = mergeGradesApiIntoMarks(
            initialMarks,
            examDetail.gradesData
          );
          setSubmittedSubjects(submittedSubjectIds);
          setMarksData(marks);
        } else {
          const submittedSubjectIds = new Set(
            examData.subjects
              .filter((s) => s.hasGradesMarked)
              .map((s) => normalizeSubjectId(s.subjectId))
          );
          setSubmittedSubjects(submittedSubjectIds);
          setMarksData(initialMarks);
        }
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
    if (exam?.gradingType === "PERCENTAGE" || exam?.gradingType === "GPA") {
      if (value !== "") {
        const num = Number(value);
        if (isNaN(num) || num < 0) return;
        if (exam.maxValue != null && num > Number(exam.maxValue)) return;
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
  }, [exam?.gradingType, exam?.maxValue]);

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

      const sid = normalizeSubjectId(subjectId);
      setSubmittedSubjects((prev) => new Set([...prev, sid]));

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

  const refreshMarksFromServer = useCallback(() => {
    if (!exam) return;
    const submittedSubjectIds = new Set(
      exam.subjects.map((s) => normalizeSubjectId(s.subjectId))
    );
    setSubmittedSubjects(submittedSubjectIds);
    setSubjectsInEditMode(new Set());
  }, [exam]);

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

        refreshMarksFromServer();

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



  const beginEditingSubmittedSubject = useCallback((subjectId) => {
    const id = normalizeSubjectId(subjectId);
    if (!id) return;
    setSubjectsInEditMode((prev) => new Set(prev).add(id));
    setEntryMode(null);
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
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <span>{t("enterMarks.marks")}</span>
              {submittedSubjects.has(normalizeSubjectId(subject.subjectId)) && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <span className="text-xs text-gray-400 normal-case">
              {t("enterMarks.percentComplete", { pct: getSubjectCompletionPercentage(subject.subjectId) })}
            </span>
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
    getSubjectCompletionPercentage,
    handleMarkChange,
    isMarksReadOnly,
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("exams.error")}</h3>
            <p className="text-gray-500 mb-5">{error || t("staffExamDetail.examNotFound")}</p>
            <Button onClick={handleGoBack}>{t("common.back")}</Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentSubject = exam.subjects?.find((s) => s.subjectId === selectedSubject);
  const filledCount = students.filter((s) => marksData[s.id]?.[selectedSubject]?.value).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:overflow-hidden p-4 gap-4">

      {/* Header */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button onClick={handleGoBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{t("enterMarks.title")}</h1>
          <p className="text-sm text-gray-500 truncate">
            {getExamTypeLabel(exam.examType, t)} · {exam.class}{exam.section && ` · ${exam.section}`}
          </p>
        </div>
      </div>

      {/* Subject Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0">
        {exam.subjects?.map((subject) => {
          const isSelected = selectedSubject === subject.subjectId;
          const isSubmitted = submittedSubjects.has(normalizeSubjectId(subject.subjectId));
          const pct = getSubjectCompletionPercentage(subject.subjectId);
          const isPartiallyFilled = !isSubmitted && pct > 0 && pct < 100;
          return (
            <button
              key={subject.subjectId}
              onClick={() => handleSubjectChange(subject.subjectId)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                isSelected ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {subject.subjectName}
              {isSubmitted && (
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 flex-shrink-0 ${isSelected ? "text-blue-200" : "text-green-500"}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {isPartiallyFilled && (
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? "bg-amber-300" : "bg-amber-400"}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="flex items-center gap-2.5 px-3.5 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}
      {submitError && (
        <div className="px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl flex-shrink-0">
          <p className="text-sm font-semibold text-red-800">{t("exams.error")}</p>
          <p className="text-sm text-red-700 mt-0.5 whitespace-pre-line">{submitError}</p>
        </div>
      )}

      {/* ── Main content ── */}
      {isMarksReadOnly(selectedSubject) ? (

        /* READ-ONLY: submitted, not in edit mode */
        <>
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-700">Marks submitted</span>
            </div>
            <button
              onClick={() => beginEditingSubmittedSubject(selectedSubject)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Edit Marks
            </button>
          </div>

          <div className="relative flex-shrink-0">
            <input
              type="text"
              placeholder={t("enterMarks.searchStudents")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="hidden md:block md:flex-1 md:overflow-y-auto md:min-h-0 pb-4">
            <Table columns={tableColumns} data={filteredStudents} maxHeight={null} />
          </div>

          <div className="md:hidden space-y-2 pb-8">
            {filteredStudents.map((student) => (
              <div key={student.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.rollNumber}</p>
                </div>
                <span className="text-sm font-semibold text-gray-800 flex-shrink-0">
                  {marksData[student.id]?.[selectedSubject]?.value || <span className="text-gray-400 font-normal">—</span>}
                  {exam.maxValue && marksData[student.id]?.[selectedSubject]?.value && (
                    <span className="text-gray-400 font-normal">/{exam.maxValue}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </>

      ) : entryMode === null ? (

        /* CHOICE SCREEN */
        <div className="flex flex-col items-center justify-center gap-8 py-6 flex-1">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">How would you like to enter marks?</h2>
            <p className="text-sm text-gray-500 mt-1.5">
              {currentSubject?.subjectName} · {students.length} students
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
            <button
              onClick={() => setEntryMode("manual")}
              className="group flex flex-col items-center gap-3 p-5 border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">Enter Manually</p>
                <p className="text-xs text-gray-500 mt-0.5">Type marks for each student</p>
              </div>
            </button>
            <button
              onClick={() => setEntryMode("excel")}
              className="group flex flex-col items-center gap-3 p-5 border-2 border-gray-200 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">Upload Excel</p>
                <p className="text-xs text-gray-500 mt-0.5">Fill template and upload</p>
              </div>
            </button>
          </div>
        </div>

      ) : entryMode === "excel" ? (

        /* EXCEL UPLOAD */
        <div className="space-y-4">
          <button
            onClick={() => setEntryMode(null)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to options
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-2xl p-5">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-sm">1</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">Download Template</p>
                  <p className="text-sm text-gray-500 mt-1">Get the pre-filled template with all student names</p>
                  <div className="mt-4">
                    <Button variant="secondary" loading={templateDownloading} onClick={handleDownloadGradesTemplate}>
                      Download .xlsx Template
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl p-5">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-sm">2</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">Upload Filled Template</p>
                  <p className="text-sm text-gray-500 mt-1">Upload the Excel file with marks filled in</p>
                  <button
                    type="button"
                    onClick={() => excelInputRef.current?.click()}
                    disabled={excelUploading}
                    className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {excelUploading ? (
                      <>
                        <span className="h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                        <span className="text-sm text-gray-500">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm font-medium text-gray-700">Click to upload</p>
                        <p className="text-xs text-gray-400">.xlsx or .xls</p>
                      </>
                    )}
                  </button>
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    className="hidden"
                    onChange={handleExcelUpload}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      ) : (

        /* MANUAL ENTRY */
        <>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setEntryMode(null)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={t("enterMarks.searchStudents")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="hidden md:block md:flex-1 md:overflow-y-auto md:min-h-0 pb-4">
            <Table columns={tableColumns} data={filteredStudents} maxHeight={null} />
          </div>

          <div className="md:hidden space-y-2 pb-36">
            {filteredStudents.map((student) => (
              <div key={student.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.rollNumber}</p>
                </div>
                {exam.gradingType === "PERCENTAGE" && (
                  <input
                    type="number"
                    value={marksData[student.id]?.[selectedSubject]?.value || ""}
                    onChange={(e) => handleMarkChange(student.id, selectedSubject, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }}
                    className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-sm"
                    placeholder={`/${exam.maxValue}`}
                    min="0"
                    max={exam.maxValue}
                  />
                )}
                {exam.gradingType === "GPA" && (
                  <input
                    type="number"
                    step="0.1"
                    value={marksData[student.id]?.[selectedSubject]?.value || ""}
                    onChange={(e) => handleMarkChange(student.id, selectedSubject, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }}
                    className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-sm"
                    placeholder={`/${exam.maxValue}`}
                    min="0"
                    max={exam.maxValue}
                  />
                )}
                {exam.gradingType === "LETTER_GRADE" && (
                  <select
                    value={marksData[student.id]?.[selectedSubject]?.value || ""}
                    onChange={(e) => handleMarkChange(student.id, selectedSubject, e.target.value)}
                    className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">--</option>
                    {LETTER_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                )}
                {exam.gradingType === "PASS_FAIL" && (
                  <select
                    value={marksData[student.id]?.[selectedSubject]?.value || ""}
                    onChange={(e) => handleMarkChange(student.id, selectedSubject, e.target.value)}
                    className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">--</option>
                    <option value="PASS">{t("studentExams.pass")}</option>
                    <option value="FAIL">{t("studentExams.fail")}</option>
                  </select>
                )}
              </div>
            ))}
          </div>

          {/* Desktop bottom bar */}
          <div className="hidden md:block shrink-0">
            <div className="mx-auto flex max-w-2xl flex-col gap-2">
              <div>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-gray-500">
                  <span>{currentSubject?.subjectName}</span>
                  <span className="font-medium tabular-nums text-gray-700">{filledCount} / {students.length}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-primary-600 transition-all duration-300 ease-out" style={{ width: `${getSubjectCompletionPercentage(selectedSubject)}%` }} />
                </div>
              </div>
              <Button
                variant="primary"
                loading={isSubmitting}
                onClick={() => handleSubmitSubject(selectedSubject)}
                disabled={isSubmitting || !isSubjectComplete(selectedSubject)}
                className="w-full"
              >
                {isSubmitting
                  ? t("enterMarks.submitting")
                  : submittedSubjects.has(normalizeSubjectId(selectedSubject))
                  ? t("enterMarks.saveMarksFor", { subject: currentSubject?.subjectName || t("enterMarks.marksFallback") })
                  : t("enterMarks.submitMarksFor", { subject: currentSubject?.subjectName || t("enterMarks.marksFallback") })}
              </Button>
            </div>
          </div>

          {/* Mobile bottom bar */}
          <div className="md:hidden fixed bottom-14 left-0 right-0 z-[45] flex flex-col gap-2 border-t border-border bg-[var(--color-surface)] px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
            <div>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-gray-500">
                <span>{currentSubject?.subjectName}</span>
                <span className="tabular-nums font-medium text-gray-800">{filledCount} / {students.length}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-primary-600 transition-all duration-200 ease-out" style={{ width: `${getSubjectCompletionPercentage(selectedSubject)}%` }} />
              </div>
            </div>
            <Button
              variant="primary"
              loading={isSubmitting}
              onClick={() => handleSubmitSubject(selectedSubject)}
              disabled={isSubmitting || !isSubjectComplete(selectedSubject)}
              className="w-full text-sm"
            >
              {isSubmitting
                ? t("enterMarks.submitting")
                : submittedSubjects.has(normalizeSubjectId(selectedSubject))
                ? t("enterMarks.saveMarksFor", { subject: currentSubject?.subjectName || t("enterMarks.marksFallback") })
                : t("enterMarks.submitMarksFor", { subject: currentSubject?.subjectName || t("enterMarks.marksFallback") })}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
