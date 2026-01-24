import api from "./axios";

/**
 * Fetch student attendance details
 * @param {Object} params - Request parameters
 * @param {string} params.student_id - Student ID to fetch attendance for
 * @param {string} params.section_id - Section ID to filter attendance records
 * @param {string} [params.start_date] - Optional start date (YYYY-MM-DD)
 * @param {string} [params.end_date] - Optional end date (YYYY-MM-DD)
 * @returns {Promise<Object>} Attendance data with summary and records
 */
export async function getStudentAttendance(params) {
  try {
    const response = await api.post("attendance/student", params);
    return response.data;
  } catch (err) {
    console.error("Error fetching student attendance:", err.response?.data);
    throw err.response?.data || err;
  }
}
