import api from "./axios";

/**
 * Helper function to resolve target IDs to names
 * This should be called with permissions data from the store
 * @param {Array} targets - Array of target objects with targetType and targetId
 * @param {Object} permissions - Permissions object from store
 * @returns {string} Formatted target display string
 */
function resolveTargetNames(targets, permissions = null) {
  if (!targets || targets.length === 0) {
    return 'N/A';
  }

  // If permissions are not provided, show target type and count
  if (!permissions) {
    const targetCounts = targets.reduce((acc, target) => {
      acc[target.targetType] = (acc[target.targetType] || 0) + 1;
      return acc;
    }, {});
    
    const targetLabels = {
      'CLASS': 'Class',
      'SECTION': 'Section',
      'STUDENT': 'Student',
      'GROUP': 'Group',
    };
    
    const displayParts = Object.entries(targetCounts).map(([type, count]) => {
      const label = targetLabels[type] || type;
      return count > 1 ? `${count} ${label}es` : `1 ${label}`;
    });
    
    return displayParts.join(', ');
  }

  // Resolve target IDs to names using permissions
  const targetNames = targets.map(target => {
    switch (target.targetType) {
      case 'CLASS': {
        const classItem = permissions.classes?.find(c => c.class_id === target.targetId);
        return classItem ? classItem.class_name : `Class (${target.targetId})`;
      }
      case 'SECTION': {
        const sectionItem = permissions.sections?.find(s => s.section_id === target.targetId);
        return sectionItem ? sectionItem.section_name : `Section (${target.targetId})`;
      }
      case 'STUDENT': {
        const studentItem = permissions.students?.find(s => s.student_id === target.targetId);
        return studentItem ? studentItem.student_name : `Student (${target.targetId})`;
      }
      case 'GROUP':
        return target.target_name || 'Group';
      default:
        return target.targetId;
    }
  });

  // Join with commas, but limit display to avoid overflow
  if (targetNames.length > 3) {
    return `${targetNames.slice(0, 3).join(', ')} +${targetNames.length - 3} more`;
  }
  
  return targetNames.join(', ');
}

/**
 * Transform API exam data to UI format
 * @param {Object} apiExam - Exam data from API
 * @param {Object} permissions - Optional permissions object from store to resolve target names
 * @returns {Object} Transformed exam data for UI
 */
function transformExamData(apiExam, permissions = null) {
  // Calculate start and end dates from subjects
  let startDate = null;
  let endDate = null;
  
  if (apiExam.subjects && apiExam.subjects.length > 0) {
    const dates = apiExam.subjects
      .map(sub => sub.examDate ? new Date(sub.examDate) : null)
      .filter(date => date !== null)
      .sort((a, b) => a - b);
    
    if (dates.length > 0) {
      startDate = dates[0].toISOString().split('T')[0];
      endDate = dates[dates.length - 1].toISOString().split('T')[0];
    }
  }

  // Transform subjects to UI format
  const subjects = (apiExam.subjects || []).map(sub => ({
    subjectId: sub.id,
    subjectName: sub.subjectName,
    examDate: sub.examDate ? new Date(sub.examDate).toISOString().split('T')[0] : '',
    startTime: sub.examStartTime ? sub.examStartTime.substring(0, 5) : '',
    endTime: sub.examEndTime ? sub.examEndTime.substring(0, 5) : '',
    hasGradesMarked: sub.hasGradesMarked ?? false,
  }));

  // Extract grading values
  const gradingExtras = apiExam.gradingExtras || {};
  const passingValue = gradingExtras.passing_value?.toString() || '';
  const maxValue = gradingExtras.max_value?.toString() || '';
  const gradeRanges = gradingExtras.grade_ranges || [];

  // Resolve target names using permissions (if provided)
  const targetDisplay = resolveTargetNames(apiExam.targets, permissions);

  return {
    id: apiExam.id,
    examType: apiExam.examType,
    customExamType: apiExam.examType === 'OTHER' ? apiExam.customExamType : '',
    class: targetDisplay, // Display resolved target names
    section: '', // Keep empty as we're showing combined target info in class field
    target: apiExam.target, // Keep original target type
    status: apiExam.status,
    subjects: subjects,
    startDate: startDate,
    endDate: endDate,
    gradingType: apiExam.gradingType,
    passingValue: passingValue,
    maxValue: maxValue,
    gradeRanges: gradeRanges,
    targets: apiExam.targets || [],
    createdBy: apiExam.createdBy,
    campusId: apiExam.campusId,
    createdAt: apiExam.createdAt,
    updatedAt: apiExam.updatedAt,
  };
}

