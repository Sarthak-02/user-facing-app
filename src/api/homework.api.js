import api from "./axios";

/**
 * Fetch all homework assignments for the logged-in student
 * @returns {Promise<Array>} Array of homework assignments
 */
export async function getHomeworkList() {
  try {
    const response = await api.get("/student/homework");
    return response.data;
  } catch (err) {
    console.error("Error fetching homework list:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Fetch all homework assignments for a specific student with filters
 * @param {Object} params - Query parameters
 * @param {string} params.student_id - Student ID (required)
 * @param {string} [params.status] - Filter by homework status (DRAFT, PUBLISHED, CLOSED) - default: PUBLISHED
 * @param {string} [params.start_date] - Start date for due date filter (YYYY-MM-DD)
 * @param {string} [params.end_date] - End date for due date filter (YYYY-MM-DD)
 * @param {number} [params.limit] - Number of records to return (default: 50, max: 100)
 * @param {number} [params.offset] - Number of records to skip (default: 0)
 * @returns {Promise<Object>} Homework response with data array and metadata
 */
export async function getStudentHomeworkAll(params) {
  try {
    const response = await api.get("/homework/student/all", { params });
    return response.data;
  } catch (err) {
    console.error("Error fetching student homework:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Fetch details of a specific homework assignment (universal endpoint)
 * @param {string} homeworkId - The ID of the homework assignment
 * @returns {Promise<Object>} Homework details
 */
export async function getHomeworkDetail(homeworkId) {
  try {
    const response = await api.get(`/homework/${homeworkId}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching homework detail:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Submit homework assignment
 * @param {string} homeworkId - The ID of the homework assignment
 * @param {FormData} formData - Form data containing submission files and information
 * @returns {Promise<Object>} Submission response
 */
export async function submitHomework(homeworkId, formData) {
  try {
    const response = await api.post(
      `/student/homework/${homeworkId}/submit`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error submitting homework:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Download homework attachment
 * @param {string} homeworkId - The ID of the homework assignment
 * @param {string} attachmentId - The ID of the attachment
 * @returns {Promise<Blob>} File blob
 */
export async function downloadHomeworkAttachment(homeworkId, attachmentId) {
  try {
    const response = await api.get(
      `/student/homework/${homeworkId}/attachment/${attachmentId}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error downloading attachment:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Get homework statistics/summary
 * @returns {Promise<Object>} Homework statistics
 */
export async function getHomeworkStats() {
  try {
    const response = await api.get("/student/homework/stats");
    return response.data;
  } catch (err) {
    console.error("Error fetching homework stats:", err.response?.data);
    throw err.response?.data || err;
  }
}

// ==================== STAFF/TEACHER HOMEWORK API ====================

/**
 * Fetch all homework assignments created by the logged-in teacher
 * @returns {Promise<Array>} Array of homework assignments
 */
export async function getTeacherHomeworkList() {
  try {
    const response = await api.get("/staff/homework");
    return response.data;
  } catch (err) {
    console.error("Error fetching teacher homework list:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Fetch all homework assignments created by a specific teacher with filters
 * @param {Object} params - Query parameters
 * @param {string} params.teacher_id - Teacher ID (required)
 * @param {string} [params.status] - Filter by homework status (DRAFT, PUBLISHED, CLOSED)
 * @param {string} [params.start_date] - Start date for due date filter (YYYY-MM-DD)
 * @param {string} [params.end_date] - End date for due date filter (YYYY-MM-DD)
 * @param {number} [params.limit] - Number of records to return (default: 50, max: 100)
 * @param {number} [params.offset] - Number of records to skip (default: 0)
 * @returns {Promise<Array>} Array of homework assignments
 */
export async function getTeacherHomeworkAll(params) {
  try {
    const response = await api.get("/homework/teacher/all", { params });
    return response.data;
  } catch (err) {
    console.error("Error fetching teacher homework:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Fetch details of a specific homework assignment (teacher view)
 * @param {string} homeworkId - The ID of the homework assignment
 * @returns {Promise<Object>} Homework details with submissions
 */
export async function getTeacherHomeworkDetail(homeworkId) {
  try {
    const response = await api.get(`/staff/homework/${homeworkId}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching teacher homework detail:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Create a new homework assignment
 * @param {Object} homeworkData - Homework data object
 * @param {string} homeworkData.title - Homework title
 * @param {string} homeworkData.description - Homework description
 * @param {string} homeworkData.due_date - Due date in ISO format
 * @param {string} homeworkData.subject - Subject name
 * @param {string} homeworkData.teacher_id - Teacher ID
 * @param {Array} homeworkData.attachments - Array of attachment objects (optional)
 * @param {Array} homeworkData.targets - Array of target objects
 * @param {boolean} homeworkData.publish - Whether to publish immediately
 * @returns {Promise<Object>} Created homework object
 */
export async function createHomework(homeworkData) {
  try {
    const response = await api.post("/homework", homeworkData);
    return response.data;
  } catch (err) {
    console.error("Error creating homework:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Update an existing homework assignment
 * @param {string} homeworkId - The ID of the homework assignment
 * @param {FormData} formData - Form data containing updated homework details
 * @returns {Promise<Object>} Updated homework object
 */
export async function updateHomework(homeworkId, formData) {
  try {
    const response = await api.put(`/staff/homework/${homeworkId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error updating homework:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Delete a homework assignment
 * @param {string} homeworkId - The ID of the homework assignment
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteHomework(homeworkId) {
  try {
    const response = await api.delete(`/staff/homework/${homeworkId}`);
    return response.data;
  } catch (err) {
    console.error("Error deleting homework:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Get homework statistics for teacher (summary of all homework)
 * @returns {Promise<Object>} Homework statistics
 */
export async function getTeacherHomeworkStats() {
  try {
    const response = await api.get("/staff/homework/stats");
    return response.data;
  } catch (err) {
    console.error("Error fetching teacher homework stats:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Get list of students and their submissions for a specific homework
 * @param {string} homeworkId - The ID of the homework assignment
 * @returns {Promise<Array>} Array of student submissions
 */
export async function getHomeworkSubmissions(homeworkId) {
  try {
    const response = await api.get(`/staff/homework/${homeworkId}/submissions`);
    return response.data;
  } catch (err) {
    console.error("Error fetching homework submissions:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Grade a student's homework submission
 * @param {string} homeworkId - The ID of the homework assignment
 * @param {string} submissionId - The ID of the submission
 * @param {Object} gradeData - Grade and feedback data
 * @returns {Promise<Object>} Grading response
 */
export async function gradeHomeworkSubmission(homeworkId, submissionId, gradeData) {
  try {
    const response = await api.post(
      `/staff/homework/${homeworkId}/submissions/${submissionId}/grade`,
      gradeData
    );
    return response.data;
  } catch (err) {
    console.error("Error grading homework submission:", err.response?.data);
    throw err.response?.data || err;
  }
}
