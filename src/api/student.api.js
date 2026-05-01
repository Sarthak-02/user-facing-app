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

/**
 * @param {string} campusId
 * @param {string} sectionId
 */
export async function getReportDashboardConfig(campusId, sectionId) {
  const response = await api.get("report-dashboard-config", {
    params: { campus_id: campusId, section_id: sectionId },
  });
  return response.data;
}