/**
 * Enrich exam data with resolved target names from permissions
 * @param {Object|Array} examData - Single exam or array of exams
 * @param {Object} permissions - Permissions object from store
 * @returns {Object|Array} Enriched exam data
 */
export function enrichExamsWithTargetNames(examData, permissions) {
  if (!permissions) return examData;
  
  if (Array.isArray(examData)) {
    return examData.map(exam => ({
      ...exam,
      class: resolveTargetNames(exam.targets, permissions)
    }));
  }
  
  return {
    ...examData,
    class: resolveTargetNames(examData.targets, permissions)
  };
}

/**
 * Fetch all exams for the logged-in teacher with filters
 * @param {Object} params - Query parameters
 * @param {string} params.teacher_id - Teacher ID (required)
 * @param {string} [params.status] - Filter by exam status (DRAFT, PUBLISHED, COMPLETED)
 * @param {string} [params.start_date] - Start date for exam date filter (YYYY-MM-DD)
 * @param {string} [params.end_date] - End date for exam date filter (YYYY-MM-DD)
 * @param {number} [params.limit] - Number of records to return (default: 50, max: 100)
 * @param {number} [params.offset] - Number of records to skip (default: 0)
 * @param {Object} [permissions] - Optional permissions object to resolve target names
 * @returns {Promise<Array>} Array of exam assignments
 */
