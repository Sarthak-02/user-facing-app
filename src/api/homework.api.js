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
 * Fetch details of a specific homework assignment
 * @param {string} homeworkId - The ID of the homework assignment
 * @returns {Promise<Object>} Homework details
 */
export async function getHomeworkDetail(homeworkId) {
  try {
    const response = await api.get(`/student/homework/${homeworkId}`);
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
 * @param {FormData} formData - Form data containing homework details and attachments
 * @returns {Promise<Object>} Created homework object
 */
export async function createHomework(formData) {
  try {
    const response = await api.post("/staff/homework", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
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
