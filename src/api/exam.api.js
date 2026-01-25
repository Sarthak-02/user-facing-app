import api from "./axios";

/**
 * Helper function to resolve target IDs to names
 * This should be called with permissions data from the store
 * @param {Array} targets - Array of target objects with targetType and targetId
 * @param {Object} permissions - Permissions object from store
 * @returns {string} Formatted target display string
 */
function resolveTargetNames(targets, permissions = null) {
  if (!targets || targets.length === 0) {
    return 'N/A';
  }

  // If permissions are not provided, show target type and count
  if (!permissions) {
    const targetCounts = targets.reduce((acc, target) => {
      acc[target.targetType] = (acc[target.targetType] || 0) + 1;
      return acc;
    }, {});
    
    const targetLabels = {
      'CLASS': 'Class',
      'SECTION': 'Section',
      'STUDENT': 'Student'
    };
    
    const displayParts = Object.entries(targetCounts).map(([type, count]) => {
      const label = targetLabels[type] || type;
      return count > 1 ? `${count} ${label}es` : `1 ${label}`;
    });
    
    return displayParts.join(', ');
  }

  // Resolve target IDs to names using permissions
  const targetNames = targets.map(target => {
    switch (target.targetType) {
      case 'CLASS': {
        const classItem = permissions.classes?.find(c => c.class_id === target.targetId);
        return classItem ? classItem.class_name : `Class (${target.targetId})`;
      }
      case 'SECTION': {
        const sectionItem = permissions.sections?.find(s => s.section_id === target.targetId);
        return sectionItem ? sectionItem.section_name : `Section (${target.targetId})`;
      }
      case 'STUDENT': {
        const studentItem = permissions.students?.find(s => s.student_id === target.targetId);
        return studentItem ? studentItem.student_name : `Student (${target.targetId})`;
      }
      default:
        return target.targetId;
    }
  });

  // Join with commas, but limit display to avoid overflow
  if (targetNames.length > 3) {
    return `${targetNames.slice(0, 3).join(', ')} +${targetNames.length - 3} more`;
  }
  
  return targetNames.join(', ');
}

/**
 * Transform API exam data to UI format
 * @param {Object} apiExam - Exam data from API
 * @param {Object} permissions - Optional permissions object from store to resolve target names
 * @returns {Object} Transformed exam data for UI
 */
function transformExamData(apiExam, permissions = null) {
  // Calculate start and end dates from subjects
  let startDate = null;
  let endDate = null;
  
  if (apiExam.subjects && apiExam.subjects.length > 0) {
    const dates = apiExam.subjects
      .map(sub => sub.examDate ? new Date(sub.examDate) : null)
      .filter(date => date !== null)
      .sort((a, b) => a - b);
    
    if (dates.length > 0) {
      startDate = dates[0].toISOString().split('T')[0];
      endDate = dates[dates.length - 1].toISOString().split('T')[0];
    }
  }

  // Transform subjects to UI format
  const subjects = (apiExam.subjects || []).map(sub => ({
    subjectId: sub.id,
    subjectName: sub.subjectName,
    examDate: sub.examDate ? new Date(sub.examDate).toISOString().split('T')[0] : '',
    startTime: sub.examStartTime ? sub.examStartTime.substring(0, 5) : '', // Convert HH:MM:SS to HH:MM
    endTime: sub.examEndTime ? sub.examEndTime.substring(0, 5) : '', // Convert HH:MM:SS to HH:MM
  }));

  // Extract grading values
  const gradingExtras = apiExam.gradingExtras || {};
  const passingValue = gradingExtras.passing_value?.toString() || '';
  const maxValue = gradingExtras.max_value?.toString() || '';
  const gradeRanges = gradingExtras.grade_ranges || [];

  // Resolve target names using permissions (if provided)
  const targetDisplay = resolveTargetNames(apiExam.targets, permissions);

  return {
    id: apiExam.id,
    examType: apiExam.examType,
    customExamType: apiExam.examType === 'OTHER' ? apiExam.customExamType : '',
    class: targetDisplay, // Display resolved target names
    section: '', // Keep empty as we're showing combined target info in class field
    target: apiExam.target, // Keep original target type
    status: apiExam.status,
    subjects: subjects,
    startDate: startDate,
    endDate: endDate,
    gradingType: apiExam.gradingType,
    passingValue: passingValue,
    maxValue: maxValue,
    gradeRanges: gradeRanges,
    targets: apiExam.targets || [],
    createdBy: apiExam.createdBy,
    campusId: apiExam.campusId,
    createdAt: apiExam.createdAt,
    updatedAt: apiExam.updatedAt,
  };
}

