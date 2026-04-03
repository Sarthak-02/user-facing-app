import api from "./axios";
import axios from "axios";

/**
 * @param {unknown} raw
 * @returns {Array}
 */
export function normalizeLessonPlanList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.lesson_plans)) return raw.lesson_plans;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
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
  return response.data?.data ?? response.data;
}

/**
 * @param {object} body
 */
export async function createLessonPlan(body) {
  const response = await api.post("/lesson-plans", body);
  return response.data?.data ?? response.data;
}

/**
 * @param {string} lessonPlanId
 * @param {object} body
 */
export async function updateLessonPlan(lessonPlanId, body) {
  const response = await api.patch(`/lesson-plans/${lessonPlanId}`, body);
  return response.data?.data ?? response.data;
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
