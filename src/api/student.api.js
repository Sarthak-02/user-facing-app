import api from "./axios";

/**
 * @param {string} studentId
 * @param {Object} [query]
 * @param {string} [query.exam_id]
 * @param {string} [query.start_date]
 * @param {string} [query.end_date]
 * @param {string} [query.status] e.g. "all"
 */
export async function getStudentGradesReport(studentId, query = {}) {
  const response = await api.get(`students/${studentId}/report/grades`, {
    params: query,
  });
  return response.data;
}
