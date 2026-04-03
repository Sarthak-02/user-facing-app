/** @param {string | undefined} iso */
export function messageTimeLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

/**
 * @param {object} c
 */
export function conversationId(c) {
  return String(
    c?.id ?? c?.conversation_id ?? c?.conversationId ?? ""
  ).trim();
}
