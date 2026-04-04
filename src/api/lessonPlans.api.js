import api from "./axios";
import axios from "axios";

/**
 * Map API lesson plan (camelCase or snake_case) to a single shape for UI.
 * @param {unknown} raw
 * @returns {object|null}
 */
export function normalizeLessonPlan(raw) {
  if (raw == null || typeof raw !== "object") return raw;

  const subjectStr = typeof raw.subject === "string" ? raw.subject : null;
  const learning_objectives = raw.learningObjectives ?? raw.learning_objectives ?? [];
  const activitiesRaw = raw.activities ?? [];
  const activities = Array.isArray(activitiesRaw)
    ? activitiesRaw.map((a) => ({
        ...a,
        type: a?.type,
        description: a?.description,
        duration_minutes: a?.duration_minutes ?? a?.durationMinutes,
      }))
    : [];

  const attachmentsRaw = raw.attachments ?? raw.lesson_plan_attachments ?? [];
  const attachments = Array.isArray(attachmentsRaw)
    ? attachmentsRaw.map((a) => ({
        ...a,
        fileUrl: a?.fileUrl ?? a?.file_url,
        fileName: a?.fileName ?? a?.file_name,
        fileType: a?.fileType ?? a?.file_type,
        fileSize: a?.fileSize ?? a?.file_size,
        attachment_id: a?.attachment_id ?? a?.attachmentId ?? a?.id,
        id: a?.id ?? a?.attachment_id ?? a?.attachmentId,
      }))
    : [];

  const cls = raw.class && typeof raw.class === "object" ? raw.class : null;
  const sec = raw.section && typeof raw.section === "object" ? raw.section : null;

  const subject_name =
    [raw.subjectName, raw.subject_name, subjectStr, raw.subject?.name].find(
      (v) => v != null && String(v).length > 0
    ) ?? "";

  return {
    ...raw,
    id: raw.id ?? raw.lesson_plan_id,
    lesson_plan_id: raw.lesson_plan_id ?? raw.id,
    lesson_date: raw.lessonDate ?? raw.lesson_date,
    chapter_topic: raw.chapterTopic ?? raw.chapter_topic,
    description: raw.description ?? null,
    learning_objectives,
    activities,
    homework: raw.homework ?? null,
    status: raw.status,
    subject_id: raw.subjectId ?? raw.subject_id,
    subject_name,
    class_id: raw.classId ?? raw.class_id ?? cls?.class_id,
    section_id: raw.sectionId ?? raw.section_id ?? sec?.section_id,
    teacher_id: raw.teacherId ?? raw.teacher_id ?? raw.teacher?.teacher_id,
    campus_id: raw.campusId ?? raw.campus_id,
    created_at: raw.createdAt ?? raw.created_at,
    updated_at: raw.updatedAt ?? raw.updated_at,
    attachments,
    class: raw.class,
    section: raw.section,
    teacher: raw.teacher,
    class_name: cls?.class_name ?? raw.class_name,
    section_name: sec?.section_name ?? raw.section_name,
  };
}

/**
 * @param {unknown} raw
 * @returns {Array}
 */
export function normalizeLessonPlanList(raw) {
  let arr = [];
  if (!raw) arr = [];
  else if (Array.isArray(raw)) arr = raw;
  else if (Array.isArray(raw.data)) arr = raw.data;
  else if (Array.isArray(raw.lesson_plans)) arr = raw.lesson_plans;
  else if (Array.isArray(raw.lessonPlans)) arr = raw.lessonPlans;
  else if (Array.isArray(raw.items)) arr = raw.items;
  return arr.map((item) => normalizeLessonPlan(item));
}

/**
 * @param {Record<string, string|number|undefined>} params
 */
export async function listLessonPlans(params) {
  const response = await api.get("/lesson-plans", { params });
  return response.data;
}

/**
 * @param {string} lessonPlanId
 */
export async function getLessonPlanById(lessonPlanId) {
  const response = await api.get(`/lesson-plans/${lessonPlanId}`);
  const data = response.data?.data ?? response.data;
  if (data == null) return null;
  return normalizeLessonPlan(data);
}

/**
 * @param {object} body
 */
export async function createLessonPlan(body) {
  const response = await api.post("/lesson-plans", body);
  const data = response.data?.data ?? response.data;
  return data != null ? normalizeLessonPlan(data) : data;
}

/**
 * @param {string} lessonPlanId
 * @param {object} body
 */
export async function updateLessonPlan(lessonPlanId, body) {
  const response = await api.patch(`/lesson-plans/${lessonPlanId}`, body);
  const data = response.data?.data ?? response.data;
  return data != null ? normalizeLessonPlan(data) : data;
}

/**
 * @param {string} lessonPlanId
 */
export async function deleteLessonPlan(lessonPlanId) {
  const response = await api.delete(`/lesson-plans/${lessonPlanId}`);
  return response.data?.data ?? response.data;
}

/**
 * @param {string} lessonPlanId
 * @param {{ attachments: Array<{ fileUrl: string, fileName: string, fileType: string, fileSize: number }> }} body
 */
export async function addLessonPlanAttachments(lessonPlanId, body) {
  const response = await api.post(`/lesson-plans/${lessonPlanId}/attachments`, body);
  return response.data?.data ?? response.data;
}

/**
 * @param {string} attachmentId
 */
export async function removeLessonPlanAttachment(attachmentId) {
  const response = await api.delete(`/lesson-plans/attachments/${attachmentId}`);
  return response.data?.data ?? response.data;
}

/**
 * @param {{ file_name: string, mime_type: string, lesson_plan_id?: string }} payload
 * @returns {Promise<{ uploadUrl: string, fileUrl: string }>}
 */
export async function getLessonPlanAttachmentUploadUrls(payload) {
  const response = await api.post("/lesson-plans/attachment/upload-url", payload);
  const d = response?.data?.data ?? response?.data ?? {};
  const uploadUrl = d.uploadUrl ?? d.upload_url;
  const fileUrl = d.fileUrl ?? d.file_url ?? d.publicUrl ?? d.public_url;
  if (!uploadUrl || !fileUrl) {
    throw new Error("Failed to get upload URL for lesson plan attachment");
  }
  return { uploadUrl, fileUrl };
}

/**
 * @param {File} file
 * @param {string} [lessonPlanId]
 */
export async function uploadLessonPlanFile(file, lessonPlanId) {
  const { uploadUrl, fileUrl } = await getLessonPlanAttachmentUploadUrls({
    file_name: file.name,
    mime_type: file.type || "application/octet-stream",
    ...(lessonPlanId ? { lesson_plan_id: lessonPlanId } : {}),
  });
  await axios.put(uploadUrl, file, {
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });
  return {
    fileUrl,
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    fileSize: file.size,
  };
}
