import api from "./axios";

function unwrap(payload) {
  if (payload == null) return payload;
  if (
    typeof payload === "object" &&
    "data" in payload &&
    payload.data !== undefined
  ) {
    return payload.data;
  }
  return payload;
}

function asArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.conversations)) return raw.conversations;
  if (Array.isArray(raw?.messages)) return raw.messages;
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
}

/**
 * @returns {Promise<Array>}
 */
export async function listConversations() {
  const res = await api.get("/chat/conversations");
  return asArray(unwrap(res.data));
}

/**
 * @param {string} otherUserId
 * @returns {Promise<object>}
 */
export async function createDirectConversation(otherUserId) {
  const res = await api.post("/chat/conversations", {
    type: "DIRECT",
    other_user_id: otherUserId,
  });
  return unwrap(res.data);
}

/**
 * @param {string} conversationId
 * @returns {Promise<object>}
 */
export async function getConversation(conversationId) {
  const res = await api.get(`/chat/conversations/${conversationId}`);
  return unwrap(res.data);
}

/**
 * @param {string} conversationId
 * @param {{ after?: string, before?: string, limit?: number }} [query]
 * @returns {Promise<Array>}
 */
export async function listMessages(conversationId, query = {}) {
  const res = await api.get(
    `/chat/conversations/${conversationId}/messages`,
    { params: query }
  );
  return asArray(unwrap(res.data));
}

/**
 * @param {string} conversationId
 * @param {string} body
 * @param {Array<{file_url:string,file_name:string,file_type:string,file_size:number}>} [attachments]
 * @returns {Promise<object>}
 */
export async function sendChatMessage(conversationId, body, attachments) {
  const payload = {};
  if (body) payload.body = body;
  if (attachments?.length) payload.attachments = attachments;
  const res = await api.post(
    `/chat/conversations/${conversationId}/messages`,
    payload
  );
  return unwrap(res.data);
}

/**
 * Get a signed URL for uploading a chat attachment.
 * @param {string} fileName
 * @param {string} mimeType
 * @param {string} [campusId]
 * @returns {Promise<{upload_url:string, file_url:string}>}
 */
export async function getChatAttachmentUploadUrl(fileName, mimeType, campusId) {
  const payload = { file_name: fileName, mime_type: mimeType };
  if (campusId) payload.campus_id = campusId;
  const res = await api.post("/chat/attachments/upload-url", payload);
  const data = unwrap(res.data);
  return {
    upload_url: data?.upload_url ?? data?.uploadUrl ?? data?.signed_url ?? data?.signedUrl ?? "",
    file_url: data?.public_url ?? data?.file_url ?? data?.fileUrl ?? data?.url ?? "",
  };
}

/**
 * @param {string} conversationId
 * @returns {Promise<object>}
 */
export async function markConversationRead(conversationId) {
  const res = await api.post(`/chat/conversations/${conversationId}/read`);
  return unwrap(res.data);
}

export function pickConversationId(obj) {
  if (!obj || typeof obj !== "object") return "";
  return String(
    obj.id ?? obj.conversation_id ?? obj.conversationId ?? ""
  ).trim();
}

/**
 * Staff: send one chat body to many users (direct-style delivery per product).
 * @param {{ recipient_user_ids: string[], body: string }} payload
 * @returns {Promise<unknown>}
 */
export async function broadcastChatMessage(payload) {
  const res = await api.post("/chat/broadcast", {
    recipient_user_ids: payload.recipient_user_ids,
    body: payload.body,
  });
  return unwrap(res.data);
}
