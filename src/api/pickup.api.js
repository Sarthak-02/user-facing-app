import api from "./axios";

// ─── Authorized Pickup Persons ────────────────────────────────────────────────

export async function listAuthorizedPersons(student_id, include_inactive = false) {
  try {
    const response = await api.get("/pickup/authorized-persons", {
      params: { student_id, include_inactive },
    });
    return response.data?.data ?? response.data ?? [];
  } catch (err) {
    console.error("Error fetching authorized persons:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function addAuthorizedPerson(data) {
  try {
    const response = await api.post("/pickup/authorized-persons", data);
    return response.data?.data ?? response.data;
  } catch (err) {
    console.error("Error adding authorized person:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function updateAuthorizedPerson(id, data) {
  try {
    const response = await api.patch(`/pickup/authorized-persons/${id}`, data);
    return response.data?.data ?? response.data;
  } catch (err) {
    console.error("Error updating authorized person:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function deleteAuthorizedPerson(id) {
  try {
    const response = await api.delete(`/pickup/authorized-persons/${id}`);
    return response.data?.data ?? response.data;
  } catch (err) {
    console.error("Error deleting authorized person:", err.response?.data);
    throw err.response?.data || err;
  }
}

// ─── Pickup Requests (one-time) ───────────────────────────────────────────────

export async function createPickupRequest(data) {
  try {
    const response = await api.post("/pickup/requests", data);
    return response.data?.data ?? response.data;
  } catch (err) {
    console.error("Error creating pickup request:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function listPickupRequests(student_id, date, status) {
  try {
    const params = { student_id };
    if (date) params.date = date;
    if (status) params.status = status;
    const response = await api.get("/pickup/requests", { params });
    return response.data?.data ?? response.data ?? [];
  } catch (err) {
    console.error("Error fetching pickup requests:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function listPendingPickupRequests(campus_id, date) {
  try {
    const params = { campus_id };
    if (date) params.date = date;
    const response = await api.get("/pickup/requests/pending", { params });
    return response.data?.data ?? response.data ?? [];
  } catch (err) {
    console.error("Error fetching pending requests:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function approvePickupRequest(id, approved_by) {
  try {
    const response = await api.patch(`/pickup/requests/${id}/approve`, { approved_by });
    return response.data?.data ?? response.data;
  } catch (err) {
    console.error("Error approving request:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function rejectPickupRequest(id, rejected_by, rejection_note) {
  try {
    const payload = { rejected_by };
    if (rejection_note) payload.rejection_note = rejection_note;
    const response = await api.patch(`/pickup/requests/${id}/reject`, payload);
    return response.data?.data ?? response.data;
  } catch (err) {
    console.error("Error rejecting request:", err.response?.data);
    throw err.response?.data || err;
  }
}

// ─── Pickup Logs ──────────────────────────────────────────────────────────────

export async function confirmPickup(data) {
  try {
    const response = await api.post("/pickup/logs", data);
    return response.data?.data ?? response.data;
  } catch (err) {
    console.error("Error confirming pickup:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function listPickupLogs(student_id, limit = 20, offset = 0) {
  try {
    const response = await api.get("/pickup/logs", {
      params: { student_id, limit, offset },
    });
    return response.data?.data ?? response.data ?? [];
  } catch (err) {
    console.error("Error fetching pickup logs:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function listTodayPickups(campus_id, date) {
  try {
    const params = { campus_id };
    if (date) params.date = date;
    const response = await api.get("/pickup/logs/today", { params });
    return response.data?.data ?? response.data ?? [];
  } catch (err) {
    console.error("Error fetching today's pickups:", err.response?.data);
    throw err.response?.data || err;
  }
}

// ─── Photo Upload ─────────────────────────────────────────────────────────────

/**
 * Get a GCS signed URL for direct photo upload.
 * Returns { uploadUrl, objectPath }.
 */
export async function getPickupPhotoUploadUrl(entity, entity_id, mime_type) {
  try {
    const response = await api.post("/pickup/photo/upload-url", {
      entity,
      entity_id,
      mime_type,
    });
    return response.data?.data ?? response.data;
  } catch (err) {
    console.error("Error getting photo upload URL:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Trigger backend compression + CDN processing after the file has been
 * uploaded to GCS.  Returns the final photo URL to store.
 */
export async function processPickupPhoto(object_path, entity, entity_id) {
  try {
    const response = await api.post("/pickup/photo/process", {
      object_path,
      entity,
      entity_id,
    });
    return response.data?.data ?? response.data;
    // Expected shape: { photo_url: string }
  } catch (err) {
    console.error("Error processing pickup photo:", err.response?.data);
    throw err.response?.data || err;
  }
}

/**
 * Full photo upload pipeline:
 *   1. Get signed GCS URL from backend.
 *   2. PUT the blob directly to GCS (bypasses our API, no auth header needed).
 *   3. Call /process to get the final CDN URL.
 *
 * @param {Blob}   blob       Compressed image blob.
 * @param {string} entity     "authorized_person" | "pickup_log"
 * @param {string} entity_id  Record ID or a temp UUID for new records.
 * @returns {Promise<string>} The final photo URL ready to store.
 */
export async function uploadPickupPhoto(blob, entity, entity_id) {
  const mime = blob.type || "image/jpeg";

  const { uploadUrl, objectPath } = await getPickupPhotoUploadUrl(
    entity,
    entity_id,
    mime,
  );

  // Upload directly to GCS — no Authorization header (signed URL handles auth)
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": mime },
  });
  if (!uploadRes.ok) {
    throw new Error(`GCS upload failed: ${uploadRes.status}`);
  }

  const result = await processPickupPhoto(objectPath, entity, entity_id);
  return result?.photo_url || result?.url || result;
}
