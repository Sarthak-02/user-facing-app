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

export async function getStudentsBySection(section_id){
  try{
    const response = await api.get(`students/by-section?section_id=${section_id}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching students by section:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function submitAttendance(payload){
  try{
    const response = await api.post("attendance/bulk_create", payload);
    return response.data;
  } catch (err) {
    console.error("Error submitting attendance:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Fetch backdated attendance details with filters
 * @param {Object} params - Query parameters
 * @param {string} params.section_id - Section ID to fetch attendance for (required)
 * @param {string} params.date - Date in YYYY-MM-DD format (required)
 * @param {string} [params.campus_session] - Optional campus session filter (MORNING, EVENING, FULL_DAY)
 * @param {string} [params.period] - Optional period filter (e.g., OVERALL, P1, P2, etc.)
 * @returns {Promise<Object>} Attendance details for the specified filters
 */
export async function getAttendanceDetails(params) {
  try {
    const queryParams = new URLSearchParams();
    
    // Add required parameters
    queryParams.append("section_id", params.section_id);
    queryParams.append("date", params.date);
    
    // Add optional parameters if provided
    if (params.campus_session) {
      queryParams.append("campus_session", params.campus_session);
    }
    if (params.period) {
      queryParams.append("period", params.period);
    }
    
    const response = await api.get(`attendance/details?${queryParams.toString()}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching attendance details:", err.response?.data);
    throw err.response?.data || err;
  }
}