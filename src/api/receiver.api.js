import api from "./axios";

/**
 * Student home / dashboard summary (timetable, homework, broadcasts, attendance).
 * @param {Object} params
 * @param {string} params.receiverId - Student user id
 * @param {string} params.sectionId - Section id
 * @param {string} params.campusId - Campus id
 * @returns {Promise<{ success?: boolean, data?: object }>}
 */
export async function getReceiverSummary({ receiverId, sectionId, campusId }) {
  const response = await api.get("/receiver/summary", {
    params: { receiverId, sectionId, campusId },
  });
  return response.data;
}
