import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Table } from "../../ui-components";
import { getExamDetail, getExamStudents, bulkSubmitExamMarks } from "../../api/exam.api";
import Loader from "../../ui-components/Loader";

// Mock students data for testing
const MOCK_STUDENTS = [
  { id: "st1", name: "Aarav Sharma", rollNumber: "001" },
  { id: "st2", name: "Diya Singh", rollNumber: "002" },
  { id: "st3", name: "Kabir Verma", rollNumber: "003" },
  { id: "st4", name: "Ananya Patel", rollNumber: "004" },
  { id: "st5", name: "Rohan Kumar", rollNumber: "005" },
  { id: "st6", name: "Priya Gupta", rollNumber: "006" },
  { id: "st7", name: "Arjun Mehta", rollNumber: "007" },
  { id: "st8", name: "Ishita Reddy", rollNumber: "008" },
];

const LETTER_GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"];

function getExamTypeLabel(type) {
  const labels = {
    UNIT_TEST: "Unit Test",
    MID_TERM: "Mid Term",
    FINAL: "Final Exam",
    QUARTERLY: "Quarterly",
    HALF_YEARLY: "Half Yearly",
    ANNUAL: "Annual",
    OTHER: "Other",
  };
  return labels[type] || type;
}

export default function EnterMarks() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Store marks for each student and subject
  const [marksData, setMarksData] = useState({});

  // Track which subjects have been submitted
  const [submittedSubjects, setSubmittedSubjects] = useState(new Set());

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try to fetch exam details - use mock data if fails
        let examData;
        try {
          examData = await getExamDetail(examId);
        } catch {
          console.log("Using mock exam data");
          // Mock exam data
          examData = {
            id: examId,
            examType: "MID_TERM",
            customExamType: "",
            class: "Class 10",
            section: "Section A",
            status: "COMPLETED",
            subjects: [
              {
                subjectId: "sub1",
                subjectName: "Mathematics",
                examDate: "2026-01-10",
                startTime: "09:00",
                endTime: "11:00",
              },
              {
                subjectId: "sub7",
                subjectName: "Physics",
                examDate: "2026-01-12",
                startTime: "09:00",
                endTime: "11:00",
              },
              {
                subjectId: "sub8",
                subjectName: "Chemistry",
                examDate: "2026-01-14",
                startTime: "09:00",
                endTime: "11:00",
              },
            ],
            startDate: "2026-01-10",
            endDate: "2026-01-14",
            gradingType: "PERCENTAGE",
            passingValue: "40",
            maxValue: "100",
          };
        }
        
        setExam(examData);

        // Set first subject as default selected
        if (examData.subjects && examData.subjects.length > 0) {
          setSelectedSubject(examData.subjects[0].subjectId);
        }

        // Fetch students for this exam
        try {
          const studentsData = await getExamStudents(examId);
          setStudents(studentsData);
          
          // Initialize marks data
          const initialMarks = {};
          studentsData.forEach((student) => {
            initialMarks[student.id] = {};
            examData.subjects.forEach((subject) => {
              initialMarks[student.id][subject.subjectId] = {
                value: student.marks?.[subject.subjectId]?.value || "",
                remarks: student.marks?.[subject.subjectId]?.remarks || "",
              };
            });
          });
          setMarksData(initialMarks);
        } catch {
          // Use mock data if API fails
          console.log("Using mock students data");
          setStudents(MOCK_STUDENTS);
          
          // Initialize marks data with mock students
          const initialMarks = {};
          MOCK_STUDENTS.forEach((student) => {
            initialMarks[student.id] = {};
            examData.subjects.forEach((subject) => {
              initialMarks[student.id][subject.subjectId] = {
                value: "",
                remarks: "",
              };
            });
          });
          setMarksData(initialMarks);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to fetch exam details");
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchData();
    }
  }, [examId]);

  const handleMarkChange = (studentId, subjectId, value) => {
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
  };

  const validateSubjectMarks = useCallback((subjectId) => {
    const errors = [];
    
    students.forEach((student) => {
      const mark = marksData[student.id]?.[subjectId]?.value;
      
      if (mark === "" || mark === null || mark === undefined) {
        errors.push(`${student.name}: Mark is required`);
        return;
      }

      // Validate based on grading type
      if (exam.gradingType === "PERCENTAGE") {
        const numMark = Number(mark);
        if (isNaN(numMark) || numMark < 0 || numMark > Number(exam.maxValue)) {
          errors.push(
            `${student.name}: Mark must be between 0 and ${exam.maxValue}`
          );
        }
      } else if (exam.gradingType === "GPA") {
        const numMark = Number(mark);
        if (isNaN(numMark) || numMark < 0 || numMark > Number(exam.maxValue)) {
          errors.push(
            `${student.name}: GPA must be between 0 and ${exam.maxValue}`
          );
        }
      } else if (exam.gradingType === "LETTER_GRADE") {
        if (!LETTER_GRADES.includes(mark)) {
          errors.push(
            `${student.name}: Invalid letter grade`
          );
        }
      } else if (exam.gradingType === "PASS_FAIL") {
        if (!["PASS", "FAIL"].includes(mark)) {
          errors.push(
            `${student.name}: Must be either PASS or FAIL`
          );
        }
      }
    });

    return errors;
  }, [students, marksData, exam]);

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
      // Prepare data for this subject only
      const studentsMarks = students.map((student) => ({
        studentId: student.id,
        marks: [{
          subjectId: subjectId,
          value: marksData[student.id][subjectId].value,
          remarks: marksData[student.id][subjectId].remarks,
        }],
      }));

      // Submit marks for this subject
      await bulkSubmitExamMarks(examId, studentsMarks);
      
      // Mark subject as submitted
      setSubmittedSubjects(prev => new Set([...prev, subjectId]));
      setSuccessMessage(`Marks for ${subject.subjectName} submitted successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error submitting marks:", err);
      setSubmitError(`Failed to submit marks for ${subject.subjectName}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  }, [exam, students, marksData, examId, validateSubjectMarks]);

  const handleGoBack = () => {
    navigate(`/staff/exams/${examId}`);
  };

  // Filter students
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    if (!exam || students.length === 0) return 0;
    
    let totalFields = 0;
    let filledFields = 0;

    students.forEach((student) => {
      exam.subjects.forEach((subject) => {
        totalFields++;
        if (marksData[student.id]?.[subject.subjectId]?.value) {
          filledFields++;
        }
      });
    });

    return Math.round((filledFields / totalFields) * 100);
  };

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

  // Define table columns using useMemo to avoid recreating on every render
  const tableColumns = useMemo(() => {
    if (!exam || !selectedSubject) return [];

    const subject = exam.subjects?.find((s) => s.subjectId === selectedSubject);
    if (!subject) return [];

    return [
      {
        key: "rollNumber",
        label: "Roll No.",
        render: (student) => (
          <span className="font-medium text-gray-900">{student.rollNumber}</span>
        ),
      },
      {
        key: "name",
        label: "Student Name",
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
                <span>Marks</span>
                {submittedSubjects.has(subject.subjectId) && (
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
                {getSubjectCompletionPercentage(subject.subjectId)}% Complete
              </div>
            </div>
            <button
              onClick={() => handleSubmitSubject(subject.subjectId)}
              disabled={!isSubjectComplete(subject.subjectId) || isSubmitting}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                submittedSubjects.has(subject.subjectId)
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : isSubjectComplete(subject.subjectId)
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {submittedSubjects.has(subject.subjectId)
                ? "Submitted"
                : isSubmitting
                ? "..."
                : "Submit"}
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
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
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
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
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
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
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
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              >
                <option value="">--</option>
                <option value="PASS">Pass</option>
                <option value="FAIL">Fail</option>
              </select>
            )}
          </div>
        ),
      },
    ];
  }, [exam, selectedSubject, marksData, submittedSubjects, isSubmitting, getSubjectCompletionPercentage, isSubjectComplete, handleSubmitSubject]);


  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="h-screen flex flex-col p-4 gap-6">
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
              <h3 className="text-lg font-semibold text-gray-900">Error</h3>
            </div>
            <p className="text-gray-600 mb-4">{error || "Exam not found"}</p>
            <Button onClick={handleGoBack}>Go Back</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col p-4 gap-4 overflow-hidden">
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
            <h1 className="text-2xl font-bold text-gray-900">Enter Marks</h1>
            <p className="text-sm text-gray-600 mt-1">
              {getExamTypeLabel(exam.examType)} - {exam.class}
              {exam.section && ` - ${exam.section}`}
            </p>
          </div>
        </div>

        {/* Progress Card */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Progress</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {getCompletionPercentage()}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Students</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{students.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Subjects</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {exam.subjects?.length || 0}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card className="mt-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search students..."
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
                <h4 className="text-sm font-semibold text-red-800">Error</h4>
                <p className="text-sm text-red-700 mt-1 whitespace-pre-line">{submitError}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block  pb-20">
        <Table columns={tableColumns} data={filteredStudents} maxHeight="50vh" />
      </div>

      {/* Mobile: Card View */}
      <div className="md:hidden flex-1 overflow-y-auto min-h-0 pb-30">
        <div className="space-y-4">
          {filteredStudents.map((student) => (
            <Card key={student.id}>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div>
                    <p className="font-semibold text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">Roll No: {student.rollNumber}</p>
                  </div>
                </div>

                  {exam.subjects
                    ?.filter((subject) => subject.subjectId === selectedSubject)
                    .map((subject) => (
                    <div key={subject.subjectId} className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {submittedSubjects.has(subject.subjectId) && (
                            <>
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
                              <span className="text-sm font-medium text-green-700">Already Submitted</span>
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Marks (out of ${exam.maxValue})`}
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`GPA (out of ${exam.maxValue})`}
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Grade</option>
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Result</option>
                          <option value="PASS">Pass</option>
                          <option value="FAIL">Fail</option>
                        </select>
                      )}
                    </div>
                  ))}
                
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Submit Button - Fixed at bottom for mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-10">
        <Button
          onClick={() => handleSubmitSubject(selectedSubject)}
          disabled={!isSubjectComplete(selectedSubject) || isSubmitting}
          className="w-full"
        >
          {submittedSubjects.has(selectedSubject) 
            ? "Submitted ✓" 
            : isSubmitting 
            ? "Submitting..." 
            : `Submit ${exam.subjects.find(s => s.subjectId === selectedSubject)?.subjectName || 'Marks'}`}
        </Button>
      </div>
    </div>
  );
}
