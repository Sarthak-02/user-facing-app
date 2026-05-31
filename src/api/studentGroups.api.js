import api from "./axios";

export async function listStudentGroups(campus_id, params = {}) {
  try {
    const response = await api.get("/student-groups", { params: { campus_id, ...params } });
    return response.data?.data || response.data || [];
  } catch (err) {
    console.error("Error listing student groups:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function getStudentGroup(group_id) {
  try {
    const response = await api.get(`/student-groups/${group_id}`);
    return response.data?.data || response.data;
  } catch (err) {
    console.error("Error fetching student group:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function createStudentGroup(data) {
  try {
    const response = await api.post("/student-groups", data);
    return response.data?.data || response.data;
  } catch (err) {
    console.error("Error creating student group:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function updateStudentGroup(group_id, data) {
  try {
    const response = await api.patch(`/student-groups/${group_id}`, data);
    return response.data?.data || response.data;
  } catch (err) {
    console.error("Error updating student group:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function deleteStudentGroup(group_id) {
  try {
    const response = await api.delete(`/student-groups/${group_id}`);
    return response.data;
  } catch (err) {
    console.error("Error deleting student group:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function addGroupMembers(group_id, student_ids) {
  try {
    const response = await api.post(`/student-groups/${group_id}/members`, { student_ids });
    return response.data;
  } catch (err) {
    console.error("Error adding group members:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function removeGroupMembers(group_id, student_ids) {
  try {
    const response = await api.delete(`/student-groups/${group_id}/members`, { data: { student_ids } });
    return response.data;
  } catch (err) {
    console.error("Error removing group members:", err.response?.data);
    throw err.response?.data || err;
  }
}
