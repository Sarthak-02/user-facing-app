import api from "./axios";
import i18n from "../i18n";

/**
 * Normalize POST /teacher/summary body: supports `{ success, data }` or a direct summary object.
 * @param {object} res - Parsed JSON body from the API
 * @returns {{ payload: object | null, message: string | null }}
 */
export function unwrapTeacherSummaryResponse(res) {
  if (!res || typeof res !== "object") {
    return { payload: null, message: i18n.t("errors.summaryCouldNotLoad") };
  }
  if (res.success === false) {
    return {
      payload: null,
      message: typeof res.message === "string" ? res.message : i18n.t("errors.summaryCouldNotLoad"),
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
    message: typeof res.message === "string" ? res.message : i18n.t("errors.summaryCouldNotLoad"),
  };
}

/**
 * @param {string} campusId
 * @param {string} sectionId
 * @returns {Promise<Array>}
 */
export async function listTeachersBySection(campusId, sectionId) {
  const res = await api.post("/teacher/list-by-section", {
    campus_id: campusId,
    section_id: sectionId,
  });
  const data = res.data?.data ?? res.data ?? [];
  return Array.isArray(data) ? data : [];
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

export async function getTeacherSections(teacherId) {
  const res = await api.get(`teachers/${teacherId}/report/sections`);
  return res.data;
}

export async function getTeacherSectionSummary(teacherId, sectionId, query = {}) {
  const res = await api.get(
    `teachers/${teacherId}/report/sections/${sectionId}/summary`,
    { params: query }
  );
  return res.data;
}

export async function getTeacherSectionGrades(teacherId, sectionId, query = {}) {
  const res = await api.get(
    `teachers/${teacherId}/report/sections/${sectionId}/grades`,
    { params: query }
  );
  return res.data;
}

export async function getTeacherSectionExam(teacherId, sectionId, examId) {
  const res = await api.get(
    `teachers/${teacherId}/report/sections/${sectionId}/exams/${examId}`
  );
  return res.data;
}
