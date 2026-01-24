import api from "./axios";

/**
 * Fetch all exams for the logged-in teacher with filters
 * @param {Object} params - Query parameters
 * @param {string} params.teacher_id - Teacher ID (required)
 * @param {string} [params.status] - Filter by exam status (DRAFT, PUBLISHED, COMPLETED)
 * @param {string} [params.start_date] - Start date for exam date filter (YYYY-MM-DD)
 * @param {string} [params.end_date] - End date for exam date filter (YYYY-MM-DD)
 * @param {number} [params.limit] - Number of records to return (default: 50, max: 100)
 * @param {number} [params.offset] - Number of records to skip (default: 0)
 * @returns {Promise<Array>} Array of exam assignments
 */
export async function getTeacherExamsAll(params) {
  try {
    const response = await api.get("/exams/teacher/all", { params });
    return response.data;
  } catch (err) {
    console.error("Error fetching teacher exams:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Fetch details of a specific exam
 * @param {string} examId - The ID of the exam
 * @returns {Promise<Object>} Exam details
 */
export async function getExamDetail(examId) {
  try {
    const response = await api.get(`/exams/${examId}`);
    return response.data;
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
    const response = await api.post("/exams", examData);
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
