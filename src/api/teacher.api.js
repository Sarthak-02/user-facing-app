import api from "./axios";

/**
 * Normalize POST /teacher/summary body: supports `{ success, data }` or a direct summary object.
 * @param {object} res - Parsed JSON body from the API
 * @returns {{ payload: object | null, message: string | null }}
 */
export function unwrapTeacherSummaryResponse(res) {
  if (!res || typeof res !== "object") {
    return { payload: null, message: "Could not load summary." };
  }
  if (res.success === false) {
    return {
      payload: null,
      message: typeof res.message === "string" ? res.message : "Could not load summary.",
    };
  }

  const d = res.data;
  const dataLooksLikeSummary =
    d &&
    typeof d === "object" &&
    (d.timetable != null ||
      Array.isArray(d.timetables_by_section) ||
      Array.isArray(d.homework_due) ||
      typeof d.homework_count === "number" ||
      typeof d.announcements_count === "number" ||
      d.teacherId != null ||
      d.teacher_id != null ||
      Array.isArray(d.subjects) ||
      (typeof d.campus_id === "string" && Array.isArray(d.teacher_sections)));

  if (res.success === true && dataLooksLikeSummary) {
    return { payload: d, message: null };
  }
  if (dataLooksLikeSummary && res.success !== false) {
    return { payload: d, message: null };
  }

  const rootLooksLikeSummary =
    res.timetable != null ||
    Array.isArray(res.timetables_by_section) ||
    Array.isArray(res.homework_due) ||
    typeof res.homework_count === "number" ||
    typeof res.announcements_count === "number" ||
    res.teacherId != null ||
    res.teacher_id != null ||
    Array.isArray(res.subjects) ||
    (typeof res.campus_id === "string" && Array.isArray(res.teacher_sections));

  if (rootLooksLikeSummary) {
    return { payload: res, message: null };
  }

  return {
    payload: null,
    message: typeof res.message === "string" ? res.message : "Could not load summary.",
  };
}

/**
 * Teacher home summary (timetable and related dashboard fields).
 * @param {Object} params
 * @param {string} params.campusId
 * @param {string} params.teacherId
 * @param {string[]} params.teacherSections - section ids
 * @returns {Promise<object>} Raw response body (use {@link unwrapTeacherSummaryResponse} to read payload)
 */
export async function postTeacherSummary({ campusId, teacherId, teacherSections }) {
  const response = await api.post("/teacher/summary", {
    campus_id: campusId,
    teacher_id: teacherId,
    teacher_sections: teacherSections,
  });
  return response.data;
}
