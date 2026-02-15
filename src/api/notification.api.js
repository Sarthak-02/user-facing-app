import apiClient from "./axios";

/**
 * Get user notifications
 * @param {Object} params - Query parameters
 * @param {string} params.receiverId - User ID to fetch notifications for
 * @param {boolean} params.includeRead - Whether to include read notifications (default: false)
 * @param {number} params.limit - Number of records to fetch
 * @param {number} params.offset - Offset for pagination
 * @returns {Promise<Object>} Notifications response with data and count
 */
export async function getUserNotifications(params) {
  try {
    const response = await apiClient.get("/notifications", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID to mark as read
 * @returns {Promise<Object>} Updated notification
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 * @param {string} receiverId - User ID
 * @returns {Promise<Object>} Response
 */
export async function markAllNotificationsAsRead(receiverId) {
  try {
    const response = await apiClient.post("/notifications/mark-all-read", { receiverId });
    return response.data;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
}