/**
 * Enrich exam data with resolved target names from permissions
 * @param {Object|Array} examData - Single exam or array of exams
 * @param {Object} permissions - Permissions object from store
 * @returns {Object|Array} Enriched exam data
 */
export function enrichExamsWithTargetNames(examData, permissions) {
  if (!permissions) return examData;
  
  if (Array.isArray(examData)) {
    return examData.map(exam => ({
      ...exam,
      class: resolveTargetNames(exam.targets, permissions)
    }));
  }
  
  return {
    ...examData,
    class: resolveTargetNames(examData.targets, permissions)
  };
}

/**
 * Fetch all exams for the logged-in teacher with filters
 * @param {Object} params - Query parameters
 * @param {string} params.teacher_id - Teacher ID (required)
 * @param {string} [params.status] - Filter by exam status (DRAFT, PUBLISHED, COMPLETED)
 * @param {string} [params.start_date] - Start date for exam date filter (YYYY-MM-DD)
 * @param {string} [params.end_date] - End date for exam date filter (YYYY-MM-DD)
 * @param {number} [params.limit] - Number of records to return (default: 50, max: 100)
 * @param {number} [params.offset] - Number of records to skip (default: 0)
 * @param {Object} [permissions] - Optional permissions object to resolve target names
 * @returns {Promise<Array>} Array of exam assignments
 */
