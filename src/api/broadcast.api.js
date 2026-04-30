import apiClient from "./axios";

/**
 * Announcements received by a student (school broadcasts addressed to them).
 * @param {string} receiverId - Student user ID
 * @returns {Promise<{ success?: boolean, data?: Array, count?: number }>}
 */
export async function getReceivedBroadcasts(receiverId) {
  try {
    const response = await apiClient.get("/broadcast/received", {
      params: { receiverId },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching received broadcasts:", error);
    throw error;
  }
}

/**
 * Get all broadcasts
 * @param {Object} params - Query parameters
 * @param {string} params.campusId - Campus ID
 * @param {string} params.status - Filter by status (DRAFT, NOTIFYING, SUBMITTED)
 * @param {string} params.sourceType - Filter by notification source type (ATTENDANCE, BROADCAST, HOMEWORK, EXAM, SYSTEM)
 * @param {string} params.createdBy - Filter by creator ID
 * @param {number} params.limit - Number of records to fetch (default: 100, max: 500)
 * @param {number} params.offset - Offset for pagination (default: 0)
 * @returns {Promise<Array>} List of broadcasts
 */
export async function getBroadcastList(params) {
  try {
    const response = await apiClient.get("/broadcast/list", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching broadcasts:", error);
    throw error;
  }
}

/**
 * Get broadcast detail by ID
 * @param {string} broadcastId - Broadcast ID
 * @returns {Promise<Object>} Broadcast details
 */
export async function getBroadcastDetail(broadcastId) {
  try {
    const response = await apiClient.get(`/broadcasts/${broadcastId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching broadcast detail:", error);
    throw error;
  }
}

/**
 * Get a signed URL for direct attachment upload to GCS.
 * Returns { uploadUrl, fileUrl }.
 */
export async function getAttachmentUploadUrl({ file_name, mime_type, broadcast_id, campus_id }) {
  try {
    const response = await apiClient.post("/broadcast/attachment/upload-url", {
      file_name,
      mime_type,
      ...(broadcast_id && { broadcast_id }),
      ...(campus_id && { campus_id }),
    });
    return response.data?.data ?? response.data;
  } catch (err) {
    console.error("Error getting attachment upload URL:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Create a new broadcast
 * @param {Object} payload - Broadcast data
 * @param {string} payload.title - Broadcast title (required)
 * @param {string} payload.message - Broadcast message (required)
 * @param {Array} payload.targets - Target audience array (required)
 * @param {Array} payload.targets[].targetType - Target type (CAMPUS, CLASS, SECTION, STUDENT)
 * @param {string} payload.targets[].targetId - Target ID
 * @param {Array} payload.attachmentUrls - Optional attachment URLs
 * @param {string} payload.campusId - Campus ID
 * @param {string} [payload.category] - Announcement category (e.g. general, sports, fun, urgent)
 * @returns {Promise<Object>} Created broadcast
 */
export async function createBroadcast(payload) {
  try {
    const response = await apiClient.post("/broadcast", payload);
    return response.data;
  } catch (error) {
    console.error("Error creating broadcast:", error);
    throw error;
  }
}

/**
 * Update an existing broadcast
 * @param {string} broadcastId - Broadcast ID
 * @param {Object} payload - Updated broadcast data
 * @param {string} [payload.title] - Broadcast title (optional)
 * @param {string} [payload.message] - Broadcast message (optional)
 * @param {Array} [payload.attachmentUrls] - Array of attachment objects (optional)
 * @param {Array} [payload.targets] - Target audience array (optional)
 * @param {string} [payload.targets[].targetType] - Target type (CAMPUS, CLASS, SECTION, STUDENT)
 * @param {string} [payload.targets[].targetId] - Target ID
 * @param {string} [payload.category] - Announcement category (e.g. general, sports, fun, urgent)
 * @returns {Promise<Object>} Updated broadcast
 */
export async function updateBroadcast(broadcastId, payload) {
  try {
    const response = await apiClient.put(`/broadcast/${broadcastId}`, payload);
    return response.data;
  } catch (error) {
    console.error("Error updating broadcast:", error);
    throw error;
  }
}

/**
 * Publish a draft broadcast
 * @param {string} broadcastId - Broadcast ID
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} Published broadcast
 */
export async function publishBroadcast(broadcastId, teacherId) {
  try {
    const response = await apiClient.post(`/broadcasts/${broadcastId}/publish`, {
      teacher_id: teacherId,
    });
    return response.data;
  } catch (error) {
    console.error("Error publishing broadcast:", error);
    throw error;
  }
}

/**
 * Delete a broadcast
 * @param {string} broadcastId - Broadcast ID
 * @returns {Promise<void>}
 */
export async function deleteBroadcast(broadcastId) {
  try {
    await apiClient.delete(`/broadcasts/${broadcastId}`);
  } catch (error) {
    console.error("Error deleting broadcast:", error);
    throw error;
  }
}
