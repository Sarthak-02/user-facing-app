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
