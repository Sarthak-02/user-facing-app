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

// ─── Class Plans ─────────────────────────────────────────────────────────────

/**
 * @param {{ campus_id?: string, teacher_id?: string, class_name?: string, subject?: string, academic_year?: string, is_published?: boolean, limit?: number, offset?: number }} params
 */
export async function listClassPlans(params) {
  const response = await api.get("/class-plans", { params });
  const d = response.data?.data ?? response.data;
  return Array.isArray(d) ? d : (d?.class_plans ?? d?.plans ?? d?.items ?? []);
}

/**
 * @param {string} classPlanId
 */
export async function getClassPlanById(classPlanId) {
  const response = await api.get(`/class-plans/${classPlanId}`);
  return response.data?.data ?? response.data;
}

/**
 * @param {{ campus_id: string, teacher_id: string, class_name: string, subject: string, academic_year: string, master_plan_id?: string, is_published?: boolean, topics?: object[] }} body
 */
export async function createClassPlan(body) {
  const response = await api.post("/class-plans", body);
  return response.data?.data ?? response.data;
}

/**
 * @param {string} classPlanId
 * @param {{ class_name?: string, subject?: string, academic_year?: string, is_published?: boolean, master_plan_id?: string | null }} body
 */
export async function updateClassPlan(classPlanId, body) {
  const response = await api.patch(`/class-plans/${classPlanId}`, body);
  return response.data?.data ?? response.data;
}

/**
 * @param {string} classPlanId
 */
export async function deleteClassPlan(classPlanId) {
  const response = await api.delete(`/class-plans/${classPlanId}`);
  return response.data?.data ?? response.data;
}

/**
 * Seed a class plan from a master plan.
 * @param {{ board: string, subject: string, class_name: string, academic_year: string, campus_id: string, teacher_id: string, is_published?: boolean }} body
 */
export async function seedClassPlanFromMaster(body) {
  const response = await api.post("/class-plans/seed-from-master", body);
  return response.data?.data ?? response.data;
}

// ─── Topics ──────────────────────────────────────────────────────────────────

/**
 * @param {string} classPlanId
 * @param {Array<{ chapter_title: string, chapter_number?: number, title: string, display_order: number, status?: string, scheduled_date?: string, teacher_notes?: string, is_added_by_teacher?: boolean }>} topics
 */
export async function addClassPlanTopics(classPlanId, topics) {
  const response = await api.post(`/class-plans/${classPlanId}/topics`, { topics });
  return response.data?.data ?? response.data;
}

/**
 * @param {string} topicId
 * @param {{ chapter_title?: string, chapter_number?: number | null, title?: string, display_order?: number, status?: string, scheduled_date?: string | null, completed_on?: string | null, actual_duration_mins?: number | null, teacher_notes?: string | null, is_added_by_teacher?: boolean }} body
 */
export async function updateClassPlanTopic(topicId, body) {
  const response = await api.patch(`/class-plan-topics/${topicId}`, body);
  return response.data?.data ?? response.data;
}

/**
 * @param {string} topicId
 */
export async function deleteClassPlanTopic(topicId) {
  const response = await api.delete(`/class-plan-topics/${topicId}`);
  return response.data?.data ?? response.data;
}

// ─── Materials ────────────────────────────────────────────────────────────────

/**
 * @param {string} topicId
 * @param {{ file_name: string, file_url: string }} body
 */
export async function addTopicMaterial(topicId, body) {
  const response = await api.post(`/class-plan-topics/${topicId}/materials`, body);
  return response.data?.data ?? response.data;
}

/**
 * @param {string} materialId
 */
export async function deleteTopicMaterial(materialId) {
  const response = await api.delete(`/class-plan-materials/${materialId}`);
  return response.data?.data ?? response.data;
}

// ─── Assignments ──────────────────────────────────────────────────────────────

/**
 * @param {string} topicId
 * @param {{ title: string, due_date?: string, file_url?: string, status?: "DRAFT"|"PUBLISHED"|"CLOSED" }} body
 */
export async function addTopicAssignment(topicId, body) {
  const response = await api.post(`/class-plan-topics/${topicId}/assignments`, body);
  return response.data?.data ?? response.data;
}

/**
 * @param {string} assignmentId
 * @param {{ title?: string, due_date?: string | null, file_url?: string | null, status?: "DRAFT"|"PUBLISHED"|"CLOSED" }} body
 */
export async function updateTopicAssignment(assignmentId, body) {
  const response = await api.patch(`/class-plan-assignments/${assignmentId}`, body);
  return response.data?.data ?? response.data;
}

/**
 * @param {string} assignmentId
 */
export async function deleteTopicAssignment(assignmentId) {
  const response = await api.delete(`/class-plan-assignments/${assignmentId}`);
  return response.data?.data ?? response.data;
}

// ─── Quizzes ──────────────────────────────────────────────────────────────────

/**
 * @param {string} topicId
 * @param {{ title: string, generated_by_ai?: boolean, file_url?: string }} body
 */
export async function addTopicQuiz(topicId, body) {
  const response = await api.post(`/class-plan-topics/${topicId}/quizzes`, body);
  return response.data?.data ?? response.data;
}

/**
 * @param {string} quizId
 * @param {{ title?: string, generated_by_ai?: boolean, file_url?: string | null }} body
 */
export async function updateTopicQuiz(quizId, body) {
  const response = await api.patch(`/class-plan-quizzes/${quizId}`, body);
  return response.data?.data ?? response.data;
}

/**
 * @param {string} quizId
 */
export async function deleteTopicQuiz(quizId) {
  const response = await api.delete(`/class-plan-quizzes/${quizId}`);
  return response.data?.data ?? response.data;
}