export async function getTeacherExamsAll(params, permissions = null) {
  try {
    const response = await api.get("/exam/teacher/all", { params });
    
    // Extract data from response
    const apiData = response.data?.data || response.data || [];
    
    // Transform each exam to UI format
    const transformedData = Array.isArray(apiData) 
      ? apiData.map(exam => transformExamData(exam, permissions))
      : [];
    
    return transformedData;
  } catch (err) {
    console.error("Error fetching teacher exams:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Fetch details of a specific exam
 * @param {string} examId - The ID of the exam
 * @param {Object} [permissions] - Optional permissions object to resolve target names
 * @returns {Promise<Object>} Exam details
 */
export async function getExamDetail(examId, permissions = null) {
  try {
    const response = await api.get(`/exam/${examId}`);
    
    // Extract data from response
    const apiData = response.data?.data || response.data;
    
    // Transform to UI format (reuse the same transformation logic)
    const transformedData = transformExamData(apiData, permissions);
    
    // Add additional fields expected by the detail view
    transformedData.maxMarks = transformedData.maxValue;
    transformedData.passingMarks = transformedData.passingValue;
    
    return transformedData;
  } catch (err) {
    console.error("Error fetching exam detail:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Create a new exam
 * @param {Object} examData - Exam data object
 * @param {string} examData.exam_type - Type of exam (UNIT_TEST, MID_TERM, FINAL, etc.)
 * @param {string} examData.teacher_id - Teacher ID
 * @param {Array} examData.targets - Array of target objects
 * @param {Array} examData.subjects - Array of subject-date objects
 * @param {Object} examData.grading_config - Grading configuration object
 * @param {boolean} examData.publish - Whether to publish immediately
 * @returns {Promise<Object>} Created exam object
 */
export async function createExam(examData) {
  try {
    const response = await api.post("/exam", examData);
    return response.data;
  } catch (err) {
    console.error("Error creating exam:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Update an existing exam
 * @param {string} examId - The ID of the exam
 * @param {Object} examData - Updated exam data
 * @returns {Promise<Object>} Updated exam object
 */
export async function updateExam(examId, examData) {
  try {
    const response = await api.put(`/exams/${examId}`, examData);
    return response.data;
  } catch (err) {
    console.error("Error updating exam:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Delete an exam
 * @param {string} examId - The ID of the exam
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteExam(examId) {
  try {
    const response = await api.delete(`/exams/${examId}`);
    return response.data;
  } catch (err) {
    console.error("Error deleting exam:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Publish a draft exam
 * @param {string} examId - The ID of the exam
 * @returns {Promise<Object>} Published exam object
 */
export async function publishExam(examId) {
  try {
    const response = await api.post(`/exams/${examId}/publish`);
    return response.data;
  } catch (err) {
    console.error("Error publishing exam:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Get students and their marks for a specific exam
 * @param {string} examId - The ID of the exam
 * @returns {Promise<Object>} Students list with their marks
 */
export async function getExamStudents(examId) {
  try {
    const response = await api.get(`/exams/${examId}/students`);
    return response.data;
  } catch (err) {
    console.error("Error fetching exam students:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Submit marks for a student in an exam
 * @param {string} examId - The ID of the exam
 * @param {string} studentId - The ID of the student
 * @param {Object} marksData - Marks data for all subjects
 * @returns {Promise<Object>} Submission response
 */
export async function submitExamMarks(examId, studentId, marksData) {
  try {
    const response = await api.post(`/exams/${examId}/students/${studentId}/marks`, marksData);
    return response.data;
  } catch (err) {
    console.error("Error submitting exam marks:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Bulk submit marks for multiple students
 * @param {string} examId - The ID of the exam
 * @param {Array} studentsMarks - Array of student marks data
 * @returns {Promise<Object>} Bulk submission response
 */
export async function bulkSubmitExamMarks(examId, studentsMarks) {
  try {
    const response = await api.post(`/exams/${examId}/marks/bulk`, { students: studentsMarks });
    return response.data;
  } catch (err) {
    console.error("Error bulk submitting exam marks:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Update exam status to completed
 * @param {string} examId - The ID of the exam
 * @returns {Promise<Object>} Updated exam object
 */
export async function completeExam(examId) {
  try {
    const response = await api.post(`/exams/${examId}/complete`);
    return response.data;
  } catch (err) {
    console.error("Error completing exam:", err.response?.data);
    throw err.response?.data || err;
  }
}

// ==================== STUDENT EXAM API ====================

/**
 * Fetch all exams for a specific student with filters
 * @param {Object} params - Query parameters
 * @param {string} params.student_id - Student ID (required)
 * @param {string} [params.status] - Filter by exam status (DRAFT, PUBLISHED, COMPLETED)
 * @param {string} [params.start_date] - Start date for exam date filter (YYYY-MM-DD)
 * @param {string} [params.end_date] - End date for exam date filter (YYYY-MM-DD)
 * @param {number} [params.limit] - Number of records to return (default: 50, max: 100)
 * @param {number} [params.offset] - Number of records to skip (default: 0)
 * @returns {Promise<Object>} Exams response with data array and metadata
 */
export async function getStudentExamsAll(params) {
  try {
    const response = await api.get("/exams/student/all", { params });
    return response.data;
  } catch (err) {
    console.error("Error fetching student exams:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Get student's marks for a specific exam
 * @param {string} examId - The ID of the exam
 * @param {string} studentId - The ID of the student
 * @returns {Promise<Object>} Student's exam marks and details
 */
export async function getStudentExamMarks(examId, studentId) {
  try {
    const response = await api.get(`/exams/${examId}/students/${studentId}/marks`);
    return response.data;
  } catch (err) {
    console.error("Error fetching student exam marks:", err.response?.data);
    throw err.response?.data || err;
  }
}