export async function getTeacherExamsAll(params, permissions = null) {
  try {
    const response = await api.get("/exam/teacher/all", { params });
    
    // Extract data from response
    const apiData = response.data?.data || response.data || [];
    
    // Transform each exam to UI format
    const transformedData = Array.isArray(apiData) 
      ? apiData.map(exam => transformExamData(exam, permissions))
      : [];
    
    return transformedData;
  } catch (err) {
    console.error("Error fetching teacher exams:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Fetch details of a specific exam
 * @param {string} examId - The ID of the exam
 * @param {Object} [permissions] - Optional permissions object to resolve target names
 * @returns {Promise<Object>} Exam details
 */
export async function getExamDetail(examId, permissions = null) {
  try {
    const response = await api.get(`/exam/${examId}`);
    
    // Extract data from response
    const apiData = response.data?.data || response.data;
    
    // Transform to UI format (reuse the same transformation logic)
    const transformedData = transformExamData(apiData, permissions);
    
    // Add additional fields expected by the detail view
    transformedData.maxMarks = transformedData.maxValue;
    transformedData.passingMarks = transformedData.passingValue;
    
    return transformedData;
  } catch (err) {
    console.error("Error fetching exam detail:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Create a new exam
 * @param {Object} examData - Exam data object
 * @param {string} examData.exam_type - Type of exam (UNIT_TEST, MID_TERM, FINAL, etc.)
 * @param {string} examData.teacher_id - Teacher ID
 * @param {Array} examData.targets - Array of target objects
 * @param {Array} examData.subjects - Array of subject-date objects
 * @param {Object} examData.grading_config - Grading configuration object
 * @param {boolean} examData.publish - Whether to publish immediately
 * @returns {Promise<Object>} Created exam object
 */
export async function createExam(examData) {
  try {
    const response = await api.post("/exam", examData);
    return response.data;
  } catch (err) {
    console.error("Error creating exam:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Update an existing exam
 * @param {string} examId - The ID of the exam
 * @param {Object} examData - Updated exam data
 * @returns {Promise<Object>} Updated exam object
 */
export async function updateExam(examId, examData) {
  try {
    const response = await api.patch(`/exam/${examId}`, examData);
    return response.data;
  } catch (err) {
    console.error("Error updating exam:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Delete an exam
 * @param {string} examId - The ID of the exam
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteExam(examId) {
  try {
    const response = await api.delete(`/exams/${examId}`);
    return response.data;
  } catch (err) {
    console.error("Error deleting exam:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Publish a draft exam
 * @param {string} examId - The ID of the exam
 * @param {string} teacherId - Teacher ID who is publishing the exam
 * @returns {Promise<Object>} Published exam object
 */
export async function publishExam(examId, teacherId) {
  try {
    const response = await api.post(`/exam/${examId}/publish`, {
      teacher_id: teacherId
    });
    return response.data;
  } catch (err) {
    console.error("Error publishing exam:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Get students and their marks for a specific exam
 * @param {string} examId - The ID of the exam
 * @returns {Promise<Object>} Students list with their details
 */
export async function getExamStudents(examId) {
  try {
    const response = await api.get(`/exam/${examId}/students`);
    return response.data;
  } catch (err) {
    console.error("Error fetching exam students:", err.response?.data);
    throw err.response?.data || err;
  }
}

function parseFilenameFromContentDisposition(header) {
  if (!header || typeof header !== "string") return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim().replace(/^"+|"+$/g, ""));
    } catch {
      return utf8[1].trim().replace(/^"+|"+$/g, "");
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted?.[1]) return quoted[1].trim();
  const loose = /filename=([^;\s]+)/i.exec(header);
  if (loose?.[1]) return loose[1].trim().replace(/^"+|"+$/g, "");
  return null;
}

async function blobResponseToErrorPayload(blob) {
  if (!(blob instanceof Blob)) return blob;
  const text = await blob.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text || "Request failed" };
  }
}

function isGradesUploadFileResponse(contentType, contentDisposition) {
  const ct = (contentType || "").split(";")[0].trim().toLowerCase();
  const cd = (contentDisposition || "").toLowerCase();
  if (cd.includes("attachment")) return true;
  if (
    ct.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
    ct.includes("application/vnd.ms-excel") ||
    ct.includes("spreadsheet") ||
    ct.includes("excel")
  ) {
    return true;
  }
  if (ct.includes("application/octet-stream")) return true;
  return false;
}

/** .xlsx is ZIP (PK); legacy .xls is OLE compound document */
async function blobLooksLikeExcelBinary(blob) {
  if (!(blob instanceof Blob) || blob.size < 4) return false;
  const head = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  const isZip = head[0] === 0x50 && head[1] === 0x4b;
  const isOle =
    head[0] === 0xd0 &&
    head[1] === 0xcf &&
    head[2] === 0x11 &&
    head[3] === 0xe0;
  return isZip || isOle;
}

function defaultGradesUploadFilename(examId, contentDisposition, rawType) {
  const fromHeader = parseFilenameFromContentDisposition(contentDisposition);
  if (fromHeader) return fromHeader;
  const ct = (rawType || "").toLowerCase();
  if (ct.includes("ms-excel") && !ct.includes("spreadsheetml")) {
    return `exam-${examId}-grades-result.xls`;
  }
  return `exam-${examId}-grades-result.xlsx`;
}

/**
 * POST upload: server usually returns an Excel file (even if Content-Type is wrong).
 * Magic-byte detection runs before JSON so mislabeled xlsx still downloads.
 * @returns {Promise<{ kind: 'json', data: object } | { kind: 'file', blob: Blob, filename: string }>}
 */
async function interpretGradesUploadResponse(response, examId) {
  const rawType = response.headers["content-type"] || "";
  const contentType = rawType.split(";")[0].trim().toLowerCase();
  const contentDisposition = response.headers["content-disposition"] || "";
  const blob = response.data;

  if (!(blob instanceof Blob)) {
    return { kind: "json", data: blob ?? {} };
  }

  if (blob.size === 0) {
    return { kind: "json", data: {} };
  }

  if (await blobLooksLikeExcelBinary(blob)) {
    const filename = defaultGradesUploadFilename(examId, contentDisposition, rawType);
    return { kind: "file", blob, filename };
  }

  if (isGradesUploadFileResponse(contentType, contentDisposition)) {
    const filename = defaultGradesUploadFilename(examId, contentDisposition, rawType);
    return { kind: "file", blob, filename };
  }

  if (contentType.includes("application/json")) {
    const data = await blobResponseToErrorPayload(blob);
    return { kind: "json", data };
  }

  const buf = await blob.arrayBuffer();
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
  const trimmed = text.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return { kind: "json", data: JSON.parse(text) };
    } catch {
      /* fall through — save bytes as file */
    }
  }

  const filename = defaultGradesUploadFilename(examId, contentDisposition, rawType);
  return {
    kind: "file",
    blob: new Blob([buf], {
      type:
        rawType.split(";")[0].trim() ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename,
  };
}

/**
 * Download server-generated grades Excel template (GET /exam/:exam_id/grades-template).
 * @param {string} examId
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
export async function downloadExamGradesTemplate(examId) {
  try {
    const response = await api.get(`/exam/${examId}/grades-template`, {
      responseType: "blob",
    });

    const contentType = (response.headers["content-type"] || "").toLowerCase();
    if (contentType.includes("application/json")) {
      const payload = await blobResponseToErrorPayload(response.data);
      throw payload;
    }

    const filename =
      parseFilenameFromContentDisposition(
        response.headers["content-disposition"]
      ) || `exam-${examId}-grades-template.xlsx`;

    return { blob: response.data, filename };
  } catch (err) {
    if (err.response?.data instanceof Blob) {
      const payload = await blobResponseToErrorPayload(err.response.data);
      console.error("Error downloading grades template:", payload);
      throw payload;
    }
    console.error("Error downloading grades template:", err.response?.data || err);
    throw err.response?.data || err;
  }
}

/**
 * Upload filled grades Excel; parsing and persistence are handled by the server
 * (POST /exam/:exam_id/grades-upload).
 * Multipart body: required fields `exam_id`, `file`.
 * Successful responses are normally an Excel file (download in the browser).
 * @param {string} examId
 * @param {File} file
 * @returns {Promise<
 *   | { kind: 'json', data: object }
 *   | { kind: 'file', blob: Blob, filename: string }
 *   | { kind: 'row_errors', blob: Blob, filename: string, errorRowCount?: number }
 * >}
 */
export async function uploadExamGradesTemplate(examId, file) {
  try {
    const formData = new FormData();
    formData.append("exam_id", examId);
    formData.append("file", file);

    const response = await api.post(
      `/exam/${examId}/grades-upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob",
      }
    );
    return interpretGradesUploadResponse(response, examId);
  } catch (err) {
    const res = err.response;
    if (res?.data instanceof Blob) {
      const interpreted = await interpretGradesUploadResponse(res, examId);
      if (interpreted.kind === "file") {
        if (res.status === 422) {
          const raw = res.headers["x-upload-error-rows"];
          const n = raw != null ? Number(raw) : NaN;
          return {
            kind: "row_errors",
            blob: interpreted.blob,
            filename: interpreted.filename,
            errorRowCount: Number.isFinite(n) ? n : undefined,
          };
        }
        return interpreted;
      }
      if (interpreted.kind === "json") {
        throw interpreted.data ?? { message: "Upload failed" };
      }
    }
    console.error("Error uploading grades Excel:", err.response?.data || err);
    throw err.response?.data || err;
  }
}

/**
 * Submit marks for a student in an exam
 * @param {string} examId - The ID of the exam
 * @param {string} studentId - The ID of the student
 * @param {Object} marksData - Marks data for all subjects
 * @returns {Promise<Object>} Submission response
 */
export async function submitExamMarks(examId, studentId, marksData) {
  try {
    const response = await api.post(`/exams/${examId}/students/${studentId}/marks`, marksData);
    return response.data;
  } catch (err) {
    console.error("Error submitting exam marks:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Bulk submit marks for multiple students
 * @param {Array} grades - Array of grade objects
 * @param {string} grades[].exam_id - The ID of the exam
 * @param {string} grades[].exam_subject_id - The ID of the exam subject
 * @param {string} grades[].student_id - The ID of the student
 * @param {string} grades[].grades_obtained - Grades obtained by the student
 * @param {string} [grades[].remarks] - Optional teacher's remarks
 * @param {string} [grades[].graded_by] - Optional teacher ID who graded
 * @returns {Promise<Object>} Bulk submission response
 */
export async function bulkSubmitExamMarks(grades) {
  try {
    const response = await api.post('/exam-grade/bulk', { grades });
    return response.data;
  } catch (err) {
    console.error("Error bulk submitting exam marks:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Fetch all grades for a specific exam
 * @param {string} examId - The ID of the exam
 * @returns {Promise<Object>} Exam grades with all subjects and their student grades
 */
export async function getExamGradesAll(examId) {
  try {
    const response = await api.get('/exam/grades/all', {
      params: { exam_id: examId }
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching exam grades:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Update exam status to completed
 * @param {string} examId - The ID of the exam
 * @returns {Promise<Object>} Updated exam object
 */
export async function completeExam(examId) {
  try {
    const response = await api.post(`/exams/${examId}/complete`);
    return response.data;
  } catch (err) {
    console.error("Error completing exam:", err.response?.data);
    throw err.response?.data || err;
  }
}

// ==================== STUDENT EXAM API ====================

/**
 * Fetch all exams for a specific student with filters
 * @param {Object} params - Query parameters
 * @param {string} params.student_id - Student ID (required)
 * @param {string} [params.status] - Filter by exam status (DRAFT, PUBLISHED, COMPLETED)
 * @param {string} [params.start_date] - Start date for exam date filter (YYYY-MM-DD)
 * @param {string} [params.end_date] - End date for exam date filter (YYYY-MM-DD)
 * @param {number} [params.limit] - Number of records to return (default: 50, max: 100)
 * @param {number} [params.offset] - Number of records to skip (default: 0)
 * @returns {Promise<Object>} Exams response with data array and metadata
 */
export async function getStudentExamsAll(params) {
  try {
    const response = await api.get("/exam/student/all", { params });
    return response.data;
  } catch (err) {
    console.error("Error fetching student exams:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Get student's marks for a specific exam
 * @param {string} examId - The ID of the exam
 * @param {string} studentId - The ID of the student
 * @returns {Promise<Object>} Student's exam marks and details
 */
export async function getStudentExamMarks(examId, studentId) {
  try {
    const response = await api.get(`/exams/${examId}/students/${studentId}/marks`);
    return response.data;
  } catch (err) {
    console.error("Error fetching student exam marks:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Get complete exam details for a specific student including marks and statistics
 * This is a comprehensive endpoint that returns exam info, subjects, marks, and statistics in one call
 * @param {string} examId - The ID of the exam
 * @param {string} studentId - The ID of the student
 * @returns {Promise<Object>} Complete exam details with marks and statistics
 */
export async function getStudentExamDetail(examId, studentId) {
  try {
    const response = await api.get("/exam/student/details", {
      params: {
        exam_id: examId,
        student_id: studentId
      }
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching student exam detail:", err.response?.data);
    throw err.response?.data || err;
  }
}
