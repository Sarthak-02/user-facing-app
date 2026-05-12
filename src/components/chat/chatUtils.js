/** @param {string | undefined} iso */
export function messageTimeLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  return (
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

/** @param {string | undefined} iso */
export function relativeTimeLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** @param {string | undefined} iso */
export function messageDateLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** @param {object} m */
export function messageCreatedAt(m) {
  return m?.createdAt || m?.created_at || m?.sentAt || m?.sent_at || "";
}

/** @param {object} m */
export function messageBody(m) {
  const t = m?.body ?? m?.text ?? m?.content ?? m?.message;
  return typeof t === "string" ? t : "";
}

/** @param {object} m */
export function messageId(m) {
  return String(m?.id ?? m?.message_id ?? m?._id ?? "");
}

/** @param {object} m */
export function messageSenderId(m) {
  const raw =
    m?.senderId ??
    m?.sender_id ??
    m?.from_user_id ??
    m?.author_id ??
    m?.user_id ??
    m?.sender_user_id ??
    m?.createdByUserId ??
    m?.created_by_user_id ??
    m?.sender?.id ??
    m?.sender?.user_id ??
    m?.sender?.userId ??
    m?.user?.id ??
    m?.user?.user_id ??
    m?.created_by?.id ??
    m?.created_by;
  if (raw == null || raw === "") return "";
  return String(raw).trim();
}

/** @param {string} a @param {string} b */
function userIdsEqual(a, b) {
  const sa = String(a ?? "").trim();
  const sb = String(b ?? "").trim();
  if (!sa || !sb) return false;
  if (sa === sb) return true;
  const na = Number(sa);
  const nb = Number(sb);
  if (
    Number.isFinite(na) &&
    Number.isFinite(nb) &&
    String(na) === sa &&
    String(nb) === sb
  ) {
    return na === nb;
  }
  return false;
}

/**
 * @param {object} m
 * @param {string} currentUserId
 */
export function isMessageFromCurrentUser(m, currentUserId) {
  if (m?.fromMe === true || m?.is_mine === true || m?.isMine === true) return true;
  if (m?.fromMe === false || m?.is_mine === false || m?.isMine === false)
    return false;
  const sid = messageSenderId(m);
  return userIdsEqual(sid, currentUserId);
}

/**
 * @param {object} c
 * @param {string} currentUserId
 */
export function conversationTitle(c, currentUserId) {
  if (!c || typeof c !== "object") return "Chat";
  const t = c.title || c.name || c.display_name;
  if (t) return String(t);
  if (c.receiver?.name) return String(c.receiver.name);
  const peer =
    c.other_user ||
    c.peer ||
    c.counterpart ||
    (Array.isArray(c.participants)
      ? c.participants.find(
          (p) =>
            String(p?.user_id ?? p?.id ?? p?.userId ?? "") !== currentUserId
        )
      : null);
  const peerName =
    peer?.name ||
    peer?.full_name ||
    peer?.display_name ||
    [peer?.first_name, peer?.last_name].filter(Boolean).join(" ");
  if (peerName) return String(peerName);
  return "Direct message";
}

/** @param {object} c */
export function conversationLastMessage(c) {
  const lm = c?.last_message;
  if (!lm) return "";
  if (typeof lm.body === "string" && lm.body) return lm.body;
  const atts = lm?.attachments ?? lm?.files ?? lm?.media;
  if (Array.isArray(atts) && atts.length > 0) {
    const isImage = atts[0]?.file_type?.startsWith("image/");
    return isImage ? "📷 Photo" : "📎 Attachment";
  }
  return "";
}

/** @param {object} c */
export function conversationUnreadCount(c) {
  const n = c?.unread_count;
  return typeof n === "number" && n > 0 ? n : 0;
}

/**
 * @param {object} c
 */
export function conversationUpdatedAt(c) {
  return (
    c?.updatedAt ||
    c?.updated_at ||
    c?.lastMessageAt ||
    c?.last_message_at ||
    c?.lastActivityAt ||
    ""
  );
}

/** @param {object} m */
export function messageAttachments(m) {
  const raw = m?.attachments ?? m?.files ?? m?.media;
  return Array.isArray(raw) ? raw : [];
}

/**
 * @param {object} c
 */
export function conversationId(c) {
  return String(
    c?.id ?? c?.conversation_id ?? c?.conversationId ?? ""
  ).trim();
}
