import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, SendHorizontal, ChevronsDown, MessageSquare, Paperclip, X, FileText, Loader2 } from "lucide-react";
import { Button } from "../../ui-components";
import Loader from "../../ui-components/Loader";
import { useAuth } from "../../store/auth.store";
import {
  listMessages,
  sendChatMessage,
  markConversationRead,
  getConversation,
  createDirectConversation,
  pickConversationId,
  getChatAttachmentUploadUrl,
} from "../../api/chat.api";
import {
  conversationTitle,
  isMessageFromCurrentUser,
  messageAttachments,
  messageBody,
  messageCreatedAt,
  messageDateLabel,
  messageId,
  messageTimeLabel,
} from "./chatUtils";
import { useTranslation } from "react-i18next";

const POLL_MS = 4000;

function sortChrono(msgs) {
  return [...msgs].sort(
    (a, b) =>
      new Date(messageCreatedAt(a)).getTime() -
      new Date(messageCreatedAt(b)).getTime()
  );
}

function mergeMessages(prev, incoming) {
  const map = new Map();
  for (const m of prev) {
    const id = messageId(m);
    if (id) map.set(id, m);
    else map.set(`${messageCreatedAt(m)}-${messageBody(m)}`, m);
  }
  for (const m of incoming) {
    const id = messageId(m);
    if (id) {
      if (!map.has(id)) map.set(id, m);
    } else {
      const k = `${messageCreatedAt(m)}-${messageBody(m)}`;
      if (!map.has(k)) map.set(k, m);
    }
  }
  return sortChrono([...map.values()]);
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function latestCreatedAtIso(msgs) {
  let max = "";
  for (const m of msgs) {
    const iso = messageCreatedAt(m);
    if (!iso) continue;
    if (!max || new Date(iso) > new Date(max)) max = iso;
  }
  return max;
}

/**
 * @param {{
 *   conversationId?: string,
 *   draftOtherUserId?: string,
 *   draftDisplayName?: string,
 *   backTo: string,
 * }} props
 */
export default function ChatThread({
  conversationId,
  draftOtherUserId = "",
  draftDisplayName = "",
  backTo,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const currentUserId = String(auth?.userId ?? "").trim();
  const draftPeerId = String(draftOtherUserId || "").trim();
  const isDraft = Boolean(draftPeerId);

  const [title, setTitle] = useState(() => t("chat.defaultThreadTitle"));
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const bottomRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const pollAfterRef = useRef("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const atBottomRef = useRef(true);
  const isInitialScrollRef = useRef(true);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const area = scrollAreaRef.current;
    if (area) {
      area.scrollTo({
        top: area.scrollHeight,
        behavior: behavior === "instant" ? "auto" : behavior,
      });
      return;
    }
    bottomRef.current?.scrollIntoView({
      behavior: behavior === "instant" ? "auto" : behavior,
    });
  }, []);

  const handleScroll = useCallback(() => {
    const area = scrollAreaRef.current;
    if (!area) return;
    const nearBottom =
      area.scrollHeight - area.scrollTop - area.clientHeight < 100;
    atBottomRef.current = nearBottom;
    setShowScrollBtn(!nearBottom);
  }, []);

  const loadInitial = useCallback(async () => {
    if (isDraft) {
      setTitle(
        String(draftDisplayName || "").trim() || t("chat.defaultThreadTitle"),
      );
      setMessages([]);
      setLoading(false);
      setError(null);
      pollAfterRef.current = "";
      isInitialScrollRef.current = true;
      atBottomRef.current = true;
      return;
    }
    if (!conversationId) return;
    setTitle(t("chat.defaultThreadTitle"));
    setLoading(true);
    setError(null);
    isInitialScrollRef.current = true;
    try {
      const [conv, msgs] = await Promise.all([
        getConversation(conversationId).catch(() => null),
        listMessages(conversationId, { limit: 80 }),
      ]);
      if (conv) {
        setTitle(conversationTitle(conv, currentUserId));
      }
      const sorted = sortChrono(msgs);
      setMessages(sorted);
      pollAfterRef.current = latestCreatedAtIso(sorted);
      atBottomRef.current = true;
      await markConversationRead(conversationId).catch(() => {});
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || t("chat.couldNotLoadMessages");
      setError(typeof msg === "string" ? msg : t("chat.couldNotLoadMessages"));
    } finally {
      setLoading(false);
    }
  }, [isDraft, draftDisplayName, conversationId, currentUserId, t]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (isDraft || !conversationId || loading) return;
    markConversationRead(conversationId).catch(() => {});
  }, [isDraft, conversationId, loading]);

  useEffect(() => {
    if (isDraft || !conversationId || loading) return;

    let cancelled = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const after = pollAfterRef.current;
      try {
        const next = after
          ? await listMessages(conversationId, { after, limit: 200 })
          : await listMessages(conversationId, { limit: 80 });
        if (cancelled || !next.length) return;
        setMessages((prev) => {
          const merged = mergeMessages(prev, next);
          const newest = latestCreatedAtIso(merged);
          if (newest) pollAfterRef.current = newest;
          return merged;
        });
      } catch {
        /* ignore transient poll errors */
      }
    };

    const id = window.setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [isDraft, conversationId, loading]);

  // Auto-scroll only when near bottom. Skip while loading so we don't scroll the
  // loader, consume "initial" scroll, then fail to jump once messages render (tall thread).
  useEffect(() => {
    if (loading) return;
    if (atBottomRef.current) {
      const behavior = isInitialScrollRef.current ? "instant" : "smooth";
      isInitialScrollRef.current = false;
      const run = () => scrollToBottom(behavior);
      // After paint so scrollHeight reflects the full thread (fonts/layout).
      requestAnimationFrame(() => requestAnimationFrame(run));
    }
  }, [messages, loading, scrollToBottom]);

  // Auto-resize textarea (capped so the composer does not dominate the screen on mobile)
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const maxPx = 120;
    ta.style.height = `${Math.min(ta.scrollHeight, maxPx)}px`;
  }, [draft]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      const results = await Promise.allSettled(
        files.map(async (file) => {
          const { upload_url, file_url } = await getChatAttachmentUploadUrl(
            file.name,
            file.type
          );
          await fetch(upload_url, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });
          return {
            file_url,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
          };
        })
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
      const failed = results.filter((r) => r.status === "rejected");
      if (succeeded.length) setPendingAttachments((prev) => [...prev, ...succeeded]);
      if (failed.length) {
        const msg = failed[0].reason?.message || "Some files failed to upload";
        setError(typeof msg === "string" ? msg : "Some files failed to upload");
      }
    } catch (err) {
      const msg = err?.message || "Failed to upload file";
      setError(typeof msg === "string" ? msg : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const removePendingAttachment = (index) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if ((!text && !pendingAttachments.length) || sending || uploading) return;

    if (isDraft) {
      setSending(true);
      setError(null);
      try {
        const createdConv = await createDirectConversation(draftPeerId);
        const cid = pickConversationId(createdConv);
        if (!cid) {
          setError(t("chat.couldNotStartConversation"));
          return;
        }
        await sendChatMessage(cid, text, pendingAttachments.length ? pendingAttachments : undefined);
        setDraft("");
        setPendingAttachments([]);
        navigate(`${backTo}/${cid}`, { replace: true });
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          t("chat.couldNotStartConversation2");
        setError(typeof msg === "string" ? msg : t("chat.couldNotStartConversation2"));
      } finally {
        setSending(false);
      }
      return;
    }

    if (!conversationId) return;
    setSending(true);
    setError(null);
    try {
      const created = await sendChatMessage(conversationId, text, pendingAttachments.length ? pendingAttachments : undefined);
      setDraft("");
      setPendingAttachments([]);
      atBottomRef.current = true;
      if (created && typeof created === "object") {
        const outgoing = isMessageFromCurrentUser(created, currentUserId)
          ? created
          : { ...created, fromMe: true };
        setMessages((prev) => mergeMessages(prev, [outgoing]));
        const iso = messageCreatedAt(created);
        if (iso && new Date(iso) >= new Date(pollAfterRef.current || 0)) {
          pollAfterRef.current = iso;
        }
      } else {
        const msgs = await listMessages(conversationId, { limit: 80 });
        const sorted = sortChrono(msgs);
        setMessages(sorted);
        pollAfterRef.current = latestCreatedAtIso(sorted);
      }
      await markConversationRead(conversationId).catch(() => {});
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || t("chat.failedToSend");
      setError(typeof msg === "string" ? msg : t("chat.failedToSend"));
    } finally {
      setSending(false);
    }
  };

  // Insert date separators and compute per-message grouping metadata
  const rowsWithSeparators = useMemo(() => {
    const result = [];
    let lastLabel = null;
    const GROUP_MS = 5 * 60 * 1000;

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const label = messageDateLabel(messageCreatedAt(m));
      if (label && label !== lastLabel) {
        result.push({ _isSeparator: true, label });
        lastLabel = label;
      }

      const sentByMe = isMessageFromCurrentUser(m, currentUserId);
      const prev = messages[i - 1] ?? null;
      const next = messages[i + 1] ?? null;
      const prevLabel = prev ? messageDateLabel(messageCreatedAt(prev)) : null;
      const nextLabel = next ? messageDateLabel(messageCreatedAt(next)) : null;

      const groupedWithPrev =
        prev &&
        prevLabel === label &&
        isMessageFromCurrentUser(prev, currentUserId) === sentByMe &&
        new Date(messageCreatedAt(m)) - new Date(messageCreatedAt(prev)) < GROUP_MS;

      const groupedWithNext =
        next &&
        nextLabel === label &&
        isMessageFromCurrentUser(next, currentUserId) === sentByMe &&
        new Date(messageCreatedAt(next)) - new Date(messageCreatedAt(m)) < GROUP_MS;

      result.push({
        _msg: m,
        _sentByMe: sentByMe,
        _isGroupStart: !groupedWithPrev,
        _isGroupEnd: !groupedWithNext,
      });
    }
    return result;
  }, [messages, currentUserId]);

  if (!conversationId && !isDraft) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <Link
            to={backTo}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
            aria-label={t("chat.backToConversations")}
          >
            <ChevronLeft size={20} />
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800">
            {title}
          </h1>
        </div>
      </header>

      {/* Scroll area */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-gray-50">
        <div
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto overflow-x-hidden px-4 py-4"
        >
          <div className="mx-auto max-w-3xl">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader />
              </div>
            ) : null}

            {error ? (
              <div className="mb-2 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">
                <p className="flex-1 text-xs text-red-500">{error}</p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="shrink-0 text-red-400 hover:text-red-600"
                >
                  <X size={13} />
                </button>
              </div>
            ) : null}

            {!loading && messages.length === 0 && !error ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare size={36} className="mb-3 text-gray-300" />
                <p className="text-sm text-gray-400">{t("chat.noMessages")}</p>
              </div>
            ) : null}

            {!loading &&
              rowsWithSeparators.map((item, idx) => {
                if (item._isSeparator) {
                  return (
                    <div
                      key={`sep-${item.label}`}
                      className="flex items-center gap-3 py-3"
                    >
                      <div className="flex-1 border-t border-gray-200" />
                      <span className="shrink-0 text-[11px] text-gray-400">
                        {item.label}
                      </span>
                      <div className="flex-1 border-t border-gray-200" />
                    </div>
                  );
                }

                const { _msg: m, _sentByMe: sentByMe, _isGroupStart, _isGroupEnd } = item;
                const body = messageBody(m);
                const when = messageTimeLabel(messageCreatedAt(m));
                const attachments = messageAttachments(m);

                return (
                  <div
                    key={messageId(m) || `${when}-${body.slice(0, 12)}-${idx}`}
                    className={`flex w-full ${_isGroupStart ? "mt-2" : "mt-0.5"} ${sentByMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] px-3.5 py-2 text-sm transition-shadow ${
                        _isGroupEnd
                          ? sentByMe
                            ? "rounded-2xl rounded-br-sm"
                            : "rounded-2xl rounded-bl-sm"
                          : "rounded-2xl"
                      } ${
                        sentByMe
                          ? "bg-primary-600 text-white"
                          : "border border-gray-200 bg-white text-gray-800 shadow-sm"
                      }`}
                    >
                      {body ? (
                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                          {body}
                        </p>
                      ) : null}

                      {attachments.length > 0 && (
                        <div className={`flex flex-col gap-1.5 ${body ? "mt-2" : ""}`}>
                          {attachments.map((att, ai) =>
                            att.file_type?.startsWith("image/") ? (
                              <a
                                key={ai}
                                href={att.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={att.file_url}
                                  alt={att.file_name}
                                  className="max-h-48 max-w-full rounded-xl object-contain"
                                />
                              </a>
                            ) : (
                              <a
                                key={ai}
                                href={att.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${
                                  sentByMe
                                    ? "bg-white/20 text-white hover:bg-white/30"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                <FileText size={13} className="shrink-0" />
                                <span className="min-w-0 flex-1 truncate">{att.file_name}</span>
                                {att.file_size ? (
                                  <span className="shrink-0 opacity-60">
                                    {formatFileSize(att.file_size)}
                                  </span>
                                ) : null}
                              </a>
                            )
                          )}
                        </div>
                      )}

                      {_isGroupEnd && (
                        <p
                          className={`mt-1 text-[10px] ${
                            sentByMe ? "text-white/60" : "text-gray-400"
                          }`}
                        >
                          {when}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            <div ref={bottomRef} />
          </div>
        </div>

        {showScrollBtn && (
          <button
            type="button"
            onClick={() => {
              atBottomRef.current = true;
              setShowScrollBtn(false);
              scrollToBottom();
            }}
            className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow-md hover:shadow-lg"
            aria-label={t("chat.scrollToLatest")}
          >
            <ChevronsDown size={16} />
          </button>
        )}
      </div>

      {/* Footer — main layout already reserves bottom nav; avoid stacking extra pb here */}
      <footer className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 md:px-3 md:py-3">
        <div className="mx-auto max-w-3xl">
          {/* Pending attachment chips */}
          {pendingAttachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {pendingAttachments.map((att, i) =>
                att.file_type?.startsWith("image/") ? (
                  <div key={i} className="relative inline-flex items-end">
                    <img
                      src={att.file_url}
                      alt={att.file_name}
                      className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePendingAttachment(i)}
                      className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-600 text-white hover:bg-gray-800"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <div
                    key={i}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                  >
                    <FileText size={12} className="shrink-0 text-gray-400" />
                    <span className="max-w-[100px] truncate">{att.file_name}</span>
                    {att.file_size ? (
                      <span className="shrink-0 text-gray-400">{formatFileSize(att.file_size)}</span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removePendingAttachment(i)}
                      className="ml-0.5 text-gray-400 hover:text-gray-700"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          <form onSubmit={onSend} className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              disabled={uploading || sending || (!isDraft && loading)}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40"
              aria-label="Attach file"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
            </button>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("chat.writeMessage")}
              title={t("chatUi.composerHint")}
              rows={1}
              className="max-h-[120px] min-h-[38px] flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm leading-snug text-gray-800 outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              disabled={sending || (!isDraft && loading)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={sending || uploading || (!isDraft && loading) || (!draft.trim() && !pendingAttachments.length)}
              className="h-10 shrink-0 px-3"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <SendHorizontal size={16} />
              )}
            </Button>
          </form>
        </div>
      </footer>
    </div>
  );
}
