import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, SendHorizontal, ChevronsDown, MessageSquare } from "lucide-react";
import { Button } from "../../ui-components";
import Loader from "../../ui-components/Loader";
import { useAuth } from "../../store/auth.store";
import {
  listMessages,
  sendChatMessage,
  markConversationRead,
  getConversation,
} from "../../api/chat.api";
import {
  conversationTitle,
  isMessageFromCurrentUser,
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
 * @param {{ conversationId: string, backTo: string }} props
 */
export default function ChatThread({ conversationId, backTo }) {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const currentUserId = String(auth?.userId ?? "").trim();

  const [title, setTitle] = useState(() => t("chat.defaultThreadTitle"));
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const bottomRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const pollAfterRef = useRef("");
  const textareaRef = useRef(null);
  const atBottomRef = useRef(true);
  const isInitialScrollRef = useRef(true);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const area = scrollAreaRef.current;
    if (area) {
      area.scrollTo({ top: area.scrollHeight, behavior });
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior });
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
  }, [conversationId, currentUserId, t]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!conversationId || loading) return;
    markConversationRead(conversationId).catch(() => {});
  }, [conversationId, loading]);

  useEffect(() => {
    if (!conversationId || loading) return;

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
  }, [conversationId, loading]);

  // Auto-scroll only when near bottom; instant on initial load
  useEffect(() => {
    if (atBottomRef.current) {
      const behavior = isInitialScrollRef.current ? "instant" : "smooth";
      isInitialScrollRef.current = false;
      scrollToBottom(behavior);
    }
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [draft]);

  const onSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !conversationId || sending) return;
    setSending(true);
    setError(null);
    try {
      const created = await sendChatMessage(conversationId, text);
      setDraft("");
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

  // Insert date separators between messages from different days
  const rowsWithSeparators = useMemo(() => {
    const result = [];
    let lastLabel = null;
    for (const m of messages) {
      const label = messageDateLabel(messageCreatedAt(m));
      if (label && label !== lastLabel) {
        result.push({ _isSeparator: true, label });
        lastLabel = label;
      }
      result.push(m);
    }
    return result;
  }, [messages]);

  if (!conversationId) {
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
          <div className="mx-auto max-w-3xl space-y-1">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader />
              </div>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                <p className="text-xs text-red-500">{error}</p>
              </div>
            ) : null}

            {!loading && messages.length === 0 && !error ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare size={36} className="mb-3 text-gray-300" />
                <p className="text-sm text-gray-400">
                  {t("chat.noMessages")}
                </p>
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
                const m = item;
                const sentByMe = isMessageFromCurrentUser(m, currentUserId);
                const body = messageBody(m);
                const when = messageTimeLabel(messageCreatedAt(m));
                return (
                  <div
                    key={messageId(m) || `${when}-${body.slice(0, 12)}-${idx}`}
                    className={`flex w-full py-0.5 ${sentByMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${
                        sentByMe
                          ? "rounded-br-sm bg-primary-600 text-white"
                          : "rounded-bl-sm border border-gray-200 bg-white text-gray-800 shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words leading-relaxed">
                        {body}
                      </p>
                      <p
                        className={`mt-1 text-[10px] ${
                          sentByMe ? "text-white/60" : "text-gray-400"
                        }`}
                      >
                        {when}
                      </p>
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

      {/* Footer */}
      <footer className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 pb-24 md:pb-3">
        <form onSubmit={onSend} className="mx-auto flex max-w-3xl gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("chat.writeMessage")}
            title={t("chatUi.composerHint")}
            rows={1}
            className="min-h-[40px] flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            disabled={sending || loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={sending || loading || !draft.trim()}
            className="h-10 shrink-0 self-end px-3"
          >
            {sending ? (
              <span className="text-xs">…</span>
            ) : (
              <SendHorizontal size={16} />
            )}
          </Button>
        </form>
      </footer>
    </div>
  );
}
